# El Ladrón · Maquinita 1980

Recreación web de una maquinita LCD de los años 80, al estilo Game & Watch: el ladrón entra desde la calle, cruza los chalets y el pasillo, esquiva perros y policías y entra en la casa a llevarse el botín.

App web estática (sin servidor, sin claves, sin coste).

## Cómo se juega
- 3 carriles y 8 pasos: calle → chalets → pasillo (perros y policías) → puerta → botín.
- Cada paso (arriba, abajo, izquierda o derecha) gasta 1 de 100 movimientos.
- 5 vidas. Si un perro o un policía te atrapa, pierdes una vida y vuelves a la calle.
- Si llegas al botín, sumas 100 puntos por el nivel (cada robo vale más que el anterior) y los enemigos se vuelven más rápidos.
- La partida termina al quedarte sin vidas o sin movimientos.
- El récord se guarda en este dispositivo (localStorage).
- Controles: flechas del teclado o los botones grandes de la maquinita (pensados para dedos en un Lenovo o un móvil).
- Pitidos cortos al estilo LCD (Web Audio), sin música, con botón de silencio.
- Interfaz en español, con botón para pasar al inglés.

## Archivos
`index.html`, `style.css`, `game.js`, `icon.svg`, `manifest.webmanifest`. Capturas en `capturas/` (no van en el paquete).

## Contadores
GoatCounter `osnews-may`: visita automática al cargar la página, más eventos `ladron-uso-partida`, `ladron-uso-botin`, `ladron-uso-fin`, `ladron-idioma-es` / `ladron-idioma-en`.
El número de visitas visible usa `https://osnews-may.goatcounter.com/counter/<ruta>.json`: solo funciona si en GoatCounter está activado el contador público; si no, muestra «No disponible». En localhost también muestra «No disponible», para no inflar las cifras.

## Estado
NO publicada. Pendiente del sí de Pedro.

Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok
