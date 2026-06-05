import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Save, Check, CloudUpload } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field } from '@/components/ui/misc'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/PageHeader'
import { Stepper } from '@/components/Stepper'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'
import {
  caregiverEducationOptions,
  caregiverOptions,
  deathCauseOptions,
  genderOptions,
  initialTypeOptions,
  lifeStatusOptions,
  nationalityOptions,
  noCurativeReasonOptions,
  palliativeTypeOptions,
  receivedInitialOptions,
  referralCenterOptions,
  referralCountryOptions,
  referralPatternOptions,
  referringSpecialtyOptions,
  type Option,
} from '@/i18n/enums'
import { NOW } from '@/lib/utils'
import type {
  Caregiver,
  CaregiverEducation,
  Gender,
  InitialTreatmentType,
  LifeStatus,
  Nationality,
  Patient,
  ReceivedInitial,
  ReferralCenter,
  ReferralCountry,
  ReferralPattern,
  ReferringSpecialty,
} from '@/mock/types'

interface Draft {
  fileNoBasma: string
  fileNoBiruni: string
  electronicFileDate: string
  basmaFileOpenDate: string
  nationalIdPatient: string
  nationalIdFather: string
  firstName: string
  familyName: string
  fatherName: string
  motherName: string
  dob: string
  gender: Gender | ''
  nationality: Nationality | ''
  residenceGov: string
  residenceCity: string
  caregiver: Caregiver | ''
  caregiverEducation: CaregiverEducation | ''
  phoneFather: string
  phoneMother: string
  referralDate: string
  referralCountry: ReferralCountry | ''
  referralCenter: ReferralCenter | ''
  referringSpecialty: ReferringSpecialty | ''
  referralPattern: ReferralPattern | ''
  receivedInitial: ReceivedInitial | ''
  initialType: InitialTreatmentType | ''
  noCurativeReason: string
  palliativeType: string
  lifeStatus: LifeStatus | ''
  deathDate: string
  deathCause: string
  deathCity: string
}

const emptyDraft: Draft = {
  fileNoBasma: '', fileNoBiruni: '', electronicFileDate: '', basmaFileOpenDate: '',
  nationalIdPatient: '', nationalIdFather: '', firstName: '', familyName: '', fatherName: '', motherName: '',
  dob: '', gender: '', nationality: '', residenceGov: '', residenceCity: '', caregiver: '', caregiverEducation: '',
  phoneFather: '', phoneMother: '', referralDate: '', referralCountry: '', referralCenter: '', referringSpecialty: '',
  referralPattern: '', receivedInitial: '', initialType: '', noCurativeReason: '', palliativeType: '',
  lifeStatus: '', deathDate: '', deathCause: '', deathCity: '',
}

