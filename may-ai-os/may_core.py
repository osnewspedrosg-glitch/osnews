"""MAY Core: el motor. 1 usuario, 1 IA, 1 memoria, 1 programa."""
import datetime
import os

import may_memory
import eva
import emociones
import bot_personal
import juegos
import mayores

def nombre_usuario():
    return may_memory.cargar().get("usuario") or ""


def poner_nombre(nombre):
    m = may_memory.cargar()
    m["usuario"] = nombre.strip()
    may_memory.guardar(m)


def modo_mayores(activar=None):
    m = may_memory.cargar()
    if activar is None:
        return bool(m.get("modo_mayores"))
    m["modo_mayores"] = bool(activar)
    may_memory.guardar(m)
    return m["modo_mayores"]


def panel():
    m = may_memory.cargar()
    hoy = datetime.date.today().isoformat()
    habitos_hoy = [x for x in m.get("habitos", []) if x.get("fecha") == hoy]
    emos = m.get("emociones", [])[-5:]
    notas = m.get("notas", [])
    pendientes = [x for x in m.get("automatizaciones", []) if not x.get("hecho")]

    lineas = ["=====  PANEL  ====="]
    if habitos_hoy:
        lineas.append("Hábitos de hoy:")
        for h in habitos_hoy:
            lineas.append(f"  · {h.get('habito', '')}")
    else:
        lineas.append("Hábitos de hoy: todavía ninguno.")

    if emos:
        lineas.append("Últimas emociones:")
        for e in emos:
            lineas.append(f"  · {e.get('fecha', '')}: {e.get('nombre', '')} ({e.get('emocion')} {e.get('intensidad')})")
    else:
        lineas.append("Últimas emociones: todavía ninguna.")

    lineas.append(f"Notas guardadas: {len(notas)}")
    lineas.append(juegos.tendencia_panel())

    fam = m.get("familia", [])
    if fam:
        nombres = ", ".join(
            x.get("nombre", "") + (f" ({x['relacion']})" if x.get("relacion") else "")
            for x in fam
        )
        lineas.append(f"Familia: {nombres}")

    if pendientes:
        lineas.append("Recordatorios pendientes: " + ", ".join(x.get("texto", "") for x in pendientes))

    bloque = mayores.resumen_panel()
    if bloque:
        lineas.append(bloque)

    lineas.append("Tu memoria está solo en este aparato, cifrada. El bot no la ve.")
    lineas.append("===================")
    return "\n".join(lineas)


def _memoria_resumen():
    m = may_memory.cargar()
    lineas = [
        "Memoria local (solo en este aparato, cifrada):",
        f"  Notas: {len(m.get('notas', []))}",
        f"  Hábitos: {len(m.get('habitos', []))}",
        f"  Emociones: {len(m.get('emociones', []))}",
        f"  Familia: {len(m.get('familia', []))}",
        f"  Partidas de juegos: {len(m.get('juegos', []))}",
        f"  Recordatorios de mayores: {len(m.get('mayores_checks', []))}",
        "",
        "Esta memoria no se envía al bot. Si quieres compartir algo: comparte <texto>",
        "Escribe «notas» para leer las notas, «exportar» para una copia cifrada.",
    ]
    return "\n".join(lineas)


def _ayuda():
    return "\n".join([
        "Comandos de MAY:",
        "  chat                     Hablar con tu bot (solo se envía el mensaje actual)",
        "  comparte <texto>         Enviar un texto concreto a tu bot, a propósito",
        "  habito <texto>           Apuntar un hábito de hoy",
        "  habitos                  Ver hábitos",
        "  rueda / emociones        Ver la rueda de emociones",
        "  siento tristeza 2        Anotar una emoción (intensidad 1-3)",
        "  mis emociones            Ver las últimas emociones",
        "  nota <texto>             Guardar una nota",
        "  notas                    Ver notas",
        "  memoria                  Resumen de lo guardado en este aparato",
        "  recuerda <texto>         Añadir un recordatorio",
        "  automatizaciones         Ver recordatorios",
        "  hecho 1                  Marcar un recordatorio como hecho",
        "  panel                    Resumen del día",
        "  juegos                   Sesión corta de estimulación (5 ejercicios)",
        "  familia añadir Ana hija  Apuntar un familiar",
        "  familia                  Ver familiares",
        "  modo mayores             Textos claros y comprobaciones de seguridad/medicación",
        "  mayores                  Ver los recordatorios de mayores",
        "  recordar 09:00 pastilla del azúcar   Añadir uno con hora",
        "  quitar 1                 Quitar un recordatorio de mayores",
        "  sí / no                  Responder a una comprobación pendiente",
        "  exportar                 Copia cifrada de tu memoria",
        "  exportar claro           Copia en JSON (pide confirmación)",
        "  mi bot <nombre> <enlace> Conectar tu bot personal",
        "  salir                    Cerrar MAY",
        "",
        "Tu memoria local y la del modelo están separadas.",
        "Las claves (MAY_API_KEY, PIN) nunca van en el código.",
    ])


def _exportar(claro=False, confirmar=None):
    marca = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    carpeta = may_memory.DIR_DATOS
    if claro:
        if confirmar != "SÍ":
            return (
                "Esto crea un archivo JSON sin cifrar, que se podrá leer sin PIN. "
                "Si estás seguro, escribe exactamente: confirmar exportar claro SÍ"
            )
        ruta = os.path.join(carpeta, f"export-{marca}.json")
        may_memory.exportar_claro(ruta)
        return f"Copia sin cifrar guardada en {ruta}. Trátala como información privada."
    ruta = os.path.join(carpeta, f"export-{marca}.may")
    may_memory.exportar_cifrado(ruta)
    return f"Copia cifrada guardada en {ruta}. Se abre con tu mismo PIN."


