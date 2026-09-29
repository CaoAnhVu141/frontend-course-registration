import { NavLink } from 'react-router-dom'
import type { AuthUser } from '../../auth/types/auth.type'
import hcmuteLogo from '../../../assets/hcmute-logo.png'
import { getRoleLabel, hasRole } from '../../../shared/utils/roleLabel'
import { navItems } from '../constants/navItems'

type SidebarProps = {
  user: AuthUser
}

export function Sidebar({ user }: SidebarProps) {
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
        {visibleNavItems.map((item) => {
          const Icon = item.icon

          return (
            <li key={item.label}>
              <NavLink
                className={({ isActive }) => (isActive ? 'active' : '')}
                to={item.href}
              >
                <span className="nav-icon">
                  <Icon aria-hidden="true" size={19} strokeWidth={1.9} />
                </span>
                {item.label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
