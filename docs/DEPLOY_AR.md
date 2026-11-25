# دليل النشر: GitHub ثم Render (Static Site)

## لماذا فشل النشر السابق؟
1. Render أنشأ **Web Service** وشغّل `vite build`؛ الموقع ثابت ولا يحتاج Vite أصلاً.
2. مجلد `assets` لم يصل إلى GitHub (الرفع من المتصفح بزر "choose files" يُسقط المجلدات)، فظهر `Failed to resolve assets/js/app.js`.

الحل في هذه النسخة: لا Vite، والموقع داخل `public/`، وسكربت `build.mjs` **يفشل البناء بوضوح** إن نقص أي ملف.

## 1) الرفع إلى GitHub (مهم: بدون إسقاط المجلدات)
**الأسهل:** GitHub Desktop، أو من الطرفية بعد فك الأرشيف:
```bash
cd sidahmed-auto
git init && git add . && git commit -m "Sidahmed-auto v3"
git branch -M main
git remote add origin https://github.com/goko07339-code/ChIt_yeeh.git
git push -u origin main --force
```
(أو أنشئ مستودعاً جديداً أفضل: اسم `sidahmed-auto`.)
إن رفعت من المتصفح: افتح المجلد المفكوك واسحب **المجلدات نفسها** (`public`, `scripts`, …) إلى صفحة Upload، ولا تستعمل "choose your files".

بعد الرفع تأكد في GitHub أنك ترى `public/assets/js/app.js`.

## 2) Render
1. احذف الخدمة القديمة (Web Service الفاشلة).
2. New ← **Blueprint** ← اختر المستودع ← يقرأ `render.yaml` تلقائياً (Static Site مجاني، بلا سبات).
3. إن فضّلت يدوياً: New ← **Static Site**، Build Command: `node scripts/build.mjs`، Publish Directory: `dist`، ومتغير `SITE_DOMAIN` = نطاقك (مثل `sidahmed-auto.onrender.com`). الرؤوس الأمنية تأتي من `render.yaml` فقط، فالأفضل Blueprint.
4. عند ربط نطاق خاص غيّر `SITE_DOMAIN` ثم أعد النشر.

## 3) Supabase (مرة واحدة)
- شغّل `database/database-security.sql` في SQL Editor (RLS وحماية السبام).
- Authentication ← URL Configuration: أضف رابط Render في Site URL / Redirect URLs.
- فعّل MFA لحساب الأدمن.
- **دوّر `SUPABASE_SECRET_KEY`** (كان في أرشيفاتك السابقة).

## 4) Worker (رفع الصور)
```bash
cd worker
cp wrangler.toml.example wrangler.toml   # عدّل الاسم والـ bucket
wrangler secret put SUPABASE_SECRET_KEY  # المفتاح الجديد بعد التدوير
wrangler deploy
```
اضبط `ALLOWED_ORIGIN` على رابط Render (ويمكن إضافة النطاق الخاص بفاصلة). بدونه ستفشل رفع الصور من لوحة الإدارة بخطأ CORS.

## 5) تغيير إعدادات Supabase/Worker العامة
ضع القيم في `.env` (محلياً فقط، انسخه من `.env.example`) ثم:
```bash
python3 tools/build-config.py --worker-url https://رابط-الworker
```
ثم ارفع **`public/assets/img/noise.png` و`public/assets/js/secure-config.js` معاً** (كل بناء يولّد مفتاحاً جديداً).

## 6) قبل الإعلان
- أكمل بيانات الشركة في `public/privacy.html` وأزل الصندوق التنبيهي.
- جرّب طلب سيارة كاملاً ثم افتح الإدارة وتأكد من ظهوره.
- افتح securityheaders.com على رابطك.
- استبدل صور Unsplash بصور المعرض الحقيقية.

---
## ملاحظة Sidahmed-auto: قبل النشر
1. عدّل `public/assets/js/site-config.js` (الهاتف، واتساب، العنوان، الساعات، العملة، روابط التواصل).
2. أكمل `public/privacy.html` ببياناتك القانونية.
3. اضبط `SITE_DOMAIN` في `render.yaml` على نطاقك النهائي.
4. أضف رابط الموقع الجديد في `ALLOWED_ORIGIN` للـ Worker وفي Supabase → Authentication → URL Configuration.

---
## ملاحظة: تحميل الصور على الهاتف (/media)
الصور تُطلب الآن من `/media/…` على نفس نطاق الموقع، وRender يمرّرها إلى Worker عبر `routes` في `render.yaml`.
إن كانت الخدمة منشأة يدوياً (ليست Blueprint) أضف في Render ← Redirects/Rewrites:
`/media/*` ← Rewrite ← `https://auto-granato-upload.goko07339.workers.dev/images/*`
