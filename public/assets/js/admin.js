// assets/js/admin.js
import { supabase, workerUrl } from './supabase.js';
import { initI18n, t, tr, money as fmtMoney, locale, applyLanguage, updateThemeLabel, LANGS } from './i18n.js';
import { SITE } from './site-config.js';
import { initInbox, loadInbox, setCarOpener } from './admin-inbox.js';

/* ========== Utilities ========== */
function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function money(val) {
    return fmtMoney(val) || '—';
}

/* ========== DOM ========== */
const splash = document.getElementById('agSplash');
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const sessionEmail = document.getElementById('sessionEmail');
const sessionAvatar = document.getElementById('sessionAvatar');
const navItems = document.querySelectorAll('.nav-item');
const pageTitle = document.getElementById('pageTitle');
const tabContents = document.querySelectorAll('.tab-content');
const languageSelect = document.getElementById('languageSelect');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const vehicleModal = document.getElementById('vehicleModal');
const vehicleModalContent = document.getElementById('vehicleModalContent');
const vehicleModalTitle = document.getElementById('vehicleModalTitle');
const vehicleModalEdit = document.getElementById('vehicleModalEdit');
let selectedVehicleId = null;
const leadsBadge = document.getElementById('leadsBadge');
const reviewsBadge = document.getElementById('reviewsBadge');
const carForm = document.getElementById('carForm');
const carEditor = document.getElementById('carEditor');
const editorTitle = document.getElementById('editorTitle');
const btnNewCar = document.getElementById('btnNewCar');
const cancelCarEdit = document.getElementById('cancelCarEdit');
const saveCarBtn = document.getElementById('saveCarBtn');
const carSaveStatus = document.getElementById('carSaveStatus');
const tableSearch = document.getElementById('tableSearch');
const statusFilter = document.getElementById('statusFilter');
const categoryFilter = document.getElementById('categoryFilter');

let carsTable = null;
let adminCars = [];
let inventoryFilterRegistered = false;

/* ========== Skeleton Builders ========== */
function skeletonStats() {
    return `
    <article class="stat-card"><span class="skeleton skeleton-text short"></span><strong class="skeleton skeleton-stat"></strong></article>
    <article class="stat-card"><span class="skeleton skeleton-text short"></span><strong class="skeleton skeleton-stat"></strong></article>
    <article class="stat-card"><span class="skeleton skeleton-text short"></span><strong class="skeleton skeleton-stat"></strong></article>
    <article class="stat-card"><span class="skeleton skeleton-text short"></span><strong class="skeleton skeleton-stat"></strong></article>
  `;
}

function skeletonRecentList() {
    return Array(5).fill(0).map(() => `
    <div class="recent-item">
      <span class="skeleton skeleton-text" style="width:60%"></span>
      <span class="skeleton skeleton-text" style="width:20%"></span>
    </div>
  `).join('');
}

function skeletonTableRows() {
    return Array(8).fill(0).map(() => `
    <tr class="skeleton-row">
      <td><div class="skeleton skeleton-thumb"></div></td>
      <td><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text short"></div></td>
      <td><div class="skeleton skeleton-text short"></div></td>
      <td><div class="skeleton skeleton-text short"></div></td>
      <td><div class="skeleton skeleton-text tiny"></div></td>
      <td><div class="skeleton skeleton-text short"></div></td>
    </tr>
  `).join('');
}

function emptyState(icon, message) {
    return `<div class="sa-empty-state"><div class="icon">${icon}</div><p>${message}</p></div>`;
}

/* ========== Splash Control ========== */
function hideSplash() {
    if (splash) {
        splash.classList.add('hidden');
        setTimeout(() => { splash.style.display = 'none'; }, 600);
    }
}

/* ========== Bootstrap ========== */
async function bootstrap() {
    try {
        await initI18n();
        initTheme();
        initLanguage();
        initMobileMenu();
        bindLogin();
        bindLogout();
        bindTabs();
    initInbox();
    setCarOpener(async id => { if (!adminCars.some(c => String(c.id) === String(id))) await loadInventory(); openVehicleDetails(id); });
        bindEditor();
        bindForm();
        bindTableFilters();

        if (!supabase) throw new Error('Supabase non configurato: controllare la configurazione pubblica (assets/img/noise.png + assets/js/secure-config.js).');
        await checkSession();
    } catch (err) {
        console.error('[SA Admin] Bootstrap failed:', err);
        if (loginError) loginError.textContent = err.message || t('initFail');
        if (loginView) loginView.hidden = false;
        if (dashboardView) dashboardView.hidden = true;
        hideSplash();
    }
}

