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

`index.html` · `styles.css` · `app.js` · `manifest.json` · `service-worker.js` (caché **may-cuidado-v14**)

## Aviso

Seguimiento personal · No es diagnóstico médico.

## Fotos locales (Salud + Money)

- Captura o sube con `accept="image/*"` y `capture="environment"`.
- Se guarda en **IndexedDB** del navegador (no hay servidor).
- Redimensionado a **máx. 1600 px** JPEG (~calidad 0.72).
- Límite honesto de origen: **12 MB**; máximo **40** fotos; aviso si el JPEG sigue > 1,5 MB.
- Galería con categoría, fecha, texto, preview y borrar.
- **Sin subida a la nube y sin OCR automático.**
- Service worker caché: `may-cuidado-v14`.



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
