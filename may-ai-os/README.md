# MAY AI OS

**1 usuario, 1 IA, 1 memoria, 1 programa.**

Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok

MAY es una aplicación de escritorio en Python: una inteligencia personal que vive en tu aparato. Tú eliges el nombre, conectas tu propio bot para charlar, y MAY se encarga de los hábitos, las emociones, las notas y los juegos. Toda la memoria se queda en el ordenador, cifrada.

## Qué hace

- Te pregunta el nombre la primera vez y te saluda por tu nombre.
- Cada persona conecta su **bot personal** para charlar (enlace o clave de API propia).
- **EVA** lleva los hábitos de cada día y recordatorios sencillos.
- **Rueda de emociones**: 8 emociones con 3 intensidades. Se guardan con fecha y hora.
- Al arrancar, MAY mira cómo te has sentido (últimas 24 horas) y, si hace falta, te acompaña con calma. Si anotaste tristeza o miedo con intensidad 3, menciona el **024** (línea de atención a la conducta suicida en España) y el **112** como orientación, no como diagnóstico.
- **Notas** y memoria local en el propio aparato.
- **Panel**: hábitos de hoy, últimas emociones, número de notas, tendencia de los juegos y comprobaciones de mayores pendientes.
- **Modo mayores**: comprobaciones de seguridad y medicación (fuego, azúcar, puerta, agua, grifo, tensión) y **juegos** de estimulación. Ver más abajo.
- **Juegos** (Modo mayores): ejercicios cortos de estimulación cognitiva, con calma, sin castigo.
- **Exportar**: copia cifrada, o copia en claro solo si lo confirmas escribiendo `SÍ`.

## Privacidad: dos memorias distintas

La memoria local de MAY y la del modelo (tu bot) están **separadas**.

- Al chatear, MAY **solo envía el mensaje actual** a tu bot. No manda notas, emociones, hábitos, familiares ni conversaciones anteriores.
- Si quieres compartir algo concreto con el bot, escríbelo tú: `comparte <texto>`.
- El PIN, la clave de cifrado y `MAY_API_KEY` **nunca van en el código ni en un archivo de texto plano**. El PIN no se guarda: solo se guarda un salt aleatorio, y con él se deriva la clave cada vez que abres MAY.

## Cifrado

La primera vez, MAY te pide un PIN (mínimo 4 caracteres, con `getpass` para que no se vea en pantalla). Con ese PIN y un salt aleatorio se deriva una clave (PBKDF2-SHA256) y se cifra toda la memoria con Fernet. El archivo es `data/memory.may`.

Si el PIN es incorrecto, MAY lo dice claro y **no toca los datos**.

Si olvidas el PIN, no se podrá leer la memoria. No hay puerta trasera.

## Modo mayores: seguridad y medicación

Se activa con `modo mayores`. MAY te pregunta, con calma y en frases sencillas:

- ¿Has apagado el fuego/la cocina?
- ¿Has tomado la medicación del azúcar?
- ¿Has cerrado la puerta con llave?
- ¿Has bebido agua?
- ¿Has cerrado el grifo?
- ¿Has tomado la pastilla de la tensión?

Responde `sí` o `no` (también `sí 1` / `no 2`). Si dices que no, te lo vuelve a preguntar al abrir MAY otra vez, o al cabo de unos 15 minutos. Las respuestas se guardan **cifradas** en este aparato.

- `mayores` — ver la lista y cómo van.
- `recordar 09:00 pastilla del azúcar` — añadir o poner hora a un recordatorio.
- `quitar 1` — quitar uno de la lista.

Al arrancar y en el `panel` aparecen solo los que tocan ahora.

> **Recordatorios orientativos, consulta a tu médico. Emergencias: 112.**

## Juegos de estimulación (Modo mayores)

Sesiones cortas de 5 ejercicios, con letra clara y tono sereno. Nunca se dice «¡mal!»: si no sale, hay una pista, se puede intentar otra vez o saltar.

Incluyen:

- Orientación: qué día de la semana es hoy, en qué estación estamos (según la fecha real).
- Completar refranes españoles.
- Memoria de 3 palabras (verlas, una pregunta breve, recordarlas).
- Categorías: cuál no encaja (por ejemplo, cuál no es una fruta).
- Cálculo sencillo con monedas y euros.
- Secuencias cotidianas (ordenar los pasos de hacer un café, lavarse las manos…).
- Recordar nombres de familiares que la persona apunta antes: `familia añadir Ana hija`.

La puntuación se guarda **en privado**, cifrada, para que quien te acompaña vea la tendencia en el `panel`. Es orientativa.

> **Juegos de estimulación, no sustituyen tratamiento; orientativo, consulta a tu médico.**

## Cómo arrancarlo

Hace falta Python 3.10 o posterior.

```bash
cd may-ai-os
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

Si tu sistema ya tiene las dependencias, basta con `pip install -r requirements.txt` y `python3 app.py`.

La primera vez te pedirá un PIN y tu nombre. Después, el PIN al abrir y el menú:

`[Chat] [Hábitos] [Emociones] [Memoria] [Automatizaciones] [Panel] [Juegos] [Mayores]`

Escribe `ayuda` para ver todos los comandos. Para salir: `salir`.

### Variables de entorno

| Variable     | Para qué sirve |
|--------------|----------------|
| `MAY_API_KEY` | Clave de API de **tu** bot. Vive solo en tu aparato, nunca en el código. |
| `MAY_API_URL` | URL de la API (por defecto la de xAI). |
| `MAY_MODEL`   | Nombre del modelo (por defecto `grok-4`). |
| `MAY_PIN`     | **Solo para pruebas no interactivas.** Evita tener que teclear el PIN. No lo uses en el día a día. |
| `MAY_JUEGOS_TEST` | **Solo para pruebas.** Deja fija la secuencia de los juegos. |

Ejemplo de chat con tu propia clave:

```bash
export MAY_API_KEY="tu-clave"
python3 app.py
```

Sin clave y sin internet, el chat te lo dice con claridad. Hábitos, emociones, notas, juegos, mayores y el panel siguen funcionando **sin red**.

## Exportar

- `exportar` — crea `data/export-AAAAMMDD-HHMMSS.may`, cifrado con tu PIN.
- `exportar claro` — MAY pide confirmación. Solo si escribes `SÍ` crea un JSON legible. Trátalo como información privada.

## Aviso

MAY no es un dispositivo médico ni un profesional sanitario. Los recordatorios emocionales, los de seguridad o medicación y los juegos son de apoyo y orientación. Si lo estás pasando mal, en España puedes llamar al 024 o al 112. Consulta siempre a tu médico.
