"""Prueba headless de «Pregunta sobre los libros» en Azum (sirve el repo en /osnews/)."""
import sys, json
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8765/osnews/azum/"
OUT = sys.argv[2] if len(sys.argv) > 2 else "/tmp"
QS = [
    "¿De qué trata La hija de dos mundos?",
    "¿Quién es MAY?",
    "¿Quién es Aya?",
    "¿Qué dice el libro sobre la desaladora?",
    "What is Free as the Wind about?",
    "¿Quién ganó el Mundial de fútbol de 2010?",
    "¿Qué dice el libro de Ave César sobre Numancia?",
]
res = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 412, "height": 915}, device_scale_factor=2)
    errors, external = [], set()
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("request", lambda r: external.add(r.url.split("/")[2]) if not r.url.startswith(("http://127.0.0.1", "data:")) else None)
    pg.goto(BASE, wait_until="load")
    pg.wait_for_selector("#azum-libros-form", timeout=15000)
    for i, q in enumerate(QS):
        before = pg.locator(".azum-libros-turn").count()
        pg.fill("#azum-libros-input", q)
        pg.click("#azum-libros-send")
        pg.wait_for_function(f"document.querySelectorAll('.azum-libros-turn').length > {before}", timeout=15000)
        turn = pg.locator(".azum-libros-turn").last
        res.append({"q": q, "kind": turn.get_attribute("data-kind"),
                    "a": turn.locator(".azum-libros-a").inner_text(),
                    "links": [a.get_attribute("href") for a in turn.locator("a").all()]})
        turn.scroll_into_view_if_needed()
        turn.screenshot(path=f"{OUT}/azum-libros-{i+1}.png")
    # Ejemplo con botón y ruta desde la charla guiada principal
    pg.click(".azum-libros-chip >> nth=2")
    pg.wait_for_timeout(500)
    before = pg.locator(".azum-libros-turn").count()
    pg.fill("#azum-guided-input", "¿De qué trata Nada se pierde?")
    pg.click("#azum-guided-send")
    pg.wait_for_function(f"document.querySelectorAll('.azum-libros-turn').length > {before}", timeout=15000)
    res.append({"q": "[charla principal] ¿De qué trata Nada se pierde?", "kind": pg.locator(".azum-libros-turn").last.get_attribute("data-kind")})
    pg.locator("#azum-libros").scroll_into_view_if_needed()
    pg.locator("#azum-libros").screenshot(path=f"{OUT}/azum-libros-seccion.png")
    pg.screenshot(path=f"{OUT}/azum-libros-pagina.png", full_page=False)
    print(json.dumps({"results": res, "errors": errors, "externalHosts": sorted(external)}, ensure_ascii=False, indent=1))
    b.close()
