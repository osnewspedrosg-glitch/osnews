/* Núcleo compartido: límites, estados e importación. Sin red y sin claves.
   Los límites coinciden con server/osnews_bridge.py. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OSN_IA_NUCLEO = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var LIMITE_TEXTO = 40000;
  var LIMITE_CONTEXTO = 120000;
  var MAX_MENSAJES = 30;
  var NOTA_PROVEEDOR = 'Varios personajes pueden usar el mismo proveedor. Eso no los convierte en inteligencias independientes.';

  function validarTexto(texto, limite) {
    var max = limite || LIMITE_TEXTO;
    if (typeof texto !== 'string') {
      return { ok: false, error: 'texto_invalido', mensaje: 'El texto tiene que ser una cadena. No se ha enviado.' };
    }
    if (texto.length === 0) {
      return { ok: false, error: 'texto_vacio', mensaje: 'El texto está vacío. No se ha enviado.' };
    }
    if (texto.length > max) {
      return {
        ok: false,
        error: 'limite_excedido',
        longitud: texto.length,
        limite: max,
        mensaje: 'El texto tiene ' + texto.length + ' caracteres y el límite es ' + max + '. No se recorta y no se envía.'
      };
    }
    return { ok: true, texto: texto, longitud: texto.length };
  }

  function prepararMensajes(mensajes) {
    if (!Array.isArray(mensajes) || !mensajes.length) {
      return { ok: false, error: 'sin_mensajes', mensaje: 'No hay mensajes para enviar.' };
    }
    if (mensajes.length > MAX_MENSAJES) {
      return {
        ok: false,
        error: 'demasiados_turnos',
        cantidad: mensajes.length,
        limite: MAX_MENSAJES,
        mensaje: 'Hay ' + mensajes.length + ' turnos y el límite es ' + MAX_MENSAJES + '. No se recortan: divide la conversación o expórtala.'
      };
    }
    var out = [];
    for (var i = 0; i < mensajes.length; i++) {
      var m = mensajes[i] || {};
      var t = validarTexto(m.texto);
      if (!t.ok) return t;
      if (m.rol !== 'usuario' && m.rol !== 'personaje') {
        return { ok: false, error: 'rol_invalido', mensaje: 'Cada turno necesita rol usuario o personaje.' };
      }
      out.push({ rol: m.rol, texto: t.texto });
    }
    return { ok: true, mensajes: out };
  }

  function enlaceSeguro(url) {
    if (!url) return '';
    try {
      var u = new URL(String(url));
      if (u.protocol === 'https:' || u.protocol === 'http:') return u.href;
    } catch (e) {}
    return '';
  }

  function importarCita(o) {
    o = o || {};
    var v = validarTexto(o.texto || '');
    if (!v.ok) return v;
    var corr = typeof o.correccion === 'string' ? o.correccion : '';
    if (corr.length > LIMITE_TEXTO) {
      return validarTexto(corr);
    }
    return {
      ok: true,
      origen: 'importado_por_usuario',
      proveedor: o.proveedor || 'otro',
      fecha: o.fecha || '',
      enlace: enlaceSeguro(o.enlace),
      fuente: typeof o.fuente === 'string' ? o.fuente : '',
      texto_original: v.texto,
      correccion_editorial: corr,
      cita_intacta: true
    };
  }

  function turnoRespondido(t) {
    return t && (t.origen === 'servicio' || t.origen === 'importado_por_usuario') && typeof t.texto_original === 'string' && t.texto_original.length > 0;
  }

  function estadoDebate(mesa) {
    var rondas = (mesa && mesa.rondas) || [];
    var ultima = rondas[rondas.length - 1];
    var turnos = (ultima && ultima.turnos) || [];
    var activos = turnos.filter(function (t) { return t && t.activo !== false; });
    var faltan = activos.filter(function (t) { return !turnoRespondido(t); });
    var nombres = faltan.map(function (t) { return t.nombre || t.id; });
    if (!activos.length) {
      return { completo: false, faltan: [], etiqueta: 'No hay ronda abierta. Esto no es un debate completo.' };
    }
    if (faltan.length) {
      return {
        completo: false,
        faltan: faltan.map(function (t) { return t.id; }),
        etiqueta: 'Debate incompleto. Faltan respuestas de: ' + nombres.join(', ') + '. No se presenta como debate completo.'
      };
    }
    return { completo: true, faltan: [], etiqueta: 'Todas las respuestas invitadas tienen origen de servicio o importación del usuario.' };
  }

  function notaAtribucion(personaje, aprobado) {
    if (personaje !== 'asdrubal') return '';
    return aprobado
      ? 'Pedro ha marcado este texto como aprobado por él.'
      : 'Borrador de IA. No es una obra de Pedro ni se le atribuye como autor.';
  }

  function etiquetaOrigen(t) {
    if (!t) return 'Pendiente: no hay respuesta.';
    if (t.origen === 'importado_por_usuario') {
      return 'Importado por el usuario · ' + (t.proveedor || 'origen externo') + ' · ' + (t.fecha || 'sin fecha') + ' · ' + (t.enlace || t.fuente || 'sin enlace');
    }
    if (t.origen === 'servicio') {
      return 'Servicio ' + (t.proveedor || '') + ' · modelo ' + (t.modelo || 'no indicado') + ' · ' + (t.fecha || 'sin fecha');
    }
    if (t.origen === 'personalidad_local') return 'Personalidad local de la página. No es Gemini ni Grok.';
    return 'Pendiente: no hay respuesta.';
  }

  function guion(mesa) {
    mesa = mesa || {};
    var est = estadoDebate(mesa);
    var lines = [];
    lines.push('MESA ABIERTA · Super MAY');
    lines.push('Tema: ' + (mesa.tema || '(sin tema)'));
    lines.push(est.etiqueta);
    lines.push('Norma OSNews: todo es válido sin violencia ni ataques personales. Las opiniones se distinguen de los hechos. No hay citas inventadas.');
    lines.push(NOTA_PROVEEDOR);
    lines.push('');
    lines.push('— Texto de Pedro (aportado en esta mesa; no se publica desde aquí)');
    lines.push(mesa.postPedro || '(sin texto)');
    lines.push('');
    (mesa.rondas || []).forEach(function (r, i) {
      lines.push('Ronda ' + (i + 1));
      lines.push('Pregunta: ' + (r.pregunta || ''));
      (r.turnos || []).forEach(function (t) {
        var extra = t.personaje === 'asdrubal' ? ' · ' + notaAtribucion('asdrubal', t.aprobado_por_pedro) : '';
        lines.push('[' + (t.nombre || t.id) + ' · ' + (t.papel || '') + ' · ' + etiquetaOrigen(t) + extra + ']');
        if (!turnoRespondido(t)) lines.push('(pendiente: no hay respuesta; no forma parte de un debate completo)');
        else lines.push(t.texto_original);
        if (t.correccion_editorial) {
          lines.push('— Corrección editorial (no modifica la cita original) —');
          lines.push(t.correccion_editorial);
        }
        lines.push('');
      });
    });
    return lines.join('\n');
  }

  function interpretarSalud(hayBase, data) {
    if (!hayBase) {
      return {
        estado: 'configuracion_pendiente',
        etiqueta: 'Configuración pendiente: falta la URL HTTPS del puente (OSNEWS_IA_BASE). No hay IA en vivo.'
      };
    }
    if (!data || typeof data !== 'object') {
      return { estado: 'desconectado', etiqueta: 'Desconectado: el puente no ha respondido. No hay respuesta de un proveedor.' };
    }
    var proveedores = Array.isArray(data.proveedores) ? data.proveedores : [];
    var pendiente = Array.isArray(data.pendiente) ? data.pendiente : [];
    var conectados = proveedores.filter(function (p) { return p && p.estado === 'conectado' && data.verificado === true; });
    if (data.verificado === true && data.estado === 'conectado' && conectados.length) {
      return {
        estado: 'conectado',
        etiqueta: 'Conectado: ' + conectados.map(function (p) { return p.id; }).join(' y ') + ' verificado en este puente. ' + NOTA_PROVEEDOR,
        proveedores: proveedores,
        pendiente: pendiente
      };
    }
    var soloPendiente = proveedores.length && proveedores.every(function (p) { return p.estado === 'configuracion_pendiente'; });
    if (data.estado === 'configuracion_pendiente' || soloPendiente) {
      return {
        estado: 'configuracion_pendiente',
        etiqueta: 'Configuración pendiente en el servidor' + (pendiente.length ? ': ' + pendiente.join(', ') : '') + '. No hay IA en vivo.',
        pendiente: pendiente,
        proveedores: proveedores
      };
    }
    var motivo = data.motivo ? ' (' + data.motivo + ')' : '';
    var falta = pendiente.length ? ' Sigue pendiente: ' + pendiente.join(', ') + '.' : '';
    return {
      estado: 'desconectado',
      etiqueta: 'Desconectado' + motivo + '.' + falta + ' No hay respuesta verificada del proveedor.',
      motivo: data.motivo || '',
      pendiente: pendiente,
      proveedores: proveedores
    };
  }

  return {
    LIMITE_TEXTO: LIMITE_TEXTO,
    LIMITE_CONTEXTO: LIMITE_CONTEXTO,
    MAX_MENSAJES: MAX_MENSAJES,
    NOTA_PROVEEDOR: NOTA_PROVEEDOR,
    validarTexto: validarTexto,
    prepararMensajes: prepararMensajes,
    enlaceSeguro: enlaceSeguro,
    importarCita: importarCita,
    estadoDebate: estadoDebate,
    notaAtribucion: notaAtribucion,
    etiquetaOrigen: etiquetaOrigen,
    guion: guion,
    interpretarSalud: interpretarSalud,
    turnoRespondido: turnoRespondido
  };
});
