#!/usr/bin/env python3
"""Prueba rápida no interactiva de MAY AI OS (PIN por entorno, carpeta temporal)."""
from __future__ import annotations

import json
import os
import shutil
import sys
import tempfile

def main():
    tmp = tempfile.mkdtemp(prefix="may-ai-os-test-")
    os.environ["MAY_DATA_DIR"] = tmp
    os.environ["MAY_PIN"] = "1234"
    os.environ.pop("MAY_API_KEY", None)
    # imports after env
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import may_memory
    import may_core
    import conocimiento
    import no_consumo
    import detector
    import emociones

    ok, err = may_memory.iniciar()
    assert ok, err
    may_core.poner_nombre("Ana")
    assert may_core.nombre_usuario() == "Ana"

    r = may_core.responder("siento tristeza 3")
    assert "tristeza" in r.lower() or "pena" in r.lower()
    assert "024" in r
    assert "112" in r
    assert "Orientativo, consulta a tu médico" in r
    assert "Beck" in r or "Goleman" in r or "tierra" in r.lower() or "024" in r

    r = may_core.responder("no consumo alcohol 2026-01-01")
    assert "alcohol" in r.lower()
    r = may_core.responder("checkin alcohol no 9 gatillo fiesta")
    assert "024" in r or "antojo" in r.lower()
    r = may_core.responder("checkin alcohol sí 2")
    assert "juicio" in r.lower() or "tropiezo" in r.lower() or "calma" in r.lower()
    assert "¡mal!" not in r.lower() and "eso está mal" not in r.lower()

    tec = conocimiento.elegir(["tristeza", "intensidad-alta"], 2)
    assert tec, "debería elegir técnicas"
    fuentes = conocimiento.listar_fuentes()
    assert "https://www.sanidad.gob.es/linea024/" in fuentes
    assert "https://pnsd.sanidad.gob.es/" in fuentes

    payload = detector.construir_payload(
        {"centro": "UCA Ejemplo", "nombre": "Dra. Prueba", "colegiado": "00"},
        "2026-11-19",
        "orina",
        {"alcohol": "negativo", "cocaína": "no analizado"},
        "",
    )
    codigo = detector.codigo_importacion(payload)
    assert codigo.startswith("MAY1:")
    r = detector.importar_codigo(codigo)
    assert "importado" in r.lower() or "He importado" in r
    lst = detector.listar()
    assert "profesional" in lst.lower()
    assert "Dra. Prueba" in lst or "UCA Ejemplo" in lst
    r = detector.ocultar(1, True)
    assert "oculta" in r.lower()
    # usuario no edita el registro: ocultar no cambia origen ni resultados
    p = may_memory.cargar()["pruebas_sustancias"][0]
    assert p["origen"] == "profesional"
    assert p["ocultar_en_resumen"] is True

    r = detector.anotar_autotest("2026-11-19", "saliva", {"alcohol": "negativo"})
    assert "autotest" in r.lower()
    lst = detector.listar()
    assert "autotest" in lst.lower()

    # PIN incorrecto no toca los datos
    may_memory.cerrar()
    os.environ["MAY_PIN"] = "0000"
    may_memory._fernet = None
    may_memory._salt = None
    ok, err = may_memory.iniciar()
    assert not ok
    assert "incorrecto" in err.lower()
    raw = open(os.path.join(tmp, "memory.may"), "rb").read()
    assert raw.startswith(may_memory.MAGIC)
    assert b"Ana" not in raw  # no va en claro
    # volver a abrir con el PIN bueno
    os.environ["MAY_PIN"] = "1234"
    ok, err = may_memory.iniciar()
    assert ok, err
    assert may_core.nombre_usuario() == "Ana"

    panel = may_core.panel()
    assert "PANEL" in panel
    seg = may_core.responder("seguimiento")
    assert "NO CONSUMO" in seg or "limpio" in seg.lower()
    red = may_core.responder("comunidad")
    assert "Andalucía" in red
    assert "pendiente de verificar" in red
    ficha = may_core.responder("comunidad Madrid")
    assert "comunidad.madrid" in ficha or "Adicciones" in ficha

    may_memory.cerrar()
    shutil.rmtree(tmp, ignore_errors=True)
    print("SELFTEST OK")
    return 0

if __name__ == "__main__":
    sys.exit(main())
