import { t, tr, money as fmtMoney, locale, getLang } from './i18n.js';
import { workerUrl, withRetry } from './client.js';
import { SITE, waLink } from './site-config.js';

const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => fmtMoney(n) || t('onRequest');
// الصور تُطلب أولاً من نفس نطاق الموقع (/media/…) فلا تتأثر بحجب workers.dev في بعض شبكات الهاتف،
// وإن فشلت نرجع للرابط المباشر ثم لشعار المعرض.
const fileOf = r => { const m = /images\/([a-f0-9-]+\.(?:jpg|png|webp|avif))/i.exec(r?.storage_key || r?.image_url || ''); return m ? m[1] : ''; };
const direct = r => r?.image_url || (r?.storage_key && workerUrl ? `${workerUrl}/images/${r.storage_key.replace(/^images\//, '')}` : '');
const imgUrl = r => { const f = fileOf(r); return f ? { src: `/media/${f}`, alt: direct(r) } : { src: direct(r), alt: '' }; };
const photoObjs = car => (car.car_images || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map(imgUrl).filter(o => o.src);
const photos = car => photoObjs(car).map(o => o.src);
const altOf = car => Object.fromEntries(photoObjs(car).map(o => [o.src, o.alt]));
document.addEventListener('error', e => {
  const i = e.target; if (!i || i.tagName !== 'IMG' || i.classList.contains('ph')) return;
  const alt = i.dataset.alt;
  if (alt && !i.dataset.tried) { i.dataset.tried = '1'; i.src = alt; return; }
  i.onerror = null; i.classList.add('ph'); i.removeAttribute('srcset'); i.src = '/sidahmed-logo-crop.png';
}, true);
const chips = car => [car.year, car.mileage != null && `${Number(car.mileage).toLocaleString(locale())} km`, tr('fuel', car.fuel), tr('gear', car.transmission)].filter(Boolean);
const PH = '<img class="ph" src="sidahmed-logo-crop.png" alt="Sidahmed-auto">';

const spam = fd => fd.get('website') || (Date.now() - (window.__saLast || 0) < 15000);
const stamp = () => { window.__saLast = Date.now(); };

export async function initGallery(supabase) {
  const grid = $('#carsGrid');
  let cars = [], revs = [], filter = 'all';
  if (!supabase) { grid.innerHTML = `<p class="state">${t('loadErr')}</p>`; return; }

  const render = () => {
    const list = filter === 'all' ? cars : cars.filter(c => c.category === filter);
    grid.innerHTML = list.length ? list.map(c => {
      const p = photos(c), name = `${c.brand} ${c.model}`;
      return `<article class="car-card" data-id="${esc(c.id)}" tabindex="0" role="button" aria-label="${esc(name)}">
        <div class="car-img">${p[0] ? `<img src="${esc(p[0])}" data-alt="${esc(altOf(c)[p[0]] || '')}" alt="${esc(name)}" loading="lazy" decoding="async">` : PH}
          ${c.category ? `<span class="tag">${esc(tr('cat', c.category))}</span>` : ''}</div>
        <div class="car-info"><h3>${esc(c.brand)}<small>${esc(c.model)}</small></h3>
          <div class="chips">${chips(c).map(x => `<span>${esc(x)}</span>`).join('')}</div>
          <div class="price">${esc(money(c.price))}</div></div></article>`;
    }).join('') : `<p class="state">${t('noCars')}</p>`;
  };

  const hue = n => [...n].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const stars = n => `<span class="on">${'★'.repeat(n)}</span><span>${'★'.repeat(5 - n)}</span>`;
  const renderReviews = () => {
    const rv = $('#publicReviews');
    if (!revs.length) { $('#reviewSummary').innerHTML = ''; rv.innerHTML = `<p class="state" style="grid-column:1/-1">${t('noReviews')}</p>`; return; }
    const avg = revs.reduce((a, r) => a + r.rating, 0) / revs.length;
    $('#reviewSummary').innerHTML = `<div class="avg">${avg.toFixed(1)}</div><div><div class="stars big">${stars(Math.round(avg))}</div><small>${esc(t('outOf', { n: revs.length }))}</small></div>`;
    rv.innerHTML = revs.slice(0, 6).map(r => {
      const n = Math.min(5, Math.max(0, r.rating || 0));
      return `<article class="review reveal in"><span class="qmark">“</span><div class="stars">${stars(n)}</div>
        <p>${esc(r.comment)}</p>
        <footer><span class="avatar" style="--h:${hue(r.display_name)}">${esc(r.display_name.charAt(0).toUpperCase())}</span>
        <div><strong>${esc(r.display_name)}</strong><small>${esc(new Date(r.created_at).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }))} · ${esc(t('verified'))}</small></div></footer></article>`;
    }).join('');
  };

  grid.innerHTML = '<div class="skeleton"></div>'.repeat(3);
  const CK = 'sa-cars-cache';
  const loadCars = async () => {
    const { data, error } = await withRetry(() => supabase.from('cars').select('*, car_images(*)').eq('status', 'published').order('created_at', { ascending: false }));
    if (!error && data) { cars = data; try { sessionStorage.setItem(CK, JSON.stringify(data)); } catch {} }
    else { try { cars = JSON.parse(sessionStorage.getItem(CK) || '[]'); } catch { cars = []; } }
    if (error && !cars.length) {
      grid.innerHTML = `<div class="state"><p>${t('loadErr')}</p><button type="button" class="outline" id="retryCars" style="margin-top:16px">↻ ${getLang() === 'ar' ? 'إعادة المحاولة' : getLang() === 'fr' ? 'Réessayer' : 'Retry'}</button></div>`;
      $('#retryCars').onclick = () => { grid.innerHTML = '<div class="skeleton"></div>'.repeat(3); loadCars(); };
      return;
    }
    render(); const n = $('#statCars'); if (n) n.textContent = cars.length;
  };
  await loadCars();

  const deep = /^#auto=(.+)$/.exec(location.hash); if (deep) setTimeout(() => open(decodeURIComponent(deep[1])), 300);
  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('.filter'); if (!b) return;
    document.querySelectorAll('.filter').forEach(x => x.classList.toggle('active', x === b));
    filter = b.dataset.filter; render();
  });
  document.addEventListener('sa:lang', () => { render(); renderReviews(); if (modal.classList.contains('open') && openedId) fillModal(openedId); });

  // ---- Modal scheda ----
  const modal = $('#carModal'); let openedId = null;
  function fillModal(id) {
    const c = cars.find(x => String(x.id) === id); if (!c) return;
    const p = photos(c), name = `${c.brand} ${c.model}`;
    const show = u => { const mi = $('#modalImg'); mi.dataset.alt = altOf(c)[u] || ''; delete mi.dataset.tried; mi.classList.remove('ph'); mi.src = u; $('#modalImg').alt = name; $('#modalThumbs').querySelectorAll('img').forEach(i => i.classList.toggle('on', i.dataset.u === u)); };
    $('#modalThumbs').innerHTML = p.length > 1 ? p.map(u => `<img src="${esc(u)}" data-u="${esc(u)}" data-alt="${esc(altOf(c)[u] || '')}" alt="" decoding="async">`).join('') : '';
    $('#modalThumbs').onclick = e => e.target.dataset?.u && show(e.target.dataset.u);
    $('#modalImg').classList.toggle('ph', !p.length); if (p.length) show(p[0]); else { $('#modalImg').src = 'sidahmed-logo-crop.png'; $('#modalImg').alt = name; }
    $('#modalTitle').textContent = name; $('#modalPrice').textContent = money(c.price);
    $('#modalDesc').textContent = c.description || '';
    const specs = [['spYear', c.year], ['spKm', c.mileage != null && Number(c.mileage).toLocaleString(locale())], ['spFuel', tr('fuel', c.fuel)], ['spGear', tr('gear', c.transmission)], ['spHp', c.horsepower], ['spBody', c.body_type], ['spColor', c.color]].filter(([, v]) => v);
    $('#modalSpecs').innerHTML = specs.map(([k, v]) => `<div><small>${esc(t(k))}</small>${esc(v)}</div>`).join('');
    $('#modalCta').onclick = () => { close(); openRequest(c); };
    const link = `${location.origin}${location.pathname}#auto=${c.id}`;
    $('#modalShare').href = `https://wa.me/?text=${encodeURIComponent(name + ' — Sidahmed-auto\n' + link)}`;
  }
  const open = id => {
    const c = cars.find(x => String(x.id) === id); if (!c) return;
    openedId = id; fillModal(id);
    history.replaceState(null, '', `#auto=${c.id}`);
    modal.classList.add('open'); document.body.style.overflow = 'hidden';
    $('#modalClose').focus();
  };
  const close = () => { modal.classList.remove('open'); openedId = null; document.body.style.overflow = ''; if (location.hash.startsWith('#auto=')) history.replaceState(null, '', location.pathname + '#collezione'); };
  grid.addEventListener('click', e => { const c = e.target.closest('.car-card'); if (c) open(c.dataset.id); });
  grid.addEventListener('keydown', e => { if (e.key === 'Enter') { const c = e.target.closest('.car-card'); if (c) open(c.dataset.id); } });
  $('#modalClose').onclick = close;
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  addEventListener('keydown', e => e.key === 'Escape' && close());

  // ---- Richiesta vettura ----
  const rq = $('#reqModal'); let cur = null;
  const closeReq = () => { rq.classList.remove('open'); document.body.style.overflow = ''; };
  function openRequest(c) {
    cur = c; const p = photos(c), name = `${c.brand} ${c.model}`;
    $('#reqCar').innerHTML = `<div class="rc-img">${p[0] ? `<img src="${esc(p[0])}" data-alt="${esc(altOf(c)[p[0]] || '')}" alt="">` : PH}</div>
      <h3>${esc(name)}</h3><div class="chips">${chips(c).map(x => `<span>${esc(x)}</span>`).join('')}</div>
      <div class="rc-price">${esc(money(c.price))}</div>`;
    $('#reqMain').hidden = false; $('#reqDone').hidden = true; $('#reqStatus').textContent = '';
    rq.classList.add('open'); document.body.style.overflow = 'hidden';
  }
  $('#reqClose').onclick = closeReq; $('#doneClose').onclick = closeReq;
  rq.addEventListener('click', e => { if (e.target === rq) closeReq(); });
  addEventListener('keydown', e => e.key === 'Escape' && closeReq());
  $('#reqForm').addEventListener('submit', async e => {
    e.preventDefault(); if (!cur) return;
    const f = e.currentTarget, fd = new FormData(f), st = $('#reqStatus'), btn = $('#reqSubmit');
    if (fd.get('website')) return;
    if (Date.now() - (window.__saLast || 0) < 15000) { st.className = 'status err'; st.textContent = t('tooFast'); return; }
    const ref = 'SA-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const name = `${cur.brand} ${cur.model}`;
    // يُخزَّن نص الرسالة بالعربية (لغة صاحب المعرض) بصيغة ثابتة تقرؤها لوحة الإدارة
    const message = [`🚗 ${name}${cur.year ? ' (' + cur.year + ')' : ''} · ${fmtMoney(cur.price) || '—'}`, `المرجع: ${ref}`,
      `طريقة التواصل: ${fd.get('pref')} · الفترة: ${fd.get('slot')}`, (fd.get('message') || '').trim() && '\n' + fd.get('message').trim()].filter(Boolean).join('\n');
    btn.disabled = true; st.className = 'status'; st.textContent = '…';
    const row = { customer_name: fd.get('customer_name').trim(), email: fd.get('email').trim(), phone: fd.get('phone').trim(), message };
    let { error } = await supabase.from('inquiries').insert({ ...row, car_id: cur.id });
    if (error && /car_id/.test(error.message || '')) ({ error } = await supabase.from('inquiries').insert(row));
    if (!error) stamp();
    btn.disabled = false;
    if (error) { st.classList.add('err'); st.textContent = t('fail'); return; }
    $('#doneText').textContent = t('doneText', { name: fd.get('customer_name').trim().split(' ')[0] });
    $('#doneRef').innerHTML = `${esc(t('refLabel'))}: <b>${ref}</b>`;
    $('#reqMain').hidden = true; $('#reqDone').hidden = false; f.reset();
  });

  // ---- Forms ----
  const submit = (formSel, statusSel, table, build, okKey, after) => $(formSel).addEventListener('submit', async e => {
    e.preventDefault(); const f = e.currentTarget, st = $(statusSel), btn = f.querySelector('button[type=submit]');
    if (spam(new FormData(f))) { if (!new FormData(f).get('website')) { st.className = 'status err'; st.textContent = t('tooFast'); } return; }
    btn.disabled = true; st.className = 'status'; st.textContent = '…';
    const { error } = await supabase.from(table).insert(build(new FormData(f)));
    btn.disabled = false;
    if (error) { st.classList.add('err'); st.textContent = t('fail'); return; }
    stamp(); st.textContent = t(okKey); f.reset(); after?.();
  });
  submit('#inquiryForm', '#inquiryStatus', 'inquiries', fd => ({ customer_name: fd.get('customer_name').trim(), email: fd.get('email').trim(), phone: fd.get('phone').trim() || null, message: fd.get('message').trim() }), 'okInq');
  submit('#reviewForm', '#reviewStatus', 'reviews', fd => ({ display_name: fd.get('display_name').trim(), rating: Number(fd.get('rating')), comment: fd.get('comment').trim() }), 'okRev');

  // ---- Recensioni approvate ----
  const res = await withRetry(() => supabase.from('reviews').select('id,display_name,rating,comment,created_at').eq('approved', true).order('created_at', { ascending: false }).limit(60), 2);
  revs = res.data || [];
  renderReviews();
  const sr = $('#statReviews'), sg = $('#statRating');
  if (sr) sr.textContent = revs.length;
  if (sg) sg.textContent = revs.length ? (revs.reduce((a, r) => a + r.rating, 0) / revs.length).toFixed(1) : '—';
}

export function initMap() {
  const q = encodeURIComponent(SITE.mapQuery);
  const link = document.getElementById('mapsLink');
  if (link) link.href = `https://www.google.com/maps/search/?api=1&query=${q}`;
  const b = document.getElementById('mapLoad'); if (!b) return;
  b.addEventListener('click', () => {
    const f = document.createElement('iframe'); f.title = 'Map'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    f.src = `https://www.google.com/maps?q=${q}&output=embed`;
    document.getElementById('mapBox').replaceChildren(f);
  });
}
