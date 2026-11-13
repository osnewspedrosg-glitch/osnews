/* Aníbal · buscador único de una palabra. Solo construye enlaces oficiales; no hace peticiones ni copia contenido. */
(function (root) {
  function cleanWord(text) {
    const w = String(text == null ? '' : text).trim().replace(/\s+/g, ' ');
    if (!w || w.length > 80) return '';
    if (/[\/\\?#:<>"]/.test(w)) return '';
    return w;
  }

  /* Devuelve los enlaces del buscador único para una palabra, o [] si no es válida. */
  function wordLinks(text, museosBase) {
    const w = cleanWord(text);
    if (!w) return [];
    const e = encodeURIComponent(w);
    const lower = encodeURIComponent(w.toLocaleLowerCase('es'));
    const museos = museosBase || '../museos/';
    return [
      { id: 'rae', href: 'https://dle.rae.es/' + lower, external: true },
      { id: 'dpd', href: 'https://www.rae.es/dpd/' + lower, external: true },
      { id: 'sin', href: 'https://www.wordreference.com/sinonimos/' + lower, external: true },
      { id: 'museos', href: museos + '?q=' + e, external: false },
      { id: 'libros', href: 'https://www.gutenberg.org/ebooks/search/?query=' + e, external: true },
      { id: 'libros-osnews', href: museos + '#libros', external: false }
    ];
  }

  root.ANIBAL_PALABRA = { cleanWord: cleanWord, wordLinks: wordLinks };
})(typeof globalThis !== 'undefined' ? globalThis : window);
