/* Charla de texto para un personaje que no tenía chat (Eva).
   No inventa respuestas. El audio y la imagen no pasan por aquí. */
(function () {
  var N = window.OSN_IA_NUCLEO;
  var CRISIS = /(suicid|matarme|quitarme la vida|no quiero vivir|quiero morir|kill myself|me maltrata|violencia de genero)/i;
  var EMERGENCIA = 'Mensaje local de emergencia, no es un proveedor: si estás en peligro llama al 112. En España, conducta suicida 024 y violencia de género 016. Fuera de España, el número local.';

  function el(tag, attrs, texto) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    if (texto != null) n.textContent = texto;
    return n;
  }

  function mount(raiz, opts) {
    if (!raiz || !N || !window.OSN_IA) return;
    opts = opts || {};
    var clave = opts.storageKey || 'osnews-charla';
    var personaje = opts.personaje || 'eva';
    var hilo = [];
    try { hilo = JSON.parse(localStorage.getItem(clave) || '[]'); } catch (e) { hilo = []; }
    if (!Array.isArray(hilo)) hilo = [];

    var estilo = document.getElementById('osn-charla-estilo');
    if (!estilo) {
      estilo = el('style', { id: 'osn-charla-estilo' });
      estilo.textContent = '.osn-charla label{display:block;margin:8px 0}.osn-charla textarea,.osn-charla input,.osn-charla select{width:100%;max-width:100%;box-sizing:border-box;font:inherit;padding:10px;border-radius:10px}.osn-charla textarea{min-height:8rem;resize:vertical}.osn-charla button{min-height:44px;margin:6px 6px 0 0}.osn-charla .burbuja{white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:8px;margin:8px 0}.osn-charla .origen{font-size:.85rem;opacity:.85}.osn-charla .fila{display:flex;flex-wrap:wrap;gap:8px;align-items:end}';
      document.head.appendChild(estilo);
    }

    raiz.innerHTML = '';
    var caja = el('div', { class: 'osn-charla' });
    var estado = el('p', { role: 'status' });
    var log = el('div', { 'aria-live': 'polite' });
    var cuenta = el('p', { class: 'origen' }, '0 caracteres');
    var area = el('textarea', { 'aria-label': 'Texto para ' + personaje, rows: '8' });
    area.placeholder = 'Escribe el texto completo. No se recorta. No se envían cámara, audio ni fotos.';
    var prov = el('select', { 'aria-label': 'Proveedor técnico' });
    [['gemini', 'Gemini'], ['grok', 'Grok']].forEach(function (p) {
      var o = el('option', { value: p[0] }, p[1]);
      prov.appendChild(o);
    });
    var enviar = el('button', { type: 'button' }, 'Enviar este texto al proveedor');
    var copiar = el('button', { type: 'button' }, 'Copiar transcripción');
    var olvidar = el('button', { type: 'button' }, 'Borrar charla de este dispositivo');
    var detImp = el('details');
    detImp.appendChild(el('summary', null, 'Importar una respuesta externa'));
    var impTexto = el('textarea', { 'aria-label': 'Cita original importada', rows: '6' });
    var impCorr = el('textarea', { 'aria-label': 'Corrección editorial', rows: '3' });
    impCorr.placeholder = 'Corrección editorial, aparte de la cita. No sustituye el original.';
    var impFecha = el('input', { type: 'text', 'aria-label': 'Fecha de la respuesta' });
    impFecha.placeholder = 'Fecha';
    var impEnlace = el('input', { type: 'url', 'aria-label': 'Enlace de la respuesta' });
    impEnlace.placeholder = 'https://…';
    var impFuente = el('input', { type: 'text', 'aria-label': 'Fuente' });
    impFuente.placeholder = 'Fuente (quién la obtuvo y dónde)';
    var impProv = prov.cloneNode(true);
    impProv.setAttribute('aria-label', 'Proveedor de la respuesta importada');
    var impBtn = el('button', { type: 'button' }, 'Guardar importación');
    [impProv, impTexto, impCorr, impFecha, impEnlace, impFuente, impBtn].forEach(function (n) { detImp.appendChild(n); });

    function guardar() {
      try { localStorage.setItem(clave, JSON.stringify(hilo)); } catch (e) {
        estado.textContent = 'No se pudo guardar en este dispositivo. El texto sigue en pantalla, sin recortar.';
      }
    }

    function pintar() {
      log.innerHTML = '';
      if (!hilo.length) {
        log.appendChild(el('p', { class: 'origen' }, 'Eva no tiene frases de chat preparadas. Una respuesta aparece solo si el proveedor la devuelve o si la importas.'));
      }
      hilo.forEach(function (t) {
        var b = el('div', { class: 'burbuja' });
        b.appendChild(el('div', null, t.texto || ''));
        b.appendChild(el('div', { class: 'origen' }, t.etiqueta || ''));
        log.appendChild(b);
      });
    }

    function transcripcion() {
      return hilo.map(function (t) {
        return (t.etiqueta || '') + '\n' + (t.texto || '') + (t.correccion ? '\n— Corrección editorial (no modifica la cita) —\n' + t.correccion : '');
      }).join('\n\n');
    }

    area.addEventListener('input', function () {
      var ncar = area.value.length;
      cuenta.textContent = ncar + ' caracteres' + (ncar > N.LIMITE_TEXTO ? '. Supera el límite de ' + N.LIMITE_TEXTO + ': no se enviará ni se recortará.' : '');
    });

    enviar.addEventListener('click', async function () {
      var texto = area.value;
      var v = N.validarTexto(texto);
      if (!v.ok) { estado.textContent = v.mensaje; return; }
      if (CRISIS.test(texto)) {
        hilo.push({ texto: EMERGENCIA, etiqueta: 'Mensaje local de emergencia. No se ha enviado al proveedor.', origen: 'personalidad_local' });
        guardar(); pintar();
        return;
      }
      enviar.disabled = true;
      estado.textContent = 'Consultando al proveedor… todavía no hay respuesta.';
      var previos = hilo.filter(function (t) { return t.origen === 'servicio' || t.origen === 'importado_por_usuario' || t.origen === 'usuario'; })
        .map(function (t) { return { rol: t.origen === 'usuario' ? 'usuario' : 'personaje', texto: t.texto }; });
      if (previos.length + 1 > N.MAX_MENSAJES) {
        estado.textContent = 'Hay ' + (previos.length + 1) + ' turnos y el límite es ' + N.MAX_MENSAJES + '. No se recortan: copia la transcripción o borra la charla.';
        enviar.disabled = false;
        return;
      }
      var res = await OSN_IA.preguntar({
        papel: 'personaje',
        personaje: personaje,
        proveedor: prov.value,
        mensajes: previos.concat([{ rol: 'usuario', texto: texto }])
      });
      hilo.push({ texto: texto, etiqueta: 'Texto enviado por ti · ' + texto.length + ' caracteres', origen: 'usuario' });
      if (!res.ok || !res.texto) {
        hilo.push({ texto: res.mensaje || 'Sin respuesta.', etiqueta: 'Estado: ' + (res.estado || 'desconectado') + '. No es una respuesta del personaje.', origen: res.estado || 'desconectado' });
      } else {
        hilo.push({ texto: res.texto, etiqueta: OSN_IA.etiquetaServicio(res), origen: 'servicio' });
      }
      area.value = '';
      cuenta.textContent = '0 caracteres';
      guardar(); pintar();
      enviar.disabled = false;
      OSN_IA.refrescar().then(function (s) { estado.textContent = s.etiqueta; });
    });

    impBtn.addEventListener('click', function () {
      var cita = N.importarCita({
        texto: impTexto.value,
        correccion: impCorr.value,
        proveedor: impProv.value,
        fecha: impFecha.value.trim(),
        enlace: impEnlace.value.trim(),
        fuente: impFuente.value.trim()
      });
      if (!cita.ok) { estado.textContent = cita.mensaje; return; }
      hilo.push({
        texto: cita.texto_original,
        correccion: cita.correccion_editorial,
        etiqueta: N.etiquetaOrigen(cita) + (cita.correccion_editorial ? ' · hay corrección editorial aparte' : ''),
        origen: 'importado_por_usuario'
      });
      impTexto.value = '';
      guardar(); pintar();
      estado.textContent = 'Importado por el usuario. La cita original no se ha modificado.';
    });

    copiar.addEventListener('click', async function () {
      var t = transcripcion() || 'Sin turnos.';
      try {
        await navigator.clipboard.writeText(t);
        estado.textContent = 'Transcripción copiada, con orígenes.';
      } catch (e) {
        estado.textContent = 'No se pudo copiar sola. Selecciona el texto de la transcripción.';
      }
    });
    olvidar.addEventListener('click', function () {
      hilo = [];
      try { localStorage.removeItem(clave); } catch (e) {}
      pintar();
      estado.textContent = 'Charla borrada de este dispositivo.';
    });

    caja.appendChild(estado);
    caja.appendChild(log);
    caja.appendChild(el('label', null, 'Proveedor técnico'));
    caja.appendChild(prov);
    caja.appendChild(area);
    caja.appendChild(cuenta);
    caja.appendChild(enviar);
    caja.appendChild(copiar);
    caja.appendChild(olvidar);
    caja.appendChild(detImp);
    raiz.appendChild(caja);
    pintar();
    OSN_IA.refrescar().then(function (s) { estado.textContent = s.etiqueta; });
  }

  window.OSN_CHARLA_UI = { mount: mount };
})();
