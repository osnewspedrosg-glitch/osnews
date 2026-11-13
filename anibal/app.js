/* Aníbal · navegador OSNews — interface text only, no tracking, no remote calls. */
(function () {
  const LANGS = [
    { id: 'es', label: 'Español', dir: 'ltr' },
    { id: 'en', label: 'English', dir: 'ltr' },
    { id: 'fr', label: 'Français', dir: 'ltr' },
    { id: 'de', label: 'Deutsch', dir: 'ltr' },
    { id: 'pt', label: 'Português', dir: 'ltr' },
    { id: 'it', label: 'Italiano', dir: 'ltr' },
    { id: 'ar', label: 'العربية', dir: 'rtl' },
    { id: 'zh', label: '中文', dir: 'ltr' }
  ];

  const T = {
    es: {
      title: 'Aníbal · navegador OSNews',
      tagline: 'Página de inicio de OSNews, sin anuncios ni rastreadores.',
      back: 'Volver a OSNews',
      lang: 'Idioma',
      search: 'Buscar',
      placeholder: 'Buscar en la web',
      go: 'Buscar',
      hint: 'La búsqueda se abre en DuckDuckGo, un buscador público que respeta la privacidad. El buscador OSNews World todavía no está publicado en esta web.',
      tiles: 'Accesos OSNews',
      tv: 'OSNews TV World',
      tvS: 'Directos oficiales y debates',
      lite: 'TV World ligera',
      liteS: 'Solo texto, para conexiones lentas',
      azum: 'Azum',
      azumS: 'Charla y guía emocional',
      yt: 'Canal YouTube OSNews',
      ytS: 'Debates y vídeos del canal actual',
      ytw: 'OSNews World en YouTube (próximamente)',
      ytwS: 'Se está creando un canal nuevo. Aquí estará el enlace cuando exista.',
      canales: 'Canales OSNews',
      canalesS: 'Ocho idiomas y un canal por país, con declaraciones literales en X',
      news: 'Noticias por país',
      newsS: 'China, India, Marruecos y Cuba',
      app: 'App OSNews',
      appS: 'MAY y las apps para Android',
      install: 'Instalar Aníbal',
      installed: 'Aníbal instalado',
      installHelp: 'En Chrome, abre el menú ⋮ y elige Instalar aplicación o Añadir a la pantalla de inicio. En iPhone, abre esta página en Safari, pulsa Compartir y elige Añadir a pantalla de inicio.',
      legal: 'Aníbal es una página de inicio. No sustituye a Chrome ni a Firefox.',
      authors: 'Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.'
    },
    en: {
      title: 'Aníbal · OSNews browser',
      tagline: 'OSNews start page, with no ads and no trackers.',
      back: 'Back to OSNews',
      lang: 'Language',
      search: 'Search',
      placeholder: 'Search the web',
      go: 'Search',
      hint: 'Search opens in DuckDuckGo, a public privacy-respecting search engine. The OSNews World search page is not published on this site yet.',
      tiles: 'OSNews shortcuts',
      tv: 'OSNews TV World',
      tvS: 'Official live streams and debates',
      lite: 'TV World lite',
      liteS: 'Text only, for slow connections',
      azum: 'Azum',
      azumS: 'Chat and emotional guidance',
      yt: 'OSNews YouTube channel',
      ytS: 'Debates and videos on the current channel',
      ytw: 'OSNews World on YouTube (coming soon)',
      ytwS: 'A new channel is being created. The link will appear here when it exists.',
      canales: 'OSNews channels',
      canalesS: 'Eight languages and one channel per country, with literal X statements',
      news: 'News by country',
      newsS: 'China, India, Morocco and Cuba',
      app: 'OSNews app',
      appS: 'MAY and the Android apps',
      install: 'Install Aníbal',
      installed: 'Aníbal installed',
      installHelp: 'In Chrome, open the ⋮ menu and choose Install app or Add to Home screen. On iPhone, open this page in Safari, tap Share, then Add to Home Screen.',
      legal: 'Aníbal is a start page. It does not replace Chrome or Firefox.',
      authors: 'Authors: Pedro Sánchez Gómez (Mar Menor) and his Grok bot.'
    },
    fr: {
      title: 'Aníbal · navigateur OSNews',
      tagline: 'Page d’accueil OSNews, sans publicités ni traqueurs.',
      back: 'Retour à OSNews',
      lang: 'Langue',
      search: 'Rechercher',
      placeholder: 'Rechercher sur le web',
      go: 'Rechercher',
      hint: 'La recherche s’ouvre dans DuckDuckGo, un moteur public respectueux de la vie privée. Le moteur OSNews World n’est pas encore publié sur ce site.',
      tiles: 'Accès OSNews',
      tv: 'OSNews TV World',
      tvS: 'Directs officiels et débats',
      lite: 'TV World légère',
      liteS: 'Texte seulement, pour les connexions lentes',
      azum: 'Azum',
      azumS: 'Discussion et guide émotionnel',
      yt: 'Chaîne YouTube OSNews',
      ytS: 'Débats et vidéos de la chaîne actuelle',
      ytw: 'OSNews World sur YouTube (prochainement)',
      ytwS: 'Une nouvelle chaîne est en cours de création. Le lien apparaîtra ici lorsqu’elle existera.',
      canales: 'Chaînes OSNews',
      canalesS: 'Huit langues et une chaîne par pays, avec des déclarations littérales sur X',
      news: 'Actualités par pays',
      newsS: 'Chine, Inde, Maroc et Cuba',
      app: 'App OSNews',
      appS: 'MAY et les applications Android',
      install: 'Installer Aníbal',
      installed: 'Aníbal installé',
      installHelp: 'Dans Chrome, ouvrez le menu ⋮ et choisissez Installer l’application ou Ajouter à l’écran d’accueil. Sur iPhone, ouvrez cette page dans Safari, touchez Partager, puis Ajouter à l’écran d’accueil.',
      legal: 'Aníbal est une page d’accueil. Elle ne remplace pas Chrome ni Firefox.',
      authors: 'Auteurs : Pedro Sánchez Gómez (Mar Menor) et son bot de Grok.'
    },
    de: {
      title: 'Aníbal · OSNews-Browser',
      tagline: 'OSNews-Startseite, ohne Werbung und ohne Tracker.',
      back: 'Zurück zu OSNews',
      lang: 'Sprache',
      search: 'Suchen',
      placeholder: 'Im Web suchen',
      go: 'Suchen',
      hint: 'Die Suche öffnet sich in DuckDuckGo, einer öffentlichen Suchmaschine mit Datenschutz. Die OSNews-World-Suche ist auf dieser Website noch nicht veröffentlicht.',
      tiles: 'OSNews-Zugänge',
      tv: 'OSNews TV World',
      tvS: 'Offizielle Livestreams und Debatten',
      lite: 'TV World leicht',
      liteS: 'Nur Text, für langsame Verbindungen',
      azum: 'Azum',
      azumS: 'Gespräch und emotionale Begleitung',
      yt: 'OSNews-YouTube-Kanal',
      ytS: 'Debatten und Videos des aktuellen Kanals',
      ytw: 'OSNews World auf YouTube (demnächst)',
      ytwS: 'Ein neuer Kanal wird gerade eingerichtet. Der Link erscheint hier, sobald er existiert.',
      canales: 'OSNews-Kanäle',
      canalesS: 'Acht Sprachen und ein Kanal pro Land, mit wörtlichen X-Erklärungen',
      news: 'Nachrichten nach Land',
      newsS: 'China, Indien, Marokko und Kuba',
      app: 'OSNews-App',
      appS: 'MAY und die Android-Apps',
      install: 'Aníbal installieren',
      installed: 'Aníbal installiert',
      installHelp: 'Öffne in Chrome das Menü ⋮ und wähle App installieren oder Zum Startbildschirm hinzufügen. Auf dem iPhone öffne diese Seite in Safari, tippe auf Teilen und dann auf Zum Home-Bildschirm.',
      legal: 'Aníbal ist eine Startseite. Sie ersetzt weder Chrome noch Firefox.',
      authors: 'Autoren: Pedro Sánchez Gómez (Mar Menor) und sein Grok-Bot.'
    },
    pt: {
      title: 'Aníbal · navegador OSNews',
      tagline: 'Página inicial da OSNews, sem anúncios nem rastreadores.',
      back: 'Voltar à OSNews',
      lang: 'Idioma',
      search: 'Pesquisar',
      placeholder: 'Pesquisar na web',
      go: 'Pesquisar',
      hint: 'A pesquisa abre no DuckDuckGo, um motor público que respeita a privacidade. O motor OSNews World ainda não está publicado neste sítio.',
      tiles: 'Atalhos OSNews',
      tv: 'OSNews TV World',
      tvS: 'Diretos oficiais e debates',
      lite: 'TV World ligeira',
      liteS: 'Só texto, para ligações lentas',
      azum: 'Azum',
      azumS: 'Conversa e guia emocional',
      yt: 'Canal YouTube OSNews',
      ytS: 'Debates e vídeos do canal atual',
      ytw: 'OSNews World no YouTube (em breve)',
      ytwS: 'Está a ser criado um canal novo. A ligação aparecerá aqui quando existir.',
      canales: 'Canais OSNews',
      canalesS: 'Oito idiomas e um canal por país, com declarações literais no X',
      news: 'Notícias por país',
      newsS: 'China, Índia, Marrocos e Cuba',
      app: 'App OSNews',
      appS: 'MAY e as aplicações para Android',
      install: 'Instalar Aníbal',
      installed: 'Aníbal instalado',
      installHelp: 'No Chrome, abra o menu ⋮ e escolha Instalar aplicação ou Adicionar ao ecrã principal. No iPhone, abra esta página no Safari, toque em Partilhar e escolha Adicionar ao ecrã principal.',
      legal: 'Aníbal é uma página inicial. Não substitui o Chrome nem o Firefox.',
      authors: 'Autores: Pedro Sánchez Gómez (Mar Menor) e o seu bot de Grok.'
    },
    it: {
      title: 'Aníbal · browser OSNews',
      tagline: 'Pagina iniziale di OSNews, senza annunci né tracker.',
      back: 'Torna a OSNews',
      lang: 'Lingua',
      search: 'Cerca',
      placeholder: 'Cerca sul web',
      go: 'Cerca',
      hint: 'La ricerca si apre in DuckDuckGo, un motore pubblico che rispetta la privacy. Il motore OSNews World non è ancora pubblicato su questo sito.',
      tiles: 'Accessi OSNews',
      tv: 'OSNews TV World',
      tvS: 'Dirette ufficiali e dibattiti',
      lite: 'TV World leggera',
      liteS: 'Solo testo, per connessioni lente',
      azum: 'Azum',
      azumS: 'Chat e guida emotiva',
      yt: 'Canale YouTube OSNews',
      ytS: 'Dibattiti e video del canale attuale',
      ytw: 'OSNews World su YouTube (prossimamente)',
      ytwS: 'Si sta creando un nuovo canale. Il collegamento comparirà qui quando esisterà.',
      canales: 'Canali OSNews',
      canalesS: 'Otto lingue e un canale per paese, con dichiarazioni letterali su X',
      news: 'Notizie per paese',
      newsS: 'Cina, India, Marocco e Cuba',
      app: 'App OSNews',
      appS: 'MAY e le app per Android',
      install: 'Installa Aníbal',
      installed: 'Aníbal installato',
      installHelp: 'In Chrome, apri il menu ⋮ e scegli Installa app o Aggiungi alla schermata Home. Su iPhone, apri questa pagina in Safari, tocca Condividi e scegli Aggiungi a Home.',
      legal: 'Aníbal è una pagina iniziale. Non sostituisce Chrome né Firefox.',
      authors: 'Autori: Pedro Sánchez Gómez (Mar Menor) e il suo bot di Grok.'
    },
    ar: {
      title: 'أنيبال · متصفح OSNews',
      tagline: 'صفحة بداية OSNews، بلا إعلانات ولا متعقّبات.',
      back: 'العودة إلى OSNews',
      lang: 'اللغة',
      search: 'بحث',
      placeholder: 'البحث في الويب',
      go: 'بحث',
      hint: 'يفتح البحث في DuckDuckGo، وهو محرك بحث عام يحترم الخصوصية. محرك OSNews World غير منشور بعد على هذا الموقع.',
      tiles: 'اختصارات OSNews',
      tv: 'OSNews TV World',
      tvS: 'بثوث مباشرة رسمية ومناظرات',
      lite: 'TV World الخفيفة',
      liteS: 'نص فقط، للاتصالات البطيئة',
      azum: 'Azum',
      azumS: 'محادثة ودليل عاطفي',
      yt: 'قناة YouTube الخاصة بـ OSNews',
      ytS: 'المناظرات ومقاطع الفيديو على القناة الحالية',
      ytw: 'OSNews World على YouTube (قريبًا)',
      ytwS: 'يجري إنشاء قناة جديدة. سيظهر الرابط هنا عندما تكون جاهزة.',
      canales: 'قنوات OSNews',
      canalesS: 'ثماني لغات وقناة لكل بلد، مع تصريحات حرفية على X',
      news: 'أخبار حسب البلد',
      newsS: 'الصين والهند والمغرب وكوبا',
      app: 'تطبيق OSNews',
      appS: 'MAY وتطبيقات أندرويد',
      install: 'تثبيت أنيبال',
      installed: 'تم تثبيت أنيبال',
      installHelp: 'في Chrome، افتح القائمة ⋮ واختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية. على iPhone، افتح هذه الصفحة في Safari، ثم مشاركة، ثم إضافة إلى الشاشة الرئيسية.',
      legal: 'أنيبال صفحة بداية. لا تحل محل Chrome أو Firefox.',
      authors: 'المؤلفان: Pedro Sánchez Gómez (Mar Menor) وروبوت Grok الخاص به.'
    },
    zh: {
      title: 'Aníbal · OSNews 浏览器',
      tagline: 'OSNews 起始页，无广告、无跟踪器。',
      back: '返回 OSNews',
      lang: '语言',
      search: '搜索',
      placeholder: '搜索网页',
      go: '搜索',
      hint: '搜索会在 DuckDuckGo 打开，这是一个尊重隐私的公共搜索引擎。OSNews World 搜索尚未发布在本网站。',
      tiles: 'OSNews 入口',
      tv: 'OSNews TV World',
      tvS: '官方直播与辩论',
      lite: 'TV World 轻量版',
      liteS: '纯文字，适合慢速网络',
      azum: 'Azum',
      azumS: '对话与情感引导',
      yt: 'OSNews YouTube 频道',
      ytS: '当前频道中的辩论和视频',
      ytw: 'OSNews World 的 YouTube 频道（即将推出）',
      ytwS: '新频道正在创建。有了链接后会显示在这里。',
      canales: 'OSNews 频道',
      canalesS: '八种语言和每个国家一个频道，含 X 上的逐字声明',
      news: '按国家查看新闻',
      newsS: '中国、印度、摩洛哥和古巴',
      app: 'OSNews 应用',
      appS: 'MAY 与 Android 应用',
      install: '安装 Aníbal',
      installed: 'Aníbal 已安装',
      installHelp: '在 Chrome 中打开 ⋮ 菜单，选择“安装应用”或“添加到主屏幕”。在 iPhone 上用 Safari 打开本页，点“共享”，再选择“添加到主屏幕”。',
      legal: 'Aníbal 是起始页，不能替代 Chrome 或 Firefox。',
      authors: '作者：Pedro Sánchez Gómez（Mar Menor）及其 Grok 机器人。'
    }
  };

  const KEY = 'anibal-lang';
  const DDG_KL = { es: 'es-es', en: 'wt-wt', fr: 'fr-fr', de: 'de-de', pt: 'pt-pt', it: 'it-it', ar: 'xa-ar', zh: 'cn-zh' };

  let lang = 'es';
  let deferredPrompt = null;
  let installed = false;

  function $(id) { return document.getElementById(id); }

  function apply(id) {
    const t = T[id] || T.es;
    lang = id;
    document.documentElement.lang = id;
    document.documentElement.dir = LANGS.find((l) => l.id === id).dir;
    document.body.dir = document.documentElement.dir;
    document.title = t.title;
    $('tagline').textContent = t.tagline;
    $('back').textContent = t.back;
    $('h-lang').textContent = t.lang;
    $('h-search').textContent = t.search;
    $('q').placeholder = t.placeholder;
    $('q').setAttribute('aria-label', t.placeholder);
    $('search-btn').textContent = t.go;
    $('search-hint').textContent = t.hint;
    $('h-tiles').textContent = t.tiles;
    textNode($('t-tv'), t.tv);
    $('t-tv-s').textContent = t.tvS;
    textNode($('t-lite'), t.lite);
    $('t-lite-s').textContent = t.liteS;
    textNode($('t-azum'), t.azum);
    $('t-azum-s').textContent = t.azumS;
    textNode($('t-yt'), t.yt);
    $('t-yt-s').textContent = t.ytS;
    textNode($('t-ytw'), t.ytw);
    $('t-ytw-s').textContent = t.ytwS;
    textNode($('t-canales'), t.canales);
    $('t-canales-s').textContent = t.canalesS;
    textNode($('t-news'), t.news);
    $('t-news-s').textContent = t.newsS;
    textNode($('t-app'), t.app);
    $('t-app-s').textContent = t.appS;
    const inst = $('install');
    inst.textContent = installed ? t.installed : t.install;
    $('install-help').textContent = t.installHelp;
    $('legal').textContent = t.legal;
    $('authors').innerHTML = '<strong>' + t.authors + '</strong>';
    document.querySelectorAll('.lang').forEach((b) => {
      b.setAttribute('aria-pressed', b.dataset.lang === id ? 'true' : 'false');
    });
  }

  function textNode(el, label) {
    const small = el.querySelector('small');
    el.childNodes.forEach((n) => {
      if (n.nodeType === 3) n.remove();
    });
    el.insertBefore(document.createTextNode(label), small);
  }

  function renderLangs() {
    const box = $('langs');
    box.innerHTML = '';
    LANGS.forEach((l) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lang';
      b.dataset.lang = l.id;
      b.lang = l.id;
      b.textContent = l.label;
      b.setAttribute('aria-pressed', l.id === lang ? 'true' : 'false');
      b.addEventListener('click', () => {
        try { localStorage.setItem(KEY, l.id); } catch (e) {}
        apply(l.id);
      });
      box.appendChild(b);
    });
  }

  function pickLang() {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && T[saved]) return saved;
    } catch (e) {}
    const nav = (navigator.language || 'es').toLowerCase();
    const short = nav.slice(0, 2);
    return T[short] ? short : 'es';
  }

  $('search-form').addEventListener('submit', function () {
    let kl = this.querySelector('input[name="kl"]');
    if (!kl) {
      kl = document.createElement('input');
      kl.type = 'hidden';
      kl.name = 'kl';
      this.appendChild(kl);
    }
    kl.value = DDG_KL[lang] || 'wt-wt';
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
  }

  const inst = $('install');
  const help = $('install-help');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    inst.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    inst.hidden = false;
    inst.textContent = (T[lang] || T.es).installed;
  });
  inst.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    } else {
      help.style.display = 'block';
      help.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  if (window.matchMedia('(display-mode: standalone)').matches) {
    installed = true;
  } else {
    inst.hidden = false;
  }

  lang = pickLang();
  renderLangs();
  apply(lang);
})();
