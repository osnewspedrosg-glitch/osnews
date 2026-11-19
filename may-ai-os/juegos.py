"""Juegos de estimulación cognitiva, en tono calmado (Modo mayores).

Son ejercicios orientativos de estimulación. No sustituyen un tratamiento
ni un diagnóstico. Si hay dudas, consulta a tu médico.

Nunca se dice «¡mal!» ni se castiga. Si no aciertan, hay pista, otro intento
o la opción de saltar. Las puntuaciones se guardan cifradas en la memoria
local para que la persona cuidadora las vea en el panel.
"""
from __future__ import annotations

import datetime
import os
import random

import may_memory

AVISO = (
    "Juegos de estimulación, no sustituyen tratamiento; orientativo, consulta a tu médico."
)

DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

REFRANES = [
    ("Más vale pájaro en mano que…", "ciento volando", "Piensa en un número grande de pájaros, volando."),
    ("Más vale tarde que…", "nunca", "Es lo contrario de «alguna vez»."),
    ("A quien madruga, Dios le…", "ayuda", "Es lo que hace quien echa una mano."),
    ("No hay mal que por bien no…", "venga", "Es lo que hace algo cuando llega."),
    ("En casa del herrero, cuchillo de…", "palo", "Un material sencillo, de árbol."),
    ("El que ríe el último, ríe…", "mejor", "Es lo contrario de peor."),
    ("A caballo regalado no le mires el…", "diente", "Una parte de la boca."),
    ("Dime con quién andas y te diré quién…", "eres", "Es la segunda persona de «ser»."),
    ("No por mucho madrugar amanece más…", "temprano", "Es lo contrario de tarde."),
    ("Ojos que no ven, corazón que no…", "siente", "Es lo que hace el corazón con una emoción."),
]

CATEGORIAS = [
    ("¿Cuál no es una fruta?", ["manzana", "pera", "silla", "plátano"], "silla", "Tres se comen; una se usa para sentarse."),
    ("¿Cuál no es un animal?", ["gato", "perro", "mesa", "pájaro"], "mesa", "Tres tienen vida; una está en el comedor."),
    ("¿Cuál no es una prenda de vestir?", ["camisa", "pantalón", "cuchara", "zapato"], "cuchara", "Tres se ponen; una se usa para comer."),
    ("¿Cuál no es un color?", ["rojo", "azul", "sábado", "verde"], "sábado", "Tres se ven; uno es un día de la semana."),
    ("¿Cuál no es un medio de transporte?", ["coche", "tren", "manzana", "autobús"], "manzana", "Tres sirven para moverse; una se come."),
]

MONEDAS = [
    ("Tienes 1 euro y una moneda de 50 céntimos. ¿Cuánto dinero tienes en total?", "1,50", ["1,50", "1.50", "1,5", "1.5", "150 centimos", "1 euro y 50"], "Junta 1 euro y medio euro."),
    ("Tienes dos monedas de 1 euro. ¿Cuánto dinero tienes?", "2", ["2", "2 euros", "2€", "2,00", "2.00"], "1 y 1."),
    ("Tienes 2 euros y das 50 céntimos. ¿Cuánto te queda?", "1,50", ["1,50", "1.50", "1,5", "1.5"], "Quita medio euro a 2 euros."),
    ("Tienes tres monedas de 20 céntimos. ¿Cuánto es en total?", "0,60", ["0,60", "0.60", "60", "60 centimos", "0,6"], "20 + 20 + 20 céntimos."),
]

SECUENCIAS = [
    (
        "Ordena los pasos para hacer un café. Escribe los números en orden, por ejemplo: 2-3-1\n"
        "  1. Servirlo en la taza\n"
        "  2. Calentar el agua\n"
        "  3. Poner el café y añadir el agua",
        "2-3-1",
        ["2-3-1", "231", "2 3 1", "2,3,1"],
        "Primero se calienta el agua, luego se prepara y al final se sirve.",
    ),
    (
        "Ordena los pasos para lavarse las manos. Escribe los números en orden, por ejemplo: 1-2-3\n"
        "  1. Enjabonarse\n"
        "  2. Abrir el grifo y mojarse\n"
        "  3. Aclarar y secarse",
        "2-1-3",
        ["2-1-3", "213", "2 1 3", "2,1,3"],
        "Primero se mojan, luego el jabón y al final se aclaran.",
    ),
    (
        "Ordena los pasos para vestirse por la mañana. Escribe los números en orden, por ejemplo: 1-2-3\n"
        "  1. Ponerse el abrigo, si hace falta\n"
        "  2. Ponerse la ropa interior\n"
        "  3. Ponerse la camisa y el pantalón",
        "2-3-1",
        ["2-3-1", "231", "2 3 1", "2,3,1"],
        "De dentro hacia fuera: primero lo de debajo, luego la ropa y al final el abrigo.",
    ),
]

