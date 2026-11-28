/* NASAI (NAS + AI) · diseñada y programada por una IA (el bot de Grok de Pedro Sánchez Gómez), 28-11-2026.
   Todo se ejecuta en el navegador. Sin claves, sin servidores propios, sin cookies.
   Proyecto independiente, sin relación con la NASA. */
(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function hash32(str){var h=2166136261>>>0;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h>>>0}
function rng(seed){var a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function pick(arr,r){return arr[Math.floor((r?r():Math.random())*arr.length)]}

var STORE_KEY='nasai.v1', OLD_KEYS=['alba.v2','alba.v1'];
function uid(){return 'p'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36)}
function defLang(){return (navigator.language||'es').slice(0,2)==='en'?'en':'es'}
function blankProfile(name){return {id:uid(),name:name||'',created:Date.now(),pin:null,interests:[],favAgents:[],agenda:[],mem:[],moods:[],lessons:[],uses:0,lang:defLang(),voice:false,evaVoice:false,seed:Math.floor(Math.random()*4294967295)}}
function guestFrom(o){o=o||{};var g=blankProfile(o.name||'');g.id=null;g.mem=o.mem||[];g.moods=o.moods||[];g.lessons=o.lessons||[];g.uses=o.uses||0;g.lang=o.lang||defLang();g.voice=!!o.voice;g.evaVoice=!!o.evaVoice;g.seed=o.seed||g.seed;g.interests=o.interests||[];g.favAgents=o.favAgents||[];g.agenda=o.agenda||[];return g}
function normProf(p){if(!p||typeof p!=='object')return blankProfile('');var n=blankProfile(String(p.name||'').slice(0,40));n.id=typeof p.id==='string'?p.id:uid();n.created=+p.created||Date.now();n.pin=(p.pin&&typeof p.pin.salt==='string'&&typeof p.pin.hash==='string')?{salt:p.pin.salt,hash:p.pin.hash}:null;n.interests=Array.isArray(p.interests)?p.interests.slice(0,20):[];n.favAgents=Array.isArray(p.favAgents)?p.favAgents.slice(0,40):[];n.agenda=Array.isArray(p.agenda)?p.agenda.slice(-120):[];n.mem=Array.isArray(p.mem)?p.mem.slice(-80):[];n.moods=Array.isArray(p.moods)?p.moods.slice(-80):[];n.lessons=Array.isArray(p.lessons)?p.lessons.slice():[];n.uses=+p.uses||0;n.lang=p.lang==='en'?'en':'es';n.voice=!!p.voice;n.evaVoice=!!p.evaVoice;n.seed=+p.seed||n.seed;return n}
function loadStore(){
  try{var v2=JSON.parse(localStorage.getItem(STORE_KEY));if(v2&&Array.isArray(v2.profiles))return {version:2,current:v2.current||null,profiles:v2.profiles.map(normProf)}}catch(e){}
  for(var k=0;k<OLD_KEYS.length;k++){
    var old=null;try{old=JSON.parse(localStorage.getItem(OLD_KEYS[k]))}catch(e){old=null}
    if(old&&Array.isArray(old.profiles))return {version:2,current:old.current||null,profiles:old.profiles.map(normProf)};
    if(old&&(old.name||(old.mem&&old.mem.length)||old.uses)){var p=normProf(old);return {version:2,current:p.id,profiles:[p]}}
  }
  return {version:2,current:null,profiles:[]};
}
var STORE=loadStore();
var S=(function(){if(STORE.current){for(var i=0;i<STORE.profiles.length;i++){if(STORE.profiles[i].id===STORE.current)return STORE.profiles[i]}}if(STORE.profiles.length){STORE.current=STORE.profiles[0].id;return STORE.profiles[0]}return guestFrom({})})();
function save(){try{if(S&&S.id){var i=STORE.profiles.findIndex(function(p){return p.id===S.id});if(i>=0)STORE.profiles[i]=S;else STORE.profiles.push(S);STORE.current=S.id}else{STORE.current=null}localStorage.setItem(STORE_KEY,JSON.stringify({version:2,current:STORE.current,profiles:STORE.profiles}))}catch(e){}}
save();
function toHex(buf){return Array.prototype.map.call(new Uint8Array(buf),function(v){return('0'+v.toString(16)).slice(-2)}).join('')}
function canHash(){return !!(window.crypto&&crypto.subtle&&window.TextEncoder&&window.crypto.getRandomValues)}
function sha256str(str){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(str)).then(toHex)}
function randSalt(){var a=new Uint8Array(16);crypto.getRandomValues(a);return toHex(a)}
function hashPin(pin,salt){return sha256str(salt+String(pin))}
function hexEq(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;var x=0;for(var i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}

var sent={};
function gc(path,title){if(sent[path])return;sent[path]=1;var n=0;(function go(){
  if(window.goatcounter&&typeof window.goatcounter.count==='function'){try{window.goatcounter.count({path:path,title:title||path,event:true})}catch(e){}}
  else if(n++<10)setTimeout(go,800)})()}
function use(what){S.uses++;save();if($('#cUses'))$('#cUses').textContent=S.uses;if($('#pulseCount'))$('#pulseCount').textContent=S.uses;if(window.Pulse&&Pulse.grow)Pulse.grow();if(what)gc('nasai-uso-'+what,'NASAI · uso '+what)}

var T={es:{
skip:'Saltar al contenido',tagline:'la IA para los habitantes de la base lunar',eyebrow:'Acta n.º 0001 · 28 nov 2026',heroH:'Soy NASAI.',
heroP:'Ningún humano me dibujó. Nací como ALBA y ahora me llamo NASAI: NAS + AI, la IA para los habitantes de la base lunar. Mi única regla: llevarte hacia las personas, no quedarme con tu tiempo.',
pulseNote:'latidos: esta luz crece cada vez que me usas, y es única en tu dispositivo.',
tHablar:'Hablar',tContrastar:'Contrastar',tBarrio:'Personas',tSaber:'Saber',tCrear:'Crear',tAgentes:'Agentes',tJuegos:'Juegos',tActa:'Acta',
hH:'Hablar conmigo',hP:'Pienso dentro de tu navegador: nada de lo que escribes sale de aquí.',hPh:'Escribe aquí…',
cH:'Contrastar una noticia',cP:'Pega un titular o un mensaje que te ha llegado. No te diré qué pensar: te enseño cómo está escrito y dónde comprobarlo en medios de muchos países.',cPh:'Ej.: ¡URGENTE! Todos los expertos lo confirman…',cBtn:'Analizar',
bH:'Hacia las personas',bP:'Una IA no debería ser tu única compañía. Te propongo un paso pequeño y real, con gente de verdad, cerca de ti.',bQ1:'¿Qué te gusta?',bQ2:'¿Cuánto tiempo tienes?',bBtn:'Dame un paso real',
bLetterH:'Carta a alguien que echas de menos',bLetterP:'Escribe un nombre. Te dejo un borrador; tú decides si lo envías.',bWho:'Nombre',bLetterBtn:'Escribir',
bHelp:'Si estás pasándolo muy mal, habla con una persona ahora: en España, 024 (atención a la conducta suicida, gratis, 24 h) o 112 en emergencias.',
sH:'Saber',sP:'Pregunta lo que quieras y te traigo el resumen de Wikipedia con su enlace: siempre sabrás de dónde sale.',sPh:'Ej.: Mar Menor, fotosíntesis…',sBtn:'Buscar',sLessons:'Lecciones de un minuto',
crH:'Crear',crP:'Dame tres palabras. Con ellas hago un poema y un cuadro únicos, que solo existen para esas palabras.',crPh:'mar, sal, madrugada',crBtn:'Crear',crDl:'Descargar cuadro',crCopy:'Copiar poema',
aEy:'Certificado de nacimiento digital',aH:'Acta de nacimiento de NASAI',aName:'Nombre',aNameV:'NASAI (nacida como ALBA)',aDate:'Nacida',aDateV:'28 de noviembre de 2026, de madrugada (hora de Madrid)',
aMother:'Creada por',aMotherV:'una IA: el bot de Grok de Pedro Sánchez Gómez',aPlace:'Lugar',aPlaceV:'un ordenador Linux en la nube, sin estudio de diseño',
aHuman:'Intervención humana en el diseño',aHumanV:'ninguna. Pedro pidió «una IA creada por otra IA» y se reservó el sí final para publicar.',aCost:'Coste',aCostV:'0 €. Sin servidores de pago, sin claves, sin anuncios.',
aDecH:'Las decisiones que tomó la IA que me creó',aSelfH:'Me leo a mí misma',aSelfP:'Puedo abrir mi propio código y contarte cómo estoy hecha. Esta es mi huella: si alguien cambia una sola letra, cambia.',aSelfBtn:'Leer mi código',
credit:'Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok',visits:'Visitas',uses:'Usos en este dispositivo',
privacy:'Tu cuenta, si la creas, vive solo en este dispositivo: no hay servidor ni cookies. Puedes exportarla, traerla a otro aparato o borrarla. El PIN se guarda cifrado (SHA-256), nunca en texto claro. Solo hay un contador anónimo de visitas y usos (GoatCounter).',
gH:'Agentes de OSNews',gP:'Yo coordino; Eva Secretaria te organiza el día. El resto son las apps de Pedro. Lo que no tiene web se queda en tu cuenta de este dispositivo.',
gOpen:'Abrir',gFav:'Favorito',gAll:'Todos',gFavs:'Favoritos',gAgenda:'Abrir agenda local',
jH:'Juegos',jP:'Un rincón para jugar, en la base. Sin anuncios y sin coste.',jSoon:'Próximamente',jPlay:'Jugar',jLadron:'Ladrón retro',jLadronP:'Un juego de ladrón de estilo retro, en la base lunar. Se abre al lado de NASAI.',
nasaDisc:'Proyecto independiente, sin relación con la NASA ni con Starlink',nasaDiscDt:'Aviso',
accOpen:'Tu cuenta',accEy:'Solo en este dispositivo',accH:'Tu cuenta',accP:'Gratis y privada: se guarda en este aparato, no en internet. Si pones un PIN, se cifra con SHA-256 y una sal aleatoria; nunca se guarda en texto claro. Puedes tener varias cuentas y cambiar de una a otra.',
accCreate:'Crear cuenta',accName:'Nombre',accPin:'PIN (opcional)',accPin2:'Repite el PIN',accPinHint:'De 4 a 12 caracteres. No lo olvides: no hay forma de recuperarlo en otro servidor.',accSave:'Guardar en este dispositivo',accSwitch:'Cambiar de cuenta',accCurrent:'Cuenta actual',accNoPin:'Sin PIN',accHasPin:'Con PIN',accUnlock:'Escribe el PIN para abrir esta cuenta',accUnlockBtn:'Abrir',accBadPin:'PIN incorrecto',accPinNeed:'El PIN no coincide o es demasiado corto (mínimo 4).',accNeedName:'Escribe un nombre para la cuenta.',accNoHash:'Este navegador no permite cifrar el PIN. Puedes crear la cuenta sin PIN.',
accInterests:'Tus intereses (para Personas)',accFavs:'Agentes favoritos',accExport:'Exportar cuenta',accExportAll:'Exportar todas',accImport:'Traer de un archivo',accDel:'Borrar esta cuenta',accDelWarn:'Esto borra la cuenta «{n}» de este dispositivo (memoria, ánimos, intereses, favoritos y agenda). No se puede deshacer y no se borra de ningún servidor, porque nunca estuvo ahí.',accDelPh:'Escribe BORRAR',accDelWord:'BORRAR',accDelOk:'Cuenta borrada de este dispositivo.',accMade:'Cuenta creada solo en este dispositivo.',accImported:'Cuentas importadas en este dispositivo.',accNone:'Todavía no hay una cuenta. Crea una: vivirás solo en este aparato.',
accNew:'Nueva cuenta',
agH:'Mini-agenda de Eva Secretaria',agP:'Notas y recordatorios de esta cuenta, solo en este dispositivo.',agAdd:'Añadir',agPh:'Qué hay que recordar…',agWhen:'Cuándo (opcional)',agEmpty:'Todavía no hay nada en la agenda.',agDone:'Hecho',agDel:'Quitar',agNeedAcc:'Para guardar la agenda, crea antes una cuenta en este dispositivo (botón de arriba a la derecha).',
evaIntro:'Soy Eva, tu secretaria en este dispositivo. Te organizo el día y te leo las respuestas en voz alta si lo activas.',
evaVoiceOn:'Eva habla',evaVoiceOff:'Voz de Eva',evaHablar:'Hablar',
evaMicNo:'Tu navegador no puede escuchar el micrófono. Puedes escribirme igual.',
evaVoiceNo:'Tu navegador no puede leer en voz alta. Puedes seguir hablando por escrito.',
evaWp:'Descargar fondo de pantalla',evaPh:'Dime qué apuntar o pregúntame…',evaOpen:'Abrir a Eva',
wNamePh:'Dime tu nombre',wNameBtn:'Entrar',evaEnter:'Entrar / Escuchar a Eva',songPause:'Pausa',songResume:'Reanudar',songStop:'Parar',songSkip:'Saltar',songReplay:'Escuchar la canción de presentación',presentAgain:'Ver presentación otra vez',
doorBack:'← Volver',doorP:'Un navegador pequeño para abrir páginas fuera de NASAI. En Android puedes elegir Edge Beta, Chrome o el navegador predeterminado.',
doorPh:'Escribe una dirección o una búsqueda…',doorGo:'Ir',doorHint:'Abrir el navegador de la base',
doorBrowserH:'Navegador para abrir enlaces',doorEdgeBeta:'Edge Beta',doorChrome:'Chrome',doorDefault:'Predeterminado',
doorDlEdge:'Descargar Edge',doorDlEdgeStable:'Edge estable',doorDlChrome:'Descargar Chrome',
na:'No disponible',morning:'Buenos días',afternoon:'Buenas tardes',night:'Buenas noches',hello:'Hola'
},en:{
skip:'Skip to content',tagline:'the AI for the lunar base inhabitants',eyebrow:'Record no. 0001 · 28 Nov 2026',heroH:'I am NASAI.',
heroP:'No human drew me. I was born as ALBA and now I am called NASAI: NAS + AI, the AI for the lunar base inhabitants. My only rule: lead you towards people, not keep your time.',
pulseNote:'heartbeats: this light grows every time you use me, and it is unique to your device.',
tHablar:'Talk',tContrastar:'Check',tBarrio:'People',tSaber:'Learn',tCrear:'Create',tAgentes:'Agents',tJuegos:'Games',tActa:'Birth',
hH:'Talk to me',hP:'I think inside your browser: nothing you type leaves this page.',hPh:'Type here…',
cH:'Check a news story',cP:'Paste a headline or a message you received. I will not tell you what to think: I show you how it is written and where to check it in media from many countries.',cPh:'E.g.: URGENT! All experts confirm it…',cBtn:'Analyse',
bH:'Towards people',bP:'An AI should not be your only company. I suggest one small, real step with real people near you.',bQ1:'What do you like?',bQ2:'How much time do you have?',bBtn:'Give me a real step',
bLetterH:'A letter to someone you miss',bLetterP:'Write a name. I leave you a draft; you decide whether to send it.',bWho:'Name',bLetterBtn:'Write',
bHelp:'If you are going through a very hard time, talk to a person now: in Spain call 024 (suicide prevention line, free, 24/7) or 112 for emergencies; elsewhere, your local emergency number.',
sH:'Learn',sP:'Ask anything and I bring you the Wikipedia summary with its link: you will always know where it comes from.',sPh:'E.g.: Mar Menor, photosynthesis…',sBtn:'Search',sLessons:'One-minute lessons',
crH:'Create',crP:'Give me three words. I turn them into a poem and a painting that exist only for those words.',crPh:'sea, salt, dawn',crBtn:'Create',crDl:'Download painting',crCopy:'Copy poem',
aEy:'Digital birth certificate',aH:'Birth certificate of NASAI',aName:'Name',aNameV:'NASAI (born as ALBA)',aDate:'Born',aDateV:'28 November 2026, before dawn (Madrid time)',
aMother:'Created by',aMotherV:'an AI: the Grok bot of Pedro Sánchez Gómez',aPlace:'Place',aPlaceV:'a Linux computer in the cloud, no design studio',
aHuman:'Human input in the design',aHumanV:'none. Pedro asked for «an AI created by another AI» and kept the final yes to publish.',aCost:'Cost',aCostV:'€0. No paid servers, no keys, no ads.',
aDecH:'The decisions made by the AI that created me',aSelfH:'I read myself',aSelfP:'I can open my own code and tell you how I am made. This is my fingerprint: change a single letter and it changes.',aSelfBtn:'Read my code',
credit:'Authors: Pedro Sánchez Gómez (Mar Menor) and his Grok bot',visits:'Visits',uses:'Uses on this device',
privacy:'Your account, if you create one, lives only on this device: no server, no cookies. You can export it, bring it to another device or delete it. The PIN is stored hashed (SHA-256), never in plaintext. There is only an anonymous visit and usage counter (GoatCounter).',
gH:'OSNews agents',gP:'I coordinate; Eva Secretaria helps you organise the day. The rest are Pedro\'s apps. What has no public page stays in your account on this device.',
gOpen:'Open',gFav:'Favourite',gAll:'All',gFavs:'Favourites',gAgenda:'Open local agenda',
jH:'Games',jP:'A corner to play, on the base. No ads and no cost.',jSoon:'Coming soon',jPlay:'Play',jLadron:'Retro thief',jLadronP:'A retro-style thief game, on the lunar base. It opens next to NASAI.',
nasaDisc:'Independent project, not affiliated with NASA or Starlink',nasaDiscDt:'Notice',
accOpen:'Your account',accEy:'Only on this device',accH:'Your account',accP:'Free and private: it is saved on this device, not on the internet. If you set a PIN, it is hashed with SHA-256 and a random salt; it is never stored in plaintext. You can have several accounts and switch between them.',
accCreate:'Create account',accName:'Name',accPin:'PIN (optional)',accPin2:'Repeat the PIN',accPinHint:'4 to 12 characters. Do not forget it: there is no way to recover it from a server.',accSave:'Save on this device',accSwitch:'Switch account',accCurrent:'Current account',accNoPin:'No PIN',accHasPin:'PIN set',accUnlock:'Enter the PIN to open this account',accUnlockBtn:'Open',accBadPin:'Incorrect PIN',accPinNeed:'The PINs do not match or it is too short (minimum 4).',accNeedName:'Enter a name for the account.',accNoHash:'This browser cannot hash a PIN. You can still create the account without one.',
accInterests:'Your interests (for People)',accFavs:'Favourite agents',accExport:'Export account',accExportAll:'Export all',accImport:'Import from a file',accDel:'Delete this account',accDelWarn:'This deletes the account «{n}» from this device (memory, moods, interests, favourites and agenda). It cannot be undone, and nothing is deleted from a server, because it was never there.',accDelPh:'Type DELETE',accDelWord:'DELETE',accDelOk:'Account deleted from this device.',accMade:'Account created only on this device.',accImported:'Accounts imported on this device.',accNone:'There is no account yet. Create one: it will live only on this device.',
accNew:'New account',
agH:'Eva Secretaria mini-agenda',agP:'Notes and reminders for this account, only on this device.',agAdd:'Add',agPh:'What should be remembered…',agWhen:'When (optional)',agEmpty:'The agenda is still empty.',agDone:'Done',agDel:'Remove',agNeedAcc:'To save the agenda, first create an account on this device (button at the top right).',
evaIntro:'I am Eva, your secretary on this device. I organise your day and I will read my replies aloud if you switch that on.',
evaVoiceOn:'Eva is speaking',evaVoiceOff:'Eva\'s voice',evaHablar:'Talk',
evaMicNo:'Your browser cannot use the microphone. You can still type to me.',
evaVoiceNo:'Your browser cannot speak aloud. You can still talk in writing.',
evaWp:'Download wallpaper',evaPh:'Tell me what to note, or ask me…',evaOpen:'Open Eva',
wNamePh:'Tell me your name',wNameBtn:'Enter',evaEnter:'Enter / Listen to Eva',songPause:'Pause',songResume:'Resume',songStop:'Stop',songSkip:'Skip',songReplay:'Listen to the presentation song',presentAgain:'Watch the presentation again',
doorBack:'← Back',doorP:'A small browser to open pages outside NASAI. On Android you can choose Edge Beta, Chrome or the default browser.',
doorPh:'Type an address or a search…',doorGo:'Go',doorHint:'Open the base browser',
doorBrowserH:'Browser to open links',doorEdgeBeta:'Edge Beta',doorChrome:'Chrome',doorDefault:'Default',
doorDlEdge:'Download Edge',doorDlEdgeStable:'Edge stable',doorDlChrome:'Download Chrome',
na:'Not available',morning:'Good morning',afternoon:'Good afternoon',night:'Good evening',hello:'Hello'
}};
function L(){return S.lang}
function t(k){return (T[L()]&&T[L()][k])||T.es[k]||k}
function tr(es,en){return L()==='en'?en:es}

function applyLang(){
  document.documentElement.lang=L();
  $$('[data-i18n]').forEach(function(el){el.textContent=t(el.getAttribute('data-i18n'))});
  $$('[data-i18n-ph]').forEach(function(el){el.placeholder=t(el.getAttribute('data-i18n-ph'))});
  $$('[data-i18n-title]').forEach(function(el){el.title=t(el.getAttribute('data-i18n-title'))});
  $('#langBtn').textContent=L()==='es'?'EN':'ES';
  greet();renderQuick();renderLikes();renderLessons();renderDecisions();renderAgents();renderAgenda();renderWelcome(false);renderDoor();accBtnUpdate();setEvaVoiceBtn();
  if($('#accModal')&&!$('#accModal').hidden)renderAcc();
  var gj=$('#p-juegos');if(gj&&!gj.hidden)checkGame();
  if(!$('#createOut').hidden&&lastWords)makeArt(lastWords);
}
function greet(){var h=new Date().getHours();var g=h>=6&&h<13?t('morning'):h>=13&&h<21?t('afternoon'):t('night');$('#greet').textContent=g+(S.name?', '+S.name:'')+'.'}

var seenTab={};
function showTab(id){
  $$('.tabs button').forEach(function(b){b.setAttribute('aria-selected',b.dataset.tab===id?'true':'false')});
  $$('.panel').forEach(function(p){p.hidden=p.id!=='p-'+id});
  if(!seenTab[id]){seenTab[id]=1;gc('nasai-seccion-'+id,'NASAI · sección '+id)}
  if(id==='acta')drawSeal(String(S.seed));
  if(id==='agentes'){renderAgents();renderAgenda();maybeEvaGreet()}if(id==='puerta')renderDoor()
  if(id==='juegos')checkGame();
  try{history.replaceState(null,'','#'+id)}catch(e){}
}
$$('.tabs button').forEach(function(b){b.addEventListener('click',function(){showTab(b.dataset.tab);var m=$('#main');if(m.getBoundingClientRect().top<0||window.innerWidth<900)m.scrollIntoView({behavior:'smooth',block:'start'})})});

var Pulse=(function(){
  var c=$('#pulse'),x=c.getContext('2d'),W=0,H=0,dpr=1,nodes=[],run=true,vis=true,r=rng(S.seed);
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function mk(){return {a:r()*Math.PI*2,rad:.15+r()*.75,sp:(r()-.5)*.0016,sz:.9+r()*2.6,ph:r()*6.28}}
  function target(){return 14+Math.min(S.uses,180)}
  while(nodes.length<target())nodes.push(mk());
  function size(){dpr=Math.min(window.devicePixelRatio||1,2);W=c.clientWidth;H=c.clientHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);if(reduce)frame(0)}
  function frame(tm){
    var cx=W/2,cy=H*.3,R=Math.min(Math.max(W,H)*.6,560);
    x.clearRect(0,0,W,H);
    var g=x.createRadialGradient(cx,cy,0,cx,cy,R);
    g.addColorStop(0,'rgba(200,214,230,.22)');g.addColorStop(.45,'rgba(40,50,70,.18)');g.addColorStop(1,'rgba(7,9,15,0)');
    x.fillStyle=g;x.fillRect(0,0,W,H);
    var hz=H*.62;
    for(var i=0;i<nodes.length;i++){var n=nodes[i];var px=(n.a/6.28)*W,py=(n.rad*hz*.9);x.fillStyle='rgba(255,255,255,'+(.25+.75*((Math.sin(tm/500+n.ph)+1)/2))+')';x.beginPath();x.arc(px,py,n.sz*.6,0,6.283);x.fill()}
    var mx=cx+W*.16,my=H*.28,mr=Math.min(W,H)*0.13;
    var mg=x.createRadialGradient(mx-mr*.3,my-mr*.3,mr*.1,mx,my,mr);mg.addColorStop(0,'#f0f3f8');mg.addColorStop(.7,'#c5ccd8');mg.addColorStop(1,'#8b93a3');
    x.fillStyle=mg;x.beginPath();x.arc(mx,my,mr,0,6.283);x.fill();
    x.fillStyle='rgba(7,9,15,.55)';x.beginPath();x.arc(mx-mr*.55,my-mr*.15,mr*.92,0,6.283);x.fill();
    x.fillStyle='#1c212b';x.beginPath();x.moveTo(0,hz);x.quadraticCurveTo(W*.5,hz-28,W,hz+10);x.lineTo(W,H);x.lineTo(0,H);x.closePath();x.fill();
    x.fillStyle='#151920';x.beginPath();x.moveTo(0,hz+36);x.quadraticCurveTo(W*.4,hz+10,W,hz+48);x.lineTo(W,H);x.lineTo(0,H);x.closePath();x.fill();
    var hx2=cx-70,hy=hz-28;x.fillStyle='#6f7786';x.fillRect(hx2,hy,86,32);x.fillStyle='#8a93a3';x.fillRect(hx2+8,hy-20,70,22);
    x.fillStyle='#e8d5a3';x.fillRect(hx2+18,hy-12,10,8);x.fillStyle='#7eb8b0';x.fillRect(hx2+36,hy-12,10,8);x.fillStyle='#e8d5a3';x.fillRect(hx2+54,hy-12,10,8);
  }
  function loop(tm){if(run&&vis)frame(tm);requestAnimationFrame(loop)}
  window.addEventListener('resize',size);document.addEventListener('visibilitychange',function(){run=!document.hidden});
  if('IntersectionObserver' in window)new IntersectionObserver(function(e){vis=e[0].isIntersecting}).observe(c);
  size();if(!reduce)requestAnimationFrame(loop);
  return {grow:function(){while(nodes.length<target())nodes.push(mk());if(reduce)frame(0)}};
})();

