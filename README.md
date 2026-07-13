# تطبيق الاستقبال — Basma Reception App

تطبيق **مكتب الاستقبال (Front-Desk)** لمنصة أورام الأطفال الرقمية الخاصة بمنظمة بسمة. واجهة **عربية RTL** كاملة، **مستجيبة** (هاتف · لوحي · سطح مكتب)، مبنية بـ **React 18 + Vite + TypeScript + Zustand** ومتصلة بـ **REST API** خلفي.

Reception is the single cross-department entry point for every patient: check-in, live queues by department, emergency intake, full Basma registration, appointments, consult coordination, digital ID, and a public waiting display.

---

## المتطلبات · Prerequisites

- **Node.js** 18+
- **خادم API** يعمل (افتراضياً على `http://localhost:8080`)
- في التطوير، يوجّه Vite الطلبات من `/api` إلى الخادم عبر **proxy** (انظر [`vite.config.ts`](vite.config.ts))

---

## التشغيل · How to run

```bash
npm install
npm run dev      # ثم افتح http://localhost:5173
```

أوامر أخرى:

```bash
npm run build      # tsc -b && vite build
npm run typecheck  # tsc --noEmit
npm run preview    # معاينة الإصدار المبني
```

### إعداد عنوان الـ API

| المتغير | الافتراضي | الوصف |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | قاعدة مسار الـ API (نسبي مع proxy في التطوير، أو URL كامل في الإنتاج) |

مثال لملف `.env.local`:

```env
VITE_API_BASE_URL=/api
```

**تسجيل الدخول:** بريد إلكتروني أو اسم مستخدم + كلمة مرور عبر `POST /auth/login`. الجلسة تُحفظ في `localStorage` وتُستعاد تلقائياً عند إعادة التحميل ([`src/lib/authStorage.ts`](src/lib/authStorage.ts)).

---

## بنية المشروع · Structure

```
src/
  app/
    App.tsx           المسارات والحماية (RequireAuth)
    AppShell.tsx      الشريط العلوي · القائمة الجانبية/السفلية · البحث
  screens/            شاشة لكل مسار (انظر الفهرس أدناه)
  components/
    ui/               primitives (button, card, badge, input, select, tabs, toast, …)
    ConsultIcons.tsx  أيقونات الاستشارات + الأسطورة
    DepartmentLane.tsx · QueueRowCard.tsx · ScanPad.tsx · PatientQR.tsx
    AppointmentRow.tsx · PatientContextBar.tsx · PageHeader.tsx · …
  lib/
    api.ts            طبقة REST — كل استدعاءات الخادم
    authStorage.ts    حفظ/استعادة الجلسة
    masterData.ts     تحويل الأقسام والإحالات من الـ API
    useMasterData.ts  hook لقوائم الأقسام والإحالات
    consultRequests.ts  دمج أيقونات الاستشارات والفلترة
    patientVisit.ts   منطق زيارة اليوم
    selectors.ts      بناء الطوابير والإحصائيات
    utils.ts          تنسيق التاريخ/الوقت والمعرّفات
  mock/
    types.ts          أنواع TypeScript للنطاق (Patient, Token, Appointment, …)
  store/
    useStore.ts       Zustand — الحالة العامة والـ mutations
  i18n/
    ar.ts             نصوص الواجهة العربية
    enums.ts          تسميات القوائم والخيارات
  styles/
    tokens.css        متغيّرات نظام التصميم
  main.tsx            نقطة الدخول + hydrateAuthSession
```

> **ملاحظة:** مجلد `mock/` يحتوي اليوم على **تعريفات الأنواع فقط** (`types.ts`). البيانات التشغيلية تأتي من الـ API وتُخزَّن في Zustand.

---

## طبقة الـ API · API layer

كل الطلبات تمر عبر [`src/lib/api.ts`](src/lib/api.ts) مع `Authorization: Bearer <token>`.

| المجال | Endpoints رئيسية |
|---|---|
| **المصادقة** | `POST /auth/login` · `GET /auth/me` · `POST /auth/logout` |
| **المرضى** | `GET /patients` · `GET /patients/{fileNo}` · `POST /patients` · `PATCH /patients/{fileNo}` |
| **البيانات المرجعية** | `GET /master/departments` · `GET /master/referral-options` |
| **الطوابير** | `GET /queues/{department}` · `PATCH /tokens/{id}/call` · `PATCH /tokens/{id}/status` |
| **شاشة الانتظار** | `GET /display/queues` (عام — بدون توكن) |
| **تسجيل الوصول** | `POST /check-ins` (عادي أو إسعافي) |
| **المواعيد** | `GET /appointments` · `POST /appointments` · `PATCH /appointments/{id}/cancel` |
| **الاستشارات** | `GET /consult-requests?status=pending` · `POST /consult-requests` · `PATCH /consult-requests/{id}/coordinate` |

الحالة المحلية (قوائم المرضى، الطوابير، المواعيد، طلبات الاستشارة، الإشعارات داخل التطبيق) تُدار في [`src/store/useStore.ts`](src/store/useStore.ts).

---

## فهرس الشاشات · Screen index

