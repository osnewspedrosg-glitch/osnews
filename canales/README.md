# Canales OSNews

Índice: [canales/](./)

- Canales por idioma: [Español](es/), [English](en/), [Français](fr/), [Deutsch](de/), [Português](pt/), [Italiano](it/), [العربية](ar/), [中文](zh/).
- Canales por país: [China](china/) (中文), [India](india/) (English y [हिन्दी](india/hi.html)), [Marruecos](marruecos/) (العربية y [Français](marruecos/fr.html)), [Cuba](cuba/) (español).

En cada canal hay:

- Titulares sobre China, India, Marruecos y Cuba (o sobre ese país, en los canales por país) tomados solo de canales RSS públicos oficiales de medios europeos y de EE. UU. Si el titular no está en el idioma del canal, se indica el idioma. Cada enlace abre el artículo original.
- Vídeos oficiales de YouTube, con inserción ya comprobada, de esos medios europeos y estadounidenses.
- Una sección destacada de **Declaraciones**, con el texto literal y completo de publicaciones reales en X de cuentas oficiales verificadas de políticos de Estados Unidos y Europa (presidentes, primeros ministros, ministros de Exteriores, instituciones de la UE, Parlamento Europeo, Departamento de Estado de EE. UU., embajador de EE. UU. ante la ONU) y de las cuentas oficiales de canales de noticias europeos y estadounidenses. Se muestran el texto exacto, el nombre, el identificador, la fecha (Europe/Madrid) y el enlace a x.com. No se inventa ni se parafrasea. Los falsos positivos se descartan.
- Publicaciones de cuentas oficiales del propio país, también con el texto literal y el enlace al original.
- Un buscador que abre la búsqueda en directo de X en el idioma del canal, y botones estáticos por país filtrados a fuentes oficiales. Esta página no envía la consulta a ningún servidor de OSNews ni usa claves.

Sin retransmisión de señales ajenas, sin scripts de X, sin anuncios, sin rastreadores y sin recogida de datos.

Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.

## Actualización diaria

El flujo de GitHub Actions (`tv-ligera.yml`, 07:00 UTC) vuelve a leer los RSS oficiales y regenera la versión ligera de TV World y estas páginas. No usa claves ni servicios de pago.

Las publicaciones de X se guardan en `posts-x.json` (y las de la versión ligera en `../tv-world/ligera/titulos-x.json`). GitHub Actions no tiene acceso al conector de X, así que esas recogidas las hace la rutina diaria de las 8:00 (Europe/Madrid). Después de actualizar esos JSON, el comando de refresco, desde la raíz del repositorio, es:

```
python3 scripts/actualizar-tv-ligera.py && python3 scripts/actualizar-canales.py --from-ligera
```

Las consultas de X (cuentas oficiales y palabras del país, `-is:retweet -is:reply`) están en `scripts/canales-x-consultas.json`.
