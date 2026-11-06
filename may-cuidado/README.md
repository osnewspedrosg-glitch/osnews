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

`index.html` · `styles.css` · `app.js` · `manifest.json` · `service-worker.js` (caché **may-cuidado-v6**)

## Aviso

Seguimiento personal · No es diagnóstico médico.

## Fotos locales (Salud + Money)

- Captura o sube con `accept="image/*"` y `capture="environment"`.
- Se guarda en **IndexedDB** del navegador (no hay servidor).
- Redimensionado a **máx. 1600 px** JPEG (~calidad 0.72).
- Límite honesto de origen: **12 MB**; máximo **40** fotos; aviso si el JPEG sigue > 1,5 MB.
- Galería con categoría, fecha, texto, preview y borrar.
- **Sin subida a la nube y sin OCR automático.**
- Service worker caché: `may-cuidado-v6`.



## Salud (Enfermera · Agente Salud)

- Recetas mediterráneas fáciles + botón enviar ingredientes a Money
- Menú semanal sencillo (no nutrición médica)
- Análisis clínicos: fecha, nombre, prueba, valor, unidad, nota (localStorage + export)
- Consejos orientativos según datos registrados (no diagnóstico)
- Samsung Health: importar CSV/JSON (sin conexión web general)
- Fotos: análisis, receta médica, informe médico

## OCR local
Tesseract.js (CDN): extracción conservadora + campos editables + confirmación antes de guardar. No inventa datos.
