# Formato JSON «sensor futuro MAY Sobria»

Versión 1. Documentado para que un dispositivo real pueda alimentar MAY más adelante.

**Aviso:** el parche detector es un concepto; hoy no existe. Este formato no genera lecturas. No se incluyen datos de ejemplo presentados como reales. Orientativo, consulta a tu médico. Un positivo debe confirmarlo un médico; algunos medicamentos pueden dar un falso positivo.

Sin un servidor, la identidad de un profesional que emita un código **no está verificada de forma criptográfica**. Una versión futura con el servicio de salud podría añadir firma digital.

## Identificación

- `formato`: siempre la cadena `may-sobria-sensor`
- `version`: número entero (ahora `1`). Una versión mayor no reconocida se rechaza con un aviso claro.
- `aviso`: texto honesto, por ejemplo `concepto, sin dispositivo real`.
- `origen`: `profesional` (introducido por el profesional de la unidad) o `sensor-futuro` (dispositivo, cuando exista).

## Profesional (si `origen` es `profesional`)

```json
"profesional": {
  "centro": "nombre del centro o unidad",
  "nombre": "nombre del profesional",
  "colegiado": "número de colegiado, opcional"
}
```

## Muestras

`muestras` es una lista. Cada elemento:

- `fecha`: `AAAA-MM-DD` o `AAAA-MM-DDTHH:MM`
- `tipo`: `orina` | `saliva` | `sangre` | `parche de sudor` | `alcoholímetro` | `otro`
- `resultados`: objeto cuyas claves son exactamente estas 12 sustancias, y el valor `negativo`, `positivo` o `no analizado`:
  - alcohol, cocaína, cannabis, heroína/opiáceos, fentanilo, metadona, anfetaminas, MDMA, metanfetamina, benzodiacepinas, ketamina, cannabinoides sintéticos
- `nota`: texto opcional

También se acepta `sustancias` como lista de `{ "nombre": "...", "resultado": "..." }`.

## Cómo llega a MAY

1. El profesional genera el JSON (página `profesional.html` o `python3 profesional.py`) y un código `MAY1:` + Base64 del JSON.
2. La persona lo pega o lo importa en MAY. Las entradas quedan con origen `profesional` o `sensor-futuro`, muestran quién las introdujo y no se pueden editar; solo se pueden ocultar en los resúmenes.
3. Un autotest casero se anota aparte, claramente etiquetado, y no sustituye una prueba profesional.

Los resúmenes compartidos con médico, centro, familia o bot de apoyo **solo incluyen estas pruebas si la persona lo marca expresamente**.
