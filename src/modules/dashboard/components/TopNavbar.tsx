import { tokenStorage } from '../../../shared/services/tokenStorage'

export function TopNavbar() {
  function handleLogout() {
    tokenStorage.clear()
    window.location.href = '/'
  }

  return (
    <header className="top-navbar">
      <h2>TRƯỜNG ĐẠI HỌC CÔNG NGHỆ KỸ THUẬT TP.HCM</h2>

      <div className="top-actions">
        <span className="flag-icon">⚑</span>
        <span className="bell-icon">●</span>
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
          ↪
        </button>
      </div>
    </header>
  )
}