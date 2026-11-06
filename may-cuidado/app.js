/* MAY OS · Cuidado personal — lógica local (sin servidor) */
(function () {
  'use strict';

  const STORAGE_KEY = 'may_cuidado_v1';
  const HABITS = [
    { id: 'cama', label: 'Cama hecha' },
    { id: 'ducha', label: 'Ducha' },
    { id: 'peinado', label: 'Peinado' },
    { id: 'actividad', label: 'Actividad' },
    { id: 'comida', label: 'Comida' },
    { id: 'agua', label: 'Hidratación' },
    { id: 'descanso', label: 'Descanso' }
  ];

  const AGENTS = {
    secretaria: {
      name: 'Secretaria',
      emoji: '📋',
      help: 'Tareas/hábitos + correo mailto, tel, WhatsApp, X (tú confirmas). Preferencias X/YouTube locales. Di «ayuda», «correo», «preferencias».'
    },
    enfermera: {
      name: 'Enfermera · Agente Salud',
      emoji: '🩺',
      help: 'Salud: métricas, análisis clínicos, recetas, menú, consejos orientativos. Ej.: «peso 72.5», «análisis», «recetas», «menú», «consejos», «historial».'
    },
    psicologa: {
      name: 'Psicóloga amiga',
      emoji: '💛',
      help: 'Rueda de emociones · La Huertecica, creada por Eva y Pedro. Apoyo protector; NO compras impulsivas/drogas/alcohol/autolesión. No sustituyo familia/pareja ni diagnostico. 112 · 024.'
    },
    money: {
      name: 'Money Digital',
      emoji: '🛒',
      help: 'Despensa + lista + presupuesto. Ej.: «añade leche qty 2 min 1», «qué falta», «lista compra», «comparar arroz», «presupuesto 250». No inventa precios ni compra sola.'
    }
  };

  const defaultMoney = () => ({
    budget: 250,
    pantry: [],
    shopping: []
  });

  const defaultState = () => ({
    agent: 'secretaria',
    metrics: [],
    tasks: [],
    habitsByDay: {},
    moods: [],
    chats: { secretaria: [], enfermera: [], psicologa: [], money: [] },
    bluetooth: { name: null, connectedAt: null },
    money: defaultMoney(),
    clinicalLabs: [],
    prefs: { x_likes: '', x_accounts: '', yt_likes: '', yt_channels: '', notes: '' }
  });

  let state = loadState();
  let recognition = null;
  let listening = false;
  let btDevice = null;
  let lastCompareProduct = null;

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function ensureMoney() {
    if (!state.money || typeof state.money !== 'object') state.money = defaultMoney();
    if (typeof state.money.budget !== 'number' || isNaN(state.money.budget)) state.money.budget = 250;
    if (!Array.isArray(state.money.pantry)) state.money.pantry = [];
    if (!Array.isArray(state.money.shopping)) state.money.shopping = [];
    return state.money;
  }


  /* ---------- Recetas mediterráneas + menú + labs ---------- */
  const RECIPES = [
    {
      id: 'gaspacho',
      title: 'Gazpacho andaluz',
      time: '15 min',
      cost: 'bajo',
      servings: '4',
      ingredients: [
        { name: 'tomate maduro', qty: 1, unit: 'kg' },
        { name: 'pepino', qty: 1, unit: 'ud' },
        { name: 'pimiento verde', qty: 1, unit: 'ud' },
        { name: 'ajo', qty: 1, unit: 'diente' },
        { name: 'pan del día anterior', qty: 1, unit: 'rebanada' },
        { name: 'aceite de oliva', qty: 4, unit: 'cucharadas' },
        { name: 'vinagre', qty: 1, unit: 'cucharada' },
        { name: 'sal', qty: 1, unit: 'pizca' }
      ],
      steps: [
        'Lava y trocea verduras.',
        'Tritura con pan remojado, aceite, vinagre y sal.',
        'Rectifica y enfría en nevera.'
      ]
    },
    {
      id: 'lentejas',
      title: 'Lentejas con verduras',
      time: '40 min',
      cost: 'muy bajo',
      servings: '4',
      ingredients: [
        { name: 'lentejas', qty: 300, unit: 'g' },
        { name: 'zanahoria', qty: 2, unit: 'ud' },
        { name: 'cebolla', qty: 1, unit: 'ud' },
        { name: 'pimiento', qty: 1, unit: 'ud' },
        { name: 'ajo', qty: 2, unit: 'dientes' },
        { name: 'laurel', qty: 1, unit: 'hoja' },
        { name: 'aceite de oliva', qty: 2, unit: 'cucharadas' },
        { name: 'sal', qty: 1, unit: 'pizca' }
      ],
      steps: [
        'Sofríe cebolla, ajo, zanahoria y pimiento.',
        'Añade lentejas, laurel y agua.',
        'Cuece 30–35 min y salpimenta.'
      ]
    },
    {
      id: 'tortilla-patata',
      title: 'Tortilla de patatas sencilla',
      time: '35 min',
      cost: 'bajo',
      servings: '3',
      ingredients: [
        { name: 'patata', qty: 4, unit: 'ud' },
        { name: 'huevo', qty: 5, unit: 'ud' },
        { name: 'cebolla', qty: 1, unit: 'ud' },
        { name: 'aceite de oliva', qty: 100, unit: 'ml' },
        { name: 'sal', qty: 1, unit: 'pizca' }
      ],
      steps: [
        'Fríe patata y cebolla a fuego medio.',
        'Mezcla con huevos batidos y sal.',
        'Cuaja por ambos lados en sartén.'
      ]
    },
    {
      id: 'ensalada-garbanzos',
      title: 'Ensalada de garbanzos',
      time: '10 min',
      cost: 'bajo',
      servings: '2',
      ingredients: [
        { name: 'garbanzos cocidos', qty: 400, unit: 'g' },
        { name: 'tomate', qty: 2, unit: 'ud' },
        { name: 'pepino', qty: 0.5, unit: 'ud' },
        { name: 'cebolla', qty: 0.5, unit: 'ud' },
        { name: 'aceite de oliva', qty: 2, unit: 'cucharadas' },
        { name: 'limón', qty: 0.5, unit: 'ud' },
        { name: 'perejil', qty: 1, unit: 'puñado' }
      ],
      steps: [
        'Escurre garbanzos.',
        'Pica verduras y mezcla.',
        'Aliña con aceite, limón y sal.'
      ]
    },
    {
      id: 'pescado-plancha',
      title: 'Pescado a la plancha con ensalada',
      time: '20 min',
      cost: 'medio-bajo',
      servings: '2',
      ingredients: [
        { name: 'filete de pescado blanco', qty: 2, unit: 'ud' },
        { name: 'lechuga', qty: 1, unit: 'ud' },
        { name: 'tomate', qty: 1, unit: 'ud' },
        { name: 'limón', qty: 1, unit: 'ud' },
        { name: 'aceite de oliva', qty: 2, unit: 'cucharadas' },
        { name: 'sal', qty: 1, unit: 'pizca' }
      ],
      steps: [
        'Sala el pescado y hazlo a la plancha 3–4 min por lado.',
        'Prepara ensalada simple.',
        'Sirve con limón y un chorrito de aceite.'
      ]
    },
    {
      id: 'arroz-verduras',
      title: 'Arroz con verduras',
      time: '30 min',
      cost: 'bajo',
      servings: '3',
      ingredients: [
        { name: 'arroz', qty: 250, unit: 'g' },
        { name: 'calabacin', qty: 1, unit: 'ud' },
        { name: 'zanahoria', qty: 1, unit: 'ud' },
        { name: 'guisantes', qty: 100, unit: 'g' },
        { name: 'ajo', qty: 1, unit: 'diente' },
        { name: 'aceite de oliva', qty: 2, unit: 'cucharadas' },
        { name: 'caldo o agua', qty: 600, unit: 'ml' },
        { name: 'sal', qty: 1, unit: 'pizca' }
      ],
      steps: [
        'Sofríe ajo y verduras.',
        'Añade arroz, luego caldo.',
        'Cuece ~18 min hasta absorber.'
      ]
    }
  ];

  const WEEKLY_MENU = [
    { day: 'Lunes', lunch: 'Lentejas con verduras', dinner: 'Ensalada de garbanzos' },
    { day: 'Martes', lunch: 'Tortilla de patatas', dinner: 'Gazpacho + pan' },
    { day: 'Miércoles', lunch: 'Arroz con verduras', dinner: 'Pescado a la plancha' },
    { day: 'Jueves', lunch: 'Ensalada de garbanzos', dinner: 'Lentejas (sobras)' },
    { day: 'Viernes', lunch: 'Pescado a la plancha', dinner: 'Tortilla francesa + ensalada' },
    { day: 'Sábado', lunch: 'Arroz con verduras', dinner: 'Gazpacho' },
    { day: 'Domingo', lunch: 'Lentejas o cocido suave', dinner: 'Ensalada mixta + huevo' }
  ];

  function ensureLabs() {
    if (!Array.isArray(state.clinicalLabs)) state.clinicalLabs = [];
    return state.clinicalLabs;
  }

  function sendIngredientsToMoney(ingredients, label) {
    ensureMoney();
    let n = 0;
    (ingredients || []).forEach(function (ing) {
      const name = String(ing.name || '').trim();
      if (!name) return;
      const qty = ing.qty != null ? Number(ing.qty) : 1;
      addToShopping(name, isNaN(qty) ? 1 : qty);
      // also ensure pantry entry with min so "qué falta" works later if desired
      const existing = findPantryByName(name);
      if (!existing) {
        upsertPantry(name, 0, isNaN(qty) ? 1 : qty);
      }
      n++;
    });
    renderMoney();
    renderSummary();
    return n;
  }

  function recipeById(id) {
    return RECIPES.find(function (r) { return r.id === id; }) || null;
  }

  function allWeeklyIngredients() {
    // Map menu dishes to recipe ingredients when titles match; else add dish name as shopping hint
    const map = {};
    RECIPES.forEach(function (r) {
      map[normalize(r.title)] = r;
      // also short keys
      if (r.id === 'lentejas') map[normalize('Lentejas con verduras')] = r;
      if (r.id === 'lentejas') map[normalize('Lentejas (sobras)')] = r;
      if (r.id === 'tortilla-patata') map[normalize('Tortilla de patatas')] = r;
      if (r.id === 'gaspacho') map[normalize('Gazpacho + pan')] = r;
      if (r.id === 'gaspacho') map[normalize('Gazpacho')] = r;
      if (r.id === 'ensalada-garbanzos') map[normalize('Ensalada de garbanzos')] = r;
      if (r.id === 'pescado-plancha') map[normalize('Pescado a la plancha')] = r;
      if (r.id === 'arroz-verduras') map[normalize('Arroz con verduras')] = r;
    });
    const bag = {};
    WEEKLY_MENU.forEach(function (row) {
      [row.lunch, row.dinner].forEach(function (dish) {
        const key = normalize(dish);
        const rec = map[key];
        if (rec) {
          rec.ingredients.forEach(function (ing) {
            const n = normalize(ing.name);
            if (!bag[n]) bag[n] = { name: ing.name, qty: 0 };
            bag[n].qty += Number(ing.qty) || 1;
          });
        } else {
          // generic item
          const n = normalize(dish);
          if (!bag[n]) bag[n] = { name: dish, qty: 1 };
        }
      });
    });
    return Object.keys(bag).map(function (k) { return bag[k]; });
  }

  function renderRecipes() {
    const box = document.getElementById('recipes-list');
    if (!box) return;
    box.innerHTML = RECIPES.map(function (r) {
      return '<article class="recipe-card" data-recipe="' + escapeHtml(r.id) + '">' +
        '<h3>' + escapeHtml(r.title) + '</h3>' +
        '<div class="r-meta">' + escapeHtml(r.time) + ' · coste ' + escapeHtml(r.cost) + ' · ' + escapeHtml(r.servings) + ' raciones</div>' +
        '<strong style="font-size:0.78rem">Ingredientes</strong>' +
        '<ul>' + r.ingredients.map(function (i) {
          return '<li>' + escapeHtml(i.name) + ' — ' + i.qty + ' ' + escapeHtml(i.unit || '') + '</li>';
        }).join('') + '</ul>' +
        '<strong style="font-size:0.78rem">Preparación</strong>' +
        '<ol>' + r.steps.map(function (s) { return '<li>' + escapeHtml(s) + '</li>'; }).join('') + '</ol>' +
        '<div class="bt-row">' +
        '<button type="button" class="btn btn-primary" data-send-recipe="' + escapeHtml(r.id) + '">Enviar ingredientes a Money</button>' +
        '</div></article>';
    }).join('');
  }

  function renderWeeklyMenu() {
    const box = document.getElementById('weekly-menu');
    if (!box) return;
    box.innerHTML = WEEKLY_MENU.map(function (w) {
      return '<div class="week-row"><div class="day">' + escapeHtml(w.day) + '</div><div>' +
        '<div><strong>Comida:</strong> ' + escapeHtml(w.lunch) + '</div>' +
        '<div><strong>Cena:</strong> ' + escapeHtml(w.dinner) + '</div></div></div>';
    }).join('');
  }

  function renderLabs() {
    const list = document.getElementById('labs-list');
    if (!list) return;
    const labs = ensureLabs().slice().sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });
    if (!labs.length) {
      list.innerHTML = '<p class="help-tips">Sin análisis guardados. Usa el formulario.</p>';
      return;
    }
    list.innerHTML = labs.map(function (L) {
      return '<div class="lab-item" data-lab-id="' + escapeHtml(L.id) + '">' +
        '<div class="lab-main">' + escapeHtml(L.test) + ': <strong>' + escapeHtml(String(L.value)) +
        (L.unit ? ' ' + escapeHtml(L.unit) : '') + '</strong></div>' +
        '<div class="lab-meta">' + escapeHtml(L.date) + ' · ' + escapeHtml(L.person || '') +
        (L.note ? ' · ' + escapeHtml(L.note) : '') + '</div>' +
        '<div class="bt-row"><button type="button" class="btn btn-danger" data-del-lab="' + escapeHtml(L.id) + '">Borrar</button></div>' +
        '</div>';
    }).join('');
  }

  function setLabsStatus(msg, kind) {
    const n = document.getElementById('labs-status');
    if (!n) return;
    n.textContent = msg || '';
    n.className = 'status-line' + (kind ? ' ' + kind : '');
  }


  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const base = defaultState();
      const merged = Object.assign(base, parsed, {
        chats: Object.assign(base.chats, (parsed && parsed.chats) || {}),
        habitsByDay: Object.assign({}, (parsed && parsed.habitsByDay) || {}),
        bluetooth: Object.assign({ name: null, connectedAt: null }, (parsed && parsed.bluetooth) || {}),
        money: Object.assign(defaultMoney(), (parsed && parsed.money) || {}),
        clinicalLabs: Array.isArray(parsed && parsed.clinicalLabs) ? parsed.clinicalLabs : [],
        prefs: Object.assign({ x_likes: '', x_accounts: '', yt_likes: '', yt_channels: '', notes: '' }, (parsed && parsed.prefs) || {})
      });
      if (!merged.chats.money) merged.chats.money = [];
      if (!Array.isArray(merged.clinicalLabs)) merged.clinicalLabs = [];
      return merged;
    } catch (e) {
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      setToolsStatus('No se pudo guardar en localStorage.', 'warn');
    }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function fmtTime(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return iso;
    }
  }

  function uid() {
    return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function latestMetric(key) {
    for (let i = state.metrics.length - 1; i >= 0; i--) {
      const m = state.metrics[i];
      if (m && m[key] != null && m[key] !== '') return m;
    }
    return null;
  }

  function pushMetric(partial) {
    const entry = Object.assign({ ts: nowIso(), source: 'manual' }, partial);
    state.metrics.push(entry);
    if (state.metrics.length > 400) state.metrics = state.metrics.slice(-400);
    saveState();
    return entry;
  }

  function ensureHabitsDay() {
    const key = todayKey();
    if (!state.habitsByDay[key]) {
      state.habitsByDay[key] = {};
      HABITS.forEach((h) => { state.habitsByDay[key][h.id] = false; });
    }
    return state.habitsByDay[key];
  }

  function setHabit(id, value) {
    const day = ensureHabitsDay();
    day[id] = !!value;
    saveState();
  }

  function toggleHabit(id) {
    const day = ensureHabitsDay();
    day[id] = !day[id];
    saveState();
    renderHabits();
    renderSummary();
  }

  /* ---------- Money helpers ---------- */
  function findPantryByName(name) {
    const n = normalize(name);
    return ensureMoney().pantry.find((p) => normalize(p.name) === n) || null;
  }

  function upsertPantry(name, qty, min) {
    const money = ensureMoney();
    let item = findPantryByName(name);
    if (!item) {
      item = { id: uid(), name: String(name).trim(), qty: 0, min: 1, updatedAt: nowIso() };
      money.pantry.push(item);
    }
    if (qty != null && !isNaN(qty)) item.qty = Math.max(0, qty);
    if (min != null && !isNaN(min)) item.min = Math.max(0, min);
    item.updatedAt = nowIso();
    saveState();
    return item;
  }

  function itemsMissing() {
    return ensureMoney().pantry.filter((p) => Number(p.qty) < Number(p.min));
  }

  function needQty(p) {
    const need = Number(p.min) - Number(p.qty);
    return need > 0 ? need : 0;
  }

  function syncShoppingFromMissing() {
    const money = ensureMoney();
    const missing = itemsMissing();
    missing.forEach((p) => {
      const n = normalize(p.name);
      let row = money.shopping.find((s) => normalize(s.name) === n && !s.bought);
      const q = needQty(p);
      if (!row) {
        money.shopping.push({ id: uid(), name: p.name, qty: q, bought: false, ts: nowIso() });
      } else {
        row.qty = q;
      }
    });
    saveState();
  }

  function addToShopping(name, qty) {
    const money = ensureMoney();
    const n = normalize(name);
    let row = money.shopping.find((s) => normalize(s.name) === n && !s.bought);
    if (!row) {
      money.shopping.push({
        id: uid(),
        name: String(name).trim(),
        qty: qty != null ? qty : 1,
        bought: false,
        ts: nowIso()
      });
    } else if (qty != null) {
      row.qty = qty;
    }
    saveState();
  }

  function searchLinksFor(product) {
    const q = encodeURIComponent(String(product).trim());
    return [
      {
        label: 'Google Shopping',
        url: 'https://www.google.com/search?tbm=shop&q=' + q
      },
      {
        label: 'Mercadona (búsqueda)',
        url: 'https://tienda.mercadona.es/search-results?query=' + q
      },
      {
        label: 'Carrefour (búsqueda)',
        url: 'https://www.carrefour.es/search?query=' + q
      },
      {
        label: 'Google Web',
        url: 'https://www.google.com/search?q=' + q
      }
    ];
  }

  function showCompare(product) {
    lastCompareProduct = product;
    const box = el.compareBox;
    const links = el.compareLinks;
    const note = el.compareNote;
    if (!box || !links) return;
    box.classList.remove('hidden');
    note.textContent = 'Comparar «' + product + '»: se abren búsquedas reales. Los precios se ven en la web al pulsar. Money Digital nunca compra ni paga sola ni inventa ofertas.';
    links.innerHTML = searchLinksFor(product).map((L) =>
      '<a class="btn-link" target="_blank" rel="noopener noreferrer" href="' + L.url + '">' +
      escapeHtml(L.label) + '</a>'
    ).join('');
  }

  /* ---------- UI ---------- */
  const el = {
    tabs: Array.from(document.querySelectorAll('.agent-tab')),
    summary: document.getElementById('summary-grid'),
    moodBar: document.getElementById('mood-bar'),
    btStatus: document.getElementById('bt-status'),
    btnBt: document.getElementById('btn-bt'),
    btnBtClear: document.getElementById('btn-bt-clear'),
    manualForm: document.getElementById('manual-form'),
    habitChips: document.getElementById('habit-chips'),
    taskList: document.getElementById('task-list'),
    chatTitle: document.getElementById('chat-title'),
    chatHelp: document.getElementById('chat-help'),
    chatBox: document.getElementById('chat-box'),
    composer: document.getElementById('composer'),
    chatInput: document.getElementById('chat-input'),
    btnMic: document.getElementById('btn-mic'),
    btnClearChat: document.getElementById('btn-clear-chat'),
    btnExport: document.getElementById('btn-export'),
    btnWhatsapp: document.getElementById('btn-whatsapp'),
    btnClear: document.getElementById('btn-clear'),
    toolsStatus: document.getElementById('tools-status'),
    moneyBudgetForm: document.getElementById('money-budget-form'),
    moneyBudget: document.getElementById('money-budget'),
    moneyProductForm: document.getElementById('money-product-form'),
    pantryList: document.getElementById('pantry-list'),
    shoppingList: document.getElementById('shopping-list'),
    compareBox: document.getElementById('compare-box'),
    compareLinks: document.getElementById('compare-links'),
    compareNote: document.getElementById('compare-note'),
    moneyStatus: document.getElementById('money-status'),
    btnMoneyFaltan: document.getElementById('btn-money-faltan'),
    btnMoneyLista: document.getElementById('btn-money-lista')
  };

  function setToolsStatus(msg, kind) {
    el.toolsStatus.textContent = msg || '';
    el.toolsStatus.className = 'status-line' + (kind ? ' ' + kind : '');
  }

  function setMoneyStatus(msg, kind) {
    if (!el.moneyStatus) return;
    el.moneyStatus.textContent = msg || '';
    el.moneyStatus.className = 'status-line' + (kind ? ' ' + kind : '');
  }

  function setBtStatus(msg, kind) {
    el.btStatus.textContent = msg;
    el.btStatus.className = 'status-line' + (kind ? ' ' + kind : '');
  }

  function renderSummary() {
    ensureMoney();
    const keys = [
      { k: 'peso', label: 'Peso', unit: 'kg' },
      { k: 'pasos', label: 'Pasos', unit: '' },
      { k: 'pulso', label: 'Pulso', unit: 'lpm' },
      { k: 'sueno', label: 'Sueño', unit: 'h' },
      { k: 'agua', label: 'Agua', unit: 'vasos' },
      { k: 'animo', label: 'Ánimo', unit: '' }
    ];
    const day = ensureHabitsDay();
    const doneHabits = HABITS.filter((h) => day[h.id]).length;
    const pendingTasks = state.tasks.filter((t) => !t.done).length;
    const missing = itemsMissing().length;
    const shopPending = ensureMoney().shopping.filter((s) => !s.bought).length;

    let html = '';
    keys.forEach((item) => {
      const m = latestMetric(item.k);
      let value = '—';
      let hint = 'Sin datos';
      if (m) {
        if (item.k === 'animo') {
          const map = { '1': 'Bien (+1)', '0': 'Regular (0)', '-1': 'Bajo (−1)' };
          value = map[String(m.animo)] || String(m.animo);
        } else {
          value = m[item.k] + (item.unit ? ' ' + item.unit : '');
        }
        hint = fmtTime(m.ts);
      }
      html += '<div class="metric-card"><div class="label">' + item.label + '</div><div class="value">' +
        escapeHtml(String(value)) + '</div><div class="hint">' + escapeHtml(hint) + '</div></div>';
    });
    html += '<div class="metric-card"><div class="label">Hábitos hoy</div><div class="value">' +
      doneHabits + '/' + HABITS.length + '</div><div class="hint">EVA-Habits</div></div>';
    html += '<div class="metric-card"><div class="label">Tareas pendientes</div><div class="value">' +
      pendingTasks + '</div><div class="hint">' + escapeHtml(state.bluetooth.name ? 'BT: ' + state.bluetooth.name : 'BT no conectado') +
      '</div></div>';
    html += '<div class="metric-card"><div class="label">Presupuesto comida*</div><div class="value">' +
      ensureMoney().budget + ' €</div><div class="hint">*Orientativo editable</div></div>';
    html += '<div class="metric-card"><div class="label">Faltan / compra</div><div class="value">' +
      missing + ' / ' + shopPending + '</div><div class="hint">Despensa · lista</div></div>';
    html += '<div class="metric-card"><div class="label">Análisis clínicos</div><div class="value">' +
      ensureLabs().length + '</div><div class="hint">Registro local</div></div>';
    html += '<div class="metric-card" id="card-photos"><div class="label">Fotos locales</div><div class="value" id="photo-count-value">…</div><div class="hint">Sin OCR · sin subida</div></div>';
    el.summary.innerHTML = html;
    photoGetAll().then(function (list) {
      const node = document.getElementById('photo-count-value');
      if (node) node.textContent = String(list.length);
    }).catch(function () {
      const node = document.getElementById('photo-count-value');
      if (node) node.textContent = '—';
    });

    const moods = state.moods.slice(-7);
    el.moodBar.innerHTML = moods.map((m) => {
      const cls = m.score > 0 ? 'pos' : (m.score < 0 ? 'neg' : 'neu');
      return '<div class="mood-dot ' + cls + '" title="' + escapeHtml(fmtTime(m.ts)) + '"></div>';
    }).join('') || '<div class="hint" style="color:var(--muted);font-size:0.72rem">Ánimo reciente aparecerá aquí</div>';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderHabits() {
    const day = ensureHabitsDay();
    el.habitChips.innerHTML = HABITS.map((h) => {
      const done = !!day[h.id];
      return '<button type="button" class="habit-chip' + (done ? ' done' : '') + '" data-habit="' + h.id + '">' +
        (done ? '✓ ' : '○ ') + escapeHtml(h.label) + '</button>';
    }).join('');
  }

  function renderTasks() {
    if (!state.tasks.length) {
      el.taskList.innerHTML = '<p class="help-tips">Sin tareas. Di «añade tarea …» a la Secretaria.</p>';
      return;
    }
    el.taskList.innerHTML = state.tasks.map((t, i) => {
      return '<div class="task-item' + (t.done ? ' done' : '') + '">' +
        '<input type="checkbox" data-task="' + i + '"' + (t.done ? ' checked' : '') + ' />' +
        '<span>' + escapeHtml(t.text) + '</span></div>';
    }).join('');
  }

  function renderMoney() {
    ensureMoney();
    if (el.moneyBudget) el.moneyBudget.value = ensureMoney().budget;

    const pantry = ensureMoney().pantry;
    if (!pantry.length) {
      el.pantryList.innerHTML = '<p class="help-tips">Despensa vacía. Añade productos arriba o di «añade leche qty 2 min 1».</p>';
    } else {
      el.pantryList.innerHTML = pantry.map((p) => {
        const low = Number(p.qty) < Number(p.min);
        return '<div class="pantry-item' + (low ? ' low' : '') + '" data-pantry-id="' + escapeHtml(p.id) + '">' +
          '<div><strong>' + escapeHtml(p.name) + '</strong>' +
          '<div class="meta">Cantidad: ' + p.qty + ' · Mínimo: ' + p.min +
          (low ? ' · FALTA ' + needQty(p) : ' · OK') + '</div></div>' +
          '<div class="pantry-actions">' +
          '<button type="button" class="btn btn-secondary" data-act="compare" data-name="' + escapeHtml(p.name) + '">Comparar</button>' +
          '<button type="button" class="btn btn-secondary" data-act="shop" data-name="' + escapeHtml(p.name) + '">A lista</button>' +
          '<button type="button" class="btn btn-danger" data-act="del-pantry" data-id="' + escapeHtml(p.id) + '">Eliminar</button>' +
          '</div></div>';
      }).join('');
    }

    const shop = ensureMoney().shopping;
    if (!shop.length) {
      el.shoppingList.innerHTML = '<p class="help-tips">Lista vacía. Usa «qué falta» o «añade a compra …».</p>';
    } else {
      el.shoppingList.innerHTML = shop.map((s) => {
        return '<div class="task-item shop-item' + (s.bought ? ' bought' : '') + '">' +
          '<input type="checkbox" data-shop-id="' + escapeHtml(s.id) + '"' + (s.bought ? ' checked' : '') + ' />' +
          '<span style="flex:1">' + escapeHtml(s.name) + ' × ' + s.qty + '</span>' +
          '<button type="button" class="btn btn-secondary" data-act="compare" data-name="' + escapeHtml(s.name) + '" style="padding:6px 8px;font-size:0.72rem">Comparar</button>' +
          '<button type="button" class="btn btn-danger" data-act="del-shop" data-id="' + escapeHtml(s.id) + '" style="padding:6px 8px;font-size:0.72rem">Eliminar</button>' +
          '</div>';
      }).join('');
    }
  }

  function renderChat() {
    const agent = AGENTS[state.agent];
    el.chatTitle.textContent = 'Chat · ' + agent.name;
    el.chatHelp.textContent = agent.help;
    const msgs = state.chats[state.agent] || [];
    el.chatBox.innerHTML = msgs.map((m) => {
      const who = m.role === 'user' ? 'Tú' : agent.name;
      let extra = '';
      if (m.links && m.links.length) {
        extra = '<div class="tools-row" style="margin-top:8px">' + m.links.map((L) =>
          '<a class="btn-link" target="_blank" rel="noopener noreferrer" href="' + L.url + '">' +
          escapeHtml(L.label) + '</a>'
        ).join('') + '</div>';
      }
      return '<div class="bubble ' + (m.role === 'user' ? 'user' : 'bot') + '"><span class="who">' +
        escapeHtml(who) + '</span>' + escapeHtml(m.text) + extra + '</div>';
    }).join('');
    el.chatBox.scrollTop = el.chatBox.scrollHeight;
  }

  function setAgent(id) {
    if (!AGENTS[id]) return;
    state.agent = id;
    saveState();
    el.tabs.forEach((tab) => {
      const on = tab.dataset.agent === id;
      tab.classList.toggle('active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    renderChat();
    el.chatInput.placeholder = 'Escribe a ' + AGENTS[id].name + '…';
    syncGuideVideoBtn(id);
  }

  function syncGuideVideoBtn(agentId) {
    const btn = document.getElementById('btn-guide-video');
    if (!btn) return;
    const map = { secretaria: 'secretaria', enfermera: 'salud', psicologa: 'psicologa', money: 'money' };
    const key = map[agentId] || 'secretaria';
    btn.setAttribute('data-guide-video', key);
    btn.textContent = 'Vídeo: cómo funciona';
    btn.setAttribute('aria-label', 'Vídeo: cómo funciona · ' + (AGENTS[agentId] ? AGENTS[agentId].name : key));
  }

  function addChat(role, text, links) {
    if (!state.chats[state.agent]) state.chats[state.agent] = [];
    const msg = { role: role, text: text, ts: nowIso() };
    if (links && links.length) msg.links = links;
    state.chats[state.agent].push(msg);
    if (state.chats[state.agent].length > 80) {
      state.chats[state.agent] = state.chats[state.agent].slice(-80);
    }
    saveState();
    renderChat();
  }

  /* ---------- Chatbots ---------- */
  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function extractNumber(text, patterns) {
    for (let i = 0; i < patterns.length; i++) {
      const m = text.match(patterns[i]);
      if (m && m[1] != null) return parseFloat(String(m[1]).replace(',', '.'));
    }
    return null;
  }

  function replySecretaria(raw) {
    const t = normalize(raw);
    const day = ensureHabitsDay();

    if (/^(hola|buenas|hey|saludos)\b/.test(t)) {
      const pending = state.tasks.filter((x) => !x.done).length;
      const done = HABITS.filter((h) => day[h.id]).length;
      return 'Hola. Soy tu Secretaria MAY. Tienes ' + pending + ' tarea(s) pendiente(s) y ' +
        done + '/' + HABITS.length + ' hábitos hechos hoy. ¿Qué organizamos?';
    }

    if (/ayuda|que puedes|comandos/.test(t)) {
      return 'Puedo: tareas y hábitos; abrir borradores reales mailto / tel / WhatsApp / X (tú confirmas); guardar preferencias X/YouTube en local.\nEjemplos:\n• añade tarea comprar pan\n• lista tareas\n• hecho 1\n• cama hecha\n• preferencias\n• correo\nNo recibo llamadas ni leo DMs/likes de X o YouTube sin tu texto (la web no puede).';
    }

    if (/preferencias|gustos|youtube|yt /.test(t)) {
      const p = ensurePrefs();
      return 'Preferencias locales (las escribes tú):\n• X gustos: ' + (p.x_likes || '—') +
        '\n• X cuentas: ' + (p.x_accounts || '—') +
        '\n• YouTube gustos: ' + (p.yt_likes || '—') +
        '\n• YouTube canales: ' + (p.yt_channels || '—') +
        '\n• Notas: ' + (p.notes || '—') +
        '\nRoadmap honesto: sin OAuth/API de X/YouTube no leemos privados ni recomendaciones automáticamente. Usa el formulario de Secretaria.';
    }

    if (/correo|mailto|email|whatsapp|llamar|telefono|teléfono|tweet|publicar en x/.test(t)) {
      return 'Usa el panel Secretaria · Contactar: abre mailto:, tel: (llamada saliente que confirmas), wa.me o el compositor de X. Tú revisas y envías/llamas. Esta app no envía sola, no recibe llamadas y no lee mensajes privados.';
    }

    let m = t.match(/^(?:anade|añade|agrega|nueva)\s+(?:tarea\s+)?(.+)$/) ||
      t.match(/^tarea\s*[:\-]?\s*(.+)$/);
    if (m && m[1] && !/^producto\b|^a compra\b|^leche\b|^pan\b/.test(m[1])) {
      // avoid stealing money phrases when somehow routed here — still allow generic tasks
    }
    m = t.match(/^(?:anade|añade|agrega|nueva)\s+(?:tarea\s+)?(.+)$/) ||
      t.match(/^tarea\s*[:\-]?\s*(.+)$/);
    if (m && m[1]) {
      const text = raw.replace(/^(?:añade|anade|agrega|nueva)\s+(?:tarea\s+)?/i, '')
        .replace(/^tarea\s*[:\-]?\s*/i, '')
        .trim();
      if (text.length < 2) return 'Dime el texto de la tarea.';
      state.tasks.push({ text: text, done: false, ts: nowIso() });
      saveState();
      renderTasks();
      renderSummary();
      return 'Tarea añadida: «' + text + '». Pendientes: ' +
        state.tasks.filter((x) => !x.done).length + '.';
    }

    if (/lista\s+tareas|mis tareas|ver tareas|tareas\??$/.test(t)) {
      if (!state.tasks.length) return 'No hay tareas todavía. Di «añade tarea …».';
      return state.tasks.map((task, i) =>
        (i + 1) + '. ' + (task.done ? '✓' : '○') + ' ' + task.text
      ).join('\n');
    }

    m = t.match(/^(?:hecho|completa|completar|marcar)\s+(\d+)$/) ||
      t.match(/^tarea\s+(\d+)\s+(?:hecha|lista|ok)$/);
    if (m) {
      const idx = parseInt(m[1], 10) - 1;
      if (idx < 0 || idx >= state.tasks.length) return 'No encuentro esa tarea. Usa «lista tareas».';
      state.tasks[idx].done = true;
      saveState();
      renderTasks();
      renderSummary();
      return 'Marcada como hecha: «' + state.tasks[idx].text + '».';
    }

    if (/borra\s+tareas|limpia\s+tareas|eliminar tareas/.test(t)) {
      state.tasks = [];
      saveState();
      renderTasks();
      renderSummary();
      return 'Lista de tareas vaciada.';
    }

    if (/cama\s*(ya\s*)?(esta|está)?\s*hecha|ya esta hecha|ya está hecha/.test(t) || t === 'cama') {
      setHabit('cama', true);
      renderHabits();
      renderSummary();
      return 'Cama marcada como hecha. No te preguntaré más hoy.';
    }

    if (/voy a ducharme|ducha(da)?$|me ducho/.test(t)) {
      setHabit('ducha', true);
      renderHabits();
      renderSummary();
      return 'Anotado: ducha en curso/hecha. Cuando termines, puedes decir «peinado» para marcarlo.';
    }

    const habitMap = {
      peinado: /peinado|me peino/,
      actividad: /actividad|ejercicio|paseo|camin[ae]/,
      comida: /comida|he comido|almuerzo|cena/,
      agua: /hidratacion|hidratación|bebi agua|bebí agua/,
      descanso: /descanso|siesta|me tumbo/
    };
    for (const id in habitMap) {
      if (habitMap[id].test(t)) {
        setHabit(id, true);
        renderHabits();
        renderSummary();
        const label = HABITS.find((h) => h.id === id).label;
        return 'Hábito «' + label + '» marcado para hoy.';
      }
    }

    if (/habitos|hábitos|estado habitos/.test(t)) {
      return 'Hábitos de hoy:\n' + HABITS.map((h) =>
        (day[h.id] ? '✓' : '○') + ' ' + h.label
      ).join('\n');
    }

    if (/resumen( hoy)?|como voy|cómo voy|estado del dia|estado del día/.test(t)) {
      const pending = state.tasks.filter((x) => !x.done);
      const done = HABITS.filter((h) => day[h.id]).length;
      return 'Resumen de hoy (' + todayKey() + '):\n• Hábitos: ' + done + '/' + HABITS.length +
        '\n• Tareas pendientes: ' + pending.length +
        (pending.length ? '\n  - ' + pending.slice(0, 5).map((p) => p.text).join('\n  - ') : '') +
        '\n¿Algo más que organizar?';
    }

    return 'Te escucho. Puedo añadir tareas, marcar hábitos o darte el resumen. Escribe «ayuda» para ver comandos.';
  }

  function buildLifestyleTips() {
    const tips = [];
    const pasos = latestMetric('pasos');
    const sueno = latestMetric('sueno');
    const agua = latestMetric('agua');
    const peso = latestMetric('peso');
    const pulso = latestMetric('pulso');
    const labs = ensureLabs();

    tips.push('Patrón general mediterráneo (orientativo): verduras, legumbres, fruta, aceite de oliva, pescado a veces, menos ultraprocesados. No es una dieta prescrita.');
    tips.push('Movimiento: caminar a diario si puedes; sube poco a poco según te encuentres. No es plan de entrenamiento médico.');

    if (pasos && pasos.pasos != null) {
      if (pasos.pasos < 4000) tips.push('Según tus pasos registrados (' + pasos.pasos + '): prueba un paseo corto extra si te sientes bien.');
      else if (pasos.pasos < 8000) tips.push('Según tus pasos (' + pasos.pasos + '): buen ritmo; mantener caminatas regulares ayuda al bienestar general.');
      else tips.push('Según tus pasos (' + pasos.pasos + '): buen registro de actividad. Descansa si hay fatiga.');
    } else {
      tips.push('Aún no hay pasos registrados: cuando anotes actividad podré afinar la sugerencia de movimiento.');
    }

    if (sueno && sueno.sueno != null) {
      if (sueno.sueno < 6) tips.push('Según sueño registrado (' + sueno.sueno + ' h): intenta una rutina de descanso más estable (orientativo, no diagnóstico).');
      else tips.push('Según sueño registrado (' + sueno.sueno + ' h): mantén horarios regulares si te funciona.');
    }

    if (agua && agua.agua != null) {
      if (agua.agua < 4) tips.push('Según agua registrada (' + agua.agua + ' vasos): recuerda hidratarte a lo largo del día (orientativo).');
      else tips.push('Hidratación anotada (' + agua.agua + ' vasos): sigue según sed y contexto.');
    }

    if (peso) tips.push('Peso anotado: ' + peso.peso + ' kg (solo seguimiento personal). Los cambios se valoran con profesionales.');
    if (pulso) tips.push('Pulso anotado: ' + pulso.pulso + ' lpm. Si te encuentras mal, consulta; en emergencia 112.');

    if (labs.length) {
      tips.push('Tienes ' + labs.length + ' análisis clínicos guardados localmente. Esta app no los interpreta ni diagnostica: revísalos con tu médico.');
    } else {
      tips.push('Puedes guardar analíticas en «Análisis clínicos» (fecha, prueba, valor, unidad, nota) solo como archivo personal.');
    }

    tips.push('Recetas y menú semanal son ideas económicas mediterráneas caseras, no nutrición médica.');
    tips.push('Samsung Health no se conecta por web aquí: importa CSV/JSON exportado, o usa manual/Bluetooth.');
    return tips;
  }

  function renderLifestyleTips() {
    const box = document.getElementById('lifestyle-tips');
    if (!box) return;
    const tips = buildLifestyleTips();
    box.innerHTML = '<ul style="margin:0;padding-left:18px">' + tips.map(function (t) {
      return '<li style="margin-bottom:6px">' + escapeHtml(t) + '</li>';
    }).join('') + '</ul>';
  }

  function replyEnfermera(raw) {
    const t = normalize(raw);

    if (/^(hola|buenas|hey)\b/.test(t)) {
      return 'Hola. Soy Enfermera · Agente Salud MAY. Registro métricas, análisis clínicos locales, recetas mediterráneas fáciles y un menú semanal sencillo. Consejos solo orientativos según lo registrado. No es diagnóstico médico. ¿Qué necesitas?';
    }
    if (/ayuda|comandos|que puedes/.test(t)) {
      return 'Comandos Salud:\n• peso / pasos / pulso / sueño / agua\n• historial · resumen · consejos\n• análisis / labs (ver formulario)\n• recetas · menú\n• enviar ingredientes [nombre receta]\nFotos: análisis, receta médica, informe médico. OCR local opcional (Tesseract) con confirmación.\nSamsung Health: importa CSV/JSON (sin conexión web directa).';
    }
    if (/emergencia|urgencia|112|dolor fuerte|me encuentro mal/.test(t)) {
      return 'Si es una emergencia, llama al 112 ahora. Yo solo hago seguimiento personal, no diagnostico ni sustituyo atención sanitaria.';
    }

    if (/consejos|recomendacion|recomendación|mediterrane|mediterráne|ejercicio|dieta/.test(t)) {
      return 'Consejos orientativos (NO médicos) según lo registrado:\n• ' + buildLifestyleTips().join('\n• ');
    }

    if (/^(recetas|ver recetas|lista recetas)\b/.test(t)) {
      return 'Recetas mediterráneas fáciles (económicas):\n' + RECIPES.map(function (r, i) {
        return (i + 1) + '. ' + r.title + ' (' + r.time + ', coste ' + r.cost + ')';
      }).join('\n') + '\nDi «receta lentejas» o usa el panel y «Enviar ingredientes a Money». No es consejo nutricional médico.';
    }

    let mRec = t.match(/^receta\s+(.+)/) || t.match(/^ver receta\s+(.+)/);
    if (mRec) {
      const q = normalize(mRec[1]);
      const r = RECIPES.find(function (x) {
        return normalize(x.title).indexOf(q) >= 0 || normalize(x.id).indexOf(q) >= 0 || q.indexOf(normalize(x.id)) >= 0;
      });
      if (!r) return 'No encuentro esa receta. Di «recetas» para la lista.';
      return r.title + ' · ' + r.time + ' · coste ' + r.cost + '\nIngredientes:\n' +
        r.ingredients.map(function (i) { return '• ' + i.name + ' ' + i.qty + ' ' + (i.unit || ''); }).join('\n') +
        '\nPreparación:\n' + r.steps.map(function (s, i) { return (i + 1) + ') ' + s; }).join('\n') +
        '\nUsa el botón del panel para enviar ingredientes a Money. No es nutrición médica.';
    }

    if (/enviar ingredientes/.test(t)) {
      const q = t.replace(/.*enviar ingredientes\s*/i, '').trim();
      const r = RECIPES.find(function (x) {
        return !q || normalize(x.title).indexOf(normalize(q)) >= 0 || normalize(x.id).indexOf(normalize(q)) >= 0;
      });
      if (!r) return 'Indica la receta: «enviar ingredientes lentejas».';
      const n = sendIngredientsToMoney(r.ingredients, r.title);
      setAgent('money');
      return 'He enviado ' + n + ' ingredientes de «' + r.title + '» a Money (lista/despensa). Revisa y compara precios en la web si quieres.';
    }

    if (/menu|menú|menu semanal|menú semanal/.test(t)) {
      return 'Menú semanal sencillo (orientativo, no nutrición médica):\n' + WEEKLY_MENU.map(function (w) {
        return '• ' + w.day + ': comida ' + w.lunch + ' / cena ' + w.dinner;
      }).join('\n') + '\nPuedes «Enviar ingredientes de la semana a Money» en el panel.';
    }

    if (/analisis|análisis|labs?|analitica|analítica|pruebas clinicas|pruebas clínicas/.test(t) && !/foto/.test(t)) {
      const labs = ensureLabs();
      if (!labs.length) {
        return 'No hay análisis clínicos guardados. Usa el formulario: fecha, nombre, prueba, valor, unidad y nota. Solo archivo personal · No es diagnóstico médico.';
      }
      return 'Últimos análisis (local):\n' + labs.slice().sort(function (a, b) {
        return String(b.date).localeCompare(String(a.date));
      }).slice(0, 8).map(function (L) {
        return '• ' + L.date + ' · ' + L.person + ' · ' + L.test + ': ' + L.value + (L.unit ? ' ' + L.unit : '') +
          (L.note ? ' (' + L.note + ')' : '');
      }).join('\n') + '\nNo interpreto resultados clínicos.';
    }

    if (/samsung/.test(t)) {
      return 'Samsung Health: no hay conexión web general posible desde esta app. Importa un CSV/JSON exportado en el panel «Samsung Health», o registra a mano / Bluetooth si el dispositivo es compatible.';
    }
    if (/\bocr\b|tesseract/.test(t)) {
      return 'OCR local con Tesseract.js: usa el panel «OCR local». Lee la foto en tu dispositivo, te muestra campos editables y solo guarda si confirmas. No inventa cifras dudosas.';
    }

    const peso = extractNumber(t, [
      /peso\s*(?:de\s*)?(\d+[.,]?\d*)/,
      /(\d+[.,]?\d*)\s*kg/
    ]);
    if (peso != null && peso >= 20 && peso <= 300) {
      pushMetric({ peso: peso });
      renderSummary();
      renderLifestyleTips();
      return 'Peso registrado: ' + peso + ' kg a las ' + fmtTime(nowIso()) + '. Seguimiento personal · No es diagnóstico médico.';
    }

    const pasos = extractNumber(t, [
      /pasos?\s*(?:de\s*)?(\d+)/,
      /(\d+)\s*pasos?/
    ]);
    if (pasos != null && pasos >= 0 && pasos <= 100000) {
      pushMetric({ pasos: Math.round(pasos) });
      renderSummary();
      renderLifestyleTips();
      return 'Pasos registrados: ' + Math.round(pasos) + '.';
    }

    const pulso = extractNumber(t, [
      /pulso\s*(?:de\s*)?(\d+)/,
      /fc\s*(\d+)/,
      /(\d+)\s*(?:lpm|ppm)/
    ]);
    if (pulso != null && pulso >= 30 && pulso <= 220) {
      pushMetric({ pulso: Math.round(pulso) });
      renderSummary();
      renderLifestyleTips();
      let note = 'Pulso registrado: ' + Math.round(pulso) + ' lpm.';
      if (pulso < 40 || pulso > 140) {
        note += ' Valor fuera de rango habitual en reposo: si te encuentras mal, consulta a un profesional o llama al 112.';
      }
      return note;
    }

    const sueno = extractNumber(t, [
      /sueno\s*(?:de\s*)?(\d+[.,]?\d*)/,
      /dormi\s*(\d+[.,]?\d*)/,
      /(\d+[.,]?\d*)\s*horas?\s*(?:de\s*)?sueno/
    ]);
    if (sueno != null && sueno >= 0 && sueno <= 24) {
      pushMetric({ sueno: sueno });
      renderSummary();
      renderLifestyleTips();
      return 'Sueño registrado: ' + sueno + ' h.';
    }

    const agua = extractNumber(t, [
      /agua\s*(?:de\s*)?(\d+)/,
      /(\d+)\s*vasos?/
    ]);
    if (agua != null && agua >= 0 && agua <= 30) {
      pushMetric({ agua: Math.round(agua) });
      renderSummary();
      renderLifestyleTips();
      return 'Agua registrada: ' + Math.round(agua) + ' vasos.';
    }

    if (/historial|historico|histórico|ultimos|últimos/.test(t)) {
      const last = state.metrics.slice(-8);
      if (!last.length) return 'Aún no hay métricas. Prueba «peso 72» o el formulario.';
      return 'Últimos registros:\n' + last.map((m) => {
        const parts = [];
        if (m.peso != null) parts.push('peso ' + m.peso);
        if (m.pasos != null) parts.push('pasos ' + m.pasos);
        if (m.pulso != null) parts.push('pulso ' + m.pulso);
        if (m.sueno != null) parts.push('sueño ' + m.sueno);
        if (m.agua != null) parts.push('agua ' + m.agua);
        if (m.animo != null && m.animo !== '') parts.push('ánimo ' + m.animo);
        return '• ' + fmtTime(m.ts) + ' — ' + (parts.join(', ') || 'vacío') +
          (m.source ? ' [' + m.source + ']' : '');
      }).join('\n');
    }

    if (/resumen|como estoy|cómo estoy|estado/.test(t)) {
      const fields = ['peso', 'pasos', 'pulso', 'sueno', 'agua'];
      const lines = fields.map((f) => {
        const m = latestMetric(f);
        if (!m) return '• ' + f + ': sin datos';
        return '• ' + f + ': ' + m[f] + ' (' + fmtTime(m.ts) + ')';
      });
      return 'Resumen de métricas (local):\n' + lines.join('\n') +
        '\nAnálisis clínicos guardados: ' + ensureLabs().length +
        '\n\nSeguimiento personal · No es diagnóstico médico.\nDi «consejos» para sugerencias orientativas.';
    }

    return 'No he capturado una métrica clara. Prueba «peso 72.5», «recetas», «menú», «análisis», «consejos» o el formulario.';
  }

  function scoreMood(t) {
    const neg = /(mal|triste|ansio|ansiedad|agotad|cansad|solo|sola|llor|estres|estrés|despecho|fatal|horrible|bajon|bajón|deprim|rabia|miedo|panic|pánico|no puedo|vacio|vacío)/;
    const pos = /(bien|mejor|feliz|contento|contenta|tranquilo|tranquila|animado|animada|gracias|motiv|ilusion|ilusión|genial|fenomen|álimo|animo alto)/;
    if (neg.test(t) && !pos.test(t)) return -1;
    if (pos.test(t) && !neg.test(t)) return 1;
    if (neg.test(t) && pos.test(t)) return 0;
    if (/\b(regular|mas o menos|más o menos|tirando|normalito)\b/.test(t)) return 0;
    return null;
  }

  function replyPsicologa(raw) {
    const t = normalize(raw);

    if (/112|024|suicidio|hacerme dano|hacerme daño|quiero morir|matarme|autolesion|autolesión|cortarme|lastimarme/.test(t)) {
      return 'Te escucho con cuidado. Como amiga protectora te digo claramente NO a la autolesión ni a hacerte daño. No sustituyo a tu familia, pareja ni a profesionales. Si hay riesgo, llama ahora al 112 o al 024 (España). No estás solo/a.';
    }

    if (/drogas?|cocaina|cocaína|heroina|heroína|porros?|cannabis|marihuana|lsd|extasis|éxtasis|metanfet|alcohol|borracher|emborrach|bebida alcohol|cerveza.*mucho|vino.*mucho/.test(t) && /(quiero|voy a|necesito|comprar|tomar|consum|fumar|beber|drogar)/.test(t)) {
      return 'Como amiga protectora te digo NO al consumo de drogas y NO al alcohol como escape. No diagnostico ni sustituyo a tu familia o pareja. Si te cuesta parar, habla con alguien de confianza o con profesionales; en emergencia 112. ¿Quieres una respiración corta o contar qué te pesa sin consumir?';
    }

    if (/compra impuls|compras? impuls|comprar por ansiedad|comprar para sentirme|me lo compro ya|no puedo dejar de comprar|gastar sin pensar/.test(t)) {
      return 'Como amiga protectora: NO a las compras impulsivas. Antes de comprar, pausa 10 minutos, respira y pregunta si lo necesitas de verdad. Puedo ayudarte a anotar el impulso; Money Digital sirve para lista consciente, no para gastar a ciegas. No soy tu pareja ni tu familia, solo apoyo cotidiano sin diagnóstico.';
    }

    if (/^(hola|buenas|hey)\b/.test(t)) {
      return 'Hola. Soy tu Psicóloga amiga MAY: apoyo protector y cotidiano. Te animo a decir NO a compras impulsivas, drogas, alcohol de escape y autolesión. No sustituyo a familia, pareja ni profesionales, y no diagnostico. ¿Cómo te sientes hoy?';
    }

    if (/ayuda|que puedes|comandos/.test(t)) {
      return 'Puedo escuchar, estimar ánimo (+1/0/−1), ofrecer respiración breve no clínica y recordarte límites protectores: no compras impulsivas, no drogas/alcohol, no autolesión. No sustituyo familia/pareja ni diagnostico. Emergencias 112 · 024.';
    }

    if (/rueda|emociones|la huertecica/.test(t)) {
      return EMOTION_CREDIT + '. Usa el panel «Rueda de emociones · Detecta tu estado emocional»: elige un estado (+1/0/−1), guarda historial y, si quieres, simulación de escena por brillo/color (NO reconocimiento facial ni diagnóstico).';
    }

    if (/respiracion|respiración|calmar|calma|ejercicio|box breathing|4.4.4/.test(t)) {
      return 'Ejercicio breve (no clínico):\n1) Inhala por la nariz contando 4.\n2) Mantén 4.\n3) Exhala por la boca contando 4.\n4) Repite 3 veces a tu ritmo.\nSi te mareas, para. Si la angustia es intensa o hay riesgo, llama al 112 o al 024.';
    }

    let score = null;
    const explicit = t.match(/(?:animo|ánimo|humor)\s*(?:\=|:)?\s*(\+?1|0|-1|menos 1|bajo|bien|mal|regular)/);
    if (explicit) {
      const v = explicit[1];
      if (v === '1' || v === '+1' || v === 'bien') score = 1;
      else if (v === '0' || v === 'regular') score = 0;
      else score = -1;
    } else {
      score = scoreMood(t);
    }

    if (score != null) {
      state.moods.push({ score: score, ts: nowIso(), note: raw.slice(0, 160) });
      if (state.moods.length > 60) state.moods = state.moods.slice(-60);
      pushMetric({ animo: score, source: 'chat-psicologa' });
      renderSummary();
      const label = score > 0 ? 'bien (+1)' : (score < 0 ? 'bajo (−1)' : 'regular (0)');
      let reply = 'He anotado tu ánimo como ' + label + '. ';
      if (score < 0) {
        reply += 'Gracias por decirlo. ¿Quieres probar una «respiración» corta o hablar de una cosa concreta que te pesa hoy? Si es emergencia: 112 · 024.';
      } else if (score > 0) {
        reply += 'Qué bien. ¿Qué te está ayudando hoy? Podemos guardarlo como ancla positiva.';
      } else {
        reply += 'Días regulares también cuentan. ¿Prefieres ordenar una tarea pequeña con la Secretaria o solo desahogarte un poco más?';
      }
      return reply;
    }

    if (/gracias|te quiero|me ayudas/.test(t)) {
      return 'Estoy aquí para acompañarte en lo cotidiano. Recuerda: apoyo amistoso, no terapia profesional.';
    }

    if (t.length < 3) {
      return 'Cuéntame un poco más, con tus palabras. También puedes decir «ánimo bien», «ánimo regular» o «ánimo bajo».';
    }

    return 'Te escucho: «' + raw.slice(0, 180) + '». Si quieres, dime si te sientes bien, regular o bajo, o pide «respiración». En crisis: 112 · 024.';
  }

  function replyMoney(raw) {
    const t = normalize(raw);
    ensureMoney();

    if (/^(hola|buenas|hey)\b/.test(t)) {
      return {
        text: 'Hola. Soy Money Digital · Compra inteligente. Gestiono despensa, mínimos, lista de compra y un presupuesto orientativo (por defecto 250 € comida, editable). No invento precios ni compro/pago sola. Di «ayuda».'
      };
    }

    if (/ayuda|comandos|que puedes/.test(t)) {
      return {
        text: 'Comandos:\n• añade leche qty 2 min 1\n• cantidad leche 3\n• minimo leche 1\n• inventario / despensa\n• qué falta\n• lista compra\n• compra leche (marcar comprado)\n• elimina leche\n• presupuesto 250\n• comparar arroz\nLos botones de comparar abren Google Shopping, Mercadona y Carrefour. Precios solo en la web.'
      };
    }

    let m = t.match(/presupuesto\s*(?:de\s*)?(\d+[.,]?\d*)/);
    if (m) {
      const b = parseFloat(m[1].replace(',', '.'));
      ensureMoney().budget = b;
      saveState();
      renderMoney();
      renderSummary();
      return {
        text: 'Presupuesto orientativo guardado: ' + b + ' € (editable; no es un gasto real registrado ni un dato bancario).'
      };
    }

    if (/presupuesto\??$|ver presupuesto/.test(t)) {
      return {
        text: 'Presupuesto comida orientativo: ' + ensureMoney().budget + ' €. Puedes cambiarlo con «presupuesto 250». No representa un gasto real automático.'
      };
    }

    m = t.match(/^(?:anade|añade|agrega|pon)\s+(?:producto\s+)?(.+?)(?:\s+qty\s+(\d+[.,]?\d*))?(?:\s+min(?:imo|imo)?\s+(\d+[.,]?\d*))?$/);
    if (!m) {
      m = t.match(/^(?:anade|añade|agrega)\s+(.+?)\s+(\d+[.,]?\d*)\s+(\d+[.,]?\d*)$/);
      if (m) m = [m[0], m[1], m[2], m[3]];
    }
    if (m && m[1] && !/^(tarea|a compra)\b/.test(m[1])) {
      let name = m[1].replace(/\s+qty\s+.*/i, '').replace(/\s+min(imo)?\s+.*/i, '').trim();
      // strip trailing numbers if pattern "leche 2 1"
      const parts = name.split(/\s+/);
      if (parts.length >= 3 && /^\d+[.,]?\d*$/.test(parts[parts.length - 1]) && /^\d+[.,]?\d*$/.test(parts[parts.length - 2])) {
        // handled by alternate match
      }
      const qty = m[2] != null ? parseFloat(String(m[2]).replace(',', '.')) : 1;
      const min = m[3] != null ? parseFloat(String(m[3]).replace(',', '.')) : 1;
      if (name.length < 1) return { text: 'Indica el nombre del producto.' };
      // clean name from qty/min words leftovers
      name = name.replace(/\bqty\b/gi, '').replace(/\bmin(imo|imo)?\b/gi, '').trim();
      const item = upsertPantry(name, qty, min);
      if (needQty(item) > 0) addToShopping(item.name, needQty(item));
      renderMoney();
      renderSummary();
      return {
        text: 'Despensa: «' + item.name + '» → cantidad ' + item.qty + ', mínimo ' + item.min +
          (needQty(item) > 0 ? '. Falta ' + needQty(item) + ' (añadido a lista de compra).' : '. Stock OK.')
      };
    }

    m = t.match(/^(?:cantidad|qty|stock)\s+(.+?)\s+(\d+[.,]?\d*)$/);
    if (m) {
      const item = findPantryByName(m[1]);
      if (!item) return { text: 'No está en despensa. Prueba «añade ' + m[1] + ' qty ' + m[2] + ' min 1».' };
      item.qty = parseFloat(String(m[2]).replace(',', '.'));
      item.updatedAt = nowIso();
      saveState();
      if (needQty(item) > 0) addToShopping(item.name, needQty(item));
      renderMoney();
      renderSummary();
      return { text: 'Cantidad de «' + item.name + '» = ' + item.qty + '.' };
    }

    m = t.match(/^(?:minimo|mínimo|min)\s+(.+?)\s+(\d+[.,]?\d*)$/);
    if (m) {
      const item = findPantryByName(m[1]);
      if (!item) return { text: 'No está en despensa. Añádelo primero.' };
      item.min = parseFloat(String(m[2]).replace(',', '.'));
      item.updatedAt = nowIso();
      saveState();
      if (needQty(item) > 0) addToShopping(item.name, needQty(item));
      renderMoney();
      renderSummary();
      return { text: 'Mínimo de «' + item.name + '» = ' + item.min + '.' };
    }

    if (/^(inventario|despensa|stock)\b/.test(t) || t === 'inventario' || t === 'despensa') {
      const pantry = ensureMoney().pantry;
      if (!pantry.length) return { text: 'Despensa vacía.' };
      return {
        text: 'Despensa:\n' + pantry.map((p) =>
          '• ' + p.name + ': ' + p.qty + ' (mín ' + p.min + ')' + (needQty(p) > 0 ? ' ⚠ falta ' + needQty(p) : '')
        ).join('\n') +
        '\nPresupuesto orientativo: ' + ensureMoney().budget + ' €.'
      };
    }

    if (/que falta|qué falta|faltan|detectar falta|reponer/.test(t)) {
      syncShoppingFromMissing();
      const missing = itemsMissing();
      renderMoney();
      renderSummary();
      if (!missing.length) {
        return { text: 'Nada por debajo del mínimo. Despensa OK según tus reglas.' };
      }
      return {
        text: 'Falta reponer:\n' + missing.map((p) => '• ' + p.name + ' (necesitas ' + needQty(p) + ')').join('\n') +
          '\nActualicé la lista de compra. Usa «comparar [producto]» para buscar precios en la web (sin inventar cifras).'
      };
    }

    if (/lista\s*(de\s*)?compra|ver compra|shopping/.test(t)) {
      const shop = ensureMoney().shopping;
      if (!shop.length) return { text: 'Lista de compra vacía. Di «qué falta» o añade productos.' };
      return {
        text: 'Lista de compra:\n' + shop.map((s, i) =>
          (i + 1) + '. ' + (s.bought ? '✓' : '○') + ' ' + s.name + ' × ' + s.qty
        ).join('\n') +
        '\nPresupuesto orientativo: ' + ensureMoney().budget + ' €. No compro ni pago yo.'
      };
    }

    m = t.match(/^(?:anade a compra|añade a compra|comprar)\s+(.+)$/);
    if (m) {
      addToShopping(m[1].trim(), 1);
      renderMoney();
      renderSummary();
      return { text: 'Añadido a lista de compra: «' + m[1].trim() + '».' };
    }

    m = t.match(/^(?:compra|comprado|marcar comprado|hecho compra)\s+(.+)$/);
    if (m) {
      const n = normalize(m[1]);
      const money = ensureMoney();
      const row = money.shopping.find((s) => normalize(s.name) === n);
      if (!row) return { text: 'No está en la lista de compra.' };
      row.bought = true;
      const pan = findPantryByName(row.name);
      if (pan) {
        pan.qty = Number(pan.qty) + Number(row.qty || 0);
        pan.updatedAt = nowIso();
      }
      saveState();
      renderMoney();
      renderSummary();
      return { text: 'Marcado comprado: «' + row.name + '». Si estaba en despensa, sumé la cantidad.' };
    }

    m = t.match(/^(?:elimina|eliminar|borra|quitar)\s+(?:producto\s+)?(.+)$/);
    if (m) {
      const n = normalize(m[1]);
      const money = ensureMoney();
      const beforeP = money.pantry.length;
      const beforeS = money.shopping.length;
      money.pantry = money.pantry.filter((p) => normalize(p.name) !== n);
      money.shopping = money.shopping.filter((s) => normalize(s.name) !== n);
      saveState();
      renderMoney();
      renderSummary();
      if (beforeP === money.pantry.length && beforeS === money.shopping.length) {
        return { text: 'No encontré «' + m[1] + '» en despensa ni en lista.' };
      }
      return { text: 'Eliminado «' + m[1].trim() + '» de despensa/lista.' };
    }

    m = t.match(/^(?:compara|comparar|precios?|buscar)\s+(.+)$/);
    if (m) {
      const product = m[1].trim();
      showCompare(product);
      const links = searchLinksFor(product);
      return {
        text: 'Comparar «' + product + '»: he generado botones de búsqueda real (Google Shopping, Mercadona, Carrefour, Google). Los precios se consultan en la web al pulsar. No invento ofertas ni precios. Nunca compro ni pago sola.',
        links: links
      };
    }

    if (/no compres|pagar|compra tu|haz la compra/.test(t)) {
      return {
        text: 'No puedo comprar ni pagar. Solo organizo despensa/lista y abro búsquedas para que compares tú en la web.'
      };
    }

    return {
      text: 'Prueba «añade arroz qty 1 min 2», «qué falta», «lista compra» o «comparar leche». Escribe «ayuda» para la lista completa.'
    };
  }

  function handleUserMessage(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed) return;
    addChat('user', trimmed);
    let reply;
    let links = null;
    if (state.agent === 'secretaria') reply = replySecretaria(trimmed);
    else if (state.agent === 'enfermera') reply = replyEnfermera(trimmed);
    else if (state.agent === 'psicologa') reply = replyPsicologa(trimmed);
    else {
      const r = replyMoney(trimmed);
      reply = r.text;
      links = r.links || null;
    }
    addChat('bot', reply, links);
  }

  /* ---------- Manual form ---------- */
  el.manualForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    const fd = new FormData(el.manualForm);
    const partial = { source: 'manual' };
    let count = 0;
    ['peso', 'pasos', 'pulso', 'sueno', 'agua'].forEach((k) => {
      const v = fd.get(k);
      if (v !== null && String(v).trim() !== '') {
        const num = parseFloat(String(v).replace(',', '.'));
        if (!isNaN(num)) {
          partial[k] = k === 'pasos' || k === 'pulso' || k === 'agua' ? Math.round(num) : num;
          count++;
        }
      }
    });
    const animo = fd.get('animo');
    if (animo !== null && String(animo).trim() !== '') {
      partial.animo = parseInt(String(animo), 10);
      state.moods.push({ score: partial.animo, ts: nowIso(), note: 'manual' });
      count++;
    }
    const tarea = String(fd.get('tarea') || '').trim();
    if (tarea) {
      state.tasks.push({ text: tarea, done: false, ts: nowIso() });
      count++;
    }
    if (!count) {
      setToolsStatus('Rellena al menos un campo.', 'warn');
      return;
    }
    if (partial.peso != null || partial.pasos != null || partial.pulso != null ||
        partial.sueno != null || partial.agua != null || partial.animo != null) {
      pushMetric(partial);
    } else {
      saveState();
    }
    el.manualForm.reset();
    renderTasks();
    renderSummary();
    setToolsStatus('Datos guardados en este dispositivo.', 'ok');
  });

  /* ---------- Money UI events ---------- */
  if (el.moneyBudgetForm) {
    el.moneyBudgetForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      const v = parseFloat(String(el.moneyBudget.value || '250').replace(',', '.'));
      if (isNaN(v) || v < 0) {
        setMoneyStatus('Presupuesto no válido.', 'warn');
        return;
      }
      ensureMoney().budget = v;
      saveState();
      renderSummary();
      setMoneyStatus('Presupuesto orientativo: ' + v + ' € (editable, no es gasto real).', 'ok');
    });
  }

  if (el.moneyProductForm) {
    el.moneyProductForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      const fd = new FormData(el.moneyProductForm);
      const name = String(fd.get('name') || '').trim();
      const qty = parseFloat(String(fd.get('qty') || '1').replace(',', '.'));
      const min = parseFloat(String(fd.get('min') || '1').replace(',', '.'));
      if (!name) return;
      const item = upsertPantry(name, isNaN(qty) ? 1 : qty, isNaN(min) ? 1 : min);
      if (needQty(item) > 0) addToShopping(item.name, needQty(item));
      el.moneyProductForm.reset();
      el.moneyProductForm.querySelector('[name=qty]').value = '1';
      el.moneyProductForm.querySelector('[name=min]').value = '1';
      renderMoney();
      renderSummary();
      setMoneyStatus('Producto «' + item.name + '» guardado en despensa.', 'ok');
    });
  }

  function onMoneyPanelClick(ev) {
    const btn = ev.target.closest('[data-act]');
    if (btn) {
      const act = btn.getAttribute('data-act');
      if (act === 'compare') {
        const name = btn.getAttribute('data-name');
        showCompare(name);
        setAgent('money');
        addChat('bot', 'Comparar «' + name + '»: botones listos abajo y aquí. Precios solo en la web; no compro ni pago.', searchLinksFor(name));
        setMoneyStatus('Búsquedas abiertas para «' + name + '».', 'ok');
        return;
      }
      if (act === 'shop') {
        const name = btn.getAttribute('data-name');
        const pan = findPantryByName(name);
        addToShopping(name, pan ? needQty(pan) || 1 : 1);
        renderMoney();
        renderSummary();
        setMoneyStatus('«' + name + '» añadido a lista de compra.', 'ok');
        return;
      }
      if (act === 'del-pantry') {
        const id = btn.getAttribute('data-id');
        ensureMoney().pantry = ensureMoney().pantry.filter((p) => p.id !== id);
        saveState();
        renderMoney();
        renderSummary();
        setMoneyStatus('Producto eliminado de despensa.', 'ok');
        return;
      }
      if (act === 'del-shop') {
        const id = btn.getAttribute('data-id');
        ensureMoney().shopping = ensureMoney().shopping.filter((s) => s.id !== id);
        saveState();
        renderMoney();
        renderSummary();
        setMoneyStatus('Ítem eliminado de la lista.', 'ok');
        return;
      }
    }
    const box = ev.target.closest('input[data-shop-id]');
    if (box) {
      const id = box.getAttribute('data-shop-id');
      const row = ensureMoney().shopping.find((s) => s.id === id);
      if (!row) return;
      row.bought = !!box.checked;
      if (row.bought) {
        const pan = findPantryByName(row.name);
        if (pan) {
          pan.qty = Number(pan.qty) + Number(row.qty || 0);
          pan.updatedAt = nowIso();
        }
      }
      saveState();
      renderMoney();
      renderSummary();
    }
  }

  if (el.pantryList) el.pantryList.addEventListener('click', onMoneyPanelClick);
  if (el.shoppingList) {
    el.shoppingList.addEventListener('click', onMoneyPanelClick);
    el.shoppingList.addEventListener('change', onMoneyPanelClick);
  }

  if (el.btnMoneyFaltan) {
    el.btnMoneyFaltan.addEventListener('click', function () {
      setAgent('money');
      handleUserMessage('qué falta');
    });
  }
  if (el.btnMoneyLista) {
    el.btnMoneyLista.addEventListener('click', function () {
      setAgent('money');
      handleUserMessage('lista compra');
    });
  }

  /* ---------- Bluetooth ---------- */
  async function connectBluetooth() {
    if (!navigator.bluetooth) {
      setBtStatus(
        'Este navegador no soporta Web Bluetooth. Usa Chrome/Edge en Android o escritorio con HTTPS. La entrada manual siempre está disponible; no inventamos datos.',
        'warn'
      );
      return;
    }
    setBtStatus('Abriendo selector de dispositivos…', '');
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'battery_service',
          'heart_rate',
          'weight_scale',
          'body_composition',
          'health_thermometer'
        ]
      });
      btDevice = device;
      const name = device.name || device.id || 'Dispositivo sin nombre';
      state.bluetooth = { name: name, connectedAt: nowIso() };
      saveState();
      renderSummary();
      setBtStatus(
        'Dispositivo seleccionado: «' + name + '». Compatibilidad real depende del periférico y del navegador. No se inventan lecturas: si no hay notificaciones GATT, usa entrada manual.',
        'ok'
      );

      device.addEventListener('gattserverdisconnected', function () {
        setBtStatus('Desconectado: «' + name + '». Puedes volver a conectar o usar entrada manual.', 'warn');
      });

      try {
        if (device.gatt) {
          const server = await device.gatt.connect();
          setBtStatus(
            'GATT conectado a «' + name + '». Intentando servicios opcionales (batería / ritmo / peso)…',
            'ok'
          );
          const tryRead = async (serviceUuid, charUuid, label, parser) => {
            try {
              const service = await server.getPrimaryService(serviceUuid);
              const characteristic = await service.getCharacteristic(charUuid);
              const value = await characteristic.readValue();
              const parsed = parser(value);
              if (parsed != null) {
                pushMetric(Object.assign({ source: 'bluetooth:' + name }, parsed));
                renderSummary();
                setBtStatus('Lectura BT (' + label + ') desde «' + name + '»: ' + JSON.stringify(parsed), 'ok');
              }
            } catch (err) { /* servicio no disponible */ }
          };
          await tryRead('battery_service', 'battery_level', 'batería', function (dv) {
            return { nota_bt: 'batería ' + dv.getUint8(0) + '%' };
          });
          await tryRead('heart_rate', 'heart_rate_measurement', 'pulso', function (dv) {
            const flags = dv.getUint8(0);
            const rate = (flags & 0x1) ? dv.getUint16(1, true) : dv.getUint8(1);
            return { pulso: rate };
          });
        }
      } catch (gattErr) {
        setBtStatus(
          'Dispositivo «' + name + '» seleccionado, pero no se pudo completar GATT (' +
          (gattErr && gattErr.message ? gattErr.message : 'error') +
          '). No inventamos datos. Usa entrada manual.',
          'warn'
        );
      }
    } catch (err) {
      const msg = (err && err.name === 'NotFoundError')
        ? 'No se eligió ningún dispositivo (cancelado).'
        : ('Bluetooth: ' + (err && err.message ? err.message : String(err)));
      setBtStatus(msg + ' Entrada manual disponible. No se registran datos inventados.', 'warn');
    }
  }

  el.btnBt.addEventListener('click', function () { connectBluetooth(); });
  el.btnBtClear.addEventListener('click', function () {
    state.bluetooth = { name: null, connectedAt: null };
    btDevice = null;
    saveState();
    renderSummary();
    setBtStatus('Estado Bluetooth limpiado. Entrada manual disponible.', 'ok');
  });

  /* ---------- Speech ---------- */
  function setupSpeech() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      el.btnMic.title = 'Dictado no disponible en este navegador';
      el.btnMic.disabled = true;
      return;
    }
    recognition = new SR();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = function (event) {
      const text = event.results[0][0].transcript;
      el.chatInput.value = text;
      handleUserMessage(text);
      el.chatInput.value = '';
    };
    recognition.onend = function () {
      listening = false;
      el.btnMic.classList.remove('listening');
    };
    recognition.onerror = function () {
      listening = false;
      el.btnMic.classList.remove('listening');
    };
  }

  el.btnMic.addEventListener('click', function () {
    if (!recognition) return;
    if (listening) {
      recognition.stop();
      return;
    }
    listening = true;
    el.btnMic.classList.add('listening');
    try { recognition.start(); } catch (e) {
      listening = false;
      el.btnMic.classList.remove('listening');
    }
  });

  /* ---------- Composer & agents ---------- */
  el.tabs.forEach((tab) => {
    tab.addEventListener('click', function () {
      setAgent(tab.dataset.agent);
    });
  });

  el.composer.addEventListener('submit', function (ev) {
    ev.preventDefault();
    const text = el.chatInput.value;
    el.chatInput.value = '';
    handleUserMessage(text);
  });

  el.btnClearChat.addEventListener('click', function () {
    state.chats[state.agent] = [];
    saveState();
    renderChat();
  });

  el.habitChips.addEventListener('click', function (ev) {
    const btn = ev.target.closest('[data-habit]');
    if (!btn) return;
    toggleHabit(btn.getAttribute('data-habit'));
  });

  el.taskList.addEventListener('change', function (ev) {
    const box = ev.target.closest('input[data-task]');
    if (!box) return;
    const idx = parseInt(box.getAttribute('data-task'), 10);
    if (isNaN(idx) || !state.tasks[idx]) return;
    state.tasks[idx].done = !!box.checked;
    saveState();
    renderTasks();
    renderSummary();
  });

  /* ---------- Export / WhatsApp / Clear ---------- */
  function buildSummaryText() {
    ensureMoney();
    const lines = ['MAY OS · Cuidado personal — resumen', 'Fecha: ' + todayKey()];
    ['peso', 'pasos', 'pulso', 'sueno', 'agua', 'animo'].forEach((k) => {
      const m = latestMetric(k);
      if (m) lines.push(k + ': ' + m[k] + ' (' + fmtTime(m.ts) + ')');
    });
    const day = ensureHabitsDay();
    lines.push('Hábitos: ' + (HABITS.filter((h) => day[h.id]).map((h) => h.label).join(', ') || 'ninguno'));
    lines.push('Tareas pendientes: ' + state.tasks.filter((t) => !t.done).length);
    lines.push('Presupuesto comida orientativo: ' + ensureMoney().budget + ' €');
    const missing = itemsMissing();
    if (missing.length) {
      lines.push('Falta: ' + missing.map((p) => p.name + '×' + needQty(p)).join(', '));
    }
    const shop = ensureMoney().shopping.filter((s) => !s.bought);
    if (shop.length) {
      lines.push('Lista compra: ' + shop.map((s) => s.name + '×' + s.qty).join(', '));
    }
    const labs = ensureLabs();
    if (labs.length) {
      lines.push('Análisis clínicos: ' + labs.length + ' registros');
      labs.slice(-3).forEach(function (L) {
        lines.push('- ' + L.date + ' ' + L.test + '=' + L.value + (L.unit ? L.unit : ''));
      });
    }
    const pr = ensurePrefs();
    if (pr.x_likes || pr.yt_likes) lines.push('Preferencias X/YT (local): ' + (pr.x_likes || '—') + ' / ' + (pr.yt_likes || '—'));
    lines.push('Seguimiento personal · No es diagnóstico médico.');
    lines.push('Money Digital no compra ni paga sola; precios solo en la web.');
    return lines.join('\n');
  }

  el.btnExport.addEventListener('click', function () {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'may-cuidado-' + todayKey() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setToolsStatus('JSON exportado.', 'ok');
  });

  el.btnWhatsapp.addEventListener('click', function () {
    const text = buildSummaryText();
    const url = 'https://wa.me/?text=' + encodeURIComponent(text);
    window.open(url, '_blank', 'noopener,noreferrer');
    setToolsStatus('Se abrió un borrador de WhatsApp (no se envía solo).', 'ok');
  });

  el.btnClear.addEventListener('click', function () {
    const ok = window.confirm('¿Borrar todos los datos locales de MAY Cuidado (métricas, tareas, chats, hábitos, despensa y fotos)?');
    if (!ok) return;
    state = defaultState();
    saveState();
    photoClearAll().catch(function () {}).then(function () {
      closePreview();
      renderAll();
      setToolsStatus('Datos locales borrados (incluye fotos IndexedDB).', 'ok');
    });
  });

  function seedWelcome() {
    const welcomes = {
      secretaria: 'Hola, soy tu Secretaria. Tareas, hábitos y contactos salientes (mailto/tel/WhatsApp/X — tú confirmas). Preferencias X/YouTube locales. Di «ayuda».',
      enfermera: 'Hola, soy Enfermera · Agente Salud. Métricas, análisis clínicos, recetas mediterráneas, menú semanal y consejos orientativos (no médicos). OCR local opcional con confirmación. Di «ayuda», «recetas», «consejos» u «ocr».',
      psicologa: 'Hola, soy tu Psicóloga amiga protectora. NO a compras impulsivas, drogas/alcohol y autolesión. No sustituyo familia/pareja ni diagnostico. 112 · 024. Di «ayuda» o «respiración».',
      money: 'Hola, soy Money Digital · Compra inteligente. Despensa, lista, presupuesto orientativo (250 € editable) y fotos locales de producto/etiqueta/recibo (sin OCR). No invento precios ni compro/pago sola. Di «ayuda» o «comparar leche».'
    };
    Object.keys(AGENTS).forEach((id) => {
      if (!state.chats[id] || !state.chats[id].length) {
        state.chats[id] = [{ role: 'bot', text: welcomes[id], ts: nowIso() }];
      }
    });
    saveState();
  }

  function renderAll() {
    ensureHabitsDay();
    ensureMoney();
    ensureLabs();
    setAgent(state.agent || 'secretaria');
    renderSummary();
    renderHabits();
    renderTasks();
    renderMoney();
    renderRecipes();
    renderWeeklyMenu();
    renderLabs();
    renderLifestyleTips();
    renderEmotionUI();
    renderChat();
    renderGallery().catch(function () {});
    if (state.bluetooth && state.bluetooth.name) {
      setBtStatus('Último dispositivo recordado: «' + state.bluetooth.name + '». Vuelve a pulsar Conectar si hace falta.', 'ok');
    }
  }



  /* ---------- Vídeos guía por agente ---------- */
  const GUIDE_VIDEOS = {
    secretaria: {
      title: 'Vídeo: cómo funciona · Secretaria',
      src: 'media/secretaria/guia-secretaria.mp4',
      poster: 'media/secretaria/poster.jpg',
      help: 'Demostración: tareas, hábitos, mailto/tel/WhatsApp/X y preferencias locales. Datos de ejemplo.'
    },
    salud: {
      title: 'Vídeo: cómo funciona · Salud',
      src: 'media/salud/guia-salud.mp4',
      poster: 'media/salud/poster.jpg',
      help: 'Demostración: métricas, análisis de ejemplo (no clínicos reales), recetas→Money, OCR y Samsung import.'
    },
    psicologa: {
      title: 'Vídeo: cómo funciona · Psicóloga',
      src: 'media/psicologa/guia-psicologa.mp4',
      poster: 'media/psicologa/poster.jpg',
      help: 'Rueda La Huertecica (Eva y Pedro), límites protectores y simulación de escena. No es diagnóstico.'
    },
    money: {
      title: 'Vídeo: cómo funciona · Money',
      src: 'media/money/guia-money.mp4',
      poster: 'media/money/poster.jpg',
      help: 'Despensa, mínimos, lista, presupuesto orientativo y comparar en la web sin inventar precios.'
    }
  };

  function openGuideVideo(key) {
    const meta = GUIDE_VIDEOS[key];
    if (!meta) return;
    const panel = document.getElementById('panel-video-guia');
    const player = document.getElementById('video-guia-player');
    const source = document.getElementById('video-guia-source');
    const title = document.getElementById('video-guia-title');
    const help = document.getElementById('video-guia-help');
    const status = document.getElementById('video-guia-status');
    if (!panel || !player || !source) return;
    title.textContent = meta.title;
    help.textContent = meta.help;
    player.poster = meta.poster;
    source.src = meta.src;
    player.load();
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (status) {
      status.textContent = 'Pulsa play. preload=none: el vídeo se descarga al reproducir. Guía DEMO.';
      status.className = 'status-line ok';
    }
    // switch agent tab to match
    const agentMap = { secretaria: 'secretaria', salud: 'enfermera', psicologa: 'psicologa', money: 'money' };
    if (agentMap[key]) setAgent(agentMap[key]);
  }

  function wireGuideVideos() {
    document.querySelectorAll('[data-guide-video]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openGuideVideo(btn.getAttribute('data-guide-video'));
      });
    });
    const close = document.getElementById('btn-video-close');
    const panel = document.getElementById('panel-video-guia');
    const player = document.getElementById('video-guia-player');
    if (close) {
      close.addEventListener('click', function () {
        if (player) { try { player.pause(); } catch (e) {} }
        if (panel) panel.hidden = true;
      });
    }
  }


  /* ---------- PWA install + GoatCounter (clics) ---------- */
  const INSTALL_CLICK_KEY = 'may_cuidado_install_click_counted_v1';
  const INSTALL_LOCAL_COUNT_KEY = 'may_cuidado_install_local_count_v1';
  let deferredInstallPrompt = null;

  function getLocalInstallClicks() {
    const n = parseInt(localStorage.getItem(INSTALL_LOCAL_COUNT_KEY) || '0', 10);
    return isNaN(n) ? 0 : n;
  }

  function bumpLocalInstallClicks() {
    const n = getLocalInstallClicks() + 1;
    localStorage.setItem(INSTALL_LOCAL_COUNT_KEY, String(n));
    return n;
  }

  function renderInstallLocalCount() {
    const el = document.getElementById('install-local-count');
    if (!el) return;
    el.textContent = 'Instalaciones en este dispositivo (clics del botón): ' + getLocalInstallClicks();
  }

  function setInstallStatus(msg, kind) {
    const el = document.getElementById('install-status');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'status-line' + (kind ? ' ' + kind : '');
  }

  function trackInstallClickOnce() {
    // Contador local siempre (honesto: clics en este dispositivo)
    const localN = bumpLocalInstallClicks();
    renderInstallLocalCount();

    // GoatCounter público: un solo evento por dispositivo (localStorage), path /may-cuidado/instalar
    let sentGlobal = false;
    try {
      if (!localStorage.getItem(INSTALL_CLICK_KEY)) {
        if (window.goatcounter && typeof window.goatcounter.count === 'function') {
          window.goatcounter.count({ path: '/may-cuidado/instalar', title: 'MAY Cuidado · clic Instalar PWA', event: true });
          localStorage.setItem(INSTALL_CLICK_KEY, '1');
          sentGlobal = true;
        }
      }
    } catch (e) { /* ignore */ }

    return { localN: localN, sentGlobal: sentGlobal };
  }

  function wirePwaInstall() {
    renderInstallLocalCount();
    const btn = document.getElementById('btn-install-pwa');
    const fallback = document.getElementById('install-fallback');
    if (!btn) return;

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredInstallPrompt = e;
      btn.disabled = false;
      if (fallback) fallback.hidden = true;
      setInstallStatus('Listo para instalar (Chrome/Edge). El contador registra clics, no instalaciones reales del SO.', 'ok');
    });

    window.addEventListener('appinstalled', function () {
      deferredInstallPrompt = null;
      setInstallStatus('El navegador reportó appinstalada. Datos siguen solo en este dispositivo.', 'ok');
    });

    // If no beforeinstallprompt after short wait, show fallback instructions (Android Chrome menu)
    setTimeout(function () {
      if (!deferredInstallPrompt && fallback) {
        fallback.hidden = false;
        setInstallStatus('Si no aparece el diálogo nativo: usa el menú de Chrome → Instalar aplicación. Contador = clics del botón.', 'warn');
      }
    }, 2500);

    btn.addEventListener('click', async function () {
      const tracked = trackInstallClickOnce();
      let msg = 'Clic registrado. Local: ' + tracked.localN + ' en este dispositivo.';
      if (tracked.sentGlobal) msg += ' Evento GoatCounter /may-cuidado/instalar (una vez por dispositivo).';
      else if (localStorage.getItem(INSTALL_CLICK_KEY)) msg += ' Evento global ya contado antes en este dispositivo (sin duplicar).';
      else msg += ' GoatCounter aún no cargó: queda el contador local (no inventamos cifra global).';
      msg += ' Aviso: son clics de instalación, no instalaciones reales garantizadas.';

      if (deferredInstallPrompt) {
        try {
          deferredInstallPrompt.prompt();
          const choice = await deferredInstallPrompt.userChoice;
          deferredInstallPrompt = null;
          msg += ' Resultado diálogo: ' + (choice && choice.outcome ? choice.outcome : 'desconocido') + '.';
        } catch (e) {
          msg += ' No se pudo abrir el diálogo nativo; usa el menú del navegador.';
          if (fallback) fallback.hidden = false;
        }
      } else {
        if (fallback) fallback.hidden = false;
        msg += ' Abre el menú ⋮ de Chrome → Instalar aplicación / Añadir a pantalla de inicio.';
      }
      setInstallStatus(msg, 'ok');
    });
  }


  /* ---------- PWA ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./service-worker.js').catch(function () { /* file:// */ });
    });
  }


  /* ---------- Fotos locales (IndexedDB) ---------- */
  const PHOTO_DB = 'may_cuidado_photos';
  const PHOTO_STORE = 'photos';
  const PHOTO_MAX_EDGE = 1600;
  const PHOTO_JPEG_QUALITY = 0.72;
  const PHOTO_MAX_SOURCE_BYTES = 12 * 1024 * 1024; // 12 MB origen (honesto)
  const PHOTO_MAX_SAVED = 40;
  const PHOTO_WARN_SAVED_BYTES = 1.5 * 1024 * 1024;
  let photoDbPromise = null;
  let previewPhotoId = null;

  function openPhotoDb() {
    if (photoDbPromise) return photoDbPromise;
    photoDbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB no disponible'));
        return;
      }
      const req = indexedDB.open(PHOTO_DB, 1);
      req.onupgradeneeded = function () {
        const db = req.result;
        if (!db.objectStoreNames.contains(PHOTO_STORE)) {
          const store = db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
          store.createIndex('by_cat', 'category', { unique: false });
          store.createIndex('by_ts', 'createdAt', { unique: false });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('IDB open failed')); };
    });
    return photoDbPromise;
  }

  function idbReq(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  async function photoPut(record) {
    const db = await openPhotoDb();
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).put(record);
    return new Promise(function (resolve, reject) {
      tx.oncomplete = function () { resolve(record); };
      tx.onerror = function () { reject(tx.error); };
    });
  }

  async function photoGetAll() {
    const db = await openPhotoDb();
    return idbReq(db.transaction(PHOTO_STORE, 'readonly').objectStore(PHOTO_STORE).getAll());
  }

  async function photoGet(id) {
    const db = await openPhotoDb();
    return idbReq(db.transaction(PHOTO_STORE, 'readonly').objectStore(PHOTO_STORE).get(id));
  }

  async function photoDelete(id) {
    const db = await openPhotoDb();
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).delete(id);
    return new Promise(function (resolve, reject) {
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  }

  async function photoClearAll() {
    const db = await openPhotoDb();
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).clear();
    return new Promise(function (resolve, reject) {
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  }

  function loadImageFromFile(file) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo leer la imagen'));
      };
      img.src = url;
    });
  }

  async function compressImageFile(file) {
    if (!file || !String(file.type || '').startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen (image/*).');
    }
    if (file.size > PHOTO_MAX_SOURCE_BYTES) {
      throw new Error('La imagen pesa más de 12 MB. Elige otra más ligera (límite honesto de origen).');
    }
    const img = await loadImageFromFile(file);
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    const edge = Math.max(w, h);
    const scale = edge > PHOTO_MAX_EDGE ? (PHOTO_MAX_EDGE / edge) : 1;
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', PHOTO_JPEG_QUALITY);
    const approxBytes = Math.ceil((dataUrl.length - 'data:image/jpeg;base64,'.length) * 0.75);
    return {
      dataUrl: dataUrl,
      width: w,
      height: h,
      bytes: approxBytes,
      mime: 'image/jpeg'
    };
  }

  function setGalleryStatus(msg, kind) {
    const node = document.getElementById('gallery-status');
    if (!node) return;
    node.textContent = msg || '';
    node.className = 'status-line' + (kind ? ' ' + kind : '');
  }

  function setPhotoFormStatus(which, msg, kind) {
    const node = document.getElementById(which === 'salud' ? 'salud-photo-status' : 'money-photo-status');
    if (!node) return;
    node.textContent = msg || '';
    node.className = 'status-line' + (kind ? ' ' + kind : '');
  }

  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(2) + ' MB';
  }

  async function savePhotoRecord(category, kind, note, file) {
    const all = await photoGetAll();
    if (all.length >= PHOTO_MAX_SAVED) {
      throw new Error('Límite local: máximo ' + PHOTO_MAX_SAVED + ' fotos. Borra alguna antes.');
    }
    const compressed = await compressImageFile(file);
    const record = {
      id: uid(),
      category: category,
      kind: kind || (category === 'salud' ? 'analisis' : 'producto'),
      note: String(note || '').trim(),
      createdAt: nowIso(),
      mime: compressed.mime,
      width: compressed.width,
      height: compressed.height,
      bytes: compressed.bytes,
      dataUrl: compressed.dataUrl
    };
    await photoPut(record);
    return { record: record, warnBig: compressed.bytes > PHOTO_WARN_SAVED_BYTES };
  }

  async function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    const filterEl = document.getElementById('gallery-filter');
    if (!grid) return;
    let items = [];
    try {
      items = await photoGetAll();
    } catch (e) {
      grid.innerHTML = '<p class="help-tips">No se pudo abrir la galería local (' + escapeHtml(e.message || e) + ').</p>';
      return;
    }
    items.sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
    const filter = filterEl ? filterEl.value : 'all';
    if (filter !== 'all') items = items.filter(function (p) { return p.category === filter; });
    if (!items.length) {
      grid.innerHTML = '<p class="help-tips">Sin fotos todavía. Usa Salud o Money para capturar/subir una imagen local.</p>';
      return;
    }
    grid.innerHTML = items.map(function (p) {
      const catLabel = p.category === 'salud' ? 'Salud' : 'Money';
      const kindLabel = p.kind || '—';
      return '<button type="button" class="gallery-card" data-photo-id="' + escapeHtml(p.id) + '">' +
        '<img src="' + p.dataUrl + '" alt="" loading="lazy" />' +
        '<div class="g-meta"><div class="g-cat">' + escapeHtml(catLabel + ' · ' + kindLabel) + '</div>' +
        '<div>' + escapeHtml(fmtTime(p.createdAt)) + '</div>' +
        '<div>' + escapeHtml(p.note || '(sin texto)') + '</div>' +
        '<div style="color:var(--muted)">' + escapeHtml(p.width + '×' + p.height + ' · ' + fmtBytes(p.bytes || 0)) + '</div>' +
        '</div></button>';
    }).join('');
  }

  async function openPreview(id) {
    const box = document.getElementById('gallery-preview');
    const img = document.getElementById('gallery-preview-img');
    const meta = document.getElementById('gallery-preview-meta');
    const rec = await photoGet(id);
    if (!rec || !box) return;
    previewPhotoId = id;
    img.src = rec.dataUrl;
    meta.textContent = (rec.category === 'salud' ? 'Salud' : 'Money') + ' · ' + (rec.kind || '—') +
      ' · ' + fmtTime(rec.createdAt) + ' · ' + (rec.note || '(sin texto)') +
      ' · ' + rec.width + '×' + rec.height + ' · ' + fmtBytes(rec.bytes || 0) +
      ' · Solo local · Sin OCR automático';
    box.classList.remove('hidden');
  }

  function closePreview() {
    previewPhotoId = null;
    const box = document.getElementById('gallery-preview');
    const img = document.getElementById('gallery-preview-img');
    if (box) box.classList.add('hidden');
    if (img) img.removeAttribute('src');
  }

  async function handlePhotoForm(category, form) {
    const fd = new FormData(form);
    const file = fd.get('photo');
    const note = fd.get('note');
    const kind = String(fd.get('kind') || (category === 'salud' ? 'analisis' : 'producto'));
    if (!file || !(file instanceof Blob) || !file.size) {
      setPhotoFormStatus(category, 'Elige o captura una imagen.', 'warn');
      return;
    }
    setPhotoFormStatus(category, 'Optimizando JPEG (máx. 1600 px)…', '');
    try {
      const result = await savePhotoRecord(category, kind, note, file);
      form.reset();
      let msg = 'Foto guardada en este dispositivo (' + fmtBytes(result.record.bytes) + ', ' +
        result.record.width + '×' + result.record.height + '). Sin subida ni OCR automático.';
      if (result.warnBig) msg += ' Aviso: sigue siendo pesada (>1,5 MB); el espacio del navegador es limitado.';
      setPhotoFormStatus(category, msg, 'ok');
      await renderGallery();
      renderSummary();
    } catch (e) {
      setPhotoFormStatus(category, e.message || String(e), 'warn');
    }
  }

  function wirePhotos() {
    const saludForm = document.getElementById('salud-photo-form');
    const moneyForm = document.getElementById('money-photo-form');
    if (saludForm) {
      saludForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        handlePhotoForm('salud', saludForm);
      });
    }
    if (moneyForm) {
      moneyForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        handlePhotoForm('money', moneyForm);
      });
    }
    const grid = document.getElementById('gallery-grid');
    if (grid) {
      grid.addEventListener('click', function (ev) {
        const card = ev.target.closest('[data-photo-id]');
        if (!card) return;
        openPreview(card.getAttribute('data-photo-id'));
      });
    }
    const filter = document.getElementById('gallery-filter');
    if (filter) filter.addEventListener('change', function () { renderGallery(); });
    const btnClose = document.getElementById('btn-preview-close');
    const btnDel = document.getElementById('btn-preview-delete');
    if (btnClose) btnClose.addEventListener('click', closePreview);
    if (btnDel) {
      btnDel.addEventListener('click', async function () {
        if (!previewPhotoId) return;
        const ok = window.confirm('¿Borrar esta foto local? No se puede deshacer.');
        if (!ok) return;
        try {
          await photoDelete(previewPhotoId);
          closePreview();
          setGalleryStatus('Foto borrada.', 'ok');
          await renderGallery();
          renderSummary();
        } catch (e) {
          setGalleryStatus('No se pudo borrar: ' + (e.message || e), 'warn');
        }
      });
    }
  }



  function parseSamsungCsv(text) {
    const lines = String(text || '').replace(/^\ufeff/, '').split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (lines.length < 2) throw new Error('CSV vacío o sin datos');
    const sep = (lines[0].split(';').length > lines[0].split(',').length) ? ';' : ',';
    const headers = lines[0].split(sep).map(function (h) { return normalize(h.replace(/"/g, '')); });
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(sep).map(function (c) { return c.replace(/^"|"$/g, '').trim(); });
      const obj = {};
      headers.forEach(function (h, idx) { obj[h] = cols[idx]; });
      rows.push(obj);
    }
    return rows;
  }

  function mapSamsungRow(row) {
    const keys = Object.keys(row);
    const find = function (cands) {
      for (let i = 0; i < keys.length; i++) {
        for (let j = 0; j < cands.length; j++) {
          if (keys[i].indexOf(cands[j]) >= 0) return row[keys[i]];
        }
      }
      return null;
    };
    const out = { source: 'samsung-import' };
    const w = find(['weight', 'peso', 'peso_kg', 'weight_kg']);
    const s = find(['step', 'pasos', 'steps_count', 'conteo_de_pasos']);
    const hr = find(['heart', 'pulso', 'heart_rate', 'fc', 'bpm']);
    const sl = find(['sleep', 'sueno', 'sueño', 'sleep_duration', 'duration_sleep']);
    const dt = find(['date', 'fecha', 'start_time', 'day_time', 'com.samsung']);
    if (w != null && w !== '' && !isNaN(parseFloat(String(w).replace(',', '.')))) out.peso = parseFloat(String(w).replace(',', '.'));
    if (s != null && s !== '' && !isNaN(parseFloat(String(s).replace(',', '.')))) out.pasos = Math.round(parseFloat(String(s).replace(',', '.')));
    if (hr != null && hr !== '' && !isNaN(parseFloat(String(hr).replace(',', '.')))) out.pulso = Math.round(parseFloat(String(hr).replace(',', '.')));
    if (sl != null && sl !== '') {
      let hours = parseFloat(String(sl).replace(',', '.'));
      if (!isNaN(hours)) {
        if (hours > 24) hours = hours / 60; // minutos -> horas
        out.sueno = Math.round(hours * 10) / 10;
      }
    }
    if (dt) out.ts = dt;
    const useful = out.peso != null || out.pasos != null || out.pulso != null || out.sueno != null;
    return useful ? out : null;
  }

  function importSamsungPayload(raw, filename) {
    let rows = [];
    const name = String(filename || '').toLowerCase();
    const text = String(raw || '');
    if (name.endsWith('.json') || text.trim().charAt(0) === '[' || text.trim().charAt(0) === '{') {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) rows = parsed;
      else if (parsed && Array.isArray(parsed.data)) rows = parsed.data;
      else if (parsed && typeof parsed === 'object') rows = [parsed];
      else throw new Error('JSON no reconocible');
      rows = rows.map(function (r) {
        const flat = {};
        Object.keys(r || {}).forEach(function (k) { flat[normalize(String(k))] = r[k]; });
        return flat;
      });
    } else {
      rows = parseSamsungCsv(text);
    }
    let added = 0;
    rows.forEach(function (row) {
      const mapped = mapSamsungRow(row);
      if (!mapped) return;
      const entry = { source: 'samsung-import', ts: nowIso() };
      if (mapped.peso != null) entry.peso = mapped.peso;
      if (mapped.pasos != null) entry.pasos = mapped.pasos;
      if (mapped.pulso != null) entry.pulso = mapped.pulso;
      if (mapped.sueno != null) entry.sueno = mapped.sueno;
      if (mapped.ts) {
        const d = Date.parse(mapped.ts);
        if (!isNaN(d)) entry.ts = new Date(d).toISOString();
      }
      state.metrics.push(entry);
      added++;
    });
    if (state.metrics.length > 400) state.metrics = state.metrics.slice(-400);
    saveState();
    return added;
  }

  function wireHealthUI() {
    const labsForm = document.getElementById('labs-form');
    const labDate = document.getElementById('lab-date');
    if (labDate && !labDate.value) labDate.value = todayKey();
    if (labsForm) {
      labsForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const fd = new FormData(labsForm);
        const rec = {
          id: uid(),
          date: String(fd.get('date') || todayKey()),
          person: String(fd.get('person') || '').trim(),
          test: String(fd.get('test') || '').trim(),
          value: String(fd.get('value') || '').trim(),
          unit: String(fd.get('unit') || '').trim(),
          note: String(fd.get('note') || '').trim(),
          ts: nowIso()
        };
        if (!rec.person || !rec.test || !rec.value) {
          setLabsStatus('Faltan campos obligatorios.', 'warn');
          return;
        }
        ensureLabs().push(rec);
        saveState();
        labsForm.reset();
        if (labDate) labDate.value = todayKey();
        renderLabs();
        renderSummary();
        renderLifestyleTips();
        setLabsStatus('Análisis guardado localmente. No es diagnóstico médico.', 'ok');
      });
    }
    const labsList = document.getElementById('labs-list');
    if (labsList) {
      labsList.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-del-lab]');
        if (!btn) return;
        const id = btn.getAttribute('data-del-lab');
        if (!window.confirm('¿Borrar este análisis local?')) return;
        state.clinicalLabs = ensureLabs().filter(function (L) { return L.id !== id; });
        saveState();
        renderLabs();
        renderSummary();
        setLabsStatus('Análisis borrado.', 'ok');
      });
    }
    const recipes = document.getElementById('recipes-list');
    if (recipes) {
      recipes.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-send-recipe]');
        if (!btn) return;
        const id = btn.getAttribute('data-send-recipe');
        const r = recipeById(id);
        if (!r) return;
        const n = sendIngredientsToMoney(r.ingredients, r.title);
        setMoneyStatus('Money: ' + n + ' ingredientes de «' + r.title + '» añadidos a lista/despensa.', 'ok');
        setAgent('money');
      });
    }
    const btnMenu = document.getElementById('btn-menu-to-money');
    if (btnMenu) {
      btnMenu.addEventListener('click', function () {
        const ings = allWeeklyIngredients();
        const n = sendIngredientsToMoney(ings, 'menu-semanal');
        const st = document.getElementById('menu-status');
        if (st) {
          st.textContent = 'Enviados ~' + n + ' ítems del menú a Money (puede haber agregados). No es nutrición médica.';
          st.className = 'status-line ok';
        }
        setAgent('money');
      });
    }
    const btnTips = document.getElementById('btn-refresh-tips');
    if (btnTips) btnTips.addEventListener('click', function () { renderLifestyleTips(); });

    const samsungForm = document.getElementById('samsung-import-form');
    if (samsungForm) {
      samsungForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const fileInput = samsungForm.querySelector('input[name=file]');
        const file = fileInput && fileInput.files && fileInput.files[0];
        const status = document.getElementById('samsung-status');
        if (!file) {
          if (status) { status.textContent = 'Elige un archivo.'; status.className = 'status-line warn'; }
          return;
        }
        const reader = new FileReader();
        reader.onload = function () {
          try {
            const added = importSamsungPayload(reader.result, file.name);
            renderSummary();
            renderLifestyleTips();
            if (status) {
              if (added > 0) {
                status.textContent = 'Importadas ' + added + ' filas útiles desde «' + file.name + '». Revisa el resumen. Sin conexión directa a Samsung Health.';
                status.className = 'status-line ok';
              } else {
                status.textContent = 'No se mapearon columnas conocidas (steps/weight/heart_rate/sleep…). Usa registro manual o Bluetooth. No hay API web general de Samsung Health aquí.';
                status.className = 'status-line warn';
              }
            }
            samsungForm.reset();
          } catch (e) {
            if (status) {
              status.textContent = 'No se pudo importar: ' + (e.message || e) + '. Prueba otro CSV/JSON o registro manual.';
              status.className = 'status-line warn';
            }
          }
        };
        reader.onerror = function () {
          if (status) { status.textContent = 'Error leyendo el archivo.'; status.className = 'status-line warn'; }
        };
        reader.readAsText(file);
      });
    }
  }





  /* ---------- Secretaria comunicaciones + prefs ---------- */
  function ensurePrefs() {
    if (!state.prefs || typeof state.prefs !== 'object') {
      state.prefs = { x_likes: '', x_accounts: '', yt_likes: '', yt_channels: '', notes: '' };
    }
    return state.prefs;
  }

  function setComStatus(msg, kind) {
    const n = document.getElementById('com-status');
    if (!n) return;
    n.textContent = msg || '';
    n.className = 'status-line' + (kind ? ' ' + kind : '');
  }

  function fillPrefsForm() {
    const form = document.getElementById('prefs-form');
    if (!form) return;
    const p = ensurePrefs();
    ['x_likes', 'x_accounts', 'yt_likes', 'yt_channels', 'notes'].forEach(function (k) {
      const el = form.querySelector('[name="' + k + '"]');
      if (el) el.value = p[k] || '';
    });
  }

  function wireSecretariaCom() {
    fillPrefsForm();
    const emailForm = document.getElementById('com-email-form');
    if (emailForm) {
      emailForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const fd = new FormData(emailForm);
        const to = String(fd.get('to') || '').trim();
        const subject = String(fd.get('subject') || '').trim();
        const body = String(fd.get('body') || '').trim();
        if (!to) { setComStatus('Indica un correo.', 'warn'); return; }
        const url = 'mailto:' + encodeURIComponent(to).replace(/%40/g, '@') +
          '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body);
        // mailto should not encode the whole address with encodeURIComponent of full - fix:
        const mailto = 'mailto:' + to +
          '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body);
        window.location.href = mailto;
        setComStatus('Se abrió el borrador mailto: en tu cliente de correo. Tú confirmas el envío. Esta app no envía sola ni lee tu bandeja.', 'ok');
      });
    }
    const telForm = document.getElementById('com-tel-form');
    if (telForm) {
      telForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const phone = String(new FormData(telForm).get('phone') || '').trim();
        if (!phone) { setComStatus('Indica un teléfono.', 'warn'); return; }
        const ok = window.confirm('¿Iniciar llamada saliente a ' + phone + '? Tú confirmas en el dispositivo. Esta web no puede recibir llamadas.');
        if (!ok) { setComStatus('Llamada cancelada.', 'ok'); return; }
        window.location.href = 'tel:' + phone.replace(/\s+/g, '');
        setComStatus('Marcado tel: (saliente). No podemos recibir llamadas ni escuchar la conversación desde la web.', 'ok');
      });
    }
    const waForm = document.getElementById('com-wa-form');
    if (waForm) {
      waForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const fd = new FormData(waForm);
        let phone = String(fd.get('phone') || '').replace(/[^\d]/g, '');
        const text = String(fd.get('text') || '').trim();
        if (!phone) { setComStatus('Indica número WhatsApp (con código país, sin +).', 'warn'); return; }
        const url = 'https://wa.me/' + phone + (text ? '?text=' + encodeURIComponent(text) : '');
        window.open(url, '_blank', 'noopener,noreferrer');
        setComStatus('Borrador WhatsApp abierto (wa.me). Tú envías. No leemos chats privados.', 'ok');
      });
    }
    const xForm = document.getElementById('com-x-form');
    if (xForm) {
      xForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const text = String(new FormData(xForm).get('text') || '').trim();
        if (!text) { setComStatus('Escribe el texto del post.', 'warn'); return; }
        const url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
        window.open(url, '_blank', 'noopener,noreferrer');
        setComStatus('Compositor de X abierto. Revisas y publicas tú. No leemos DMs ni likes automáticamente.', 'ok');
      });
    }
    const prefsForm = document.getElementById('prefs-form');
    if (prefsForm) {
      prefsForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const fd = new FormData(prefsForm);
        const p = ensurePrefs();
        ['x_likes', 'x_accounts', 'yt_likes', 'yt_channels', 'notes'].forEach(function (k) {
          p[k] = String(fd.get(k) || '').trim();
        });
        saveState();
        setComStatus('Preferencias guardadas en localStorage. Roadmap: sin OAuth/API no se pueden leer gustos privados de X/YouTube desde la web.', 'ok');
      });
    }
  }


  /* ---------- Rueda de emociones (Psicóloga) ---------- */
  const EMOTION_STATES = [
    { id: 'alegre', label: 'Alegre', score: 1 },
    { id: 'motivado', label: 'Motivado', score: 1 },
    { id: 'tranquilo', label: 'Tranquilo', score: 1 },
    { id: 'calmado', label: 'Calmado', score: 0 },
    { id: 'cansado', label: 'Cansado', score: 0 },
    { id: 'ansioso', label: 'Ansioso', score: -1 },
    { id: 'triste', label: 'Triste', score: -1 },
    { id: 'enfadado', label: 'Enfadado', score: -1 }
  ];

  const EMOTION_CREDIT = 'Rueda de emociones · La Huertecica, creada por Eva y Pedro';

  function ensureMoods() {
    if (!Array.isArray(state.moods)) state.moods = [];
    return state.moods;
  }

  function emotionReaction(label, score) {
    const map = {
      alegre: 'Qué bonito notar alegría. Guárdalo como ancla del día. No diagnostico; solo te acompaño.',
      motivado: 'La motivación ayuda a dar un paso pequeño. ¿Una tarea mínima con la Secretaria?',
      tranquilo: 'La calma también cuenta. Respira y mantén ese ritmo sin exigirte.',
      calmado: 'Estado calmado (neutro). Si quieres, «respiración» suave o un paseo corto.',
      cansado: 'Cansancio anotado. Prioriza descanso; no es fallo. NO a forzar con estimulantes.',
      ansioso: 'Ansiedad señalada. Pausa, pies en el suelo, respiración 4-4-4. NO a compras impulsivas ni alcohol/drogas. Si hay crisis: 112 · 024.',
      triste: 'Tristeza recibida con cuidado. No estás solo/a. NO a autolesión. Habla con alguien de confianza; 112 · 024 si hace falta.',
      enfadado: 'Enfado válido. Canalízalo sin hacerte daño ni a otros. Camina o escribe; NO a consumos ni compras impulsivas.'
    };
    const base = map[label] || ('Anoté «' + label + '» (score ' + score + '). Apoyo cotidiano, no diagnóstico.');
    return base + ' · ' + EMOTION_CREDIT;
  }

  function saveEmotionEntry(label, score, note, source) {
    ensureMoods();
    const entry = {
      score: score,
      label: label,
      note: String(note || '').slice(0, 160),
      ts: nowIso(),
      source: source || 'rueda'
    };
    state.moods.push(entry);
    if (state.moods.length > 80) state.moods = state.moods.slice(-80);
    pushMetric({ animo: score, source: source || 'rueda', emotion: label });
    saveState();
    renderEmotionUI();
    renderSummary();
    // chat reaction on psicologa
    const prev = state.agent;
    setAgent('psicologa');
    addChat('bot', emotionReaction(label, score));
    if (prev !== 'psicologa') {
      // keep psicologa visible after emotion pick
    }
    return entry;
  }

  function renderEmotionUI() {
    const credit = document.getElementById('rueda-credito');
    if (credit) credit.textContent = EMOTION_CREDIT;
    const btns = document.getElementById('emotion-buttons');
    if (btns) {
      btns.innerHTML = EMOTION_STATES.map(function (e) {
        const cls = e.score > 0 ? 'pos' : (e.score < 0 ? 'neg' : 'neu');
        return '<button type="button" class="habit-chip emotion-chip ' + cls + '" data-emotion="' + e.id + '">' +
          escapeHtml(e.label) + ' (' + (e.score > 0 ? '+1' : (e.score < 0 ? '−1' : '0')) + ')</button>';
      }).join('');
    }
    const hist = document.getElementById('emotion-history');
    if (hist) {
      const items = ensureMoods().slice().reverse().slice(0, 12);
      if (!items.length) {
        hist.innerHTML = '<p class="help-tips">Sin registros aún. Pulsa un estado en la rueda.</p>';
      } else {
        hist.innerHTML = items.map(function (m) {
          const sc = m.score > 0 ? '+1' : (m.score < 0 ? '−1' : '0');
          return '<div class="task-item"><span>' + escapeHtml(fmtTime(m.ts)) + ' · ' +
            escapeHtml(m.label || 'ánimo') + ' · ' + sc +
            (m.note ? ' — ' + escapeHtml(m.note) : '') +
            (m.source ? ' [' + escapeHtml(m.source) + ']' : '') +
            '</span></div>';
        }).join('');
      }
    }
    const sel = document.getElementById('emotion-scene-label');
    if (sel && !sel.options.length) {
      EMOTION_STATES.forEach(function (e) {
        const o = document.createElement('option');
        o.value = e.id;
        o.textContent = e.label;
        sel.appendChild(o);
      });
    }
  }

  function setEmotionStatus(msg, kind) {
    const n = document.getElementById('emotion-status');
    if (!n) return;
    n.textContent = msg || '';
    n.className = 'status-line' + (kind ? ' ' + kind : '');
  }

  function setEmotionSceneStatus(msg, kind) {
    const n = document.getElementById('emotion-scene-status');
    if (!n) return;
    n.textContent = msg || '';
    n.className = 'status-line' + (kind ? ' ' + kind : '');
  }

  function analyzeSceneLuminance(file) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        try {
          const w = 64, h = 64;
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let sum = 0, rSum = 0, gSum = 0, bSum = 0, n = 0;
          let prev = null, motion = 0;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            sum += y; rSum += r; gSum += g; bSum += b; n++;
            if (prev != null) motion += Math.abs(y - prev);
            prev = y;
          }
          URL.revokeObjectURL(url);
          resolve({
            luminance: sum / n,
            r: rSum / n, g: gSum / n, b: bSum / n,
            motionProxy: motion / Math.max(1, n - 1)
          });
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo leer la imagen'));
      };
      img.src = url;
    });
  }

  function sceneSuggestionFromStats(stats, ocrText) {
    // NEVER claims person emotion — scene simulation only
    let score = 0;
    let label = 'calmado';
    let reason = 'Simulación de escena por luminancia/color (no reconocimiento facial ni lectura emocional de persona).';
    const L = stats.luminance;
    const warm = stats.r > stats.b + 15;
    const cool = stats.b > stats.r + 15;
    if (L >= 160 && warm) { score = 1; label = 'alegre'; reason += ' Escena clara/cálida → sugerencia orientativa +1.'; }
    else if (L >= 140) { score = 1; label = 'tranquilo'; reason += ' Escena luminosa → sugerencia orientativa +1.'; }
    else if (L <= 55) { score = -1; label = 'triste'; reason += ' Escena oscura → sugerencia orientativa −1 (solo escena).'; }
    else if (cool && L < 120) { score = -1; label = 'ansioso'; reason += ' Escena fría/tenue → sugerencia orientativa −1.'; }
    else { score = 0; label = 'calmado'; reason += ' Escena intermedia → 0 neutro.'; }

    const t = normalize(ocrText || '');
    const emoWords = {
      alegre: /alegr|feliz|contento|sonrisa/,
      triste: /triste|llor|pena|duelo/,
      ansioso: /ansie|nervios|estres|estrés|preocup/,
      enfadado: /enfad|rabia|ira|molest/,
      motivado: /motiv|energia|energía|vamos/,
      cansado: /cansad|agotad|fatiga/,
      tranquilo: /tranquil|paz|seren/,
      calmado: /calma|relax|relaj/
    };
    let fromOcr = null;
    Object.keys(emoWords).forEach(function (k) {
      if (emoWords[k].test(t)) fromOcr = k;
    });
    if (fromOcr) {
      const st = EMOTION_STATES.find(function (e) { return e.id === fromOcr; });
      if (st) {
        label = st.id;
        score = st.score;
        reason += ' OCR encontró palabra emocional en el texto de la imagen (no en una cara): «' + fromOcr + '».';
      }
    } else {
      reason += ' Sin palabras emocionales OCR claras: solo simulación de escena.';
    }
    return { label: label, score: score, note: reason };
  }

  function wireEmotionUI() {
    const credit = document.getElementById('rueda-credito');
    if (credit) credit.textContent = EMOTION_CREDIT;
    const btns = document.getElementById('emotion-buttons');
    if (btns) {
      btns.addEventListener('click', function (ev) {
        const b = ev.target.closest('[data-emotion]');
        if (!b) return;
        const id = b.getAttribute('data-emotion');
        const st = EMOTION_STATES.find(function (e) { return e.id === id; });
        if (!st) return;
        saveEmotionEntry(st.id, st.score, 'rueda manual', 'rueda');
        setEmotionStatus('Guardado: ' + st.label + ' · ' + EMOTION_CREDIT + ' · No es diagnóstico.', 'ok');
      });
    }
    const form = document.getElementById('emotion-scene-form');
    const review = document.getElementById('emotion-scene-review');
    const confirm = document.getElementById('emotion-scene-confirm');
    const cancel = document.getElementById('btn-emotion-scene-cancel');
    if (form) {
      form.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        const file = form.querySelector('input[name=photo]').files[0];
        if (!file) return;
        setEmotionSceneStatus('Analizando luminancia de escena (no caras)…', '');
        try {
          const stats = await analyzeSceneLuminance(file);
          let ocrText = '';
          if (window.Tesseract && window.Tesseract.recognize) {
            try {
              const r = await window.Tesseract.recognize(file, 'spa+eng');
              ocrText = (r && r.data && r.data.text) || '';
            } catch (e) { /* optional */ }
          }
          const sug = sceneSuggestionFromStats(stats, ocrText);
          document.getElementById('emotion-scene-note').textContent = sug.note;
          document.getElementById('emotion-scene-label').value = sug.label;
          document.getElementById('emotion-scene-score').value = String(sug.score);
          document.getElementById('emotion-scene-note-input').value = 'Simulación escena · no lectura de persona';
          review.classList.remove('hidden');
          setEmotionSceneStatus('Revisa la sugerencia orientativa y confirma. Nada se guarda solo.', 'ok');
        } catch (e) {
          setEmotionSceneStatus('No se pudo simular: ' + (e.message || e), 'warn');
        }
      });
    }
    if (cancel && review) {
      cancel.addEventListener('click', function () {
        review.classList.add('hidden');
        setEmotionSceneStatus('Cancelado. No se guardó nada.', 'ok');
      });
    }
    if (confirm) {
      confirm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const fd = new FormData(confirm);
        const label = String(fd.get('label') || 'calmado');
        const score = parseInt(String(fd.get('score')), 10);
        const note = String(fd.get('note') || 'simulación escena');
        const ok = window.confirm('¿Confirmas guardar esta simulación de escena (NO es lectura emocional de una persona ni diagnóstico)?');
        if (!ok) {
          setEmotionSceneStatus('Cancelado. No se guardó nada.', 'ok');
          return;
        }
        saveEmotionEntry(label, score, note, 'escena-sim');
        review.classList.add('hidden');
        form && form.reset();
        setEmotionSceneStatus('Guardado tras confirmación · ' + EMOTION_CREDIT, 'ok');
      });
    }
  }


  /* ---------- OCR local Tesseract.js (confirmación manual) ---------- */
  function parseOcrTextConservative(text) {
    const raw = String(text || '');
    const t = normalize(raw).replace(/\s+/g, ' ');
    const out = { peso: null, pasos: null, pulso: null, test: null, value: null, unit: null, confidence: {} };

    // peso kg — requires kg or word peso/weight nearby
    let m = t.match(/(?:peso|weight|wt)\s*[:=]?\s*(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:kg|kgs)?/) ||
      t.match(/(\d{2,3}(?:[.,]\d{1,2})?)\s*kg\b/);
    if (m) {
      const v = parseFloat(m[1].replace(',', '.'));
      if (v >= 30 && v <= 250) { out.peso = v; out.confidence.peso = 'patron'; }
    }

    // pasos / steps — require keyword
    m = t.match(/(?:pasos|steps|step count|conteo(?: de)? pasos)\s*[:=]?\s*(\d{2,5})/) ||
      t.match(/(\d{2,5})\s*(?:pasos|steps)\b/);
    if (m) {
      const v = parseInt(m[1], 10);
      if (v >= 10 && v <= 100000) { out.pasos = v; out.confidence.pasos = 'patron'; }
    }

    // pulso — require bpm/lpm/pulso/heart
    m = t.match(/(?:pulso|fc|heart\s*rate|hr)\s*[:=]?\s*(\d{2,3})\s*(?:bpm|lpm|ppm)?/) ||
      t.match(/(\d{2,3})\s*(?:bpm|lpm|ppm)\b/);
    if (m) {
      const v = parseInt(m[1], 10);
      if (v >= 35 && v <= 200) { out.pulso = v; out.confidence.pulso = 'patron'; }
    }

    // análisis simple: etiqueta conocida + número + unidad opcional
    const labNames = [
      'glucosa', 'glucose', 'hemoglobina', 'hemoglobin', 'hba1c', 'colesterol', 'cholesterol',
      'trigliceridos', 'triglicerides', 'creatinina', 'creatinine', 'hdl', 'ldl', 'hierro', 'ferritina',
      'tsh', 'vitamina d', 'urea', 'hematocrito'
    ];
    for (let i = 0; i < labNames.length; i++) {
      const name = labNames[i];
      const re = new RegExp(name + '\\s*[:=]?\\s*(\\d+[.,]?\\d*)\\s*([a-z%/µu0-9\\.^]+)?', 'i');
      const lm = t.match(re);
      if (lm) {
        out.test = name;
        out.value = lm[1].replace(',', '.');
        if (lm[2] && !/^(kg|pasos|steps|bpm)$/i.test(lm[2])) out.unit = lm[2];
        // common units
        if (!out.unit) {
          if (/glucosa|glucose|colesterol|cholesterol|creatinina|urea|trigli/i.test(name)) out.unit = 'mg/dL';
          if (/hemoglobina|hemoglobin/i.test(name) && !/hba1c/i.test(name)) out.unit = 'g/dL';
          if (/hba1c/i.test(name)) out.unit = '%';
        }
        out.confidence.lab = 'patron';
        break;
      }
    }
    return out;
  }

  function fillOcrReview(parsed, rawText) {
    const box = document.getElementById('ocr-review');
    const raw = document.getElementById('ocr-raw');
    if (raw) raw.value = rawText || '';
    const set = function (id, val) {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = (val == null || val === '') ? '' : String(val);
    };
    set('ocr-peso', parsed.peso);
    set('ocr-pasos', parsed.pasos);
    set('ocr-pulso', parsed.pulso);
    set('ocr-test', parsed.test);
    set('ocr-value', parsed.value);
    set('ocr-unit', parsed.unit);
    if (box) box.classList.remove('hidden');
  }

  function setOcrStatus(msg, kind) {
    const n = document.getElementById('ocr-status');
    if (!n) return;
    n.textContent = msg || '';
    n.className = 'status-line' + (kind ? ' ' + kind : '');
  }

  async function runLocalOcr(file) {
    if (!window.Tesseract || typeof window.Tesseract.recognize !== 'function') {
      throw new Error('Tesseract.js no está cargado (CDN). Revisa la conexión e inténtalo de nuevo.');
    }
    setOcrStatus('OCR local en curso (puede tardar)…', '');
    const result = await window.Tesseract.recognize(file, 'spa+eng', {
      logger: function (m) {
        if (m && m.status === 'recognizing text' && m.progress != null) {
          setOcrStatus('Reconociendo… ' + Math.round(m.progress * 100) + '%', '');
        }
      }
    });
    const text = (result && result.data && result.data.text) ? result.data.text : '';
    return text;
  }

  function wireOcrUI() {
    const form = document.getElementById('ocr-form');
    const confirm = document.getElementById('ocr-confirm-form');
    const cancel = document.getElementById('btn-ocr-cancel');
    const review = document.getElementById('ocr-review');
    if (form) {
      form.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        const fd = new FormData(form);
        const file = fd.get('photo');
        if (!file || !file.size) {
          setOcrStatus('Elige una foto.', 'warn');
          return;
        }
        try {
          // compress first for speed/size but keep readable
          let blob = file;
          try {
            const c = await compressImageFile(file);
            // dataURL -> blob
            const res = await fetch(c.dataUrl);
            blob = await res.blob();
          } catch (e) { /* use original */ }
          const text = await runLocalOcr(blob);
          if (!String(text).trim()) {
            setOcrStatus('OCR no leyó texto útil. Prueba otra foto más nítida. No se inventa nada.', 'warn');
            fillOcrReview({}, '(vacío)');
            return;
          }
          const parsed = parseOcrTextConservative(text);
          fillOcrReview(parsed, text);
          const found = [];
          if (parsed.peso != null) found.push('peso');
          if (parsed.pasos != null) found.push('pasos');
          if (parsed.pulso != null) found.push('pulso');
          if (parsed.test) found.push('análisis:' + parsed.test);
          setOcrStatus(
            found.length
              ? ('Patrones claros: ' + found.join(', ') + '. Revisa/edita y confirma. Campos vacíos = no se guardan.')
              : 'Texto leído, pero sin patrones claros de peso/pasos/pulso/análisis. Puedes rellenar a mano y confirmar, o cancelar. No inventamos cifras.',
            found.length ? 'ok' : 'warn'
          );
        } catch (e) {
          setOcrStatus('OCR falló: ' + (e.message || e), 'warn');
        }
      });
    }
    if (cancel && review) {
      cancel.addEventListener('click', function () {
        review.classList.add('hidden');
        setOcrStatus('OCR cancelado. Nada guardado.', 'ok');
      });
    }
    if (confirm) {
      confirm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const fd = new FormData(confirm);
        const peso = String(fd.get('peso') || '').trim();
        const pasos = String(fd.get('pasos') || '').trim();
        const pulso = String(fd.get('pulso') || '').trim();
        const test = String(fd.get('test') || '').trim();
        const value = String(fd.get('value') || '').trim();
        const unit = String(fd.get('unit') || '').trim();
        const note = String(fd.get('note') || 'OCR local revisado').trim();
        const partial = { source: 'ocr-confirmado' };
        let count = 0;
        if (peso !== '') {
          const v = parseFloat(peso.replace(',', '.'));
          if (!isNaN(v)) { partial.peso = v; count++; }
        }
        if (pasos !== '') {
          const v = parseInt(pasos, 10);
          if (!isNaN(v)) { partial.pasos = v; count++; }
        }
        if (pulso !== '') {
          const v = parseInt(pulso, 10);
          if (!isNaN(v)) { partial.pulso = v; count++; }
        }
        const hasLab = !!(test && value);
        if (hasLab) count++;
        if (!count) {
          setOcrStatus('No hay campos rellenados para guardar. Nada inventado ni guardado.', 'warn');
          return;
        }
        const ok = window.confirm('¿Confirmas guardar ' + count + ' dato(s) revisado(s) del OCR? No se guarda nada sin este paso.');
        if (!ok) {
          setOcrStatus('Cancelado. No se ha guardado nada.', 'ok');
          return;
        }
        if (partial.peso != null || partial.pasos != null || partial.pulso != null) {
          pushMetric(partial);
        }
        if (hasLab) {
          ensureLabs().push({
            id: uid(),
            date: todayKey(),
            person: 'Pedro',
            test: test,
            value: value,
            unit: unit,
            note: note || 'OCR local revisado',
            ts: nowIso(),
            source: 'ocr-confirmado'
          });
          saveState();
        }
        renderSummary();
        renderLabs();
        renderLifestyleTips();
        if (review) review.classList.add('hidden');
        if (form) form.reset();
        setOcrStatus('Guardado tras confirmación (' + count + '). Seguimiento personal · No es diagnóstico médico.', 'ok');
      });
    }
  }


  wireGuideVideos();
  syncGuideVideoBtn(state.agent || 'secretaria');
  wirePwaInstall();
  wireSecretariaCom();
  wireHealthUI();
  wireOcrUI();
  wireEmotionUI();
  wirePhotos();
  setupSpeech();
  seedWelcome();
  renderAll();
  renderGallery().catch(function () {});

  window.MAYCuidado = {
    state: function () { return state; },
    handle: handleUserMessage,
    setAgent: setAgent,
    replySecretaria: replySecretaria,
    ensurePrefs: ensurePrefs,
    replyEnfermera: replyEnfermera,
    replyPsicologa: replyPsicologa,
    replyMoney: replyMoney,
    searchLinksFor: searchLinksFor,
    itemsMissing: itemsMissing,
    buildSummaryText: buildSummaryText,
    buildLifestyleTips: buildLifestyleTips,
    parseOcrTextConservative: parseOcrTextConservative,
    EMOTION_STATES: EMOTION_STATES,
    EMOTION_CREDIT: EMOTION_CREDIT,
    saveEmotionEntry: saveEmotionEntry,
    sceneSuggestionFromStats: sceneSuggestionFromStats,
    RECIPES: RECIPES,
    WEEKLY_MENU: WEEKLY_MENU,
    sendIngredientsToMoney: sendIngredientsToMoney,
    importSamsungPayload: importSamsungPayload,
    compressImageFile: compressImageFile,
    savePhotoRecord: savePhotoRecord,
    photoGetAll: photoGetAll,
    photoDelete: photoDelete,
    PHOTO_MAX_EDGE: PHOTO_MAX_EDGE,
    PHOTO_MAX_SOURCE_BYTES: PHOTO_MAX_SOURCE_BYTES,
    trackInstallClickOnce: trackInstallClickOnce,
    getLocalInstallClicks: getLocalInstallClicks,
    STORAGE_KEY: STORAGE_KEY
  };
})();
