/* Synclothe Studio | MVP universitario sin backend. Datos e imágenes: IndexedDB local. */
(() => {
  'use strict';
  if (document.body.dataset.page !== 'lealtad') return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const SHORT_DAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  const GROUPS = ['Superior', 'Inferior', 'Calzado', 'Accesorio', 'Abrigo'];
  const DB_NAME = 'SynclotheStudio';
  const STORE_NAMES = ['garments', 'outfits', 'wears', 'meta'];
  const state = {
    db: null, garments: [], outfits: [], wears: [], schedule: {}, profile: null,
    editingId: null, selectedDay: (new Date().getDay() + 6) % 7,
    objectURLs: new Map(), previewURL: null, onboardingSkipped: false
  };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let noticeTimeout;
  function notice(msg) {
    const n = $('#toast'); if (!n) return;
    n.textContent = msg; n.classList.add('show');
    clearTimeout(noticeTimeout); noticeTimeout = setTimeout(() => n.classList.remove('show'), 4000);
  }
  function escapeHTML(text) {
    return String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
  function id() { return (self.crypto?.randomUUID?.() || `syn-${Date.now()}-${Math.random().toString(36).slice(2)}`); }
  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('El navegador no ofrece IndexedDB'));
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const name of STORE_NAMES) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || Error('No se pudo abrir la base de datos'));
      request.onblocked = () => reject(Error('Cierra las otras pestañas de Synclothe y vuelve a intentarlo'));
    });
  }
  function transact(store, type, data) {
    return new Promise((resolve, reject) => {
      const transaction = state.db.transaction(store, type === 'read' ? 'readonly' : 'readwrite');
      const objectStore = transaction.objectStore(store);
      let req;
      if (type === 'read') req = objectStore.get(data);
      else if (type === 'list') req = objectStore.getAll();
      else if (type === 'put') req = objectStore.put(data);
      else if (type === 'delete') req = objectStore.delete(data);
      else if (type === 'clear') req = objectStore.clear();
      let result;
      req.onsuccess = () => { result = req.result; };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error || Error('No se pudo guardar'));
      transaction.onabort = () => reject(transaction.error || Error('La operación se canceló'));
    });
  }
  // 'list' is readonly too; no mutable transaction for getAll.
  function dbOp(store, method, data) {
    if (method !== 'list') return transact(store, method, data);
    return new Promise((resolve, reject) => {
      const tx = state.db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      let value;
      req.onsuccess = () => { value = req.result; };
      tx.oncomplete = () => resolve(value || []);
      tx.onerror = () => reject(tx.error || Error('No se pudieron leer los datos'));
    });
  }
  function firstName(name) { return String(name || 'tu').trim().split(/\s+/)[0].slice(0,32); }
  function getGarment(gid) { return state.garments.find(g => g.id === gid); }
  function getOutfit(oid) { return state.outfits.find(o => o.id === oid); }
  function garmentURL(g) {
    if (!g || !g.image) return '';
    const saved = state.objectURLs.get(g.id);
    if (saved && saved.updatedAt === g.imageUpdatedAt) return saved.url;
    if (saved) URL.revokeObjectURL(saved.url);
    const url = URL.createObjectURL(g.image);
    state.objectURLs.set(g.id, { url, updatedAt: g.imageUpdatedAt });
    return url;
  }
  function cleanupURLs() {
    for (const saved of state.objectURLs.values()) URL.revokeObjectURL(saved.url);
    state.objectURLs.clear();
    if (state.previewURL) URL.revokeObjectURL(state.previewURL);
  }
  addEventListener('beforeunload', cleanupURLs);
  function dateForDay(dayIndex) {
    const date = new Date(); date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + dayIndex);
    return date;
  }
  function localDateKey(date) {
    const z = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${z(date.getMonth() + 1)}-${z(date.getDate())}`;
  }
  function countLabel(count, singular, plural) { return count + ' ' + (count === 1 ? singular : plural); }
  async function reloadData() {
    const [garments, outfits, wears, profile, agenda] = await Promise.all([
      dbOp('garments', 'list'), dbOp('outfits', 'list'), dbOp('wears', 'list'),
      dbOp('meta', 'read', 'profile'), dbOp('meta', 'read', 'schedule')
    ]);
    state.garments = garments.sort((a,b) => b.createdAt - a.createdAt);
    state.outfits = outfits.sort((a,b) => b.createdAt - a.createdAt);
    state.wears = wears;
    state.profile = profile || null;
    state.schedule = agenda?.days || {};
  }
  async function saveProfile(profile) {
    await dbOp('meta', 'put', { ...profile, id:'profile', onboardingDone: true });
    await reloadData(); renderAll();
  }
  async function saveSchedule() { await dbOp('meta', 'put', { id:'schedule', days: { ...state.schedule } }); }
  function updatedUI() { renderSummary(); renderGarments(); renderBuilderSelections(); renderOutfits(); renderPlanner(); renderStats(); renderProfile(); }
  function renderAll() { updatedUI(); }
  function renderSummary() {
    const assigned = Object.values(state.schedule).filter(k => !!getOutfit(k)).length;
    const metrics = { metricGarments: state.garments.length, metricOutfits: state.outfits.length,
      metricScheduled: assigned, metricWears: state.wears.length };
    for (const [key, num] of Object.entries(metrics)) if ($('#' + key)) $('#' + key).textContent = String(num).padStart(2, '0');
    if ($('#wardrobeCount')) $('#wardrobeCount').textContent = countLabel(state.garments.length, 'prenda', 'prendas');
    if ($('#greeting')) {
      const greeting = $('#greeting'); greeting.replaceChildren(document.createTextNode('Hola, '));
      const span = document.createElement('span'); span.className = 'serif purple-text';
      span.textContent = state.profile?.name ? `${firstName(state.profile.name)}.` : 'tu estilo.';
      greeting.append(span, document.createElement('br'), document.createTextNode('Tu clóset cobra vida.'));
    }
  }
  function cardPhoto(g) {
    const image = document.createElement('img');
    image.src = garmentURL(g); image.alt = `Fotografía de ${g.name}`; image.loading = 'lazy'; image.decoding = 'async';
    return image;
  }
  function renderGarments() {
    const grid = $('#garmentGrid'); if (!grid) return;
    const query = ($('#wardrobeSearch')?.value || '').trim().toLocaleLowerCase('es');
    const category = $('#wardrobeFilter')?.value || 'Todas';
    const garments = state.garments.filter(g =>
      (category === 'Todas' || g.category === category) &&
      (`${g.name} ${g.color} ${g.occasion}`.toLocaleLowerCase('es').includes(query))
    );
    if ($('#garmentSubcount')) $('#garmentSubcount').textContent = countLabel(state.garments.length, 'prenda registrada', 'prendas registradas');
    grid.replaceChildren();
    if (!garments.length) {
      const empty = document.createElement('div'); empty.className = 'empty-collection';
      empty.innerHTML = '<span aria-hidden="true">✳</span><strong>Tu colección comienza aquí</strong><p>Añade una foto o cambia los filtros para ver tus prendas.</p>';
      grid.append(empty); return;
    }
    garments.forEach(g => {
      const card = document.createElement('article'); card.className = 'garment-card';
      const cover = document.createElement('div'); cover.className = 'garment-card-photo'; cover.append(cardPhoto(g));
      const info = document.createElement('div'); info.className = 'garment-card-info';
      info.innerHTML = `<span class="garment-type">${escapeHTML(g.category)} · ${escapeHTML(g.color)}</span><strong>${escapeHTML(g.name)}</strong>`;
      const actions = document.createElement('div'); actions.className = 'garment-actions';
      const edit = document.createElement('button'); edit.type = 'button'; edit.className='mini-action'; edit.textContent='Editar'; edit.setAttribute('aria-label',`Editar ${g.name}`);
      edit.addEventListener('click', () => editGarment(g.id));
      const del = document.createElement('button'); del.type = 'button'; del.className='mini-action danger'; del.textContent='Eliminar'; del.setAttribute('aria-label',`Eliminar ${g.name}`);
      del.addEventListener('click', () => removeGarment(g.id));
      actions.append(edit,del);info.append(actions);card.append(cover,info);grid.append(card);
    });
  }
  async function imageToBlob(file) {
    if (!['image/jpeg','image/png','image/webp'].includes(file?.type)) throw Error('Solo se admiten JPG, PNG y WebP.');
    if (file.size > 8 * 1024 * 1024) throw Error('La imagen supera el máximo de 8 MB.');
    let bitmap;
    try {
      if ('createImageBitmap' in window) bitmap = await createImageBitmap(file);
      else {
        bitmap = await new Promise((resolve, reject) => {
          const im = new Image(); const url = URL.createObjectURL(file);
          im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
          im.onerror = () => { URL.revokeObjectURL(url); reject(Error('La imagen no se puede leer.')); };
          im.src = url;
        });
      }
      const ratio = Math.min(1, 1100 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas'); canvas.width = Math.max(1,Math.round(bitmap.width * ratio)); canvas.height = Math.max(1,Math.round(bitmap.height * ratio));
      const ctx = canvas.getContext('2d'); if (!ctx) throw Error('No fue posible procesar la foto.');
      ctx.fillStyle='#fbf9f6';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
      const output = await new Promise(resolve => canvas.toBlob(resolve,'image/webp',.82));
      if (output) return output;
      const jpeg = await new Promise(resolve => canvas.toBlob(resolve,'image/jpeg',.8));
      if (!jpeg) throw Error('No se pudo comprimir la imagen.'); return jpeg;
    } catch (error) { throw Error('No se pudo abrir la foto. Prueba con otra imagen.'); }
    finally { bitmap?.close?.(); }
  }
  function fileChosen(file) {
    if (state.previewURL) URL.revokeObjectURL(state.previewURL);
    state.previewURL = file ? URL.createObjectURL(file) : null;
    const parent=$('#uploadPreview');if (!parent) return;
    parent.hidden = !file;
    if (file) { $('#newGarmentPreview').src=state.previewURL; $('#selectedFilesNote').textContent = file.name; }
  }
  async function loadSamples() {
    if(state.garments.some(g=>g.demo))return notice('Ya tienes prendas de muestra en el armario. Puedes crear looks con ellas.');
    const entries=[
      ['Blazer lavanda','Superior','Lavanda','muestra-blazer.svg'],
      ['Camisa blanca','Superior','Blanco','muestra-camisa.svg'],
      ['Jeans azul','Inferior','Azul','muestra-jeans.svg'],
      ['Pantalón beige','Inferior','Neutro','muestra-pantalon.svg'],
      ['Zapatillas crema','Calzado','Neutro','muestra-zapatillas.svg'],
      ['Bolso negro','Accesorio','Negro','muestra-bolso.svg']
    ];
    const btn=$('#loadSampleWardrobe');btn.disabled=true;btn.textContent='Preparando tu armario de muestra…';
    try {
      for(const [index,[name,category,color,asset]] of entries.entries()) {
        const response=await fetch('assets/'+asset);if(!response.ok)throw Error('No se pudo abrir el archivo de muestra.');
        const image=await response.blob();
        await dbOp('garments','put',{id:id(),name,category,color,occasion:'Todos los días',
          image,createdAt:Date.now()+index,imageUpdatedAt:Date.now()+index,demo:true});
      }
      await reloadData();updatedUI();notice('¡Listo! Seis prendas de ejemplo para descubrir tu estudio.');
    } catch(error) {await reloadData();updatedUI();notice('No se cargaron todas las muestras. Abre la página con Live Server.');}
    finally{btn.disabled=false;btn.textContent='✳ Probar con 6 prendas de muestra →';}
  }
  async function uploadGarments(event) {
    event.preventDefault();
    const files = [...($('#garmentFiles')?.files || [])];
    if (!files.length) return notice('Elige al menos una fotografía antes de continuar.');
    if (files.length > 12) return notice('Puedes subir hasta 12 fotos a la vez.');
    const title = $('#garmentName').value.trim();
    const button=$('#addGarmentBtn');button.disabled=true;button.textContent='Guardando tus prendas…';
    let saved=0;
    try {
      for (const [index,file] of files.entries()) {
        const photo=await imageToBlob(file);
        const fileName=file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g,' ').slice(0,55);
        const name = index===0 && title ? title : fileName || 'Prenda sin nombre';
        await dbOp('garments','put',{id:id(),name,category:$('#garmentCategory').value,color:$('#garmentColor').value,
          occasion:$('#garmentOccasion').value,image:photo,imageUpdatedAt:Date.now()+index,createdAt:Date.now()+index});
        saved++;
      }
      $('#garmentForm').reset();fileChosen(null);
      await reloadData();updatedUI();notice(`${saved} ${saved===1?'prenda añadida':'prendas añadidas'} a tu armario. ¡A combinar!`);
    } catch (error) { notice(`${error.message} Se guardaron ${saved} de ${files.length} prendas.`); await reloadData();updatedUI(); }
    finally {button.disabled=false;button.textContent='＋ Añadir al armario';}
  }
  let editPhotoURL;
  function editGarment(gid) {
    const g = getGarment(gid);if (!g) return;
    state.editingId = g.id;$('#editGarmentName').value=g.name;$('#editGarmentCategory').value=g.category;
    $('#editGarmentColor').value=g.color;$('#editGarmentOccasion').value=g.occasion;
    $('#editGarmentPhoto').value='';$('#editGarmentImage').src=garmentURL(g);
    $('#editGarmentDialog').showModal();
  }
  async function submitEditedGarment(e) {
    e.preventDefault();const g=getGarment(state.editingId);if(!g)return;
    const nextName=$('#editGarmentName').value.trim();if(nextName.length<1)return notice('Ponle un nombre a tu prenda.');
    try {
      const photo=$('#editGarmentPhoto').files?.[0];let img=g.image, imgUpdated=g.imageUpdatedAt;
      if(photo){img=await imageToBlob(photo);imgUpdated=Date.now();}
      await dbOp('garments','put',{...g,name:nextName,category:$('#editGarmentCategory').value,
        color:$('#editGarmentColor').value,occasion:$('#editGarmentOccasion').value,image:img,imageUpdatedAt:imgUpdated});
      $('#editGarmentDialog').close(); await reloadData();updatedUI();notice('Tu prenda ha sido actualizada.');
    } catch(error) {notice(error.message || 'No se guardaron los cambios.');}
  }
  async function removeGarment(gid) {
    const g=getGarment(gid);if(!g)return;
    const dependent=state.outfits.filter(o=>o.garmentIds.includes(gid));
    const message=dependent.length
      ? `¿Eliminar «${g.name}»? También se eliminarán ${dependent.length} looks que la usan y sus asignaciones del calendario.`
      : `¿Eliminar «${g.name}» de tu armario?`;
    if(!confirm(message))return;
    try {
      for(const outfit of dependent) await dbOp('outfits','delete',outfit.id);
      const affected=new Set(dependent.map(o=>o.id));
      for(const key of Object.keys(state.schedule)) if(affected.has(state.schedule[key])) delete state.schedule[key];
      await saveSchedule();await dbOp('garments','delete',gid);
      const url=state.objectURLs.get(gid);if(url){URL.revokeObjectURL(url.url);state.objectURLs.delete(gid);}
      await reloadData();updatedUI();notice('Prenda eliminada del armario.');
    } catch(error){notice('No se pudo borrar la prenda.');}
  }
  function slots() { return ['slotSuperior','slotInferior','slotCalzado','slotAccesorio']; }
  function eligible(slot, g) {
    return (slot==='slotSuperior' && ['Superior','Abrigo'].includes(g.category)) ||
      (slot==='slotInferior' && g.category==='Inferior') ||
      (slot==='slotCalzado' && g.category==='Calzado') ||
      (slot==='slotAccesorio' && g.category==='Accesorio');
  }
  function renderBuilderSelections() {
    for (const slot of slots()) {
      const select=$('#'+slot);const current=select.value;
      select.replaceChildren(new Option(['slotSuperior','slotInferior'].includes(slot)?'Elige una prenda...':'Opcional...',''));
      state.garments.filter(g=>eligible(slot,g)).forEach(g=>select.add(new Option(`${g.name} · ${g.color}`,g.id)));
      select.value=state.garments.some(g=>g.id===current && eligible(slot,g)) ? current : '';
    }
    renderBuilderPreview();
  }
  function outfitThumb(ids,className='small-outfit-image') {
    const wrap=document.createElement('div');wrap.className=className;
    for(const gid of ids.slice(0,4)){
      const g=getGarment(gid);if(!g)continue;
      const img=cardPhoto(g);wrap.append(img);
    }
    if(!wrap.children.length){const span=document.createElement('span');span.textContent='✳';wrap.append(span);}
    return wrap;
  }
  function selectedGarmentIds(){return slots().map(slot=>$('#'+slot).value).filter(Boolean);}
  function renderBuilderPreview() {
    const preview=$('#outfitPreview');if(!preview)return;
    const ids=selectedGarmentIds();preview.replaceChildren();
    if(!ids.length){const div=document.createElement('div');div.className='collage-placeholder';div.innerHTML='<span>✳</span><strong>Tu siguiente look empieza aquí.</strong><small>Selecciona las prendas de la izquierda</small>';preview.append(div);return;}
    const collage=outfitThumb(ids,'collage-current');preview.append(collage);
    const caption=document.createElement('div');caption.className='collage-stamp';caption.textContent='CURATED BY YOU';preview.append(caption);
  }
  function suggestOutfit() {
    const best=(names)=>{
      const found=state.garments.filter(g=>names.includes(g.category));
      const score=g=>(g.color===state.profile?.color?3:0)+(g.occasion===state.profile?.routine?2:0)+(g.occasion==='Todos los días'?1:0);
      return found.sort((a,b)=>score(b)-score(a))[0];
    };
    const superior=best(['Superior','Abrigo']),inferior=best(['Inferior']);
    if(!superior||!inferior)return notice('Añade al menos una parte superior y una inferior para recibir sugerencias.');
    const shoes=best(['Calzado']),accessory=best(['Accesorio']);
    const pairs=[['slotSuperior',superior],['slotInferior',inferior],['slotCalzado',shoes],['slotAccesorio',accessory]];
    pairs.forEach(([key,g])=>{$('#'+key).value=g?.id||'';});
    $('#outfitOccasion').value=['Universidad','Trabajo','Viaje'].includes(state.profile?.routine)
      ? (state.profile.routine==='Viajes'?'Viaje':state.profile.routine) : 'Casual';
    $('#outfitName').value=`${state.profile?.style||'Mi'} look ${state.profile?.routine||'para hoy'}`;
    renderBuilderPreview();
    $('#styleAdvice').textContent=`✳ Seleccionamos prendas de tu armario para tu rutina (${state.profile?.routine||'días variados'}), priorizando ${state.profile?.color||'tus colores'} cuando hay opciones disponibles. Puedes ajustar el resultado antes de guardarlo.`;
    notice('Sugerencia creada con tus prendas y preferencias. Sin IA externa.');
  }
  async function saveOutfit() {
    const ids=selectedGarmentIds();
    if(!$('#slotSuperior').value || !$('#slotInferior').value) return notice('Elige una prenda superior y una inferior para crear el look.');
    if(new Set(ids).size!==ids.length)return notice('No puedes usar la misma prenda dos veces en un look.');
    const title=$('#outfitName').value.trim() || `Mi look ${state.outfits.length+1}`;
    try {
      await dbOp('outfits','put',{id:id(),name:title,occasion:$('#outfitOccasion').value,garmentIds:ids,createdAt:Date.now()});
      $('#outfitName').value='';for(const slot of slots())$('#'+slot).value='';
      await reloadData();updatedUI();notice('¡Look guardado! Ya puedes añadirlo al calendario.');
    }catch(error){notice('No se pudo guardar el look. Revisa el espacio disponible.');}
  }
  function renderOutfits() {
    const grid=$('#outfitsGrid');if(!grid)return;grid.replaceChildren();
    $('#outfitsSubcount').textContent=countLabel(state.outfits.length,'look guardado','looks guardados');
    if(!state.outfits.length){const div=document.createElement('div');div.className='empty-outfits';div.innerHTML='<span>✳</span><strong>La creatividad empieza con dos prendas.</strong><p>Cuando guardes tus combinaciones aparecerán aquí.</p>';grid.append(div);return;}
    for(const outfit of state.outfits){
      const card=document.createElement('article');card.className='saved-outfit-card';
      card.append(outfitThumb(outfit.garmentIds,'saved-look-art'));
      const info=document.createElement('div');info.className='saved-look-info';
      info.innerHTML=`<small>${escapeHTML(outfit.occasion)} · ${outfit.garmentIds.length} prendas</small><strong>${escapeHTML(outfit.name)}</strong>`;
      const btns=document.createElement('div');btns.className='saved-look-buttons';
      const schedule=document.createElement('button');schedule.type='button';schedule.textContent='Planificar ↗';
      schedule.addEventListener('click',()=>{location.hash='#calendario';$('#assignOutfit').value=outfit.id;notice('Selecciona un día y guarda tu look en el calendario.');});
      const del=document.createElement('button');del.type='button';del.textContent='Eliminar';del.className='danger';
      del.setAttribute('aria-label',`Eliminar look ${outfit.name}`);del.addEventListener('click',()=>removeOutfit(outfit.id));
      btns.append(schedule,del);info.append(btns);card.append(info);grid.append(card);
    }
  }
  async function removeOutfit(oid) {
    const outfit=getOutfit(oid);if(!outfit||!confirm(`¿Eliminar el look «${outfit.name}»? También se quitará de los días planificados.`))return;
    try {
      for(const day of Object.keys(state.schedule))if(state.schedule[day]===oid)delete state.schedule[day];
      await saveSchedule();await dbOp('outfits','delete',oid);await reloadData();updatedUI();notice('Look eliminado.');
    }catch{notice('No se pudo eliminar el look.');}
  }
  function renderPlanner() {
    const grid=$('#plannerGrid');if(!grid)return;grid.replaceChildren();
    const now=new Date();$('#weekLabel').textContent=`SEMANA DEL ${dateForDay(0).toLocaleDateString('es-EC',{day:'numeric',month:'short'})}`;
    DAYS.forEach((day,index)=>{
      const key=String(index),date=dateForDay(index),oid=state.schedule[key],outfit=getOutfit(oid);
      const assigned=outfit?outfit:null;
      const worn=state.wears.some(w=>w.id===localDateKey(date)&&w.outfitId===oid);
      const b=document.createElement('button');b.type='button';b.className='planner-day'+(index===state.selectedDay?' active':'');
      b.setAttribute('aria-pressed',String(index===state.selectedDay));b.dataset.plannerDay=key;
      const head=document.createElement('div');head.className='planner-day-head';head.innerHTML=`<span>${SHORT_DAYS[index]}</span><strong>${date.getDate()}</strong>`;
      const pic=outfit?outfitThumb(outfit.garmentIds,'planner-mini-look'):document.createElement('div');
      if(!outfit){pic.className='planner-blank';pic.textContent='＋';}
      const label=document.createElement('div');label.className='planner-day-bottom';
      const title=document.createElement('strong');title.textContent=outfit?.name || 'Sin look';
      const sub=document.createElement('small');sub.textContent=worn?'✓ Usado':outfit?.occasion||'Planificar';
      label.append(title,sub);b.append(head,pic,label);b.addEventListener('click',()=>{state.selectedDay=index;renderPlanner();});grid.append(b);
    });
    const day=state.selectedDay,assigned=state.schedule[String(day)];
    $('#editDayTitle').textContent=`${DAYS[day]} ${dateForDay(day).getDate()}`;
    const select=$('#assignOutfit');select.replaceChildren(new Option('Sin outfit asignado',''));
    for(const look of state.outfits)select.add(new Option(look.name,look.id));
    select.value=getOutfit(assigned)?assigned:'';
    const hasOutfit=!!getOutfit(assigned);
    $('#markWorn').disabled=!hasOutfit;$('#removeAssignment').disabled=!hasOutfit;
    if(hasOutfit && state.wears.some(w=>w.id===localDateKey(dateForDay(day)) && w.outfitId===assigned))$('#markWorn').textContent='✓ Ya lo registraste';
    else $('#markWorn').textContent='✓ Ya lo usé';
  }
  async function assignOutfit() {
    const oid=$('#assignOutfit').value;
    if(oid && !getOutfit(oid))return notice('Selecciona un look que tengas guardado.');
    if(oid)state.schedule[String(state.selectedDay)]=oid;
    else delete state.schedule[String(state.selectedDay)];
    try{await saveSchedule();renderSummary();renderPlanner();renderStats();notice(`${DAYS[state.selectedDay]} actualizado en tu calendario.`);}
    catch{notice('No se pudo guardar el calendario.');}
  }
  async function markWorn() {
    const oid=state.schedule[String(state.selectedDay)],outfit=getOutfit(oid);
    if(!outfit)return notice('Primero asigna un outfit a ese día.');
    const day=dateForDay(state.selectedDay);const key=localDateKey(day);
    try{
      await dbOp('wears','put',{id:key,outfitId:oid,outfitName:outfit.name,garmentIds:[...outfit.garmentIds],date:key});
      await reloadData();renderSummary();renderPlanner();renderStats();notice('¡Registrado! Ahora tus estadísticas reflejan este uso.');
    }catch{notice('No se pudo registrar el uso.');}
  }
  function renderStats() {
    if(!$('#statTotal'))return;
    $('#statTotal').textContent=String(state.garments.length);
    const graph=$('#categoryBars');graph.replaceChildren();
    for(const category of GROUPS){
      const count=state.garments.filter(g=>g.category===category).length;
      if(!count)continue;
      const div=document.createElement('div');div.className='category-bar';
      const label=document.createElement('div');label.className='category-bar-label';
      label.innerHTML=`<span>${escapeHTML(category)}</span><strong>${count}</strong>`;
      const rail=document.createElement('div');rail.className='category-rail';const fill=document.createElement('div');fill.className='category-fill';
      fill.style.width=`${Math.round(count/Math.max(state.garments.length,1)*100)}%`;rail.append(fill);div.append(label,rail);graph.append(div);
    }
    if(!state.garments.length)graph.innerHTML='<p class="fine">Tu distribución aparecerá cuando registres tu primera prenda.</p>';
    const usage=new Map();state.wears.forEach(w=>w.garmentIds?.forEach(gid=>usage.set(gid,(usage.get(gid)||0)+1)));
    let top=null;for(const g of state.garments)if(!top || (usage.get(g.id)||0)>(usage.get(top.id)||0))top=g;
    const used=state.garments.filter(g=>(usage.get(g.id)||0)>0).length;
    const habits=$('#statHabits');habits.replaceChildren();
    const entries=[['Looks creados',state.outfits.length],['Días planificados',Object.values(state.schedule).filter(id=>getOutfit(id)).length+'/7'],
      ['Registros de uso',state.wears.length],['Prendas usadas',used + '/' + state.garments.length],['Más utilizada', top && usage.get(top.id) ? `${top.name} (${usage.get(top.id)})` : 'Aún sin registros']];
    for(const [key,value] of entries){const row=document.createElement('div');row.className='stat-row';const k=document.createElement('span');k.textContent=key;const v=document.createElement('strong');v.textContent=String(value);row.append(k,v);habits.append(row);}
  }
  function renderProfile() {
    const profile=state.profile;if(!profile)return;
    if($('#styleAdvice')) $('#styleAdvice').textContent=`✳ ${profile.name||'Tu espacio'}: estilo ${profile.style||'personal'}, rutina ${profile.routine||'variada'} y objetivo «${profile.goal||'vestirte mejor'}». Haz clic en «Sugerir según mi estilo» para construir un look con tus fotos.`;
    $('#profileName').value=profile.name||'';
    for(const key of ['Style','Routine','Goal','Color']){
      const el=$('#profile'+key);if(!el)continue;
      const wanted=profile[key.toLowerCase()];if([...el.options].some(o=>o.value===wanted))el.value=wanted;
    }
    $('#profileGreeting').textContent=profile.name ? `Este es tu espacio, ${firstName(profile.name)}.` : 'Tu propio universo';
  }
  async function submitProfile(e) {
    e.preventDefault();const name=$('#profileName').value.trim();if(name.length<2)return notice('Escribe un nombre de al menos dos caracteres.');
    try{await saveProfile({name,style:$('#profileStyle').value,routine:$('#profileRoutine').value,goal:$('#profileGoal').value,color:$('#profileColor').value,plan:state.profile?.plan||'mensual'});notice('Preferencias guardadas. Tu espacio ya se siente más tuyo.');}
    catch{notice('No se pudieron guardar tus preferencias.');}
  }
  async function submitOnboarding(e) {
    e.preventDefault();const name=$('#onboardName').value.trim();if(name.length<2)return notice('Cuéntanos cómo te llamas.');
    try{await saveProfile({name,style:$('#onboardStyle').value,routine:$('#onboardRoutine').value,goal:$('#onboardGoal').value,color:$('#onboardColor').value,plan:state.profile?.plan||'mensual'});$('#onboardingDialog').close();notice('¡Bienvenido a tu estudio! Empieza subiendo una prenda.');}
    catch{notice('No se pudo crear tu perfil.');}
  }
  function resetUploader(){ $('#garmentForm').reset();fileChosen(null); }
  function bindUI() {
    $('#garmentForm').addEventListener('submit',uploadGarments);
    $('#loadSampleWardrobe').addEventListener('click',loadSamples);
    $('#photoDropzone').addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();$('#garmentFiles').click();}});
    $('#garmentFiles').addEventListener('change',e=>{fileChosen(e.target.files?.[0]);if(e.target.files?.length>1)$('#selectedFilesNote').textContent=`${e.target.files.length} fotos seleccionadas`;});
    $('#resetGarmentForm').addEventListener('click',resetUploader);
    $('#wardrobeSearch').addEventListener('input',renderGarments);
    $('#wardrobeFilter').addEventListener('change',renderGarments);
    const zone=$('#photoDropzone');
    for(const evt of ['dragenter','dragover'])zone.addEventListener(evt,e=>{e.preventDefault();zone.classList.add('dragover');});
    for(const evt of ['dragleave','drop'])zone.addEventListener(evt,e=>{e.preventDefault();zone.classList.remove('dragover');});
    zone.addEventListener('drop',e=>{const files=[...e.dataTransfer.files].filter(f=>f.type.startsWith('image/'));if(!files.length)return notice('Arrastra fotografías JPG, PNG o WebP.');
      const transfer=new DataTransfer();files.forEach(f=>transfer.items.add(f));$('#garmentFiles').files=transfer.files;fileChosen(files[0]);if(files.length>1)$('#selectedFilesNote').textContent=`${files.length} fotos seleccionadas`;});
    $('#editGarmentForm').addEventListener('submit',submitEditedGarment);
    $('#closeEditGarment').addEventListener('click',()=>$('#editGarmentDialog').close());
    $('#cancelEditGarment').addEventListener('click',()=>$('#editGarmentDialog').close());
    $('#editGarmentDialog').addEventListener('click',e=>{if(e.target===$('#editGarmentDialog'))$('#editGarmentDialog').close();});
    $('#editGarmentPhoto').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;
      if(editPhotoURL)URL.revokeObjectURL(editPhotoURL); editPhotoURL=URL.createObjectURL(file);$('#editGarmentImage').src=editPhotoURL;});
    $('#editGarmentDialog').addEventListener('close',()=>{if(editPhotoURL)URL.revokeObjectURL(editPhotoURL);editPhotoURL=null;state.editingId=null;});
    for(const slot of slots())$('#'+slot).addEventListener('change',renderBuilderPreview);
    $('#saveOutfit').addEventListener('click',saveOutfit);
    $('#suggestOutfit').addEventListener('click',suggestOutfit);
    $('#clearBuilder').addEventListener('click',()=>{$('#outfitName').value='';slots().forEach(k=>$('#'+k).value='');renderBuilderPreview();});
    $('#assignBtn').addEventListener('click',assignOutfit);
    $('#removeAssignment').addEventListener('click',()=>{$('#assignOutfit').value='';assignOutfit();});
    $('#markWorn').addEventListener('click',markWorn);
    $('#profileForm').addEventListener('submit',submitProfile);
    $('#onboardingForm').addEventListener('submit',submitOnboarding);
    $('#skipOnboarding').addEventListener('click',()=>{state.onboardingSkipped=true;$('#onboardingDialog').close();});
    $('#deleteAllStudio').addEventListener('click',clearAll);
  }
  async function clearAll() {
    if(!confirm('¿Borrar todas tus fotos, prendas, outfits, calendario, registros de uso y preferencias guardadas en este navegador? No se puede deshacer.'))return;
    try {
      await Promise.all(STORE_NAMES.map(name=>dbOp(name,'clear')));
      try{for(const key of ['synclotheDemoUser','synclotheDemoFavorites'])localStorage.removeItem(key);}catch{/* Algunos navegadores bloquean localStorage. */}
      cleanupURLs();state.objectURLs.clear();state.profile=null;state.schedule={};await reloadData();renderAll();
      notice('Tu espacio se ha borrado por completo.');
      setTimeout(()=>{if($('#onboardingDialog')&&!$('#onboardingDialog').open)$('#onboardingDialog').showModal();},300);
    }catch{notice('No se pudieron borrar todos los datos. Inténtalo de nuevo.');}
  }
  async function init() {
    try {
      state.db=await openDatabase();
      await reloadData();
      if(!state.profile){
        let old={};try{old=JSON.parse(localStorage.getItem('synclotheDemoUser')||'{}');}catch{}
        if(old?.name){
          await dbOp('meta','put',{id:'profile',name:String(old.name).slice(0,70),plan:old.plan||'mensual',
            style:'Minimalista',routine:'Universidad',goal:'Ahorrar tiempo',color:'Neutros',onboardingDone:false});
          await reloadData();
        }
      }
      bindUI();renderAll();
      if(!state.profile?.onboardingDone){
        $('#onboardName').value=state.profile?.name||'';
        $('#onboardingDialog').showModal();
      }
    } catch(error) {
      const block=document.createElement('div');block.className='studio-error';
      block.textContent='No se pudo abrir el almacenamiento local. Prueba en Chrome o Firefox con Live Server y permite guardar datos del sitio. Detalle: '+error.message;
      $('.studio-bar')?.after(block);
      for(const form of ['garmentForm','profileForm'])$('#'+form)?.querySelectorAll('button,input,select').forEach(b=>b.disabled=true);
      notice('La base de datos local no está disponible en este navegador.');
    }
  }
  init();
})();
