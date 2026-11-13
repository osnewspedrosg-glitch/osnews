#!/usr/bin/env python3
"""Generate the text-only OSNews TV World lite pages from official public RSS feeds.

No API keys, no paid services. Headlines are taken only from fetched feeds;
nothing is invented or machine-translated and presented as the source's text.

X posts are not fetched here (GitHub Actions has no X connector). They are
read from tv-world/ligera/titulos-x.json when present, which the daily
Europe/Madrid 08:00 routine can refresh with official-account search_posts_all
results. This script still regenerates the HTML around whatever X file is there.

Usage (from the repository root):
    python3 scripts/actualizar-tv-ligera.py
"""

from __future__ import annotations

import html
import json
import re
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "tv-world" / "ligera"
JSON_PATH = OUT_DIR / "titulos.json"
X_PATH = OUT_DIR / "titulos-x.json"
CACHE_PATH = ROOT / "scripts" / ".tv-ligera-cache.json"
MADRID = ZoneInfo("Europe/Madrid")
UA = (
    "OSNewsTVLigera/1.0 "
    "(+https://osnewspedrosg-glitch.github.io/osnews/tv-world/ligera/; "
    "public official RSS aggregator, text-only, no tracking)"
)
MAX_MAIN = 8
MAX_COUNTRY = 8
MAX_PER_SOURCE_COUNTRY = 2
TIMEOUT = 25
RETRIES = 2

LANGS = ["es", "en", "fr", "de", "pt", "it", "ar", "zh"]
LANG_FILES = {
    "es": "index.html",
    "en": "en.html",
    "fr": "fr.html",
    "de": "de.html",
    "pt": "pt.html",
    "it": "it.html",
    "ar": "ar.html",
    "zh": "zh.html",
}
LANG_NAMES = {
    "es": "Español",
    "en": "English",
    "fr": "Français",
    "de": "Deutsch",
    "pt": "Português",
    "it": "Italiano",
    "ar": "العربية",
    "zh": "中文",
}

# Official public RSS only. Language codes are the language of the feed itself.
FEEDS = [
    # DW (official: rss.dw.com). Spanish id is "sp"; French is "fre"; Portuguese is "br".
    {"id": "dw", "name": "DW", "lang": "es", "url": "https://rss.dw.com/xml/rss-sp-all", "role": "main"},
    {"id": "dw", "name": "DW", "lang": "en", "url": "https://rss.dw.com/xml/rss-en-all", "role": "main"},
    {"id": "dw", "name": "DW", "lang": "fr", "url": "https://rss.dw.com/xml/rss-fre-all", "role": "main"},
    {"id": "dw", "name": "DW", "lang": "de", "url": "https://rss.dw.com/xml/rss-de-all", "role": "main"},
    {"id": "dw", "name": "DW", "lang": "pt", "url": "https://rss.dw.com/xml/rss-br-all", "role": "main"},
    {"id": "dw", "name": "DW", "lang": "ar", "url": "https://rss.dw.com/xml/rss-ar-all", "role": "main"},
    {"id": "dw", "name": "DW", "lang": "zh", "url": "https://rss.dw.com/xml/rss-chi-all", "role": "main"},
    # Euronews official RSS by language subdomain.
    {"id": "euronews", "name": "Euronews", "lang": "es", "url": "https://es.euronews.com/rss?format=xml", "role": "main"},
    {"id": "euronews", "name": "Euronews", "lang": "en", "url": "https://www.euronews.com/rss?format=xml", "role": "main"},
    {"id": "euronews", "name": "Euronews", "lang": "fr", "url": "https://fr.euronews.com/rss?format=xml", "role": "main"},
    {"id": "euronews", "name": "Euronews", "lang": "de", "url": "https://de.euronews.com/rss?format=xml", "role": "main"},
    {"id": "euronews", "name": "Euronews", "lang": "pt", "url": "https://pt.euronews.com/rss?format=xml", "role": "main"},
    {"id": "euronews", "name": "Euronews", "lang": "it", "url": "https://it.euronews.com/rss?format=xml", "role": "main"},
    {"id": "euronews", "name": "Euronews", "lang": "ar", "url": "https://arabic.euronews.com/rss?format=xml", "role": "main"},
    # France 24 official language RSS (no official de/pt/it/zh feeds).
    {"id": "france24", "name": "France 24", "lang": "es", "url": "https://www.france24.com/es/rss", "role": "main"},
    {"id": "france24", "name": "France 24", "lang": "en", "url": "https://www.france24.com/en/rss", "role": "main"},
    {"id": "france24", "name": "France 24", "lang": "fr", "url": "https://www.france24.com/fr/rss", "role": "main"},
    {"id": "france24", "name": "France 24", "lang": "ar", "url": "https://www.france24.com/ar/rss", "role": "main"},
    # BBC official public RSS (feeds.bbci.co.uk). No official Italian or German news feed.
    {"id": "bbc", "name": "BBC News Mundo", "lang": "es", "url": "https://feeds.bbci.co.uk/mundo/rss.xml", "role": "main"},
    {"id": "bbc", "name": "BBC News", "lang": "en", "url": "https://feeds.bbci.co.uk/news/world/rss.xml", "role": "main"},
    {"id": "bbc", "name": "BBC Afrique", "lang": "fr", "url": "https://feeds.bbci.co.uk/afrique/rss.xml", "role": "main"},
    {"id": "bbc", "name": "BBC News Brasil", "lang": "pt", "url": "https://feeds.bbci.co.uk/portuguese/rss.xml", "role": "main"},
    {"id": "bbc", "name": "BBC News عربي", "lang": "ar", "url": "https://feeds.bbci.co.uk/arabic/rss.xml", "role": "main"},
    {"id": "bbc", "name": "BBC News 中文", "lang": "zh", "url": "https://feeds.bbci.co.uk/zhongwen/simp/rss.xml", "role": "main"},
    # Extra European / US official RSS, used for «Noticias por país».
    {"id": "elpais", "name": "El País", "lang": "es", "url": "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/internacional/portada", "role": "country"},
    {"id": "lemonde", "name": "Le Monde", "lang": "fr", "url": "https://www.lemonde.fr/international/rss_full.xml", "role": "country"},
    {"id": "lemonde", "name": "Le Monde", "lang": "en", "url": "https://www.lemonde.fr/en/rss/une.xml", "role": "country"},
    {"id": "nyt", "name": "The New York Times", "lang": "en", "url": "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", "role": "country"},
    {"id": "nyt-asia", "name": "The New York Times", "lang": "en", "url": "https://rss.nytimes.com/services/xml/rss/nyt/AsiaPacific.xml", "role": "country"},
    {"id": "nyt-americas", "name": "The New York Times", "lang": "en", "url": "https://rss.nytimes.com/services/xml/rss/nyt/Americas.xml", "role": "country"},
    {"id": "nyt-africa", "name": "The New York Times", "lang": "en", "url": "https://rss.nytimes.com/services/xml/rss/nyt/Africa.xml", "role": "country"},
    {"id": "wapo", "name": "The Washington Post", "lang": "en", "url": "https://feeds.washingtonpost.com/rss/world", "role": "country"},
    {"id": "npr", "name": "NPR", "lang": "en", "url": "https://feeds.npr.org/1004/rss.xml", "role": "country"},
    {"id": "guardian", "name": "The Guardian", "lang": "en", "url": "https://www.theguardian.com/world/rss", "role": "country"},
]

