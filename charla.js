/* OSNews · Charla natural (CHARLA_V1) · MAY y Asdrúbal · 5 idiomas (es, en, pt, fr, it).
   Presentación, nombre, preguntas de seguimiento de una en una; datos solo en este dispositivo.
   Prioridad: crisis (112/024/016) > creador > charla > respuestas del motor. Emociones simuladas.
   Pedro Sánchez Gómez (Mar Menor) con Copilot y Grok · OSNews. */
(function(){
var N=function(s){return ' '+String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9ñ\s]/g,' ').replace(/\s+/g,' ')+' '};
var LANGS=['es','en','pt','fr','it'];
var LW={es:/ (hola|buenas|buenos dias|buenas tardes|buenas noches|me llamo|mi nombre es|llamame|soy|vivo en|trabajo|me dedico|estoy|gracias|que tal|de donde|y tu|muy) /g,
 en:/ (hello|hi|hey|good morning|good evening|my name|i am|i m|im|call me|from|i live|i work|fine|thanks|thank you|great|good|the|and you) /g,
 pt:/ (ola|oi|bom dia|boa tarde|boa noite|meu nome|me chamo|chamo me|sou|moro|trabalho|tudo bem|obrigad[oa]|estou|voce|e tu) /g,
 fr:/ (bonjour|salut|coucou|bonsoir|je m appelle|je suis|j habite|je travaille|ca va|merci|tres|et toi|moi c est) /g,
 it:/ (ciao|buongiorno|buonasera|salve|mi chiamo|sono|abito|lavoro|sto bene|bene|grazie|benissimo|e tu) /g};
