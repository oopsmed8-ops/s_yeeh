// Gestione completa di Richieste (inquiries) e Recensioni (reviews) nella dashboard.
import { supabase } from './supabase.js';
import { t, addTranslations, money as fmtMoney, locale } from './i18n.js';
import { mediaAttrs } from './media.js';

addTranslations({
 ar:{inSearch:"ابحث بالاسم أو البريد أو الرسالة…",stAll:"الكل",stNew:"جديدة",stContacted:"تم التواصل",stClosed:"مغلقة",markContacted:"تم التواصل",closeLead:"إغلاق",reopen:"إعادة فتح",sendEmail:"بريد",call:"اتصال",wa:"واتساب",noPhone:"بدون هاتف",noLeads:"لا توجد طلبات.",noRevs:"لا توجد تقييمات.",exportCsv:"تصدير CSV",refresh:"تحديث",approve:"اعتماد",hide:"إخفاء",delRev:"حذف",revPending:"بانتظار المراجعة",revPublished:"منشور",rvAll:"الكل",rvPending:"بانتظار المراجعة",rvPub:"منشورة",confirmDel:"حذف نهائي؟",actFail:"فشلت العملية. تحقق من صلاحيات RLS في Supabase.",notes:"ملاحظات داخلية",saveNote:"حفظ الملاحظة",noteSaved:"تم حفظ الملاحظة.",newBadge:"جديد",openCar:"فتح البطاقة",pContacted:"تم التواصل",pClosed:"مغلق",total:"إجمالي"},
 en:{inSearch:"Search name, email, message…",stAll:"All",stNew:"New",stContacted:"Contacted",stClosed:"Closed",markContacted:"Mark contacted",closeLead:"Close",reopen:"Reopen",sendEmail:"Email",call:"Call",wa:"WhatsApp",noPhone:"No phone",noLeads:"No inquiries received.",noRevs:"No reviews received.",exportCsv:"Export CSV",refresh:"Refresh",approve:"Approve",hide:"Hide",delRev:"Delete",revPending:"Pending",revPublished:"Published",rvAll:"All",rvPending:"Pending",rvPub:"Published",confirmDel:"Delete permanently?",actFail:"Action failed. Check Supabase RLS permissions.",notes:"Internal notes",saveNote:"Save note",noteSaved:"Note saved.",newBadge:"NEW",openCar:"Open vehicle",pContacted:"Contacted",pClosed:"Closed",total:"total"},
 fr:{inSearch:"Rechercher nom, e-mail, message…",stAll:"Toutes",stNew:"Nouvelles",stContacted:"Contactées",stClosed:"Fermées",markContacted:"Marquer contactée",closeLead:"Fermer",reopen:"Rouvrir",sendEmail:"E-mail",call:"Appeler",wa:"WhatsApp",noPhone:"Pas de téléphone",noLeads:"Aucune demande reçue.",noRevs:"Aucun avis reçu.",exportCsv:"Exporter CSV",refresh:"Actualiser",approve:"Approuver",hide:"Masquer",delRev:"Supprimer",revPending:"À valider",revPublished:"Publié",rvAll:"Tous",rvPending:"À valider",rvPub:"Publiés",confirmDel:"Supprimer définitivement ?",actFail:"Opération échouée. Vérifiez les permissions RLS dans Supabase.",notes:"Notes internes",saveNote:"Enregistrer la note",noteSaved:"Note enregistrée.",newBadge:"NOUVELLE",openCar:"Ouvrir la fiche",pContacted:"Contactée",pClosed:"Fermée",total:"au total"}
});

