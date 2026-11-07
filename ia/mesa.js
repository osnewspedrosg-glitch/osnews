/* Mesa abierta de Super MAY: tema propio, texto íntegro, importación y rondas.
   No publica en X ni en YouTube y no rellena respuestas pendientes. */
(function () {
  var N = window.OSN_IA_NUCLEO;
  var CLAVE = 'super-may-mesa-abierta';
  var CATALOGO = [
    { id: 'may', nombre: 'MAY', papel: 'moderación', personaje: 'may', tipo: 'personaje', nota: 'Modera. El proveedor técnico se elige en el turno.' },
    { id: 'eva', nombre: 'Eva', papel: 'acompañamiento', personaje: 'eva', tipo: 'personaje', nota: 'Acompaña. No recibe cámara, audio ni fotos.' },
    { id: 'asdrubal', nombre: 'Asdrúbal', papel: 'editorial', personaje: 'asdrubal', tipo: 'personaje', nota: 'Editorial, poeta y músico. Borrador de IA hasta que Pedro lo apruebe.' },
    { id: 'gemini', nombre: 'Gemini', papel: 'participante', tipo: 'proveedor', proveedor: 'gemini', nota: 'Solo con respuesta real del servicio o importada por ti.' },
    { id: 'grok', nombre: 'Grok', papel: 'participante', tipo: 'proveedor', proveedor: 'grok', nota: 'Solo con respuesta real del servicio o importada por ti.' }
  ];

  function el(tag, attrs, texto) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    if (texto != null) n.textContent = texto;
    return n;
  }

  function cargar() {
    try {
      var o = JSON.parse(localStorage.getItem(CLAVE) || 'null');
      if (o && typeof o === 'object') return o;
    } catch (e) {}
    return { tema: '', postPedro: '', rondas: [] };
  }

  function mount(raiz) {
    if (!raiz || !N) return;
    var mesa = cargar();
    var estado = el('p', { id: 'mesa-estado', role: 'status', class: 'nota' });
    var completo = el('p', { id: 'mesa-completo', role: 'status', class: 'nota' });
    var tema = el('textarea', { id: 'mesa-tema', rows: '3', 'aria-label': 'Tema propio' });
    tema.placeholder = 'Cocaína y socialismo: semejanzas y diferencias';
    tema.value = mesa.tema || '';
    var pedro = el('textarea', { id: 'mesa-pedro', rows: '10', 'aria-label': 'Texto íntegro de Pedro' });
    pedro.placeholder = 'Pega aquí el post o el texto completo de Pedro. No se recorta y no se publica.';
    pedro.value = mesa.postPedro || '';
    var pedroN = el('p', { class: 'nota' });
    var pregunta = el('textarea', { id: 'mesa-pregunta', rows: '4', 'aria-label': 'Pregunta de la ronda' });
    var marcas = {};
    var field = el('fieldset');
    field.appendChild(el('legend', null, 'Quién participa en la próxima ronda'));
    CATALOGO.forEach(function (p) {
      var id = 'mesa-p-' + p.id;
      var lab = el('label');
      var cb = el('input', { type: 'checkbox', id: id, value: p.id });
      if (p.id === 'may') cb.checked = true;
      marcas[p.id] = cb;
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(' ' + p.nombre + ' — ' + p.nota));
      field.appendChild(lab);
    });
    var abrir = el('button', { type: 'button', id: 'mesa-ronda' }, 'Abrir ronda');
    var copiar = el('button', { type: 'button', id: 'mesa-copiar' }, 'Copiar guion');
    var bajar = el('button', { type: 'button', id: 'mesa-exportar' }, 'Descargar guion');
    var rondas = el('div', { id: 'mesa-rondas' });

    function guardar() {
      mesa.tema = tema.value;
      mesa.postPedro = pedro.value;
      try { localStorage.setItem(CLAVE, JSON.stringify(mesa)); }
      catch (e) { estado.textContent = 'No cabe en la memoria de este dispositivo. El texto sigue en pantalla, sin recortar.'; }
    }

    function contar() {
      var n = pedro.value.length;
      pedroN.textContent = n + ' caracteres en el texto de Pedro' + (n > N.LIMITE_TEXTO ? '. Supera ' + N.LIMITE_TEXTO + ': no se enviará ni se recortará.' : '.');
    }

    function contexto() {
      var partes = [
        'Tema: ' + (mesa.tema || '(sin tema)'),
        'Norma OSNews: sin violencia ni ataques personales. Separa opiniones de hechos. No inventes citas.',
        'Texto de Pedro aportado en la mesa:\n' + (mesa.postPedro || '(sin texto)')
      ];
      (mesa.rondas || []).forEach(function (r, i) {
        partes.push('Ronda ' + (i + 1) + ' · pregunta: ' + (r.pregunta || ''));
        (r.turnos || []).forEach(function (t) {
          if (N.turnoRespondido(t)) partes.push(t.nombre + ' (' + t.origen + '):\n' + t.texto_original);
        });
      });
      return partes.join('\n\n');
    }

    function pintar() {
      guardar();
      completo.textContent = N.estadoDebate(mesa).etiqueta;
      rondas.innerHTML = '';
      (mesa.rondas || []).forEach(function (r, idx) {
        var art = el('article', { class: 'card' });
        art.appendChild(el('h3', null, 'Ronda ' + (idx + 1)));
        art.appendChild(el('p', null, r.pregunta || ''));
        r.turnos.forEach(function (t) {
          var box = el('div', { class: 'card' });
          box.appendChild(el('h3', null, t.nombre));
          box.appendChild(el('p', { class: 'nota' }, t.nota || ''));
          var et = N.turnoRespondido(t) ? N.etiquetaOrigen(t) : 'Pendiente: no hay respuesta. No cuenta como debate completo.';
          if (t.error) et += ' ' + t.error;
          box.appendChild(el('p', { class: 'nota' }, et));
          if (t.personaje === 'asdrubal') {
            box.appendChild(el('p', { class: 'nota' }, N.notaAtribucion('asdrubal', t.aprobado_por_pedro)));
            var labA = el('label');
            var cbA = el('input', { type: 'checkbox' });
            cbA.checked = !!t.aprobado_por_pedro;
            cbA.addEventListener('change', function () { t.aprobado_por_pedro = cbA.checked; pintar(); });
            labA.appendChild(cbA);
            labA.appendChild(document.createTextNode(' Pedro aprueba este texto como suyo'));
            box.appendChild(labA);
          }
          if (N.turnoRespondido(t)) {
            var orig = el('textarea', { rows: '8', readonly: 'readonly', 'aria-label': 'Cita original de ' + t.nombre });
            orig.value = t.texto_original;
            box.appendChild(el('p', { class: 'nota' }, 'Cita original'));
            box.appendChild(orig);
            var corr = el('textarea', { rows: '4', 'aria-label': 'Corrección editorial de ' + t.nombre });
            corr.value = t.correccion_editorial || '';
            corr.placeholder = 'Corrección editorial. No modifica la cita original.';
            corr.addEventListener('input', function () { t.correccion_editorial = corr.value; guardar(); });
            box.appendChild(el('p', { class: 'nota' }, 'Corrección editorial'));
            box.appendChild(corr);
          }
          if (t.tipo === 'personaje') {
            var sel = el('select', { 'aria-label': 'Proveedor para ' + t.nombre });
            [['gemini', 'Gemini'], ['grok', 'Grok']].forEach(function (p) {
              var o = el('option', { value: p[0] }, p[1]);
              if ((t.proveedorElegido || 'gemini') === p[0]) o.selected = true;
              sel.appendChild(o);
            });
            sel.addEventListener('change', function () { t.proveedorElegido = sel.value; guardar(); });
            box.appendChild(sel);
          }
          var pedir = el('button', { type: 'button' }, 'Pedir respuesta al proveedor');
          pedir.addEventListener('click', function () { pedirRespuesta(t, pedir); });
          box.appendChild(pedir);
          var det = el('details');
          det.appendChild(el('summary', null, 'Importar respuesta'));
          var iTexto = el('textarea', { rows: '6', 'aria-label': 'Texto importado de ' + t.nombre });
          var iCorr = el('textarea', { rows: '3', 'aria-label': 'Corrección al importar ' + t.nombre });
          var iFecha = el('input', { type: 'text', 'aria-label': 'Fecha', placeholder: 'Fecha' });
          var iEnlace = el('input', { type: 'url', 'aria-label': 'Enlace', placeholder: 'https://…' });
          var iFuente = el('input', { type: 'text', 'aria-label': 'Fuente', placeholder: 'Fuente' });
          var iBtn = el('button', { type: 'button' }, 'Guardar cita importada');
          iBtn.addEventListener('click', function () {
            var cita = N.importarCita({
              texto: iTexto.value,
              correccion: iCorr.value,
              proveedor: t.tipo === 'proveedor' ? t.proveedor : (t.proveedorElegido || 'gemini'),
              fecha: iFecha.value.trim(),
              enlace: iEnlace.value.trim(),
              fuente: iFuente.value.trim()
            });
            if (!cita.ok) { t.error = cita.mensaje; pintar(); return; }
            t.origen = 'importado_por_usuario';
            t.texto_original = cita.texto_original;
            t.correccion_editorial = cita.correccion_editorial;
            t.fecha = cita.fecha;
            t.enlace = cita.enlace;
            t.fuente = cita.fuente;
            t.proveedor = cita.proveedor;
            t.modelo = '';
            t.error = '';
            pintar();
          });
          [iTexto, iCorr, iFecha, iEnlace, iFuente, iBtn].forEach(function (n) { det.appendChild(n); });
          box.appendChild(det);
          art.appendChild(box);
        });
        rondas.appendChild(art);
      });
    }

    async function pedirRespuesta(t, boton) {
      var preg = (mesa.rondas.find(function (r) { return r.turnos.indexOf(t) >= 0; }) || {}).pregunta || mesa.tema;
      var v = N.validarTexto(preg || 'Participa en la mesa con el contexto.');
      if (!v.ok) { t.error = v.mensaje; pintar(); return; }
      var ctx = contexto();
      var vc = N.validarTexto(ctx, N.LIMITE_CONTEXTO);
      if (!vc.ok) { t.error = vc.mensaje; pintar(); return; }
      if (!window.OSN_IA) {
        t.origen = 'pendiente';
        t.error = 'Configuración pendiente: falta el cliente del puente. No hay respuesta de un proveedor.';
        pintar();
        return;
      }
      boton.disabled = true;
      estado.textContent = 'Consultando al proveedor para ' + t.nombre + '… todavía no hay respuesta.';
      var res = await OSN_IA.preguntar({
        papel: t.tipo === 'proveedor' ? 'proveedor' : 'personaje',
        personaje: t.personaje || null,
        proveedor: t.tipo === 'proveedor' ? t.proveedor : (t.proveedorElegido || 'gemini'),
        mensajes: [{ rol: 'usuario', texto: v.texto }],
        contexto: vc.texto
      });
      if (!res.ok || !res.texto) {
        t.origen = 'pendiente';
        t.texto_original = '';
        t.error = res.mensaje || 'Sin respuesta del proveedor.';
      } else {
        t.origen = 'servicio';
        t.texto_original = res.texto;
        t.proveedor = res.proveedor;
        t.modelo = res.modelo || '';
        t.fecha = res.fecha || '';
        t.enlace = '';
        t.fuente = 'servicio';
        t.error = '';
        if (!t.correccion_editorial) t.correccion_editorial = '';
      }
      boton.disabled = false;
      pintar();
      if (window.OSN_IA) OSN_IA.refrescar().then(function (s) { estado.textContent = s.etiqueta; });
    }

    tema.addEventListener('input', guardar);
    pedro.addEventListener('input', function () { contar(); guardar(); });
    abrir.addEventListener('click', function () {
      var ids = CATALOGO.filter(function (p) { return marcas[p.id].checked; });
      if (!ids.length) { completo.textContent = 'Elige al menos a un participante. No se ha creado una ronda vacía.'; return; }
      if (!pregunta.value.trim() && !tema.value.trim()) {
        completo.textContent = 'Escribe un tema o una pregunta. No se inventa el debate.';
        return;
      }
      mesa.rondas.push({
        pregunta: pregunta.value,
        turnos: ids.map(function (p) {
          return {
            id: p.id,
            nombre: p.nombre,
            papel: p.papel,
            nota: p.nota,
            personaje: p.personaje || null,
            tipo: p.tipo,
            proveedor: p.proveedor || '',
            proveedorElegido: 'gemini',
            activo: true,
            origen: 'pendiente',
            texto_original: '',
            correccion_editorial: '',
            aprobado_por_pedro: false
          };
        })
      });
      pregunta.value = '';
      pintar();
    });

    function textoGuion() {
      guardar();
      return N.guion(mesa);
    }
    copiar.addEventListener('click', async function () {
      var t = textoGuion();
      try {
        await navigator.clipboard.writeText(t);
        estado.textContent = 'Guion copiado, con turnos, fuentes y huecos pendientes.';
      } catch (e) {
        estado.textContent = 'No se pudo copiar al portapapeles. Usa Descargar guion.';
      }
    });
    bajar.addEventListener('click', function () {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([textoGuion()], { type: 'text/plain;charset=utf-8' }));
      a.download = 'guion-mesa-abierta.txt';
      a.click();
      URL.revokeObjectURL(a.href);
    });

    var intro = el('div');
    intro.appendChild(el('h2', null, 'Mesa abierta'));
    intro.appendChild(el('p', null, 'La mesa cerrada sigue en la portada, con sus temas y las citas reales de X. Aquí el tema lo escribes tú. No se inventan políticos, citas ni respuestas, y no se publica en X ni en YouTube.'));
    var enlace = el('a', { href: '../' }, 'Abrir la mesa cerrada de OSNews');
    intro.appendChild(enlace);
    intro.appendChild(el('p', { class: 'nota' }, 'Norma OSNews: todo es válido sin violencia ni ataques personales. Las opiniones van aparte de los hechos. ' + N.NOTA_PROVEEDOR));
    intro.appendChild(estado);
    intro.appendChild(el('label', { for: 'mesa-tema' }, 'Tema propio'));
    intro.appendChild(tema);
    intro.appendChild(el('label', { for: 'mesa-pedro' }, 'Texto de Pedro, íntegro'));
    intro.appendChild(pedro);
    intro.appendChild(pedroN);
    intro.appendChild(field);
    intro.appendChild(el('label', { for: 'mesa-pregunta' }, 'Pregunta de esta ronda'));
    intro.appendChild(pregunta);
    var acciones = el('div', { class: 'actions' });
    acciones.appendChild(abrir);
    acciones.appendChild(copiar);
    acciones.appendChild(bajar);
    intro.appendChild(acciones);
    intro.appendChild(completo);
    raiz.innerHTML = '';
    raiz.appendChild(intro);
    raiz.appendChild(rondas);
    contar();
    pintar();
    if (window.OSN_IA) OSN_IA.refrescar().then(function (s) { estado.textContent = s.etiqueta; });
    else estado.textContent = 'Configuración pendiente: falta el cliente del puente. No hay IA en vivo.';
  }

  function listo() {
    var raiz = document.getElementById('mesa-root');
    if (raiz) mount(raiz);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', listo);
  else listo();
  window.OSN_MESA = { mount: mount };
})();
