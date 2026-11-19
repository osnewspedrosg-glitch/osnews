"""Rueda de emociones: 8 emociones básicas, cada una con 3 intensidades."""
import datetime
import may_memory
import conocimiento

RUEDA = {
    "alegría":   ["serenidad", "alegría", "éxtasis"],
    "confianza": ["aceptación", "confianza", "admiración"],
    "miedo":     ["inquietud", "miedo", "terror"],
    "sorpresa":  ["distracción", "sorpresa", "asombro"],
    "tristeza":  ["melancolía", "tristeza", "pena profunda"],
    "aversión":  ["aburrimiento", "aversión", "asco"],
    "ira":       ["molestia", "enfado", "furia"],
    "anticipación": ["interés", "anticipación", "vigilancia"],
}
NEGATIVAS = {"miedo", "tristeza", "aversión", "ira"}

AVISO_AYUDA = (
    "Si lo estás pasando muy mal, en España puedes llamar al 024, "
    "la línea de atención a la conducta suicida, o al 112 si es una emergencia. "
    "Es solo una orientación; yo no sustituyo a un profesional."
)


def mostrar():
    lineas = ["Rueda de emociones (elige emoción e intensidad 1-3):"]
    for i, (emo, niveles) in enumerate(RUEDA.items(), 1):
        lineas.append(f" {i}. {emo}: " + " / ".join(niveles))
    lineas.append("Escribe por ejemplo: siento tristeza 2")
    return "\n".join(lineas)


def registrar(emocion, intensidad=2):
    emocion = emocion.lower().strip()
    if emocion not in RUEDA:
        return "No conozco esa emoción. Escribe «rueda» para verlas."
    intensidad = max(1, min(3, intensidad))
    nombre = RUEDA[emocion][intensidad - 1]
    may_memory.recordar(
        "emociones",
        {
            "fecha": datetime.datetime.now().isoformat(timespec="minutes"),
            "emocion": emocion,
            "intensidad": intensidad,
            "nombre": nombre,
        },
    )
    etiquetas = [emocion]
    alta = intensidad == 3 and emocion in NEGATIVAS
    if alta:
        etiquetas.append("intensidad-alta")
    tec = conocimiento.elegir(etiquetas, 2 if alta or emocion in NEGATIVAS else 1)
    if emocion in NEGATIVAS:
        mensaje = f"Anoto {nombre}. Gracias por decírmelo; estoy aquí, sin juicio."
    else:
        mensaje = f"Anoto {nombre}. Me alegra que lo hayas apuntado."
    return conocimiento.formatear_respuesta(mensaje, tec, alta=alta)


def historial():
    e = may_memory.cargar().get("emociones", [])
    return "\n".join(
        f"{x['fecha']}: {x['nombre']} ({x['emocion']} {x['intensidad']})" for x in e[-10:]
    ) or "Aún no hay emociones anotadas."


def recientes(horas=24):
    """Emociones de las últimas `horas` horas, de más antigua a más reciente."""
    limite = datetime.datetime.now() - datetime.timedelta(hours=horas)
    out = []
    for x in may_memory.cargar().get("emociones", []):
        try:
            fecha = datetime.datetime.fromisoformat(x["fecha"])
        except (KeyError, TypeError, ValueError):
            continue
        if fecha >= limite:
            out.append(x)
    return out
