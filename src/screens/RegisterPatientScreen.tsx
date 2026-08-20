import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Save, Check, CloudUpload, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field } from '@/components/ui/misc'
import { Badge } from '@/components/ui/badge'
import { ListSkeleton } from '@/components/ui/states'
import { PageHeader } from '@/components/PageHeader'
import { Stepper } from '@/components/Stepper'
import { useStore } from '@/store/useStore'
import { useMasterData } from '@/lib/useMasterData'
import { normalizeReferralOptionValue } from '@/lib/masterData'
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
  referralCountryOptions,
  referralPatternOptions,
  referringSpecialtyOptions,
  type Option,
} from '@/i18n/enums'
import { todayIsoDate } from '@/lib/utils'
import { createPatient, fetchPatientRequest, apiToPatient, ApiError, type ApiPatient, type PatientPayload } from '@/lib/api'
import type {
  Caregiver,
  CaregiverEducation,
  Gender,
  InitialTreatmentType,
  LifeStatus,
  Nationality,
  ReceivedInitial,
  ReferralCountry,
  ReferralPattern,
  ReferringSpecialty,
} from '@/mock/types'

interface Draft {
  fileNoBasma: string
  fileNoBiruni: string
  electronicFileDate: string
  basmaFileOpenDate: string
  biruniFileOpenDate: string
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
  department: string
  referralDate: string
  referralCountry: ReferralCountry | ''
  referralOption: string
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
  diagnosis: string
  currentPhase: string
  registrationDate: string
}

const emptyDraft: Draft = {
  fileNoBasma: '', fileNoBiruni: '', electronicFileDate: '', basmaFileOpenDate: '', biruniFileOpenDate: '',
  nationalIdPatient: '', nationalIdFather: '', firstName: '', familyName: '', fatherName: '', motherName: '',
  dob: '', gender: '', nationality: '', residenceGov: '', residenceCity: '', caregiver: '', caregiverEducation: '',
  phoneFather: '', phoneMother: '', department: '', referralDate: '', referralCountry: '', referralOption: '', referringSpecialty: '',
  referralPattern: '', receivedInitial: '', initialType: '', noCurativeReason: '', palliativeType: '',
  lifeStatus: '', deathDate: '', deathCause: '', deathCity: '', diagnosis: '', currentPhase: '', registrationDate: '',
}

const today = () => todayIsoDate()
const label = (options: Option<string>[], value: string): string =>
  options.find((o) => o.value === value)?.label ?? ''

/** Arabic/Latin letters and spaces only — no digits or symbols. */
const NAME_RE = /^[\p{Script=Arabic}a-zA-Z\s]+$/u

function validateName(value: string, required: boolean, msgs: { required: string; invalid: string }): string | undefined {
  const v = value.trim()
  if (!v) return required ? msgs.required : undefined
  if (!NAME_RE.test(v)) return msgs.invalid
  return undefined
}

function validatePhone(
  phone: string,
  msgs: { prefix: string; length: string; digitsOnly: string },
): string | undefined {
  const v = phone.trim()
  if (!v) return undefined
  if (!/^\d+$/.test(v)) return msgs.digitsOnly
  if (!v.startsWith('09')) return msgs.prefix
  if (v.length < 10) return msgs.length
  return undefined
}

function validateDate(value: string, invalidMsg: string, opts?: { notFuture?: boolean }): string | undefined {
  if (!value.trim()) return undefined
  const [ys, ms, ds] = value.split('-')
  const y = Number(ys)
  const m = Number(ms)
  const d = Number(ds)
  if (!y || m < 1 || m > 12 || d < 1) return invalidMsg
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return invalidMsg
  if (opts?.notFuture && value > today()) return ar.register.dobFuture
  return undefined
}