PALABRAS_MEMORIA = [
    ("sol", "casa", "pan"),
    ("flor", "agua", "mesa"),
    ("gato", "libro", "luna"),
    ("café", "puerta", "nube"),
]


def _sin_tildes(s: str) -> str:
    s = s.lower().strip()
    # La ñ se conserva; solo se quitan tildes habituales.
    return s.replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u").replace("ü", "u")


def _parece(respuesta: str, aceptadas) -> bool:
    r = _sin_tildes(respuesta)
    r = " ".join(r.split())
    r = r.replace("?", "").replace(".", "").replace("!", "").replace("€", "")
    for a in aceptadas:
        a2 = _sin_tildes(str(a))
        if r == a2 or a2 in r or r in a2:
            return True
    return False


def _marco(texto: str) -> str:
    lineas = texto.split("\n")
    ancho = max(40, min(72, max(len(x) for x in lineas) + 4))
    borde = "=" * ancho
    cuerpo = "\n".join("  " + x for x in lineas)
    return f"\n{borde}\n{cuerpo}\n{borde}\n"


def _estacion_hoy(hoy=None):
    hoy = hoy or datetime.date.today()
    mes, dia = hoy.month, hoy.day
    # Hemisferio norte (España).
    if (mes == 3 and dia >= 21) or mes in (4, 5) or (mes == 6 and dia <= 20):
        return "primavera"
    if (mes == 6 and dia >= 21) or mes in (7, 8) or (mes == 9 and dia <= 22):
        return "verano"
    if (mes == 9 and dia >= 23) or mes in (10, 11) or (mes == 12 and dia <= 20):
        return "otoño"
    return "invierno"


def familia_anadir(nombre, relacion=""):
    nombre = nombre.strip()
    relacion = relacion.strip()
    if not nombre:
        return "Dime el nombre. Por ejemplo: familia añadir Ana hija"
    may_memory.recordar("familia", {"nombre": nombre, "relacion": relacion})
    if relacion:
        return f"He apuntado a {nombre} ({relacion}) en tu familia."
    return f"He apuntado a {nombre} en tu familia."


def ver_familia():
    fam = may_memory.cargar().get("familia", [])
    if not fam:
        return "Aún no hay familiares apuntados. Escribe: familia añadir Ana hija"
    return "\n".join(
        f" {i}. {x.get('nombre', '')}" + (f" ({x['relacion']})" if x.get("relacion") else "")
        for i, x in enumerate(fam, 1)
    )


def tendencia_panel():
    partidas = may_memory.cargar().get("juegos", [])
    if not partidas:
        return "Juegos: aún no hay partidas."
    trozos = []
    for p in partidas[-5:]:
        fecha = (p.get("fecha") or "")[:10]
        trozos.append(f"{p.get('acertadas', 0)}/{p.get('total', 0)} ({fecha})")
    return "Juegos (tendencia, orientativo): " + ", ".join(trozos)


def _guardar_partida(acertadas, total, saltadas):
    may_memory.recordar(
        "juegos",
        {
            "fecha": datetime.datetime.now().isoformat(timespec="minutes"),
            "acertadas": acertadas,
            "total": total,
            "saltadas": saltadas,
        },
    )


def _preguntar(leer, enunciado, aceptadas, pista, solucion_bonita):
    """Hace una pregunta con pista, reintento y opción de saltar. Devuelve 'ok'|'saltar'."""
    print(_marco(enunciado))
    print("Puedes responder, escribir «pista» o «saltar».")
    intentos = 0
    pista_dada = False
    while intentos < 2:
        try:
            resp = (leer() or "").strip()
        except (EOFError, KeyboardInterrupt):
            return "saltar"
        baja = _sin_tildes(resp)
        if baja in ("saltar", "salto", "pasar", "skip"):
            print(f"No pasa nada. La respuesta era: {solucion_bonita}. Seguimos con calma.")
            return "saltar"
        if baja in ("pista", "ayuda", "hint"):
            print(f"Pista: {pista}")
            pista_dada = True
            continue
        if _parece(resp, aceptadas):
            print("Eso es, muy bien.")
            return "ok"
        intentos += 1
        if intentos < 2:
            extra = f" Pista: {pista}" if not pista_dada else ""
            print(
                f"Casi lo tienes.{extra} "
                "¿Lo intentas otra vez, pides una pista o escribes «saltar»?"
            )
        else:
            print(f"No pasa nada, lo vemos juntos. La respuesta era: {solucion_bonita}.")
            return "saltar"
    return "saltar"


