import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

await import("./ime.js");
const ime = globalThis.ANIBAL_IME;

test("routeNewsQuery sends country aliases to the matching Canales page", () => {
  const cases = [
    ["China", "china"],
    ["noticias de china", "china"],
    ["CHINE", "china"],
    ["中国", "china"],
    ["India", "india"],
    ["noticias de la india", "india"],
    ["भारत", "india"],
    ["印度", "india"],
    ["Marruecos", "marruecos"],
    ["morocco", "marruecos"],
    ["Maroc", "marruecos"],
    ["المغرب", "marruecos"],
    ["摩洛哥", "marruecos"],
    ["Cuba", "cuba"],
    ["noticias de cuba", "cuba"],
    ["cubano", "cuba"],
    ["古巴", "cuba"],
  ];
  for (const [q, path] of cases) {
    assert.deepEqual(ime.routeNewsQuery(q), { type: "canales", path }, q);
  }
});

test("routeNewsQuery sends language names and exact codes to Canales", () => {
  const cases = [
    ["español", "es"],
    ["spanish", "es"],
    ["castellano", "es"],
    ["es", "es"],
    ["english", "en"],
    ["inglés", "en"],
    ["en", "en"],
    ["français", "fr"],
    ["french", "fr"],
    ["fr", "fr"],
    ["deutsch", "de"],
    ["alemán", "de"],
    ["de", "de"],
    ["português", "pt"],
    ["portuguese", "pt"],
    ["pt", "pt"],
    ["italiano", "it"],
    ["italian", "it"],
    ["it", "it"],
    ["árabe", "ar"],
    ["arabic", "ar"],
    ["العربية", "ar"],
    ["ar", "ar"],
    ["chino", "zh"],
    ["chinese", "zh"],
    ["中文", "zh"],
    ["zh", "zh"],
    ["noticias en español", "es"],
    ["news in english", "en"],
  ];
  for (const [q, path] of cases) {
    assert.deepEqual(ime.routeNewsQuery(q), { type: "canales", path }, q);
  }
});

test("routeNewsQuery does not confuse similar words or short prepositions", () => {
  assert.equal(ime.routeNewsQuery("indiana").type, "ddg-news");
  assert.equal(ime.routeNewsQuery("indianapolis").type, "ddg-news");
  assert.equal(ime.routeNewsQuery(" cubana de aviación ").path, "cuba");
  assert.equal(ime.routeNewsQuery("noticias en europa").type, "ddg-news");
  assert.equal(ime.routeNewsQuery("what is it").type, "ddg-news");
  assert.equal(ime.routeNewsQuery("de alemania").type, "ddg-news");
  assert.equal(ime.routeNewsQuery("francia elecciones").type, "ddg-news");
  assert.equal(ime.routeNewsQuery(""), null);
  assert.equal(ime.routeNewsQuery("   "), null);
});

test("newsDestination builds Canales or DuckDuckGo News URLs", () => {
  assert.equal(ime.newsDestination("Cuba"), "../canales/cuba/");
  assert.equal(ime.newsDestination("China", "../canales"), "../canales/china/");
  assert.equal(
    ime.newsDestination("elecciones en Brasil"),
    "https://duckduckgo.com/?q=elecciones%20en%20Brasil&iar=news&ia=news"
  );
  assert.equal(ime.newsDestination("  "), null);
});

test("isComposingEvent ignores Enter while the IME is composing", () => {
  assert.equal(ime.isComposingEvent({ isComposing: true, key: "Enter", keyCode: 13 }), true);
  assert.equal(ime.isComposingEvent({ isComposing: false, keyCode: 229 }), true);
  assert.equal(ime.isComposingEvent({ isComposing: false, key: "Enter", keyCode: 13 }), false);
  assert.equal(ime.isComposingEvent(null), false);
});

