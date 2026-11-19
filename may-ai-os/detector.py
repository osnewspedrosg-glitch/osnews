"""Datos del detector de sustancias: resultados profesionales, autotest casero
e importación del formato futuro «sensor MAY Sobria».

Hasta que exista un parche real, los resultados clínicos los introduce el
profesional de la unidad o centro (código de importación o modo profesional).
El usuario no puede editar esas entradas; solo puede ocultarlas en los resúmenes.

Sin un servidor, la identidad del profesional no está verificada de forma
criptográfica. Una versión futura con el servicio de salud podría añadir firma
digital. Orientativo, consulta a tu médico. Un positivo debe confirmarlo un
médico; algunos medicamentos dan falsos positivos.
"""
from __future__ import annotations

import base64
import datetime
import getpass
import hashlib
import json
import os
import secrets
import uuid

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

import may_memory

AVISO = (
    "Orientativo, consulta a tu médico. Un positivo debe confirmarlo un médico; "
    "algunos medicamentos pueden dar un falso positivo. "
    "El parche detector es un concepto; hoy no existe."
)
AVISO_IDENTIDAD = (
    "Sin un servidor, la identidad del profesional no está verificada de forma "
    "criptográfica. Una versión futura con el servicio de salud podría añadir firma digital."
)

SUSTANCIAS = [
    "alcohol",
    "cocaína",
    "cannabis",
    "heroína/opiáceos",
    "fentanilo",
    "metadona",
    "anfetaminas",
    "MDMA",
    "metanfetamina",
    "benzodiacepinas",
    "ketamina",
    "cannabinoides sintéticos",
]
TIPOS = ("orina", "saliva", "sangre", "parche de sudor", "alcoholímetro", "otro")
RESULTADOS = ("negativo", "positivo", "no analizado")
FORMATO = "may-sobria-sensor"
VERSION = 1
ITER_PIN = 200_000


def _vacio_resultados():
    return {s: "no analizado" for s in SUSTANCIAS}


def _lista():
    return list(may_memory.cargar().get("pruebas_sustancias") or [])


def _guardar(items):
    m = may_memory.cargar()
    m["pruebas_sustancias"] = items
    may_memory.guardar(m)


def _norm_resultado(valor):
    v = (valor or "no analizado").strip().lower()
    if v in ("neg", "-", "negativo"):
        return "negativo"
    if v in ("pos", "+", "positivo"):
        return "positivo"
    return "no analizado"


def _norm_tipo(tipo):
    t = (tipo or "").strip().lower()
    for x in TIPOS:
        if t == x or t in x or x in t:
            return x
    return "otro"


def _entrada_base(origen, fecha, tipo, resultados, nota="", profesional=None):
    res = _vacio_resultados()
    for k, v in (resultados or {}).items():
        clave = None
        kn = k.strip().lower()
        for s in SUSTANCIAS:
            if kn == s.lower() or kn in s.lower():
                clave = s
                break
        if clave:
            res[clave] = _norm_resultado(v)
    return {
        "id": uuid.uuid4().hex[:12],
        "origen": origen,
        "fecha": (fecha or datetime.date.today().isoformat())[:16],
        "tipo": _norm_tipo(tipo),
        "profesional": profesional or {},
        "resultados": res,
        "nota": (nota or "").strip(),
        "ocultar_en_resumen": False,
        "importado": origen in ("profesional", "sensor-futuro"),
    }


def listar():
    items = _lista()
    if not items:
        return (
            "Aún no hay pruebas anotadas. Un profesional de la unidad puede "
            "generar un código en la página Profesional o usar el modo profesional, "
            "y tú puedes importarlo. Un autotest casero se apunta aparte, no sustituye "
            "una prueba profesional.\n" + AVISO
        )
    lineas = ["=====  PRUEBAS  ====="]
    for i, p in enumerate(items, 1):
        origen = p.get("origen") or "?"
        oculto = " (oculta en resúmenes)" if p.get("ocultar_en_resumen") else ""
        who = ""
        pr = p.get("profesional") or {}
        if origen == "profesional":
            who = " · " + ", ".join(x for x in (pr.get("nombre"), pr.get("centro"), pr.get("colegiado")) if x)
        elif origen == "autotest-casero":
            who = " · autotest casero (no es una prueba profesional)"
        elif origen == "sensor-futuro":
            who = " · importación formato sensor futuro (concepto, sin dispositivo real)"
        pos = [s for s, v in (p.get("resultados") or {}).items() if v == "positivo"]
        neg = [s for s, v in (p.get("resultados") or {}).items() if v == "negativo"]
        lineas.append(f" {i}. {p.get('fecha')} · {p.get('tipo')} · {origen}{who}{oculto}")
        if pos:
            lineas.append("    positivos: " + ", ".join(pos) + " (deben confirmarse con un médico)")
        if neg:
            lineas.append("    negativos: " + ", ".join(neg))
        if p.get("nota"):
            lineas.append(f"    nota: {p['nota']}")
    lineas.append(AVISO)
    lineas.append(AVISO_IDENTIDAD)
    lineas.append("=====================")
    return "\n".join(lineas)


