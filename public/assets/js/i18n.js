// assets/js/i18n.js — ترجمة داخلية بلا مكتبات: العربية (الأولى) ثم الإنجليزية ثم الفرنسية
import { SITE } from './site-config.js';

export const LANGS = ['ar', 'en', 'fr'];
const LOCALES = { ar: 'ar-DZ-u-nu-latn', en: 'en-GB', fr: 'fr-FR' };

const translations = {
    ar: {
        loginTitle: "منطقة الإدارة",
        loginSubtitle: "سجّل الدخول لإدارة معرض السيارات.",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        loginBtn: "تسجيل الدخول",
        loginError: "بيانات الدخول غير صحيحة.",
        accessDenied: "تم رفض الوصول.",
        initFail: "تعذّر تشغيل لوحة التحكم. تحقق من الاتصال.",
        navOverview: "نظرة عامة",
        navInventory: "السيارات",
        navLeads: "الطلبات",
        navReviews: "التقييمات",
        logout: "تسجيل الخروج",
        adminRole: "مسؤول",
        language: "اللغة",
        statPublished: "السيارات المنشورة",
        statDrafts: "المسودات",
        statLeads: "إجمالي الطلبات",
        statReviews: "تقييمات بانتظار المراجعة",
        addCar: "+ إضافة سيارة",
        newCar: "سيارة جديدة",
        editCar: "تعديل السيارة",
        saveCar: "حفظ السيارة",
        brand: "الماركة *",
        model: "الموديل *",
        year: "السنة *",
        price: "السعر (دج)",
        mileage: "المسافة المقطوعة (كم)",
        fuel: "الوقود",
        transmission: "ناقل الحركة",
        category: "الفئة",
        bodyType: "نوع الهيكل",
        color: "اللون",
        horsepower: "القوة (حصان)",
        status: "الحالة",
        description: "الوصف",
        photos: "الصور",
        photosHint: "JPEG أو PNG أو WebP أو AVIF · الحد الأقصى 10 ميغابايت.",
        draft: "مسودة",
        published: "منشورة",
        sold: "مباعة",
        modify: "تعديل",
        delete: "حذف",
        noCars: "لا توجد سيارات مسجلة.",
        loading: "جارٍ التحميل...",
        saving: "جارٍ الحفظ...",
        saveSuccess: "تم حفظ السيارة.",
        saveSuccessWithImages: "تم حفظ السيارة و {count} صور.",
        savePartial: "تم حفظ السيارة. نجح {ok} وفشل {fail}.",
        confirmDelete: "هل أنت متأكد من الحذف؟",
        deletedWarn: "تم حذف السيارة. قد يلزم تنظيف {n} ملف صورة من التخزين.",
        errorLoad: "خطأ في تحميل البيانات.",
        sectionBasic: "معلومات أساسية",
        sectionTechnical: "بيانات تقنية",
        sectionClassification: "التصنيف",
        sectionDetails: "التفاصيل",
        searchPlaceholder: "ابحث بالماركة أو الموديل...",
        searchLabel: "بحث:",
        lengthMenu: "عرض _MENU_ سيارة",
        infoLabel: "عرض _START_–_END_ من _TOTAL_",
        infoEmpty: "لا توجد سيارات",
        first: "الأولى", last: "الأخيرة", next: "التالية", previous: "السابقة",
        filterAllStatus: "جميع الحالات",
        filterAllCategories: "جميع الفئات",
        photo: "الصورة",
        brandModel: "الماركة / الموديل",
        actions: "الإجراءات",
        recentCars: "أحدث السيارات المضافة",
        recentLeads: "أحدث الطلبات",
        leadsTitle: "الطلبات الواردة",
        reviewsTitle: "تقييمات العملاء",
        comingSoon: "قريباً.",
        themeLight: "التبديل إلى الوضع الفاتح",
        themeDark: "التبديل إلى الوضع الداكن",
        vehicleBrand: "الماركة", vehicleModel: "الموديل", vehicleYear: "السنة", vehiclePrice: "السعر", vehicleMileage: "المسافة المقطوعة", vehicleFuel: "الوقود", vehicleTransmission: "ناقل الحركة", vehicleHorsepower: "القوة", vehicleCategory: "الفئة", vehicleBody: "نوع الهيكل", vehicleColor: "اللون", vehicleStatus: "الحالة", vehicleDescription: "الوصف", vehicleCreated: "تاريخ الإضافة", vehiclePhotos: "الصور", vehicleEdit: "تعديل السيارة",
        // قيم موحّدة تُخزَّن بالإنجليزية وتُعرض بلغة الواجهة
        cat_sport: "رياضية", cat_suv: "دفع رباعي SUV", cat_premium: "فاخرة", cat_berlina: "سيدان", cat_city: "سيارة مدينة",
        fuel_petrol: "بنزين", fuel_diesel: "ديزل", fuel_hybrid: "هجينة", fuel_electric: "كهربائية", fuel_lpg: "غاز (GPL)",
        gear_auto: "أوتوماتيك", gear_manual: "يدوي",
        choose: "— اختر —",
    },
    en: {
        loginTitle: "Restricted Area",
        loginSubtitle: "Sign in to manage the car inventory.",
        email: "Email",
        password: "Password",
        loginBtn: "Sign In",
        loginError: "Invalid credentials.",
        accessDenied: "Access denied.",
        initFail: "Could not start the dashboard. Check your connection.",
        navOverview: "Overview",
        navInventory: "Inventory",
        navLeads: "Inquiries",
        navReviews: "Reviews",
        logout: "Logout",
        adminRole: "Administrator",
        language: "Language",
        statPublished: "Published Cars",
        statDrafts: "Drafts",
        statLeads: "Total Inquiries",
        statReviews: "Pending Reviews",
        addCar: "+ Add Vehicle",
        newCar: "New Vehicle",
        editCar: "Edit Vehicle",
        saveCar: "Save Vehicle",
        brand: "Brand *",
        model: "Model *",
        year: "Year *",
        price: "Price (DZD)",
        mileage: "Mileage (km)",
        fuel: "Fuel",
        transmission: "Transmission",
        category: "Category",
        bodyType: "Body Type",
        color: "Color",
        horsepower: "Horsepower (HP)",
        status: "Status",
        description: "Description",
        photos: "Photos",
        photosHint: "JPEG, PNG, WebP or AVIF · max 10 MB.",
        draft: "Draft",
        published: "Published",
        sold: "Sold",
        modify: "Edit",
        delete: "Delete",
        noCars: "No vehicles registered.",
        loading: "Loading...",
        saving: "Saving...",
        saveSuccess: "Vehicle saved.",
        saveSuccessWithImages: "Vehicle and {count} images saved.",
        savePartial: "Vehicle saved. {ok} OK, {fail} failed.",
        confirmDelete: "Are you sure you want to delete?",
        deletedWarn: "Vehicle deleted. {n} image file(s) may need storage cleanup.",
        errorLoad: "Error loading data.",
        sectionBasic: "Basic Info",
        sectionTechnical: "Technical Data",
        sectionClassification: "Classification",
        sectionDetails: "Details",
        searchPlaceholder: "Search by brand, model...",
        searchLabel: "Search:",
        lengthMenu: "Show _MENU_ vehicles",
        infoLabel: "Showing _START_–_END_ of _TOTAL_",
        infoEmpty: "No vehicles",
        first: "First", last: "Last", next: "Next", previous: "Previous",
        filterAllStatus: "All statuses",
        filterAllCategories: "All categories",
        photo: "Photo",
        brandModel: "Brand / Model",
        actions: "Actions",
        recentCars: "Recently Added Cars",
        recentLeads: "Recent Inquiries",
        leadsTitle: "Received Inquiries",
        reviewsTitle: "Customer Reviews",
        comingSoon: "Coming Soon.",
        themeLight: "Switch to light mode",
        themeDark: "Switch to dark mode",
        vehicleBrand: "Brand", vehicleModel: "Model", vehicleYear: "Year", vehiclePrice: "Price", vehicleMileage: "Mileage", vehicleFuel: "Fuel", vehicleTransmission: "Transmission", vehicleHorsepower: "Horsepower", vehicleCategory: "Category", vehicleBody: "Body type", vehicleColor: "Color", vehicleStatus: "Status", vehicleDescription: "Description", vehicleCreated: "Created", vehiclePhotos: "Photos", vehicleEdit: "Edit vehicle",
        cat_sport: "Sports", cat_suv: "SUV", cat_premium: "Premium", cat_berlina: "Sedan", cat_city: "City car",
        fuel_petrol: "Petrol", fuel_diesel: "Diesel", fuel_hybrid: "Hybrid", fuel_electric: "Electric", fuel_lpg: "LPG",
        gear_auto: "Automatic", gear_manual: "Manual",
        choose: "— Select —",
    },
    fr: {
        loginTitle: "Espace réservé",
        loginSubtitle: "Connectez-vous pour gérer le parc automobile.",
        email: "E-mail",
        password: "Mot de passe",
        loginBtn: "Se connecter",
        loginError: "Identifiants invalides.",
        accessDenied: "Accès refusé.",
        initFail: "Impossible de démarrer le tableau de bord. Vérifiez la connexion.",
        navOverview: "Aperçu",
        navInventory: "Parc auto",
        navLeads: "Demandes",
        navReviews: "Avis",
        logout: "Déconnexion",
        adminRole: "Administrateur",
        language: "Langue",
        statPublished: "Voitures publiées",
        statDrafts: "Brouillons",
        statLeads: "Demandes totales",
        statReviews: "Avis à valider",
        addCar: "+ Ajouter un véhicule",
        newCar: "Nouveau véhicule",
        editCar: "Modifier le véhicule",
        saveCar: "Enregistrer le véhicule",
        brand: "Marque *",
        model: "Modèle *",
        year: "Année *",
        price: "Prix (DA)",
        mileage: "Kilométrage (km)",
        fuel: "Carburant",
        transmission: "Boîte de vitesses",
        category: "Catégorie",
        bodyType: "Carrosserie",
        color: "Couleur",
        horsepower: "Puissance (ch)",
        status: "Statut",
        description: "Description",
        photos: "Photos",
        photosHint: "JPEG, PNG, WebP ou AVIF · 10 Mo maximum.",
        draft: "Brouillon",
        published: "Publiée",
        sold: "Vendue",
        modify: "Modifier",
        delete: "Supprimer",
        noCars: "Aucun véhicule enregistré.",
        loading: "Chargement...",
        saving: "Enregistrement...",
        saveSuccess: "Véhicule enregistré.",
        saveSuccessWithImages: "Véhicule et {count} images enregistrés.",
        savePartial: "Véhicule enregistré. {ok} réussies, {fail} échouées.",
        confirmDelete: "Voulez-vous vraiment supprimer ?",
        deletedWarn: "Véhicule supprimé. {n} fichier(s) image à nettoyer du stockage.",
        errorLoad: "Erreur de chargement.",
        sectionBasic: "Informations de base",
        sectionTechnical: "Données techniques",
        sectionClassification: "Classification",
        sectionDetails: "Détails",
        searchPlaceholder: "Rechercher par marque, modèle...",
        searchLabel: "Recherche :",
        lengthMenu: "Afficher _MENU_ véhicules",
        infoLabel: "Affichage de _START_ à _END_ sur _TOTAL_",
        infoEmpty: "Aucun véhicule",
        first: "Première", last: "Dernière", next: "Suivante", previous: "Précédente",
        filterAllStatus: "Tous les statuts",
        filterAllCategories: "Toutes les catégories",
        photo: "Photo",
        brandModel: "Marque / Modèle",
        actions: "Actions",
        recentCars: "Derniers véhicules ajoutés",
        recentLeads: "Dernières demandes",
        leadsTitle: "Demandes reçues",
        reviewsTitle: "Avis clients",
        comingSoon: "Bientôt disponible.",
        themeLight: "Passer en mode clair",
        themeDark: "Passer en mode sombre",
        vehicleBrand: "Marque", vehicleModel: "Modèle", vehicleYear: "Année", vehiclePrice: "Prix", vehicleMileage: "Kilométrage", vehicleFuel: "Carburant", vehicleTransmission: "Boîte", vehicleHorsepower: "Puissance", vehicleCategory: "Catégorie", vehicleBody: "Carrosserie", vehicleColor: "Couleur", vehicleStatus: "Statut", vehicleDescription: "Description", vehicleCreated: "Créé le", vehiclePhotos: "Photos", vehicleEdit: "Modifier le véhicule",
        cat_sport: "Sportives", cat_suv: "SUV", cat_premium: "Premium", cat_berlina: "Berlines", cat_city: "Citadines",
        fuel_petrol: "Essence", fuel_diesel: "Diesel", fuel_hybrid: "Hybride", fuel_electric: "Électrique", fuel_lpg: "GPL",
        gear_auto: "Automatique", gear_manual: "Manuelle",
        choose: "— Choisir —",
    }
};

