import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = readFileSync(join(ROOT, 'contador-osnews.js'), 'utf8');

function loadHelper({ hostname = 'localhost', currentAuto = '0' } = {}) {
  const created = [];
  const listeners = [];
  const currentScript = {
    getAttribute(name) {
      if (name === 'data-auto') return currentAuto;
      if (name === 'data-uso') return '/osnews/demo/uso';
      if (name === 'data-uso-titulo') return 'Uso Demo';
      return null;
    }
  };
  const head = {
    appendChild(el) { created.push(el); return el; }
  };
  const document = {
    currentScript,
    head,
    documentElement: head,
    querySelector(sel) {
      if (sel === 'script[data-goatcounter]') return created.find((e) => e.getAttribute && e.getAttribute('data-goatcounter')) || null;
      return null;
    },
    createElement(tag) {
      const el = { tagName: tag, async: false, src: '', attrs: {} };
      el.setAttribute = (k, v) => { el.attrs[k] = v; };
      el.getAttribute = (k) => el.attrs[k] ?? null;
      return el;
    },
    addEventListener(type, fn, opts) { listeners.push({ type, fn, opts }); }
  };
  const counts = [];
  const root = {
    document,
    location: { hostname },
    setTimeout() {},
    goatcounter: undefined
  };
  vm.runInNewContext(SRC, root);
  return { root, created, listeners, counts, attachCount() {
    root.goatcounter = { count(ev) { counts.push(ev); } };
  }};
}

test('esLive solo en GitHub Pages de OSNews', () => {
  const { root } = loadHelper({ hostname: 'localhost' });
  assert.equal(root.osnewsContador.esLive({ hostname: 'localhost' }), false);
  assert.equal(root.osnewsContador.esLive({ hostname: '127.0.0.1' }), false);
  assert.equal(root.osnewsContador.esLive({ hostname: 'osnewspedrosg-glitch.github.io' }), true);
});

test('en local inyecta el script de GoatCounter pero no envía el evento de uso', () => {
  const ctx = loadHelper({ hostname: 'localhost' });
  const api = ctx.root.osnewsContador.iniciar({ pathUso: '/osnews/demo/uso', titleUso: 'Uso Demo' }, ctx.root);
  assert.ok(ctx.created.some((s) => s.src === 'https://gc.zgo.at/count.js'));
  assert.ok(ctx.created.some((s) => s.getAttribute('data-goatcounter') === 'https://osnews-may.goatcounter.com/count'));
  ctx.attachCount();
  assert.equal(api.contarUso(), false);
  assert.equal(ctx.counts.length, 0);
});

test('en Pages envía un único evento de uso tras el clic, sin secretos', () => {
  const ctx = loadHelper({ hostname: 'osnewspedrosg-glitch.github.io' });
  ctx.attachCount();
  const api = ctx.root.osnewsContador.iniciar({ pathUso: '/osnews/museos/uso', titleUso: 'Uso Museos' }, ctx.root);
  assert.equal(api.contarUso(), true);
  assert.equal(api.contarUso(), true);
  assert.equal(ctx.counts.length, 1);
  assert.equal(ctx.counts[0].path, '/osnews/museos/uso');
  assert.equal(ctx.counts[0].title, 'Uso Museos');
  assert.equal(ctx.counts[0].event, true);
  assert.equal(SRC.includes('goatcounter'), true);
  assert.equal(/api[_-]?key|password|bearer\s+token/i.test(SRC), false);
});

const APPS = [
  { dir: 'anibal', files: ['anibal/index.html'], rel: '../contador-osnews.js', uso: '/osnews/anibal/uso', title: 'Uso Aníbal' },
  { dir: 'museos', files: ['museos/index.html'], rel: '../contador-osnews.js', uso: '/osnews/museos/uso', title: 'Uso Museos' },
  { dir: 'lorena', files: ['lorena/index.html'], rel: '../contador-osnews.js', uso: '/osnews/lorena/uso', title: 'Uso Módulo Lorena' },
  { dir: 'canales', files: ['canales/index.html'], rel: '../contador-osnews.js', uso: '/osnews/canales/uso', title: 'Uso Canales OSNews' },
  { dir: 'tv-world/ligera', files: ['tv-world/ligera/index.html'], rel: '../../contador-osnews.js', uso: '/osnews/tv-world/ligera/uso', title: 'Uso TV World ligera' }
];

test('las cinco apps publicadas incluyen visita y uso, y la ruta del script existe', () => {
  for (const app of APPS) {
    const html = readFileSync(join(ROOT, app.files[0]), 'utf8');
    assert.match(html, /data-goatcounter="https:\/\/osnews-may\.goatcounter\.com\/count"/);
    assert.match(html, /src="https:\/\/gc\.zgo\.at\/count\.js"/);
    assert.ok(html.includes(`src="${app.rel}"`), app.files[0]);
    assert.ok(html.includes(`data-uso="${app.uso}"`), app.files[0]);
    assert.ok(html.includes(`data-uso-titulo="${app.title}"`), app.files[0]);
    const fromPage = resolve(dirname(join(ROOT, app.files[0])), app.rel);
    assert.equal(fromPage, join(ROOT, 'contador-osnews.js'));
    assert.ok(existsSync(fromPage));
  }
});

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

test('todas las HTML de Canales y ligera tienen GoatCounter y el helper', () => {
  for (const p of [...walk(join(ROOT, 'canales')), ...walk(join(ROOT, 'tv-world/ligera'))]) {
    const html = readFileSync(p, 'utf8');
    assert.match(html, /data-goatcounter="https:\/\/osnews-may\.goatcounter\.com\/count"/, p);
    assert.ok(html.includes('contador-osnews.js'), p);
    assert.ok(html.includes('data-uso='), p);
  }
});

test('los generadores de Canales y ligera conservan el contador en el próximo refresco', () => {
  const canales = readFileSync(join(ROOT, 'scripts/actualizar-canales.py'), 'utf8');
  const ligera = readFileSync(join(ROOT, 'scripts/actualizar-tv-ligera.py'), 'utf8');
  assert.ok(canales.includes('def goat_tags'));
  assert.ok(canales.includes('contador-osnews.js'));
  assert.ok(canales.includes('/osnews/canales/uso'));
  assert.ok(ligera.includes('contador-osnews.js'));
  assert.ok(ligera.includes('/osnews/tv-world/ligera/uso'));
  assert.ok(ligera.includes('osnews-may.goatcounter.com/count'));
});
