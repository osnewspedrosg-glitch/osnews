// MAY Core · núcleo binario — port JS del prototipo (simulación educativa)
(function(root){
const UNIT_MA=0.5;
const byte=c=>c.charCodeAt(0)&0xFF;
const bin8=n=>n.toString(2).padStart(8,'0');
function charToMa(c){const b=byte(c);let s=0;for(let i=0;i<8;i++)if(b>>i&1)s+=UNIT_MA*(1<<i);return s;}
function maToChar(ma){return String.fromCharCode(Math.round(ma/UNIT_MA));}
function encode(t){return [...t].map(c=>({c,bin:bin8(byte(c)),ma:charToMa(c)}));}
function decode(mas){return mas.map(maToChar).join('');}
function binToChar(b){return String.fromCharCode(parseInt(b,2));}
const LAYERS=[['rojo',[255,0,0]],['azul',[0,0,255]],['amarillo',[255,255,0]]];
function textToCells(t){let bits=[...t].map(c=>bin8(byte(c))).join('');bits+='0'.repeat((3-bits.length%3)%3);const o=[];for(let i=0;i<bits.length;i+=3)o.push([+bits[i],+bits[i+1],+bits[i+2]]);return o;}
function cellColor(cell){const on=LAYERS.filter((_,i)=>cell[i]).map(l=>l[1]);if(!on.length)return[20,20,20];return[0,1,2].map(k=>Math.floor(on.reduce((s,c)=>s+c[k],0)/on.length));}
function cameraRead(colors){const tab=[];for(const a of[0,1])for(const b of[0,1])for(const c of[0,1])tab.push([cellColor([a,b,c]),[a,b,c]]);
 // como en Python (dict): colores repetidos -> gana la última combinación
 const m=new Map();tab.forEach(([col,cell])=>m.set(col.join(','),[col,cell]));const uniq=[...m.values()];
 return colors.map(col=>{let best=null,bd=1e18;for(const[t,cell]of uniq){const d=(t[0]-col[0])**2+(t[1]-col[1])**2+(t[2]-col[2])**2;if(d<bd){bd=d;best=cell;}}return best;});}
function cellsToText(cells,n){const bits=cells.flat().join('').slice(0,n*8);let s='';for(let i=0;i<bits.length;i+=8)s+=binToChar(bits.slice(i,i+8));return s;}
async function sha256hex(s){const c=(root.crypto&&root.crypto.subtle)?root.crypto:require('crypto').webcrypto;const h=await c.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function ledger(origins,taxRate=0.10,bank='Sabadell (simulado)',dest='Pedro Sánchez (destino)'){const chain=[];let prev='0'.repeat(16);
 async function rec(de,a,imp){const r={de,a,importe:imp,binario:Math.round(imp*100).toString(2),prev};prev=(await sha256hex(JSON.stringify(r))).slice(0,16);r.hash=prev;chain.push(r);}
 for(let i=0;i<origins.length;i++)await rec('origen '+(i+1),'beb hub',origins[i]);
 const total=origins.reduce((a,b)=>a+b,0);await rec('beb hub',bank,total);const tax=Math.round(total*taxRate*100)/100;
 await rec(bank,'Hacienda (simulada)',total);await rec('Hacienda (simulada)',dest,Math.round((total-tax)*100)/100);return{chain,total,tax};}
async function payment(amount,holder='TITULAR DEMO',bank='BANCO DEMO'){return{titular:holder,banco:bank,importe:amount+' €',tarjeta:'**** **** **** 0000 (token)',token:'tok_'+(await sha256hex(holder+amount)).slice(0,12),estado:'OK'};}
const api={UNIT_MA,charToMa,maToChar,encode,decode,binToChar,bin8,LAYERS,textToCells,cellColor,cameraRead,cellsToText,ledger,payment,sha256hex};
if(typeof module!=='undefined')module.exports=api;else root.MayCore=api;
})(typeof window!=='undefined'?window:globalThis);