# When a language has no official feed for a main source, show the nearest official one and label it.
FALLBACK = {
    "it": {"dw": "en", "france24": "fr", "bbc": "en"},
    "de": {"france24": "en", "bbc": "en"},
    "pt": {"france24": "es"},
    "zh": {"euronews": "en", "france24": "en"},
}
MAIN_ORDER = ["dw", "euronews", "france24", "bbc"]
COUNTRIES = ["china", "india", "morocco", "cuba"]

LATIN = r"A-Za-zÀ-ÖØ-öø-ÿ"
AR = r"\u0600-\u06FF"


def word_re(words, extra=""):
    parts = [rf"(?<![{LATIN}])(?:{w})(?![{LATIN}])" for w in words]
    if extra:
        parts.append(extra)
    return re.compile("|".join(parts), re.IGNORECASE)


PATTERNS = {
    "china": word_re(
        [
            "china", "chinese", "chinois", "chinoise", "chinesisch", "chinesische",
            "chinesischer", "cina", "cinese", "chine", "chino", "chinos", "chinas",
            "pek[ií]n", "pekin", "beijing", "shanghai", "shangh[aá]i", "taiwan",
            "taiw[aá]n", "tibet", "xinjiang", "uighur", "uigur", "uygur",
            "hong kong", "hongkong", r"xi\s+jinping",
        ],
        extra=rf"中国|中國|北京|上海|台湾|台灣|西藏|香港|习近平|(?<![{AR}])(?:الصين|الصيني|الصينية|للصين)(?![{AR}])",
    ),
    "india": word_re(
        [
            "india", "indian", "inde", "indiano", "delhi", "mumbai", "modi",
            "kashmir", "cachemira", "diwali", r"narendra\s+modi",
        ],
        extra=rf"印度|(?<![{AR}])(?:الهند|الهندي|الهندية)(?![{AR}])",
    ),
    "morocco": word_re(
        [
            "morocco", "moroccan", "marruecos", "marroqu[ií]", "marroqu[ií]es",
            "marroquina", "maroc", "marocain", "marocaine", "marokko",
            "marokkanisch", "marocco", "marocchino", "rabat", "marrakech",
            "marrakesh",
        ],
        extra=rf"摩洛哥|(?<![{AR}])(?:المغرب|المغربي|المغربية|المغربيين)(?![{AR}])",
    ),
    "cuba": word_re(
        [
            "cuba", "cuban", "cubano", "cubana", "cubanos", "cubanas", "kuba",
            "kubanisch", "havana", "habana", r"la\s+habana", "havanna",
            r"d[ií]az-?canel",
        ],
        extra=rf"古巴|(?<![{AR}])كوبا(?![{AR}])",
    ),
}
EXCLUDE = {
    "india": re.compile(
        r"indian\s+wells|indianapolis|indiana(?![n])|indian\s+act|american\s+indian|"
        r"loi\s+sur\s+les\s+indiens|indiens\s+d['’]am[eé]rique|native\s+american",
        re.I,
    ),
}

