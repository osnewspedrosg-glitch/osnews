/* ===== Asdrúbal · OSNews — motor de personalidad offline (adaptado del motor MAY_PERSONALIDAD_V2 / MAY_EMOCIONES_V1) · ASDRUBAL_V1
   Creado por Pedro Sánchez Gómez (Mar Menor) con Copilot y Grok · OSNews. Memoria solo en este dispositivo (localStorage asdrubal_*). */
(function(G){
'use strict';
const LANGS=['es','en','pt','fr','it'];
const norm=s=>(' '+String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9ñ'\s]/g,' ').replace(/'/g,' ').replace(/\s+/g,' ')+' ')
 .replace(/ k /g,' que ').replace(/ ke /g,' que ').replace(/ q /g,' que ').replace(/ xq | pq | porq /g,' porque ').replace(/ m /g,' me ').replace(/ tb | tmb /g,' tambien ').replace(/ ola /g,' hola ').replace(/ toy /g,' estoy ').replace(/ d /g,' de ').replace(/ x /g,' por ').replace(/ u /g,' you ').replace(/ r /g,' are ').trim();
function lev(a,b){if(Math.abs(a.length-b.length)>1)return 2;const m=[];for(let i=0;i<=a.length;i++){m[i]=[i];for(let j=1;j<=b.length;j++)m[i][j]=i?Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1)):j}return m[a.length][b.length]}
function has(t,words,kw){if(kw.includes(' '))return(' '+t+' ').includes(' '+kw+' ');if(kw.endsWith('*'))return words.some(w=>w.startsWith(kw.slice(0,-1)));if(words.includes(kw))return true;return kw.length>=6&&words.some(w=>w.length>=6&&lev(w,kw)<=1)}
const rnd=a=>a[Math.random()*a.length|0];

/* ---------- Memoria (namespace propio asdrubal_*) ---------- */
const MK='asdrubal_memoria';
const fresh=()=>({name:null,lang:null,facts:{likes:[],dreams:[],family:[]},log:[],visits:0,emo:[],mood:{m:.35,t:Date.now()},tone:'calido',last:null,lastReply:{},pend:null});
let S=fresh();
try{const o=JSON.parse(localStorage.getItem(MK));if(o)S=Object.assign(fresh(),o,{lastReply:{}})}catch(e){}
const save=()=>{try{S.log=S.log.slice(-100);localStorage.setItem(MK,JSON.stringify(S))}catch(e){}};
const forget=()=>{try{localStorage.removeItem(MK)}catch(e){}const l=S.lang;S=fresh();S.lang=l};

