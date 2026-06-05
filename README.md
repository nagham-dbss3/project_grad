# تطبيق الاستقبال — Basma Reception App

تطبيق **مكتب الاستقبال (Front-Desk)** لمنصة أورام الأطفال الرقمية الخاصة بمنظمة بسمة. واجهة **عربية RTL** كاملة، **مستجيبة** (هاتف · لوحي · سطح مكتب)، مبنية بـ **React 18 + Vite + TypeScript** ببيانات وهمية فقط (بدون خادم).

Reception is the single cross-department entry point for every patient: check-in by scan, a live queue split by department, first-class emergency intake, full Basma registration, appointments, digital ID, and a public waiting display.

---

## التشغيل · How to run

```bash
npm install
npm run dev      # ثم افتح http://localhost:5173
```

أوامر أخرى:

```bash
npm run build      # tsc -b && vite build (يبني بدون أخطاء أنواع)
npm run typecheck  # tsc --noEmit
npm run preview    # معاينة الإصدار المبني
```

**تسجيل الدخول (وهمي):** أي اسم مستخدم + كلمة المرور `1234` — أو زر **PIN/البصمة** للدخول مباشرة.

---

## أين توجد البيانات الوهمية · Where mock data lives

- [`src/mock/types.ts`](src/mock/types.ts) — كل أنواع البيانات (§7 من المواصفة): `Patient`, `CheckIn`, `Token`, `Appointment`, `AppNotification`, `ConsultationType`, …
- [`src/mock/data.ts`](src/mock/data.ts) — البيانات الأولية: ~18 مريضاً عبر الأقسام الثلاثة، حالات حيوية متنوعة، احتياجات استشارة، طوابير حيّة، **حالة إسعافية نشطة**، مرضى **غير مسجّلين** (لتجربة تفرّع المسح ← تسجيل)، مواعيد اليوم، وإشعارات.
- الكتابة (إصدار الرموز، التسجيل، المواعيد، الإشعارات) تُدار في الحالة المحلية عبر **Zustand** في [`src/store/useStore.ts`](src/store/useStore.ts).
- لتجربة حالات التحميل/الخطأ: كل شاشة تستخدم [`src/lib/useMockLoad.ts`](src/lib/useMockLoad.ts) (محاكاة تأخير الشبكة + حالة خطأ).

> اليوم/الآن ثابتان (`MOCK_TODAY` / `NOW` في [`src/lib/utils.ts`](src/lib/utils.ts)) لجعل الطوابير ومدد الانتظار حتمية (deterministic).

---

## تدفّق المسح وتسجيل الوصول والرموز · Scan / check-in / token flow

الشاشة: [`/check-in`](src/screens/CheckInScreen.tsx) — بخطوات (Stepper) في ≤3 نقرات:

1. **المسح** — زر ماسح وهمي يحلّ رقم الإضبارة (أو إدخال يدوي fallback). عند الحل **يُسجَّل رقم المريض ووقت الوصول تلقائياً**.
2. **تأكيد الهوية** — ملخص (رقم الإضبارة، الاسم، العمر) كفحص أمان.
3. **تحديد القسم** — مفتاح مجزّأ (العيادة / النهاري / الداخلي) + سبب الزيارة.
4. **إصدار الرمز** — يُنشئ سجل `CheckIn` + `Token` يظهر في طابور القسم وعلى شاشة الانتظار.

- **مسح غير معروف:** يتفرّع إلى **تسجيل مريض جديد** ([`/patients/new`](src/screens/RegisterPatientScreen.tsx)) ثم يعود لإصدار الرمز.
- **الرمز جاهز لتطبيق ولي الأمر:** كل `Token` يحمل `visibleToGuardian: true` وترقيماً ثابتاً قابلاً للمشاركة (`C-/D-/I-`). تطبيق ولي الأمر خارج النطاق حالياً، لكن النموذج جاهز للربط.
- **الحالة الإسعافية** ([`/emergency`](src/screens/EmergencyScreen.tsx)): مسار أسرع — مسح أو **إنشاء سريع** لمريض بحد أدنى من البيانات → تحديد القسم → **رمز أولوية** يُثبَّت أعلى الطابور بوسم «إسعافي» + إشعار للفريق. الوصول يُسجَّل دائماً (`isEmergency=true`) — لا تجاوز صامت. السجلات الناقصة تُوسم «بانتظار استكمال البيانات».

---

## دليل رموز الاستشارات · Consult-icon legend

تظهر بجانب اسم المريض في القوائم والسجلّ (مع tooltip وأسطورة legend). الضغط عليها يفتح **«تواصل مع الطبيب المختص»** (إشعار وهمي). المعرّفة في [`src/components/ConsultIcons.tsx`](src/components/ConsultIcons.tsx):

