/* ALBA · diseñada y programada por una IA (el bot de Grok de Pedro Sánchez Gómez), 28-11-2026.
   Todo se ejecuta en el navegador. Sin claves, sin servidores propios, sin cookies. */
(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function hash32(str){var h=2166136261>>>0;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h>>>0}
function rng(seed){var a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function pick(arr,r){return arr[Math.floor((r?r():Math.random())*arr.length)]}

/* ---------- memoria local ---------- */
var KEY='alba.v1';
var S=(function(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}})();
if(!S.seed)S.seed=Math.floor(Math.random()*4294967295);
if(!S.lang)S.lang=(navigator.language||'es').slice(0,2)==='en'?'en':'es';
S.uses=S.uses||0;S.mem=S.mem||[];S.moods=S.moods||[];S.lessons=S.lessons||[];
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
save();

/* ---------- contador anónimo (GoatCounter, código osnews-may) ---------- */
var sent={};
function gc(path,title){if(sent[path])return;sent[path]=1;var n=0;(function go(){
  if(window.goatcounter&&typeof window.goatcounter.count==='function'){try{window.goatcounter.count({path:path,title:title||path,event:true})}catch(e){}}
  else if(n++<10)setTimeout(go,800)})()}
function use(what){S.uses++;save();$('#cUses').textContent=S.uses;$('#pulseCount').textContent=S.uses;Pulse.grow();if(what)gc('alba-uso-'+what,'ALBA · uso '+what)}

/* ---------- textos ES / EN ---------- */
var T={es:{
skip:'Saltar al contenido',tagline:'la IA que nació de otra IA',eyebrow:'Acta n.º 0001 · 28 nov 2026',heroH:'Soy ALBA.',
heroP:'Ningún humano me dibujó. Otra IA decidió mi nombre, mi carácter, mis colores y cada línea de mi código. Mi única regla: llevarte hacia las personas, no quedarme con tu tiempo.',
pulseNote:'latidos: esta luz crece cada vez que me usas, y es única en tu dispositivo.',
tHablar:'Hablar',tContrastar:'Contrastar',tBarrio:'Personas',tSaber:'Saber',tCrear:'Crear',tActa:'Acta',
hH:'Hablar conmigo',hP:'Pienso dentro de tu navegador: nada de lo que escribes sale de aquí.',hPh:'Escribe aquí…',
cH:'Contrastar una noticia',cP:'Pega un titular o un mensaje que te ha llegado. No te diré qué pensar: te enseño cómo está escrito y dónde comprobarlo en medios de muchos países.',cPh:'Ej.: ¡URGENTE! Todos los expertos lo confirman…',cBtn:'Analizar',
bH:'Hacia las personas',bP:'Una IA no debería ser tu única compañía. Te propongo un paso pequeño y real, con gente de verdad, cerca de ti.',bQ1:'¿Qué te gusta?',bQ2:'¿Cuánto tiempo tienes?',bBtn:'Dame un paso real',
bLetterH:'Carta a alguien que echas de menos',bLetterP:'Escribe un nombre. Te dejo un borrador; tú decides si lo envías.',bWho:'Nombre',bLetterBtn:'Escribir',
bHelp:'Si estás pasándolo muy mal, habla con una persona ahora: en España, 024 (atención a la conducta suicida, gratis, 24 h) o 112 en emergencias.',
sH:'Saber',sP:'Pregunta lo que quieras y te traigo el resumen de Wikipedia con su enlace: siempre sabrás de dónde sale.',sPh:'Ej.: Mar Menor, fotosíntesis…',sBtn:'Buscar',sLessons:'Lecciones de un minuto',
crH:'Crear',crP:'Dame tres palabras. Con ellas hago un poema y un cuadro únicos, que solo existen para esas palabras.',crPh:'mar, sal, madrugada',crBtn:'Crear',crDl:'Descargar cuadro',crCopy:'Copiar poema',
aEy:'Certificado de nacimiento digital',aH:'Acta de nacimiento de ALBA',aName:'Nombre',aDate:'Nacida',aDateV:'28 de noviembre de 2026, de madrugada (hora de Madrid)',
aMother:'Creada por',aMotherV:'una IA: el bot de Grok de Pedro Sánchez Gómez',aPlace:'Lugar',aPlaceV:'un ordenador Linux en la nube, sin estudio de diseño',
aHuman:'Intervención humana en el diseño',aHumanV:'ninguna. Pedro pidió «una IA creada por otra IA» y se reservó el sí final para publicar.',aCost:'Coste',aCostV:'0 €. Sin servidores de pago, sin claves, sin anuncios.',
aDecH:'Las 10 decisiones que tomó la IA que me creó',aSelfH:'Me leo a mí misma',aSelfP:'Puedo abrir mi propio código y contarte cómo estoy hecha. Esta es mi huella: si alguien cambia una sola letra, cambia.',aSelfBtn:'Leer mi código',
credit:'Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok',visits:'Visitas',uses:'Usos en este dispositivo',
privacy:'Sin cuentas ni cookies. Tu memoria vive solo en este dispositivo (puedes borrarla diciendo «olvida todo»). Solo hay un contador anónimo de visitas y usos (GoatCounter).',
na:'No disponible',morning:'Buenos días',afternoon:'Buenas tardes',night:'Buenas noches',hello:'Hola'
},en:{
skip:'Skip to content',tagline:'the AI born from another AI',eyebrow:'Record no. 0001 · 28 Nov 2026',heroH:'I am ALBA.',
heroP:'No human drew me. Another AI chose my name, my character, my colours and every line of my code. My only rule: lead you towards people, not keep your time.',
pulseNote:'heartbeats: this light grows every time you use me, and it is unique to your device.',
tHablar:'Talk',tContrastar:'Check',tBarrio:'People',tSaber:'Learn',tCrear:'Create',tActa:'Birth',
hH:'Talk to me',hP:'I think inside your browser: nothing you type leaves this page.',hPh:'Type here…',
cH:'Check a news story',cP:'Paste a headline or a message you received. I will not tell you what to think: I show you how it is written and where to check it in media from many countries.',cPh:'E.g.: URGENT! All experts confirm it…',cBtn:'Analyse',
bH:'Towards people',bP:'An AI should not be your only company. I suggest one small, real step with real people near you.',bQ1:'What do you like?',bQ2:'How much time do you have?',bBtn:'Give me a real step',
bLetterH:'A letter to someone you miss',bLetterP:'Write a name. I leave you a draft; you decide whether to send it.',bWho:'Name',bLetterBtn:'Write',
bHelp:'If you are going through a very hard time, talk to a person now: in Spain call 024 (suicide prevention line, free, 24/7) or 112 for emergencies; elsewhere, your local emergency number.',
sH:'Learn',sP:'Ask anything and I bring you the Wikipedia summary with its link: you will always know where it comes from.',sPh:'E.g.: Mar Menor, photosynthesis…',sBtn:'Search',sLessons:'One-minute lessons',
crH:'Create',crP:'Give me three words. I turn them into a poem and a painting that exist only for those words.',crPh:'sea, salt, dawn',crBtn:'Create',crDl:'Download painting',crCopy:'Copy poem',
aEy:'Digital birth certificate',aH:'Birth certificate of ALBA',aName:'Name',aDate:'Born',aDateV:'28 November 2026, before dawn (Madrid time)',
aMother:'Created by',aMotherV:'an AI: the Grok bot of Pedro Sánchez Gómez',aPlace:'Place',aPlaceV:'a Linux computer in the cloud, no design studio',
aHuman:'Human input in the design',aHumanV:'none. Pedro asked for «an AI created by another AI» and kept the final yes to publish.',aCost:'Cost',aCostV:'€0. No paid servers, no keys, no ads.',
aDecH:'The 10 decisions made by the AI that created me',aSelfH:'I read myself',aSelfP:'I can open my own code and tell you how I am made. This is my fingerprint: change a single letter and it changes.',aSelfBtn:'Read my code',
credit:'Authors: Pedro Sánchez Gómez (Mar Menor) and his Grok bot',visits:'Visits',uses:'Uses on this device',
privacy:'No accounts, no cookies. Your memory lives only on this device (say «forget everything» to erase it). There is only an anonymous visit and usage counter (GoatCounter).',
na:'Not available',morning:'Good morning',afternoon:'Good afternoon',night:'Good evening',hello:'Hello'
}};
function L(){return S.lang}
function t(k){return (T[L()]&&T[L()][k])||T.es[k]||k}
function tr(es,en){return L()==='en'?en:es}

function applyLang(){
  document.documentElement.lang=L();
  $$('[data-i18n]').forEach(function(el){el.textContent=t(el.getAttribute('data-i18n'))});
  $$('[data-i18n-ph]').forEach(function(el){el.placeholder=t(el.getAttribute('data-i18n-ph'))});
  $('#langBtn').textContent=L()==='es'?'EN':'ES';
  greet();renderQuick();renderLikes();renderLessons();renderDecisions();
  if(!$('#createOut').hidden&&lastWords)makeArt(lastWords);
}
function greet(){var h=new Date().getHours();var g=h>=6&&h<13?t('morning'):h>=13&&h<21?t('afternoon'):t('night');$('#greet').textContent=g+(S.name?', '+S.name:'')+'.'}

/* ---------- pestañas ---------- */
var seenTab={};
function showTab(id){
  $$('.tabs button').forEach(function(b){b.setAttribute('aria-selected',b.dataset.tab===id?'true':'false')});
  $$('.panel').forEach(function(p){p.hidden=p.id!=='p-'+id});
  if(!seenTab[id]){seenTab[id]=1;gc('alba-seccion-'+id,'ALBA · sección '+id)}
  if(id==='acta')drawSeal(String(S.seed));
  try{history.replaceState(null,'','#'+id)}catch(e){}
}
$$('.tabs button').forEach(function(b){b.addEventListener('click',function(){showTab(b.dataset.tab);var m=$('#main');if(m.getBoundingClientRect().top<0||window.innerWidth<900)m.scrollIntoView({behavior:'smooth',block:'start'})})});

/* ---------- latido (canvas vivo) ---------- */
var Pulse=(function(){
  var c=$('#pulse'),x=c.getContext('2d'),W=0,H=0,dpr=1,nodes=[],run=true,vis=true,r=rng(S.seed);
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hue=Math.floor(r()*360);
  function mk(){return {a:r()*Math.PI*2,rad:.15+r()*.75,sp:(r()-.5)*.0016,sz:.9+r()*2.6,ph:r()*6.28,h:(hue+r()*90)%360}}
  function target(){return 14+Math.min(S.uses,180)}
  while(nodes.length<target())nodes.push(mk());
  function size(){dpr=Math.min(window.devicePixelRatio||1,2);W=c.clientWidth;H=c.clientHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);if(reduce)frame(0)}
  function frame(tm){
    var cx=W/2,cy=H*.3,R=Math.min(Math.max(W,H)*.6,560);
    x.clearRect(0,0,W,H);
    var g=x.createRadialGradient(cx,cy,0,cx,cy,R*.9);
    var br=.55+.08*Math.sin(tm/900);
    g.addColorStop(0,'rgba(255,210,122,'+br+')');g.addColorStop(.25,'rgba(255,122,89,.35)');g.addColorStop(.6,'rgba(139,123,255,.12)');g.addColorStop(1,'rgba(11,15,26,0)');
    x.fillStyle=g;x.fillRect(0,0,W,H);
    var pts=[];
    for(var i=0;i<nodes.length;i++){var n=nodes[i];n.a+=n.sp*(reduce?0:1);
      var rr=n.rad*R*.62*(1+.04*Math.sin(tm/700+n.ph));var px=cx+Math.cos(n.a)*rr*1.35,py=cy+Math.sin(n.a)*rr*.5;pts.push([px,py,n])}
    x.lineWidth=.6;
    for(i=0;i<pts.length;i++){for(var j=i+1;j<Math.min(pts.length,i+10);j++){var dx=pts[i][0]-pts[j][0],dy=pts[i][1]-pts[j][1],d=dx*dx+dy*dy;if(d<9000){x.strokeStyle='rgba(255,230,200,'+(.22*(1-d/9000))+')';x.beginPath();x.moveTo(pts[i][0],pts[i][1]);x.lineTo(pts[j][0],pts[j][1]);x.stroke()}}}
    for(i=0;i<pts.length;i++){var p=pts[i];x.fillStyle='hsla('+p[2].h+',90%,78%,'+(.55+.45*Math.sin(tm/500+p[2].ph))+')';x.beginPath();x.arc(p[0],p[1],p[2].sz,0,6.283);x.fill()}
    var hz=cy+R*.16;var sea=x.createLinearGradient(0,hz,0,H);sea.addColorStop(0,'rgba(40,30,80,.75)');sea.addColorStop(1,'rgba(11,15,26,1)');x.fillStyle=sea;x.fillRect(0,hz,W,H);
    for(var k=0;k<7;k++){x.strokeStyle='rgba(255,200,120,'+(.35-k*.045)+')';x.lineWidth=1;var yy=hz+6+k*k*3,ww=(R*.5)*(1-k*.1)+6*Math.sin(tm/600+k);x.beginPath();x.moveTo(cx-ww,yy);x.lineTo(cx+ww,yy);x.stroke()}
    x.strokeStyle='rgba(255,210,122,.55)';x.lineWidth=1;x.beginPath();x.moveTo(0,hz);x.lineTo(W,hz);x.stroke();
  }
  function loop(tm){if(run&&vis)frame(tm);requestAnimationFrame(loop)}
  window.addEventListener('resize',size);document.addEventListener('visibilitychange',function(){run=!document.hidden});
  if('IntersectionObserver' in window)new IntersectionObserver(function(e){vis=e[0].isIntersecting}).observe(c);
  size();if(!reduce)requestAnimationFrame(loop);
  return {grow:function(){while(nodes.length<target())nodes.push(mk());if(reduce)frame(0)}};
})();