/* ========== Theme ========== */
function initTheme() {
    const savedTheme = localStorage.getItem('sa-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeIcon) themeIcon.textContent = savedTheme === 'dark' ? '☼' : '☾';
    updateThemeLabel();

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('sa-theme', next);
            if (themeIcon) themeIcon.textContent = next === 'dark' ? '☼' : '☾';
            updateThemeLabel();
        });
    }
}

/* ========== Language ========== */
function initLanguage() {
    const savedLang = (LANGS.includes(localStorage.getItem('sa-language')) ? localStorage.getItem('sa-language') : SITE.defaultLang);
    if (languageSelect) languageSelect.value = savedLang;
    applyLanguage(savedLang);

    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            applyLanguage(e.target.value);
            if (carsTable) {
                carsTable.destroy();
                carsTable = null;
                renderCarsTable();
            }
            const active = document.querySelector('.nav-item.active');
            if (active && pageTitle) {
                const span = active.querySelector('span:not(.nav-icon):not(.nav-badge)');
                if (span) pageTitle.textContent = span.textContent;
            }
        });
    }
}

/* ========== Mobile Menu ========== */
function initMobileMenu() {
    if (!sidebar) return;
    const close = () => { sidebar.classList.remove('open'); mobileMenuBtn?.setAttribute('aria-expanded', 'false'); };
    mobileMenuBtn?.addEventListener('click', () => { const opened = sidebar.classList.toggle('open'); mobileMenuBtn.setAttribute('aria-expanded', String(opened)); });
    sidebarCloseBtn?.addEventListener('click', close);
    sidebarBackdrop?.addEventListener('click', close);
}

/* ========== Auth ========== */
function bindLogin() {
    if (!loginForm) return;
    loginForm.addEventListener('submit', async(e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const btn = loginForm.querySelector('button[type="submit"]');
        loginError.textContent = t('loading');
        btn.disabled = true;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
            if (profileError || !profile || profile.role !== 'admin') {
                await supabase.auth.signOut();
                throw new Error(t('accessDenied'));
            }

            loginError.textContent = '';
            await showDashboard(data.user.email);
        } catch (err) {
            loginError.textContent = err.message || t('loginError');
        } finally {
            btn.disabled = false;
        }
    });
}

function bindLogout() {
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async() => {
            await supabase.auth.signOut();
            location.reload();
        });
    }
}

async function checkSession() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) { hideSplash(); return; }

    const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (error || !profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        hideSplash();
        if (loginError) loginError.textContent = t('accessDenied');
        return;
    }
    await showDashboard(session.user.email);
}

async function showDashboard(email) {
    loginView.hidden = true;
    dashboardView.hidden = false;
    if (sessionEmail) sessionEmail.textContent = email;
    if (sessionAvatar) sessionAvatar.textContent = (email || 'A').charAt(0).toUpperCase();

    // 1. Show skeleton loaders immediately and reveal the dashboard; data loads independently.
    showSkeletons();
    hideSplash();

    // 2. Load overview data first
    await loadOverview();

    // 3. Then load inventory table
    await loadInventory();
}

function showSkeletons() {
    // Keep the real statistic nodes in the DOM: replacing them breaks their IDs.
    const statsGrid = document.querySelector('#tab-overview .stats-grid');
    if (statsGrid) { statsGrid.setAttribute('aria-busy', 'true'); ['statPublished','statDrafts','statLeads','statReviews'].forEach(id => { const node = document.getElementById(id); if (node) node.textContent = '…'; }); }

    // Recent lists
    const recentCars = document.getElementById('recentCarsList');
    const recentLeads = document.getElementById('recentLeadsList');
    if (recentCars) recentCars.innerHTML = skeletonRecentList();
    if (recentLeads) recentLeads.innerHTML = skeletonRecentList();

    // Table body
    const tbody = document.getElementById('carsTableBody');
    if (tbody) tbody.innerHTML = skeletonTableRows();
}

/* ========== Tabs ========== */
function bindTabs() {
    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            navItems.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            const tabEl = document.getElementById('tab-' + tabId);
            if (tabEl) tabEl.classList.add('active');

            if (pageTitle) {
                const span = btn.querySelector('span:not(.nav-icon):not(.nav-badge)');
                pageTitle.textContent = span ? span.textContent : '';
            }

            if (sidebar) sidebar.classList.remove('open');
        });
    });
}

