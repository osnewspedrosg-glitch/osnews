# OSNews TV World · versión ligera

Página de solo texto para conexiones lentas: [ligera/](./) (y [versión completa](../)).

- Titulares tomados solo de canales RSS públicos oficiales. Cada titular enlaza al artículo original y muestra la fuente y la fecha (Europe/Madrid). No se inventan titulares ni se presenta una traducción automática como si fuera el texto de la fuente.
- Si un idioma no tiene canal oficial, se muestra el canal oficial más cercano, etiquetado.
- «Noticias por país» (China, India, Marruecos, Cuba) filtra esos titulares. También incluye, cuando aparecen en el titular, medios europeos y estadounidenses con RSS oficial (BBC, The New York Times, The Washington Post, NPR, El País, Le Monde, The Guardian, DW, Euronews, France 24).
- El bloque de X cita publicaciones reales de las cuentas oficiales de esos medios (extracto, cuenta, fecha y enlace a x.com). No hay scripts ni incrustaciones de X.
- Sin vídeos, sin rastreadores, sin fuentes externas y sin recogida de datos.
- Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.

Actualización: el flujo programado de GitHub Actions (`tv-ligera.yml`, 07:00 UTC) vuelve a leer los RSS y regenera estas páginas, sin claves ni servicios de pago. Las publicaciones de X se guardan en `titulos-x.json` y las actualiza la rutina diaria de las 8:00 (Europe/Madrid), porque Actions no tiene acceso a X.

Para regenerar en local, desde la raíz del repositorio:

```
python3 scripts/actualizar-tv-ligera.py
```
