const test = require('node:test');
const assert = require('node:assert/strict');
const n = require('./nucleo.js');

test('un texto de 20000 caracteres se conserva entero', () => {
  const texto = 'á'.repeat(20000);
  const v = n.validarTexto(texto);
  assert.equal(v.ok, true);
  assert.equal(v.texto, texto);
  assert.equal(v.longitud, 20000);
});

test('por encima del límite no se recorta', () => {
  const v = n.validarTexto('x'.repeat(n.LIMITE_TEXTO + 1));
  assert.equal(v.ok, false);
  assert.equal(v.error, 'limite_excedido');
  assert.equal(v.texto, undefined);
});

test('demasiados turnos no se recortan en silencio', () => {
  const mensajes = Array.from({ length: n.MAX_MENSAJES + 1 }, () => ({ rol: 'usuario', texto: 'hola' }));
  const p = n.prepararMensajes(mensajes);
  assert.equal(p.ok, false);
  assert.equal(p.error, 'demasiados_turnos');
});

test('la importación no modifica la cita original', () => {
  const original = 'Cita íntegra del servicio. '.repeat(50);
  const cita = n.importarCita({
    texto: original,
    correccion: 'Nota editorial distinta',
    proveedor: 'gemini',
    fecha: '2026-11-01',
    enlace: 'https://ejemplo.test/respuesta',
    fuente: 'Pegado por Pedro'
  });
  assert.equal(cita.origen, 'importado_por_usuario');
  assert.equal(cita.texto_original, original);
  assert.equal(cita.correccion_editorial, 'Nota editorial distinta');
  assert.notEqual(cita.texto_original, cita.correccion_editorial);
  assert.equal(cita.enlace, 'https://ejemplo.test/respuesta');
});

test('un enlace que no es http no se guarda', () => {
  const cita = n.importarCita({ texto: 'texto', enlace: 'javascript:alert(1)' });
  assert.equal(cita.enlace, '');
});

test('tema propio y debate incompleto salen en el guion', () => {
  const largo = 'P'.repeat(20000);
  const mesa = {
    tema: 'Cocaína y socialismo: semejanzas y diferencias',
    postPedro: largo,
    rondas: [{
      pregunta: '¿Qué es hecho y qué es opinión?',
      turnos: [
        { id: 'may', nombre: 'MAY', papel: 'moderación', personaje: 'may', activo: true, origen: 'servicio', proveedor: 'gemini', modelo: 'gemini-prueba', fecha: '2026-11-07', texto_original: 'MAY separa hechos y opiniones.' },
        { id: 'gemini', nombre: 'Gemini', papel: 'participante', activo: true, origen: 'pendiente', texto_original: '' },
        { id: 'asdrubal', nombre: 'Asdrúbal', papel: 'editorial', personaje: 'asdrubal', activo: true, origen: 'importado_por_usuario', proveedor: 'grok', fecha: '2026-11-02', enlace: 'https://ejemplo.test/g', texto_original: 'Verso importado', correccion_editorial: 'Ajuste de ritmo', aprobado_por_pedro: false }
      ]
    }]
  };
  const g = n.guion(mesa);
  assert.match(g, /Cocaína y socialismo/);
  assert.ok(g.includes(largo));
  assert.match(g, /Debate incompleto/);
  assert.match(g, /Verso importado/);
  assert.match(g, /Ajuste de ritmo/);
  assert.match(g, /no modifica la cita original/);
  assert.match(g, /No es una obra de Pedro/);
  const est = n.estadoDebate(mesa);
  assert.equal(est.completo, false);
});

test('sin respuestas pendientes el debate puede constar como completo', () => {
  const mesa = {
    tema: 'Tema',
    postPedro: 'Post',
    rondas: [{
      turnos: [
        { id: 'may', nombre: 'MAY', origen: 'servicio', texto_original: 'Listo', proveedor: 'gemini' }
      ]
    }]
  };
  assert.equal(n.estadoDebate(mesa).completo, true);
});

test('la salud sin base, sin claves y verificada no se disfraza', () => {
  const sin = n.interpretarSalud(false, null);
  assert.equal(sin.estado, 'configuracion_pendiente');
  assert.match(sin.etiqueta, /No hay IA en vivo/);
  const claves = n.interpretarSalud(true, {
    estado: 'configuracion_pendiente',
    verificado: false,
    pendiente: ['GEMINI_API_KEY', 'XAI_API_KEY'],
    proveedores: [
      { id: 'gemini', estado: 'configuracion_pendiente' },
      { id: 'grok', estado: 'configuracion_pendiente' }
    ]
  });
  assert.equal(claves.estado, 'configuracion_pendiente');
  assert.match(claves.etiqueta, /GEMINI_API_KEY/);
  const sinVer = n.interpretarSalud(true, {
    estado: 'desconectado',
    verificado: false,
    motivo: 'sin_verificacion_real',
    pendiente: [],
    proveedores: [{ id: 'gemini', estado: 'desconectado', motivo: 'sin_verificacion_real' }]
  });
  assert.equal(sinVer.estado, 'desconectado');
  assert.match(sinVer.etiqueta, /sin_verificacion_real/);
  const ok = n.interpretarSalud(true, {
    estado: 'conectado',
    verificado: true,
    proveedores: [{ id: 'gemini', estado: 'conectado' }]
  });
  assert.equal(ok.estado, 'conectado');
  const mentira = n.interpretarSalud(true, { estado: 'conectado', verificado: false, proveedores: [{ id: 'gemini', estado: 'conectado' }] });
  assert.equal(mentira.estado, 'desconectado');
});
