"""Modo mayores: recordatorios de seguridad y medicación, en tono cálido.

Frases sencillas, sin prisas. Las respuestas se guardan cifradas en la
memoria local. No son indicación médica.

Aviso: «Recordatorios orientativos, consulta a tu médico. Emergencias: 112.»
"""
from __future__ import annotations

import datetime
import os
import re

import may_memory

AVISO = "Recordatorios orientativos, consulta a tu médico. Emergencias: 112."

PREGUNTAS_DEFECTO = [
    "¿Has apagado el fuego/la cocina?",
    "¿Has tomado la medicación del azúcar?",
    "¿Has cerrado la puerta con llave?",
    "¿Has bebido agua?",
    "¿Has cerrado el grifo?",
    "¿Has tomado la pastilla de la tensión?",
]

# Palabras que apuntan a una pregunta canónica.
_TEMAS = (
    (("fuego", "cocina"), PREGUNTAS_DEFECTO[0]),
    (("azucar", "azúcar", "glucosa"), PREGUNTAS_DEFECTO[1]),
    (("puerta", "llave"), PREGUNTAS_DEFECTO[2]),
    (("agua", "bebido", "beber"), PREGUNTAS_DEFECTO[3]),
    (("grifo",), PREGUNTAS_DEFECTO[4]),
    (("tension", "tensión", "presion", "presión"), PREGUNTAS_DEFECTO[5]),
)

_HORA = re.compile(r"^(\d{1,2}):(\d{2})$")


def _ahora():
    return datetime.datetime.now()


def _minutos_reintento() -> int:
    raw = os.environ.get("MAY_MAYORES_REINTENTO_MIN")
    if raw is not None and raw != "":
        try:
            return max(0, int(raw))
        except ValueError:
            pass
    return 15


def _sin_tildes(s: str) -> str:
    return (
        s.lower()
        .replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
        .replace("ü", "u")
    )


def _pregunta_para(texto: str) -> str:
    t = (texto or "").strip()
    if not t:
        return ""
    if t.startswith("¿") and t.endswith("?"):
        return t
    plano = _sin_tildes(t)
    for claves, pregunta in _TEMAS:
        if any(c in plano for c in claves):
            return pregunta
    if not t.endswith("?"):
        return f"¿Te has acordado de {t}?"
    return t


def _checks():
    m = may_memory.cargar()
    return list(m.get("mayores_checks") or [])


def _guardar_checks(checks):
    m = may_memory.cargar()
    m["mayores_checks"] = checks
    may_memory.guardar(m)


def activado() -> bool:
    return bool(may_memory.cargar().get("modo_mayores"))


def sembrar_si_vacio():
    """Al activar el modo, carga las 6 preguntas de seguridad si aún no hay ninguna."""
    checks = _checks()
    if checks:
        return checks
    checks = [{"pregunta": p, "hora": "", "ultima_respuesta": None, "ultima_cuando": None} for p in PREGUNTAS_DEFECTO]
    _guardar_checks(checks)
    return checks


def _parse_hora(texto: str):
    m = _HORA.match((texto or "").strip())
    if not m:
        return None
    h, mi = int(m.group(1)), int(m.group(2))
    if 0 <= h <= 23 and 0 <= mi <= 59:
        return f"{h:02d}:{mi:02d}"
    return None


def _cuando(iso):
    if not iso:
        return None
    try:
        return datetime.datetime.fromisoformat(iso)
    except (TypeError, ValueError):
        return None


def _es_pendiente(check, ahora=None, al_arrancar=False) -> bool:
    ahora = ahora or _ahora()
    hora = check.get("hora") or ""
    ultima = check.get("ultima_respuesta")
    cuando = _cuando(check.get("ultima_cuando"))
    mismo_dia = cuando is not None and cuando.date() == ahora.date()

    if ultima == "sí" and mismo_dia:
        return False
    if ultima == "no" and mismo_dia:
        if al_arrancar:
            return True
        delta = (ahora - cuando).total_seconds() / 60.0
        return delta >= _minutos_reintento()
    # Sin respuesta válida hoy: si tiene hora, espera a esa hora.
    if hora:
        try:
            h, mi = [int(x) for x in hora.split(":")]
            return ahora.time() >= datetime.time(h, mi)
        except ValueError:
            return True
    return True


