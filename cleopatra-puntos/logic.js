// Lógica de Cleopatra Puntos (solo puntos, sin dinero). Usable en navegador y node.
(function(root){
const SYM={cereza:'🍒',limon:'🍋',fresa:'🍓',melon:'🍈',sandia:'🍉',platano:'🍌',kiwi:'🥝',bronce:'🥉',plata:'🥈',oro:'🥇',piramide:'🔺',cleo:'👑'};
const FILL=['limon','fresa','melon','sandia','platano','kiwi','bronce','plata'];
// Tabla de premios (multiplicador de la apuesta) con la escalera de los apuntes
const PAY=[
 {id:'c1',m:0.2,p:0.16,txt:'1 cereza'},{id:'c2',m:0.4,p:0.09,txt:'2 cerezas'},
 {id:'li',m:1,p:0.07,txt:'3 limones'},{id:'fr',m:2,p:0.045,txt:'3 fresas'},
 {id:'c3',m:3,p:0.03,txt:'3 cerezas'},{id:'me',m:5,p:0.02,txt:'3 melones'},
 {id:'sa',m:10,p:0.009,txt:'3 sandías'},{id:'pl',m:20,p:0.004,txt:'3 plátanos'},
 {id:'ki',m:40,p:0.0018,txt:'3 kiwis'},{id:'br',m:50,p:0.0012,txt:'3 barras bronce'},
 {id:'pt',m:80,p:0.0007,txt:'3 barras plata'},{id:'go',m:100,p:0.0005,txt:'3 barras oro'},
 {id:'mx',m:150,p:0.0003,txt:'oro·plata·bronce'},{id:'py',m:0,p:0.006,txt:'3 pirámides → BONUS'},
 {id:'k2',m:200,p:0.00015,txt:'2 Cleopatras + oro'},{id:'k3',m:350,p:0.00008,txt:'3 Cleopatras'}];
const LADDER=[0.2,0.4,1,2,3,5,10,20,40,50,80,100,150,200,350,700,1500];
const PYR=[1,2,3,5,10,20,40,80,150,350,700]; // pirámide, de abajo arriba
const RTP=0.75;
function pick(a,r){return a[Math.floor(r()*a.length)]}
function reelsFor(id,r){
 const map={li:['limon','limon','limon'],fr:['fresa','fresa','fresa'],c3:['cereza','cereza','cereza'],me:['melon','melon','melon'],sa:['sandia','sandia','sandia'],pl:['platano','platano','platano'],ki:['kiwi','kiwi','kiwi'],br:['bronce','bronce','bronce'],pt:['plata','plata','plata'],go:['oro','oro','oro'],mx:['oro','plata','bronce'],py:['piramide','piramide','piramide'],k2:['cleo','cleo','oro'],k3:['cleo','cleo','cleo']};
 if(map[id])return map[id].slice();
 let a,b,c;do{a=pick(FILL,r);b=pick(FILL,r);c=pick(FILL,r)}while(a===b&&b===c);
 if(id==='c1')a='cereza'; else if(id==='c2'){a='cereza';b='cereza'}
 return [a,b,c];
}
class Machine{
 constructor(r=Math.random){this.r=r;this.bank=0;this.played=0;this.paid=0}
 // banco de puntos: se llena con el 75% de lo jugado y solo suelta lo que tiene
 pay(v){v=Math.round(v*100)/100;if(v>this.bank+1e-9)return 0;this.bank-=v;this.paid+=v;return v}
 spin(bet){
  this.played+=bet;this.bank+=bet*RTP;
  let x=this.r(),o=null;for(const p of PAY){if(x<p.p){o=p;break}x-=p.p}
  if(o&&o.m>0&&o.m*bet>this.bank)o=null; // el banco no llega: sin premio
  const id=o?o.id:'none',reels=reelsFor(id,this.r);
  const win=o&&o.m>0?this.pay(o.m*bet):0;
  // pantalla superior 2x2 (Cleopatra): 4 iguales → laberinto/oca
  let top=[0,0,0,0].map(()=>pick(FILL,this.r));
  const oca=this.r()<0.004; if(oca){const f=pick(FILL,this.r);top=[f,f,f,f]}
  return {reels,top,win,txt:o?o.txt:'',bonus:id==='py',oca,bet};
 }
 // Pirámide: premio programado = el mayor nivel que el banco permite (al azar entre los posibles)
 pyramidProgram(bet){const ok=PYR.map((v,i)=>i).filter(i=>PYR[i]*bet<=this.bank);return ok.length?ok[Math.floor(this.r()*ok.length)]:-1}
 // caso A: se para en el premio programado; caso B: se para donde pulsa el jugador (limitado al banco)
 pyramidStop(bet,prog,playerLevel){
  const programmed=this.r()<0.5;let lvl=programmed?prog:playerLevel;
  while(lvl>=0&&PYR[lvl]*bet>this.bank)lvl--;
  return {level:lvl,programmed,win:lvl>=0?this.pay(PYR[lvl]*bet):0};
 }
 // Laberinto / juego de la oca: 3 tiradas de dado en tablero de 20 casillas
 ocaBoard(){const b=[];for(let i=0;i<20;i++)b.push(i%5===4?'oca':[0,1,2,3,5][i%5]);b[19]=20;return b}
 ocaPlay(bet){const B=this.ocaBoard();let pos=-1,tot=0,steps=[];
  for(let t=0;t<3;t++){const d=1+Math.floor(this.r()*6);pos=Math.min(19,pos+d);
   if(B[pos]==='oca'){pos=Math.min(19,pos+5)} const v=B[pos]==='oca'?5:B[pos];
   const w=this.pay(v*bet);tot+=w;steps.push({d,pos,w})}
  return {steps,win:tot,board:B}}
}
const api={SYM,PAY,LADDER,PYR,RTP,Machine};
if(typeof module!=='undefined')module.exports=api;else root.CP=api;
})(this);
