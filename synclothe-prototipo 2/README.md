# Synclothe Studio · Prototipo universitario

**Versión 2.0 · HTML + CSS + JavaScript puro (sin frameworks ni servidor de datos)**

Este proyecto conserva las **cuatro páginas del embudo de marketing** y sus animaciones, y agrega un estudio de armario digital funcional dentro de la página de lealtad.

## 1. Abrir el proyecto

1. Descomprime el ZIP y abre **la carpeta completa `synclothe-prototipo`** en Visual Studio Code.
2. Instala la extensión **Live Server** (de Ritwick Dey) si aún no la tienes.
3. Haz clic derecho en `index.html` → **Open with Live Server**. Se abrirá una dirección local parecida a `http://127.0.0.1:5500/index.html`.
4. Navega entre las cuatro etapas desde el menú superior.

> Recomendamos usar **Chrome, Edge o Firefox actualizado**. No abras únicamente archivos sueltos fuera de la carpeta. La función «Cargar prendas de muestra» usa `fetch()` y requiere servir los archivos desde Live Server u otro servidor HTTP local.

Alternativa sin Live Server: abre una terminal dentro de la carpeta y ejecuta `python3 -m http.server 5500`, luego visita `http://localhost:5500`.

## 2. Las cuatro etapas del embudo

| Archivo | Etapa | Acción |
|---|---|---|
| `index.html` | Conciencia | Reto visual «1 prenda, 4 looks» y descubrimiento |
| `consideracion.html` | Consideración | Explicación del servicio y demostración de estilos |
| `conversion.html` | Conversión | Plan mensual/anual, registro **simulado** y privacidad |
| `lealtad.html` | Lealtad | Estudio completo: armario, looks, calendario, estadísticas, perfil y referidos |

## 3. Guion para probar TODAS las funcionalidades (5–10 minutos)

### A. Onboarding / perfil de estilo
1. Entra en **`lealtad.html`** desde el menú «Mi calendario» o desde el botón de «Probar Synclothe Studio».
2. En tu primera visita aparece el onboarding; ingresa un nombre y elige estilo, rutina, objetivo y color favorito.
3. Haz clic en **Crear mi espacio**.
4. Más tarde puedes actualizar tus respuestas en la sección **Mi perfil**.

### B. Armario con fotos
1. En **Mi armario**, haz clic en «Probar con 6 prendas de muestra» para llenar la colección instantáneamente.
2. **O** utiliza «Arrastra una foto aquí» para subir tus prendas desde el dispositivo (JPG, PNG o WebP; hasta 8 MB por foto, máximo 12 fotos de una vez).
3. Si subes una foto, ponle un nombre y elige **categoría** (Superior, Inferior, Calzado, Accesorio o Abrigo), color y ocasión.
4. Prueba **Buscar**, **Filtrar**, **Editar** (incluye reemplazar foto) y **Eliminar**.
5. Las imágenes se redimensionan (máximo 1100 px por lado) y comprimen antes de guardarse localmente.

### C. Creador de outfits
1. Abre **Crear looks**.
2. Selecciona una **parte superior** y una **parte inferior** del armario. Opcionalmente agrega zapatos y accesorios.
3. Ponle nombre al look y elige una ocasión.
4. Haz clic en **Guardar look**. Aparecerá en «Mis looks guardados».
5. Prueba **Sugerir según mi estilo**: crea una propuesta simple basada en tu rutina y color preferido, usando solamente ropa que hayas cargado. Es una regla de demostración, **NO una IA ni una recomendación de un estilista real**.

### D. Calendario editable
1. En **Calendario**, toca un día de lunes a domingo.
2. Selecciona uno de tus looks guardados en el menú desplegable.
3. Haz clic en **Guardar en calendario** y repite para otros días.
4. Pulsa **✓ Ya lo usé** para registrar una vez el uso de ese look en la fecha correspondiente **a la semana actual**.
5. Puedes cambiar la combinación de cualquier día o usar **Quitar**.
6. **Recarga la página**: las asignaciones y las prendas deben continuar visibles.

