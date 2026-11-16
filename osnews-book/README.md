# OSNews Book

Biblioteca para publicar y leer, capítulo a capítulo, los libros de Pedro Sánchez Gómez y su bot de Grok.

**URL prevista (tras fusionar este cambio):** [https://osnewspedrosg-glitch.github.io/osnews/osnews-book/](https://osnewspedrosg-glitch.github.io/osnews/osnews-book/)

Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.

- Biblioteca con portada por libro, índice y lectura por capítulos.
- Modo oscuro y modo claro (se recuerda en este navegador).
- Botón para compartir en X cada libro o capítulo.
- Los capítulos se cargan desde JSON, para ir añadiéndolos uno a uno.
- App estática, gratis, sin anuncios, sin rastreadores y sin claves en el código. Tipografías del sistema, sin recursos externos.

## La saga de Lo Pagán

Cuatro novelas, en este orden, en la biblioteca:

1. **La hija de dos mundos** — prólogo, diez capítulos, epílogo y Epílogo II.
2. **Cartas desde las estrellas** — prólogo, diez capítulos y epílogo.
3. **Los hijos de la Tierra** — prólogo, diez capítulos y epílogo.
4. **Nada se pierde** — prólogo, diez capítulos y epílogo.

## English editions

La biblioteca tiene un selector **Español / English**. La sección inglesa está en `#/en` y sus libros se abren en `#/book/<id>` (los españoles siguen en `#/libro/<id>`):

1. **The Daughter of Two Worlds** — prologue, ten chapters, epilogue and Epilogue II.
2. **Letters from the Stars** — prologue, ten chapters and epilogue.
3. **The Children of the Earth** — prologue, ten chapters and epilogue.
4. **Nothing Is Lost** — prologue, ten chapters and epilogue.

Cada libro inglés lleva `"lang": "en"` y `"pdf"` en `data/books.json`; el PDF está en `assets/pdf/<id>.pdf` y se abre con el botón «Download PDF».

Authors: Pedro Sánchez Gómez (Mar Menor) and his Grok bot.

## Cómo añadir un capítulo

Desde la raíz de este repositorio (o desde `osnews-book/`):

```bash
python3 osnews-book/scripts/add-chapter.py \
  --book la-hija-de-dos-mundos \
  --file /ruta/al/capitulo.md
```

- El archivo puede ser `.md` o `.txt`.
- Si el texto empieza por `# Título`, ese será el título del capítulo. Si no, puedes pasarlo con `--title "Capítulo 12. …"`.
- El identificador se saca del nombre del archivo, o con `--id 12-nuevo-capitulo`.
- Si el id ya existía, el script actualiza ese capítulo; si no, lo añade al índice.

Para importar una carpeta entera:

```bash
python3 osnews-book/scripts/add-chapter.py \
  --book la-hija-de-dos-mundos \
  --import-dir /ruta/a/capitulos
```

Luego hay que subir los JSON nuevos (`data/<libro>/chapters.json` y `data/<libro>/chapters/<id>.json`) al repositorio. Cuando se fusionen en `main`, GitHub Pages los publicará en la URL de arriba.

## Cómo añadir un libro nuevo

1. Crea una carpeta `osnews-book/data/<id-del-libro>/chapters/`.
2. Añade una ficha en `osnews-book/data/books.json` (título, portada, autores, `chaptersIndex`).
3. Pon una portada en `osnews-book/assets/covers/`.
4. Añade capítulos con `scripts/add-chapter.py`.

## Archivos

- `index.html`, `styles.css`, `app.js` — la app.
- `data/books.json` — catálogo de la biblioteca.
- `data/<libro>/chapters.json` — índice de cada libro.
- `data/<libro>/chapters/*.json` — texto de cada capítulo.
- `scripts/add-chapter.py` — herramienta para publicar un capítulo más.
