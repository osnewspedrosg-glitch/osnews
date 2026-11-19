"""Hábitos de no consumo: días en limpio, anotación diaria y racha.

Nunca se juzga una recaída: se vuelve a empezar con un mensaje de apoyo.
Orientativo, consulta a tu médico.
"""
from __future__ import annotations

import datetime
import uuid

import may_memory
import conocimiento

SUSTANCIAS = ("alcohol", "tabaco", "cannabis", "cocaína", "otras")
AVISO = "Orientativo, consulta a tu médico."
MENSAJE_RECAIDA = (
    "Gracias por decírmelo. Un tropiezo no te define ni borra lo que ya has hecho. "
    "Hoy volvemos a contar desde aquí, con calma, sin juicio. "
    "Si quieres, apunta qué lo disparó y elige un paso pequeño (beber agua, "
    "dar un paseo, esperar 15 minutos o llamar a alguien de tu red)."
)


def _hoy():
    return datetime.date.today().isoformat()


def _lista():
    return list(may_memory.cargar().get("no_consumo") or [])


def _guardar(items):
    m = may_memory.cargar()
    m["no_consumo"] = items
    may_memory.guardar(m)


def _buscar(clave):
    clave = (clave or "").strip().lower()
    for i, h in enumerate(_lista()):
        nombre = (h.get("personalizado") or h.get("sustancia") or "").strip().lower()
        if h.get("id") == clave or nombre == clave:
            return i, h
    return None, None


def _dias_limpio(h, hoy=None):
    hoy = hoy or datetime.date.today()
    inicio = h.get("inicio") or hoy.isoformat()
    try:
        base = datetime.date.fromisoformat(inicio[:10])
    except ValueError:
        base = hoy
    for c in h.get("historial") or []:
        if c.get("consumio"):
            try:
                d = datetime.date.fromisoformat(str(c.get("fecha", ""))[:10])
            except ValueError:
                continue
            if d >= base:
                base = d + datetime.timedelta(days=1)
    return max(0, (hoy - base).days)


def _racha(h, hoy=None):
    """Días seguidos desde el último consumo anotado, o desde el inicio."""
    return _dias_limpio(h, hoy)


def anadir(sustancia, inicio=None, personalizado=""):
    sustancia = (sustancia or "").strip().lower()
    personalizado = (personalizado or "").strip()
    if sustancia not in SUSTANCIAS and not personalizado:
        if sustancia:
            personalizado = sustancia
            sustancia = "otras"
        else:
            return "Dime la sustancia o el hábito: alcohol, tabaco, cannabis, cocaína, otras, o un nombre propio."
    if sustancia not in SUSTANCIAS:
        sustancia = "otras"
    inicio = (inicio or _hoy())[:10]
    try:
        datetime.date.fromisoformat(inicio)
    except ValueError:
        return "La fecha de inicio no es válida. Usa AAAA-MM-DD."
    items = _lista()
    nombre = personalizado or sustancia
    for h in items:
        if (h.get("personalizado") or h.get("sustancia")) == nombre and not h.get("archivado"):
            return f"Ese hábito ya está apuntado: {nombre}. Escribe «checkin {nombre} no 3» para anotar el día."
    items.append({
        "id": uuid.uuid4().hex[:10],
        "sustancia": sustancia,
        "personalizado": personalizado,
        "inicio": inicio,
        "historial": [],
    })
    _guardar(items)
    return f"He apuntado «{nombre}» desde el {inicio}. Cada día puedes anotar si has estado en limpio. {AVISO}"


def listar():
    items = [h for h in _lista() if not h.get("archivado")]
    if not items:
        return (
            "Aún no hay hábitos de no consumo. "
            "Por ejemplo: no consumo alcohol 2026-01-15\n" + AVISO
        )
    lineas = ["=====  NO CONSUMO  ====="]
    for h in items:
        nombre = h.get("personalizado") or h.get("sustancia")
        lineas.append(f" · {nombre}: { _dias_limpio(h) } días en limpio (inicio {h.get('inicio')})")
    lineas.append("Anotar el día: checkin alcohol no 4  (sí/no, antojo 0-10, y si quieres una nota)")
    lineas.append(AVISO)
    lineas.append("========================")
    return "\n".join(lineas)