addTranslations({
 ar:{selectAll:"تحديد الكل",selectedN:"{n} محدد",delItem:"حذف",delSel:"حذف المحدد",delClosed:"حذف المغلقة",clearSel:"إلغاء التحديد",confirmDelN:"سيتم حذف {n} نهائياً ولا يمكن التراجع. متابعة؟",confirmDelOne:"حذف هذا العنصر نهائياً؟",delFail:"تعذّر الحذف. شغّل ملف database/fix-admin-permissions.sql في Supabase (SQL Editor) ثم أعد المحاولة.",bulkFail:"لم تُطبَّق العملية على كل العناصر. شغّل ملف database/fix-admin-permissions.sql في Supabase.",needImage:"لا يمكن نشر سيارة بدون صورة. أضف صورة واحدة على الأقل أو احفظها كمسودة.",maxImages:"الحد الأقصى 15 صورة لكل سيارة.",savedAsDraft:"حُفظت السيارة كمسودة لأن رفع الصورة لم ينجح. أعد رفع صورة ثم انشرها.",currentImages:"الصور الحالية",primary:"الرئيسية",makePrimary:"جعلها رئيسية",noWorker:"رابط رفع الصور (Worker) غير مُعدّ.",delImgConfirm:"حذف هذه الصورة نهائياً؟",lastImage:"هذه آخر صورة لسيارة منشورة. حوّل السيارة إلى مسودة أولاً أو أضف صورة أخرى.",markSelected:"تم التواصل",reopenSel:"إعادة فتح",approveSel:"اعتماد",hideSel:"إخفاء"},
 en:{selectAll:"Select all",selectedN:"{n} selected",delItem:"Delete",delSel:"Delete selected",delClosed:"Delete closed",clearSel:"Clear selection",confirmDelN:"{n} item(s) will be permanently deleted. Continue?",confirmDelOne:"Delete this item permanently?",delFail:"Delete failed. Run database/fix-admin-permissions.sql in Supabase (SQL Editor) and retry.",bulkFail:"The action was not applied to every item. Run database/fix-admin-permissions.sql in Supabase.",needImage:"A vehicle cannot be published without an image. Add at least one image or save it as a draft.",maxImages:"Maximum 15 images per vehicle.",savedAsDraft:"Saved as draft because the image upload failed. Re-upload an image, then publish.",currentImages:"Current images",primary:"Primary",makePrimary:"Make primary",noWorker:"Image upload Worker URL is not configured.",delImgConfirm:"Delete this image permanently?",lastImage:"This is the last image of a published vehicle. Set it to draft first or add another image.",markSelected:"Mark contacted",reopenSel:"Reopen",approveSel:"Approve",hideSel:"Hide"},
 fr:{selectAll:"Tout sélectionner",selectedN:"{n} sélectionné(s)",delItem:"Supprimer",delSel:"Supprimer la sélection",delClosed:"Supprimer les fermées",clearSel:"Désélectionner",confirmDelN:"{n} élément(s) seront supprimés définitivement. Continuer ?",confirmDelOne:"Supprimer définitivement cet élément ?",delFail:"Suppression impossible. Exécutez database/fix-admin-permissions.sql dans Supabase (SQL Editor) puis réessayez.",bulkFail:"L'action n'a pas été appliquée à tous les éléments. Exécutez database/fix-admin-permissions.sql dans Supabase.",needImage:"Impossible de publier un véhicule sans image. Ajoutez au moins une image ou enregistrez en brouillon.",maxImages:"Maximum 15 images par véhicule.",savedAsDraft:"Enregistré en brouillon car l'envoi de l'image a échoué. Renvoyez une image puis publiez.",currentImages:"Images actuelles",primary:"Principale",makePrimary:"Définir principale",noWorker:"L'URL du Worker d'envoi d'images n'est pas configurée.",delImgConfirm:"Supprimer cette image définitivement ?",lastImage:"C'est la dernière image d'un véhicule publié. Passez-le en brouillon ou ajoutez une autre image.",markSelected:"Marquer contactée",reopenSel:"Rouvrir",approveSel:"Approuver",hideSel:"Masquer"}
});

