import { LoginPage } from './modules/auth'
import { DashboardPage } from './modules/dashboard'
import { tokenStorage } from './shared/services/tokenStorage'

function App() {
  const path = window.location.pathname
  const isAuthenticated = Boolean(tokenStorage.getAccessToken())

  if (path === '/dashboard') {
    if (!isAuthenticated) {
      window.location.href = '/'
      return null
    }

    return <DashboardPage />
  }

  if (isAuthenticated) {
    window.location.href = '/dashboard'
    return null
  }

  return <LoginPage />
}

export default App