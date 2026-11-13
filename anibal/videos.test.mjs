import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const js = readFileSync(join(dir, 'app.js'), 'utf8');
let n = 0, fails = 0;
function ok(cond, what) {
  n++;
  if (!cond) { fails++; console.log('FAIL ' + what); }
}

ok(!/iframe[^>]+youtube/i.test(html), 'no youtube iframe');
ok(!/youtube\.com\/embed/i.test(html), 'no youtube embed');
ok(!/googletag|gtag\(|facebook\.net|tiktok\.com\/embed/i.test(html), 'no third-party trackers or embeds');
ok((html.match(/<video\b/g) || []).length === 9, 'nine html5 videos');
ok(html.includes('id="videos-osnews"'), 'videos section');
ok(!/tiktok\.com/.test(html), 'no tiktok button');
ok(!/facebook\.com/.test(html), 'no facebook button');
ok(html.includes('id="vpn-acceso"'), 'vpn section');
ok(html.includes('https://protonvpn.com/free-vpn'), 'proton official');
ok(html.includes('https://psiphon.ca'), 'psiphon official');
ok(html.includes('https://www.torproject.org/download/'), 'tor official');
ok(html.includes('En algunos países el uso de VPN está restringido o es ilegal'), 'vpn warning');
ok(html.includes('OSNews no recibe nada por estos enlaces'), 'no affiliate');
ok(html.includes('releases/download/anibal-v1.3/Anibal-OSNews-v1.3.apk'), 'apk 1.3');
ok(html.includes('preload="none"'), 'videos do not preload');
ok(js.includes("videos: 'Vídeos OSNews'"), 'i18n videos');
ok(js.includes("vpn: 'VPN · acceso libre a la información'"), 'i18n vpn');
ok(!js.includes('TikTok OSNews'), 'no tiktok i18n');

console.log((n - fails) + '/' + n + ' checks passed');
if (fails) process.exit(1);
