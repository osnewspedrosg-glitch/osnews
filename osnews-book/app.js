/* OSNews Book — lector estático. Sin claves y sin datos personales. El único recurso de terceros es el contador anónimo de GoatCounter. */
(function () {
  "use strict";

  var SITE = "https://osnewspedrosg-glitch.github.io/osnews/osnews-book/";
  var CREDIT = "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok";
  var CREDIT_EN = "Authors: Pedro Sánchez Gómez (Mar Menor) and his Grok bot";
  var UI = {
    es: {
      library: "Biblioteca",
      lead: "Lee los libros de OSNews capítulo a capítulo. Se van publicando uno a uno, aquí y en X.",
      empty: "Aún no hay libros en la biblioteca.",
      contents: "Índice",
      backToContents: "Volver al índice",
      notYet: "Este libro se está publicando capítulo a capítulo. Vuelve pronto.",
      noText: "Este capítulo todavía no tiene texto.",
      of: " de ",
      share: "Compartir en X",
      pdf: "Descargar PDF",
      coverOf: "Portada de ",
      book: "Libro",
      prologue: "Prólogo", epilogue: "Epílogo", epilogue2: "Epílogo II", ch: "Cap. ", read: "Leer",
      credit: CREDIT
    },
    en: {
      library: "Library",
      lead: "Read the OSNews books in English, chapter by chapter, or download each book as a PDF.",
      empty: "There are no books in the library yet.",
      contents: "Contents",
      backToContents: "Back to contents",
      notYet: "This book is being published chapter by chapter. Check back soon.",
      noText: "This chapter has no text yet.",
      of: " of ",
      share: "Share on X",
      pdf: "Download PDF",
      coverOf: "Cover of ",
      book: "Book",
      prologue: "Prologue", epilogue: "Epilogue", epilogue2: "Epilogue II", ch: "Ch. ", read: "Read",
      credit: CREDIT_EN
    }
  };
  function langOf(book) { return book && book.lang === "en" ? "en" : "es"; }
  function t(lang) { return UI[lang] || UI.es; }
  function libraryHref(lang) { return lang === "en" ? "#/en" : "#/"; }
  function bookHref(book, chapterId) {
    return hrefFor(langOf(book) === "en" ? "book" : "libro", book.id, chapterId);
  }
  var THEME_KEY = "osnews-book-theme";
  var app = document.getElementById("app");
  var themeBtn = document.getElementById("theme-btn");
  var cache = { books: null, indexes: {}, chapters: {} };

  function $(sel, root) { return (root || document).querySelector(sel); }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parseHash() {
    var raw = (location.hash || "#/").replace(/^#/, "");
    var parts = raw.split("/").filter(Boolean);
    var isBook = parts[0] === "libro" || parts[0] === "book";
    if (isBook && parts[1] && parts[2]) {
      return { view: "chapter", book: parts[1], chapter: parts[2] };
    }
    if (isBook && parts[1]) {
      return { view: "index", book: parts[1] };
    }
    return { view: "library", lang: parts[0] === "en" ? "en" : "es" };
  }

  function hrefFor() {
    var args = Array.prototype.slice.call(arguments);
    return "#/" + args.filter(Boolean).join("/");
  }

  async function getJson(path) {
    var res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar " + path);
    return res.json();
  }

  async function loadBooks() {
    if (!cache.books) cache.books = await getJson("data/books.json");
    return cache.books;
  }

  async function loadIndex(book) {
    if (!cache.indexes[book.id]) {
      cache.indexes[book.id] = await getJson(book.chaptersIndex);
    }
    return cache.indexes[book.id];
  }

  async function loadChapter(book, entry) {
    var key = book.id + "/" + entry.id;
    if (!cache.chapters[key]) {
      var base = book.chaptersIndex.replace(/chapters\.json$/, "");
      cache.chapters[key] = await getJson(base + entry.file);
    }
    return cache.chapters[key];
  }

  function findBook(catalog, id) {
    return (catalog.books || []).find(function (b) { return b.id === id; });
  }

  function chapterLabel(entry, lang) {
    var L = t(lang);
    if (entry.kind === "prologo") return L.prologue;
    if (entry.kind === "epilogo-2") return L.epilogue2;
    if (entry.kind === "epilogo") return L.epilogue;
    var m = /(?:cap[íi]tulo|chapter)\s+(\d+)/i.exec(entry.title || "");
    if (m) return L.ch + m[1];
    var n = /^(\d+)/.exec(entry.id || "");
    return n ? n[1] : L.read;
  }

  function shareUrl(path, title, lang) {
    var url = SITE + (path || "");
    var credit = t(lang).credit;
    var text = title
      ? title + " — OSNews Book\n" + credit + "\n" + url
      : "OSNews Book\n" + credit + "\n" + url;
    return "https://x.com/intent/post?text=" + encodeURIComponent(text);
  }

  function shareBtn(path, title, lang) {
    return '<a class="share" href="' + shareUrl(path, title, lang) + '" rel="noopener noreferrer" target="_blank">' + t(lang).share + "</a>";
  }

  function pdfBtn(book) {
    if (!book.pdf) return "";
    return '<a class="btn" href="' + escapeHtml(book.pdf) + '" target="_blank" rel="noopener" type="application/pdf">' + t(langOf(book)).pdf + "</a>";
  }

  function langSwitch(lang) {
    return (
      '<div class="toolbar lang-switch" role="group" aria-label="Idioma / Language">' +
        '<a class="btn' + (lang === "es" ? " btn-on" : "") + '" href="#/" hreflang="es" lang="es"' + (lang === "es" ? ' aria-current="page"' : "") + ">Español</a>" +
        '<a class="btn' + (lang === "en" ? " btn-on" : "") + '" href="#/en" hreflang="en" lang="en"' + (lang === "en" ? ' aria-current="page"' : "") + ">English</a>" +
      "</div>"
    );
  }

  function setLang(lang) {
    document.documentElement.setAttribute("lang", lang);
  }

  function toolbar(extra) {
    return '<div class="toolbar">' + (extra || "") + "</div>";
  }

  function renderLibrary(catalog, lang) {
    var L = t(lang);
    var cards = (catalog.books || []).filter(function (book) {
      return langOf(book) === lang;
    }).map(function (book) {
      return (
        '<a class="book-card" href="' + bookHref(book) + '">' +
          '<img class="cover" src="' + escapeHtml(book.cover) + '" alt="' + L.coverOf + escapeHtml(book.title) + '">' +
          "<div>" +
            "<h2>" + escapeHtml(book.title) + "</h2>" +
            '<p class="meta">' + escapeHtml(book.subtitle || L.book) +
              (book.year ? " · " + escapeHtml(String(book.year)) : "") + "</p>" +
            '<p class="blurb">' + escapeHtml(book.blurb || "") + "</p>" +
            '<p class="meta">' + escapeHtml(book.authors || L.credit) + "</p>" +
          "</div>" +
        "</a>"
      );
    }).join("");
    setLang(lang);
    app.innerHTML =
      "<section>" +
        langSwitch(lang) +
        "<h1>" + L.library + (lang === "en" ? " · English" : "") + "</h1>" +
        '<p class="lead">' + L.lead + "</p>" +
        toolbar(shareBtn(libraryHref(lang), lang === "en" ? "OSNews Book · English" : "OSNews Book", lang)) +
        (cards ? '<div class="library">' + cards + "</div>" : '<p class="empty">' + L.empty + "</p>") +
      "</section>";
    document.title = lang === "en" ? "OSNews Book · English" : "OSNews Book";
  }

  function renderIndex(book, index) {
    var lang = langOf(book);
    var L = t(lang);
    var chapters = index.chapters || [];
    var items = chapters.map(function (ch, i) {
      return (
        "<li>" +
          '<a href="' + bookHref(book, ch.id) + '">' +
            '<span class="toc-title">' + escapeHtml(ch.title) + "</span>" +
            '<span class="toc-num">' + escapeHtml(chapterLabel(ch, lang)) + "</span>" +
          "</a>" +
        "</li>"
      );
    }).join("");
    app.innerHTML =
      '<section class="panel">' +
        '<p class="chapter-kicker">OSNews Book</p>' +
        "<h1>" + escapeHtml(book.title) + "</h1>" +
        '<p class="lead">' + escapeHtml(book.blurb || "") + "</p>" +
        '<p class="meta">' + escapeHtml(book.authors || L.credit) + "</p>" +
        toolbar(
          '<a class="btn" href="' + libraryHref(lang) + '">' + L.library + "</a>" +
          pdfBtn(book) +
          shareBtn(bookHref(book), book.title, lang)
        ) +
        "<h2>" + L.contents + "</h2>" +
        (items
          ? '<ol class="toc">' + items + "</ol>"
          : '<p class="empty">' + L.notYet + "</p>") +
      "</section>";
    setLang(lang);
    document.title = book.title + " · OSNews Book";
  }

  function renderChapter(book, index, chapter, entry) {
    var lang = langOf(book);
    var L = t(lang);
    var chapters = index.chapters || [];
    var i = chapters.findIndex(function (c) { return c.id === entry.id; });
    var prev = i > 0 ? chapters[i - 1] : null;
    var next = i >= 0 && i < chapters.length - 1 ? chapters[i + 1] : null;
    var blocks = (chapter.blocks || []).map(function (b, n) {
      if (b.type === "h2") return "<h2>" + (b.html || escapeHtml(b.text || "")) + "</h2>";
      var cls = "p";
      var isDialogue = (b.text || "").indexOf("—") === 0;
      var startsWithQuote = /^["\u201C\u2018']/.test(b.text || "");
      var firstProse = n === 0 || (n === 1 && chapter.blocks[0].type === "h2");
      if (firstProse && !isDialogue && !startsWithQuote) cls += " drop";
      if (isDialogue) cls += " dialogue";
      return '<p class="' + cls + '">' + (b.html || escapeHtml(b.text || "")) + "</p>";
    }).join("");

    var pager =
      '<div class="pager">' +
        (prev
          ? '<a href="' + bookHref(book, prev.id) + '">← ' + escapeHtml(prev.title) + "</a>"
          : "<span></span>") +
        (next
          ? '<a href="' + bookHref(book, next.id) + '">' + escapeHtml(next.title) + " →</a>"
          : '<a href="' + bookHref(book) + '">' + L.backToContents + "</a>") +
      "</div>";

    app.innerHTML =
      '<article class="panel reader">' +
        '<p class="chapter-kicker">' + escapeHtml(book.title) +
          " · " + (i + 1) + L.of + chapters.length + "</p>" +
        '<h1 class="chapter-title">' + escapeHtml(chapter.title || entry.title) + "</h1>" +
        toolbar(
          '<a class="btn" href="' + bookHref(book) + '">' + L.contents + "</a>" +
          '<a class="btn" href="' + libraryHref(lang) + '">' + L.library + "</a>" +
          pdfBtn(book) +
          shareBtn(bookHref(book, entry.id), (chapter.title || entry.title) + " · " + book.title, lang)
        ) +
        '<div class="chapter-body">' + (blocks || '<p class="empty">' + L.noText + "</p>") + "</div>" +
        pager +
        '<p class="meta">' + escapeHtml(book.authors || L.credit) + "</p>" +
      "</article>";
    setLang(lang);
    document.title = (chapter.title || entry.title) + " · " + book.title + " · OSNews Book";
    window.scrollTo(0, 0);
  }

  function renderError(msg) {
    app.innerHTML = '<section class="panel"><h1>No se pudo abrir</h1><p class="error">' + escapeHtml(msg) + "</p><p><a href=\"#/\">Volver a la biblioteca</a></p></section>";
  }

  async function route() {
    try {
      var state = parseHash();
      var catalog = await loadBooks();
      if (state.view === "library") {
        renderLibrary(catalog, state.lang);
        return;
      }
      var book = findBook(catalog, state.book);
      if (!book) {
        renderError("Ese libro no está en la biblioteca.");
        return;
      }
      var index = await loadIndex(book);
      if (state.view === "index") {
        renderIndex(book, index);
        return;
      }
      var entry = (index.chapters || []).find(function (c) { return c.id === state.chapter; });
      if (!entry) {
        renderError("Ese capítulo aún no está publicado.");
        return;
      }
      var chapter = await loadChapter(book, entry);
      renderChapter(book, index, chapter, entry);
    } catch (err) {
      renderError(err && err.message ? err.message : "Error al cargar la biblioteca.");
    }
  }

  function appliedTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function setTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    var light = theme === "light";
    document.querySelector('meta[name="theme-color"]').setAttribute("content", light ? "#f4efe6" : "#0b1220");
    themeBtn.setAttribute("aria-pressed", light ? "false" : "true");
    themeBtn.textContent = light ? "Modo oscuro" : "Modo claro";
    themeBtn.setAttribute("aria-label", light ? "Activar modo oscuro" : "Activar modo claro");
    if (persist) localStorage.setItem(THEME_KEY, theme);
  }

  themeBtn.addEventListener("click", function () {
    setTheme(appliedTheme() === "light" ? "dark" : "light", true);
  });

  function countVisit() {
    try {
      if (location.protocol === "file:") return;
      if (window.goatcounter && typeof window.goatcounter.count === "function") {
        window.goatcounter.count();
      }
    } catch (err) {}
  }

  window.addEventListener("hashchange", function () {
    route();
    countVisit();
  });
  setTheme(appliedTheme(), false);
  route();
})();
