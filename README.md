# تطبيق الاستقبال — Basma Reception App

تطبيق **مكتب الاستقبال (Front-Desk)** لمنصة أورام الأطفال الرقمية الخاصة بمنظمة بسمة.  
واجهة **عربية RTL** كاملة، **مستجيبة** (هاتف · لوحي · سطح مكتب)، مبنية بـ **React 18 + Vite + TypeScript + Zustand + Axios** ومتصلة بـ **REST API**.

Reception is the single cross-department entry point: check-in (مسح QR / إدخال يدوي), live queues, emergency intake, Basma registration, appointments, consult coordination, digital ID print, FCM notifications, and a public waiting display.

---

## المتطلبات · Prerequisites

| المتطلب | التفاصيل |
|---|---|
| **Node.js** | 18+ |
| **خادم API** | `https://api.basma-unit.cloud/api` |
| **متصفح حديث** | Chrome / Edge / Firefox (للكاميرا: إذن الوصول للكاميرا عند المسح) |

---

## التشغيل · How to run

```bash
npm install
npm run dev      # http://localhost:5173
```

أوامر أخرى:

```bash
npm run build      # tsc -b && vite build
npm run typecheck  # tsc --noEmit
npm run preview    # معاينة الإصدار المبني
```

> بعد تعديل `.env` أو `vite.config.ts` أعد تشغيل `npm run dev`.

---

## إعداد البيئة · Environment

| المتغير | القيمة الافتراضية | الوصف |
|---|---|---|
| `VITE_API_BASE_URL` | `https://api.basma-unit.cloud/api` | قاعدة مسار الطلبات من الواجهة |
| `VITE_FIREBASE_*` | — | إعدادات Firebase Cloud Messaging (اختياري للإشعارات الدفعية) |
| `VITE_FIREBASE_VAPID_KEY` | — | مفتاح Web Push (VAPID) |

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

في التطوير:

1. الطلبات تذهب إلى `https://api.basma-unit.cloud/api/...`
2. إن استخدمت `VITE_API_BASE_URL=/api` بدل الرابط الكامل، Vite proxy يوجّه إلى `https://api.basma-unit.cloud` (انظر [`vite.config.ts`](vite.config.ts))

طبقة الطلبات: [`src/lib/api.ts`](src/lib/api.ts) عبر **Axios** مع:

- `Authorization: Bearer <token>`
- إرجاع `response.data`
- رمي `ApiError` من `error.response.data` (يشمل أخطاء التحقق 422)

**تسجيل الدخول:** `POST /auth/login` — الجلسة في `localStorage` عبر [`authStorage.ts`](src/lib/authStorage.ts) وتُستعاد عند التحميل.

---

## بنية المشروع · Structure

```
src/
  app/
    App.tsx              المسارات + RequireAuth
    AppShell.tsx         الشريط العلوي · القائمة · البحث العام · FCM
  screens/               شاشة لكل مسار
  components/
    ui/                  button, card, badge, input, select, tabs, toast, states…
    QueueRowCard.tsx     بطاقة الدور (وقت الوصول · الانتظار · الشارات · إلغاء)
    ScanPad.tsx          مسح QR: كاميرا + ماسح لوحة مفاتيح + إدخال يدوي
    PatientQR.tsx        توليد QR حقيقي لرقم الإضبارة
    ConsultIcons.tsx     أيقونات الاستشارات المعلقة فقط
    StatusBadges.tsx     إسعافي · بانتظار استكمال البيانات · حالات التوكن
    DepartmentLane.tsx · PatientContextBar.tsx · PageHeader.tsx · …
  hooks/
    useFcm.ts            اشتراك إشعارات Firebase
    useLiveNow.ts        تحديث مدة الانتظار دورياً
  lib/
    api.ts               Axios + endpoints + mappers
    authStorage.ts       حفظ/استعادة الجلسة
    masterData.ts        أقسام وإحالات
    useMasterData.ts     hook البيانات المرجعية
    consultRequests.ts   فلترة الاستشارات المعلقة حسب رقم الإضبارة
    patientVisit.ts      زيارة اليوم / check-in نشط
    selectors.ts         طوابير + إحصائيات الداشبورد
    firebase.ts · fcm.ts · fcmTokenService.ts · fcmNavigation.ts
    utils.ts             formatAge / formatTime / formatWait / …
  mock/
    types.ts             أنواع النطاق فقط (بدون بيانات وهمية)
  store/
    useStore.ts          Zustand — الحالة والـ mutations
  i18n/
    ar.ts                نصوص الواجهة
    enums.ts             تسميات ثابتة
  styles/
    tokens.css           متغيّرات نظام التصميم
  main.tsx
```

> لا توجد بيانات mock تشغيلية. كل القوائم تأتي من الـ API أو Empty State.

---

## طبقة الـ API · Endpoints

| المجال | المسارات |
|---|---|
| **المصادقة** | `POST /auth/login` · `GET /auth/me` · `POST /auth/logout` |
| **المرضى** | `GET /patients` · `GET /patients/{fileNo}` · `POST /patients` · `PATCH /patients/{fileNo}` |
| **البيانات المرجعية** | `GET /master/departments` · `GET /master/referral-options` · `GET /master/doctors` |
| **الطوابير** | `GET /queues?department=` · `PATCH /tokens/{id}/call` · `PATCH /tokens/{id}/status` |
| **شاشة الانتظار** | `GET /display/queues` (عام) |
| **تسجيل الوصول** | `POST /check-ins` |
| **المواعيد** | `GET /appointments` · `POST /appointments` · `PATCH /appointments/{id}/cancel` |
| **الاستشارات** | `GET /consult-requests?status=pending` · `POST /consult-requests` · `PATCH /consult-requests/{id}/coordinate` |

