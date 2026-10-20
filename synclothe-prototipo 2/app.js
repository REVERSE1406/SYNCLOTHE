/* Synclothe · Prototipo interactivo. Funciona sin librerías ni backend. */
'use strict';
document.documentElement.classList.add('js');
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
let toastTimer;
function toast(msg) {const el = $('#toast'); if(!el)return; el.textContent=msg; el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4100);}
function getStorage(key,fallback=null){try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch{return fallback;}}
function putStorage(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
const prefersLessMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Navigation, position, and scroll-based reveals
$$('[data-stage]').forEach(el=>{if(el.dataset.stage===document.body.dataset.page)el.classList.add('current')});
$('#menuToggle')?.addEventListener('click',()=>{const nav=$('#mainNav'),button=$('#menuToggle');const open=nav.classList.toggle('open');button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');button.textContent=open?'✕':'☰';if(open)nav.querySelector('a')?.focus();});
function closeMobileMenu(restoreFocus=false){const nav=$('#mainNav'),btn=$('#menuToggle');if(!nav||!btn||!nav.classList.contains('open'))return;nav.classList.remove('open');btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label','Abrir menú');btn.textContent='☰';if(restoreFocus)btn.focus();}
$$('#mainNav a').forEach(link=>link.addEventListener('click',()=>closeMobileMenu()));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobileMenu(true)});
document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMobileMenu()});

function updateScroll(){const max=document.documentElement.scrollHeight-innerHeight;const progress=Math.max(0,Math.min(100,max?scrollY/max*100:0));if($('#progressLine'))$('#progressLine').style.width=progress+'%';$('#backTop')?.classList.toggle('visible',scrollY>500);$('.site-header')?.classList.toggle('scrolled',scrollY>30);}
addEventListener('scroll',updateScroll,{passive:true});updateScroll();
$('#backTop')?.addEventListener('click',()=>scrollTo({top:0,behavior:prefersLessMotion?'auto':'smooth'}));
const targets=$$('.reveal,.stagger');
if('IntersectionObserver' in window&&!prefersLessMotion){const ob=new IntersectionObserver((entries)=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('in-view');ob.unobserve(entry.target)}}},{threshold:.10,rootMargin:'0px 0px 50px 0px'});targets.forEach(e=>ob.observe(e));}else targets.forEach(e=>e.classList.add('in-view'));

// Consideration: interactive look recommendation (illustrative, not AI)
const occasionLooks={Universidad:{file:'campus',name:'Campus creativo',description:'Blazer + básicos + zapatillas. Cómodo, práctico y con mucho estilo.'},Trabajo:{file:'trabajo',name:'Oficina sin esfuerzo',description:'Tonos neutros, blazer ligero y detalles que hacen la diferencia.'},Salida:{file:'salida',name:'After-hours glow',description:'Una combinación más arreglada y sofisticada para tus planes de noche.'},Viaje:{file:'viaje',name:'Carry-on ready',description:'Básicos versátiles que funcionan para viajar ligero y combinar más.'}};
let selectedOccasion='Universidad';
function setOutfit(occasion){const look=occasionLooks[occasion];if(!look)return;selectedOccasion=occasion;$$('[data-occasion]').forEach(b=>{const selected=b.dataset.occasion===occasion;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});const img=$('#demoImage');if(img){img.src=`assets/outfit-${look.file}.svg`;img.alt='Outfit sugerido: '+look.name;if(!prefersLessMotion)img.animate?.([{opacity:.25,transform:'scale(.95)'},{opacity:1,transform:'scale(1)'}],{duration:420,easing:'ease-out'});}if($('#demoName'))$('#demoName').textContent=look.name;if($('#demoDescription'))$('#demoDescription').textContent=look.description;}
$$('[data-occasion]').forEach(btn=>btn.addEventListener('click',()=>{setOutfit(btn.dataset.occasion);if($('#demoFeedback'))$('#demoFeedback').textContent='✧ Selección actualizada: '+btn.dataset.occasion+'.';}));
$('#demoBtn')?.addEventListener('click',()=>{const keys=Object.keys(occasionLooks);setOutfit(keys[(keys.indexOf(selectedOccasion)+1)%keys.length]);toast('¡Look renovado! Explora otras ocasiones o prueba una foto.');});
$('#uploadTrigger')?.addEventListener('click',()=>$('#clothingUpload')?.click());
$('#clothingUpload')?.addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)){toast('Selecciona una imagen JPG, PNG o WebP.');return;}if(file.size>4*1024*1024){toast('Elige una imagen menor de 4 MB.');return;}const src=URL.createObjectURL(file);const img=$('#uploadThumb');if(img){if(img.dataset.objectUrl)URL.revokeObjectURL(img.dataset.objectUrl);img.src=src;img.alt='Vista previa de '+file.name.slice(0,80);img.dataset.objectUrl=src;img.classList.add('show');}if($('#uploadLabel'))$('#uploadLabel').textContent='Foto cargada en esta pantalla';toast('Foto seleccionada. Tu imagen no se envió a ningún servidor.');});
$('#buyRange')?.addEventListener('input',e=>{const count=Number(e.target.value)||0;if($('#buyCount'))$('#buyCount').textContent=String(count);if($('#savingsResult'))$('#savingsResult').textContent='$'+count*30;});

