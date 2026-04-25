import React, { useState } from 'react'
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
  ShieldCheck,
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
  { label: 'Dashboard',    to: '/dashboard',          icon: <LayoutDashboard className="h-5 w-5" />, roles: ['PATIENT', 'MEDIC', 'CLINIC_MANAGER', 'ADMIN'] },
  { label: 'My Bookings',  to: '/bookings',           icon: <Calendar className="h-5 w-5" />,       roles: ['PATIENT'] },
  { label: 'Find a Medic', to: '/medics',             icon: <Search className="h-5 w-5" />,         roles: ['PATIENT'] },
  { label: 'My Schedule',  to: '/schedule',           icon: <Calendar className="h-5 w-5" />,       roles: ['MEDIC'] },
  { label: 'Patients',     to: '/patients',           icon: <Users className="h-5 w-5" />,          roles: ['MEDIC', 'CLINIC_MANAGER'] },
  { label: 'Medics',       to: '/admin/medics',       icon: <Stethoscope className="h-5 w-5" />,    roles: ['CLINIC_MANAGER', 'ADMIN'] },
  { label: 'Prescriptions',to: '/prescriptions',      icon: <FileText className="h-5 w-5" />,       roles: ['MEDIC', 'PATIENT'] },
  { label: 'Reports',      to: '/reports',            icon: <BarChart2 className="h-5 w-5" />,      roles: ['CLINIC_MANAGER', 'ADMIN'] },
  { label: 'Admin',        to: '/admin',              icon: <ShieldCheck className="h-5 w-5" />,    roles: ['ADMIN'] },
  { label: 'Settings',     to: '/settings',           icon: <Settings className="h-5 w-5" />,       roles: ['PATIENT', 'MEDIC', 'CLINIC_MANAGER', 'ADMIN'] },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
  className?: string
}

export function Sidebar({ open, onClose, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const user = useAuthStore((s) => s.user)
  const role = user?.role ?? 'PATIENT'

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

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
          collapsed ? 'w-[--sidebar-width-collapsed]' : 'w-[--sidebar-width]',
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
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden lg:flex border-t border-[--color-border] p-2 justify-end">
          <button
            className="rounded-[--radius-md] p-1.5 text-[--color-text-secondary] hover:bg-[--color-surface-raised] hover:text-[--color-text-primary] transition-colors"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  )
}
