import { useEffect, useState } from 'react'
import { Bell, Flag, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys'
import { logout } from '../../auth/services/authApi'
import { getUnreadCount } from '../../notifications'

export function TopNavbar() {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let active = true

    getUnreadCount()
      .then((count) => {
        if (active) setUnreadCount(count)
      })
      .catch(() => {
        // Không chặn UI nếu lấy số thông báo lỗi.
      })

    return () => {
      active = false
    }
  }, [])

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
        <button
          type="button"
          className="bell-icon"
          onClick={() => navigate('/notifications')}
          aria-label="Thông báo"
          title="Thông báo"
        >
          <Bell aria-hidden="true" size={18} strokeWidth={1.9} />
          {unreadCount > 0 && (
            <span className="bell-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
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