def checkin(clave, consumio, antojo=0, nota=""):
    idx, h = _buscar(clave)
    if h is None:
        return "No encuentro ese hábito. Escribe «no consumo» para ver la lista."
    try:
        antojo = int(antojo)
    except (TypeError, ValueError):
        antojo = 0
    antojo = max(0, min(10, antojo))
    consumio = bool(consumio)
    hoy = _hoy()
    hist = list(h.get("historial") or [])
    hist = [x for x in hist if str(x.get("fecha", ""))[:10] != hoy]
    hist.append({
        "fecha": hoy,
        "consumio": consumio,
        "antojo": antojo,
        "nota": (nota or "").strip(),
    })
    items = _lista()
    if consumio:
        items[idx]["inicio"] = hoy
    items[idx]["historial"] = hist
    _guardar(items)
    nombre = h.get("personalizado") or h.get("sustancia")
    etiquetas = ["antojo" if antojo else "", "recaida" if consumio else "", h.get("sustancia") or ""]
    alta = antojo >= 8 or consumio
    if consumio:
        base = MENSAJE_RECAIDA + f" «{nombre}» vuelve a contar desde hoy."
        tec = conocimiento.elegir(etiquetas, 2)
        return conocimiento.formatear_respuesta(base, tec, alta=alta)
    dias = _dias_limpio(items[idx])
    if antojo >= 8:
        base = (
            f"Anoto el día en limpio de «{nombre}» ({dias} días). "
            f"El antojo está alto ({antojo}/10). Estoy aquí, sin juicio."
        )
        tec = conocimiento.elegir(["antojo", "intensidad-alta", h.get("sustancia") or ""], 2)
        return conocimiento.formatear_respuesta(base, tec, alta=True)
    if antojo >= 4:
        tec = conocimiento.elegir(["antojo", h.get("sustancia") or ""], 1)
        base = f"Anoto el día en limpio de «{nombre}» ({dias} días). Antojo {antojo}/10, lo tenemos en cuenta."
        return conocimiento.formatear_respuesta(base, tec, alta=False)
    return f"Anoto el día en limpio de «{nombre}»: {dias} días. {AVISO}"


def resumen_panel():
    items = [h for h in _lista() if not h.get("archivado")]
    if not items:
        return ""
    partes = ["No consumo:"]
    hoy = _hoy()
    for h in items:
        nombre = h.get("personalizado") or h.get("sustancia")
        partes.append(f"  · {nombre}: {_dias_limpio(h)} días en limpio")
        hoy_c = [x for x in (h.get("historial") or []) if str(x.get("fecha", ""))[:10] == hoy]
        if hoy_c:
            c = hoy_c[-1]
            if c.get("consumio"):
                partes.append(f"    hoy: anotaste un consumo (antojo {c.get('antojo', '?')}/10)")
            elif c.get("antojo"):
                partes.append(f"    antojo de hoy: {c.get('antojo')}/10")
    return "\n".join(partes)


def seguimiento_texto():
    items = [h for h in _lista() if not h.get("archivado")]
    lineas = ["=====  SEGUIMIENTO  ====="]
    if items:
        for h in items:
            nombre = h.get("personalizado") or h.get("sustancia")
            lineas.append(f"{nombre}: {_dias_limpio(h)} días en limpio (inicio {h.get('inicio')})")
            recents = (h.get("historial") or [])[-7:]
            for c in recents:
                marca = "consumo anotado" if c.get("consumio") else "en limpio"
                nota = f" — {c['nota']}" if c.get("nota") else ""
                lineas.append(f"  {c.get('fecha')}: {marca}, antojo {c.get('antojo', '?')}/10{nota}")
    else:
        lineas.append("Aún no hay hábitos de no consumo.")
    lineas.append(AVISO)
    lineas.append("=========================")
    return "\n".join(lineas)