// Conversion: no payment details; local-only demo registration.
$$('[data-plan]').forEach(btn=>btn.addEventListener('click',()=>{$$('[data-plan]').forEach(b=>{const active=b===btn;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});if($('#selectedPlan'))$('#selectedPlan').value=btn.dataset.plan;}));
$('#signupForm')?.addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const d=new FormData(form);const name=String(d.get('name')||'').trim();const email=String(d.get('email')||'').trim();if(!name||!email){toast('Completa tu nombre y tu correo.');return;}const saved=putStorage('synclotheDemoUser',{name,plan:String(d.get('plan')||'mensual')});const notice=$('#feedback');if(notice){notice.textContent=saved?'Solo tu nombre y tu modalidad se guardaron en este navegador. Tu correo no se almacenó. No se ha realizado ningún pago.':'Tu demo está lista, pero el navegador impidió guardar el perfil. Puedes continuar igualmente.';notice.classList.remove('hidden');}$('#successBox')?.classList.remove('hidden');$('#successBox')?.scrollIntoView({behavior:prefersLessMotion?'auto':'smooth',block:'nearest'});toast('¡Bienvenido a Synclothe! Tu demo está lista.');});

// Clear only the demo's own keys; never alter unrelated browser data.
$('#clearDemoData')?.addEventListener('click',async()=>{
 if(!confirm('¿Borrar el perfil, las fotos, el armario, los looks y la planificación guardados en este navegador? Esta acción no se puede deshacer.'))return;
 const btn=$('#clearDemoData');if(btn)btn.disabled=true;
 let dbCleared=true;
 try{
  if('indexedDB' in window){
   await new Promise((resolve,reject)=>{
    const req=indexedDB.deleteDatabase('SynclotheStudio');
    req.onsuccess=resolve;req.onerror=()=>reject(req.error||new Error('Error de almacenamiento'));
    req.onblocked=()=>reject(new Error('Cierra las otras pestañas de Synclothe antes de borrar los datos.'));
   });
  }
 }catch(error){dbCleared=false;toast(error.message||'No se pudo borrar el armario.');}
 if(dbCleared){
  try{localStorage.removeItem('synclotheDemoUser');localStorage.removeItem('synclotheDemoFavorites');}catch{}
  $('#signupForm')?.reset();if($('#selectedPlan'))$('#selectedPlan').value='mensual';
  $$('[data-plan]').forEach(button=>{const active=button.dataset.plan==='mensual';button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  $('#successBox')?.classList.add('hidden');
  const feedback=$('#feedback');if(feedback){feedback.textContent='Se borraron tus datos locales de Synclothe, incluidas las fotografías, combinaciones y preferencias de este navegador.';feedback.classList.remove('hidden');}
  toast('Se borraron los datos locales de Synclothe.');
 }
 if(btn)btn.disabled=false;
});
// Loyalty: selectable calendar + saved-look interactions
const user=getStorage('synclotheDemoUser');
if(user?.email){putStorage('synclotheDemoUser',{name:String(user.name||''),plan:String(user.plan||'mensual')});}
if(user?.name && $('#greeting')){const first=String(user.name).trim().split(/\s+/)[0].slice(0,28);$('#greeting').innerHTML='Hola, <span class="serif purple-text"></span> ✳<br>tu semana empieza bien.';$('#greeting .serif').textContent=first;}
const days=[
 {day:'Lunes',title:'En modo pro',desc:'Una propuesta pulida para empezar la semana con confianza: blazer y básicos cómodos.',img:'trabajo'},
 {day:'Martes',title:'Campus day',desc:'Capas cómodas y tonos suaves para pasar todo el día en el campus.',img:'campus'},
 {day:'Miércoles',title:'Dress smart',desc:'Un look versátil para una reunión importante o presentación.',img:'reunion'},
 {day:'Jueves',title:'Cool & casual',desc:'Ligero, espontáneo y listo para un día sin demasiados planes.',img:'viaje'},
 {day:'Viernes',title:'Friday night',desc:'Un outfit con personalidad para terminar la semana con estilo.',img:'salida'},
 {day:'Sábado',title:'Slow saturday',desc:'Prendas frescas y funcionales para salir a pasear.',img:'paseo'},
 {day:'Domingo',title:'Soft sunday',desc:'Comodidad total sin renunciar a combinar bien tus prendas.',img:'relax'}
];
let selectedDay=0;
let favorites=getStorage('synclotheDemoFavorites',[]);if(!Array.isArray(favorites))favorites=[];
function updateFavorites(){if($('#savedCount'))$('#savedCount').textContent=String(favorites.length).padStart(2,'0');const b=$('#saveLookBtn');if(b)b.textContent=favorites.includes(selectedDay)?'♥ Idea guardada':'♡ Guardar idea';}
function selectDay(index){const d=days[index];if(!d)return;selectedDay=index;$$('[data-day]').forEach(b=>{const active=Number(b.dataset.day)===index;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});if($('#selectedLookImage')){$('#selectedLookImage').src='assets/outfit-'+d.img+'.svg';$('#selectedLookImage').alt='Look '+d.day;}if($('#selectedLookTitle'))$('#selectedLookTitle').textContent=d.day+' · '+d.title;if($('#selectedLookText'))$('#selectedLookText').textContent=d.desc;updateFavorites();}
$$('[data-day]').forEach(b=>b.addEventListener('click',()=>selectDay(Number(b.dataset.day))));
$('#saveLookBtn')?.addEventListener('click',()=>{if(favorites.includes(selectedDay)){favorites=favorites.filter(i=>i!==selectedDay);toast('Quitaste este look de tus favoritos.');}else{favorites.push(selectedDay);toast('¡Look guardado en tus favoritos de ejemplo!');}putStorage('synclotheDemoFavorites',favorites);updateFavorites();});updateFavorites();
$('#referralBtn')?.addEventListener('click',async()=>{const msg='Descubre Synclothe: convierte tu ropa en nuevas posibilidades. Código demo: SYN-STYLE';try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(msg);toast('¡Invitación copiada! Compártela con quien quieras.');}else throw new Error('clipboard');}catch{const el=$('#refFeedback');if(el){el.textContent='Copia y comparte este mensaje: '+msg;el.classList.remove('hidden');}toast('Puedes copiar la invitación que aparece abajo.');}});
