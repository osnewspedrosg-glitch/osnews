"""EVA: hábitos, rehabilitación y automatizaciones sencillas."""
import datetime
import may_memory


def anotar_habito(texto):
    hoy = datetime.date.today().isoformat()
    may_memory.recordar("habitos", {"fecha": hoy, "habito": texto.strip()})
    return f"Apuntado para hoy ({hoy}): {texto.strip()}"


def ver_habitos():
    h = may_memory.cargar().get("habitos", [])
    return "\n".join(f"{x['fecha']}: {x['habito']}" for x in h) or "Aún no hay hábitos."


def habitos_de_hoy():
    hoy = datetime.date.today().isoformat()
    return [x for x in may_memory.cargar().get("habitos", []) if x.get("fecha") == hoy]


def hay_habito_hoy():
    return bool(habitos_de_hoy())


def anotar_recordatorio(texto):
    may_memory.recordar(
        "automatizaciones",
        {
            "fecha": datetime.datetime.now().isoformat(timespec="minutes"),
            "texto": texto.strip(),
            "hecho": False,
        },
    )
    return f"Lo recordaré: {texto.strip()}"


def ver_automatizaciones():
    items = may_memory.cargar().get("automatizaciones", [])
    if not items:
        return "No hay recordatorios. Escribe: recuerda comprar pan"
    lineas = []
    for i, x in enumerate(items, 1):
        marca = "hecho" if x.get("hecho") else "pendiente"
        lineas.append(f" {i}. [{marca}] {x.get('texto', '')} ({x.get('fecha', '')})")
    lineas.append("Para marcar uno: hecho 1")
    return "\n".join(lineas)


def marcar_hecho(numero):
    m = may_memory.cargar()
    items = m.get("automatizaciones", [])
    if numero < 1 or numero > len(items):
        return "No encuentro ese recordatorio. Escribe «automatizaciones» para ver la lista."
    items[numero - 1]["hecho"] = True
    m["automatizaciones"] = items
    may_memory.guardar(m)
    return f"Hecho: {items[numero - 1].get('texto', '')}"


def pendientes():
    return [x for x in may_memory.cargar().get("automatizaciones", []) if not x.get("hecho")]
