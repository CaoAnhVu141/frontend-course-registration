import { DashboardLayout } from '../components/DashboardLayout'

export function DashboardPage() {
  return (
    <DashboardLayout title="DASHBOARD">
      <section className="success-panel">
        <div className="success-icon">✓</div>
        <div>
          <h1>Đăng nhập thành công</h1>
          <p>Bạn đã đăng nhập vào hệ thống Course Registration.</p>
        </div>
      </section>
    </DashboardLayout>
  )
}