/* ========== Overview Stats ========== */
async function loadOverview() {
    const ids = ['statPublished', 'statDrafts', 'statLeads', 'statReviews'];
    const statsGrid = document.querySelector('#tab-overview .stats-grid');
    try {
        const results = await Promise.all([
            supabase.from('cars').select('id', { count: 'exact', head: true }).eq('status', 'published'),
            supabase.from('cars').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
            supabase.from('inquiries').select('id', { count: 'exact', head: true }),
            supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('approved', false)
        ]);
        const counts = results.map((result, index) => {
            if (result.error) { console.error(`[SA Admin] Stat ${ids[index]} failed:`, result.error); return null; }
            return result.count ?? 0;
        });
        ids.forEach((id, index) => { const node = document.getElementById(id); if (node) node.textContent = counts[index] === null ? '!' : counts[index]; });
        if (leadsBadge) { leadsBadge.textContent = counts[2] ?? 0; leadsBadge.hidden = !counts[2]; }
        if (reviewsBadge) { reviewsBadge.textContent = counts[3] ?? 0; reviewsBadge.hidden = !counts[3]; }
        await Promise.all([loadRecentCars(), loadRecentLeads()]);
        loadInbox();
    } catch (err) {
        console.error('[SA Admin] Overview error:', err);
        ids.forEach(id => { const node = document.getElementById(id); if (node) node.textContent = '—'; });
        const recentCars = document.getElementById('recentCarsList');
        const recentLeads = document.getElementById('recentLeadsList');
        if (recentCars) recentCars.innerHTML = `<p class="panel-error">${esc(t('errorLoad'))}</p>`;
        if (recentLeads) recentLeads.innerHTML = `<p class="panel-error">${esc(t('errorLoad'))}</p>`;
    } finally {
        statsGrid?.removeAttribute('aria-busy');
    }
}

async function loadRecentCars() {
    const el = document.getElementById('recentCarsList');
    if (!el) return;
    const { data, error } = await supabase.from('cars').select('brand,model,status').order('created_at', { ascending: false }).limit(5);
    if (error) { el.innerHTML = `<p class="panel-error">${esc(t('errorLoad'))}</p>`; return; }

    if (data && data.length) {
        el.innerHTML = data.map(c => `<div class="recent-item"><strong>${esc(c.brand)} ${esc(c.model)}</strong><span>${esc(t(c.status))}</span></div>`).join('');
    } else {
        el.innerHTML = emptyState('🚗', t('noCars'));
    }
    el.classList.add('content-loaded');
}

async function loadRecentLeads() {
    const el = document.getElementById('recentLeadsList');
    if (!el) return;
    const { data, error } = await supabase.from('inquiries').select('customer_name,message,created_at').order('created_at', { ascending: false }).limit(5);
    if (error) { el.innerHTML = `<p class="panel-error">${esc(t('errorLoad'))}</p>`; return; }

    if (data && data.length) {
        el.innerHTML = data.map(l => `<div class="recent-item"><strong>${esc(l.customer_name)}</strong><span>${new Date(l.created_at).toLocaleDateString(locale())}</span><small class="recent-msg">${esc((l.message||'').slice(0,90))}</small></div>`).join('');
    } else {
        el.innerHTML = emptyState('📩', t('noLeads'));
    }
    el.classList.add('content-loaded');
}

/* ========== Inventory Data Table ========== */
async function loadInventory() {
    const tbody = document.getElementById('carsTableBody');
    if (!tbody) return;
    try {
        const { data, error } = await supabase.from('cars').select('*, car_images(*)').order('created_at', { ascending: false });
        if (error) throw error;
        adminCars = data || [];
        renderCarsTable();
    } catch (error) {
        console.error('[SA Admin] Inventory load failed:', error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--sa-red);padding:40px;">${esc(t('errorLoad'))}: ${esc(error.message || '')}</td></tr>`;
    }
}

