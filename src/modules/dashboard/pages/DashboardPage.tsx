import { tokenStorage } from '../../../shared/services/tokenStorage'
import { getRoleLabel } from '../../../shared/utils/roleLabel'
import './DashboardPage.css'

const navItems = [
  { label: 'Chương trình đào tạo', icon: '▤', href: '/dashboard' },
  { label: 'Quản lý khoa/phòng ban', icon: '▦', href: '/departments', roles: ['ADMIN' as const] },
  { label: 'Quản lý chuyên môn', icon: '▣', href: '#!', roles: ['ADMIN' as const] },
  { label: 'Quản lý giảng viên', icon: '▥', href: '/lecturers', roles: ['ADMIN' as const] },
  { label: 'Quản lý kỳ đăng ký', icon: '◴', href: '#!', roles: ['ADMIN' as const] },
  { label: 'Quản lý nhóm sinh viên', icon: '★', href: '#!' },
  { label: 'Quản lý sinh viên', icon: '●', href: '#!', roles: ['ADMIN' as const] },
  { label: 'Quản lý đề tài', icon: '▧', href: '#!' },
  { label: 'Quản lý đăng ký đề tài', icon: '▨', href: '#!' },
]

export function DashboardPage() {
  const user = tokenStorage.getUser()

  if (!user) {
    window.location.href = '/'
    return null
  }

  const displayEmail = user.email ?? 'Chưa có email'
  const roleLabel = getRoleLabel(user.roles)
  const currentPath = window.location.pathname
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.some((role) => user.roles.includes(role)),
  )

  function handleLogout() {
    tokenStorage.clear()
    window.location.href = '/'
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="logo-section">
          <img
            src="https://tracuuxettuyen.hcmute.edu.vn/assets/img/logo/ute_logo.png"
            alt="HCM-UTE"
          />
          <h3>HCM-UTE</h3>
        </div>

        <div className="user-info">
          <img
            src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png"
            alt="Avatar"
            className="avatar"
          />
          <h4>{displayEmail}</h4>
          <p>{roleLabel}</p>
        </div>

        <ul className="nav-menu">
          {visibleNavItems.map((item) => (
            <li key={item.label}>
              <a className={item.href === currentPath ? 'active' : ''} href={item.href}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <main className="main-content">
        <header className="top-navbar">
          <h2>TRƯỜNG ĐẠI HỌC CÔNG NGHỆ KỸ THUẬT TP.HCM</h2>
          <div className="top-actions">
            <span className="flag-icon">⚑</span>
            <span className="bell-icon">●</span>
            <img
              src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png"
              alt="User"
            />
            <button type="button" onClick={handleLogout} aria-label="Đăng xuất">
              ↪
            </button>
          </div>
        </header>

        <div className="content-body">
          <div className="page-title">DASHBOARD</div>

          <section className="success-panel">
            <div className="success-icon">✓</div>
            <div>
              <h1>Đăng nhập thành công</h1>
              <p>Bạn đã đăng nhập vào hệ thống Course Registration.</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
