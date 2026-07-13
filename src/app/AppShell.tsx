import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  MonitorPlay,
  Bell,
  User,
  Search,
  ScanLine,
  Siren,
  Menu,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/misc'
import { Logo } from '@/components/Logo'
import { CommandSearch } from '@/components/CommandSearch'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'
import { useMasterData } from '@/lib/useMasterData'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { to: '/', label: ar.nav.dashboard, icon: LayoutDashboard },
  { to: '/patients', label: ar.nav.patients, icon: Users },
  { to: '/appointments', label: ar.nav.appointments, icon: CalendarDays },
  { to: '/waiting-screen', label: ar.nav.waitingScreen, icon: MonitorPlay },
  { to: '/notifications', label: ar.nav.notifications, icon: Bell },
  { to: '/profile', label: ar.nav.profile, icon: User },
]

// Phone bottom-tab subset (5 key destinations)
const bottomItems = navItems.filter((n) => n.to !== '/profile')

export function AppShell() {
  const navigate = useNavigate()
  useMasterData()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const staff = useStore((s) => s.staff)
  const notifications = useStore((s) => s.notifications)
  const unread = notifications.filter((n) => !n.isRead).length

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 h-14 border-b bg-card/90 backdrop-blur no-print">
        <div className="mx-auto max-w-[1400px] h-full px-3 sm:px-6 flex items-center gap-2">
          <button
            className="lg:hidden p-2 -ms-1 text-muted-foreground"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="القائمة"
          >
            <Menu className="h-5 w-5" />
          </button>

          <NavLink to="/" className="flex items-center gap-2 shrink-0" aria-label={ar.brand}>
            <Logo className="h-9" />
            <span className="text-[11px] text-muted-foreground hidden sm:block border-s ps-2 ms-1">{ar.appName}</span>
          </NavLink>

          {/* Global search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="ms-2 flex-1 max-w-md hidden md:flex items-center gap-2 rounded-lg border bg-background px-3 h-9 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Search className="h-4 w-4" />
            {ar.common.searchByFile}
          </button>

          <div className="flex items-center gap-1.5 ms-auto">
            <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setSearchOpen(true)} aria-label={ar.common.search}>
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="default" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/check-in')}>
              <ScanLine className="h-4 w-4" />
              {ar.common.checkInShort}
            </Button>
            <Button variant="warning" size="sm" onClick={() => navigate('/emergency')}>
              <Siren className="h-4 w-4" />
              <span className="hidden sm:inline">{ar.common.emergency}</span>
            </Button>
            <NavLink to="/notifications" className="relative p-2 text-muted-foreground hover:text-foreground" aria-label={ar.nav.notifications}>
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute top-1 end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </NavLink>
            <NavLink to="/profile" aria-label={ar.nav.profile}>
              <Avatar name={staff ? `${staff.firstName} ${staff.lastName}` : 'م ع'} className="h-9 w-9" />
            </NavLink>
          </div>
        </div>
      </header>

      <div className="flex-1 mx-auto max-w-[1400px] w-full flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 border-e p-3 gap-1 sticky top-14 h-[calc(100vh-3.5rem)] no-print">
          {navItems.map((item) => (
            <SideLink key={item.to} item={item} />
          ))}
          <div className="mt-auto rounded-xl bg-primary-soft p-3 text-xs text-primary">
            <p className="font-bold mb-1">مكتب الاستقبال</p>
            <p className="text-primary/80">نقطة دخول واحدة لكل الأقسام.</p>
          </div>
        </aside>

        {/* Mobile slide nav */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileNavOpen(false)}>
            <div className="absolute inset-0 bg-foreground/40" />
            <nav className="absolute top-0 bottom-0 start-0 w-64 bg-card p-3 shadow-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
              {navItems.map((item) => (
                <SideLink key={item.to} item={item} onClick={() => setMobileNavOpen(false)} />
              ))}
            </nav>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-5 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom tab bar (phone) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-16 border-t bg-card/95 backdrop-blur grid grid-cols-5 no-print">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 text-[11px] font-bold',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}

function SideLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors',
          isActive ? 'bg-primary text-primary-foreground shadow-soft' : 'text-foreground hover:bg-muted',
        )
      }
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </NavLink>
  )
}
