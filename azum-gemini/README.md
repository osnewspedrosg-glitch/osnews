# Azum · puente Gemini (cerrado por defecto)

La vía para no gastar es la IA en el propio navegador (`azum/local-ai.js`). La descarga del modelo empieza solo después del consentimiento. El puente Gemini de abajo sigue cerrado.

Este directorio es el puente personal de Azum hacia la API de Gemini. La página publicada en GitHub Pages sigue siendo la demostración local de trece papeles. No llama a Gemini.

El puente no está conectado a una cuenta real en este repositorio. `connected` y `verifiedAccount` se quedan en `false`. Una prueba con simulación o con un sustituto de red no demuestra que la cuota gratuita esté activa.

## Qué hace

- Escucha solo en `127.0.0.1` o `::1`. Una dirección pública se ignora y cierra la llamada.
- La clave, si existe, se lee del entorno o de `azum-gemini/.env`. No entra en el JavaScript de la página, ni en la URL, ni en el registro del proceso.
- Cada turno exige consentimiento y una contraseña de puente de al menos 16 caracteres. Esa contraseña no es la clave de Gemini.
- No guarda el chat en disco. El historial vive en la memoria del navegador y se reenvía solo si la persona vuelve a enviarlo.
- Limita a 5 peticiones por minuto y 30 por día, como máximo 10 y 50. Corta la llamada a Google a los 15 segundos.
- El único modelo aceptado es `gemini-2.5-flash`, sin búsqueda, mapas, código ni otras herramientas.
- Antes de cada llamada real reserva un importe en `AZUM_BUDGET_LEDGER`. El tope por defecto es 30,00 EUR por mes natural de Madrid y no se puede configurar por encima. Si la contabilidad no se puede leer, la llamada no sale.

## Tope de 30 EUR

No existe, en la documentación consultada, un tope duro de 30 EUR que cierre toda la factura de Google.

- Una alerta de presupuesto de Cloud Billing avisa y no corta el gasto.
- Un spend cap de Cloud Billing, también disponible para la Gemini API (`generativelanguage.googleapis.com`), pausa el uso nuevo de ese servicio en un solo proyecto cuando el coste bruto estimado pasa del importe. La documentación dice que la pausa no es instantánea, que las peticiones ya en curso se cobran y que el exceso por el retraso se factura. El periodo es el mes natural. No cubre otros servicios, otros proyectos, suscripciones, hosting ni impuestos. Google lo documenta en dólares de tarifa, no como una garantía de 30 EUR.
- El tope de nivel de la cuenta de facturación es de 250 USD en Tier 1, sube solo al pasar de nivel, y exige tener facturación vinculada. No es un tope de 30 EUR.
- Prepay de AI Studio, según el anuncio de Google, vende crédito en cuentas nuevas de EE. UU. y puede recargar solo. No es un techo de 30 EUR y no se activa aquí.
- Apagar la facturación con una notificación llega tarde y puede borrar recursos. Tampoco garantiza 30 EUR.

La contabilidad de este puente es otra cosa, y sí corta sus propias llamadas:

- Mes natural de `Europe/Madrid`.
- Precio de pago de `gemini-2.5-flash`: 0,30 USD por millón de tokens de entrada y 2,50 USD por millón de salida, pensamiento incluido, aunque el modo sea el gratuito.
- Cuenta 1 USD como 1 EUR y suma un 21 % de margen. No consulta el tipo de cambio ni el IVA real.
- Reserva, con bloqueo de fichero, hasta 512 tokens de salida y 1024 de pensamiento. Si Google no devuelve el uso, la reserva se queda. Si lo devuelve, se ajusta al uso, también cuando es mayor que la reserva.
- Varias peticiones a la vez no pueden reservar por encima del tope. Un fichero ilegible o un bloqueo agotado cancelan la llamada.
- Borrar el fichero pone el contador de este proceso a cero. Eso no borra un cargo de Google.