def pendientes(al_arrancar=False, ahora=None):
    if not activado():
        return []
    ahora = ahora or _ahora()
    out = []
    for i, c in enumerate(_checks(), 1):
        if _es_pendiente(c, ahora=ahora, al_arrancar=al_arrancar):
            out.append((i, c))
    return out


def listar():
    checks = _checks()
    lineas = ["=====  MAYORES  ====="]
    if not activado():
        lineas.append("El modo mayores está apagado. Escríbelo así: modo mayores")
    if not checks:
        lineas.append("Aún no hay recordatorios. Cuando actives el modo, te dejo los de seguridad.")
        lineas.append("También puedes añadir uno: recordar 09:00 pastilla del azúcar")
    else:
        ahora = _ahora()
        for i, c in enumerate(checks, 1):
            hora = c.get("hora") or "cuando haga falta"
            estado = _estado_humano(c, ahora)
            lineas.append(f" {i}. ({hora}) {c.get('pregunta', '')}  — {estado}")
        lineas.append("Para responder: sí / no  (o sí 1, no 2). Para borrar: quitar 1")
        lineas.append("Para añadir: recordar 09:00 pastilla del azúcar")
    lineas.append(AVISO)
    lineas.append("======================")
    return "\n".join(lineas)


def _estado_humano(check, ahora):
    ultima = check.get("ultima_respuesta")
    cuando = _cuando(check.get("ultima_cuando"))
    mismo_dia = cuando is not None and cuando.date() == ahora.date()
    if ultima == "sí" and mismo_dia:
        hora = cuando.strftime("%H:%M")
        return f"hoy: sí ({hora})"
    if ultima == "no" and mismo_dia:
        if _es_pendiente(check, ahora=ahora, al_arrancar=False):
            return "pendiente otra vez (dijiste que no)"
        return "te lo preguntaré más tarde (dijiste que no)"
    if check.get("hora") and not _es_pendiente(check, ahora=ahora):
        return f"a las {check['hora']} (aún no es la hora)"
    return "pendiente"


def resumen_panel():
    """Texto corto para el panel: solo lo que toca ahora."""
    if not activado():
        return ""
    due = pendientes(al_arrancar=False)
    lineas = []
    if due:
        lineas.append("Mayores (pendiente ahora):")
        for i, c in due:
            hora = f" a las {c['hora']}" if c.get("hora") else ""
            lineas.append(f"  · {c.get('pregunta', '')}{hora}  (sí {i} / no {i})")
    else:
        checks = _checks()
        if checks:
            lineas.append("Mayores: no hay comprobaciones pendientes ahora.")
    lineas.append(AVISO)
    return "\n".join(lineas)


def texto_arranque():
    """Bloque para mostrar al abrir, si hay comprobaciones pendientes."""
    due = pendientes(al_arrancar=True)
    if not due:
        return ""
    lineas = ["Te pregunto, con calma, un par de cosas importantes:", AVISO]
    for i, c in due:
        hora = f" (a las {c['hora']})" if c.get("hora") else ""
        lineas.append(f"  {i}. {c.get('pregunta', '')}{hora}")
    lineas.append("Responde sí o no (o sí 1, no 2). Si me dices que no, te lo vuelvo a preguntar más tarde.")
    return "\n".join(lineas)


def anadir(texto, hora=""):
    pregunta = _pregunta_para(texto)
    if not pregunta:
        return "Dime qué quieres recordar. Por ejemplo: recordar 09:00 pastilla del azúcar"
    if hora:
        normal = _parse_hora(hora)
        if not normal:
            return "La hora no la entiendo. Úsala así: recordar 09:00 pastilla del azúcar"
        hora = normal
    checks = _checks()
    for c in checks:
        if c.get("pregunta") == pregunta:
            c["hora"] = hora
            _guardar_checks(checks)
            cuando = f" a las {hora}" if hora else ""
            return f"He actualizado ese recordatorio{cuando}: {pregunta}\n{AVISO}"
    checks.append({"pregunta": pregunta, "hora": hora, "ultima_respuesta": None, "ultima_cuando": None})
    _guardar_checks(checks)
    cuando = f" a las {hora}" if hora else " (te lo preguntaré cuando haga falta)"
    return f"Lo apunto{cuando}: {pregunta}\n{AVISO}"


