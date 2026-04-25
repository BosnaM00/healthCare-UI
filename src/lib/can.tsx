import React, { createContext, useContext, useMemo } from 'react'
import { createContextualCan } from '@casl/react'
import { defineAbilityFor, type AppAbility, type Actions, type Subjects } from './ability'
import { useAuthStore } from '@/stores/auth.store'

const AbilityContext = createContext<AppAbility>(defineAbilityFor('PATIENT'))

export const Can = createContextualCan(AbilityContext.Consumer)

export function AbilityProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const ability = useMemo(
    () => defineAbilityFor(user?.role ?? 'PATIENT'),
    [user?.role]
  )
  return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>
}

export function useAbility() {
  return useContext(AbilityContext)
}

export function useCanI(action: Actions, subject: Subjects) {
  const ability = useAbility()
  return ability.can(action, subject)
}
