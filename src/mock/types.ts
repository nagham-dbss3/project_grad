/* §7 Data dictionary — fully typed entities for the Reception app. */

export type Department = 'clinic' | 'dayCare' | 'inpatient'

export type ConsultationType =
  | 'cardiac'
  | 'neurological'
  | 'ophthalmic'
  | 'ent'
  | 'surgery'
  | 'other'

export type LifeStatus = 'alive' | 'deceased' | 'treatmentStopped' | 'lostToFollowUp' | 'unknown'

export type Gender = 'male' | 'female'

export type Nationality = 'syrian' | 'syrianPalestinian' | 'other'

export type Caregiver =
  | 'bothParents'
  | 'fatherOnly'
  | 'motherOnly'
  | 'grandparent'
  | 'uncleAunt'
  | 'other'

export type CaregiverEducation = 'illiterate' | 'primary' | 'preparatory' | 'secondary' | 'university'

export type ReferralCountry = 'syria' | 'lebanon' | 'jordan' | 'turkey' | 'other'

export type ReferralCenter = 'publicHospital' | 'publicClinic' | 'privateHospital' | 'privateClinic' | 'self'

export type ReferringSpecialty =
  | 'general'
  | 'pediatrics'
  | 'surgery'
  | 'ophthalmology'
  | 'ent'
  | 'pediatricOncology'
  | 'adultOncology'
  | 'radiotherapy'
  | 'other'
  | 'self'

export type ReferralPattern = 'pattern1' | 'pattern2' | 'pattern3' | 'pattern4' | 'pattern5'

export type InitialTreatmentType = 'curative' | 'palliative'

export type ReceivedInitial = 'yes' | 'no' | 'unknown'

export interface GeoLocation {
  country: string
  governorate: string
  city: string
}

export interface Phones {
  father?: string
  mother?: string
  caregiver?: string
  extra?: string
}

export interface Referral {
  date?: string
  country?: ReferralCountry
  center?: ReferralCenter
  referringDoctorSpecialty?: ReferringSpecialty
  pattern?: ReferralPattern
}

export interface GeneralTreatment {
  receivedInitialAtBasma?: ReceivedInitial
  initialStartDate?: string
  initialType?: InitialTreatmentType
  noCurativeReason?: string
  palliativeType?: string
  lastVitalStatus?: LifeStatus
}

export interface FollowUp {
  lastVitalStatusDate?: string
  vitalStatusSource?: string
  deathDate?: string
  deathCause?: string
  deathPlace?: string
  deathCity?: string
  deathGovernorate?: string
  deathCountry?: string
}

export interface ReceptionStaff {
  id: string
  firstName: string
  lastName: string
  contactEmail: string
}

export interface Patient {
  fileNoBasma: string // PRIMARY — رقم الإضبارة
  fileNoBiruni: string // xxxx/yyyy
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
  gender: Gender
  nationality: Nationality
  familyRegistry: GeoLocation
  residence: GeoLocation
  caregiver: Caregiver
  caregiverEducation: CaregiverEducation
  phones: Phones
  referral: Referral
  generalTreatment: GeneralTreatment
  followUp: FollowUp
  lifeStatus: LifeStatus
  consultationNeeds: ConsultationType[]
  registrationDate: string
  /** True for patients who arrived but are not yet fully registered (scan → register branch). */
  unregistered?: boolean
  /** Clinical fields from the real API (optional — not collected in the reception form). */
  diagnosis?: string
  currentPhase?: string
  criticalFlags?: string[]
  department?: Department
}

export interface ConsultRequest {
  id: string
  patientFileNo: string
  consultationType: ConsultationType
  status: string
  notes?: string
  requestedBy: string
  createdAt: string
}

export type CheckInMethod = 'scan' | 'manual'

export interface CheckIn {
  id: string
  patientFileNo: string
  arrivalTime: string
  department: Department
  visitReason: string
  method: CheckInMethod
  isEmergency: boolean
  emergencyReason?: string
  receptionStaffId: string
}

export type TokenStatus = 'waiting' | 'called' | 'served' | 'cancelled'

export interface Token {
  id: string
  number: string // stable, shareable (e.g. C-12) — visible to guardian app
  patientFileNo: string
  department: Department
  issueTime: string
  status: TokenStatus
  isEmergency: boolean
  visibleToGuardian: boolean
  /** Set true when the patient record is incomplete (emergency quick-create). */
  pendingData?: boolean
}

export type AppointmentType = 'followUp' | 'initialExam'
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed'

export interface Appointment {
  id: string
  patientFileNo: string
  patientName?: string
  department: Department
  doctorId?: string
  doctorName?: string
  dateTime: string
  type: AppointmentType
  status: AppointmentStatus
  notes?: string
  createdByReceptionId: string
}

export type NotificationType = 'alert' | 'info' | 'reminder'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  message: string
  relatedPatientFileNo?: string
  timestamp: string
  isRead: boolean
}