function validateDraft(draft: Draft, isEdit: boolean, patients: { fileNoBasma: string; nationalIdPatient: string }[]): Partial<Record<keyof Draft, string>> {
  const e: Partial<Record<keyof Draft, string>> = {}
  const nameMsgs = { required: ar.register.nameRequired, invalid: ar.register.nameInvalid }
  const phoneMsgs = { prefix: ar.register.phonePrefix, length: ar.register.phoneLength, digitsOnly: ar.register.phoneDigitsOnly }

  const firstNameErr = validateName(draft.firstName, true, nameMsgs)
  if (firstNameErr) e.firstName = firstNameErr
  const familyNameErr = validateName(draft.familyName, true, nameMsgs)
  if (familyNameErr) e.familyName = familyNameErr
  const fatherNameErr = validateName(draft.fatherName, false, nameMsgs)
  if (fatherNameErr) e.fatherName = fatherNameErr
  const motherNameErr = validateName(draft.motherName, false, nameMsgs)
  if (motherNameErr) e.motherName = motherNameErr

  const fileDateFields: (keyof Draft)[] = ['electronicFileDate', 'basmaFileOpenDate', 'biruniFileOpenDate', 'referralDate', 'deathDate']
  for (const key of fileDateFields) {
    const err = validateDate(draft[key] as string, ar.register.dateInvalid)
    if (err) e[key] = err
  }
  const dobErr = validateDate(draft.dob, ar.register.dateInvalid, { notFuture: true })
  if (dobErr) e.dob = dobErr

  const phoneFatherErr = validatePhone(draft.phoneFather, phoneMsgs)
  if (phoneFatherErr) e.phoneFather = phoneFatherErr
  const phoneMotherErr = validatePhone(draft.phoneMother, phoneMsgs)
  if (phoneMotherErr) e.phoneMother = phoneMotherErr

  if (!isEdit && draft.fileNoBasma && patients.some((p) => p.fileNoBasma === draft.fileNoBasma)) {
    e.fileNoBasma = ar.register.duplicateFile
  }
  if (
    !isEdit &&
    draft.nationalIdPatient &&
    patients.some((p) => p.nationalIdPatient && p.nationalIdPatient === draft.nationalIdPatient)
  ) {
    e.nationalIdPatient = ar.register.duplicateNid
  }
  return e
}

const STEP_FIELDS: Partial<Record<number, (keyof Draft)[]>> = {
  0: ['electronicFileDate', 'basmaFileOpenDate', 'biruniFileOpenDate'],
  1: ['firstName', 'familyName', 'fatherName', 'motherName', 'phoneFather', 'phoneMother', 'nationalIdPatient'],
  2: ['referralDate'],
  4: ['deathDate'],
}

const lifeStatusApi: Record<LifeStatus, string> = {
  alive: 'alive',
  deceased: 'deceased',
  treatmentStopped: 'treatment_stopped',
  lostToFollowUp: 'lost_to_followup',
  unknown: 'unknown',
}

const caregiverApi: Record<Caregiver, string> = {
  bothParents: 'both_parents',
  fatherOnly: 'father_only',
  motherOnly: 'mother_only',
  grandparent: 'grandparent',
  uncleAunt: 'relative',
  other: 'relative',
}

const lifeStatusFromApi: Record<string, LifeStatus> = {
  alive: 'alive',
  deceased: 'deceased',
  treatment_stopped: 'treatmentStopped',
  lost_to_followup: 'lostToFollowUp',
  unknown: 'unknown',
}

const caregiverFromApi: Record<string, Caregiver> = {
  both_parents: 'bothParents',
  father_only: 'fatherOnly',
  mother_only: 'motherOnly',
  grandparent: 'grandparent',
  relative: 'uncleAunt',
}

