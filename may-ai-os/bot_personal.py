"""Bot personal del usuario: MAY habla a través del bot de cada persona.

Privacidad (memoria local distinta de la del modelo):
- Al chatear solo se envía el mensaje actual. No se mandan notas, emociones,
  hábitos, conversaciones anteriores ni el resto de la memoria local.
- Si el usuario quiere compartir algo concreto, usa: comparte <texto>
- La clave MAY_API_KEY, si existe, se lee del entorno. Nunca va en el código
  ni en la memoria cifrada.

Sin internet, el chat se degrada con un aviso claro; el resto de MAY sigue
funcionando (offline-first).
"""
import json
import os
import urllib.error
import urllib.request
import may_memory

API_URL = os.environ.get("MAY_API_URL", "https://api.x.ai/v1/chat/completions")
MODELO = os.environ.get("MAY_MODEL", "grok-4")


def datos(cual="bot"):
    clave = "bot_apoyo" if cual in ("apoyo", "bot_apoyo") else "bot"
    return may_memory.cargar().get(clave, {"nombre": "", "enlace": ""})


def configurar(nombre, enlace, cual="bot"):
    m = may_memory.cargar()
    clave = "bot_apoyo" if cual in ("apoyo", "bot_apoyo") else "bot"
    m[clave] = {"nombre": nombre.strip(), "enlace": enlace.strip()}
    may_memory.guardar(m)


def hablar(mensaje, usuario, extra=None, contexto=None, cual="bot"):
    """Envía solo el mensaje actual (y, si se pide, un texto o técnicas elegidas a propósito)."""
    bot = datos(cual)
    nombre_bot = bot.get("nombre") or ("tu bot de apoyo" if cual == "apoyo" else "tu bot")
    clave = os.environ.get("MAY_API_KEY_APOYO" if cual == "apoyo" else "MAY_API_KEY")
    if not clave:
        enlace = bot.get("enlace")
        if enlace:
            extra_txt = ""
            if contexto or extra:
                extra_txt = "\n\nPuedes pegar esto (solo lo que has elegido enviar):\n" + "\n\n".join(
                    x for x in (extra, contexto) if x
                )
            return (
                f"Para charlar abre {nombre_bot}: {enlace}\n"
                "Tu memoria local se queda en este aparato; no se la envío."
                + extra_txt
            )
        return (
            "Aún no has conectado tu bot personal. Escribe: mi bot <nombre> <enlace>\n"
            "Si tienes una clave de API, ponla en MAY_API_KEY en tu aparato, nunca en el código."
        )

    # Solo el mensaje actual. Nada de memoria local, salvo un texto que el
    # usuario haya pedido compartir expresamente.
    partes = [mensaje]
    if extra:
        partes.append(extra)
    if contexto:
        partes.append(contexto)
    contenido = "\n\n".join(partes)

    cuerpo = json.dumps(
        {
            "model": MODELO,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        f"Eres {nombre_bot}, el bot personal de {usuario} dentro de MAY AI OS. "
                        "Responde en español con inteligencia emocional. "
                        "No tienes acceso a la memoria local de MAY."
                    ),
                },
                {"role": "user", "content": contenido},
            ],
        }
    ).encode()
    pet = urllib.request.Request(
        API_URL,
        data=cuerpo,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {clave}"},
    )
    try:
        with urllib.request.urlopen(pet, timeout=60) as r:
            return json.load(r)["choices"][0]["message"]["content"]
    except urllib.error.URLError:
        return (
            f"Ahora mismo no hay conexión. {nombre_bot} necesita internet para charlar. "
            "Todo lo demás de MAY (hábitos, emociones, notas, juegos, panel) sigue funcionando aquí, sin red."
        )
    except Exception as e:
        return f"No he podido hablar con {nombre_bot} ahora ({type(e).__name__}). El resto de MAY sigue aquí."
