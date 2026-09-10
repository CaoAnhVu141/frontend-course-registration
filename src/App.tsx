import { LoginPage } from './modules/auth'
import { DashboardPage } from './modules/dashboard'
import { DepartmentsPage } from './modules/departments'
import { tokenStorage } from './shared/services/tokenStorage'
import { LecturersPage } from './modules/lecturers'
import { StudentsPage } from './modules/students'
import { ExpertiseTagsPage } from './modules/expertisetags'

function App() {
  const path = window.location.pathname
  const isAuthenticated = Boolean(tokenStorage.getAccessToken())

  if (path === '/dashboard' || path === '/departments' || path === '/lecturers' || path === '/students' || path === "/expertisetags" ) {
    if (!isAuthenticated) {
      window.location.href = '/'
      return null
    }

    if (path === '/departments') return <DepartmentsPage />
    if (path === '/lecturers') return <LecturersPage />
    if (path === '/students') return <StudentsPage />
    if (path === '/expertisetags') return <ExpertiseTagsPage />
    return <DashboardPage />
  }

  if (isAuthenticated) {
    window.location.href = '/dashboard'
    return null
  }

  return <LoginPage />
}

export default App
