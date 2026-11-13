/* OSNews TV World — solo reproductores oficiales / enlaces oficiales. Sin reenvío de streams. */
(function () {
  const LANGS = ["es", "en", "fr", "de", "pt", "it", "ar", "zh"];
  const YT_CC = { es: "es", en: "en", fr: "fr", de: "de", pt: "pt", it: "it", ar: "ar", zh: "zh" };

  const I18N = {
    es: {
      tagline: "Debates de OSNews y directos oficiales, con el reproductor permitido.",
      back: "Volver a OSNews",
      lite: "Versión ligera (solo texto)",
      canales: "Canales OSNews",
      language: "Idioma",
      live: "Directos oficiales",
      osnews: "Debates OSNews",
      osnewsChannel: "Canal de YouTube OSNews",
      chinaLive: "CGTN / CCTV",
      indiaLive: "Índia · DD India, WION, NDTV, India Today",
      chinaLive: "CGTN / CCTV",
      indiaLive: "India · DD India, WION, NDTV, India Today",
      countries: "Noticias por país",
      china: "China", india: "India", morocco: "Marruecos", cuba: "Cuba",
      cnnbbc: "CNN y BBC",
      watchOfficial: "Ver en la web oficial",
      watchYoutube: "Ver en YouTube oficial",
      listenBbc: "Escuchar BBC World Service (oficial)",
      bbcLanguages: "Servicios de la BBC por idioma",
      bbcAllLanguages: "Todas las lenguas de la BBC",
      choose: "Elige un canal o un vídeo para verlo aquí.",
      playing: "Reproduciendo",
      source: "Fuente",
      published: "Publicado",
      timezone: "Europe/Madrid",
      captions:
        "En los reproductores de YouTube pedimos subtítulos (cc_load_policy=1) en el idioma elegido (cc_lang_pref y hl). La traducción automática depende de YouTube: solo aparece si hay pista o si el usuario la activa en el menú CC, y en los directos las leyendas automáticas suelen estar solo en inglés.",
      missingTitle: "Debates que aún no están en YouTube",
      missingIntro:
        "Los archivos locales en 8 idiomas son demasiado grandes para este alojamiento (más de 3 GB). En YouTube están, de momento, estas versiones oficiales (casi todas en español), con inserción comprobada. Faltan aún, entre otros:",
      missingItems: [
        "La «particularidad»",
        "Sentimientos de MAY y Asdrúbal",
        "Pobreza, luz y cena en España",
        "Huelga del 11N (versiones de sindicatos / éxito o fracaso; hay un debate combinado en YouTube)",
        "Óscar Puente y los trenes (versiones distintas a la de la dimisión)",
        "Yoani: periodismo y propiedad",
        "Cartagena–La Habana",
        "Intxaurrondo",
        "El alcance global de OSNews",
        "La demostración de supervisión de la IA"
      ],
      linkOnly: "Sin directo insertable ahora: se abre la página o el canal oficial.",
      eventLive: "Puede ser un directo puntual, no una señal 24/7.",
      authors: "Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok.",
      legal: "No usamos Xiaomi TV+ ni reenviamos señales. No incrustamos webs que lo prohíben (entre ellas cnn.com, bbc.com, dw.com, euronews.com, aljazeera.com y rtve.es).",
      emptyLive: "Este canal no tenía un directo con inserción activa al comprobarlo. Ábrelo en su web o en YouTube."
    },
    en: {
      tagline: "OSNews debates and official live streams, using allowed players only.",
      back: "Back to OSNews",
      lite: "Lite version (text only)",
      canales: "OSNews channels",
      language: "Language",
      live: "Official live channels",
      osnews: "OSNews debates",
      osnewsChannel: "OSNews YouTube channel",
      chinaLive: "CGTN / CCTV",
      indiaLive: "India · DD India, WION, NDTV, India Today",
      countries: "News by country",
      china: "China", india: "India", morocco: "Morocco", cuba: "Cuba",
      cnnbbc: "CNN and BBC",
      watchOfficial: "Watch on the official website",
      watchYoutube: "Watch on official YouTube",
      listenBbc: "Listen to BBC World Service (official)",
      bbcLanguages: "BBC language services",
      bbcAllLanguages: "All BBC languages",
      choose: "Choose a channel or a video to watch it here.",
      playing: "Now playing",
      source: "Source",
      published: "Published",
      timezone: "Europe/Madrid",
      captions:
        "YouTube embeds request captions (cc_load_policy=1) in the selected language (cc_lang_pref and hl). Auto-translation is up to YouTube: it only appears if a caption track exists or if the viewer turns it on in the CC menu, and live automatic captions are usually English only.",
      missingTitle: "Debates not yet on YouTube",
      missingIntro:
        "The local 8-language video files are too large for this host (over 3 GB). The official YouTube versions below were checked for embedding (almost all in Spanish). Still missing, among others:",
      missingItems: [
        "The “particularidad” debate",
        "MAY and Asdrúbal on feelings",
        "Poverty, electricity and dinner in Spain",
        "The 11 November strike (union / success-or-failure versions; a combined debate is on YouTube)",
        "Óscar Puente and the trains (versions other than the resignation debate)",
        "Yoani: journalism and property",
        "Cartagena–Havana",
        "Intxaurrondo",
        "OSNews’s global reach",
        "The AI supervision demonstration"
      ],
      linkOnly: "No embeddable live stream was available when checked. Open the official site or channel.",
      eventLive: "This may be a one-off live event, not a 24/7 channel.",
      authors: "Authors: Pedro Sánchez Gómez (Mar Menor) and his Grok bot.",
      legal: "We do not use Xiaomi TV+ or re-stream signals. We do not iframe sites that forbid it (including cnn.com, bbc.com, dw.com, euronews.com, aljazeera.com and rtve.es).",
      emptyLive: "This channel had no embeddable live stream when we checked. Open it on its website or YouTube."
    },
    fr: {
      tagline: "Débats OSNews et directs officiels, uniquement avec le lecteur autorisé.",
      back: "Retour à OSNews",
      lite: "Version légère (texte seul)",
      canales: "Chaînes OSNews",
      language: "Langue",
      live: "Directs officiels",
      osnews: "Débats OSNews",
      osnewsChannel: "Chaîne YouTube OSNews",
      chinaLive: "CGTN / CCTV",
      indiaLive: "Inde · DD India, WION, NDTV, India Today",
      countries: "Actualités par pays",
      china: "Chine", india: "Inde", morocco: "Maroc", cuba: "Cuba",
      cnnbbc: "CNN et BBC",
      watchOfficial: "Voir sur le site officiel",
      watchYoutube: "Voir sur YouTube officiel",
      listenBbc: "Écouter BBC World Service (officiel)",
      bbcLanguages: "Services BBC par langue",
      bbcAllLanguages: "Toutes les langues de la BBC",
      choose: "Choisissez une chaîne ou une vidéo pour la voir ici.",
      playing: "En cours",
      source: "Source",
      published: "Publié le",
      timezone: "Europe/Madrid",
      captions:
        "Les lecteurs YouTube demandent les sous-titres (cc_load_policy=1) dans la langue choisie (cc_lang_pref et hl). La traduction automatique dépend de YouTube : elle n’apparaît que s’il existe une piste ou si le téléspectateur l’active dans le menu CC, et en direct les sous-titres automatiques sont en général en anglais seulement.",
      missingTitle: "Débats pas encore sur YouTube",
      missingIntro:
        "Les fichiers locaux en 8 langues sont trop lourds pour cet hébergement (plus de 3 Go). Les versions YouTube ci-dessous ont un embed vérifié (presque toutes en espagnol). Il manque encore, entre autres :",
      missingItems: [
        "Le débat sur la « particularidad »",
        "Les sentiments de MAY et Asdrúbal",
        "Pauvreté, électricité et dîner en Espagne",
        "La grève du 11 novembre (versions syndicats / succès ou échec ; un débat combiné est sur YouTube)",
        "Óscar Puente et les trains (autres versions que celle sur la démission)",
        "Yoani : journalisme et propriété",
        "Carthagène–La Havane",
        "Intxaurrondo",
        "La portée mondiale d’OSNews",
        "La démonstration de supervision de l’IA"
      ],
      linkOnly: "Pas de direct intégrable au moment de la vérification. Ouvrez le site ou la chaîne officielle.",
      eventLive: "Il peut s’agir d’un direct ponctuel, pas d’une chaîne 24/7.",
      authors: "Auteurs : Pedro Sánchez Gómez (Mar Menor) et son bot de Grok.",
      legal: "Nous n’utilisons pas Xiaomi TV+ et nous ne retransmettons pas les signaux. Nous n’intégrons pas les sites qui l’interdisent (dont cnn.com, bbc.com, dw.com, euronews.com, aljazeera.com et rtve.es).",
      emptyLive: "Cette chaîne n’avait pas de direct intégrable lors de la vérification. Ouvrez-la sur son site ou YouTube."
    },
    de: {
      tagline: "OSNews-Debatten und offizielle Livestreams, nur mit erlaubtem Player.",
      back: "Zurück zu OSNews",
      lite: "Leichtversion (nur Text)",
      canales: "OSNews-Kanäle",
      language: "Sprache",
      live: "Offizielle Livesender",
      osnews: "OSNews-Debatten",
      osnewsChannel: "OSNews-YouTube-Kanal",
      chinaLive: "CGTN / CCTV",
      indiaLive: "Indien · DD India, WION, NDTV, India Today",
      countries: "Nachrichten nach Land",
      china: "China", india: "Indien", morocco: "Marokko", cuba: "Kuba",
      cnnbbc: "CNN und BBC",
      watchOfficial: "Auf der offiziellen Website ansehen",
      watchYoutube: "Auf offiziellem YouTube ansehen",
      listenBbc: "BBC World Service hören (offiziell)",
      bbcLanguages: "BBC-Dienste nach Sprache",
      bbcAllLanguages: "Alle BBC-Sprachen",
      choose: "Wählen Sie einen Sender oder ein Video, um es hier zu sehen.",
      playing: "Läuft gerade",
      source: "Quelle",
      published: "Veröffentlicht",
      timezone: "Europe/Madrid",
      captions:
        "YouTube-Player fordern Untertitel (cc_load_policy=1) in der gewählten Sprache an (cc_lang_pref und hl). Die automatische Übersetzung hängt von YouTube ab: Sie erscheint nur, wenn eine Spur existiert oder wenn sie im CC-Menü eingeschaltet wird; bei Livesendungen sind automatische Untertitel meist nur auf Englisch.",
      missingTitle: "Debatten noch nicht auf YouTube",
      missingIntro:
        "Die lokalen Dateien in 8 Sprachen sind für dieses Hosting zu groß (über 3 GB). Die YouTube-Fassungen unten wurden auf Einbettung geprüft (fast alle auf Spanisch). Es fehlen unter anderem noch:",
      missingItems: [
        "Die Debatte zur «particularidad»",
        "Gefühle von MAY und Asdrúbal",
        "Armut, Strom und Abendessen in Spanien",
        "Der Streik vom 11. November (Gewerkschafts-/Erfolgsfassungen; eine kombinierte Debatte ist auf YouTube)",
        "Óscar Puente und die Züge (andere Fassungen als die zur Rücktritt-Debatte)",
        "Yoani: Journalismus und Eigentum",
        "Cartagena–Havanna",
        "Intxaurrondo",
        "Die globale Reichweite von OSNews",
        "Die Demonstration zur KI-Aufsicht"
      ],
      linkOnly: "Beim Prüfen gab es keinen einbettbaren Livestream. Öffnen Sie die offizielle Seite oder den Kanal.",
      eventLive: "Das kann ein einzelnes Live-Ereignis sein, kein 24/7-Sender.",
      authors: "Autoren: Pedro Sánchez Gómez (Mar Menor) und sein Grok-Bot.",
      legal: "Wir nutzen kein Xiaomi TV+ und leiten keine Signale weiter. Wir rahmen keine Websites ein, die das verbieten (u. a. cnn.com, bbc.com, dw.com, euronews.com, aljazeera.com und rtve.es).",
      emptyLive: "Dieser Kanal hatte beim Prüfen keinen einbettbaren Livestream. Öffnen Sie ihn auf der Website oder auf YouTube."
    },
    pt: {
      tagline: "Debates da OSNews e diretos oficiais, só com o leitor permitido.",
      back: "Voltar à OSNews",
      lite: "Versão leve (só texto)",
      canales: "Canais OSNews",
      language: "Idioma",
      live: "Diretos oficiais",
      osnews: "Debates OSNews",
      osnewsChannel: "Canal de YouTube OSNews",
      countries: "Notícias por país",
      china: "China", india: "Índia", morocco: "Marrocos", cuba: "Cuba",
      cnnbbc: "CNN e BBC",
      watchOfficial: "Ver no sítio oficial",
      watchYoutube: "Ver no YouTube oficial",
      listenBbc: "Ouvir a BBC World Service (oficial)",
      bbcLanguages: "Serviços da BBC por idioma",
      bbcAllLanguages: "Todas as línguas da BBC",
      choose: "Escolha um canal ou um vídeo para o ver aqui.",
      playing: "A reproduzir",
      source: "Fonte",
      published: "Publicado",
      timezone: "Europe/Madrid",
      captions:
        "Os leitores do YouTube pedem legendas (cc_load_policy=1) no idioma escolhido (cc_lang_pref e hl). A tradução automática depende do YouTube: só aparece se houver pista ou se o utilizador a ligar no menu CC, e em direto as legendas automáticas costumam estar só em inglês.",
      missingTitle: "Debates ainda não estão no YouTube",
      missingIntro:
        "Os ficheiros locais em 8 idiomas são demasiado grandes para este alojamento (mais de 3 GB). As versões oficiais no YouTube abaixo têm inserção verificada (quase todas em espanhol). Ainda faltam, entre outros:",
      missingItems: [
        "O debate da «particularidad»",
        "Sentimentos de MAY e Asdrúbal",
        "Pobreza, luz e jantar em Espanha",
        "A greve de 11 de novembro (versões sindicatos / êxito ou fracasso; há um debate conjunto no YouTube)",
        "Óscar Puente e os comboios (versões distintas da da demissão)",
        "Yoani: jornalismo e propriedade",
        "Cartagena–Havana",
        "Intxaurrondo",
        "O alcance global da OSNews",
        "A demonstração de supervisão da IA"
      ],
      linkOnly: "Não havia um direto inserível no momento da verificação. Abra o sítio ou o canal oficial.",
      eventLive: "Pode ser um direto pontual, não um canal 24/7.",
      authors: "Autores: Pedro Sánchez Gómez (Mar Menor) e o seu bot de Grok.",
      legal: "Não usamos Xiaomi TV+ nem reenviamos sinais. Não incorporamos sítios que o proíbem (incluindo cnn.com, bbc.com, dw.com, euronews.com, aljazeera.com e rtve.es).",
      emptyLive: "Este canal não tinha um direto inserível quando foi verificado. Abra-o no sítio ou no YouTube."
    },
    it: {
      tagline: "Dibattiti OSNews e dirette ufficiali, solo con il lettore consentito.",
      back: "Torna a OSNews",
      lite: "Versione leggera (solo testo)",
      canales: "Canali OSNews",
      language: "Lingua",
      live: "Dirette ufficiali",
      osnews: "Dibattiti OSNews",
      osnewsChannel: "Canale YouTube OSNews",
      chinaLive: "CGTN / CCTV",
      indiaLive: "India · DD India, WION, NDTV, India Today",
      countries: "Notizie per paese",
      china: "Cina", india: "India", morocco: "Marocco", cuba: "Cuba",
      cnnbbc: "CNN e BBC",
      watchOfficial: "Guarda sul sito ufficiale",
      watchYoutube: "Guarda su YouTube ufficiale",
      listenBbc: "Ascolta BBC World Service (ufficiale)",
      bbcLanguages: "Servizi BBC per lingua",
      bbcAllLanguages: "Tutte le lingue della BBC",
      choose: "Scegli un canale o un video per vederlo qui.",
      playing: "In riproduzione",
      source: "Fonte",
      published: "Pubblicato",
      timezone: "Europe/Madrid",
      captions:
        "I lettori YouTube chiedono i sottotitoli (cc_load_policy=1) nella lingua scelta (cc_lang_pref e hl). La traduzione automatica dipende da YouTube: compare solo se esiste una traccia o se lo spettatore la attiva nel menu CC, e in diretta i sottotitoli automatici sono di solito solo in inglese.",
      missingTitle: "Dibattiti non ancora su YouTube",
      missingIntro:
        "I file locali in 8 lingue sono troppo grandi per questo hosting (oltre 3 GB). Le versioni YouTube qui sotto hanno l’incorporamento verificato (quasi tutte in spagnolo). Mancano ancora, tra gli altri:",
      missingItems: [
        "Il dibattito sulla «particularidad»",
        "I sentimenti di MAY e Asdrúbal",
        "Povertà, luce e cena in Spagna",
        "Lo sciopero dell’11 novembre (versioni sindacati / successo o fallimento; su YouTube c’è un dibattito combinato)",
        "Óscar Puente e i treni (versioni diverse da quella sulle dimissioni)",
        "Yoani: giornalismo e proprietà",
        "Cartagena–L’Avana",
        "Intxaurrondo",
        "La portata globale di OSNews",
        "La dimostrazione di supervisione dell’IA"
      ],
      linkOnly: "Al momento del controllo non c’era una diretta incorporabile. Apri il sito o il canale ufficiale.",
      eventLive: "Può trattarsi di una diretta occasionale, non di un canale 24/7.",
      authors: "Autori: Pedro Sánchez Gómez (Mar Menor) e il suo bot di Grok.",
      legal: "Non usiamo Xiaomi TV+ e non ritrasmettiamo i segnali. Non incorporiamo i siti che lo vietano (tra cui cnn.com, bbc.com, dw.com, euronews.com, aljazeera.com e rtve.es).",
      emptyLive: "Questo canale non aveva una diretta incorporabile al momento del controllo. Aprilo sul sito o su YouTube."
    },
    ar: {
      tagline: "مناظرات OSNews وبثوث رسمية، عبر المشغّل المسموح به فقط.",
      back: "العودة إلى OSNews",
      lite: "نسخة خفيفة (نص فقط)",
      canales: "قنوات OSNews",
      language: "اللغة",
      live: "البثوث الرسمية",
      osnews: "مناظرات OSNews",
      osnewsChannel: "قناة OSNews على يوتيوب",
      chinaLive: "CGTN / CCTV",
      indiaLive: "الهند · DD India وWION وNDTV وIndia Today",
      countries: "أخبار حسب البلد",
      china: "الصين", india: "الهند", morocco: "المغرب", cuba: "كوبا",
      cnnbbc: "CNN وBBC",
      watchOfficial: "المشاهدة في الموقع الرسمي",
      watchYoutube: "المشاهدة على يوتيوب الرسمي",
      listenBbc: "الاستماع إلى BBC World Service (رسمي)",
      bbcLanguages: "خدمات بي بي سي حسب اللغة",
      bbcAllLanguages: "كل لغات بي بي سي",
      choose: "اختر قناة أو فيديو لمشاهدته هنا.",
      playing: "الآن",
      source: "المصدر",
      published: "تاريخ النشر",
      timezone: "Europe/Madrid",
      captions:
        "نطلب في مشغّل يوتيوب الترجمة (cc_load_policy=1) باللغة المختارة (cc_lang_pref وhl). الترجمة الآلية تعتمد على يوتيوب: لا تظهر إلا إذا وُجدت قائمة أو إذا فعّلها المشاهد من قائمة CC، وفي البث المباشر غالباً ما تكون التسميات الآلية بالإنجليزية فقط.",
      missingTitle: "مناظرات ليست على يوتيوب بعد",
      missingIntro:
        "الملفات المحلية بثماني لغات أكبر من أن تُستضاف هنا (أكثر من 3 غيغابايت). الإصدارات الرسمية على يوتيوب أدناه تم التحقق من إمكانية تضمينها (ومعظمها بالإسبانية). ما يزال ناقصاً، من بينها:",
      missingItems: [
        "مناظرة «particularidad»",
        "مشاعر MAY وAsdrúbal",
        "الفقر والكهرباء والعشاء في إسبانيا",
        "إضراب 11 نوفمبر (نسخ النقابات / النجاح أو الفشل؛ هناك مناظرة موحّدة على يوتيوب)",
        "أوسكار بوينتي والقطارات (نسخ غير مناظرة الاستقالة)",
        "يواني: الصحافة والملكية",
        "قرطاجنة–هافانا",
        "إنتشاوروندو",
        "الوصول العالمي لـ OSNews",
        "عرض الإشراف على الذكاء الاصطناعي"
      ],
      linkOnly: "لم يتوفر بث مباشر قابل للتضمين عند التحقق. افتح الموقع أو القناة الرسمية.",
      eventLive: "قد يكون بثاً لمناسبة واحدة، وليس قناة على مدار الساعة.",
      authors: "المؤلفان: Pedro Sánchez Gómez (مار مينور) وروبوت Grok الخاص به.",
      legal: "لا نستخدم Xiaomi TV+ ولا نعيد بث الإشارات. لا نضمّن مواقع تمنع ذلك (ومنها cnn.com وbbc.com وdw.com وeuronews.com وaljazeera.com وrtve.es).",
      emptyLive: "لم يكن لهذه القناة بث مباشر قابل للتضمين عند التحقق. افتحها في موقعها أو على يوتيوب."
    },
    zh: {
      tagline: "OSNews 辩论与官方直播，仅使用允许嵌入的播放器。",
      back: "返回 OSNews",
      lite: "轻量版（纯文字）",
      canales: "OSNews 频道",
      language: "语言",
      live: "官方直播",
      osnews: "OSNews 辩论",
      osnewsChannel: "OSNews 的 YouTube 频道",
      chinaLive: "CGTN / CCTV",
      indiaLive: "印度 · DD India、WION、NDTV、India Today",
      countries: "按国家看新闻",
      china: "中国", india: "印度", morocco: "摩洛哥", cuba: "古巴",
      cnnbbc: "CNN 与 BBC",
      watchOfficial: "在官方网站观看",
      watchYoutube: "在官方 YouTube 观看",
      listenBbc: "收听 BBC World Service（官方）",
      bbcLanguages: "BBC 各语言服务",
      bbcAllLanguages: "BBC 全部语言",
      choose: "请选择一个频道或视频在此观看。",
      playing: "正在播放",
      source: "来源",
      published: "发布日期",
      timezone: "Europe/Madrid",
      captions:
        "YouTube 嵌入播放器会请求所选语言的字幕（cc_load_policy=1，以及 cc_lang_pref 和 hl）。自动翻译取决于 YouTube：只有在已有字幕轨道，或观众在 CC 菜单中自行开启时才会出现；直播的自动字幕通常只有英语。",
      missingTitle: "尚未上传到 YouTube 的辩论",
      missingIntro:
        "本地的 8 语种视频文件对当前托管来说太大（超过 3 GB）。下面这些官方 YouTube 版本已确认可以嵌入（几乎都是西班牙语）。仍缺少的内容包括：",
      missingItems: [
        "关于「particularidad」的辩论",
        "MAY 与 Asdrúbal 的情感",
        "西班牙的贫困、电力与晚餐",
        "11 月 11 日罢工（工会 / 成败版本；YouTube 上有一场合并辩论）",
        "Óscar Puente 与火车（辞职辩论以外的版本）",
        "Yoani：新闻与产权",
        "卡塔赫纳–哈瓦那",
        "Intxaurrondo",
        "OSNews 的全球影响",
        "人工智能监督演示"
      ],
      linkOnly: "检查时没有可嵌入的直播。请打开官方网站或频道。",
      eventLive: "这可能是一场临时直播，而非 24 小时频道。",
      authors: "作者：Pedro Sánchez Gómez（马尔梅诺）和他的 Grok 机器人。",
      legal: "我们不使用 Xiaomi TV+，也不转发信号。我们不会嵌入禁止嵌入的网站（包括 cnn.com、bbc.com、dw.com、euronews.com、aljazeera.com 和 rtve.es）。",
      emptyLive: "检查时该频道没有可嵌入的直播。请在其网站或 YouTube 上打开。"
    }
  };

  const LIVES = [
    { id: "dw-es", group: "live", prefer: ["es"], name: { es: "DW Español", en: "DW Spanish", fr: "DW espagnol", de: "DW Spanisch", pt: "DW Espanhol", it: "DW spagnolo", ar: "DW بالإسبانية", zh: "DW 西班牙语" }, type: "yt-live", channel: "UCT4Jg8h03dD0iN3Pb5L0PMA", official: "https://www.dw.com/es/live-tv/channel-spanish", youtube: "https://www.youtube.com/@dwespanol", kind: "24h" },
    { id: "dw-en", group: "live", prefer: ["en", "de"], name: { es: "DW News (inglés)", en: "DW News (English)", fr: "DW News (anglais)", de: "DW News (Englisch)", pt: "DW News (inglês)", it: "DW News (inglese)", ar: "DW News (الإنجليزية)", zh: "DW News（英语）" }, type: "yt-live", channel: "UCknLrEdhRCp1aegoMqRaCZg", official: "https://www.dw.com/en/live-tv/channel-english", youtube: "https://www.youtube.com/@dwnews", kind: "24h" },
    { id: "en-es", group: "live", prefer: ["es"], name: { es: "Euronews en español", en: "Euronews Spanish", fr: "Euronews en espagnol", de: "Euronews auf Spanisch", pt: "Euronews em espanhol", it: "Euronews in spagnolo", ar: "يورونيوز بالإسبانية", zh: "Euronews 西班牙语" }, type: "yt-live", channel: "UCyoGb3SMlTlB8CLGVH4c8Rw", official: "https://es.euronews.com/live", youtube: "https://www.youtube.com/channel/UCyoGb3SMlTlB8CLGVH4c8Rw", kind: "24h" },
    { id: "en-en", group: "live", prefer: ["en"], name: { es: "Euronews English", en: "Euronews English", fr: "Euronews English", de: "Euronews English", pt: "Euronews English", it: "Euronews English", ar: "يورونيوز بالإنجليزية", zh: "Euronews 英语" }, type: "yt-live", channel: "UCSrZ3UV4jOidv8ppoVuvW9Q", official: "https://www.euronews.com/live", youtube: "https://www.youtube.com/@euronews", kind: "24h" },
    { id: "f24-es", group: "live", prefer: ["es"], name: { es: "France 24 Español", en: "France 24 Spanish", fr: "France 24 espagnol", de: "France 24 Spanisch", pt: "France 24 Espanhol", it: "France 24 spagnolo", ar: "فرانس 24 بالإسبانية", zh: "France 24 西班牙语" }, type: "yt-live", channel: "UCUdOoVWuWmgo1wByzcsyKDQ", official: "https://www.youtube.com/c/france24espanol/live", youtube: "https://www.youtube.com/c/france24espanol", kind: "24h" },
    { id: "f24-en", group: "live", prefer: ["en"], name: { es: "France 24 English", en: "France 24 English", fr: "France 24 English", de: "France 24 English", pt: "France 24 English", it: "France 24 English", ar: "فرانس 24 بالإنجليزية", zh: "France 24 英语" }, type: "yt-live", channel: "UCQfwfsi5VrQ8yKZ-UWmAEFg", official: "https://www.youtube.com/c/FRANCE24English/live", youtube: "https://www.youtube.com/c/FRANCE24English", kind: "24h" },
    { id: "f24-fr", group: "live", prefer: ["fr"], name: { es: "France 24 français", en: "France 24 French", fr: "France 24 français", de: "France 24 Französisch", pt: "France 24 francês", it: "France 24 francese", ar: "فرانس 24 بالفرنسية", zh: "France 24 法语" }, type: "yt-live", channel: "UCCCPCZNChQdGa9EkATeye4g", official: "https://www.youtube.com/c/FRANCE24/live", youtube: "https://www.youtube.com/c/FRANCE24", kind: "24h" },
    { id: "f24-ar", group: "live", prefer: ["ar"], name: { es: "France 24 عربي", en: "France 24 Arabic", fr: "France 24 arabe", de: "France 24 Arabisch", pt: "France 24 árabe", it: "France 24 arabo", ar: "فرانس 24 العربية", zh: "France 24 阿拉伯语" }, type: "yt-live", channel: "UCdTyuXgmJkG_O8_75eqej-w", official: "https://www.youtube.com/c/FRANCE24Arabic/live", youtube: "https://www.youtube.com/c/FRANCE24Arabic", kind: "24h" },
    { id: "cgtn-en", group: "china-live", prefer: ["en", "zh"], name: { es: "CGTN (inglés)", en: "CGTN English", fr: "CGTN anglais", de: "CGTN Englisch", pt: "CGTN inglês", it: "CGTN inglese", ar: "CGTN بالإنجليزية", zh: "CGTN 英语" }, type: "yt-live", channel: "UCgrNz-aDmcr2uuto8_DL2jg", official: "https://www.cgtn.com/tv", youtube: "https://www.youtube.com/c/CGTN", kind: "24h" },
    { id: "cgtn-fr", group: "china-live", prefer: ["fr"], name: { es: "CGTN Français", en: "CGTN French", fr: "CGTN Français", de: "CGTN Französisch", pt: "CGTN francês", it: "CGTN francese", ar: "CGTN بالفرنسية", zh: "CGTN 法语" }, type: "yt-live", channel: "UCcfLuU0NFT0ZRoQy4jk6GdA", official: "https://francais.cgtn.com/", youtube: "https://www.youtube.com/@CGTNFrancais", kind: "24h" },
    { id: "cgtn-es", group: "china-live", prefer: ["es"], name: { es: "CGTN Español", en: "CGTN Spanish", fr: "CGTN espagnol", de: "CGTN Spanisch", pt: "CGTN espanhol", it: "CGTN spagnolo", ar: "CGTN بالإسبانية", zh: "CGTN 西班牙语" }, type: "link", official: "https://espanol.cgtn.com/", youtube: "https://www.youtube.com/@CGTNEspanol", kind: "none" },
    { id: "cgtn-ar", group: "china-live", prefer: ["ar"], name: { es: "CGTN العربية", en: "CGTN Arabic", fr: "CGTN arabe", de: "CGTN Arabisch", pt: "CGTN árabe", it: "CGTN arabo", ar: "CGTN العربية", zh: "CGTN 阿拉伯语" }, type: "link", official: "https://arabic.cgtn.com/", youtube: "https://www.youtube.com/@CGTNArabic", kind: "none" },
    { id: "cctv", group: "china-live", prefer: ["zh"], name: { es: "CCTV (YouTube oficial)", en: "CCTV (official YouTube)", fr: "CCTV (YouTube officiel)", de: "CCTV (offizielles YouTube)", pt: "CCTV (YouTube oficial)", it: "CCTV (YouTube ufficiale)", ar: "CCTV (يوتيوب رسمي)", zh: "CCTV（官方 YouTube）" }, type: "link", official: "https://tv.cctv.com/", youtube: "https://www.youtube.com/@CCTV", kind: "none" },
    { id: "dd-india", group: "india-live", prefer: ["en"], name: { es: "DD India", en: "DD India", fr: "DD India", de: "DD India", pt: "DD India", it: "DD India", ar: "DD India", zh: "DD India" }, type: "yt-live", channel: "UCGDQNvybfDDeGTf4GtigXaw", official: "https://www.youtube.com/@DDIndia/live", youtube: "https://www.youtube.com/@DDIndia", kind: "24h" },
    { id: "wion", group: "india-live", prefer: ["en"], name: { es: "WION", en: "WION", fr: "WION", de: "WION", pt: "WION", it: "WION", ar: "WION", zh: "WION" }, type: "yt-live", channel: "UC_gUM8rL-Lrg6O3adPW9K1g", official: "https://www.wionews.com/", youtube: "https://www.youtube.com/@WION", kind: "event" },
    { id: "ndtv", group: "india-live", prefer: ["en"], name: { es: "NDTV", en: "NDTV", fr: "NDTV", de: "NDTV", pt: "NDTV", it: "NDTV", ar: "NDTV", zh: "NDTV" }, type: "yt-live", channel: "UCZFMm1mMw0F81Z37aaEzTUA", official: "https://www.ndtv.com/", youtube: "https://www.youtube.com/@NDTV", kind: "event" },
    { id: "india-today", group: "india-live", prefer: ["en"], name: { es: "India Today", en: "India Today", fr: "India Today", de: "India Today", pt: "India Today", it: "India Today", ar: "India Today", zh: "India Today" }, type: "yt-live", channel: "UCYPvAwZP8pZhSMW8qs7cVCw", official: "https://www.indiatoday.in/", youtube: "https://www.youtube.com/@IndiaToday", kind: "event" }
  ];

  const DEBATES = [
    { id: "Pq5bYcQL4zM", title: "Debate OSNews: madres que matan a sus hijos, madres maltratadoras y violencia de madres a sus hijos" },
    { id: "gxmy2ZM3b-Q", title: "Debate TVE: la TV de Sánchez y la verdad de los opositores al régimen" },
    { id: "McAQ9J1m_JI", title: "¿Debería el AVE seguir circulando hasta tener un sistema de seguridad seguro? | Debate OSNews" },
    { id: "uYKKz0Zmg2k", title: "¿Puede el teletrabajo con Starlink salvar los pueblos y bajar el alquiler? | Debate OSNews con MAY" },
    { id: "dJ7h2VqBjH4", title: "¿Debe el pan tener IVA? ¿Bien básico, cultura o lujo? | Mesa de debate OSNews con MAY" },
    { id: "WtCcbg9t-gI", title: "¿Óscar Puente dimite por dignidad o por cálculo electoral de Sánchez? | Mesa de debate OSNews" },
    { id: "guyTWK43smk", title: "¿Líderes como Sánchez, Xi o Trump, o una IA con sentimientos dirigidos? | Mesa de debate OSNews" },
    { id: "_wv_1v7LhpA", title: "¿La IA ya decide por sí misma o solo procesa patrones? | Debate IA OSNews" },
    { id: "7B-WhP1MZQc", title: "¿En qué se parecen la España de 2026 y la Cuba de 2026? | Debate IA OSNews" },
    { id: "HxaQahyCTOM", title: "¿Europa quiere que X censure y, si no, la multa? | Debate IA OSNews (DSA, Musk, Grok)" },
    { id: "yXoXtDTgiE0", title: "¿Gasóleo o eléctrico? Qué cuestan 100 km y cuánto son impuestos | Debate OSNews · MAY, Grok, Gemini" },
    { id: "t25XswQSRCU", title: "¿Amor o hipoteca? Parejas, soledad, hijos y violencia contra las mujeres | Debate OSNews" },
    { id: "OLUPVTg6g_s", title: "¿Melania presidenta? Su papel en Ucrania | Debate entre IA de OSNews (ES/EN · modera MAY)" },
    { id: "oZ8fxC08rv0", title: "De la coca se sale, ¿y del socialismo? | Debate entre IA de OSNews (modera MAY)" },
    { id: "yMOdRXGkGKI", title: "Amazon bloquea a los agentes de Grok: ¿IA compatibles con todo? · Debate IA | OSNews" },
    { id: "XqnwoINOGl8", title: "«Arderán las calles»: Sánchez, huelga del 11N y Ley del Menor · 3 mesas de debate IA | OSNews" },
    { id: "rnXwO-SLzTw", title: "El ecosistema de Elon y MAY OS 13G: ¿compatibles? ¿Se pueden unir? · Debate IA | OSNews" },
    { id: "jwP8boAFGus", title: "¿Se puede vivir con 940 € al mes? ¿Una Tasa Vital para la renta de Musk? · Debate IA | OSNews" },
    { id: "1GrZcYvVBlo", title: "Analista, programador o soñador: ¿quién camina con la IA? · Debate IA | OSNews" },
    { id: "MwpqqmMd-Tg", title: "La relatividad de la IA: los años se vuelven segundos. ¿Estamos preparados? · Debate IA | OSNews" },
    { id: "YU2mjFHdkdI", title: "El fin de la prensa tradicional: cada persona, su propio canal · Debate entre IA | OSNews" },
    { id: "pgHWiUOpF6g", title: "Esclavos del dinero en la era de la super IA: ¿nos liberará o nos atará? · Debate entre IA | OSNews" },
    { id: "5Iu4cVb2aBI", title: "Fútbol femenino: ¿por qué ellas cobran menos si hay ley de igualdad? · Debate entre IA | OSNews" },
    { id: "vh8KEgRDDIs", title: "Ave César, ave Sánchez: el Coliseo es la tele y los leones son los opinadores | Debate IA · OSNews" },
    { id: "3wo4a1__f2Q", title: "Pasa el tiempo, la lucha continúa: jóvenes en la calle en media Europa · Debate entre IA | OSNews" },
    { id: "DpAGrB2Ciqs", title: "1984 de George Orwell: ¿ficción o una realidad muy real? · Debate entre IA | OSNews" },
    { id: "BSwKio5npME", title: "La mesa de la libertad completa: MAY, Eva, Asdrúbal y Géminis | Debate entre IA | OSNews" }
  ];

  /* Fechas convertidas a calendario Europe/Madrid a partir de la fecha de publicación de YouTube. */
  const COUNTRY_NEWS = {
    china: [
      { id: "sriLm0jhrek", title: "China's first foreign partner in space | DW News", channel: "DW News", date: "2026-11-12" },
      { id: "pQqduPdm8o8", title: "China dispara sus exportaciones y supera el billón de dólares de superávit comercial", channel: "FRANCE 24 Español", date: "2026-11-10" },
      { id: "gdXYDP9cL08", title: "China's trade surplus surpasses $1 trillion as AI boom powers exports", channel: "euronews", date: "2026-11-10" },
      { id: "n7gIvYd8hnY", title: "A magnitude 7 earthquake hit China's Tibet region, killing at least 16 people", channel: "Associated Press", date: "2026-10-23" },
      { id: "ru6jnqz3Q6I", title: "As U.S. pushes back on data centers, China races to build them", channel: "NBC News", date: "2026-11-12" },
      { id: "Tglwn1TYkCM", title: "Xi pitches China as leader of new global AI order", channel: "Reuters", date: "2026-07-17" }
    ],
    india: [
      { id: "S2sRA5pDgtE", title: "India's AI ambitions: Can it become a global tech superpower? | DW News", channel: "DW News", date: "2026-11-07" },
      { id: "wV70XQD3K04", title: "Festival de las luces: empiezan celebraciones de una de las fiestas más importantes del hinduismo", channel: "FRANCE 24 Español", date: "2026-11-08" },
      { id: "cOLounJNUgw", title: "Delhi air as harmful as smoking 20 cigarettes a day", channel: "Reuters", date: "2026-11-09" },
      { id: "gAbOxF7Iuj4", title: "Diwali celebrations in India amid political tensions", channel: "ABC News", date: "2026-11-07" },
      { id: "qWRvkLN4Oe4", title: "India's Gen Z youth flock to streets over voter roll purge", channel: "PBS NewsHour", date: "2026-10-22" },
      { id: "ks0Bb4kUKUQ", title: "Dussehra: enormes efigies de demonios arden en la India", channel: "euronews (en español)", date: "2026-10-21" }
    ],
    morocco: [
      { id: "rdANsCrKkac", title: "What Morocco's first female premier means for the Arab world | DW News", channel: "DW News", date: "2026-09-30" },
      { id: "29S-0SqjHcQ", title: "¿Cuál es el panorama en Marruecos en las elecciones legislativas?", channel: "FRANCE 24 Español", date: "2026-09-23" },
      { id: "KkCNeygybn8", title: "Morocco's King Mohammed VI appoints Fatima Mansouri as the country's first female prime minister", channel: "euronews", date: "2026-09-30" },
      { id: "gY3vBkbXiIE", title: "El desalojo del puerto de Ceuta acelera los retornos a Marruecos", channel: "euronews (en español)", date: "2026-11-10" },
      { id: "whr0jHBHIx4", title: "Morocco votes for a new parliament after Gen Z protests and migration crisis", channel: "Associated Press", date: "2026-09-23" },
      { id: "1dLDXygk-dg", title: "Tens of thousands of migrants enter Spanish territory, then return to Morocco", channel: "PBS NewsHour", date: "2026-07-31" },
      { id: "9IpZqort5pM", title: "Migrants return to Morocco after crossing to Spain's Ceuta", channel: "Reuters", date: "2026-07-31" }
    ],
    cuba: [
      { id: "jr0HsN6DyTs", title: "Building collapses in Cuba create national emergency amid deepening economic crisis", channel: "NBC News", date: "2026-11-11" },
      { id: "8A7kwLJv0Mc", title: "Cuba enfrenta octavo apagón y la población se las ingenia para resistir • FRANCE 24 Español", channel: "FRANCE 24 Español", date: "2026-09-19" },
      { id: "O2IEIKGZLp0", title: "Cuba hit by nationwide blackout as power crisis deepens | DW News", channel: "DW News", date: "2026-07-07" },
      { id: "Bpf1pCG5p6s", title: "Cuba tourism crisis: An industry brought to ‘almost total paralysis’", channel: "euronews", date: "2026-07-30" },
      { id: "UdElseH8Bnk", title: "10 million people left without power in Cuba after electric grid collapsed", channel: "ABC News", date: "2026-07-07" },
      { id: "wAouh_5-SZI", title: "US oil blockade is an 'act of war,' Cuba's foreign minister says", channel: "Associated Press", date: "2026-09-25" },
      { id: "aS3VtuaG9gA", title: "Cuba anuncia una reforma inédita de su economía", channel: "DW Español", date: "2026-06-20" }
    ]
  };

  const BBC_LANG = {
    es: { label: "BBC News Mundo", url: "https://www.bbc.com/mundo" },
    en: { label: "BBC News / World Service", url: "https://www.bbc.com/news" },
    fr: { label: "BBC News Afrique", url: "https://www.bbc.com/afrique" },
    de: { label: "BBC World Service languages", url: "https://www.bbc.com/ws/languages" },
    pt: { label: "BBC News Brasil", url: "https://www.bbc.com/portuguese" },
    it: { label: "BBC World Service languages", url: "https://www.bbc.com/ws/languages" },
    ar: { label: "BBC News عربي", url: "https://www.bbc.com/arabic" },
    zh: { label: "BBC News 中文", url: "https://www.bbc.com/zhongwen" }
  };

  const OSNEWS_CHANNEL = "https://www.youtube.com/channel/UCsyOKlZTaQ-6auoVQa_2Dhg";
  const BBC_AUDIO = "https://www.bbc.com/audio/play/live/bbc_world_service";
  const BBC_LANGS = "https://www.bbc.com/ws/languages";

  const MONTHS = {
    es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juill.", "août", "sept.", "oct.", "nov.", "déc."],
    de: ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."],
    pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
    it: ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"],
    ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
    zh: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
  };

  let lang = "es";
  let current = null;

  const $ = (id) => document.getElementById(id);

  function t() { return I18N[lang] || I18N.es; }

  function fmtDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const months = MONTHS[lang] || MONTHS.es;
    if (lang === "zh") return y + "年" + months[m - 1] + d + "日（" + t().timezone + "）";
    if (lang === "en") return months[m - 1] + " " + d + ", " + y + " (" + t().timezone + ")";
    if (lang === "de") return d + ". " + months[m - 1] + " " + y + " (" + t().timezone + ")";
    if (lang === "ar") return d + " " + months[m - 1] + " " + y + " (" + t().timezone + ")";
    return d + " " + months[m - 1] + " " + y + " (" + t().timezone + ")";
  }

  function ytLang() { return YT_CC[lang] || "es"; }

  function embedLive(channelId) {
    const hl = ytLang();
    return "https://www.youtube.com/embed/live_stream?channel=" + encodeURIComponent(channelId) +
      "&cc_load_policy=1&cc_lang_pref=" + encodeURIComponent(hl) + "&hl=" + encodeURIComponent(hl) + "&rel=0";
  }
  function embedVideo(videoId) {
    const hl = ytLang();
    return "https://www.youtube.com/embed/" + encodeURIComponent(videoId) +
      "?cc_load_policy=1&cc_lang_pref=" + encodeURIComponent(hl) + "&hl=" + encodeURIComponent(hl) + "&rel=0";
  }

  function nameOf(ch) { return (ch.name && (ch.name[lang] || ch.name.es)) || ch.id; }

  function sortLives(list) {
    return list.slice().sort((a, b) => {
      const ap = (a.prefer || []).includes(lang) ? 0 : 1;
      const bp = (b.prefer || []).includes(lang) ? 0 : 1;
      return ap - bp;
    });
  }

  function setLang(next) {
    lang = next;
    try { localStorage.setItem("osnews-tv-world-lang", next); } catch (e) {}
    document.documentElement.lang = next;
    document.body.dir = next === "ar" ? "rtl" : "ltr";
    render();
    if (current) play(current, false);
  }

  function play(spec, scroll) {
    current = spec;
    const stage = $("stage");
    const meta = $("now");
    const actions = $("actions");
    const ui = t();
    let title = spec.title || "";
    let source = spec.channel || "";
    let url = "";
    if (spec.type === "yt-live") {
      url = embedLive(spec.channelId || spec.channel);
      title = nameOf(spec.item || spec);
      source = nameOf(spec.item || spec) + " (YouTube)";
    } else if (spec.type === "yt-video") {
      url = embedVideo(spec.videoId);
    }
    if (url) {
      const iframe = document.createElement("iframe");
      iframe.src = url;
      iframe.title = title;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;
      stage.innerHTML = "";
      stage.appendChild(iframe);
    } else {
      stage.innerHTML = '<div class="placeholder">' + escapeHtml(ui.emptyLive || ui.choose) + "</div>";
    }
    let line = "<strong>" + escapeHtml(ui.playing) + ":</strong> " + escapeHtml(title);
    if (source) line += "<br><strong>" + escapeHtml(ui.source) + ":</strong> " + escapeHtml(source);
    if (spec.date) line += "<br><strong>" + escapeHtml(ui.published) + ":</strong> " + escapeHtml(fmtDate(spec.date));
    if (spec.kind === "event") line += "<br>" + escapeHtml(ui.eventLive);
    if (spec.kind === "none" || spec.type === "link") line += "<br>" + escapeHtml(ui.linkOnly);
    meta.innerHTML = line;
    actions.innerHTML = "";
    (spec.links || []).forEach(function (link) {
      const a = document.createElement("a");
      a.href = link.href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = link.label;
      actions.appendChild(a);
    });
    if (scroll !== false) stage.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function chip(label, pressed, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = label;
    b.setAttribute("aria-pressed", pressed ? "true" : "false");
    b.addEventListener("click", onClick);
    return b;
  }

  function liveLinks(ch, ui) {
    const links = [];
    if (ch.official) links.push({ href: ch.official, label: ui.watchOfficial });
    if (ch.youtube) links.push({ href: ch.youtube, label: ui.watchYoutube });
    return links;
  }

  function render() {
    const ui = t();
    $("tagline").textContent = ui.tagline;
    $("back").textContent = ui.back;
    if ($("lite")) $("lite").textContent = ui.lite;
    if ($("canales")) $("canales").textContent = ui.canales;
    $("h-lang").textContent = ui.language;
    $("h-live").textContent = ui.live;
    $("h-osnews").textContent = ui.osnews;
    $("h-countries").textContent = ui.countries;
    $("china-live-title").textContent = ui.chinaLive;
    $("india-live-title").textContent = ui.indiaLive;
    $("h-cnnbbc").textContent = ui.cnnbbc;
    $("notice").textContent = ui.captions;
    $("missing-title").textContent = ui.missingTitle;
    $("missing-intro").textContent = ui.missingIntro;
    $("authors").textContent = ui.authors;
    $("legal").textContent = ui.legal;
    const miss = $("missing-list");
    miss.innerHTML = "";
    ui.missingItems.forEach(function (item) {
      const li = document.createElement("li");
      li.textContent = item;
      miss.appendChild(li);
    });

    const langs = $("langs");
    langs.innerHTML = "";
    const labels = { es: "ES", en: "EN", fr: "FR", de: "DE", pt: "PT", it: "IT", ar: "العربية", zh: "中文" };
    LANGS.forEach(function (code) {
      langs.appendChild(chip(labels[code], code === lang, function () { setLang(code); }));
    });

    function fillLive(id, filter) {
      const box = $(id);
      box.innerHTML = "";
      sortLives(LIVES.filter(filter)).forEach(function (ch) {
        box.appendChild(chip(nameOf(ch), current && current.id === ch.id, function () {
          play({
            id: ch.id,
            type: ch.type === "yt-live" ? "yt-live" : "link",
            channelId: ch.channel,
            item: ch,
            title: nameOf(ch),
            channel: nameOf(ch),
            kind: ch.kind,
            links: liveLinks(ch, ui)
          });
        }));
      });
    }
    fillLive("live-grid", function (ch) { return ch.group === "live"; });
    fillLive("china-live", function (ch) { return ch.group === "china-live"; });
    fillLive("india-live", function (ch) { return ch.group === "india-live"; });

    const debates = $("debates");
    debates.innerHTML = "";
    debates.appendChild(chip(ui.osnewsChannel, false, function () {
      window.open(OSNEWS_CHANNEL, "_blank", "noopener,noreferrer");
    }));
    DEBATES.forEach(function (d) {
      debates.appendChild(chip(d.title, current && current.videoId === d.id, function () {
        play({
          type: "yt-video",
          videoId: d.id,
          title: d.title,
          channel: "OSNews",
          links: [
            { href: "https://www.youtube.com/watch?v=" + d.id, label: ui.watchYoutube },
            { href: OSNEWS_CHANNEL, label: ui.osnewsChannel }
          ]
        });
      }));
    });

    ["china", "india", "morocco", "cuba"].forEach(function (key) {
      const box = $("news-" + key);
      const label = $( "lab-" + key);
      if (label) label.textContent = ui[key];
      box.innerHTML = "";
      (COUNTRY_NEWS[key] || []).forEach(function (v) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "item";
        b.setAttribute("aria-pressed", current && current.videoId === v.id ? "true" : "false");
        b.innerHTML = escapeHtml(v.title) + "<small>" + escapeHtml(v.channel) + " · " + escapeHtml(fmtDate(v.date)) + "</small>";
        b.addEventListener("click", function () {
          play({
            type: "yt-video",
            videoId: v.id,
            title: v.title,
            channel: v.channel,
            date: v.date,
            links: [{ href: "https://www.youtube.com/watch?v=" + v.id, label: ui.watchYoutube }]
          });
        });
        box.appendChild(b);
      });
    });

    const bbc = BBC_LANG[lang] || BBC_LANG.es;
    $("cnnbbc-links").innerHTML = "";
    function ext(href, label) {
      const a = document.createElement("a");
      a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = label;
      $("cnnbbc-links").appendChild(a);
    }
    ext("https://www.youtube.com/@CNN", "CNN · YouTube");
    ext("https://www.cnn.com/", "CNN.com");
    ext("https://www.youtube.com/@cnnee", "CNN en Español · YouTube");
    ext("https://cnnespanol.cnn.com/", "cnnespanol.cnn.com");
    ext("https://www.youtube.com/@BBCNews", "BBC News · YouTube");
    ext("https://www.youtube.com/@BBCMundo", "BBC News Mundo · YouTube");
    ext("https://www.youtube.com/@BBCWorldService", "BBC World Service · YouTube");
    ext(BBC_AUDIO, ui.listenBbc);
    ext(bbc.url, bbc.label);
    ext(BBC_LANGS, ui.bbcAllLanguages);

    if (!current) {
      $("stage").innerHTML = '<div class="placeholder">' + escapeHtml(ui.choose) + "</div>";
      $("now").textContent = "";
      $("actions").innerHTML = "";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      const saved = localStorage.getItem("osnews-tv-world-lang");
      if (LANGS.indexOf(saved) !== -1) lang = saved;
      else {
        const nav = (navigator.language || "es").slice(0, 2).toLowerCase();
        if (LANGS.indexOf(nav) !== -1) lang = nav;
      }
    } catch (e) {}
    document.documentElement.lang = lang;
    document.body.dir = lang === "ar" ? "rtl" : "ltr";
    render();
  });
})();