def ocultar(numero, ocultar=True):
    items = _lista()
    if numero < 1 or numero > len(items):
        return "No encuentro esa prueba. Escribe «pruebas» para ver la lista."
    items[numero - 1]["ocultar_en_resumen"] = bool(ocultar)
    _guardar(items)
    estado = "oculta en los resúmenes" if ocultar else "visible en los resúmenes"
    return f"La prueba {numero} queda {estado}. El registro profesional no se ha modificado."


def anotar_autotest(fecha, tipo, resultados, nota=""):
    items = _lista()
    items.append(_entrada_base("autotest-casero", fecha, tipo, resultados, nota=nota))
    _guardar(items)
    return (
        "He apuntado un autotest casero, aparte de las pruebas profesionales. "
        "No sustituye el análisis de tu unidad ni de tu médico. " + AVISO
    )


def anotar_profesional(fecha, tipo, resultados, nota="", profesional=None):
    items = _lista()
    items.append(_entrada_base("profesional", fecha, tipo, resultados, nota=nota, profesional=profesional or {}))
    _guardar(items)
    centro = (profesional or {}).get("centro") or "la consulta"
    return (
        f"He guardado la prueba introducida en modo profesional ({centro}). "
        "El usuario no podrá editarla, solo ocultarla en los resúmenes. "
        + AVISO + " " + AVISO_IDENTIDAD
    )


def _decodificar_codigo(texto):
    texto = (texto or "").strip()
    if texto.startswith("MAY1:"):
        texto = texto[5:]
    # try raw json, then base64
    for candidato in (texto,):
        try:
            return json.loads(candidato)
        except json.JSONDecodeError:
            pass
    try:
        raw = base64.b64decode(texto.encode("ascii"), validate=False)
        return json.loads(raw.decode("utf-8"))
    except Exception:
        return None


def _payload_a_entradas(datos):
    if not isinstance(datos, dict):
        return None, "El código no es un documento válido."
    formato = datos.get("formato") or datos.get("format")
    if formato and formato != FORMATO:
        return None, f"Formato no reconocido: {formato}."
    version = int(datos.get("version") or 1)
    if version > VERSION:
        return None, f"Esta versión del formato ({version}) aún no la entiendo."
    origen = (datos.get("origen") or "profesional").strip().lower()
    if origen in ("sensor", "sensor-futuro", "may-sobria"):
        origen = "sensor-futuro"
    if origen not in ("profesional", "sensor-futuro"):
        return None, "Este código no es de un profesional ni del formato de sensor futuro."
    profesional = datos.get("profesional") or {}
    muestras = datos.get("muestras") or datos.get("pruebas") or []
    if not muestras and datos.get("resultados"):
        muestras = [datos]
    if not muestras:
        return None, "El código no trae ninguna muestra."
    entradas = []
    for m in muestras:
        res = m.get("resultados") or m.get("sustancias") or {}
        if isinstance(res, list):
            res = {x.get("nombre"): x.get("resultado") for x in res if isinstance(x, dict)}
        entradas.append(_entrada_base(
            origen,
            m.get("fecha") or datos.get("fecha"),
            m.get("tipo") or datos.get("tipo"),
            res,
            nota=m.get("nota") or "",
            profesional=m.get("profesional") or profesional,
        ))
        entradas[-1]["importado"] = True
    return entradas, None