### E. Estadísticas + perfil
1. En **Insights** aparecen el total de prendas, la distribución por categoría, looks creados, días planificados, registros de uso y la prenda más utilizada.
2. Los contadores se actualizan cuando agregas prendas, guardas outfits, planificas y marcas un look como usado.
3. En **Mi perfil** modifica tu nombre o preferencias, guarda y prueba de nuevo la sugerencia del creador.
4. Para comenzar desde cero, usa **Borrar todo mi espacio** en Mi perfil y confirma la acción.

### F. Registro simulado en conversión
1. Visita `conversion.html`.
2. Elige una modalidad, introduce un nombre y un correo de prueba y acepta la aclaración sobre privacidad.
3. Haz clic en **Crear mi espacio demo** y sigue el enlace a tu armario.
4. **No se realiza ningún pago ni se guarda el correo**. El nombre y la modalidad quedan guardados temporalmente en este dispositivo.
5. El enlace **Borrar mi perfil y todos los datos locales** intenta eliminar también la base de datos del armario. Si está abierto en otra pestaña, ciérrala y vuelve a intentarlo.

## 4. ¿Dónde se guarda la información?

- **IndexedDB (almacenamiento del navegador)**: fotografías procesadas, prendas, outfits, calendario, preferencias y registros de uso.
- **localStorage**: nombre y modalidad ingresados en el registro simulado de la etapa de conversión (datos previos para compatibilidad con la versión antigua).
- **No se suben fotografías ni datos personales a un servidor** en esta versión; el prototipo no integra backend, nube, pagos, autenticación, estilistas o servicios de IA externos.
- Los datos **solo existen en ese navegador, dispositivo y origen web local**. Si cambias de servidor/puerto, navegador o modo incógnito, quizá no aparezcan los mismos datos. Borrar datos del sitio también los elimina.
- Si el almacenamiento está deshabilitado, la demo mostrará un aviso. La capacidad depende del espacio disponible y las políticas del navegador.
- La agenda muestra una **semana tipo** (las mismas asignaciones de lunes a domingo). Los registros de uso sí usan la fecha de la semana actual, para que las estadísticas no sumen repetidamente el mismo uso de un día.
- El borrado de una prenda también elimina los looks actuales que dependían de ella y los quita del calendario. Los registros históricos de uso se conservan como historial agregado hasta borrar todo el espacio.

## 5. Archivos relevantes

```
synclothe-prototipo/
├── index.html                # 01: Conciencia
├── consideracion.html        # 02: Consideración
├── conversion.html           # 03: Conversión
├── lealtad.html              # 04: Lealtad / Synclothe Studio
├── styles.css                # Diseño original, animaciones y responsive
├── studio.css                # Estilos nuevos de armario, builder, calendario, etc.
├── app.js                    # Comportamientos existentes + borrado de datos
├── studio.js                 # Base IndexedDB y seis funcionalidades nuevas
├── assets/                   # Ilustraciones originales + 6 prendas de muestra SVG
├── CHECKLIST_SEO_Y_ACCESIBILIDAD.md
└── README.md
```

## 6. Límites intencionales del prototipo

- No hay usuarios reales ni contraseñas; un mismo navegador comparte un único armario de demostración.
- El creador usa fotos de prendas y reglas simples; **no recorta automáticamente el fondo** de las fotografías ni genera imágenes con IA.
- La sugerencia de prendas toma categorías, rutina y color preferido, pero no aprende automáticamente ni sustituye al estilista humano propuesto para el negocio real.
- No se valida el programa de referidos ni se entregan recompensas reales.
- Para uso comercial hacen falta backend, autenticación, privacidad y gestión de permisos, almacenamiento cloud seguro, controles antimalware, protección de datos aplicable y pruebas adicionales de accesibilidad y rendimiento.

**Sugerencia para exponer:** Usa las seis prendas de muestra y crea dos looks en vivo. Asigna uno al lunes y otro al martes, marca uno como usado y muestra cómo cambia «Insights». Así puedes demostrar la propuesta de valor completa con clics reales y sin integración externa.
