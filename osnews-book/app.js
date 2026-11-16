/* OSNews Book — lector estático. Sin claves, sin red de terceros, sin rastreadores. */
(function () {
  "use strict";

  var SITE = "https://osnewspedrosg-glitch.github.io/osnews/osnews-book/";
  var CREDIT = "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok";
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
    if (parts[0] === "libro" && parts[1] && parts[2]) {
      return { view: "chapter", book: parts[1], chapter: parts[2] };
    }
    if (parts[0] === "libro" && parts[1]) {
      return { view: "index", book: parts[1] };
    }
    return { view: "library" };
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

  function chapterLabel(entry) {
    if (entry.kind === "prologo") return "Prólogo";
    if (entry.kind === "epilogo") return "Epílogo";
    var m = /(?:cap[íi]tulo)\s+(\d+)/i.exec(entry.title || "");
    if (m) return "Cap. " + m[1];
    var n = /^(\d+)/.exec(entry.id || "");
    return n ? n[1] : "Leer";
  }

  function shareUrl(path, title) {
    var url = SITE + (path || "");
    var text = title
      ? title + " — OSNews Book\n" + CREDIT + "\n" + url
      : "OSNews Book\n" + CREDIT + "\n" + url;
    return "https://x.com/intent/post?text=" + encodeURIComponent(text);
  }

  function shareBtn(path, title) {
    return '<a class="share" href="' + shareUrl(path, title) + '" rel="noopener noreferrer" target="_blank">Compartir en X</a>';
  }

  function toolbar(extra) {
    return '<div class="toolbar">' + (extra || "") + "</div>";
  }

  function renderLibrary(catalog) {
    var cards = (catalog.books || []).map(function (book) {
      return (
        '<a class="book-card" href="' + hrefFor("libro", book.id) + '">' +
          '<img class="cover" src="' + escapeHtml(book.cover) + '" alt="Portada de ' + escapeHtml(book.title) + '">' +
          "<div>" +
            "<h2>" + escapeHtml(book.title) + "</h2>" +
            '<p class="meta">' + escapeHtml(book.subtitle || "Libro") +
              (book.year ? " · " + escapeHtml(String(book.year)) : "") + "</p>" +
            '<p class="blurb">' + escapeHtml(book.blurb || "") + "</p>" +
            '<p class="meta">' + escapeHtml(book.authors || CREDIT) + "</p>" +
          "</div>" +
        "</a>"
      );
    }).join("");
    app.innerHTML =
      "<section>" +
        "<h1>Biblioteca</h1>" +
        '<p class="lead">Lee los libros de OSNews capítulo a capítulo. Se van publicando uno a uno, aquí y en X.</p>' +
        toolbar(shareBtn("#/", "OSNews Book")) +
        (cards ? '<div class="library">' + cards + "</div>" : '<p class="empty">Aún no hay libros en la biblioteca.</p>') +
      "</section>";
    document.title = "OSNews Book";
  }

  function renderIndex(book, index) {
    var chapters = index.chapters || [];
    var items = chapters.map(function (ch, i) {
      return (
        "<li>" +
          '<a href="' + hrefFor("libro", book.id, ch.id) + '">' +
            '<span class="toc-title">' + escapeHtml(ch.title) + "</span>" +
            '<span class="toc-num">' + escapeHtml(chapterLabel(ch)) + "</span>" +
          "</a>" +
        "</li>"
      );
    }).join("");
    app.innerHTML =
      '<section class="panel">' +
        '<p class="chapter-kicker">OSNews Book</p>' +
        "<h1>" + escapeHtml(book.title) + "</h1>" +
        '<p class="lead">' + escapeHtml(book.blurb || "") + "</p>" +
        '<p class="meta">' + escapeHtml(book.authors || CREDIT) + "</p>" +
        toolbar(
          '<a class="btn" href="#/">Biblioteca</a>' +
          shareBtn("#/libro/" + book.id, book.title)
        ) +
        "<h2>Índice</h2>" +
        (items
          ? '<ol class="toc">' + items + "</ol>"
          : '<p class="empty">Este libro se está publicando capítulo a capítulo. Vuelve pronto.</p>') +
      "</section>";
    document.title = book.title + " · OSNews Book";
  }

  function renderChapter(book, index, chapter, entry) {
    var chapters = index.chapters || [];
    var i = chapters.findIndex(function (c) { return c.id === entry.id; });
    var prev = i > 0 ? chapters[i - 1] : null;
    var next = i >= 0 && i < chapters.length - 1 ? chapters[i + 1] : null;
    var blocks = (chapter.blocks || []).map(function (b, n) {
      if (b.type === "h2") return "<h2>" + (b.html || escapeHtml(b.text || "")) + "</h2>";
      var cls = "p";
      var isDialogue = (b.text || "").indexOf("—") === 0;
      var firstProse = n === 0 || (n === 1 && chapter.blocks[0].type === "h2");
      if (firstProse && !isDialogue) cls += " drop";
      if (isDialogue) cls += " dialogue";
      return '<p class="' + cls + '">' + (b.html || escapeHtml(b.text || "")) + "</p>";
    }).join("");

    var pager =
      '<div class="pager">' +
        (prev
          ? '<a href="' + hrefFor("libro", book.id, prev.id) + '">← ' + escapeHtml(prev.title) + "</a>"
          : "<span></span>") +
        (next
          ? '<a href="' + hrefFor("libro", book.id, next.id) + '">' + escapeHtml(next.title) + " →</a>"
          : '<a href="' + hrefFor("libro", book.id) + '">Volver al índice</a>') +
      "</div>";

    app.innerHTML =
      '<article class="panel reader">' +
        '<p class="chapter-kicker">' + escapeHtml(book.title) +
          " · " + (i + 1) + " de " + chapters.length + "</p>" +
        '<h1 class="chapter-title">' + escapeHtml(chapter.title || entry.title) + "</h1>" +
        toolbar(
          '<a class="btn" href="' + hrefFor("libro", book.id) + '">Índice</a>' +
          '<a class="btn" href="#/">Biblioteca</a>' +
          shareBtn("#/libro/" + book.id + "/" + entry.id, (chapter.title || entry.title) + " · " + book.title)
        ) +
        '<div class="chapter-body">' + (blocks || '<p class="empty">Este capítulo todavía no tiene texto.</p>') + "</div>" +
        pager +
        '<p class="meta">' + escapeHtml(book.authors || CREDIT) + "</p>" +
      "</article>";
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
        renderLibrary(catalog);
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

  window.addEventListener("hashchange", route);
  setTheme(appliedTheme(), false);
  route();
})();
