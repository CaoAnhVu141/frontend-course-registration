import { LoginPage } from './modules/auth'
import { DashboardPage } from './modules/dashboard'
import { DepartmentsPage } from './modules/departments'
import { tokenStorage } from './shared/services/tokenStorage'
import { LecturersPage } from './modules/lecturers'

function App() {
  const path = window.location.pathname
  const isAuthenticated = Boolean(tokenStorage.getAccessToken())

  if (path === '/dashboard' || path === '/departments' || path === '/lecturers') {
    if (!isAuthenticated) {
      window.location.href = '/'
      return null
    }

    if (path === '/departments') return <DepartmentsPage />
    if (path === '/lecturers') return <LecturersPage />
    return <DashboardPage />
  }

  if (isAuthenticated) {
    window.location.href = '/dashboard'
    return null
  }

  return <LoginPage />
}

// demo thu
export default App
