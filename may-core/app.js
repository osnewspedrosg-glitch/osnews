const M=window.MayCore,$=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function draw(cv,cells,fn){const cols=8,s=20,rows=Math.max(1,Math.ceil(cells.length/cols));cv.width=cols*s;cv.height=rows*s;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);
 cells.forEach((c,i)=>{const col=fn(c);x.fillStyle=`rgb(${col})`;x.fillRect((i%cols)*s,Math.floor(i/cols)*s,s-2,s-2);});}
function A(){const t=$('aText').value,cells=M.textToCells(t);[['cR',0],['cB',1],['cY',2]].forEach(([id,k])=>draw($(id),cells,c=>c[k]?M.LAYERS[k][1]:[20,20,20]));
 draw($('cM'),cells,M.cellColor);const read=M.cameraRead(cells.map(M.cellColor));$('aRead').textContent=M.cellsToText(read,t.length);$('aInfo').textContent=`(${cells.length} celdas)`;}
function B(){$('bTab').innerHTML='<tr><th>Letra</th><th>Binario</th><th>mA</th></tr>'+M.encode($('bText').value).map(e=>`<tr><td>${esc(e.c)}</td><td>${e.bin}</td><td>${e.ma.toFixed(1)}</td></tr>`).join('');
 $('bMaOut').textContent=M.decode($('bMa').value.trim().split(/[\s,;]+/).filter(Boolean).map(Number).filter(n=>!isNaN(n)));
 $('bBinOut').textContent=$('bBin').value.trim().split(/\s+/).filter(b=>/^[01]{1,8}$/.test(b)).map(M.binToChar).join('');}
async function C(){const o=$('cOr').value.split(/[,;\s]+/).map(Number).filter(n=>n>0),tx=(+$('cTax').value||0)/100;const L=await M.ledger(o,tx);
 $('cSum').innerHTML=`Total: <b>${L.total} €</b> · Retención de ejemplo: <b>${L.tax} €</b> · A destino: <b>${(L.total-L.tax).toFixed(2)} €</b>`;
 $('cTab').innerHTML='<tr><th>De</th><th>A</th><th>€</th><th>Binario (céntimos)</th><th>prev</th><th>hash</th></tr>'+L.chain.map(r=>`<tr><td>${r.de}</td><td>${r.a}</td><td>${r.importe}</td><td>${r.binario}</td><td>${r.prev}</td><td>${r.hash}</td></tr>`).join('');}
async function D(){const p=await M.payment(+$('dAmt').value||90);const card=`Titular: ${p.titular}<br>Banco: ${p.banco}<br>Tarjeta: ${p.tarjeta}<br>Importe: <b>${esc(p.importe)}</b>`;
 $('dPh').innerHTML=card+'<br>⏳ enviando…';$('dSh').innerHTML='esperando…';const w=$('dWave');w.classList.remove('on');void w.offsetWidth;w.classList.add('on');
 setTimeout(()=>{$('dPh').innerHTML=card+'<div class="ok">✔ OK</div>';$('dSh').innerHTML=card+`<br>Token: <code>${p.token}</code><div class="ok">✔ OK</div>`;},1800);}
const KB=[[/chip|water|mosaico|capa|color|c[aá]mara/i,'El chip water guarda el texto en 3 capas de color: rojo, azul y amarillo. Cada letra se convierte en 8 bits y se agrupan de 3 en 3; cada bit enciende una capa. La cámara mira el color de cada celda y deduce qué capas están encendidas, y así vuelve a montar el texto.'],
[/binari|bit|ma\b|miliamp|letra|corriente/i,'Cada bit vale una corriente: el bit i pesa 0,5·2^i mA. Si sumas los bits encendidos sale un valor único en mA, y al dividir entre 0,5 recuperas el byte y la letra. Por ejemplo, «A» = 01000001 = 32,5 mA.'],
[/dinero|ledger|libro|sabadell|hacienda|beb|hash|banco/i,'El libro mayor simulado suma los orígenes de ejemplo (5000, 500, 1000, 20000 €), los pasa por beb y Sabadell, aplica en Hacienda una retención de ejemplo que puedes cambiar y manda el resto al destino. Cada registro guarda el hash del anterior, así que si alguien cambia uno se rompe la cadena. No conecta con ningún banco real.'],
[/pago|m[oó]vil|tienda|tarjeta|token|90/i,'En el pago móvil, el teléfono no envía el número de tarjeta: envía un token de un solo uso, y la tienda solo ve el token y el OK. En la vida real esto funciona con tokenización, EMV y SCA (PSD2). Esta demo es solo un concepto.'],
[/qui[eé]n|cre[oó]|autor|pedro/i,'Me creó Pedro Sánchez Gómez, del Mar Menor, con la ayuda de Copilot y Grok. La idea original sale de sus apuntes a mano.']];
function say(t,c){const p=document.createElement('p');p.className=c;p.textContent=t;$('log').append(p);$('log').scrollTop=1e9;}
function ask(){const q=$('q').value.trim();if(!q)return;say('Tú: '+q,'u');$('q').value='';const h=KB.find(([r])=>r.test(q));say('MAY: '+(h?h[1]:'Puedo explicarte cuatro módulos: chip water, binario→mA, dinero digital y pago móvil. Pregúntame por cualquiera de ellos.'),'m');}
$('aText').oninput=A;['bText','bMa','bBin'].forEach(i=>$(i).oninput=B);['cOr','cTax'].forEach(i=>$(i).oninput=C);$('dGo').onclick=D;$('send').onclick=ask;$('q').onkeydown=e=>{if(e.key==='Enter')ask();};
A();B();C();say('MAY: Hola, soy MAY. Pregúntame por cualquier módulo de MAY Core.','m');
