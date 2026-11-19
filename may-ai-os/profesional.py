#!/usr/bin/env python3
"""Página/comando profesional (sin servidor): genera un código de importación
para que la persona lo pegue en MAY AI OS.

No accede a la memoria de la persona. La identidad del profesional no queda
verificada criptográficamente (no hay servidor ni firma digital).
"""
from __future__ import annotations

import json
import sys

import detector


def _pedir(prompt):
    try:
        return input(prompt)
    except (EOFError, KeyboardInterrupt):
        print()
        return None


def _resultados():
    res = {}
    print("Para cada sustancia: negativo / positivo / no analizado (Enter = no analizado)")
    for s in detector.SUSTANCIAS:
        v = _pedir(f"  {s}: ")
        if v is None:
            return None
        res[s] = detector._norm_resultado(v)
    return res


def main():
    print("[ MAY AI OS · Modo profesional ]")
    print("Para profesionales de una unidad de conductas adictivas o centro de drogodependencias.")
    print("Genera un código que la persona importa en su MAY. No se envía a ningún servidor.")
    print(detector.AVISO_IDENTIDAD)
    print(detector.AVISO)
    print()
    centro = _pedir("Centro o unidad: ")
    if centro is None:
        return
    nombre = _pedir("Nombre del profesional: ")
    if nombre is None:
        return
    colegiado = _pedir("Nº colegiado (opcional): ")
    if colegiado is None:
        return
    fecha = _pedir("Fecha de la prueba (AAAA-MM-DD, Enter = hoy): ")
    if fecha is None:
        return
    tipo = _pedir("Tipo (orina, saliva, sangre, parche de sudor, alcoholímetro, otro): ")
    if tipo is None:
        return
    res = _resultados()
    if res is None:
        return
    nota = _pedir("Nota (opcional): ")
    if nota is None:
        return
    payload = detector.construir_payload(
        {"centro": centro.strip(), "nombre": nombre.strip(), "colegiado": (colegiado or "").strip()},
        (fecha or "").strip(),
        tipo,
        res,
        (nota or "").strip(),
    )
    codigo = detector.codigo_importacion(payload)
    print("\n--- JSON ---")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    print("\n--- Código para pegar en MAY (importar prueba) ---")
    print(codigo)
    print("\nLa persona lo pega en MAY con: importar prueba")
    print(detector.AVISO)


if __name__ == "__main__":
    sys.exit(main() or 0)
