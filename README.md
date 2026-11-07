# OSNews · MAY
Prototipo estático de OSNews: noticias y mesas de debate con IA, con el panel «Habla con MAY» y la encuesta sobre la singularidad.

- Sin puente verificado, MAY y Asdrúbal usan la personalidad local de la página y lo dicen. Eva no tiene frases de chat preparadas. Micrófono y voz usan las APIs del navegador.
- La encuesta se guarda en este navegador (localStorage): los resultados mostrados son de este dispositivo. Si el puente está conectado, el recuento es solo de esa instancia.
- La IA de verdad va por `server/osnews_bridge.py` y `ia/config.js` (`OSNEWS_IA_BASE`, URL HTTPS, sin claves). Pasos y lo que falta: `docs/activacion-ia.md`. El parámetro `?may=1` solo abre el chat; no es una dirección de API.

Comunidad: https://chat.whatsapp.com/J5k0X3xNBQQ6awoF6WHFrJ · X: https://x.com/Osnewsmaygrok
