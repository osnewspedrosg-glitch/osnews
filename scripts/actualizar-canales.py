#!/usr/bin/env python3
"""Build Canales OSNews: 8 language channels, 4 country channels, and an index.

Headlines come from official public European/US RSS (TV World ligera data plus
a few extra official country feeds). YouTube embeds are the official videos
already checked for TV World. X posts are literal excerpts in
canales/posts-x.json, refreshed by the 08:00 Europe/Madrid routine.

Usage (from the repository root):
    python3 scripts/actualizar-tv-ligera.py && python3 scripts/actualizar-canales.py --from-ligera
"""
from __future__ import annotations

import argparse
import html
import importlib.util
import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import quote
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "canales"
LIGERA_JSON = ROOT / "tv-world" / "ligera" / "titulos.json"
X_PATH = OUT / "posts-x.json"
UI_PATH = ROOT / "scripts" / "canales-ui.json"
VIDEOS_PATH = OUT / "videos.json"
MADRID = ZoneInfo("Europe/Madrid")
AUTHORS = "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok."

spec = importlib.util.spec_from_file_location("tv_ligera", ROOT / "scripts" / "actualizar-tv-ligera.py")
tv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tv)

I18N = json.loads(UI_PATH.read_text(encoding="utf-8"))
VIDEOS = json.loads(VIDEOS_PATH.read_text(encoding="utf-8"))

LANGS = ["es", "en", "fr", "de", "pt", "it", "ar", "zh"]
LANG_NAMES = {
    "es": "Español", "en": "English", "fr": "Français", "de": "Deutsch",
    "pt": "Português", "it": "Italiano", "ar": "العربية", "zh": "中文", "hi": "हिन्दी",
}
CHANNEL_TITLE = {
    "es": "OSNews Español", "en": "OSNews English", "fr": "OSNews Français",
    "de": "OSNews Deutsch", "pt": "OSNews Português", "it": "OSNews Italiano",
    "ar": "OSNews العربية", "zh": "OSNews 中文",
}
COUNTRIES = ["china", "india", "morocco", "cuba"]
COUNTRY_CHANNELS = [
    {"id": "china", "path": "china", "default": "zh", "uis": ["zh"]},
    {"id": "india", "path": "india", "default": "en", "uis": ["en", "hi"]},
    {"id": "morocco", "path": "marruecos", "default": "ar", "uis": ["ar", "fr"]},
    {"id": "cuba", "path": "cuba", "default": "es", "uis": ["es"]},
]
COUNTRY_PAGE_TITLE = {
    "china": {"zh": "OSNews 中国"},
    "india": {"en": "OSNews India", "hi": "OSNews भारत"},
    "morocco": {"ar": "OSNews المغرب", "fr": "OSNews Maroc"},
    "cuba": {"es": "OSNews Cuba"},
}
COUNTRY_TAGLINE = {
    "china": {"zh": "欧洲和美国官方媒体关于中国的新闻、可嵌入的官方视频，以及美国和欧洲政治人物与官方新闻频道在 X 上的逐字声明。免费、无广告。"},
    "india": {
        "en": "News about India from official European and US media, official embeddable videos, and literal X statements by US and European politicians and official news channels. Free, with no ads.",
        "hi": "यूरोपीय और अमेरिकी आधिकारिक मीडिया से भारत की खबरें, एम्बेड योग्य आधिकारिक वीडियो, तथा अमेरिका और यूरोप के नेताओं व समाचार चैनलों के शाब्दिक X बयान। मुफ्त, बिना विज्ञापन।",
    },
    "morocco": {
        "ar": "أخبار عن المغرب من وسائل إعلام أوروبية وأميركية رسمية، وفيديوهات رسمية قابلة للتضمين، وتصريح حرفية على X لسياسيين وقنوات من الولايات المتحدة وأوروبا. مجانًا وبلا إعلانات.",
        "fr": "Actualités sur le Maroc provenant de médias officiels européens et américains, vidéos officielles intégrables et déclarations littérales sur X de responsables politiques et de chaînes des États-Unis et d’Europe. Gratuit, sans publicité.",
    },
    "cuba": {"es": "Noticias sobre Cuba de medios oficiales europeos y de EE. UU., vídeos oficiales insertables y declaraciones literales en X de políticos y canales de EE. UU. y Europa. Gratis y sin anuncios."},
}
MAX_NEWS, MAX_VIDEOS = 8, 6
MAX_DECL_POL, MAX_DECL_TV, MAX_LOCAL, PER_ACC = 6, 6, 6, 3
HINDI_INDIA = re.compile(r"भारत|भारतीय|दिल्ली|मुंबई|मोदी|कश्मीर")

