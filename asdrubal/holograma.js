/* OSNews · Modo holograma (HOLOGRAMA_V1) · efecto visual simulado, no es un holograma real.
   Pedro Sánchez Gómez (Mar Menor) con Copilot y Grok · OSNews. Sin dependencias, coste cero. */
(function(){
var S=document.currentScript,cfg={name:S.dataset.name||'MAY',img:S.dataset.img,after:S.dataset.after,form:S.dataset.form,input:S.dataset.input,mic:S.dataset.mic,log:S.dataset.log,bot:S.dataset.bot,speakEl:S.dataset.speaking,theme:S.dataset.theme||'cian'};
var $=function(i){return document.getElementById(i)};
var css=document.createElement('style');css.textContent=
'.holo-btn{font:inherit;cursor:pointer;border-radius:10px;padding:6px 12px;margin:4px;border:1px solid var(--hc);background:#000a;color:#fff;box-shadow:0 0 10px var(--hc)}'+
'.holo-btn,#holoOv{--hc:#3fe0ff;--hc2:#2a7bff}.holo-violeta,#holoOv.holo-violeta{--hc:#d36bff;--hc2:#ff5fb4}'+
'#holoOv{position:fixed;inset:0;z-index:2147483000;background:#000;color:#fff;display:none;overflow:hidden;perspective:900px;font-family:system-ui,sans-serif;touch-action:manipulation}'+
'#holoOv.on{display:block}'+
'#holoOv .hstage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform-style:preserve-3d}'+
'#holoOv .hfig{position:relative;width:min(72vw,62vh);aspect-ratio:3/4;transform-style:preserve-3d;transition:transform .12s linear}'+
'#holoOv .hfig img{width:100%;height:100%;object-fit:cover;border-radius:46% 46% 18% 18%/38% 38% 12% 12%;opacity:.86;filter:saturate(.75) brightness(calc(1.05 + var(--lv,0)*.5)) drop-shadow(0 0 calc(14px + var(--lv,0)*40px) var(--hc));mix-blend-mode:screen;-webkit-mask-image:linear-gradient(#000 70%,transparent);mask-image:linear-gradient(#000 70%,transparent);animation:hflick 5s infinite}'+
'#holoOv .hfig:before{content:"";position:absolute;inset:-8%;border-radius:50%;background:radial-gradient(closest-side,var(--hc) 0,transparent 70%);opacity:calc(.18 + var(--lv,0)*.5);filter:blur(18px);transform:translateZ(-60px)}'+
'#holoOv .hfig:after{content:"";position:absolute;inset:0;border-radius:46% 46% 18% 18%/38% 38% 12% 12%;-webkit-mask-image:linear-gradient(#000 70%,transparent);mask-image:linear-gradient(#000 70%,transparent);pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.10) 0 1px,transparent 1px 4px);mix-blend-mode:overlay;animation:hscan 6s linear infinite}'+
'#holoOv .hbase{position:absolute;bottom:-6%;left:10%;right:10%;height:10%;border-radius:50%;background:radial-gradient(var(--hc2),transparent 70%);opacity:.55;filter:blur(6px);transform:rotateX(70deg) translateZ(-20px)}'+
'#holoOv .hscan{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.35) 0 2px,transparent 2px 4px)}'+
'#holoOv .hsub{position:absolute;left:4%;right:4%;bottom:118px;text-align:center;font-size:clamp(16px,4.6vw,24px);line-height:1.3;text-shadow:0 0 8px var(--hc),0 0 2px #000;max-height:30vh;overflow:hidden;pointer-events:none}'+
'#holoOv .hsub b{color:var(--hc)}'+
'#holoOv .hlab{position:absolute;top:max(10px,env(safe-area-inset-top));left:0;right:0;text-align:center;font-size:12px;opacity:.8;pointer-events:none}'+
'#holoOv .hcred{position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:10px;opacity:.55;pointer-events:none}'+
'#holoOv .hctl{position:absolute;left:3%;right:3%;bottom:24px;display:flex;gap:6px}'+
'#holoOv .hctl input{flex:1;min-width:0;background:#000c;color:#fff;border:1px solid var(--hc);border-radius:12px;padding:10px;font-size:16px}'+
'#holoOv .hctl button{background:#000c;color:#fff;border:1px solid var(--hc);border-radius:12px;padding:8px 12px;font-size:18px}'+
'#holoOv .hx{position:absolute;top:max(28px,env(safe-area-inset-top));right:10px;background:none;color:#fff;border:1px solid #fff5;border-radius:50%;width:38px;height:38px;font-size:18px}'+
'@keyframes hflick{0%,100%{opacity:.86}47%{opacity:.86}48%{opacity:.74}49%{opacity:.86}72%{opacity:.8}}'+
'@keyframes hscan{from{background-position:0 0}to{background-position:0 120px}}'+
'@media (prefers-reduced-motion:reduce){#holoOv .hfig img,#holoOv .hfig:after{animation:none}#holoOv .hfig{transition:none}}';
document.head.appendChild(css);
var violeta=cfg.theme==='violeta';
var btn=document.createElement('button');btn.type='button';btn.id='holoBtn';btn.className='holo-btn'+(violeta?' holo-violeta':'');btn.textContent='✨ Modo holograma';btn.title='Efecto visual simulado · no es un holograma real';
var anchor=$(cfg.after);if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(btn,anchor.nextSibling);else document.body.appendChild(btn);
var ov=document.createElement('div');ov.id='holoOv';if(violeta)ov.className='holo-violeta';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Modo holograma');
ov.innerHTML='<div class="hstage"><div class="hfig"><img alt="'+cfg.name+' (avatar, efecto holograma simulado)" src="'+cfg.img+'"><div class="hbase"></div></div></div><div class="hscan"></div>'+
'<div class="hlab">Efecto visual simulado · no es un holograma real · emociones simuladas</div><button type="button" class="hx hc" aria-label="Salir del modo holograma">✕</button>'+
'<div class="hsub" aria-live="polite"></div><form class="hctl hc" autocomplete="off"><input class="hc" placeholder="Habla con '+cfg.name+'…" aria-label="Mensaje para '+cfg.name+'"><button type="button" class="hm hc" aria-label="Micrófono">🎤</button><button class="hc" aria-label="Enviar">➤</button></form>'+
'<div class="hcred">'+cfg.name+' · Pedro Sánchez Gómez (Mar Menor) con Copilot y Grok · OSNews</div>';
document.body.appendChild(ov);
var fig=ov.querySelector('.hfig'),sub=ov.querySelector('.hsub'),on=false,lv=0,target=0,tx=0,ty=0,hasSensor=false,raf=0,t0=0,fakeEnd=0,curText='';
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function setSub(t,i){curText=t||'';if(i==null){sub.textContent=curText;return}var a=curText.slice(0,i),r=curText.slice(i),m=r.match(/^\S*/)[0];sub.innerHTML='';sub.append(a);var b=document.createElement('b');b.textContent=m;sub.append(b,r.slice(m.length))}
function speaking(){return target>0||(cfg.speakEl&&$(cfg.speakEl)&&$(cfg.speakEl).classList.contains('speaking'))}
/* Voz TTS web: escucha eventos sin pisar los manejadores existentes */
var SS=window.speechSynthesis;
if(SS&&SS.speak){var orig=SS.speak.bind(SS);try{SS.speak=function(u){try{if(u&&u.addEventListener){u.addEventListener('start',function(){target=.6;if(on)setSub(u.text)});u.addEventListener('boundary',function(e){target=1;if(on&&e.charIndex!=null)setSub(u.text,e.charIndex)});u.addEventListener('end',function(){target=0});u.addEventListener('error',function(){target=0})}else{target=.6;if(on)setSub(u&&u.text);fakeEnd=Date.now()+String(u&&u.text||'').length*65;var oe=u&&u.onend;if(u)u.onend=function(){target=0;fakeEnd=0;oe&&oe.apply(this,arguments)}}}catch(e){}return orig(u)}}catch(e){}}
/* Canto Web Audio: AnalyserNode enganchado al destino */
var an=null,buf=null;try{var AN=window.AudioNode&&AudioNode.prototype,oc=AN&&AN.connect;if(oc)AN.connect=function(d){try{if(d&&d.context&&d===d.context.destination&&!(this instanceof AnalyserNode)){var c=d.context;if(!c.__holoAn){c.__holoAn=c.createAnalyser();c.__holoAn.fftSize=256;oc.call(c.__holoAn,d)}an=c.__holoAn;buf=new Uint8Array(an.fftSize);oc.call(this,an)}}catch(e){}return oc.apply(this,arguments)}}catch(e){}
/* Subtítulo desde el chat (también cubre la voz nativa Android) */
var log=$(cfg.log);if(log&&window.MutationObserver)new MutationObserver(function(){var l=log.querySelectorAll(cfg.bot);var m=l[l.length-1];if(!m)return;var t=(m.innerText||m.textContent||'').trim();if(!t||/escribiendo|typing|…$/i.test(t)&&t.length<40||t===m.__holo)return;m.__holo=t;if(on){setSub(t);if(!speaking()){fakeEnd=Date.now()+Math.min(20000,600+t.length*55)}}}).observe(log,{childList:true,subtree:true,characterData:true});
function loop(ts){if(!on)return;raf=requestAnimationFrame(loop);var a=0;if(an&&buf){an.getByteTimeDomainData(buf);for(var i=0;i<buf.length;i++){var v=Math.abs(buf[i]-128);if(v>a)a=v}a=Math.min(1,a/40)}
 var sp=speaking()||fakeEnd>Date.now();var tg=Math.max(a,sp?(.45+.35*Math.abs(Math.sin(ts/140))):0);lv+=(tg-lv)*.15;ov.style.setProperty('--lv',lv.toFixed(3));
 var rx=ty,ry=tx;if(!hasSensor){var k=reduce?0:1;ry=Math.sin(ts/4000)*12*k;rx=Math.sin(ts/5300)*5*k}fig.style.transform='rotateX('+rx.toFixed(2)+'deg) rotateY('+ry.toFixed(2)+'deg) scale('+(1+lv*.03).toFixed(3)+')'}
function ori(e){if(e.gamma==null&&e.beta==null)return;hasSensor=true;var g=Math.max(-30,Math.min(30,e.gamma||0)),b=Math.max(-30,Math.min(30,(e.beta||0)-45));tx=g*.6;ty=-b*.4;if(reduce){tx*=.3;ty*=.3}}
function enter(){if(on)return;on=true;ov.classList.add('on');document.documentElement.style.overflow='hidden';setSub('Toca fuera de los controles, pulsa atrás o Esc para salir.');
 try{history.pushState({holo:1},'')}catch(e){}
 var el=document.documentElement,rf=el.requestFullscreen||el.webkitRequestFullscreen||el.webkitRequestFullScreen;try{var p=rf&&rf.call(el);p&&p.catch&&p.catch(function(){})}catch(e){}
 try{var so=screen.orientation;so&&so.unlock&&so.unlock()}catch(e){}
 try{var D=window.DeviceOrientationEvent;if(D&&typeof D.requestPermission==='function'){D.requestPermission().then(function(r){if(r==='granted')addEventListener('deviceorientation',ori)}).catch(function(){})}else if(D)addEventListener('deviceorientation',ori)}catch(e){}
 raf=requestAnimationFrame(loop)}
function exit(fromPop){if(!on)return;on=false;ov.classList.remove('on');document.documentElement.style.overflow='';cancelAnimationFrame(raf);removeEventListener('deviceorientation',ori);hasSensor=false;
 try{var fe=document.fullscreenElement||document.webkitFullscreenElement;if(fe){var x=document.exitFullscreen||document.webkitExitFullscreen;x&&x.call(document).catch&&x.call(document).catch(function(){})}}catch(e){}
 if(!fromPop&&history.state&&history.state.holo){try{history.back()}catch(e){}}}
window.__holoExit=function(){if(on){exit();return true}return false};window.__holoOn=function(){return on};
btn.addEventListener('click',enter);
ov.addEventListener('click',function(e){if(e.target.closest('.hc')&&!e.target.classList.contains('hx'))return;exit()});
addEventListener('popstate',function(){if(on)exit(true)});
addEventListener('keydown',function(e){if(e.key==='Escape'&&on)exit()});
function fsch(){if(on&&!(document.fullscreenElement||document.webkitFullscreenElement)&&ov.__wasFs)exit();ov.__wasFs=!!(document.fullscreenElement||document.webkitFullscreenElement)}
document.addEventListener('fullscreenchange',fsch);document.addEventListener('webkitfullscreenchange',fsch);
var hf=ov.querySelector('form'),hi=hf.querySelector('input');
hf.addEventListener('submit',function(e){e.preventDefault();var t=hi.value.trim();if(!t)return;var inp=$(cfg.input),f=$(cfg.form);if(!inp||!f)return;inp.value=t;hi.value='';setSub('Tú: '+t);
 if(f.requestSubmit)f.requestSubmit();else f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}))});
ov.querySelector('.hm').addEventListener('click',function(){var m=$(cfg.mic);if(m){m.click();setSub('🎤 Te escucho…')}else setSub('Micrófono no disponible en este navegador.')});
})();
