// ============================================================
//  Sidahmed-auto — إعدادات الموقع (عدّل هذا الملف فقط)
//  كل رقم أو عنوان أو رابط يظهر في الموقع يأتي من هنا.
// ============================================================
export const SITE = {
  name: 'Sidahmed-auto',
  tagline: { ar: 'جودة · أداء · ثقة', en: 'Quality · Performance · Trust', fr: 'Qualité · Performance · Confiance' },

  // ⚠️ استبدل القيم التالية ببياناتك الحقيقية
  phone: '+213 550 25 36 51',          // يظهر كما هو ويُستعمل في زر الاتصال
  whatsapp: '213550253651',            // الرقم الدولي بدون + أو مسافات
  email: '',                           // اختياري
  facebook: '',                        // رابط صفحتك (اتركه فارغاً لإخفائه)
  instagram: '',                       // رابط حسابك (اتركه فارغاً لإخفائه)
  tiktok: '',                          // اختياري

  address: {
    ar: 'المدية، الجزائر 26000',
    en: 'Médéa, Algeria, 26000',
    fr: 'Médéa, Algérie, 26000',
  },
  hours: {
    ar: 'السبت – الخميس · 09:00 – 18:00',
    en: 'Sat – Thu · 09:00 – 18:00',
    fr: 'Sam – Jeu · 09:00 – 18:00',
  },
  mapQuery: 'Sidahmed auto, Médéa, Algeria',                 // نص البحث في خرائط جوجل (مثال: "Sidahmed auto, Oran")

  // العملة (تُعرض بعد السعر حسب لغة الواجهة)
  currency: { ar: 'دج', en: 'DZD', fr: 'DA' },
  defaultLang: 'ar',
};

export const PLACEHOLDER = SITE.phone.includes('000 00 00') || SITE.whatsapp.startsWith('213000');
export const waLink = (text = '') => `https://wa.me/${SITE.whatsapp}${text ? '?text=' + encodeURIComponent(text) : ''}`;
export const telLink = () => 'tel:' + SITE.phone.replace(/[^\d+]/g, '');
