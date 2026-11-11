# Módulo Lorena

**Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews).**

Bucle de inteligencia emocional para **MAY** (Habla con MAY, `index.html`), **Asdrúbal** (`asdrubal/`), **Eva OSNews** (`eva-osnews/`) y **Azum** (`azum/`, charla guiada):

```
(1) Memoria del historial del usuario ─┐
                                       ├─► (3) analiza con inteligencia y medida de emociones ─► (4) respuesta con inteligencia emocional
(2) Memoria del asistente (MAY…)     ─┘                                                              │
      ▲                                                                                              │
      └──────────────── retroalimentación (1): lo aprendido vuelve a las DOS memorias ◄───────────────┘
```

- **Archivo**: `lorena.js` (copias idénticas en `asdrubal/`, `eva-osnews/` y `azum/`; un test lo comprueba). Expone `window.OSN_LORENA`.
- **(1) Memoria del usuario** (`localStorage` `lorena-<app>-usuario-v1`): turnos, tendencia emocional (últimas 40 estimaciones), temas frecuentes (palabras clave, no frases literales) y gustos («me gusta…», «prefiero…»).
- **(2) Memoria del asistente** (`lorena-<app>-asistente-v1`): qué tono funcionó con cada emoción (puntuación −5…+5), notas («Tono «validacion» con tristeza: ayudó») y el último tono usado.
- **(3) Análisis**: léxico español local (alegría, gratitud, calma, sorpresa, tristeza, soledad, enfado, miedo, ansiedad), intensificadores («muy», «muchísimo»), negación («no estoy bien»), emojis, exclamaciones y mayúsculas → emoción e intensidad 0-10, más la tendencia respecto al historial (mejora / empeora / estable).
- **(4) Respuesta**: combina la respuesta de cada app con una apertura según el tono (validación, calma, ánimo, celebración, gratitud). Si la app ya valida la emoción, no la repite. Si el usuario está mejor que antes, lo nota. Ante malestar fuerte añade una nota amable: hablar con alguien de confianza o un profesional, **024** (atención a la conducta suicida) y **112** (emergencias). Si la app ya da esos números, no se duplican. Solo da forma a respuestas en español.
- **Retroalimentación**: tras cada respuesta compara la emoción nueva con la anterior; si mejoró, el tono usado suma un punto en la memoria del asistente; si empeoró, resta.
- **Indicador visible**: «Módulo Lorena · emoción detectada: calma 3/10» y botón **Borrar memoria Lorena**. Los botones «Olvidar mis datos» / «Olvidar esta charla» también la borran.

## Privacidad y límites
- Todo se queda en el dispositivo. Sin servidor, sin APIs de pago, sin claves. El módulo no hace peticiones de red.
- No contiene datos personales ni médicos de nadie.
- La emoción es una **estimación orientativa por palabras**, no una medición clínica ni un diagnóstico. MAY, Eva, Azum y Asdrúbal son IA.

## Pruebas
- `node --test tests/*.test.mjs eva-osnews/*.test.mjs azum/*.test.mjs`
- Navegador real (Chromium headless, sin red externa): servir la raíz del repo como `/osnews/` (p. ej. `mkdir -p /tmp/s && ln -s "$PWD" /tmp/s/osnews && cd /tmp/s && python3 -m http.server 8799`) y ejecutar `python3 tests/lorena-browser.py http://127.0.0.1:8799/osnews/`.
