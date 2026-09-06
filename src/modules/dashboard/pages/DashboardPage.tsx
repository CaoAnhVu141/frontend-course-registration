import { tokenStorage } from '../../../shared/services/tokenStorage'
import './DashboardPage.css'

const navItems = [
  { label: 'Chương trình đào tạo', icon: '▤', active: false },
  { label: 'Quản lý khoa/phòng ban', icon: '▦', active: true },
  { label: 'Quản lý chuyên môn', icon: '▣', active: false },
  { label: 'Quản lý giảng viên', icon: '▥', active: false },
  { label: 'Quản lý kỳ đăng ký', icon: '◴', active: false },
  { label: 'Quản lý nhóm sinh viên', icon: '★', active: false },
  { label: 'Quản lý sinh viên', icon: '●', active: false },
  { label: 'Quản lý đề tài', icon: '▧', active: false },
  { label: 'Quản lý đăng ký đề tài', icon: '▨', active: false },
]

export function DashboardPage() {
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
          <h4>Đinh Minh Tâm</h4>
          <p>GIẢNG VIÊN</p>
        </div>

        <ul className="nav-menu">
          {navItems.map((item) => (
            <li key={item.label}>
              <a className={item.active ? 'active' : ''} href="#!">
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
