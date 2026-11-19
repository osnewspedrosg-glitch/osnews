"""Red de apoyo: contactos, bot de apoyo y directorio autonómico oficial.

MAY prepara un mensaje o un resumen, pero solo lo envía si la persona pulsa
(tel, sms, mailto, WhatsApp o la ficha para compartir). Nunca se envía solo.
Orientativo, consulta a tu médico.
"""
from __future__ import annotations

import json
import os
import urllib.parse

import may_memory

AVISO = "Orientativo, consulta a tu médico. Emergencias: 112. Ayuda 024."
_RUTA_CCAA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "recursos_ccaa.json")
_CCAA = None


def cargar_ccaa():
    global _CCAA
    if _CCAA is None:
        with open(_RUTA_CCAA, encoding="utf-8") as f:
            _CCAA = json.load(f)
    return _CCAA


def _red():
    m = may_memory.cargar()
    r = m.get("red_apoyo") or {}
    r.setdefault("medico", {"nombre": "", "telefono": "", "email": "", "whatsapp": ""})
    r.setdefault("centro", {"nombre": "", "telefono": "", "email": "", "whatsapp": ""})
    r.setdefault("familia_contactos", [])
    r.setdefault("ccaa", "")
    return r


def _guardar_red(r):
    m = may_memory.cargar()
    m["red_apoyo"] = r
    may_memory.guardar(m)


def bot_apoyo():
    return may_memory.cargar().get("bot_apoyo") or {"nombre": "", "enlace": ""}


def configurar_bot_apoyo(nombre, enlace=""):
    m = may_memory.cargar()
    m["bot_apoyo"] = {"nombre": (nombre or "").strip(), "enlace": (enlace or "").strip()}
    may_memory.guardar(m)
    n = m["bot_apoyo"]["nombre"] or "bot de apoyo"
    return f"Guardado el bot agente de apoyo: {n}. Solo se le enviará lo que tú elijas."


def poner_contacto(tipo, nombre, telefono="", email="", whatsapp=""):
    tipo = (tipo or "").strip().lower()
    if tipo in ("medico", "médico", "doctora", "doctor"):
        clave = "medico"
    elif tipo in ("centro", "unidad", "uca"):
        clave = "centro"
    else:
        return "Dime si es tu médico o tu centro (unidad de conductas adictivas)."
    r = _red()
    r[clave] = {
        "nombre": (nombre or "").strip(),
        "telefono": (telefono or "").strip(),
        "email": (email or "").strip(),
        "whatsapp": (whatsapp or "").strip() or (telefono or "").strip(),
    }
    _guardar_red(r)
    return f"He apuntado tu {('médico' if clave=='medico' else 'centro')}: {r[clave]['nombre'] or 'sin nombre'}."


def anadir_familia(nombre, relacion="", telefono="", email="", whatsapp=""):
    nombre = (nombre or "").strip()
    if not nombre:
        return "Dime el nombre. Por ejemplo: apoyo familia Ana hija 600000000"
    r = _red()
    r["familia_contactos"].append({
        "nombre": nombre,
        "relacion": (relacion or "").strip(),
        "telefono": (telefono or "").strip(),
        "email": (email or "").strip(),
        "whatsapp": (whatsapp or "").strip() or (telefono or "").strip(),
    })
    _guardar_red(r)
    return f"He apuntado a {nombre} en tu red de apoyo familiar."


def poner_ccaa(nombre):
    datos = cargar_ccaa()
    q = (nombre or "").strip().lower()
    if not q:
        return listar_ccaa()
    hallado = None
    for c in datos.get("ccaa") or []:
        if q in c["nombre"].lower() or q in c["id"].replace("-", " "):
            hallado = c
            break
    if not hallado:
        return "No reconozco esa comunidad. Escribe «comunidad» para ver la lista."
    r = _red()
    r["ccaa"] = hallado["id"]
    _guardar_red(r)
    return mostrar_ccaa(hallado)


def mostrar_ccaa(c=None):
    if c is None:
        r = _red()
        datos = cargar_ccaa()
        c = next((x for x in datos.get("ccaa") or [] if x["id"] == r.get("ccaa")), None)
        if not c:
            return "Aún no has elegido tu comunidad. Escribe: comunidad Madrid"
    lineas = [
        f"{c['nombre']}",
        c.get("organismo", ""),
        c.get("servicio", ""),
    ]
    if c.get("telefono"):
        lineas.append(f"Teléfono oficial: {c['telefono']}")
    if c.get("verificado") and c.get("enlace"):
        lineas.append(f"Enlace verificado: {c['enlace']}")
    else:
        lineas.append("Enlace de la ficha autonómica: pendiente de verificar.")
        if c.get("nota"):
            lineas.append(c["nota"])
        fuente = cargar_ccaa().get("fuente_listado") or {}
        if fuente.get("enlace"):
            lineas.append(f"Listado oficial del PNSD: {fuente['enlace']}")
    lineas.append(AVISO)
    return "\n".join(x for x in lineas if x)


