#!/usr/bin/env python3
"""Construye azum/libros-index.json: índice local de los libros de Pedro para
«Pregunta sobre los libros» de Azum. Solo texto ya escrito en los libros
(OSNews Book publicado + fuentes de «Ave César, Ave Sánchez»). Sin datos
privados ni de salud: se excluyen el anexo del cuaderno y la transcripción
de trabajo, y cualquier párrafo con datos de salud del autor."""
import json, re, unicodedata, collections
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
BOOK = REPO / "osnews-book"
AVE = Path("/workspace/libros/ave-cesar-ave-sanchez/fuentes")
OUT = REPO / "azum" / "libros-index.json"
LIVE = "https://osnewspedrosg-glitch.github.io/osnews/osnews-book/"
YT = "https://youtu.be/"

# Vídeos ya publicados en el canal de YouTube OSNews (@OSNewsMAY), comprobados
# con oEmbed el 22 nov 2026. Solo libros con vídeo propio.
VIDEOS = {
    "la-hija-de-dos-mundos": [("La Alianza 4A 2060 · Capítulo 1: La hija de dos mundos", "_m2UfgMFBnA")],
    "cartas-desde-las-estrellas": [("La Alianza 4A 2060 · Capítulo 2: Cartas desde las estrellas", "W5S3LTmQzoI")],
    "los-hijos-de-la-tierra": [("La Alianza 4A 2060 · Capítulo 3: Los hijos de la Tierra", "vLlLh6-Mun4")],
    "nada-se-pierde": [("La Alianza 4A 2060 · Capítulo 4: Nada se pierde", "5uiu8niYSak")],
    "libre-como-el-viento": [("La Alianza 4A 2060 · Libre como el viento · Ep. 1: Archivo histórico (Prólogo)", "z0s2N-PKQhM")],
    "la-union-de-dos-super-ias": [("La unión de dos super IAs · Audiolibro en español", "ElTmvquET1c")],
    "the-daughter-of-two-worlds": [("The 4A Alliance 2060 · Chapter 1: The Daughter of Two Worlds", "mEbDHeCewYU")],
    "letters-from-the-stars": [("The 4A Alliance 2060 · Chapter 2: Letters from the Stars", "Ii3THBTbJes")],
    "the-children-of-the-earth": [("The 4A Alliance 2060 · Chapter 3: The Children of the Earth", "51HzS8gdfKw")],
    "nothing-is-lost": [("The 4A Alliance 2060 · Chapter 4: Nothing Is Lost", "zukeqhJky0s")],
    "free-as-the-wind": [("The 4A · Free as the Wind · Ep. 1: Historical Archive (Prologue)", "Q5B8V54ilA4")],
    "the-union-of-two-super-ais": [("The Union of Two Super AIs · Audiobook in English", "ax3WmyL5RpQ")],
    "ave-cesar-ave-sanchez": [
        ("Evnom – Había una vez un pequeño tirano (videoclip con letra)", "KAKLBz5ZZlQ"),
        ("Ave César, ave Sánchez: el Coliseo es la tele y los leones son los opinadores · Debate IA", "vh8KEgRDDIs"),
    ],
}

PRIVADO = re.compile(r"alcohol|coca\b|droga|adicci|médic|medic|diagn|psiqui|hospital|tel[eé]fono|dni\b|@gmail", re.I)

def plain(s):
    s = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", s)
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)
    s = re.sub(r"^\s*>\s?", "", s, flags=re.M)
    s = re.sub(r"\*\*|(?<!\w)\*(?!\s)|(?<!\s)\*(?!\w)|^#+\s*|^:::.*$", "", s, flags=re.M)
    return re.sub(r"[ \t]+", " ", s).strip()

