#!/usr/bin/env python3
"""Local browser check: GoatCounter script loads, pages still work, no counts sent."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import threading
import sys

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

PAGES = [
    ("/anibal/", ["Aníbal", "OSNews"]),
    ("/museos/", ["Museos", "OSNews"]),
    ("/lorena/", ["Lorena", "OSNews"]),
    ("/canales/", ["Canales", "OSNews"]),
    ("/canales/es/", ["OSNews"]),
    ("/tv-world/ligera/", ["TV World", "OSNews"]),
    ("/chat-debate/", ["Chat del debate", "OSNews"]),
]


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
    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="chrome",
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        try:
            for path, bits in PAGES:
                count_hits = []
                script_hits = []
                page = browser.new_page()
                def _track(req, _c=count_hits, _s=script_hits):
                    u = req.url
                    if "gc.zgo.at/count.js" in u:
                        _s.append(u)
                    elif "osnews-may.goatcounter.com/count" in u and "/counter/" not in u:
                        _c.append(u)
                page.on("request", _track)
                res = page.goto(f"http://127.0.0.1:{port}{path}", wait_until="networkidle", timeout=45000)
                if not res or not res.ok:
                    errors.append(f"{path}: HTTP {res.status if res else 'no response'}")
                    page.close()
                    continue
                page.wait_for_selector("h1, footer", timeout=15000)
                text = page.locator("body").inner_text()
                if len(text) < 40:
                    errors.append(f"{path}: body too short")
                title = page.title()
                if not any(b.lower() in (title + " " + text).lower() for b in bits):
                    errors.append(f"{path}: missing {bits} in title/body ({title!r})")
                if page.locator('script[data-goatcounter="https://osnews-may.goatcounter.com/count"]').count() < 1:
                    errors.append(f"{path}: missing GoatCounter tag")
                if page.locator('script[src*="contador-osnews.js"]').count() < 1:
                    errors.append(f"{path}: missing helper script")
                page.wait_for_timeout(1500)
                if not script_hits:
                    errors.append(f"{path}: count.js did not load")
                page.mouse.click(24, 24)
                page.wait_for_timeout(800)
                if count_hits:
                    errors.append(f"{path}: unexpected count request from localhost: {count_hits}")
                print(f"OK {path} title={title!r} count.js={len(script_hits)} counts={len(count_hits)}")
                page.close()
        finally:
            browser.close()
            server.shutdown()
    if errors:
        print("FAILURES:", file=sys.stderr)
        for e in errors:
            print(" -", e, file=sys.stderr)
        return 1
    print("browser checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
