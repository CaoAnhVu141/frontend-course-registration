import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys'
import { useNotification } from '../../notification'

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

  return <Navigate to="/notifications" replace />
}