EXTRA_FEEDS = [
    {"id": "bbc-latam", "name": "BBC News", "lang": "en", "url": "https://feeds.bbci.co.uk/news/world/latin_america/rss.xml"},
    {"id": "guardian-cuba", "name": "The Guardian", "lang": "en", "url": "https://www.theguardian.com/world/cuba/rss"},
    {"id": "guardian-americas", "name": "The Guardian", "lang": "en", "url": "https://www.theguardian.com/world/americas/rss"},
    {"id": "guardian-morocco", "name": "The Guardian", "lang": "en", "url": "https://www.theguardian.com/world/morocco/rss"},
    {"id": "guardian-india", "name": "The Guardian", "lang": "en", "url": "https://www.theguardian.com/world/india/rss"},
    {"id": "guardian-china", "name": "The Guardian", "lang": "en", "url": "https://www.theguardian.com/world/china/rss"},
    {"id": "elpais-america", "name": "El País", "lang": "es", "url": "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/america/portada"},
    {"id": "bbc-hindi", "name": "BBC News हिंदी", "lang": "hi", "url": "https://feeds.bbci.co.uk/hindi/rss.xml"},
    {"id": "bbc-asia", "name": "BBC News", "lang": "en", "url": "https://feeds.bbci.co.uk/news/world/asia/rss.xml"},
]
FROM_LANG = {
    "es": ["dw_espanol", "euronewses", "France24_es", "BBCMundo", "el_pais", "CNNEE"],
    "en": ["dwnews", "euronews", "France24", "BBCNews", "BBCWorld", "nytimes", "washingtonpost", "NPR", "guardian", "Reuters", "AP", "CNN"],
    "fr": ["France24_fr", "lemondefr", "euronews", "France24"],
    "de": ["dwnews", "euronews", "guardian", "Reuters"],
    "pt": ["BBCNews", "euronews", "France24_es", "Reuters"],
    "it": ["euronews", "France24", "guardian", "Reuters"],
    "ar": ["France24_ar", "BBCArabic", "euronews"],
    "zh": ["BBCWorld", "dwnews", "Reuters", "nytimes"],
    "hi": ["bbchindi", "BBCWorld", "Reuters"],
}
FROM_COUNTRY = {
    "china": ["StateDept", "SecRubio", "WhiteHouse", "Europarl_EN", "eu_eeas", "MAECgob"],
    "india": ["StateDept", "SecRubio", "WhiteHouse", "MAECgob", "eu_eeas", "GiorgiaMeloni"],
    "morocco": ["USAmbUN", "Europarl_EN", "Europarl_ES", "MAECgob", "StateDept", "eu_eeas"],
    "cuba": ["StateDept", "SecRubio", "USAmbUN", "WhiteHouse", "MAECgob", "Europarl_ES"],
}
KEYWORDS = {
    "es": {"china": "(China OR chino OR Pekín OR Beijing)", "india": "(India OR indio OR Delhi)", "morocco": "(Marruecos OR marroquí OR Rabat)", "cuba": "(Cuba OR cubano OR Habana)"},
    "en": {"china": "(China OR Chinese OR Beijing OR Xi)", "india": "(India OR Indian OR Delhi OR Modi)", "morocco": "(Morocco OR Moroccan OR Rabat)", "cuba": "(Cuba OR Cuban OR Havana)"},
    "fr": {"china": "(Chine OR chinois OR Pékin)", "india": "(Inde OR indien OR Delhi)", "morocco": "(Maroc OR marocain OR Rabat)", "cuba": "(Cuba OR cubain OR Havane)"},
    "de": {"china": "(China OR chinesisch OR Peking)", "india": "(Indien OR indisch OR Delhi)", "morocco": "(Marokko OR marokkanisch OR Rabat)", "cuba": "(Kuba OR kubanisch OR Havanna)"},
    "pt": {"china": "(China OR chinês OR Pequim)", "india": "(Índia OR indiano OR Deli)", "morocco": "(Marrocos OR marroquino OR Rabat)", "cuba": "(Cuba OR cubano OR Havana)"},
    "it": {"china": "(Cina OR cinese OR Pechino)", "india": "(India OR indiano OR Delhi)", "morocco": "(Marocco OR marocchino OR Rabat)", "cuba": "(Cuba OR cubano OR Avana)"},
    "ar": {"china": "(الصين OR بكين)", "india": "(الهند OR دلهي)", "morocco": "(المغرب OR الرباط)", "cuba": "(كوبا OR هافانا)"},
    "zh": {"china": "(中国 OR 北京)", "india": "(印度 OR 德里)", "morocco": "(摩洛哥 OR 拉巴特)", "cuba": "(古巴 OR 哈瓦那)"},
    "hi": {"china": "(चीन OR बीजिंग)", "india": "(भारत OR दिल्ली OR मोदी)", "morocco": "(मोरक्को OR रबात)", "cuba": "(क्यूबा OR हवाना)"},
}


