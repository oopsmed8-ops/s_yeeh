// GENERATO da build-config.py — non modificare a mano.
const P = ["JQQaGz", "jfrZM3", "mCgDvJ", "dU7LhG", "9vPe", "kYQjzH", "IpIMSW"];
const O = [6, 5, 1, 0, 3, 2, 4];
const I = 120000;
let cache;
const b = s => Uint8Array.from(s, c => c.charCodeAt(0));
async function open() {
  try {
    const r = await fetch(new URL('../img/noise.png', import.meta.url));
    const u = new Uint8Array(await r.arrayBuffer());
    const n = new DataView(u.buffer).getUint32(u.length - 4);
    if (!n || n > u.length) throw 0;
    const d = u.subarray(u.length - 4 - n, u.length - 4);
    const km = await crypto.subtle.importKey('raw', b(O.map(i => P[i]).join('')), 'PBKDF2', false, ['deriveKey']);
    const k = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: d.subarray(0, 16), iterations: I, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const p = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: d.subarray(16, 28), additionalData: b('AG1') }, k, d.subarray(28));
    return JSON.parse(new TextDecoder().decode(p));
  } catch (e) { console.error('[AG] configurazione non disponibile'); return {}; }
}
export const loadConfig = () => (cache ||= open());
