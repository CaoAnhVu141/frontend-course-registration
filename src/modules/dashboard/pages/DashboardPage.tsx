import { useEffect, useState } from 'react'
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys'
import { DashboardLayout } from '../components/DashboardLayout'

export function DashboardPage() {
  const [isLoginMessageVisible, setIsLoginMessageVisible] = useState(false)

  useEffect(() => {
    const shouldShowMessage =
      sessionStorage.getItem(STORAGE_KEYS.loginSuccessMessage) === 'true'

    if (!shouldShowMessage) return

    sessionStorage.removeItem(STORAGE_KEYS.loginSuccessMessage)
    setIsLoginMessageVisible(true)
  }, [])

  useEffect(() => {
    if (!isLoginMessageVisible) return

    const timeoutId = window.setTimeout(() => {
      setIsLoginMessageVisible(false)
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [isLoginMessageVisible])

  return (
    <DashboardLayout title="DASHBOARD">
      {isLoginMessageVisible && (
        <div className="success-modal-backdrop">
          <section className="success-panel" role="status">
            <div className="success-icon">✓</div>
            <div>
              <h1>Đăng nhập thành công</h1>
              <p>Bạn đã đăng nhập vào hệ thống Course Registration.</p>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}