def about(country, title):
    if tv.about_country(country, title or ""):
        return True
    return country == "india" and bool(HINDI_INDIA.search(title or ""))


def esc(s):
    return html.escape(s or "", quote=True)


def unescape_text(s):
    return html.unescape(s or "")


def fmt_when(iso):
    if not iso:
        return ""
    try:
        dt = datetime.fromisoformat(iso)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=MADRID)
        dt = dt.astimezone(MADRID)
        return f"{dt.strftime('%Y-%m-%d')} {dt.strftime('%H:%M')}"
    except ValueError:
        return iso


def x_url(query):
    return "https://x.com/search?q=" + quote(query, safe="") + "&f=live"


def official_query(ui_lang, country):
    kws = KEYWORDS.get(ui_lang, KEYWORDS["en"])[country]
    acc = []
    for a in FROM_LANG.get(ui_lang, FROM_LANG["en"]) + FROM_COUNTRY[country]:
        if a not in acc:
            acc.append(a)
    froms = " OR ".join("from:" + a for a in acc[:14])
    xlang = "hi" if ui_lang == "hi" else ui_lang
    return f"{kws} ({froms}) lang:{xlang}"


def pick(rows, limit, per_account, prefer_lang=None):
    def key(r):
        lang = (r.get("lang") or r.get("feed_lang") or "")
        prefer = 0 if prefer_lang and lang == prefer_lang else 1
        return (prefer, -(r.get("sort") or 0), r.get("date") or "", r.get("time") or "")

    out, seen, counts = [], set(), {}
    for row in sorted(rows, key=key):
        ident = row.get("id") or row.get("url") or row.get("title")
        if ident in seen:
            continue
        acc = row.get("account") or row.get("source_id") or row.get("name") or ""
        if per_account and acc and counts.get(acc, 0) >= per_account:
            continue
        seen.add(ident)
        if acc:
            counts[acc] = counts.get(acc, 0) + 1
        out.append(row)
        if len(out) >= limit:
            break
    return out


def meta_line(item, ui, kind="news"):
    bits = []
    if kind == "news":
        bits.append(f"{ui['source']}: {item.get('name') or ''}")
    elif kind == "video":
        bits.append(item.get("channel") or "")
    else:
        name = item.get("name") or item.get("account") or ""
        handle = item.get("account") or ""
        bits.append(f"{name} (@{handle})" if handle else name)
    date, time_ = item.get("date") or "", item.get("time") or ""
    if date and time_:
        bits.append(f"{date} {time_} ({ui['timezone']})")
    elif date:
        bits.append(f"{date} ({ui['timezone']})")
    fl = item.get("feed_lang") or item.get("lang") or ""
    if fl and fl in LANG_NAMES:
        bits.append(f"{ui['lang_label']}: {LANG_NAMES[fl]}")
    return " · ".join(b for b in bits if b)


