/* Aníbal · IME-safe forms and MAY news routing. No network, no tracking. */
(function (root) {
  function isComposingEvent(event) {
    return Boolean(event && (event.isComposing || event.keyCode === 229));
  }

  function commitInputValue(el) {
    if (!el) return '';
    if (typeof el.blur === 'function') el.blur();
    return String(el.value || '').trim();
  }

  function wireImeForm(form, input, onSubmit) {
    if (!form || !input) return;
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.addEventListener('pointerdown', function () {
        if (typeof input.blur === 'function') input.blur();
      }, true);
    }
    input.addEventListener('keydown', function (event) {
      if (isComposingEvent(event) && (event.key === 'Enter' || event.keyCode === 13)) {
        event.preventDefault();
      }
    });
    form.addEventListener('submit', function (event) {
      if (isComposingEvent(event)) {
        event.preventDefault();
        return;
      }
      if (typeof input.blur === 'function') input.blur();
      if (typeof onSubmit === 'function') onSubmit(event, commitInputValue(input));
    });
  }

  function normalizeQuery(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[’‘`´]/g, "'")
      .replace(/[.,;:!?¡¿"'«»“”()[\]{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const COUNTRY_ROUTES = [
    {
      path: 'china',
      keys: ['china', 'chine', 'cina', 'kina', 'prc', 'zhongguo', '中国', '中國', '中华', '中華']
    },
    {
      path: 'india',
      keys: ['india', 'inde', 'indien', 'indien', 'bharat', 'hindustan', 'الهند', 'भारत', 'हिन्दुस्तान', 'हिंदुस्तान', '印度']
    },
    {
      path: 'marruecos',
      keys: [
        'marruecos', 'morocco', 'maroc', 'marokko', 'marocco', 'marrocos',
        'moroccan', 'marroqui', 'marroquina', 'marocain', 'marocaine',
        'المغرب', 'مغرب', '摩洛哥'
      ]
    },
    {
      path: 'cuba',
      keys: ['cuba', 'cubano', 'cubana', 'cuban', 'kuban', 'كوبا', '古巴']
    }
  ];

  const LANG_ROUTES = [
    {
      path: 'es',
      code: 'es',
      keys: ['espanol', 'spanish', 'castellano', 'castellana', 'espagnol', 'spanisch', 'spagnolo', '西班牙语', 'الإسبانية']
    },
    {
      path: 'en',
      code: 'en',
      keys: ['english', 'ingles', 'anglais', 'englisch', 'inglese', '英语', 'الإنجليزية']
    },
    {
      path: 'fr',
      code: 'fr',
      keys: ['francais', 'french', 'frances', 'franzosisch', 'francese', '法语', 'الفرنسية']
    },
    {
      path: 'de',
      code: 'de',
      keys: ['deutsch', 'german', 'aleman', 'allemand', 'tedesco', '德语', 'الألمانية']
    },
    {
      path: 'pt',
      code: 'pt',
      keys: ['portugues', 'portuguese', 'portugais', 'portugiesisch', 'portoghese', '葡萄牙语', 'البرتغالية']
    },
    {
      path: 'it',
      code: 'it',
      keys: ['italiano', 'italian', 'italien', 'italienisch', '意大利语', 'الإيطالية']
    },
    {
      path: 'ar',
      code: 'ar',
      keys: ['arabe', 'arabic', 'arabisch', 'arabo', 'العربية', 'عربي', '阿拉伯语']
    },
    {
      path: 'zh',
      code: 'zh',
      keys: ['chino', 'chinese', 'chinois', 'chinesisch', 'cinese', '中文', '汉语', '漢語', '华文']
    }
  ];

  function hasCjkOrArabic(key) {
    return /[\u0400-\u9fff\u0600-\u06ff\u0800-\u0fff]/.test(key);
  }

  function matchesKeys(raw, normalized, tokens, keys, wholeOnly) {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (hasCjkOrArabic(key) && raw.indexOf(key) !== -1) return true;
      const k = normalizeQuery(key) || key.toLowerCase();
      if (!k) continue;
      if (wholeOnly) {
        if (normalized === k) return true;
        continue;
      }
      if (normalized === k) return true;
      if (tokens.indexOf(k) !== -1) return true;
    }
    return false;
  }

  function routeNewsQuery(text) {
    const raw = String(text || '').trim();
    if (!raw) return null;
    const normalized = normalizeQuery(raw);
    const tokens = normalized.split(' ').filter(Boolean);
    for (let i = 0; i < COUNTRY_ROUTES.length; i++) {
      const route = COUNTRY_ROUTES[i];
      if (matchesKeys(raw, normalized, tokens, route.keys, false)) {
        return { type: 'canales', path: route.path };
      }
    }
    for (let i = 0; i < LANG_ROUTES.length; i++) {
      const route = LANG_ROUTES[i];
      if (normalized === route.code) {
        return { type: 'canales', path: route.path };
      }
      if (matchesKeys(raw, normalized, tokens, route.keys, false)) {
        return { type: 'canales', path: route.path };
      }
    }
    return { type: 'ddg-news', q: raw };
  }

  function newsDestination(text, canalesBase) {
    const route = routeNewsQuery(text);
    if (!route) return null;
    if (route.type === 'canales') {
      const base = canalesBase || '../canales/';
      return base.replace(/\/?$/, '/') + route.path + '/';
    }
    return 'https://duckduckgo.com/?q=' + encodeURIComponent(route.q) + '&iar=news&ia=news';
  }

  const api = {
    isComposingEvent: isComposingEvent,
    commitInputValue: commitInputValue,
    wireImeForm: wireImeForm,
    normalizeQuery: normalizeQuery,
    routeNewsQuery: routeNewsQuery,
    newsDestination: newsDestination
  };

  root.ANIBAL_IME = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);