def names(texts):
    c = collections.Counter()
    for t in texts:
        for m in re.finditer(r"(?<=[a-záéíóúñ,;:] )([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}|[A-Z]{3,4})\b", t):
            c[m.group(1)] += 1
    stop = {"Dios", "Tierra", "Luna", "Mar", "Menor", "Capítulo", "Chapter", "The", "And", "But", "Por", "Pero", "Que", "Oficina", "Office", "Spanish", "Super", "Alianza", "Ave", "Gómez", "Moon", "Earth", "Levante", "Sin", "Con", "Del", "Los", "Las", "Una", "Este", "Esta", "Para", "Cuando", "Como"}
    return [n for n, k in c.most_common(30) if k >= 6 and n not in stop][:10]

books, passages = [], []
meta = json.loads((BOOK / "data/books.json").read_text())
for b in meta["books"]:
    lang = b.get("lang", "es")
    route = "book" if lang == "en" else "libro"
    idx = json.loads((BOOK / b["chaptersIndex"]).read_text())
    bi = len(books)
    chapters, texts = [], []
    for ch in idx["chapters"]:
        data = json.loads((BOOK / "data" / b["id"] / ch["file"]).read_text())
        ci = len(chapters)
        chapters.append({"t": ch["title"], "u": f"{LIVE}#/{route}/{b['id']}/{ch['id']}"})
        for blk in data["blocks"]:
            txt = re.sub(r"(?<!\w)\*+|\*+(?!\w)", "", blk.get("text", "")).strip()
            if blk["type"] == "p" and len(txt) > 25:
                passages.append([bi, ci, txt]); texts.append(txt)
    books.append({
        "id": b["id"], "lang": lang, "title": b["title"], "sub": b.get("subtitle", ""),
        "about": b.get("blurb", ""), "aboutSrc": "Presentación del libro en OSNews Book",
        "book": f"{LIVE}#/{route}/{b['id']}",
        "pdf": (LIVE + b["pdf"]) if b.get("pdf") else None,
        "videos": [{"t": t, "u": YT + v} for t, v in VIDEOS.get(b["id"], [])],
        "names": names(texts), "chapters": chapters,
    })

# «Ave César, Ave Sánchez» (aún sin publicar: sin PDF ni página de OSNews Book)
FILES = ["00-nota.md", "01-prologo.md", "02-fenicia.md", "03-iberia.md", "04-roma.md",
         "05-espana-en-pie.md", "06-epilogo.md", "07-cancion.md", "09-fuentes.md"]  # sin 08-anexo (cuaderno literal)
bi = len(books); chapters, texts = [], []
about = ""
for f in FILES:
    md = (AVE / f).read_text()
    title = md.splitlines()[0].lstrip("# ").strip()
    ci = len(chapters); chapters.append({"t": title, "u": None})
    for para in re.split(r"\n\s*\n", "\n".join(md.splitlines()[1:])):
        txt = plain(para)
        if len(txt) <= 25 or txt.startswith("Viñeta") or PRIVADO.search(txt):
            continue
        passages.append([bi, ci, txt]); texts.append(txt)
        if f == "01-prologo.md" and txt.startswith("De ahí sale la pregunta"):
            about = txt
books.append({
    "id": "ave-cesar-ave-sanchez", "lang": "es", "title": "Ave César, Ave Sánchez",
    "sub": "Sátira, historia y opinión · en preparación", "about": about,
    "aboutSrc": "Prólogo. Desde mi cuadrícula", "book": None, "pdf": None,
    "videos": [{"t": t, "u": YT + v} for t, v in VIDEOS["ave-cesar-ave-sanchez"]],
    "names": names(texts), "chapters": chapters,
})

OUT.write_text(json.dumps({
    "v": 1, "built": "2026-11-22",
    "credits": "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok",
    "books": books, "p": passages,
}, ensure_ascii=False, separators=(",", ":")))
print(OUT, OUT.stat().st_size, "bytes,", len(books), "libros,", len(passages), "párrafos")
for b in books: print(b["id"], len(b["chapters"]), b["names"])
