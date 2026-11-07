const $ = s => document.querySelector(s);

const social = [
  ['X', '@awy6969awy', '1 seguidor', 'https://x.com/awy6969awy'],
  ['Facebook', 'Pedro Sánchez', '5.309 seguidores (último informe)', 'https://www.facebook.com/profile.php?id=61595886148837'],
  ['Instagram', '@osnewsmay', '79.300 seguidores · 170 seguidos · 300 publicaciones', 'https://www.instagram.com/osnewsmay/'],
  ['TikTok', '@osnews86', '0 seguidores · 5 me gusta · 10 vídeos', 'https://www.tiktok.com/@osnews86'],
  ['YouTube · Canal OSNews', 'OSNews', '0 suscriptores · 1.042 visualizaciones · 70 vídeos', 'https://www.youtube.com/channel/UCsyOKlZTaQ-6auoVQa_2Dhg']
];

$('#social').innerHTML = social.map(([n, u, d, l]) =>
  `<article class="card"><b>${n}</b><span>${u}</span><strong>${d}</strong>` +
  (['Instagram', 'TikTok'].includes(n)
    ? `<img class="captura-red" src="assets/${n.toLowerCase()}.jpg" alt="Captura del perfil de ${n} enviada por Pedro (cifras históricas, no tiempo real)">`
    : '') +
  `<a href="${l}" target="_blank" rel="noopener">Abrir ${n}</a></article>`
).join('');

// Apps publicadas verificadas (HTTP 200) + acceso a awy de X como Mis redes.
const apps = [
  ['Mis redes · awy de X', 'Tus redes y panel base de awy', '../awy-redes/'],
  ['MAY OS · Cuidado personal', 'Secretaria, salud, apoyo y compras', '../may-cuidado/'],
  ['Habla con MAY', 'Tu asistente personal', '../app/'],
  ['Asdrúbal', 'Tu compañero musical y poeta', '../asdrubal/'],
  ['Eva · Agentes', 'Vídeo, audio, imágenes, gestos y organización', '../eva/'],
  ['MAY · Lenguaje gestual', 'Gestos y reacciones simuladas', '../may-gestos/'],
  ['Binary Money', 'Simulación educativa de finanzas y puntos', '../binary-money/'],
  ['MAY · Producción', 'Agente de productividad y renta en puntos', '../may-produccion/'],
  ['MAY Core', 'Núcleo binario y centro de asistencia', '../may-core/'],
  ['Cleopatra · Puntos', 'Organiza y juega con tus puntos', '../cleopatra-puntos/'],
  ['Mesa abierta', 'Temas propios, textos íntegros e importación con fuente', '#mesa']
];

const appsGrid = $('#apps-grid');
appsGrid.innerHTML = apps.map(([n, d, href]) =>
  `<article class="card app-card" data-name="${n.toLowerCase()}" data-desc="${d.toLowerCase()}">` +
  `<h3>${n}</h3><p>${d}</p>` +
  `<a class="applink" href="${href}">Abrir app</a></article>`
).join('');

const buscar = $('#buscar-apps');
const vacio = $('#buscar-vacio');
function filtrarApps() {
  const q = (buscar.value || '').trim().toLowerCase();
  let visibles = 0;
  appsGrid.querySelectorAll('.app-card').forEach(card => {
    const ok = !q || card.dataset.name.includes(q) || card.dataset.desc.includes(q);
    card.hidden = !ok;
    if (ok) visibles++;
  });
  vacio.hidden = visibles > 0;
}
buscar.addEventListener('input', filtrarApps);
buscar.addEventListener('search', filtrarApps);

document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
  document.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('activo', x === b));
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('activo', x.id === b.dataset.tab));
});

let blob = null;
let records = [];
function fileOf() { return $('#foto').files[0]; }

$('#foto').onchange = () => {
  blob = fileOf();
  if (blob) {
    $('#preview').src = URL.createObjectURL(blob);
    $('#preview').hidden = false;
    $('#estado').textContent = 'Foto cargada en este dispositivo.';
  }
};

function record(r) {
  records.push(r);
  localStorage.setItem('super-may-images', JSON.stringify(records));
  $('#galeria').textContent = `Imágenes guardadas: ${records.length}`;
}

try {
  records = JSON.parse(localStorage.getItem('super-may-images') || '[]');
  $('#galeria').textContent = `Imágenes guardadas: ${records.length}`;
} catch (_) {}

$('#leer').onclick = async () => {
  if (!blob) {
    $('#estado').textContent = 'Primero elige una foto.';
    return;
  }
  $('#estado').textContent = 'Leyendo texto… puede tardar unos segundos. No subas fotos privadas.';
  $('#leer').disabled = true;
  try {
    if (!window.Tesseract) throw Error('No se pudo cargar el lector de texto. Comprueba tu conexión.');
    const r = await Tesseract.recognize(blob, 'spa');
    const t = r.data.text.trim();
    $('#texto').value = t || 'No se ha detectado texto legible. Revisa la foto o escribe tus notas.';
    $('#estado').textContent = t
      ? 'Texto leído: revísalo antes de guardarlo.'
      : 'No hay texto claro en la foto.';
  } catch (e) {
    $('#estado').textContent = e.message;
  }
  $('#leer').disabled = false;
};

$('#guardar-foto').onclick = async () => {
  if (!blob) {
    $('#estado').textContent = 'Elige una foto antes de guardar.';
    return;
  }
  try {
    const db = await new Promise((ok, fail) => {
      const r = indexedDB.open('super-may', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('fotos', { autoIncrement: true });
      r.onsuccess = () => ok(r.result);
      r.onerror = fail;
    });
    await new Promise((ok, fail) => {
      const tx = db.transaction('fotos', 'readwrite');
      tx.objectStore('fotos').add({
        image: blob,
        notes: $('#texto').value,
        date: new Date().toISOString()
      });
      tx.oncomplete = ok;
      tx.onerror = fail;
    });
    record({ date: new Date().toISOString(), notes: $('#texto').value });
    $('#estado').textContent = 'Imagen y notas guardadas en este dispositivo.';
  } catch (_) {
    $('#estado').textContent = 'No se pudo guardar la imagen. Revisa el espacio del dispositivo.';
  }
};

$('#exportar').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' }));
  a.download = 'mis-notas-imagenes-super-may.json';
  a.click();
  URL.revokeObjectURL(a.href);
};

function pick(n) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % n;
}

$('#ideas').value = localStorage.getItem('super-may-ideas') || $('#ideas').value;
$('#girar').onclick = () => {
  const a = $('#ideas').value.split('\n').map(x => x.trim()).filter(Boolean);
  localStorage.setItem('super-may-ideas', $('#ideas').value);
  $('#resultado-ruleta').textContent = a.length ? a[pick(a.length)] : 'Escribe al menos una idea.';
};
$('#dado').onclick = () => {
  $('#resultado-dado').textContent = `Ha salido: ${pick(6) + 1}`;
};

function abrirTab(id) {
  const b = document.querySelector(`[data-tab="${id}"]`);
  if (!b) return;
  b.click();
  const s = document.getElementById(id);
  if (s) s.scrollIntoView({ block: 'start' });
}
appsGrid.querySelectorAll('a[href="#mesa"]').forEach(a => {
  a.addEventListener('click', () => abrirTab('mesa'));
});
window.addEventListener('hashchange', () => abrirTab(location.hash.slice(1)));
if (location.hash) abrirTab(location.hash.slice(1));

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}