def news_items(items, ui):
    if not items:
        return f'      <p class="note">{esc(ui["empty_news"])}</p>\n'
    parts = ['      <ul class="list">\n']
    for it in items:
        title = esc(it.get("title") or "")
        url = esc(it.get("url") or "")
        parts.append(
            f'        <li><a href="{url}" rel="noopener noreferrer">{title}</a>'
            f'<small>{esc(meta_line(it, ui, "news"))} · {esc(ui["open_article"])}</small></li>\n'
        )
    parts.append("      </ul>\n")
    return "".join(parts)


def video_items(items, ui, page_lang):
    if not items:
        return f'      <p class="note">{esc(ui["empty_video"])}</p>\n'
    parts = []
    for v in items:
        vid = esc(v["id"])
        title = esc(v["title"])
        src = (
            "https://www.youtube-nocookie.com/embed/" + vid
            + "?rel=0&modestbranding=1&cc_load_policy=1&cc_lang_pref="
            + quote(page_lang) + "&hl=" + quote(page_lang)
        )
        yt = "https://www.youtube.com/watch?v=" + vid
        parts.append(
            '      <div class="video">\n'
            f'        <div class="frame"><iframe title="{title}" src="{src}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>\n'
            f'        <p><a href="{esc(yt)}" rel="noopener noreferrer">{title}</a>'
            f'<small>{esc(meta_line(v, ui, "video"))} · {esc(ui["watch"])}</small></p>\n'
            "      </div>\n"
        )
    return "".join(parts)


def post_items(items, ui, empty_key):
    if not items:
        return f'      <p class="note">{esc(ui[empty_key])}</p>\n'
    parts = []
    for p in items:
        text = esc(unescape_text(p.get("text") or ""))
        url = esc(p.get("url") or "")
        parts.append(
            '      <article class="post">\n'
            f"        <p>{text}</p>\n"
            f'        <small>{esc(meta_line(p, ui, "x"))}</small>\n'
            f'        <p><a href="{url}" rel="noopener noreferrer">{esc(ui["open_post"])}</a></p>\n'
            "      </article>\n"
        )
    return "".join(parts)


def search_box(ui, page_lang, countries):
    buttons = []
    for c in countries:
        href = esc(x_url(official_query(page_lang, c)))
        buttons.append(f'        <a href="{href}" rel="noopener noreferrer">{esc(ui[c])}</a>\n')
    return (
        '    <section class="panel" aria-labelledby="h-search">\n'
        f'      <h2 id="h-search">{esc(ui["search"])}</h2>\n'
        f'      <form class="search" id="x-search" action="https://x.com/search" method="get" data-lang="{esc(page_lang)}" role="search">\n'
        f'        <input type="search" name="q" required autocomplete="off" placeholder="{esc(ui["placeholder"])}" aria-label="{esc(ui["placeholder"])}">\n'
        '        <input type="hidden" name="f" value="live">\n'
        f'        <button type="submit">{esc(ui["go"])}</button>\n'
        "      </form>\n"
        f'      <p class="note">{esc(ui["search_hint"])}</p>\n'
        f'      <h3>{esc(ui["quick"])}</h3>\n'
        '      <div class="btns">\n' + "".join(buttons) + "      </div>\n"
        "    </section>\n"
    )


def nav_links(ui, prefix):
    return (
        '      <nav class="jump">\n'
        f'        <a href="{prefix}">{esc(ui["home"])}</a>\n'
        f'        <a href="{prefix}../anibal/">{esc(ui["anibal"])}</a>\n'
        f'        <a href="{prefix}../tv-world/">{esc(ui["tv"])}</a>\n'
        f'        <a href="{prefix}../tv-world/ligera/">{esc(ui["lite"])}</a>\n'
        f'        <a href="{prefix}../app/">{esc(ui["app"])}</a>\n'
        f'        <a href="{prefix}../">{esc(ui["back"])}</a>\n'
        "      </nav>\n"
    )


