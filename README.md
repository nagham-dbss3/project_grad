# تطبيق الاستقبال — Basma Reception App

تطبيق **مكتب الاستقبال (Front-Desk)** لمنصة أورام الأطفال الرقمية الخاصة بمنظمة **بسمة**.  
واجهة **عربية كاملة (RTL)**، **مستجيبة** (هاتف · لوحي · سطح مكتب)، مبنية بـ **React 18 + Vite + TypeScript + Zustand + Axios** ومتصلة بـ **REST API** على `https://api.basma-unit.cloud/api`.

**دور التطبيق:** نقطة دخول واحدة عابرة للأقسام (عيادة / نهاري / داخلي): تسجيل وصول (مسح QR / إدخال يدوي)، طوابير حيّة، استقبال إسعافي، تسجيل مرضى بسمة، مواعيد، تنسيق استشارات، طباعة هوية رقمية، إشعارات FCM، وشاشة انتظار عامة.

> لا توجد بيانات mock تشغيلية. كل القوائم تأتي من الـ API أو Empty State.  
> ملف [`src/mock/types.ts`](src/mock/types.ts) يحتوي **أنواع TypeScript فقط** (قاموس البيانات §7) وليس بيانات وهمية.

---

## فهرس المحتويات

1. [المتطلبات التقنية للتشغيل](#1-المتطلبات-التقنية-للتشغيل--prerequisites)
2. [كيفية التشغيل](#2-كيفية-التشغيل--how-to-run)
3. [إعداد البيئة](#3-إعداد-البيئة--environment)
4. [التقنيات المستخدمة وكيف استُخدمت](#4-التقنيات-المستخدمة-وكيف-استُخدمت)
5. [تقسيمة الملفات التفصيلية](#5-تقسيمة-الملفات-التفصيلية)
6. [مصفوفة المتطلبات الوظيفية وكيف حُقّقت](#6-مصفوفة-المتطلبات-الوظيفية-وكيف-حُقّقت)
7. [طبقة الـ API](#7-طبقة-الـ-api)
8. [إدارة الحالة (Zustand)](#8-إدارة-الحالة-zustand)
9. [التدفّقات التفصيلية](#9-التدفّقات-التفصيلية)
10. [فهرس الشاشات والمسارات](#10-فهرس-الشاشات-والمسارات)
11. [نظام التصميم والـ i18n و RTL](#11-نظام-التصميم-والـ-i18n-و-rtl)
12. [خارج النطاق](#12-خارج-النطاق--non-goals)

---

## 1. المتطلبات التقنية للتشغيل · Prerequisites

| المتطلب | التفاصيل | كيف يتحقق في المشروع |
|---|---|---|
| **Node.js 18+** | لتشغيل Vite وسلسلة البناء | مذكور هنا؛ المشروع ESM (`"type": "module"` في `package.json`) |
| **npm** | تثبيت الحزم | `npm install` يقرأ `package.json` / `package-lock.json` |
| **خادم API** | `https://api.basma-unit.cloud/api` | عبر `VITE_API_BASE_URL` في `.env` أو Proxy في `vite.config.ts` |
| **متصفح حديث** | Chrome / Edge / Firefox | للكاميرا: إذن الوصول عند المسح في `ScanPad` (`html5-qrcode`) |
| **Firebase (اختياري)** | لإشعارات الدفع | متغيرات `VITE_FIREBASE_*` + Service Worker في `public/` |

---

## 2. كيفية التشغيل · How to run

```bash
npm install
npm run dev      # http://localhost:5173
```

أوامر أخرى من [`package.json`](package.json):

| الأمر | ماذا يفعل تقنياً |
|---|---|
| `npm run build` | `tsc -b && vite build` — فحص أنواع ثم بناء إنتاج |
| `npm run typecheck` | `tsc --noEmit` — فحص TypeScript دون إخراج |
| `npm run preview` | معاينة مجلد `dist` بعد البناء |

> بعد تعديل `.env` أو `vite.config.ts` أعد تشغيل `npm run dev` لأن Vite يقرأ متغيرات البيئة عند الإقلاع.

---

## 3. إعداد البيئة · Environment

| المتغير | القيمة الافتراضية / المثال | الوصف | أين يُستهلك |
|---|---|---|---|
| `VITE_API_BASE_URL` | `https://api.basma-unit.cloud/api` | قاعدة مسار Axios | [`src/lib/api.ts`](src/lib/api.ts) · أنواع في [`src/vite-env.d.ts`](src/vite-env.d.ts) |
| `VITE_FIREBASE_API_KEY` | — | مفتاح Firebase | [`src/lib/firebase.ts`](src/lib/firebase.ts) |
| `VITE_FIREBASE_AUTH_DOMAIN` | — | نطاق المصادقة | نفسه |
| `VITE_FIREBASE_PROJECT_ID` | — | معرّف المشروع | نفسه |
| `VITE_FIREBASE_STORAGE_BUCKET` | — | التخزين | نفسه |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | — | مرسل الرسائل | نفسه |
| `VITE_FIREBASE_APP_ID` | — | معرّف التطبيق | نفسه |
| `VITE_FIREBASE_VAPID_KEY` | — | مفتاح Web Push لـ `getToken` | [`src/lib/fcm.ts`](src/lib/fcm.ts) |

مثال [`.env`](.env):

```env
VITE_API_BASE_URL=https://api.basma-unit.cloud/api

# Firebase Cloud Messaging (اختياري)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

### مساران للاتصال بالـ API في التطوير

1. **مباشر (الوضع الحالي):** `VITE_API_BASE_URL=https://api.basma-unit.cloud/api` → الطلبات تذهب مباشرة للخادم.
2. **عبر Proxy:** ضع `VITE_API_BASE_URL=/api` → Vite في [`vite.config.ts`](vite.config.ts) يوجّه `/api` إلى `https://api.basma-unit.cloud` مع `changeOrigin` و`secure`.

> قيم Firebase مضبوطة أيضاً داخل [`public/firebase-messaging-sw.js`](public/firebase-messaging-sw.js) (Firebase compat) ويجب إبقاؤها متزامنة مع `.env` حتى تعمل الإشعارات في الخلفية.

### طبقة الطلبات المشتركة

في [`src/lib/api.ts`](src/lib/api.ts) عبر **Axios**:

- إرفاق `Authorization: Bearer <token>` تلقائياً من الجلسة
- إرجاع `response.data` مباشرة
- رمي `ApiError(status, message, fieldErrors?)` من `error.response.data` (يشمل أخطاء التحقق 422 لعرضها على الحقول)

---

## 4. التقنيات المستخدمة وكيف استُخدمت

### 4.1 الاعتماديات التشغيلية (`dependencies`)

| التقنية / الحزمة | الإصدار تقريباً | لماذا اخترناها | أين تُستخدم بالضبط |
|---|---|---|---|
| **React** | 18.3 | بناء واجهة SPA مكوّنية | كل الشاشات والمكوّنات |
| **React DOM** | 18.3 | الربط بـ DOM | [`src/main.tsx`](src/main.tsx) عبر `createRoot` |
| **React Router DOM** | 6.28 | توجيه مسارات + حماية صفحات | [`src/app/App.tsx`](src/app/App.tsx) (`BrowserRouter`, `Routes`, `RequireAuth`, `Navigate`) · تنقّل في [`AppShell.tsx`](src/app/AppShell.tsx) |
| **TypeScript** | 5.6 | أمان أنواع على قاموس البيانات §7 | كل ملفات `.ts`/`.tsx` · إعدادات `tsconfig*.json` |
| **Vite** | 5.4 | بناء سريع + HMR + Proxy | [`vite.config.ts`](vite.config.ts) · سكربتات `dev`/`build`/`preview` |
| **Zustand** | 5.0 | حالة مركزية خفيفة بدون boilerplate | [`src/store/useStore.ts`](src/store/useStore.ts) — المرضى، الطوابير، الجلسة، التوست… |
| **Axios** | 1.x | عميل HTTP مع interceptors | [`src/lib/api.ts`](src/lib/api.ts) |
| **Firebase** | 12.x | Cloud Messaging (Web Push) | [`firebase.ts`](src/lib/firebase.ts) · [`fcm.ts`](src/lib/fcm.ts) · [`useFcm.ts`](src/hooks/useFcm.ts) · SW |
| **html5-qrcode** | 2.3 | مسح QR بالكاميرا في المتصفح | [`src/components/ScanPad.tsx`](src/components/ScanPad.tsx) |
| **qrcode** | 1.5 | توليد QR حقيقي لرقم الإضبارة | [`src/components/PatientQR.tsx`](src/components/PatientQR.tsx) · شاشة الهوية |
| **Lucide React** | 0.460 | أيقونات متسقة | الشريط، الأزرار، الشارات، الاستشارات… |
| **Tailwind CSS** | 3.4 | تنسيق utility-first + RTL عبر `start`/`end` | كل الواجهة · [`tailwind.config.js`](tailwind.config.js) · [`index.css`](src/index.css) |
| **CVA** (`class-variance-authority`) | 0.7 | variants للأزرار/الشارات | [`button.tsx`](src/components/ui/button.tsx) · [`badge.tsx`](src/components/ui/badge.tsx) |
| **clsx** + **tailwind-merge** | — | دمج classes بأمان | دالة `cn()` في [`src/lib/utils.ts`](src/lib/utils.ts) |

### 4.2 اعتماديات التطوير (`devDependencies`)

| الحزمة | الدور |
|---|---|
| `@vitejs/plugin-react` | دعم JSX/Fast Refresh في Vite |
| `typescript` + `@types/*` | التجميع وأنواع React/Node/qrcode |
| `tailwindcss` + `postcss` + `autoprefixer` | توليد CSS وتوافق المتصفحات |
| `@types/node` | أنواع لـ `path` في `vite.config.ts` |

### 4.3 تقنيات ليست مكتبات npm لكنها جزء من الحل

| التقنية | التحقيق |
|---|---|
| **REST API** | كل العمليات عبر endpoints موثّقة في القسم 7 |
| **localStorage** | حفظ الجلسة في [`authStorage.ts`](src/lib/authStorage.ts) |
| **Service Worker** | [`public/firebase-messaging-sw.js`](public/firebase-messaging-sw.js) لإشعارات الخلفية |
| **Keyboard wedge** | ماسح QR خارجي يُعامل كإدخال لوحة مفاتيح في `ScanPad` |
| **`window.print()`** | طباعة الهوية الرقمية مع قواعد `@media print` في `index.css` |
| **CSS Custom Properties / oklch** | توكنات التصميم في [`tokens.css`](src/styles/tokens.css) |
| **Google Fonts** | Tajawal · Nunito · Quicksand عبر [`index.html`](index.html) |
| **HTML `dir="rtl"` / `lang="ar"`** | من الجذر في `index.html` |

---

## 5. تقسيمة الملفات التفصيلية

### 5.1 جذر المشروع

```
project_grad/
├── .env                      متغيرات Vite (API + Firebase) — لا تُرفع للأسرار الحقيقية في الإنتاج
├── .gitignore                تجاهل node_modules / dist / .env المحلي إن لزم
├── package.json              الاسم، السكربتات، الاعتماديات
├── package-lock.json         قفل إصدارات الحزم
├── index.html                هيكل HTML · RTL · خطوط · نقطة تحميل Vite
├── vite.config.ts            Plugin React · alias `@` → src · proxy `/api`
├── tailwind.config.js        إعداد Tailwind وربط ألوان التوكنات
├── postcss.config.js         PostCSS (Tailwind + Autoprefixer)
├── tsconfig.json             إعداد TypeScript الجذري (مراجع المشاريع)
├── tsconfig.app.json         إعداد تطبيق الواجهة
├── tsconfig.node.json        إعداد ملفات Node (مثل vite.config)
├── README.md                 هذا الملف
├── public/                   أصول ثابتة تُنسخ كما هي للـ dist
└── src/                      كل كود التطبيق
```

### 5.2 `public/` — أصول ثابتة

| الملف | الغرض |
|---|---|
| [`public/favicon.svg`](public/favicon.svg) | أيقونة المتصفح (وتُستخدم أيضاً كأيقونة إشعار FCM عند الحاجة) |
| [`public/firebase-messaging-sw.js`](public/firebase-messaging-sw.js) | Service Worker لرسائل FCM في الخلفية + معالجة نقر الإشعار والتنقّل داخل التطبيق |

> ملاحظة: [`Logo.tsx`](src/components/Logo.tsx) يحاول تحميل `/logo.png`؛ إن غاب يظهر fallback متدرّج بالألوان الماركة.

### 5.3 `src/` — نقطة الدخول والإعداد

| الملف | الغرض التفصيلي |
|---|---|
| [`src/main.tsx`](src/main.tsx) | يستدعي `hydrateAuthSession()` ثم يركّب `<App />` على `#root` |
| [`src/index.css`](src/index.css) | توجيهات Tailwind + خلفيات السطح + خطوط + قواعد طباعة الهوية |
| [`src/vite-env.d.ts`](src/vite-env.d.ts) | تعريف أنواع `ImportMetaEnv` لكل `VITE_*` |

### 5.4 `src/app/` — الهيكل والمسارات

| الملف | الغرض التفصيلي |
|---|---|
| [`src/app/App.tsx`](src/app/App.tsx) | `BrowserRouter` + تعريف كل المسارات + مكوّن `RequireAuth` + `<Toaster />` |
| [`src/app/AppShell.tsx`](src/app/AppShell.tsx) | الشريط العلوي · القائمة الجانبية (سطح المكتب) · تبويبات الهاتف · البحث العام · أزرار تسجيل وصول/إسعاف · تشغيل `useFcm` و`useMasterData` |

### 5.5 `src/screens/` — شاشة لكل مسار

| الملف | المسار | ماذا يفعل |
|---|---|---|
| [`LoginScreen.tsx`](src/screens/LoginScreen.tsx) | `/login` | بريد/كلمة مرور · قفل بعد 3 محاولات فاشلة (أخطاء الشبكة لا تُحسب) |
| [`DashboardScreen.tsx`](src/screens/DashboardScreen.tsx) | `/` | إحصائيات اليوم · اختصارات · طوابير الأقسام · مواعيد/استشارات معلّقة |
| [`CheckInScreen.tsx`](src/screens/CheckInScreen.tsx) | `/check-in` | معالج متعدد الخطوات: مسح → تأكيد → قسم → إصدار رمز |
| [`EmergencyScreen.tsx`](src/screens/EmergencyScreen.tsx) | `/emergency` | استقبال إسعافي + إنشاء سريع لمريض ناقص البيانات |
| [`PatientsScreen.tsx`](src/screens/PatientsScreen.tsx) | `/patients` | قائمة مرضى + فلاتر `?filter=new` و`?filter=consult` |
| [`RegisterPatientScreen.tsx`](src/screens/RegisterPatientScreen.tsx) | `/patients/new` | تسجيل/تعديل متعدد الخطوات + تحقق حقول + `POST/PATCH` |
| [`RegisterConsultScreen.tsx`](src/screens/RegisterConsultScreen.tsx) | `/patients/consult` | نموذج `POST /consult-requests` (يدعم `?patient_file_no=`) |
| [`PatientRecordScreen.tsx`](src/screens/PatientRecordScreen.tsx) | `/patients/:fileNo` | سجل كامل + إجراءات (وصول، موعد، هوية، إكمال استشارة) |
| [`IdCardScreen.tsx`](src/screens/IdCardScreen.tsx) | `/patients/:fileNo/id-card` | هوية رقمية + QR + طباعة |
| [`QueueScreen.tsx`](src/screens/QueueScreen.tsx) | `/queue` | إدارة الدور عبر الأقسام (استدعاء / حالة) |
| [`AppointmentsScreen.tsx`](src/screens/AppointmentsScreen.tsx) | `/appointments` | مواعيد اليوم + إنشاء + إلغاء |
| [`WaitingScreen.tsx`](src/screens/WaitingScreen.tsx) | `/waiting-screen` و`/waiting-screen/display` | معاينة داخل الـ shell أو عرض عام ملء الشاشة |
| [`NotificationsScreen.tsx`](src/screens/NotificationsScreen.tsx) | `/notifications` | قائمة إشعارات داخل التطبيق + تعليم مقروء |
| [`ProfileScreen.tsx`](src/screens/ProfileScreen.tsx) | `/profile` | حساب الموظف + `GET /auth/me` + تسجيل خروج |

### 5.6 `src/components/` — مكوّنات المجال

| الملف | الغرض |
|---|---|
| [`ScanPad.tsx`](src/components/ScanPad.tsx) | ثلاث طرق تحديد ملف: كاميرا QR · ماسح USB/Bluetooth (keyboard wedge) · إدخال يدوي + lookup |
| [`PatientQR.tsx`](src/components/PatientQR.tsx) | توليد QR حقيقي (`qrcode`) يحتوي `file_no_basma` |
| [`QueueRowCard.tsx`](src/components/QueueRowCard.tsx) | بطاقة صف الطابور: شارات · وقت وصول · انتظار · استدعاء · خدمة · طباعة هوية · فتح · إلغاء محلي |
| [`DepartmentLane.tsx`](src/components/DepartmentLane.tsx) | عمود قسم يجمع بطاقات الدور في الداشبورد/الطابور |
| [`ConsultIcons.tsx`](src/components/ConsultIcons.tsx) | أيقونات أنواع الاستشارة المعلّقة فقط + دليل الرموز (`ConsultLegend`) |
| [`StatusBadges.tsx`](src/components/StatusBadges.tsx) | شارات: إسعافي · بانتظار استكمال البيانات · حالة توكن · حالة حيوية |
| [`PatientContextBar.tsx`](src/components/PatientContextBar.tsx) | شريط سياق مثبت أعلى شاشات المريض (§6.5) |
| [`CommandSearch.tsx`](src/components/CommandSearch.tsx) | بحث عام برقم الإضبارة أولاً (§5) |
| [`PageHeader.tsx`](src/components/PageHeader.tsx) | عنوان صفحة + رجوع + إجراء |
| [`AppointmentRow.tsx`](src/components/AppointmentRow.tsx) | صف موعد + إلغاء |
| [`NotificationRow.tsx`](src/components/NotificationRow.tsx) | صف إشعار + تعليم مقروء |
| [`Stepper.tsx`](src/components/Stepper.tsx) | مؤشر خطوات RTL للتدفقات الموجّهة (وصول / تسجيل) |
| [`Logo.tsx`](src/components/Logo.tsx) | شعار بسمة (`/logo.png` أو gradient fallback) |

### 5.7 `src/components/ui/` — نظام مكوّنات واجهة أساسي

| الملف | الغرض |
|---|---|
| [`button.tsx`](src/components/ui/button.tsx) | زر بـ CVA (variants / sizes) |
| [`card.tsx`](src/components/ui/card.tsx) | حاوية بطاقة |
| [`badge.tsx`](src/components/ui/badge.tsx) | شارة حالة |
| [`input.tsx`](src/components/ui/input.tsx) | Input / Textarea / Label |
| [`select.tsx`](src/components/ui/select.tsx) | قائمة منسدلة أصلية مُنمّقة |
| [`tabs.tsx`](src/components/ui/tabs.tsx) | تبويبات سياقية |
| [`dialog.tsx`](src/components/ui/dialog.tsx) | حوار / ورقة جانبية |
| [`toast.tsx`](src/components/ui/toast.tsx) | `Toaster` مرتبط بتوستات Zustand |
| [`states.tsx`](src/components/ui/states.tsx) | Empty / Error / ListSkeleton |
| [`misc.tsx`](src/components/ui/misc.tsx) | Tooltip · Progress · Skeleton · Avatar · Segmented · Field |

### 5.8 `src/hooks/`

| الملف | الغرض |
|---|---|
| [`useFcm.ts`](src/hooks/useFcm.ts) | مزامنة توكن FCM بعد الدخول · رسائل الواجهة الأمامية · تنقّل من SW |
| [`useLiveNow.ts`](src/hooks/useLiveNow.ts) | تحديث «الآن» كل 30 ثانية لحساب مدة الانتظار حيّاً |

### 5.9 `src/lib/` — منطق مشترك وخدمات

| الملف | الغرض |
|---|---|
| [`api.ts`](src/lib/api.ts) | عميل Axios + كل دوال الـ endpoints + mappers من استجابة API إلى أنواع النطاق + `ApiError` |
| [`authStorage.ts`](src/lib/authStorage.ts) | حفظ / مسح / استعادة الجلسة من `localStorage` |
| [`masterData.ts`](src/lib/masterData.ts) | خرائط أقسام API ↔ داخلي + خيارات نشطة |
| [`useMasterData.ts`](src/lib/useMasterData.ts) | Hook تحميل البيانات المرجعية + تسميات الأقسام |
| [`selectors.ts`](src/lib/selectors.ts) | اشتقاق طوابير · إحصائيات الداشبورد · `isNewForRegistration` |
| [`consultRequests.ts`](src/lib/consultRequests.ts) | فلترة الاستشارات المعلّقة **فقط** حسب رقم الإضبارة + `status === 'pending'` |
| [`patientVisit.ts`](src/lib/patientVisit.ts) | زيارة اليوم · منع تسجيل وصول مكرر (`hasActiveCheckInToday`) |
| [`firebase.ts`](src/lib/firebase.ts) | تهيئة تطبيق Firebase Messaging |
| [`fcm.ts`](src/lib/fcm.ts) | تسجيل SW + `getToken` + `onMessage` |
| [`fcmTokenService.ts`](src/lib/fcmTokenService.ts) | `syncFcmTokenWithBackend` → `POST /fcm-tokens` |
| [`fcmNavigation.ts`](src/lib/fcmNavigation.ts) | تحويل `data.type` / `route` من الإشعار إلى مسار داخل التطبيق |
| [`utils.ts`](src/lib/utils.ts) | `cn` · `formatAge` · `formatTime` · `formatWait` · `genId` · تواريخ |

### 5.10 `src/store/` · `src/i18n/` · `src/mock/` · `src/styles/`

| المسار | الغرض |
|---|---|
| [`src/store/useStore.ts`](src/store/useStore.ts) | متجر Zustand الوحيد: الحالة + كل الـ mutations / استدعاءات API |
| [`src/i18n/ar.ts`](src/i18n/ar.ts) | قاموس نصوص الواجهة العربية (§11 glossary) — مصدر واحد للنصوص |
| [`src/i18n/enums.ts`](src/i18n/enums.ts) | تسميات وخيارات القوائم لكل الـ enums (جنس، إحالة، استشارة…) |
| [`src/mock/types.ts`](src/mock/types.ts) | قاموس البيانات §7 — أنواع TypeScript للكيانات فقط (بدون بيانات وهمية) |
| [`src/styles/tokens.css`](src/styles/tokens.css) | توكنات نظام التصميم §3 (ألوان oklch + تدرجات الماركة) — وضع فاتح فقط |

### 5.11 مخطط شجري مختصر لـ `src/`

```
src/
  main.tsx
  index.css
  vite-env.d.ts
  app/
    App.tsx
    AppShell.tsx
  screens/          ← 14 شاشة
  components/       ← مكوّنات مجال + ui/
  hooks/            ← useFcm · useLiveNow
  lib/              ← api · auth · fcm · selectors · …
  store/            ← useStore.ts
  i18n/             ← ar.ts · enums.ts
  mock/             ← types.ts (أنواع فقط)
  styles/           ← tokens.css
```

---

## 6. مصفوفة المتطلبات الوظيفية وكيف حُقّقت

هذه هي المتطلبات الجوهرية لتطبيق الاستقبال، مع **كيف حُقّق كل واحد** (التقنية + الملفات + السلوك).

### R1 — واجهة عربية كاملة واتجاه RTL

| البند | التحقيق |
|---|---|
| **المطلوب** | كل الواجهة بالعربية ومن اليمين لليسار |
| **كيف** | `lang="ar" dir="rtl"` في [`index.html`](index.html) · قاموس [`ar.ts`](src/i18n/ar.ts) · تسميات [`enums.ts`](src/i18n/enums.ts) · Tailwind منطقي (`start`/`end`/`ps`/`ms`) بدل `left`/`right` |
| **تقنيات** | HTML attributes · Tailwind RTL · بدون مكتبة i18n خارجية (قاموس واحد كافٍ للعربية فقط) |

### R2 — تصميم مستجيب (هاتف · لوحي · سطح مكتب)

| البند | التحقيق |
|---|---|
| **المطلوب** | استخدام مريح على كل الأحجام |
| **كيف** | سايدبار من `lg+` · تبويبات سفلية على الهاتف في [`AppShell.tsx`](src/app/AppShell.tsx) · أزرار الهيدر تتكيّف · تخطيطات مرنة بـ Tailwind breakpoints |
| **تقنيات** | Tailwind responsive utilities · React |

### R3 — المصادقة وحماية المسارات

| البند | التحقيق |
|---|---|
| **المطلوب** | دخول موظفي الاستقبال فقط للصفحات المحمية |
| **كيف** | `POST /auth/login` عبر `loginRequest` · حفظ الجلسة في `localStorage` ([`authStorage.ts`](src/lib/authStorage.ts)) · استعادة عند الإقلاع في `main.tsx` · `RequireAuth` في [`App.tsx`](src/app/App.tsx) يحوّل لـ `/login` إن لا يوجد `staff` · خروج عبر `POST /auth/logout` + مسح الحالة |
| **أمان واجهة إضافية** | قفل النموذج بعد **3 محاولات فاشلة** في [`LoginScreen.tsx`](src/screens/LoginScreen.tsx) (أخطاء الاتصال لا تُحسب) · إن البريد بدون `@` يُلحق `@basma.org` |
| **تقنيات** | Axios · Zustand · localStorage · React Router |

### R4 — تسجيل الوصول (Check-in) بمسح QR أو يدوي

| البند | التحقيق |
|---|---|
| **المطلوب** | تحديد المريض بمسح أو إدخال ثم إصدار رمز طابور |
| **كيف** | [`CheckInScreen.tsx`](src/screens/CheckInScreen.tsx) + [`ScanPad.tsx`](src/components/ScanPad.tsx): (1) كاميرا `html5-qrcode` (2) ماسح خارجي كـ keyboard wedge (3) إدخال يدوي → تأكيد هوية → اختيار قسم/سبب → `issueToken` → `POST /check-ins` |
| **قواعد** | منع التكرار لنفس اليوم عبر [`patientVisit.ts`](src/lib/patientVisit.ts) (`hasActiveCheckInToday`) · أخطاء 422 تُعرض على الحقول |
| **تقنيات** | html5-qrcode · Axios · Zustand · Stepper |

### R5 — استقبال حالة إسعافية بأولوية

| البند | التحقيق |
|---|---|
| **المطلوب** | إدخال سريع دون تجاوز صامت، مع أولوية في الطابور |
| **كيف** | [`EmergencyScreen.tsx`](src/screens/EmergencyScreen.tsx): مسح/يدوي **أو** إنشاء سريع (رقم إضبارة + اسم) → `issueToken` مع `isEmergency: true` و/أو `quickCreate` |
| **شارات** | [`StatusBadges.tsx`](src/components/StatusBadges.tsx): **إسعافي** + **بانتظار استكمال البيانات** عند نقص البيانات |
| **تقنيات** | نفس طبقة check-in + أعلام `is_emergency` / `pendingData` في الـ mapper |

### R6 — طوابير حيّة حسب القسم

| البند | التحقيق |
|---|---|
| **المطلوب** | رؤية الطابور واستدعاء المرضى وتحديث الحالة |
| **كيف** | `GET /queues?department=` عبر `fetchQueues` · عرض في الداشبورد و[`QueueScreen.tsx`](src/screens/QueueScreen.tsx) عبر [`DepartmentLane`](src/components/DepartmentLane.tsx) + [`QueueRowCard`](src/components/QueueRowCard.tsx) · استدعاء `PATCH /tokens/{id}/call` · حالة `PATCH /tokens/{id}/status` |
| **قواعد** | لا استدعاء جديد إن يوجد مريض `called` في نفس القسم (تحذير توست) · مدة الانتظار تُحدَّث عبر [`useLiveNow`](src/hooks/useLiveNow.ts) · عرض **وقت الوصول HH:mm** |
| **إلغاء الدور** | حالياً **محلي** (`cancelQueueToken`) مع TODO لربط `DELETE/PATCH /tokens/{id}/cancel` عند توفره من الخادم |
| **تقنيات** | Axios · Zustand · Lucide · live clock hook |

### R7 — تسجيل مريض بسمة (متعدد الخطوات)

| البند | التحقيق |
|---|---|
| **المطلوب** | إدخال بيانات إدارية كاملة وفق قاموس البيانات |
| **كيف** | [`RegisterPatientScreen.tsx`](src/screens/RegisterPatientScreen.tsx): خطوات (هوية → اتصال/جغرافيا → إحالة → علاج عام → متابعة اختيارية → مراجعة) عبر [`Stepper`](src/components/Stepper.tsx) · تحقق حقول (اسم، هاتف يبدأ بـ 09، …) · `POST /patients` أو `PATCH /patients/{fileNo}` |
| **قاموس البيانات** | الأنواع في [`mock/types.ts`](src/mock/types.ts) (§7) · التسميات في [`enums.ts`](src/i18n/enums.ts) |
| **قواعد** | تاريخ الميلاد / الجنس الفارغان يبقيان فارغين — **بدون قيم وهمية** |
| **تقنيات** | React state للخطوات · Axios · أنواع TypeScript الصارمة |

### R8 — قائمة المرضى والفلاتر

| البند | التحقيق |
|---|---|
| **المطلوب** | استعراض المرضى · جدد للتسجيل · استشارات مطلوبة |
| **كيف** | [`PatientsScreen.tsx`](src/screens/PatientsScreen.tsx) + `GET /patients` · `?filter=new` عبر منطق `isNewForRegistration` في [`selectors.ts`](src/lib/selectors.ts) · `?filter=consult` عبر طلبات معلّقة |
| **تقنيات** | React Router search params · Zustand · selectors |

### R9 — سجل المريض وسياق ثابت

| البند | التحقيق |
|---|---|
| **المطلوب** | عرض سجل مريض مع إجراءات سريعة وسياق مرئي |
| **كيف** | [`PatientRecordScreen.tsx`](src/screens/PatientRecordScreen.tsx) + [`PatientContextBar`](src/components/PatientContextBar.tsx) (§6.5): الاسم · العمر · القسم · الاستشارات المعلّقة · اتصال · شارات |
| **تقنيات** | `GET /patients/{fileNo}` · sticky bar · ConsultIcons |

### R10 — الهوية الرقمية والطباعة

| البند | التحقيق |
|---|---|
| **المطلوب** | بطاقة هوية تحوي بيانات أساسية وQR قابل للمسح لاحقاً |
| **كيف** | [`IdCardScreen.tsx`](src/screens/IdCardScreen.tsx) + [`PatientQR`](src/components/PatientQR.tsx) (`qrcode`) يحوي `file_no_basma` · طباعة `window.print()` مع إخفاء chrome عبر `.no-print` / `.id-card-print` في [`index.css`](src/index.css) |
| **تقنيات** | qrcode · CSS `@media print` |

### R11 — المواعيد

| البند | التحقيق |
|---|---|
| **المطلوب** | عرض مواعيد اليوم · إنشاء · إلغاء |
| **كيف** | [`AppointmentsScreen.tsx`](src/screens/AppointmentsScreen.tsx) + [`AppointmentRow`](src/components/AppointmentRow.tsx) · `GET /appointments` · `POST /appointments` بفترات زمنية `TIME_SLOTS` · `PATCH /appointments/{id}/cancel` · دعم `?patient_file_no=` |
| **تقنيات** | Axios · Zustand · Select/Dialog UI |

### R12 — طلبات الاستشارة وتنسيقها

| البند | التحقيق |
|---|---|
| **المطلوب** | تسجيل استشارة · إظهار أيقونات للمعلّق فقط · إكمال التنسيق |
| **كيف** | تسجيل: [`RegisterConsultScreen`](src/screens/RegisterConsultScreen.tsx) → `POST /consult-requests` · أيقونات: [`consultRequests.ts`](src/lib/consultRequests.ts) يفلتر **فقط** `status === 'pending'` لنفس `patient_file_no` (لا يُستنتج من حقول تاريخية) · إكمال: `PATCH /consult-requests/{id}/coordinate` من سجل المريض أو فلتر الاستشارات فقط · العداد في الداشبورد من `consultRequestsTotal` |
| **رموز الأنواع** | قلبية `cardiac` · عصبية `neurological` · عينية `ophthalmic` · أذنية `ent` · جراحة `surgery` · أخرى `other` — معروضة في [`ConsultIcons`](src/components/ConsultIcons.tsx) |
| **تقنيات** | Axios · selectors صارمة · Lucide icons |

### R13 — شاشة الانتظار العامة

| البند | التحقيق |
|---|---|
| **المطلوب** | عرض للجمهور بدون تسجيل دخول |
| **كيف** | مسار عام `/waiting-screen/display` **بدون** `RequireAuth` وبدون shell في [`App.tsx`](src/app/App.tsx) · [`WaitingScreen`](src/screens/WaitingScreen.tsx) يستدعي `GET /display/queues` (بدون Bearer) كل 30 ثانية · أقسام «يُخدَم الآن» (`called` أو إسعافي) + التالي · معاينة داخل الـ shell على `/waiting-screen` |
| **تقنيات** | React Router public route · polling · Axios بدون توكن |

### R14 — البحث العام برقم الإضبارة

| البند | التحقيق |
|---|---|
| **المطلوب** | بحث سريع من الشريط (§5) |
| **كيف** | [`CommandSearch.tsx`](src/components/CommandSearch.tsx) في `AppShell` — أولوية رقم الإضبارة ثم الانتقال لسجل المريض |
| **تقنيات** | React · Router navigation |

### R15 — إشعارات Firebase Cloud Messaging

| البند | التحقيق |
|---|---|
| **المطلوب** | إشعارات دفعية لموظفي الاستقبال (اختياري إن نُقصت المفاتيح) |
| **كيف** | [`useFcm`](src/hooks/useFcm.ts) داخل `AppShell` → إذن المتصفح → `getToken` بـ VAPID → `POST /fcm-tokens` عبر [`fcmTokenService`](src/lib/fcmTokenService.ts) · Foreground: toast (+ مسار) · Background: SW يعرض إشعاراً وعند النقر يرسل `FCM_NAVIGATE` · [`fcmNavigation.ts`](src/lib/fcmNavigation.ts) يحوّل النوع لمسار (`/appointments`, `/queue`, `/patients?filter=consult`, …) · قائمة داخلية في [`NotificationsScreen`](src/screens/NotificationsScreen.tsx) |
| **تسامح** | إن أعاد `POST /fcm-tokens` حالة 404 يُتسامح (endpoint قد لا يكون جاهزاً) |
| **تقنيات** | firebase · Service Worker · Zustand toasts |

### R16 — البيانات المرجعية (Master Data)

| البند | التحقيق |
|---|---|
| **المطلوب** | أقسام · خيارات إحالة · أطباء من الخادم |
| **كيف** | `GET /master/departments` · `GET /master/referral-options` · `GET /master/doctors` عبر [`masterData.ts`](src/lib/masterData.ts) / [`useMasterData.ts`](src/lib/useMasterData.ts) تُحمَّل من `AppShell` |
| **تقنيات** | Axios · Zustand · mapping API ↔ داخلي |

### R17 — لوحة رئيسية بإحصائيات اليوم

| البند | التحقيق |
|---|---|
| **المطلوب** | نظرة سريعة على ضغط العمل |
| **كيف** | [`DashboardScreen`](src/screens/DashboardScreen.tsx) + [`selectors.ts`](src/lib/selectors.ts): أعداد الانتظار/المستدعى/الاستشارات المعلّقة/المواعيد · اختصارات للوصول والإسعاف والتسجيل · ممرات الأقسام |
| **تقنيات** | Zustand selectors · DepartmentLane |

### R18 — حالات الواجهة الواضحة (Empty / Error / Loading)

| البند | التحقيق |
|---|---|
| **المطلوب** | عدم الاعتماد على اللون وحده؛ حالات صريحة |
| **كيف** | [`states.tsx`](src/components/ui/states.tsx): Empty · Error · ListSkeleton · الشارات = لون + أيقونة + نص · توستات عبر [`toast.tsx`](src/components/ui/toast.tsx) |
| **تقنيات** | UI kit · Lucide · design tokens |

### R19 — لا بيانات وهمية تشغيلية

| البند | التحقيق |
|---|---|
| **المطلوب** | كل القوائم من API أو Empty State |
| **كيف** | حذف/عدم استخدام mock data؛ [`mock/types.ts`](src/mock/types.ts) أنواع فقط · الشاشات تعتمد على `*Loading` / `*Error` / مصفوفات فارغة من المتجر |
| **تقنيات** | TypeScript types · Zustand fetch actions |

### R20 — الاتصال بخادم REST موحّد

| البند | التحقيق |
|---|---|
| **المطلوب** | واجهة أمامية منفصلة تتكلم REST |
| **كيف** | طبقة واحدة في [`api.ts`](src/lib/api.ts) · Base URL من البيئة · Bearer token · mappers للاستجابات · Proxy اختياري في Vite |
| **تقنيات** | Axios · Vite env · TypeScript |

---

## 7. طبقة الـ API

**Base URL:** قيمة `VITE_API_BASE_URL` (أو `'/api'` كافتراضي داخلي في الكود).

| المجال | Method + Path | الدالة في `api.ts` / الاستدعاء من المتجر |
|---|---|---|
| **المصادقة** | `POST /auth/login` | `loginRequest` → `login` / `setSession` |
| | `GET /auth/me` | `fetchMe` (من الملف الشخصي) |
| | `POST /auth/logout` | `logoutRequest` → `logout` |
| **FCM** | `POST /fcm-tokens` body `{ token, platform: 'web' }` | `registerFcmTokenRequest` |
| **المرضى** | `GET /patients?perPage=` | `fetchPatientsRequest` |
| | `GET /patients/{fileNo}` | `fetchPatientRequest` |
| | `POST /patients` | `createPatient` |
| | `PATCH /patients/{fileNo}` | `updatePatientRequest` |
| **مرجعي** | `GET /master/departments` | `fetchDepartmentsRequest` |
| | `GET /master/referral-options` | `fetchReferralOptionsRequest` |
| | `GET /master/doctors?department=` | `fetchDoctorsRequest` |
| **طوابير** | `GET /queues?department=` | `fetchQueuesRequest` |
| | `PATCH /tokens/{id}/call` | `callTokenRequest` |
| | `PATCH /tokens/{id}/status` | `updateTokenStatusRequest` |
| **شاشة انتظار** | `GET /display/queues` (عام) | `fetchDisplayQueuesRequest` |
| **وصول** | `POST /check-ins` | `createCheckInRequest` / `buildCheckInBody` |
| **مواعيد** | `GET /appointments?perPage=&date=` | `fetchAppointmentsRequest` |
| | `POST /appointments` | `createAppointmentRequest` |
| | `PATCH /appointments/{id}/cancel` | `cancelAppointmentRequest` |
| **استشارات** | `GET /consult-requests?perPage=&status=pending` | `fetchPendingConsultRequests` |
| | `POST /consult-requests` | `createConsultRequestRequest` |
| | `PATCH /consult-requests/{id}/coordinate` | `coordinateConsultRequestRequest` |

### قواعد API مهمة في الواجهة

1. **أيقونات الاستشارات:** فقط طلبات `pending` المطابقة لـ `patient_file_no` / `file_no_basma`.
2. **إلغاء الدور:** واجهة محلية حتى يتوفر endpoint الخادم.
3. **DOB / Gender:** إن كانا فارغين يُعرضان فارغين — بدون افتراض `male` أو تواريخ وهمية.
4. **شاشة العرض العامة:** بدون `Authorization`.

---

## 8. إدارة الحالة (Zustand)

الملف الوحيد: [`src/store/useStore.ts`](src/store/useStore.ts).

### الحالة (State)

`staff` · `token` · `user` · `permissions` ·  
`patients` · `selectedPatient` · `selectedPatientRaw` · `patientsLoading` / `patientsError` · `patientLoading` ·  
`departments` · `doctors` · `referralOptions` · `masterDataLoading` / `masterDataError` ·  
`queues` · `displayQueues` · `queuesLoading` / `queuesError` · `displayQueuesLoading` / `displayQueuesError` ·  
`checkIns` · `tokens` ·  
`appointments` · `appointmentsLoading` / `appointmentsError` ·  
`consultRequests` · `consultRequestsTotal` · `consultRequestsLoading` / `consultRequestsError` ·  
`notifications` · `toasts`

### الإجراءات (Actions) — ملخّص

| المجموعة | الدوال |
|---|---|
| Auth | `login` · `setSession` · `setUser` · `logout` |
| Patients | `addPatient` · `getPatient` · `fetchPatients` · `fetchPatientDetails` · `updatePatient` |
| Master | `fetchDepartments` · `fetchDoctors` · `fetchReferralOptions` · `fetchMasterData` |
| Queues | `fetchQueues` · `fetchDisplayQueues` |
| Check-in / Tokens | `issueToken` · `callToken` · `setTokenStatus` · `cancelQueueToken` (محلي) |
| Appointments | `fetchAppointments` · `createAppointment` · `cancelAppointment` |
| Consults | `fetchPendingConsultRequests` · `createConsultRequest` · `coordinateConsultRequest` |
| Notifications | `markNotificationRead` · `markAllNotificationsRead` · `pushNotification` |
| Toasts | `pushToast` (اختفاء تلقائي ~4.5ث) · `dismissToast` |

---

## 9. التدفّقات التفصيلية

### 9.1 المصادقة

1. عند الإقلاع: `main.tsx` → `hydrateAuthSession()` → `loadAuthSession` → `setSession`.
2. تسجيل الدخول: `LoginScreen` → `loginRequest` → `setSession` → الانتقال إلى `/`.
3. الحماية: `RequireAuth` يعيد التوجيه إلى `/login` مع حفظ `from`.
4. الملف الشخصي: `fetchMe`؛ عند 401 يتم الخروج.
5. الخروج: `logoutRequest` ثم `logout` + مسح `localStorage`.

### 9.2 تسجيل الوصول

`ScanPad` يحلّ رقم الإضبارة → جلب المريض → تأكيد → قسم + سبب → `issueToken` → `POST /check-ins` → تحديث الطوابير → الرمز يظهر في الطابور وشاشة الانتظار.

### 9.3 الإسعاف

تحديد مريض موجود **أو** إنشاء سريع ناقص البيانات → إصدار رمز بأولوية `isEmergency` → شارات إسعافي + بانتظار الاستكمال إن لزم.

### 9.4 إدارة الدور

تحميل الطوابير → استدعاء / تعليم «تمت الخدمة» → منع استدعاء مزدوج في نفس القسم → إلغاء محلي من قائمة ⋯ حتى يتوفر الـ endpoint.

### 9.5 الاستشارات

تسجيل طلب → ظهور أيقونات فقط للمعلّق → إكمال التنسيق من سجل المريض أو فلتر الاستشارات → تحديث العداد.

### 9.6 الهوية

فتح `/patients/:fileNo/id-card` → عرض البيانات + QR → طباعة مباشرة.

### 9.7 شاشة الانتظار

Polling كل 30ث لـ `GET /display/queues` · المسار العام بدون دخول.

### 9.8 FCM

بعد الدخول → طلب إذن → الحصول على توكن → تسجيله في الخادم → استماع للرسائل الأمامية · SW للخلفية · تنقّل عند النقر.

---

## 10. فهرس الشاشات والمسارات

| المسار | مصادقة؟ | الشاشة | ملاحظات |
|---|---|---|---|
| `/login` | عام | Login | قفل بعد 3 محاولات |
| `/waiting-screen/display` | عام | Waiting fullscreen | بدون shell |
| `/` | محمي | Dashboard | |
| `/check-in` | محمي | Check-in | |
| `/emergency` | محمي | Emergency | |
| `/patients` | محمي | Patients | `?filter=new` · `?filter=consult` |
| `/patients/new` | محمي | Register patient | |
| `/patients/consult` | محمي | Register consult | `?patient_file_no=` |
| `/patients/:fileNo` | محمي | Patient record | |
| `/patients/:fileNo/id-card` | محمي | ID card | |
| `/queue` | محمي | Queue | موجود في المسارات (إدارة الدور) |
| `/appointments` | محمي | Appointments | `?patient_file_no=` |
| `/waiting-screen` | محمي | Waiting preview | داخل shell |
| `/notifications` | محمي | Notifications | |
| `/profile` | محمي | Profile | |
| `*` | — | redirect → `/` | |

**تنقّل الـ shell:** الرئيسية · المرضى · المواعيد · شاشة الانتظار · الإشعارات · حسابي (+ أزرار تسجيل وصول / إسعاف في الهيدر).

---

## 11. نظام التصميم والـ i18n و RTL

يرجع إلى مواصفات داخلية مشار إليها في التعليقات: **§3 Design** · **§5 Search** · **§6.4/6.5 UI** · **§7 Data dictionary** · **§11 glossary**.

| الجانب | التفاصيل | الملفات |
|---|---|---|
| **وضع الألوان** | فاتح فقط — لا Dark mode | [`tokens.css`](src/styles/tokens.css) |
| **الألوان الأساسية** | Primary `#008FD2` · Secondary أخضر · Accent بنفسجي · Highlight أصفر (oklch مصدر الحقيقة) | `tokens.css` |
| **التدرجات** | brand / sun / hope / care — استخدام محدود | `tokens.css` §3.4 |
| **الخطوط** | Tajawal (عربي/جسم) · Nunito · Quicksand (عناوين LTR؛ العناوين RTL → Tajawal) | [`index.html`](index.html) · [`index.css`](src/index.css) |
| **الخلفية** | radial soft blue/yellow وليس لوناً مسطحاً واحداً | `index.css` |
| **الحالات** | لون + أيقونة + نص | `StatusBadges` · `states` |
| **الطباعة** | إخفاء chrome؛ طباعة بطاقة الهوية فقط | `index.css` `@media print` |
| **i18n** | قاموس `ar` واحد + `enums` | `src/i18n/` |
| **نصف القطر** | `--radius: 1rem` كأساس | `tokens.css` |

مكوّنات UI مبنية بنمط قريب من shadcn (CVA + Tailwind) محلياً تحت `components/ui/` دون اعتماد مكتبة مكوّنات ثقيلة.

---

## 12. خارج النطاق · Non-goals

ما **ليس** جزءاً من تطبيق الاستقبال هذا:

| البند | الحالة |
|---|---|
| أدوار طبيب / ممرض وواجهاتهم | خارج النطاق |
| إدخال سريري أو حذف سجلات المرضى | خارج النطاق |
| تطبيق ولي الأمر | النموذج جاهز للربط لاحقاً؛ ليس في هذا المستودع كمنتج مستقل |
| Endpoint إلغاء الدور من الخادم | الواجهة جاهزة محلياً؛ بانتظار الـ API |
| الوضع الداكن | غير مدعوم عمداً (Light only حسب §3) |
| بيانات mock تشغيلية | مرفوضة؛ الأنواع فقط في `mock/types.ts` |

---

## ملخص سريع للتقنيات مقابل المتطلبات

| متطلب عام | التقنية الأساسية | الملف المحوري |
|---|---|---|
| SPA عربية RTL | React 18 + Router + Tailwind RTL | `App.tsx` · `index.html` |
| حالة مركزية | Zustand 5 | `useStore.ts` |
| REST | Axios | `api.ts` |
| مسح QR | html5-qrcode + keyboard wedge | `ScanPad.tsx` |
| توليد QR / هوية | qrcode + print CSS | `PatientQR.tsx` · `IdCardScreen.tsx` |
| إشعارات | Firebase Messaging + SW | `useFcm.ts` · `firebase-messaging-sw.js` |
| بناء وتطوير | Vite 5 + TypeScript 5 | `vite.config.ts` |
| تصميم ماركة بسمة | CSS tokens oklch | `tokens.css` |
| نصوص عربية موحّدة | قاموس `ar` | `i18n/ar.ts` |

---

> للاستفسارات التطويرية: راجع أولاً [`src/lib/api.ts`](src/lib/api.ts) للعقود مع الخادم، ثم [`src/store/useStore.ts`](src/store/useStore.ts) لسلوك الواجهة، ثم الشاشة المعنية تحت [`src/screens/`](src/screens/).