def importar_codigo(texto):
    datos = _decodificar_codigo(texto)
    if datos is None:
        return "No he podido leer ese código. Pega el JSON o el código en base64 que te dio el profesional."
    entradas, error = _payload_a_entradas(datos)
    if error:
        return error
    items = _lista()
    items.extend(entradas)
    _guardar(items)
    n = len(entradas)
    extra = AVISO + " " + AVISO_IDENTIDAD
    if entradas[0]["origen"] == "sensor-futuro":
        extra = "Concepto, sin dispositivo real. " + extra
    return f"He importado {n} prueba(s). " + extra


def resumen_para_compartir(incluir=False):
    if not incluir:
        return ""
    items = [p for p in _lista() if not p.get("ocultar_en_resumen")]
    if not items:
        return "Pruebas de sustancias: no hay entradas visibles."
    lineas = ["Pruebas de sustancias (el parche detector es un concepto; hoy no existe):"]
    for p in items[-8:]:
        origen = p.get("origen")
        etiqueta = {
            "profesional": "profesional",
            "autotest-casero": "autotest casero (no profesional)",
            "sensor-futuro": "formato sensor futuro (concepto)",
        }.get(origen, origen)
        pr = p.get("profesional") or {}
        who = ""
        if origen == "profesional":
            who = " · " + ", ".join(x for x in (pr.get("nombre"), pr.get("centro")) if x)
        pos = [s for s, v in (p.get("resultados") or {}).items() if v == "positivo"]
        neg = [s for s, v in (p.get("resultados") or {}).items() if v == "negativo"]
        lineas.append(f"- {p.get('fecha')} {p.get('tipo')} ({etiqueta}{who})")
        if pos:
            lineas.append("  positivos (pendientes de confirmación médica): " + ", ".join(pos))
        if neg:
            lineas.append("  negativos: " + ", ".join(neg))
    lineas.append(AVISO)
    return "\n".join(lineas)


def _derivar(pin, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER_PIN)
    return kdf.derive(pin.encode("utf-8"))


def hay_pin_profesional():
    acc = may_memory.cargar().get("profesional_acceso") or {}
    return bool(acc.get("salt") and acc.get("verificador"))


def establecer_pin_profesional(pin, repetir=None):
    pin = pin or ""
    if len(pin) < 4:
        return False, "El PIN profesional tiene que tener al menos 4 caracteres."
    if repetir is not None and repetir != pin:
        return False, "Los PIN profesionales no coinciden."
    salt = secrets.token_bytes(16)
    ver = _derivar(pin, salt)
    m = may_memory.cargar()
    m["profesional_acceso"] = {
        "salt": base64.b64encode(salt).decode("ascii"),
        "verificador": base64.b64encode(ver).decode("ascii"),
    }
    may_memory.guardar(m)
    return True, "PIN profesional guardado. Úsalo solo en la consulta. " + AVISO_IDENTIDAD


def comprobar_pin_profesional(pin) -> bool:
    acc = may_memory.cargar().get("profesional_acceso") or {}
    try:
        salt = base64.b64decode(acc["salt"])
        ver = base64.b64decode(acc["verificador"])
    except Exception:
        return False
    intento = _derivar(pin or "", salt)
    return secrets.compare_digest(intento, ver)


def pedir_pin_profesional(mensaje="PIN profesional: "):
    env = os.environ.get("MAY_PIN_PROFESIONAL")
    if env:
        return env
    try:
        return getpass.getpass(mensaje)
    except (EOFError, OSError, KeyboardInterrupt):
        return None


def construir_payload(profesional, fecha, tipo, resultados, nota=""):
    return {
        "formato": FORMATO,
        "version": VERSION,
        "aviso": "concepto, sin dispositivo real. Identidad profesional no verificada criptográficamente (sin servidor).",
        "origen": "profesional",
        "profesional": {
            "centro": (profesional or {}).get("centro") or "",
            "nombre": (profesional or {}).get("nombre") or "",
            "colegiado": (profesional or {}).get("colegiado") or "",
        },
        "muestras": [
            {
                "fecha": fecha or datetime.date.today().isoformat(),
                "tipo": _norm_tipo(tipo),
                "resultados": {s: _norm_resultado((resultados or {}).get(s, "no analizado")) for s in SUSTANCIAS},
                "nota": nota or "",
            }
        ],
    }


def codigo_importacion(payload: dict) -> str:
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return "MAY1:" + base64.b64encode(raw).decode("ascii")
