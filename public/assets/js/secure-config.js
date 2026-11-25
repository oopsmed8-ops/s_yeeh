// GENERATO da build-config.py — non modificare a mano.
const P = ["JQQaGz", "jfrZM3", "mCgDvJ", "dU7LhG", "9vPe", "kYQjzH", "IpIMSW"];
const O = [6, 5, 1, 0, 3, 2, 4];
const I = 120000;
const E = "QWSttCVqxLILlvNH4vE+n1A6clCOyyxj0zMkSlZMl0wIH579NfYcj3ATwt7BWss2BCe4Xb7fKiHp59ehcR+UlGoohSpntUKJjBJ+ANH3lQXV+NXAWWriHwMD0tKqwKRoYAi+iZUNnkY0llqVPM0zYZlWFAkthBykLz8v4Y3KasLBcwK1tfk+QpVdHbrN54k7Qlv5w3iU8370WyaTMst1hbp4H52xtIUQ18s63i9Of5WWb1KOOHO6yCI1PCcvTfH4w0/nVb+iJVzegneQyWfo5PbzkWuHJnc/0LHEZxDqQJb1GMWkch5B8Qc/yUR64IHdBRuI9g==";
let cache;
const b = s => Uint8Array.from(s, c => c.charCodeAt(0));
async function open() {
  try {
    let d;
    try { d = Uint8Array.from(atob(E), c => c.charCodeAt(0)); } catch (e) { d = null; }
    if (!d || d.length < 40) {
      const r = await fetch(new URL('../img/noise.png', import.meta.url));
      const u = new Uint8Array(await r.arrayBuffer());
      const n = new DataView(u.buffer).getUint32(u.length - 4);
      if (!n || n > u.length) throw 0;
      d = u.subarray(u.length - 4 - n, u.length - 4);
    }
    const km = await crypto.subtle.importKey('raw', b(O.map(i => P[i]).join('')), 'PBKDF2', false, ['deriveKey']);
    const k = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: d.subarray(0, 16), iterations: I, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const p = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: d.subarray(16, 28), additionalData: b('AG1') }, k, d.subarray(28));
    return JSON.parse(new TextDecoder().decode(p));
  } catch (e) { console.error('[AG] configurazione non disponibile', e); return {}; }
}
export const loadConfig = () => (cache ||= open());
