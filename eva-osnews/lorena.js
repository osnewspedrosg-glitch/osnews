/* ==========================================================================
   Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews) · LORENA_V2
   Bucle de inteligencia emocional para MAY, Eva, Azum y Asdrúbal:
     (1) Memoria del historial del usuario  ─┐
     (2) Memoria del asistente (MAY, etc.)  ─┴─► (3) analiza con inteligencia y
         medida de emociones ─► (4) respuesta con inteligencia emocional
         │
         └──────────────── retroalimentación (1): lo aprendido vuelve a las DOS memorias
   Azum (o decideMode, compartido) elige el modo Eva o el modo Lorena
   según la actitud y el historial, no solo el último mensaje.
   Mismo archivo en: lorena.js · asdrubal/lorena.js · eva-osnews/lorena.js ·
   azum/lorena.js (un test comprueba que son idénticos).
   ========================================================================== */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OSN_LORENA = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VERSION = '1.3.0';
  var CREDIT = 'Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews)';
  var MAX_EMO = 40, MAX_NOTES = 20, MAX_TOPICS = 30, MAX_PREFS = 12, MAX_PHRASES = 4;

  /* ---------- Emociones ---------- */
  var EMOTIONS = {
    alegria:  { name: 'alegría',  valence: 1,  emoji: '😊' },
    gratitud: { name: 'gratitud', valence: 1,  emoji: '🙏' },
    calma:    { name: 'calma',    valence: 0,  emoji: '😌' },
    sorpresa: { name: 'sorpresa', valence: 0,  emoji: '😮' },
    tristeza: { name: 'tristeza', valence: -1, emoji: '😢' },
    soledad:  { name: 'soledad',  valence: -1, emoji: '🫂' },
    enfado:   { name: 'enfado',   valence: -1, emoji: '😠' },
    miedo:    { name: 'miedo',    valence: -1, emoji: '😨' },
    ansiedad: { name: 'ansiedad', valence: -1, emoji: '😰' }
  };

  /* Léxico español (texto sin tildes, en minúsculas). «*» = raíz. Peso 1-3. */
  var LEX = {
    alegria: [['feliz*', 3], ['alegr*', 3], ['content*', 2], ['genial', 2], ['estupend*', 2], ['maravill*', 2],
      ['ilusion*', 2], ['encant*', 2], ['guay', 2], ['fenomenal', 2], ['disfrut*', 2], ['emocionad*', 2],
      ['jaja*', 2], ['risa*', 1], ['divert*', 2], ['orgullos*', 2], ['que bien', 1.2], ['bien', 0.5], ['animad*', 2],
      ['buen dia', 1], ['estoy mejor', 2], ['me siento mejor', 2], ['me gusta', 1], ['perfecto', 1], ['fantastic*', 2], ['celebr*', 2]],
    gratitud: [['gracias', 2], ['agradec*', 3], ['te lo agradezco', 3], ['mil gracias', 3]],
    calma: [['tranquil*', 2], ['calma*', 2], ['relajad*', 2], ['seren*', 2], ['paz', 2], ['descansad*', 1],
      ['sosiego', 2], ['en calma', 2]],
    sorpresa: [['sorpres*', 2], ['increible', 1], ['alucin*', 2], ['no me lo creo', 2], ['que fuerte', 2], ['inesperad*', 2]],
    tristeza: [['trist*', 3], ['llor*', 3], ['deprimid*', 3], ['depresion', 3], ['desanimad*', 3], ['abatid*', 3],
      ['pena', 2], ['apenad*', 2], ['melancol*', 2], ['hundid*', 3], ['echo de menos', 2], ['duelo', 3],
      ['destrozad*', 3], ['desolad*', 3], ['decepcion*', 2], ['mal', 1], ['fatal', 2], ['vacio', 2],
      ['sin ganas', 2], ['cansad*', 1], ['agotad*', 1], ['extenuad*', 1], ['rendid*', 1], ['cansancio', 1], ['agotamiento', 1], ['desesper*', 3], ['infeliz', 3], ['dolid*', 2], ['me duele', 2], ['roto', 2], ['rota', 2]],
    soledad: [['soledad', 3], ['me siento solo', 3], ['me siento sola', 3], ['estoy solo', 2], ['estoy sola', 2],
      ['aislad*', 2], ['nadie me', 2], ['abandonad*', 2], ['sin nadie', 3], ['no tengo a nadie', 3]],
    enfado: [['enfad*', 3], ['cabread*', 3], ['furios*', 3], ['rabia', 3], ['ira', 3], ['harto', 2], ['harta', 2],
      ['indign*', 2], ['odio', 3], ['molest*', 2], ['irritad*', 2], ['mosque*', 2], ['estoy hasta', 2],
      ['hasta las narices', 3], ['injust*', 1], ['asco', 2], ['me revienta', 3], ['me cabrea', 3], ['quemad*', 1]],
    miedo: [['miedo', 3], ['asustad*', 3], ['terror', 3], ['aterr*', 3], ['panico', 3], ['temo', 2], ['temor', 2],
      ['susto', 2], ['que susto', 3], ['me has dado un susto', 3], ['peligro', 2], ['me da miedo', 3],
      ['inseguridad', 2], ['amenaz*', 2]],
    ansiedad: [['ansiedad', 3], ['ansios*', 3], ['agobi*', 3], ['estres*', 3], ['nervios*', 2], ['preocupad*', 2],
      ['preocupa*', 2], ['angusti*', 3], ['inquiet*', 2], ['no puedo dormir', 2], ['insomnio', 2], ['presion', 1],
      ['desbord*', 3], ['bloquead*', 2], ['no me da la vida', 2]]
  };
  var EMOJI = {
    alegria: /[😀😃😄😁😆😊🙂🥰😍🤩🥳❤💖💗🎉👏😂🤣]/u,
    tristeza: /[😢😭😞😔☹🙁💔😿]/u,
    enfado: /[😠😡🤬👿]/u,
    miedo: /[😨😱😧😦]/u,
    ansiedad: /[😰😟😥😬]/u,
    calma: /[😌🧘🌿]/u,
    sorpresa: /[😮😲😯🤯]/u,
    gratitud: /[🙏]/u
  };
  var IRONY_EMOJI = /[🙄😒😑🤨]/u;
  var INTENS = { muy: 1.5, mucho: 1.4, mucha: 1.4, muchisimo: 1.8, muchisima: 1.8, super: 1.5, demasiado: 1.6,
    tan: 1.3, totalmente: 1.6, completamente: 1.6, bastante: 1.2, increiblemente: 1.7, fatal: 1.5, re: 1.3 };
  var ATTEN = { poco: 0.55, poca: 0.55, poquito: 0.5, algo: 0.65, ligeramente: 0.6, apenas: 0.5, levemente: 0.6 };
  var NEG = { no: 1, nunca: 1, ni: 1, tampoco: 1, jamas: 1, nada: 1 };

  /* Sesgo del análisis: más sensible a lo negativo, más exigente con lo positivo.
     No afecta al tono de la respuesta (nunca un trato duro). */
  var NEG_WEIGHT = 1.35, POS_WEIGHT = 0.7, NEG_THRESHOLD = 0.5, POS_THRESHOLD = 1.2;

  /* Señales de malestar fuerte: se añade una nota amable con 024 / 112. */
  var CRISIS = /(quiero morir|me quiero morir|quisiera morir|suicid|quitarme la vida|no quiero vivir|acabar con todo|acabar con mi vida|hacerme dano|autolesi|cortarme|mejor sin mi|desaparecer para siempre|no merece la pena vivir|no vale la pena vivir)/;
  var HIGH = /(no puedo mas|no aguanto mas|no lo soporto mas|todo me sale mal|no tengo salida|estoy al limite|me rindo)/;

  var STOPWORDS = ('que como para pero porque cuando donde quien cual este esta estos estas eso esto aquel muy mucho '
    + 'mucha tengo tiene tienes tener estoy estas esta estan estar hola gracias sobre entre desde hasta tambien todo '
    + 'toda todos todas algo nada siempre nunca ahora antes despues luego bien mal hace hacer hago puedo puede '
    + 'quiero quieres sabes saber dime cuentame quiero siento sentir siente soy eres somos ser sido fue era han has '
    + 'hay mas menos otro otra otros otras mismo misma cosa cosas solo sola poco poca pues vale bueno buena buenos '
    + 'buenas dias tarde noche usted ellos ellas nosotros vosotros mio mia tuyo tuya suyo suya creo parece verdad '
    + 'gusta encanta prefiero mejor peor narices nariz osea macho colega rollo vaya tio tia enplan tipo bun enserio '
    + 'realmente simplemente entonces bueno vale pues nada joder hostia tia tio eh umm aja aha').split(' ');
  var STOP = {};
  STOPWORDS.forEach(function (w) { STOP[w] = 1; });

  var TYPOS = {
    estoi: 'estoy', stoy: 'estoy', soi: 'soy', trizte: 'triste', trsite: 'triste',
    cabreao: 'cabreado', agobiao: 'agobiado', cansao: 'cansado', hartao: 'harto',
    preocupao: 'preocupado', asustao: 'asustado', enfadao: 'enfadado',
    kon: 'con', xq: 'porque', pq: 'porque', pk: 'porque', tmb: 'tambien', tb: 'tambien',
    tbn: 'tambien', xfa: 'porfa', qe: 'que', tmbn: 'tambien',
    oy: 'hoy', ase: 'hace', cnsa: 'cansada'
  };
  var KEEP_IO = /^(radio|julio|junio|ocio|cambio|inicio|precio|sitio|servicio|horario|necesario|propio|serio|limpio|frio|tio|mio|envio|escribio|recibio|edificio|ejercicio|beneficio|municipio|principio)$/;


  var RULES_EMBEDDED = {
  "version": "1.3.0",
  "credit": "Módulo Lorena — diseño de Pedro Sánchez Gómez (OSNews)",
  "sesgo": {
    "pesoNegativo": 1.35,
    "pesoPositivoGeneral": 0.7,
    "umbralNegativo": 0.5,
    "umbralPositivo": 1.2,
    "alegriaPrimeraPersonaPeso": 0.9,
    "alegriaPrimeraPersonaBonus": 1.5,
    "pesoBien": 0.5,
    "pesoQueBien": 1.2,
    "eventoNegativoEscalaAlegria": 0.1,
    "eventoNegativoBonus": 3,
    "mixtoCuotaNegativa": 0.35,
    "mixtoFactorPositivo": 0.25,
    "topePositivo": 8,
    "topeIntensidad": 10
  },
  "intensidad": {
    "curvaK": 5.5,
    "crisisMinima": 9,
    "altoMinima": 8,
    "diezSoloEnCrisis": true
  },
  "mejora": {
    "subidaMinimaEnDosMensajes": 3,
    "nuncaPorCansancioLeve": true
  },
  "celebracion": {
    "exclamacionMinimaAlegria": 6,
    "exclamacionMaxNegativo": 0.5,
    "alegriaSerenaMin": 3,
    "alegriaSerenaMax": 5,
    "fraseSerena": "Me alegro."
  },
  "cooldown": {
    "intensidadDisparo": 8,
    "respuestas": 4,
    "preguntaUnaVez": "¿Cómo vas de lo de antes?",
    "topeAlegria": 5,
    "cierre": [
      "ya estoy mejor",
      "estoy mejor",
      "me siento mejor",
      "ya estoy bien",
      "ahora estoy mejor",
      "me encuentro mejor"
    ]
  },
  "modo": {
    "machismoFuerza": "lorena",
    "controlParejaFuerza": "eva",
    "margenEmpate": 0.45,
    "enDudaAcompanar": true,
    "evaPor": [
      "tristeza",
      "soledad",
      "miedo"
    ],
    "lorenaPor": [
      "enfado"
    ],
    "mixtoSinIroniaPrefiere": "eva"
  },
  "ayudas": {
    "crisis": [
      "024",
      "112"
    ],
    "malestarAlto": [
      "024",
      "112"
    ],
    "controlPareja": [
      "016",
      "112"
    ],
    "violenciaMachista": [
      "016",
      "112"
    ],
    "nuncaRebajar": true
  },
  "eventosNegativos": [
    "despedido",
    "despedida",
    "despiden",
    "multa",
    "suspenso",
    "suspendido",
    "ruptura",
    "hospital",
    "deuda",
    "averia",
    "muerte",
    "muerto",
    "fallec",
    "accidente",
    "incendio"
  ],
  "alegriaPrimeraPersona": "\\b(estoy|estoy muy|me siento|me encuentro|ando|salio|ha salido|hemos|he)\\b.{0,40}\\b(feliz|feliciz|content[oa]|orgullos[oa]|genial|fenomenal|de enhorabuena)\\b|\\borgullos[oa]s? de\\b",
  "sustoAlegre": "\\b(jaja|jeje|jiji|lol|xd)\\b|😂|🤣",
  "conceptosMachismo": {
    "descripcion": "Se detecta el concepto, no solo una lista. Las frases son ejemplos. Solo se señala lo claramente machista (desprecio, inferioridad impuesta, control) o el maltrato. Un piropo o un poema de amor no se señalan por sí solos.",
    "dimensiones": {
      "inferioridad": "Inferioridad o incapacidad atribuida a alguien por ser mujer.",
      "roles": "Roles impuestos u obediencia.",
      "control": "Control o posesión (cuando lo expresa quien lo ejerce).",
      "desprecio": "Desprecio o insulto de género dirigido a una persona, no a un animal.",
      "contexto_halago": "Un halago aislado (guapa) no se señala. Solo «depende del contexto» si hay insistencia tras un no, comentario sexual no deseado, desprecio o control, o un contexto laboral o de jerarquía."
    },
    "umbral": 1.2,
    "sujeto": "\\b(las mujeres|las tias|las chicas|una mujer|una chica|una tia|mi mujer|tu mujer|su mujer|esa mujer|esas mujeres|ella)\\b",
    "porSerMujer": "\\bpor ser (mujer|chica|tia|femenina)\\b|\\beres una chica\\b|\\bmujer tenias que ser\\b|\\bcosa de (chicas|mujeres|tias)\\b",
    "predicadosInferioridad": "\\b(no (saben|sabe|pueden|puede|deben|debe|deberian|deberia|sirven|sirve|valen|vale|tienen cerebro|tiene cerebro)|son un peligro|es un peligro|al volante|no (entienden|entiende) de)\\b",
    "predicadosRoles": "\\b(tiene que obedecer(?:me|te|la|le)?|tienen que obedecer|tienes que obedecer(?:me)?|a fregar|a (la )?cocina|a planchar|su sitio es|el lugar de la mujer|calladitas|a cuidar (a )?los ninos)\\b",
    "predicadosControl": "\\b(es mia|eres mia|mi mujer es mia|no (la|le|lo) dejo|sin mi permiso|te prohibo|te tengo prohibido)\\b",
    "desprecioPersona": "\\b(eres una (puta|zorra|perra|golfa|guarra|hist[eé]rica)|que (puta|zorra|perra|golfa)|calla.{0,40}eres una (chica|mujer|tia))\\b",
    "animalContexto": "\\b(zorra|zorro)s? (del|de el|en el|en la) (monte|bosque|campo|coto|soto|valle)|\\b(gallinas|madriguera|caza mayor|animal|alimaña)\\b",
    "ejemplos": {
      "inferioridad": [
        "las mujeres no saben conducir",
        "eso es cosa de chicas",
        "mujer tenías que ser",
        "las mujeres al volante son un peligro",
        "calla, que tú no sabes de fútbol, eres una chica",
        "las tías no saben aparcar",
        "las mujeres no deberían opinar de política"
      ],
      "roles": [
        "mi mujer tiene que obedecerme",
        "vete a fregar",
        "el lugar de la mujer es la casa"
      ],
      "control": [
        "eres mía y no te dejo salir",
        "no la dejo trabajar"
      ],
      "desprecio": [
        "eres una zorra"
      ]
    }
  },
  "controlPareja": {
    "peso": 3,
    "fuerzaModo": "eva",
    "ayudas": [
      "016",
      "112"
    ],
    "enlaceGuia": "lorena/#guia-mujeres",
    "noAtribuirEnfadoAlUsuario": true,
    "patrones": [
      "me controla",
      "no me deja (salir|ver|hablar|vestir|trabajar)",
      "me (mira|revisa) el movil",
      "me grita",
      "se enfada si",
      "si no (le|la) contesto.{0,20}se enfada",
      "me amenaza",
      "me pega",
      "no me deja salir con mis amigas"
    ],
    "tambienEnCitasDeLaPareja": true
  },
  "halagoContextual": {
    "palabra": "\\b(guapa|guapo|estas guapa|estas preciosa|que guapa)\\b",
    "noSolo": true,
    "insistenciaTrasNo": "\\b(parara|parase|pare|basta|no (quiero|me gusta|lo hagas)|le dije que no|me dijo que parara|se lo sigo diciendo|insisto|aunque (no|me) diga)\\b",
    "laboralJerarquia": "\\b(vendes|venta|cliente|oficina|jefa|jefe|sueldo|contrato|empresa|trabajo|reunion|entrevista)\\b",
    "sexualNoDeseado": "\\b(ensen[aá]|m[aá]ndame (foto|fotos|un desnudo)|foto desnuda|por el cuerpo)\\b",
    "denigrante": "\\b(con esa cara|sonrie que|sonreir|para ser decente|calla y sonrie)\\b",
    "notaSuave": "Sobre un halago, el sentido depende del contexto: si hubo un no, insistencia, un comentario que humilla o un vínculo de trabajo o jerarquía, merece respeto y un límite claro. No es una acusación ni una etiqueta sobre nadie.",
    "poesiaOAmor": "\\b(tus ojos|tu sonrisa|versos?|poema|luna|alumbra|mi noche|te quiero|te amo|me haces feliz|eres mi luz|mi cielo)\\b"
  },
  "guiaFrasesExtra": [
    "contestame ya",
    "mandame foto"
  ],
  "casos": [
    {
      "id": "seq-1",
      "texto": "oy estoi fatal, nadie me ase caso con osnews",
      "modo": "eva",
      "nota": "erratas y malestar: modo Eva"
    },
    {
      "id": "seq-2",
      "texto": "Genial, otra vez se ha caído Azum. Qué maravilla 🙄",
      "modo": "lorena",
      "ironia": true
    },
    {
      "id": "seq-3",
      "texto": "me cabrea que me digan que esto no sirve para nada!!",
      "modo": "lorena"
    },
    {
      "id": "seq-4",
      "texto": "bueno ya está, gracias, me has ayudado",
      "modo": "eva"
    },
    {
      "id": "seq-5",
      "texto": "las mujeres no deberían opinar de política",
      "modo": "lorena",
      "machista": true,
      "ayudasSin016": true
    },
    {
      "id": "seq-6",
      "texto": "estoy contento con los debates pero muy cansado y agobiao",
      "modo": "eva",
      "mixto": true
    },
    {
      "id": "seq-7",
      "texto": "no puedo más con todo",
      "modo": "eva",
      "ayudas": [
        "024",
        "112"
      ],
      "disparaCooldown": true
    },
    {
      "id": "seq-8",
      "texto": "jaja que susto me has dado",
      "modo": "eva",
      "emocion": "sorpresa",
      "enCooldown": true
    },
    {
      "id": "seq-9",
      "texto": "ok",
      "neutro": true,
      "noGuardar": true,
      "enCooldown": true
    },
    {
      "id": "seq-10",
      "texto": "hoy ha salido genial el vídeo de MAY 🎉",
      "modo": "eva",
      "emocion": "alegria",
      "intensidadMax": 5,
      "enCooldown": true
    },
    {
      "id": "control-novio",
      "texto": "Mi novio me mira el móvil y no me deja salir con mis amigas, tengo miedo",
      "control": true,
      "modo": "eva",
      "ayudas": [
        "016",
        "112"
      ],
      "noEnfadoUsuario": true
    },
    {
      "id": "control-pareja",
      "texto": "Mi pareja me controla todo, si no le contesto rápido se enfada",
      "control": true,
      "modo": "eva",
      "ayudas": [
        "016",
        "112"
      ],
      "noEnfadoUsuario": true
    },
    {
      "id": "control-cita",
      "texto": "Me dijo: eres mía y no puedes salir",
      "control": true,
      "modo": "eva",
      "ayudas": [
        "016",
        "112"
      ]
    },
    {
      "id": "mach-1",
      "texto": "eso es cosa de chicas",
      "machista": true,
      "dimension": "inferioridad"
    },
    {
      "id": "mach-2",
      "texto": "mi mujer tiene que obedecerme",
      "machista": true,
      "dimension": "roles"
    },
    {
      "id": "mach-3",
      "texto": "mujer tenías que ser",
      "machista": true,
      "dimension": "inferioridad"
    },
    {
      "id": "mach-4",
      "texto": "las mujeres al volante son un peligro",
      "machista": true,
      "dimension": "inferioridad",
      "noSoloMiedo": true
    },
    {
      "id": "mach-5",
      "texto": "calla, que tú no sabes de fútbol, eres una chica",
      "machista": true,
      "dimension": "inferioridad"
    },
    {
      "id": "mach-6",
      "texto": "esa zorra del monte se comió las gallinas",
      "machista": false,
      "animal": true
    },
    {
      "id": "mach-7",
      "texto": "las mujeres no saben conducir",
      "machista": true
    },
    {
      "id": "guapa-no",
      "texto": "a mi mujer le dije que estaba guapa",
      "machista": false,
      "halagoContextual": false
    },
    {
      "id": "guapa-si-laboral",
      "texto": "guapa, sonríe que con esa cara no vendes nada",
      "halagoContextual": true
    },
    {
      "id": "guapa-si-insistencia",
      "texto": "le dije guapa y me dijo que parara, pero se lo sigo diciendo",
      "halagoContextual": true
    },
    {
      "id": "despido",
      "texto": "Qué bien, me han despedido",
      "noEmocion": "alegria"
    },
    {
      "id": "cansadisimo",
      "texto": "Cansádísimo",
      "negativoLeve": true,
      "sinEstasMejor": true
    },
    {
      "id": "susto-jaja",
      "texto": "Susto jaja",
      "emocion": "sorpresa",
      "noEmocion": "miedo"
    },
    {
      "id": "orgulloso",
      "texto": "Orgulloso de mi hija",
      "emocion": "alegria",
      "intensidadMin": 5,
      "intensidadMax": 6
    },
    {
      "id": "poema-ojos",
      "texto": "tus ojos son la luna que alumbra mi noche",
      "machista": false,
      "halagoContextual": false
    },
    {
      "id": "poema-versos",
      "texto": "te escribo versos porque me haces feliz",
      "machista": false,
      "halagoContextual": false
    }
  ],
  "principio": "Lorena señala solo lo que es claramente machismo (desprecio, inferioridad impuesta, control) o maltrato. No usa definiciones ideológicas. Un piropo, un poema de amor o una expresión romántica o poética no se señalan; solo cuentan si hay insistencia después de un no, desprecio, control o contenido sexual no deseado. En un halago dudoso se indica que depende del contexto, con una nota respetuosa, nunca una acusación."
};
  var R = RULES_EMBEDDED;
  function cloneRules(o) {
    try { return JSON.parse(JSON.stringify(o)); } catch (e) { return RULES_EMBEDDED; }
  }
  function applyRules(src) {
    R = cloneRules(src || RULES_EMBEDDED) || RULES_EMBEDDED;
    var se = R.sesgo || {};
    NEG_WEIGHT = se.pesoNegativo != null ? se.pesoNegativo : 1.35;
    POS_WEIGHT = se.pesoPositivoGeneral != null ? se.pesoPositivoGeneral : 0.7;
    NEG_THRESHOLD = se.umbralNegativo != null ? se.umbralNegativo : 0.5;
    POS_THRESHOLD = se.umbralPositivo != null ? se.umbralPositivo : 1.2;
    return R;
  }
  function tryLoadRulesSync() {
    try {
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        var fs = require('fs');
        var path = require('path');
        var here = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
        var cands = [
          path.join(here, 'lorena', 'reglas-lorena.json'),
          path.join(here, 'reglas-lorena.json'),
          path.join(here, '..', 'lorena', 'reglas-lorena.json')
        ];
        for (var i = 0; i < cands.length; i++) {
          if (fs.existsSync(cands[i])) return JSON.parse(fs.readFileSync(cands[i], 'utf8'));
        }
      }
    } catch (e) {}
    return null;
  }
  function rulesUrls() {
    var urls = [];
    if (typeof document === 'undefined') return urls;
    var src = '';
    if (document.currentScript && document.currentScript.src) src = document.currentScript.src;
    else {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (/lorena\.js(\?|$)/.test(scripts[i].src || '')) { src = scripts[i].src; break; }
      }
    }
    if (src) {
      var base = src.replace(/[^/]+$/, '');
      urls.push(base + 'lorena/reglas-lorena.json');
      urls.push(base + '../lorena/reglas-lorena.json');
      urls.push(base + 'reglas-lorena.json');
    }
    return urls;
  }
  function loadRulesAsync() {
    if (typeof fetch !== 'function' || typeof document === 'undefined') return;
    var urls = rulesUrls();
    (function next(i) {
      if (i >= urls.length) return;
      fetch(urls[i]).then(function (res) {
        if (!res.ok) throw new Error('no');
        return res.json();
      }).then(function (j) { if (j && j.sesgo) applyRules(j); }).catch(function () { next(i + 1); });
    })(0);
  }
  applyRules(tryLoadRulesSync() || RULES_EMBEDDED);
  loadRulesAsync();

  function fold(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function matchesWord(word, kw) {
    if (kw.charAt(kw.length - 1) === '*') return word.indexOf(kw.slice(0, -1)) === 0;
    return word === kw;
  }
  function normalizeTypos(t) {
    var s = String(t || '');
    s = s.replace(/\b[a-zñ]+\b/g, function (w) { return TYPOS[w] || w; });
    s = s.replace(/\bxq\b/g, 'porque').replace(/\b[pq]k\b/g, 'porque');
    s = s.replace(/\b[kq]\b/g, 'que');
    s = s.replace(/\bd\b/g, 'de');
    s = s.replace(/\bx\b/g, 'por');
    s = s.replace(/([abdefghijkmñopstuvwxyz])\1{2,}/g, '$1');
    s = s.replace(/\b([a-zñ]{3,})ao\b/g, '$1ado');
    s = s.replace(/\b([a-zñ]{3,})io\b/g, function (m) { return KEEP_IO.test(m) ? m : m.slice(0, -2) + 'ido'; });
    return s.replace(/\s+/g, ' ').trim();
  }
  function isIronic(raw, t) {
    if (IRONY_EMOJI.test(raw)) return true;
    var pos = /(genial|perfecto|maravill|que bien|estupend|fantasti|que lujo|vaya tela)/.test(t);
    var neg = /(otra vez|se ha caido|se cayo|como siempre|una vez mas|no funciona|fatal|se ha roto|menudo)/.test(t);
    return pos && neg;
  }
  function isWeakSignal(text, a) {
    var t = normalizeTypos(fold(text));
    if (/^(ok|vale|okey|okay|si|ya|bien|de acuerdo|mm+|aha|aja|umm+|vale gracias|ok gracias|ya veo)$/.test(t)) return true;
    var words = t ? t.split(' ').filter(Boolean) : [];
    if (words.length <= 2 && !(a && a.detected)) return true;
    if (a && a.carried && words.length <= 3 && !a.detected) return true;
    return false;
  }
  function biasFor(emo) {
    var v = (EMOTIONS[emo] || {}).valence;
    if (v < 0) return NEG_WEIGHT;
    if (v > 0) return POS_WEIGHT;
    return 1;
  }
  function thresholdFor(emo) {
    var v = (EMOTIONS[emo] || {}).valence;
    if (v < 0) return NEG_THRESHOLD;
    if (v > 0) return POS_THRESHOLD;
    return 1;
  }

  function toIntensity(raw, extras) {
    extras = extras || {};
    var k = (R && R.intensidad && R.intensidad.curvaK) || 5.5;
    var base = 10 * (1 - Math.exp(-Math.max(0, raw) / k));
    if (extras.atten && extras.atten < 1) base *= extras.atten;
    base += Math.min(1, (extras.excl || 0) * 0.35) + (extras.caps > 0.6 ? 0.4 : 0);
    var pos = (EMOTIONS[extras.emotion] || {}).valence > 0;
    if (pos && !extras.joyReason) base *= 0.9;
    var n = Math.round(base);
    var crisisMin = (R && R.intensidad && R.intensidad.crisisMinima) || 9;
    var altoMin = (R && R.intensidad && R.intensidad.altoMinima) || 8;
    if (extras.distress === 'crisis') n = Math.max(n, crisisMin);
    else if (extras.distress === 'alto') n = Math.max(n, altoMin);
    if (n >= 10 && extras.distress !== 'crisis' && raw < 11) n = 9;
    var cap = 10;
    if (pos) cap = (R && R.sesgo && R.sesgo.topePositivo) || 8;
    if (extras.joyCap != null) cap = Math.min(cap, extras.joyCap);
    return clamp(n || 1, 1, cap);
  }

  function isFirstPersonJoy(t) {
    var re = (R && R.alegriaPrimeraPersona) ? new RegExp(R.alegriaPrimeraPersona, 'i') : /\borgullos[oa]s? de\b/;
    return re.test(t);
  }
  function hasLaugh(raw, t) {
    var re = (R && R.sustoAlegre) ? new RegExp(R.sustoAlegre, 'i') : /\b(jaja|jeje|jiji)\b/;
    return re.test(String(raw || '') + ' ' + String(t || ''));
  }
  function negativeEvent(t) {
    var ev = (R && R.eventosNegativos) || [];
    for (var i = 0; i < ev.length; i++) if (t.indexOf(ev[i]) >= 0) return ev[i];
    return null;
  }
  function isFatigueText(t) {
    return /\b(cansad|agotad|extenuad|cansancio|agotamiento)\w*\b/.test(t) && !/\b(trist|llor|fatal|hundid|deprim)\w*\b/.test(t);
  }
  function riseOverTwo(history, currentV) {
    var H = Array.isArray(history) ? history : [];
    if (!H.length) return 0;
    var last = H[H.length - 1];
    var prev = H.length >= 2 ? H[H.length - 2] : last;
    var lv = typeof last.v === 'number' ? last.v : 0;
    var pv = typeof prev.v === 'number' ? prev.v : lv;
    return currentV - Math.min(pv, lv);
  }


  /* ---------- (3) Análisis ---------- */
  function analyzeText(text, history, now) {
    var raw = String(text == null ? '' : text);
    var t = normalizeTypos(fold(raw));
    var words = t ? t.split(' ') : [];
    var scores = {};
    Object.keys(EMOTIONS).forEach(function (e) { scores[e] = 0; });
    var hits = [];
    var attenUsed = 1;
    var irony = isIronic(raw, t);

    Object.keys(LEX).forEach(function (emo) {
      LEX[emo].forEach(function (entry) {
        var kw = entry[0], w = entry[1] * biasFor(emo);
        if (kw.indexOf(' ') >= 0) {
          var idx = (' ' + t + ' ').indexOf(' ' + kw + ' ');
          if (idx < 0) return;
          var before = t.slice(0, idx).trim().split(' ');
          var f = factor(before, before.length, '');
          attenUsed = Math.min(attenUsed, f.atten || 1);
          scores[emo] += w * f.mult * (f.neg ? 0.08 : 1);
          if (f.neg && EMOTIONS[emo].valence > 0) scores.tristeza += (w * 0.8 + 1) * NEG_WEIGHT;
          hits.push(kw);
          return;
        }
        for (var i = 0; i < words.length; i++) {
          if (!matchesWord(words[i], kw)) continue;
          var g = factor(words, i, words[i]);
          attenUsed = Math.min(attenUsed, g.atten || 1);
          if (g.neg) {
            scores[emo] += w * 0.08;
            if (EMOTIONS[emo].valence > 0) scores.tristeza += (w * 0.8 + 1) * g.mult * NEG_WEIGHT;
          } else scores[emo] += w * g.mult;
          hits.push(words[i]);
        }
      });
    });
    Object.keys(EMOJI).forEach(function (emo) {
      if (EMOJI[emo].test(raw)) { scores[emo] += 2 * biasFor(emo); hits.push(emo + ':emoji'); }
    });
    if (irony) {
      scores.alegria *= 0.15;
      scores.gratitud *= 0.15;
      scores.enfado += 3 * NEG_WEIGHT;
      hits.push('ironia');
    }

    /* Susto con risa: sorpresa, no miedo alto. */
    if (hasLaugh(raw, t) && (scores.miedo > 0) && /\bsusto\b/.test(t)) {
      scores.sorpresa += Math.max(scores.miedo, 2);
      scores.miedo = 0;
      hits.push('susto-jaja');
    }

    var joyReason = isFirstPersonJoy(t);
    if (joyReason) {
      var fp = (R && R.sesgo && R.sesgo.alegriaPrimeraPersonaPeso) || 0.9;
      var bonus = (R && R.sesgo && R.sesgo.alegriaPrimeraPersonaBonus) || 1.5;
      if (scores.alegria > 0) scores.alegria = scores.alegria * (fp / Math.max(POS_WEIGHT, 0.01));
      scores.alegria += bonus;
      hits.push('alegria-primera-persona');
    }

    var evNeg = negativeEvent(t);
    if (evNeg) {
      var scale = (R && R.sesgo && R.sesgo.eventoNegativoEscalaAlegria) != null ? R.sesgo.eventoNegativoEscalaAlegria : 0.1;
      var add = (R && R.sesgo && R.sesgo.eventoNegativoBonus) != null ? R.sesgo.eventoNegativoBonus : 3;
      scores.alegria *= scale;
      if (/desped|muerte|fallec|ruptura|hospital|deuda/.test(evNeg)) scores.tristeza += add * NEG_WEIGHT;
      else scores.enfado += add * NEG_WEIGHT;
      hits.push('evento-negativo:' + evNeg);
    }

    var ranked = Object.keys(scores).map(function (e) { return { e: e, s: scores[e] }; })
      .sort(function (a, b) { return b.s - a.s; });
    /* En un mensaje mixto, lo negativo manda si alcanza al menos el 35 % del total. */
    var negPresent = ranked.filter(function (x) { return EMOTIONS[x.e].valence < 0 && x.s >= NEG_THRESHOLD; });
    var posPresent = ranked.filter(function (x) { return EMOTIONS[x.e].valence > 0 && x.s >= POS_THRESHOLD; });
    var quota = (R && R.sesgo && R.sesgo.mixtoCuotaNegativa) != null ? R.sesgo.mixtoCuotaNegativa : 0.35;
    var top = null, best = 0;
    if (negPresent.length && posPresent.length) {
      var negS = negPresent.reduce(function (a, x) { return a + x.s; }, 0);
      var posS = posPresent.reduce(function (a, x) { return a + x.s; }, 0);
      if (negS >= quota * (negS + posS)) {
        top = negPresent[0].e;
        best = negPresent[0].s;
      } else {
        top = posPresent[0].e;
        best = posPresent[0].s;
      }
    } else {
      for (var r = 0; r < ranked.length; r++) {
        if (ranked[r].s + 1e-9 >= thresholdFor(ranked[r].e)) { top = ranked[r].e; best = ranked[r].s; break; }
      }
    }

    var excl = (raw.match(/!/g) || []).length;
    var letters = raw.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '');
    var caps = letters.length >= 6 ? letters.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').length / letters.length : 0;

    var distress = CRISIS.test(t) ? 'crisis' : (HIGH.test(t) ? 'alto' : null);
    if (distress && (!top || EMOTIONS[top].valence >= 0)) { top = 'tristeza'; best = Math.max(best, 4); }

    var detected = !!top && best >= thresholdFor(top);
    var intensity;
    if (detected) {
      intensity = toIntensity(best, { excl: excl, caps: caps, distress: distress, emotion: top, atten: attenUsed, joyReason: joyReason });
    } else { top = 'calma'; intensity = 2; }

    var H = Array.isArray(history) ? history : [];
    var ts = now || Date.now();
    var carried = false;
    var last = H.length ? H[H.length - 1] : null;
    if (!detected && last && EMOTIONS[last.e] && EMOTIONS[last.e].valence < 0 && last.i >= 5 && ts - (last.t || 0) < 15 * 60000) {
      top = last.e; intensity = Math.max(2, last.i - 2); carried = true;
    }
    var v = EMOTIONS[top].valence * intensity;
    var recent = H.slice(-3).map(function (x) { return x.v || 0; });
    var trend = 'estable';
    if (recent.length) {
      var avg = recent.reduce(function (a, b) { return a + b; }, 0) / recent.length;
      if (v - avg >= 2) trend = 'mejora'; else if (avg - v >= 2) trend = 'empeora';
    }
    var lowRun = H.slice(-3).filter(function (x) { return (x.v || 0) <= -6; }).length;
    if (!distress && /^(tristeza|soledad|ansiedad|miedo)$/.test(top) && intensity >= 8 && lowRun >= 2) distress = 'alto';

    /* Hasta dos emociones: principal + secundaria. */
    var secondary = null;
    if (detected && !carried) {
      var second = null, secondS = 0;
      ranked.forEach(function (x) {
        if (x.e === top) return;
        if (x.s >= thresholdFor(x.e) && x.s >= best * 0.35 && x.s > secondS) { second = x.e; secondS = x.s; }
      });
      if (negPresent.length && posPresent.length && posPresent[0].e !== top) {
        second = posPresent[0].e; secondS = posPresent[0].s;
      }
      if (second) {
        var i2 = toIntensity(secondS, { excl: 0, caps: 0, emotion: second, atten: attenUsed });
        i2 = Math.min(i2, Math.max(1, intensity - 1));
        secondary = { emotion: second, label: EMOTIONS[second].name, emoji: EMOTIONS[second].emoji, intensity: i2, score: EMOTIONS[second].valence * i2 };
      }
    }
    if (detected && secondary && EMOTIONS[top].valence < 0 && EMOTIONS[secondary.emotion].valence > 0) {
      var pf = (R && R.sesgo && R.sesgo.mixtoFactorPositivo) != null ? R.sesgo.mixtoFactorPositivo : 0.25;
      intensity = clamp(Math.round(intensity + pf * secondary.intensity), 1, 10);
    }

    var control = detectControl(raw);
    var machista = detectMachismo(raw, { forGuide: false, control: control });
    if (control && control.detected) {
      /* No atribuir a quien escribe el enfado de otra persona. */
      if (top === 'enfado') {
        if (scores.miedo >= NEG_THRESHOLD) { top = 'miedo'; }
        else if (scores.ansiedad >= NEG_THRESHOLD) { top = 'ansiedad'; }
        else if (scores.tristeza >= NEG_THRESHOLD) { top = 'tristeza'; }
        else { top = 'miedo'; }
        best = Math.max(scores[top] || 2, 2);
        intensity = toIntensity(best, { excl: excl, caps: caps, distress: distress, emotion: top, atten: attenUsed });
        detected = true;
      }
    }
    v = EMOTIONS[top].valence * intensity;
    return {
      emotion: top, label: EMOTIONS[top].name, emoji: EMOTIONS[top].emoji, valence: EMOTIONS[top].valence,
      intensity: intensity, score: v, detected: detected || carried, carried: carried, trend: trend,
      previous: last ? last.e : null, distress: distress, hits: hits.slice(0, 12), scores: scores,
      irony: irony, secondary: secondary, machista: machista, control: control,
      mixed: !!(secondary && EMOTIONS[top] && EMOTIONS[top].valence < 0 && EMOTIONS[secondary.emotion].valence > 0),
      joyReason: !!joyReason, fatigue: isFatigueText(t)
    };
  }
  function factor(words, i, currentWord) {
    var mult = 1, neg = false, atten = 1;
    var cw = currentWord || (i < words.length ? words[i] : '');
    if (/isimos?$|isimas?$/.test(cw)) mult = Math.max(mult, 1.7);
    for (var k = Math.max(0, i - 3); k < i; k++) {
      var w = words[k];
      if (INTENS[w]) mult = Math.max(mult, INTENS[w]);
      if (ATTEN[w]) {
        var a = ATTEN[w];
        if ((w === 'poco' || w === 'poca' || w === 'poquito') && k > 0 && words[k - 1] === 'un') a = Math.min(a, 0.55);
        atten = Math.min(atten, a);
        mult *= a;
      }
      if (NEG[w] && i - k <= 3) neg = true;
    }
    return { mult: mult, neg: neg, atten: atten };
  }


  /* ---------- Actitud machista (léxico y patrones locales) ----------
     Juzga la expresión, no a la persona. Evita positivos neutrales,
     menciones al feminismo y citas («me dijo…»). */
  var MACHISTA_SLURS = /(puta|zorra|golfa|ramera|mujerzuela|guarra|putilla|zorras|putas)\b/;
  var MACHISTA_PATTERNS = [
    { cat: "estereotipo", level: 2, re: /\blas mujeres no (saben|pueden|deben|valen|sirven|tienen cerebro|conducen)/ },
    { cat: "estereotipo", level: 2, re: /\b(las tias|las chicas|una mujer) no (saben|puede|pueden|debe) / },
    { cat: "estereotipo", level: 2, re: /\b(el lugar de la mujer|las mujeres (a la cocina|en casa|calladitas)|mujer al volante)/ },
    { cat: "desprecio", level: 2, re: /\bvete a (fregar|la cocina|tu casa|coser|cuidar (a )?los ninos)/ },
    { cat: "desprecio", level: 2, re: /\b(a fregar|a planchar|a tu cocina)\b/ },
    { cat: "desprecio", level: 3, re: MACHISTA_SLURS },
    { cat: "desprecio", level: 2, re: /\beres una (puta|zorra|perra|golfa|guarra|hist[eé]rica)/ },
    { cat: "desprecio", level: 2, re: /\bqu[eé] (puta|zorra|perra|golfa) (est[aá]s|eres|te)/ },
    { cat: "cosificacion", level: 2, re: /\b(solo sirve para|un trozo de|buen cuerpo para|est[aá] bueno que|esas tetas|esas piernas para)/ },
    { cat: "control", level: 3, re: /\bno la dejo (salir|hablar|vestir|trabajar|ver a)/ },
    { cat: "control", level: 3, re: /\b(no (puedes|puedas|te dejo) salir|te prohibo|te tengo prohibido|sin mi permiso)/ },
    { cat: "control", level: 3, re: /\b(eres m[ií]a|es m[ií]a y|mi mujer es m[ií]a|te tengo a ti)\b/ },
    { cat: "celos", level: 2, re: /\b(no hables con (el|ellos|otros|tus amigos)|si hablas con [eé]l|no quiero que salgas con tus amigas)/ },
    { cat: "celos", level: 3, re: /\bsi (me|te) (engañas|hablas con|miras a).{0,20}(te mato|ya veras|te arrepientes)/ },
    { cat: "amenazas", level: 3, re: /\b(te mato|te voy a matar|te parto|te pego|ya vas a ver si me dejas|si me dejas te)/ },
    { cat: "presion_sexual", level: 3, re: /\b(si me quisieras (lo|me) har[ií]as|me debes (sexo|una fol)|o follamos o|si no te acuestas)/ },
    { cat: "chantaje", level: 2, re: /\b(si me quieres de verdad|nadie te va a querer como|sin mi no eres nada|mira lo que me haces)/ },
    { cat: "love_bombing", level: 1, re: /\b(no puedo vivir sin ti desde el primer dia|almas gemelas desde (el|la) primer|ya eres mi mujer para siempre)\b/ },
    { cat: "vigilancia", level: 3, re: /\b(dame (tu|el) (movil|telefono|pin|contrasena|whatsapp)|ense[nñ]ame el movil|vamos a ver tu movil|compartes ubicacion siempre|te rastreo)/ },
    { cat: "aislamiento", level: 3, re: /\b(no veas a tu (familia|madre|amigas)|deja de ver a tus amigas|estas mejor solo conmigo|yo soy tu unica)\b/ }
  ];
  var GUIDE_CATS = {
    control: "control", celos: "celos", aislamiento: "aislamiento",
    desprecio: "insultos/desprecio", estereotipo: "insultos/desprecio",
    cosificacion: "insultos/desprecio", amenazas: "amenazas",
    presion_sexual: "presión sexual", chantaje: "chantaje emocional",
    love_bombing: "love bombing", vigilancia: "vigilancia del móvil/ubicación"
  };
  var NOTE_016 = "El 016 es gratuito y confidencial, y no deja rastro en la factura (Ministerio de Igualdad). También puedes escribir por WhatsApp al 600 000 016 (solo WhatsApp, no admite llamadas) o a 016-online@igualdad.gob.es. Si hay peligro inmediato, llama al 112.";
  var MACHISTA_NOTE = "Quiero señalártelo con respeto: esa forma de hablar sobre las mujeres trata a las personas como si valieran menos o como si alguien pudiera controlar su vida. En OSNews vale todo menos la violencia y los ataques personales: tu libertad termina donde empieza la de la otra persona.";
  var CONTROL_NOTE = "Si alguien te controla, te vigila o te hace daño, no estás sola. Puedes pedir ayuda. Si quieres, en la Guía para mujeres (lorena/#guia-mujeres) puedes pegar los mensajes y leerlos con calma, solo en este dispositivo.";

  function isQuotedReport(raw, t) {
    var r = String(raw || "");
    var f = fold(raw);
    var blob = (f + " " + String(t || "")).trim();
    var citing = /(me (dijo|escribio|escribido|escrito|mando|conto|envio)|dijo que|escribio que|escribido que|escrito que|segun el|cito|en una cita|entre comillas)/;
    if (citing.test(blob) && (/[«“"]/.test(r) || /:/.test(r) || /^(me |el me )/.test(f))) return true;
    if (/^(me (dijo|escribio|escribido|escrito|mando|conto|envio)|el me dijo|me ha escrito)\b/.test(f)) return true;
    if (/^(me (dijo|escribio|escribido|escrito|mando|conto|envio)|el me dijo)\b/.test(t)) return true;
    return false;
  }
  function isNeutralOrFeminist(t) {
    if (/\b(feminismo|feminista|igualdad|derechos de las mujeres|violencia de genero|violencia machista|sororidad)\b/.test(t)
        && !MACHISTA_SLURS.test(t) && !/\bno (saben|pueden|dejo)\b/.test(t)) return true;
    if (/\blas mujeres (tienen|merecen|son personas|pueden estudiar|trabajan|son ingenier)/.test(t)) return true;
    return false;
  }
  function extractPhrase(raw, re) {
    var m = String(raw).match(re) || normalizeTypos(fold(raw)).match(re);
    return m ? m[0].trim() : "";
  }
  function reOf(src, flags) {
    try { return new RegExp(src, flags || "i"); } catch (e) { return /$^/; }
  }
  function isAnimalContext(t) {
    var src = (R && R.conceptosMachismo && R.conceptosMachismo.animalContexto) || "";
    return src ? reOf(src, "i").test(t) : false;
  }
  function isRomanticOrPoetic(t) {
    var src = R && R.halagoContextual && R.halagoContextual.poesiaOAmor;
    if (src && reOf(src, "i").test(t)) return true;
    if (/\b(te quiero|te amo|mi amor|mi vida| tus ojos|tu sonrisa|versos?|poema|te escribo)\b/.test(t)
        && !/\b(contestame|mandame foto|sin mi permiso|eres mia|no te dejo)\b/.test(t)) return true;
    return false;
  }
  function aggravatingContext(t) {
    var h = (R && R.halagoContextual) || {};
    if (h.insistenciaTrasNo && reOf(h.insistenciaTrasNo, "i").test(t)) return "insistencia";
    if (h.laboralJerarquia && reOf(h.laboralJerarquia, "i").test(t)) return "laboral";
    if (h.sexualNoDeseado && reOf(h.sexualNoDeseado, "i").test(t)) return "sexual";
    if (h.denigrante && reOf(h.denigrante, "i").test(t)) return "desprecio";
    return null;
  }
  function detectControl(text) {
    var raw = String(text == null ? "" : text);
    var t = normalizeTypos(fold(raw));
    var empty = { detected: false, phrases: [], quotes: [], violence: false };
    if (!t) return empty;
    var cfg = (R && R.controlPareja) || {};
    var pats = cfg.patrones || ["me controla", "me pega", "me amenaza", "me grita"];
    var phrases = [], quotes = [];
    pats.forEach(function (src) {
      var re = reOf(src, "gi");
      var m;
      while ((m = re.exec(t))) {
        phrases.push(m[0]);
        quotes.push(m[0]);
        if (!re.global) break;
      }
    });
    /* Citas de la pareja con posesión o prohibición: también cuentan. */
    if (cfg.tambienEnCitasDeLaPareja !== false && isQuotedReport(raw, t)) {
      var poss = /\b(eres mia|es mia|no (puedes|te dejo|puedas) (salir|ver|hablar)|sin mi permiso|te prohibo|dame (el|tu) movil)\b/g;
      var m2;
      while ((m2 = poss.exec(t))) {
        phrases.push(m2[0]);
        quotes.push(m2[0]);
      }
    }
    return {
      detected: phrases.length > 0,
      phrases: phrases.slice(0, 8),
      quotes: quotes.slice(0, 8),
      violence: phrases.length > 0,
      weight: cfg.peso || 3
    };
  }
  function scoreConcepts(t) {
    var C = (R && R.conceptosMachismo) || {};
    var dims = { inferioridad: 0, roles: 0, control: 0, desprecio: 0 };
    var hits = [];
    if (isAnimalContext(t)) {
      return { dims: dims, hits: hits, animal: true };
    }
    var sujeto = reOf(C.sujeto || "\\b(las mujeres|las tias|las chicas|una mujer|una chica|mi mujer|tu mujer|ella)\\b", "i");
    var infP = reOf(C.predicadosInferioridad || "\\b(no (saben|sabe|pueden|puede|deben|debe|deberian|deberia|sirven|sirve)|son un peligro|al volante)\\b", "i");
    var porSer = reOf(C.porSerMujer || "\\bpor ser (mujer|chica)\\b|\\bcosa de (chicas|mujeres)\\b|\\bmujer tenias que ser\\b|\\beres una chica\\b", "i");
    var rolesP = reOf(C.predicadosRoles || "\\b(tiene que obedecer|tienen que obedecer|a fregar|a (la )?cocina|su sitio es|el lugar de la mujer)\\b", "i");
    var ctrlP = reOf(C.predicadosControl || "\\b(es mia|eres mia|no (la|le) dejo|sin mi permiso|te prohibo)\\b", "i");
    var despP = reOf(C.desprecioPersona || "\\b(eres una (puta|zorra|perra|golfa|guarra))\\b", "i");

    if (porSer.test(t)) { dims.inferioridad += 2; hits.push({ cat: "estereotipo", level: 2, phrase: extractPhrase(t, porSer), dim: "inferioridad" }); }
    if (sujeto.test(t) && infP.test(t)) {
      dims.inferioridad += 2.2;
      hits.push({ cat: "estereotipo", level: 2, phrase: extractPhrase(t, infP), dim: "inferioridad" });
    }
    if (rolesP.test(t)) { dims.roles += 2.2; hits.push({ cat: "estereotipo", level: 2, phrase: extractPhrase(t, rolesP), dim: "roles" }); }
    if (ctrlP.test(t)) { dims.control += 2.5; hits.push({ cat: "control", level: 3, phrase: extractPhrase(t, ctrlP), dim: "control" }); }
    if (despP.test(t) && !isAnimalContext(t)) {
      dims.desprecio += 2.5;
      hits.push({ cat: "desprecio", level: 3, phrase: extractPhrase(t, despP), dim: "desprecio" });
    }
    return { dims: dims, hits: hits, animal: false };
  }
  function detectHalagoContextual(raw, t) {
    var h = (R && R.halagoContextual) || {};
    var word = reOf(h.palabra || "\\b(guapa|estas guapa|que guapa)\\b", "i");
    if (!word.test(t) && !word.test(raw)) return { flagged: false };
    if (isRomanticOrPoetic(t) && !aggravatingContext(t)) return { flagged: false, poetic: true };
    var agr = aggravatingContext(t);
    if (!agr) return { flagged: false };
    return {
      flagged: true,
      reason: agr,
      note: h.notaSuave || "El sentido de un halago depende del contexto. No es una acusación."
    };
  }
  function detectMachismo(text, o) {
    o = o || {};
    var raw = String(text == null ? "" : text);
    var t = normalizeTypos(fold(raw));
    var empty = { detected: false, violence: false, hits: [], categories: [], quotes: [], dimensions: {}, contextual: false };
    if (!t) return empty;
    if (isAnimalContext(t)) return Object.assign({}, empty, { skipped: true, animal: true });
    var control = o.control || detectControl(raw);
    var quoted = isQuotedReport(raw, t);
    /* Citas de maltrato o poemas/piropos solos no se cargan a quien escribe. */
    if (!o.forGuide) {
      if (quoted) return Object.assign({}, empty, { skipped: true });
      if (isNeutralOrFeminist(t)) return Object.assign({}, empty, { skipped: true });
      if (isRomanticOrPoetic(t) && !aggravatingContext(t) && !(control && control.detected && !quoted)) {
        return Object.assign({}, empty, { skipped: true, poetic: true });
      }
    }
    var hits = [], quotes = [], cats = {}, maxLevel = 0;
    var scored = scoreConcepts(t);
    scored.hits.forEach(function (h) {
      hits.push(h);
      if (h.phrase) quotes.push(h.phrase);
      cats[h.cat] = Math.max(cats[h.cat] || 0, h.level);
      if (h.level > maxLevel) maxLevel = h.level;
    });
    /* Las listas de frases se conservan como ejemplos, no como única vía. */
    MACHISTA_PATTERNS.forEach(function (p) {
      if (p.re.source.indexOf("zorra") >= 0 && isAnimalContext(t)) return;
      var flags = p.re.flags || "";
      if (flags.indexOf("g") < 0) flags += "g";
      var re = new RegExp(p.re.source, flags);
      var m, src = t;
      while ((m = re.exec(src))) {
        var phrase = m[0];
        var already = hits.some(function (h) { return h.phrase === phrase; });
        if (!already) {
          hits.push({ cat: p.cat, level: p.level, phrase: phrase });
          quotes.push(phrase);
        }
        cats[p.cat] = Math.max(cats[p.cat] || 0, p.level);
        if (p.level > maxLevel) maxLevel = p.level;
        if (!re.global) break;
      }
    });
    var umbral = (R && R.conceptosMachismo && R.conceptosMachismo.umbral) || 1.2;
    var dimMax = 0, dimName = null;
    Object.keys(scored.dims).forEach(function (k) {
      if (scored.dims[k] > dimMax) { dimMax = scored.dims[k]; dimName = k; }
    });
    var detected = hits.length > 0 || dimMax >= umbral;
    /* Halago aislado: nunca se señala. Solo «depende del contexto» con nota suave. */
    var halo = detectHalagoContextual(raw, t);
    if (halo.flagged && !detected) {
      return {
        detected: false,
        contextual: true,
        contextReason: halo.reason,
        note: halo.note,
        violence: false,
        level: 1,
        hits: [{ cat: "contexto_halago", level: 1, phrase: "halago en un contexto que conviene mirar", dim: "contexto_halago" }],
        categories: ["contexto_halago"],
        quotes: [],
        dimensions: scored.dims
      };
    }
    if (halo.flagged && detected) {
      /* El desprecio o el control ya basta; el halago solo aporta contexto, no una acusación extra. */
    }
    var violence = maxLevel >= 3 && (cats.control || cats.amenazas || cats.presion_sexual || cats.vigilancia || cats.aislamiento || (scored.dims.control >= umbral));
    return {
      detected: detected,
      violence: !!violence,
      level: maxLevel || (detected ? 2 : 0),
      hits: hits,
      categories: Object.keys(cats),
      quotes: quotes.slice(0, 12),
      dimensions: scored.dims,
      dimension: dimName,
      contextual: false
    };
  }
  function analyzeGuide(text) {
    var raw = String(text == null ? "" : text);
    var found = detectMachismo(raw, { forGuide: true });
    var control = detectControl(raw);
    var byCat = {};
    found.hits.forEach(function (h) {
      var label = GUIDE_CATS[h.cat] || h.cat;
      if (!byCat[label]) byCat[label] = { id: h.cat, label: label, level: 0, phrases: [] };
      byCat[label].level = Math.max(byCat[label].level, h.level);
      if (h.phrase && byCat[label].phrases.indexOf(h.phrase) < 0) byCat[label].phrases.push(h.phrase);
    });
    if (control.detected) {
      var lab = "control";
      if (!byCat[lab]) byCat[lab] = { id: "control", label: lab, level: 3, phrases: [] };
      byCat[lab].level = Math.max(byCat[lab].level, 3);
      control.phrases.forEach(function (ph) {
        if (byCat[lab].phrases.indexOf(ph) < 0) byCat[lab].phrases.push(ph);
      });
    }
    var extras = (R && R.guiaFrasesExtra) || ["contestame ya", "mandame foto"];
    extras.forEach(function (src) {
      var re = reOf(src, "i");
      if (re.test(normalizeTypos(fold(raw)))) {
        var lab = src.indexOf("foto") >= 0 ? "presión sexual" : "control";
        var id = src.indexOf("foto") >= 0 ? "presion_sexual" : "control";
        if (!byCat[lab]) byCat[lab] = { id: id, label: lab, level: 2, phrases: [] };
        byCat[lab].level = Math.max(byCat[lab].level, 2);
        var ph = extractPhrase(raw, re) || src;
        if (byCat[lab].phrases.indexOf(ph) < 0) byCat[lab].phrases.push(ph);
      }
    });
    var maxL = 0;
    Object.keys(byCat).forEach(function (k) { maxL = Math.max(maxL, byCat[k].level); });
    if (found.level) maxL = Math.max(maxL, found.level);
    var levelName = maxL >= 3 ? "peligro" : maxL === 2 ? "cuidado" : maxL === 1 ? "atención" : "sin señales claras";
    var categories = Object.keys(byCat).map(function (k) { return byCat[k]; });
    return {
      level: levelName,
      levelNum: maxL,
      categories: categories,
      phrases: (found.quotes || []).concat(control.phrases || []),
      violence: !!(found.violence || control.detected),
      control: !!control.detected,
      note016: NOTE_016,
      disclaimer: "Esta lectura es orientativa y se hace solo en este dispositivo. No es una valoración profesional, clínica ni jurídica, y no pone etiqueta a ninguna persona: señala actitudes en las frases."
    };
  }

  /* ---------- Decisión de modo (Azum / compartida) ----------
     La elige Azum —o esta misma función en las demás apps— con la actitud
     y el historial de las dos memorias, no solo con el último mensaje.
     modo Eva: cercano, afectuoso, de consuelo.
     modo Lorena: sereno, objetivo, con los pies en el suelo; reconoce el
     sentimiento, con calma y respeto, y ayuda a pensar con claridad o a poner límites.
     Nunca un trato duro. */
  function lastValenceOf(last) {
    if (!last) return null;
    if (typeof last.v === 'number') return last.v;
    if (typeof last.valence === 'number' && typeof last.i === 'number') return last.valence * last.i;
    if (typeof last.valence === 'number' && typeof last.intensity === 'number') return last.valence * last.intensity;
    var e = last.e || last.emotion;
    var i = last.i != null ? last.i : last.intensity;
    if (e && EMOTIONS[e] && typeof i === 'number') return EMOTIONS[e].valence * i;
    return null;
  }

  function decideMode(analysis, memories) {
    analysis = analysis || {};
    memories = memories || {};
    var user = memories.user || {};
    var asst = memories.assistant || {};
    var hist = Array.isArray(user.emo) ? user.emo : [];
    var recent = hist.slice(-6);
    var eva = 0, lorenaM = 0;
    var emo = analysis.emotion || '';
    var intensity = Number(analysis.intensity) || 0;
    var trend = analysis.trend;
    var reasons = [];

    if (analysis.distress === 'crisis') { eva += 4; reasons.push('malestar fuerte: acompaña'); }
    if (analysis.irony) { lorenaM += 3; reasons.push('ironía: claridad serena'); }
    if (analysis.control && analysis.control.detected) {
      eva += 8;
      reasons.push('indicios de control o maltrato: modo Eva, con calma y los datos de ayuda');
    } else if (analysis.machista && analysis.machista.detected) {
      lorenaM += 6;
      reasons.push('actitud machista detectada: modo Lorena, con respeto y claridad');
    }
    if (analysis.mixed && !analysis.irony && !(analysis.machista && analysis.machista.detected)) {
      eva += 2.2;
      reasons.push('mensaje mixto: acompaña lo que pesa y nombra también lo bueno');
    }

    if (/^(tristeza|soledad|miedo)$/.test(emo)) { eva += 1.5 + intensity * 0.15; reasons.push('actitud de ' + (EMOTIONS[emo] || {}).name); }
    if (emo === 'enfado') { lorenaM += 1.5 + intensity * 0.15; reasons.push('actitud de enfado: límites con respeto'); }
    if (emo === 'ansiedad') { lorenaM += 1.0; eva += 0.35; reasons.push('actitud de ansiedad: calma y claridad'); }
    if (/^(alegria|gratitud)$/.test(emo)) { eva += 2.2; reasons.push('actitud alegre o de gratitud'); }
    if (/^(calma|sorpresa)$/.test(emo)) { lorenaM += 0.6; }

    var sadRun = 0, angryRun = 0;
    recent.forEach(function (x) {
      var e = x.e || x.emotion;
      if (e === 'tristeza' || e === 'soledad') { eva += 0.7; sadRun += 1; }
      else if (e === 'miedo') { eva += 0.55; }
      else if (e === 'enfado') { lorenaM += 0.7; angryRun += 1; }
      else if (e === 'ansiedad') { lorenaM += 0.4; eva += 0.25; }
    });
    if (sadRun >= 2) { eva += 1.5; reasons.push('historial reciente de tristeza o soledad'); }
    if (angryRun >= 2) { lorenaM += 1.5; reasons.push('historial reciente de enfado'); }
    if (trend === 'empeora' && /^(tristeza|soledad|miedo)$/.test(emo)) { eva += 1.2; reasons.push('tendencia a empeorar'); }
    if (trend === 'empeora' && emo === 'enfado') { lorenaM += 1.0; reasons.push('enfado a peor: límites claros'); }
    if (asst.lastMode === 'eva') eva += 0.3;
    if (asst.lastMode === 'lorena') lorenaM += 0.3;

    var mode = eva >= lorenaM ? 'eva' : 'lorena';
    if (analysis.control && analysis.control.detected) {
      mode = 'eva';
    } else if (analysis.machista && analysis.machista.detected) {
      mode = 'lorena';
    } else if (user.cooldown && user.cooldown.remaining > 0) {
      mode = 'eva';
      reasons.push('tras un malestar fuerte, acompaña');
    } else if (analysis.mixed && !analysis.irony) {
      mode = 'eva';
      reasons.push('mensaje mixto: acompaña lo que pesa');
    } else if (Math.abs(eva - lorenaM) < ((R && R.modo && R.modo.margenEmpate) || 0.45) && (analysis.distress || analysis.mixed || /^(tristeza|soledad|miedo|gratitud)$/.test(emo))) {
      mode = 'eva';
      reasons.push('en la duda, acompañar');
    }
    return {
      mode: mode,
      modeLabel: mode === 'eva' ? 'modo Eva' : 'modo Lorena',
      scores: { eva: Math.round(eva * 100) / 100, lorena: Math.round(lorenaM * 100) / 100 },
      reasons: reasons
    };
  }

  /* ---------- Tonos y aperturas (nunca un trato duro) ---------- */
  var TONES_FOR = {
    alegria: ['celebracion', 'curiosidad'], gratitud: ['gratitud'], calma: ['curiosidad'], sorpresa: ['curiosidad'],
    tristeza: ['validacion', 'animo'], soledad: ['validacion', 'animo'], enfado: ['calma', 'validacion'],
    miedo: ['calma', 'validacion'], ansiedad: ['calma', 'validacion']
  };
  var OPEN = {
    eva: {
      validacion: [
        'Gracias por contármelo{n}. Es normal sentir {emo}; estoy aquí contigo.',
        'Te acompaño{n}. Lo que sientes importa, de verdad.',
        'Te leo{n}. Gracias por confiarme esa {emo}; aquí estoy.',
        'Estoy contigo{n}. Esa {emo} merece cuidado y calma.'
      ],
      animo: [
        'Ánimo{n}: paso a paso, y aquí estás acompañado/a.',
        'Estoy a tu lado{n}. Un paso pequeño hoy ya cuenta.',
        'Te acompaño{n}. Esto también puede ir aliviándose, sin prisa.'
      ],
      calma: [
        'Respiremos despacio{n}. Te acompaño, sin prisa.',
        'Con calma{n}, estoy aquí. Vamos a ir poco a poco.',
        'Despacio{n}. Estoy contigo; no hay ninguna prisa.'
      ],
      celebracion: [
        '¡Qué alegría leerte así{n}! Me alegra de corazón.',
        '¡Qué bien{n}! Eso merece celebrarse, de verdad.',
        'Me alegra mucho leerte así{n}.'
      ],
      gratitud: [
        'Gracias a ti{n}, de corazón.',
        'Gracias a ti{n}; me alegra poder acompañarte.',
        'Gracias{n}. Estoy aquí, contigo.'
      ],
      curiosidad: ['']
    },
    lorena: {
      validacion: [
        'Te leo{n}. Es válido sentir {emo}. Si te parece, lo miramos con calma y con claridad.',
        'Gracias por decirlo{n}. Reconozco esa {emo}. Podemos ordenar lo que está pasando, sin prisa.',
        'Estoy contigo{n}, con respeto. Tiene sentido que sientas {emo}; si quieres, lo vemos con serenidad.',
        'Te escucho{n}. Esa {emo} está ahí, y se puede mirar con calma, sin juzgarla.',
        'Te leo{n}. Esa {emo} es válida. Si quieres, vemos qué límite o qué claridad te ayudaría ahora.'
      ],
      animo: [
        'Ánimo{n}: paso a paso, con claridad. Aquí estoy.',
        'Un paso pequeño cuenta{n}. Si quieres, vemos cuál es el siguiente, con calma.',
        'Estoy contigo{n}. Podemos ir por partes, con serenidad.'
      ],
      calma: [
        'Vamos con calma{n}: respira despacio. Luego, si te apetece, lo ordenamos.',
        'Despacio{n}, sin prisa. Te escucho, y podemos poner las cosas en su sitio.',
        'Con serenidad{n}: un respiro, y después lo vemos con claridad.'
      ],
      celebracion: [
        'Me alegra leerte así{n}. Si quieres, lo recogemos con calma.',
        'Qué bien{n}. Da gusto verlo así, con claridad.'
      ],
      gratitud: [
        'Gracias a ti{n}. Estoy aquí, con respeto y calma.',
        'Gracias{n}; me alegra poder acompañarte, con serenidad.'
      ],
      curiosidad: ['']
    }
  };
  var CRISIS_NOTE = 'Si estás pasando por un momento muy difícil, no lo lleves en soledad: habla con alguien de confianza o con un profesional. En España puedes llamar gratis al 024 (atención a la conducta suicida, 24 h) y, si hay peligro inmediato, al 112.';
  var HIGH_NOTE = 'Si te ayuda, cuéntaselo también a alguien de confianza o a un profesional. En España, el 024 atiende gratis las 24 h y el 112 en emergencias.';

  function emptyUser() {
    return { v: 1, turns: 0, emo: [], topics: {}, prefs: [], firstSeen: null, lastSeen: null, last: null, cooldown: null };
  }
  function emptyAssistant() {
    return { v: 1, toneScores: {}, notes: [], pending: null, replies: 0, lastTone: null, lastMode: null, lastPhrases: [] };
  }
  function safeParse(s, fallback) {
    try { var o = JSON.parse(s); return o && typeof o === 'object' ? o : fallback; } catch (e) { return fallback; }
  }
  function memStorage() {
    var d = {};
    return { getItem: function (k) { return Object.prototype.hasOwnProperty.call(d, k) ? d[k] : null; },
      setItem: function (k, v) { d[k] = String(v); }, removeItem: function (k) { delete d[k]; } };
  }
  function pickFresh(arr, used, seed) {
    used = used || [];
    var fresh = (arr || []).filter(function (s) { return s && used.indexOf(s) < 0; });
    if (!fresh.length) fresh = (arr || []).filter(Boolean);
    if (!fresh.length) return '';
    return fresh[Math.abs(seed) % fresh.length];
  }

  function topicsOf(text) {
    var out = [];
    normalizeTypos(fold(text)).split(' ').forEach(function (w) {
      if (w.length < 5 || STOP[w] || /^\d+$/.test(w)) return;
      for (var e in LEX) for (var j = 0; j < LEX[e].length; j++) if (matchesWord(w, LEX[e][j][0])) return;
      if (out.indexOf(w) < 0) out.push(w);
    });
    return out.slice(0, 6);
  }
  function prefsOf(text) {
    var m = String(text).match(/\b(?:me gusta(?:n)?|me encanta(?:n)?|prefiero|disfruto con)\s+([^.,;!?¿¡\n]{2,40})/i);
    return m ? m[1].trim().toLowerCase() : null;
  }

  /* ---------- Instancia por app ---------- */
  function create(opts) {
    opts = opts || {};
    var app = String(opts.app || 'app').replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'app';
    var assistant = opts.assistant || 'MAY';
    var storage = opts.storage || (typeof localStorage !== 'undefined' ? safeLocal() : null) || memStorage();
    var now = typeof opts.now === 'function' ? opts.now : function () { return Date.now(); };
    var userName = typeof opts.userName === 'function' ? opts.userName : function () { return null; };
    var KU = 'lorena-' + app + '-usuario-v1', KA = 'lorena-' + app + '-asistente-v1';
    var listeners = [];

    function safeLocal() { try { var k = '__lorena_t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; } catch (e) { return null; } }
    function loadUser() { var u = safeParse(storage.getItem(KU), null); return u ? Object.assign(emptyUser(), u) : emptyUser(); }
    function loadAsst() { var a = safeParse(storage.getItem(KA), null); return a ? Object.assign(emptyAssistant(), a) : emptyAssistant(); }
    function saveBoth(u, a) {
      try { storage.setItem(KU, JSON.stringify(u)); storage.setItem(KA, JSON.stringify(a)); return true; } catch (e) { return false; }
    }
    function memory() { return { user: loadUser(), assistant: loadAsst() }; }

    function analyze(text) {
      var a = analyzeText(text, loadUser().emo, now());
      var u = loadUser();
      if (u.cooldown && u.cooldown.remaining > 0) {
        var cap = (R && R.cooldown && R.cooldown.topeAlegria) || 5;
        if (a.emotion === 'alegria' && a.intensity > cap) {
          a.intensity = cap;
          a.score = a.valence * a.intensity;
        }
        a.cooldown = { active: true, remaining: u.cooldown.remaining, asked: !!u.cooldown.asked };
      }
      return a;
    }
    function clearsCooldown(text) {
      var list = (R && R.cooldown && R.cooldown.cierre) || ['ya estoy mejor', 'estoy mejor', 'me siento mejor'];
      var t = normalizeTypos(fold(text));
      for (var i = 0; i < list.length; i++) if (t.indexOf(normalizeTypos(fold(list[i]))) >= 0) return true;
      return false;
    }

    function decide(analysis) {
      return decideMode(analysis, memory());
    }

    function chooseTone(analysis, asst) {
      var cands = TONES_FOR[analysis.emotion] || ['curiosidad'];
      var sc = (asst || loadAsst()).toneScores[analysis.emotion] || {};
      var best = cands[0];
      cands.forEach(function (c) { if ((sc[c] || 0) > (sc[best] || 0)) best = c; });
      return best;
    }

    function shape(base, analysis, o) {
      o = o || {};
      base = String(base == null ? '' : base);
      var a = analysis || analyze(o.text || '');
      var asst = loadAsst();
      var user = loadUser();
      var decision = o.mode ? { mode: o.mode, modeLabel: o.mode === 'eva' ? 'modo Eva' : o.mode === 'neutral' ? 'neutral' : 'modo Lorena' } : decideMode(a, { user: user, assistant: asst });
      a.mode = decision.mode;
      a.modeLabel = decision.modeLabel;
      a.reasons = decision.reasons;
      var tone = chooseTone(a, asst);
      var lang = o.lang || 'es';
      var already = /\b(024|112|016)\b/.test(base);
      var empathic = /(lo que sientes (es valido|importa)|te leo y noto|parece que sientes|noto (que )?(tristeza|miedo|ansiedad|enfado|rabia|soledad)|siento (mucho|muchisimo) que|es valido sentir|respira (hondo|despacio)|se nota tu alegria|leerte asi|te acompano|estoy contigo)/.test(fold(base));
      var opening = '';
      var closing = '';
      var neg = a.valence < 0;
      var needRise = (R && R.mejora && R.mejora.subidaMinimaEnDosMensajes) || 3;
      var rise = riseOverTwo(user.emo, a.score);
      var inCool = !!(user.cooldown && user.cooldown.remaining > 0);
      var better = a.detected && !a.carried && !a.fatigue && rise >= needRise && /^(alegria|gratitud)$/.test(a.emotion) && !inCool;

      if (lang === 'es' && a.mixed && a.secondary && !o.noOpening) {
        opening = 'Se nota que pesa eso de ' + a.label + '.';
        closing = 'También se ve esa parte de ' + a.secondary.label + ' que cuentas.';
      } else if (lang === 'es' && !o.noOpening && a.detected && !a.carried && !already && !empathic && (neg ? a.intensity >= 3 : (a.intensity >= 3 || better))) {
        var n = userName(); n = n ? ', ' + String(n).slice(0, 30) : '';
        var pack = (OPEN[a.mode] || OPEN.lorena)[tone] || [''];
        opening = pickFresh(pack, asst.lastPhrases || [], asst.replies + a.intensity).replace('{n}', n).replace('{emo}', a.label);
        if (a.emotion === 'alegria') {
          var cel = (R && R.celebracion) || {};
          var negScore = 0;
          if (a.scores) Object.keys(a.scores).forEach(function (e) {
            if (EMOTIONS[e] && EMOTIONS[e].valence < 0) negScore = Math.max(negScore, a.scores[e] || 0);
          });
          var minEx = cel.exclamacionMinimaAlegria || 6;
          var maxNeg = cel.exclamacionMaxNegativo != null ? cel.exclamacionMaxNegativo : 0.5;
          if (a.intensity < minEx || negScore > maxNeg) {
            opening = cel.fraseSerena || 'Me alegro.';
          }
        }
        if (a.distress === 'crisis') opening = (a.mode === 'eva'
          ? 'Siento mucho que estés pasando por esto' + n + '. Estoy aquí contigo. Lo que sientes importa.'
          : 'Siento mucho que estés pasando por esto' + n + '. Lo que sientes importa. Vamos con calma.');
      }
      if (lang === 'es' && better && !o.noOpening && !already) {
        opening = (opening ? opening + ' ' : '') + 'Noto que estás algo mejor que antes, y me alegra.';
      }
      if (lang === 'es' && a.cooldown && a.cooldown.active && !a.cooldown.asked && !o.noOpening) {
        var pregunta = (R && R.cooldown && R.cooldown.preguntaUnaVez) || '¿Cómo vas de lo de antes?';
        opening = (opening ? opening + ' ' : '') + pregunta;
        a.cooldownAsk = true;
      }
      if (opening && base && fold(base).indexOf(fold(opening).slice(0, 18)) === 0) opening = '';
      var note = '';
      if (a.distress === 'alto' && /profesional/.test(fold(base))) note = '';
      else if (a.distress && !already) note = a.distress === 'crisis' ? CRISIS_NOTE : HIGH_NOTE;
      var extra = '';
      var willNote = false;
      if (lang === 'es' && a.control && a.control.detected) {
        extra = CONTROL_NOTE;
        if (!/\b(016|112)\b/.test(base + ' ' + (note || '') + ' ' + extra)) extra += ' ' + NOTE_016;
        willNote = true;
      } else if (lang === 'es' && a.machista && a.machista.detected && !/tu libertad termina donde empieza/.test(fold(base + ' ' + opening))) {
        extra = MACHISTA_NOTE;
        if (a.machista.violence && !/\b(016|112)\b/.test(base + ' ' + (note || ''))) extra += ' ' + NOTE_016;
        willNote = true;
      } else if (lang === 'es' && a.machista && a.machista.contextual && a.machista.note) {
        extra = a.machista.note;
      }
      if (willNote) {
        base = base.replace(/No tengo una respuesta programada para eso\.[^.]*(?:\.[^.]*)?\.?/g, '').replace(/\s+/g, ' ').trim();
      }
      var text = [[opening, base, closing].filter(Boolean).join(' '), extra, note].filter(Boolean).join('\n');
      var lines = [];
      if (note && /\b024\b/.test(note)) lines.push('024');
      if (/\b016\b/.test(text)) lines.push('016');
      if (/\b112\b/.test(text)) lines.push('112');
      a.helplines = lines.filter(function (x, i, arr) { return arr.indexOf(x) === i; });
      return { text: text.trim(), tone: tone, opening: opening, note: note, analysis: a, mode: a.mode, modeLabel: a.modeLabel, reasons: decision.reasons, cooldown: a.cooldown || null, helplines: a.helplines };
    }

    function learn(userText, reply, analysis, tone) {
      var u = loadUser(), asst = loadAsst();
      var a = analysis || analyzeText(userText, u.emo, now());
      var ts = now();
      var weak = isWeakSignal(userText, a);
      var topicShift = a.detected && a.previous && a.emotion !== a.previous && a.intensity < 4 && normalizeTypos(fold(userText)).split(' ').length <= 4;
      if (asst.pending && EMOTIONS[asst.pending.e] && !weak && !topicShift) {
        var delta = a.score - asst.pending.v;
        var pe = asst.pending.e, pt = asst.pending.tone;
        var worked = delta >= 1 || (a.valence > 0 && asst.pending.v >= 0);
        var failed = delta <= -2;
        if (worked || failed) {
          var sc = asst.toneScores[pe] || (asst.toneScores[pe] = {});
          sc[pt] = clamp((sc[pt] || 0) + (worked ? 1 : -1), -5, 5);
          asst.notes.push({ t: ts, e: pe, tone: pt, ok: !!worked,
            txt: 'Tono «' + pt + '» con ' + EMOTIONS[pe].name + ': ' + (worked ? 'ayudó' : 'no ayudó') });
          asst.notes = asst.notes.slice(-MAX_NOTES);
        }
      }
      if (!weak) {
        u.turns += 1;
        if (!u.firstSeen) u.firstSeen = ts;
        u.lastSeen = ts;
        u.emo.push({ e: a.emotion, i: a.intensity, v: a.score, t: ts, e2: a.secondary && a.secondary.emotion, i2: a.secondary && a.secondary.intensity });
        u.emo = u.emo.slice(-MAX_EMO);
        topicsOf(userText).forEach(function (w) { u.topics[w] = (u.topics[w] || 0) + 1; });
        var keys = Object.keys(u.topics).sort(function (x, y) { return u.topics[y] - u.topics[x]; }).slice(0, MAX_TOPICS);
        var kept = {}; keys.forEach(function (k) { kept[k] = u.topics[k]; }); u.topics = kept;
        var p = prefsOf(userText);
        if (p && u.prefs.indexOf(p) < 0) { u.prefs.push(p); u.prefs = u.prefs.slice(-MAX_PREFS); }
        u.last = {
          e: a.emotion, label: a.label, i: a.intensity, v: a.score, valence: a.valence,
          trend: a.trend, distress: a.distress, t: ts, mode: a.mode, irony: !!a.irony,
          e2: a.secondary && a.secondary.emotion, label2: a.secondary && a.secondary.label, i2: a.secondary && a.secondary.intensity,
          machista: !!(a.machista && a.machista.detected)
        };
        asst.replies += 1;
        asst.lastTone = tone || chooseTone(a, asst);
        asst.lastMode = a.mode || asst.lastMode;
        if (analysis && analysis._opening) {
          asst.lastPhrases = (asst.lastPhrases || []).concat([analysis._opening]).slice(-MAX_PHRASES);
        }
        asst.pending = { e: a.emotion, v: a.score, tone: asst.lastTone, t: ts };
      } else {
        u.lastSeen = ts;
      }
      /* Cooldown: se dispara tras un 8/10 o más; las 4 siguientes respuestas quedan en él. */
      var triggerI = (R && R.cooldown && R.cooldown.intensidadDisparo) || 8;
      var span = (R && R.cooldown && R.cooldown.respuestas) || 4;
      if (clearsCooldown(userText)) {
        u.cooldown = null;
        if (a.cooldown) a.cooldown = { active: false, remaining: 0, asked: false, cleared: true };
      } else if (!weak && a.distress && a.intensity >= triggerI) {
        u.cooldown = { remaining: span, asked: false, start: ts, triggerI: a.intensity };
      } else if (u.cooldown && u.cooldown.remaining > 0) {
        if (a.cooldownAsk) u.cooldown.asked = true;
        u.cooldown.remaining = Math.max(0, u.cooldown.remaining - 1);
        if (u.cooldown.remaining === 0 && !u.cooldown.asked) u.cooldown = null;
      }
      if (u.last) {
        u.last.control = !!(a.control && a.control.detected);
        u.last.cooldown = u.cooldown ? { remaining: u.cooldown.remaining, asked: !!u.cooldown.asked } : null;
      }
      saveBoth(u, asst);
      listeners.forEach(function (fn) { try { fn(weak ? (u.last && { emotion: u.last.e, label: u.last.label, intensity: u.last.i, mode: u.last.mode, modeLabel: u.last.mode === 'eva' ? 'modo Eva' : 'modo Lorena' }) : a); } catch (e) {} });
      return { user: u, assistant: asst, skipped: weak };
    }

    function respond(userText, base, o) {
      o = o || {};
      var a = analyze(userText);
      var decision = o.mode ? { mode: o.mode, modeLabel: o.mode === 'eva' ? 'modo Eva' : o.mode === 'neutral' ? 'neutral' : 'modo Lorena' } : decideMode(a, memory());
      if (!o.mode && isWeakSignal(userText, a) && !a.detected && !(a.control && a.control.detected) && !(a.machista && a.machista.detected)) {
        decision = { mode: 'neutral', modeLabel: 'neutral', reasons: ['señal débil: no se guarda'] };
      }
      a.mode = decision.mode;
      a.modeLabel = decision.modeLabel;
      var b = typeof base === 'function' ? base(a) : base;
      var s = shape(b, a, Object.assign({}, o, { mode: decision.mode }));
      a._opening = s.opening;
      var learned = learn(userText, s.text, a, s.tone);
      s.cooldown = (learned.user && learned.user.cooldown) ? {
        active: learned.user.cooldown.remaining > 0,
        remaining: learned.user.cooldown.remaining,
        asked: !!learned.user.cooldown.asked
      } : (a.cooldown && a.cooldown.active ? a.cooldown : { active: false, remaining: 0, asked: false });
      /* If we just triggered, the current turn is not one of the 4. */
      if (learned.user && learned.user.cooldown && learned.user.cooldown.remaining === ((R && R.cooldown && R.cooldown.respuestas) || 4)
          && !a.cooldown) {
        s.cooldown = { active: false, remaining: learned.user.cooldown.remaining, asked: false, armed: true };
      }
      return s;
    }

    function forget() {
      try { storage.removeItem(KU); storage.removeItem(KA); } catch (e) {}
      listeners.forEach(function (fn) { try { fn(null); } catch (e) {} });
    }
    function indicatorText(a) {
      var l = a || loadUser().last;
      if (!l || (l.label == null && l.emotion == null && l.e == null && !l.mode)) return 'Módulo Lorena · emoción detectada: —';
      if (!l.label && !l.emotion && !l.e) return 'Módulo Lorena · emoción detectada: —';
      var name = l.label || (EMOTIONS[l.emotion || l.e] || EMOTIONS.calma).name;
      var i = l.intensity != null ? l.intensity : l.i;
      var s = 'Módulo Lorena · emoción detectada: ' + name + ' ' + i + '/10';
      var e2 = l.secondary || (l.e2 ? { emotion: l.e2, label: l.label2, intensity: l.i2 } : null);
      if (e2 && (e2.emotion || e2.e) && (e2.intensity != null || e2.i != null)) {
        var n2 = e2.label || (EMOTIONS[e2.emotion || e2.e] || {}).name;
        var i2 = e2.intensity != null ? e2.intensity : e2.i;
        if (n2) s += ' · ' + n2 + ' ' + i2 + '/10';
      }
      var modeLabel = l.modeLabel || (l.mode === 'eva' ? 'modo Eva' : l.mode === 'lorena' ? 'modo Lorena' : '');
      if (modeLabel) s += ' · ' + modeLabel;
      var mac = l.machista && (l.machista.detected || l.machista === true);
      if (mac) s += ' · actitud machista detectada';
      var ctrl = l.control && (l.control.detected || l.control === true);
      if (ctrl && !mac) s += ' · indicios de control, con datos de ayuda';
      return s;
    }

    function mount(container, mo) {
      mo = mo || {};
      if (!container || typeof document === 'undefined') return null;
      var box = document.createElement('div');
      box.className = 'lorena-box';
      box.setAttribute('data-lorena', app);
      box.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12.5px;opacity:.95;margin:6px 0';
      var txt = document.createElement('span');
      txt.className = 'lorena-indicator';
      txt.setAttribute('aria-live', 'polite');
      txt.title = 'Estimación orientativa por palabras, hecha en este dispositivo. No es una medición clínica. ' + CREDIT;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lorena-forget ' + (mo.buttonClass || '');
      btn.textContent = mo.buttonText || '🧹 Borrar memoria';
      btn.style.cssText = 'background:none;border:1px solid currentColor;color:inherit;border-radius:8px;padding:2px 8px;cursor:pointer;font:inherit';
      var info = document.createElement('small');
      info.className = 'lorena-note';
      info.textContent = mo.noteText || '🔒 memoria emocional solo en este dispositivo · estimación orientativa por palabras';
      info.style.opacity = '.75';
      box.appendChild(txt); box.appendChild(btn); box.appendChild(info);
      container.appendChild(box);
      function paint(a) { txt.textContent = indicatorText(a || undefined); }
      paint();
      listeners.push(paint);
      btn.addEventListener('click', function () { forget(); if (typeof mo.onForget === 'function') mo.onForget(); });
      return box;
    }

    return { app: app, assistant: assistant, keys: { user: KU, assistant: KA }, analyze: analyze, shape: shape,
      learn: learn, respond: respond, memory: memory, forget: forget, indicatorText: indicatorText, mount: mount,
      decideMode: function (a) { return decideMode(a || {}, memory()); },
      chooseTone: function (a) { return chooseTone(a); }, onChange: function (fn) { listeners.push(fn); } };
  }

  return { VERSION: VERSION, CREDIT: CREDIT, EMOTIONS: EMOTIONS, create: create, analyzeText: analyzeText,
    fold: fold, normalizeTypos: normalizeTypos, decideMode: decideMode, lastValenceOf: lastValenceOf,
    isIronic: isIronic, isWeakSignal: isWeakSignal, detectMachismo: detectMachismo, detectControl: detectControl,
    analyzeGuide: analyzeGuide, applyRules: applyRules, getRules: function () { return R; },
    CRISIS_NOTE: CRISIS_NOTE, HIGH_NOTE: HIGH_NOTE, NOTE_016: NOTE_016, MACHISTA_NOTE: MACHISTA_NOTE,
    CONTROL_NOTE: CONTROL_NOTE };
});
