const {Machine,PYR}=require('./logic.js');const m=new Machine();let bonus=0,oca=0,prog=0;
for(let i=0;i<100000;i++){const bet=1+Math.floor(Math.random()*5);const s=m.spin(bet);
 if(s.bonus){bonus++;const p=m.pyramidProgram(bet);const r=m.pyramidStop(bet,p,Math.floor(Math.random()*PYR.length));if(r.programmed)prog++;}
 if(s.oca){oca++;m.ocaPlay(bet)}}
console.log('jugado',m.played,'pagado',m.paid.toFixed(2),'RTP',(m.paid/m.played*100).toFixed(2)+'%','banco',m.bank.toFixed(2),'pirámides',bonus,'programadas',prog,'oca',oca);
