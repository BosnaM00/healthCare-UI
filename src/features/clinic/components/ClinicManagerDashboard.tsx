import React, { useState } from 'react'
import {
  Users, TrendingUp, Calendar, Mail, Trash2, RefreshCw,
  ChevronRight, UserPlus, CheckCircle2, Clock, XCircle, Send,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  useClinicMedics,
  useClinicInvites,
  useInviteMedic,
  useRevokeInvite,
  useRemoveMedicFromClinic,
  useClinicEarningsSummary,
  useClinicEarningsTransactions,
  useClinicSchedule,
} from '../hooks/use-clinic'
import { cn } from '@/lib/utils'

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type InviteFormData = z.infer<typeof inviteSchema>

const INVITE_STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'text-[--color-warning] bg-[--color-warning]/10 border-[--color-warning]/20', icon: <Clock className="h-3 w-3" /> },
  ACCEPTED: { label: 'Accepted', color: 'text-[--color-success] bg-[--color-success]/10 border-[--color-success]/20', icon: <CheckCircle2 className="h-3 w-3" /> },
  EXPIRED: { label: 'Expired', color: 'text-[--color-text-tertiary] bg-[--color-surface-raised] border-[--color-border]', icon: <XCircle className="h-3 w-3" /> },
}

function MetricCard({
  label, value, sub, icon,
}: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode
}) {
  return (
    <div className="rounded-[--radius-md] border border-[--color-border] bg-[--color-surface-raised] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[--color-text-tertiary] uppercase tracking-wide">{label}</span>
        <span className="text-[--color-text-tertiary]">{icon}</span>
      </div>
      <p className="text-2xl font-semibold text-[--color-text-primary]">{value}</p>
      {sub && <p className="text-xs text-[--color-text-tertiary] mt-1">{sub}</p>}
    </div>
  )
}