def lang_switcher(current, prefix):
    bits = ['      <div class="langs">\n']
    for lang in LANGS:
        href = f"{prefix}{lang}/"
        on = ' class="lang on" aria-current="page"' if lang == current else ' class="lang"'
        bits.append(f'        <a{on} href="{href}" lang="{lang}">{esc(LANG_NAMES[lang])}</a>\n')
    bits.append("      </div>\n")
    return "".join(bits)


def country_switcher(ui, prefix, current=None):
    labels = {"china": ui["china"], "india": ui["india"], "morocco": ui["morocco"], "cuba": ui["cuba"]}
    bits = ['      <div class="langs">\n']
    for ch in COUNTRY_CHANNELS:
        href = f"{prefix}{ch['path']}/"
        on = ' class="lang on" aria-current="page"' if ch["id"] == current else ' class="lang"'
        bits.append(f'        <a{on} href="{href}">{esc(labels[ch["id"]])}</a>\n')
    bits.append("      </div>\n")
    return "".join(bits)


def declaraciones_block(ui, by_country, page_lang, all_countries=True):
    parts = [
        '    <section class="panel declaraciones" aria-labelledby="h-decl">\n',
        f'      <h2 id="h-decl">{esc(ui["decl"])}</h2>\n',
        f'      <p class="note">{esc(ui["decl_lead_all"] if all_countries else ui["decl_lead"])}</p>\n',
    ]
    ids = COUNTRIES if all_countries else list(by_country.keys())
    for country in ids:
        block = by_country.get(country) or {}
        pol = pick(block.get("us_eu") or [], MAX_DECL_POL, PER_ACC, page_lang)
        media = pick(block.get("tv") or [], MAX_DECL_TV, PER_ACC, page_lang)
        if all_countries:
            parts.append(f'      <h3 id="decl-{country}">{esc(ui[country])}</h3>\n')
        if not pol and not media:
            parts.append(f'      <p class="note">{esc(ui["empty_decl"])}</p>\n')
            continue
        parts.append(f'      <h4>{esc(ui["decl_pol"])}</h4>\n')
        parts.append(post_items(pol, ui, "empty_decl"))
        parts.append(f'      <h4>{esc(ui["decl_tv"])}</h4>\n')
        parts.append(post_items(media, ui, "empty_decl"))
    parts.append("    </section>\n")
    return "".join(parts)


def page_shell(lang, title, description, body, css_prefix, js=True):
    direction = "rtl" if lang == "ar" else "ltr"
    js_tag = f'  <script src="{css_prefix}buscar.js"></script>\n' if js else ""
    return (
        "<!DOCTYPE html>\n"
        f'<html lang="{esc(lang)}" dir="{direction}">\n'
        "<head>\n"
        '  <meta charset="utf-8">\n'
        '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '  <meta name="theme-color" content="#0b1220">\n'
        f"  <title>{esc(title)}</title>\n"
        f'  <meta name="description" content="{esc(description)}">\n'
        f'  <link rel="stylesheet" href="{css_prefix}styles.css">\n'
        "</head>\n"
        "<body>\n"
        '  <div class="wrap">\n'
        f"{body}"
        "  </div>\n"
        f"{js_tag}"
        "</body>\n"
        "</html>\n"
    )


def footer(ui, generated_at, x_fetched):
    g, x = fmt_when(generated_at), fmt_when(x_fetched)
    return (
        "    <footer>\n"
        f"      <p><strong>{esc(AUTHORS)}</strong></p>\n"
        f"      <p>{esc(ui['legal'])}</p>\n"
        f"      <p>{esc(ui['updated'])} {esc(g)} ({esc(ui['timezone'])}). "
        f"{esc(ui['x_updated'])} {esc(x)} ({esc(ui['timezone'])}).</p>\n"
        "    </footer>\n"
    )


