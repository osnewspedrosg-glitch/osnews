# Chat del debate OSNews

Página pública, en español y pensada para el móvil, del debate
[Abuso sexual infantil: ¿derechos del condenado o salud de la víctima? Castración química · OSNews](https://youtu.be/WIaD2qZXLiQ).

Dirección prevista en GitHub Pages, cuando se fusione este cambio:

https://osnewspedrosg-glitch.github.io/osnews/chat-debate/

MAY modera sin opinar. Norma visible: «Todo vale sin violencia ni ataques personales».
Ayuda: 016 · 112 · ANAR 116 111.
Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.

## Qué hace ya la página

- Incrusta el vídeo de YouTube.
- Muestra la pregunta, la norma de la mesa y los teléfonos de ayuda, con enlaces oficiales.
- Deja listas la votación pública (A / B / C) y el chat, con recuento compartido.
- Incluye el contador anónimo de visitas y de uso (GoatCounter, cuenta osnews-may), igual que el resto de apps MAY. En local no se envían visitas.
- No incluye claves, ni servicios de pago, ni PayPal.

## Qué falta (lo tiene que activar Pedro, sin coste)

El chat y el recuento público usan [giscus](https://giscus.app), que se apoya en
GitHub Discussions. Es gratis. Hoy el repositorio `osnewspedrosg-glitch/osnews`
tiene las Discusiones desactivadas y la aplicación giscus no está instalada.
Hasta que eso cambie, la página lo explica y envía a los comentarios de YouTube.

Pasos, en este orden:

1. En el repositorio, activar **Discussions** (Settings → General → Features).
2. Instalar la aplicación gratuita [giscus](https://github.com/apps/giscus) solo en este repositorio.
3. En [giscus.app](https://giscus.app) elegir el repositorio, una categoría (por ejemplo «General» o una nueva llamada «Debates»), idioma español, reacciones activas y «Emit discussion metadata».
4. Copiar `data-category` y `data-category-id` en `app.js` (`GISCUS.category` y `GISCUS.categoryId`) y abrir otro PR, o pedir que se actualice este. No hace falta ninguna clave en el código.
5. Opcional: crear también una encuesta nativa de GitHub Discussions con las mismas tres opciones, como respaldo del recuento.

Mapeo de la votación, cuando giscus esté activo:

- 👍 = A) Primero, los derechos del condenado
- ❤️ = B) Primero, la salud de la víctima
- 🎉 = C) Las dos cosas a la vez

## Limitación

Para comentar o votar en esta página hace falta una cuenta de GitHub. Quien no la tenga puede participar en los comentarios del vídeo de YouTube: https://youtu.be/WIaD2qZXLiQ
