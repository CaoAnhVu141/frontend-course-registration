import { tokenStorage } from '../../../shared/services/tokenStorage'
import './DashboardPage.css'

export function DashboardPage() {
  function handleLogout() {
    tokenStorage.clear()
    window.location.href = '/'
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <div className="dashboard-icon">✓</div>
        <h1>Đăng nhập thành công</h1>
        <p>Bạn đã đăng nhập vào hệ thống Course Registration.</p>

        <button type="button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </section>
    </main>
  )
}