def collect_news(ligera, extra, country, prefer_lang):
    rows, seen = [], set()
    buckets = []
    if ligera:
        order = []
        langs = ligera.get("languages") or {}
        if prefer_lang in langs:
            order.append(prefer_lang)
        for lang in langs:
            if lang not in order:
                order.append(lang)
        for lang in order:
            block = ((langs[lang].get("countries") or {}).get(country) or {})
            buckets.extend(block.get("news") or [])
    buckets.extend(extra.get(country) or [])
    same, other = [], []
    for it in buckets:
        key = (it.get("url") or "").split("?")[0] or it.get("title")
        if not key or key in seen:
            continue
        seen.add(key)
        row = dict(it)
        (same if prefer_lang and row.get("feed_lang") == prefer_lang else other).append(row)
    return pick(same + other, MAX_NEWS, 2, prefer_lang)


def collect_videos(prefer_lang, country):
    same, other = [], []
    for v in VIDEOS.get(country) or []:
        (same if v.get("lang") == prefer_lang else other).append(v)
    return (same + other)[:MAX_VIDEOS]


def split_x(xdata, country):
    posts = (xdata.get("countries") or {}).get(country) or []
    out = {"us_eu": [], "tv": [], "country": []}
    for p in posts:
        row = dict(p)
        try:
            if row.get("date") and row.get("time"):
                dt = datetime.strptime(f"{row['date']} {row['time']}", "%Y-%m-%d %H:%M").replace(tzinfo=MADRID)
                row["sort"] = dt.timestamp()
        except ValueError:
            row["sort"] = 0
        scope = row.get("scope") or ""
        if scope == "us_eu":
            out["us_eu"].append(row)
        elif scope == "tv" or row.get("role") == "tv":
            out["tv"].append(row)
        elif scope == "country" or row.get("role") == "politician":
            out["country"].append(row)
    return out


def fetch_extra():
    extra = {c: [] for c in COUNTRIES}
    errors = []
    for feed in EXTRA_FEEDS:
        try:
            raw = tv.fetch(feed["url"])
            items = tv.parse_feed(raw)
            time.sleep(0.2)
        except Exception as exc:  # keep going if one official feed fails
            errors.append({"url": feed["url"], "error": str(exc)})
            print("WARN extra feed", feed["url"], exc, flush=True)
            continue
        for country in COUNTRIES:
            for it in items:
                if not about(country, it.get("title") or ""):
                    continue
                extra[country].append(tv.public_item(it, name=feed["name"], source_id=feed["id"], feed_lang=feed["lang"]))
    return extra, errors


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def build_index(generated_at, x_fetched):
    ui = I18N["es"]
    tiles_lang = []
    for lang in LANGS:
        tiles_lang.append(
            f'        <a href="{lang}/"><span>{esc(CHANNEL_TITLE[lang])}</span>'
            f"<small>{esc(LANG_NAMES[lang])}</small></a>\n"
        )
    labels = {
        "china": ("OSNews 中国", "中文"),
        "india": ("OSNews India", "English · हिन्दी"),
        "morocco": ("OSNews المغرب", "العربية · Français"),
        "cuba": ("OSNews Cuba", "Español"),
    }
    tiles_co = []
    for ch in COUNTRY_CHANNELS:
        title, sub = labels[ch["id"]]
        tiles_co.append(f'        <a href="{ch["path"]}/"><span>{esc(title)}</span><small>{esc(sub)}</small></a>\n')
    body = (
        "    <header>\n      <div>\n        <p class=\"tag\">OSNews</p>\n"
        "        <h1>Canales OSNews</h1>\n"
        "        <p class=\"lead\">Ocho canales en ocho idiomas y un canal por país (China, India, Marruecos y Cuba), "
        "con titulares de medios oficiales europeos y de EE. UU., vídeos oficiales insertables, "
        "una sección destacada de Declaraciones con el texto literal de posts reales en X, y un buscador hacia X. "
        "Gratis, sin anuncios ni rastreadores.</p>\n      </div>\n"
        + nav_links(ui, "../")
        + "    </header>\n"
        '    <section class="panel" aria-labelledby="h-langs">\n'
        '      <h2 id="h-langs">Canales por idioma</h2>\n'
        '      <div class="tiles">\n' + "".join(tiles_lang) + "      </div>\n    </section>\n"
        '    <section class="panel" aria-labelledby="h-countries">\n'
        '      <h2 id="h-countries">Canales por país</h2>\n'
        '      <div class="tiles">\n' + "".join(tiles_co) + "      </div>\n    </section>\n"
        + footer(ui, generated_at, x_fetched)
    )
    desc = "Canales OSNews en 8 idiomas y por país. Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok."
    write(OUT / "index.html", page_shell("es", "Canales OSNews", desc, body, "./", js=False))


