import React from 'react'
import { NavLink } from '@/components/layout/NavLink'
import {
  LayoutDashboard,
  Calendar,
  Search,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  BarChart2,
  AlertOctagon,
  ClipboardList,
  Building2,
  CreditCard,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import type { UserRole } from '@/types'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  // Common
  { label: 'Dashboard',      to: '/dashboard',      icon: <LayoutDashboard className="h-5 w-5" />, roles: ['PATIENT', 'MEDIC', 'CLINIC_MANAGER', 'ADMIN'] },
  // Patient
  { label: 'Find a Medic',   to: '/medics',         icon: <Search className="h-5 w-5" />,          roles: ['PATIENT'] },
  { label: 'My Bookings',    to: '/bookings',       icon: <Calendar className="h-5 w-5" />,        roles: ['PATIENT'] },
  { label: 'Prescriptions',  to: '/prescriptions',  icon: <FileText className="h-5 w-5" />,        roles: ['PATIENT'] },
  // Medic
  { label: 'My Schedule',    to: '/schedule',         icon: <Calendar className="h-5 w-5" />,        roles: ['MEDIC'] },
  { label: 'Patients',       to: '/patients',         icon: <Users className="h-5 w-5" />,           roles: ['MEDIC'] },
  { label: 'Payouts',        to: '/medic/payouts',    icon: <Wallet className="h-5 w-5" />,          roles: ['MEDIC'] },
  { label: 'Stripe Setup',   to: '/medic/onboarding', icon: <CreditCard className="h-5 w-5" />,      roles: ['MEDIC'] },
  // Clinic Manager
  { label: 'Clinic',         to: '/reports',        icon: <Building2 className="h-5 w-5" />,       roles: ['CLINIC_MANAGER'] },
  { label: 'Medics',         to: '/admin/medics',   icon: <Stethoscope className="h-5 w-5" />,     roles: ['CLINIC_MANAGER'] },
  // Admin
  { label: 'Disputes',       to: '/admin',          icon: <AlertOctagon className="h-5 w-5" />,    roles: ['ADMIN'] },
  { label: 'Users',          to: '/admin/users',    icon: <Users className="h-5 w-5" />,           roles: ['ADMIN'] },
  { label: 'Audit Log',      to: '/admin/audit',    icon: <ClipboardList className="h-5 w-5" />,   roles: ['ADMIN'] },
  { label: 'Reports',        to: '/reports',        icon: <BarChart2 className="h-5 w-5" />,       roles: ['ADMIN'] },
  // Common
  { label: 'Settings',       to: '/settings',       icon: <Settings className="h-5 w-5" />,        roles: ['PATIENT', 'MEDIC', 'CLINIC_MANAGER', 'ADMIN'] },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
  className?: string
  onNavigate?: (path: string) => void
  currentPath?: string
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

export function Sidebar({ open, onClose, className, onNavigate, currentPath, collapsed = false, onCollapse }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const role = user?.role ?? 'PATIENT'

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  // Close the mobile drawer on Escape
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-[--topbar-height] z-30 flex h-[calc(100vh-var(--topbar-height))] flex-col border-r border-[--color-border] bg-[--color-surface] transition-all duration-[--duration-layout]',
          collapsed ? 'w-16' : 'w-60',
          // Mobile: translate off-screen when closed
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
        aria-label="Primary navigation"
        role="navigation"
      >
        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Main menu">
          <ul className="space-y-1" role="list">
            {visibleItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  collapsed={collapsed}
                  onClick={onClose}
                  onNavigate={onNavigate}
                  currentPath={currentPath}
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden lg:flex border-t border-[--color-border] p-2 justify-end">
          <button
            className="rounded-[--radius-md] p-1.5 text-[--color-text-secondary] hover:bg-[--color-surface-raised] hover:text-[--color-text-primary] transition-colors"
            onClick={() => onCollapse?.(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  )
}