def quitar(numero: int):
    checks = _checks()
    if numero < 1 or numero > len(checks):
        return "No encuentro ese recordatorio. Escribe «mayores» para ver la lista."
    extraido = checks.pop(numero - 1)
    _guardar_checks(checks)
    return f"He quitado: {extraido.get('pregunta', '')}"


def _interpretar_si_no(texto: str):
    plano = _sin_tildes((texto or "").strip())
    plano = plano.replace("!", "").replace(".", "").strip()
    if plano in ("si", "sí", "sip"):
        return "sí"
    if plano in ("no", "ahora no", "todavia no", "aún no", "aun no"):
        return "no"
    return None


def responder_si_no(texto: str):
    """Aplica un «sí» / «no» (opcionalmente con número) al recordatorio que toca."""
    raw = (texto or "").strip()
    plano = _sin_tildes(raw)
    numero = None
    partes = plano.split()
    if len(partes) >= 2 and partes[-1].isdigit():
        numero = int(partes[-1])
        crudo = raw.rsplit(None, 1)[0]
    else:
        crudo = raw
    valor = _interpretar_si_no(crudo)
    if not valor:
        return None  # no era un sí/no

    checks = _checks()
    if not checks:
        return "Aún no hay recordatorios de mayores. Escribe: modo mayores"

    if numero is not None:
        if numero < 1 or numero > len(checks):
            return "No encuentro ese número. Escribe «mayores» para ver la lista."
        idx = numero - 1
    else:
        due = pendientes(al_arrancar=True)
        if not due:
            due = pendientes(al_arrancar=False)
        if not due:
            return "Ahora mismo no hay ninguna comprobación pendiente. Escribe «mayores» para verlas."
        idx = due[0][0] - 1

    return _anotar(idx, valor)


def _anotar(idx: int, valor: str):
    checks = _checks()
    check = checks[idx]
    ahora = _ahora()
    check["ultima_respuesta"] = valor
    check["ultima_cuando"] = ahora.isoformat(timespec="minutes")
    checks[idx] = check
    m = may_memory.cargar()
    m["mayores_checks"] = checks
    m.setdefault("mayores_respuestas", []).append(
        {
            "fecha": check["ultima_cuando"],
            "pregunta": check.get("pregunta", ""),
            "respuesta": valor,
        }
    )
    may_memory.guardar(m)
    pregunta = check.get("pregunta", "")
    if valor == "sí":
        return f"Muy bien, lo apunto: {pregunta}"
    return (
        f"De acuerdo, no pasa nada. Te lo volveré a preguntar un poco más tarde, con calma. "
        f"({pregunta})\n{AVISO}"
    )


def ronda_preguntas(leer_linea):
    """Pregunta una a una las comprobaciones pendientes. Devuelve 'salir' si el usuario quiere irse."""
    due = pendientes(al_arrancar=True)
    if not due:
        return ""
    print()
    print(AVISO)
    print("Te pregunto, con calma. Responde sí o no. Si quieres, escribe «saltar» o «salir».")
    for i, c in due:
        print(f"\n  {c.get('pregunta', '')}")
        while True:
            try:
                resp = leer_linea()
            except (EOFError, KeyboardInterrupt):
                return "salir"
            if resp is None:
                return "salir"
            baja = (resp or "").strip().lower()
            if baja in ("salir", "exit"):
                return "salir"
            if _sin_tildes(baja) in ("saltar", "salto", "pasar"):
                print("MAY> Lo dejamos para dentro de un rato, sin prisa.")
                break
            valor = _interpretar_si_no(resp)
            if not valor:
                print("MAY> Dime sí o no, con calma. No hay prisa. También puedes escribir «saltar».")
                continue
            print("MAY>", _anotar(i - 1, valor))
            break
    return ""
