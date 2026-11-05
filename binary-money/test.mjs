import {createRequire} from 'module';const BM=createRequire(import.meta.url)('./core.js');
const s=BM.newState();let ok=0,n=0;const t=(c,m)=>{n++;if(c)ok++;console.log((c?'PASS ':'FAIL ')+m)};
for(const [f,a] of [['Empresa A',5000],['Empresa B',500],['Empresa C',1000],['Empresa D',20000]]) await BM.transfer(s,f,'Pedro',a,21);
t(s.accounts.Pedro===BM.cents(1000+26500*0.79),'Pedro neto = 1000+26500*0.79 = '+s.accounts.Pedro/100);
t(s.accounts.Hacienda===BM.cents(26500*0.21),'Hacienda 21% = '+s.accounts.Hacienda/100);
await BM.transfer(s,'Pedro','Tienda',90,0,{type:'phone-pay',token:BM.token()});
t(s.accounts.Tienda===BM.cents(590),'Pago móvil 90 € a Tienda');
try{await BM.transfer(s,'Tienda','Pedro',99999,0);t(false,'saldo insuficiente')}catch(e){t(true,'rechaza saldo insuficiente')}
t((await BM.verify(s)).ok,'cadena íntegra verifica OK ('+s.ledger.length+' registros)');
s.ledger[2].amount+=1;const v=await BM.verify(s);t(!v.ok&&v.at===2,'manipulación detectada en registro #'+v.at);
t(BM.toBin('A')==='01000001','binario');
const r=BM.newState();const cfg={basicPts:600,leisurePts:200,basics:{comida:300,internet:40,luz:60,agua:30,vivienda:170}};
for(let m=0;m<3;m++){const o=await BM.monthly(r,['Pedro','Tienda'],cfg);t(o.every(x=>x.ok),'mes '+(m+1)+': básicos cubiertos');}
try{await BM.spendLeisure(r,'Pedro',10000,'ocio');t(false,'x')}catch(e){t(true,'ocio no puede tocar básicos')}
await BM.tradeIn(r,'Pedro','phone','good',500);t(r.pts.Pedro.leisure===400,'trade-in: 600-(500-300)=400 pts ocio');
t(r.ledger.some(x=>x.type==='recycle'),'reciclaje registrado');t((await BM.verify(r)).ok,'cadena RVB OK');r.ledger[5].amount=1;t(!(await BM.verify(r)).ok,'manipulación RVB detectada');
const q=BM.newState();await BM.monthly(q,['Pedro'],cfg);BM.feedBank(q,2000);t(q.cbank===1500,'banco comunitario = 75% de 2000 = 1500');
const b0=q.pts.Pedro.basic;const c1=await BM.contribute(q,'Pedro','codigo',5,0.99);t(c1.step===16&&c1.prize===1500,'código 5★ + bonus → 1500 pts');
t(q.pts.Pedro.basic===b0&&q.pts.Pedro.leisure===1700,'premio solo a ocio; básicos intactos');const c2=await BM.contribute(q,'Pedro','idea',3,0);t(c2.prize===0,'banco vacío no paga más de lo que tiene');
t((await BM.verify(q)).ok,'cadena con contribuciones OK');
console.log(ok+'/'+n+' tests OK');