export function RegisterPatientScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const patients = useStore((s) => s.patients)
  const addPatient = useStore((s) => s.addPatient)
  const pushToast = useStore((s) => s.pushToast)
  const pushNotification = useStore((s) => s.pushNotification)
  const returnTo = params.get('return')

  const [draft, setDraft] = useState<Draft>(() => ({ ...emptyDraft, fileNoBasma: params.get('fileNo') ?? '' }))
  const [step, setStep] = useState(0)
  const [autosaved, setAutosaved] = useState(false)
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const isDeath = draft.lifeStatus === 'deceased'
  const showFollowUp = isDeath || draft.lifeStatus === 'lostToFollowUp' || draft.lifeStatus === 'treatmentStopped'

  const steps: string[] = [ar.register.step1, ar.register.step2, ar.register.step3, ar.register.step4]
  if (showFollowUp) steps.push(ar.register.step5)
  steps.push(ar.register.review)

  // Autosave indicator on each change
  useEffect(() => {
    if (draft.fileNoBasma || draft.firstName) {
      setAutosaved(true)
      const id = setTimeout(() => setAutosaved(false), 1800)
      return () => clearTimeout(id)
    }
  }, [draft])

  const errors = useMemo(() => {
    const e: Partial<Record<keyof Draft, string>> = {}
    if (draft.fileNoBasma && patients.some((p) => p.fileNoBasma === draft.fileNoBasma)) e.fileNoBasma = ar.register.duplicateFile
    if (draft.nationalIdPatient && patients.some((p) => p.nationalIdPatient && p.nationalIdPatient === draft.nationalIdPatient)) e.nationalIdPatient = ar.register.duplicateNid
    return e
  }, [draft.fileNoBasma, draft.nationalIdPatient, patients])

  const isLast = step === steps.length - 1
  const canSave = draft.fileNoBasma && draft.firstName && draft.familyName && !errors.fileNoBasma && !errors.nationalIdPatient

  const save = () => {
    if (!canSave) return
    const patient: Patient = {
      fileNoBasma: draft.fileNoBasma,
      fileNoBiruni: draft.fileNoBiruni || '—',
      electronicFileDate: draft.electronicFileDate || NOW.toISOString().slice(0, 10),
      basmaFileOpenDate: draft.basmaFileOpenDate || NOW.toISOString().slice(0, 10),
      biruniFileOpenDate: '',
      nationalIdPatient: draft.nationalIdPatient,
      nationalIdFather: draft.nationalIdFather,
      firstName: draft.firstName,
      familyName: draft.familyName,
      fatherName: draft.fatherName,
      motherName: draft.motherName,
      dob: draft.dob || '2020-01-01',
      gender: (draft.gender || 'male') as Gender,
      nationality: (draft.nationality || 'syrian') as Nationality,
      familyRegistry: { country: 'سورية', governorate: draft.residenceGov, city: draft.residenceCity },
      residence: { country: 'سورية', governorate: draft.residenceGov, city: draft.residenceCity },
      caregiver: (draft.caregiver || 'bothParents') as Caregiver,
      caregiverEducation: (draft.caregiverEducation || 'primary') as CaregiverEducation,
      phones: { father: draft.phoneFather, mother: draft.phoneMother },
      referral: {
        date: draft.referralDate,
        country: (draft.referralCountry || undefined) as ReferralCountry | undefined,
        center: (draft.referralCenter || undefined) as ReferralCenter | undefined,
        referringDoctorSpecialty: (draft.referringSpecialty || undefined) as ReferringSpecialty | undefined,
        pattern: (draft.referralPattern || undefined) as ReferralPattern | undefined,
      },
      generalTreatment: {
        receivedInitialAtBasma: (draft.receivedInitial || undefined) as ReceivedInitial | undefined,
        initialType: (draft.initialType || undefined) as InitialTreatmentType | undefined,
        noCurativeReason: draft.noCurativeReason || undefined,
        palliativeType: draft.palliativeType || undefined,
        lastVitalStatus: (draft.lifeStatus || 'alive') as LifeStatus,
      },
      followUp: showFollowUp ? { deathDate: draft.deathDate, deathCause: draft.deathCause, deathCity: draft.deathCity } : {},
      lifeStatus: (draft.lifeStatus || 'alive') as LifeStatus,
      consultationNeeds: [],
      registrationDate: NOW.toISOString().slice(0, 10),
    }
    addPatient(patient)
    pushNotification({ type: 'info', message: `تم تسجيل مريض جديد — ${patient.firstName} ${patient.familyName}`, relatedPatientFileNo: patient.fileNoBasma, timestamp: NOW.toISOString() })
    pushToast({ variant: 'success', title: ar.common.saved, description: ar.register.savedToast })
    if (returnTo === 'check-in') navigate('/check-in')
    else navigate(`/patients/${patient.fileNoBasma}`)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={ar.register.title}
        description={ar.register.stepOf.replace('{x}', String(step + 1)).replace('{y}', String(steps.length))}
        back
        action={autosaved ? <Badge variant="secondary"><CloudUpload className="h-3.5 w-3.5" />{ar.register.autosaved}</Badge> : undefined}
      />
      <Stepper steps={steps} current={step} className="mb-5" />

      <Card>
        <CardContent className="p-5 sm:p-6">
          {/* Step 1: File identifiers */}
          {step === 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={`${ar.common.fileNo} (بسمة)`} required error={errors.fileNoBasma}>
                <Input value={draft.fileNoBasma} onChange={(e) => set('fileNoBasma', e.target.value)} inputMode="numeric" placeholder="10xxx" />
              </Field>
              <Field label="رقم ملف البيروني" hint="xxxx/yyyy">
                <Input value={draft.fileNoBiruni} onChange={(e) => set('fileNoBiruni', e.target.value)} placeholder="0231/2026" />
              </Field>
              <Field label="تاريخ إنشاء الملف الإلكتروني">
                <Input type="date" value={draft.electronicFileDate} onChange={(e) => set('electronicFileDate', e.target.value)} />
              </Field>
              <Field label="تاريخ فتح ملف بسمة">
                <Input type="date" value={draft.basmaFileOpenDate} onChange={(e) => set('basmaFileOpenDate', e.target.value)} />
              </Field>
            </div>
          )}

          {/* Step 2: Demographics */}
          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="الاسم الأول" required><Input value={draft.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
              <Field label="اسم العائلة" required><Input value={draft.familyName} onChange={(e) => set('familyName', e.target.value)} /></Field>
              <Field label="اسم الأب"><Input value={draft.fatherName} onChange={(e) => set('fatherName', e.target.value)} /></Field>
              <Field label="اسم الأم"><Input value={draft.motherName} onChange={(e) => set('motherName', e.target.value)} /></Field>
              <Field label="تاريخ الميلاد"><Input type="date" value={draft.dob} onChange={(e) => set('dob', e.target.value)} /></Field>
              <SelectField label="الجنس" value={draft.gender} onChange={(v) => set('gender', v as Gender)} options={genderOptions} />
              <Field label="الرقم الوطني للمريض" error={errors.nationalIdPatient}><Input value={draft.nationalIdPatient} onChange={(e) => set('nationalIdPatient', e.target.value)} inputMode="numeric" /></Field>
              <Field label="الرقم الوطني للأب"><Input value={draft.nationalIdFather} onChange={(e) => set('nationalIdFather', e.target.value)} inputMode="numeric" /></Field>
              <SelectField label="الجنسية" value={draft.nationality} onChange={(v) => set('nationality', v as Nationality)} options={nationalityOptions} />
              <Field label="المحافظة (الإقامة)"><Input value={draft.residenceGov} onChange={(e) => set('residenceGov', e.target.value)} /></Field>
              <Field label="المدينة (الإقامة)"><Input value={draft.residenceCity} onChange={(e) => set('residenceCity', e.target.value)} /></Field>
              <SelectField label="مقدم الرعاية" value={draft.caregiver} onChange={(v) => set('caregiver', v as Caregiver)} options={caregiverOptions} />
              <SelectField label="المستوى التعليمي لمقدم الرعاية" value={draft.caregiverEducation} onChange={(v) => set('caregiverEducation', v as CaregiverEducation)} options={caregiverEducationOptions} />
              <Field label="هاتف الأب"><Input value={draft.phoneFather} onChange={(e) => set('phoneFather', e.target.value)} inputMode="tel" /></Field>
              <Field label="هاتف الأم"><Input value={draft.phoneMother} onChange={(e) => set('phoneMother', e.target.value)} inputMode="tel" /></Field>
            </div>
          )}

          {/* Step 3: Referral */}
          {step === 2 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="تاريخ الإحالة"><Input type="date" value={draft.referralDate} onChange={(e) => set('referralDate', e.target.value)} /></Field>
              <SelectField label="بلد الإحالة" value={draft.referralCountry} onChange={(v) => set('referralCountry', v as ReferralCountry)} options={referralCountryOptions} />
              <SelectField label="المركز المحوِّل" value={draft.referralCenter} onChange={(v) => set('referralCenter', v as ReferralCenter)} options={referralCenterOptions} />
              <SelectField label="اختصاص الطبيب المحوِّل" value={draft.referringSpecialty} onChange={(v) => set('referringSpecialty', v as ReferringSpecialty)} options={referringSpecialtyOptions} />
              <SelectField label="نمط الإحالة" value={draft.referralPattern} onChange={(v) => set('referralPattern', v as ReferralPattern)} options={referralPatternOptions} />
            </div>
          )}

          {/* Step 4: General treatment */}
          {step === 3 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField label="تلقّى علاجاً بدئياً في بسمة؟" value={draft.receivedInitial} onChange={(v) => set('receivedInitial', v as ReceivedInitial)} options={receivedInitialOptions} />
              <SelectField label="نوع العلاج البدئي" value={draft.initialType} onChange={(v) => set('initialType', v as InitialTreatmentType)} options={initialTypeOptions} />
              {draft.initialType === 'curative' && (
                <SelectField label="سبب عدم بدء علاج الشفاء" value={draft.noCurativeReason} onChange={(v) => set('noCurativeReason', v)} options={noCurativeReasonOptions} />
              )}
              {draft.initialType === 'palliative' && (
                <SelectField label="نوع العلاج التلطيفي" value={draft.palliativeType} onChange={(v) => set('palliativeType', v)} options={palliativeTypeOptions} />
              )}
              <SelectField label="آخر حالة حيوية" value={draft.lifeStatus} onChange={(v) => set('lifeStatus', v as LifeStatus)} options={lifeStatusOptions} />
              <p className="sm:col-span-2 text-xs text-muted-foreground">{ar.register.deathSectionNote}</p>
            </div>
          )}

          {/* Step 5: Follow-up / death (conditional) */}
          {showFollowUp && step === 4 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {isDeath ? (
                <>
                  <Field label="تاريخ الوفاة"><Input type="date" value={draft.deathDate} onChange={(e) => set('deathDate', e.target.value)} /></Field>
                  <SelectField label="سبب الوفاة" value={draft.deathCause} onChange={(v) => set('deathCause', v)} options={deathCauseOptions} />
                  <Field label="مدينة الوفاة"><Input value={draft.deathCity} onChange={(e) => set('deathCity', e.target.value)} /></Field>
                </>
              ) : (
                <Field label="ملاحظة المتابعة"><Input value={draft.deathCity} onChange={(e) => set('deathCity', e.target.value)} placeholder="آخر معلومة متابعة معروفة" /></Field>
              )}
            </div>
          )}

          {/* Review */}
          {isLast && (
            <div>
              <h3 className="font-bold mb-3">{ar.register.review}</h3>
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <ReviewRow label={ar.common.fileNo} value={draft.fileNoBasma} />
                <ReviewRow label={ar.common.name} value={`${draft.firstName} ${draft.familyName}`} />
                <ReviewRow label="اسم الأب" value={draft.fatherName} />
                <ReviewRow label="تاريخ الميلاد" value={draft.dob} />
                <ReviewRow label="الإقامة" value={[draft.residenceGov, draft.residenceCity].filter(Boolean).join(' — ')} />
                <ReviewRow label="الحالة الحيوية" value={lifeStatusOptions.find((o) => o.value === draft.lifeStatus)?.label} />
              </dl>
              {!canSave && <p className="text-xs text-destructive font-bold mt-3">يجب إدخال رقم الإضبارة والاسم الأول واسم العائلة (وألا يكونا مكررين).</p>}
            </div>
          )}

          {/* Nav */}
          <div className="flex gap-2 mt-6 pt-4 border-t">
            {step > 0 && <Button variant="outline" onClick={() => setStep((s) => s - 1)}>{ar.common.back}</Button>}
            {!isLast ? (
              <Button className="ms-auto" onClick={() => setStep((s) => s + 1)}>{ar.common.next}</Button>
            ) : (
              <Button className="ms-auto" disabled={!canSave} onClick={save}>
                <Save className="h-4 w-4" />
                {ar.common.save}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SelectField<T extends string>({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: T) => void
  options: Option<T>[]
}) {
  return (
    <Field label={label}>
      <Select value={value} onChange={(e) => onChange(e.target.value as T)} placeholder="اختر…">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
    </Field>
  )
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-bold flex items-center gap-1">{value || '—'}{value && <Check className="h-3.5 w-3.5 text-secondary" />}</dd>
    </div>
  )
}
