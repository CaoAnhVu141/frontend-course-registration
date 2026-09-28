import { Bell, Flag, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys'
import { logout } from '../../auth/services/authApi'

export function TopNavbar() {
  const navigate = useNavigate()

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
      navigate('/', { replace: true })
    }
  }

  return (
    <header className="top-navbar">
      <h2>TRƯỜNG ĐẠI HỌC CÔNG NGHỆ KỸ THUẬT TP.HCM</h2>

      <div className="top-actions">
        <button
          type="button"
          className="personal-info-link"
          onClick={() => navigate('/dashboard')}
          aria-label="Thông tin cá nhân"
          title="Thông tin cá nhân"
        />
        <span className="flag-icon">
          <Flag aria-hidden="true" size={18} strokeWidth={1.9} />
        </span>
        <span className="bell-icon">
          <Bell aria-hidden="true" size={18} strokeWidth={1.9} />
        </span>
        <img
          src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png"
          alt="User"
        />
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Đăng xuất"
          title="Đăng xuất"
        >
          <LogOut aria-hidden="true" size={18} strokeWidth={1.9} />
        </button>
      </div>
    </header>
  )
}
