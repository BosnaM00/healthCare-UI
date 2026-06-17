import React, { useState } from 'react'
import {
  User, Bell, Shield, Globe, Palette, Lock, Download, Trash2,
  CheckCircle2, AlertTriangle,
  Sun, Moon, Monitor, Contrast,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'
import type { GdprConsent } from '@/types'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useThemeStore, type Theme } from '@/stores/theme.store'

const THEME_OPTIONS: { value: Theme; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', desc: 'Bright, high-clarity interface', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', desc: 'Dimmed palette to reduce eye strain', icon: <Moon className="h-4 w-4" /> },
  { value: 'high-contrast', label: 'High contrast', desc: 'Maximum legibility for accessibility', icon: <Contrast className="h-4 w-4" /> },
  { value: 'system', label: 'System default', desc: 'Match your device appearance', icon: <Monitor className="h-4 w-4" /> },
]

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useGdprConsents() {
  return useQuery({
    queryKey: ['gdpr-consents'],
    queryFn: () => api.get<GdprConsent[]>('/settings/gdpr/consents'),
  })
}

function useUpdateConsent() {
  return useMutation({
    mutationFn: ({ purpose, granted }: { purpose: string; granted: boolean }) =>
      api.put('/settings/gdpr/consents', { purpose, granted }),
  })
}

function useRequestDataExport() {
  return useMutation({
    mutationFn: () => api.post('/settings/gdpr/export', {}),
  })
}

function useRequestAccountDeletion() {
  return useMutation({
    mutationFn: (reason: string) => api.post('/settings/gdpr/delete-account', { reason }),
  })
}

// ─── Section nav ─────────────────────────────────────────────────────────────

type Section = 'profile' | 'notifications' | 'privacy' | 'language' | 'appearance' | 'security'

const SECTIONS: Array<{ id: Section; label: string; icon: React.ReactNode; desc: string }> = [
  { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" />, desc: 'Personal information and photo' },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" />, desc: 'Email, SMS, and in-app alerts' },
  { id: 'privacy', label: 'Privacy & GDPR', icon: <Shield className="h-4 w-4" />, desc: 'Consents, data export, account deletion' },
  { id: 'language', label: 'Language', icon: <Globe className="h-4 w-4" />, desc: 'Interface language and region' },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="h-4 w-4" />, desc: 'Theme and display preferences' },
  { id: 'security', label: 'Security', icon: <Lock className="h-4 w-4" />, desc: 'Password, 2FA, active sessions' },
]

// ─── Subcomponents ────────────────────────────────────────────────────────────

function NotificationsSection() {
  const [prefs, setPrefs] = useState<Record<string, Record<string, boolean>>>({
    booking_confirmation: { email: true, sms: false, in_app: true },
    booking_reminder: { email: true, sms: true, in_app: true },
    payment: { email: true, sms: false, in_app: true },
    dispute: { email: true, sms: false, in_app: true },
    prescription: { email: false, sms: false, in_app: true },
  })

  const EVENTS = [
    { key: 'booking_confirmation', label: 'Booking confirmation' },
    { key: 'booking_reminder', label: 'Appointment reminder (24h before)' },
    { key: 'payment', label: 'Payment status changes' },
    { key: 'dispute', label: 'Dispute updates' },
    { key: 'prescription', label: 'New prescription' },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-[--radius-md] border border-[--color-border] overflow-hidden">
        <table className="w-full text-sm" aria-label="Notification preferences">
          <thead>
            <tr className="bg-[--color-surface-raised] border-b border-[--color-border]">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide">Event</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide">Email</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide">SMS</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide">In-app</th>
            </tr>
          </thead>
          <tbody>
            {EVENTS.map((event) => (
              <tr key={event.key} className="border-b border-[--color-border] last:border-0">
                <td className="px-4 py-3 text-[--color-text-primary]">{event.label}</td>
                {(['email', 'sms', 'in_app'] as const).map((channel) => (
                  <td key={channel} className="px-4 py-3 text-center">
                    <Switch
                      checked={prefs[event.key]?.[channel] ?? false}
                      onCheckedChange={(v: boolean) =>
                        setPrefs((p) => ({
                          ...p,
                          [event.key]: { ...p[event.key], [channel]: v },
                        }))
                      }
                      aria-label={`${event.label} ${channel} notifications`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button size="sm">Save preferences</Button>
    </div>
  )
}

function PrivacyGdprSection() {
  const { data: consents = [], isLoading } = useGdprConsents()
  const { mutate: updateConsent } = useUpdateConsent()
  const { mutateAsync: requestExport, isPending: isExporting, isSuccess: exportSuccess } = useRequestDataExport()
  const { mutateAsync: requestDeletion, isPending: isDeleting } = useRequestAccountDeletion()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return
    await requestDeletion(deleteReason)
    setDeleteSuccess(true)
  }

  return (
    <div className="space-y-6">
      {/* Consent manager */}
      <div>
        <h3 className="text-sm font-semibold text-[--color-text-primary] mb-1">Consent Preferences</h3>
        <p className="text-xs text-[--color-text-secondary] mb-4">
          Under GDPR Article 9, you have the right to manage how your health data is used.
        </p>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 rounded-[--radius-md] bg-[--color-surface-raised] animate-pulse" />
            ))}
          </div>
        ) : consents.length === 0 ? (
          // Default consent items when backend isn't connected
          <div className="space-y-2">
            {[
              { purpose: 'analytics', label: 'Usage analytics', description: 'Help us improve MediConnect by sharing anonymised usage data.', granted: false },
              { purpose: 'marketing', label: 'Marketing communications', description: 'Receive information about new features and health tips.', granted: false },
              { purpose: 'third_party_research', label: 'Third-party medical research', description: 'Share de-identified health data for medical research purposes.', granted: false },
            ].map((item) => (
              <div key={item.purpose} className="flex items-start justify-between gap-4 rounded-[--radius-md] border border-[--color-border] p-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[--color-text-primary]">{item.label}</p>
                  <p className="text-xs text-[--color-text-secondary] mt-0.5">{item.description}</p>
                </div>
                <Switch
                  checked={item.granted}
                  onCheckedChange={(v: boolean) => updateConsent({ purpose: item.purpose, granted: v })}
                  aria-label={`${item.label} consent`}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {consents.map((consent) => (
              <div
                key={consent.purpose}
                className="flex items-start justify-between gap-4 rounded-[--radius-md] border border-[--color-border] p-4"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-[--color-text-primary]">{consent.label}</p>
                  <p className="text-xs text-[--color-text-secondary] mt-0.5">{consent.description}</p>
                  {consent.grantedAt && (
                    <p className="text-xs text-[--color-text-tertiary] mt-1">
                      Granted {new Date(consent.grantedAt).toLocaleDateString('ro-RO')}
                    </p>
                  )}
                </div>
                <Switch
                  checked={consent.granted}
                  onCheckedChange={(v: boolean) => updateConsent({ purpose: consent.purpose, granted: v })}
                  aria-label={`${consent.label} consent`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Data export */}
      <div>
        <h3 className="text-sm font-semibold text-[--color-text-primary] mb-1">Export Your Data</h3>
        <p className="text-xs text-[--color-text-secondary] mb-4">
          Under GDPR Article 20, you have the right to receive a copy of your personal data
          in a machine-readable format (PDF + JSON).
        </p>

        {exportSuccess ? (
          <div className="flex items-center gap-2 text-sm text-[--color-success]" role="status">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Export requested. You'll receive an email within 24 hours.
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => requestExport()}
            disabled={isExporting}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {isExporting ? 'Requesting export…' : 'Request data export'}
          </Button>
        )}
      </div>

      <Separator />

      {/* Account deletion */}
      <div>
        <h3 className="text-sm font-semibold text-danger mb-1">Delete Account</h3>
        <p className="text-xs text-[--color-text-secondary] mb-4">
          Under GDPR Article 17, you have the right to erasure. This will permanently delete your
          account and all associated personal data. This action cannot be undone.
        </p>
        <Button
          variant="destructive"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete my account
        </Button>
      </div>

      {/* Delete account dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-danger">Delete your account</DialogTitle>
            <DialogDescription>
              This is permanent and irreversible. All your personal data, bookings,
              consultation records, and medical history will be erased within 30 days
              as required by GDPR Article 17.
            </DialogDescription>
          </DialogHeader>

          {deleteSuccess ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center" role="status">
              <CheckCircle2 className="h-10 w-10 text-[--color-success]" aria-hidden="true" />
              <p className="font-medium">Deletion request submitted</p>
              <p className="text-sm text-[--color-text-secondary]">
                You will receive a confirmation email. Your account will be deleted within 30 days.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-[--radius-md] bg-danger/5 border border-danger/20 p-3">
                <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-[--color-text-primary]">
                  Your medical records and consultation history will be permanently deleted.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[--color-text-primary]" htmlFor="delete-reason">
                  Reason for deletion (optional)
                </label>
                <Textarea
                  id="delete-reason"
                  value={deleteReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDeleteReason(e.target.value)}
                  placeholder="Tell us why you're leaving…"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-danger" htmlFor="delete-confirm">
                  Type <code className="bg-danger/10 px-1 rounded text-xs">DELETE</code> to confirm
                </label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="border-danger/30 focus:border-danger"
                  aria-describedby="delete-confirm-hint"
                />
                <p id="delete-confirm-hint" className="text-xs text-[--color-text-tertiary]">
                  Exactly match the word DELETE (all caps)
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Keep my account
                </Button>
                <Button
                  variant="destructive"
                  disabled={deleteConfirm !== 'DELETE' || isDeleting}
                  onClick={handleDeleteAccount}
                >
                  {isDeleting ? 'Processing…' : 'Permanently delete'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SecuritySection() {
  const SESSIONS = [
    { id: '1', device: 'Chrome on macOS', location: 'Bucharest, RO', lastSeen: 'Now', current: true },
    { id: '2', device: 'Safari on iPhone', location: 'Cluj-Napoca, RO', lastSeen: '2 hours ago', current: false },
  ]

  return (
    <div className="space-y-6">
      {/* Change password */}
      <div>
        <h3 className="text-sm font-semibold text-[--color-text-primary] mb-4">Change Password</h3>
        <form className="space-y-3 max-w-sm" onSubmit={(e) => e.preventDefault()}>
          <Input type="password" placeholder="Current password" autoComplete="current-password" />
          <Input type="password" placeholder="New password" autoComplete="new-password" />
          <Input type="password" placeholder="Confirm new password" autoComplete="new-password" />
          <Button size="sm">Update password</Button>
        </form>
      </div>

      <Separator />

      {/* 2FA */}
      <div>
        <h3 className="text-sm font-semibold text-[--color-text-primary] mb-1">Two-Factor Authentication</h3>
        <p className="text-xs text-[--color-text-secondary] mb-4">
          Add an extra layer of security to your account with an authenticator app.
        </p>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[--color-text-tertiary]">Not enabled</Badge>
          <Button variant="outline" size="sm">Enable 2FA</Button>
        </div>
      </div>

      <Separator />

      {/* Active sessions */}
      <div>
        <h3 className="text-sm font-semibold text-[--color-text-primary] mb-4">Active Sessions</h3>
        <div className="space-y-2">
          {SESSIONS.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between gap-3 rounded-[--radius-md] border border-[--color-border] p-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-[--color-text-primary]">{session.device}</p>
                  {session.current && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">Current</Badge>
                  )}
                </div>
                <p className="text-xs text-[--color-text-tertiary] mt-0.5">
                  {session.location} · {session.lastSeen}
                </p>
              </div>
              {!session.current && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-danger hover:text-danger">
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main SettingsPage ────────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('profile')
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  const active = SECTIONS.find((s) => s.id === activeSection)

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* Section nav — horizontal scroll strip on mobile, vertical sidebar on desktop */}
      <nav
        className="shrink-0 border-b border-[--color-border] p-2 lg:w-56 lg:border-b-0 lg:border-r"
        aria-label="Settings navigation"
      >
        <ul className="flex gap-0.5 overflow-x-auto lg:flex-col lg:overflow-visible">
          {SECTIONS.map((s) => (
            <li key={s.id} className="shrink-0 lg:shrink">
              <button
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  'flex items-center gap-2.5 whitespace-nowrap rounded-[--radius-md] px-3 py-2 text-left text-sm transition-colors lg:w-full',
                  activeSection === s.id
                    ? 'bg-[--color-accent]/10 text-[--color-accent] font-medium'
                    : 'text-[--color-text-secondary] hover:bg-[--color-surface-raised] hover:text-[--color-text-primary]'
                )}
                aria-current={activeSection === s.id ? 'page' : undefined}
              >
                {s.icon}
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Right content */}
      <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8 max-w-2xl">
        <h1 className="text-xl font-semibold text-[--color-text-primary] mb-1">{active?.label}</h1>
        <p className="text-sm text-[--color-text-secondary] mb-6">{active?.desc}</p>

        {activeSection === 'notifications' && <NotificationsSection />}
        {activeSection === 'privacy' && <PrivacyGdprSection />}
        {activeSection === 'security' && <SecuritySection />}
        {activeSection === 'profile' && (
          <div className="space-y-4 max-w-sm">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[--color-text-primary]">First name</label>
              <Input placeholder="First name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[--color-text-primary]">Last name</label>
              <Input placeholder="Last name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[--color-text-primary]">Phone</label>
              <Input placeholder="+40 7xx xxx xxx" type="tel" />
            </div>
            <Button size="sm">Save changes</Button>
          </div>
        )}
        {activeSection === 'language' && (
          <div className="space-y-3">
            {[
              { code: 'ro', label: 'Română', current: true },
              { code: 'en', label: 'English', current: false },
            ].map((lang) => (
              <button
                key={lang.code}
                className={cn(
                  'w-full text-left flex items-center justify-between px-4 py-3 rounded-[--radius-md] border transition-colors',
                  lang.current
                    ? 'border-[--color-accent] bg-[--color-accent]/5'
                    : 'border-[--color-border] hover:border-[--color-accent]/40'
                )}
                aria-pressed={lang.current}
              >
                <span className="text-sm text-[--color-text-primary]">{lang.label}</span>
                {lang.current && (
                  <CheckCircle2 className="h-4 w-4 text-[--color-accent]" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        )}
        {activeSection === 'appearance' && (
          <div className="space-y-3">
            {THEME_OPTIONS.map((opt) => {
              const selected = theme === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'w-full text-left flex items-center gap-3 px-4 py-3 rounded-[--radius-md] border transition-colors',
                    selected
                      ? 'border-[--color-accent] bg-[--color-accent]/5'
                      : 'border-[--color-border] hover:border-[--color-accent]/40'
                  )}
                  aria-pressed={selected}
                >
                  <span className={cn('shrink-0', selected ? 'text-[--color-accent]' : 'text-[--color-text-secondary]')}>
                    {opt.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-[--color-text-primary]">{opt.label}</span>
                    <span className="block text-xs text-[--color-text-secondary]">{opt.desc}</span>
                  </span>
                  {selected && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[--color-accent]" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
