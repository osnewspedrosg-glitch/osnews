"""Base de conocimiento de MAY: técnicas y fuentes verificadas.

Los textos están escritos con palabras propias. No se copia el texto de
ningún libro. Cada entrada cita su fuente real. Orientativo, consulta a tu médico.
"""
from __future__ import annotations

import json
import os

AVISO = "Orientativo, consulta a tu médico."
AVISO_AYUDA = (
    "Si lo estás pasando muy mal, en España puedes llamar al 024, "
    "la línea de atención a la conducta suicida, o al 112 si es una emergencia. "
    "Es solo una orientación; yo no sustituyo a un profesional."
)

_RUTA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "conocimiento.json")
_DATOS = None


def cargar():
    global _DATOS
    if _DATOS is None:
        with open(_RUTA, encoding="utf-8") as f:
            _DATOS = json.load(f)
    return _DATOS


def tecnicas():
    return list(cargar().get("tecnicas") or [])


def recursos():
    return list(cargar().get("recursos") or [])


def elegir(etiquetas, limite=2):
    """Elige técnicas que coincidan con las etiquetas, sin repetir."""
    wanted = {str(e).lower() for e in etiquetas if e}
    puntuadas = []
    for t in tecnicas():
        tags = {str(x).lower() for x in (t.get("etiquetas") or [])}
        n = len(wanted & tags)
        if n:
            puntuadas.append((n, t))
    puntuadas.sort(key=lambda x: -x[0])
    out, vistos = [], set()
    for _, t in puntuadas:
        if t["id"] not in vistos:
            out.append(t)
            vistos.add(t["id"])
        if len(out) >= limite:
            break
    return out


def formatear_respuesta(mensaje, tecnicas_elegidas, alta=False):
    partes = [mensaje.strip()]
    for t in tecnicas_elegidas:
        partes.append("")
        partes.append(t.get("titulo", "").strip())
        partes.append(t.get("resumen", "").strip())
        cita = t.get("cita_breve") or t.get("fuente") or ""
        if cita:
            partes.append(f"({cita}.)")
    if alta:
        partes.append("")
        partes.append(AVISO_AYUDA)
    partes.append("")
    partes.append(AVISO)
    return "\n".join(partes).strip()


def contexto_para_bot(tecnicas_elegidas):
    """Texto breve de técnicas para enviarlo junto al mensaje actual, si el usuario usa su bot."""
    if not tecnicas_elegidas:
        return ""
    lineas = [
        "El usuario ha pedido apoyo. Puedes tener en cuenta estas técnicas "
        "(resúmenes propios de MAY, no cites como si fueran el libro literal):"
    ]
    for t in tecnicas_elegidas:
        lineas.append(f"- {t.get('titulo')}: {t.get('resumen')} ({t.get('cita_breve') or t.get('fuente')})")
    lineas.append(AVISO)
    return "\n".join(lineas)


def listar_fuentes():
    lineas = ["=====  FUENTES  =====", "Base de conocimiento de MAY. " + AVISO, ""]
    lineas.append("Técnicas que usa MAY cuando respondes una emoción o un antojo:")
    for t in tecnicas():
        enlace = f"  {t['enlace']}" if t.get("enlace") else "  (sin enlace verificado)"
        lineas.append(f" · {t.get('titulo')}. {t.get('fuente')}.{enlace}")
    lineas.append("")
    lineas.append("Recursos y lecturas (solo enlaces que se han comprobado, o libros sin enlace):")
    for r in recursos():
        enlace = r.get("enlace") or "sin enlace verificado"
        lineas.append(f" · {r.get('titulo')} — {r.get('autor')}. {enlace}")
        if r.get("descripcion"):
            lineas.append(f"   {r['descripcion']}")
    lineas.append("=====================")
    return "\n".join(lineas)
