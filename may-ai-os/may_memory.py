"""MAY Memory: una sola memoria local, cifrada en reposo.

Principio: 1 usuario, 1 IA, 1 memoria, 1 programa.

El PIN nunca se guarda. Solo se almacena un salt aleatorio, junto al
contenido cifrado con Fernet (clave derivada con PBKDF2). Si el PIN
es incorrecto se muestra un error y no se toca el archivo.
"""
from __future__ import annotations

import json
import os
import sys
import getpass
import base64
import secrets

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

_DIR_DEFECTO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DIR_DATOS = os.environ.get("MAY_DATA_DIR") or _DIR_DEFECTO
RUTA_MEMORIA = os.path.join(DIR_DATOS, "memory.may")
RUTA_LEGACY = os.path.join(DIR_DATOS, "memory.json")

MAGIC = b"MAYENC1\n"
ITERACIONES = 200_000  # PBKDF2-SHA256: equilibrio entre solidez y fluidez en tablet
LONGITUD_SALT = 16

MEMORIA_VACIA = {
    "usuario": "",
    "bot": {"nombre": "", "enlace": ""},
    "bot_apoyo": {"nombre": "", "enlace": ""},
    "notas": [],
    "habitos": [],
    "emociones": [],
    "conversacion": [],
    "familia": [],
    "juegos": [],
    "automatizaciones": [],
    "modo_mayores": False,
    "mayores_checks": [],
    "mayores_respuestas": [],
    "no_consumo": [],
    "red_apoyo": {
        "medico": {"nombre": "", "telefono": "", "email": "", "whatsapp": ""},
        "centro": {"nombre": "", "telefono": "", "email": "", "whatsapp": ""},
        "familia_contactos": [],
        "ccaa": "",
    },
    "pruebas_sustancias": [],
    "profesional_acceso": {},
}

_fernet = None
_salt = None


def _asegurar_carpeta():
    os.makedirs(DIR_DATOS, exist_ok=True)


def _derivar_clave(pin: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=ITERACIONES,
    )
    return base64.urlsafe_b64encode(kdf.derive(pin.encode("utf-8")))


def _empaquetar(salt: bytes, token: bytes) -> bytes:
    return MAGIC + base64.b64encode(salt) + b"\n" + token


def _desempaquetar(blob: bytes):
    if not blob.startswith(MAGIC):
        raise ValueError("archivo de memoria no reconocido")
    resto = blob[len(MAGIC):]
    salt_b64, token = resto.split(b"\n", 1)
    return base64.b64decode(salt_b64), token


def _escribir_atomico(ruta: str, contenido: bytes):
    _asegurar_carpeta()
    tmp = ruta + ".tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(contenido)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, ruta)
        os.chmod(ruta, 0o600)
    except Exception:
        if os.path.exists(tmp):
            try:
                os.remove(tmp)
            except OSError:
                pass
        raise


def hay_archivo_cifrado():
    return os.path.isfile(RUTA_MEMORIA)


def desbloqueada():
    return _fernet is not None


def _leer_pin(mensaje: str) -> str | None:
    """Pide el PIN en silencio. MAY_PIN solo sirve para pruebas no interactivas."""
    env = os.environ.get("MAY_PIN")
    if env is not None and env != "":
        return env
    try:
        return getpass.getpass(mensaje)
    except (EOFError, OSError, KeyboardInterrupt):
        return None


