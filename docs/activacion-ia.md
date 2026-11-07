# Activar la IA de OSNews

Este documento dice qué hay hoy y qué falta para que Gemini o Grok respondan de verdad. No declara la IA en vivo: en esta entrega no se ha llamado a esos servicios.

## Qué se comprobó en el repositorio

- `/super-may/` era un centro de apps, redes, lectura de imágenes en el dispositivo y azar. No tenía mesa de temas propios.
- La mesa cerrada está en `/` (`index.html`): país, temas y participantes ya cargados, y citas de X guardadas en los datos de la página. Esa selección se mantiene.
- `/eva/` analiza audio, vídeo, imagen y gestos en el navegador. No tenía chat. La cámara, el micrófono y las fotos siguen sin salir del dispositivo.
- `/#hablaMay` intentaba un puente en el puerto 8090 solo si la página se abría en el propio ordenador. No hay `may_server.py` en el repositorio. Si el puente no responde, MAY usaba frases guardadas en la página. El cuadro cortaba a 600 caracteres y, por encima de 280, resumía el texto sin decir que iba a hacerlo.
- Asdrúbal conversa en `/asdrubal/`. La ficha para instalar la app está en `/asdrubal/app/` y no es otro chat. El motor de poemas es local.
- No se han leído ni buscado claves ya existentes. No hace falta pegar secretos en el chat.

## Arquitectura

Las páginas siguen siendo estáticas. El puente nuevo es `server/osnews_bridge.py` (solo biblioteca estándar de Python).

El navegador envía texto únicamente cuando la persona pulsa enviar o pedir respuesta. No manda fotos, audio ni cámara.

Las claves, si se configuran, viven en el entorno del proceso:

- `GEMINI_API_KEY` para Gemini. La petición usa la cabecera `x-goog-api-key`, no la URL.
- `XAI_API_KEY` para Grok. La petición usa `Authorization`, no la URL.

Modelos opcionales: `GEMINI_MODEL` (por defecto `gemini-2.5-flash`) y `XAI_MODEL` (por defecto `grok-3`). El nombre por defecto no demuestra que el modelo responda.

MAY, Eva y Asdrúbal son personajes. Gemini y Grok son proveedores. Si varios personajes usan Gemini, no son inteligencias independientes. La respuesta lo dice.

Un texto de Asdrúbal es un borrador de IA. No se atribuye a Pedro como autor salvo que él marque la casilla de aprobación en la mesa.

## Estados

| Estado | Cuándo |
| --- | --- |
| Configuración pendiente | La página no tiene `OSNEWS_IA_BASE`, o al servidor le falta la variable del proveedor. |
| Desconectado | Hay clave pero nadie ha verificado el servicio, el servicio falla o no devuelve texto. |
| Conectado | Una llamada de verificación o una charla real ha devuelto texto del proveedor. |
| Importado por el usuario | Alguien pegó la respuesta, con fuente, fecha y enlace. La corrección editorial va aparte y no cambia la cita. |

Una frase de la personalidad local de MAY o de Asdrúbal lleva esa etiqueta. No se presenta como Gemini o Grok. Eva no tiene frases de chat preparadas.

Si una ronda tiene participantes sin respuesta, el guion dice que el debate está incompleto.

## Límites y abuso

- Cada texto admite 40000 caracteres. 20000 pasan enteros. Por encima, la petición se rechaza y no se recorta.
- El contexto de una ronda admite 120000 caracteres, con el mismo criterio.
- Como máximo 30 turnos por petición.
- 20 peticiones POST cada 10 minutos por dirección (ajustable con `OSNEWS_RATE_LIMIT` y `OSNEWS_RATE_WINDOW`).
- CORS solo para los orígenes de `OSNEWS_CORS_ORIGINS`, separados por comas, más `http://localhost` y `http://127.0.0.1` con puerto. No se usa `*`.
- El registro anota ruta, estado y longitud. No anota el texto ni la clave.

## Cómo quedará en público, sin el localhost del visitante

La web estática y el puente pueden ir juntos o separados. No hace falta un túnel en el ordenador de quien visita.

1. Servicio único (lo más simple). Un HTTPS sirve las páginas y `/api/salud`. Misma origen: `OSNEWS_CORS_ORIGINS` puede quedar vacío. En `ia/config.js`, `window.OSNEWS_IA_BASE` puede quedar vacío si las páginas se sirven desde ese mismo host; si se abren desde otro sitio, pon la URL `https://` del puente.
2. Páginas en GitHub Pages y puente en otro HTTPS. En el servidor: `OSNEWS_CORS_ORIGINS=https://osnewspedrosg-glitch.github.io`. En `ia/config.js`: `window.OSNEWS_IA_BASE = 'https://tu-puente';` sin barra final y sin claves.

Si la plataforma define `PORT`, el puente escucha en `0.0.0.0` y en ese puerto. En local, sin `PORT`, escucha en `127.0.0.1:8090`. Eso solo aplica a quien ejecuta el puente, no a la web pública.

TLS: lo termina el alojamiento, o se indican ficheros ya emitidos con `OSNEWS_TLS_CERT` y `OSNEWS_TLS_KEY`. No se generan certificados aquí.

Arranque:

```bash
python3 server/osnews_bridge.py
```

Comprobación sin clave (tiene que decir configuración pendiente, no un texto de personaje):

```bash
curl -sS http://127.0.0.1:8090/api/salud
```

Cuando la clave esté solo en el entorno del servidor, una verificación real es:

```bash
curl -sS -X POST http://127.0.0.1:8090/api/salud/verificar \
  -H 'Content-Type: application/json' \
  -d '{"proveedor":"gemini"}'
```

Hasta que esa llamada devuelva `"estado":"conectado"` y un texto que haya salido del servicio, la interfaz debe seguir en configuración pendiente o desconectado. No se ha hecho esa llamada en esta entrega.

Detrás de un proxy, `OSNEWS_TRUST_PROXY=1` para leer la dirección de `X-Forwarded-For`. Sin eso, el límite cuenta la conexión directa.

## Qué no hace este cambio

No fusiona, no despliega, no contrata ni activa un plan de pago, no publica en X ni en YouTube, no envía mensajes solos y no modifica la música ni las fichas de redes.
