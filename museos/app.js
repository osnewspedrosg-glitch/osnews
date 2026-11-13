/* OSNews Museos — interface logic only. No tracking, no API keys. */
(function () {
  const LANGS = window.OSNEWS_MUSEOS_LANGS;
  const T = window.OSNEWS_MUSEOS_T;
  const ITEMS = window.OSNEWS_MUSEOS_ITEMS;
  const KEY = "osnews-lang";
  const KEY_ANIBAL = "anibal-lang";
  const SECTIONS = {
    eu: "cards-eu",
    us: "cards-us",
    gal: "cards-gal",
    cer: "cards-cer",
    lang: "cards-lang",
    libros: "cards-libros"
  };

  let lang = "es";
  let filterText = "";

  function $(id) { return document.getElementById(id); }

  function isComposingEvent(event) {
    return Boolean(event && (event.isComposing || event.keyCode === 229));
  }

  function commitInputValue(el) {
    if (!el) return "";
    if (typeof el.blur === "function") el.blur();
    return String(el.value || "").trim();
  }

  function wireImeForm(form, input, onSubmit) {
    if (!form || !input) return;
    const submitBtn = form.querySelector("[type='submit']");
    if (submitBtn) {
      submitBtn.addEventListener("pointerdown", function () {
        if (typeof input.blur === "function") input.blur();
      }, true);
    }
    input.addEventListener("keydown", function (event) {
      if (isComposingEvent(event) && (event.key === "Enter" || event.keyCode === 13)) {
        event.preventDefault();
      }
    });
    form.addEventListener("submit", function (event) {
      if (isComposingEvent(event)) {
        event.preventDefault();
        return;
      }
      if (typeof input.blur === "function") input.blur();
      if (typeof onSubmit === "function") onSubmit(event, commitInputValue(input));
    });
  }

  function normalize(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function txt(map) {
    if (!map) return "";
    return map[lang] || map.es || "";
  }

  function pickLang() {
    try {
      const stored = localStorage.getItem(KEY) || localStorage.getItem(KEY_ANIBAL);
      if (stored && T[stored]) return stored;
    } catch (e) {}
    const nav = (navigator.language || "es").slice(0, 2).toLowerCase();
    return T[nav] ? nav : "es";
  }

  function saveLang(id) {
    try { localStorage.setItem(KEY, id); } catch (e) {}
  }

  function renderLangs() {
    const box = $("langs");
    box.textContent = "";
    LANGS.forEach(function (item) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lang";
      btn.textContent = item.label;
      btn.setAttribute("aria-pressed", item.id === lang ? "true" : "false");
      btn.addEventListener("click", function () { apply(item.id); });
      box.appendChild(btn);
    });
  }

  function cardMatches(item, q) {
    if (!q) return true;
    const blob = normalize([
      item.id, item.name, txt(item.place), txt(item.blurb),
      item.official, item.virtual, item.collection, item.agenda, item.library
    ].join(" "));
    return blob.indexOf(q) !== -1;
  }

  function addLink(wrap, href, label) {
    if (!href) return;
    const a = document.createElement("a");
    a.href = href;
    a.rel = "noopener noreferrer";
    a.target = "_blank";
    a.textContent = label;
    wrap.appendChild(a);
  }

  function renderCards() {
    const t = T[lang] || T.es;
    const q = normalize(filterText);
    let shown = 0;
    Object.keys(SECTIONS).forEach(function (section) {
      const box = $(SECTIONS[section]);
      box.textContent = "";
      ITEMS.filter(function (item) { return item.section === section; }).forEach(function (item) {
        const match = cardMatches(item, q);
        if (match) shown += 1;
        const art = document.createElement("article");
        art.className = "card";
        art.id = "card-" + item.id;
        art.hidden = !match;
        const h = document.createElement("h3");
        h.textContent = item.name;
        const place = document.createElement("p");
        place.className = "place";
        place.textContent = txt(item.place);
        const blurb = document.createElement("p");
        blurb.className = "blurb";
        blurb.textContent = txt(item.blurb);
        const links = document.createElement("p");
        links.className = "links";
        addLink(links, item.virtual, t.virtual);
        addLink(links, item.collection, t.collection);
        addLink(links, item.agenda, t.agenda);
        addLink(links, item.library, t.library);
        addLink(links, item.official, t.official);
        art.appendChild(h);
        art.appendChild(place);
        art.appendChild(blurb);
        art.appendChild(links);
        box.appendChild(art);
      });
    });
    $("filter-empty").hidden = !q || shown > 0;
  }

  function apply(id) {
    const t = T[id] || T.es;
    lang = id;
    const meta = LANGS.find(function (l) { return l.id === id; });
    document.documentElement.lang = id;
    document.documentElement.dir = meta ? meta.dir : "ltr";
    document.body.dir = document.documentElement.dir;
    document.title = t.title;
    $("title").textContent = t.title;
    $("lead").textContent = t.lead;
    $("nav-anibal").textContent = t.navAnibal;
    $("nav-canales").textContent = t.navCanales;
    $("nav-tv").textContent = t.navTv;
    $("nav-back").textContent = t.navBack;
    $("h-lang").textContent = t.lang;
    $("h-search").textContent = t.search;
    $("filter-q").placeholder = t.filterPh;
    $("filter-q").setAttribute("aria-label", t.filterPh);
    $("filter-btn").textContent = t.filterGo;
    $("filter-hint").textContent = t.filterHint;
    $("filter-empty").textContent = t.filterEmpty;
    $("h-obra").textContent = t.obra;
    $("obra-link").textContent = t.obraLink;
    $("obra-credit").textContent = t.obraCredit;
    $("h-eu").textContent = t.eu;
    $("h-us").textContent = t.us;
    $("h-gal").textContent = t.gal;
    $("h-cer").textContent = t.cer;
    $("h-lang-es").textContent = t.langEs;
    $("lang-lead").textContent = t.langLead;
    $("dle-q").placeholder = t.dlePh;
    $("dle-q").setAttribute("aria-label", t.dlePh);
    $("dle-btn").textContent = t.dleGo;
    $("sin-btn").textContent = t.sinGo;
    $("dle-hint").textContent = t.dleHint;
    $("h-libros").textContent = t.libros;
    $("libros-lead").textContent = t.librosLead;
    $("authors").innerHTML = "<strong>" + t.authors + "</strong>";
    $("legal").textContent = t.legal;
    saveLang(id);
    renderLangs();
    renderCards();
  }

  function dictionaryWord(text) {
    const w = String(text || "").trim().replace(/\s+/g, " ");
    if (!w || w.length > 80) return "";
    if (/[/\\?#:]/.test(w)) return "";
    return w;
  }

  function openDictionary(base, text) {
    const w = dictionaryWord(text);
    if (!w) return false;
    window.location.href = base + encodeURIComponent(w);
    return true;
  }

  function loadObra() {
    const day = Math.floor(Date.now() / 86400000);
    const skip = day % 4000;
    const url = "https://openaccess-api.clevelandart.org/api/artworks/?cc0=1&has_image=1&limit=1&skip=" + skip;
    fetch(url, { method: "GET", credentials: "omit" }).then(function (res) {
      if (!res.ok) throw new Error("obra");
      return res.json();
    }).then(function (data) {
      const item = data && data.data && data.data[0];
      if (!item) return;
      const imgUrl = item.images && ((item.images.web && item.images.web.url) || (item.images.print && item.images.print.url));
      if (!imgUrl) return;
      const artist = (item.creators && item.creators[0] && item.creators[0].description) || item.tombstone || "";
      const page = item.url || ("https://www.clevelandart.org/art/" + (item.accession_number || item.id));
      $("obra-img").src = imgUrl;
      $("obra-img").alt = item.title || "";
      $("obra-title").textContent = item.title || "";
      $("obra-artist").textContent = artist;
      $("obra-link").href = page;
      $("obra-panel").hidden = false;
    }).catch(function () {});
  }

  wireImeForm($("filter-form"), $("filter-q"), function (event, text) {
    event.preventDefault();
    filterText = text;
    renderCards();
  });

  wireImeForm($("dle-form"), $("dle-q"), function (event, text) {
    event.preventDefault();
    openDictionary("https://dle.rae.es/", text);
  });

  $("sin-btn").addEventListener("pointerdown", function () {
    const input = $("dle-q");
    if (input && typeof input.blur === "function") input.blur();
  }, true);
  $("sin-btn").addEventListener("click", function (event) {
    if (isComposingEvent(event)) return;
    openDictionary("https://www.wordreference.com/sinonimos/", commitInputValue($("dle-q")));
  });

  try {
    const initialQ = new URLSearchParams(location.search).get("q");
    if (initialQ && initialQ.trim() && initialQ.length <= 80) {
      filterText = initialQ.trim();
      $("filter-q").value = filterText;
    }
  } catch (e) {}

  lang = pickLang();
  apply(lang);
  loadObra();

  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView();
    }
  }
})();