function renderCarsTable() {
    const tbody = document.getElementById('carsTableBody');
    if (!tbody) return;

    if (carsTable) {
        carsTable.destroy();
        carsTable = null;
    }

    if (adminCars.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">${emptyState('🚗', t('noCars'))}</td></tr>`;
        return;
    }

    tbody.innerHTML = adminCars.map(car => {
                const img = (car.car_images && car.car_images[0]) ? car.car_images[0].image_url : '';
                const sKey = car.status === 'published' ? 'published' : car.status === 'sold' ? 'sold' : 'draft';
                // نضع صورة تحميل مؤقتة (skeleton) حتى تظهر الصورة الحقيقية
                return `
      <tr data-id="${esc(car.id)}">
        <td>
          <div class="img-loading-wrap">
            ${img ? `<img src="${esc(img)}" class="car-thumb lazy-img" alt="" loading="lazy" onload="this.classList.add('loaded')" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
            <div class="car-thumb img-placeholder" style="${img ? 'display:none;' : ''}background:var(--sa-bg-surface-hover);align-items:center;justify-content:center;font-size:9px;color:var(--sa-text-muted);">N/A</div>
          </div>
        </td>
        <td><strong>${esc(car.brand)}</strong><br><span style="font-size:12px;color:var(--sa-text-muted);">${esc(car.model)}</span></td>
        <td>${esc(car.year)}</td>
        <td>${esc(money(car.price))}</td>
        <td><span class="status-badge ${esc(car.status)}">${esc(t(sKey))}</span></td>
        <td><div class="table-actions"><button data-edit="${esc(car.id)}">${t('modify')}</button><button class="delete" data-delete="${esc(car.id)}">${t('delete')}</button></div></td>
      </tr>`;
  }).join('');

  if (typeof DataTable !== 'undefined') {
    if (!inventoryFilterRegistered) {
      DataTable.ext.search.push((settings, data, dataIndex) => {
        if (settings.nTable?.id !== 'carsTable') return true;
        const row = settings.aoData[dataIndex]?.nTr;
        const car = adminCars.find(item => String(item.id) === String(row?.dataset.id));
        return !!car && (!statusFilter?.value || car.status === statusFilter.value) && (!categoryFilter?.value || car.category === categoryFilter.value);
      });
      inventoryFilterRegistered = true;
    }
    carsTable = new DataTable('#carsTable', {
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      order: [[2, 'desc']],
      columnDefs: [{ orderable: false, targets: [0, 5] }],
      language: {
        search: t('searchLabel'),
        lengthMenu: t('lengthMenu'),
        info: t('infoLabel'),
        infoEmpty: t('infoEmpty'),
        zeroRecords: t('noCars'),
        paginate: { first: t('first'), last: t('last'), next: t('next'), previous: t('previous') }
      },
      drawCallback: bindTableActions
    });
  }
  bindTableActions();
  // Click handling is delegated to the tbody so it also works on
  // DataTables pages rendered after pagination, search, and sorting.
  if (!tbody.dataset.vehicleDetailsClickBound) {
    tbody.addEventListener('click', (event) => {
      const row = event.target.closest('tr[data-id]');
      if (!row || !tbody.contains(row)) return;
      if (event.target.closest('button, a, input, select')) return;
      openVehicleDetails(row.dataset.id);
    });
    tbody.dataset.vehicleDetailsClickBound = 'true';
  }
  tbody.classList.add('content-loaded');
}

function bindTableActions() {
  document.querySelectorAll('#carsTableBody [data-edit]').forEach(btn => {
    btn.onclick = () => editCar(btn.dataset.edit);
  });
  document.querySelectorAll('#carsTableBody [data-delete]').forEach(btn => {
    btn.onclick = () => deleteCar(btn.dataset.delete);
  });
}


function openVehicleDetails(id) {
  const car = adminCars.find(item => String(item.id) === String(id));
  if (!car || !vehicleModal || !vehicleModalContent) return;
  selectedVehicleId = id;
  const labels = { brand:t('vehicleBrand'), model:t('vehicleModel'), year:t('vehicleYear'), price:t('vehiclePrice'), mileage:t('vehicleMileage'), fuel:t('vehicleFuel'), transmission:t('vehicleTransmission'), horsepower:t('vehicleHorsepower'), category:t('vehicleCategory'), body_type:t('vehicleBody'), color:t('vehicleColor'), status:t('vehicleStatus'), description:t('vehicleDescription'), created_at:t('vehicleCreated') };
  vehicleModalTitle.textContent = `${car.brand || ''} ${car.model || ''}`.trim() || 'Vehicle details';
  vehicleModalContent.innerHTML = Object.entries(labels).filter(([key]) => car[key] !== null && car[key] !== undefined && car[key] !== '').map(([key,label]) => `<div class="vehicle-detail"><small>${esc(label)}</small><strong>${esc(key === 'price' ? money(car[key]) : key === 'created_at' ? new Date(car[key]).toLocaleString(locale()) : key === 'fuel' ? tr('fuel', car[key]) : key === 'transmission' ? tr('gear', car[key]) : key === 'category' ? tr('cat', car[key]) : key === 'status' ? t(car[key]) : car[key])}</strong></div>`).join('') + `<div class="vehicle-detail"><small>${esc(t('vehiclePhotos'))}</small><strong>${Array.isArray(car.car_images) ? car.car_images.length : 0}</strong></div>` + (Array.isArray(car.car_images) && car.car_images.length ? `<div class="vehicle-photo-strip">${car.car_images.map(image => `<img src="${esc(image.image_url || '')}" alt="${esc(image.alt_text || car.brand + ' ' + car.model)}" loading="lazy">`).join('')}</div>` : '');
  vehicleModal.hidden = false;
  vehicleModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeVehicleDetails() {
  if (!vehicleModal) return;
  vehicleModal.hidden = true;
  vehicleModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  selectedVehicleId = null;
}
document.getElementById('closeVehicleModal')?.addEventListener('click', closeVehicleDetails);
vehicleModal?.querySelectorAll('[data-close-vehicle]').forEach(el => el.addEventListener('click', closeVehicleDetails));
vehicleModalEdit?.addEventListener('click', () => { const id = selectedVehicleId; closeVehicleDetails(); if (id) editCar(id); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeVehicleDetails(); sidebar?.classList.remove('open'); } });

/* ========== Filters ========== */
function bindTableFilters() {
  if (tableSearch) {
    tableSearch.addEventListener('input', () => {
      if (carsTable) carsTable.search(tableSearch.value).draw();
    });
  }

  const redraw = () => { if (carsTable) carsTable.draw(); };
  statusFilter?.addEventListener('change', redraw);
  categoryFilter?.addEventListener('change', redraw);
}

/* ========== Editor ========== */
function bindEditor() {
  if (btnNewCar) {
    btnNewCar.addEventListener('click', () => {
      carForm.reset();
      carForm.querySelectorAll('select option[data-legacy]').forEach(o => o.remove());
      carForm.elements.id.value = '';
      if (editorTitle) editorTitle.textContent = t('newCar');
      if (carSaveStatus) carSaveStatus.textContent = '';
      carEditor.hidden = false;
      carEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (cancelCarEdit) {
    cancelCarEdit.addEventListener('click', () => { carEditor.hidden = true; });
  }
}

function editCar(id) {
  const car = adminCars.find(c => c.id === id);
  if (!car) return;

  carForm.reset();
  Object.entries(car).forEach(([key, val]) => {
    const el = carForm.elements[key];
    if (el && val != null) {
      if (el.tagName === 'SELECT' && ![...el.options].some(o => o.value === String(val))) { const o = new Option(String(val), String(val)); o.dataset.legacy = '1'; el.add(o); }
      el.value = val;
    }
  });

  if (editorTitle) editorTitle.textContent = t('editCar');
  if (carSaveStatus) carSaveStatus.textContent = '';
  carEditor.hidden = false;
  carEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deleteCar(id) {
  if (!confirm(t('confirmDelete'))) return;
  try {
    const { data: images, error: imageReadError } = await supabase.from('car_images').select('id,storage_key').eq('car_id', id);
    if (imageReadError) throw imageReadError;
    let cleanupWarnings = 0;
    const { data: { session } } = await supabase.auth.getSession();
    // Prefer the database FK cascade. If the schema uses RESTRICT, remove image rows and retry.
    let { error: deleteError } = await supabase.from('cars').delete().eq('id', id);
    if (deleteError?.code === '23503') {
      const { error: imageDeleteError } = await supabase.from('car_images').delete().eq('car_id', id);
      if (imageDeleteError) throw imageDeleteError;
      const retry = await supabase.from('cars').delete().eq('id', id);
      deleteError = retry.error;
    }
    if (deleteError) throw deleteError;
    for (const image of (images || [])) {
      if (image.storage_key && workerUrl && session?.access_token) {
        try {
          const response = await fetch(`${workerUrl}/api/delete`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: image.storage_key })
          });
          if (!response.ok) cleanupWarnings++;
        } catch (error) { console.warn('[SA Admin] R2 cleanup failed:', error); cleanupWarnings++; }
      } else if (image.storage_key) cleanupWarnings++;
    }
    await loadInventory();
    await loadOverview();
    if (cleanupWarnings) alert(t('deletedWarn', { n: cleanupWarnings }));
  } catch (error) {
    console.error('[SA Admin] Delete vehicle failed:', error);
    alert(error.message || t('errorLoad'));
  }
}

/* ========== Form Submission & Upload ========== */
function bindForm() {
  if (!carForm) return;

  carForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (carSaveStatus) { carSaveStatus.textContent = t('saving'); carSaveStatus.className = 'status-msg'; }
    if (saveCarBtn) saveCarBtn.disabled = true;

    try {
      const fd = new FormData(carForm);
      const id = fd.get('id');

      const payload = {
        brand: fd.get('brand').trim(),
        model: fd.get('model').trim(),
        year: Number(fd.get('year')),
        price: fd.get('price') ? Number(fd.get('price')) : 0,
        mileage: fd.get('mileage') ? Number(fd.get('mileage')) : null,
        fuel: fd.get('fuel') || null,
        transmission: fd.get('transmission') || null,
        category: fd.get('category'),
        body_type: fd.get('body_type') || null,
        color: fd.get('color') || null,
        horsepower: fd.get('horsepower') ? Number(fd.get('horsepower')) : null,
        status: fd.get('status'),
        description: fd.get('description') || null
      };

      const selectedFiles = carForm.elements.photos.files;
      if (selectedFiles && selectedFiles.length > 0 && !workerUrl) throw new Error('Cloudflare Worker URL non configurato.');
      let uploadSession = null;
      if (selectedFiles && selectedFiles.length > 0) {
        const sessionResult = await supabase.auth.getSession();
        uploadSession = sessionResult.data?.session;
        if (!uploadSession?.access_token) throw new Error(t('sessionExpired'));
      }

      let savedCar;
      if (id) {
        const { data, error } = await supabase.from('cars').update(payload).eq('id', id).select().single();
        if (error) throw error; savedCar = data;
      } else {
        const { data, error } = await supabase.from('cars').insert(payload).select().single();
        if (error) throw error; savedCar = data;
      }

      // Keep the saved ID in the editor so a retry updates this vehicle instead of inserting a duplicate.
      carForm.elements.id.value = savedCar.id;

      // Image Upload
      const files = carForm.elements.photos.files;
      let uploaded = 0, failed = 0;

      if (files && files.length > 0 && workerUrl) {
        const session = uploadSession;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type) || file.size > 10 * 1024 * 1024) {
            failed++;
            continue;
          }

          try {
            const res = await fetch(workerUrl + '/api/upload', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + session.access_token,
                'Content-Type': file.type
              },
              body: file
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);

            const { error: dbErr } = await supabase.from('car_images').insert({
              car_id: savedCar.id,
              storage_key: result.key,
              image_url: result.url,
              alt_text: file.name,
              sort_order: i
            });
            if (dbErr) {
              try { await fetch(`${workerUrl}/api/delete`, { method:'POST', headers:{ 'Authorization':'Bearer '+session.access_token, 'Content-Type':'application/json' }, body:JSON.stringify({ key:result.key }) }); } catch (cleanupError) { console.warn('[Upload] Orphan cleanup failed:', cleanupError); }
              throw dbErr;
            }
            uploaded++;
          } catch (err) {
            console.error('[Upload] Failed:', file.name, err);
            failed++;
          }
        }
      }

      if (carSaveStatus) {
        if (failed > 0) {
          carSaveStatus.textContent = t('savePartial', { ok: uploaded, fail: failed });
          carSaveStatus.className = 'status-msg error';
        } else if (uploaded > 0) {
          carSaveStatus.textContent = t('saveSuccessWithImages', { count: uploaded });
          carSaveStatus.className = 'status-msg success';
        } else {
          carSaveStatus.textContent = t('saveSuccess');
          carSaveStatus.className = 'status-msg success';
        }
      }

      if (failed > 0) {
        carForm.elements.photos.value = '';
        carEditor.hidden = false;
      } else {
        carEditor.hidden = true;
      }
      await loadInventory();
      await loadOverview();

    } catch (err) {
      console.error('[SA Admin] Form error:', err);
      if (carSaveStatus) { carSaveStatus.textContent = err.message; carSaveStatus.className = 'status-msg error'; }
    } finally {
      if (saveCarBtn) saveCarBtn.disabled = false;
    }
  });
}

/* ========== Start ========== */
bootstrap();