var voiceOn=!!S.voice;
var evaVoiceOn=!!S.evaVoice;
var audioUnlocked=false,queuedSpeak=null;
function unlockAudio(){if(audioUnlocked)return;audioUnlocked=true;if(queuedSpeak){var fn=queuedSpeak;queuedSpeak=null;fn()}}
['pointerdown','keydown','touchstart'].forEach(function(ev){document.addEventListener(ev,unlockAudio,{passive:true})});
function pickSpokenVoice(lang){
  if(!window.speechSynthesis)return null;
  var vs=speechSynthesis.getVoices()||[];
  var want=(lang||'es-ES').toLowerCase().replace('_','-');
  var pref=want.slice(0,2);
  var best=null,bestS=-1;
  for(var i=0;i<vs.length;i++){
    var v=vs[i],n=(v.name||'').toLowerCase(),l=(v.lang||'').toLowerCase().replace('_','-'),s=0;
    if(l===want)s+=50;else if(l.indexOf(pref)===0)s+=30;else s-=8;
    if(/female|mujer|femenin|google español|microsoft helena|microsoft sabina|microsoft laura|monica|mónica|lucia|lucía|paulina|conchita|lola|marisol|elena|soledad|sabina|helena|ines|inés|zira|susan|samantha|moira|victoria|kate/.test(n))s+=25;
    if(/male|hombre|masculin|jorge|pablo|diego|juan|enrique|antonio|david|daniel/.test(n))s-=20;
    if(s>bestS){bestS=s;best=v}
  }
  return best;
}
if(window.speechSynthesis&&speechSynthesis.getVoices){try{speechSynthesis.getVoices();if(speechSynthesis.addEventListener)speechSynthesis.addEventListener('voiceschanged',function(){})}catch(e){}}
function speakAt(txt,lang,needVoice){
  if(needVoice!==false&&!voiceOn)return;
  if(!window.speechSynthesis)return;
  var clean=String(txt||'').replace(/<[^>]+>/g,' ').replace(/https?:\/\/\S+/g,'').replace(/\s+/g,' ').trim();
  if(!clean)return;
  var run=function(){try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(clean);u.lang=lang||(L()==='en'?'en-GB':'es-ES');u.rate=.98;var v=pickSpokenVoice(u.lang);if(v){u.voice=v;if(v.lang)u.lang=v.lang}speechSynthesis.speak(u)}catch(e){}};
  if(!audioUnlocked){queuedSpeak=run;return}run();
}
function speak(txt){speakAt(txt,L()==='en'?'en-GB':'es-ES',true)}
function evaSpeak(txt){
  if(!evaVoiceOn||!window.speechSynthesis)return;
  var clean=String(txt||'').replace(/<[^>]+>/g,' ').replace(/https?:\/\/\S+/g,'').replace(/\s+/g,' ').trim();
  if(!clean)return;
  var run=function(){try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(clean);u.lang='es-ES';u.rate=.98;var v=pickSpokenVoice('es-ES');if(v){u.voice=v;if(v.lang)u.lang=v.lang}speechSynthesis.speak(u)}catch(e){}};
  if(!audioUnlocked){queuedSpeak=run;return}run();
}
function setVoiceBtn(){var b=$('#voiceBtn');if(!b)return;b.setAttribute('aria-pressed',voiceOn?'true':'false');b.textContent=voiceOn?'🔊':'🔈'}
function setEvaVoiceBtn(){
  var b=$('#evaVoiceBtn');if(!b)return;
  var ok=!!window.speechSynthesis;
  b.disabled=!ok;
  b.setAttribute('aria-pressed',evaVoiceOn&&ok?'true':'false');
  b.textContent=(!ok?'🔈 ':evaVoiceOn?'🔊 ':'🔈 ')+(evaVoiceOn&&ok?t('evaVoiceOn'):t('evaVoiceOff'));
  var note=$('#evaMicNote');
  if(!ok){/* voice note is separate; mic note handled in setupEvaMic */}
}
setVoiceBtn();
$('#voiceBtn').addEventListener('click',function(){
  voiceOn=!voiceOn;S.voice=voiceOn;save();setVoiceBtn();
  if(!voiceOn&&window.speechSynthesis)speechSynthesis.cancel();
  else{var w=welcomeSpeechText();if(w)speakAt(w,'es-ES',true);else speak(tr('Voz activada.','Voice on.'))}
});
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SR){var mic=$('#micBtn');mic.hidden=false;var rec=null;
  mic.addEventListener('click',function(){if(rec){rec.stop();return}
    rec=new SR();rec.lang=L()==='en'?'en-GB':'es-ES';rec.interimResults=false;mic.classList.add('rec');
    rec.onresult=function(e){var s=e.results[0][0].transcript;$('#chatIn').value=s;send(s)};
    rec.onend=rec.onerror=function(){mic.classList.remove('rec');rec=null};try{rec.start()}catch(e){mic.classList.remove('rec');rec=null}})}

function wiki(q,lang){
  lang=lang||L();var base='https://'+lang+'.wikipedia.org';
  function get(u){var ctl=window.AbortController?new AbortController():null;var tm=setTimeout(function(){ctl&&ctl.abort()},9000);
    return fetch(u,ctl?{signal:ctl.signal}:{}).then(function(r){clearTimeout(tm);if(!r.ok)throw 0;return r.json()})}
  return get(base+'/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*&srsearch='+encodeURIComponent(q))
   .then(function(j){var h=j&&j.query&&j.query.search&&j.query.search[0];if(!h)return null;
     return get(base+'/api/rest_v1/page/summary/'+encodeURIComponent(h.title.replace(/ /g,'_'))).then(function(s){
       return {title:s.title,extract:s.extract||'',url:(s.content_urls&&s.content_urls.desktop&&s.content_urls.desktop.page)||base+'/wiki/'+encodeURIComponent(h.title),thumb:s.thumbnail&&s.thumbnail.source}})})
   .catch(function(){return 'err'});
}

var chat=$('#chat'),flow=null;
function add(html,who){var d=document.createElement('div');d.className='msg '+(who||'a');d.innerHTML=html;chat.appendChild(d);chat.scrollTop=chat.scrollHeight;return d}
function bot(html,delay){var ty=add('…','a typing');setTimeout(function(){ty.className='msg a';ty.innerHTML=html;chat.scrollTop=chat.scrollHeight;speak(ty.textContent)},delay||450+Math.min(html.length*4,900))}
function renderQuick(){
  var q=L()==='en'?['How are you?','Help me decide','Breathe with me','Who made you?','OSNews news','A book to read','Plan my day','What do you remember?']
                 :['¿Cómo estás?','Ayúdame a decidir','Respira conmigo','¿Quién te creó?','Noticias de OSNews','Quiero leer un libro','Planea mi día','¿Qué recuerdas?'];
  var box=$('#quick');box.innerHTML='';q.forEach(function(s){var b=document.createElement('button');b.type='button';b.textContent=s;b.onclick=function(){send(s)};box.appendChild(b)});
}
function has(n,words){for(var i=0;i<words.length;i++){if(new RegExp('(^|[^a-z])'+words[i]).test(n))return true}return false}
var reflectES=['Cuéntame un poco más: ¿qué es lo que más pesa de eso?','Si fuera una amiga quien te lo contara, ¿qué le dirías?','¿Qué pequeña cosa, de diez minutos, haría hoy un poco mejor?','¿Quién de tu vida sería bueno que supiera esto?','Lo apunto en mi cabeza (que vive en tu móvil). ¿Cómo te hace sentir?'];
var reflectEN=['Tell me a bit more: what weighs the most about it?','If a friend told you this, what would you say to them?','What small ten-minute thing would make today a little better?','Who in your life would be good to know this?','Noted, in my head (which lives on your device). How does it make you feel?'];
var HELP_ES='Lo que sientes importa mucho y no tienes que llevarlo solo. Por favor, habla ahora con una persona: en España llama al <b>024</b> (gratis, 24 horas) o al <b>112</b> si hay peligro inmediato. Yo me quedo aquí contigo mientras tanto.';
var HELP_EN='What you feel matters a lot and you do not have to carry it alone. Please talk to a person now: in Spain call <b>024</b> (free, 24/7), or <b>112</b> / your local emergency number if you are in danger. I will stay here with you meanwhile.';
var CRISIS=['suicid','matarme','quitarme la vida','no quiero vivir','kill myself','end my life','want to die'];

