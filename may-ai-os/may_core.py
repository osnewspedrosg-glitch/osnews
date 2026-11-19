"""MAY Core: el motor. 1 usuario, 1 IA, 1 memoria, 1 programa."""
import datetime
import os

import may_memory
import eva
import emociones
import bot_personal
import juegos
import mayores
import conocimiento
import no_consumo
import red_apoyo
import detector

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

    nc = no_consumo.resumen_panel()
    if nc:
        lineas.append(nc)

    pruebas = [x for x in m.get("pruebas_sustancias") or [] if not x.get("ocultar_en_resumen")]
    if pruebas:
        lineas.append(f"Pruebas de sustancias visibles: {len(pruebas)} (el parche es un concepto; hoy no existe).")

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
        "  no consumo alcohol [fecha]  Hábito de no consumo (días en limpio)",
        "  checkin alcohol no 4 [nota]  Anotar el día (sí/no, antojo 0-10)",
        "  seguimiento              Rachas, emociones y antojos",
        "  fuentes                  Técnicas y recursos verificados que usa MAY",
        "  red apoyo                Contactos, bot de apoyo y directorio autonómico",
        "  mi medico / mi centro    Apuntar teléfono, correo o WhatsApp",
        "  apoyo familia Ana hija 600...  Contacto familiar",
        "  comunidad Madrid         Elegir tu CCAA (recursos oficiales)",
        "  bot apoyo <nombre> <url> Bot agente de apoyo (solo lo que tú elijas)",
        "  pruebas                  Resultados (los clínicos los introduce el profesional)",
        "  importar prueba          Pegar el código del profesional o del sensor futuro",
        "  autotest orina ...       Autotest casero, aparte de las pruebas profesionales",
        "  ocultar prueba 1         Ocultar una prueba profesional en los resúmenes",
        "  modo profesional         El profesional de la unidad introduce una prueba (PIN propio)",
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



