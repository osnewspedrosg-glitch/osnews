/* Cliente del puente. Solo envía el texto que el usuario confirma.
   No guarda claves. No llama a localhost salvo si la propia página está en localhost. */
(function () {
  var N = window.OSN_IA_NUCLEO;
  if (!N) return;
  var ultimo = null;

  function base() {
    var cfg = String(window.OSNEWS_IA_BASE || '').trim().replace(/\/$/, '');
    if (cfg) return cfg;
    var h = (location.hostname || '').toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1') return 'http://127.0.0.1:8090';
    return '';
  }

  function mensajeFallo(data, estado) {
    if (data && data.mensaje) return data.mensaje;
    if (estado === 'configuracion_pendiente') {
      var p = data && data.pendiente && data.pendiente.length ? ' Falta: ' + data.pendiente.join(', ') + '.' : '';
      return 'Configuración pendiente.' + p + ' No hay respuesta del proveedor y esto no es una contestación de MAY, Eva, Asdrúbal, Gemini ni Grok.';
    }
    if (estado === 'limite_excedido' || estado === 'demasiados_turnos') {
      return (data && data.mensaje) || 'El texto supera el límite. No se ha recortado ni enviado.';
    }
    return 'Desconectado: no se ha obtenido respuesta del proveedor. Esto no es una contestación generada.';
  }

  async function leer(res) {
    try { return await res.json(); } catch (e) { return null; }
  }

  async function refrescar() {
    var b = base();
    if (!b) {
      ultimo = N.interpretarSalud(false, null);
      return ultimo;
    }
    try {
      var res = await fetch(b + '/api/salud', { cache: 'no-store' });
      var data = await leer(res);
      ultimo = N.interpretarSalud(true, res.ok || data ? data : null);
    } catch (e) {
      ultimo = N.interpretarSalud(true, null);
    }
    return ultimo;
  }

  async function preguntar(opts) {
    opts = opts || {};
    var b = base();
    if (!b) {
      return { ok: false, estado: 'configuracion_pendiente', texto: null, mensaje: mensajeFallo(null, 'configuracion_pendiente') };
    }
    var prep = N.prepararMensajes(opts.mensajes);
    if (!prep.ok) {
      return { ok: false, estado: prep.error, texto: null, mensaje: prep.mensaje, longitud: prep.longitud, limite: prep.limite };
    }
    if (opts.contexto) {
      var ctx = N.validarTexto(opts.contexto, N.LIMITE_CONTEXTO);
      if (!ctx.ok) return { ok: false, estado: ctx.error, texto: null, mensaje: ctx.mensaje };
      opts = Object.assign({}, opts, { contexto: ctx.texto });
    }
    var cuerpo = {
      papel: opts.papel || 'personaje',
      personaje: opts.personaje || null,
      proveedor: opts.proveedor,
      mensajes: prep.mensajes,
      contexto: opts.contexto || ''
    };
    var res, data;
    try {
      res = await fetch(b + '/api/charla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo)
      });
      data = await leer(res);
    } catch (e) {
      return { ok: false, estado: 'desconectado', texto: null, mensaje: mensajeFallo(null, 'desconectado') };
    }
    if (!res.ok || !data || data.ok !== true || typeof data.texto !== 'string' || !data.texto.length) {
      var estado = (data && data.estado) || 'desconectado';
      return { ok: false, estado: estado, texto: null, mensaje: mensajeFallo(data, estado), pendiente: data && data.pendiente };
    }
    return data;
  }

  function etiquetaServicio(res) {
    var quien = res.papel === 'proveedor'
      ? 'Participante ' + res.proveedor
      : 'Personaje ' + (res.personaje || '');
    var corte = res.cierre && String(res.cierre).toUpperCase() !== 'STOP' ? ' · cierre del proveedor: ' + res.cierre : '';
    return (quien + ' · proveedor ' + res.proveedor + ' · modelo ' + (res.modelo || 'no indicado') + ' · origen servicio · ' + (res.fecha || '') + corte + '. ' + (res.nota_proveedor || N.NOTA_PROVEEDOR)).trim();
  }

  window.OSN_IA = {
    base: base,
    refrescar: refrescar,
    preguntar: preguntar,
    etiquetaServicio: etiquetaServicio,
    ultimo: function () { return ultimo; },
    nucleo: N
  };
})();
