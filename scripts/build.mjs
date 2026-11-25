// Dependency-free static build: copies public/ -> dist/, sets the domain, verifies local references.
import { cpSync, rmSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';

const SRC = 'public', OUT = 'dist';
const domain = (process.env.SITE_DOMAIN || process.env.RENDER_EXTERNAL_HOSTNAME || '')
  .replace(/^https?:\/\//, '').replace(/\/+$/, '');

rmSync(OUT, { recursive: true, force: true });
cpSync(SRC, OUT, { recursive: true });

const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(OUT);

// 1) domain: text files only (never PNG/JPG: noise.png holds the encrypted config)
if (domain) {
  for (const f of files.filter(f => ['.html', '.txt', '.xml'].includes(extname(f)))) {
    const s = readFileSync(f, 'utf8');
    if (s.includes('YOUR-DOMAIN.com')) writeFileSync(f, s.replaceAll('YOUR-DOMAIN.com', domain));
  }
  console.log('Domain set:', domain);
} else {
  console.warn('WARNING: SITE_DOMAIN is not set; YOUR-DOMAIN.com remains in canonical/sitemap/robots.');
}

// 2) reminder: contact details in site-config.js
const cfg = readFileSync(join(SRC, 'assets/js/site-config.js'), 'utf8');
if (/phone:\s*'\+213 000 00 00 00'/.test(cfg) || /whatsapp:\s*'213000000000'/.test(cfg))
  console.warn('WARNING: public/assets/js/site-config.js still has placeholder phone/WhatsApp/address. Edit it before going live.');

// 3) check: every local src/href/import must exist (avoids a broken deploy)
const errors = [];
const check = (from, ref) => {
  if (!ref || /^(https?:|data:|mailto:|tel:|#|\/\/|javascript:)/i.test(ref)) return;
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean) return;
  const target = clean.startsWith('/') ? join(OUT, clean) : resolve(dirname(from), clean);
  if (!existsSync(target)) errors.push(`${from} -> ${ref}`);
};
for (const f of files) {
  const ext = extname(f);
  if (ext === '.html') {
    const s = readFileSync(f, 'utf8');
    for (const m of s.matchAll(/(?<![\w-])(?:src|href)=["']([^"']+)["']/g)) check(f, m[1]);
  } else if (ext === '.js') {
    const s = readFileSync(f, 'utf8');
    for (const m of s.matchAll(/(?:from\s+|import\s+|import\()\s*['"](\.{1,2}\/[^'"]+)['"]/g)) check(f, m[1]);
    for (const m of s.matchAll(/new URL\(\s*['"](\.{1,2}\/[^'"]+)['"]/g)) check(f, m[1]);
  } else if (ext === '.css') {
    const s = readFileSync(f, 'utf8');
    for (const m of s.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) check(f, m[1]);
  }
}
for (const need of ['index.html', 'admin.html', '404.html', 'sidahmed-logo-crop.png', 'assets/img/noise.png', 'assets/js/secure-config.js', 'assets/js/site-config.js'])
  if (!existsSync(join(OUT, need))) errors.push('missing ' + need);

if (errors.length) { console.error('ERRORS:\n - ' + errors.join('\n - ')); process.exit(1); }
console.log(`OK: ${files.length} files in ${OUT}/`);
