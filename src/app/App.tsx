import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './AppShell'
import { Toaster } from '@/components/ui/toast'
import { useStore } from '@/store/useStore'
import { LoginScreen } from '@/screens/LoginScreen'
import { DashboardScreen } from '@/screens/DashboardScreen'
import { CheckInScreen } from '@/screens/CheckInScreen'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { EmergencyScreen } from '@/screens/EmergencyScreen'
import { PatientsScreen } from '@/screens/PatientsScreen'
import { PatientRecordScreen } from '@/screens/PatientRecordScreen'
import { RegisterPatientScreen } from '@/screens/RegisterPatientScreen'
import { RegisterConsultScreen } from '@/screens/RegisterConsultScreen'
import { QueueScreen } from '@/screens/QueueScreen'
import { AppointmentsScreen } from '@/screens/AppointmentsScreen'
import { IdCardScreen } from '@/screens/IdCardScreen'
import { WaitingScreen } from '@/screens/WaitingScreen'
import { NotificationsScreen } from '@/screens/NotificationsScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'
import { ar } from '@/i18n/ar'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const staff = useStore((s) => s.staff)
  const location = useLocation()
  if (!staff) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        {/* Public waiting display — no auth, full-screen, no shell */}
        <Route path="/waiting-screen/display" element={<WaitingScreen fullscreen />} />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/" element={<DashboardScreen />} />
          <Route
            path="/check-in"
            element={
              <ErrorBoundary title={ar.checkin.title}>
                <CheckInScreen />
              </ErrorBoundary>
            }
          />
          <Route path="/emergency" element={<EmergencyScreen />} />
          <Route path="/patients" element={<PatientsScreen />} />
          <Route path="/patients/new" element={<RegisterPatientScreen />} />
          <Route path="/patients/consult" element={<RegisterConsultScreen />} />
          <Route path="/patients/:fileNo" element={<PatientRecordScreen />} />
          <Route path="/patients/:fileNo/id-card" element={<IdCardScreen />} />
          <Route path="/queue" element={<QueueScreen />} />
          <Route path="/appointments" element={<AppointmentsScreen />} />
          <Route path="/waiting-screen" element={<WaitingScreen />} />
          <Route path="/notifications" element={<NotificationsScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
