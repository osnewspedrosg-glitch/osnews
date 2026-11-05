// OSNews Binary Money — núcleo lógico (simulación educativa). Funciona en navegador y Node.
(function(root){
const enc=new TextEncoder();
async function sha256(s){const c=(root.crypto&&root.crypto.subtle)||require('crypto').webcrypto.subtle;const b=await c.digest('SHA-256',enc.encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function toBin(s){return [...enc.encode(s)].map(b=>b.toString(2).padStart(8,'0')).join(' ');}
function cents(n){return Math.round(Number(n)*100);}
function payload(r){return JSON.stringify([r.i,r.t,r.type,r.from,r.to,r.amount,r.tax,r.net,r.token||'',r.prev]);}
function newState(){return {accounts:{Pedro:cents(1000),Tienda:cents(500),Hacienda:0,'Empresa A':cents(5000),'Empresa B':cents(500),'Empresa C':cents(1000),'Empresa D':cents(20000)},ledger:[]};}
async function addRecord(st,rec){const prev=st.ledger.length?st.ledger[st.ledger.length-1].hash:'0'.repeat(64);const r=Object.assign({i:st.ledger.length,t:rec.t||Date.now(),prev},rec);r.hash=await sha256(payload(r));st.ledger.push(r);return r;}
async function transfer(st,from,to,amountEur,taxPct,extra){const a=cents(amountEur);if(!(a>0))throw new Error('importe');if(from===to)throw new Error('mismo');if(!(from in st.accounts)||!(to in st.accounts))throw new Error('cuenta');if(st.accounts[from]<a)throw new Error('saldo');const p=Math.min(Math.max(Number(taxPct)||0,0),100);const tax=Math.round(a*p/100),net=a-tax;st.accounts[from]-=a;st.accounts[to]+=net;st.accounts.Hacienda+=tax;return addRecord(st,Object.assign({type:'transfer',from,to,amount:a,tax,net,route:[from,'beb','Banco (simulado)','Hacienda',to]},extra||{}));}
async function verify(st){let prev='0'.repeat(64);for(const r of st.ledger){if(r.prev!==prev)return {ok:false,at:r.i};if(await sha256(payload(r))!==r.hash)return {ok:false,at:r.i};prev=r.hash;}return {ok:true};}
function token(){const a=new Uint8Array(8);((root.crypto&&root.crypto.getRandomValues)?root.crypto:require('crypto').webcrypto).getRandomValues(a);return 'TKN-'+[...a].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();}

// Renta vital básica (puntos, valores de ejemplo)
function ensurePts(st){if(!st.pts){st.pts={};}return st.pts;}
async function monthly(st,citizens,cfg){const P=ensurePts(st);st.month=(st.month||0)+1;const out=[];
for(const c of citizens){const w=P[c]||(P[c]={basic:0,leisure:0});const basicTotal=Object.values(cfg.basics).reduce((a,b)=>a+Number(b),0);
w.basic+=Math.max(Number(cfg.basicPts),basicTotal);w.leisure+=Number(cfg.leisurePts);
await addRecord(st,{type:'rvb-allowance',from:'RVB',to:c,amount:Math.max(Number(cfg.basicPts),basicTotal)+Number(cfg.leisurePts),tax:0,net:0,token:'M'+st.month});
for(const [k,v] of Object.entries(cfg.basics)){w.basic-=Number(v);await addRecord(st,{type:'rvb-basic',from:c,to:k,amount:Number(v),tax:0,net:Number(v),token:'M'+st.month});}
out.push({c,ok:w.basic>=0});}return out;}
async function spendLeisure(st,c,pts,what){const w=ensurePts(st)[c];if(!w||w.leisure<pts)throw new Error('puntos');w.leisure-=pts;return addRecord(st,{type:'leisure',from:c,to:what,amount:pts,tax:0,net:pts});}
const DEV={phone:300,laptop:500,tablet:200,tv:250},COND={good:1,fair:0.5,broken:0.15};
async function tradeIn(st,c,device,cond,newPrice){const w=ensurePts(st)[c];const credit=Math.round((DEV[device]||0)*(COND[cond]||0));const pay=Math.max(Number(newPrice)-credit,0);if(!w||w.leisure<pay)throw new Error('puntos');w.leisure-=pay;
await addRecord(st,{type:'recycle',from:c,to:'Reciclaje/Reutilización',amount:credit,tax:0,net:0,token:device+':'+cond});
return addRecord(st,{type:'tradein-buy',from:c,to:'Tienda Demo',amount:Number(newPrice),tax:0,net:pay,token:'credit '+credit});}


// Colabora y gana (inspirado en la escalera de premios de Cleopatra Puntos; sin apuestas: contribuir nunca cuesta puntos)
const LADDER=[0.2,0.4,1,2,3,5,10,20,40,50,80,100,150,200,350,700,1500],SHARE=0.75;
const CTYPE={idea:2,arte:2,musica:2,codigo:3,ayuda:1};
function feedBank(st,systemPts){st.cbank=(st.cbank||0)+Math.round(Number(systemPts)*SHARE*100)/100;return st.cbank;}
async function contribute(st,c,type,stars,rnd){const w=ensurePts(st)[c];if(!w)throw new Error('ciudadano');stars=Math.min(5,Math.max(1,Math.round(stars)));
const bonus=Math.floor((rnd==null?Math.random():rnd)*3);const step=Math.min(LADDER.length-1,(stars-1)*3+(CTYPE[type]||1)+bonus);
const prize=Math.min(LADDER[step],st.cbank||0);st.cbank=Math.round(((st.cbank||0)-prize)*100)/100;w.leisure+=prize;
const r=await addRecord(st,{type:'contrib',from:'Banco comunitario',to:c,amount:prize,tax:0,net:prize,token:type+' '+stars+'★ step'+step+' +'+bonus});return {r,step,bonus,prize};}


// Fase de transición: hasta que la renta sea universal, la financian empresas colaboradoras (ficticias)
const PARTNERS=['Tienda Demo','Super Ejemplo','Telco Ejemplo'];
async function partnerFund(st,company,pts,goal){if(!PARTNERS.includes(company))throw new Error('empresa');pts=Number(pts);if(!(pts>0))throw new Error('pts');
st.cbank=Math.round(((st.cbank||0)+pts)*100)/100;st.funded=(st.funded||0)+pts;const pct=Math.min(100,Math.round(st.funded/Number(goal)*1000)/10);
await addRecord(st,{type:'partner-fund',from:company,to:'Banco comunitario',amount:pts,tax:0,net:pts,token:'universal '+pct+'%'});return pct;}


// Cambio € -> puntos (ejemplo: 1 € = 1 punto, 70 % básicos / 30 % ocio)
async function exchange(st,c,eur,rate,basicPct){const a=cents(eur);if(!(a>0)||(st.accounts[c]||0)<a)throw new Error('saldo');const pts=Math.round(Number(eur)*(Number(rate)||1));
const bp=Math.min(100,Math.max(0,Number(basicPct)));const b=Math.round(pts*bp/100),l=pts-b;st.accounts[c]-=a;const w=ensurePts(st)[c]||(st.pts[c]={basic:0,leisure:0});w.basic+=b;w.leisure+=l;
return addRecord(st,{type:'exchange',from:c,to:'RVB',amount:a,tax:0,net:pts,token:'basic '+b+' / leisure '+l});}

const api={exchange,PARTNERS,partnerFund,LADDER,SHARE,CTYPE,feedBank,contribute,monthly,spendLeisure,tradeIn,DEV,COND,sha256,toBin,cents,newState,transfer,verify,token,payload};
if(typeof module!=='undefined')module.exports=api;else root.BM=api;
})(typeof window!=='undefined'?window:globalThis);