I18N = {
    "es": {
        "title": "OSNews TV World · versión ligera",
        "tagline": "Solo texto, para conexiones lentas. Titulares de canales RSS oficiales, con enlace a la noticia original. Sin vídeos, sin rastreadores y sin recogida de datos.",
        "back_full": "Versión completa (con vídeos)",
        "back_home": "Volver a OSNews",
        "language": "Idioma",
        "headlines": "Titulares",
        "countries": "Noticias por país",
        "china": "China",
        "india": "India",
        "morocco": "Marruecos",
        "cuba": "Cuba",
        "on_x": "Publicaciones recientes en X de cuentas oficiales",
        "source": "Fuente",
        "updated": "Titulares actualizados el",
        "x_updated": "Publicaciones en X recogidas el",
        "timezone": "hora de Europe/Madrid",
        "fallback": "No hay canal RSS oficial en {ui}. Se muestra el canal oficial en {feed}.",
        "empty_news": "En esta actualización no había titulares sobre este país en los canales RSS oficiales consultados.",
        "empty_x": "En esta recogida no había publicaciones recientes de esas cuentas oficiales sobre este país.",
        "failed": "Este canal no pudo leerse en esta actualización.",
        "stale": "Se mantienen los titulares de una actualización anterior; el canal no respondió ahora.",
        "authors": "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.",
        "legal": "Página de solo texto. No incrusta vídeos ni scripts de X, no carga fuentes externas, no usa rastreadores y no recoge datos. Los titulares salen de canales RSS públicos oficiales; el texto de X, de cuentas oficiales, sin inventar ni traducir como si fuera de la fuente. Cada enlace abre la página o la publicación original.",
        "open_article": "Abrir el artículo original",
        "open_post": "Abrir la publicación en X",
    },
    "en": {
        "title": "OSNews TV World · lite",
        "tagline": "Text only, for slow connections. Headlines from official RSS feeds, each linking to the original article. No video, no trackers, and no data collection.",
        "back_full": "Full version (with video)",
        "back_home": "Back to OSNews",
        "language": "Language",
        "headlines": "Headlines",
        "countries": "News by country",
        "china": "China",
        "india": "India",
        "morocco": "Morocco",
        "cuba": "Cuba",
        "on_x": "Recent posts on X from official accounts",
        "source": "Source",
        "updated": "Headlines updated",
        "x_updated": "X posts collected",
        "timezone": "Europe/Madrid time",
        "fallback": "There is no official RSS feed in {ui}. The official feed in {feed} is shown instead.",
        "empty_news": "This update found no headlines about this country in the official RSS feeds that were checked.",
        "empty_x": "This collection found no recent official-account posts about this country.",
        "failed": "This feed could not be read in this update.",
        "stale": "Headlines from a previous update are kept; the feed did not respond this time.",
        "authors": "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.",
        "legal": "Text-only page. It does not embed videos or X scripts, does not load external fonts, uses no trackers and collects no data. Headlines come from official public RSS feeds; X text comes from official accounts, never invented or presented as a translation of the source. Each link opens the original article or post.",
        "open_article": "Open the original article",
        "open_post": "Open the post on X",
    },
    "fr": {
        "title": "OSNews TV World · version légère",
        "tagline": "Texte seul, pour les connexions lentes. Titres issus de flux RSS officiels, avec lien vers l’article d’origine. Pas de vidéo, pas de traceurs, pas de collecte de données.",
        "back_full": "Version complète (avec vidéos)",
        "back_home": "Retour à OSNews",
        "language": "Langue",
        "headlines": "Titres",
        "countries": "Actualités par pays",
        "china": "Chine",
        "india": "Inde",
        "morocco": "Maroc",
        "cuba": "Cuba",
        "on_x": "Publications récentes sur X de comptes officiels",
        "source": "Source",
        "updated": "Titres mis à jour le",
        "x_updated": "Publications X recueillies le",
        "timezone": "heure Europe/Madrid",
        "fallback": "Il n’existe pas de flux RSS officiel en {ui}. Le flux officiel en {feed} est affiché.",
        "empty_news": "Cette mise à jour n’a trouvé aucun titre sur ce pays dans les flux RSS officiels consultés.",
        "empty_x": "Cette collecte n’a trouvé aucune publication récente de ces comptes officiels sur ce pays.",
        "failed": "Ce flux n’a pas pu être lu lors de cette mise à jour.",
        "stale": "Les titres d’une mise à jour précédente sont conservés ; le flux n’a pas répondu cette fois.",
        "authors": "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.",
        "legal": "Page en texte seul. Elle n’intègre ni vidéos ni scripts X, ne charge pas de polices externes, n’utilise pas de traceurs et ne collecte pas de données. Les titres viennent de flux RSS publics officiels ; le texte X, de comptes officiels, sans invention ni traduction présentée comme celle de la source. Chaque lien ouvre l’article ou la publication d’origine.",
        "open_article": "Ouvrir l’article d’origine",
        "open_post": "Ouvrir la publication sur X",
    },
    "de": {
        "title": "OSNews TV World · Leichtversion",
        "tagline": "Nur Text, für langsame Verbindungen. Schlagzeilen aus offiziellen RSS-Feeds, jeweils mit Link zum Originalartikel. Keine Videos, keine Tracker, keine Datenerfassung.",
        "back_full": "Vollversion (mit Videos)",
        "back_home": "Zurück zu OSNews",
        "language": "Sprache",
        "headlines": "Schlagzeilen",
        "countries": "Nachrichten nach Land",
        "china": "China",
        "india": "Indien",
        "morocco": "Marokko",
        "cuba": "Kuba",
        "on_x": "Aktuelle Beiträge auf X von offiziellen Konten",
        "source": "Quelle",
        "updated": "Schlagzeilen aktualisiert am",
        "x_updated": "X-Beiträge erfasst am",
        "timezone": "Europe/Madrid-Zeit",
        "fallback": "Es gibt keinen offiziellen RSS-Feed auf {ui}. Stattdessen wird der offizielle Feed auf {feed} gezeigt.",
        "empty_news": "In dieser Aktualisierung gab es in den geprüften offiziellen RSS-Feeds keine Schlagzeilen zu diesem Land.",
        "empty_x": "In dieser Erfassung gab es keine aktuellen Beiträge dieser offiziellen Konten zu diesem Land.",
        "failed": "Dieser Feed konnte in dieser Aktualisierung nicht gelesen werden.",
        "stale": "Schlagzeilen einer früheren Aktualisierung werden behalten; der Feed hat diesmal nicht geantwortet.",
        "authors": "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.",
        "legal": "Nur-Text-Seite. Keine Videos oder X-Skripte, keine externen Schriften, keine Tracker, keine Datenerfassung. Schlagzeilen stammen aus offiziellen öffentlichen RSS-Feeds; X-Text aus offiziellen Konten, nie erfunden und nie als Übersetzung der Quelle ausgegeben. Jeder Link öffnet den Originalartikel oder -beitrag.",
        "open_article": "Originalartikel öffnen",
        "open_post": "Beitrag auf X öffnen",
    },
    "pt": {
        "title": "OSNews TV World · versão leve",
        "tagline": "Só texto, para ligações lentas. Titulares de canais RSS oficiais, com ligação para o artigo original. Sem vídeos, sem rastreadores e sem recolha de dados.",
        "back_full": "Versão completa (com vídeos)",
        "back_home": "Voltar à OSNews",
        "language": "Idioma",
        "headlines": "Titulares",
        "countries": "Notícias por país",
        "china": "China",
        "india": "Índia",
        "morocco": "Marrocos",
        "cuba": "Cuba",
        "on_x": "Publicações recentes no X de contas oficiais",
        "source": "Fonte",
        "updated": "Titulares atualizados em",
        "x_updated": "Publicações no X recolhidas em",
        "timezone": "hora de Europe/Madrid",
        "fallback": "Não há canal RSS oficial em {ui}. Mostra-se o canal oficial em {feed}.",
        "empty_news": "Nesta atualização não havia titulares sobre este país nos canais RSS oficiais consultados.",
        "empty_x": "Nesta recolha não havia publicações recentes dessas contas oficiais sobre este país.",
        "failed": "Este canal não pôde ser lido nesta atualização.",
        "stale": "Mantêm-se os titulares de uma atualização anterior; o canal não respondeu agora.",
        "authors": "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.",
        "legal": "Página só de texto. Não incorpora vídeos nem scripts do X, não carrega tipos de letra externos, não usa rastreadores e não recolhe dados. Os titulares vêm de canais RSS públicos oficiais; o texto do X, de contas oficiais, sem inventar nem traduzir como se fosse da fonte. Cada ligação abre o artigo ou a publicação original.",
        "open_article": "Abrir o artigo original",
        "open_post": "Abrir a publicação no X",
    },
    "it": {
        "title": "OSNews TV World · versione leggera",
        "tagline": "Solo testo, per connessioni lente. Titoli da feed RSS ufficiali, con collegamento all’articolo originale. Niente video, niente tracker e nessuna raccolta di dati.",
        "back_full": "Versione completa (con video)",
        "back_home": "Torna a OSNews",
        "language": "Lingua",
        "headlines": "Titoli",
        "countries": "Notizie per paese",
        "china": "Cina",
        "india": "India",
        "morocco": "Marocco",
        "cuba": "Cuba",
        "on_x": "Post recenti su X di account ufficiali",
        "source": "Fonte",
        "updated": "Titoli aggiornati il",
        "x_updated": "Post su X raccolti il",
        "timezone": "ora Europe/Madrid",
        "fallback": "Non c’è un feed RSS ufficiale in {ui}. Viene mostrato il feed ufficiale in {feed}.",
        "empty_news": "In questo aggiornamento non c’erano titoli su questo paese nei feed RSS ufficiali consultati.",
        "empty_x": "In questa raccolta non c’erano post recenti di quegli account ufficiali su questo paese.",
        "failed": "Questo feed non è stato letto in questo aggiornamento.",
        "stale": "Sono conservati i titoli di un aggiornamento precedente; il feed non ha risposto questa volta.",
        "authors": "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.",
        "legal": "Pagina solo testuale. Non incorpora video né script di X, non carica font esterni, non usa tracker e non raccoglie dati. I titoli arrivano da feed RSS pubblici ufficiali; il testo di X, da account ufficiali, senza inventare né tradurre presentandolo come della fonte. Ogni collegamento apre l’articolo o il post originale.",
        "open_article": "Apri l’articolo originale",
        "open_post": "Apri il post su X",
    },
    "ar": {
        "title": "OSNews TV World · نسخة خفيفة",
        "tagline": "نص فقط، للاتصالات البطيئة. عناوين من خلاصات RSS الرسمية، مع رابط إلى المقال الأصلي. بلا فيديو ولا متعقّبات ولا جمع للبيانات.",
        "back_full": "النسخة الكاملة (مع الفيديو)",
        "back_home": "العودة إلى OSNews",
        "language": "اللغة",
        "headlines": "العناوين",
        "countries": "أخبار حسب البلد",
        "china": "الصين",
        "india": "الهند",
        "morocco": "المغرب",
        "cuba": "كوبا",
        "on_x": "منشورات حديثة على X من حسابات رسمية",
        "source": "المصدر",
        "updated": "تم تحديث العناوين في",
        "x_updated": "جُمعت منشورات X في",
        "timezone": "توقيت Europe/Madrid",
        "fallback": "لا توجد خلاصة RSS رسمية ب{ui}. تُعرض الخلاصة الرسمية ب{feed}.",
        "empty_news": "لم تتضمن هذه التحديثات عناوين عن هذا البلد في خلاصات RSS الرسمية التي جرى الرجوع إليها.",
        "empty_x": "لم تتضمن هذه الجولة منشورات حديثة من تلك الحسابات الرسمية عن هذا البلد.",
        "failed": "تعذّر قراءة هذه الخلاصة في هذا التحديث.",
        "stale": "يُحتفظ بعناوين من تحديث سابق؛ لم تستجب الخلاصة هذه المرة.",
        "authors": "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.",
        "legal": "صفحة نصية فقط. لا تضمّن فيديو ولا سكربتات X، ولا تحمّل خطوطًا خارجية، ولا تستخدم متعقّبات ولا تجمع بيانات. العناوين من خلاصات RSS الرسمية؛ ونص X من حسابات رسمية، دون اختراع أو ترجمة تُقدَّم على أنها من المصدر. كل رابط يفتح المقال أو المنشور الأصلي.",
        "open_article": "فتح المقال الأصلي",
        "open_post": "فتح المنشور على X",
    },
    "zh": {
        "title": "OSNews TV World · 轻量版",
        "tagline": "纯文字，适合较慢的网络。标题来自官方 RSS，并链向原文。无视频、无跟踪器、不收集数据。",
        "back_full": "完整版（含视频）",
        "back_home": "返回 OSNews",
        "language": "语言",
        "headlines": "头条",
        "countries": "按国家分类的新闻",
        "china": "中国",
        "india": "印度",
        "morocco": "摩洛哥",
        "cuba": "古巴",
        "on_x": "官方账号在 X 上的近期帖文",
        "source": "来源",
        "updated": "头条更新于",
        "x_updated": "X 帖文采集于",
        "timezone": "Europe/Madrid 时间",
        "fallback": "没有{ui}的官方 RSS。改为显示{feed}的官方源。",
        "empty_news": "本次更新在已查询的官方 RSS 中没有找到关于该国的标题。",
        "empty_x": "本次采集中，这些官方账号没有关于该国的近期帖文。",
        "failed": "本次更新未能读取该源。",
        "stale": "保留上次更新的标题；此次源未响应。",
        "authors": "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.",
        "legal": "纯文字页面。不嵌入视频或 X 脚本，不加载外部字体，不使用跟踪器，不收集数据。标题来自官方公开 RSS；X 文本来自官方账号，绝不编造，也绝不把机翻当成原文。每个链接打开原始文章或帖文。",
        "open_article": "打开原文",
        "open_post": "打开 X 上的帖文",
    },
}


