import { useEffect } from 'react'
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys'
import { useNotification } from '../../notification'
import { DashboardLayout } from '../components/DashboardLayout'

export function DashboardPage() {
  const { success } = useNotification()

  useEffect(() => {
    const loginMessage = sessionStorage.getItem(
      STORAGE_KEYS.loginSuccessMessage,
    )

    if (!loginMessage) return

    sessionStorage.removeItem(STORAGE_KEYS.loginSuccessMessage)
    success(loginMessage)
  }, [success])

  return <DashboardLayout contentClassName="personal-page" />
}