addTranslations({
 ar:{upChecking:"جارٍ فحص خادم رفع الصور…",uploading:"رفع الصورة {i} من {n}…",upType:"{name}: نوع الملف غير مدعوم. استعمل JPEG أو PNG أو WebP.",upBig:"{name}: الصورة كبيرة جداً حتى بعد الضغط (الحد 10 ميغابايت).",upNet:"تعذّر الاتصال بخادم رفع الصور (Cloudflare Worker). السبب الأرجح: المتغيّر ALLOWED_ORIGIN في الـ Worker لا يتضمن عنوان موقعك {origin}. أضفه في Cloudflare ← Workers ← Settings ← Variables ثم أعد المحاولة.",upHealth:"خادم رفع الصور غير مكتمل الإعداد في Cloudflare. الناقص: {what}.",upAdmin:"حسابك غير معرّف كمسؤول (admin) في جدول profiles، لذلك رفض الخادم الرفع.",upHttp:"رفض خادم الصور الطلب: {msg}",upDb:"رُفعت الصورة لكن تعذّر ربطها بالسيارة: {msg}. شغّل database/fix-admin-permissions.sql في Supabase."},
 en:{upChecking:"Checking the image server…",uploading:"Uploading image {i} of {n}…",upType:"{name}: unsupported file type. Use JPEG, PNG or WebP.",upBig:"{name}: image is too large even after compression (10 MB limit).",upNet:"Could not reach the image upload server (Cloudflare Worker). Most likely ALLOWED_ORIGIN in the Worker does not include your site {origin}. Add it in Cloudflare → Workers → Settings → Variables and retry.",upHealth:"The image server is not fully configured in Cloudflare. Missing: {what}.",upAdmin:"Your account is not an admin in the profiles table, so the server refused the upload.",upHttp:"The image server rejected the request: {msg}",upDb:"Image uploaded but could not be linked to the vehicle: {msg}. Run database/fix-admin-permissions.sql in Supabase."},
 fr:{upChecking:"Vérification du serveur d'images…",uploading:"Envoi de l'image {i} sur {n}…",upType:"{name} : type de fichier non pris en charge. Utilisez JPEG, PNG ou WebP.",upBig:"{name} : image trop lourde même après compression (limite 10 Mo).",upNet:"Impossible de joindre le serveur d'envoi d'images (Cloudflare Worker). Cause probable : ALLOWED_ORIGIN du Worker n'inclut pas votre site {origin}. Ajoutez-le dans Cloudflare → Workers → Settings → Variables puis réessayez.",upHealth:"Le serveur d'images n'est pas entièrement configuré dans Cloudflare. Manquant : {what}.",upAdmin:"Votre compte n'est pas admin dans la table profiles ; le serveur a refusé l'envoi.",upHttp:"Le serveur d'images a refusé la requête : {msg}",upDb:"Image envoyée mais non liée au véhicule : {msg}. Exécutez database/fix-admin-permissions.sql dans Supabase."}
});

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const state = { leads: [], reviews: [], cars: [], lf: 'all', rf: 'all', q: '', loaded: false, sel: new Set(), rsel: new Set() };
let openCar = () => {};
export const setCarOpener = fn => { openCar = fn; };
const eur = n => fmtMoney(n) || '—';
const thumb = c => (c.car_images || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0] || null;
// Collega una richiesta alla sua vettura: car_id (nuovo) oppure nome nel messaggio (vecchie richieste)
function carOf(l) {
  if (l.car_id) return state.cars.find(c => String(c.id) === String(l.car_id)) || null;
  const m = /^🚗 (.+?)(?: \(\d{4}\))? · /.exec(l.message || '');
  if (!m) return null;
  const n = m[1].trim().toLowerCase();
  return state.cars.find(c => `${c.brand} ${c.model}`.trim().toLowerCase() === n) || null;
}
function carCard(l) {
  const c = carOf(l);
  if (!c) return carBadge(l.message);
  const img = thumb(c), st = c.status === 'published' ? '' : `<em class="car-st">${esc(c.status || '')}</em>`;
  const ref = /(?:المرجع|Rif|Ref): (\S+)/.exec(l.message || '')?.[1];
  return `<button type="button" class="car-link" data-open-car="${esc(c.id)}" title="${esc(t('openCar'))}">
    <span class="cl-img">${img ? `<img ${mediaAttrs(img)} alt="" loading="lazy">` : '🚗'}</span>
    <span class="cl-txt"><strong>${esc(c.brand)} ${esc(c.model)}</strong><small>${esc(c.year || '')} · ${eur(c.price)} ${st}</small>${ref ? `<small>${esc(ref)}</small>` : ''}</span>
    <span class="cl-go">${esc(t('openCar'))} →</span></button>`;
}

const when = d => d ? new Date(d).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' }) : '';
const digits = p => String(p || '').replace(/[^\d]/g, '');
const stOf = l => l.status || 'new';
const pill = s => ({ new: ['stNew', 'new'], contacted: ['pContacted', 'contacted'], closed: ['pClosed', 'closed'] }[s] || ['stNew', 'new']);

function toolbar(prefix, filters, active) {
  return `<div class="inbox-bar"><div class="inbox-filters">${filters.map(([k, l, n]) => `<button type="button" class="inbox-chip ${active === k ? 'on' : ''}" data-${prefix}f="${k}">${esc(t(l))}${n !== undefined ? ` <b>${n}</b>` : ''}</button>`).join('')}</div></div>`;
}

const carBadge = m => { const x = /^🚗 (.+)\n(?:(?:المرجع|Rif|Ref): (\S+))?/.exec(m || ''); return x ? `<div class="car-badge">🚗 <strong>${esc(x[1])}</strong>${x[2] ? `<span>${esc(x[2])}</span>` : ''}</div>` : ''; };
const stripCar = m => (m || '').replace(/^🚗 .+\n((?:المرجع|Rif|Ref): \S+\n)?/, '');