def listar_ccaa():
    datos = cargar_ccaa()
    lineas = ["Servicios oficiales de adicciones por comunidad (fuente: PNSD):"]
    for c in datos.get("ccaa") or []:
        marca = "verificado" if c.get("verificado") else "pendiente de verificar"
        lineas.append(f" · {c['nombre']} ({marca})")
    fuente = datos.get("fuente_listado") or {}
    if fuente.get("enlace"):
        lineas.append(f"Fuente: {fuente.get('titulo')}. {fuente['enlace']}")
    lineas.append("Para elegir la tuya: comunidad Madrid")
    return "\n".join(lineas)


def ver():
    r = _red()
    bot = bot_apoyo()
    lineas = ["=====  RED DE APOYO  ====="]
    med = r.get("medico") or {}
    cen = r.get("centro") or {}
    lineas.append(f"Médico: {med.get('nombre') or 'sin apuntar'} {med.get('telefono') or ''}".strip())
    lineas.append(f"Centro: {cen.get('nombre') or 'sin apuntar'} {cen.get('telefono') or ''}".strip())
    fam = r.get("familia_contactos") or []
    if fam:
        lineas.append("Familia:")
        for f in fam:
            extra = f.get("telefono") or f.get("email") or ""
            rel = f" ({f['relacion']})" if f.get("relacion") else ""
            lineas.append(f"  · {f.get('nombre')}{rel} {extra}".strip())
    else:
        lineas.append("Familia: aún no hay contactos.")
    if bot.get("nombre") or bot.get("enlace"):
        lineas.append(f"Bot agente de apoyo: {bot.get('nombre') or 'sin nombre'} {bot.get('enlace') or ''}".strip())
    else:
        lineas.append("Bot agente de apoyo: aún no está configurado. Escribe: bot apoyo <nombre> <enlace>")
    lineas.append("")
    lineas.append(mostrar_ccaa() if r.get("ccaa") else "Comunidad autónoma: no elegida. Escribe «comunidad».")
    lineas.append("MAY no envía nada solo: el mensaje se abre cuando tú lo pides.")
    lineas.append(AVISO)
    lineas.append("==========================")
    return "\n".join(lineas)


def _contacto(tipo, indice_familia=0):
    r = _red()
    if tipo == "medico":
        return r.get("medico") or {}
    if tipo == "centro":
        return r.get("centro") or {}
    fam = r.get("familia_contactos") or []
    if 0 <= indice_familia < len(fam):
        return fam[indice_familia]
    return fam[0] if fam else {}


def enlaces_envio(tipo, texto, indice_familia=0):
    """Devuelve enlaces tel/sms/mailto/wa.me para que la persona los abra a propósito."""
    c = _contacto(tipo, indice_familia)
    if not c or not any(c.get(k) for k in ("nombre", "telefono", "email", "whatsapp")):
        return "No hay datos de ese contacto. Apúntalo antes en la red de apoyo."
    lineas = [
        f"Mensaje preparado para {c.get('nombre') or tipo}.",
        "MAY no lo envía sola: elige un enlace.",
        "",
        texto,
        "",
    ]
    tel = "".join(ch for ch in (c.get("telefono") or "") if ch.isdigit() or ch == "+")
    wa = "".join(ch for ch in (c.get("whatsapp") or c.get("telefono") or "") if ch.isdigit())
    email = (c.get("email") or "").strip()
    if tel:
        lineas.append(f"Llamar: tel:{tel}")
        lineas.append("SMS: sms:" + tel + "?body=" + urllib.parse.quote(texto))
    if wa:
        lineas.append("WhatsApp: https://wa.me/" + wa + "?text=" + urllib.parse.quote(texto))
    if email:
        lineas.append(
            "Correo: mailto:" + email
            + "?subject=" + urllib.parse.quote("Resumen MAY AI OS")
            + "&body=" + urllib.parse.quote(texto)
        )
    lineas.append(AVISO)
    return "\n".join(lineas)
