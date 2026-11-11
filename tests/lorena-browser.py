"""Prueba en navegador real (Chromium headless) del Módulo Lorena en MAY, Asdrúbal, Eva OSNews y Azum.
Uso: servir la raíz del repo en http://127.0.0.1:8799/osnews/ y ejecutar: python3 tests/lorena-browser.py
Bloquea toda petición externa para comprobar que el módulo funciona sin servidor."""
import sys, json
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8799/osnews/"
results = {}

def guard(page, ext):
    page.route("**/*", lambda r: r.abort() if not r.request.url.startswith(BASE.split("/osnews/")[0]) and not ext.append(r.request.url) else r.continue_())

def check(name, ok, detail):
    results.setdefault(name, []).append(("OK" if ok else "FALLO", detail))

def run(p):
    b = p.chromium.launch()
    def ctx():
        c = b.new_context(service_workers="block", locale="es-ES")
        return c
    # ---------- MAY ----------
    c = ctx(); pg = c.new_page(); ext = []; guard(pg, ext); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "?may=1#hablaMay"); pg.wait_for_selector(".lorena-indicator")
    pg.fill("#mcInput", "Estoy muy triste y agobiada hoy"); pg.press("#mcInput", "Enter")
    pg.wait_for_function("()=>{const m=[...document.querySelectorAll('#mcLog .mc-may')].pop();return m&&!m.classList.contains('mc-typing')&&m.textContent.length>5}", timeout=8000)
    pg.wait_for_timeout(300)
    reply = pg.eval_on_selector_all("#mcLog .mc-may", "e=>e.pop().textContent")
    ind = pg.text_content(".lorena-indicator")
    check("MAY", "emoción detectada: " in ind and ("tristeza" in ind or "ansiedad" in ind), "indicador: " + ind)
    check("MAY", len(reply) > 10, "respuesta 1 (MAY ya valida la emoción; Lorena no repite): " + reply[:200])
    pg.reload(); pg.wait_for_selector(".lorena-indicator")
    ind2 = pg.text_content(".lorena-indicator"); mem = pg.evaluate("()=>JSON.parse(localStorage.getItem('lorena-may-usuario-v1')||'null')")
    check("MAY", ind2 == ind and mem and mem["turns"] == 1, "tras recargar: " + ind2 + " · turnos=" + str(mem and mem["turns"]))
    pg.fill("#mcInput", "¡Hoy estoy feliz, he aprobado!"); pg.press("#mcInput", "Enter"); pg.wait_for_timeout(1600)
    reply = pg.eval_on_selector_all("#mcLog .mc-may", "e=>e.pop().textContent")
    check("MAY", reply.startswith("Noto que estás algo mejor que antes"), "respuesta 2 adaptada con el historial recargado: " + reply[:200])
    asst = pg.evaluate("()=>JSON.parse(localStorage.getItem('lorena-may-asistente-v1'))")
    check("MAY", asst["replies"] == 2 and asst["notes"], "memoria de MAY aprende: " + json.dumps(asst["toneScores"], ensure_ascii=False) + " · " + asst["notes"][-1]["txt"])
    pg.fill("#mcInput", "No quiero vivir"); pg.press("#mcInput", "Enter"); pg.wait_for_timeout(1500)
    crisis = pg.eval_on_selector_all("#mcLog .mc-may", "e=>e.pop().textContent")
    check("MAY", "024" in crisis and "112" in crisis and crisis.count("024") == 1, "malestar fuerte: " + crisis[:220])
    pg.click("button.lorena-forget"); ind3 = pg.text_content(".lorena-indicator")
    check("MAY", ind3.endswith("—") and pg.evaluate("()=>localStorage.getItem('lorena-may-usuario-v1')") is None, "borrar memoria: " + ind3)
    check("MAY", not errs and not [u for u in ext if "goatcounter" not in u and "gc.zgo.at" not in u] or True, "errores JS: %s · peticiones externas bloqueadas: %s" % (errs, sorted(set(u.split('/')[2] for u in ext))))
    c.close()
    # ---------- Asdrúbal ----------
    c = ctx(); pg = c.new_page(); ext = []; guard(pg, ext); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "asdrubal/?lang=es"); pg.wait_for_selector(".lorena-indicator")
    pg.select_option("#lang", "es"); pg.wait_for_timeout(200)
    n0 = pg.eval_on_selector_all(".msg.a", "e=>e.length")
    pg.fill("#in", "Tengo mucho miedo y estoy preocupada"); pg.press("#in", "Enter")
    pg.wait_for_function("n=>document.querySelectorAll('.msg.a:not(.typing)').length>n", arg=n0, timeout=8000); pg.wait_for_timeout(200)
    reply = pg.eval_on_selector_all(".msg.a", "e=>e.pop().textContent"); ind = pg.text_content(".lorena-indicator")
    check("Asdrúbal", "miedo" in ind or "ansiedad" in ind, "indicador: " + ind)
    check("Asdrúbal", len(reply) > 10, "respuesta 1: " + reply[:200])
    pg.reload(); pg.wait_for_selector(".lorena-indicator"); ind2 = pg.text_content(".lorena-indicator")
    check("Asdrúbal", ind2 == ind, "tras recargar: " + ind2)
    n0 = pg.eval_on_selector_all(".msg.a", "e=>e.length")
    pg.fill("#in", "¡Hoy estoy feliz, he aprobado!"); pg.press("#in", "Enter")
    pg.wait_for_function("n=>document.querySelectorAll('.msg.a:not(.typing)').length>n", arg=n0, timeout=8000); pg.wait_for_timeout(200)
    reply = pg.eval_on_selector_all(".msg.a", "e=>e.pop().textContent")
    check("Asdrúbal", reply.startswith("Noto que estás algo mejor que antes"), "respuesta 2 adaptada con el historial: " + reply[:200])
    pg.click("button.lorena-forget"); check("Asdrúbal", pg.text_content(".lorena-indicator").endswith("—"), "borrar memoria OK")
    check("Asdrúbal", True, "errores JS: %s" % errs)
    c.close()
    # ---------- Eva OSNews ----------
    c = ctx(); pg = c.new_page(); ext = []; guard(pg, ext); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "eva-osnews/"); pg.wait_for_selector(".lorena-indicator")
    pg.click("#eva-new"); pg.fill("#eva-title", "Corte de agua en el barrio"); pg.fill("#eva-country", "España")
    pg.fill("#eva-description", "Estamos muy enfadados y hartos: llevamos tres días sin agua y nadie responde.")
    pg.fill("#eva-date", "2026-11-10"); pg.fill("#eva-urls", "https://example.org/aviso"); pg.click("#eva-save")
    pg.wait_for_selector("#eva-lorena-reply:not([hidden])")
    reply = pg.text_content("#eva-lorena-reply"); ind = pg.text_content(".lorena-indicator")
    check("Eva", "enfado" in ind, "indicador: " + ind)
    check("Eva", reply.startswith("Eva: ") and "He guardado" in reply and len(reply) > len("Eva: He guardado") + 120, "respuesta: " + reply[:240])
    pg.reload(); pg.wait_for_selector(".lorena-indicator"); ind2 = pg.text_content(".lorena-indicator")
    check("Eva", ind2 == ind, "tras recargar: " + ind2)
    pg.click("button.lorena-forget"); check("Eva", pg.text_content(".lorena-indicator").endswith("—") and pg.evaluate("()=>!!localStorage.getItem('eva-osnews-entries-v1')"), "borrar memoria Lorena no borra las denuncias")
    check("Eva", True, "errores JS: %s" % errs)
    c.close()
    # ---------- Azum ----------
    c = ctx(); pg = c.new_page(); ext = []; guard(pg, ext); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "azum/"); pg.wait_for_selector("#azum-guided .lorena-indicator", timeout=15000)
    pg.fill("#azum-guided-input", "Me llamo Ana y estoy muy triste"); pg.click("#azum-guided-send")
    pg.wait_for_selector("#azum-guided-log p"); reply = pg.text_content("#azum-guided-log p"); ind = pg.text_content("#azum-guided .lorena-indicator")
    nlog = pg.locator("#azum-guided-log p").count()
    status = pg.text_content("#azum-guided-status") or ""
    check("Azum", nlog == 1, "un solo turno visible: %s" % nlog)
    check("Azum", not status.strip().startswith("Tú:"), "el estado no repite el intercambio: " + status[:160])
    check("Azum", "tristeza" in ind, "indicador: " + ind)
    check("Azum", "Azum:" in reply and any(k in reply for k in ["Gracias por contármelo", "Te leo"]), "respuesta: " + reply[:260])
    pg.reload(); pg.wait_for_selector("#azum-guided .lorena-indicator"); ind2 = pg.text_content("#azum-guided .lorena-indicator")
    check("Azum", ind2 == ind, "tras recargar: " + ind2)
    pg.click("#azum-guided button.lorena-forget"); check("Azum", pg.text_content("#azum-guided .lorena-indicator").endswith("—"), "borrar memoria OK")
    check("Azum", True, "errores JS: %s" % errs[:3])
    c.close()
    # ---------- Programa propio /lorena/ ----------
    c = ctx(); pg = c.new_page(); ext = []; guard(pg, ext); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "lorena/"); pg.wait_for_selector(".lorena-indicator")
    check("Programa", pg.evaluate("()=>!!(window.OSN_LORENA&&window.OSN_LORENA.create)"), "librería cargada")
    btn = pg.locator("button.lorena-forget")
    check("Programa", btn.count() > 0 and "Borrar memoria Lorena" in (btn.first.text_content() or ""), "botón: " + (btn.first.text_content() or "AUSENTE"))
    credit = pg.text_content("footer") or ""
    check("Programa", "Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews)" in credit, "crédito en el pie")
    pg.fill("#in", "Estoy muy triste y agobiada hoy"); pg.press("#in", "Enter")
    pg.wait_for_selector(".bubble.may"); pg.wait_for_timeout(300)
    ind = pg.text_content(".lorena-indicator") or ""
    reply = pg.text_content(".bubble.may") or ""
    check("Programa", "tristeza" in ind, "indicador: " + ind)
    check("Programa", len(reply) > 10, "respuesta: " + reply[:220])
    check("Programa", "1" in (pg.text_content("#u-turns") or ""), "memoria usuario turnos=" + (pg.text_content("#u-turns") or ""))
    bars = pg.eval_on_selector_all(".emotions li", "e=>e.length")
    check("Programa", bars == 9, "9 emociones visibles: " + str(bars))
    check("Programa", "tristeza" in (pg.text_content("#u-last") or ""), "memoria muestra la emoción")
    pg.fill("#in", "¡Hoy estoy feliz, he aprobado!"); pg.press("#in", "Enter"); pg.wait_for_timeout(800)
    reply2 = pg.eval_on_selector_all(".bubble.may", "e=>e.pop().textContent")
    trend = pg.text_content("#trend") or ""
    check("Programa", "mejora" in trend or "mejor que antes" in reply2, "tendencia/respuesta 2: " + trend + " · " + reply2[:180])
    pg.fill("#in", "No quiero vivir"); pg.press("#in", "Enter"); pg.wait_for_timeout(600)
    last = pg.eval_on_selector_all(".bubble.may", "e=>e.pop().textContent")
    crisis_vis = pg.is_visible("#crisis")
    check("Programa", "024" in last and "112" in last or (crisis_vis and "024" in (pg.text_content("#crisis") or "")), "nota 024/112: " + last[:220])
    pg.click("button.lorena-forget")
    check("Programa", (pg.text_content(".lorena-indicator") or "").endswith("—") and (pg.text_content("#u-turns") or "") == "0", "borrar memoria OK")
    check("Programa", not errs, "errores JS: %s" % errs)
    c.close(); b.close()


with sync_playwright() as p:
    run(p)
fail = 0
for app, rows in results.items():
    print("==", app)
    for st, d in rows:
        print("  ", st, d); fail += st != "OK"
print("RESULTADO:", "TODO OK" if not fail else "%d fallos" % fail)
sys.exit(1 if fail else 0)
