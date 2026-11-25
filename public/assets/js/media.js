// صور السيارات في لوحة الإدارة: نفس نطاق الموقع (/media) أولاً ثم الرابط المباشر ثم شعار المعرض.
export const fileOf = im => { const m = /images\/([a-f0-9-]+\.(?:jpg|png|webp|avif))/i.exec(im?.storage_key || im?.image_url || ''); return m ? m[1] : ''; };
export const mediaAttrs = im => {
  const f = fileOf(im), direct = im?.image_url || '';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return f ? `src="/media/${esc(f)}" data-alt="${esc(direct)}"` : `src="${esc(direct)}"`;
};
let installed = false;
export function installImgFallback() {
  if (installed) return; installed = true;
  // بديل onload المضمّن (محجوب بسياسة الأمان CSP): يُظهر الصورة بعد تحميلها
  document.addEventListener('load', e => { const i = e.target; if (i && i.tagName === 'IMG') i.classList.add('loaded'); }, true);
  document.addEventListener('error', e => {
    const i = e.target; if (!i || i.tagName !== 'IMG' || i.classList.contains('ph')) return;
    if (i.dataset.alt && !i.dataset.tried) { i.dataset.tried = '1'; i.src = i.dataset.alt; return; }
    i.classList.add('ph'); i.removeAttribute('srcset'); i.src = '/sidahmed-logo-crop.png';
  }, true);
}