def responder(mensaje, confirmar_claro=None):
    # La conversación se guarda solo en local, nunca se envía al bot.
    may_memory.recordar("conversacion", mensaje)
    m = mensaje.strip()
    baja = m.lower()

    if baja in ("ayuda", "help", "comandos"):
        return _ayuda()
    if baja in ("panel",):
        return panel()
    if baja in ("memoria", "mi memoria"):
        return _memoria_resumen()
    if baja in ("modo mayores", "modo mayor"):
        modo_mayores(True)
        mayores.sembrar_si_vacio()
        return (
            "Modo mayores activado: textos más claros y recordatorios de seguridad y medicación, con calma.\n"
            "Te iré preguntando, por ejemplo, si has apagado el fuego o si has tomado la medicación del azúcar.\n"
            + mayores.AVISO
        )
    if baja in ("modo normal",):
        modo_mayores(False)
        return "Modo normal activado. Los recordatorios de mayores quedan en pausa."
    if baja in ("mayores", "modo mayores lista"):
        if not mayores.activado():
            # Se puede listar igual, pero recordamos cómo activarlo.
            return mayores.listar()
        return mayores.listar()

    if baja.startswith("habito "):
        return eva.anotar_habito(mensaje[7:])
    if baja in ("habitos", "hábitos"):
        return eva.ver_habitos()

    if baja.startswith("nota "):
        may_memory.recordar("notas", mensaje[5:].strip())
        return "Nota guardada. Se queda en este aparato, cifrada."
    if baja == "notas":
        notas = may_memory.cargar().get("notas", [])
        return "\n".join(notas) or "Sin notas."

    if baja in ("rueda", "emociones"):
        return emociones.mostrar()
    if baja.startswith("siento "):
        partes = baja[7:].split()
        nivel = int(partes[-1]) if partes and partes[-1].isdigit() else 2
        emo = " ".join(p for p in partes if not p.isdigit())
        return emociones.registrar(emo, nivel)
    if baja in ("mis emociones", "historial emociones"):
        return emociones.historial()

    if baja.startswith("recordar "):
        resto = mensaje[9:].strip()
        partes = resto.split(None, 1)
        hora = ""
        texto = resto
        if partes and mayores._parse_hora(partes[0]):
            hora = partes[0]
            texto = partes[1] if len(partes) > 1 else ""
        if not mayores.activado():
            modo_mayores(True)
            mayores.sembrar_si_vacio()
        return mayores.anadir(texto, hora)
    if baja.startswith("quitar "):
        resto = baja[7:].strip()
        if resto.isdigit():
            return mayores.quitar(int(resto))
        return "Dime el número, por ejemplo: quitar 1"
    # sí / no (con o sin número) para las comprobaciones de mayores
    si_no = mayores.responder_si_no(mensaje)
    if si_no is not None:
        return si_no

    if baja.startswith("recuerda "):
        return eva.anotar_recordatorio(mensaje[9:])
    if baja in ("automatizaciones", "automatizacion", "recordatorios"):
        return eva.ver_automatizaciones()
    if baja.startswith("hecho "):
        resto = baja[6:].strip()
        if resto.isdigit():
            return eva.marcar_hecho(int(resto))
        return "Dime el número, por ejemplo: hecho 1"

    if baja.startswith("familia añadir ") or baja.startswith("familia agregar "):
        resto = m.split(" ", 2)[-1].strip()
        partes = resto.split()
        if not partes:
            return "Por ejemplo: familia añadir Ana hija"
        if len(partes) == 1:
            return juegos.familia_anadir(partes[0], "")
        return juegos.familia_anadir(partes[0], " ".join(partes[1:]))
    if baja in ("familia", "mi familia"):
        return juegos.ver_familia()

    if baja in ("juegos", "juego"):
        return "Escribe «juegos» en la pantalla de MAY para empezar una sesión de 5 ejercicios, con calma."

    if baja == "exportar claro":
        return _exportar(claro=True, confirmar=confirmar_claro)
    if baja.startswith("confirmar exportar claro"):
        # «confirmar exportar claro SÍ»
        partes = m.split()
        confirmacion = partes[-1] if partes else ""
        return _exportar(claro=True, confirmar=confirmacion)
    if baja == "exportar":
        return _exportar(claro=False)

    if baja.startswith("mi bot "):
        partes = mensaje[7:].rsplit(" ", 1)
        if len(partes) == 2 and partes[1].startswith("http"):
            bot_personal.configurar(partes[0], partes[1])
            return f"Conectado: {partes[0]}."
        bot_personal.configurar(mensaje[7:], "")
        return f"Guardado el nombre de tu bot: {mensaje[7:]}."

    if baja in ("chat",):
        bot = bot_personal.datos()
        nombre_bot = bot.get("nombre") or "tu bot"
        return (
            f"Escribe lo que quieras y lo enviaré a {nombre_bot}. "
            "Solo se envía ese mensaje; tu memoria local no se comparte. "
            "Si quieres compartir algo concreto: comparte <texto>"
        )

    if baja.startswith("comparte "):
        texto = mensaje[9:].strip()
        if not texto:
            return "Dime qué quieres compartir con tu bot. Por ejemplo: comparte hoy me siento mejor."
        return bot_personal.hablar(
            "El usuario quiere compartir esto a propósito:",
            nombre_usuario(),
            extra=texto,
        )

    # Chat por defecto: solo el mensaje actual, sin memoria local.
    return bot_personal.hablar(mensaje, nombre_usuario())