function apiToDraft(api: ApiPatient): Draft {
  const [resGov = '', resCity = ''] = api.residence ?? []
  return {
    fileNoBasma: api.file_no_basma ?? '',
    fileNoBiruni: api.file_no_biruni ?? '',
    electronicFileDate: api.electronic_file_date ?? '',
    basmaFileOpenDate: api.basma_file_open_date ?? '',
    biruniFileOpenDate: api.biruni_file_open_date ?? '',
    nationalIdPatient: api.national_id_patient ?? '',
    nationalIdFather: api.national_id_father ?? '',
    firstName: api.first_name ?? '',
    familyName: api.family_name ?? '',
    fatherName: api.father_name ?? '',
    motherName: api.mother_name ?? '',
    dob: api.dob ?? '',
    gender: (api.gender as Gender) || '',
    nationality: (api.nationality as Nationality) || '',
    residenceGov: resGov,
    residenceCity: resCity,
    caregiver: caregiverFromApi[api.caregiver ?? ''] ?? '',
    caregiverEducation: (api.caregiver_education as CaregiverEducation) || '',
    phoneFather: api.phones?.[0] ?? '',
    phoneMother: api.phones?.[1] ?? '',
    department: api.department ?? '',
    referralDate: '',
    referralCountry: '',
    referralOption: api.referral?.[0] ?? '',
    referringSpecialty: '',
    referralPattern: '',
    receivedInitial: '',
    initialType: '',
    noCurativeReason: '',
    palliativeType: '',
    lifeStatus: lifeStatusFromApi[api.life_status ?? ''] ?? '',
    deathDate: '',
    deathCause: '',
    deathCity: api.follow_up?.[0] ?? '',
    diagnosis: api.diagnosis ?? '',
    currentPhase: api.current_phase ?? '',
    registrationDate: api.registration_date ?? '',
  }
}

function buildPayload(draft: Draft, showFollowUp: boolean): PatientPayload {
  const fullName = `${draft.firstName} ${draft.familyName}`.trim()
  const generalTreatment = [
    label(initialTypeOptions, draft.initialType),
    label(noCurativeReasonOptions, draft.noCurativeReason),
    label(palliativeTypeOptions, draft.palliativeType),
  ].filter(Boolean)
  const followUp = showFollowUp
    ? [label(deathCauseOptions, draft.deathCause), draft.deathCity].filter(Boolean)
    : []
  return {
    file_no_basma: draft.fileNoBasma,
    file_no_biruni: draft.fileNoBiruni,
    electronic_file_date: draft.electronicFileDate || today(),
    basma_file_open_date: draft.basmaFileOpenDate || today(),
    biruni_file_open_date: draft.biruniFileOpenDate || '',
    national_id_patient: draft.nationalIdPatient,
    national_id_father: draft.nationalIdFather,
    first_name: draft.firstName,
    family_name: draft.familyName,
    full_name: fullName,
    father_name: draft.fatherName,
    mother_name: draft.motherName,
    dob: draft.dob.trim() || null,
    gender: draft.gender || null,
    nationality: draft.nationality || 'syrian',
    family_registry: [draft.residenceGov, draft.residenceCity].filter(Boolean),
    residence: [draft.residenceGov, draft.residenceCity].filter(Boolean),
    caregiver: caregiverApi[draft.caregiver || 'bothParents'],
    caregiver_education: draft.caregiverEducation || 'university',
    phones: [draft.phoneFather, draft.phoneMother].filter(Boolean),
    referral: [draft.referralOption].filter(Boolean),
    general_treatment: generalTreatment,
    follow_up: followUp,
    life_status: lifeStatusApi[draft.lifeStatus || 'alive'],
    registration_status: 'complete',
    registration_date: draft.registrationDate || today(),
    diagnosis: draft.diagnosis,
    current_phase: draft.currentPhase,
    critical_flags: [],
    consultation_needs: [],
    department: draft.department || 'clinic',
  }
}