const bulkBar = (kind, rows, selSet, actions, extra = '') => {
  const n = selSet.size, all = rows.length && rows.every(r => selSet.has(String(r.id)));
  return `<div class="bulk-bar ${n ? 'on' : ''}"><label class="bulk-all"><input type="checkbox" data-selall="${kind}" ${all ? 'checked' : ''}><span>${esc(t('selectAll'))}</span></label>`
    + (n ? `<span class="bulk-count">${esc(t('selectedN', { n }))}</span><div class="bulk-actions">${actions.map(([a, lab, cls]) => `<button type="button" class="inbox-btn ${cls || ''}" data-bulk="${kind}:${a}">${esc(t(lab))}</button>`).join('')}<button type="button" class="inbox-btn ghost" data-clearsel="${kind}">${esc(t('clearSel'))}</button></div>` : extra) + `</div>`;
};
const chk = (kind, id, set) => `<label class="sel-box"><input type="checkbox" data-sel="${kind}:${esc(id)}" ${set.has(String(id)) ? 'checked' : ''} aria-label="select"></label>`;

function renderLeads() {
  const el = document.getElementById('leadsList'); if (!el) return;
  const q = state.q.toLowerCase(), all = state.leads;
  const cnt = s => all.filter(l => stOf(l) === s).length;
  const rows = all.filter(l => (state.lf === 'all' || stOf(l) === state.lf) && (!q || [l.customer_name, l.email, l.phone, l.message].join(' ').toLowerCase().includes(q)));
  const closedN = cnt('closed');
  el.innerHTML = `<div class="inbox-top"><input type="search" id="leadSearch" class="inbox-search" placeholder="${esc(t('inSearch'))}" value="${esc(state.q)}">
    <button type="button" class="inbox-btn" id="leadCsv">⇩ ${esc(t('exportCsv'))}</button><button type="button" class="inbox-btn" id="leadRefresh">↻ ${esc(t('refresh'))}</button></div>`
    + toolbar('l', [['all', 'stAll', all.length], ['new', 'stNew', cnt('new')], ['contacted', 'stContacted', cnt('contacted')], ['closed', 'stClosed', closedN]], state.lf)
    + (rows.length ? bulkBar('lead', rows, state.sel, [['contacted', 'markSelected'], ['closed', 'closeLead'], ['new', 'reopenSel'], ['delete', 'delSel', 'danger']],
        closedN ? `<button type="button" class="inbox-btn danger" data-del-closed="1">🗑 ${esc(t('delClosed'))} (${closedN})</button>` : '') : '')
    + (rows.length ? rows.map(l => {
      const s = stOf(l), [lab, cls] = pill(s), next = s === 'new' ? 'contacted' : s === 'contacted' ? 'closed' : 'new';
      const nextLab = s === 'new' ? 'markContacted' : s === 'contacted' ? 'closeLead' : 'reopen';
      const subj = encodeURIComponent('Sidahmed-auto · ' + (l.customer_name || ''));
      return `<article class="lead-card ${s === 'new' ? 'is-new' : ''} ${state.sel.has(String(l.id)) ? 'is-sel' : ''}" data-id="${esc(l.id)}">
        <header>${chk('lead', l.id, state.sel)}<div class="lead-avatar">${esc((l.customer_name || '?').charAt(0).toUpperCase())}</div>
          <div class="lead-who"><strong>${esc(l.customer_name)}</strong><small>${esc(when(l.created_at))}</small></div>
          <span class="pill ${cls}">${s === 'new' ? esc(t('newBadge')) : esc(t(lab))}</span></header>
        ${carCard(l)}<blockquote>${esc(stripCar(l.message || '—')).replace(/\n/g, '<br>')}</blockquote>
        <div class="lead-contact"><a href="mailto:${esc(l.email)}?subject=${subj}">✉ <span>${esc(l.email)}</span></a>${l.phone ? `<a href="tel:${esc(l.phone)}" dir="ltr">☎ <span>${esc(l.phone)}</span></a><a target="_blank" rel="noopener" href="https://wa.me/${digits(l.phone)}">◎ ${esc(t('wa'))}</a>` : `<span class="muted">${esc(t('noPhone'))}</span>`}</div>
        <footer><button type="button" class="inbox-btn primary" data-lead-status="${esc(l.id)}" data-next="${next}">${esc(t(nextLab))}</button>
          <button type="button" class="inbox-btn danger" data-lead-del="${esc(l.id)}">🗑 ${esc(t('delItem'))}</button></footer></article>`;
    }).join('') : `<p class="placeholder-text">${esc(t('noLeads'))}</p>`);
}

