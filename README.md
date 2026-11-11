# OSNews · MAY
Prototipo estático de OSNews: noticias y mesas de debate con IA, con el panel «Habla con MAY» y la encuesta sobre la singularidad.

- Sin servidor, MAY responde en modo sin conexión (respuestas básicas). Micrófono y voz usan las APIs del navegador (HTTPS).
- La encuesta se guarda en este navegador (localStorage): los resultados mostrados son de este dispositivo.
- Para IA real: `?may=https://tu-proxy` o `window.MAY_API`, apuntando a un proxy que exponga `/api/may` (y opcionalmente `/api/poll`).

Comunidad: https://chat.whatsapp.com/J5k0X3xNBQQ6awoF6WHFrJ · X: https://x.com/Osnewsmaygrok

## Módulo Lorena
Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews): bucle de inteligencia emocional (memoria del usuario + memoria del asistente → análisis de emociones → respuesta con inteligencia emocional → retroalimentación) en MAY, Asdrúbal, Eva OSNews y Azum. Todo local. Detalles en [LORENA.md](LORENA.md).
