import type { ReactNode } from 'react'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { Sidebar } from './Sidebar'
import { TopNavbar } from './TopNavbar'
import '../pages/DashboardPage.css'

type DashboardLayoutProps = {
  title: string
  children: ReactNode
  contentClassName?: string
}

export function DashboardLayout({
  title,
  children,
  contentClassName = '',
}: DashboardLayoutProps) {
  const user = tokenStorage.getUser()

  if (!user) {
    window.location.href = '/'
    return null
  }

  return (
    <div className="dashboard-shell">
      <Sidebar user={user} />

      <main className="main-content">
        <TopNavbar />

        <div className={`content-body ${contentClassName}`.trim()}>
          <div className="page-title">{title}</div>
          {children}
        </div>
      </main>
    </div>
  )
}