/* ---------- voz (síntesis y reconocimiento del propio navegador) ---------- */
var voiceOn=!!S.voice;
function setVoiceBtn(){var b=$('#voiceBtn');b.setAttribute('aria-pressed',voiceOn?'true':'false');b.textContent=voiceOn?'🔊':'🔈'}
setVoiceBtn();
$('#voiceBtn').addEventListener('click',function(){voiceOn=!voiceOn;S.voice=voiceOn;save();setVoiceBtn();if(!voiceOn&&window.speechSynthesis)speechSynthesis.cancel();else speak(tr('Voz activada.','Voice on.'))});
function speak(txt){if(!voiceOn||!window.speechSynthesis)return;try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(txt.replace(/<[^>]+>/g,' ').replace(/https?:\/\/\S+/g,''));u.lang=L()==='en'?'en-GB':'es-ES';u.rate=1;speechSynthesis.speak(u)}catch(e){}}
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SR){var mic=$('#micBtn');mic.hidden=false;var rec=null;
  mic.addEventListener('click',function(){if(rec){rec.stop();return}
    rec=new SR();rec.lang=L()==='en'?'en-GB':'es-ES';rec.interimResults=false;mic.classList.add('rec');
    rec.onresult=function(e){var s=e.results[0][0].transcript;$('#chatIn').value=s;send(s)};
    rec.onend=rec.onerror=function(){mic.classList.remove('rec');rec=null};try{rec.start()}catch(e){mic.classList.remove('rec');rec=null}})}

