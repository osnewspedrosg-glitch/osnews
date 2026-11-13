# OSNews · MAY
Prototipo estático de OSNews: noticias y mesas de debate con IA, con el panel «Habla con MAY» y la encuesta sobre la singularidad.

- Sin servidor, MAY responde en modo sin conexión (respuestas básicas). Micrófono y voz usan las APIs del navegador (HTTPS).
- La encuesta se guarda en este navegador (localStorage): los resultados mostrados son de este dispositivo.
- Para IA real: `?may=https://tu-proxy` o `window.MAY_API`, apuntando a un proxy que exponga `/api/may` (y opcionalmente `/api/poll`).

Comunidad: https://chat.whatsapp.com/J5k0X3xNBQQ6awoF6WHFrJ · X: https://x.com/Osnewsmaygrok

## Módulo Lorena
Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews): bucle de inteligencia emocional (memoria del usuario + memoria del asistente → análisis de emociones → respuesta con inteligencia emocional → retroalimentación) en MAY, Asdrúbal, Eva OSNews y Azum. Todo local. Detalles en [LORENA.md](LORENA.md).


## Programa propio del Módulo Lorena
Página independiente, en [lorena/](lorena/): cualquiera puede escribir y ver el análisis (las dos memorias, las 9 emociones, la intensidad 0–10, la tendencia, el modo Eva o Lorena y la respuesta). Incluye la [Guía para mujeres](lorena/#guia-mujeres) y el archivo de reglas [lorena/reglas-lorena.json](lorena/reglas-lorena.json). Línea de órdenes: `node lorena/cli.js --mensaje "…" --log /tmp/lorena-decision.jsonl`. Todo local.

## Cómo enchufar `lorena.js` en cualquier app
`lorena.js` (en la raíz de este repo) es una librería reutilizable, sin dependencias y sin llamadas de red. Se puede copiar tal cual a otro proyecto.

```html
<script src="lorena.js"></script>
<script>
  // Una instancia por app: las memorias se guardan en este dispositivo
  // (localStorage lorena-<app>-usuario-v1 y lorena-<app>-asistente-v1).
  const lo = OSN_LORENA.create({
    app: "mi-app",          // prefijo único
    assistant: "MiAsistente"
  });

  // Indicador «Módulo Lorena · emoción detectada: …» y botón de borrar
  lo.mount(document.getElementById("lorena"), {
    buttonText: "Borrar memoria Lorena"
  });

  // Tras cada mensaje del usuario: analiza, da forma a tu respuesta y aprende
  const out = lo.respond(textoDelUsuario, respuestaBaseDeTuApp);
  mostrar(out.text);
  // out.analysis.emotion, .intensity (0–10), .trend (mejora|empeora|estable), .scores
  // out.tone  —  out.note (024/112 si el malestar es fuerte)
</script>
```

También funciona en Node o en un test: `const L = require("./lorena.js")`. `L.analyzeText(texto, historial)` analiza sin guardar memoria. Crédito: **Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews)**.

## Aníbal · navegador OSNews
Página de inicio ligera, en [anibal/](anibal/): MAY pregunta qué noticias quieres saber y te lleva al canal de OSNews o a una búsqueda de noticias, más búsqueda general en DuckDuckGo, accesos a TV World, Canales OSNews, Azum (web y bot personal), noticias por país, el canal de YouTube OSNews y [YouTube OSNews World](https://www.youtube.com/@OSNewsWorld), en 8 idiomas. Se puede instalar como PWA. También hay un [navegador Android](https://github.com/osnewspedrosg-glitch/osnews/releases/download/anibal-v1.2/Anibal-OSNews-v1.2.apk) (código en [anibal-android](anibal-android/)). Sin anuncios ni rastreadores.

## Canales OSNews
Canales de noticias en [canales/](canales/): ocho idiomas (español, inglés, francés, alemán, portugués, italiano, árabe y chino) y un canal por país — [China](canales/china/) (中文), [India](canales/india/) (English y हिन्दी), [Marruecos](canales/marruecos/) (العربية y Français) y [Cuba](canales/cuba/) (español). Titulares de medios oficiales europeos y de EE. UU., vídeos oficiales insertables, una sección de Declaraciones con el texto literal de posts reales en X y un buscador hacia X. Sin anuncios ni rastreadores. Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.

## OSNews Museos
Página de cultura en [museos/](museos/): museos de Europa y de Estados Unidos, galerías de arte, Instituto Cervantes, diccionarios de la lengua española y libros electrónicos de fuentes legales (dominio público o préstamo de biblioteca). Enlaces oficiales a visitas virtuales y colecciones. Interfaz en 8 idiomas. Sin anuncios ni rastreadores. Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.

