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
- **Hábitos de no consumo**: eliges qué evitar (alcohol, tabaco, cannabis, cocaína, otras o un nombre propio), una fecha de inicio, días en limpio y una anotación diaria (sí/no, antojo 0-10, nota). Una recaída no se juzga: se vuelve a empezar con un mensaje de apoyo.
- **Seguimiento**: panel con rachas, emociones y antojos.
- **Ayuda de MAY con la rueda y los antojos**: respuesta de apoyo y una técnica concreta (respirar, esperar 15 minutos, caminar, beber agua, llamar a alguien…), a partir de una base de conocimiento local (`conocimiento.json`). Si tu bot está conectado, se le puede enviar solo el mensaje actual y esas técnicas, nunca el resto de la memoria. Si la intensidad es 3 o el antojo llega a 8, aparecen el 024 y el 112.
- **Fuentes**: técnicas y recursos reales de psicología, psiquiatría y adicciones, con enlaces comprobados. Los libros sin ficha de editorial verificada se listan sin enlace.
- **Red de apoyo**: tu bot personal, un bot agente de apoyo, tu médico, tu centro y tu familia. MAY prepara un resumen y solo se envía si tú lo pides (en la web: llamada, SMS, correo, WhatsApp o compartir). En un momento difícil ofrece llamar a tu familia, a tu centro, al 024 o al 112. Incluye un directorio de servicios oficiales por comunidad autónoma (fuente: Plan Nacional sobre Drogas); si un enlace no se pudo comprobar, se marca «pendiente de verificar».
- **Datos del detector de sustancias**: el parche es un concepto y hoy no existe. Los resultados clínicos los introduce el profesional de la unidad (página web Profesional o modo profesional con un PIN distinto), mediante un código JSON/Base64 (y un QR en la web). Tú no puedes editar esas entradas, solo ocultarlas en los resúmenes. Un autotest casero se apunta aparte y no sustituye una prueba profesional. Hay un formato documentado, versionado, para un sensor futuro (`formato-sensor-may-sobria.md`). Sin servidor, la identidad del profesional no está verificada de forma criptográfica.
- **Versión web**: app estática en `web/` (también hay una página `web/profesional.html`). La memoria se cifra en el navegador con tu PIN (PBKDF2 + AES-GCM) y no se envía a ningún servidor. Hay un contador anónimo de visitas y otro de uso de la app (GoatCounter, cuenta `osnews-may`), sin cookies ni datos personales.


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

Para generar un código de prueba profesional (sin abrir la memoria de la persona):

```bash
python3 profesional.py
```

### Versión web

En GitHub Pages, cuando se publique: `https://osnewspedrosg-glitch.github.io/osnews/may-ai-os/web/`

La página del profesional: `https://osnewspedrosg-glitch.github.io/osnews/may-ai-os/web/profesional.html`

En local: abre esa carpeta con un servidor estático, por ejemplo `python3 -m http.server` desde `may-ai-os/` y entra en `/web/`.

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
| `MAY_DATA_DIR` | **Solo para pruebas.** Carpeta de la memoria, en vez de `data/`. |
| `MAY_PIN_PROFESIONAL` | **Solo para pruebas.** Evita teclear el PIN profesional. |
| `MAY_API_KEY_APOYO` | Clave de API del bot agente de apoyo, solo en tu aparato. |

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

MAY no es un dispositivo médico ni un profesional sanitario. Los recordatorios emocionales, los de seguridad o medicación, los hábitos de no consumo, las pruebas de sustancias y los juegos son de apoyo y orientación. Un positivo en una prueba debe confirmarlo un médico; algunos medicamentos pueden dar un falso positivo. El parche detector de sustancias es un concepto; hoy no existe. Si lo estás pasando mal, en España puedes llamar al 024 o al 112. Consulta siempre a tu médico.

Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok
