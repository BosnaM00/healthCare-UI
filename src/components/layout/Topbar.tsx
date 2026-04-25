import React from 'react'
import { Bell, Moon, Sun, Monitor, Menu } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore, type Theme } from '@/stores/theme.store'
import { cn } from '@/lib/utils'

interface TopbarProps {
  onMenuClick?: () => void
  className?: string
}

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
]

export function Topbar({ onMenuClick, className }: TopbarProps) {
  const { user, clearAuth } = useAuthStore()
  const { theme, setTheme } = useThemeStore()

  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : '?'

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-[--topbar-height] items-center justify-between gap-4 border-b border-[--color-border] bg-[--color-surface] px-4 shadow-[--shadow-elev-1]',
        className
      )}
      role="banner"
    >
      {/* Left — mobile menu trigger */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Brand logo */}
        <span className="flex items-center gap-2 font-semibold text-[--color-accent] text-lg select-none">
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14v-4H7l5-8v4h4l-5 8z" />
          </svg>
          MediConnect
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>

        {/* Theme switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Switch theme">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : theme === 'light' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Monitor className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {themeOptions.map(opt => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(theme === opt.value && 'text-[--color-accent] font-medium')}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 w-9 rounded-full p-0"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl} alt={`${user?.firstName} ${user?.lastName}`} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="font-medium text-sm">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-[--color-text-secondary] truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[--color-danger] focus:text-[--color-danger]"
              onClick={() => clearAuth()}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
