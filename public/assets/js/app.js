import { getClient } from './client.js';
import './home-i18n.js';
import { applyLanguage, getLang } from './i18n.js';
import { initTheme } from './theme.js';
import { initGallery, initMap } from './gallery.js';
import { SITE, waLink, telLink } from './site-config.js';

// يملأ بيانات التواصل من site-config.js
function fillSite() {
  document.querySelectorAll('[data-site="phone"]').forEach(el => { el.textContent = SITE.phone; });
  document.querySelectorAll('[data-href="tel"]').forEach(el => { el.href = telLink(); });
  document.querySelectorAll('[data-href="wa"]').forEach(el => { el.href = waLink(document.documentElement.lang === 'ar' ? 'السلام عليكم Sidahmed-auto' : 'Hello Sidahmed-auto'); });
  [['fb', SITE.facebook], ['ig', SITE.instagram]].forEach(([k, url]) => document.querySelectorAll(`[data-href="${k}"]`).forEach(el => { if (url) { el.href = url; el.hidden = false; } else el.hidden = true; }));
  document.querySelectorAll('[data-site-i18n]').forEach(el => { el.textContent = SITE[el.dataset.siteI18n]?.[getLang()] || ''; });
}

// بيانات منظّمة للبحث (SEO)
function jsonLd() {
  const s = document.createElement('script'); s.type = 'application/ld+json';
  s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'AutoDealer', name: SITE.name, telephone: SITE.phone, image: location.origin + '/og-image.jpg', url: location.origin + '/',
    sameAs: [SITE.facebook, SITE.instagram, SITE.tiktok].filter(Boolean) });
  document.head.appendChild(s);
}

const boot = () => {
  initTheme();
  const sel = document.getElementById('languageSelect');
  const stored = localStorage.getItem('sa-language');
  const lang = ['ar', 'en', 'fr'].includes(stored) ? stored : SITE.defaultLang;
  sel.value = lang; applyLanguage(lang); fillSite();
  sel.addEventListener('change', e => applyLanguage(e.target.value));
  document.addEventListener('sa:lang', fillSite);
  document.title = { ar: 'Sidahmed-auto | معرض سيارات — جودة · أداء · ثقة', en: 'Sidahmed-auto | Car dealership — Quality · Performance · Trust', fr: 'Sidahmed-auto | Concessionnaire auto — Qualité · Performance · Confiance' }[lang];
  document.addEventListener('sa:lang', e => { document.title = { ar: 'Sidahmed-auto | معرض سيارات — جودة · أداء · ثقة', en: 'Sidahmed-auto | Car dealership — Quality · Performance · Trust', fr: 'Sidahmed-auto | Concessionnaire auto — Qualité · Performance · Confiance' }[e.detail]; });
  document.getElementById('yearNow').textContent = new Date().getFullYear();
  jsonLd();

  const header = document.getElementById('top'), bar = document.getElementById('progress'), nav = document.getElementById('navlinks');
  const onScroll = () => {
    header.classList.toggle('solid', scrollY > 40);
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  document.getElementById('menuBtn').addEventListener('click', () => nav.classList.toggle('open'));
  nav.addEventListener('click', e => { if (e.target.tagName === 'A') nav.classList.remove('open'); });

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  initMap();
  getClient().then(initGallery);
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
