import { tokenStorage } from '../../../shared/services/tokenStorage'
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys'
import { logout } from '../../auth/services/authApi'

export function TopNavbar() {
  async function handleLogout() {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken)

    try {
      if (refreshToken) {
        const response = await logout(refreshToken)
        sessionStorage.setItem(
          STORAGE_KEYS.logoutMessage,
          response.message,
        )
      } else {
        sessionStorage.setItem(
          STORAGE_KEYS.logoutMessage,
          'Đăng xuất thành công',
        )
      }
    } finally {
      tokenStorage.clear()
      window.location.href = '/'
    }
  }

  return (
    <header className="top-navbar">
      <h2>TRƯỜNG ĐẠI HỌC CÔNG NGHỆ KỸ THUẬT TP.HCM</h2>

      <div className="top-actions">
        <span className="flag-icon">⚑</span>
        <span className="bell-icon">●</span>
        <button
          type="button"
          className="personal-info-link"
          onClick={() => {
            window.location.href = '/dashboard'
          }}
          aria-label="Trang cá nhân"
          title="Trang cá nhân"
        >
          <img
            src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png"
            alt="Trang cá nhân"
          />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Đăng xuất"
          title="Đăng xuất"
        >
          ↪
        </button>
      </div>
    </header>
  )
}
