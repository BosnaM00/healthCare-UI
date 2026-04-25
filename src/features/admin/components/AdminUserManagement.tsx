import React, { useState } from 'react'
import { Search, Shield, UserCheck, UserX, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAdminUsers, useDeactivateUser, useActivateUser, useChangeUserRole } from '../hooks/use-admin'
import { cn } from '@/lib/utils'
import type { AdminUser, UserRole } from '@/types'

const ROLE_COLORS: Record<UserRole, string> = {
  PATIENT: 'text-info bg-info/10 border-info/20',
  MEDIC: 'text-[--color-accent] bg-[--color-accent]/10 border-[--color-accent]/20',
  CLINIC_MANAGER: 'text-[--color-warning] bg-[--color-warning]/10 border-[--color-warning]/20',
  ADMIN: 'text-danger bg-danger/10 border-danger/20',
}

const ROLES: UserRole[] = ['PATIENT', 'MEDIC', 'CLINIC_MANAGER', 'ADMIN']

interface ConfirmAction {
  type: 'deactivate' | 'activate' | 'role-change'
  user: AdminUser
  newRole?: UserRole
}

export function AdminUserManagement() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(0)
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useAdminUsers({
    search: search || undefined,
    role: roleFilter || undefined,
    page,
  })
  const { mutate: deactivate, isPending: isDeactivating } = useDeactivateUser()
  const { mutate: activate, isPending: isActivating } = useActivateUser()
  const { mutate: changeRole, isPending: isChangingRole } = useChangeUserRole()

  const users = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  function executeConfirm() {
    if (!confirm) return
    if (confirm.type === 'deactivate') deactivate(confirm.user.id)
    else if (confirm.type === 'activate') activate(confirm.user.id)
    else if (confirm.type === 'role-change' && confirm.newRole) {
      changeRole({ id: confirm.user.id, role: confirm.newRole })
    }
    setConfirm(null)
  }

  return (
    <div className="px-6 py-6 space-y-5 max-w-5xl">
      <PageHeader
        title="User Management"
        description={`${totalElements} users registered`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
          <div className="relative flex-1">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[--color-text-tertiary]"
              aria-hidden="true"
            />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email…"
              className="pl-8 h-8 text-sm"
              aria-label="Search users"
            />
          </div>
          <Button type="submit" size="sm" className="h-8">Search</Button>
        </form>

        <div className="flex gap-1.5 flex-wrap">
          {(['', ...ROLES] as const).map((role) => (
            <button
              key={role}
              onClick={() => { setRoleFilter(role); setPage(0) }}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                roleFilter === role
                  ? 'bg-[--color-accent] text-white border-[--color-accent]'
                  : 'text-[--color-text-secondary] border-[--color-border] hover:border-[--color-accent]/40'
              )}
              aria-pressed={roleFilter === role}
            >
              {role || 'All roles'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[--radius-md] border border-[--color-border] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="User list">
            <thead>
              <tr className="border-b border-[--color-border] bg-[--color-surface-raised]">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide">
                  User
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide">
                  Role
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide hidden md:table-cell">
                  Clinic
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide hidden lg:table-cell">
                  Last login
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-[--color-border]">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-5 rounded bg-[--color-surface-raised] animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[--color-text-tertiary] text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-[--color-border] last:border-0 hover:bg-[--color-surface-raised]/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 text-xs">
                            <AvatarFallback className="bg-[--color-accent]/10 text-[--color-accent] text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-[--color-text-primary]">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-[--color-text-tertiary]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn('text-xs', ROLE_COLORS[user.role])}
                        >
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[--color-text-secondary] hidden md:table-cell">
                        {user.clinicName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[--color-text-tertiary] text-xs hidden lg:table-cell">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString('ro-RO')
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            user.isActive
                              ? 'text-[--color-success] bg-[--color-success]/10 border-[--color-success]/20'
                              : 'text-[--color-text-tertiary] border-[--color-border]'
                          }
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                              Actions
                              <ChevronDown className="h-3 w-3" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Role change submenu items */}
                            {ROLES.filter((r) => r !== user.role).map((r) => (
                              <DropdownMenuItem
                                key={r}
                                onClick={() => setConfirm({ type: 'role-change', user, newRole: r })}
                              >
                                <Shield className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                                Change to {r.replace('_', ' ')}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            {user.isActive ? (
                              <DropdownMenuItem
                                className="text-danger focus:text-danger"
                                onClick={() => setConfirm({ type: 'deactivate', user })}
                              >
                                <UserX className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setConfirm({ type: 'activate', user })}
                              >
                                <UserCheck className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                                Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-[--color-text-secondary]">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Confirm dialog */}
      <Dialog open={!!confirm} onOpenChange={() => setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.type === 'deactivate'
                ? 'Deactivate user'
                : confirm?.type === 'activate'
                  ? 'Activate user'
                  : `Change role to ${confirm?.newRole}`}
            </DialogTitle>
            <DialogDescription>
              {confirm?.type === 'deactivate'
                ? `${confirm.user.firstName} ${confirm.user.lastName} will be unable to log in until reactivated.`
                : confirm?.type === 'activate'
                  ? `${confirm.user.firstName} ${confirm.user.lastName} will regain access to the platform.`
                  : `This will change ${confirm?.user.firstName} ${confirm?.user.lastName}'s role from ${confirm?.user.role} to ${confirm?.newRole}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              variant={confirm?.type === 'deactivate' ? 'destructive' : 'default'}
              onClick={executeConfirm}
              disabled={isDeactivating || isActivating || isChangingRole}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
