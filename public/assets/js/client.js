// عميل Supabase للواجهة العامة — بدون top-level await (يعمل على المتصفحات القديمة في الهواتف)
// ويعيد المحاولة تلقائياً إذا تعثّر تحميل المكتبة أو الإعدادات بسبب ضعف الشبكة.
import { loadConfig } from './secure-config.js';

const LIB = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm',
];
const sleep = ms => new Promise(r => setTimeout(r, ms));

export let workerUrl = '';
export let lastError = '';
let clientPromise;

// هل يصل الهاتف إلى Supabase مباشرة؟ بعض الشبكات تحجب النطاق؛ عندها نمرّ عبر /sb على نفس نطاق الموقع.
async function reachable(base, key) {
  const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 7000);
  try {
    const r = await fetch(`${base}/auth/v1/settings`, { headers: { apikey: key }, signal: ac.signal, cache: 'no-store' });
    return r.ok;
  } catch { return false; } finally { clearTimeout(tm); }
}

async function create() {
  let cfg = {};
  for (let i = 0; i < 3; i++) {
    cfg = await loadConfig().catch(() => ({}));
    if (cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY) break;
    await sleep(600 * (i + 1));
  }
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) return null;
  workerUrl = (cfg.WORKER_URL || '').replace(/\/+$/, '');
  let base = cfg.SUPABASE_URL.replace(/\/+$/, '');
  if (!(await reachable(base, cfg.SUPABASE_PUBLISHABLE_KEY))) {
    const proxy = location.origin + '/sb';
    if (await reachable(proxy, cfg.SUPABASE_PUBLISHABLE_KEY)) { base = proxy; console.warn('[SA] using same-origin proxy'); }
  }
  for (let i = 0; i < 4; i++) {
    try {
      const { createClient } = await import(/* @vite-ignore */ LIB[i % LIB.length]);
      return createClient(base, cfg.SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    } catch (e) { console.warn('[SA] supabase lib retry', i + 1, e); await sleep(700 * (i + 1)); }
  }
  return null;
}
export const getClient = () => (clientPromise ||= create());

// طلب مع مهلة وإعادة محاولة (شبكات الهاتف قد تتقطع)
export async function withRetry(fn, tries = 3, timeout = 12000) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await Promise.race([fn(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeout))]);
      if (!res.error) return res;
      last = res; lastError = [res.error.code, res.error.message].filter(Boolean).join(' · ');
    } catch (e) { last = { data: null, error: e }; lastError = String(e.message || e); }
    await sleep(800 * (i + 1));
  }
  return last;
}