function renderReviews() {
  const el = document.getElementById('reviewsList'); if (!el) return;
  const all = state.reviews, pend = all.filter(r => !r.approved).length;
  const rows = all.filter(r => state.rf === 'all' || (state.rf === 'pending' ? !r.approved : r.approved));
  el.innerHTML = toolbar('r', [['all', 'rvAll', all.length], ['pending', 'rvPending', pend], ['pub', 'rvPub', all.length - pend]], state.rf)
    + (rows.length ? bulkBar('rev', rows, state.rsel, [['approve', 'approveSel'], ['hide', 'hideSel'], ['delete', 'delSel', 'danger']]) : '')
    + (rows.length ? rows.map(r => `<article class="lead-card ${r.approved ? '' : 'is-new'} ${state.rsel.has(String(r.id)) ? 'is-sel' : ''}">
      <header>${chk('rev', r.id, state.rsel)}<div class="lead-avatar">${esc((r.display_name || '?').charAt(0).toUpperCase())}</div>
        <div class="lead-who"><strong>${esc(r.display_name)}</strong><small>${esc(when(r.created_at))}</small></div>
        <span class="stars">${'★'.repeat(Math.min(5, r.rating || 0))}${'☆'.repeat(5 - Math.min(5, r.rating || 0))}</span>
        <span class="pill ${r.approved ? 'contacted' : 'new'}">${esc(t(r.approved ? 'revPublished' : 'revPending'))}</span></header>
      <blockquote>${esc(r.comment).replace(/\n/g, '<br>')}</blockquote>
      <footer><button type="button" class="inbox-btn primary" data-rev-toggle="${esc(r.id)}" data-approved="${!r.approved}">${esc(t(r.approved ? 'hide' : 'approve'))}</button>
        <button type="button" class="inbox-btn danger" data-rev-del="${esc(r.id)}">🗑 ${esc(t('delRev'))}</button></footer></article>`).join('')
      : `<p class="placeholder-text">${esc(t('noRevs'))}</p>`);
}

function badges() {
  const lb = document.getElementById('leadsBadge'), rb = document.getElementById('reviewsBadge');
  const n = state.leads.filter(l => stOf(l) === 'new').length, p = state.reviews.filter(r => !r.approved).length;
  if (lb) { lb.textContent = n; lb.hidden = !n; }
  if (rb) { rb.textContent = p; rb.hidden = !p; }
}

export async function loadInbox() {
  const [l, r, c] = await Promise.all([
    supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('cars').select('id,brand,model,year,price,status,car_images(image_url,storage_key,sort_order)')]);
  state.cars = c.data || [];
  if (l.error) console.error('[SA inbox] inquiries', l.error);
  if (r.error) console.error('[SA inbox] reviews', r.error);
  state.leads = l.data || []; state.reviews = r.data || []; state.loaded = true;
  const ids = a => new Set(a.map(x => String(x.id)));
  { const L = ids(state.leads), R = ids(state.reviews); state.sel.forEach(i => L.has(i) || state.sel.delete(i)); state.rsel.forEach(i => R.has(i) || state.rsel.delete(i)); }
  renderLeads(); renderReviews(); badges();
}