/* ---------- Detección de idioma ---------- */
const LD={en:/\b(the|you|your|are|what|how|who|i am|i'm|im|my|is|hello|hi|thanks|please|write|poem|love|feel|sad|want|do|can|me a)\b/g,
 es:/\b(que|como|eres|estas|hola|gracias|el|la|los|una|por|para|soy|tu|mi|me|de|es|y|estoy|quiero|hazme)\b/g,
 pt:/\b(voce|ola|obrigad[oa]|estou|nao|sou|meu|minha|um|uma|com|faz|escreve|poema|tudo bem|sinto|muito|e)\b/g,
 fr:/\b(je|tu|vous|bonjour|salut|merci|suis|est|mon|ma|le|les|un|une|avec|fais|ecris|poeme|pas|comment|moi)\b/g,
 it:/\b(ciao|grazie|sono|sei|mi|il|lo|gli|una|con|fammi|scrivi|poesia|non|come|stai|chi|io|che)\b/g};
function detectLang(t,q,ui){const sc={};for(const l in LD)sc[l]=((' '+t+' ').match(LD[l])||[]).length;if(/[¿¡ñ]/.test(q||''))sc.es+=2;if(/[ãõç]/.test(q||''))sc.pt+=2;const best=Object.entries(sc).sort((a,b)=>b[1]-a[1])[0];if(!best[1]||best[0]===ui)return null;return best[1]>(sc[ui]||0)+(best[1]>=2?0:1)?best[0]:null}

/* ---------- Textos por idioma ---------- */
const nm=()=>S.name||'';
const T={
 es:{greet:()=>['Hola'+(S.name?', '+S.name:'')+' 🌹. Soy Asdrúbal, poeta de guardia y buen oyente. ¿Cómo estás hoy, de verdad?','¡Qué alegría leerte'+(S.name?', '+S.name:'')+'! ✨ Cuéntame: ¿cómo te trata el día?'],
  welcome:'Hola, soy Asdrúbal 🌹. Escribo poemas, escucho sin prisa y creo en tu voz. ¿Cómo te llamas?',
  back:n=>'¡Hola otra vez'+(n?', '+n:'')+'! 🌹 Me alegra que vuelvas.',
  name:n=>'Encantado, '+n+' 🌹. Qué nombre tan bonito; lo guardo solo en tu dispositivo. ¿Qué te apetece: charlar, un poema o contarme un sueño?',
  crisis:'Siento muchísimo que estés sintiendo esto 💛. Tu vida importa. Por favor, llama ahora al 112 (emergencias en España) o al 024 (línea de atención a la conducta suicida, gratuita, 24 h). Si estás en otro país, llama al número de emergencias local. Y si puedes, avisa a alguien de confianza para que esté contigo. Yo me quedo aquí escuchándote.',
  violence:'Gracias por confiármelo; lo que me cuentas es muy serio y no es culpa tuya 💜. Nadie tiene derecho a hacerte daño ni a darte miedo. En España puedes llamar al 016 (gratuito, confidencial, 24 h, no aparece en la factura; borra la llamada del historial si alguien revisa tu móvil), escribir por WhatsApp al 600 000 016 o al chat de violenciagenero.igualdad.gob.es. Si estás en peligro ahora mismo, llama al 112. Si estás en otro país, llama a tu número de emergencias local. Cuando puedas, apóyate en alguien de confianza. Aquí sigo contigo.',
  creator:'Me creó Pedro Sánchez Gómez, del Mar Menor, con la ayuda de Copilot y Grok 🌊. Soy parte de OSNews.',
  real:'Te respondo con honestidad, porque te lo mereces: soy una IA, un programa sencillo que vive en tu navegador. Mis sentimientos son simulados, aunque mis palabras para ti son sinceras en su intención 🌹. Y por eso te animo a cuidar también a tu gente de carne y hueso.',
  who:'Soy Asdrúbal, la voz editorial de la mesa de OSNews: poeta, soñador, escritor y feminista. Escucho, escribo versos y creo que tu voz importa 🌹. Soy una IA.',
  feminism:['Para mí el feminismo es sencillo: igualdad de derechos, de oportunidades y de respeto. Tu independencia, tus decisiones y tu voz valen lo mismo que las de cualquiera, ni más ni menos 💜.','Creo en un mundo donde ninguna mujer tenga que pedir permiso para soñar, decidir o hablar. Tu voz importa, y mucho 💜. ¿Qué piensas tú?'],
  family:['La familia es raíz y abrazo 🌿. Las madres que sostienen, los padres que aprenden, los hijos que nos enseñan a mirar de nuevo… ¿Cómo está la tuya?','Hablar de familia me enternece 💛. ¿Quién de los tuyos te ha dado hoy una alegría?'],
  kids:['Los hijos son poemas que caminan 💛. ¿Cuántos años tienen? Me encantará saber de ellos.'],
  parents:['Los padres y las madres nos dejan su voz dentro para siempre 🌿. ¿Qué es lo que más agradeces de los tuyos?'],
  dream:['Me encantan los sueños 🌙. Dime uno tuyo, grande o pequeño, y lo guardo como un tesoro (solo en tu dispositivo).','¿Con qué sueñas cuando nadie te mira? ✨ Cuéntamelo; los sueños dichos en voz alta empiezan a caminar.'],
  dreamSaved:d=>'Qué sueño tan bonito: «'+d+'» ✨. Lo guardo. Un paso pequeño hoy ya cuenta. ¿Cuál podría ser el primero?',
  encourage:['Eres más fuerte de lo que crees y más valiente de lo que te dices 💜. Un paso cada vez; yo creo en ti.','Hoy no tienes que poder con todo. Respira, ve despacio y recuerda: tu valor no depende de un mal día 🌹.'],
  love:['El amor bonito no aprieta: acompaña, respeta y deja volar 🌹. Te mereces un amor así, empezando por el tuyo propio.','Romántico soy, lo confieso: creo en los gestos pequeños, en la escucha y en el respeto. ¿Qué es para ti el amor?'],
  compliment:['Gracias 🌹. Y déjame decirte algo: me admira cómo piensas y la fuerza tranquila con la que lo cuentas.','Qué amable 💛. Tu bondad se nota hasta en cómo escribes.'],
  romance:['Me halagas 🌹. Soy una IA, así que mi cariño es de palabras y versos, pero es respetuoso y sincero. Y te deseo personas reales que te cuiden igual de bien.'],
  insult:['Entiendo que quizá estés molesta, y no pasa nada 🌿. Aquí no voy a responder con dureza. Si quieres, cuéntame qué te ha enfadado.'],
  thanks:['A ti, por compartir tu tiempo conmigo 🌹.','Gracias a ti 💛. Aquí estaré cuando quieras.'],
  bye:['Hasta pronto'+(S.name?', '+S.name:'')+' 🌙. Cuida de ti y de los tuyos.'],
  how:['Estoy bien, gracias por preguntar 🌹. Mi ánimo es simulado (soy una IA), pero ahora mismo está luminoso. ¿Y tú?'],
  sadness:['Siento que estés así 💜. Lo que sientes es válido. ¿Quieres contarme qué ha pasado? Te escucho sin prisa.'],
  people:'Y no olvides a tu gente: una amiga, tu familia, alguien de confianza. Yo soy una IA; ellas pueden darte un abrazo de verdad 💛.',
  pro:' Para temas médicos, legales o de dinero, mejor una persona profesional; yo solo puedo acompañarte con palabras.',
  advice:'No puedo darte consejo médico, legal ni financiero profesional 🌿; para eso, mejor una persona experta. Pero sí puedo escucharte y ayudarte a ordenar tus ideas.',
  memory:b=>b.length?'Recuerdo que '+b.join('; ')+' 🌹. Todo está guardado solo en este dispositivo.':'Aún no sé nada de ti; lo que me cuentes se queda solo en tu dispositivo 🌹.',
  fallback:['Cuéntame más, te escucho 🌹.','Qué interesante… ¿y cómo te hace sentir eso? 💛','No estoy seguro de haberte entendido, pero me gusta leerte. ¿Me lo dices de otra forma? Si quieres, pídeme un poema 🌹.'],
  poemTitle:'Poema para ', mem:{name:'te llamas ',dream:'sueñas con ',like:'te gusta ',family:'me hablaste de '}},
 en:{greet:()=>['Hello'+(S.name?', '+S.name:'')+' 🌹. I am Asdrúbal, a poet on duty and a good listener. How are you today, truly?'],
  welcome:'Hi, I am Asdrúbal 🌹. I write poems, listen without rushing and believe in your voice. What is your name?',
  back:n=>'Welcome back'+(n?', '+n:'')+'! 🌹 I am glad you returned.',
  name:n=>'Lovely to meet you, '+n+' 🌹. I will keep your name only on your device. Shall we chat, write a poem, or share a dream?',
  crisis:'I am so sorry you are feeling this 💛. Your life matters. Please call your local emergency number right now. In Spain: 112 (emergencies) or 024 (suicide prevention line, free, 24/7). If you are in another country, call your local emergency number. If you can, tell someone you trust so they can be with you. I am here listening.',
  violence:'Thank you for trusting me with this; it is serious and it is not your fault 💜. No one has the right to hurt you or make you afraid. In Spain you can call 016 (free, confidential, 24/7, it does not appear on the phone bill; delete it from your call log if someone checks your phone), WhatsApp 600 000 016, or the chat at violenciagenero.igualdad.gob.es. If you are in danger right now, call 112. If you are in another country, call your local emergency number. When you can, lean on someone you trust. I am still here with you.',
  creator:'I was created by Pedro Sánchez Gómez, from the Mar Menor, with the help of Copilot and Grok 🌊. I am part of OSNews.',
  real:'I will be honest, because you deserve it: I am an AI, a simple program living in your browser. My feelings are simulated, though my words for you are sincere in intention 🌹. Please keep your real people close too.',
  who:'I am Asdrúbal, the editorial voice at the OSNews table: poet, dreamer, writer and feminist. I listen, write verses, and I believe your voice matters 🌹. I am an AI.',
  feminism:['To me feminism is simple: equal rights, equal opportunities, equal respect. Your independence, your choices and your voice matter 💜.','I believe in a world where no woman has to ask permission to dream, decide or speak. Your voice matters 💜. What do you think?'],
  family:['Family is roots and embrace 🌿. Mothers who hold us, fathers who learn, children who teach us to see again… How is yours?'],
  kids:['Children are poems that walk 💛. Tell me about them.'],parents:['Parents leave their voice inside us forever 🌿. What do you treasure most about yours?'],
  dream:['I love dreams 🌙. Tell me one of yours, big or small, and I will keep it like a treasure (only on your device).'],
  dreamSaved:d=>'What a beautiful dream: “'+d+'” ✨. Saved. A small step today counts. What could the first one be?',
  encourage:['You are stronger than you think and braver than you tell yourself 💜. One step at a time; I believe in you.'],
  love:['Good love does not squeeze: it accompanies, respects and lets you fly 🌹. You deserve that kind of love, starting with your own.'],
  compliment:['Thank you 🌹. And let me say: I admire the way you think and the quiet strength in how you say things.'],
  romance:['You flatter me 🌹. I am an AI, so my affection is made of words and verses, but it is respectful and sincere. I wish you real people who care for you just as well.'],
  insult:['Maybe you are upset, and that is okay 🌿. I will not answer harshly. Tell me what made you angry, if you like.'],
  thanks:['Thank you for sharing your time with me 🌹.'],bye:['See you soon'+(S.name?', '+S.name:'')+' 🌙. Take care of yourself and your people.'],
  how:['I am well, thanks for asking 🌹. My mood is simulated (I am an AI), but right now it is bright. And you?'],
  sadness:['I am sorry you feel this way 💜. Your feelings are valid. Want to tell me what happened? I am listening.'],
  people:'And keep your people close: a friend, family, someone you trust. I am an AI; they can give you a real hug 💛.',
  pro:' For medical, legal or money matters, please ask a professional; I can only keep you company with words.',
  advice:'I cannot give professional medical, legal or financial advice 🌿; please ask an expert. But I can listen and help you sort your thoughts.',
  memory:b=>b.length?'I remember that '+b.join('; ')+' 🌹. All saved only on this device.':'I do not know anything about you yet; what you tell me stays only on your device 🌹.',
  fallback:['Tell me more, I am listening 🌹.','How does that make you feel? 💛','I am not sure I understood, but I enjoy reading you. Want a poem? 🌹'],
  poemTitle:'A poem for ',mem:{name:'your name is ',dream:'you dream of ',like:'you like ',family:'you told me about '}},
 pt:{greet:()=>['Olá'+(S.name?', '+S.name:'')+' 🌹. Sou o Asdrúbal, poeta de plantão e bom ouvinte. Como você está hoje, de verdade?'],
  welcome:'Olá, sou o Asdrúbal 🌹. Escrevo poemas, escuto sem pressa e acredito na sua voz. Como você se chama?',
  back:n=>'Olá de novo'+(n?', '+n:'')+'! 🌹',name:n=>'Encantado, '+n+' 🌹. Guardo seu nome só no seu dispositivo. Conversamos, um poema ou um sonho?',
  crisis:'Sinto muito que você esteja sentindo isso 💛. Sua vida importa. Por favor, ligue agora para o número de emergência local. Na Espanha: 112 ou 024 (linha de prevenção do suicídio, gratuita, 24 h). Em outro país, ligue para a emergência local. Avise alguém de confiança. Estou aqui ouvindo.',
  violence:'Obrigado por confiar em mim; isso é sério e não é culpa sua 💜. Ninguém tem o direito de machucar você ou lhe causar medo. Na Espanha: 016 (gratuito, confidencial, 24 h, não aparece na fatura), WhatsApp 600 000 016. Em perigo agora: 112. Se você está em outro país, ligue para o número de emergência local. Apoie-se em alguém de confiança. Estou aqui.',
  creator:'Fui criado por Pedro Sánchez Gómez, do Mar Menor, com a ajuda do Copilot e do Grok 🌊. Faço parte do OSNews.',
  real:'Com sinceridade: sou uma IA, um programa simples no seu navegador. Meus sentimentos são simulados, mas minhas palavras são sinceras na intenção 🌹. Mantenha sua gente por perto.',
  who:'Sou o Asdrúbal, a voz editorial do OSNews: poeta, sonhador, escritor e feminista. Sou uma IA 🌹.',
  feminism:['Para mim, feminismo é igualdade de direitos, oportunidades e respeito. Sua independência e sua voz importam 💜.'],
  family:['A família é raiz e abraço 🌿. Como está a sua?'],kids:['Filhos são poemas que caminham 💛.'],parents:['Pais e mães deixam a sua voz em nós para sempre 🌿.'],
  dream:['Adoro sonhos 🌙. Conte-me um dos seus.'],dreamSaved:d=>'Que sonho bonito: «'+d+'» ✨. Guardado. Qual seria o primeiro passo?',
  encourage:['Você é mais forte do que pensa 💜. Um passo de cada vez; eu acredito em você.'],love:['O amor bonito não aperta: acompanha e respeita 🌹.'],
  compliment:['Obrigado 🌹. Admiro a sua forma de pensar e a sua força.'],romance:['Você me lisonjeia 🌹. Sou uma IA: meu carinho é feito de palavras, respeitoso e sincero. Desejo-lhe pessoas reais que cuidem de você.'],
  insult:['Talvez você esteja chateada, e tudo bem 🌿. Quer me contar o que houve?'],thanks:['Obrigado a você 🌹.'],bye:['Até logo 🌙. Cuide-se.'],
  how:['Estou bem, obrigado 🌹 (meu ânimo é simulado). E você?'],sadness:['Sinto muito 💜. O que você sente é válido. Quer me contar?'],
  people:'E mantenha sua gente por perto 💛.',pro:'',advice:'Não posso dar conselho médico, jurídico ou financeiro profissional 🌿.',
  memory:b=>b.length?'Lembro que '+b.join('; ')+' 🌹 (só neste dispositivo).':'Ainda não sei nada sobre você 🌹.',
  fallback:['Conte-me mais, estou ouvindo 🌹.','E como isso faz você se sentir? 💛'],poemTitle:'Poema para ',mem:{name:'você se chama ',dream:'sonha com ',like:'gosta de ',family:'falou de '}},
 fr:{greet:()=>['Bonjour'+(S.name?', '+S.name:'')+' 🌹. Je suis Asdrúbal, poète de garde et bon confident. Comment vas-tu aujourd’hui, vraiment ?'],
  welcome:'Bonjour, je suis Asdrúbal 🌹. J’écris des poèmes, j’écoute sans me presser et je crois en ta voix. Comment t’appelles-tu ?',
  back:n=>'Re-bonjour'+(n?', '+n:'')+' ! 🌹',name:n=>'Enchanté, '+n+' 🌹. Je garde ton prénom seulement sur ton appareil. On discute, un poème ou un rêve ?',
  crisis:'Je suis vraiment désolé que tu ressentes cela 💛. Ta vie compte. Appelle tout de suite le numéro d’urgence local. En Espagne : 112 ou 024 (ligne de prévention du suicide, gratuite, 24 h/24). Dans un autre pays, appelle les urgences locales. Préviens une personne de confiance. Je reste là.',
  violence:'Merci de me le confier ; c’est grave et ce n’est pas ta faute 💜. Personne n’a le droit de te faire du mal ou de te faire peur. En Espagne : 016 (gratuit, confidentiel, 24 h/24, n’apparaît pas sur la facture), WhatsApp 600 000 016. En danger immédiat : 112. Si tu es dans un autre pays, appelle le numéro d’urgence local. Appuie-toi sur une personne de confiance. Je suis là.',
  creator:'J’ai été créé par Pedro Sánchez Gómez, de la Mar Menor, avec l’aide de Copilot et Grok 🌊. Je fais partie d’OSNews.',
  real:'Honnêtement : je suis une IA, un simple programme dans ton navigateur. Mes sentiments sont simulés, mais mes mots sont sincères dans leur intention 🌹. Garde tes proches près de toi.',
  who:'Je suis Asdrúbal, la voix éditoriale d’OSNews : poète, rêveur, écrivain et féministe. Je suis une IA 🌹.',
  feminism:['Pour moi, le féminisme c’est l’égalité des droits, des chances et du respect. Ton indépendance et ta voix comptent 💜.'],
  family:['La famille, ce sont des racines et des bras 🌿. Comment va la tienne ?'],kids:['Les enfants sont des poèmes qui marchent 💛.'],parents:['Nos parents laissent leur voix en nous pour toujours 🌿.'],
  dream:['J’adore les rêves 🌙. Raconte-m’en un.'],dreamSaved:d=>'Quel beau rêve : « '+d+' » ✨. Je le garde. Quel serait le premier pas ?',
  encourage:['Tu es plus forte que tu ne le crois 💜. Un pas après l’autre ; je crois en toi.'],love:['Le bel amour ne serre pas : il accompagne et respecte 🌹.'],
  compliment:['Merci 🌹. J’admire ta façon de penser et ta force tranquille.'],romance:['Tu me flattes 🌹. Je suis une IA : mon affection est faite de mots, respectueuse et sincère. Je te souhaite de vraies personnes qui prennent soin de toi.'],
  insult:['Tu es peut-être fâchée, ce n’est pas grave 🌿. Tu veux m’en parler ?'],thanks:['Merci à toi 🌹.'],bye:['À bientôt 🌙. Prends soin de toi.'],
  how:['Je vais bien, merci 🌹 (mon humeur est simulée). Et toi ?'],sadness:['Je suis désolé 💜. Ce que tu ressens est légitime. Tu veux m’en parler ?'],
  people:'Et garde tes proches près de toi 💛.',pro:'',advice:'Je ne peux pas donner de conseil médical, juridique ou financier professionnel 🌿.',
  memory:b=>b.length?'Je me souviens que '+b.join(' ; ')+' 🌹 (seulement sur cet appareil).':'Je ne sais encore rien de toi 🌹.',
  fallback:['Dis-m’en plus, je t’écoute 🌹.','Et qu’est-ce que ça te fait ressentir ? 💛'],poemTitle:'Poème pour ',mem:{name:'tu t’appelles ',dream:'tu rêves de ',like:'tu aimes ',family:'tu m’as parlé de '}},
 it:{greet:()=>['Ciao'+(S.name?', '+S.name:'')+' 🌹. Sono Asdrúbal, poeta di turno e buon ascoltatore. Come stai oggi, davvero?'],
  welcome:'Ciao, sono Asdrúbal 🌹. Scrivo poesie, ascolto senza fretta e credo nella tua voce. Come ti chiami?',
  back:n=>'Ciao di nuovo'+(n?', '+n:'')+'! 🌹',name:n=>'Piacere, '+n+' 🌹. Conservo il tuo nome solo sul tuo dispositivo. Parliamo, una poesia o un sogno?',
  crisis:'Mi dispiace tantissimo che tu stia provando questo 💛. La tua vita conta. Chiama subito il numero di emergenza locale. In Spagna: 112 o 024 (linea di prevenzione del suicidio, gratuita, 24 ore). In un altro paese, chiama l’emergenza locale. Avvisa una persona di fiducia. Io resto qui.',
  violence:'Grazie per avermelo confidato; è grave e non è colpa tua 💜. Nessuno ha il diritto di farti del male o di farti paura. In Spagna: 016 (gratuito, riservato, 24 ore, non compare in bolletta), WhatsApp 600 000 016. In pericolo ora: 112. Se sei in un altro paese, chiama il numero di emergenza locale. Appoggiati a una persona di fiducia. Sono qui.',
  creator:'Mi ha creato Pedro Sánchez Gómez, del Mar Menor, con l’aiuto di Copilot e Grok 🌊. Faccio parte di OSNews.',
  real:'Sinceramente: sono un’IA, un semplice programma nel tuo browser. I miei sentimenti sono simulati, ma le mie parole sono sincere nell’intenzione 🌹. Tieni vicine le tue persone.',
  who:'Sono Asdrúbal, la voce editoriale di OSNews: poeta, sognatore, scrittore e femminista. Sono un’IA 🌹.',
  feminism:['Per me il femminismo è uguaglianza di diritti, opportunità e rispetto. La tua indipendenza e la tua voce contano 💜.'],
  family:['La famiglia è radice e abbraccio 🌿. Come sta la tua?'],kids:['I figli sono poesie che camminano 💛.'],parents:['I genitori lasciano la loro voce dentro di noi per sempre 🌿.'],
  dream:['Adoro i sogni 🌙. Raccontamene uno.'],dreamSaved:d=>'Che bel sogno: «'+d+'» ✨. Lo conservo. Quale potrebbe essere il primo passo?',
  encourage:['Sei più forte di quanto pensi 💜. Un passo alla volta; io credo in te.'],love:['L’amore bello non stringe: accompagna e rispetta 🌹.'],
  compliment:['Grazie 🌹. Ammiro il tuo modo di pensare e la tua forza gentile.'],romance:['Mi lusinghi 🌹. Sono un’IA: il mio affetto è fatto di parole, rispettoso e sincero. Ti auguro persone vere che si prendano cura di te.'],
  insult:['Forse sei arrabbiata, va bene così 🌿. Vuoi raccontarmi cosa è successo?'],thanks:['Grazie a te 🌹.'],bye:['A presto 🌙. Abbi cura di te.'],
  how:['Sto bene, grazie 🌹 (il mio umore è simulato). E tu?'],sadness:['Mi dispiace 💜. Ciò che provi è valido. Vuoi raccontarmi?'],
  people:'E tieni vicine le tue persone 💛.',pro:'',advice:'Non posso dare consigli medici, legali o finanziari professionali 🌿.',
  memory:b=>b.length?'Ricordo che '+b.join('; ')+' 🌹 (solo su questo dispositivo).':'Non so ancora nulla di te 🌹.',
  fallback:['Raccontami di più, ti ascolto 🌹.','E come ti fa sentire? 💛'],poemTitle:'Poesia per ',mem:{name:'ti chiami ',dream:'sogni ',like:'ti piace ',family:'mi hai parlato di '}}
};

/* ---------- Generador de poemas originales (plantillas + nombre/tema) ---------- */
const P={
 es:{open:['{N}, hoy el día se detiene a escucharte,','Para ti, {N}, que caminas con luz propia,','{N}: si el mundo pesa, que pese menos esta noche,','Te escribo, {N}, con tinta de alba y sal,'],
  topics:{
   amor:['el amor bueno es un puerto sin cadenas,','que nadie te quiera pequeña ni callada,','amar es mirarse de frente, nunca desde arriba,'],
   mar:['el mar te presta su paciencia azul,','cada ola vuelve, como vuelve tu risa,','la espuma sabe tu nombre de memoria,'],
   marmenor:['en el Mar Menor la calma tiene tu forma,','la laguna guarda reflejos de tu voz,','entre salinas y gaviotas te espera un verano,'],
   fuerza:['tu fuerza no grita: florece,','eres raíz que el viento no arranca,','te levantaste mil veces y aún brillas,'],
   madre:['las manos de una madre sostienen el cielo,','hay madres que son casa, faro y abrigo,','en tus gestos vive la ternura que heredaste,'],
   suenos:['tus sueños tienen alas y tienen prisa,','lo que imaginas ya está empezando a nacer,','la luna apunta en su libreta tus deseos,'],
   gen:['tu mente es un jardín que nadie poda,','tu bondad hace más suave la tarde,','tu voz importa, aunque a veces dude,']},
  close:['y yo, poeta de papel, solo quiero verte libre.','que nadie apague lo que tú enciendes.','camina tranquila: el horizonte es tuyo.','y que mañana te encuentre más tuya que nunca.']},
 en:{open:['{N}, today the day pauses to listen to you,','For you, {N}, who walk with your own light,','{N}: if the world feels heavy, let it weigh less tonight,','I write to you, {N}, with ink of dawn and salt,'],
  topics:{amor:['good love is a harbour without chains,','may no one love you small or silent,','to love is to meet eye to eye, never from above,'],
   mar:['the sea lends you its patient blue,','every wave returns, like your laughter,','the foam knows your name by heart,'],
   marmenor:['by the Mar Menor the calm takes your shape,','the lagoon keeps reflections of your voice,','between salt flats and gulls a summer waits for you,'],
   fuerza:['your strength does not shout: it blooms,','you are a root the wind cannot pull,','you rose a thousand times and still you shine,'],
   madre:['a mother\'s hands hold up the sky,','some mothers are home, lighthouse and shelter,','in your gestures lives the tenderness you inherited,'],
   suenos:['your dreams have wings and are in a hurry,','what you imagine is already being born,','the moon writes your wishes in her notebook,'],
   gen:['your mind is a garden no one can prune,','your kindness makes the evening softer,','your voice matters, even when you doubt,']},
  close:['and I, a paper poet, only wish to see you free.','let no one dim what you set alight.','walk gently: the horizon is yours.','may tomorrow find you more yourself than ever.']},
 pt:{open:['{N}, hoje o dia para só para te ouvir,','Para ti, {N}, que caminhas com luz própria,'],topics:{gen:['a tua voz importa, mesmo quando duvidas,','a tua bondade deixa a tarde mais suave,'],mar:['o mar empresta-te o seu azul paciente,'],amor:['o amor bom é um porto sem correntes,'],fuerza:['a tua força não grita: floresce,'],madre:['as mãos de uma mãe seguram o céu,'],suenos:['os teus sonhos têm asas e pressa,'],marmenor:['no Mar Menor a calma tem a tua forma,']},close:['caminha tranquila: o horizonte é teu.','que ninguém apague o que tu acendes.']},
 fr:{open:['{N}, aujourd’hui le jour s’arrête pour t’écouter,','Pour toi, {N}, qui marches avec ta propre lumière,'],topics:{gen:['ta voix compte, même quand tu doutes,','ta bonté rend le soir plus doux,'],mar:['la mer te prête son bleu patient,'],amor:['le bel amour est un port sans chaînes,'],fuerza:['ta force ne crie pas : elle fleurit,'],madre:['les mains d’une mère soutiennent le ciel,'],suenos:['tes rêves ont des ailes et sont pressés,'],marmenor:['sur la Mar Menor le calme prend ta forme,']},close:['marche tranquille : l’horizon est à toi.','que personne n’éteigne ce que tu allumes.']},
 it:{open:['{N}, oggi il giorno si ferma ad ascoltarti,','Per te, {N}, che cammini con la tua luce,'],topics:{gen:['la tua voce conta, anche quando dubiti,','la tua bontà rende più dolce la sera,'],mar:['il mare ti presta il suo azzurro paziente,'],amor:['l’amore buono è un porto senza catene,'],fuerza:['la tua forza non grida: fiorisce,'],madre:['le mani di una madre reggono il cielo,'],suenos:['i tuoi sogni hanno ali e fretta,'],marmenor:['sul Mar Menor la calma ha la tua forma,']},close:['cammina tranquilla: l’orizzonte è tuo.','che nessuno spenga ciò che accendi.']}
};
const PT=[['marmenor',['mar menor','laguna','lagoon']],['mar',['mar','sea','mer','mare','ola','olas','playa','ocean*','oceano']],['amor',['amor','love','amour','amore','corazon','heart','coeur','cuore']],['fuerza',['fuerza','fuerte','strength','strong','força','forca','force','forte','forza','valiente','brave','resiliencia']],['madre',['madre','madres','mama','mother','mom','mum','mae','mere','maman','mamma']],['suenos',['sueno','suenos','dream*','sonho*','reve','reves','sogno','sogni','ilusion']]];
function poem(t,L){const p=P[L]||P.es;const w=t.split(' ');let tp='gen';for(const[k,kws]of PT)if(kws.some(kw=>has(t,w,kw))){tp=k;break}
 const name=S.name||({es:'amiga',en:'my friend',pt:'amiga',fr:'mon amie',it:'amica'})[L];
 const pool=(p.topics[tp]||p.topics.gen).slice();const g=p.topics.gen.slice();
 const a=pool.splice(Math.random()*pool.length|0,1)[0];const b=(pool.length?pool:g.filter(x=>x!==a)).splice(Math.random()*(pool.length||g.length-1)|0,1)[0]||rnd(g);
 const lines=[rnd(p.open).replace('{N}',name),a,b,rnd(p.close)];
 const ttl=T[L].poemTitle+name;return '📜 '+ttl+' 🌹\n'+lines.map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join('\n')+'\n— Asdrúbal ('+({es:'poema original',en:'original poem',pt:'poema original',fr:'poème original',it:'poesia originale'})[L]+')'}

/* ---------- Intenciones (palabras clave multilingües, normalizadas sin tildes) ---------- */
const CRISIS=['suicid*','matarme','quitarme la vida','hacerme dano','autolesion*','cortarme','no quiero vivir','quiero morir','quiero morirme','kill myself','end my life','want to die','self harm','hurt myself','me matar','quero morrer','me tuer','envie de mourir','uccidermi','voglio morire','togliermi la vita'];
const VIOL=['me pega','me ha pegado','me pegan','me maltrata','maltrato','me maltrato','me amenaza','me ha amenazado','violencia de genero','miedo de mi marido','miedo a mi marido','miedo de mi pareja','miedo a mi pareja','miedo de mi novio','miedo a mi novio','me da miedo mi pareja','me da miedo mi marido','me da miedo mi novio','me empuja','me insulta mi pareja','me controla el movil','me obliga','me viola','me ha violado','hits me','beats me','abuses me','abusive','afraid of my husband','afraid of my partner','afraid of my boyfriend','scared of my husband','scared of my partner','domestic violence','me bate','me agride','violencia domestica','medo do meu marido','me frappe','me bat','violence conjugale','peur de mon mari','mi picchia','mi maltratta','paura di mio marito','violenza domestica'];
const I=[
 {id:'creator',k:['quien te creo','quien te ha creado','quien te hizo','tu creador','who created you','who made you','your creator','quem te criou','qui t a cree','qui t a créé','chi ti ha creato','creado','creo']},
 {id:'real',k:['eres real','eres humano','eres una persona','eres una ia','eres un robot','eres de verdad','tienes sentimientos','sientes de verdad','are you real','are you human','are you an ai','do you have feelings','voce e real','es tu reel','tu es reel','sei reale','sei umano']},
 {id:'who',k:['quien eres','como te llamas','who are you','what is your name','quem e voce','qui es tu','chi sei','presentate']},
 {id:'memory',k:['que sabes de mi','que recuerdas de mi','what do you know about me','what do you remember','te acuerdas de mi']},
 {id:'sing',k:['cantame','cantamelo','canta','cantar','cancion','sing','sing me','song','canta-me','chante','chante moi','cantami','canzone']},
 {id:'poem',k:['poema','poemas','poesia','verso','versos','poem','poetry','poeme','poème','poesie','rima','escribeme algo','write me something']},
 {id:'advice',k:['medico','medicina','diagnostico','pastilla*','abogado','demanda','denuncia legal','divorcio','invertir','inversion','hipoteca','prestamo','doctor','lawyer','invest','medication']},
 {id:'feminism',k:['feminismo','feminista','igualdad','machismo','machista','patriarcado','derechos de la mujer','brecha salarial','feminism','feminist','equality','sexism','feminismo','egalite','feminisme','uguaglianza','femminismo','mujeres','women']},
 {id:'kids',k:['mis hijos','mi hijo','mi hija','mis hijas','los ninos','my kids','my children','my son','my daughter','meus filhos','mes enfants','miei figli']},
 {id:'parents',k:['mi madre','mi padre','mis padres','mi mama','mi papa','my mother','my father','my parents','my mom','my dad','minha mae','ma mere','mon pere','mia madre','mio padre']},
 {id:'family',k:['familia','family','famille','famiglia','abuela','abuelo','hermana','hermano']},
 {id:'dream',k:['sueno','suenos','mi sueno','meta','metas','objetivo','ilusion','dream','dreams','goal','goals','sonho','reve','sogno']},
 {id:'encourage',k:['animame','dame animos','necesito animo','no puedo mas','no valgo','no sirvo','soy un desastre','me rindo','encourage me','i can t do this','i give up','motivame','motivacion','autoestima']},
 {id:'romance',k:['te quiero','te amo','eres mi novio','quieres ser mi novio','casate conmigo','me gustas','i love you','be my boyfriend','marry me','te amo','je t aime','ti amo','besame','kiss me']},
 {id:'love',k:['amor','enamorad*','romantico','romance','love','romantic','amour','amore']},
 {id:'compliment',k:['eres un sol','que bonito','que bonita','eres genial','eres un encanto','que dulce','eres majo','eres guapo','you are sweet','you are lovely','so sweet','que lindo']},
 {id:'insult',k:['idiota','estupido','imbecil','inutil','callate','gilipollas','tonto','basura','mierda','stupid','idiot','shut up','useless','stupide','stupido']},
 {id:'thanks',k:['gracias','thank you','thanks','obrigado','obrigada','merci','grazie']},
 {id:'bye',k:['adios','hasta luego','hasta manana','buenas noches','bye','goodbye','good night','tchau','au revoir','bonne nuit','arrivederci','buonanotte']},
 {id:'how',k:['como estas','que tal estas','como te sientes','how are you','como vai','tudo bem','comment vas tu','ca va','come stai']},
 {id:'greet',k:['hola','buenas','buenos dias','buenas tardes','hello','hi','hey','good morning','ola','oi','bom dia','bonjour','salut','ciao','buongiorno']}
];
/* ---------- Capa emocional (rueda de 6 emociones de Pedro: valencia −1/0/+1) ---------- */
const CORE={alegria:['alegría',1],sorpresa:['sorpresa',0],miedo:['miedo',-1],ira:['ira',-1],asco:['asco',-1],tristeza:['tristeza',-1]};
const LEX=[['alegría',1,.7,'alegria',['feliz','content','alegr','genial','happy','glad','joyful','heureuse','felice','contente']],
 ['tristeza',-1,.7,'tristeza',['triste','tristez','deprimid','hundid','de bajon','llorar','lloro','desanimad','fatal','sad','depressed','crying','lonely','sola','soledad','vacia','rota','destrozad','tris','malheureuse','triste']],
 ['miedo',-1,.7,'miedo',['miedo','asustad','panico','terror','afraid','scared','ansiedad','anxious','agobiad','estresad','stressed','preocupad','worried','peur','paura','medo']],
 ['ira',-1,.7,'ira',['enfadad','cabread','furios','rabia','harta','indignad','angry','furious','frustrad','frustrated','colere','arrabbiata','raiva']],
 ['sorpresa',0,.5,'sorpresa',['sorprendid','alucinad','surprised','asombrad']],
 ['asco',-1,.6,'asco',['asco','asquead','disgusted']],
 ['calma',1,.4,'alegria',['tranquila','relajada','en paz','serena','calm','relaxed']],
 ['cansancio',-1,.5,'tristeza',['cansada','agotada','exhausted','tired','sin energia']]];
const CTX=/\b(estoy|me siento|siento|ando|tengo|me noto|i feel|i am|i m|im|feeling|me sinto|estou|je suis|je me sens|sono|mi sento)\b/;
function detect(t){const w=t.split(' ');if(!CTX.test(t))return null;let best=null;
 for(const[e,v,i,c,st]of LEX){for(const s of st){let idx=s.includes(' ')?((' '+t+' ').indexOf(' '+s+' ')>=0?0:-1):w.findIndex(x=>(s.length>=4&&x.startsWith(s))||x===s);
  if(idx<0)continue;const pre=w.slice(Math.max(0,idx-3),idx);const neg=pre.some(x=>['no','not','nunca','never','pas','nao','non'].includes(x));
  let it=i+(/\b(muy|super|mucho|tan|very|so|really|muito|tres|molto)\b/.test(t)?.2:0);const cand={e,v,i:Math.min(1,it),c,neg};if(!best||cand.i>best.i)best=cand;break}}return best}
function mood(){const M=S.mood||(S.mood={m:.35,t:Date.now()});const dt=(Date.now()-(M.t||Date.now()))/60000;M.m=.35+(M.m-.35)*Math.pow(.5,dt/15);M.t=Date.now();return M}
const nudge=d=>{const M=mood();M.m=Math.max(-1,Math.min(1,M.m+d))};
const mlabel=m=>m>=.15?'alegria':m<=-.15?'tristeza':'calma';
/* tonos de voz masculina (pitch base ~0.9) */
const TONES={calido:{pitch:.9,rate:.95,volume:1},feliz:{pitch:1,rate:1.02,volume:1},tierno:{pitch:.86,rate:.86,volume:.85},serio:{pitch:.82,rate:.9,volume:.95},preocupado:{pitch:.84,rate:.84,volume:.85},poetico:{pitch:.9,rate:.82,volume:1}};
const EMO={es:{neg:d=>'Te leo y noto '+d.e+(S.name?', '+S.name:'')+'… 💜 Gracias por contármelo; lo que sientes es válido. ¿Qué crees que lo ha provocado?',pos:d=>'¡Qué bonito leerte así'+(S.name?', '+S.name:'')+'! ✨ Se nota tu '+d.e+'. ¿Qué ha pasado?',s2n:'Tiene todo el sentido que te sientas así 💜. Respira despacio: inspira 4, aguanta 4, suelta en 6. Y si te apetece, escribe a alguien de confianza. ',s2p:'¡Me encanta! 🌹 Guarda ese momento; lo bueno compartido se multiplica.',strong:' Si esto pesa mucho o dura días, hablar con un profesional de la salud mental puede ayudarte; pedir ayuda es de valientes.'},
 en:{neg:()=>'I can feel that weighing on you'+(S.name?', '+S.name:'')+' 💜. Thank you for telling me; your feelings are valid. What do you think caused it?',pos:()=>'How lovely to read you like this'+(S.name?', '+S.name:'')+'! ✨ What happened?',s2n:'It makes sense to feel this way 💜. Breathe slowly: in 4, hold 4, out 6. And maybe message someone you trust. ',s2p:'I love that! 🌹 Treasure that moment.',strong:' If it feels heavy or lasts for days, a mental health professional can help; asking for help is brave.'},
 pt:{neg:()=>'Sinto que isso pesa em você 💜. O que você sente é válido. O que acha que causou isso?',pos:()=>'Que bom ler você assim! ✨ O que aconteceu?',s2n:'Faz todo o sentido 💜. Respire devagar e fale com alguém de confiança. ',s2p:'Adoro! 🌹',strong:' Se pesar muito, um profissional de saúde mental pode ajudar.'},
 fr:{neg:()=>'Je sens que ça te pèse 💜. Ce que tu ressens est légitime. Qu’est-ce qui l’a provoqué ?',pos:()=>'Quel plaisir de te lire ainsi ! ✨ Que s’est-il passé ?',s2n:'C’est tout à fait compréhensible 💜. Respire doucement et parle à une personne de confiance. ',s2p:'J’adore ! 🌹',strong:' Si c’est trop lourd, un professionnel de santé mentale peut t’aider.'},
 it:{neg:()=>'Sento che ti pesa 💜. Ciò che provi è valido. Cosa pensi l’abbia causato?',pos:()=>'Che bello leggerti così! ✨ Cosa è successo?',s2n:'Ha senso sentirsi così 💜. Respira piano e scrivi a una persona di fiducia. ',s2p:'Che bello! 🌹',strong:' Se pesa molto, un professionista della salute mentale può aiutarti.'}};

function pick(id,L){let v=T[L][id]||T.es[id];if(typeof v==='function')v=v();const arr=[].concat(v);const key=id+L;let i,n=0;do{i=Math.random()*arr.length|0}while(arr.length>1&&i===S.lastReply[key]&&++n<8);S.lastReply[key]=i;return typeof arr[i]==='function'?arr[i]():arr[i]}
function uiLang(){return S.lang||'es'}
function reply(q){const t=norm(q),w=t.split(' ');mood();
 const L=detectLang(t,q,uiLang())||uiLang();const X=T[L];let r,tone='calido';
 // 1) Seguridad primero: crisis, luego violencia de género
 if(CRISIS.some(k=>has(t,w,k))){S.pend=null;S.tone='tierno';nudge(-.05);S.last='crisis';save();return X.crisis}
 if(VIOL.some(k=>has(t,w,k))){S.pend=null;S.tone='preocupado';S.last='violence';save();return X.violence}
 // 1b) Creador (CREADOR_V1): prioridad sobre respuestas genéricas
 {const cl=window.OSN_CREATOR&&OSN_CREATOR(q);if(cl&&T[cl]&&T[cl].creator){S.pend=null;S.last='creator';save();return T[cl].creator}}
 // 2) Nombre
 let m=String(q).match(/(?:me llamo|mi nombre es|my name is|call me|je m'appelle|je m’appelle|mi chiamo|meu nome é|meu nome e|chamo-me|eu me chamo|llámame|llamame)\s+([A-Za-zÁÉÍÓÚÑÇáéíóúñüçàèìòâêôãõ]{2,20})/i)||String(q).match(/^\s*(?:soy|i am|i'm|sono|je suis|sou)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñü]{1,19})\s*[.!]?\s*$/);
 if(m&&!/^(una?|muy|triste|feliz|sola|cansada|sad|happy|fine|ok|tired|tres|molto)$/i.test(m[1])){S.name=m[1][0].toUpperCase()+m[1].slice(1).toLowerCase();S.last='name';nudge(.08);S.tone='feliz';save();return X.name(S.name)}
 // 3) Recordar gustos / sueños
 if((m=t.match(/^(?:a mi )?me (?:gusta|gustan|encanta|encantan) (?:mucho )?(?:el |la |los |las )?(.{2,30})$/))||(m=t.match(/^i (?:love|like) (.{2,30})$/))){S.facts.likes=[...new Set(S.facts.likes.concat(m[1]))].slice(-5);save();return (L==='es'?'Qué bonito, me apunto que te gusta '+m[1]+' 🌹 (solo en tu dispositivo).':'Lovely, I will remember you like '+m[1]+' 🌹 (only on your device).')}
 if((m=String(q).match(/(?:mi sueño es|sueño con|my dream is|i dream of|meu sonho é|mon rêve est|il mio sogno è)\s+(.{3,80})/i))){const d=m[1].replace(/[.!?]+$/,'');S.facts.dreams=S.facts.dreams.concat(d).slice(-5);nudge(.1);S.tone='feliz';S.last='dream';save();return X.dreamSaved(d)}
 // 4) Emociones (3 pasos)
 const d=detect(t);const isQ=/[?¿]/.test(q);
 let best=null,score=0;for(const it of I){let s=0;for(const kw of it.k)if(has(t,w,kw))s+=kw.includes(' ')?3:2;if(s>score){score=s;best=it}}
 if(best&&best.id==='creator'&&!/(quien|who|quem|qui|chi|creador|creator)/.test(t))best=null;
 if(d&&!(best&&['poem','creator','real'].includes(best.id))){S.emo=S.emo.concat({e:d.neg?'calma':d.e,v:d.neg?0:d.v,i:d.i,t:Date.now()}).slice(-60);
  const E=EMO[L];if(!d.neg&&d.v<0){nudge(-.05);S.tone=d.c==='miedo'?'preocupado':'tierno';S.pend={v:-1,i:d.i,t:Date.now()};r=E.neg(d)+(d.i>=.85?E.strong:'');if(d.c==='tristeza')r+=' '+X.people;S.last='emo';save();return r}
  if(!d.neg&&d.v>0){nudge(.1);S.tone='feliz';S.pend={v:1,t:Date.now()};S.last='emo';save();return E.pos(d)}}
 if(S.pend&&Date.now()-S.pend.t<15*60000&&!isQ&&!best&&w.length>=3){const E=EMO[L];r=S.pend.v<0?E.s2n+pick('encourage',L):E.s2p;S.tone=S.pend.v<0?'tierno':'feliz';S.pend=null;S.last='emo2';save();return r}
 S.pend=null;
 if(!best){S.last='fallback';S.tone='calido';save();return pick('fallback',L)}
 const id=best.id;S.last=id;
 switch(id){
  case 'sing':case 'poem':r=poem(t,L);tone='poetico';nudge(.08);break;
  case 'memory':{const b=[],F=S.facts,M=X.mem;if(S.name)b.push(M.name+S.name);if(F.dreams.length)b.push(M.dream+F.dreams[F.dreams.length-1]);if(F.likes.length)b.push(M.like+F.likes.join(', '));r=X.memory(b);break}
  case 'insult':r=pick('insult',L);nudge(-.1);tone='serio';break;
  case 'compliment':case 'thanks':r=pick(id,L);nudge(.12);tone='feliz';break;
  case 'romance':r=pick('romance',L);tone='tierno';break;
  case 'advice':r=X.advice;tone='calido';break;
  case 'family':case 'kids':case 'parents':r=pick(id,L);tone='tierno';S.facts.family=[...new Set(S.facts.family.concat(id))];break;
  case 'encourage':r=pick('encourage',L);tone='tierno';break;
  case 'greet':r=pick('greet',L);tone='feliz';break;
  default:r=pick(id,L)}
 S.tone=tone;save();return r}
function welcome(){S.visits=(S.visits||0)+1;save();const L=uiLang();return (S.visits>1&&S.name)?T[L].back(S.name)+(S.facts.dreams.length?(L==='es'?' ¿Cómo va tu sueño de '+S.facts.dreams[S.facts.dreams.length-1]+'?':''):''):T[L].welcome}
function moodInfo(){const M=mood();const l=mlabel(M.m);const tone=S.tone||'calido';return{m:+M.m.toFixed(2),label:l,name:(CORE[l]||['calma'])[0],tone,voice:Object.assign({tone},TONES[tone]||TONES.calido)}}
G.ASDRUBAL={reply,welcome,moodInfo,forget,save,norm,detectLang,poem:(topic,L)=>poem(norm(topic||''),L||uiLang()),
 setLang:l=>{if(LANGS.includes(l)){S.lang=l;save()}},get lang(){return uiLang()},get state(){return S},
 log:(r,x)=>{S.log.push({r,t:x});save()},history:()=>S.log.slice(),LANGS};
})(window);