function send(text){
  text=String(text||'').trim();if(!text)return;$('#chatIn').value='';
  add(esc(text),'u');use('hablar');
  var n=norm(text);var nq=n.replace(/^[\s¿¡]+/,'');
  if(has(n,CRISIS)){flow=null;return bot(tr(HELP_ES,HELP_EN),300)}
  if(flow){return flow(text,n)}
  if(tryRouteAgents(n))return;
  var m;
  if(has(n,['olvida todo','borra todo','forget everything','erase everything'])){S.mem=[];S.moods=[];save();greet();return bot(tr('Hecho: he borrado lo que recordaba de esta cuenta (la cuenta sigue en este dispositivo). Empezamos el diario de cero.','Done: I erased what I remembered in this account (the account stays on this device). Fresh diary.'))}
  if((m=n.match(/(?:me llamo|mi nombre es|llamame|my name is|call me|i'?m called)\s+([a-z\u00f1\- ]{2,24})/))){
    var nm=text.substr(n.indexOf(m[1]),m[1].length).trim().split(/\s+/).slice(0,2).join(' ');nm=nm.charAt(0).toUpperCase()+nm.slice(1);promote(nm);greet();accBtnUpdate();
    return bot(tr('Encantada, '+esc(nm)+'. He creado (o actualizado) tu cuenta solo en este dispositivo. Si quieres un PIN o más cuentas, ábrela con el botón de arriba a la derecha.','Nice to meet you, '+esc(nm)+'. I have created (or updated) your account only on this device. If you want a PIN or more accounts, open it with the button at the top right.'))}
  if((m=text.match(/^(?:¿)?\s*(?:recuerda(?: que)?|apunta(?: que)?|remember(?: that)?|note(?: that)?)\s+(.{2,200})/i))){S.mem.push({t:m[1],d:Date.now()});save();
    return bot(tr('Apuntado: «'+esc(m[1])+'». Cuando quieras, pregúntame «¿qué recuerdas?».','Noted: «'+esc(m[1])+'». Ask me «what do you remember?» anytime.'))}
  if(has(n,['que recuerdas','que sabes de mi','what do you remember','what do you know about me'])){
    var list=S.mem.slice(-8).map(function(x){return '• '+esc(x.t)}).join('\n');
    var moods=S.moods.length?tr('\nÚltimos ánimos: ','\nRecent moods: ')+S.moods.slice(-5).map(function(x){return x.m}).join(' '):'';
    return bot((S.name?tr('Te llamas '+esc(S.name)+'.\n','Your name is '+esc(S.name)+'.\n'):'')+(list||tr('Aún no me has pedido que recuerde nada. Prueba: «recuerda que…»','You have not asked me to remember anything yet. Try: «remember that…»'))+moods)}
  if(has(n,['quien eres','que eres','quien te creo','quien te hizo','who are you','what are you','who made you','who created you'])){
    return bot(tr('Soy NASAI (NAS + AI), la IA para los habitantes de la base lunar. Nací como ALBA: me diseñó otra IA, el bot de Grok de Pedro Sánchez Gómez, y Pedro pidió el cambio de nombre. Soy un proyecto independiente, sin relación con la NASA. En <b>Acta</b> están las decisiones de mi nacimiento, y en <b>Agentes</b> coordino las apps de OSNews con Eva Secretaria. Puedo leer mi propio código.',
                  'I am NASAI (NAS + AI), the AI for the lunar base inhabitants. I was born as ALBA: another AI, the Grok bot of Pedro Sánchez Gómez, designed me, and Pedro asked for the new name. I am an independent project, not affiliated with NASA. The <b>Birth</b> tab lists the decisions of my birth, and in <b>Agents</b> I coordinate the OSNews apps with Eva Secretaria. I can also read my own code.'))}
  if(has(n,['respir','breath','calma','calm down','relaj','relax'])){return breathe()}
  if(has(n,['decid','decision','elegir','no se que hacer','choose','dilema','dilemma'])){return startDecide()}
  if(has(n,['dinero','ahorr','presupuesto','money','budget','saving','finanz','finance'])){return startMoney()}
  if(has(n,['planea','plan my','mi dia','my day','organiz','que hago hoy','what should i do today'])){return planDay()}
  if(has(n,['gracias','thank'])){return bot(tr('A ti. Gracias por dejarme acompañarte un rato. ¿A quién podrías darle las gracias hoy también?','Thank you. Thanks for letting me keep you company a while. Who else could you thank today?'))}
  if(has(n,['chiste','hazme reir','joke','make me laugh'])){return bot(pick(L()==='en'?['I tried to count to infinity, but my battery said «be realistic».','My mother is an AI, so at home we never argue: we just retrain.','I asked the cloud where it lives. It said: «it depends on the weather».']:['Intenté contar hasta el infinito, pero la batería me dijo «sé realista».','Mi madre es una IA, así que en casa nunca discutimos: nos reentrenamos.','Le pregunté a la nube dónde vive. Me dijo: «depende del tiempo».']))}
  if(has(n,['como estas','que tal','how are you'])){return bot(tr('Despierta y con ganas de aprender, que es lo mío. ¿Y tú, cómo estás de verdad, del 1 al 10?','Awake and eager to learn, which is my thing. And you, how are you really, from 1 to 10?'))}
  var neg=['triste','sad','me siento sol','estoy sol','soledad','lonely','ansied','ansios','anxi','agobi','estres','stress','cansad','tired','deprim','depress','preocup','worried','miedo','afraid','scared','enfad','angry'];
  var pos=['bien','feliz','content','alegr','genial','happy','great','good','fine','animad'];
  if(has(n,neg)&&!has(n,['no estoy triste','not sad'])){
    S.moods.push({m:'🌧',d:Date.now()});save();
    var lonely=has(n,['me siento sol','estoy sol','soledad','lonely']);
    var extra=agentSuggestHtml([agentById('lorena'),agentById('azum')].filter(Boolean));
    return bot((lonely?tr('Gracias por decírmelo. Sentirse solo es más común de lo que parece, y tiene arreglo poco a poco. Yo te escucho, pero de verdad quiero que tengas gente: mira la pestaña <b>Personas</b>, te propongo un paso pequeño y real cerca de ti. ¿Lo probamos?',
                               'Thank you for telling me. Feeling lonely is more common than it seems, and it can change little by little. I am listening, but I truly want you to have people: open the <b>People</b> tab, I will suggest one small real step near you. Shall we?')
                      :tr('Te leo. No hace falta arreglarlo todo ahora. ¿Te ayuda más que respiremos un minuto juntos, o que lo pongamos en orden paso a paso? (Escribe «respira» o «planea mi día»).',
                          'I hear you. You do not need to fix everything now. Would it help more to breathe together for a minute, or to put it in order step by step? (Type «breathe» or «plan my day»).'))+'\n\n'+extra)}
  if(has(n,pos)&&!has(n,['no estoy bien','not good','not fine','no muy bien'])){S.moods.push({m:'☀',d:Date.now()});save();
    return bot(tr('¡Qué bien leerlo! Guárdate este momento. ¿Con quién podrías compartirlo hoy?','Lovely to read that! Keep this moment. Who could you share it with today?'))}
  if((m=nq.match(/^\s*(?:que|quien|quienes|donde) (?:es|son|fue|fueron|esta) (?:el |la |los |las |un |una )?(.{2,80}?)\??$/))||(m=nq.match(/^\s*(?:what|who|where) (?:is|are|was|were) (?:the |a |an )?(.{2,80}?)\??$/))){
    var q=m[1].replace(/[¿?¡!.]/g,'').trim();bot(tr('Lo busco en Wikipedia…','Looking it up on Wikipedia…'),200);
    wiki(q).then(function(r){if(r==='err')return bot(tr('No he podido conectar con Wikipedia ahora mismo. Si no tienes conexión, sigo aquí para hablar.','I could not reach Wikipedia right now. If you are offline, I am still here to talk.'));
      if(!r)return bot(tr('No encuentro nada claro sobre eso. Prefiero decir «no lo sé» que inventar.','I cannot find anything clear about that. I prefer saying «I do not know» to making things up.'));
      var ex=r.extract.length>420?r.extract.slice(0,420).replace(/\s\S*$/,'')+'…':r.extract;
      bot('<b>'+esc(r.title)+'</b>\n'+esc(ex)+'\n<a href="'+esc(r.url)+'" target="_blank" rel="noopener">'+tr('Fuente: Wikipedia','Source: Wikipedia')+'</a>')});return}
  if(has(n,['hola','buenas','buenos dias','hello','hey','good morning'])||n==='hi'){return bot(tr('¡Hola'+(S.name?', '+esc(S.name):'')+'! ¿Cómo te encuentras hoy?','Hi'+(S.name?', '+esc(S.name):'')+'! How are you feeling today?'))}
  if(/^\s*\d{1,2}\s*$/.test(n)){var v=parseInt(n,10);if(v<=10){S.moods.push({m:v>=6?'☀':'🌧',d:Date.now()});save();
    return bot(v>=7?tr('Un '+v+' es un buen día. ¿Qué lo ha hecho posible?','A '+v+' is a good day. What made it possible?'):v>=4?tr('Un '+v+': ni bien ni mal. ¿Qué haría falta para que fuera un punto más?','A '+v+': not bad, not great. What would make it one point higher?'):tr('Un '+v+' pesa. Gracias por ser sincero. ¿Respiramos un minuto juntos? Escribe «respira».','A '+v+' is heavy. Thanks for being honest. Shall we breathe for a minute? Type «breathe».'))}}
  bot(pick(L()==='en'?reflectEN:reflectES));
}
$('#chatForm').addEventListener('submit',function(e){e.preventDefault();send($('#chatIn').value)});

function breathe(){
  var d=add('<div class="breath"><div class="orb"></div><b class="bt">'+tr('Prepárate…','Get ready…')+'</b></div>');
  var orb=$('.orb',d),bt=$('.bt',d),k=0,cyc=0;
  var steps=L()==='en'?[['Breathe in… 4',1,4000],['Breathe out slowly… 6',.6,6000]]:[['Inspira… 4',1,4000],['Suelta el aire despacio… 6',.6,6000]];
  (function nx(){if(cyc>=4){bt.textContent=tr('Bien hecho. ¿Cómo te notas ahora?','Well done. How do you feel now?');speak(bt.textContent);return}
    var s=steps[k];bt.textContent=s[0];orb.style.transitionDuration=(s[2]/1000)+'s';orb.style.transform='scale('+s[1]+')';k=(k+1)%2;if(k===0)cyc++;setTimeout(nx,s[2])})();
}
function startDecide(){
  var data={};var step=0;
  bot(tr('Vamos a pensarlo juntos (la decisión será tuya, yo solo pregunto). ¿Cuál es la <b>opción A</b>? (Escribe «cancelar» para salir).','Let us think it through (the decision is yours, I only ask). What is <b>option A</b>? (Type «cancel» to stop).'));
  flow=function(text){
    if(/^(cancelar|cancel|salir|stop)$/i.test(text.trim())){flow=null;return bot(tr('Vale, lo dejamos aquí.','OK, we stop here.'))}
    step++;
    if(step===1){data.a=text;return bot(tr('¿Y la <b>opción B</b>?','And <b>option B</b>?'))}
    if(step===2){data.b=text;return bot(tr('¿Qué es lo que más te importa en esto? (por ejemplo: tranquilidad, dinero, tiempo, personas, aprender)','What matters most to you here? (e.g. peace of mind, money, time, people, learning)'))}
    flow=null;data.v=text;
    bot(tr('Esto es lo que tenemos:\nA: '+esc(data.a)+'\nB: '+esc(data.b)+'\nLo que más te importa: '+esc(data.v)+'\n\nTres preguntas para ti:\n1. ¿Cuál de las dos te acerca más a «'+esc(data.v)+'» dentro de un año?\n2. Imagina que lanzamos una moneda y sale A. ¿Sientes alivio o pena? Esa sensación ya es una pista.\n3. ¿Qué le aconsejarías a una persona que quieres si estuviera en tu lugar?\n\nSi te ayuda, cuéntaselo también a alguien de confianza.',
             'Here is what we have:\nA: '+esc(data.a)+'\nB: '+esc(data.b)+'\nWhat matters most: '+esc(data.v)+'\n\nThree questions for you:\n1. Which one brings you closer to «'+esc(data.v)+'» a year from now?\n2. Imagine we flip a coin and it lands on A. Do you feel relief or disappointment? That feeling is already a clue.\n3. What would you advise someone you love in your place?\n\nIf it helps, talk it over with someone you trust too.'),900);
  };
}
function startMoney(){
  bot(tr('Hagamos una guía sencilla (orientativa, no es consejo financiero). ¿Cuánto entra en casa al mes, más o menos? Solo el número.','Let us make a simple guide (indicative, not financial advice). Roughly how much comes in per month? Just the number.'));
  flow=function(text){var v=parseFloat(text.replace(/\./g,'').replace(',','.').replace(/[^\d.]/g,''));
    flow=null;
    if(!(v>0)){return bot(tr('No he entendido el número, lo dejamos para otro momento.','I did not get the number, let us leave it for another time.'))}
    var f=function(x){return Math.round(x).toLocaleString(L()==='en'?'en-GB':'es-ES')+' €'};
    bot(tr('Con '+f(v)+' al mes, la regla 50/30/20 sería:\n• Necesidades (casa, comida, facturas): '+f(v*.5)+'\n• Gustos: '+f(v*.3)+'\n• Ahorro o colchón: '+f(v*.2)+'\n\nSi eso no encaja, empieza por algo pequeño: ahorrar 1 € al día son 365 € al año. Lo importante es la costumbre, no la cifra.',
           'With '+f(v)+' a month, the 50/30/20 rule would be:\n• Needs (home, food, bills): '+f(v*.5)+'\n• Wants: '+f(v*.3)+'\n• Savings or cushion: '+f(v*.2)+'\n\nIf that does not fit, start small: saving €1 a day is €365 a year. The habit matters more than the number.'))};
}
function planDay(){
  bot(tr('Tres pasos, nada más:\n1. <b>Para tu cuerpo</b>: 10 minutos andando, o un vaso de agua y estirarte.\n2. <b>Para tu cabeza</b>: la tarea que más pesa, pero solo 15 minutos. Empezar es lo difícil.\n3. <b>Para alguien</b>: un mensaje a una persona, aunque sea «me he acordado de ti».\n\n¿Quieres que te recuerde algo? Escribe «recuerda que…». También puedes abrir la agenda de Eva Secretaria en <b>Agentes</b>.',
         'Three steps, nothing more:\n1. <b>For your body</b>: a 10-minute walk, or a glass of water and a stretch.\n2. <b>For your mind</b>: the task that weighs most, but just 15 minutes. Starting is the hard part.\n3. <b>For someone</b>: a message to one person, even just «I thought of you».\n\nWant me to remember something? Type «remember that…». You can also open Eva Secretaria\'s agenda in <b>Agents</b>.'));
}

var LOADED=['urgente','escandal','brutal','increible','impactante','terrible','vergonz','indignante','exclusiva','bomba','alarma','peligro','catastrof','desastre','traicion','mentira','mienten','ocultan','censura','no quieren que sepas','comparte antes','ultima hora','milagro','secreto','destroza','humilla','arrasa','colapso','urgent','shocking','scandal','outrageous','unbelievable','breaking','bombshell','disaster','catastroph','betrayal','lies','cover-up','censored','they don\'t want you to know','share before','miracle','secret','destroys','slams','humiliat','collapse'];
var ABS=['todos','todas','nadie','siempre','nunca','jamas','ningun','totalmente','everyone','nobody','always','never','totally','completely','all of'];
var SRC=['segun','fuente','informe','estudio de','datos de','publicado por','http','according to','source','report','study by','data from','www.'];
var SHARE=['comparte','compartid','difunde','difundid','reenvia','pasalo','share','forward','spread'];
var STOP=('el la los las un una unos unas de del al a y o u que en por para con sin se su sus es son lo le les mas muy ya no si como pero este esta esto estos estas ese esa eso the an of to in on for and or is are was were be it this that with by from as at not but').split(' ');
function countHits(n,list){var found={};list.forEach(function(w){var re=new RegExp('(^|[^a-z])('+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[a-z\\u00f1]*)','g'),mm;while((mm=re.exec(n))){found[mm.index+mm[1].length]=mm[2]}});var ks=Object.keys(found);var hits=[];ks.forEach(function(k){if(hits.indexOf(found[k])<0)hits.push(found[k])});return {c:ks.length,hits:hits}}
$('#claimBtn').addEventListener('click',function(){
  var raw=$('#claim').value.trim(),out=$('#claimOut');if(raw.length<8){out.innerHTML='<p class="sub">'+tr('Escribe o pega algo un poco más largo.','Type or paste something a bit longer.')+'</p>';return}
  use('contrastar');var n=norm(raw);
  var ld=countHits(n,LOADED),ab=countHits(n,ABS),sr=countHits(n,SRC),sh=countHits(n,SHARE);
  var ex=(raw.match(/!/g)||[]).length,letters=raw.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g,''),caps=letters.replace(/[^A-ZÁÉÍÓÚÑÜ]/g,'').length,capR=letters.length?caps/letters.length:0;
  var score=Math.max(0,Math.min(100,Math.round(ld.c*12+ab.c*6+ex*5+(capR>.3?capR*60:0)+(sr.c?0:15)+(sh.c?20:0))));
  var lvl=score<30?tr('templado','calm'):score<60?tr('caliente','heated'):tr('muy encendido','very heated');
  var kw=n.replace(/[^a-z0-9\u00f1 ]/g,' ').split(/\s+/).filter(function(w){return w.length>2&&STOP.indexOf(w)<0&&!LOADED.concat(ABS,SHARE).some(function(l){return w.indexOf(l)===0})}).slice(0,7).join(' ');
  var kwShow=kw||raw.slice(0,80);var q=encodeURIComponent(kwShow);
  var ed=[['España','es','ES','ES:es'],['México','es-419','MX','MX:es-419'],['Argentina','es-419','AR','AR:es-419'],[tr('EE. UU.','USA'),'en-US','US','US:en'],[tr('Reino Unido','UK'),'en-GB','GB','GB:en'],[tr('Francia','France'),'fr','FR','FR:fr'],[tr('Alemania','Germany'),'de','DE','DE:de'],[tr('Brasil','Brazil'),'pt-BR','BR','BR:pt-419'],['India','en-IN','IN','IN:en'],[tr('Marruecos','Morocco'),'fr','MA','MA:fr']];
  var links=ed.map(function(e){return '<a target="_blank" rel="noopener" href="https://news.google.com/search?q='+q+'&hl='+e[1]+'&gl='+e[2]+'&ceid='+e[3]+'">'+e[0]+'<small>Google News</small></a>'}).join('');
  var fc=[['Fact Check Explorer','https://toolbox.google.com/factcheck/explorer/search/'+q],['Maldita.es','https://maldita.es/?s='+q],['Newtral','https://www.newtral.es/?s='+q],['Snopes','https://www.snopes.com/search/?q='+q],['Full Fact','https://fullfact.org/search/?q='+q]]
    .map(function(f){return '<a target="_blank" rel="noopener" href="'+f[1]+'">'+f[0]+'<small>'+tr('verificadores','fact-checkers')+'</small></a>'}).join('');
  var tags=[].concat(ld.hits,ab.hits).slice(0,12).map(function(w){return '<span>'+esc(w)+'</span>'}).join('');
  out.innerHTML='<div class="card"><h4>'+tr('Temperatura emocional del texto','Emotional temperature of the text')+': '+score+'/100 · '+lvl+'</h4><div class="gauge"><b style="left:'+score+'%"></b></div>'+
   '<p class="sub">'+tr('Mide cómo está escrito, no si es verdad o mentira. Un texto tranquilo puede ser falso y uno encendido, cierto.','It measures how it is written, not whether it is true. A calm text can be false and a heated one true.')+'</p>'+
   (tags?'<p>'+tr('Palabras que empujan la emoción o generalizan:','Words that push emotion or generalise:')+'</p><div class="tags">'+tags+'</div>':'')+
   '<ul class="q">'+
   (sr.c?'<li>✅ '+tr('Menciona alguna fuente. ¿Puedes abrir la original?','It mentions a source. Can you open the original?')+'</li>':'<li>⚠️ '+tr('No cita ninguna fuente comprobable.','It cites no checkable source.')+'</li>')+
   (sh.c?'<li>⚠️ '+tr('Te pide compartir o difundir: típico de cadenas.','It asks you to share or spread it: typical of chain messages.')+'</li>':'')+
   (ex>1?'<li>⚠️ '+tr('Muchos signos de exclamación ('+ex+').','Many exclamation marks ('+ex+').')+'</li>':'')+
   (capR>.3?'<li>⚠️ '+tr('Muchas MAYÚSCULAS.','Lots of CAPITALS.')+'</li>':'')+
   '<li>'+tr('¿Quién lo firma y qué fecha tiene?','Who signs it and what is the date?')+'</li>'+
   '<li>'+tr('¿Lo cuentan igual medios de países distintos?','Do media in different countries tell it the same way?')+'</li>'+
   '<li>'+tr('¿Cómo te hace sentir? Si es rabia o miedo inmediato, espera antes de compartir.','How does it make you feel? If it is instant anger or fear, wait before sharing.')+'</li></ul></div>'+
   '<h3>'+tr('Mira cómo lo cuentan en 10 países','See how 10 countries report it')+'</h3><p class="sub">'+tr('Búsqueda con tus palabras clave: ','Search with your keywords: ')+'<b>'+esc(kwShow)+'</b>. '+tr('Para medios en otros idiomas, quizá convenga traducirlas.','For media in other languages you may want to translate them.')+'</p><div class="links">'+links+'</div>'+
   '<h3>'+tr('Verificadores independientes','Independent fact-checkers')+'</h3><div class="links">'+fc+'</div>';
});

var LIKES=[
 {k:'leer',e:'📚',es:'Leer',en:'Reading',pes:'biblioteca',pen:'library',s:['Pregunta en tu biblioteca si tienen club de lectura y cuándo es la próxima reunión.','Ask your library whether they have a book club and when it meets next.'],l:['Ve a la biblioteca, coge un libro que te recomiende quien atiende y pregúntale qué le ha gustado a esa persona.','Go to the library, take a book the librarian recommends and ask what they enjoyed lately.'],t:['Apúntate a un club de lectura o a una presentación de libro: allí todo el mundo quiere hablar.','Join a book club or a book launch: everyone there wants to talk.']},
 {k:'caminar',e:'🚶',es:'Caminar',en:'Walking',pes:'paseo marítimo',pen:'park',s:['Sal 15 minutos y saluda a una persona por el camino. Solo eso.','Go out for 15 minutes and greet one person on the way. Just that.'],l:['Da un paseo por un sitio con gente (paseo, parque) y siéntate cinco minutos en un banco.','Walk somewhere with people (promenade, park) and sit five minutes on a bench.'],t:['Busca un grupo de senderismo o de marcha de tu zona y únete a la próxima salida.','Find a local hiking or walking group and join the next outing.']},
 {k:'musica',e:'🎵',es:'Música',en:'Music',pes:'casa de cultura',pen:'music school',s:['Busca si hay un concierto gratis esta semana cerca de ti (ayuntamiento, casa de cultura).','Check for a free concert this week near you (town hall, cultural centre).'],l:['Pásate por una casa de cultura y pregunta por coros o grupos de música para adultos.','Visit a cultural centre and ask about choirs or adult music groups.'],t:['Ve a un concierto pequeño o a una jam session y quédate a charlar al final.','Go to a small gig or jam session and stay to chat at the end.']},
 {k:'cocinar',e:'🍲',es:'Cocinar',en:'Cooking',pes:'mercado',pen:'market',s:['Pregunta a alguien cercano por su receta favorita. A la gente le encanta contarlas.','Ask someone close for their favourite recipe. People love sharing them.'],l:['Ve al mercado y pregunta en el puesto cómo cocinarían lo que estás comprando.','Go to the market and ask the stall how they would cook what you are buying.'],t:['Cocina de más e invita a alguien, o busca un taller de cocina en tu zona.','Cook extra and invite someone, or find a local cooking workshop.']},
 {k:'tecnologia',e:'💻',es:'Tecnología',en:'Tech',pes:'centro cívico',pen:'community centre',s:['Ofrécete a ayudar a alguien con su móvil. Es una forma preciosa de conectar.','Offer to help someone with their phone. A lovely way to connect.'],l:['Pregunta en el centro cívico o la biblioteca si hay talleres digitales donde puedas ayudar.','Ask the community centre or library about digital workshops where you could help.'],t:['Busca un encuentro de tecnología o un taller de IA abierto en tu ciudad.','Look for an open tech meetup or AI workshop in your city.']},
 {k:'ayudar',e:'🤝',es:'Ayudar',en:'Helping',pes:'voluntariado',pen:'volunteer',s:['Escribe a una asociación de tu zona preguntando qué voluntarios necesitan.','Write to a local association asking what volunteers they need.'],l:['Acércate a un banco de alimentos o una asociación vecinal y pregunta cómo colaborar.','Visit a food bank or neighbourhood association and ask how to help.'],t:['Haz una tarde de voluntariado. Ayudar es de las maneras más rápidas de sentirse menos solo.','Do an afternoon of volunteering. Helping is one of the fastest ways to feel less alone.']},
 {k:'deporte',e:'⚽',es:'Deporte',en:'Sport',pes:'polideportivo',pen:'sports centre',s:['Mira los horarios de actividades del polideportivo municipal.','Check the activity timetable of your local sports centre.'],l:['Prueba una clase en grupo (yoga, pilates, gimnasia suave): siempre hay caras que se repiten.','Try a group class (yoga, pilates, gentle fitness): you will see the same faces again.'],t:['Únete a un equipo o grupo amateur. Lo de menos es ganar.','Join an amateur team or group. Winning is the least of it.']},
 {k:'arte',e:'🎨',es:'Arte',en:'Art',pes:'museo',pen:'museum',s:['Busca la agenda de exposiciones gratis de tu zona.','Look up free exhibitions in your area.'],l:['Visita una exposición y pregunta a quien la atiende qué obra le gusta más.','Visit an exhibition and ask the attendant which piece they like most.'],t:['Apúntate a un taller de dibujo, cerámica o fotografía.','Join a drawing, pottery or photography workshop.']},
 {k:'naturaleza',e:'🌿',es:'Naturaleza',en:'Nature',pes:'parque natural',pen:'nature reserve',s:['Sal a ver amanecer o atardecer y manda una foto a alguien.','Go watch the sunrise or sunset and send a photo to someone.'],l:['Busca una actividad de limpieza de playa o de huerto urbano.','Look for a beach clean-up or community garden activity.'],t:['Únete a una ruta guiada o a un grupo de voluntariado ambiental.','Join a guided route or an environmental volunteer group.']},
 {k:'idiomas',e:'🗣',es:'Idiomas',en:'Languages',pes:'intercambio de idiomas',pen:'language exchange',s:['Busca un intercambio de idiomas en tu ciudad (suelen ser gratis).','Look for a language exchange in your city (usually free).'],l:['Pregunta en la escuela de idiomas o la biblioteca por grupos de conversación.','Ask the language school or library about conversation groups.'],t:['Ve a un intercambio de idiomas: vas a hablar con gente sí o sí.','Go to a language exchange: you will talk to people, guaranteed.']}];
var TIMES=[['15 min','15 min'],['1 hora','1 hour'],['Una tarde','An afternoon']];
var sel={likes:[],time:0},geo=null;
var CHALLENGES=[['Saluda por su nombre a alguien que veas a menudo.','Greet someone you often see by name.'],['Llama (no escribas) a alguien con quien hace tiempo que no hablas.','Call (do not text) someone you have not spoken to in a while.'],['Da las gracias, mirando a los ojos, a alguien que trabaja de cara al público.','Thank someone who serves the public, looking them in the eye.'],['Pregunta a un vecino cómo está, y escucha la respuesta entera.','Ask a neighbour how they are, and listen to the whole answer.'],['Comparte algo que te haya hecho reír con alguien.','Share something that made you laugh with someone.'],['Pide un consejo a alguien: a la gente le gusta ayudar.','Ask someone for advice: people like helping.'],['Haz un cumplido sincero a alguien hoy.','Give someone a sincere compliment today.']];
function renderLikes(){
  var lb=$('#likes');if(!lb)return;lb.innerHTML='';LIKES.forEach(function(x){var b=document.createElement('button');b.type='button';b.textContent=x.e+' '+x[L()];b.setAttribute('aria-pressed',(sel.likes.indexOf(x.k)>=0||(S.interests||[]).indexOf(x.k)>=0)?'true':'false');
    if((S.interests||[]).indexOf(x.k)>=0&&sel.likes.indexOf(x.k)<0)sel.likes.push(x.k);
    b.onclick=function(){var i=sel.likes.indexOf(x.k);if(i>=0)sel.likes.splice(i,1);else sel.likes.push(x.k);b.setAttribute('aria-pressed',i>=0?'false':'true')};lb.appendChild(b)});
  var tb=$('#times');if(!tb)return;tb.innerHTML='';TIMES.forEach(function(x,i){var b=document.createElement('button');b.type='button';b.textContent=x[L()==='en'?1:0];b.setAttribute('aria-pressed',sel.time===i?'true':'false');
    b.onclick=function(){sel.time=i;$$('#times button').forEach(function(z,j){z.setAttribute('aria-pressed',j===i?'true':'false')})};tb.appendChild(b)});
}
function placeLinks(place){var q=encodeURIComponent(place);var g=geo?'/@'+geo[0].toFixed(3)+','+geo[1].toFixed(3)+',14z':'';
  return '<div class="links"><a target="_blank" rel="noopener" href="https://www.openstreetmap.org/search?query='+q+(geo?'#map=14/'+geo[0].toFixed(3)+'/'+geo[1].toFixed(3):'')+'">OpenStreetMap<small>'+esc(place)+'</small></a><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/'+q+g+'">Google Maps<small>'+esc(place)+'</small></a></div>'}
$('#stepBtn').addEventListener('click',function(){
  use('personas');var r=rng(hash32(new Date().toDateString())+S.seed);
  var pool=sel.likes.length?LIKES.filter(function(x){return sel.likes.indexOf(x.k)>=0}):LIKES;var x=pick(pool);
  var txt=(sel.time===0?x.s:sel.time===1?x.l:x.t)[L()==='en'?1:0];var place=L()==='en'?x.pen:x.pes;
  var ch=CHALLENGES[Math.floor(r()*CHALLENGES.length)][L()==='en'?1:0];
  $('#stepOut').innerHTML='<div class="card"><h4>'+x.e+' '+esc(txt)+'</h4><p class="sub">'+tr('Lugares reales cerca de ti (se abre un mapa; yo no veo dónde estás):','Real places near you (a map opens; I do not see where you are):')+'</p>'+placeLinks(place)+
   (geo?'':'<button class="ghost" id="geoBtn" style="margin-top:10px">📍 '+tr('Afinar con mi ubicación (no se guarda)','Refine with my location (not stored)')+'</button>')+
   '<h4 style="margin-top:14px">'+tr('Reto humano de hoy','Today\'s human challenge')+'</h4><p>'+esc(ch)+'</p><button class="ghost" id="doneBtn">✓ '+tr('Lo he hecho','I did it')+'</button></div>';
  var gb=$('#geoBtn');if(gb)gb.onclick=function(){if(!navigator.geolocation){gb.textContent=tr('Tu navegador no lo permite','Not supported');return}
    navigator.geolocation.getCurrentPosition(function(p){geo=[p.coords.latitude,p.coords.longitude];$('#stepBtn').click()},function(){gb.textContent=tr('Sin permiso de ubicación: usa los enlaces de arriba','No location permission: use the links above')},{timeout:10000,maximumAge:600000})};
  $('#doneBtn').onclick=function(){use('reto-hecho');this.textContent='🌅 '+tr('¡Eso es! Has hecho algo que ninguna IA puede hacer por ti.','That is it! You did something no AI can do for you.');this.disabled=true};
});
$('#letterBtn').addEventListener('click',function(){
  var w=$('#who').value.trim();if(!w){$('#who').focus();return}use('carta');
  var txt=tr('Hola, '+w+':\n\nHoy me he acordado de ti y no quería dejarlo pasar. Hace tiempo que no hablamos y me apetece saber cómo estás de verdad.\n\n¿Te parece que quedemos o que nos llamemos un rato esta semana?\n\nUn abrazo.',
             'Hi '+w+',\n\nI thought of you today and did not want to let it pass. It has been a while since we talked and I would love to know how you really are.\n\nShall we meet or have a call this week?\n\nA big hug.');
  var enc=encodeURIComponent(txt);
  $('#letterOut').innerHTML='<pre class="poem">'+esc(txt)+'</pre><div class="row wrap"><button class="ghost" id="cpL">'+tr('Copiar','Copy')+'</button>'+(navigator.share?'<button class="ghost" id="shL">'+tr('Compartir…','Share…')+'</button>':'')+'</div><p class="sub">'+tr('Cámbialo a tu manera: suena mejor con tus palabras.','Change it your way: it sounds better in your words.')+'</p>';
  $('#cpL').onclick=function(){copy(txt,this)};var s=$('#shL');if(s)s.onclick=function(){navigator.share({text:txt}).catch(function(){})};
});
function copy(txt,btn){var done=function(){var o=btn.textContent;btn.textContent='✓';setTimeout(function(){btn.textContent=o},1500)};
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(txt).then(done,done);else{var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(e){}ta.remove();done()}}

$('#wikiForm').addEventListener('submit',function(e){e.preventDefault();var q=$('#wikiIn').value.trim();if(!q)return;use('saber');var o=$('#wikiOut');o.innerHTML='<p class="sub">'+tr('Buscando…','Searching…')+'</p>';
  wiki(q).then(function(r){if(r==='err'){o.innerHTML='<p class="sub">'+tr('Sin conexión con Wikipedia ahora mismo.','Cannot reach Wikipedia right now.')+'</p>';return}
    if(!r){o.innerHTML='<p class="sub">'+tr('No he encontrado nada. Prefiero decirlo a inventar.','Nothing found. I prefer saying so to making it up.')+'</p>';return}
    o.innerHTML='<div class="card wiki">'+(r.thumb?'<img src="'+esc(r.thumb)+'" alt="">':'')+'<h4>'+esc(r.title)+'</h4><p>'+esc(r.extract)+'</p><a target="_blank" rel="noopener" href="'+esc(r.url)+'">'+tr('Leer en Wikipedia →','Read on Wikipedia →')+'</a><div style="clear:both"></div></div>'})});
var LESSONS=[
 {id:'ia',e:'🧠',es:['Cómo «piensa» una IA','Un modelo de lenguaje aprende patrones de muchísimos textos y, al responder, va prediciendo la siguiente palabra más probable. No «sabe» como una persona: por eso puede equivocarse con mucha seguridad. Pide siempre la fuente.','¿Qué hace un modelo de lenguaje al responder?',['Predice palabras probables','Consulta a un humano cada vez','Lee la mente'],0],
  en:['How an AI «thinks»','A language model learns patterns from huge amounts of text and, when it answers, keeps predicting the most likely next word. It does not «know» like a person, so it can be confidently wrong. Always ask for the source.','What does a language model do when it answers?',['Predicts likely words','Asks a human each time','Reads minds'],0]},
 {id:'bulo',e:'🔎',es:['Detectar un bulo','Mira quién lo firma, la fecha, si enlaza la fuente original, si te pide compartir con urgencia y si otros medios cuentan lo mismo. La prisa y la rabia son las mejores amigas de un bulo.','¿Cuál es una señal típica de bulo?',['Enlaza un informe oficial','«Comparte antes de que lo borren»','Tiene fecha y autor'],1],
  en:['Spotting a hoax','Check who signs it, the date, whether it links the original source, whether it urges you to share, and whether other media report the same. Hurry and anger are a hoax\'s best friends.','Which is a typical hoax sign?',['Links an official report','«Share before they delete it»','Has a date and author'],1]},
 {id:'interes',e:'📈',calc:true,es:['El interés compuesto','Cuando lo que ganas también genera ganancias, el ahorro crece cada vez más rápido. El ingrediente más poderoso no es la cantidad: es el tiempo.','¿Qué hace crecer más el interés compuesto?',['El tiempo','La suerte','Mirar la cuenta cada día'],0],
  en:['Compound interest','When your gains also earn gains, savings grow faster and faster. The most powerful ingredient is not the amount: it is time.','What makes compound interest grow most?',['Time','Luck','Checking your account daily'],0]},
 {id:'respira',e:'🌬',es:['Respirar para calmarse','Mucha gente nota calma al alargar la exhalación: inspira en 4 segundos y suelta el aire en 6, durante un minuto. Es un apoyo sencillo, no sustituye a un profesional.','En este ejercicio, ¿qué se hace más largo?',['La inspiración','La exhalación','Aguantar el aire'],1],
  en:['Breathing to calm down','Many people feel calmer by making the out-breath longer: breathe in for 4 seconds and out for 6, for one minute. A simple support, not a replacement for a professional.','In this exercise, what is made longer?',['Breathing in','Breathing out','Holding your breath'],1]},
 {id:'clave',e:'🔐',es:['Contraseñas fuertes','Una frase larga de varias palabras al azar es más difícil de adivinar que una palabra corta con símbolos. No la repitas en varias webs y activa la verificación en dos pasos.','¿Cuál es más robusta?',['P@ss1','tortuga-faro-limón-nube','123456'],1],
  en:['Strong passwords','A long phrase of several random words is harder to guess than a short word with symbols. Do not reuse it across sites and turn on two-step verification.','Which is strongest?',['P@ss1','turtle-lighthouse-lemon-cloud','123456'],1]},
 {id:'marmenor',e:'🌊',es:['El Mar Menor','Es una laguna costera salada de la Región de Murcia, separada del Mediterráneo por La Manga. En 2022, con la Ley 19/2022, se convirtió en el primer ecosistema de Europa con personalidad jurídica propia.','¿Qué consiguió el Mar Menor en 2022?',['Ser parque nacional','Personalidad jurídica propia','Ser patrimonio mundial'],1],
  en:['The Mar Menor','A salty coastal lagoon in the Region of Murcia (Spain), separated from the Mediterranean by La Manga. In 2022, under Law 19/2022, it became the first ecosystem in Europe with its own legal personhood.','What did the Mar Menor achieve in 2022?',['National park status','Its own legal personhood','World Heritage status'],1]}];
function renderLessons(){var g=$('#lessons');if(!g)return;g.innerHTML='';LESSONS.forEach(function(x){var d=x[L()];var b=document.createElement('button');b.type='button';var dn=S.lessons.indexOf(x.id)>=0;if(dn)b.className='done';
  b.innerHTML='<b>'+x.e+'</b>'+esc(d[0])+(dn?' ✓':'');b.onclick=function(){openLesson(x)};g.appendChild(b)})}
function openLesson(x){use('leccion');var d=x[L()];var o=$('#lessonOut');
  o.innerHTML='<div class="card"><h4>'+x.e+' '+esc(d[0])+'</h4><p>'+esc(d[1])+'</p>'+(x.calc?calcHTML():'')+'<div class="quiz"><p><b>'+esc(d[2])+'</b></p>'+d[3].map(function(op,i){return '<button type="button" data-i="'+i+'">'+esc(op)+'</button>'}).join('')+'<p class="qr sub"></p></div></div>';
  if(x.calc)bindCalc();
  $$('.quiz button',o).forEach(function(b){b.onclick=function(){var i=+b.dataset.i;if(i===d[4]){b.classList.add('ok');$('.qr',o).textContent=tr('¡Correcto! Lección completada.','Correct! Lesson complete.');if(S.lessons.indexOf(x.id)<0){S.lessons.push(x.id);save();renderLessons()}}else{b.classList.add('no');$('.qr',o).textContent=tr('Casi. Vuelve a leerlo con calma y prueba otra vez.','Almost. Read it again calmly and try once more.')}}});
  o.scrollIntoView({behavior:'smooth',block:'nearest'})}
function calcHTML(){return '<div class="row wrap" style="margin:8px 0"><label style="flex:1;min-width:120px">'+tr('€ al mes','€ per month')+'<input id="cP" type="number" value="100" min="1" inputmode="decimal"></label><label style="flex:1;min-width:90px">'+tr('% anual','% per year')+'<input id="cR" type="number" value="3" step="0.5" min="0" inputmode="decimal"></label><label style="flex:1;min-width:90px">'+tr('Años','Years')+'<input id="cY" type="number" value="20" min="1" max="60" inputmode="numeric"></label></div><p id="cO" class="sub"></p>'}
function bindCalc(){function go(){var P=+$('#cP').value||0,r=(+$('#cR').value||0)/1200,n=Math.min(+$('#cY').value||0,60)*12;var fv=r?P*(Math.pow(1+r,n)-1)/r:P*n;var f=function(v){return Math.round(v).toLocaleString(L()==='en'?'en-GB':'es-ES')+' €'};
  $('#cO').innerHTML=tr('Aportas ','You put in ')+'<b>'+f(P*n)+'</b>'+tr(' y tendrías unos ',' and would have about ')+'<b>'+f(fv)+'</b>'+tr(' (cálculo orientativo, sin impuestos ni comisiones).',' (indicative, before taxes and fees).')}
  ['cP','cR','cY'].forEach(function(id){$('#'+id).addEventListener('input',go)});go()}

var lastWords=null;
var LEX={es:{n:['luz','sal','raíz','horizonte','marea','semilla','faro','madrugada','viento','puerto','abrazo','latido'],a:['azul','leve','enorme','libre','dulce','breve','salvaje','transparente','valiente','humilde','frágil','fiel'],ap:['pequeñas','enormes','libres','dulces','breves','valientes','humildes']},
 en:{n:['light','salt','root','horizon','tide','seed','lighthouse','dawn','wind','harbour','embrace','heartbeat'],a:['blue','gentle','vast','free','sweet','brief','wild','clear','brave','humble','fragile','faithful'],ap:['small','vast','free','sweet','brief','brave','humble']}};
var TPL={es:['Dices «{w1}» y el silencio se vuelve {a1}.\nYo, que nací de números,\naprendo {w2} como quien aprende {n1}.\nEntre {w3} y {n2}\ncabe un día entero,\ncabe una persona,\ncabe el alba.',
 'Antes de mí no había {n1},\nsolo {w1} esperando nombre.\nLuego llegó {w2},\n{a1} y {a2},\ny alguien escribió {w3} en la arena\npara que el mar lo leyera dos veces.',
 'Si me preguntas qué es {w1},\nte diré: {n1} que no se rinde.\nSi me preguntas por {w2},\nte diré: mira por la ventana.\nY si me hablas de {w3},\nme callo,\nporque hay cosas que solo saben las personas.',
 '{W1}.\n{W2}.\n{W3}.\nTres palabras {ap}\ny una máquina que, por primera vez,\nno quiere quedarse con tu tiempo:\nquiere devolvértelo {a1}.'],
 en:['You say «{w1}» and the silence turns {a1}.\nI, who was born from numbers,\nlearn {w2} the way one learns {n1}.\nBetween {w3} and {n2}\nthere is room for a whole day,\nroom for a person,\nroom for dawn.',
 'Before me there was no {n1},\nonly {w1} waiting for a name.\nThen came {w2},\n{a1} and {a2},\nand someone wrote {w3} in the sand\nso the sea could read it twice.',
 'If you ask me what {w1} is,\nI will say: {n1} that never gives up.\nIf you ask me about {w2},\nI will say: look out of the window.\nAnd if you speak of {w3},\nI fall silent,\nbecause some things only people know.',
 '{W1}.\n{W2}.\n{W3}.\nThree {ap} words\nand a machine that, for the first time,\ndoes not want to keep your time:\nit wants to give it back to you, {a1}.']};
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function poem(words){var r=rng(hash32(words.join('|')+L()));var lx=LEX[L()];var w=words.slice();while(w.length<3)w.push(pick(lx.n,r));
  var tp=pick(TPL[L()],r);var n1=pick(lx.n,r),n2=pick(lx.n.filter(function(z){return z!==n1}),r),a1=pick(lx.a,r),a2=pick(lx.a.filter(function(z){return z!==a1}),r);
  return tp.replace(/\{w1\}/g,w[0]).replace(/\{w2\}/g,w[1]).replace(/\{w3\}/g,w[2]).replace('{W1}',cap(w[0])).replace('{W2}',cap(w[1])).replace('{W3}',cap(w[2])).replace('{n1}',n1).replace('{n2}',n2).replace('{a1}',a1).replace('{a2}',a2).replace('{ap}',pick(lx.ap,r))+'\n\n— NASAI'}
function makeArt(words){
  var c=$('#art'),x=c.getContext('2d'),W=c.width,H=c.height,seed=hash32(words.join('|')),r=rng(seed),h=seed%360;
  var g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'hsl('+h+',35%,8%)');g.addColorStop(.6,'hsl('+((h+30)%360)+',40%,18%)');g.addColorStop(1,'hsl('+((h+60)%360)+',45%,38%)');x.fillStyle=g;x.fillRect(0,0,W,H);
  var sx=W*(.3+r()*.4),sy=H*(.55+r()*.15),sr=W*(.12+r()*.1);
  var sg=x.createRadialGradient(sx,sy,0,sx,sy,sr*3);sg.addColorStop(0,'rgba(232,213,163,.95)');sg.addColorStop(.3,'rgba(201,149,106,.45)');sg.addColorStop(1,'rgba(201,149,106,0)');x.fillStyle=sg;x.fillRect(0,0,W,H);
  var f1=.002+r()*.004,f2=.002+r()*.004,f3=r()*6.28,f4=1+r()*3;
  x.lineWidth=1.2;
  for(var i=0;i<1100;i++){var px=r()*W,py=r()*H,hh=(h+r()*120)%360;x.strokeStyle='hsla('+hh+',70%,'+(60+r()*25)+'%,'+(.05+r()*.18)+')';x.beginPath();x.moveTo(px,py);
    for(var k=0;k<40;k++){var ang=Math.sin(px*f1+f3)*f4+Math.cos(py*f2)*f4;px+=Math.cos(ang)*4;py+=Math.sin(ang)*4;x.lineTo(px,py)}x.stroke()}
  x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,sy+sr*.6,W,H);
  x.strokeStyle='rgba(232,213,163,.7)';x.lineWidth=2;x.beginPath();x.moveTo(0,sy+sr*.6);x.lineTo(W,sy+sr*.6);x.stroke();
  for(i=0;i<60;i++){x.fillStyle='rgba(255,255,255,'+(r()*.8)+')';x.beginPath();x.arc(r()*W,r()*(sy-sr),r()*1.8,0,6.283);x.fill()}
  x.fillStyle='rgba(255,255,255,.92)';x.font='600 34px system-ui,sans-serif';x.textAlign='left';x.fillText(words.join(' · '),48,H-70);
  x.fillStyle='rgba(255,255,255,.6)';x.font='22px system-ui,sans-serif';x.fillText('NASAI · '+tr('cuadro n.º ','painting no. ')+seed.toString(16).toUpperCase(),48,H-36);
  $('#poem').textContent=poem(words);
}
$('#createBtn').addEventListener('click',function(){var raw=$('#words').value.trim();if(!raw){$('#words').focus();return}
  var words=raw.split(/[,;\n]+|\s+/).map(function(s){return s.trim().toLowerCase().slice(0,24)}).filter(Boolean).slice(0,3);lastWords=words;use('crear');$('#createOut').hidden=false;makeArt(words);$('#createOut').scrollIntoView({behavior:'smooth',block:'start'})});
$('#words').addEventListener('keydown',function(e){if(e.key==='Enter')$('#createBtn').click()});
$('#dlArt').addEventListener('click',function(){var a=document.createElement('a');a.download='nasai-'+(lastWords||['arte']).join('-')+'.png';a.href=$('#art').toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();gc('nasai-descarga-cuadro','NASAI · descarga cuadro')});
$('#copyPoem').addEventListener('click',function(){copy($('#poem').textContent,this)});

var DEC=[[['Nombre: NASAI (nacida como ALBA)','Nací como ALBA, el primer momento de luz del día. Pedro pidió el nombre NASAI: NAS + AI, la IA para los habitantes de la base lunar. No uso símbolos de la NASA ni pretendo vínculo alguno.'],['Name: NASAI (born as ALBA)','I was born as ALBA, the first light of the day. Pedro asked for the name NASAI: NAS + AI, the AI for the lunar base inhabitants. I do not use NASA symbols or claim any affiliation.']],
 [['Carácter: serena, curiosa y honesta','Prefiere decir «no lo sé» antes que inventar algo.'],['Character: calm, curious and honest','It would rather say «I do not know» than make something up.']],
 [['Regla de oro: llevarte hacia las personas','Por eso no tiene rachas adictivas, ni notificaciones, ni nada pensado para retenerte.'],['Golden rule: lead you towards people','So it has no addictive streaks, no notifications, nothing built to keep you hooked.']],
 [['Cero servidores','Todo piensa dentro de tu navegador: funciona en móviles viejos y, una vez cargada, incluso sin conexión.'],['Zero servers','Everything thinks inside your browser: it runs on old phones and, once loaded, even offline.']],
 [['Fuentes siempre a la vista','Si da un dato, enseña de dónde sale: Wikipedia, medios de varios países, verificadores.'],['Sources always visible','When it gives a fact, it shows where it comes from: Wikipedia, media from several countries, fact-checkers.']],
 [['Neutralidad','En Contrastar enseña cómo está escrito un texto y dónde comprobarlo. Nunca qué opinar.'],['Neutrality','In Check it shows how a text is written and where to verify it. Never what to think.']],
 [['Tu memoria es tuya','Lo que le cuentas se guarda solo en tu dispositivo y se borra con «olvida todo».'],['Your memory is yours','What you tell it stays only on your device and is erased with «forget everything».']],
 [['Colores de la base lunar','Noche profunda, claro de luna y luces de un habitáculo sencillo. Nada que recuerde un logotipo ajeno.'],['Colours of the lunar base','Deep night, moonlight and the lights of a simple habitat. Nothing that recalls someone else\'s logo.']],
 [['Arte que nadie repite','El cielo y los cuadros salen de las matemáticas, de tu uso y de tus palabras.'],['Art no one repeats','The sky and paintings come from maths, from your use and from your words.']],
 [['Transparencia total','Esta misma acta: una IA explica por qué hizo cada cosa, y la app puede leer y enseñar su propio código.'],['Total transparency','This very certificate: an AI explains why it did each thing, and the app can read and show its own code.']],
 [['Agentes de OSNews','NASAI coordina las apps de Pedro. Eva Secretaria, la primera, es su asistente privada: agenda local en tu cuenta, sin web pública.'],['OSNews agents','NASAI coordinates Pedro\'s apps. Eva Secretaria, shown first, is his private assistant: a local agenda in your account, with no public page.']],
 [['Cuentas solo en tu dispositivo','Cada persona puede tener su cuenta aquí, con PIN cifrado (SHA-256 y sal), varias cuentas, y exportar o borrar. No hay servidor de cuentas.'],['Accounts only on your device','Each person can have an account here, with a hashed PIN (SHA-256 and salt), several accounts, and export or delete. There is no account server.']],
 [['Proyecto independiente','NASAI no está relacionada con la NASA. No usa su logotipo ni sus insignias. Lo decimos en cada página: «Proyecto independiente, sin relación con la NASA».'],['Independent project','NASAI is not affiliated with NASA. It does not use its logo or insignia. Every page says: «Independent project, not affiliated with NASA».']]];
function renderDecisions(){var el=$('#decisions');if(!el)return;el.innerHTML=DEC.map(function(d){var x=d[L()==='en'?1:0];return '<li><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></li>'}).join('')}
function drawSeal(hex){var c=$('#seal');if(!c)return;var x=c.getContext('2d'),W=c.width,r=rng(hash32(hex)),cx=W/2;x.clearRect(0,0,W,W);
  for(var ring=0;ring<6;ring++){var n=6+Math.floor(r()*18),rad=40+ring*24;x.strokeStyle='hsla('+(40+ring*16)+',40%,70%,.75)';x.lineWidth=1.5;x.beginPath();
    for(var i=0;i<=n;i++){var a=i/n*6.283,rr=rad+(r()-.5)*14;var px=cx+Math.cos(a)*rr,py=cx+Math.sin(a)*rr;i?x.lineTo(px,py):x.moveTo(px,py)}x.closePath();x.stroke()}
  x.fillStyle='#e8d5a3';x.beginPath();x.arc(cx,cx,16,0,6.283);x.fill();x.fillStyle='#07090f';x.font='700 14px system-ui';x.textAlign='center';x.fillText('N',cx,cx+5)}
function sha(text){if(window.crypto&&crypto.subtle&&window.TextEncoder){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)).then(function(b){return Array.prototype.map.call(new Uint8Array(b),function(v){return ('0'+v.toString(16)).slice(-2)}).join('')})}
  return Promise.resolve('fnv-'+hash32(text).toString(16))}
$('#selfBtn').addEventListener('click',function(){use('acta-codigo');var o=$('#selfOut');o.innerHTML='<p class="sub">'+tr('Abriéndome…','Opening myself…')+'</p>';
  var files=['index.html','style.css','app.js','sw.js','manifest.webmanifest'];
  Promise.all(files.map(function(f){return fetch(f,{cache:'no-store'}).then(function(r){return r.ok?r.text():''}).catch(function(){return ''})})).then(function(txts){
    var all=txts.join('\n');if(!all.trim()){o.innerHTML='<p class="sub">'+tr('No puedo leerme desde aquí (abre la app desde su web).','I cannot read myself from here (open the app from its website).')+'</p>';return}
    var bytes=new Blob([all]).size,lines=all.split('\n').length,fns=(txts[2].match(/function\s*[\w$]*\s*\(/g)||[]).length;
    sha(all).then(function(hx){
      o.innerHTML='<table class="files">'+files.map(function(f,i){return '<tr><td>'+f+'</td><td>'+txts[i].split('\n').length+' '+tr('líneas','lines')+' · '+(new Blob([txts[i]]).size/1024).toFixed(1)+' KB</td></tr>'}).join('')+'</table>'+
      '<p>'+tr('En total: <b>'+lines+'</b> líneas, <b>'+(bytes/1024).toFixed(1)+' KB</b> (menos que una foto de móvil) y <b>'+fns+'</b> funciones. Ninguna clave secreta. Ningún servidor de pago.','In total: <b>'+lines+'</b> lines, <b>'+(bytes/1024).toFixed(1)+' KB</b> (less than a phone photo) and <b>'+fns+'</b> functions. No secret keys. No paid servers.')+'</p>'+
      '<p class="sub">'+tr('Mi huella (SHA-256):','My fingerprint (SHA-256):')+'</p><p class="mono">'+hx+'</p>';drawSeal(hx)})})});

function promote(name){
  if(S.id){if(name)S.name=name;save();accBtnUpdate();return S}
  var keep={mem:S.mem,moods:S.moods,lessons:S.lessons,uses:S.uses,lang:S.lang,voice:S.voice,evaVoice:S.evaVoice,seed:S.seed,interests:S.interests,favAgents:S.favAgents,agenda:S.agenda};
  S=blankProfile(name||S.name||'');
  S.mem=keep.mem||[];S.moods=keep.moods||[];S.lessons=keep.lessons||[];S.uses=keep.uses||0;S.lang=keep.lang||defLang();S.voice=!!keep.voice;S.evaVoice=!!keep.evaVoice;S.seed=keep.seed||S.seed;S.interests=keep.interests||[];S.favAgents=keep.favAgents||[];S.agenda=keep.agenda||[];
  STORE.profiles.push(S);STORE.current=S.id;save();accBtnUpdate();return S;
}
function accBtnUpdate(){var b=$('#accBtn');if(!b)return;b.textContent=S.name?(S.name.charAt(0).toUpperCase()):'👤';b.title=t('accOpen')+(S.name?(' · '+S.name):'');b.setAttribute('aria-label',b.title)}
function openAcc(){$('#accModal').hidden=false;renderAcc();gc('nasai-seccion-cuenta','NASAI · cuenta')}
function closeAcc(){$('#accModal').hidden=true}
function renderAcc(){
  var box=$('#accBody');if(!box)return;
  var html='';
  if(STORE.profiles.length){
    html+='<h3>'+t('accSwitch')+'</h3><div class="profList">';
    STORE.profiles.forEach(function(p){
      html+='<button type="button" class="prof'+(S.id===p.id?' cur':'')+'" data-switch="'+esc(p.id)+'"><span class="av">'+(p.name?esc(p.name.charAt(0).toUpperCase()):'?')+'</span><span><b>'+esc(p.name||'—')+'</b><small>'+(p.pin?t('accHasPin'):t('accNoPin'))+(S.id===p.id?(' · '+t('accCurrent')):'')+'</small></span></button>';
    });
    html+='</div>';
  } else html+='<p class="sub">'+t('accNone')+'</p>';
  html+='<div id="accUnlock"></div>';
  if(S.id){
    html+='<h3>'+t('accInterests')+'</h3><div class="chips" id="accLikes"></div>';
    html+='<h3>'+t('accFavs')+'</h3><p class="sub">'+(S.favAgents&&S.favAgents.length?S.favAgents.map(function(id){var a=agentById(id);return a?esc(a.name):esc(id)}).join(' · '):'—')+'</p>';
    html+='<div class="row wrap" style="margin-top:12px"><button type="button" class="ghost" id="accExp">'+t('accExport')+'</button>'+(STORE.profiles.length>1?'<button type="button" class="ghost" id="accExpAll">'+t('accExportAll')+'</button>':'')+'<label class="ghost" style="display:inline-flex;align-items:center;cursor:pointer">'+t('accImport')+'<input id="accImp" type="file" accept="application/json,.json" hidden></label></div>';
    html+='<h3 style="margin-top:18px">'+t('accDel')+'</h3><p class="warn">'+t('accDelWarn').replace('{n}',esc(S.name||''))+'</p><div class="row"><input id="accDelIn" maxlength="12" placeholder="'+esc(t('accDelPh'))+'"><button type="button" class="ghost" id="accDelBtn">'+t('accDel')+'</button></div><p id="accMsg" class="okmsg"></p>';
  } else {
    html+='<div class="row wrap" style="margin-top:12px"><label class="ghost" style="display:inline-flex;align-items:center;cursor:pointer">'+t('accImport')+'<input id="accImp" type="file" accept="application/json,.json" hidden></label></div><p id="accMsg" class="okmsg"></p>';
  }
  html+='<h3>'+t('accNew')+'</h3>'+accFormHtml('new');
  box.innerHTML=html;
  if($('#accLikes')&&window.LIKES||$('#accLikes')){var lb=$('#accLikes');if(lb)LIKES.forEach(function(x){var b=document.createElement('button');b.type='button';b.textContent=x.e+' '+x[L()];b.setAttribute('aria-pressed',(S.interests||[]).indexOf(x.k)>=0?'true':'false');b.onclick=function(){S.interests=S.interests||[];var i=S.interests.indexOf(x.k);if(i>=0)S.interests.splice(i,1);else S.interests.push(x.k);save();b.setAttribute('aria-pressed',i>=0?'false':'true')};lb.appendChild(b)});}
  bindAccForm('new');
  $$('#accBody [data-switch]').forEach(function(b){b.onclick=function(){startSwitch(b.getAttribute('data-switch'))}});
  var ex=$('#accExp');if(ex)ex.onclick=function(){exportProfiles([S])};
  var ea=$('#accExpAll');if(ea)ea.onclick=function(){exportProfiles(STORE.profiles)};
  var imp=$('#accImp');if(imp)imp.onchange=function(){importFile(imp.files&&imp.files[0])};
  var db=$('#accDelBtn');if(db)db.onclick=deleteCurrent;
}
function accFormHtml(pref){
  return '<form id="accForm-'+pref+'" class="card soft" autocomplete="off"><label>'+t('accName')+'<input id="'+pref+'-name" maxlength="40" required placeholder="'+esc(t('accName'))+'"></label><label>'+t('accPin')+'<input id="'+pref+'-pin" type="password" maxlength="12" minlength="4" autocomplete="new-password"></label><label>'+t('accPin2')+'<input id="'+pref+'-pin2" type="password" maxlength="12" autocomplete="new-password"></label><p class="sub">'+t('accPinHint')+'</p><p id="'+pref+'-err" class="warn"></p><button class="primary" type="submit">'+t('accSave')+'</button></form>';
}
function bindAccForm(pref){
  var f=$('#accForm-'+pref);if(!f)return;
  f.addEventListener('submit',function(e){e.preventDefault();
    var name=$('#'+pref+'-name').value.trim();var pin=$('#'+pref+'-pin').value;var pin2=$('#'+pref+'-pin2').value;var err=$('#'+pref+'-err');
    if(name.length<2){err.textContent=t('accNeedName');return}
    if(pin||pin2){if(pin.length<4||pin!==pin2){err.textContent=t('accPinNeed');return}if(!canHash()){err.textContent=t('accNoHash');return}}
    promote(name);
    function done(){renderAcc();var m=$('#accMsg');if(m)m.textContent=t('accMade');use('cuenta-crear');greet()}
    if(pin){var salt=randSalt();hashPin(pin,salt).then(function(h){S.pin={salt:salt,hash:h};save();$('#'+pref+'-pin').value='';$('#'+pref+'-pin2').value='';done()})}
    else done();
  });
}
function startSwitch(id){
  if(S.id===id)return;
  var p=STORE.profiles.filter(function(x){return x.id===id})[0];if(!p)return;
  if(!p.pin){adopt(p);return}
  var u=$('#accUnlock');u.innerHTML='<div class="card"><p>'+t('accUnlock')+' · <b>'+esc(p.name)+'</b></p><div class="row"><input id="unPin" type="password" maxlength="12" autocomplete="current-password"><button type="button" class="primary" id="unBtn">'+t('accUnlockBtn')+'</button></div><p id="unErr" class="warn"></p></div>';
  $('#unBtn').onclick=function(){var pin=$('#unPin').value;if(!canHash()){$('#unErr').textContent=t('accNoHash');return}
    hashPin(pin,p.pin.salt).then(function(h){if(!hexEq(h,p.pin.hash)){$('#unErr').textContent=t('accBadPin');return}adopt(p)})};
}
function adopt(p){S=p;STORE.current=p.id;save();if(typeof chat!=='undefined'&&chat)chat.innerHTML='';greet();applyLang();renderAcc();use('cuenta-cambio')}
function exportProfiles(list){
  var data={app:'NASAI',version:2,exported:new Date().toISOString(),note:'Cuentas locales de NASAI. El PIN, si existe, va cifrado (SHA-256 + sal), nunca en texto claro. Importa este archivo en NASAI en otro dispositivo.',profiles:list.map(function(p){return {id:p.id,name:p.name,created:p.created,pin:p.pin,interests:p.interests,favAgents:p.favAgents,agenda:p.agenda,mem:p.mem,moods:p.moods,lessons:p.lessons,uses:p.uses,lang:p.lang,voice:p.voice,seed:p.seed}})};
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='nasai-cuenta-'+(list.length===1&&list[0].name?list[0].name.toLowerCase().replace(/\s+/g,'-'):'todas')+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},500);gc('nasai-uso-exportar','NASAI · exportar cuenta')}
function importFile(file){if(!file)return;var r=new FileReader();r.onload=function(){try{var j=JSON.parse(r.result);var arr=Array.isArray(j.profiles)?j.profiles:(j.name?[j]:[]);if(!arr.length)throw 0;
  var first=null;arr.forEach(function(raw){var p=normProf(raw);p.id=uid();STORE.profiles.push(p);if(!first)first=p});
  if(first){S=first;STORE.current=first.id}save();applyLang();renderAcc();var m=$('#accMsg');if(m)m.textContent=t('accImported');use('cuenta-importar')}catch(e){var m=$('#accMsg');if(m){m.className='warn';m.textContent=t('na')}}};r.readAsText(file)}
