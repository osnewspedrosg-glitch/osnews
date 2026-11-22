// Azum · «Pregunta sobre los libros». Busca solo en el índice local de los libros de
// Pedro (libros-index.json). Sin servidor, sin claves, sin IA generativa: si la respuesta
// no está escrita en los libros, lo dice. Las citas son literales.
// Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.

export const NOT_FOUND = "No lo encuentro en los libros.";
export const GROK_URL = "https://grok.com/";

export const EXAMPLES = [
  "¿De qué trata La hija de dos mundos?",
  "¿Quién es MAY?",
  "¿Qué dice el libro de Ave César sobre Numancia?",
  "¿Quién es Aya?",
  "¿De qué trata Libre como el viento?",
  "¿Qué libros hay?",
];

export function fold(text) {
  return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const STOP = new Set((
  "que qué de del la el los las un una unos unas al a en y e o u por para con sin sobre como cual cuales quien quienes " +
  "donde cuando porque pues se su sus le les lo me mi te tu yo es son era eran fue fueron ser esta este esto estos estas ese esa " +
  "eso hay hace hacen dice dicen decir cuenta cuentan pasa pasan trata tratan habla hablan sale salen aparece aparecen " +
  "libro libros capitulo capitulos parte novela saga autor autores pedro grok osnews azum " +
  "the of and or to in on at for with what who whom which is are was were does do did say says about book books chapter " +
  "tell me story mas muy tambien ya no si"
).split(" "));

// Alias extra de cada libro (además del título completo).
const ALIASES = {
  "la-hija-de-dos-mundos": ["hija de dos mundos"],
  "cartas-desde-las-estrellas": ["cartas desde las estrellas"],
  "los-hijos-de-la-tierra": ["hijos de la tierra"],
  "nada-se-pierde": ["nada se pierde"],
  "libre-como-el-viento": ["libre como el viento"],
  "la-union-de-dos-super-ias": ["union de dos super ias", "dos super ias", "union de dos superias"],
  "the-daughter-of-two-worlds": ["daughter of two worlds"],
  "letters-from-the-stars": ["letters from the stars"],
  "the-children-of-the-earth": ["children of the earth"],
  "nothing-is-lost": ["nothing is lost"],
  "free-as-the-wind": ["free as the wind"],
  "the-union-of-two-super-ais": ["union of two super ais", "two super ais"],
  "ave-cesar-ave-sanchez": ["ave cesar ave sanchez", "ave cesar"],
};

function words(folded) {
  return folded.split(/[^a-z0-9ñ]+/).filter(Boolean);
}

function terms(folded) {
  return words(folded).filter((w) => !STOP.has(w) && (w.length >= 3 || /^\d+$/.test(w)));
}

export function prepare(index) {
  if (index.__ready) return index;
  index.books.forEach((b) => {
    const t = fold(b.title);
    b.__alias = [t, t.replace(/^(la|el|los|las|the) /, ""), ...(ALIASES[b.id] || [])]
      .filter((a, i, all) => a && all.indexOf(a) === i)
      .sort((x, y) => y.length - x.length);
  });
  index.__f = index.p.map((row) => " " + words(fold(row[2])).join(" ") + " ");
  const df = new Map();
  index.__f.forEach((f) => new Set(f.trim().split(" ")).forEach((w) => df.set(w, (df.get(w) || 0) + 1)));
  index.__df = df;
  index.__ready = true;
  return index;
}

function idf(index, w) {
  const n = index.p.length;
  const d = index.__df.get(w) || 0;
  return Math.log(1 + n / (1 + d));
}

export function detectLang(folded) {
  const en = (folded.match(/\b(what|who|which|the|about|does|is|tell|says?)\b/g) || []).length;
  const es = (folded.match(/\b(que|quien|de|la|el|sobre|trata|dice|es|libro)\b/g) || []).length;
  return en > es ? "en" : "es";
}

export function detectBook(index, folded) {
  let best = null;
  index.books.forEach((b) => {
    b.__alias.forEach((a) => {
      if ((" " + folded.replace(/[^a-z0-9ñ]+/g, " ") + " ").includes(" " + a + " ")) {
        if (!best || a.length > best.len) best = { book: b, len: a.length, alias: a };
      }
    });
  });
  return best;
}

export function isBookQuestion(index, text) {
  const f = fold(text);
  if (/\b(libro|libros|capitulo|book|books|chapter)\b/.test(f)) return true;
  if (index) return Boolean(detectBook(prepare(index), f));
  const flat = " " + f.replace(/[^a-z0-9ñ]+/g, " ") + " ";
  return Object.values(ALIASES).some((list) => list.some((a) => flat.includes(" " + a + " ")));
}

export function sentences(text) {
  const raw = text.match(/[\s\S]*?(?:[.!?…]+[»”")]*(?=\s|$)|$)\s*/g).filter(Boolean);
  if (!raw.length) return [text];
  const out = [];
  raw.forEach((seg) => {
    const prev = out[out.length - 1];
    // No cortar en abreviaturas: «a. C.», «d. C.», «s.», iniciales…
    const era = prev && /\b[ad]\. C\.\s*$/.test(prev); // «a. C.» al final de frase sí cierra
    if (prev && ((!era && /(^|[\s(])([a-zA-Z]|[a-z]{1,2}|Sr|Sra|St|Dr|etc)\.\s*$/.test(prev)) || /^\s*[a-z]/.test(seg))) out[out.length - 1] = prev + seg;
    else out.push(seg);
  });
  return out;
}

// Fragmento literal: la frase (o dos frases seguidas) con más términos buscados.
export function excerpt(text, wanted, max = 420) {
  if (text.length <= max) return { quote: text.trim(), cut: false };
  const parts = sentences(text);
  let best = { s: 0, i: 0, n: 1 };
  for (let i = 0; i < parts.length; i += 1) {
    for (let n = 1; n <= 2 && i + n <= parts.length; n += 1) {
      const chunk = parts.slice(i, i + n).join("");
      if (chunk.length > max && n > 1) continue;
      const f = " " + words(fold(chunk)).join(" ") + " ";
      const s = wanted.reduce((acc, w) => acc + (f.includes(" " + w + " ") ? 2 : f.includes(" " + w) ? 1 : 0), 0) + n * 0.01;
      if (s > best.s) best = { s, i, n };
    }
  }
  let quote = parts.slice(best.i, best.i + best.n).join("").trim();
  if (quote.length > max) quote = quote.slice(0, max).replace(/\s+\S*$/, "") + " […]";
  return { quote, cut: true };
}

function bookLinks(b) {
  const out = [];
  if (b.book) out.push({ label: "Leer en OSNews Book", url: b.book });
  if (b.pdf) out.push({ label: "PDF", url: b.pdf });
  (b.videos || []).forEach((v) => out.push({ label: "YouTube: " + v.t, url: v.u }));
  return out;
}

function chapterLink(b, ci) {
  const ch = b.chapters[ci];
  return ch && ch.u ? { label: "Abrir «" + ch.t + "» en OSNews Book", url: ch.u } : null;
}

function langBooks(index, lang) {
  return index.books.map((b, i) => i).filter((i) => index.books[i].lang === lang);
}

function hit(index, row, wanted) {
  const b = index.books[row[0]];
  const ch = b.chapters[row[1]];
  const ex = excerpt(row[2], wanted);
  return { bookId: b.id, book: b.title, chapter: ch.t, quote: ex.quote, cut: ex.cut, link: chapterLink(b, row[1]) };
}

function notFound(extra) {
  return {
    found: false,
    kind: "none",
    text: NOT_FOUND + " No invento respuestas." + (extra ? " " + extra : "") +
      " Si quieres, pregúntaselo a Grok con tu propia cuenta.",
    items: [],
    links: [{ label: "Preguntar a Grok (tu cuenta)", url: GROK_URL, grok: true }],
  };
}

function quoteLine(h) {
  return `En «${h.book}», ${h.chapter}${h.cut ? " (fragmento)" : ""}: «${h.quote}»`;
}

export function answer(index, question) {
  prepare(index);
  const raw = String(question || "").trim();
  const f = fold(raw);
  if (!raw) return notFound();
  const lang = detectLang(f);
  const det = detectBook(index, f);
  const book = det ? det.book : null;

  // 1) Lista de libros
  if (/\b(que|cuales|which|what) (libros|books)\b|\blista de libros\b|\blibros hay\b/.test(f) && !book) {
    const list = index.books.filter((b) => b.lang === lang);
    return {
      found: true, kind: "list",
      text: `En el índice hay ${list.length} libros${lang === "es" ? " en español" : " in English"}: ` +
        list.map((b) => `«${b.title}»${b.sub ? " (" + b.sub + ")" : ""}`).join("; ") + ".",
      items: [], links: list.filter((b) => b.book).map((b) => ({ label: b.title, url: b.book })),
    };
  }

  // 2) ¿De qué trata…?
  if (book && /\b(de que (va|trata|tratan)|sobre que|que cuenta|resumen|resume|argumento|about|summary|plot)\b/.test(f)) {
    if (!book.about) return notFound();
    const names = book.names && book.names.length ? ` Nombres que más aparecen en el texto: ${book.names.join(", ")}.` : "";
    return {
      found: true, kind: "about", bookId: book.id,
      text: `«${book.title}»${book.sub ? " (" + book.sub + ")" : ""}. ${book.aboutSrc}: «${book.about}» ` +
        `Tiene ${book.chapters.length} partes, de «${book.chapters[0].t}» a «${book.chapters[book.chapters.length - 1].t}».` + names +
        (book.book ? "" : " Este libro todavía no está publicado en OSNews Book."),
      items: [], links: bookLinks(book),
    };
  }

  // 3) ¿Quién es X?
  const who = f.match(/\b(?:quien|quienes) (?:es|era|son|fue)\s+(?:el |la |los |las )?([a-z0-9ñ ]{2,40})|\bwho (?:is|was|are)\s+(?:the )?([a-z0-9ñ ]{2,40})/);
  if (who) {
    const name = terms((who[1] || who[2] || "").split(/\b(en|in|del|de|segun|according)\b/)[0]);
    if (!name.length) return notFound();
    const pool = book ? [index.books.indexOf(book)] : langBooks(index, lang);
    const key = name[0];
    const cands = [];
    let order = 0;
    index.p.forEach((row, i) => {
      if (!pool.includes(row[0])) return;
      const fp = index.__f[i];
      if (!name.every((w) => fp.includes(" " + w + " "))) return;
      sentences(row[2]).forEach((sent) => {
        const fs = " " + words(fold(sent)).join(" ") + " ";
        if (!name.every((w) => fs.includes(" " + w + " "))) return;
        const k = " " + name.join(" ") + " ";
        let s = 0;
        if (new RegExp(k + "(es|era|fue|is|was|sera|seria)\\b").test(" " + fold(sent).replace(/[—–()]/g, " | ").replace(/[^a-z0-9ñ,|]+/g, " ") + " ")) s += 4;
        if (new RegExp(k.replace(/ $/, "") + "\\s*,\\s*(la|el|una|un|su|que|the|a|an|his|her|who)\\b").test(" " + fold(sent))) s += 3;
        if (new RegExp("(otra|otro|another) " + k.trim() + " ").test(fs)) s += 2;
        if (/\b(inteligencia|ia|ai|voz|voice|robot|humanoide|humanoid|nina|girl|hija|daughter|hombre|man|mujer|woman|madre|mother|padre|father|clon|clone|chip)\b/.test(fs)) s += 1.5;
        if ((sent.match(/\b[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+/g) || []).length >= 6) s -= 2;
        if (new RegExp("(llamada|llamado|se llamaba|se llama|named|called|nombre de|name was) " + k.trim()).test(fs)) s += 3;
        if (/^\s*[—–-]/.test(sent)) s -= 1.5;
        if (sent.length < 70) s -= 1;
        if (sent.length > 380) s -= 1;
        s -= Math.min(1, order / 400);
        order += 1;
        cands.push({ i, s, sent: sent.trim() });
      });
    });
    if (!cands.length) return notFound();
    cands.sort((a, b) => b.s - a.s || a.i - b.i);
    const picked = [];
    const seenBooks = new Set();
    for (const c of cands) {
      const bi = index.p[c.i][0];
      if (seenBooks.has(bi)) continue;
      seenBooks.add(bi); picked.push(c);
      if (picked.length === 2) break;
    }
    const items = picked.map((c) => {
      const row = index.p[c.i];
      const b = index.books[row[0]];
      return { bookId: b.id, book: b.title, chapter: b.chapters[row[1]].t, quote: c.sent, cut: c.sent.length < row[2].trim().length, link: chapterLink(b, row[1]) };
    });
    const inBooks = index.books.filter((b, bi) => pool.includes(bi) && b.names && b.names.some((n) => name.includes(fold(n))));
    const extra = inBooks.length ? ` Aparece entre los nombres más frecuentes de: ${inBooks.map((b) => "«" + b.title + "»").join(", ")}.` : "";
    return {
      found: true, kind: "who",
      text: `Esto es lo que dicen los libros, citado tal cual:\n` + items.map(quoteLine).join("\n") + extra,
      items, links: items.map((h) => h.link).filter(Boolean),
    };
  }

  // 4) Búsqueda general por palabras clave
  let wanted = terms(f);
  if (det) {
    const titleWords = new Set(terms(det.alias));
    wanted = wanted.filter((w) => !titleWords.has(w));
  }
  wanted = wanted.filter((w, i, all) => all.indexOf(w) === i);
  if (!wanted.length) {
    if (book) return answer(index, "de que trata " + book.title);
    return notFound("Prueba con un nombre, un lugar o un tema concreto.");
  }
  const weights = wanted.map((w) => idf(index, w));
  const total = weights.reduce((a, b) => a + b, 0);
  const pool = book ? [index.books.indexOf(book)] : langBooks(index, lang);
  const scored = [];
  index.p.forEach((row, i) => {
    if (!pool.includes(row[0])) return;
    const fp = index.__f[i];
    let s = 0, n = 0;
    wanted.forEach((w, k) => {
      if (fp.includes(" " + w + " ")) { s += weights[k]; n += 1; }
      else if (w.length >= 5 && fp.includes(" " + w.slice(0, w.length - 1))) { s += weights[k] * 0.6; n += 1; }
    });
    if (n) scored.push({ i, s, n });
  });
  scored.sort((a, b) => b.s - a.s || a.i - b.i);
  const top = scored[0];
  const need = wanted.length === 1 ? 1 : wanted.length <= 3 ? 0.66 : 0.6;
  const minTerms = wanted.length <= 2 ? wanted.length : Math.ceil(wanted.length * 0.66);
  if (!top || top.s / total < need || top.n < minTerms) return notFound();
  const items = [hit(index, index.p[top.i], wanted)];
  const second = scored.slice(1).find((c) => c.s >= top.s * 0.95 && c.n >= minTerms && index.p[c.i][0] !== index.p[top.i][0]);
  if (second) items.push(hit(index, index.p[second.i], wanted));
  return {
    found: true, kind: "search",
    text: `Esto es lo que dicen los libros, citado tal cual:\n` + items.map(quoteLine).join("\n"),
    items, links: items.map((h) => h.link).filter(Boolean)
      .concat(book && !book.book ? bookLinks(book) : []),
  };
}

let cached = null;
export function loadIndex(fetchImpl = globalThis.fetch, url = new URL("./libros-index.json", import.meta.url)) {
  if (!cached) {
    cached = fetchImpl(url, { cache: "force-cache" })
      .then((r) => { if (!r.ok) throw new Error("No se pudo cargar el índice de los libros"); return r.json(); })
      .then(prepare)
      .catch((e) => { cached = null; throw e; });
  }
  return cached;
}
