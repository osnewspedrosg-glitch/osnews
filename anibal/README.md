# Aníbal · navegador OSNews

Página de inicio ligera de OSNews, en [https://osnewspedrosg-glitch.github.io/osnews/anibal/](https://osnewspedrosg-glitch.github.io/osnews/anibal/).

- Bloque de MAY, la presentadora: pregunta «¿Qué noticias quieres saber?» (en 8 idiomas). Si el texto coincide con un canal de país o de idioma, abre esa página de [Canales OSNews](../canales/). Si no, abre una búsqueda de noticias en DuckDuckGo. Atajos a China, India, Marruecos, Cuba, TV World, la versión ligera, el Diccionario y los Libros de [OSNews Museos](../museos/). MAY no da opiniones ni inventa nada: solo dirige.
- Buscador único (v1.2): una palabra da a la vez enlaces oficiales al [Diccionario de la RAE](https://dle.rae.es/), al Diccionario panhispánico de dudas, a sinónimos en WordReference, a las fichas de [OSNews Museos](../museos/) que la contienen (`../museos/?q=`) y a libros gratis (Project Gutenberg y las bibliotecas de Museos). No copia contenido ni hace peticiones (`palabra.js`, pruebas en `palabra.test.mjs`).
- Accesos «X OSNews» ([@Osnewsmaygrok](https://x.com/Osnewsmaygrok)) y «Grok» ([grok.com](https://grok.com/), con la cuenta de cada usuario).
- Sección «Starlink · Conexión a internet satelital» (invitación de Pedro): cita literal de [@grok](https://x.com/grok/status/2121221590281040076) del 13 nov 2026 y el enlace de invitación. Sin rastreadores.
- Tarjeta para X y redes (Open Graph y `summary_large_image`) con la imagen `og-anibal.png` de 1200×630.
- Modo claro u oscuro: sigue el sistema (`prefers-color-scheme`) y, dentro de la app Aníbal, el tema elegido.
- Búsqueda general en [DuckDuckGo](https://duckduckgo.com/) (formulario GET normal, sin rastreador en esta página).
- El buscador OSNews World (`/buscador/`) existe en el material de trabajo, pero todavía no está publicado en GitHub Pages, así que no hay enlace a él.
- Sección destacada «Azum · tu bot personal»: botón [Instala tu bot Azum](https://x.ai/bot/HN5oMXEOftu3wGLT-uD_m) (cada usuario o pequeño negocio usa su propio plan Super Grok Bot; OSNews no paga ni guarda claves) y enlace a la [web de Azum](../azum/).
- Teselas: OSNews TV World, versión ligera, Azum, Canal YouTube OSNews, [YouTube OSNews World](https://www.youtube.com/@OSNewsWorld), Canales OSNews, [OSNews Museos](../museos/), Noticias por país, la app OSNews y [Descargar app Android](https://github.com/osnewspedrosg-glitch/osnews/releases/download/anibal-v1.2/Anibal-OSNews-v1.2.apk).
- Interfaz en 8 idiomas (es, en, fr, de, pt, it, ar con RTL, zh).
- PWA: `manifest.webmanifest`, iconos propios y `sw.js` (solo esta carpeta).
- Sin anuncios, sin rastreadores, sin fuentes externas.

Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.

También enlaza a [Canales OSNews](../canales/). El código del navegador Android está en [anibal-android](../anibal-android/).