def build_language_page(lang, ligera, extra, xdata, generated_at):
    ui = I18N[lang]
    prefix = "../"
    x_by = {c: split_x(xdata, c) for c in COUNTRIES}
    decl = declaraciones_block(ui, x_by, lang, all_countries=True)
    sections = []
    for country in COUNTRIES:
        news = collect_news(ligera, extra, country, lang)
        videos = collect_videos(lang, country)
        local = pick(x_by[country]["country"], MAX_LOCAL, PER_ACC, lang)
        sections.append(
            f'    <section class="panel" id="{country}" aria-labelledby="h-{country}">\n'
            f'      <h2 id="h-{country}">{esc(ui[country])}</h2>\n'
            f'      <h3>{esc(ui["news"])}</h3>\n' + news_items(news, ui)
            + f'      <h3>{esc(ui["videos"])}</h3>\n' + video_items(videos, ui, lang)
            + f'      <h3>{esc(ui["local"])}</h3>\n' + post_items(local, ui, "empty_local")
            + "    </section>\n"
        )
    body = (
        "    <header>\n      <div>\n        <p class=\"tag\">OSNews</p>\n"
        f"        <h1>{esc(CHANNEL_TITLE[lang])}</h1>\n"
        f"        <p class=\"lead\">{esc(ui['tagline'])}</p>\n      </div>\n"
        + nav_links(ui, prefix) + "    </header>\n"
        '    <section class="panel" aria-labelledby="h-lang">\n'
        f'      <h2 id="h-lang">{esc(ui["language"])}</h2>\n'
        + lang_switcher(lang, prefix)
        + f'      <h3>{esc(ui["country_channels"])}</h3>\n'
        + country_switcher(ui, prefix)
        + "    </section>\n"
        + search_box(ui, lang, COUNTRIES)
        + decl + "".join(sections)
        + footer(ui, generated_at, xdata.get("fetched_at") or "")
    )
    write(OUT / lang / "index.html", page_shell(lang, CHANNEL_TITLE[lang], ui["tagline"] + " " + AUTHORS, body, prefix))


