import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { loadConfig } from './secure-config.js';

// La configurazione pubblica è cifrata dentro assets/img/noise.png e viene decifrata solo qui, all'avvio.
const cfg = await loadConfig();
export const supabase = (cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY) ? createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY) : null;
export const workerUrl = (cfg.WORKER_URL || '').replace(/\/+$/, '');