def child_text(el, name):
    if el is None:
        return ""
    for child in list(el):
        tag = child.tag.split("}")[-1]
        if tag == name:
            if name == "link":
                href = (child.get("href") or "").strip()
                text = (child.text or "").strip()
                return href or text
            return (child.text or "").strip()
    return ""


def parse_date(value):
    value = (value or "").strip()
    if not value:
        return None
    dt = None
    try:
        dt = parsedate_to_datetime(value)
    except (TypeError, ValueError, IndexError):
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(MADRID)


def clean_url(url):
    url = (url or "").strip()
    if not url:
        return ""
    # Drop common tracking parameters; keep the official article URL.
    url = re.sub(r"(#.*)$", "", url)
    url = re.sub(
        r"([?&])(maca|at_medium|at_campaign|at_audience|ns_mchannel|ns_source|ns_campaign|ns_linkname|utm_[^=]+|ocid|cmpid)=[^&]*",
        r"\1",
        url,
        flags=re.I,
    )
    url = re.sub(r"\?&+", "?", url)
    url = re.sub(r"&&+", "&", url)
    url = url.rstrip("?&")
    return url


def parse_feed(raw):
    root = ET.fromstring(raw)
    items = []
    for el in root.iter():
        tag = el.tag.split("}")[-1]
        if tag not in ("item", "entry"):
            continue
        title = child_text(el, "title")
        link = child_text(el, "link") or child_text(el, "guid")
        date = (
            child_text(el, "pubDate")
            or child_text(el, "date")
            or child_text(el, "updated")
            or child_text(el, "published")
        )
        desc = child_text(el, "description") or child_text(el, "summary") or child_text(el, "encoded")
        title = re.sub(r"\s+", " ", title or "").strip()
        if not title or not link:
            continue
        dt = parse_date(date)
        items.append(
            {
                "title": title,
                "url": clean_url(link),
                "date": dt.strftime("%Y-%m-%d") if dt else "",
                "time": dt.strftime("%H:%M") if dt else "",
                "sort": dt.timestamp() if dt else 0,
                "blurb": re.sub(r"<[^>]+>", " ", desc or ""),
            }
        )
    return items


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/xml, text/xml, */*"})
    last_err = None
    for attempt in range(RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                return resp.read()
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last_err = exc
            time.sleep(1.5 * (attempt + 1))
    raise last_err


def previous_items(prev, feed):
    for block in (prev or {}).get("feeds", []):
        if block.get("url") == feed["url"] and block.get("items"):
            return block["items"], True
    return [], False


def about_country(country, title, blurb=""):
    # Headlines must mention the country in the title itself. The optional
    # blurb is ignored so a passing mention in the summary cannot sneak in.
    text = title or ""
    if EXCLUDE.get(country) and EXCLUDE[country].search(text):
        return False
    return bool(PATTERNS[country].search(text))


def unique_rows(rows, limit=None, per_source=None):
    out = []
    seen = set()
    counts = {}
    for row in sorted(rows, key=lambda r: r.get("sort") or 0, reverse=True):
        key = (row.get("title", "").lower(), row.get("url", "").split("?")[0])
        if key in seen:
            continue
        src = row.get("source_id") or row.get("name")
        if per_source is not None and counts.get(src, 0) >= per_source:
            continue
        seen.add(key)
        counts[src] = counts.get(src, 0) + 1
        out.append(row)
        if limit is not None and len(out) >= limit:
            break
    return out


def find_feed(source_id, lang):
    for feed in FEEDS:
        if feed["id"] == source_id and feed["lang"] == lang and feed["role"] == "main":
            return feed, False, lang
    fb = FALLBACK.get(lang, {}).get(source_id)
    if fb:
        for feed in FEEDS:
            if feed["id"] == source_id and feed["lang"] == fb and feed["role"] == "main":
                return feed, True, fb
    return None, False, None


def public_item(item, name=None, source_id=None, feed_lang=None, official=True, stale=False):
    row = {
        "title": item["title"],
        "url": item["url"],
        "date": item.get("date") or "",
        "time": item.get("time") or "",
        "name": name or item.get("name"),
        "source_id": source_id or item.get("source_id"),
        "feed_lang": feed_lang or item.get("feed_lang"),
        "official": official,
        "stale": stale,
        "sort": item.get("sort") or 0,
    }
    return row


def slim(item):
    keys = ("title", "url", "date", "time", "name", "feed_lang", "official", "stale", "account")
    return {k: item[k] for k in keys if k in item and item[k] not in ("", None, False)}


def build_pages(feed_data, generated_at, x_data, errors):
    # feed_data: list of {feed, items, stale, error}
    by_key = {(d["feed"]["id"], d["feed"]["lang"], d["feed"]["url"]): d for d in feed_data}
    x_countries = (x_data or {}).get("countries") or {}
    x_fetched = (x_data or {}).get("fetched_at") or ""

    languages = {}
    for lang in LANGS:
        sources = []
        for source_id in MAIN_ORDER:
            feed, is_fb, feed_lang = find_feed(source_id, lang)
            if not feed:
                continue
            block = by_key.get((feed["id"], feed["lang"], feed["url"]))
            items = []
            stale = False
            error = None
            if block:
                stale = block.get("stale", False)
                error = block.get("error")
                items = unique_rows(
                    [
                        public_item(it, name=feed["name"], source_id=feed["id"], feed_lang=feed["lang"], official=not is_fb, stale=stale)
                        for it in (block.get("items") or [])
                    ],
                    limit=MAX_MAIN,
                )
            sources.append(
                {
                    "id": source_id,
                    "name": feed["name"],
                    "feed_lang": feed_lang,
                    "official": not is_fb,
                    "url": feed["url"],
                    "stale": stale,
                    "error": error,
                    "items": items,
                }
            )

        country_out = {}
        for country in COUNTRIES:
            rows = []
            for block in feed_data:
                feed = block["feed"]
                for it in block.get("items") or []:
                    if about_country(country, it["title"], it.get("blurb", "")):
                        # Prefer items whose feed language matches the UI language,
                        # but keep others (labeled) so European/US sources still appear.
                        rows.append(
                            public_item(
                                it,
                                name=feed["name"],
                                source_id=feed["id"],
                                feed_lang=feed["lang"],
                                official=True,
                                stale=block.get("stale", False),
                            )
                        )
            def sort_key(row):
                same = 0 if row.get("feed_lang") == lang else 1
                return (same, -(row.get("sort") or 0))

            def take(pool, picked, seen, counts, limit, per_source):
                for row in sorted(pool, key=sort_key):
                    if len(picked) >= limit:
                        break
                    key = (row["title"].lower(), row["url"].split("?")[0])
                    if key in seen:
                        continue
                    src = row["name"]
                    if counts.get(src, 0) >= per_source:
                        continue
                    seen.add(key)
                    counts[src] = counts.get(src, 0) + 1
                    picked.append(row)

            same = [r for r in rows if r.get("feed_lang") == lang]
            other = [r for r in rows if r.get("feed_lang") != lang]
            picked, seen, counts = [], set(), {}
            # Keep official-language headlines first, then reserve room for
            # European and US sources in other official languages (labeled).
            take(same, picked, seen, counts, limit=5, per_source=MAX_PER_SOURCE_COUNTRY)
            take(other, picked, seen, counts, limit=MAX_COUNTRY, per_source=1)
            take(same + other, picked, seen, counts, limit=MAX_COUNTRY, per_source=MAX_PER_SOURCE_COUNTRY)
            x_items = []
            for post in x_countries.get(country) or []:
                text = (post.get("text") or "").strip()
                if not text or not post.get("url"):
                    continue
                if not about_country(country, text):
                    continue
                x_items.append(
                    {
                        "text": text,
                        "url": post["url"],
                        "account": post.get("account") or "",
                        "name": post.get("name") or post.get("account") or "",
                        "date": post.get("date") or "",
                        "time": post.get("time") or "",
                    }
                )
            # Dedupe near-identical posts across BBCNews/BBCWorld etc.
            x_picked = []
            seen_x = set()
            acc_count = {}
            for post in x_items:
                norm = re.sub(r"https://t\.co/\w+", "", post["text"]).strip().lower()[:90]
                if norm in seen_x:
                    continue
                acc = post["account"].lower()
                if acc_count.get(acc, 0) >= 2:
                    continue
                seen_x.add(norm)
                acc_count[acc] = acc_count.get(acc, 0) + 1
                x_picked.append(post)
                if len(x_picked) >= 5:
                    break
            country_out[country] = {"news": picked, "x": x_picked}

        languages[lang] = {"sources": sources, "countries": country_out}

    payload = {
        "generated_at": generated_at,
        "timezone": "Europe/Madrid",
        "x_fetched_at": x_fetched,
        "errors": errors,
        "languages": {
            lang: {
                "sources": [
                    {
                        **{k: s[k] for k in ("id", "name", "feed_lang", "official", "url", "stale") if k in s},
                        "error": s.get("error"),
                        "items": [slim(it) for it in s["items"]],
                    }
                    for s in data["sources"]
                ],
                "countries": {
                    c: {
                        "news": [slim(it) for it in block["news"]],
                        "x": block["x"],
                    }
                    for c, block in data["countries"].items()
                },
            }
            for lang, data in languages.items()
        },
    }
    # Drop null errors to keep JSON small
    for lang in payload["languages"].values():
        for s in lang["sources"]:
            if not s.get("error"):
                s.pop("error", None)
            if not s.get("stale"):
                s.pop("stale", None)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    JSON_PATH.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    for lang in LANGS:
        render_html(lang, languages[lang], generated_at, x_fetched, errors)
    return payload


def fmt_stamp(iso):
    if not iso:
        return ""
    try:
        dt = datetime.fromisoformat(iso)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=MADRID)
        dt = dt.astimezone(MADRID)
        return dt.strftime("%Y-%m-%d %H:%M")
    except ValueError:
        return iso


def render_html(lang, data, generated_at, x_fetched, errors):
    ui = I18N[lang]
    direction = "rtl" if lang == "ar" else "ltr"
    stamp = fmt_stamp(generated_at)
    x_stamp = fmt_stamp(x_fetched)

    nav = []
    for code in LANGS:
        href = LANG_FILES[code]
        label = LANG_NAMES[code]
        if code == lang:
            nav.append(f'<a class="lang on" aria-current="page" lang="{code}">{html.escape(label)}</a>')
        else:
            nav.append(f'<a class="lang" href="{href}" lang="{code}" hreflang="{code}">{html.escape(label)}</a>')

    parts = []
    parts.append(
        f"""<!DOCTYPE html>
<html lang="{lang}" dir="{direction}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0b1220">
  <title>{html.escape(ui['title'])}</title>
  <meta name="description" content="{html.escape(ui['tagline'])}">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1>OSNews TV World</h1>
        <p class="tag">{html.escape(ui['title'].split('·')[-1].strip())}</p>
        <p class="lead">{html.escape(ui['tagline'])}</p>
      </div>
      <nav class="jump">
        <a href="../">{html.escape(ui['back_full'])}</a>
        <a href="../../">{html.escape(ui['back_home'])}</a>
      </nav>
    </header>
    <section class="panel" aria-labelledby="h-lang">
      <h2 id="h-lang">{html.escape(ui['language'])}</h2>
      <div class="langs">{''.join(nav)}</div>
    </section>
"""
    )

    parts.append(f'    <section class="panel" aria-labelledby="h-news">\n      <h2 id="h-news">{html.escape(ui["headlines"])}</h2>\n')
    for source in data["sources"]:
        parts.append(f'      <h3>{html.escape(source["name"])}</h3>\n')
        if not source["official"]:
            parts.append(
                "      <p class=\"note\">"
                + html.escape(ui["fallback"].format(ui=LANG_NAMES[lang], feed=LANG_NAMES.get(source["feed_lang"], source["feed_lang"])))
                + "</p>\n"
            )
        if source.get("stale"):
            parts.append(f'      <p class="note">{html.escape(ui["stale"])}</p>\n')
        if source.get("error") and not source["items"]:
            parts.append(f'      <p class="note">{html.escape(ui["failed"])}</p>\n')
        parts.append("      <ul class=\"list\">\n")
        for it in source["items"]:
            parts.append(item_li(it, ui, article=True))
        parts.append("      </ul>\n")
    parts.append("    </section>\n")

    parts.append(f'    <section class="panel" aria-labelledby="h-countries">\n      <h2 id="h-countries">{html.escape(ui["countries"])}</h2>\n')
    for country in COUNTRIES:
        block = data["countries"][country]
        parts.append(f'      <h3 id="{country}">{html.escape(ui[country])}</h3>\n')
        if not block["news"]:
            parts.append(f'      <p class="note">{html.escape(ui["empty_news"])}</p>\n')
        else:
            parts.append("      <ul class=\"list\">\n")
            for it in block["news"]:
                parts.append(item_li(it, ui, article=True, show_lang=it.get("feed_lang") and it.get("feed_lang") != lang))
            parts.append("      </ul>\n")
        parts.append(f'      <h4>{html.escape(ui["on_x"])}</h4>\n')
        if not block["x"]:
            parts.append(f'      <p class="note">{html.escape(ui["empty_x"])}</p>\n')
        else:
            parts.append("      <ul class=\"list\">\n")
            for post in block["x"]:
                parts.append(x_li(post, ui))
            parts.append("      </ul>\n")
    parts.append("    </section>\n")

    x_line = f'{html.escape(ui["x_updated"])} {html.escape(x_stamp)} ({html.escape(ui["timezone"])}).' if x_stamp else ""
    parts.append(
        f"""    <footer>
      <p><strong>{html.escape(ui['authors'])}</strong></p>
      <p>{html.escape(ui['updated'])} {html.escape(stamp)} ({html.escape(ui['timezone'])}). {x_line}</p>
      <p>{html.escape(ui['legal'])}</p>
    </footer>
  </div>
</body>
</html>
"""
    )
    path = OUT_DIR / LANG_FILES[lang]
    path.write_text("".join(parts), encoding="utf-8")


def meta_line(it, ui, show_lang=False):
    bits = [it.get("name") or ""]
    if show_lang and it.get("feed_lang"):
        bits.append(LANG_NAMES.get(it["feed_lang"], it["feed_lang"]))
    when = it.get("date") or ""
    if it.get("time"):
        when = f"{when} {it['time']}".strip()
    if when:
        bits.append(when)
    return " · ".join(b for b in bits if b)


def item_li(it, ui, article=True, show_lang=False):
    label = ui["open_article"] if article else ui["open_post"]
    meta = meta_line(it, ui, show_lang=show_lang)
    return (
        "        <li><a href=\""
        + html.escape(it["url"], quote=True)
        + "\" rel=\"noopener noreferrer\">"
        + html.escape(it["title"])
        + "</a><small>"
        + html.escape(meta)
        + " — "
        + html.escape(label)
        + "</small></li>\n"
    )


def x_li(post, ui):
    meta = " · ".join(
        b
        for b in [
            f"@{post.get('account')}" if post.get("account") else "",
            post.get("name") or "",
            " ".join(x for x in [post.get("date") or "", post.get("time") or ""] if x),
        ]
        if b
    )
    return (
        "        <li><a href=\""
        + html.escape(post["url"], quote=True)
        + "\" rel=\"noopener noreferrer\">"
        + html.escape(post["text"])
        + "</a><small>"
        + html.escape(meta)
        + " — "
        + html.escape(ui["open_post"])
        + "</small></li>\n"
    )


def main():
    prev = load_previous()
    generated_at = datetime.now(MADRID).isoformat(timespec="seconds")
    feed_data = []
    errors = []
    for feed in FEEDS:
        stale = False
        error = None
        items = []
        try:
            raw = fetch(feed["url"])
            parsed = parse_feed(raw)
            # Strip blurb after matching later; keep for country filter.
            items = [
                {
                    "title": it["title"],
                    "url": it["url"],
                    "date": it["date"],
                    "time": it["time"],
                    "sort": it["sort"],
                    "blurb": it.get("blurb") or "",
                    "name": feed["name"],
                    "source_id": feed["id"],
                    "feed_lang": feed["lang"],
                }
                for it in parsed
            ]
            print(f"OK {feed['name']:22} {feed['lang']} {len(items):3} {feed['url']}", flush=True)
        except Exception as exc:
            error = f"{type(exc).__name__}: {exc}"
            old, had = previous_items(prev, feed)
            if had:
                stale = True
                items = old
                print(f"STALE {feed['name']} {feed['lang']}: {error}", flush=True)
            else:
                print(f"FAIL {feed['name']} {feed['lang']}: {error}", flush=True)
            errors.append({"url": feed["url"], "name": feed["name"], "lang": feed["lang"], "error": error, "stale": stale})
        feed_data.append({"feed": feed, "items": items, "stale": stale, "error": error})

    x_data = {}
    if X_PATH.exists():
        try:
            x_data = json.loads(X_PATH.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            errors.append({"url": str(X_PATH), "error": f"X file unreadable: {exc}"})
            print(f"WARN could not read {X_PATH}: {exc}", flush=True)
    else:
        print("WARN no titulos-x.json; country X blocks will be empty until the routine refreshes them.", flush=True)

    # Persist a richer cache of feed items (with blurbs stripped) so a later
    # failure can reuse headlines, never inventing new ones.
    cache = {
        "generated_at": generated_at,
        "feeds": [
            {
                "url": d["feed"]["url"],
                "id": d["feed"]["id"],
                "lang": d["feed"]["lang"],
                "name": d["feed"]["name"],
                "items": [
                    {k: it[k] for k in ("title", "url", "date", "time", "sort", "name", "source_id", "feed_lang") if k in it}
                    for it in (d["items"] or [])[:20]
                ],
            }
            for d in feed_data
        ],
    }

    build_pages(feed_data, generated_at, x_data, errors)
    (CACHE_PATH).write_text(json.dumps(cache, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    sizes = []
    for name in ["styles.css", "titulos.json", "titulos-x.json", *LANG_FILES.values()]:
        path = OUT_DIR / name
        if path.exists():
            sizes.append((name, path.stat().st_size))
    print("generated_at", generated_at)
    for name, size in sizes:
        print(f"SIZE {size:7} {name}")
    if errors:
        print(f"{len(errors)} feed warning(s)")
        sys.exit(0)
    return 0



def load_previous():
    for path in (CACHE_PATH, JSON_PATH):
        if path.exists():
            try:
                return json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
    return {}


if __name__ == "__main__":
    raise SystemExit(main())