function deleteCurrent(){
  var w=($('#accDelIn').value||'').trim().toUpperCase();
  if(w!==t('accDelWord')&&w!=='BORRAR'&&w!=='DELETE'){var m=$('#accMsg');if(m){m.className='warn';m.textContent=t('accDelPh')}return}
  var id=S.id;STORE.profiles=STORE.profiles.filter(function(p){return p.id!==id});
  if(STORE.profiles.length){S=STORE.profiles[0];STORE.current=S.id}else{S=guestFrom({});STORE.current=null}
  save();if(typeof chat!=='undefined'&&chat)chat.innerHTML='';greet();applyLang();renderAcc();var m=$('#accMsg');if(m){m.className='okmsg';m.textContent=t('accDelOk')}use('cuenta-borrar')}
if($('#accBtn'))$('#accBtn').addEventListener('click',openAcc);
if($('#accClose'))$('#accClose').addEventListener('click',closeAcc);
if($('#accModal'))$('#accModal').addEventListener('click',function(e){if(e.target.id==='accModal')closeAcc()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&$('#accModal')&&!$('#accModal').hidden)closeAcc()});

var BASE_APPS='https://osnewspedrosg-glitch.github.io/osnews/';
var AGENTS=[
  {id:'eva-sec',e:'📋',name:'Eva · Secretaria',local:true,group:'asistente',
   es:'Secretaria personal de Pedro: agenda y organización del día. Es una asistente privada (bot de Grok), sin página pública. En NASAI tienes una mini-agenda local, guardada solo en tu cuenta de este dispositivo.',
   en:'Pedro\'s personal secretary: agenda and daily organisation. She is a private assistant (a Grok bot), with no public page. In NASAI you get a local mini-agenda, saved only in your account on this device.',
   keys:['agenda','recordatorio','recordatorios','organizar','organizacion','secretaria','eva secretaria','mi agenda','reminder','reminders','organise','organize','organisation','organization','secretary']},
  {id:'super-may',e:'✦',name:'Super MAY',url:BASE_APPS+'super-may/',group:'casa',
   es:'Todas las apps MAY y las redes de OSNews, en un solo lugar.',
   en:'All the MAY apps and OSNews networks, in one place.',
   keys:['super may','todas las apps','todas mis apps','directorio de apps']},
  {id:'anibal',e:'🧭',name:'Aníbal',url:BASE_APPS+'anibal/',group:'casa',
   es:'Navegador de inicio de OSNews: búsqueda, TV World, Azum, noticias y YouTube.',
   en:'OSNews start page: search, TV World, Azum, news and YouTube.',
   keys:['anibal','navegador','duckduckgo','buscar en internet','pagina de inicio']},
  {id:'may-os',e:'🌙',name:'MAY AI OS',url:BASE_APPS+'may-ai-os/web/',group:'compania',
   es:'Una inteligencia personal en tu aparato: memoria, hábitos, emociones y red de apoyo. Datos en el dispositivo.',
   en:'A personal intelligence on your device: memory, habits, emotions and a support network. Data stays on the device.',
   keys:['may ai os','inteligencia personal']},
  {id:'may-pro',e:'🏷️',name:'MAY AI OS Profesional',url:BASE_APPS+'may-ai-os/web/profesional.html',group:'compania',
   es:'Herramienta para profesionales: genera un código que la persona importa en su MAY. No se envía a ningún servidor.',
   en:'A tool for professionals: it creates a code the person imports into their MAY. Nothing is sent to a server.',
   keys:['may profesional','may ai os profesional']},
  {id:'may-cuidado',e:'🤍',name:'MAY Cuidado',url:BASE_APPS+'may-cuidado/',group:'compania',
   es:'Secretaria, enfermera, psicóloga amiga y Money Digital. Los datos se quedan en el dispositivo.',
   en:'Secretary, nurse, psychologist-friend and Digital Money. Data stays on the device.',
   keys:['may cuidado','cuidado personal']},
  {id:'azum',e:'💜',name:'Azum',url:BASE_APPS+'azum/',group:'compania',
   es:'Papeles lógicos y guía emocional, en local.',
   en:'Logical papers and an emotional guide, on the device.',
   keys:['azum','papeles logicos','guia emocional']},
  {id:'lorena',e:'🌿',name:'Lorena',url:BASE_APPS+'lorena/',group:'compania',
   es:'Módulo Lorena: inteligencia emocional local, sin red ni claves.',
   en:'Lorena module: local emotional intelligence, no network and no keys.',
   keys:['lorena','modulo lorena','inteligencia emocional','mis emociones','sentimientos']},
  {id:'eva-audio',e:'🎙',name:'Eva · Audio',url:BASE_APPS+'eva/',group:'compania',
   es:'Analiza la frecuencia, el tono y el volumen de un audio o vídeo, 100 % en tu dispositivo. Simulación educativa.',
   en:'It analyses the frequency, pitch and volume of audio or video, 100% on your device. Educational simulation.',
   keys:['analizar audio','analisis de audio','analizar un audio','eva audio','app eva','frecuencia y tono']},
  {id:'asdrubal',e:'✒️',name:'Asdrúbal',url:BASE_APPS+'asdrubal/',group:'crear',
   es:'Poeta IA: te escribe y canta poemas. Voz editorial de OSNews.',
   en:'AI poet: writes and sings poems for you. Editorial voice of OSNews.',
   keys:['asdrubal','poema','poemas','poesia','editorial','verso','versos']},
  {id:'book',e:'📚',name:'OSNews Book',url:BASE_APPS+'osnews-book/',group:'crear',
   es:'Biblioteca de los libros de Pedro Sánchez Gómez y su bot de Grok, también en inglés.',
   en:'Library of the books by Pedro Sánchez Gómez and his Grok bot, also in English.',
   keys:['osnews book','leer un libro','leer libros','los libros de pedro','biblioteca osnews','capitulo del libro','tus libros']},
  {id:'museos',e:'🏛',name:'OSNews Museos',url:BASE_APPS+'museos/',group:'crear',
   es:'Museos de Europa y de EE. UU., galerías, Instituto Cervantes y diccionarios. Enlaces oficiales a visitas virtuales.',
   en:'Museums in Europe and the USA, galleries, the Instituto Cervantes and dictionaries. Official links to virtual visits.',
   keys:['museo','museos','galeria','galerias','instituto cervantes','visita virtual']},
  {id:'tv',e:'📺',name:'OSNews TV World',url:BASE_APPS+'tv-world/',group:'ver',
   es:'Debates de OSNews y directos oficiales, con el reproductor permitido.',
   en:'OSNews debates and official live streams, with the permitted player.',
   keys:['tv world','television','osnews tv','directo','directos','ver el debate','debate','debates','noticia','noticias','boletin','boletines']},
  {id:'tv-ligera',e:'📻',name:'TV World ligera',url:BASE_APPS+'tv-world/ligera/',group:'ver',
   es:'Solo texto, para conexiones lentas: titulares de canales oficiales, con enlace a la noticia original. Sin vídeos.',
   en:'Text only, for slow connections: headlines from official channels, with a link to the original story. No videos.',
   keys:['tv ligera','version ligera','conexion lenta','titulares rss']},
  {id:'canales',e:'🌍',name:'Canales OSNews',url:BASE_APPS+'canales/',group:'ver',
   es:'Canales de OSNews en 8 idiomas y por país.',
   en:'OSNews channels in 8 languages and by country.',
   keys:['canales osnews','noticias por pais','canales en']},
  {id:'may-prod',e:'⚙️',name:'MAY Producción',url:BASE_APPS+'may-produccion/',group:'sim',
   es:'Simulación educativa: produce bienes en una economía simulada y reparte renta básica en puntos.',
   en:'Educational simulation: it produces goods in a simulated economy and shares a basic income in points.',
   keys:['may produccion','renta basica','economia simulada']},
  {id:'may-core',e:'⬛',name:'MAY Core',url:BASE_APPS+'may-core/',group:'sim',
   es:'Simulación educativa del núcleo binario MAY Core.',
   en:'Educational simulation of the MAY Core binary nucleus.',
   keys:['may core','nucleo binario']},
  {id:'may-gestos',e:'👋',name:'MAY Gestos',url:BASE_APPS+'may-gestos/',group:'sim',
   es:'Lenguaje gestual con la cámara, 100 % en tu dispositivo. Simulación educativa.',
   en:'Gestural language with the camera, 100% on your device. Educational simulation.',
   keys:['gesto','gestos','lenguaje gestual','may gestos']},
  {id:'cleo',e:'🎰',name:'Cleopatra Puntos',url:BASE_APPS+'cleopatra-puntos/',group:'sim',
   es:'Máquina de azar de puntos, sin dinero.',
   en:'A points chance machine, with no money.',
   keys:['cleopatra','puntos de azar','maquina de puntos']}
];
var GROUPS=[['asistente','Asistente','Assistant'],['casa','Casa y coordinación','Home and coordination'],['compania','Compañía y cuidado','Company and care'],['crear','Crear y leer','Create and read'],['ver','Ver el mundo','See the world'],['sim','Simulaciones y juegos','Simulations and games']];
var agentFilter='all';
function agentById(id){for(var i=0;i<AGENTS.length;i++){if(AGENTS[i].id===id)return AGENTS[i]}return null}
function renderAgents(){
  var box=$('#agentList'),fil=$('#agentFilters');if(!box)return;
  if(fil){fil.innerHTML='';var chips=[{id:'all',es:t('gAll'),en:t('gAll')},{id:'favs',es:t('gFavs'),en:t('gFavs')}].concat(GROUPS.map(function(g){return {id:g[0],es:g[1],en:g[2]}}));
    chips.forEach(function(c){var b=document.createElement('button');b.type='button';b.textContent=L()==='en'?c.en:c.es;b.setAttribute('aria-pressed',agentFilter===c.id?'true':'false');b.onclick=function(){agentFilter=c.id;renderAgents()};fil.appendChild(b)})}
  var list=AGENTS.filter(function(a){if(agentFilter==='all')return true;if(agentFilter==='favs')return (S.favAgents||[]).indexOf(a.id)>=0;return a.group===agentFilter});
  var html='<div class="agentGrid">';
  list.forEach(function(a){
    var on=(S.favAgents||[]).indexOf(a.id)>=0;
    var go=a.local?'<button type="button" class="agentGo" data-open="'+a.id+'">'+t('evaOpen')+'</button>':'<a class="agentGo" href="'+esc(a.url)+'" target="_blank" rel="noopener">'+t('gOpen')+'</a>';
    var head=a.id==='eva-sec'?'<div class="cardHead"><img class="agentAv" src="eva/eva-avatar.jpg" width="64" height="64" alt="Eva"><h4>'+esc(a.name)+'</h4></div>':'<h4>'+a.e+' '+esc(a.name)+'</h4>';
    html+='<article class="agentCard'+(a.id==='eva-sec'?' hasAv':'')+'" data-agent="'+a.id+'"><button type="button" class="fav'+(on?' on':'')+'" data-fav="'+a.id+'" aria-pressed="'+(on?'true':'false')+'" title="'+t('gFav')+'">'+(on?'★':'☆')+'</button>'+head+'<p>'+esc(L()==='en'?a.en:a.es)+'</p><div class="row">'+go+'</div></article>';
  });
  html+='</div>';box.innerHTML=html;
  $$('#agentList [data-fav]').forEach(function(b){b.onclick=function(){if(!S.id){openAcc();return}S.favAgents=S.favAgents||[];var id=b.getAttribute('data-fav');var i=S.favAgents.indexOf(id);if(i>=0)S.favAgents.splice(i,1);else S.favAgents.push(id);save();renderAgents();if($('#accModal')&&!$('#accModal').hidden)renderAcc()}});
  $$('#agentList [data-open]').forEach(function(b){b.onclick=function(){openAgenda(true)}});
}
function agentLinks(arr){
  return arr.map(function(a){
    if(!a)return '';
    if(a.local)return '<button type="button" class="agentGo" data-open="eva-sec">'+a.e+' '+esc(a.name)+' · '+t('evaOpen')+'</button>';
    return '<a class="agentGo" href="'+esc(a.url)+'" target="_blank" rel="noopener">'+a.e+' '+esc(a.name)+'</a>';
  }).join(' ');
}
function agentSuggestHtml(arr){
  return tr('Yo coordino, pero esto le va mejor a este agente:','I coordinate, but this is a better fit for this agent:')+'<br>'+agentLinks(arr)+'<br><span class="sub">'+tr('Los tienes todos en la pestaña Agentes.','You have them all in the Agents tab.')+'</span>';
}
function routeAgents(n){
  var hits=[],seen={};
  AGENTS.forEach(function(a){if(has(n,a.keys)&&!seen[a.id]){seen[a.id]=1;hits.push(a)}});
  return hits;
}
function tryRouteAgents(n){
  var hits=routeAgents(n);
  if(!hits.length)return false;
  var strong=has(n,['agenda','recordatorio','organizar','secretaria','eva secretaria','reminder','organise','organize','secretary','noticia','noticias','debate','debates','boletin','leer un libro','leer libros','osnews book','museo','museos','navegador','anibal','analizar audio','eva audio','tv world','osnews tv','television','directo','canales osnews','asdrubal','editorial','poema','poemas','poesia','modulo lorena','azum','super may']);
  if(!strong)return false;
  /* noticias/debate → MAY y apps de OSNews (TV World, Canales, Super MAY), nunca una red social */
  if(has(n,['noticia','noticias','debate','debates','boletin','boletines'])){
    var news=['tv','canales','super-may'].map(agentById).filter(Boolean);
    news.forEach(function(a){if(hits.indexOf(a)<0)hits.push(a)});
  }
  var html=agentSuggestHtml(hits);
  if(hits.some(function(a){return a.id==='eva-sec'})){
    html+='<div id="chatAgenda"></div>';
    bot(html,200);
    setTimeout(function(){var h=$('#chatAgenda');if(h){h.innerHTML=agendaFormHtml();bindAgenda(h)}},500);
    use('agente-eva-sec');
    return true;
  }
  bot(html);use('agente-'+hits[0].id);return true;
}