export function addTranslations(extra) { for (const l in extra) translations[l] = { ...(translations[l] || {}), ...extra[l] }; }

const stored = localStorage.getItem('sa-language');
let currentLang = LANGS.includes(stored) ? stored : SITE.defaultLang;

export const getLang = () => currentLang;
export const locale = () => LOCALES[currentLang];
export const has = key => key in (translations[currentLang] || {});

export function t(key, options) {
    const dict = translations[currentLang] || translations[SITE.defaultLang];
    let text = dict[key] ?? translations[SITE.defaultLang][key] ?? key;
    if (options) Object.keys(options).forEach(k => { text = text.replaceAll(`{${k}}`, options[k]); });
    return text;
}

// يترجم قيمة مخزّنة (مثل petrol أو sport)؛ إن لم تُعرف (بيانات قديمة) تُعرض كما هي
export function tr(prefix, value) {
    if (value == null || value === '') return '';
    const k = `${prefix}_${String(value).toLowerCase()}`;
    return has(k) ? t(k) : String(value);
}

// أسعار بالعملة المحلية بحسب لغة الواجهة
export function money(n) {
    if (!n || Number(n) === 0) return null;
    return `${Number(n).toLocaleString(locale())} ${SITE.currency[currentLang]}`;
}

export async function initI18n() { applyLanguage(currentLang); }

export function applyLanguage(lang) {
    currentLang = LANGS.includes(lang) ? lang : SITE.defaultLang;
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('sa-language', currentLang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n'), txt = t(key);
        if (txt !== key) { if (txt.includes('<')) el.innerHTML = txt; else el.textContent = txt; }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder'), txt = t(key);
        if (txt !== key) el.placeholder = txt;
    });
    document.querySelectorAll('[data-i18n-label]').forEach(el => {
        const key = el.getAttribute('data-i18n-label'), txt = t(key);
        if (txt !== key) el.setAttribute('aria-label', txt);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title'), txt = t(key);
        if (txt !== key) el.title = txt;
    });
    document.dispatchEvent(new CustomEvent('sa:lang', { detail: currentLang }));
    updateThemeLabel();
}

export function updateThemeLabel() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const label = t(currentTheme === 'dark' ? 'themeLight' : 'themeDark');
    btn.setAttribute('aria-label', label);
    btn.title = label;
}