def iniciar() -> tuple[bool, str]:
    """Desbloquea o crea la memoria cifrada. Devuelve (ok, mensaje_error)."""
    global _fernet, _salt
    _asegurar_carpeta()

    if hay_archivo_cifrado():
        pin = _leer_pin("PIN de tu memoria: ")
        if not pin:
            return False, "No he recibido el PIN. Los datos no se han tocado."
        try:
            with open(RUTA_MEMORIA, "rb") as f:
                blob = f.read()
            salt, token = _desempaquetar(blob)
        except Exception:
            return False, "No he podido leer el archivo de memoria. Los datos no se han tocado."
        fernet = Fernet(_derivar_clave(pin, salt))
        try:
            fernet.decrypt(token)
        except InvalidToken:
            return False, "PIN incorrecto. Los datos no se han tocado."
        _fernet, _salt = fernet, salt
        return True, ""

    # Primera vez: crear PIN y, si hay un memory.json antiguo, migrarlo.
    print("Es la primera vez. Elige un PIN para cifrar tu memoria en este aparato.")
    print("El PIN no se guarda en ningún sitio. Si lo olvidas, no se podrán leer los datos.")
    pin = _leer_pin("Elige un PIN (mínimo 4 caracteres): ")
    if not pin or len(pin) < 4:
        return False, "El PIN tiene que tener al menos 4 caracteres. No se ha creado la memoria."
    if "MAY_PIN" not in os.environ or not os.environ.get("MAY_PIN"):
        pin2 = _leer_pin("Repite el PIN: ")
        if pin2 != pin:
            return False, "Los PIN no coinciden. No se ha creado la memoria."

    salt = secrets.token_bytes(LONGITUD_SALT)
    fernet = Fernet(_derivar_clave(pin, salt))
    _fernet, _salt = fernet, salt

    memoria = dict(MEMORIA_VACIA)
    if os.path.isfile(RUTA_LEGACY):
        try:
            with open(RUTA_LEGACY, encoding="utf-8") as f:
                antigua = json.load(f)
            if isinstance(antigua, dict):
                for k, v in antigua.items():
                    memoria[k] = v
            os.remove(RUTA_LEGACY)
        except (OSError, json.JSONDecodeError, TypeError):
            pass

    guardar(memoria)
    return True, ""


def cargar():
    if _fernet is None or _salt is None:
        raise RuntimeError("La memoria no está desbloqueada.")
    with open(RUTA_MEMORIA, "rb") as f:
        blob = f.read()
    salt, token = _desempaquetar(blob)
    datos = json.loads(_fernet.decrypt(token).decode("utf-8"))
    for k, v in MEMORIA_VACIA.items():
        datos.setdefault(k, v if not isinstance(v, (dict, list)) else type(v)(v))
    return datos


def guardar(memoria):
    if _fernet is None or _salt is None:
        raise RuntimeError("La memoria no está desbloqueada.")
    token = _fernet.encrypt(json.dumps(memoria, ensure_ascii=False, indent=2).encode("utf-8"))
    _escribir_atomico(RUTA_MEMORIA, _empaquetar(_salt, token))


def recordar(clave, valor):
    m = cargar()
    m.setdefault(clave, []).append(valor)
    guardar(m)


def exportar_cifrado(ruta: str):
    """Copia el archivo cifrado (con su salt) a otra ruta. Sigue haciendo falta el PIN."""
    if not hay_archivo_cifrado():
        raise RuntimeError("No hay memoria que exportar.")
    with open(RUTA_MEMORIA, "rb") as f:
        blob = f.read()
    _escribir_atomico(ruta, blob)


def exportar_claro(ruta: str):
    """Escribe un JSON legible. Solo debe llamarse tras confirmación explícita."""
    datos = cargar()
    _asegurar_carpeta()
    tmp = ruta + ".tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, ruta)


def archivo_parece_texto_plano(ruta: str | None = None) -> bool:
    """Útil en pruebas: True si el archivo de memoria se puede leer como JSON o texto con datos."""
    ruta = ruta or RUTA_MEMORIA
    if not os.path.isfile(ruta):
        return False
    with open(ruta, "rb") as f:
        raw = f.read()
    if raw.startswith(b"{") or raw.startswith(b"["):
        return True
    try:
        texto = raw.decode("utf-8", errors="ignore")
    except Exception:
        return False
    # Un archivo MAYENC1 es binario/base64, no contiene el JSON en claro.
    marcas = ("tristeza", "usuario", "habitos", "emociones", "notas")
    if raw.startswith(MAGIC):
        # El JSON en claro no debe aparecer después de la cabecera y el salt.
        cuerpo = raw.split(b"\n", 2)[-1]
        bajo = cuerpo.lower()
        return any(m.encode() in bajo for m in marcas)
    return any(m in texto.lower() for m in marcas)


def cerrar():
    """Olvida la clave en memoria (mejor esfuerzo al salir)."""
    global _fernet, _salt
    _fernet = None
    _salt = None