const fail = () => alert(t('actFail'));
function csv() {
  const head = ['date', 'name', 'email', 'phone', 'status', 'message'];
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const body = state.leads.map(l => [l.created_at, l.customer_name, l.email, l.phone, stOf(l), l.message].map(q).join(','));
  const blob = new Blob(['\ufeff' + [head.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `leads-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click(); URL.revokeObjectURL(a.href);
}

const TBL = { lead: ['inquiries', 'sel', loadInbox], rev: ['reviews', 'rsel', loadInbox] };
// الحذف/التحديث مع التحقق الفعلي: RLS قد يعيد "نجاح" دون تعديل أي صف، لذلك نقارن عدد الصفوف المتأثرة.
async function removeRows(table, ids) {
  const { data, error } = await supabase.from(table).delete().in('id', ids).select('id');
  if (error || (data || []).length < ids.length) { console.error('[SA inbox] delete', error, data); alert(t('delFail')); return false; }
  return true;
}
async function patchRows(table, ids, patch) {
  const { data, error } = await supabase.from(table).update(patch).in('id', ids).select('id');
  if (error || (data || []).length < ids.length) { console.error('[SA inbox] update', error, data); alert(t('bulkFail')); return false; }
  return true;
}
const clearSel = () => { state.sel.clear(); state.rsel.clear(); };

export function initInbox() {
  document.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.openCar) return openCar(b.dataset.openCar);
    if (b.id === 'leadRefresh') return loadInbox();
    if (b.id === 'leadCsv') return csv();
    if (b.dataset.lf) { state.lf = b.dataset.lf; state.sel.clear(); return renderLeads(); }
    if (b.dataset.rf) { state.rf = b.dataset.rf; state.rsel.clear(); return renderReviews(); }
    if (b.dataset.clearsel) { (b.dataset.clearsel === 'lead' ? state.sel : state.rsel).clear(); return b.dataset.clearsel === 'lead' ? renderLeads() : renderReviews(); }
    if (b.dataset.leadStatus) {
      if (await patchRows('inquiries', [b.dataset.leadStatus], { status: b.dataset.next })) await loadInbox();
      return;
    }
    if (b.dataset.revToggle) {
      if (await patchRows('reviews', [b.dataset.revToggle], { approved: b.dataset.approved === 'true' })) await loadInbox();
      return;
    }
    if (b.dataset.leadDel || b.dataset.revDel) {
      if (!confirm(t('confirmDelOne'))) return;
      const isLead = !!b.dataset.leadDel, id = b.dataset.leadDel || b.dataset.revDel;
      if (await removeRows(isLead ? 'inquiries' : 'reviews', [id])) { (isLead ? state.sel : state.rsel).delete(String(id)); await loadInbox(); }
      return;
    }
    if (b.dataset.delClosed) {
      const ids = state.leads.filter(l => stOf(l) === 'closed').map(l => l.id);
      if (!ids.length || !confirm(t('confirmDelN', { n: ids.length }))) return;
      if (await removeRows('inquiries', ids)) { state.sel.clear(); await loadInbox(); }
      return;
    }
    if (b.dataset.bulk) {
      const [kind, act] = b.dataset.bulk.split(':'), [table, selKey] = TBL[kind], set = state[selKey], ids = [...set];
      if (!ids.length) return;
      let ok;
      if (act === 'delete') { if (!confirm(t('confirmDelN', { n: ids.length }))) return; ok = await removeRows(table, ids); }
      else if (kind === 'lead') ok = await patchRows(table, ids, { status: act });
      else ok = await patchRows(table, ids, { approved: act === 'approve' });
      if (ok) { set.clear(); await loadInbox(); }
    }
  });
  document.addEventListener('change', e => {
    const c = e.target; if (!(c instanceof HTMLInputElement)) return;
    if (c.dataset.sel) {
      const [kind, id] = [c.dataset.sel.split(':')[0], c.dataset.sel.slice(c.dataset.sel.indexOf(':') + 1)];
      const set = state[TBL[kind][1]]; c.checked ? set.add(id) : set.delete(id);
      return kind === 'lead' ? renderLeads() : renderReviews();
    }
    if (c.dataset.selall) {
      const kind = c.dataset.selall, set = state[TBL[kind][1]];
      const q = state.q.toLowerCase();
      const rows = kind === 'lead'
        ? state.leads.filter(l => (state.lf === 'all' || stOf(l) === state.lf) && (!q || [l.customer_name, l.email, l.phone, l.message].join(' ').toLowerCase().includes(q)))
        : state.reviews.filter(r => state.rf === 'all' || (state.rf === 'pending' ? !r.approved : r.approved));
      rows.forEach(r => c.checked ? set.add(String(r.id)) : set.delete(String(r.id)));
      return kind === 'lead' ? renderLeads() : renderReviews();
    }
  });
  document.addEventListener('input', e => { if (e.target.id === 'leadSearch') { state.q = e.target.value; renderLeads(); const i = document.getElementById('leadSearch'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
  document.getElementById('languageSelect')?.addEventListener('change', () => setTimeout(() => { renderLeads(); renderReviews(); }, 0));
  // تحديث تلقائي كل 60 ثانية — لا يعمل أثناء وجود عناصر محددة حتى لا يضيع التحديد
  setInterval(() => { if (state.loaded && !document.hidden && !state.sel.size && !state.rsel.size) loadInbox(); }, 60000);
}
