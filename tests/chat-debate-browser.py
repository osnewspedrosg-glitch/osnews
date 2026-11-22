#!/usr/bin/env python3
"""Local headless check: the debate chat page loads, with video, vote, norm and counters."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import threading
import sys

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PATH = "/chat-debate/"
SHOT = Path("/workspace/chat-debate-preview.png")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        pass


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    errors = []
    url = f"http://127.0.0.1:{port}{PATH}"
    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="chrome",
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        try:
            page = browser.new_page(viewport={"width": 390, "height": 844})
            count_hits = []
            def _track(req, _c=count_hits):
                u = req.url
                if "osnews-may.goatcounter.com/count" in u and "/counter/" not in u:
                    _c.append(u)
            page.on("request", _track)
            res = page.goto(url, wait_until="networkidle", timeout=45000)
            if not res or not res.ok:
                errors.append(f"{PATH}: HTTP {res.status if res else 'no response'}")
            else:
                page.wait_for_selector("h1", timeout=15000)
                title = page.title()
                text = page.locator("body").inner_text()
                checks = {
                    "title": "Chat del debate" in title or "Abuso sexual infantil" in title,
                    "h1": "derechos del condenado" in text.lower() or "abuso sexual infantil" in text.lower(),
                    "norma": "todo vale sin violencia ni ataques personales" in text.lower(),
                    "ayuda 016": "016" in text,
                    "ayuda 112": "112" in text,
                    "ayuda ANAR": "116 111" in text,
                    "voto A": "Primero, los derechos del condenado" in text,
                    "voto B": "Primero, la salud de la víctima" in text,
                    "voto C": "Las dos cosas a la vez" in text,
                    "crédito": "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok." in text,
                    "youtube enlace": "youtu.be/WIaD2qZXLiQ" in text or "WIaD2qZXLiQ" in page.content(),
                    "iframe youtube": page.locator("iframe[src*='WIaD2qZXLiQ']").count() == 1,
                    "goatcounter": page.locator('script[data-goatcounter="https://osnews-may.goatcounter.com/count"]').count() == 1,
                    "contador uso": page.locator('script[src*="contador-osnews.js"]').count() == 1,
                    "sin claves": "sk-" not in page.content() and "api_key" not in page.content().lower(),
                }
                for name, ok in checks.items():
                    if not ok:
                        errors.append(f"{PATH}: failed check: {name}")
                # Counters must not invent a number on localhost
                cont = page.locator("#contadores").inner_text()
                if "No disponible" not in cont:
                    errors.append(f"{PATH}: counters should say No disponible locally, got {cont!r}")
                page.wait_for_timeout(1200)
                if count_hits:
                    errors.append(f"{PATH}: unexpected count request from localhost: {count_hits}")
                SHOT.parent.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(SHOT), full_page=True)
                print(f"OK {PATH} title={title!r} shot={SHOT} counts={len(count_hits)}")
                for name, ok in checks.items():
                    print(f"  {'OK' if ok else 'FAIL'} {name}")
            page.close()
        finally:
            browser.close()
            server.shutdown()
    if errors:
        print("ERRORS:")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    print("chat-debate local browser test passed")


if __name__ == "__main__":
    main()