| المسار | الشاشة | الملف |
|---|---|---|
| `/login` | تسجيل الدخول | [LoginScreen](src/screens/LoginScreen.tsx) |
| `/` | الرئيسية — الطوابير + إحصائيات + تسجيل وصول | [DashboardScreen](src/screens/DashboardScreen.tsx) |
| `/check-in` | تسجيل وصول (مسح / يدوي) | [CheckInScreen](src/screens/CheckInScreen.tsx) |
| `/emergency` | استقبال حالة إسعافية | [EmergencyScreen](src/screens/EmergencyScreen.tsx) |
| `/patients` | المرضى — بحث · فلترة · استشارات | [PatientsScreen](src/screens/PatientsScreen.tsx) |
| `/patients?filter=consult` | فلتر «استشارات مطلوبة» | PatientsScreen |
| `/patients/new` | تسجيل مريض جديد | [RegisterPatientScreen](src/screens/RegisterPatientScreen.tsx) |
| `/patients/consult` | تسجيل استشارة | [RegisterConsultScreen](src/screens/RegisterConsultScreen.tsx) |
| `/patients/:fileNo` | سجلّ المريض | [PatientRecordScreen](src/screens/PatientRecordScreen.tsx) |
| `/patients/:fileNo/id-card` | الهوية الرقمية + QR | [IdCardScreen](src/screens/IdCardScreen.tsx) |
| `/queue` | إدارة الدور | [QueueScreen](src/screens/QueueScreen.tsx) |
| `/appointments` | جدولة المواعيد | [AppointmentsScreen](src/screens/AppointmentsScreen.tsx) |
| `/waiting-screen` | شاشة الانتظار (داخل التطبيق) | [WaitingScreen](src/screens/WaitingScreen.tsx) |
| `/waiting-screen/display` | شاشة انتظار عامة (ملء الشاشة، بدون تسجيل دخول) | WaitingScreen |
| `/notifications` | الإشعارات | [NotificationsScreen](src/screens/NotificationsScreen.tsx) |
| `/profile` | حسابي | [ProfileScreen](src/screens/ProfileScreen.tsx) |

---

## تدفّقات رئيسية · Key flows

### تسجيل الوصول والرموز

الشاشة: [`/check-in`](src/screens/CheckInScreen.tsx)

1. **المسح أو الإدخال اليدوي** لرقم الإضبارة
2. **تأكيد الهوية** — ملخص المريض
3. **تحديد القسم** (من `GET /master/departments`) + سبب الزيارة
4. **إصدار الرمز** — `POST /check-ins` → يظهر في طابور القسم وشاشة الانتظار

- مريض غير موجود → تفرّع إلى [`/patients/new`](src/screens/RegisterPatientScreen.tsx)
- **الإسعاف** ([`/emergency`](src/screens/EmergencyScreen.tsx)): مسار أسرع مع `is_emergency=true` ورمز أولوية

### المواعيد

[`/appointments`](src/screens/AppointmentsScreen.tsx) — جلب حسب التاريخ، إنشاء موعد (`doctor_id` رقمي)، إلغاء عبر `PATCH …/cancel`. يمكن التمرير من المرضى: `?patient_file_no=B0012`.

### الاستشارات

- **تسجيل:** [`/patients/consult`](src/screens/RegisterConsultScreen.tsx) → `POST /consult-requests`
- **عرض:** عمود «الاستشارة» في جدول المرضى + قسم في سجل المريض
- **فلتر معلّقة:** زر «استشارات مطلوبة» → `GET /consult-requests?status=pending`
- **تنسيق/تحديث:** زر «تحديث الاستشارة» → `PATCH /consult-requests/{id}/coordinate`

### دليل رموز الاستشارات

معرّفة في [`src/components/ConsultIcons.tsx`](src/components/ConsultIcons.tsx):

| الرمز | النوع | Icon |
|---|---|---|
| قلبية | `cardiac` | Heart |
| عصبية | `neurological` | Brain |
| عينية | `ophthalmic` | Eye |
| أذنية | `ent` | Ear |
| جراحة | `surgery` | Scissors |
| أخرى | `other` | Stethoscope |

---

## نظام التصميم · Design system

- **الوضع الفاتح فقط.** الرموز (tokens) في [`src/styles/tokens.css`](src/styles/tokens.css) ومربوطة بـ Tailwind في [`tailwind.config.js`](tailwind.config.js).
- **الخطوط:** Tajawal (عربي) · Nunito · Quicksand.
- الدلالات: أزرق = أساسي · أخضر = نجاح · بنفسجي = استشارات · أصفر = احتفال · كهرماني = إسعافي/متأخر · أحمر = حرج.

### RTL وإمكانية الوصول

`dir="rtl"` و`lang="ar"` على `<html>`. الحالات لا تُميَّز باللون وحده — دائماً لون + أيقونة + نص. أهداف لمس ≥44px، تباين AA.

---

## خارج النطاق · Non-goals

- أدوار أخرى (طبيب / ممرض) — الاستقبال فقط
- إدخال بيانات سريرية أو حذف سجلات
- تطبيق ولي الأمر (النموذج جاهز للربط لاحقاً)
- ماسح QR أو طابعة حقيقية (محاكاة واجهة)
- وضع داكن

---

## التقنيات · Stack

| الطبقة | التقنية |
|---|---|
| UI | React 18, React Router 6 |
| Build | Vite 5, TypeScript 5 |
| Styling | Tailwind CSS 3, CVA, clsx |
| State | Zustand 5 |
| Icons | Lucide React |
