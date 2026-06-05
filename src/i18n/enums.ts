/* Arabic labels + option lists for every enumerated field (used in dropdowns/chips). */
import { ar } from './ar'
import type {
  Caregiver,
  CaregiverEducation,
  ConsultationType,
  Department,
  Gender,
  InitialTreatmentType,
  LifeStatus,
  Nationality,
  ReceivedInitial,
  ReferralCenter,
  ReferralCountry,
  ReferralPattern,
  ReferringSpecialty,
  TokenStatus,
} from '@/mock/types'

export interface Option<T extends string> {
  value: T
  label: string
}

export const departmentLabel: Record<Department, string> = ar.dept
export const departmentOptions: Option<Department>[] = [
  { value: 'clinic', label: ar.dept.clinic },
  { value: 'dayCare', label: ar.dept.dayCare },
  { value: 'inpatient', label: ar.dept.inpatient },
]

export const tokenStatusLabel: Record<TokenStatus, string> = ar.tokenStatus

export const lifeStatusLabel: Record<LifeStatus, string> = ar.lifeStatus

export const consultLabel: Record<ConsultationType, string> = {
  cardiac: ar.consult.cardiac,
  neurological: ar.consult.neurological,
  ophthalmic: ar.consult.ophthalmic,
  ent: ar.consult.ent,
  surgery: ar.consult.surgery,
  other: ar.consult.other,
}
export const consultTypes: ConsultationType[] = [
  'cardiac',
  'neurological',
  'ophthalmic',
  'ent',
  'surgery',
  'other',
]

export const genderOptions: Option<Gender>[] = [
  { value: 'male', label: ar.common.male },
  { value: 'female', label: ar.common.female },
]

export const nationalityOptions: Option<Nationality>[] = [
  { value: 'syrian', label: 'سوري' },
  { value: 'syrianPalestinian', label: 'سوري فلسطيني' },
  { value: 'other', label: 'أخرى' },
]

export const caregiverOptions: Option<Caregiver>[] = [
  { value: 'bothParents', label: 'الأب والأم' },
  { value: 'fatherOnly', label: 'الأب فقط' },
  { value: 'motherOnly', label: 'الأم فقط' },
  { value: 'grandparent', label: 'الجد أو الجدة' },
  { value: 'uncleAunt', label: 'العم أو الخال أو العمة أو الخالة' },
  { value: 'other', label: 'جهة أخرى' },
]

export const caregiverEducationOptions: Option<CaregiverEducation>[] = [
  { value: 'illiterate', label: 'أمّي' },
  { value: 'primary', label: 'ابتدائي' },
  { value: 'preparatory', label: 'إعدادي' },
  { value: 'secondary', label: 'ثانوي' },
  { value: 'university', label: 'جامعي' },
]

export const referralCountryOptions: Option<ReferralCountry>[] = [
  { value: 'syria', label: 'سورية' },
  { value: 'lebanon', label: 'لبنان' },
  { value: 'jordan', label: 'الأردن' },
  { value: 'turkey', label: 'تركيا' },
  { value: 'other', label: 'بلد آخر' },
]

export const referralCenterOptions: Option<ReferralCenter>[] = [
  { value: 'publicHospital', label: 'مشفى عام' },
  { value: 'publicClinic', label: 'مستوصف عام' },
  { value: 'privateHospital', label: 'مشفى خاص' },
  { value: 'privateClinic', label: 'عيادة خاصة' },
  { value: 'self', label: 'تحويل ذاتي' },
]

export const referringSpecialtyOptions: Option<ReferringSpecialty>[] = [
  { value: 'general', label: 'عام' },
  { value: 'pediatrics', label: 'أطفال' },
  { value: 'surgery', label: 'جراحة' },
  { value: 'ophthalmology', label: 'عينية' },
  { value: 'ent', label: 'أذنية' },
  { value: 'pediatricOncology', label: 'أورام أطفال' },
  { value: 'adultOncology', label: 'أورام بالغين' },
  { value: 'radiotherapy', label: 'علاج شعاعي' },
  { value: 'other', label: 'آخر' },
  { value: 'self', label: 'تحويل ذاتي' },
]

export const referralPatternOptions: Option<ReferralPattern>[] = [
  { value: 'pattern1', label: 'نمط 1 — إحالة مباشرة' },
  { value: 'pattern2', label: 'نمط 2 — إحالة عبر مركز' },
  { value: 'pattern3', label: 'نمط 3 — إحالة متأخرة' },
  { value: 'pattern4', label: 'نمط 4 — إحالة خارجية' },
  { value: 'pattern5', label: 'نمط 5 — أخرى' },
]

export const receivedInitialOptions: Option<ReceivedInitial>[] = [
  { value: 'yes', label: 'نعم' },
  { value: 'no', label: 'لا' },
  { value: 'unknown', label: 'غير معروف' },
]

export const initialTypeOptions: Option<InitialTreatmentType>[] = [
  { value: 'curative', label: 'شفاء' },
  { value: 'palliative', label: 'تلطيفي' },
]

export const lifeStatusOptions: Option<LifeStatus>[] = [
  { value: 'alive', label: ar.lifeStatus.alive },
  { value: 'deceased', label: ar.lifeStatus.deceased },
  { value: 'treatmentStopped', label: ar.lifeStatus.treatmentStopped },
  { value: 'lostToFollowUp', label: ar.lifeStatus.lostToFollowUp },
  { value: 'unknown', label: ar.lifeStatus.unknown },
]

export const noCurativeReasonOptions: Option<string>[] = [
  { value: 'advanced', label: 'مرحلة متقدمة' },
  { value: 'refused', label: 'رفض العلاج' },
  { value: 'financial', label: 'أسباب مادية' },
  { value: 'transferred', label: 'تحويل لمركز آخر' },
  { value: 'other', label: 'أخرى' },
]

export const palliativeTypeOptions: Option<string>[] = [
  { value: 'pain', label: 'تسكين الألم' },
  { value: 'supportive', label: 'رعاية داعمة' },
  { value: 'home', label: 'رعاية منزلية' },
  { value: 'other', label: 'أخرى' },
]

export const deathCauseOptions: Option<string>[] = [
  { value: 'disease', label: 'تطور المرض' },
  { value: 'complication', label: 'مضاعفات العلاج' },
  { value: 'infection', label: 'إنتان' },
  { value: 'other', label: 'أخرى' },
]