Hosting, otras claves, otros proyectos, AI Studio usado a mano y el retraso de un spend cap de Google quedan fuera. El modo de pago permanece apagado hasta que exista un control de gasto concreto y Pedro lo apruebe. Las variables `AZUM_PAID_MODE`, `AZUM_PAID_SETUP_APPROVED` y `AZUM_SPEND_CONTROLS_CONFIRMED` no encienden llamadas.
- Si Google responde 429, el mensaje dice que la cuota gratuita está agotada. No hay otro modelo ni un plan de pago de respaldo.
- Crisis, urgencia, medicación y pagos se responden en local y no se transmiten.

## Reglas consultadas el 7 de noviembre de 2026

Fuentes: [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms) (efectivas el 23 de marzo de 2026), [precios](https://ai.google.dev/gemini-api/docs/pricing) y [límites](https://ai.google.dev/gemini-api/docs/rate-limits) (página actualizada el 28 de octubre de 2026).

- El nivel gratuito sigue figurando para la entrada y la salida estándar de `gemini-2.5-flash` como «Free of charge». Varios modelos nuevos figuran como no disponibles en ese nivel. Los límites concretos de cada proyecto se ven en AI Studio; no son una cifra fija en la documentación. El límite diario se reinicia a medianoche, hora del Pacífico.
- Pasar de Free a Tier 1 exige vincular una cuenta de facturación. Tier 1 tiene un tope de gasto y puede generar cargos. Este puente no hace ese vínculo.
- Una suscripción de consumo Gemini Plus no es crédito de la API.
- En la cuota no pagada, fuera del EEE, Suiza y el Reino Unido, Google puede usar el contenido para mejorar sus productos y personas revisoras pueden leerlo. Dentro de esas regiones, el apartado de datos de Paid Services se aplica también a la cuota no pagada.
- Las condiciones dicen que un cliente de API ofrecido a personas del EEE, Suiza o el Reino Unido solo puede usar Paid Services. El personal del foro de Google indicó que activar Cloud Billing pasa el proyecto a Tier 1 y que la IP es la señal principal de ubicación. Este puente se cierra para esas regiones porque cumplir esa condición exigiría facturación, y esta autorización la prohíbe.
- La API no es para consejo médico. Azum sigue siendo reflexión emocional. MAY HEALTH permanece en borrador.

## Arranque local

```bash
node --test azum-gemini/test.mjs
cp azum-gemini/.env.example azum-gemini/.env
node azum-gemini/server.js
```

Abre `http://127.0.0.1:8787/osnews/azum/`. La página de `github.io` no debe usarse como cliente del puente: el panel se queda inactivo fuera de loopback.

## Para una llamada real, todavía falta

1. En Google AI Studio, comprobar con tus ojos que el proyecto está en Free y que no tiene una cuenta de facturación vinculada. Este programa no puede comprobarlo.
2. Si la cuenta o la IP están en España, el EEE, Suiza o el Reino Unido, no continúes: no actives facturación para saltarte el cierre.
3. Crear una clave de API en ese proyecto gratuito y ponerla solo en `azum-gemini/.env` como `GEMINI_API_KEY`.
4. Poner `GEMINI_FREE_TIER_CONFIRMED=yes`, `GEMINI_BILLING_LINKED=no`, `AZUM_OPERATOR_REGION` con un código verdadero que no sea del EEE, `AZUM_GATE_SECRET` de 16 caracteres o más, `AZUM_BUDGET_LEDGER` en una ruta local que no se borre, `AZUM_MONTHLY_BUDGET_EUR` en 30 o menos y `AZUM_GEMINI_MODE=free`.
5. Arrancar el servidor y enviar un turno después de marcar el consentimiento.
6. Si la respuesta habla de cuota, región, facturación o del tope local, parar. No vincular una tarjeta, no crear un spend cap desde este repositorio y no cambiar de modelo.

No despliegues este proceso en un hosting público. No hay proxy anónimo y no debe haberlo.
