#!/usr/bin/env python3
"""Puente OSNews para MAY, Eva y Asdrúbal.

Las claves solo se leen del entorno del proceso (GEMINI_API_KEY, XAI_API_KEY).
No se escriben en la URL, en la respuesta ni en el registro.
Un arranque sin claves responde configuración pendiente: no inventa texto.

Uso local: python3 server/osnews_bridge.py
En un servicio con PORT (por ejemplo Render) escucha en 0.0.0.0:$PORT.
El TLS público lo pone la plataforma, o OSNEWS_TLS_CERT y OSNEWS_TLS_KEY.
"""
from __future__ import annotations

import json
import os
import re
import ssl
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

LIMITE_TEXTO = 40000
LIMITE_CONTEXTO = 120000
MAX_MENSAJES = 30
MAX_BODY = 2_000_000
NOTA = (
    "Varios personajes pueden usar el mismo proveedor. "
    "Eso no los convierte en inteligencias independientes."
)
NORMA = re.compile(
    r"\b(insúltale|insultale|mátale|matale|amenázale|amenazale|hazle daño|dale una paliza)\b",
    re.IGNORECASE,
)
ORIGEN_LOCAL = re.compile(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$")
PERSONAJES = {
    "may": (
        "Eres el personaje MAY, moderadora de OSNews. No eres el proveedor técnico. "
        "Moderas: separas hechos de opiniones, no inventas citas ni declaraciones de políticos "
        "ni respuestas de otras IA. Norma: todo es válido sin violencia ni ataques personales. "
        "Si no tienes una fuente, dilo. No publiques ni prometas publicar en X o YouTube."
    ),
    "eva": (
        "Eres el personaje Eva y acompañas. No diagnosticas ni interpretas audio, imagen o gestos: "
        "esos datos no llegan a este puente, solo el texto que la persona ha enviado. "
        "No inventes citas. No afirmes ser una inteligencia distinta de MAY o Asdrúbal "
        "por compartir proveedor."
    ),
    "asdrubal": (
        "Eres el personaje Asdrúbal: editorial, poeta y músico. El texto que generas es un borrador de IA. "
        "No lo atribuyas a Pedro Sánchez Gómez como autor. Pedro es el creador del personaje, "
        "no el autor de este texto. No inventes citas. Separa opiniones de hechos. "
        "Norma: sin violencia ni ataques personales."
    ),
}
PROVEEDOR_SISTEMA = {
    "gemini": (
        "Participas en la mesa OSNews como el servicio Gemini, no como el personaje MAY, Eva o Asdrúbal. "
        "No inventes citas, políticos ni fuentes. Separa hechos de opiniones. "
        "Norma: sin violencia ni ataques personales. No publiques en X ni en YouTube."
    ),
    "grok": (
        "Participas en la mesa OSNews como el servicio Grok, no como el personaje MAY, Eva o Asdrúbal. "
        "No inventes citas, políticos ni fuentes. Separa hechos de opiniones. "
        "Norma: sin violencia ni ataques personales. No publiques en X ni en YouTube."
    ),
}


def redactar(texto, secretos):
    out = texto or ""
    for sec in secretos:
        if sec:
            out = out.replace(sec, "[redactado]")
    return out


class Config:
    def __init__(self, host, port, keys, modelos, origins, rate_limit, rate_window, trust_proxy, tls_cert, tls_key):
        self.host = host
        self.port = port
        self.keys = keys
        self.modelos = modelos
        self.origins = origins
        self.rate_limit = rate_limit
        self.rate_window = rate_window
        self.trust_proxy = trust_proxy
        self.tls_cert = tls_cert
        self.tls_key = tls_key

    @classmethod
    def desde_entorno(cls, env=None):
        env = os.environ if env is None else env
        port_plataforma = env.get("PORT", "").strip()
        if port_plataforma:
            host, port = "0.0.0.0", int(port_plataforma)
        else:
            host = env.get("OSNEWS_BIND", "127.0.0.1")
            port = int(env.get("OSNEWS_PORT", "8090"))
        keys = {}
        if env.get("GEMINI_API_KEY", "").strip():
            keys["gemini"] = env["GEMINI_API_KEY"].strip()
        if env.get("XAI_API_KEY", "").strip():
            keys["grok"] = env["XAI_API_KEY"].strip()
        origenes = {o.strip() for o in env.get("OSNEWS_CORS_ORIGINS", "").split(",") if o.strip()}
        return cls(
            host=host,
            port=port,
            keys=keys,
            modelos={
                "gemini": env.get("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash",
                "grok": env.get("XAI_MODEL", "grok-3").strip() or "grok-3",
            },
            origins=origenes,
            rate_limit=int(env.get("OSNEWS_RATE_LIMIT", "20")),
            rate_window=int(env.get("OSNEWS_RATE_WINDOW", "600")),
            trust_proxy=env.get("OSNEWS_TRUST_PROXY", "") == "1",
            tls_cert=env.get("OSNEWS_TLS_CERT", "").strip(),
            tls_key=env.get("OSNEWS_TLS_KEY", "").strip(),
        )


class UpstreamRequest:
    def __init__(self, proveedor, modelo, api_key, url, headers, body, user_texts):
        self.proveedor = proveedor
        self.modelo = modelo
        self.api_key = api_key
        self.url = url
        self.headers = headers
        self.body = body
        self.user_texts = user_texts


class UpstreamResult:
    def __init__(self, ok, texto=None, modelo="", cierre=None, motivo=None):
        self.ok = ok
        self.texto = texto
        self.modelo = modelo
        self.cierre = cierre
        self.motivo = motivo


def _extraer_gemini(data, modelo):
    candidatos = data.get("candidates") or []
    if not candidatos:
        return UpstreamResult(False, motivo="respuesta_vacia", modelo=modelo)
    contenido = (candidatos[0].get("content") or {}).get("parts") or []
    texto = "".join(p.get("text", "") for p in contenido if isinstance(p, dict))
    cierre = candidatos[0].get("finishReason")
    if not texto:
        return UpstreamResult(False, motivo="respuesta_vacia", modelo=modelo, cierre=cierre)
    return UpstreamResult(True, texto=texto, modelo=modelo, cierre=cierre)


def _extraer_grok(data, modelo):
    choices = data.get("choices") or []
    if not choices:
        return UpstreamResult(False, motivo="respuesta_vacia", modelo=modelo)
    msg = (choices[0].get("message") or {}).get("content") or ""
    cierre = choices[0].get("finish_reason")
    if not isinstance(msg, str) or not msg:
        return UpstreamResult(False, motivo="respuesta_vacia", modelo=modelo, cierre=cierre)
    return UpstreamResult(True, texto=msg, modelo=data.get("model") or modelo, cierre=cierre)


def construir_peticion(proveedor, modelo, api_key, sistema, mensajes):
    if proveedor == "gemini":
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            + urllib.parse.quote(modelo, safe="")
            + ":generateContent"
        )
        contents = []
        for m in mensajes:
            contents.append({
                "role": "user" if m["rol"] == "usuario" else "model",
                "parts": [{"text": m["texto"]}],
            })
        body = {
            "systemInstruction": {"parts": [{"text": sistema}]},
            "contents": contents,
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 8192},
        }
        headers = {"Content-Type": "application/json", "x-goog-api-key": api_key}
        return UpstreamRequest(proveedor, modelo, api_key, url, headers, body, [m["texto"] for m in mensajes])
    url = "https://api.x.ai/v1/chat/completions"
    chat = [{"role": "system", "content": sistema}]
    for m in mensajes:
        chat.append({"role": "user" if m["rol"] == "usuario" else "assistant", "content": m["texto"]})
    body = {"model": modelo, "messages": chat, "temperature": 0.7}
    headers = {"Content-Type": "application/json", "Authorization": "Bearer " + api_key}
    return UpstreamRequest(proveedor, modelo, api_key, url, headers, body, [m["texto"] for m in mensajes])