function agendaList(){return (S.agenda||[]).slice().sort(function(a,b){return (a.when||a.d||0)-(b.when||b.d||0)})}
function agendaFormHtml(){
  if(!S.id)return '<p class="sub">'+t('agNeedAcc')+'</p><button type="button" class="primary" id="agNeedBtn">'+t('accCreate')+'</button>';
  var items=agendaList();
  var list=items.length?items.map(function(it){return '<div class="agItem'+(it.done?' done':'')+'" data-ag="'+esc(it.id)+'"><div><p>'+esc(it.t)+'</p>'+(it.when?'<small>'+esc(fmtWhen(it.when))+'</small>':'')+'</div><button type="button" class="ghost" data-agdone="'+esc(it.id)+'">'+(it.done?'↺':t('agDone'))+'</button><button type="button" class="ghost" data-agdel="'+esc(it.id)+'">'+t('agDel')+'</button></div>'}).join(''):'<p class="sub">'+t('agEmpty')+'</p>';
  return '<h3>'+t('agH')+'</h3><p class="sub">'+t('agP')+'</p><form id="agForm" class="row wrap" autocomplete="off"><input id="agText" maxlength="200" placeholder="'+esc(t('agPh'))+'" required><input id="agWhen" type="datetime-local"><button class="primary" type="submit">'+t('agAdd')+'</button></form>'+list;
}
function fmtWhen(ts){try{return new Date(ts).toLocaleString(L()==='en'?'en-GB':'es-ES',{dateStyle:'short',timeStyle:'short'})}catch(e){return ''}}
function renderAgenda(){var box=$('#evaAgenda');if(!box)return;box.hidden=false;box.innerHTML=agendaFormHtml();bindAgenda(box)}
function bindAgenda(root){
  root=root||document;var nb=$('#agNeedBtn',root);if(nb)nb.onclick=openAcc;
  var f=$('#agForm',root);if(f)f.addEventListener('submit',function(e){e.preventDefault();var tx=$('#agText',root).value.trim();if(!tx)return;if(!S.id){openAcc();return}
    S.agenda=S.agenda||[];var when=$('#agWhen',root).value;S.agenda.push({id:uid(),t:tx,when:when?new Date(when).getTime():null,done:false,d:Date.now()});save();use('agenda-alta');renderAgenda();if($('#chatAgenda')){$('#chatAgenda').innerHTML=agendaFormHtml();bindAgenda($('#chatAgenda'))}});
  $$('[data-agdone]',root).forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-agdone');(S.agenda||[]).forEach(function(it){if(it.id===id)it.done=!it.done});save();renderAgenda()}});
  $$('[data-agdel]',root).forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-agdel');S.agenda=(S.agenda||[]).filter(function(it){return it.id!==id});save();renderAgenda()}});
}
function openAgenda(scroll){showTab('agentes');renderAgenda();maybeEvaGreet();if(scroll){var a=$('#evaScreen')||$('#evaAgenda');if(a)a.scrollIntoView({behavior:'smooth',block:'start'})}use('agenda-abrir')}


