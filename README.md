# تطبيق الاستقبال — Basma Reception App

تطبيق **مكتب الاستقبال (Front-Desk)** لمنصة أورام الأطفال الرقمية الخاصة بمنظمة بسمة.  
واجهة **عربية RTL** كاملة، **مستجيبة** (هاتف · لوحي · سطح مكتب)، مبنية بـ **React 18 + Vite + TypeScript + Zustand + Axios** ومتصلة بـ **REST API**.

Reception is the single cross-department entry point: check-in, live queues, emergency intake, Basma registration, appointments, consult coordination, digital ID, and a public waiting display.

---

## المتطلبات · Prerequisites

| المتطلب | التفاصيل |ى
|---|---|
| **Node.js** | 18+ |
| **خادم API** | `http://api.basma-unit.cloud:8080` |
| **متصفح حديث** | Chrome / Edge / Firefox |

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

## إعداد الـ API · Environment

| المتغير | القيمة الافتراضية | الوصف |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | قاعدة مسار الطلبات من الواجهة |

ملف [`.env`](.env):

```env
VITE_API_BASE_URL=/api
```

في التطوير:

1. المتصفح يطلب `http://localhost:5173/api/...`
2. Vite proxy يوجّه إلى `http://api.basma-unit.cloud:8080/api/...` (انظر [`vite.config.ts`](vite.config.ts))
3. الهدف: تفادي مشاكل **CORS** عند الاتصال بالخادم مباشرة

طبقة الطلبات: [`src/lib/api.ts`](src/lib/api.ts) عبر **Axios** (`apiClient`) مع:

- `Authorization: Bearer <token>`
- إرجاع `response.data`
- رمي `ApiError` من `error.response.data` (يشمل أخطاء التحقق 422)

**تسجيل الدخول:** `POST /auth/login` — الجلسة في `localStorage` عبر [`authStorage.ts`](src/lib/authStorage.ts) وتُستعاد عند التحميل (`hydrateAuthSession`).

---

## بنية المشروع · Structure

```
src/
  app/
    App.tsx              المسارات + RequireAuth
    AppShell.tsx         الشريط العلوي · القائمة · البحث العام
  screens/               شاشة لكل مسار
  components/
    ui/                  button, card, badge, input, select, tabs, toast, states…
    ConsultIcons.tsx     أيقونات الاستشارات + الأسطورة
    DepartmentLane.tsx · QueueRowCard.tsx · ScanPad.tsx · PatientQR.tsx
    AppointmentRow.tsx · PatientContextBar.tsx · PageHeader.tsx · …
  lib/
    api.ts               Axios + كل endpoints + mappers (fromJson)
    authStorage.ts       حفظ/استعادة الجلسة
    masterData.ts        تحويل الأقسام والإحالات + خيارات القوائم
    useMasterData.ts     hook: جلب master + تسميات العرض
    consultRequests.ts   دمج أيقونات الاستشارات والفلترة
    patientVisit.ts      زيارة اليوم / check-in نشط
    selectors.ts         بناء الطوابير والإحصائيات
    utils.ts             formatAge / formatDate / genId…
  mock/
    types.ts             أنواع النطاق فقط (بدون بيانات وهمية)
  store/
    useStore.ts          Zustand — الحالة والـ mutations
  i18n/
    ar.ts                نصوص الواجهة
    enums.ts             تسميات ثابتة للحقول غير المرجعية
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
| **البيانات المرجعية** | `GET /master/departments` · `GET /master/referral-options` |
| **الطوابير** | `GET /queues?department=` · `PATCH /tokens/{id}/call` · `PATCH /tokens/{id}/status` |
| **شاشة الانتظار** | `GET /display/queues` (عام) |
| **تسجيل الوصول** | `POST /check-ins` |
| **المواعيد** | `GET /appointments` · `POST /appointments` · `PATCH /appointments/{id}/cancel` |
| **الاستشارات** | `GET /consult-requests?perPage=15&status=pending` · `POST /consult-requests` · `PATCH /consult-requests/{id}/coordinate` |

### البيانات المرجعية (Master)

- **الأقسام** — `id`, `code`, `name`, `active` → القوائم المنسدلة والعرض حسب `code` / الاسم من الـ API (`active: true` فقط).
- **خيارات الإحالة** — `id`, `name`, `active` → قيمة الإرسال في الـ payload هي **`id`**.

تُجلب عبر `fetchMasterData()` في الـ store و`useMasterData()`.

### قواعد الحقول الفارغة

- **تاريخ الميلاد / العمر:** إن كان فارغاً أو `null` يُحفظ ويُعرض فارغاً — بدون قيمة وهمية.
- **الجنس:** إن لم يُحدَّد يبقى `null` / فارغاً في الـ payload والواجهة — بدون افتراض «ذكر».

---

## فهرس الشاشات · Screens

| المسار | الشاشة |
|---|---|
| `/login` | تسجيل الدخول |
| `/` | الرئيسية — إحصائيات + طوابير الأقسام |
| `/check-in` | تسجيل وصول |
| `/emergency` | حالة إسعافية |
| `/patients` | قائمة المرضى (فلاتر + عمود استشارة) |
| `/patients?filter=consult` | استشارات مطلوبة |
| `/patients/new` | تسجيل مريض جديد |
| `/patients/consult` | تسجيل استشارة |
| `/patients/:fileNo` | سجل المريض |
| `/patients/:fileNo/id-card` | الهوية الرقمية |
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
مسح/إدخال رقم الإضبارة → تأكيد → اختيار قسم (من master) → `POST /check-ins` → رمز في الطابور وشاشة الانتظار.

### تسجيل مريض
نموذج متعدد الخطوات → أقسام وإحالات من الـ API → `POST /patients`.

### الاستشارات
- تسجيل: `/patients/consult` → `POST /consult-requests`
- عرض الأيقونات في جدول المرضى + سجل المريض
- فلتر معلّقة: `GET …/consult-requests?status=pending`
- إكمال: `PATCH …/consult-requests/{id}/coordinate` → «تمت المراجعة»

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
| Styling | Tailwind CSS 3, CVA, clsx |
| Icons | Lucide React |

---

## نظام التصميم · Design

- وضع فاتح فقط — [`src/styles/tokens.css`](src/styles/tokens.css)
- خطوط: Tajawal · Nunito · Quicksand
- `dir="rtl"` و`lang="ar"`
- الحالات: لون + أيقونة + نص (ليس اللون وحده)

---

## خارج النطاق · Non-goals

- أدوار طبيب/ممرض
- إدخال سريري أو حذف سجلات
- تطبيق ولي الأمر (النموذج جاهز للربط)
- ماسح/طابعة حقيقية
- وضع داكن
