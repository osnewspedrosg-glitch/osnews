/* MAY Producción — lógica (parser + economía). Simulación educativa. */
(function(G){
const PRODUCTS={
 pan:{es:'panes',en:'loaves of bread',sector:'campo',kwh:0.5,rh:0.02,base:1.2,pts:1},
 tomate:{es:'kg de tomates',en:'kg of tomatoes',sector:'campo',kwh:0.3,rh:0.03,base:2,pts:2},
 placa:{es:'placas solares',en:'solar panels',sector:'energia',kwh:40,rh:3,base:180,pts:150},
 chip:{es:'chips',en:'chips',sector:'fabrica',kwh:5,rh:0.5,base:25,pts:20},
 tablet:{es:'tablets con NPU',en:'NPU tablets',sector:'fabrica',kwh:20,rh:2,base:220,pts:180},
 robot:{es:'robots',en:'robots',sector:'fabrica',kwh:300,rh:40,base:5000,pts:4000},
 app:{es:'apps',en:'apps',sector:'digital',kwh:2,rh:1,base:50,pts:40},
 agua:{es:'litros de agua',en:'litres of water',sector:'servicios',kwh:0.01,rh:0.001,base:0.01,pts:0.01}
};
const ALIASES=[[/pan(es)?|bread|loa(f|ves)/,'pan'],[/tomat/,'tomate'],[/placa|solar|panel(es)? solar/,'placa'],[/chip/,'chip'],[/tablet|movil|móvil|phone/,'tablet'],[/robot/,'robot'],[/app|software|program/,'app'],[/agua|water/,'agua']];
const NUMW={un:1,una:1,uno:1,dos:2,tres:3,cuatro:4,cinco:5,diez:10,cien:100,mil:1000,one:1,two:2,three:3,ten:10,hundred:100,thousand:1000};
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function parse(text){
 const t=norm(text);
 if(/^\s*(hola|buenas|hello|hi|hey)\b/.test(t))return{intent:'greet'};
 if(/escalera|ladder|transici|paso|step/.test(t))return{intent:'ladder'};
 if(/renta|ubi|basic income|basica/.test(t))return{intent:'ubi'};
 if(/universe|arquitect|cloud|nube|satel|procesador/.test(t))return{intent:'arch'};
 if(/vot/.test(t)){const m=t.match(/vot\w*\s+(?:por\s+|for\s+)?(?:a\s+)?(\w+)/);let p=null;if(m)for(const[r,k]of ALIASES)if(r.test(m[1]))p=k;return{intent:'vote',product:p};}
 if(/punto|point/.test(t))return{intent:'points'};
 if(/estado|status|resumen|summary/.test(t))return{intent:'status'};
 if(/automat|robotiza|mas robots|more robots|invier|invest/.test(t))return{intent:'automate'};
 if(/reinici|reset/.test(t))return{intent:'reset'};
 if(/produc|fabric|cultiv|haz|hace|make|build|grow|crea|genera|manufact/.test(t)||/\d/.test(t)){
  let product=null;for(const[r,k]of ALIASES)if(r.test(t)){product=k;break;}
  let qty=null;const m=t.match(/(\d[\d.]*)/);if(m)qty=parseInt(m[1].replace(/\./g,''),10);
  else for(const w in NUMW)if(new RegExp('\\b'+w+'\\b').test(t)){qty=NUMW[w];break;}
  if(!product)return{intent:'unknown'};
  if(!qty)qty=product==='tomate'?100:(product==='robot'?1:10);
  return{intent:'produce',product,qty:Math.min(qty,1e6)};
 }
 if(/ayuda|help|que puedes|what can/.test(t))return{intent:'help'};
 return{intent:'unknown'};
}
function newState(){return{automation:10,fund:0,produced:{},energy:0,robotHours:0,orders:0,citizens:100,paid:0,
 votes:{pan:0,tomate:0,placa:0,chip:0,app:0},level:{},capital:{gobiernos:0,multinacionales:0,bancos:0}};}
/* precio unitario baja con la automatización: base*(1-0.8*a) con a=automation/100 (mín. 20% del base) */
function unitPrice(p,auto){const a=Math.max(0,Math.min(100,auto))/100;return +(PRODUCTS[p].base*(1-0.8*a)).toFixed(4);}
function produce(s,p,qty){
 const P=PRODUCTS[p];const a=s.automation/100;
 const energy=+(P.kwh*qty*(1-0.3*a)).toFixed(2), rh=+(P.rh*qty).toFixed(2);
 const price=unitPrice(p,s.automation), points=Math.round(P.pts*qty*(0.5+a)); // más automatización = más valor al fondo común
 s.produced[p]=(s.produced[p]||0)+qty;s.energy+=energy;s.robotHours+=rh;s.orders++;s.fund+=points;
 s.automation=Math.min(100,+(s.automation+Math.min(5,Math.log10(1+points)*0.8)).toFixed(2));
 if(p==='robot')s.automation=Math.min(100,s.automation+3*qty);
 updateCapital(s);
 return{product:p,qty,energy,robotHours:rh,price,points,automation:s.automation};
}
function automate(s){s.automation=Math.min(100,s.automation+10);updateCapital(s);return s.automation;}
function updateCapital(s){const a=s.automation;s.capital={gobiernos:Math.round(a*0.9),multinacionales:Math.round(Math.max(0,a-10)*1.1>100?100:Math.max(0,a-10)*1.1),bancos:Math.round(Math.min(100,a))};}
const LADDER=['Dinero','Robots','Software (IA)','Empresas y negocios','Renta básica'];
const LADDER_EN=['Money','Robots','Software (AI)','Companies & business','Basic income'];
function ladderStep(auto){return Math.min(4,Math.floor(Math.max(0,auto)/20));} // 0-19 →0 … 80-100 →4
/* renta básica: se reparte el fondo común entre ciudadanos; 70% básicos / 30% ocio (como Binary Money) */
function payUBI(s){const per=Math.floor(s.fund/s.citizens);const total=per*s.citizens;s.fund-=total;s.paid+=total;
 return{per,total,basics:Math.round(per*0.7),leisure:per-Math.round(per*0.7)};}
/* votos (hoja de Pedro: «pp → 100 votos … 1+100 pase = 101 … pp → 101–200»):
   supuesto: cada voto = 1 punto para la opción; cada 100 votos la opción "pasa" de nivel
   (nivel 1 = 1–100, nivel 2 = 101–200…). Gana la opción con más votos; empate → la primera. */
function vote(s,p,n){n=n||1;if(!(p in s.votes))s.votes[p]=0;s.votes[p]+=n;return voteLevel(s.votes[p]);}
function voteLevel(v){return v<=0?0:Math.ceil(v/100);}
function winner(s){let w=null,b=-1;for(const k in s.votes)if(s.votes[k]>b){b=s.votes[k];w=k;}return w;}
G.MAYLOGIC={PRODUCTS,parse,newState,unitPrice,produce,automate,ladderStep,LADDER,LADDER_EN,payUBI,vote,voteLevel,winner,norm};
if(typeof module!=='undefined')module.exports=G.MAYLOGIC;
})(typeof window!=='undefined'?window:globalThis);