function detect(q,cur){var t=N(q),sc={},best=null,bs=0;LANGS.forEach(function(l){sc[l]=(t.match(LW[l])||[]).length});if(/[¿¡ñ]/.test(q))sc.es+=2;if(/[ãõç]/.test(q))sc.pt+=2;if(/[èòù]|c'è/.test(q))sc.it+=1;if(/[êœ]|ç|j'|l'/.test(q))sc.fr+=1;
 LANGS.forEach(function(l){if(sc[l]>bs){bs=sc[l];best=l}});if(!best||(cur&&sc[cur]>=bs))return cur||best||'es';return best}
var GREET=/^ (hola|holi|buenas|buenos dias|buenas tardes|buenas noches|hey|ey|hello|hi|hiya|good morning|good evening|ola|oi|bom dia|boa tarde|boa noite|bonjour|bonsoir|salut|coucou|ciao|buongiorno|buonasera|salve)( (may|asdrubal|a todos|amigo|amiga|que tal|there))? $/;
var STOP=/^(hola|si|sí|no|bien|vale|ok|okay|gracias|nada|nadie|hello|hi|yes|thanks|oui|non|merci|sim|nao|não|obrigado|obrigada|ciao|grazie|bene|claro|genial|mal|may|asdrubal|asdrúbal|que|qué|eh|ah|vaya|bueno|well|bom|bah)$/i;
var CRISIS=/ (suicid\w*|matarme|quitarme la vida|hacerme dan|autolesi\w*|cortarme|no quiero vivir|quiero morir\w*|kill myself|end my life|want to die|self harm|hurt myself|me matar|quero morrer|me tuer|envie de mourir|uccidermi|voglio morire|togliermi la vita|me pega|me maltrata|maltrato|me amenaza|violencia de genero|me viola|abuse|me bate|me frappe|mi picchia) /;
var CONCRETE=/ (calcula|cuanto es|cuanto son|temporizador|alarma|recuerdame|titulares|noticias|boletin|debate|encuesta|poema|poesia|cancion|canta|escribe|cuentame|explica|hora|tiempo hace|calculate|how much|timer|headlines|news|poem|sing|write|tell me|explain|what time|calcule|minuteur|actualites|chanson|ecris|calcola|notizie|poesia|canzone|scrivi|quanto fa|noticias|cante|escreve) |[0-9]\s*[x*/+\-]\s*[0-9]/;
var POS=/ (bien|muy bien|genial|estupend\w*|feliz|contenta?|fenomenal|de maravilla|good|great|fine|happy|ok|okay|well|awesome|bem|otimo|feliz|tudo bem|bien|super|ca va|tres bien|heureuse?|bene|benissimo|felice|alla grande) /;
var NEG=/ (mal|regular|triste|cansad[oa]|agobiad[oa]|fatal|bad|sad|tired|not good|not great|stressed|mal|cansad[oa]|triste|pas bien|fatigue\w*|triste|male|stanc[oa]|giu) /;
function cap(s){return s.replace(/(^|[\s-])(\p{L})/gu,function(a,b,c){return b+c.toUpperCase()})}
function clean(s){return String(s).replace(/[.!?¡¿,;:"«»]+/g,' ').replace(/\s+/g,' ').trim()}
var NAMEP=[/(?:me llamo|mi nombre es|ll[aá]mame|me dicen)\s+(\p{L}[\p{L}'-]{1,20})/iu,/(?:my name is|call me|my name's)\s+(\p{L}[\p{L}'-]{1,20})/iu,/(?:meu nome [ée]|me chamo|chamo-me|eu me chamo)\s+(\p{L}[\p{L}'-]{1,20})/iu,/(?:je m['’]appelle|moi c['’]est|mon nom est)\s+(\p{L}[\p{L}'-]{1,20})/iu,/(?:mi chiamo|il mio nome [èe])\s+(\p{L}[\p{L}'-]{1,20})/iu];
var SOYP=/^\s*(?:hola[, ]+)?(?:soy|i am|i'm|im|sou|eu sou|je suis|sono|io sono)\s+(\p{Lu}[\p{L}'-]{1,20})\s*[.!]?\s*$/u;
var CITYP=/(?:soy de|vengo de|vivo en|desde|i'?m from|i am from|from|i live in|sou de|moro em|venho de|je suis de|je viens de|j['’]habite (?:à|a|en)|sono di|vengo da|vivo a|abito a)\s+(.{2,40})$/i;
var JOBP=/(?:trabajo (?:de|como|en)|me dedico a|soy|i work (?:as|in)|i'?m an?|i am an?|i'?m|trabalho (?:como|em|de)|sou|je travaille (?:comme|dans|en)|je suis|lavoro (?:come|in|da)|sono un[oa]?|faccio (?:il|la|l'))\s+(.{2,40})$/i;
var TX={
may:{es:{intro:'¡Hola! Soy MAY, la presentadora IA de OSNews 💛. ¿Cómo te llamas?',back:'¡Hola de nuevo, {n}! 💛',hi:'¡Hola, {n}! 💛',nice:'Encantada, {n} 💛.',city:'¡{c}! Qué sitio tan bonito ✨.',job:'Qué interesante: {j} ✨.',good:'¡Cuánto me alegro, {n}! 😊',bad:'Siento que hoy no sea tu mejor día, {n} 💛. ¿Quieres contarme qué te pasa? Te escucho.',q:{city:'¿De dónde eres?',job:'¿Y a qué te dedicas?',mood:'¿Cómo estás hoy?',open:'¿De qué te apetece hablar?'}},
 en:{intro:'Hi! I\'m MAY, the AI presenter of OSNews 💛. What\'s your name?',back:'Welcome back, {n}! 💛',hi:'Hi, {n}! 💛',nice:'Lovely to meet you, {n} 💛.',city:'{c}! What a lovely place ✨.',job:'How interesting: {j} ✨.',good:'I\'m so glad, {n}! 😊',bad:'I\'m sorry today isn\'t your best day, {n} 💛. Do you want to tell me what\'s going on? I\'m listening.',q:{city:'Where are you from?',job:'And what do you do?',mood:'How are you today?',open:'What would you like to talk about?'}},
 pt:{intro:'Olá! Sou a MAY, a apresentadora IA do OSNews 💛. Como te chamas?',back:'Olá de novo, {n}! 💛',hi:'Olá, {n}! 💛',nice:'Muito prazer, {n} 💛.',city:'{c}! Que lugar tão bonito ✨.',job:'Que interessante: {j} ✨.',good:'Fico muito contente, {n}! 😊',bad:'Lamento que hoje não seja o teu melhor dia, {n} 💛. Queres contar-me o que se passa? Estou a ouvir.',q:{city:'De onde és?',job:'E o que fazes na vida?',mood:'Como estás hoje?',open:'Sobre o que te apetece falar?'}},
 fr:{intro:'Bonjour ! Je suis MAY, la présentatrice IA d’OSNews 💛. Comment t’appelles-tu ?',back:'Re-bonjour, {n} ! 💛',hi:'Bonjour, {n} ! 💛',nice:'Enchantée, {n} 💛.',city:'{c} ! Quel bel endroit ✨.',job:'Comme c’est intéressant : {j} ✨.',good:'J’en suis ravie, {n} ! 😊',bad:'Je suis désolée que ce ne soit pas ton meilleur jour, {n} 💛. Tu veux me raconter ce qui se passe ? Je t’écoute.',q:{city:'D’où viens-tu ?',job:'Et que fais-tu dans la vie ?',mood:'Comment vas-tu aujourd’hui ?',open:'De quoi as-tu envie de parler ?'}},
 it:{intro:'Ciao! Sono MAY, la presentatrice IA di OSNews 💛. Come ti chiami?',back:'Bentornato/a, {n}! 💛',hi:'Ciao, {n}! 💛',nice:'Piacere, {n} 💛.',city:'{c}! Che bel posto ✨.',job:'Che interessante: {j} ✨.',good:'Che bello, {n}! 😊',bad:'Mi dispiace che oggi non sia la tua giornata migliore, {n} 💛. Vuoi raccontarmi cosa succede? Ti ascolto.',q:{city:'Di dove sei?',job:'E di cosa ti occupi?',mood:'Come stai oggi?',open:'Di cosa ti va di parlare?'}}},
asdrubal:{es:{intro:'Hola, alma viajera 🌹. Soy Asdrúbal, poeta IA de OSNews. ¿Cómo te llamas?',back:'Qué alegría volver a verte, {n} 🌹.',hi:'Hola, {n}: llegas como la brisa del Mar Menor 🌊.',nice:'Encantado, {n}: tu nombre suena a verso nuevo 🌹.',city:'{c}… ya imagino su luz y sus calles 🌙.',job:'{j}: también eso es poesía en movimiento ✨.',good:'Me alegra: que tu día siga floreciendo, {n} 🌿.',bad:'Lo siento, {n}. Hasta las noches largas terminan en alba 🌙. ¿Quieres contarme qué te pasa?',q:{city:'¿De dónde eres?',job:'¿Y a qué dedicas tus días?',mood:'¿Cómo está hoy tu corazón?',open:'¿Te escribo un poema o prefieres que charlemos?'}},
 en:{intro:'Hello, wandering soul 🌹. I\'m Asdrúbal, the AI poet of OSNews. What\'s your name?',back:'What a joy to see you again, {n} 🌹.',hi:'Hello, {n}: you arrive like a sea breeze 🌊.',nice:'Delighted, {n}: your name sounds like a brand-new verse 🌹.',city:'{c}… I can already picture its light and its streets 🌙.',job:'{j}: that too is poetry in motion ✨.',good:'I\'m glad: may your day keep blooming, {n} 🌿.',bad:'I\'m sorry, {n}. Even long nights end in dawn 🌙. Would you like to tell me what\'s wrong?',q:{city:'Where are you from?',job:'And what do you spend your days doing?',mood:'How is your heart today?',open:'Shall I write you a poem, or would you rather chat?'}},
 pt:{intro:'Olá, alma viajante 🌹. Sou o Asdrúbal, poeta IA do OSNews. Como te chamas?',back:'Que alegria voltar a ver-te, {n} 🌹.',hi:'Olá, {n}: chegas como a brisa do mar 🌊.',nice:'Encantado, {n}: o teu nome soa a verso novo 🌹.',city:'{c}… já imagino a sua luz e as suas ruas 🌙.',job:'{j}: isso também é poesia em movimento ✨.',good:'Fico feliz: que o teu dia continue a florescer, {n} 🌿.',bad:'Lamento, {n}. Até as noites longas acabam em madrugada 🌙. Queres contar-me o que se passa?',q:{city:'De onde és?',job:'E a que dedicas os teus dias?',mood:'Como está hoje o teu coração?',open:'Escrevo-te um poema ou preferes conversar?'}},
 fr:{intro:'Bonjour, âme voyageuse 🌹. Je suis Asdrúbal, le poète IA d’OSNews. Comment t’appelles-tu ?',back:'Quelle joie de te revoir, {n} 🌹.',hi:'Bonjour, {n} : tu arrives comme une brise marine 🌊.',nice:'Enchanté, {n} : ton prénom sonne comme un vers nouveau 🌹.',city:'{c}… j’imagine déjà sa lumière et ses rues 🌙.',job:'{j} : c’est aussi de la poésie en mouvement ✨.',good:'J’en suis heureux : que ta journée continue de fleurir, {n} 🌿.',bad:'Je suis désolé, {n}. Même les longues nuits finissent par l’aube 🌙. Tu veux me raconter ce qui ne va pas ?',q:{city:'D’où viens-tu ?',job:'Et à quoi consacres-tu tes journées ?',mood:'Comment va ton cœur aujourd’hui ?',open:'Je t’écris un poème ou tu préfères bavarder ?'}},
 it:{intro:'Ciao, anima viaggiatrice 🌹. Sono Asdrúbal, il poeta IA di OSNews. Come ti chiami?',back:'Che gioia rivederti, {n} 🌹.',hi:'Ciao, {n}: arrivi come una brezza di mare 🌊.',nice:'Piacere, {n}: il tuo nome suona come un verso nuovo 🌹.',city:'{c}… immagino già la sua luce e le sue strade 🌙.',job:'{j}: anche questa è poesia in movimento ✨.',good:'Ne sono felice: che la tua giornata continui a fiorire, {n} 🌿.',bad:'Mi dispiace, {n}. Anche le notti lunghe finiscono all’alba 🌙. Vuoi raccontarmi cosa succede?',q:{city:'Di dove sei?',job:'E a cosa dedichi le tue giornate?',mood:'Come sta oggi il tuo cuore?',open:'Ti scrivo una poesia o preferisci chiacchierare?'}}}};
function today(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
window.OSN_CHARLA=function(o){/* o: who, state(), save(), ui(), isCrisis(q) */
 function C(){var S=o.state();if(!S.ch||typeof S.ch!=='object')S.ch={};S.facts=S.facts||{};return S}
 function T(l){return TX[o.who][l]||TX[o.who].es}
 function f(s,S){return s.replace('{n}',S.name||'').replace(' , ',' ').replace(', !','!').replace(', 💛',' 💛').replace(' ,',',')}
 function nextQ(S,l){var c=S.ch,q=T(l).q;if(!S.name){c.await='name';return ''}
  if(!c.city&&!c.skCity){c.await='city';return q.city}if(!c.job&&!c.skJob){c.await='job';return q.job}
  if(c.moodDay!==today()){c.await='mood';c.moodDay=today();return q.mood}c.await=null;return q.open}
 function out(S,l,txt){S.ch.lang=l;S.ch.lastQ=Date.now();o.save();window.__charlaLang=l;return{text:txt.replace(/\s+/g,' ').trim(),lang:l}}
 var api={langOf:function(q){var S=C();return detect(q,S.ch.lang||o.ui())},
 welcome:function(){var S=C(),l=S.ch.lang||o.ui();if(!S.name){S.ch.await='name';return out(S,l,T(l).intro).text}var Q=nextQ(S,l);return out(S,l,f(T(l).back,S)+' '+Q).text},
 turn:function(q){var S=C(),c=S.ch,raw=String(q||'').trim(),t=N(raw),w=t.trim().split(' ').filter(Boolean);
  if(!raw)return null;if(CRISIS.test(t)||(o.isCrisis&&o.isCrisis(raw))){c.await=null;o.save();return null}
  if(window.OSN_CREATOR&&OSN_CREATOR(raw))return null;
  var l=detect(raw,c.lang||o.ui()),X=T(l),m,isQ=/[?¿]/.test(raw),concrete=CONCRETE.test(t);
  if(concrete&&!GREET.test(t)){c.lang=l;o.save();return null}
  /* nombre explícito */
  for(var i=0;i<NAMEP.length&&!m;i++)m=raw.match(NAMEP[i]);
  if(!m)m=raw.match(SOYP);
  if(!m&&c.await==='name'&&!isQ&&w.length>=1&&w.length<=3&&/^[\p{L}' -]+$/u.test(clean(raw))&&!STOP.test(w[0])&&!GREET.test(t))m=[0,clean(raw).split(' ').slice(0,/^\p{Lu}/u.test((clean(raw).split(' ')[1]||''))?2:1).join(' ')];
  if(m&&!STOP.test(m[1])){S.name=cap(m[1].toLowerCase());if(o.onName)o.onName(S.name);c.await=null;var Q=nextQ(S,l);return out(S,l,f(X.nice,S)+' '+Q)}
  /* saludo */
  if(GREET.test(t)){if(!S.name){c.await='name';return out(S,l,X.intro)}var Q2=nextQ(S,l);return out(S,l,f(X.hi,S)+' '+Q2)}
  if(isQ||w.length>9)return null;
  /* ciudad */
  if((m=raw.match(CITYP))&&(c.await==='city'||!c.city)&&!/^(un|una|a|an)\b/i.test(m[1])){c.city=cap(clean(m[1]).split(' ').slice(0,4).join(' '));S.facts.city=c.city;var Q3=nextQ(S,l);return out(S,l,X.city.replace('{c}',c.city)+' '+Q3)}
  if(c.await==='city'&&w.length<=4&&!STOP.test(w[0])){c.city=cap(clean(raw).replace(/^(de|desde|from|em|da|di)\s+/i,''));S.facts.city=c.city;var Q4=nextQ(S,l);return out(S,l,X.city.replace('{c}',c.city)+' '+Q4)}
  /* ocupación */
  if(c.await==='job'&&w.length<=7){m=raw.match(JOBP);var j=clean(m?m[1]:raw).replace(/^(un|una|a|an|um|uma|le|la|il|lo|uno|une)\s+/i,'');if(j&&!STOP.test(j)){c.job=j.toLowerCase();S.facts.job=c.job;var J=c.job.charAt(0).toUpperCase()+c.job.slice(1);var Q5=nextQ(S,l);return out(S,l,X.job.replace('{j}',J)+' '+Q5)}}
  /* ánimo */
  if(c.await==='mood'&&w.length<=7){if(NEG.test(t)&&!/ (no (estoy )?mal|not bad|pas mal|non male) /.test(t)){c.await=null;return out(S,l,f(X.bad,S))}if(POS.test(t)||/ (no (estoy )?mal|not bad|pas mal|non male) /.test(t)){c.await=null;return out(S,l,f(X.good,S)+' '+X.q.open)}}
  if(c.await&&c.await!=='name'){if(c.await==='city')c.skCity=1;if(c.await==='job')c.skJob=1;c.await=null}
  c.lang=l;o.save();return null}};
 return api};
})();