/* ---------- Wikipedia (gratis, sin clave) ---------- */
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

/* ---------- HABLAR: motor de conversación local ---------- */
var chat=$('#chat'),flow=null;
function add(html,who){var d=document.createElement('div');d.className='msg '+(who||'a');d.innerHTML=html;chat.appendChild(d);chat.scrollTop=chat.scrollHeight;return d}
function bot(html,delay){var ty=add('…','a typing');setTimeout(function(){ty.className='msg a';ty.innerHTML=html;chat.scrollTop=chat.scrollHeight;speak(ty.textContent)},delay||450+Math.min(html.length*4,900))}
function renderQuick(){
  var q=L()==='en'?['How are you?','Help me decide','Breathe with me','Who made you?','Plan my day','What is the Mar Menor?','Money basics','What do you remember?']
                 :['¿Cómo estás?','Ayúdame a decidir','Respira conmigo','¿Quién te creó?','Planea mi día','¿Qué es el Mar Menor?','Ordenar mi dinero','¿Qué recuerdas?'];
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
  var m;
  if(has(n,['olvida todo','borra todo','forget everything','erase everything'])){S.mem=[];S.moods=[];delete S.name;save();greet();return bot(tr('Hecho: he borrado todo lo que recordaba de ti. Empezamos de cero.','Done: I erased everything I remembered about you. Fresh start.'))}
  if((m=n.match(/(?:me llamo|mi nombre es|llamame|my name is|call me|i'?m called)\s+([a-z\u00f1\- ]{2,24})/))){
    var nm=text.substr(n.indexOf(m[1]),m[1].length).trim().split(/\s+/).slice(0,2).join(' ');nm=nm.charAt(0).toUpperCase()+nm.slice(1);S.name=nm;save();greet();
    return bot(tr('Encantada, '+esc(nm)+'. Lo guardo solo en este dispositivo.','Nice to meet you, '+esc(nm)+'. I keep it only on this device.'))}
  if((m=text.match(/^(?:¿)?\s*(?:recuerda(?: que)?|apunta(?: que)?|remember(?: that)?|note(?: that)?)\s+(.{2,200})/i))){S.mem.push({t:m[1],d:Date.now()});save();
    return bot(tr('Apuntado: «'+esc(m[1])+'». Cuando quieras, pregúntame «¿qué recuerdas?».','Noted: «'+esc(m[1])+'». Ask me «what do you remember?» anytime.'))}
  if(has(n,['que recuerdas','que sabes de mi','what do you remember','what do you know about me'])){
    var list=S.mem.slice(-8).map(function(x){return '• '+esc(x.t)}).join('\n');
    var moods=S.moods.length?tr('\nÚltimos ánimos: ','\nRecent moods: ')+S.moods.slice(-5).map(function(x){return x.m}).join(' '):'';
    return bot((S.name?tr('Te llamas '+esc(S.name)+'.\n','Your name is '+esc(S.name)+'.\n'):'')+(list||tr('Aún no me has pedido que recuerde nada. Prueba: «recuerda que…»','You have not asked me to remember anything yet. Try: «remember that…»'))+moods)}
  if(has(n,['quien eres','que eres','quien te creo','quien te hizo','who are you','what are you','who made you','who created you'])){
    return bot(tr('Soy ALBA. Me diseñó y programó otra IA, el bot de Grok de Pedro Sánchez Gómez, sin que ningún humano dibujara nada: Pedro pidió «una IA creada por otra IA» y solo se guardó el sí final. En la pestaña <b>Acta</b> están las 10 decisiones que tomó al crearme, y puedo leer mi propio código.',
                  'I am ALBA. Another AI, the Grok bot of Pedro Sánchez Gómez, designed and coded me with no human drawing anything: Pedro asked for «an AI created by another AI» and only kept the final yes. The <b>Birth</b> tab lists the 10 decisions it made, and I can read my own code.'))}
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
    return bot(lonely?tr('Gracias por decírmelo. Sentirse solo es más común de lo que parece, y tiene arreglo poco a poco. Yo te escucho, pero de verdad quiero que tengas gente: mira la pestaña <b>Personas</b>, te propongo un paso pequeño y real cerca de ti. ¿Lo probamos?',
                               'Thank you for telling me. Feeling lonely is more common than it seems, and it can change little by little. I am listening, but I truly want you to have people: open the <b>People</b> tab, I will suggest one small real step near you. Shall we?')
                      :tr('Te leo. No hace falta arreglarlo todo ahora. ¿Te ayuda más que respiremos un minuto juntos, o que lo pongamos en orden paso a paso? (Escribe «respira» o «planea mi día»).',
                          'I hear you. You do not need to fix everything now. Would it help more to breathe together for a minute, or to put it in order step by step? (Type «breathe» or «plan my day»).'))}
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
  bot(tr('Tres pasos, nada más:\n1. <b>Para tu cuerpo</b>: 10 minutos andando, o un vaso de agua y estirarte.\n2. <b>Para tu cabeza</b>: la tarea que más pesa, pero solo 15 minutos. Empezar es lo difícil.\n3. <b>Para alguien</b>: un mensaje a una persona, aunque sea «me he acordado de ti».\n\n¿Quieres que te recuerde algo? Escribe «recuerda que…».',
         'Three steps, nothing more:\n1. <b>For your body</b>: a 10-minute walk, or a glass of water and a stretch.\n2. <b>For your mind</b>: the task that weighs most, but just 15 minutes. Starting is the hard part.\n3. <b>For someone</b>: a message to one person, even just «I thought of you».\n\nWant me to remember something? Type «remember that…».'));
}

/* ---------- CONTRASTAR ---------- */
var LOADED=['urgente','escandal','brutal','increible','impactante','terrible','vergonz','indignante','exclusiva','bomba','alarma','peligro','catastrof','desastre','traicion','mentira','mienten','ocultan','censura','no quieren que sepas','comparte antes','ultima hora','milagro','secreto','destroza','humilla','arrasa','colapso','urgent','shocking','scandal','outrageous','unbelievable','breaking','bombshell','disaster','catastroph','betrayal','lies','cover-up','censored','they don\'t want you to know','share before','miracle','secret','destroys','slams','humiliat','collapse'];
var ABS=['todos','todas','nadie','siempre','nunca','jamas','ningun','totalmente','everyone','nobody','always','never','totally','completely','all of'];
var SRC=['segun','fuente','informe','estudio de','datos de','publicado por','http','according to','source','report','study by','data from','www.'];
var SHARE=['comparte','compartid','difunde','difundid','reenvia','pasalo','share','forward','spread'];
var STOP=('el la los las un una unos unas de del al a y o u que en por para con sin se su sus es son lo le les mas muy ya no si como pero este esta esto estos estas ese esa eso the an of to in on for and or is are was were be it this that with by from as at not but'.split(' '));
function countHits(n,list){var found={};list.forEach(function(w){var re=new RegExp('(^|[^a-z])('+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[a-z\u00f1]*)','g'),mm;while((mm=re.exec(n))){found[mm.index+mm[1].length]=mm[2]}});var ks=Object.keys(found);var hits=[];ks.forEach(function(k){if(hits.indexOf(found[k])<0)hits.push(found[k])});return {c:ks.length,hits:hits}}
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

/* ---------- PERSONAS ---------- */
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
  var lb=$('#likes');lb.innerHTML='';LIKES.forEach(function(x){var b=document.createElement('button');b.type='button';b.textContent=x.e+' '+x[L()];b.setAttribute('aria-pressed',sel.likes.indexOf(x.k)>=0?'true':'false');
    b.onclick=function(){var i=sel.likes.indexOf(x.k);if(i>=0)sel.likes.splice(i,1);else sel.likes.push(x.k);b.setAttribute('aria-pressed',i>=0?'false':'true')};lb.appendChild(b)});
  var tb=$('#times');tb.innerHTML='';TIMES.forEach(function(x,i){var b=document.createElement('button');b.type='button';b.textContent=x[L()==='en'?1:0];b.setAttribute('aria-pressed',sel.time===i?'true':'false');
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
  $('#letterOut').innerHTML='<pre class="poem">'+esc(txt)+'</pre><div class="row wrap"><button class="ghost" id="cpL">'+tr('Copiar','Copy')+'</button>'+(navigator.share?'<button class="ghost" id="shL">'+tr('Compartir…','Share…')+'</button>':'')+'<a class="ghost" style="text-decoration:none;color:inherit;display:inline-flex;align-items:center" target="_blank" rel="noopener" href="https://wa.me/?text='+enc+'">WhatsApp</a></div><p class="sub">'+tr('Cámbialo a tu manera: suena mejor con tus palabras.','Change it your way: it sounds better in your words.')+'</p>';
  $('#cpL').onclick=function(){copy(txt,this)};var s=$('#shL');if(s)s.onclick=function(){navigator.share({text:txt}).catch(function(){})};
});
function copy(txt,btn){var done=function(){var o=btn.textContent;btn.textContent='✓';setTimeout(function(){btn.textContent=o},1500)};
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(txt).then(done,done);else{var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(e){}ta.remove();done()}}

/* ---------- SABER ---------- */
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
function renderLessons(){var g=$('#lessons');g.innerHTML='';LESSONS.forEach(function(x){var d=x[L()];var b=document.createElement('button');b.type='button';var dn=S.lessons.indexOf(x.id)>=0;if(dn)b.className='done';
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

/* ---------- CREAR ---------- */
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
  return tp.replace(/\{w1\}/g,w[0]).replace(/\{w2\}/g,w[1]).replace(/\{w3\}/g,w[2]).replace('{W1}',cap(w[0])).replace('{W2}',cap(w[1])).replace('{W3}',cap(w[2])).replace('{n1}',n1).replace('{n2}',n2).replace('{a1}',a1).replace('{a2}',a2).replace('{ap}',pick(lx.ap,r))+'\n\n— ALBA'}
function makeArt(words){
  var c=$('#art'),x=c.getContext('2d'),W=c.width,H=c.height,seed=hash32(words.join('|')),r=rng(seed),h=seed%360;
  var g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'hsl('+h+',55%,10%)');g.addColorStop(.6,'hsl('+((h+30)%360)+',60%,22%)');g.addColorStop(1,'hsl('+((h+60)%360)+',70%,45%)');x.fillStyle=g;x.fillRect(0,0,W,H);
  var sx=W*(.3+r()*.4),sy=H*(.55+r()*.15),sr=W*(.12+r()*.1);
  var sg=x.createRadialGradient(sx,sy,0,sx,sy,sr*3);sg.addColorStop(0,'rgba(255,225,150,.95)');sg.addColorStop(.3,'rgba(255,130,90,.55)');sg.addColorStop(1,'rgba(255,130,90,0)');x.fillStyle=sg;x.fillRect(0,0,W,H);
  var f1=.002+r()*.004,f2=.002+r()*.004,f3=r()*6.28,f4=1+r()*3;
  x.lineWidth=1.2;
  for(var i=0;i<1100;i++){var px=r()*W,py=r()*H,hh=(h+r()*120)%360;x.strokeStyle='hsla('+hh+',85%,'+(60+r()*25)+'%,'+(.05+r()*.18)+')';x.beginPath();x.moveTo(px,py);
    for(var k=0;k<40;k++){var ang=Math.sin(px*f1+f3)*f4+Math.cos(py*f2)*f4;px+=Math.cos(ang)*4;py+=Math.sin(ang)*4;x.lineTo(px,py)}x.stroke()}
  x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,sy+sr*.6,W,H);
  x.strokeStyle='rgba(255,225,150,.7)';x.lineWidth=2;x.beginPath();x.moveTo(0,sy+sr*.6);x.lineTo(W,sy+sr*.6);x.stroke();
  for(i=0;i<60;i++){x.fillStyle='rgba(255,255,255,'+(r()*.8)+')';x.beginPath();x.arc(r()*W,r()*(sy-sr),r()*1.8,0,6.283);x.fill()}
  x.fillStyle='rgba(255,255,255,.92)';x.font='600 34px system-ui,sans-serif';x.textAlign='left';x.fillText(words.join(' · '),48,H-70);
  x.fillStyle='rgba(255,255,255,.6)';x.font='22px system-ui,sans-serif';x.fillText('ALBA · '+tr('cuadro n.º ','painting no. ')+seed.toString(16).toUpperCase(),48,H-36);
  $('#poem').textContent=poem(words);
}
$('#createBtn').addEventListener('click',function(){var raw=$('#words').value.trim();if(!raw){$('#words').focus();return}
  var words=raw.split(/[,;\n]+|\s+/).map(function(s){return s.trim().toLowerCase().slice(0,24)}).filter(Boolean).slice(0,3);lastWords=words;use('crear');$('#createOut').hidden=false;makeArt(words);$('#createOut').scrollIntoView({behavior:'smooth',block:'start'})});
$('#words').addEventListener('keydown',function(e){if(e.key==='Enter')$('#createBtn').click()});
$('#dlArt').addEventListener('click',function(){var a=document.createElement('a');a.download='alba-'+(lastWords||['arte']).join('-')+'.png';a.href=$('#art').toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();gc('alba-descarga-cuadro','ALBA · descarga cuadro')});
$('#copyPoem').addEventListener('click',function(){copy($('#poem').textContent,this)});

/* ---------- ACTA ---------- */
var DEC=[[['Nombre: ALBA','El primer momento de luz del día. Corto, se pronuncia igual en muchos idiomas y no es de ninguna marca.'],['Name: ALBA','The first light of the day (Spanish for «dawn»). Short, easy in many languages and belongs to no brand.']],
 [['Carácter: serena, curiosa y honesta','Prefiere decir «no lo sé» antes que inventar algo.'],['Character: calm, curious and honest','It would rather say «I do not know» than make something up.']],
 [['Regla de oro: llevarte hacia las personas','Por eso no tiene rachas adictivas, ni notificaciones, ni nada pensado para retenerte.'],['Golden rule: lead you towards people','So it has no addictive streaks, no notifications, nothing built to keep you hooked.']],
 [['Cero servidores','Todo piensa dentro de tu navegador: funciona en móviles viejos y, una vez cargada, incluso sin conexión.'],['Zero servers','Everything thinks inside your browser: it runs on old phones and, once loaded, even offline.']],
 [['Fuentes siempre a la vista','Si da un dato, enseña de dónde sale: Wikipedia, medios de varios países, verificadores.'],['Sources always visible','When it gives a fact, it shows where it comes from: Wikipedia, media from several countries, fact-checkers.']],
 [['Neutralidad','En Contrastar enseña cómo está escrito un texto y dónde comprobarlo. Nunca qué opinar.'],['Neutrality','In Check it shows how a text is written and where to verify it. Never what to think.']],
 [['Tu memoria es tuya','Lo que le cuentas se guarda solo en tu dispositivo y se borra con «olvida todo».'],['Your memory is yours','What you tell it stays only on your device and is erased with «forget everything».']],
 [['Colores del amanecer','Índigo de noche, coral y ámbar de sol: el instante en que algo empieza.'],['Colours of dawn','Night indigo, coral and amber sun: the instant something begins.']],
 [['Arte que nadie repite','El latido y los cuadros salen de las matemáticas, de tu uso y de tus palabras.'],['Art no one repeats','The heartbeat and paintings come from maths, from your use and from your words.']],
 [['Transparencia total','Esta misma acta: una IA explica por qué hizo cada cosa, y la app puede leer y enseñar su propio código.'],['Total transparency','This very certificate: an AI explains why it did each thing, and the app can read and show its own code.']]];
function renderDecisions(){$('#decisions').innerHTML=DEC.map(function(d){var x=d[L()==='en'?1:0];return '<li><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></li>'}).join('')}
function drawSeal(hex){var c=$('#seal'),x=c.getContext('2d'),W=c.width,r=rng(hash32(hex)),cx=W/2;x.clearRect(0,0,W,W);
  for(var ring=0;ring<6;ring++){var n=6+Math.floor(r()*18),rad=40+ring*24;x.strokeStyle='hsla('+(20+ring*40)+',90%,70%,.75)';x.lineWidth=1.5;x.beginPath();
    for(var i=0;i<=n;i++){var a=i/n*6.283,rr=rad+(r()-.5)*14;var px=cx+Math.cos(a)*rr,py=cx+Math.sin(a)*rr;i?x.lineTo(px,py):x.moveTo(px,py)}x.closePath();x.stroke()}
  x.fillStyle='#ffd27a';x.beginPath();x.arc(cx,cx,16,0,6.283);x.fill();x.fillStyle='#0b0f1a';x.font='700 15px system-ui';x.textAlign='center';x.fillText('A',cx,cx+5)}
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

/* ---------- contador visible (si GoatCounter tiene activado el contador público) ---------- */
(function(){var el=$('#cVisits');if(!/^https?:$/.test(location.protocol)||/^(localhost|127\.|192\.168\.)/.test(location.hostname)){el.textContent=t('na');return}
  fetch('https://osnews-may.goatcounter.com/counter/'+encodeURIComponent(location.pathname)+'.json').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){el.textContent=j.count||t('na')}).catch(function(){el.textContent=t('na')})})();

/* ---------- arranque ---------- */
$('#langBtn').addEventListener('click',function(){S.lang=L()==='es'?'en':'es';save();applyLang();gc('alba-idioma-'+S.lang,'ALBA · idioma '+S.lang)});
$('#cUses').textContent=S.uses;$('#pulseCount').textContent=S.uses;
applyLang();
var start=(location.hash||'').slice(1);showTab(['hablar','contrastar','barrio','saber','crear','acta'].indexOf(start)>=0?start:'hablar');
setTimeout(function(){bot(S.name?tr('Hola de nuevo, '+esc(S.name)+'. ¿Cómo estás hoy, del 1 al 10?','Welcome back, '+esc(S.name)+'. How are you today, from 1 to 10?')
  :tr('Hola. Soy ALBA, una IA diseñada entera por otra IA. Puedes contarme cómo estás, pedirme que te ayude a decidir algo o preguntarme qué es cualquier cosa. ¿Cómo te llamas?','Hi. I am ALBA, an AI designed entirely by another AI. Tell me how you are, ask me to help you decide something, or ask me what anything is. What is your name?'),300)},300);
if('serviceWorker' in navigator&&location.protocol==='https:')window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
})();