export function ClinicManagerDashboard() {
  const [period, setPeriod] = useState('current-month')
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)

  const { data: medics = [], isLoading: loadingMedics } = useClinicMedics()
  const { data: invites = [] } = useClinicInvites()
  const { data: earnings } = useClinicEarningsSummary(period)
  const { data: transactions = [] } = useClinicEarningsTransactions(period)
  const { data: schedule = [] } = useClinicSchedule()

  const { mutateAsync: inviteMedic, isPending: isInviting } = useInviteMedic()
  const { mutate: revokeInvite } = useRevokeInvite()
  const { mutate: removeMedic, isPending: isRemoving } = useRemoveMedicFromClinic()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({ resolver: zodResolver(inviteSchema) })

  async function onInviteSubmit(data: InviteFormData) {
    await inviteMedic(data)
    reset()
  }

  // Today's bookings grouped by medic
  const today = new Date()
  const todayBookings = schedule.filter((b) => {
    const d = new Date(b.slot.startTime)
    return d.toDateString() === today.toDateString()
  })

  return (
    <div className="px-6 py-6 space-y-6 max-w-5xl">
      <PageHeader
        title="Clinic Manager"
        description="Manage your clinic, medics, and earnings."
        actions={
          <div className="flex items-center gap-1.5">
            {(['current-month', 'last-month', 'this-year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                  period === p
                    ? 'bg-[--color-accent] text-white'
                    : 'text-[--color-text-secondary] hover:bg-[--color-surface-raised]'
                )}
              >
                {p === 'current-month' ? 'This month' : p === 'last-month' ? 'Last month' : 'This year'}
              </button>
            ))}
          </div>
        }
      />

      {/* Earnings metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Gross revenue"
          value={earnings ? `${earnings.totalGross.toLocaleString('ro-RO')} RON` : '—'}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          label="Net revenue"
          value={earnings ? `${earnings.totalNet.toLocaleString('ro-RO')} RON` : '—'}
          sub={earnings ? `${earnings.consultationCount} consultations` : undefined}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          label="Active medics"
          value={medics.filter((m) => m.verificationStatus === 'VERIFIED').length}
          sub={`${medics.length} total`}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          label="Today's bookings"
          value={todayBookings.length}
          icon={<Calendar className="h-4 w-4" />}
        />
      </div>

      <Tabs defaultValue="medics">
        <TabsList>
          <TabsTrigger value="medics">Medics ({medics.length})</TabsTrigger>
          <TabsTrigger value="invites">
            Invites
            {invites.filter((i) => i.status === 'PENDING').length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                {invites.filter((i) => i.status === 'PENDING').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

        {/* Medics tab */}
        <TabsContent value="medics" className="pt-4 space-y-3">
          {loadingMedics ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-[--radius-md] bg-[--color-surface-raised] animate-pulse" />
              ))}
            </div>
          ) : medics.length === 0 ? (
            <div className="text-center py-10 rounded-[--radius-md] border border-dashed border-[--color-border]">
              <Users className="h-8 w-8 text-[--color-text-tertiary] mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-[--color-text-secondary]">No medics in your clinic yet.</p>
              <p className="text-xs text-[--color-text-tertiary] mt-1">Use the Invites tab to add medics.</p>
            </div>
          ) : (
            <ul className="space-y-2" aria-label="Clinic medics">
              {medics.map((medic) => {
                const initials = `${medic.firstName[0]}${medic.lastName[0]}`.toUpperCase()
                return (
                  <li
                    key={medic.id}
                    className="flex items-center gap-3 rounded-[--radius-md] border border-[--color-border] bg-[--color-surface-raised] p-3"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-[--color-accent]/10 text-[--color-accent]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[--color-text-primary]">
                        Dr. {medic.firstName} {medic.lastName}
                      </p>
                      <p className="text-xs text-[--color-text-tertiary]">
                        {medic.specialties.map((s) => s.name).join(', ')}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        medic.verificationStatus === 'VERIFIED'
                          ? 'text-[--color-success] bg-[--color-success]/10 border-[--color-success]/20'
                          : 'text-[--color-text-tertiary]'
                      }
                    >
                      {medic.verificationStatus}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[--color-text-tertiary] hover:text-danger"
                      onClick={() => setRemoveTarget(medic.id)}
                      aria-label={`Remove Dr. ${medic.lastName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </TabsContent>

        {/* Invites tab */}
        <TabsContent value="invites" className="pt-4 space-y-4">
          {/* Invite form */}
          <form
            onSubmit={handleSubmit(onInviteSubmit)}
            className="flex gap-2 items-start"
            aria-label="Invite medic form"
          >
            <div className="flex-1 max-w-sm">
              <Input
                {...register('email')}
                type="email"
                placeholder="Medic email address"
                className="h-9"
                aria-label="Medic email"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-danger mt-1">{errors.email.message}</p>
              )}
            </div>
            <Button type="submit" size="sm" disabled={isInviting} className="gap-1.5 h-9">
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              {isInviting ? 'Sending…' : 'Send invite'}
            </Button>
          </form>

          <Separator />

          {invites.length === 0 ? (
            <p className="text-sm text-[--color-text-tertiary] text-center py-6">No invites sent yet</p>
          ) : (
            <ul className="space-y-2" aria-label="Pending invites">
              {invites.map((invite) => {
                const cfg = INVITE_STATUS_CONFIG[invite.status]
                return (
                  <li
                    key={invite.id}
                    className="flex items-center gap-3 rounded-[--radius-md] border border-[--color-border] p-3"
                  >
                    <Mail className="h-4 w-4 text-[--color-text-tertiary] shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[--color-text-primary] truncate">{invite.email}</p>
                      <p className="text-xs text-[--color-text-tertiary]">
                        Expires {new Date(invite.expiresAt).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] gap-1', cfg.color)}>
                      {cfg.icon}
                      {cfg.label}
                    </Badge>
                    {invite.status === 'PENDING' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[--color-text-tertiary] hover:text-danger"
                        onClick={() => revokeInvite(invite.id)}
                        aria-label={`Revoke invite for ${invite.email}`}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </TabsContent>

        {/* Schedule tab */}
        <TabsContent value="schedule" className="pt-4">
          <h3 className="text-sm font-semibold text-[--color-text-primary] mb-3">
            Today's appointments — {todayBookings.length} total
          </h3>
          {todayBookings.length === 0 ? (
            <p className="text-sm text-[--color-text-tertiary] text-center py-8">
              No appointments today
            </p>
          ) : (
            <div className="space-y-2">
              {todayBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 rounded-[--radius-md] border border-[--color-border] p-3 text-sm"
                >
                  <span className="font-mono text-xs text-[--color-text-secondary] w-20 shrink-0">
                    {new Date(booking.slot.startTime).toLocaleTimeString('ro-RO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-[--color-text-primary]">
                    Patient #{booking.patientId.slice(-6)}
                  </span>
                  <span className="text-xs text-[--color-text-tertiary]">·</span>
                  <span className="text-xs text-[--color-text-secondary]">
                    {booking.consultationType}
                  </span>
                  <Badge
                    variant="outline"
                    className="ml-auto text-[10px]"
                  >
                    {booking.bookingStatus}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Earnings tab */}
        <TabsContent value="earnings" className="pt-4 space-y-3">
          {transactions.length === 0 ? (
            <p className="text-sm text-[--color-text-tertiary] text-center py-8">
              No transactions for this period
            </p>
          ) : (
            <div className="rounded-[--radius-md] border border-[--color-border] overflow-hidden">
              <table className="w-full text-sm" aria-label="Earnings transactions">
                <thead>
                  <tr className="border-b border-[--color-border] bg-[--color-surface-raised]">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide">Patient</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide">Gross</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide hidden md:table-cell">Fee</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide">Net</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-[--color-border] last:border-0 hover:bg-[--color-surface-raised]/50"
                    >
                      <td className="px-4 py-2.5 text-xs text-[--color-text-tertiary]">
                        {new Date(tx.date).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="px-4 py-2.5 text-[--color-text-primary]">{tx.patientName}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs">
                        {tx.grossAmount.toLocaleString('ro-RO')} {tx.currency}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-danger hidden md:table-cell">
                        -{tx.platformFee.toLocaleString('ro-RO')}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-[--color-success]">
                        {tx.netAmount.toLocaleString('ro-RO')} {tx.currency}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            tx.status === 'RELEASED'
                              ? 'text-[--color-success] bg-[--color-success]/10 border-[--color-success]/20'
                              : tx.status === 'REFUNDED'
                                ? 'text-danger bg-danger/10 border-danger/20'
                                : ''
                          )}
                        >
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Remove medic confirm */}
      <Dialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove medic from clinic</DialogTitle>
            <DialogDescription>
              This medic will no longer appear under your clinic. Their existing bookings
              will not be affected. This action can be reversed by re-inviting them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={isRemoving}
              onClick={() => {
                if (removeTarget) {
                  removeMedic(removeTarget)
                  setRemoveTarget(null)
                }
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