export function RegisterPatientScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = useStore((s) => s.token)
  const patients = useStore((s) => s.patients)
  const addPatient = useStore((s) => s.addPatient)
  const updatePatient = useStore((s) => s.updatePatient)
  const pushToast = useStore((s) => s.pushToast)
  const { departmentCodeOptions, referralSelectOptions, referralOptions, masterDataLoading, masterDataError, reloadMasterData } = useMasterData()
  const returnTo = params.get('return')
  const editFileNo = params.get('edit')
  const isEdit = Boolean(editFileNo)

  const [draft, setDraft] = useState<Draft>(() => ({
    ...emptyDraft,
    fileNoBasma: isEdit ? '' : (params.get('fileNo') ?? ''),
  }))
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loadingPatient, setLoadingPatient] = useState(isEdit)
  const [autosaved, setAutosaved] = useState(false)
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  // Keep referral select value as option id when master data arrives (supports legacy name values).
  useEffect(() => {
    if (!draft.referralOption || referralOptions.length === 0) return
    const normalized = normalizeReferralOptionValue(draft.referralOption, referralOptions)
    if (normalized !== draft.referralOption) {
      setDraft((d) => ({ ...d, referralOption: normalized }))
    }
  }, [referralOptions, draft.referralOption])

  // Default department code from API list when creating a patient.
  useEffect(() => {
    if (isEdit || draft.department || departmentCodeOptions.length === 0) return
    setDraft((d) => ({ ...d, department: departmentCodeOptions[0].value }))
  }, [isEdit, draft.department, departmentCodeOptions])

  const isDeath = draft.lifeStatus === 'deceased'
  const showFollowUp = isDeath || draft.lifeStatus === 'lostToFollowUp' || draft.lifeStatus === 'treatmentStopped'

  const steps: string[] = [ar.register.step1, ar.register.step2, ar.register.step3, ar.register.step4]
  if (showFollowUp) steps.push(ar.register.step5)
  steps.push(ar.register.review)

  useEffect(() => {
    if (!editFileNo || !token) {
      if (!editFileNo) setLoadingPatient(false)
      return
    }
    let active = true
    setLoadingPatient(true)
    fetchPatientRequest(token, editFileNo)
      .then((api) => {
        if (active) setDraft(apiToDraft(api))
      })
      .catch((err) => {
        pushToast({
          variant: 'error',
          title: ar.register.title,
          description: err instanceof ApiError ? err.message : ar.login.connection,
        })
        navigate('/patients')
      })
      .finally(() => {
        if (active) setLoadingPatient(false)
      })
    return () => {
      active = false
    }
  }, [editFileNo, token, navigate, pushToast])

  // Autosave indicator on each change (create mode only)
  useEffect(() => {
    if (isEdit) return
    if (draft.fileNoBasma || draft.firstName) {
      setAutosaved(true)
      const id = setTimeout(() => setAutosaved(false), 1800)
      return () => clearTimeout(id)
    }
  }, [draft, isEdit])

  const errors = useMemo(() => validateDraft(draft, isEdit, patients), [draft, isEdit, patients])

  const isLast = step === steps.length - 1
  const hasErrors = Object.keys(errors).length > 0
  const canSave = draft.fileNoBasma && draft.firstName && draft.familyName && !hasErrors

  const goNext = () => {
    const fields = STEP_FIELDS[step] ?? []
    if (fields.some((f) => errors[f])) {
      pushToast({ variant: 'error', title: ar.register.title, description: ar.register.fixStepErrors })
      return
    }
    setStep((s) => s + 1)
  }

  const save = async () => {
    if (!canSave || saving || !token) return
    setSaving(true)
    try {
      const payload = buildPayload(draft, showFollowUp)
      if (isEdit && editFileNo) {
        await updatePatient(editFileNo, payload)
        navigate(`/patients/${editFileNo}`)
      } else {
        const created = await createPatient(token, payload)
        const patient = apiToPatient(created)
        addPatient(patient)
        pushToast({ variant: 'success', title: ar.common.saved, description: ar.register.savedToast })
        if (returnTo === 'check-in') navigate(`/check-in?fileNo=${encodeURIComponent(patient.fileNoBasma)}`)
        else navigate(`/patients/${patient.fileNoBasma}`)
      }
    } catch (err) {
      const description = err instanceof ApiError ? err.message : ar.login.connection
      pushToast({ variant: 'error', title: ar.register.title, description })
    } finally {
      setSaving(false)
    }
  }

  if (loadingPatient) {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader title={isEdit ? 'تعديل بيانات المريض' : ar.register.title} back />
        <ListSkeleton rows={8} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={isEdit ? 'تعديل بيانات المريض' : ar.register.title}
        description={ar.register.stepOf.replace('{x}', String(step + 1)).replace('{y}', String(steps.length))}
        back
        action={!isEdit && autosaved ? <Badge variant="secondary"><CloudUpload className="h-3.5 w-3.5" />{ar.register.autosaved}</Badge> : undefined}
      />
      <Stepper steps={steps} current={step} className="mb-5" />

      <Card>
        <CardContent className="p-5 sm:p-6">
          {/* Step 1: File identifiers */}
          {step === 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={`${ar.common.fileNo} (بسمة)`} required error={errors.fileNoBasma}>
                <Input value={draft.fileNoBasma} onChange={(e) => set('fileNoBasma', e.target.value)} inputMode="numeric" placeholder="10xxx" disabled={isEdit} />
              </Field>
              <Field label="رقم ملف البيروني" hint="xxxx/yyyy">
                <Input value={draft.fileNoBiruni} onChange={(e) => set('fileNoBiruni', e.target.value)} placeholder="0231/2026" />
              </Field>
              <Field label="تاريخ إنشاء الملف الإلكتروني" error={errors.electronicFileDate}>
                <Input type="date" value={draft.electronicFileDate} onChange={(e) => set('electronicFileDate', e.target.value)} />
              </Field>
              <Field label="تاريخ فتح ملف بسمة" error={errors.basmaFileOpenDate}>
                <Input type="date" value={draft.basmaFileOpenDate} onChange={(e) => set('basmaFileOpenDate', e.target.value)} />
              </Field>
              <Field label="تاريخ فتح ملف البيروني" error={errors.biruniFileOpenDate}>
                <Input type="date" value={draft.biruniFileOpenDate} onChange={(e) => set('biruniFileOpenDate', e.target.value)} />
              </Field>
            </div>
          )}

          {/* Step 2: Demographics */}
          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="الاسم الأول" required error={errors.firstName}><Input value={draft.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
              <Field label="اسم العائلة" required error={errors.familyName}><Input value={draft.familyName} onChange={(e) => set('familyName', e.target.value)} /></Field>
              <Field label="اسم الأب" error={errors.fatherName}><Input value={draft.fatherName} onChange={(e) => set('fatherName', e.target.value)} /></Field>
              <Field label="اسم الأم" error={errors.motherName}><Input value={draft.motherName} onChange={(e) => set('motherName', e.target.value)} /></Field>
              <Field label="تاريخ الميلاد" error={errors.dob}><Input type="date" value={draft.dob} max={today()} onChange={(e) => set('dob', e.target.value)} /></Field>
              <SelectField label="الجنس" value={draft.gender} onChange={(v) => set('gender', v as Gender)} options={genderOptions} />
              <Field label="الرقم الوطني للمريض" error={errors.nationalIdPatient}><Input value={draft.nationalIdPatient} onChange={(e) => set('nationalIdPatient', e.target.value)} inputMode="numeric" /></Field>
              <Field label="الرقم الوطني للأب"><Input value={draft.nationalIdFather} onChange={(e) => set('nationalIdFather', e.target.value)} inputMode="numeric" /></Field>
              <SelectField label="الجنسية" value={draft.nationality} onChange={(v) => set('nationality', v as Nationality)} options={nationalityOptions} />
              <SelectField label={ar.common.department} value={draft.department} onChange={(v) => set('department', v)} options={departmentCodeOptions} />
              {masterDataLoading && <p className="sm:col-span-2 text-xs text-muted-foreground">جارٍ تحميل الأقسام…</p>}
              {masterDataError && departmentCodeOptions.length === 0 && (
                <div className="sm:col-span-2 flex items-center gap-2 text-xs text-destructive">
                  <span>تعذّر تحميل الأقسام.</span>
                  <button type="button" className="font-bold underline" onClick={() => void reloadMasterData()}>{ar.common.retry}</button>
                </div>
              )}
              <Field label="المحافظة (الإقامة)"><Input value={draft.residenceGov} onChange={(e) => set('residenceGov', e.target.value)} /></Field>
              <Field label="المدينة (الإقامة)"><Input value={draft.residenceCity} onChange={(e) => set('residenceCity', e.target.value)} /></Field>
              <SelectField label="مقدم الرعاية" value={draft.caregiver} onChange={(v) => set('caregiver', v as Caregiver)} options={caregiverOptions} />
              <SelectField label="المستوى التعليمي لمقدم الرعاية" value={draft.caregiverEducation} onChange={(v) => set('caregiverEducation', v as CaregiverEducation)} options={caregiverEducationOptions} />
              <Field label="هاتف الأب" error={errors.phoneFather} hint="09xxxxxxxx"><Input value={draft.phoneFather} onChange={(e) => set('phoneFather', e.target.value.replace(/\D/g, ''))} inputMode="numeric" pattern="[0-9]*" placeholder="09xxxxxxxx" /></Field>
              <Field label="هاتف الأم" error={errors.phoneMother} hint="09xxxxxxxx"><Input value={draft.phoneMother} onChange={(e) => set('phoneMother', e.target.value.replace(/\D/g, ''))} inputMode="numeric" pattern="[0-9]*" placeholder="09xxxxxxxx" /></Field>
            </div>
          )}

          {/* Step 3: Referral */}
          {step === 2 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="تاريخ الإحالة" error={errors.referralDate}><Input type="date" value={draft.referralDate} onChange={(e) => set('referralDate', e.target.value)} /></Field>
              <SelectField label="بلد الإحالة" value={draft.referralCountry} onChange={(v) => set('referralCountry', v as ReferralCountry)} options={referralCountryOptions} />
              <SelectField label="المركز المحوِّل" value={draft.referralOption} onChange={(v) => set('referralOption', v)} options={referralSelectOptions} />
              {masterDataLoading && referralSelectOptions.length === 0 && (
                <p className="sm:col-span-2 text-xs text-muted-foreground">جارٍ تحميل خيارات الإحالة…</p>
              )}
              {!masterDataLoading && referralSelectOptions.length === 0 && (
                <div className="sm:col-span-2 flex items-center gap-2 text-xs text-destructive">
                  <span>تعذّر تحميل خيارات الإحالة من الخادم.</span>
                  <button type="button" className="font-bold underline" onClick={() => void reloadMasterData()}>{ar.common.retry}</button>
                </div>
              )}
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
              <div className="sm:col-span-2">
                <Field label="التشخيص"><Input value={draft.diagnosis} onChange={(e) => set('diagnosis', e.target.value)} /></Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="المرحلة الحالية"><Input value={draft.currentPhase} onChange={(e) => set('currentPhase', e.target.value)} /></Field>
              </div>
              <p className="sm:col-span-2 text-xs text-muted-foreground">{ar.register.deathSectionNote}</p>
            </div>
          )}

          {/* Step 5: Follow-up / death (conditional) */}
          {showFollowUp && step === 4 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {isDeath ? (
                <>
                  <Field label="تاريخ الوفاة" error={errors.deathDate}><Input type="date" value={draft.deathDate} onChange={(e) => set('deathDate', e.target.value)} /></Field>
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
              {!canSave && <p className="text-xs text-destructive font-bold mt-3">{hasErrors ? ar.register.fixStepErrors : 'يجب إدخال رقم الإضبارة والاسم الأول واسم العائلة.'}</p>}
            </div>
          )}

          {/* Nav */}
          <div className="flex gap-2 mt-6 pt-4 border-t">
            {step > 0 && <Button variant="outline" onClick={() => setStep((s) => s - 1)}>{ar.common.back}</Button>}
            {!isLast ? (
              <Button className="ms-auto" onClick={goNext}>{ar.common.next}</Button>
            ) : (
              <Button className="ms-auto" disabled={!canSave || saving} onClick={save}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
