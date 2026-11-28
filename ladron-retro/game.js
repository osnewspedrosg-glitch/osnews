/* El Ladrón · Maquinita 1980
   Recreación LCD / Game & Watch. Todo corre en el navegador. Sin claves ni servidor. */
(function(){
'use strict';

var COLS=8, LANES=3, MAX_LIVES=5, MAX_MOVES=100;
var W=800, H=480;
var STORE_HI='osnews-ladron-hi';
var STORE_LANG='osnews-ladron-lang';
var STORE_MUTE='osnews-ladron-muted';
var STORE_USES='osnews-ladron-uses';

var $=function(s,r){return (r||document).querySelector(s)};
function defLang(){return (navigator.language||'es').slice(0,2)==='en'?'en':'es'}

var T={es:{
  skip:'Saltar al juego',tagline:'Maquinita 1980',
  muteOn:'Silenciar',muteOff:'Activar sonido',
  play:'JUGAR',playLab:'partida',again:'OTRA',
  howH:'Cómo se juega',
  howP:'Eres el ladrón. Sales de la calle, cruzas los chalets y el pasillo, esquivas a los perros y a los policías y entras en la casa a llevarte el botín. Cada paso gasta 1 de 100 movimientos. Si te atrapan, pierdes una de las 5 vidas y vuelves a la calle. Si llegas a la casa, sumas puntos y los enemigos se vuelven más rápidos. Se acaba la partida cuando te quedas sin vidas o sin movimientos. Flechas del teclado o los botones grandes de la maquinita.',
  credit:'Autores: Pedro Sánchez Gómez (Mar Menor) y su bot de Grok',
  visits:'Visitas',uses:'Usos en este dispositivo',
  privacy:'El récord, el idioma, el silencio y el recuento de usos se guardan solo en este dispositivo. Hay un contador anónimo de visitas y usos (GoatCounter). No hay cuentas ni anuncios.',
  na:'No disponible',
  ariaUp:'Arriba',ariaDown:'Abajo',ariaLeft:'Izquierda',ariaRight:'Derecha',
  lcd:'Pantalla LCD del juego',
  pts:'PTS',hi:'HI',lives:'VIDAS',moves:'MOV',
  zone0:'CALLE',zone1:'CHALETS',zone2:'PASILLO',zone3:'CASA',
  mReady:'PULSA JUGAR',mCaught:'ATRAPADO',mLoot:'BOTIN',mOver:'GAME OVER',mMoves:'SIN MOVIMIENTOS'
},en:{
  skip:'Skip to the game',tagline:'1980 handheld',
  muteOn:'Mute',muteOff:'Unmute',
  play:'PLAY',playLab:'game',again:'AGAIN',
  howH:'How to play',
  howP:'You are the thief. You come in from the street, go through the chalets and the corridor, dodge the dogs and the policemen and get into the house to steal the loot. Each step costs 1 of 100 moves. If they catch you, you lose one of your 5 lives and go back to the street. If you reach the house, you score points and the enemies get faster. The game ends when you run out of lives or moves. Use the arrow keys or the big buttons on the handheld.',
  credit:'Authors: Pedro Sánchez Gómez (Mar Menor) and his Grok bot',
  visits:'Visits',uses:'Uses on this device',
  privacy:'The high score, language, mute setting and use count are stored only on this device. There is an anonymous visit and usage counter (GoatCounter). No accounts and no ads.',
  na:'Not available',
  ariaUp:'Up',ariaDown:'Down',ariaLeft:'Left',ariaRight:'Right',
  lcd:'Game LCD screen',
  pts:'PTS',hi:'HI',lives:'LIVES',moves:'MOV',
  zone0:'STREET',zone1:'CHALETS',zone2:'HALL',zone3:'HOUSE',
  mReady:'PRESS START',mCaught:'CAUGHT',mLoot:'LOOT',mOver:'GAME OVER',mMoves:'NO MOVES'
}};

var lang=(function(){try{var v=localStorage.getItem(STORE_LANG);if(v==='en'||v==='es')return v}catch(e){}return defLang()})();
function t(k){return (T[lang]||T.es)[k]||(T.es[k]||k)}
var muted=(function(){try{return localStorage.getItem(STORE_MUTE)==='1'}catch(e){return false}})();
var hi=(function(){try{return Math.max(0,parseInt(localStorage.getItem(STORE_HI),10)||0)}catch(e){return 0}})();
var uses=(function(){try{return Math.max(0,parseInt(localStorage.getItem(STORE_USES),10)||0)}catch(e){return 0}})();
function save(k,v){try{localStorage.setItem(k,String(v))}catch(e){}}

/* ---------- GoatCounter (código osnews-may) ---------- */
var sent={};
function gc(path,title){if(sent[path])return;sent[path]=1;var n=0;(function go(){
  if(window.goatcounter&&typeof window.goatcounter.count==='function'){try{window.goatcounter.count({path:path,title:title||path,event:true})}catch(e){}}
  else if(n++<10)setTimeout(go,800)})()}
function bumpUse(){uses++;save(STORE_USES,uses);var el=$('#cUses');if(el)el.textContent=String(uses)}

function applyLang(){
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-i18n]').forEach(function(el){var k=el.getAttribute('data-i18n');if(k)el.textContent=t(k)});
  var mb=$('#muteBtn');if(mb){mb.title=muted?t('muteOff'):t('muteOn');mb.setAttribute('data-i18n-title',muted?'muteOff':'muteOn');mb.textContent=muted?'🔇':'🔈';mb.setAttribute('aria-pressed',muted?'true':'false')}
  var lb=$('#langBtn');if(lb)lb.textContent=lang==='es'?'EN':'ES';
  $('#btnUp')&&$('#btnUp').setAttribute('aria-label',t('ariaUp'));
  $('#btnDown')&&$('#btnDown').setAttribute('aria-label',t('ariaDown'));
  $('#btnLeft')&&$('#btnLeft').setAttribute('aria-label',t('ariaLeft'));
  $('#btnRight')&&$('#btnRight').setAttribute('aria-label',t('ariaRight'));
  var c=$('#lcd');if(c)c.setAttribute('aria-label',t('lcd'));
  updateStartLabel();
}

/* ---------- sonido piezo LCD (sin música) ---------- */
var actx=null;
function audio(){if(!actx){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;actx=new AC()}if(actx.state==='suspended')actx.resume();return actx}
function beep(freq,dur,type,vol){
  if(muted)return;
  var ctx=audio();if(!ctx)return;
  var o=ctx.createOscillator(),g=ctx.createGain();
  o.type=type||'square';
  o.frequency.setValueAtTime(freq,ctx.currentTime);
  var v=vol==null?0.07:vol;
  g.gain.setValueAtTime(v,ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0008,ctx.currentTime+dur);
  o.connect(g);g.connect(ctx.destination);
  o.start();o.stop(ctx.currentTime+dur+0.02);
}
function melody(notes){notes.forEach(function(n){setTimeout(function(){beep(n[0],n[1],n[2]||'square',n[3])},n[4]||0)})}
function sndMove(){beep(1280,0.035,'square',0.05)}
function sndBlock(){beep(220,0.05,'square',0.05)}
function sndCaught(){melody([[240,0.09,'square',0.08,0],[160,0.16,'square',0.08,90]])}
function sndLoot(){melody([[660,0.07,'square',0.07,0],[880,0.07,'square',0.07,80],[1175,0.14,'square',0.08,160]])}
function sndOver(){melody([[392,0.12,'square',0.07,0],[311,0.12,'square',0.07,130],[247,0.12,'square',0.07,260],[165,0.22,'square',0.08,400]])}
function sndStart(){melody([[523,0.06,'square',0.06,0],[784,0.1,'square',0.07,80]])}

/* ---------- estado ---------- */
var G={
  status:'attract',
  col:0,lane:1,
  lives:MAX_LIVES,moves:MAX_MOVES,
  score:0,level:1,tick:0,
  enemies:[],
  freeze:false,
  tickMs:800,
  msg:'',msgUntil:0,
  walk:0,
  overReason:''
};
var timer=null,raf=0,now0=0;

function tickMsFor(level){return Math.max(260,Math.round(800*Math.pow(0.85,Math.max(0,level-1))))}

function bounce(t){var c=t%4;return c===0?0:c===1?1:c===2?2:1}
function tri(t,span){var m=span*2;var c=((t%m)+m)%m;return c<=span?c:m-c}

function buildEnemies(level,tick){
  var e=[];
  e.push({type:'dog',col:3,lane:bounce(tick)});
  e.push({type:'cop',col:4,lane:bounce(Math.floor(tick/2)+1)});
  e.push({type:'dog',col:5,lane:bounce(tick+2)});
  if(level>=2)e.push({type:'cop',col:3+tri(tick,2),lane:0});
  if(level>=3)e.push({type:'cop',col:6,lane:bounce(tick+1)});
  if(level>=4)e.push({type:'dog',col:2,lane:bounce(tick+3)});
  if(level>=5)e.push({type:'cop',col:1,lane:(Math.floor(tick/2)%2)===0?2:1});
  if(level>=7)e.push({type:'dog',col:3+tri(tick+1,2),lane:2});
  return e;
}
function occupied(col,lane,enemies){
  enemies=enemies||G.enemies;
  for(var i=0;i<enemies.length;i++){if(enemies[i].col===col&&enemies[i].lane===lane)return enemies[i]}
  return null;
}
function setHi(){if(G.score>hi){hi=G.score;save(STORE_HI,hi)}}

function resetPlay(){
  G.status='play';
  G.col=0;G.lane=1;
  G.lives=MAX_LIVES;G.moves=MAX_MOVES;
  G.score=0;G.level=1;G.tick=0;
  G.tickMs=tickMsFor(1);
  G.enemies=buildEnemies(G.level,G.tick);
  G.msg='';G.msgUntil=0;G.walk=0;G.overReason='';
  led(true);
}
function toStreet(){G.col=0;G.lane=1}

function startGame(){
  audio();
  resetPlay();
  bumpUse();
  gc('ladron-uso-partida','El Ladrón · partida');
  sndStart();
  schedule();
  updateStartLabel();
}

function gameOver(reason){
  G.status='over';
  G.overReason=reason||'lives';
  G.msg=reason==='moves'?t('mMoves'):t('mOver');
  G.msgUntil=performance.now()+8000;
  setHi();
  led(false);
  clearTimer();
  sndOver();
  gc('ladron-uso-fin','El Ladrón · fin');
  updateStartLabel();
}

function updateStartLabel(){
  var b=$('#startBtn');if(!b)return;
  b.textContent=(G.status==='play'||G.status==='caught'||G.status==='loot')?t('again'):t('play');
}

function led(on){var e=$('#led');if(e)e.classList.toggle('on',!!on)}

function clearTimer(){if(timer){clearTimeout(timer);timer=null}}
function schedule(){
  clearTimer();
  if(G.freeze||G.status==='over')return;
  var ms=G.status==='attract'?900:G.tickMs;
  if(G.status==='caught'||G.status==='loot')return;
  timer=setTimeout(enemyTick,ms);
}

function enemyTick(){
  if(G.freeze)return;
  G.tick++;
  G.enemies=buildEnemies(G.status==='attract'?1:G.level,G.tick);
  if(G.status==='play'&&occupied(G.col,G.lane))doCaught();
  else if(G.status==='attract')attractStep();
  schedule();
}

/* modo atracción: un ladrón de demostración avanza si puede */
var demo={col:0,lane:1,wait:0};
function attractStep(){
  if(G.msgUntil>performance.now())return;
  var n=demo;
  var tryDirs=[[1,0],[0,-1],[0,1],[-1,0]];
  var moved=false;
  for(var i=0;i<tryDirs.length;i++){
    var nc=n.col+tryDirs[i][0],nl=n.lane+tryDirs[i][1];
    if(nc<0||nc>=COLS||nl<0||nl>=LANES)continue;
    if(occupied(nc,nl))continue;
    n.col=nc;n.lane=nl;moved=true;break;
  }
  G.col=n.col;G.lane=n.lane;G.walk++;
  if(n.col===COLS-1){
    G.msg=t('mLoot');G.msgUntil=performance.now()+900;
    n.col=0;n.lane=1;G.col=0;G.lane=1;
  }else if(!moved){
    n.wait++;
    if(n.wait>4){n.col=0;n.lane=1;G.col=0;G.lane=1;n.wait=0}
  }else n.wait=0;
}

function doCaught(){
  if(G.status!=='play')return;
  G.status='caught';
  G.lives--;
  G.msg=t('mCaught');
  G.msgUntil=performance.now()+900;
  sndCaught();
  if(navigator.vibrate)try{navigator.vibrate(80)}catch(e){}
  clearTimer();
  setTimeout(function(){
    if(G.status!=='caught')return;
    if(G.lives<=0){gameOver('lives');return}
    toStreet();
    G.status='play';
    G.msg='';
    G.enemies=buildEnemies(G.level,G.tick);
    schedule();
  },900);
}

function doLoot(){
  G.status='loot';
  var gained=100*G.level;
  G.score+=gained;
  setHi();
  G.msg=t('mLoot')+' +'+gained;
  G.msgUntil=performance.now()+1000;
  sndLoot();
  gc('ladron-uso-botin','El Ladrón · botín');
  clearTimer();
  setTimeout(function(){
    if(G.status!=='loot')return;
    if(G.moves<=0){gameOver('moves');return}
    G.level++;
    G.tickMs=tickMsFor(G.level);
    toStreet();
    G.status='play';
    G.msg='';
    G.enemies=buildEnemies(G.level,G.tick);
    schedule();
  },1000);
}

function canPlay(){return G.status==='play'}

function move(dir){
  if(G.status==='attract'){startGame();return false}
  if(G.status==='over'){return false}
  if(!canPlay())return false;
  var dc=0,dl=0;
  if(dir==='left')dc=-1;
  else if(dir==='right')dc=1;
  else if(dir==='up')dl=-1;
  else if(dir==='down')dl=1;
  else return false;
  var nc=G.col+dc,nl=G.lane+dl;
  if(nc<0||nc>=COLS||nl<0||nl>=LANES){sndBlock();return false}
  if(G.moves<=0){gameOver('moves');return false}
  G.col=nc;G.lane=nl;G.moves--;G.walk++;
  sndMove();
  if(occupied(G.col,G.lane)){doCaught();return true}
  if(G.col===COLS-1){doLoot();return true}
  if(G.moves<=0){gameOver('moves');return true}
  return true;
}

/* ---------- dibujo LCD ---------- */
var canvas,ctx,dpr=1;
function ink(on,alpha){
  ctx.fillStyle='#1c1f14';
  ctx.strokeStyle='#1c1f14';
  ctx.globalAlpha=alpha!=null?alpha:(on?1:0.10);
}
function rrect(x,y,w,h,r){
  r=r==null?1.6:r;
  if(w<0){x+=w;w=-w}if(h<0){y+=h;h=-h}
  if(r>w/2)r=w/2;if(r>h/2)r=h/2;
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();ctx.fill();
}
function bar(x,y,w,h,on,a){ink(on,a);rrect(x,y,w,h,1.8)}

/* fuente LCD 5x7 */
var FONT={
  ' ':[0,0,0,0,0,0,0],
  A:[0x0E,0x11,0x11,0x1F,0x11,0x11,0x11],
  B:[0x1E,0x11,0x11,0x1E,0x11,0x11,0x1E],
  C:[0x0E,0x11,0x10,0x10,0x10,0x11,0x0E],
  D:[0x1E,0x11,0x11,0x11,0x11,0x11,0x1E],
  E:[0x1F,0x10,0x10,0x1E,0x10,0x10,0x1F],
  F:[0x1F,0x10,0x10,0x1E,0x10,0x10,0x10],
  G:[0x0E,0x11,0x10,0x17,0x11,0x11,0x0E],
  H:[0x11,0x11,0x11,0x1F,0x11,0x11,0x11],
  I:[0x0E,0x04,0x04,0x04,0x04,0x04,0x0E],
  J:[0x07,0x02,0x02,0x02,0x02,0x12,0x0C],
  K:[0x11,0x12,0x14,0x18,0x14,0x12,0x11],
  L:[0x10,0x10,0x10,0x10,0x10,0x10,0x1F],
  M:[0x11,0x1B,0x15,0x15,0x11,0x11,0x11],
  N:[0x11,0x19,0x15,0x13,0x11,0x11,0x11],
  O:[0x0E,0x11,0x11,0x11,0x11,0x11,0x0E],
  P:[0x1E,0x11,0x11,0x1E,0x10,0x10,0x10],
  Q:[0x0E,0x11,0x11,0x11,0x15,0x12,0x0D],
  R:[0x1E,0x11,0x11,0x1E,0x14,0x12,0x11],
  S:[0x0E,0x11,0x10,0x0E,0x01,0x11,0x0E],
  T:[0x1F,0x04,0x04,0x04,0x04,0x04,0x04],
  U:[0x11,0x11,0x11,0x11,0x11,0x11,0x0E],
  V:[0x11,0x11,0x11,0x11,0x11,0x0A,0x04],
  W:[0x11,0x11,0x11,0x15,0x15,0x1B,0x11],
  X:[0x11,0x11,0x0A,0x04,0x0A,0x11,0x11],
  Y:[0x11,0x11,0x0A,0x04,0x04,0x04,0x04],
  Z:[0x1F,0x01,0x02,0x04,0x08,0x10,0x1F],
  '0':[0x0E,0x11,0x13,0x15,0x19,0x11,0x0E],
  '1':[0x04,0x0C,0x04,0x04,0x04,0x04,0x0E],
  '2':[0x0E,0x11,0x01,0x06,0x08,0x10,0x1F],
  '3':[0x0E,0x11,0x01,0x06,0x01,0x11,0x0E],
  '4':[0x02,0x06,0x0A,0x12,0x1F,0x02,0x02],
  '5':[0x1F,0x10,0x1E,0x01,0x01,0x11,0x0E],
  '6':[0x06,0x08,0x10,0x1E,0x11,0x11,0x0E],
  '7':[0x1F,0x01,0x02,0x04,0x08,0x08,0x08],
  '8':[0x0E,0x11,0x11,0x0E,0x11,0x11,0x0E],
  '9':[0x0E,0x11,0x11,0x0F,0x01,0x02,0x0C],
  '+':[0x00,0x04,0x04,0x1F,0x04,0x04,0x00],
  '-':[0x00,0x00,0x00,0x1F,0x00,0x00,0x00],
  '!':[0x04,0x04,0x04,0x04,0x04,0x00,0x04],
  '.':[0x00,0x00,0x00,0x00,0x00,0x00,0x04],
  ':':[0x00,0x04,0x00,0x00,0x00,0x04,0x00],
  'Ñ':[0x0A,0x00,0x11,0x19,0x15,0x13,0x11]
};
function glyph(ch){
  ch=String(ch).toUpperCase();
  if(ch==='Á'||ch==='À')ch='A';
  if(ch==='É'||ch==='È')ch='E';
  if(ch==='Í'||ch==='Ì')ch='I';
  if(ch==='Ó'||ch==='Ò')ch='O';
  if(ch==='Ú'||ch==='Ù')ch='U';
  if(ch==='Ü')ch='U';
  return FONT[ch]||FONT[' '];
}
function drawText(x,y,str,px,on,gap){
  px=px||2;gap=gap==null?1:gap;
  str=String(str);
  var cx=x;
  for(var i=0;i<str.length;i++){
    var rows=glyph(str[i]);
    for(var r=0;r<7;r++){
      for(var c=0;c<5;c++){
        if(rows[r]&(1<<(4-c))) {ink(on);rrect(cx+c*px,y+r*px,px,px,0.4)}
      }
    }
    cx+=5*px+gap;
  }
  return cx;
}
function textWidth(str,px,gap){px=px||2;gap=gap==null?1:gap;return String(str).length*(5*px+gap)-gap}

function digit(x,y,n,on,s){
  s=s||1;
  var w=12*s,h=22*s,t=2.3*s;
  var patterns={
    0:[1,1,1,1,1,1,0],1:[0,1,1,0,0,0,0],2:[1,1,0,1,1,0,1],3:[1,1,1,1,0,0,1],
    4:[0,1,1,0,0,1,1],5:[1,0,1,1,0,1,1],6:[1,0,1,1,1,1,1],7:[1,1,1,0,0,0,0],
    8:[1,1,1,1,1,1,1],9:[1,1,1,1,0,1,1],'-':[0,0,0,0,0,0,1],' ':[0,0,0,0,0,0,0]
  };
  var p=patterns[n];if(!p)p=patterns[' '];
  var unlit=0.055;
  function seg(lit,sx,sy,sw,sh){ink(!!lit, lit&&on?1:unlit);rrect(x+sx,y+sy,sw,sh,t/2)}
  if(n===' '||n===''){
    /* leading blank: almost invisible ghost 8, so "0" does not read as "8880" */
    unlit=0.035;
    p=patterns[8];
  }
  seg(p[0],t,0,w-2*t,t);             /* A */
  seg(p[1],w-t,t,t,h/2-t);           /* B */
  seg(p[2],w-t,h/2,t,h/2-t);         /* C */
  seg(p[3],t,h-t,w-2*t,t);           /* D */
  seg(p[4],0,h/2,t,h/2-t);           /* E */
  seg(p[5],0,t,t,h/2-t);             /* F */
  seg(p[6],t,h/2-t/2,w-2*t,t);       /* G */
}
function digits(x,y,val,places,on,s){
  var str=String(Math.max(0,val|0));
  while(str.length<places)str=' '+str;
  if(str.length>places)str=str.slice(-places);
  var gap=5*(s||1);
  var w=12*(s||1)+gap;
  for(var i=0;i<places;i++){
    if(str[i]===' ') continue; /* no pintar un 8 fantasma delante: si no, 100 se lee 8100 */
    digit(x+i*w,y,str[i],on,s);
  }
}

function colX(c){return 8+c*((W-16)/COLS)}
function laneY(l){return 102+l*90}
function cellW(){return (W-16)/COLS}
function cellH(){return 90}
function cellCX(c){return colX(c)+cellW()/2}
function cellCY(l){return laneY(l)+46}

/* --- sprites de segmentos --- */
function drawThief(cx,cy,on,frame){
  var x=cx-16,y=cy-28;
  var f=frame&1;
  /* boina */
  bar(x+7,y+0,22,5,on);
  bar(x+5,y+3,16,4,on);
  /* cabeza */
  bar(x+9,y+7,14,10,on);
  /* antifaz */
  bar(x+8,y+10,16,3.5,on);
  /* nariz */
  bar(x+21,y+12,4,3,on);
  /* gabardina */
  bar(x+7,y+17,18,16,on);
  /* saco */
  bar(x-4,y+15,12,13,on);
  bar(x-2,y+13,8,4,on);
  /* brazo */
  bar(x+23,y+20,8,4,on);
  /* piernas */
  if(f){
    bar(x+9,y+33,5,15,on);
    bar(x+18,y+33,5,11,on);
    bar(x+18,y+42,8,4,on);
    bar(x+5,y+44,8,4,on);
  }else{
    bar(x+9,y+33,5,11,on);
    bar(x+18,y+33,5,15,on);
    bar(x+9,y+42,8,4,on);
    bar(x+18,y+44,8,4,on);
  }
}
function drawDog(cx,cy,on,frame){
  var x=cx-22,y=cy-10;
  var f=frame&1;
  /* cola */
  bar(x-2,y+8,8,4,on);
  /* cuerpo */
  bar(x+4,y+10,22,11,on);
  /* oreja y cabeza */
  bar(x+20,y+0,6,8,on);
  bar(x+20,y+6,16,10,on);
  bar(x+34,y+10,7,4,on); /* hocico */
  /* patas */
  bar(x+6,y+21,4,f?11:9,on);
  bar(x+14,y+21,4,f?9:11,on);
  bar(x+22,y+21,4,f?11:9,on);
  bar(x+28,y+16,4,f?9:11,on);
}
function drawCop(cx,cy,on,frame){
  var x=cx-15,y=cy-30;
  var f=frame&1;
  /* gorra de plato */
  bar(x+1,y+4,28,4,on);
  bar(x+6,y+0,18,6,on);
  bar(x+12,y+1,6,4,on); /* chapa */
  /* cabeza */
  bar(x+8,y+8,15,10,on);
  /* tronco y placa */
  bar(x+6,y+18,19,16,on);
  bar(x+13,y+20,6,6,on);
  /* porra */
  bar(x+25,y+16,4,18,on);
  /* piernas */
  if(f){
    bar(x+8,y+34,6,15,on);
    bar(x+17,y+34,6,11,on);
  }else{
    bar(x+8,y+34,6,11,on);
    bar(x+17,y+34,6,15,on);
  }
}

/* scenery segments — roofs/sky above the lanes, ground below them */
function drawLamp(x,y,on){
  bar(x+8,y,4,40,on);
  bar(x,y,20,6,on);
  bar(x+4,y+6,12,5,on);
}
function drawCar(x,y,on){
  bar(x+6,y+4,34,9,on);
  bar(x,y+10,46,9,on);
  bar(x+6,y+18,10,5,on);
  bar(x+30,y+18,10,5,on);
}
function drawTree(x,y,on){
  bar(x+10,y+18,6,22,on);
  bar(x+2,y+4,22,16,on);
  bar(x+6,y,14,7,on);
}
function drawChalet(x,y,on){
  ink(on);
  ctx.beginPath();
  ctx.moveTo(x+22,y);
  ctx.lineTo(x+46,y+16);
  ctx.lineTo(x,y+16);
  ctx.closePath();ctx.fill();
  bar(x+30,y+2,6,14,on);
  bar(x+4,y+16,40,22,on);
  bar(x+10,y+20,10,8,on);
  bar(x+26,y+24,12,14,on);
}
function drawFence(x,y,w,on){
  bar(x,y+7,w,3,on);
  for(var i=0;i<w;i+=8) bar(x+i,y,3,14,on);
}
function drawDoor(x,y,on,open){
  bar(x+2,y,34,6,on);
  bar(x,y+6,6,70,on);
  bar(x+32,y+6,6,70,on);
  bar(x,y+76,38,5,on);
  if(!open){
    bar(x+8,y+8,22,66,on);
    bar(x+22,y+36,5,5,on);
  }else{
    bar(x+8,y+8,7,66,on);
  }
}
function drawLoot(x,y,on){
  bar(x+8,y+8,24,16,on);
  bar(x+14,y+2,12,8,on);
  bar(x,y+22,10,7,on);
  bar(x+30,y+24,10,7,on);
  bar(x+6,y+28,28,14,on);
  bar(x+16,y+32,8,7,on);
}
function drawMiniLife(x,y,on){
  bar(x+4,y,9,3,on);
  bar(x+5,y+3,7,5,on);
  bar(x+4,y+8,9,7,on);
  bar(x+5,y+15,3,5,on);
  bar(x+9,y+15,3,5,on);
}

function drawZonesGhostAndLit(){
  /* suelo */
  bar(6,H-24,W-12,5,true);
  /* divisores de columna, muy suaves */
  for(var i=1;i<COLS;i++){
    ink(false,0.08);
    rrect(colX(i)-1,76,2,H-108,0);
  }
  /* luna (calle, cielo) */
  ink(true);rrect(18,80,14,14,7);
  ctx.globalAlpha=1;ctx.fillStyle='#9aa873';rrect(24,78,14,14,7);
  /* farola a la izquierda de la calle, en la franja alta + palo fino */
  drawLamp(colX(0)+6,80,true);
  /* techos de chalets en la franja alta (no tapan a los personajes) */
  ink(true);
  ctx.beginPath();ctx.moveTo(colX(1)+20,80);ctx.lineTo(colX(1)+48,96);ctx.lineTo(colX(1)+2,96);ctx.closePath();ctx.fill();
  bar(colX(1)+34,80,6,16,true);
  ink(true);
  ctx.beginPath();ctx.moveTo(colX(2)+24,78);ctx.lineTo(colX(2)+54,96);ctx.lineTo(colX(2)+4,96);ctx.closePath();ctx.fill();
  bar(colX(2)+38,78,6,18,true);
  /* luces del pasillo, solo arriba */
  bar(colX(3),78,cellW()*3,5,true);
  for(var k=0;k<3;k++){
    bar(colX(3+k)+cellW()/2-3,83,6,10,true);
    bar(colX(3+k)+cellW()/2-10,93,20,4,true);
  }
  /* frontón de la casa */
  bar(colX(6)+8,78,cellW()*2-16,5,true);
  ink(true);
  ctx.beginPath();ctx.moveTo(colX(6)+cellW(),76);ctx.lineTo(colX(7)+cellW()-8,96);ctx.lineTo(colX(6)+8,96);ctx.closePath();ctx.fill();

  /* suelo: coche, árboles, valla, fachadas bajas, puerta, botín */
  drawCar(colX(0)+22,H-58,true);
  drawTree(colX(1)+4,H-86,true);
  drawFence(colX(1)+22,H-44,cellW()*2-28,true);
  drawChalet(colX(1)+28,H-86,true);
  drawChalet(colX(2)+20,H-92,true);
  var open=G.status==='loot'||(G.status==='play'&&G.col>=6);
  drawDoor(colX(6)+cellW()-22,200,true,open);
  drawLoot(colX(7)+22,H-92,G.status==='loot'||(G.status==='play'&&G.col===7));
}

function drawAllGhosts(){
  var c,l,x,y;
  var dogCol={2:1,3:1,5:1};
  var copCol={1:1,4:1,6:1};
  for(c=0;c<COLS;c++){
    for(l=0;l<LANES;l++){
      x=cellCX(c);y=cellCY(l);
      drawThief(x-4,y,false,0);
      if(dogCol[c]) drawDog(x+8,y+8,false,0);
      if(copCol[c]) drawCop(x+6,y,false,0);
    }
  }
}

function drawHUD(){
  ink(false,0.06);rrect(6,6,W-12,52,4);
  drawText(14,12,t('pts'),2.4,true,1);
  digits(14,24,G.status==='attract'?0:G.score,4,true,1.15);
  drawText(130,12,t('hi'),2.4,true,1);
  digits(130,24,hi,4,true,1.15);
  drawText(250,12,t('lives'),2.4,true,1);
  var lives=G.status==='attract'?MAX_LIVES:G.lives;
  for(var i=0;i<MAX_LIVES;i++) drawMiniLife(250+i*22,26,i<lives);
  drawText(380,12,t('moves'),2.4,true,1);
  digits(380,24,G.status==='attract'?MAX_MOVES:G.moves,3,true,1.15);
  drawText(520,12,'NV',2.4,true,1);
  digits(520,24,G.status==='attract'?1:G.level,2,true,1.15);

  var zones=[[0,2,t('zone0')],[2,3,t('zone1')],[3,6,t('zone2')],[6,8,t('zone3')]];
  for(var z=0;z<zones.length;z++){
    var x=colX(zones[z][0])+8, mid=(colX(zones[z][1])-x);
    var lab=zones[z][2];
    var tw=textWidth(lab,2,1);
    drawText(x+Math.max(0,(mid-tw)/2-8),68,lab,2,true,1);
  }
}

function drawMessage(){
  var msg=G.msg;
  if(!msg){
    if(G.status==='attract') msg=t('mReady');
    else return;
  }
  var blink=(G.status==='attract')?((performance.now()/400|0)%2===0):true;
  if(!blink&&G.status==='attract')return;
  var px=5,gap=3;
  var tw=textWidth(msg,px,gap);
  var x=(W-tw)/2,y=208;
  ink(true,0.75);rrect(x-18,y-14,tw+36,7*px+28,6);
  ctx.globalAlpha=1;
  ctx.fillStyle='#6f7d52';
  rrect(x-16,y-12,tw+32,7*px+24,5);
  drawText(x,y,msg,px,true,gap);
}

function render(){
  if(!ctx)return;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.globalAlpha=1;
  ctx.fillStyle='#9aa873';
  ctx.fillRect(0,0,W,H);
  /* leve viñeta LCD */
  var g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'rgba(255,255,255,0.08)');
  g.addColorStop(0.5,'rgba(0,0,0,0)');
  g.addColorStop(1,'rgba(0,0,0,0.08)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

  drawHUD();
  drawZonesGhostAndLit();
  drawAllGhosts();

  var frame=(G.walk+G.tick)&1;
  /* enemigos activos */
  var list=G.enemies;
  for(var i=0;i<list.length;i++){
    var e=list[i];
    var x=colX(e.col)+cellW()/2;
    var y=laneY(e.lane)+56;
    if(e.type==='dog')drawDog(x,y+4,true,frame);
    else drawCop(x,y,true,frame);
  }
  /* ladrón activo (parpadea si atrapado) */
  var show=true;
  if(G.status==='caught')show=((performance.now()/90|0)%2)===0;
  if(show){
    var x=colX(G.col)+cellW()/2;
    var y=laneY(G.lane)+56;
    drawThief(x,y,true,frame);
  }
  drawMessage();
}

function loop(ts){
  if(!now0)now0=ts;
  render();
  raf=requestAnimationFrame(loop);
}

function fitCanvas(){
  if(!canvas)return;
  dpr=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.round(W*dpr);
  canvas.height=Math.round(H*dpr);
  ctx=canvas.getContext('2d');
  render();
}

/* ---------- entrada ---------- */
function onMove(dir,ev){
  if(ev){ev.preventDefault()}
  move(dir);
}
function bindPad(el,dir){
  if(!el)return;
  el.addEventListener('pointerdown',function(e){
    e.preventDefault();
    try{el.setPointerCapture(e.pointerId)}catch(ex){}
    onMove(dir,e);
  });
}

/* ---------- API de prueba ---------- */
function publicState(){
  return {
    status:G.status,
    col:G.col,lane:G.lane,
    lives:G.lives,moves:G.moves,
    score:G.score,hi:hi,level:G.level,tick:G.tick,tickMs:G.tickMs,
    enemies:G.enemies.map(function(e){return {type:e.type,col:e.col,lane:e.lane}}),
    msg:G.msg,lang:lang,muted:muted,uses:uses,
    overReason:G.overReason
  };
}

window.Ladron={
  start:function(){startGame();return publicState()},
  move:function(dir){return move(dir)},
  state:function(){return publicState()},
  tick:function(){enemyTick();return publicState()},
  freeze:function(on){G.freeze=!!on;if(G.freeze)clearTimer();else schedule();return publicState()},
  setMuted:function(on){muted=!!on;save(STORE_MUTE,muted?'1':'0');applyLang();return publicState()},
  setLang:function(l){lang=l==='en'?'en':'es';save(STORE_LANG,lang);applyLang();if(G.status==='attract'&&!G.msg){};return publicState()},
  setTickMs:function(ms){G.tickMs=Math.max(0,ms|0);if(!G.freeze&&G.status==='play')schedule();return publicState()},
  debug:function(partial){
    if(!partial)return publicState();
    if(partial.col!=null)G.col=partial.col;
    if(partial.lane!=null)G.lane=partial.lane;
    if(partial.lives!=null)G.lives=partial.lives;
    if(partial.moves!=null)G.moves=partial.moves;
    if(partial.score!=null)G.score=partial.score;
    if(partial.level!=null){G.level=partial.level;G.tickMs=tickMsFor(G.level);G.enemies=buildEnemies(G.level,G.tick)}
    if(partial.status)G.status=partial.status;
    if(partial.tick!=null){G.tick=partial.tick;G.enemies=buildEnemies(G.status==='attract'?1:G.level,G.tick)}
    return publicState();
  }
};

/* ---------- arranque ---------- */
function loadVisits(){
  var el=$('#cVisits');if(!el)return;
  if(!/^https?:$/.test(location.protocol)||/^(localhost|127\.|192\.168\.)/.test(location.hostname)){el.textContent=t('na');return}
  fetch('https://osnews-may.goatcounter.com/counter/'+encodeURIComponent(location.pathname)+'.json')
    .then(function(r){if(!r.ok)throw 0;return r.json()})
    .then(function(j){el.textContent=j.count||t('na')})
    .catch(function(){el.textContent=t('na')});
}

function init(){
  canvas=$('#lcd');
  fitCanvas();
  applyLang();
  var cu=$('#cUses');if(cu)cu.textContent=String(uses);
  loadVisits();
  bindPad($('#btnUp'),'up');
  bindPad($('#btnDown'),'down');
  bindPad($('#btnLeft'),'left');
  bindPad($('#btnRight'),'right');
  $('#startBtn').addEventListener('click',function(e){e.preventDefault();startGame()});
  $('#langBtn').addEventListener('click',function(){
    lang=lang==='es'?'en':'es';save(STORE_LANG,lang);applyLang();
    gc('ladron-idioma-'+lang,'El Ladrón · idioma '+lang);
  });
  $('#muteBtn').addEventListener('click',function(){
    muted=!muted;save(STORE_MUTE,muted?'1':'0');applyLang();
    if(!muted)sndMove();
  });
  window.addEventListener('keydown',function(e){
    if(e.repeat)return;
    var k=e.key;
    if(k==='ArrowUp'){onMove('up',e)}
    else if(k==='ArrowDown'){onMove('down',e)}
    else if(k==='ArrowLeft'){onMove('left',e)}
    else if(k==='ArrowRight'){onMove('right',e)}
    else if(k==='Enter'||k===' '||k==='Spacebar'){
      if(G.status==='attract'||G.status==='over'){e.preventDefault();startGame()}
    }
  });
  window.addEventListener('resize',fitCanvas);
  G.status='attract';
  G.enemies=buildEnemies(1,0);
  G.col=0;G.lane=1;
  demo.col=0;demo.lane=1;
  led(false);
  schedule();
  raf=requestAnimationFrame(loop);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
