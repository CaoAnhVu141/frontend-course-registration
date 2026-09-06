import { LoginPage } from './modules/auth'
import { DashboardPage } from './modules/dashboard'
import { DepartmentsPage } from './modules/departments'
import { tokenStorage } from './shared/services/tokenStorage'

function App() {
  const path = window.location.pathname
  const isAuthenticated = Boolean(tokenStorage.getAccessToken())

  if (path === '/dashboard' || path === '/departments') {
    if (!isAuthenticated) {
      window.location.href = '/'
      return null
    }

    return path === '/departments' ? <DepartmentsPage /> : <DashboardPage />
  }

  if (isAuthenticated) {
    window.location.href = '/dashboard'
    return null
  }

  return <LoginPage />
}

export default App
