#!/usr/bin/env python3
"""
Sidahmed-auto — seals the site public configuration.

Cifra (AES-256-GCM, chiave derivata con PBKDF2) SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e WORKER_URL
e le nasconde in coda a un vero PNG (assets/img/noise.png, usato come grana nell'hero).
Genera anche assets/js/secure-config.js con le istruzioni di decifratura (chiave frammentata).

Uso:   python3 tools/build-config.py --worker-url https://tuo-worker.workers.dev
       (legge .env: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, [WORKER_URL])

NOTA DI SICUREZZA — IMPORTANTE
 * Questo è OFFUSCAMENTO: tiene i valori fuori da view-source, grep e scraper automatici.
   Non può fermare chi apre gli strumenti di sviluppo del browser: ciò che il browser decifra, il browser lo vede.
 * Per questo si sigillano SOLO valori pubblici per progetto. La vera sicurezza è RLS (database-security.sql).
 * SUPABASE_SECRET_KEY NON viene mai inclusa: vive solo nei secret del Worker (wrangler secret put).
"""
from pathlib import Path
import argparse, base64, hashlib, json, os, random, secrets, struct, sys, zlib

REPO = Path(__file__).resolve().parent.parent
ROOT = REPO / "public"
ITER = 120_000
PUBLIC_KEYS = ("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "WORKER_URL")

def read_env(path):
    out = {}
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1); v = v.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "'\"":
            v = v[1:-1]
        out[k.strip()] = v
    return out

def placeholder(v):
    v = (v or "").strip()
    return not v or "...." in v or v.upper().startswith(("YOUR_", "PASTE_"))

def noise_png(size=128):
    """PNG grigio a grana (valido): lo useremo davvero come texture nell'hero."""
    rnd = random.Random(secrets.randbits(64))
    raw = b"".join(b"\x00" + bytes(rnd.randint(0, 255) for _ in range(size)) for _ in range(size))
    def chunk(t, d): return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 0, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))

def main():
    ap = argparse.ArgumentParser(description="Sigilla la configurazione pubblica in assets/img/noise.png")
    ap.add_argument("--env", default=str(REPO / ".env")); ap.add_argument("--worker-url")
    a = ap.parse_args()
    env_path = Path(a.env)
    if not env_path.exists(): sys.exit(f"ERRORE: {env_path} non trovato.")
    env = read_env(env_path)
    if a.worker_url: env["WORKER_URL"] = a.worker_url.rstrip("/")
    env["WORKER_URL"] = env.get("WORKER_URL") or os.environ.get("WORKER_URL", "")
    cfg = {k: env.get(k, "") for k in PUBLIC_KEYS}
    bad = [k for k in ("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY") if placeholder(cfg[k])]
    if bad: sys.exit("ERRORE: valori mancanti o segnaposto in .env: " + ", ".join(bad))
    if not cfg["SUPABASE_PUBLISHABLE_KEY"].startswith(("sb_publishable_", "eyJ")):
        sys.exit("ERRORE: SUPABASE_PUBLISHABLE_KEY non sembra una chiave pubblica.")
    if cfg["SUPABASE_PUBLISHABLE_KEY"].startswith("sb_secret_"):
        sys.exit("ERRORE: hai inserito una chiave SEGRETA come pubblica. Fermati.")

    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    passphrase = base64.b64encode(secrets.token_bytes(30)).decode()          # 40 caratteri
    salt, iv = secrets.token_bytes(16), secrets.token_bytes(12)
    key = hashlib.pbkdf2_hmac("sha256", passphrase.encode(), salt, ITER, 32)
    ct = AESGCM(key).encrypt(iv, json.dumps(cfg, separators=(",", ":")).encode(), b"AG1")
    payload = salt + iv + ct

    (ROOT / "assets/img").mkdir(parents=True, exist_ok=True)
    (ROOT / "assets/img/noise.png").write_bytes(noise_png() + payload + struct.pack(">I", len(payload)))

    # chiave frammentata e rimescolata (rende più laborioso il grep, non impossibile)
    step = 6; parts = [passphrase[i:i + step] for i in range(0, len(passphrase), step)]
    order = list(range(len(parts))); random.SystemRandom().shuffle(order)
    shuffled = [parts[i] for i in order]; where = [order.index(i) for i in range(len(parts))]
    js = f"""// GENERATO da build-config.py — non modificare a mano.
const P = {json.dumps(shuffled)};
const O = {json.dumps(where)};
const I = {ITER};
let cache;
const b = s => Uint8Array.from(s, c => c.charCodeAt(0));
async function open() {{
  try {{
    let d;\n    try {{ d = Uint8Array.from(atob(E), c => c.charCodeAt(0)); }} catch (e) {{ d = null; }}\n    if (!d || d.length < 40) {{\n      const r = await fetch(new URL('../img/noise.png', import.meta.url));\n      const u = new Uint8Array(await r.arrayBuffer());\n      const n = new DataView(u.buffer).getUint32(u.length - 4);\n      if (!n || n > u.length) throw 0;\n      d = u.subarray(u.length - 4 - n, u.length - 4);\n    }}\n    const km = await crypto.subtle.importKey('raw', b(O.map(i => P[i]).join('')), 'PBKDF2', false, ['deriveKey']);
    const k = await crypto.subtle.deriveKey({{ name: 'PBKDF2', salt: d.subarray(0, 16), iterations: I, hash: 'SHA-256' }}, km, {{ name: 'AES-GCM', length: 256 }}, false, ['decrypt']);
    const p = await crypto.subtle.decrypt({{ name: 'AES-GCM', iv: d.subarray(16, 28), additionalData: b('AG1') }}, k, d.subarray(28));
    return JSON.parse(new TextDecoder().decode(p));
  }} catch (e) {{ console.error('[AG] configurazione non disponibile'); return {{}}; }}
}}
export const loadConfig = () => (cache ||= open());
"""
    (ROOT / "assets/js/secure-config.js").write_text(js, encoding="utf-8")
    print("OK  assets/img/noise.png  (PNG valido + configurazione cifrata)")
    print("OK  assets/js/secure-config.js")
    print("Sicurezza: SUPABASE_SECRET_KEY non è stata inclusa. Conservala solo nei secret del Worker.")
    if not placeholder(env.get("SUPABASE_SECRET_KEY", "")):
        print("ATTENZIONE: .env contiene una chiave segreta. Non caricare mai .env online.")

if __name__ == "__main__":
    main()