### قواعد مهمة

- **أيقونات الاستشارات:** تُعرض فقط لطلبات `status === 'pending'` المطابقة لـ `patient_file_no` / `file_no_basma` — لا تُستنتج من حقول أخرى.
- **إلغاء الدور:** إزالة محلية من الواجهة حالياً (`cancelQueueToken`) مع `TODO` لربط `DELETE/PATCH /tokens/{id}/cancel` عند توفر الـ endpoint.
- **تاريخ الميلاد / الجنس:** إن كانا فارغين يُعرضان فارغين — بدون قيم وهمية.

---

## فهرس الشاشات · Screens

| المسار | الشاشة |
|---|---|
| `/login` | تسجيل الدخول |
| `/` | الرئيسية — إحصائيات + طوابير الأقسام + وقت الوصول |
| `/check-in` | تسجيل وصول (كاميرا QR / ماسح / يدوي) |
| `/emergency` | حالة إسعافية (إنشاء سريع + أولوية) |
| `/patients` | قائمة المرضى |
| `/patients?filter=new` | جدد للتسجيل (جزئي / ناقص / إسعافي بانتظار الاستكمال) |
| `/patients?filter=consult` | استشارات مطلوبة (+ زر إكمال استشارة) |
| `/patients/new` | تسجيل مريض جديد |
| `/patients/consult` | تسجيل استشارة |
| `/patients/:fileNo` | سجل المريض (+ إكمال استشارة معلقة) |
| `/patients/:fileNo/id-card` | الهوية الرقمية (QR + طباعة مباشرة) |
| `/queue` | إدارة الدور |
| `/appointments` | المواعيد |
| `/waiting-screen` | معاينة شاشة الانتظار |
| `/waiting-screen/display` | عرض عام ملء الشاشة (بدون تسجيل دخول) |
| `/notifications` | الإشعارات |
| `/profile` | حسابي |

الملفات تحت [`src/screens/`](src/screens/).

---

## تدفّقات رئيسية · Flows

### تسجيل الوصول
مسح QR (كاميرا المتصفح أو ماسح USB/Bluetooth كـ keyboard wedge) أو إدخال يدوي → تأكيد الهوية → اختيار قسم → `POST /check-ins` → رمز في الطابور وشاشة الانتظار.

### حالة إسعافية
تحديد مريض أو إنشاء سريع → قسم + سبب اختياري → رمز أولوية في أعلى الطابور. إن كانت البيانات ناقصة تظهر شارات **إسعافي** و**بانتظار استكمال البيانات** معاً.

### بطاقة الدور
- الاسم + أيقونات الاستشارات المعلقة + شارة الرمز
- رقم الإضبارة · العمر · **وقت الوصول (HH:mm)** · مدة الانتظار (تحديث دوري)
- استدعاء / تمت الخدمة · طباعة الهوية · فتح
- إلغاء الدور من قائمة ⋯ (محلياً حتى يتوفر الـ endpoint)

### الهوية الرقمية
بيانات المريض (الاسم · رقم الإضبارة · الجنس · تاريخ الميلاد · العمر) + QR يحوي `file_no_basma` → **معاينة وطباعة** عبر `window.print()` مع إخفاء الـ chrome في `@media print`.

### الاستشارات
- تسجيل: `/patients/consult` → `POST /consult-requests`
- أيقونات فقط عند وجود طلب معلّق لنفس رقم الإضبارة
- إكمال الاستشارة: داخل **سجل المريض** أو عند فلتر **استشارات مطلوبة** فقط (ليست في القائمة العامة)
- العداد في الداشبورد: عدد الطلبات المعلقة من الـ API

### رموز الاستشارات

| النوع | `consultation_type` |
|---|---|
| قلبية | `cardiac` |
| عصبية | `neurological` |
| عينية | `ophthalmic` |
| أذنية | `ent` |
| جراحة | `surgery` |
| أخرى | `other` |

---

## التقنيات · Stack

| الطبقة | التقنية |
|---|---|
| UI | React 18, React Router 6 |
| Build | Vite 5, TypeScript 5 |
| HTTP | Axios |
| State | Zustand 5 |
| Styling | Tailwind CSS 3, CVA, clsx / tailwind-merge |
| Icons | Lucide React |
| QR مسح | `html5-qrcode` (+ keyboard wedge للماسح الخارجي) |
| QR توليد | `qrcode` |
| إشعارات | Firebase Cloud Messaging |

---

## نظام التصميم · Design

- وضع فاتح فقط — [`src/styles/tokens.css`](src/styles/tokens.css)
- خطوط: Tajawal · Nunito · Quicksand
- `dir="rtl"` و`lang="ar"`
- الحالات: لون + أيقونة + نص (ليس اللون وحده)

---

## خارج النطاق · Non-goals

- أدوار طبيب/ممرض
- إدخال سريري أو حذف سجلات المرضى
- تطبيق ولي الأمر (النموذج جاهز للربط)
- Endpoint إلغاء الدور من الخادم (الواجهة جاهزة محلياً)
- وضع داكن
