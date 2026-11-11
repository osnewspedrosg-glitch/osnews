# Módulo Lorena

**Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews).**

Programa propio en [`lorena/`](lorena/) (esquema visual del bucle, charla y memorias en vivo). El mismo módulo se usa también en **MAY** (Habla con MAY, `index.html`), **Asdrúbal** (`asdrubal/`), **Eva OSNews** (`eva-osnews/`) y **Azum** (`azum/`, charla guiada):

```
(1) Memoria del historial del usuario ─┐
                                       ├─► (3) analiza con inteligencia y medida de emociones ─► (4) respuesta con inteligencia emocional
(2) Memoria del asistente (MAY…)     ─┘                                                              │
      ▲                                                                                              │
      └──────────────── retroalimentación (1): lo aprendido vuelve a las DOS memorias ◄───────────────┘
```

- **Reglas**: [`lorena/reglas-lorena.json`](lorena/reglas-lorena.json) concentra pesos, umbrales, modos, ayudas (024/112 y 016), el cooldown y los conceptos de detección. `lorena.js` las lee y, si no puede, usa una copia de reserva incluida. Una línea de órdenes, `node lorena/cli.js --mensaje "…" --memoria /tmp/lorena-mem.json --log /tmp/lorena-decision.jsonl`, devuelve la decisión en JSON (el registro no se guarda dentro del repo).
- **Archivo**: `lorena.js` (copias idénticas en `asdrubal/`, `eva-osnews/` y `azum/`; un test lo comprueba). Expone `window.OSN_LORENA`.
- **(1) Memoria del usuario** (`localStorage` `lorena-<app>-usuario-v1`): turnos, tendencia emocional (últimas 40 estimaciones), temas frecuentes (palabras clave, no frases literales) y gustos («me gusta…», «prefiero…»).
- **(2) Memoria del asistente** (`lorena-<app>-asistente-v1`): qué tono funcionó con cada emoción (puntuación −5…+5), notas («Tono «validacion» con tristeza: ayudó») y el último tono usado.
- **(3) Análisis**: léxico español local (alegría, gratitud, calma, sorpresa, tristeza, soledad, enfado, miedo, ansiedad), intensificadores («muy», «muchísimo»), atenuantes, negación («no estoy bien»), erratas frecuentes, ironía, emojis, exclamaciones y mayúsculas → emoción principal y, si encaja, una secundaria, intensidad 0-10 (el 10 queda para malestar extremo) y tendencia respecto al historial (mejora / empeora / estable). El análisis tiene un sesgo cauteloso hacia las señales negativas (un mensaje mixto prioriza la emoción negativa); eso no endurece el tono de la respuesta.
- **Modo Eva / modo Lorena**: lo decide Azum (y, en las demás apps, la misma función compartida `decideMode`) con la actitud del mensaje **y** el historial de las dos memorias. Modo Eva: cercano, afectuoso, de consuelo. Modo Lorena: sereno, objetivo, con los pies en el suelo; reconoce el sentimiento, con calma y respeto, y ayuda a pensar con claridad o a poner límites. Nunca un trato duro. El indicador lo muestra, por ejemplo: «tristeza 6/10 · modo Eva».
- **Lo que se señala**: solo lo que es claramente machismo (desprecio, inferioridad impuesta, control) o maltrato. Un piropo, un poema de amor o una expresión romántica no se señalan por sí solos; solo cuentan si hay insistencia después de un no, desprecio, control o contenido sexual no deseado. Un halago dudoso se marca como «depende del contexto», con una nota respetuosa, nunca una acusación.
- **Actitud machista**: detección local por léxico y patrones (sin etiquetar a la persona). Si aparece, el indicador añade «· actitud machista detectada», se pasa a modo Lorena y la respuesta explica con respeto por qué es un problema, citando la regla de OSNews: todo es válido sin violencia ni ataques personales; la libertad de uno termina donde empieza la de la otra persona. Si hay indicios de violencia o control, se menciona el **016** (España; gratuito, confidencial, no deja rastro en la factura; también WhatsApp **600 000 016** y **016-online@igualdad.gob.es**, datos del Ministerio de Igualdad) y el **112**.
- **Guía para mujeres** (`/lorena/#guia-mujeres`, también desde un enlace en la charla de Azum): se pueden pegar mensajes recibidos de un hombre. El análisis es local, no sale del dispositivo y no se guarda salvo que ella lo elija. Lista señales por categoría (control, celos, aislamiento, insultos/desprecio, amenazas, presión sexual, chantaje emocional, love bombing, vigilancia del móvil/ubicación), con las frases exactas y un nivel: «sin señales claras», «atención», «cuidado» o «peligro». Es orientativa, no una valoración profesional ni jurídica. Muestra siempre el 016 y el 112, y un botón de **salida rápida** que limpia la página.
- **(4) Respuesta**: combina la respuesta de cada app con una apertura según el tono y el modo (validación, calma, ánimo, celebración, gratitud). Si la app ya valida la emoción, no la repite. Si el usuario está mejor que antes, lo nota. Ante malestar fuerte añade una nota amable: hablar con alguien de confianza o un profesional, **024** (atención a la conducta suicida) y **112** (emergencias). Si la app ya da esos números, no se duplican. Solo da forma a respuestas en español. En Azum, un envío produce una sola respuesta: Lorena analiza, Azum elige el papel y el modo, y Lorena solo adapta el tono de esa respuesta. Las decisiones de Azum se pueden consultar en un registro local de la propia charla.
- **Retroalimentación**: tras cada respuesta compara la emoción nueva con la anterior; si mejoró, el tono usado suma un punto en la memoria del asistente; si empeoró, resta. Las señales débiles («ok», «vale») no se guardan.
- **Indicador visible**: «Módulo Lorena · emoción detectada: calma 3/10 · modo Eva» y botón **Borrar memoria Lorena**. Los botones «Olvidar mis datos» / «Olvidar esta charla» también la borran.

## Privacidad y límites
- Todo se queda en el dispositivo. Sin servidor, sin APIs de pago, sin claves. El módulo no hace peticiones de red.
- No contiene datos personales ni médicos de nadie.
- La emoción es una **estimación orientativa por palabras**, no una medición clínica ni un diagnóstico. MAY, Eva, Azum y Asdrúbal son IA.

## Pruebas
- `node --test tests/*.test.mjs eva-osnews/*.test.mjs azum/*.test.mjs`
- Navegador real (Chromium headless, sin red externa): servir la raíz del repo como `/osnews/` (p. ej. `mkdir -p /tmp/s && ln -s "$PWD" /tmp/s/osnews && cd /tmp/s && python3 -m http.server 8799`) y ejecutar `python3 tests/lorena-browser.py http://127.0.0.1:8799/osnews/`.

- El navegador también comprueba el programa propio en `/lorena/`.

## Cómo enchufarlo en otra app
Copia `lorena.js` y sigue la sección del [README](README.md#cómo-enchufar-lorenajs-en-cualquier-app).
