# MAY OS · Cuidado personal

Prototipo PWA con **4 agentes** locales:

1. **Secretaria** — agenda, hábitos EVA y tareas  
2. **Enfermera** — peso, pasos, pulso, sueño, agua + historial  
3. **Psicóloga amiga** — apoyo cotidiano (+1/0/−1), respiración; emergencias ES **112** / **024**  
4. **Money Digital · Compra inteligente** — despensa (cantidad/mínimo), qué falta, lista de compra, presupuesto orientativo editable (por defecto 250 € comida), comparar vía búsquedas web reales  

URL prevista: `https://osnewspedrosg-glitch.github.io/osnews/may-cuidado/`

## Money Digital

- No inventa precios ni ofertas.  
- Botones: Google Shopping (`tbm=shop`), Mercadona y Carrefour (URLs de búsqueda), Google Web.  
- Los precios se ven **en la web al pulsar**.  
- **Nunca compra ni paga sola.**  
- Presupuesto 250 € = orientación editable, no un gasto real extraído del banco.

### Chat Money (ejemplos)

`añade leche qty 2 min 1` · `cantidad leche 3` · `minimo leche 1` · `qué falta` · `lista compra` · `compra leche` · `elimina leche` · `presupuesto 250` · `comparar arroz`

## Archivos

`index.html` · `styles.css` · `app.js` · `manifest.json` · `service-worker.js` (caché **may-cuidado-v15**)

## Aviso

Seguimiento personal · No es diagnóstico médico.

## Fotos locales (Salud + Money)

- Captura o sube con `accept="image/*"` y `capture="environment"`.
- Se guarda en **IndexedDB** del navegador (no hay servidor).
- Redimensionado a **máx. 1600 px** JPEG (~calidad 0.72).
- Límite honesto de origen: **12 MB**; máximo **40** fotos; aviso si el JPEG sigue > 1,5 MB.
- Galería con categoría, fecha, texto, preview y borrar.
- **Sin subida a la nube y sin OCR automático.**
- Service worker caché: `may-cuidado-v15`.



## Salud (Enfermera · Agente Salud)

- Recetas mediterráneas fáciles + botón enviar ingredientes a Money
- Menú semanal sencillo (no nutrición médica)
- Análisis clínicos: fecha, nombre, prueba, valor, unidad, nota (localStorage + export)
- Consejos orientativos según datos registrados (no diagnóstico)
- Samsung Health: importar CSV/JSON (sin conexión web general)
- Fotos: análisis, receta médica, informe médico

## OCR local
Tesseract.js (CDN): extracción conservadora + campos editables + confirmación antes de guardar. No inventa datos.

## Instalar PWA
Botón Instalar + `beforeinstallprompt` y fallback Chrome Android. GoatCounter evento `/may-cuidado/instalar` (clics, no instalaciones reales). Contador local por dispositivo.


## Importar datos de salud (privados, en el dispositivo)

La web es pública (GitHub Pages). **No se publican mediciones ni datos de báscula en el código.**

Para cargar un perfil o una medición en tu navegador:

1. Abre un enlace con fragmento `#import=` (el fragmento no se envía al servidor). La app lo lee, lo guarda en `localStorage` y limpia la barra de direcciones.
2. O bien, en Salud → «Mis datos», elige un JSON de tipo `may-cuidado-seed` (o el mismo formato en el importador de Samsung Health).

Una importación **no borra** métricas, fotos ni chats que ya tuvieras. Si el mismo identificador ya está guardado, se omite el duplicado.

Las recetas (incluido el caldo de gambas y almejas, con calorías **aproximadas**) y la rutina de ejercicio en casa sí forman parte de la app pública. Son orientación, no consejo médico.

El menú semanal es de **2 comidas al día** (comida y cena), con un total aproximado de unas 2.100 kcal y platos de pescado o huevo y mucha verdura. Cifras orientativas.

En ejercicio, la bici estática aparece como **pendiente de comprar** y no entra en la rutina actual; cuando esté, se pueden añadir 20–30 min suaves.

## Compra del mes

La sección «Compra del mes» muestra una lista importada (artículos, precios y casillas de comprado) **solo en el dispositivo**. No hay carritos ni precios en el código publicado. Se carga con el mismo enlace `#import=` o JSON `may-cuidado-seed` que el perfil/báscula. La app no hace pedidos.

## Plan progresivo de ejercicio

La rutina de lunes, miércoles y viernes es genérica: sesión 1 de 10 min, sesión 2 de 15 min y +5 min por sesión (20, 25, 30) hasta los 35 min de la rutina completa. Cada sesión tiene una casilla; la app muestra cuánto toca la próxima vez. Las caminatas y la nota de que el plan es orientativo (consultar al médico) se mantienen.

En la misma sección aparecen fotos de los aparatos (mancuernas, barra, goma y esterilla). La bici estática sigue marcada como pendiente de comprar y no forma parte de la rutina actual.

Si el JSON importado trae un objetivo de peso, Mis datos muestra una barra de progreso desde el peso de partida hasta la meta, un ritmo semanal aproximado y la nota de que es orientativo (consultar al médico). Esos números no van en el código público.

El historial personal de sesiones (fechas y minutos hechos) no va en el código público: se importa con el mismo enlace `#import=` / archivo `may-cuidado-seed` que la báscula y la compra del mes, y se guarda solo en `localStorage` de este dispositivo. Reimportar no duplica lecturas, líneas de compra ni sesiones ya registradas.