def resumen_apoyo(incluir_pruebas=False):
    """Texto que la persona puede compartir a propósito. Nunca se envía solo."""
    m = may_memory.cargar()
    nombre = m.get("usuario") or "la persona usuaria"
    lineas = [
        f"Resumen de MAY AI OS para {nombre}.",
        "Lo envía la propia persona; MAY no lo manda en segundo plano.",
        no_consumo.seguimiento_texto(),
        "",
        "Últimas emociones:",
        emociones.historial(),
    ]
    extra = detector.resumen_para_compartir(incluir=incluir_pruebas)
    if extra:
        lineas.append("")
        lineas.append(extra)
    lineas.append("")
    lineas.append("Orientativo, consulta a tu médico. Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok")
    return "\n".join(lineas)


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
        respuesta = emociones.registrar(emo, nivel)
        etiquetas = [emo]
        if nivel >= 3:
            etiquetas.append("intensidad-alta")
        ctx = conocimiento.contexto_para_bot(conocimiento.elegir(etiquetas, 2))
        bot = bot_personal.datos()
        if os.environ.get("MAY_API_KEY") or bot.get("enlace"):
            extra = bot_personal.hablar(
                f"El usuario acaba de anotar la emoción «{emo}» con intensidad {nivel}. "
                "Acompáñalo en español, sin juicio, sin diagnóstico.",
                nombre_usuario(),
                contexto=ctx,
            )
            return respuesta + "\n\n" + extra
        return respuesta
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

    if baja in ("fuentes", "biblioteca", "recursos"):
        return conocimiento.listar_fuentes()
    if baja in ("seguimiento",):
        emos = emociones.historial()
        return no_consumo.seguimiento_texto() + "\n\nÚltimas emociones:\n" + emos
    if baja in ("no consumo", "noconsumo", "hábitos limpios", "habitos limpios"):
        return no_consumo.listar()
    if baja.startswith("no consumo "):
        resto = mensaje[11:].strip()
        partes = resto.split()
        fecha = None
        if partes and len(partes[-1]) == 10 and partes[-1][4] == "-":
            fecha = partes[-1]
            partes = partes[:-1]
        sustancia = " ".join(partes)
        return no_consumo.anadir(sustancia, inicio=fecha)
    if baja.startswith("checkin ") or baja.startswith("chequeo "):
        resto = mensaje.split(" ", 1)[-1].strip()
        partes = resto.split()
        if len(partes) < 2:
            return "Por ejemplo: checkin alcohol no 4 gatillo fiesta"
        clave = partes[0]
        consumio = partes[1].lower() in ("sí", "si", "yes", "consumo")
        antojo = 0
        nota = ""
        if len(partes) >= 3 and partes[2].isdigit():
            antojo = int(partes[2])
            nota = " ".join(partes[3:])
        else:
            nota = " ".join(partes[2:])
        return no_consumo.checkin(clave, consumio, antojo, nota)

    if baja in ("red apoyo", "red de apoyo", "apoyo"):
        return red_apoyo.ver()
    if baja in ("comunidad", "comunidades", "ccaa"):
        return red_apoyo.listar_ccaa()
    if baja.startswith("comunidad "):
        return red_apoyo.poner_ccaa(mensaje[10:].strip())
    if baja.startswith("mi medico ") or baja.startswith("mi médico "):
        resto = mensaje.split(" ", 2)[-1].strip()
        partes = resto.split()
        nombre, tel, email, wa = [], "", "", ""
        for p in partes:
            if "@" in p:
                email = p
            elif p.replace("+", "").isdigit() and len(p.replace("+", "")) >= 9:
                tel = p
            else:
                nombre.append(p)
        return red_apoyo.poner_contacto("medico", " ".join(nombre), tel, email, tel)
    if baja.startswith("mi centro "):
        resto = mensaje.split(" ", 2)[-1].strip()
        partes = resto.split()
        nombre, tel, email = [], "", ""
        for p in partes:
            if "@" in p:
                email = p
            elif p.replace("+", "").isdigit() and len(p.replace("+", "")) >= 9:
                tel = p
            else:
                nombre.append(p)
        return red_apoyo.poner_contacto("centro", " ".join(nombre), tel, email, tel)
    if baja.startswith("apoyo familia "):
        resto = mensaje.split(" ", 2)[-1].strip()
        partes = resto.split()
        nombre, rel, tel, email = [], "", "", ""
        for p in partes:
            if "@" in p:
                email = p
            elif p.replace("+", "").isdigit() and len(p.replace("+", "")) >= 9:
                tel = p
            else:
                if not nombre:
                    nombre.append(p)
                else:
                    rel = (rel + " " + p).strip() if not tel else rel
                    if not tel and not p.replace("+", "").isdigit():
                        # remaining words before phone are relacion or more name; treat after first as relacion
                        pass
        # simpler: first token name, optional following non-contact as relacion already handled loosely
        nom = partes[0] if partes else ""
        otros = []
        tel = email = ""
        for p in partes[1:]:
            if "@" in p:
                email = p
            elif p.replace("+", "").isdigit() and len(p.replace("+", "")) >= 9:
                tel = p
            else:
                otros.append(p)
        return red_apoyo.anadir_familia(nom, " ".join(otros), tel, email, tel)
    if baja.startswith("bot apoyo "):
        resto = mensaje[10:].strip()
        partes = resto.rsplit(" ", 1)
        if len(partes) == 2 and partes[1].startswith("http"):
            bot_personal.configurar(partes[0], partes[1], cual="apoyo")
            return f"Bot agente de apoyo conectado: {partes[0]}. Solo se le enviará lo que tú elijas."
        bot_personal.configurar(resto, "", cual="apoyo")
        return f"Guardado el nombre del bot de apoyo: {resto}."
    if baja.startswith("enviar a medico") or baja.startswith("enviar a médico") or baja.startswith("enviar a centro") or baja.startswith("enviar a familia"):
        return (
            "En esta pantalla de texto te preparo el resumen; el envío se hace en la app web "
            "(tel, SMS, correo, WhatsApp o compartir), solo cuando tú pulsas. "
            "Escribe «resumen apoyo» para ver el texto. Nunca se envía solo."
        )
    if baja in ("resumen apoyo", "resumen para el medico", "resumen para el médico"):
        return resumen_apoyo(incluir_pruebas=False) + "\n\nSi quieres incluir las pruebas visibles, escribe: resumen apoyo con pruebas"
    if baja in ("resumen apoyo con pruebas", "resumen apoyo pruebas"):
        return resumen_apoyo(incluir_pruebas=True)

    if baja in ("pruebas", "detector", "analiticas", "analíticas"):
        return detector.listar()
    if baja.startswith("ocultar prueba "):
        resto = baja[15:].strip()
        if resto.isdigit():
            return detector.ocultar(int(resto), True)
        return "Dime el número, por ejemplo: ocultar prueba 1"
    if baja.startswith("mostrar prueba "):
        resto = baja[15:].strip()
        if resto.isdigit():
            return detector.ocultar(int(resto), False)
        return "Dime el número, por ejemplo: mostrar prueba 1"
    if baja in ("importar prueba", "importar detector"):
        return "Pega a continuación el código (JSON o MAY1:...) así: importar prueba MAY1:..."
    if baja.startswith("importar prueba "):
        return detector.importar_codigo(mensaje.split(" ", 2)[-1])
    if baja.startswith("autotest "):
        return (
            "El autotest casero se apunta en la app web, claramente separado de las pruebas "
            "profesionales, o aquí: aún es más seguro que el resultado clínico lo introduzca "
            "tu profesional con «modo profesional» o un código de importación. "
            + detector.AVISO
        )
    if baja in ("modo profesional", "modo profesional pruebas"):
        return (
            "El modo profesional está pensado para que lo use el profesional de tu unidad, "
            "en la consulta, con un PIN profesional distinto del tuyo. "
            "En esta versión de consola genera el código con: python3 profesional.py "
            "y luego pégalo con «importar prueba». En la web está la página Profesional "
            "y el modo profesional dentro de MAY. " + detector.AVISO_IDENTIDAD
        )

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