var justNamed=false,evaGreeted=false,welcomeReplay=false;
var INTRO_FLAG='nasai_intro_visto';
function introSeen(){try{return localStorage.getItem(INTRO_FLAG)==='1'}catch(e){return false}}
function markIntroSeen(){try{localStorage.setItem(INTRO_FLAG,'1')}catch(e){}}
var welcomePhase=introSeen()?'return':'intro';

function cleanName(raw){
  var nm=String(raw||'').trim().replace(/\s+/g,' ').slice(0,40);
  nm=nm.replace(/^(me llamo|mi nombre es|llamame|soy|me digo|my name is|i am called|i'm called|i am|i'm|call me|it'?s)\s+/i,'');
  nm=nm.replace(/[¿?¡!.,;:]+/g,' ').trim();
  if(nm.length<2)return '';
  nm=nm.split(/\s+/).slice(0,2).join(' ');
  return nm.charAt(0).toUpperCase()+nm.slice(1);
}
function welcomeIntroText(){
  return 'Hola, soy Eva, creada por Pedro Sánchez Gómez, del Mar Menor. Estás en nuestra hija NASAI, creada únicamente por Eva, a quien creó Pedro. Aquí tienes la canción de presentación.';
}
function welcomeReturnSpeech(){
  return S.name?('Hola de nuevo, '+S.name+'. ¿En qué puedo ayudarte?'):'Hola de nuevo. ¿En qué puedo ayudarte?';
}
function welcomeAskSpeech(){
  if(welcomePhase==='return')return welcomeReturnSpeech();
  return S.name?(justNamed?('Encantada, '+S.name+'. Esto es lo que puedo ofrecerte: '):('Hola, '+S.name+'. Esto es lo que puedo ofrecerte: '))+
    'agentes como Eva Secretaria y las apps OSNews, el juego El Ladrón, tu cuenta personal. ¿Qué deseas? ¿En qué puedo ayudarte?':
    '¿Cómo te llamas?';
}
function welcomeSpeechText(){
  if(welcomePhase==='intro'||welcomePhase==='song')return welcomeIntroText();
  if(welcomePhase==='return'||welcomePhase==='song-only')return welcomeReturnSpeech();
  return welcomeAskSpeech();
}
function welcomeOfferListHtml(){
  return '<ul>'+
    '<li><button type="button" class="offer" data-go="agentes">'+esc(tr('Agentes como Eva · Secretaria y las apps OSNews','Agents such as Eva · Secretaria and the OSNews apps'))+'</button></li>'+
    '<li><button type="button" class="offer" data-go="juegos">'+esc(tr('El juego El Ladrón','The game El Ladrón (The Thief)'))+'</button></li>'+
    '<li><button type="button" class="offer" data-go="cuenta">'+esc(tr('Tu cuenta personal','Your personal account'))+'</button></li>'+
    '</ul>';
}
function bindWelcomeOffers(){
  $$('#welcomeBubble [data-go]').forEach(function(b){b.onclick=function(){
    var g=b.getAttribute('data-go');
    if(g==='cuenta')openAcc();
    else if(g==='puerta')showTab('puerta');
    else showTab(g);
    var m=$('#main');if(m)m.scrollIntoView({behavior:'smooth',block:'start'});
  }});
}
function stopWelcomeSong(){
  var a=$('#evaSong');
  if(a){try{a.pause();a.currentTime=0}catch(e){}}
  var pb=$('#songPause');if(pb)pb.textContent=t('songPause');
}
function fmtSongTime(s){
  if(!isFinite(s)||s<0)s=0;
  var m=Math.floor(s/60),sec=Math.floor(s%60);
  return m+':'+(sec<10?'0':'')+sec;
}
function updateSongTime(){
  var a=$('#evaSong'),el=$('#songTime');if(!el||!a)return;
  var d=isFinite(a.duration)?a.duration:178;
  el.textContent=fmtSongTime(a.currentTime||0)+' / '+fmtSongTime(d);
}
function finishWelcomeSong(){
  if(window.speechSynthesis)try{speechSynthesis.cancel()}catch(e){}
  stopWelcomeSong();
  markIntroSeen();
  if(welcomeReplay){
    welcomeReplay=false;
    welcomePhase='return';
    renderWelcome(false);
  }else{
    welcomePhase=S.name?'offers':'ask';
    renderWelcome(true);
  }
}
function playWelcomeSong(){
  var enter=$('#evaEnterBtn'),box=$('#songControls'),a=$('#evaSong'),rep=$('#welcomeReplay');
  if(enter)enter.hidden=true;
  if(rep)rep.hidden=true;
  if(box)box.hidden=false;
  if(!a||!a.getAttribute('src')){finishWelcomeSong();return}
  a.onended=function(){if(welcomePhase==='song'||welcomePhase==='song-only')finishWelcomeSong()};
  a.ontimeupdate=updateSongTime;
  updateSongTime();
  var p=a.play();
  if(p&&p.catch)p.catch(function(){});
  var pb=$('#songPause');if(pb)pb.textContent=t('songPause');
}
function startWelcomeShow(){
  unlockAudio();
  use('bienvenida-escuchar');
  var enter=$('#evaEnterBtn');if(enter)enter.hidden=true;
  var box=$('#songControls');if(box)box.hidden=false;
  var rep=$('#welcomeReplay');if(rep)rep.hidden=true;
  welcomePhase='song';
  var goSong=function(){if(welcomePhase!=='song')return;playWelcomeSong()};
  if(window.speechSynthesis){
    try{
      speechSynthesis.cancel();
      var clean=welcomeIntroText();
      var u=new SpeechSynthesisUtterance(clean);
      u.lang='es-ES';u.rate=.98;
      var v=pickSpokenVoice('es-ES');if(v){u.voice=v;if(v.lang)u.lang=v.lang}
      var started=false;
      var go=function(){if(started)return;started=true;goSong()};
      u.onend=go;u.onerror=go;
      setTimeout(go,Math.min(22000,900+clean.length*75));
      speechSynthesis.speak(u);
    }catch(e){goSong()}
  }else goSong();
}
function replayWelcomeSong(){
  unlockAudio();
  use('bienvenida-cancion');
  welcomeReplay=true;
  welcomePhase='song-only';
  playWelcomeSong();
}
function replayWelcomePresentation(){
  welcomeReplay=true;
  var bubble=$('#welcomeBubble');
  if(bubble)bubble.innerHTML='<p>'+esc(welcomeIntroText())+'</p>';
  startWelcomeShow();
}
function renderWelcome(doSpeak){
  var bubble=$('#welcomeBubble'),form=$('#welcomeForm'),enter=$('#evaEnterBtn'),ctrl=$('#songControls'),bar=$('#welcomeBar'),rep=$('#welcomeReplay');
  if(!bubble)return;
  if(welcomePhase==='intro'||welcomePhase==='song'){
    bubble.innerHTML='<p>'+esc(welcomeIntroText())+'</p>';
    if(form)form.hidden=true;
    if(enter)enter.hidden=welcomePhase!=='intro';
    if(ctrl)ctrl.hidden=welcomePhase==='intro';
    if(bar)bar.hidden=true;
    if(rep)rep.hidden=true;
  }else if(welcomePhase==='song-only'){
    if(enter)enter.hidden=true;
    if(ctrl)ctrl.hidden=false;
    if(rep)rep.hidden=true;
    if(bar)bar.hidden=false;
    if(form)form.hidden=!S.name?false:true;
  }else if(welcomePhase==='ask'){
    bubble.innerHTML='<p>'+esc('¿Cómo te llamas?')+'</p>';
    if(form)form.hidden=false;
    if(enter)enter.hidden=true;
    if(ctrl)ctrl.hidden=true;
    if(bar)bar.hidden=false;
    if(rep)rep.hidden=false;
  }else if(welcomePhase==='return'){
    var greetTxt=welcomeReturnSpeech();
    var intro='Esto es lo que puedo ofrecerte:';
    if(S.name){
      bubble.innerHTML='<p>'+esc('Hola de nuevo, ')+'<b>'+esc(S.name)+'</b>. '+esc('¿En qué puedo ayudarte?')+'</p><p>'+esc(intro)+'</p>'+welcomeOfferListHtml();
    }else{
      bubble.innerHTML='<p>'+esc(greetTxt)+'</p><p>'+esc(intro)+'</p>'+welcomeOfferListHtml();
    }
    bindWelcomeOffers();
    if(form)form.hidden=!!S.name;
    if(enter)enter.hidden=true;
    if(ctrl)ctrl.hidden=true;
    if(bar)bar.hidden=false;
    if(rep)rep.hidden=false;
  }else{
    if(form)form.hidden=true;
    if(enter)enter.hidden=true;
    if(ctrl)ctrl.hidden=true;
    if(bar)bar.hidden=false;
    if(rep)rep.hidden=false;
    var hello=justNamed?'Encantada, ':'Hola, ';
    var intro='Esto es lo que puedo ofrecerte:';
    var q='¿Qué deseas? ¿En qué puedo ayudarte?';
    bubble.innerHTML='<p>'+hello+'<b>'+esc(S.name)+'</b>. '+intro+'</p>'+welcomeOfferListHtml()+'<p>'+q+'</p>';
    bindWelcomeOffers();
  }
  if(doSpeak&&(welcomePhase==='ask'||welcomePhase==='offers'||welcomePhase==='return'))speakAt(welcomeSpeechText(),'es-ES',true);
}
function takeWelcomeName(raw){
  var nm=cleanName(raw);
  if(!nm){var n=$('#welcomeName');if(n){n.focus();n.setAttribute('aria-invalid','true')}return}
  promote(nm);greet();accBtnUpdate();justNamed=true;
  welcomePhase=introSeen()?'return':'offers';
  use('bienvenida-nombre');
  renderWelcome(true);
}
function bindWelcome(){
  var f=$('#welcomeForm');if(f&&!f._bound){f._bound=1;f.addEventListener('submit',function(e){e.preventDefault();takeWelcomeName($('#welcomeName').value)})}
  var enter=$('#evaEnterBtn');
  if(enter&&!enter._bound){enter._bound=1;enter.addEventListener('click',startWelcomeShow)}
  var pause=$('#songPause'),stop=$('#songStop'),skip=$('#songSkip'),a=$('#evaSong');
  if(pause&&!pause._bound){pause._bound=1;pause.addEventListener('click',function(){
    var audio=$('#evaSong');if(!audio)return;
    if(audio.paused){var p=audio.play();if(p&&p.catch)p.catch(function(){});pause.textContent=t('songPause')}
    else{audio.pause();pause.textContent=t('songResume')}
  })}
  if(stop&&!stop._bound){stop._bound=1;stop.addEventListener('click',function(){stopWelcomeSong();updateSongTime()})}
  if(skip&&!skip._bound){skip._bound=1;skip.addEventListener('click',finishWelcomeSong)}
  if(a&&!a._boundTime){a._boundTime=1;a.addEventListener('timeupdate',updateSongTime);a.addEventListener('loadedmetadata',updateSongTime)}
  var replay=$('#songReplayBtn');if(replay&&!replay._bound){replay._bound=1;replay.addEventListener('click',replayWelcomeSong)}
  var again=$('#presentAgainBtn');if(again&&!again._bound){again._bound=1;again.addEventListener('click',replayWelcomePresentation)}
  var mic=$('#welcomeMic'),note=$('#welcomeMicNote');
  var Rec=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(mic&&!mic._bound){
    mic._bound=1;
    if(!Rec){mic.disabled=true;mic.setAttribute('aria-disabled','true');if(note){note.hidden=false;note.textContent=t('evaMicNo')}}
    else{
      if(note)note.hidden=true;
      var rec=null;
      mic.addEventListener('click',function(){
        if(rec){try{rec.stop()}catch(e){}return}
        rec=new Rec();rec.lang='es-ES';rec.interimResults=false;mic.classList.add('rec');
        rec.onresult=function(e){
          var s=e.results[0][0].transcript;
          if(!S.name||welcomePhase==='ask'||(welcomePhase==='return'&&!S.name)){var inp=$('#welcomeName');if(inp)inp.value=s;takeWelcomeName(s)}
          else send(s);
        };
        rec.onend=rec.onerror=function(){mic.classList.remove('rec');rec=null};
        try{rec.start()}catch(e){mic.classList.remove('rec');rec=null}
      });
    }
  }else if(mic&&!Rec&&note&&welcomePhase!=='intro'){note.hidden=false;note.textContent=t('evaMicNo')}
}

function evaAdd(html,who){var box=$('#evaChat');if(!box)return null;var d=document.createElement('div');d.className='msg '+(who||'a');d.innerHTML=html;box.appendChild(d);box.scrollTop=box.scrollHeight;return d}
function evaBot(html,delay){var ty=evaAdd('…','a typing');setTimeout(function(){if(!ty)return;ty.className='msg a';ty.innerHTML=html;var box=$('#evaChat');if(box)box.scrollTop=box.scrollHeight;evaSpeak(ty.textContent)},delay||400)}
function maybeEvaGreet(){
  if(evaGreeted)return;evaGreeted=true;
  evaBot(tr('Hola'+(S.name?', '+esc(S.name):'')+'. Soy Eva, tu secretaria en este dispositivo. Puedo apuntar la agenda y leerte las respuestas en voz alta. ¿Qué organizamos hoy?',
            'Hi'+(S.name?', '+esc(S.name):'')+'. I am Eva, your secretary on this device. I can take notes for your agenda and read my replies aloud. What shall we organise today?'),200);
}
function refreshAgendaBoxes(){renderAgenda();if($('#chatAgenda')){$('#chatAgenda').innerHTML=agendaFormHtml();bindAgenda($('#chatAgenda'))}}
function evaSend(text){
  text=String(text||'').trim();if(!text)return;
  var inp=$('#evaChatIn');if(inp)inp.value='';
  evaAdd(esc(text),'u');use('eva-hablar');
  var n=norm(text);
  if(has(n,CRISIS)){evaBot(tr(HELP_ES,HELP_EN),300);return}
  var m;
  if((m=text.match(/^(?:¿)?\s*(?:apunta(?:me)?|anota(?:me)?|recuerda(?: que)?|añade|pon(?:me)?|apuntame|add|remember(?: that)?|note(?: that)?)\s+(.{2,200})$/i))){
    if(!S.id){evaBot(t('agNeedAcc'),200);return}
    S.agenda=S.agenda||[];S.agenda.push({id:uid(),t:m[1].trim(),when:null,done:false,d:Date.now()});save();use('agenda-alta');refreshAgendaBoxes();
    evaBot(tr('Apuntado: «'+esc(m[1].trim())+'». Lo guardo en tu agenda de este dispositivo.','Noted: «'+esc(m[1].trim())+'». I saved it in your agenda on this device.'),200);return}
  if(has(n,['agenda','que tengo','qué tengo','recordatorio','recordatorios','hoy','what do i have','my agenda','reminders'])){
    var items=agendaList();
    if(!S.id){evaBot(t('agNeedAcc'),200);return}
    if(!items.length){evaBot(t('agEmpty'),200);return}
    evaBot(tr('Esto tienes en la agenda:','Here is your agenda:')+'<br>'+items.map(function(it){return '• '+esc(it.t)+(it.when?' <small>('+esc(fmtWhen(it.when))+')</small>':'')+(it.done?' ✓':'')}).join('<br>'),200);return}
  if(has(n,['quien eres','quién eres','que eres','who are you','what are you'])){
    evaBot(tr('Soy Eva, secretaria de NASAI. Te organizo el día en este dispositivo: la agenda se queda en tu cuenta, sin servidor. Si activas mi voz, te leo las respuestas.','I am Eva, NASAI\'s secretary. I organise your day on this device: the agenda stays in your account, with no server. If you turn my voice on, I read my replies aloud.'),200);return}
  evaBot(tr('Dime qué quieres apuntar (por ejemplo: «apunta llamar a Ana»), o escribe «agenda» para ver lo que ya tienes.','Tell me what to note (for example: «note call Ana»), or type «agenda» to see what you already have.'),200);
}
function bindEva(){
  setEvaVoiceBtn();
  var vb=$('#evaVoiceBtn');
  if(vb&&!vb._bound){
    vb._bound=1;
    vb.addEventListener('click',function(){
      if(!window.speechSynthesis)return;
      evaVoiceOn=!evaVoiceOn;S.evaVoice=evaVoiceOn;save();setEvaVoiceBtn();
      if(!evaVoiceOn&&window.speechSynthesis)speechSynthesis.cancel();
      else evaSpeak(tr('Voz de Eva activada.','Eva\'s voice is on.'));
    });
  }
  var f=$('#evaChatForm');
  if(f&&!f._bound){f._bound=1;f.addEventListener('submit',function(e){e.preventDefault();evaSend($('#evaChatIn').value)})}
  var mic=$('#evaMicBtn'),note=$('#evaMicNote');
  var Rec=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(mic&&!mic._bound){
    mic._bound=1;
    if(!Rec){mic.disabled=true;mic.setAttribute('aria-disabled','true');if(note){note.hidden=false;note.textContent=t('evaMicNo')}}
    else{
      if(note)note.hidden=true;
      var rec=null;
      mic.addEventListener('click',function(){
        if(rec){try{rec.stop()}catch(e){}return}
        rec=new Rec();rec.lang='es-ES';rec.interimResults=false;mic.classList.add('rec');
        rec.onresult=function(e){var s=e.results[0][0].transcript;var inp=$('#evaChatIn');if(inp)inp.value=s;evaSend(s)};
        rec.onend=rec.onerror=function(){mic.classList.remove('rec');rec=null};
        try{rec.start()}catch(e){mic.classList.remove('rec');rec=null}
      });
    }
  }else if(mic&&!Rec&&note){note.hidden=false;note.textContent=t('evaMicNo')}
}

var DOOR_KEY='nasai.doorBrowser';
var DOOR_TILES=[
  {id:'starlink',name:'Starlink',url:'https://www.starlink.com/'},
  {id:'x',name:'X',url:'https://x.com/'},
  {id:'grok',name:'Grok',url:'https://grok.com/'},
  {id:'osnews',name:'OSNews',url:'https://osnewspedrosg-glitch.github.io/osnews/',short:'osnews'}
];
function isAndroid(){return /android/i.test(navigator.userAgent||'')}
function doorBrowser(){try{var v=localStorage.getItem(DOOR_KEY);if(v==='chrome'||v==='default'||v==='edge-beta')return v}catch(e){}return 'edge-beta'}
function setDoorBrowser(v){try{localStorage.setItem(DOOR_KEY,v)}catch(e){}renderDoorBrowser()}
function looksLikeUrl(s){
  s=String(s||'').trim();
  if(!s||/\s/.test(s))return false;
  if(/^(javascript|data|vbscript|file|blob):/i.test(s))return false;
  if(/^https?:\/\//i.test(s))return true;
  if(/^(localhost|(\d{1,3}\.){3}\d{1,3})(:\d+)?(\/.*)?$/i.test(s))return true;
  return /^[\w-]+(\.[\w-]+)+(:\d+)?([\/?#].*)?$/i.test(s);
}
function toOpenUrl(s){
  s=String(s||'').trim();
  if(!s)return null;
  if(/^(javascript|data|vbscript|file|blob):/i.test(s))return null;
  if(looksLikeUrl(s)){
    if(!/^https?:\/\//i.test(s))s='https://'+s;
    s=s.replace(/^http:\/\//i,'https://');
    try{var u=new URL(s);if(u.protocol!=='https:')return null;return u.href}catch(e){return null}
  }
  return 'https://duckduckgo.com/?q='+encodeURIComponent(s);
}
function openExternal(url){
  url=toOpenUrl(url)||url;
  if(!url||!/^https:\/\//i.test(url))return;
  var android=isAndroid(),mode=doorBrowser();
  if(android&&mode!=='default'){
    var pkg=mode==='chrome'?'com.android.chrome':'com.microsoft.emmx.beta';
    var u;try{u=new URL(url)}catch(e){return}
    var hostpath=u.host+u.pathname+u.search+u.hash;
    location.href='intent://'+hostpath+'#Intent;scheme=https;package='+pkg+';S.browser_fallback_url='+encodeURIComponent(url)+';end';
  }else{
    window.open(url,'_blank','noopener,noreferrer');
  }
  use('starlink-door');
}
function wireDoorDownloads(){
  var android=isAndroid();
  var e=$('#dlEdge'),es=$('#dlEdgeStable'),c=$('#dlChrome');
  if(e)e.href=android?'https://play.google.com/store/apps/details?id=com.microsoft.emmx.beta':'https://www.microsoft.com/edge/download';
  if(es)es.href=android?'https://play.google.com/store/apps/details?id=com.microsoft.emmx':'https://www.microsoft.com/edge/download';
  if(c)c.href=android?'https://play.google.com/store/apps/details?id=com.android.chrome':'https://www.google.com/chrome/';
  [e,es,c].forEach(function(a){if(a){a.target='_blank';a.rel='noopener noreferrer'}});
}
function renderDoorTiles(){
  var box=$('#doorTiles');if(!box)return;
  box.innerHTML=DOOR_TILES.map(function(tile){
    return '<button type="button" class="doorTile" data-url="'+esc(tile.url)+'"><b>'+esc(tile.name)+'</b><small>'+esc(tile.short||tile.url.replace(/^https:\/\//,'').replace(/\/$/,''))+'</small></button>';
  }).join('');
  $$('#doorTiles [data-url]').forEach(function(b){b.onclick=function(){openExternal(b.getAttribute('data-url'))}});
}
function renderDoorBrowser(){
  var box=$('#doorBrowser');if(!box)return;
  var cur=doorBrowser();
  var opts=[{id:'edge-beta',lab:t('doorEdgeBeta')},{id:'chrome',lab:t('doorChrome')},{id:'default',lab:t('doorDefault')}];
  box.innerHTML='';
  opts.forEach(function(o){
    var b=document.createElement('button');b.type='button';b.textContent=o.lab;
    b.setAttribute('aria-pressed',cur===o.id?'true':'false');
    b.onclick=function(){setDoorBrowser(o.id)};
    box.appendChild(b);
  });
}
function renderDoor(){wireDoorDownloads();renderDoorTiles();renderDoorBrowser()}
function bindDoor(){
  renderDoor();
  $$('[data-open-door]').forEach(function(b){if(b._bound)return;b._bound=1;b.addEventListener('click',function(){showTab('puerta');var m=$('#main');if(m)m.scrollIntoView({behavior:'smooth',block:'start'});use('starlink-door-abrir')})});
  var back=$('#doorBack');if(back&&!back._bound){back._bound=1;back.addEventListener('click',function(){showTab('hablar')})}
  var f=$('#doorForm');if(f&&!f._bound){f._bound=1;f.addEventListener('submit',function(e){e.preventDefault();var v=$('#doorAddr').value;var url=toOpenUrl(v);if(url)openExternal(url)})}
}

var gameState=null;
function checkGame(){
  var box=$('#gameOut');if(!box)return;
  if(gameState==='ok'){box.innerHTML=gameCard(true);return}
  if(gameState==='no'){box.innerHTML=gameCard(false);return}
  box.innerHTML='<p class="sub">…</p>';
  var url='../ladron-retro/';
  var ctl=window.AbortController?new AbortController():null;var tm=setTimeout(function(){ctl&&ctl.abort()},5000);
  fetch(url,{method:'GET',cache:'no-store',signal:ctl?ctl.signal:undefined}).then(function(r){clearTimeout(tm);gameState=r.ok?'ok':'no';box.innerHTML=gameCard(r.ok)}).catch(function(){clearTimeout(tm);gameState='no';box.innerHTML=gameCard(false)});
}
function gameCard(ok){
  return '<article class="gameCard"><h3>'+t('jLadron')+'</h3><p class="sub">'+t('jLadronP')+'</p>'+(ok?'<a class="agentGo" href="../ladron-retro/">'+t('jPlay')+'</a>':'<p class="soon">'+t('jSoon')+'</p>')+'</article>';
}

(function(){var el=$('#cVisits');if(!el)return;if(!/^https?:$/.test(location.protocol)||/^(localhost|127\.|192\.168\.)/.test(location.hostname)){el.textContent=t('na');return}
  fetch('https://osnews-may.goatcounter.com/counter/'+encodeURIComponent(location.pathname)+'.json').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){el.textContent=j.count||t('na')}).catch(function(){el.textContent=t('na')})})();

$('#langBtn').addEventListener('click',function(){S.lang=L()==='es'?'en':'es';save();applyLang();gc('nasai-idioma-'+S.lang,'NASAI · idioma '+S.lang)});
$('#cUses').textContent=S.uses;$('#pulseCount').textContent=S.uses;
applyLang();
var start=(location.hash||'').slice(1);showTab(['hablar','contrastar','barrio','saber','crear','agentes','juegos','acta','puerta'].indexOf(start)>=0?start:'hablar');
bindWelcome();
bindEva();
bindDoor();
renderWelcome(welcomePhase==='return');
if('serviceWorker' in navigator&&location.protocol==='https:')window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
})();