test("commitInputValue blurs before reading the field", () => {
  let blurred = false;
  const el = { value: "  hola  ", blur() { blurred = true; } };
  assert.equal(ime.commitInputValue(el), "hola");
  assert.equal(blurred, true);
  assert.equal(ime.commitInputValue(null), "");
});

test("MainActivity handles GO, SEARCH, DONE and null-action Enter", () => {
  const src = fs.readFileSync(new URL("../anibal-android/src/com/osnews/anibal/MainActivity.java", import.meta.url), "utf8");
  for (const token of [
    "IME_ACTION_GO",
    "IME_ACTION_SEARCH",
    "IME_ACTION_DONE",
    "IME_ACTION_UNSPECIFIED",
    "KEYCODE_ENTER",
    "hideSoftInputFromWindow",
    "clearFocus",
  ]) {
    assert.match(src, new RegExp(token), token);
  }
  const xml = fs.readFileSync(new URL("../anibal-android/res/layout/activity_main.xml", import.meta.url), "utf8");
  assert.match(xml, /actionGo/);
  const manifest = fs.readFileSync(new URL("../anibal-android/AndroidManifest.xml", import.meta.url), "utf8");
  assert.match(manifest, /android:versionName="1\.3"/);
  assert.match(manifest, /android:versionCode="4"/);
});

test("the start page has the MAY news block, IME attributes and the v1.3 APK link", () => {
  const page = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
  assert.match(page, /id="may-form"/);
  assert.match(page, /id="may-ask"/);
  assert.match(page, /¿Qué noticias quieres saber\?/);
  assert.match(page, /may-avatar\.jpg/);
  assert.match(page, /enterkeyhint="search"/);
  assert.match(page, /enterkeyhint="go"/);
  assert.match(page, /anibal-v1\.3\/Anibal-OSNews-v1\.3\.apk/);
  assert.match(page, /canales\/china\//);
  assert.match(page, /tv-world\/ligera\//);
  const app = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");
  for (const phrase of [
    "¿Qué noticias quieres saber?",
    "What news would you like to know?",
    "Quelles actualités veux-tu connaître",
    "Welche Nachrichten möchtest du erfahren?",
    "Que notícias queres saber?",
    "Quali notizie vuoi sapere?",
    "ما الأخبار التي تريد معرفتها؟",
    "你想了解什么新闻？",
  ]) {
    assert.equal(app.includes(phrase), true, phrase);
  }
});


test("wireImeForm ignores composing Enter and blurs the field before submit", () => {
  const listeners = new Map();
  function target() {
    const el = {
      value: "",
      blurred: false,
      addEventListener(type, fn) {
        const list = listeners.get(el) || {};
        (list[type] ||= []).push(fn);
        listeners.set(el, list);
      },
      dispatch(type, event) {
        event = Object.assign({ type, preventDefault() { this.prevented = true; }, prevented: false }, event);
        for (const fn of (listeners.get(el)?.[type] || [])) fn(event);
        return event;
      },
      blur() { el.blurred = true; },
      querySelector() { return submit; },
    };
    return el;
  }
  const form = target();
  const input = target();
  const submit = target();
  let seen = [];
  ime.wireImeForm(form, input, (event, value) => { seen.push({ prevented: event.prevented, value, blurred: input.blurred }); });

  input.value = "ho";
  const blocked = input.dispatch("keydown", { isComposing: true, key: "Enter", keyCode: 229 });
  assert.equal(blocked.prevented, true);
  assert.equal(seen.length, 0);

  input.value = "hola MAY";
  submit.dispatch("pointerdown", {});
  assert.equal(input.blurred, true);
  const ev = form.dispatch("submit", { isComposing: false, keyCode: 13 });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].value, "hola MAY");
  assert.equal(seen[0].blurred, true);

  const ignored = form.dispatch("submit", { isComposing: true, keyCode: 229 });
  assert.equal(ignored.prevented, true);
  assert.equal(seen.length, 1);
});