def _ejercicio_dia():
    hoy = datetime.date.today()
    dia = DIAS[hoy.weekday()]
    aceptadas = [dia]
    if dia == "miércoles":
        aceptadas.append("miercoles")
    if dia == "sábado":
        aceptadas.append("sabado")
    return (
        f"¿Qué día de la semana es hoy?",
        aceptadas,
        "Piensa en el día que aparece en el calendario de hoy.",
        dia,
    )


def _ejercicio_estacion():
    est = _estacion_hoy()
    aceptadas = [est]
    if est == "otoño":
        aceptadas.append("otono")
        aceptadas.append("autumn")
    return (
        "¿En qué estación del año estamos?",
        aceptadas,
        "En España: primavera, verano, otoño o invierno.",
        est,
    )


def _ejercicio_refran(rng):
    frase, fin, pista = rng.choice(REFRANES)
    return (f"Completa el refrán:\n«{frase}»", [fin, frase.replace("…", " " + fin)], pista, fin)


def _ejercicio_categoria(rng):
    enunciado, opciones, correcta, pista = rng.choice(CATEGORIAS)
    listado = ", ".join(opciones)
    return (f"{enunciado}\n  {listado}", [correcta], pista, correcta)


def _ejercicio_monedas(rng):
    q, bonita, aceptadas, pista = rng.choice(MONEDAS)
    return (q, aceptadas, pista, bonita)


def _ejercicio_secuencia(rng):
    q, bonita, aceptadas, pista = rng.choice(SECUENCIAS)
    return (q, aceptadas, pista, bonita)


def _ejercicio_familia(rng):
    fam = [x for x in may_memory.cargar().get("familia", []) if x.get("nombre")]
    if not fam:
        return None
    persona = rng.choice(fam)
    nombre = persona["nombre"]
    rel = (persona.get("relacion") or "").strip()
    if rel:
        enunciado = f"¿Cómo se llama tu {rel}?"
        pista = f"Es alguien de tu familia, tu {rel}."
    else:
        enunciado = f"¿Recuerdas un nombre de tu familia? Uno de ellos es… ¿cuál?"
        pista = f"Empieza por «{nombre[0].upper()}»."
        # If no relationship, asking to recall "a family name" is vague.
        # Better: "Uno de los nombres que apuntamos es de {n} letras. ¿Lo recuerdas?"
        enunciado = (
            f"¿Recuerdas el nombre de un familiar que apuntamos? "
            f"Tiene {len(nombre)} letras y empieza por «{nombre[0].upper()}»."
        )
    return (enunciado, [nombre], pista, nombre)


def _ejercicio_memoria(rng, leer, n):
    """Memoria de 3 palabras: mostrar, distraer, recordar. Devuelve 'ok'|'saltar'."""
    palabras = rng.choice(PALABRAS_MEMORIA)
    print(_marco(
        f"EJERCICIO {n} DE 5\n"
        "Voy a decirte 3 palabras. Míralas con calma y recuérdalas:\n\n"
        f"    {palabras[0].upper()}     {palabras[1].upper()}     {palabras[2].upper()}\n\n"
        "Cuando las hayas mirado, escribe «listo»."
    ))
    try:
        _ = leer()
    except (EOFError, KeyboardInterrupt):
        return "saltar"
    # Distracción breve.
    print(_marco("Mientras tanto, una pregunta sencilla:\n¿De qué color es el cielo en un día despejado?"))
    try:
        _ = leer()
    except (EOFError, KeyboardInterrupt):
        pass
    print("Bien. Ahora volvemos a las 3 palabras.")
    aceptadas_conjunto = set(_sin_tildes(p) for p in palabras)

    def _cuenta(resp):
        tokens = [_sin_tildes(t).strip(".,;:") for t in resp.replace(",", " ").replace(" y ", " ").split()]
        return [t for t in tokens if t in aceptadas_conjunto]

    print(_marco("EJERCICIO {n} DE 5\n¿Cuáles eran las 3 palabras?".format(n=n)))
    print("Puedes responder, escribir «pista» o «saltar».")
    intentos = 0
    while intentos < 2:
        try:
            resp = (leer() or "").strip()
        except (EOFError, KeyboardInterrupt):
            print(f"No pasa nada. Las palabras eran: {', '.join(palabras)}.")
            return "saltar"
        baja = _sin_tildes(resp)
        if baja in ("saltar", "salto", "pasar"):
            print(f"No pasa nada. Las palabras eran: {', '.join(palabras)}.")
            return "saltar"
        if baja in ("pista", "ayuda"):
            print(f"Pista: una de ellas era «{palabras[0]}».")
            continue
        aciertos = _cuenta(resp)
        if len(set(aciertos)) == 3:
            print("Eso es, las tres. Muy bien.")
            return "ok"
        if len(set(aciertos)) >= 1:
            print(
                f"Llevas {len(set(aciertos))} de 3, vas bien. "
                "¿Las intentas otra vez, pides una pista o escribes «saltar»?"
            )
        else:
            print("Casi. ¿Lo intentas otra vez, pides una pista o escribes «saltar»?")
        intentos += 1
    print(f"No pasa nada, lo vemos juntos. Las palabras eran: {', '.join(palabras)}.")
    return "saltar"


