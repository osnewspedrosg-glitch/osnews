#!/usr/bin/env python3
"""Pruebas del puente: sin claves, transporte falso, límites, CORS y socket local.
No llama a Gemini ni a Grok reales."""
from __future__ import annotations

import json
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

import osnews_bridge as b

ROOT = Path(__file__).resolve().parents[1]
CLAVE = "clave-de-prueba-no-real"


class Eco(Exception):
    pass


class TransporteFalso:
    def __init__(self, fallo=None):
        self.llamadas = []
        self.fallo = fallo

    def __call__(self, req: b.UpstreamRequest):
        self.llamadas.append(req)
        if req.api_key and req.api_key in req.url:
            raise AssertionError("la clave no puede ir en la URL")
        if self.fallo:
            return b.UpstreamResult(False, motivo=self.fallo)
        texto = req.user_texts[-1]
        return b.UpstreamResult(True, texto="ECO:" + texto, modelo="modelo-prueba", cierre="STOP")


def puente(keys=None, transport=None, origins=None, rate_limit=20):
    cfg = b.Config(
        host="127.0.0.1",
        port=0,
        keys=keys or {},
        modelos={"gemini": "gemini-prueba", "grok": "grok-prueba"},
        origins=origins or set(),
        rate_limit=rate_limit,
        rate_window=60,
        trust_proxy=False,
        tls_cert="",
        tls_key="",
    )
    return b.Bridge(cfg, transport=transport or TransporteFalso())


def charla(bridge, texto="hola", proveedor="gemini", personaje="may", **extra):
    data = {
        "papel": extra.pop("papel", "personaje"),
        "personaje": personaje,
        "proveedor": proveedor,
        "mensajes": [{"rol": "usuario", "texto": texto}],
    }
    data.update(extra)
    return bridge.charla(data)