def build_country_page(ch, ui_lang, ligera, extra, xdata, generated_at):
    ui = I18N[ui_lang]
    country = ch["id"]
    title = COUNTRY_PAGE_TITLE[country][ui_lang]
    tagline = COUNTRY_TAGLINE[country][ui_lang]
    is_default = ui_lang == ch["default"]
    prefix = "../"
    x_by = {country: split_x(xdata, country)}
    decl = declaraciones_block(ui, x_by, ui_lang, all_countries=False)
    news = collect_news(ligera, extra, country, ui_lang)
    videos = collect_videos(ui_lang, country)
    local = pick(x_by[country]["country"], MAX_LOCAL, PER_ACC, ui_lang)
    toggles = ""
    if ch["uis"] != [ch["default"]]:
        links = []
        for other in ch["uis"]:
            href = "./" if other == ch["default"] else f"./{other}.html"
            label = {"hi": ui["toggle_hi"], "fr": ui["toggle_fr"], "en": ui["toggle_en"], "ar": ui["toggle_ar"]}[other]
            on = ' class="lang on" aria-current="page"' if other == ui_lang else ' class="lang"'
            links.append(f'        <a{on} href="{href}" lang="{other}">{esc(label)}</a>\n')
        toggles = f'      <h3>{esc(ui["language"])}</h3>\n      <div class="langs">\n' + "".join(links) + "      </div>\n"
    body = (
        "    <header>\n      <div>\n        <p class=\"tag\">OSNews</p>\n"
        f"        <h1>{esc(title)}</h1>\n"
        f"        <p class=\"lead\">{esc(tagline)}</p>\n      </div>\n"
        + nav_links(ui, prefix) + "    </header>\n"
        '    <section class="panel" aria-labelledby="h-navs">\n'
        f'      <h2 id="h-navs">{esc(ui["other_channels"])}</h2>\n'
        + country_switcher(ui, prefix, current=country)
        + f'      <h3>{esc(ui["lang_channels"])}</h3>\n'
        + lang_switcher(None, prefix)
        + toggles + "    </section>\n"
        + search_box(ui, ui_lang, [country])
        + decl
        + '    <section class="panel" aria-labelledby="h-news">\n'
        f'      <h2 id="h-news">{esc(ui["news"])}</h2>\n' + news_items(news, ui)
        + f'      <h2>{esc(ui["videos"])}</h2>\n' + video_items(videos, ui, ui_lang)
        + f'      <h2>{esc(ui["local"])}</h2>\n' + post_items(local, ui, "empty_local")
        + "    </section>\n"
        + footer(ui, generated_at, xdata.get("fetched_at") or "")
    )
    dest = OUT / ch["path"] / ("index.html" if is_default else f"{ui_lang}.html")
    write(dest, page_shell(ui_lang, title, tagline + " " + AUTHORS, body, prefix))


def counts_report(ligera, extra, xdata):
    report = {}
    for lang in LANGS:
        report[lang] = {}
        for country in COUNTRIES:
            xb = split_x(xdata, country)
            report[lang][country] = {
                "news": len(collect_news(ligera, extra, country, lang)),
                "videos": len(collect_videos(lang, country)),
                "decl_pol": len(pick(xb["us_eu"], MAX_DECL_POL, PER_ACC, lang)),
                "decl_tv": len(pick(xb["tv"], MAX_DECL_TV, PER_ACC, lang)),
                "decl_pol_all": len(xb["us_eu"]),
                "decl_tv_all": len(xb["tv"]),
                "local": len(xb["country"]),
            }
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--from-ligera", action="store_true", help="Reuse tv-world/ligera/titulos.json.")
    parser.add_argument("--no-extra", action="store_true", help="Do not fetch extra official country RSS feeds.")
    args = parser.parse_args()

    ligera = {}
    if LIGERA_JSON.exists():
        ligera = json.loads(LIGERA_JSON.read_text(encoding="utf-8"))
    if args.from_ligera and not LIGERA_JSON.exists():
        print("Missing", LIGERA_JSON, file=sys.stderr)
        return 1
    generated_at = (ligera.get("generated_at") if args.from_ligera else None) or datetime.now(MADRID).isoformat(timespec="seconds")

    extra, errors = ({c: [] for c in COUNTRIES}, []) if args.no_extra else fetch_extra()
    xdata = json.loads(X_PATH.read_text(encoding="utf-8")) if X_PATH.exists() else {"fetched_at": "", "countries": {}}
    build_index(generated_at, xdata.get("fetched_at") or "")
    for lang in LANGS:
        build_language_page(lang, ligera, extra, xdata, generated_at)
    for ch in COUNTRY_CHANNELS:
        for ui_lang in ch["uis"]:
            build_country_page(ch, ui_lang, ligera, extra, xdata, generated_at)

    report = counts_report(ligera, extra, xdata)
    (OUT / "conteo.json").write_text(json.dumps({"generated_at": generated_at, "x_fetched_at": xdata.get("fetched_at"), "errors": errors, "counts": report}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("generated_at", generated_at)
    print("x_fetched_at", xdata.get("fetched_at"))
    for lang, row in report.items():
        bits = [f"{c}:n={v['news']}/v={v['videos']}/dp={v['decl_pol']}/dtv={v['decl_tv']}/loc={v['local']}" for c, v in row.items()]
        print(lang, ", ".join(bits))
    if errors:
        print(len(errors), "extra-feed warning(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
