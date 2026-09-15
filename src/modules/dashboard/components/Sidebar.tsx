import type { AuthUser } from '../../auth/types/auth.type'
import hcmuteLogo from '../../../assets/hcmute-logo.png'
import { getRoleLabel, hasRole } from '../../../shared/utils/roleLabel'
import { navItems } from '../constants/navItems'

type SidebarProps = {
  user: AuthUser
}

export function Sidebar({ user }: SidebarProps) {
  const currentPath = window.location.pathname

  const visibleNavItems = navItems.filter(
    (item) =>
      !item.roles ||
      item.roles.some((role) => hasRole(user.roles, role)),
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
              <span className="nav-icon">
                {item.href === '/dashboard' ? <UserNavIcon /> : item.icon}
              </span>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}

function UserNavIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c1.25-4.2 4-6.3 7.5-6.3s6.25 2.1 7.5 6.3" />
    </svg>
  )
}
