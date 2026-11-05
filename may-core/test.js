const M=require('./core.js'),a=require('assert');
(async()=>{const e=M.encode('OSNEWS');a.equal(M.decode(e.map(x=>x.ma)),'OSNEWS');a.equal(M.charToMa('A'),32.5);a.equal(M.binToChar('01000001'),'A');
for(const t of['OSNEWS','Hola MAY 2026','Mar Menor']){const c=M.textToCells(t);a.equal(M.cellsToText(M.cameraRead(c.map(M.cellColor)),t.length),t,t);}
const L=await M.ledger([5000,500,1000,20000],0.10);a.equal(L.total,26500);a.equal(L.tax,2650);a.equal(L.chain.at(-1).importe,23850);
console.log('OK',L.chain.map(r=>r.hash).join(' '));})();
