#!/usr/bin/env python3
"""MAY AI OS - pantalla de inicio. 1 usuario, 1 IA, 1 memoria, 1 programa."""
import sys

import may_core
import may_memory
import recordatorios
import juegos
import mayores

MENU = "[Chat] [Hábitos] [Emociones] [Memoria] [Automatizaciones] [Panel] [Juegos] [Mayores]"
MENU_MAYOR = (
    "\n"
    "  [ Chat ]     [ Hábitos ]     [ Emociones ]     [ Memoria ]\n"
    "  [ Automatizaciones ]  [ Panel ]  [ Juegos ]  [ Mayores ]\n"
)


def _pedir(prompt):
    try:
        return input(prompt)
    except (EOFError, KeyboardInterrupt):
        print()
        return None


def main():
    print("[ MAY AI OS ]\n")
    ok, error = may_memory.iniciar()
    if not ok:
        print(error)
        sys.exit(1)

    nombre = may_core.nombre_usuario()
    if not nombre:
        raw = _pedir("> Hola, soy MAY. ¿Cómo te llamas? ")
        if raw is None:
            print("Hasta luego.")
            return
        nombre = raw.strip() or "amigo"
        may_core.poner_nombre(nombre)
        bot = _pedir("> ¿Cómo se llama tu bot personal? (Enter para saltar) ")
        if bot is None:
            print(f"Hasta luego, {nombre}.")
            return
        bot = bot.strip()
        if bot:
            enlace = _pedir("> Pega el enlace de tu bot (Enter para saltar) ")
            if enlace is None:
                print(f"Hasta luego, {nombre}.")
                return
            may_core.bot_personal.configurar(bot, (enlace or "").strip())

    rec = recordatorios.al_arrancar()
    if rec:
        print(rec)
        print()

    if may_core.modo_mayores():
        resultado = mayores.ronda_preguntas(lambda: _pedir(f"{nombre}> "))
        if resultado == "salir":
            print(f"Hasta luego, {nombre}.")
            may_memory.cerrar()
            return

    print(f"> Hola {nombre}, ¿qué necesitas?")
    if may_core.modo_mayores():
        print(MENU_MAYOR)
    else:
        print(MENU)
    print(
        "(chat, habito, siento tristeza 2, nota, panel, juegos, mayores,\n"
        " recordar 09:00 pastilla del azúcar, sí / no, familia añadir Ana hija,\n"
        " exportar, exportar claro, comparte <texto>, ayuda, salir)\n"
    )

    while True:
        texto = _pedir(f"{nombre}> ")
        if texto is None or texto.strip().lower() in ("salir", "exit"):
            print(f"Hasta luego, {nombre}.")
            break
        texto = texto.strip()
        if not texto:
            continue
        baja = texto.lower()
        if baja in ("juegos", "juego"):
            may_memory.recordar("conversacion", texto)
            juegos.sesion(lambda: _pedir(f"{nombre}> ") or "saltar")
            continue
        if baja == "exportar claro":
            print(
                "MAY> Esto crea un archivo JSON sin cifrar, que se podrá leer sin PIN.\n"
                "MAY> Escribe SÍ (en mayúsculas) para confirmar, u otra cosa para cancelar."
            )
            conf = _pedir(f"{nombre}> ")
            if conf is None:
                print(f"Hasta luego, {nombre}.")
                break
            if conf.strip() == "SÍ":
                print("MAY>", may_core.responder("confirmar exportar claro SÍ"))
            else:
                print("MAY> No he creado la copia en claro.")
            continue
        respuesta = may_core.responder(texto)
        print("MAY>", respuesta)
        if baja in ("modo mayores", "modo mayor"):
            resultado = mayores.ronda_preguntas(lambda: _pedir(f"{nombre}> "))
            if resultado == "salir":
                print(f"Hasta luego, {nombre}.")
                break
            print(MENU_MAYOR)

    may_memory.cerrar()


if __name__ == "__main__":
    main()