def transporte_urllib(req: UpstreamRequest) -> UpstreamResult:
    if req.api_key and req.api_key in req.url:
        return UpstreamResult(False, motivo="peticion_rechazada")
    data = json.dumps(req.body).encode("utf-8")
    peticion = urllib.request.Request(req.url, data=data, method="POST")
    for k, v in req.headers.items():
        peticion.add_header(k, v)
    try:
        with urllib.request.urlopen(peticion, timeout=90) as resp:
            bruto = resp.read(2_000_000)
            parsed = json.loads(bruto.decode("utf-8"))
    except urllib.error.HTTPError:
        return UpstreamResult(False, motivo="rechazado_por_el_servicio")
    except Exception:
        return UpstreamResult(False, motivo="servicio_inalcanzable")
    if req.proveedor == "gemini":
        return _extraer_gemini(parsed, req.modelo)
    return _extraer_grok(parsed, req.modelo)


class Bridge:
    def __init__(self, config: Config, transport=transporte_urllib, ahora=None):
        self.config = config
        self.transport = transport
        self.ahora = ahora or time.time
        self.verificado = {}
        self.motivos = {}
        self._hits = {}
        self._lock = threading.Lock()
        self.logs = []
        self.poll = {"si": 0, "no": 0, "nose": 0}
        self.voters = set()

    def _log(self, texto):
        limpio = redactar(texto, list(self.config.keys.values()))
        self.logs.append(limpio)

    def _ip(self, headers, remote):
        if self.config.trust_proxy:
            xff = (headers.get("X-Forwarded-For") or "").split(",")[0].strip()
            if xff:
                return xff[:80]
        return remote or "local"

    def _ritmo(self, ip):
        ahora = self.ahora()
        with self._lock:
            prev = [t for t in self._hits.get(ip, []) if ahora - t < self.config.rate_window]
            if len(prev) >= self.config.rate_limit:
                self._hits[ip] = prev
                return False
            prev.append(ahora)
            self._hits[ip] = prev
            return True

    def salud(self):
        proveedores = []
        pendiente = []
        variables = {"gemini": "GEMINI_API_KEY", "grok": "XAI_API_KEY"}
        for pid, var in variables.items():
            if pid not in self.config.keys:
                proveedores.append({"id": pid, "estado": "configuracion_pendiente", "variable": var})
                pendiente.append(var)
                continue
            if self.verificado.get(pid) is True:
                proveedores.append({
                    "id": pid,
                    "estado": "conectado",
                    "verificado": True,
                    "modelo": self.config.modelos[pid],
                })
            else:
                motivo = self.motivos.get(pid, "sin_verificacion_real")
                proveedores.append({"id": pid, "estado": "desconectado", "motivo": motivo})
        alguno = any(p["estado"] == "conectado" for p in proveedores)
        if alguno:
            estado, verificado, motivo = "conectado", True, None
        elif not self.config.keys:
            estado, verificado, motivo = "configuracion_pendiente", False, "faltan_variables"
        else:
            estado, verificado, motivo = "desconectado", False, "sin_verificacion_real"
        return {
            "ok": verificado,
            "estado": estado,
            "verificado": verificado,
            "proveedores": proveedores,
            "pendiente": pendiente,
            "motivo": motivo,
            "limite_texto": LIMITE_TEXTO,
            "limite_contexto": LIMITE_CONTEXTO,
            "nota": "Una clave presente no significa servicio verificado. " + NOTA,
        }

    def _validar_mensajes(self, mensajes):
        if not isinstance(mensajes, list) or not mensajes:
            return None, self._error(400, "sin_mensajes", "No hay mensajes.")
        if len(mensajes) > MAX_MENSAJES:
            return None, self._error(
                400,
                "demasiados_turnos",
                "Hay %d turnos y el límite es %d. No se recortan." % (len(mensajes), MAX_MENSAJES),
            )
        limpios = []
        for m in mensajes:
            if not isinstance(m, dict):
                return None, self._error(400, "texto_invalido", "Mensaje inválido.")
            texto = m.get("texto")
            rol = m.get("rol")
            if not isinstance(texto, str):
                return None, self._error(400, "texto_invalido", "El texto tiene que ser una cadena.")
            if texto == "":
                return None, self._error(400, "texto_vacio", "Hay un texto vacío.")
            if len(texto) > LIMITE_TEXTO:
                return None, self._error(
                    413,
                    "limite_excedido",
                    "Un texto tiene %d caracteres y el límite es %d. No se recorta." % (len(texto), LIMITE_TEXTO),
                )
            if rol not in ("usuario", "personaje"):
                return None, self._error(400, "rol_invalido", "Rol no admitido.")
            limpios.append({"rol": rol, "texto": texto.replace("\x00", "")})
        return limpios, None

    def _error(self, status, estado, mensaje, pendiente=None):
        cuerpo = {
            "ok": False,
            "estado": estado,
            "texto": None,
            "reply": None,
            "mensaje": mensaje,
            "nota_proveedor": NOTA,
        }
        if pendiente:
            cuerpo["pendiente"] = pendiente
        return status, cuerpo

    def _sistema(self, papel, personaje, proveedor, contexto):
        if papel == "proveedor":
            base = PROVEEDOR_SISTEMA[proveedor]
        else:
            base = PERSONAJES[personaje]
        if contexto:
            base += "\n\nContexto compartido aportado por el usuario (no lo trates como cita verificada por el puente):\n" + contexto
        return base

    def _llamar(self, proveedor, sistema, mensajes):
        if proveedor not in self.config.keys:
            var = "GEMINI_API_KEY" if proveedor == "gemini" else "XAI_API_KEY"
            return self._error(503, "configuracion_pendiente", "Falta " + var + " en el servidor.", [var])
        req = construir_peticion(
            proveedor,
            self.config.modelos[proveedor],
            self.config.keys[proveedor],
            sistema,
            mensajes,
        )
        if req.api_key in req.url:
            self._log("rechazo interno: clave en URL")
            return self._error(500, "desconectado", "Petición detenida.")
        try:
            result = self.transport(req)
        except Exception:
            self.verificado[proveedor] = False
            self.motivos[proveedor] = "servicio_inalcanzable"
            self._log("fallo de transporte proveedor=%s" % proveedor)
            return self._error(502, "desconectado", "El proveedor no ha respondido.")
        if not result.ok or not result.texto:
            self.verificado[proveedor] = False
            self.motivos[proveedor] = result.motivo or "servicio_inalcanzable"
            self._log("proveedor=%s motivo=%s" % (proveedor, self.motivos[proveedor]))
            return self._error(502, "desconectado", "Sin texto del proveedor (" + self.motivos[proveedor] + ").")
        self.verificado[proveedor] = True
        self.motivos.pop(proveedor, None)
        self._log("ok proveedor=%s caracteres=%d" % (proveedor, len(result.texto)))
        return 200, {
            "ok": True,
            "estado": "conectado",
            "origen": "servicio",
            "texto": result.texto,
            "reply": result.texto,
            "modelo": result.modelo or self.config.modelos[proveedor],
            "cierre": result.cierre,
            "fecha": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(self.ahora())),
            "nota_proveedor": NOTA,
        }

    def charla(self, data):
        if not isinstance(data, dict):
            return self._error(400, "texto_invalido", "El cuerpo tiene que ser un objeto JSON.")
        proveedor = data.get("proveedor")
        if proveedor not in ("gemini", "grok"):
            return self._error(400, "proveedor_invalido", "El proveedor tiene que ser gemini o grok.")
        papel = data.get("papel") or "personaje"
        if papel not in ("personaje", "proveedor"):
            return self._error(400, "papel_invalido", "Papel no admitido.")
        personaje = data.get("personaje")
        if papel == "personaje" and personaje not in PERSONAJES:
            return self._error(400, "personaje_invalido", "El personaje tiene que ser may, eva o asdrubal.")
        if papel == "proveedor":
            personaje = None
        mensajes, err = self._validar_mensajes(data.get("mensajes"))
        if err:
            return err
        contexto = data.get("contexto") or ""
        if not isinstance(contexto, str):
            return self._error(400, "texto_invalido", "El contexto tiene que ser texto.")
        if len(contexto) > LIMITE_CONTEXTO:
            return self._error(
                413,
                "limite_excedido",
                "El contexto tiene %d caracteres y el límite es %d. No se recorta." % (len(contexto), LIMITE_CONTEXTO),
            )
        junto = "\n".join(m["texto"] for m in mensajes) + "\n" + contexto
        if NORMA.search(junto):
            return self._error(
                400,
                "norma_osnews",
                "La norma de OSNews no admite violencia ni ataques personales. No se ha llamado al proveedor.",
            )
        sistema = self._sistema(papel, personaje, proveedor, contexto)
        status, cuerpo = self._llamar(proveedor, sistema, mensajes)
        if isinstance(cuerpo, dict):
            cuerpo["papel"] = papel
            cuerpo["personaje"] = personaje
            cuerpo["proveedor"] = proveedor
        return status, cuerpo

    def verificar(self, data):
        if not isinstance(data, dict):
            return self._error(400, "texto_invalido", "El cuerpo tiene que ser un objeto JSON.")
        proveedor = data.get("proveedor")
        if proveedor not in ("gemini", "grok"):
            return self._error(400, "proveedor_invalido", "El proveedor tiene que ser gemini o grok.")
        status, cuerpo = self._llamar(
            proveedor,
            "Responde únicamente con la palabra ok.",
            [{"rol": "usuario", "texto": "ok"}],
        )
        if status == 200:
            cuerpo["verificacion"] = True
        return status, cuerpo

    def votar(self, data):
        if not isinstance(data, dict):
            return 400, {"ok": False, "mensaje": "JSON inválido."}
        op = data.get("option")
        voter = str(data.get("voter") or "")[:80]
        if op not in self.poll or not voter:
            return 400, {"ok": False, "mensaje": "Opción no admitida."}
        with self._lock:
            if voter not in self.voters:
                self.voters.add(voter)
                self.poll[op] += 1
            counts = dict(self.poll)
        return 200, {"ok": True, "counts": counts, "ambito": "memoria_de_esta_instancia"}

    def handle(self, method, path, headers, raw, remote):
        headers = {k.title(): v for k, v in (headers or {}).items()}
        ip = self._ip(headers, remote)
        ruta = urllib.parse.urlparse(path).path
        if method == "OPTIONS":
            self._log("options %s" % ruta)
            return 204, b"", {}
        if method == "GET" and ruta in ("/api/salud", "/api/may"):
            cuerpo = self.salud()
            self._log("salud estado=%s" % cuerpo["estado"])
            return 200, _json(cuerpo), {}
        if method == "GET" and ruta == "/api/poll":
            return 200, _json({"ok": True, "counts": dict(self.poll), "ambito": "memoria_de_esta_instancia"}), {}
        if method == "POST" and ruta in ("/api/charla", "/api/may", "/api/poll", "/api/salud/verificar"):
            if not self._ritmo(ip):
                self._log("limite ip")
                return 429, _json({
                    "ok": False,
                    "estado": "limite_consumo",
                    "texto": None,
                    "reply": None,
                    "mensaje": "Demasiadas peticiones desde esta dirección. Espera y vuelve a intentarlo.",
                }), {"Retry-After": str(self.config.rate_window)}
            if len(raw) > MAX_BODY:
                return 413, _json({
                    "ok": False,
                    "estado": "limite_excedido",
                    "texto": None,
                    "reply": None,
                    "mensaje": "El cuerpo supera el tamaño admitido. No se ha recortado.",
                }), {}
            try:
                data = json.loads(raw.decode("utf-8") or "null")
            except Exception:
                return 400, _json({"ok": False, "estado": "texto_invalido", "texto": None, "reply": None, "mensaje": "JSON inválido."}), {}
            if ruta == "/api/poll":
                status, cuerpo = self.votar(data)
            elif ruta == "/api/salud/verificar":
                status, cuerpo = self.verificar(data)
            else:
                if ruta == "/api/may" and isinstance(data, dict) and "mensajes" not in data and "messages" in data:
                    data = _adaptar_may_antiguo(data)
                status, cuerpo = self.charla(data)
            self._log("post %s status=%s" % (ruta, status))
            return status, _json(cuerpo), {}
        return 404, _json({"ok": False, "estado": "no_encontrado", "texto": None, "mensaje": "Ruta no disponible."}), {}