def _preparar_ejercicios(rng):
    tipos = [
        ("orientacion_dia", _ejercicio_dia),
        ("orientacion_estacion", _ejercicio_estacion),
        ("refran", lambda: _ejercicio_refran(rng)),
        ("categoria", lambda: _ejercicio_categoria(rng)),
        ("monedas", lambda: _ejercicio_monedas(rng)),
        ("secuencia", lambda: _ejercicio_secuencia(rng)),
    ]
    fam = _ejercicio_familia(rng)
    # Sesión corta de 5. Siempre orientación (día) y, si hay familia, un recall.
    elegidos = []
    # Día siempre primero.
    elegidos.append(("pregunta", _ejercicio_dia(), False))
    restantes = [
        ("pregunta", _ejercicio_estacion(), False),
        ("pregunta", _ejercicio_refran(rng), False),
        ("pregunta", _ejercicio_categoria(rng), False),
        ("pregunta", _ejercicio_monedas(rng), False),
        ("pregunta", _ejercicio_secuencia(rng), False),
        ("memoria", None, True),
    ]
    if fam:
        restantes.append(("pregunta", fam, False))
    rng.shuffle(restantes)
    # Completar hasta 5.
    for item in restantes:
        if len(elegidos) >= 5:
            break
        elegidos.append(item)
    return elegidos[:5]


def sesion(leer_linea):
    """Una sesión de 5 ejercicios. `leer_linea` es una función que devuelve el texto del usuario."""
    print(_marco("JUEGOS  ·  MODO MAYORES\n" + AVISO))
    print("Vamos a hacer 5 ejercicios cortos, con calma. No hay prisa ni notas malas.")
    seed = os.environ.get("MAY_JUEGOS_TEST")
    rng = random.Random(0 if seed else None)

    if seed:
        # Secuencia fija para pruebas no interactivas.
        ejercicios = [
            ("pregunta", _ejercicio_dia(), False),
            ("pregunta", _ejercicio_estacion(), False),
            ("pregunta", REFRANES[0] and (
                f"Completa el refrán:\n«{REFRANES[0][0]}»",
                [REFRANES[0][1]],
                REFRANES[0][2],
                REFRANES[0][1],
            ), False),
            ("pregunta", (
                f"{CATEGORIAS[0][0]}\n  {', '.join(CATEGORIAS[0][1])}",
                [CATEGORIAS[0][2]],
                CATEGORIAS[0][3],
                CATEGORIAS[0][2],
            ), False),
            ("memoria", None, True),
        ]
        # Palabras fijas en modo test: sol, casa, pan (primer grupo).
        global PALABRAS_MEMORIA
        PALABRAS_MEMORIA = [PALABRAS_MEMORIA[0]]
    else:
        ejercicios = _preparar_ejercicios(rng)

    acertadas = 0
    saltadas = 0
    total = len(ejercicios)

    for i, (tipo, datos, es_memoria) in enumerate(ejercicios, 1):
        if es_memoria or tipo == "memoria":
            resultado = _ejercicio_memoria(rng, leer_linea, i)
        else:
            enunciado, aceptadas, pista, solucion = datos
            resultado = _preguntar(
                leer_linea,
                f"EJERCICIO {i} DE {total}\n{enunciado}",
                aceptadas,
                pista,
                solucion,
            )
        if resultado == "ok":
            acertadas += 1
        else:
            saltadas += 1

    _guardar_partida(acertadas, total, saltadas)
    print(_marco(
        f"Hemos terminado. Has hecho {acertadas} de {total}, a tu ritmo.\n"
        "La puntuación queda guardada en privado, en este aparato, para quien te acompaña.\n"
        + AVISO
    ))
    return f"Sesión guardada: {acertadas}/{total}."
