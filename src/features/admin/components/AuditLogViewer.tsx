import React, { useState } from 'react'
import { Search, Shield, Clock, Filter, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuditLog } from '../hooks/use-admin'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

const ENTITY_TYPES = ['', 'patient', 'booking', 'consultation', 'prescription', 'user', 'dispute', 'clinic']

const ROLE_COLORS: Record<UserRole | string, string> = {
  PATIENT: 'text-info bg-info/10 border-info/20',
  MEDIC: 'text-[--color-accent] bg-[--color-accent]/10 border-[--color-accent]/20',
  CLINIC_MANAGER: 'text-[--color-warning] bg-[--color-warning]/10 border-[--color-warning]/20',
  ADMIN: 'text-danger bg-danger/10 border-danger/20',
}

export function AuditLogViewer() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [entityType, setEntityType] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useAuditLog({
    search: search || undefined,
    entityType: entityType || undefined,
    page,
  })

  const entries = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  const entityLabel = entityType || 'All entities'

  return (
    <div className="px-6 py-6 space-y-5 max-w-5xl">
      <PageHeader
        title="Audit Log"
        description={`${totalElements.toLocaleString()} events recorded`}
        actions={
          <div className="flex items-center gap-1.5 text-xs text-[--color-text-tertiary]">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Always fresh — no cache
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[240px] max-w-sm">
          <div className="relative flex-1">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[--color-text-tertiary]"
              aria-hidden="true"
            />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search action, user, entity…"
              className="pl-8 h-8 text-sm"
              aria-label="Search audit log"
            />
          </div>
          <Button type="submit" size="sm" className="h-8">Search</Button>
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Filter className="h-3.5 w-3.5" aria-hidden="true" />
              {entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)}
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {ENTITY_TYPES.map((t) => (
              <DropdownMenuItem
                key={t}
                onClick={() => { setEntityType(t); setPage(0) }}
              >
                {t || 'All entities'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Log entries */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 rounded-[--radius-md] bg-[--color-surface-raised] animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-[--radius-md] border border-[--color-border] py-12 text-center">
          <Shield className="h-8 w-8 text-[--color-text-tertiary] mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-[--color-text-secondary]">No audit entries found</p>
        </div>
      ) : (
        <div className="rounded-[--radius-md] border border-[--color-border] overflow-hidden">
          <table className="w-full text-sm" aria-label="Audit log">
            <thead>
              <tr className="border-b border-[--color-border] bg-[--color-surface-raised]">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide w-[180px]">
                  Timestamp
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide">
                  User
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide">
                  Action
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide hidden md:table-cell">
                  Entity
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide hidden lg:table-cell">
                  IP
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const ts = new Date(entry.timestamp)
                return (
                  <tr
                    key={entry.id}
                    className="border-b border-[--color-border] last:border-0 hover:bg-[--color-surface-raised]/50 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <time
                        dateTime={entry.timestamp}
                        className="font-mono text-xs text-[--color-text-tertiary]"
                      >
                        {ts.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}
                        {' '}
                        {ts.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </time>
                    </td>
                    <td className="px-4 py-2.5">
                      <div>
                        <p className="text-[--color-text-primary] text-sm leading-none">
                          {entry.userEmail}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1 py-0 mt-0.5',
                            ROLE_COLORS[entry.userRole] ?? ''
                          )}
                        >
                          {entry.userRole}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <code className="text-xs bg-[--color-surface-raised] border border-[--color-border] px-1.5 py-0.5 rounded font-mono">
                        {entry.action}
                      </code>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {entry.entityType}
                        </Badge>
                        <span className="font-mono text-xs text-[--color-text-tertiary]">
                          #{entry.entityId.slice(-8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      <span className="font-mono text-xs text-[--color-text-tertiary]">
                        {entry.ipAddress ?? '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
  )
}
