import type { AuthUser } from '../../auth/types/auth.type'
import hcmuteLogo from '../../../assets/hcmute-logo.png'
import { getRoleLabel } from '../../../shared/utils/roleLabel'
import { navItems } from '../constants/navItems'

type SidebarProps = {
  user: AuthUser
}

export function Sidebar({ user }: SidebarProps) {
  const currentPath = window.location.pathname

  const visibleNavItems = navItems.filter(
    (item) =>
      !item.roles ||
      item.roles.some((role) => user.roles.includes(role)),
  )

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <img
          src={hcmuteLogo}
          alt="HCM-UTE"
        />
      </div>

      <div className="user-info">
        <img
          src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png"
          alt="Avatar"
          className="avatar"
        />
        <h4>{user.email ?? 'Chưa có email'}</h4>
        <p>{getRoleLabel(user.roles)}</p>
      </div>

      <ul className="nav-menu">
        {visibleNavItems.map((item) => (
          <li key={item.label}>
            <a
              className={item.href === currentPath ? 'active' : ''}
              href={item.href}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
