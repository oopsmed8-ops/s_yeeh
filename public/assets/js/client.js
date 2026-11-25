// عميل Supabase للواجهة العامة — بدون top-level await (يعمل على المتصفحات القديمة في الهواتف)
// ويعيد المحاولة تلقائياً إذا تعثّر تحميل المكتبة أو الإعدادات بسبب ضعف الشبكة.
import { loadConfig } from './secure-config.js';

const LIB = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm',
];
const sleep = ms => new Promise(r => setTimeout(r, ms));

export let workerUrl = '';
let clientPromise;

async function create() {
  let cfg = {};
  for (let i = 0; i < 3; i++) {
    cfg = await loadConfig().catch(() => ({}));
    if (cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY) break;
    await sleep(600 * (i + 1));
  }
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) return null;
  workerUrl = (cfg.WORKER_URL || '').replace(/\/+$/, '');
  for (let i = 0; i < 4; i++) {
    try {
      const { createClient } = await import(/* @vite-ignore */ LIB[i % LIB.length]);
      return createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
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
      last = res;
    } catch (e) { last = { data: null, error: e }; }
    await sleep(800 * (i + 1));
  }
  return last;
}
