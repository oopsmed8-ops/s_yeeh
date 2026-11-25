# Sidahmed-auto

موقع معرض سيارات: واجهة عامة (عربي ← إنجليزي ← فرنسي) + لوحة إدارة (`/admin.html`) + Supabase + Cloudflare Worker/R2 لرفع الصور.

> **جودة · أداء · ثقة** — Quality · Performance · Trust

## أول شيء: عدّل بياناتك
افتح **`public/assets/js/site-config.js`** وضع: الهاتف، رقم واتساب، العنوان، أوقات العمل، روابط فيسبوك/إنستغرام، نص الخريطة، والعملة.
سكربت البناء يحذّرك إن بقيت القيم الافتراضية.

## الهيكل
| المسار | الوظيفة |
|---|---|
| `public/` | الموقع كاملاً (هذا ما يُنشر) |
| `public/assets/js/site-config.js` | **بيانات المعرض** (هاتف، عنوان، عملة…) |
| `public/assets/js/home-i18n.js` | نصوص الواجهة العامة بالعربية والإنجليزية والفرنسية |
| `public/assets/js/i18n.js` | نصوص لوحة الإدارة + محرك الترجمة |
| `scripts/build.mjs` | بناء بلا اعتماديات: ينسخ `public` إلى `dist`، يضبط النطاق، ويتحقق من الملفات |
| `render.yaml` | إعداد Render (Static Site + رؤوس الأمان) |
| `worker/` | Cloudflare Worker لرفع الصور |
| `database/` | سكربتات SQL لـ Supabase |
| `tools/build-config.py` | يعيد توليد الإعدادات العامة المشفّرة داخل `public/assets/img/noise.png` |
| `docs/` | الأدلة |

## تشغيل محلي
```bash
node scripts/build.mjs && npx serve dist
```

## اللغات
الافتراضية **العربية** (RTL)، ثم الإنجليزية ثم الفرنسية. لإضافة نص جديد أضفه في الكتل الثلاث داخل `home-i18n.js`.
قيم الوقود/الناقل/الفئة تُخزَّن بمفاتيح موحّدة (`petrol`, `auto`, `sport`…) وتُترجم عند العرض؛ السيارات القديمة بقيمها النصية تظهر كما هي.

## النشر
اتبع [docs/DEPLOY_AR.md](docs/DEPLOY_AR.md).

## أمان
- لا يوجد أي سر في المستودع. `.env` في `.gitignore`.
- `SUPABASE_SECRET_KEY` مكانه أسرار الـ Worker فقط.