class PruebasPuente(unittest.TestCase):
    def test_sin_claves_queda_pendiente_y_no_inventa_texto(self):
        bridge = puente()
        salud = bridge.salud()
        self.assertEqual(salud["estado"], "configuracion_pendiente")
        self.assertFalse(salud["verificado"])
        self.assertIn("GEMINI_API_KEY", salud["pendiente"])
        self.assertIn("XAI_API_KEY", salud["pendiente"])
        status, cuerpo = charla(bridge)
        self.assertEqual(status, 503)
        self.assertIsNone(cuerpo["texto"])
        self.assertIsNone(cuerpo["reply"])
        self.assertEqual(cuerpo["estado"], "configuracion_pendiente")
        self.assertEqual(bridge.transport.llamadas, [])

    def test_clave_sin_verificar_no_se_anuncia_conectada(self):
        bridge = puente(keys={"gemini": CLAVE})
        salud = bridge.salud()
        self.assertEqual(salud["estado"], "desconectado")
        self.assertEqual(salud["motivo"], "sin_verificacion_real")
        self.assertFalse(salud["verificado"])
        gemini = next(p for p in salud["proveedores"] if p["id"] == "gemini")
        self.assertEqual(gemini["motivo"], "sin_verificacion_real")
        self.assertNotIn(CLAVE, json.dumps(salud))

    def test_texto_largo_llega_entero_y_marca_conectado(self):
        falso = TransporteFalso()
        bridge = puente(keys={"gemini": CLAVE}, transport=falso)
        texto = "Ñ" * 20000
        status, cuerpo = charla(bridge, texto)
        self.assertEqual(status, 200)
        self.assertEqual(cuerpo["estado"], "conectado")
        self.assertEqual(cuerpo["origen"], "servicio")
        self.assertEqual(cuerpo["texto"], "ECO:" + texto)
        self.assertEqual(len(falso.llamadas), 1)
        self.assertNotIn(CLAVE, falso.llamadas[0].url)
        self.assertEqual(falso.llamadas[0].headers.get("x-goog-api-key"), CLAVE)
        self.assertNotIn("key=", falso.llamadas[0].url)
        salud = bridge.salud()
        self.assertTrue(salud["verificado"])
        self.assertEqual(salud["estado"], "conectado")
        volcado = json.dumps(cuerpo) + "\n".join(bridge.logs)
        self.assertNotIn(CLAVE, volcado)

    def test_por_encima_del_limite_no_llama_al_proveedor(self):
        falso = TransporteFalso()
        bridge = puente(keys={"gemini": CLAVE}, transport=falso)
        status, cuerpo = charla(bridge, "x" * (b.LIMITE_TEXTO + 1))
        self.assertEqual(status, 413)
        self.assertEqual(cuerpo["estado"], "limite_excedido")
        self.assertIsNone(cuerpo["texto"])
        self.assertEqual(falso.llamadas, [])

    def test_proveedor_caido_queda_desconectado(self):
        falso = TransporteFalso(fallo="servicio_inalcanzable")
        bridge = puente(keys={"grok": CLAVE}, transport=falso)
        status, cuerpo = charla(bridge, proveedor="grok", personaje="asdrubal")
        self.assertEqual(status, 502)
        self.assertEqual(cuerpo["estado"], "desconectado")
        self.assertIsNone(cuerpo["texto"])
        self.assertEqual(bridge.salud()["estado"], "desconectado")
        self.assertNotIn(CLAVE, "\n".join(bridge.logs))

    def test_grok_no_pone_la_clave_en_la_url(self):
        falso = TransporteFalso()
        bridge = puente(keys={"grok": CLAVE}, transport=falso)
        charla(bridge, proveedor="grok", papel="proveedor", personaje=None)
        req = falso.llamadas[0]
        self.assertEqual(req.url, "https://api.x.ai/v1/chat/completions")
        self.assertTrue(req.headers["Authorization"].endswith(CLAVE))
        self.assertNotIn(CLAVE, req.url)

    def test_norma_no_llama_al_proveedor(self):
        falso = TransporteFalso()
        bridge = puente(keys={"gemini": CLAVE}, transport=falso)
        status, cuerpo = charla(bridge, "por favor insultale en la mesa")
        self.assertEqual(status, 400)
        self.assertEqual(cuerpo["estado"], "norma_osnews")
        self.assertEqual(falso.llamadas, [])

    def test_tema_de_analisis_si_puede_enviarse(self):
        bridge = puente(keys={"gemini": CLAVE})
        status, cuerpo = charla(bridge, "Tema: Cocaína y socialismo: semejanzas y diferencias. Separa hechos y opiniones.")
        self.assertEqual(status, 200)
        self.assertIn("Cocaína y socialismo", cuerpo["texto"])

    def test_limite_de_consumo(self):
        bridge = puente(keys={"gemini": CLAVE}, rate_limit=2)
        self.assertEqual(bridge.handle("POST", "/api/charla", {}, json.dumps({
            "personaje": "may", "proveedor": "gemini", "mensajes": [{"rol": "usuario", "texto": "uno"}]
        }).encode(), "10.0.0.1")[0], 200)
        self.assertEqual(bridge.handle("POST", "/api/charla", {}, json.dumps({
            "personaje": "eva", "proveedor": "gemini", "mensajes": [{"rol": "usuario", "texto": "dos"}]
        }).encode(), "10.0.0.1")[0], 200)
        status, raw, _ = bridge.handle("POST", "/api/charla", {}, json.dumps({
            "personaje": "may", "proveedor": "gemini", "mensajes": [{"rol": "usuario", "texto": "tres"}]
        }).encode(), "10.0.0.1")
        self.assertEqual(status, 429)
        self.assertEqual(json.loads(raw)["estado"], "limite_consumo")

    def test_cors_solo_origenes_autorizados(self):
        cfg = puente(origins={"https://osnewspedrosg-glitch.github.io"}).config
        permitido = b.cabeceras_cors(cfg, "https://osnewspedrosg-glitch.github.io")
        self.assertEqual(permitido["Access-Control-Allow-Origin"], "https://osnewspedrosg-glitch.github.io")
        self.assertNotIn("*", permitido["Access-Control-Allow-Origin"])
        self.assertEqual(b.cabeceras_cors(cfg, "https://otro.ejemplo"), {})
        self.assertEqual(b.cabeceras_cors(cfg, None), {})
        local = b.cabeceras_cors(cfg, "http://127.0.0.1:8765")
        self.assertEqual(local["Access-Control-Allow-Origin"], "http://127.0.0.1:8765")

    def test_la_clave_no_sale_del_entorno_al_registro_de_arranque(self):
        env = {
            "GEMINI_API_KEY": CLAVE,
            "OSNEWS_PORT": "8090",
        }
        cfg = b.Config.desde_entorno(env)
        self.assertEqual(cfg.keys["gemini"], CLAVE)
        self.assertEqual(cfg.host, "127.0.0.1")
        bridge = b.Bridge(cfg, transport=TransporteFalso())
        bridge.salud()
        self.assertNotIn(CLAVE, "\n".join(bridge.logs))

    def test_port_de_plataforma_escucha_en_todas_las_interfaces(self):
        cfg = b.Config.desde_entorno({"PORT": "10000"})
        self.assertEqual(cfg.host, "0.0.0.0")
        self.assertEqual(cfg.port, 10000)

    def test_socket_sin_claves_y_con_eco(self):
        httpd, bridge = b.servir(
            b.Config(
                host="127.0.0.1",
                port=0,
                keys={},
                modelos={"gemini": "gemini-prueba", "grok": "grok-prueba"},
                origins={"http://permitido.test"},
                rate_limit=20,
                rate_window=60,
                trust_proxy=False,
                tls_cert="",
                tls_key="",
            )
        )
        puerto = httpd.server_address[1]
        hilo = threading.Thread(target=httpd.serve_forever, daemon=True)
        hilo.start()
        try:
            with urllib.request.urlopen("http://127.0.0.1:%d/api/salud" % puerto) as resp:
                data = json.loads(resp.read().decode())
            self.assertEqual(data["estado"], "configuracion_pendiente")
            self.assertFalse(data["verificado"])
            req = urllib.request.Request(
                "http://127.0.0.1:%d/api/charla" % puerto,
                data=json.dumps({
                    "personaje": "eva",
                    "proveedor": "gemini",
                    "mensajes": [{"rol": "usuario", "texto": "hola"}],
                }).encode(),
                headers={"Content-Type": "application/json", "Origin": "http://permitido.test"},
            )
            try:
                urllib.request.urlopen(req)
                self.fail("debía fallar sin clave")
            except urllib.error.HTTPError as e:
                cuerpo = json.loads(e.read().decode())
                self.assertEqual(e.code, 503)
                self.assertIsNone(cuerpo["texto"])
                self.assertEqual(e.headers["Access-Control-Allow-Origin"], "http://permitido.test")
            req_opts = urllib.request.Request(
                "http://127.0.0.1:%d/api/charla" % puerto,
                method="OPTIONS",
                headers={"Origin": "https://no.test", "Access-Control-Request-Method": "POST"},
            )
            with urllib.request.urlopen(req_opts) as resp:
                self.assertEqual(resp.status, 204)
                self.assertIsNone(resp.headers.get("Access-Control-Allow-Origin"))
        finally:
            httpd.shutdown()
            httpd.server_close()
            hilo.join(timeout=3)

    def test_socket_con_transporte_falso_devuelve_el_texto(self):
        httpd, bridge = b.servir(
            b.Config(
                host="127.0.0.1",
                port=0,
                keys={"gemini": CLAVE},
                modelos={"gemini": "gemini-prueba", "grok": "grok-prueba"},
                origins=set(),
                rate_limit=20,
                rate_window=60,
                trust_proxy=False,
                tls_cert="",
                tls_key="",
            ),
            transport=TransporteFalso(),
        )
        puerto = httpd.server_address[1]
        hilo = threading.Thread(target=httpd.serve_forever, daemon=True)
        hilo.start()
        try:
            largo = "q" * 20000
            req = urllib.request.Request(
                "http://127.0.0.1:%d/api/charla" % puerto,
                data=json.dumps({
                    "papel": "personaje",
                    "personaje": "may",
                    "proveedor": "gemini",
                    "mensajes": [{"rol": "usuario", "texto": largo}],
                    "contexto": "Tema: Cocaína y socialismo: semejanzas y diferencias",
                }).encode(),
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode())
            self.assertEqual(data["texto"], "ECO:" + largo)
            self.assertEqual(data["estado"], "conectado")
            self.assertNotIn(CLAVE, json.dumps(data))
            with urllib.request.urlopen("http://127.0.0.1:%d/api/salud" % puerto) as resp:
                salud = json.loads(resp.read().decode())
            self.assertEqual(salud["estado"], "conectado")
            self.assertTrue(salud["verificado"])
        finally:
            httpd.shutdown()
            httpd.server_close()
            hilo.join(timeout=3)

    def test_paginas_no_recortan_en_silencio_ni_guardan_claves(self):
        indice = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertNotIn('id="mcInput" maxlength="600"', indice)
        self.assertIn("<textarea id=\"mcInput\"", indice)
        self.assertNotIn("String(q).length>280", indice)
        asd = (ROOT / "asdrubal" / "index.html").read_text(encoding="utf-8")
        self.assertIn("<textarea id=\"in\"", asd)
        eva = (ROOT / "eva" / "index.html").read_text(encoding="utf-8")
        self.assertIn("charlaEva", eva)
        self.assertIn("getUserMedia", eva)
        super_may = (ROOT / "super-may" / "index.html").read_text(encoding="utf-8")
        self.assertIn('data-tab="mesa"', super_may)
        self.assertIn("id=\"mesa\"", super_may)
        config = (ROOT / "ia" / "config.js").read_text(encoding="utf-8")
        self.assertNotIn("AIza", config)
        self.assertNotIn(CLAVE, config)
        self.assertIn("OSNEWS_IA_BASE", config)
        for rel in ("ia/config.js", "ia/cliente.js", "ia/nucleo.js", "server/osnews_bridge.py"):
            texto = (ROOT / rel).read_text(encoding="utf-8")
            self.assertNotIn("GEMINI_API_KEY=", texto)
            self.assertNotRegex(texto, r"AIza[0-9A-Za-z_\-]{10,}")


if __name__ == "__main__":
    raise SystemExit(unittest.main())