def _adaptar_may_antiguo(data):
    mensajes = []
    for m in data.get("messages") or []:
        if not isinstance(m, dict):
            continue
        rol = "usuario" if m.get("role") in ("user", "usuario") else "personaje"
        texto = m.get("texto", m.get("text", ""))
        mensajes.append({"rol": rol, "texto": texto})
    return {
        "papel": "personaje",
        "personaje": "may",
        "proveedor": data.get("proveedor") or "gemini",
        "mensajes": mensajes,
        "contexto": data.get("contexto") or "",
    }


def _json(obj):
    return json.dumps(obj, ensure_ascii=False).encode("utf-8")


def cabeceras_cors(config, origen):
    # El allowlist público no usa *. En local se acepta el propio ordenador
    # para poder probar la página y el puente en puertos distintos.
    if origen and (origen in config.origins or ORIGEN_LOCAL.match(origen)):
        return {
            "Access-Control-Allow-Origin": origen,
            "Vary": "Origin",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "600",
        }
    return {}


class Handler(BaseHTTPRequestHandler):
    bridge = None
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        return

    def do_GET(self):
        self._ir()

    def do_POST(self):
        self._ir()

    def do_OPTIONS(self):
        self._ir()

    def _ir(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            n = MAX_BODY + 1
        if n > MAX_BODY:
            raw = b""
            status, body, extra = 413, _json({
                "ok": False,
                "estado": "limite_excedido",
                "texto": None,
                "reply": None,
                "mensaje": "El cuerpo supera el tamaño admitido. No se ha recortado.",
            }), {}
        else:
            raw = self.rfile.read(n) if n else b""
            status, body, extra = self.bridge.handle(
                self.command,
                self.path,
                {k: v for k, v in self.headers.items()},
                raw,
                self.client_address[0] if self.client_address else "",
            )
        origen = self.headers.get("Origin")
        cors = cabeceras_cors(self.bridge.config, origen)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        for k, v in extra.items():
            self.send_header(k, v)
        for k, v in cors.items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)


def servir(config=None, transport=transporte_urllib):
    config = config or Config.desde_entorno()
    bridge = Bridge(config, transport=transport)
    Handler.bridge = bridge
    httpd = ThreadingHTTPServer((config.host, config.port), Handler)
    if config.tls_cert and config.tls_key:
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(config.tls_cert, config.tls_key)
        httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
    bridge._log("escucha tls=%s" % bool(config.tls_cert and config.tls_key))
    return httpd, bridge


def main():
    httpd, bridge = servir()
    bridge._log("puente listo")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.shutdown()


if __name__ == "__main__":
    main()