| الرمز | النوع | Icon |
|---|---|---|
| قلبية | `cardiac` | Heart |
| عصبية | `neurological` | Brain |
| عينية | `ophthalmic` | Eye |
| أذنية | `ent` | Ear |
| جراحة | `surgery` | Scissors |
| أخرى | `other` | Stethoscope |

---

## فهرس الشاشات · Screen index

| المسار | الشاشة | الملف |
|---|---|---|
| `/login` | تسجيل الدخول | [LoginScreen](src/screens/LoginScreen.tsx) |
| `/` | الرئيسية — الطوابير حسب القسم + تسجيل الوصول | [DashboardScreen](src/screens/DashboardScreen.tsx) |
| `/check-in` | تسجيل وصول (مسح) | [CheckInScreen](src/screens/CheckInScreen.tsx) |
| `/emergency` | استقبال حالة إسعافية | [EmergencyScreen](src/screens/EmergencyScreen.tsx) |
| `/patients` | المرضى — بحث + رموز الاستشارة | [PatientsScreen](src/screens/PatientsScreen.tsx) |
| `/patients/new` | تسجيل مريض جديد (نموذج بسمة الكامل) | [RegisterPatientScreen](src/screens/RegisterPatientScreen.tsx) |
| `/patients/:fileNo` | سجلّ المريض (عرض الاستقبال) | [PatientRecordScreen](src/screens/PatientRecordScreen.tsx) |
| `/patients/:fileNo/id-card` | الهوية الرقمية | [IdCardScreen](src/screens/IdCardScreen.tsx) |
| `/queue` | إدارة الدور | [QueueScreen](src/screens/QueueScreen.tsx) |
| `/appointments` | جدولة المواعيد | [AppointmentsScreen](src/screens/AppointmentsScreen.tsx) |
| `/waiting-screen` | شاشة الانتظار (+ `/display` ملء الشاشة) | [WaitingScreen](src/screens/WaitingScreen.tsx) |
| `/notifications` | الإشعارات | [NotificationsScreen](src/screens/NotificationsScreen.tsx) |
| `/profile` | حسابي | [ProfileScreen](src/screens/ProfileScreen.tsx) |

---

## بنية المشروع · Structure

```
src/
  app/          AppShell (top bar · sidebar/bottom-tabs · routing) + App routes
  screens/      شاشة لكل مسار
  components/   مشتركة + check-in/scan · DepartmentLane · QueueRowCard ·
                ConsultIcons · PatientContextBar · Stepper · MockQR · …
    ui/         primitives بنمط shadcn (button, card, badge, input, select,
                dialog/sheet, tabs, toast, states, misc)
  mock/         types.ts + data.ts
  store/        useStore.ts (Zustand)
  i18n/         ar.ts (قاموس الواجهة) + enums.ts (خيارات القوائم)
  lib/          utils · selectors (بناء الطوابير) · useMockLoad
  styles/       tokens.css (متغيّرات نظام التصميم §3)
```

---

## نظام التصميم · Design system

- **الوضع الفاتح فقط.** الرموز (tokens) معرّفة كمتغيّرات CSS في [`src/styles/tokens.css`](src/styles/tokens.css) (oklch مصدر الحقيقة) ومربوطة بـ Tailwind في [`tailwind.config.js`](tailwind.config.js).
- **الخطوط:** Tajawal (عربي — أساسي) · Nunito (واجهة لاتينية) · Quicksand (عناوين/براند لاتيني).
- خلفية Surface متدرّجة خفيفة (توهج أزرق + أصفر)، تدرّجات البراند للأبطال فقط.
- الدلالات اللونية: أزرق = إجراءات أساسية · أخضر = نجاح · بنفسجي = وسوم/استشارات · أصفر = احتفال · **كهرماني/تحذيري = إسعافي ومتأخّر** · أحمر = حرج فقط.

## RTL وإمكانية الوصول

`dir="rtl"` و`lang="ar"` على `<html>`، وكل التخطيطات معكوسة. الحالات والاستشارات لا تُميَّز باللون وحده — دائماً لون + أيقونة + نص. أهداف لمس ≥44px، حلقة تركيز ظاهرة، تباين AA.

تم التحقق من الاستجابة عند ~375px (هاتف: شريط سفلي + طوابير بتبويبات + بطاقات مكدّسة + bottom-sheets)، ~768px (لوحي)، ~1280px (سطح مكتب: 3 مسارات جنباً إلى جنب).

---

## خارج النطاق · Non-goals

بدون خادم/مصادقة حقيقية، بدون أدوار أخرى (طبيب/ممرض)، الاستقبال **لا** يُدخل بيانات سريرية ولا يحذف سجلات، تطبيق ولي الأمر خارج النطاق (النموذج فقط)، بدون وضع داكن، بدون ماسح/طابعة حقيقية (محاكاة).
