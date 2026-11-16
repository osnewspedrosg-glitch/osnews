#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Añade un capítulo a un libro de OSNews Book, o importa una carpeta entera.

Ejemplos:

  python3 scripts/add-chapter.py \\
      --book la-hija-de-dos-mundos \\
      --file /ruta/12-capitulo-12.txt

  python3 scripts/add-chapter.py \\
      --book la-hija-de-dos-mundos \\
      --import-dir /workspace/libros/la-hija-de-dos-mundos/capitulos

Sin --title, usa el primer encabezado «# …» o la primera línea.
Sin --id, lo saca del nombre del archivo (sin extensión).
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"


def md_inline(text: str) -> str:
    text = html.escape(text)
    text = re.sub(
        r"\((https?://[^)\s]+)\)",
        r'(<a href="\1" rel="noopener noreferrer" target="_blank">\1</a>)',
        text,
    )
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    return text


def parse_chapter(raw: str) -> tuple[str, list[dict]]:
    text = raw.replace("\r\n", "\n").replace("\r", "\n").strip()
    if text.startswith("\ufeff"):
        text = text.lstrip("\ufeff")

    title = ""
    body = text
    first = text.split("\n", 1)
    head = first[0].strip()
    rest = first[1] if len(first) > 1 else ""
    if head.startswith("# "):
        title = head[2:].strip()
        body = rest.lstrip("\n")
    elif head:
        # Posts de X: «La hija de dos mundos · Título del capítulo»
        if " · " in head and len(head) < 180:
            title = head.split(" · ", 1)[1].strip()
            body = rest.lstrip("\n")
        else:
            title = head
            # If the first line is a long paragraph, keep it in the body too
            if len(head) > 120:
                title = ""
                body = text

    credit_re = re.compile(
        r"^(?:Autores:\s*Pedro Sánchez Gómez \(Mar Menor\) y su bot de Grok"
        r"|Authors:\s*Pedro Sánchez Gómez \(Mar Menor\) and his Grok bot)\.?$",
        re.IGNORECASE,
    )
    blocks: list[dict] = []
    for para in re.split(r"\n\s*\n", body.strip()):
        para = para.strip()
        if not para:
            continue
        if para.startswith("## "):
            title_h2 = para[3:].strip()
            blocks.append({"type": "h2", "text": title_h2, "html": md_inline(title_h2)})
            continue
        merged = " ".join(line.strip() for line in para.split("\n") if line.strip())
        blocks.append({"type": "p", "text": merged, "html": md_inline(merged)})
    if blocks and credit_re.match(blocks[-1]["text"].strip()):
        blocks.pop()
    return title, blocks


def slug_from_path(path: Path) -> str:
    return re.sub(r"[^a-z0-9\-]+", "-", path.stem.lower()).strip("-") or "capitulo"


def load_json(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def kind_for(chapter_id: str, title: str) -> str:
    blob = f"{chapter_id} {title}".lower()
    if "prologo" in blob or "prólogo" in blob or "prologue" in blob:
        return "prologo"
    if any(k in blob for k in ("epílogo ii", "epilogo ii", "epilogo-2", "epilogo 2",
                                "epilogue ii", "epilogue-2", "epilogue 2")):
        return "epilogo-2"
    if "epilogo" in blob or "epílogo" in blob or "epilogue" in blob:
        return "epilogo"
    return "capitulo"


def add_one(book_id: str, source: Path, chapter_id: str | None, title_opt: str | None) -> dict:
    raw = source.read_text(encoding="utf-8")
    parsed_title, blocks = parse_chapter(raw)
    title = (title_opt or parsed_title or source.stem).strip()
    cid = (chapter_id or slug_from_path(source)).strip()
    if not blocks:
        raise SystemExit(f"El archivo no tiene texto usable: {source}")

    book_dir = DATA / book_id
    index_path = book_dir / "chapters.json"
    index = load_json(index_path, {"bookId": book_id, "chapters": []})
    chapters = index.setdefault("chapters", [])

    rel = f"chapters/{cid}.json"
    entry = {
        "id": cid,
        "title": title,
        "file": rel,
        "kind": kind_for(cid, title),
    }

    existing = next((i for i, c in enumerate(chapters) if c.get("id") == cid), None)
    if existing is None:
        chapters.append(entry)
        action = "añadido"
    else:
        chapters[existing] = entry
        action = "actualizado"

    def sort_key(item: dict):
        m = re.match(r"^(\d+)", item.get("id", ""))
        return (int(m.group(1)) if m else 10_000, item.get("id", ""))

    chapters.sort(key=sort_key)

    chapter_payload = {
        "id": cid,
        "title": title,
        "kind": entry["kind"],
        "blocks": blocks,
    }
    save_json(book_dir / rel, chapter_payload)
    save_json(index_path, index)
    print(f"{action}: {book_id}/{cid} — {title} ({len(blocks)} bloques)")
    return entry


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Añade un capítulo a OSNews Book")
    p.add_argument("--book", required=True, help="Identificador del libro, p. ej. la-hija-de-dos-mundos")
    p.add_argument("--file", type=Path, help="Archivo .txt o .md del capítulo")
    p.add_argument("--import-dir", type=Path, help="Carpeta con varios capítulos (.md o .txt)")
    p.add_argument("--id", dest="chapter_id", help="Id del capítulo (si se omite, se usa el nombre del archivo)")
    p.add_argument("--title", help="Título visible (si se omite, se lee del archivo)")
    args = p.parse_args(argv)

    if not args.file and not args.import_dir:
        p.error("Indica --file o --import-dir")

    if args.import_dir:
        folder = args.import_dir.expanduser().resolve()
        if not folder.is_dir():
            raise SystemExit(f"No existe la carpeta: {folder}")
        files = sorted(
            [f for f in folder.iterdir() if f.is_file() and f.suffix.lower() in {".md", ".txt"}]
        )
        if not files:
            raise SystemExit(f"No hay archivos .md o .txt en {folder}")
        for f in files:
            add_one(args.book, f, None, None)
        return 0

    source = args.file.expanduser().resolve()
    if not source.is_file():
        raise SystemExit(f"No existe el archivo: {source}")
    add_one(args.book, source, args.chapter_id, args.title)
    return 0


if __name__ == "__main__":
    sys.exit(main())
