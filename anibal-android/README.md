# Aníbal · navegador OSNews (Android)

Navegador ligero con la WebView del sistema. La página de inicio es [Aníbal](https://osnewspedrosg-glitch.github.io/osnews/anibal/).

- Barra de direcciones: URL o búsqueda en DuckDuckGo
- Atrás, adelante, recargar e inicio
- Descargas con DownloadManager; `tel:`, `mailto:` e `intent:` se abren en el sistema
- JavaScript y almacenamiento DOM activados
- Novedades 1.2:
  - «Compartir en X»: abre el post oficial de X (`x.com/intent/post`) con el título y el enlace de la página; publica quien lo use. Si no está la app de X, se abre la web de X dentro de Aníbal
  - «Grok»: abre la app de Grok si está instalada o grok.com dentro de Aníbal, con la cuenta de cada usuario. Sin claves ni costes
  - Aníbal aparece como navegador en «Abrir con» para enlaces http/https (también x.com y twitter.com) y acepta enlaces o textos compartidos (ACTION_SEND text/plain)
  - Modo oscuro: según el sistema, claro u oscuro (botón «Tema»), guardado en el móvil. Las páginas de OSNews siguen el tema de Aníbal
  - Marcadores («☆ Marcar», «Marcadores», mantener pulsado para quitar) e historial («Historial», «Borrar historial»), guardados solo en el almacenamiento privado de la app; no se envían a ningún sitio y no hay copia en la nube (`allowBackup=false`)
- Sin anuncios ni rastreadores
- Permisos: INTERNET y, solo en Android 8 o anterior, almacenamiento para descargas

Paquete: `com.osnews.anibal` · minSdk 24 · versión 1.2

La APK firmada se publica en [Releases](https://github.com/osnewspedrosg-glitch/osnews/releases/tag/anibal-v1.2). El almacén de claves no está en este repositorio. `./build.sh test` ejecuta solo las comprobaciones Java de la lógica (enlace de X, enlaces compartidos, historial, marcadores, tema).

Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.
