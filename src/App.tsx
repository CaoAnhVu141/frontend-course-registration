import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './modules/auth'
import type { UserRole } from './modules/auth'
import { DashboardPage } from './modules/dashboard'
import { DepartmentsPage } from './modules/departments'
import { tokenStorage } from './shared/services/tokenStorage'
import { hasRole } from './shared/utils/roleLabel'
import { LecturersPage } from './modules/lecturers'
import { StudentsPage } from './modules/students'
import { ExpertiseTagsPage } from './modules/expertisetags'
import { TopicsPage } from './modules/topics'
import { StudentGroupsPage } from './modules/studentgroups'
import { RegistrationPeriodsPage } from './modules/registrationperiods'
import { TopicRegistrationsPage } from './modules/topicregistrations'
import { SubmissionsPage } from './modules/submissions'
import { DefenseCommitteesPage } from './modules/defensecommittees'
import { CommitteeTopicAssignmentsPage } from './modules/committeetopicassignments'
import { StatisticsPage } from './modules/statistics'
import { EvaluationsPage } from './modules/evaluations'
import { NotificationsPage } from './modules/notifications'

type ProtectedRouteProps = {
  children: ReactElement
  roles?: UserRole[]
}

function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const isAuthenticated = Boolean(tokenStorage.getAccessToken())

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const user = tokenStorage.getUser()
  const isAllowed =
    !roles || roles.some((role) => hasRole(user?.roles, role))

  if (!isAllowed) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function LoginRoute() {
  const isAuthenticated = Boolean(tokenStorage.getAccessToken())

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginRoute />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/departments"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <DepartmentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/expertisetags"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <ExpertiseTagsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lecturers"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <LecturersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/registration-periods"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <RegistrationPeriodsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/students"
        element={
          <ProtectedRoute roles={['ADMIN', 'LECTURER']}>
            <StudentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/topics"
        element={
          <ProtectedRoute roles={['ADMIN', 'LECTURER']}>
            <TopicsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student-groups"
        element={
          <ProtectedRoute roles={['ADMIN', 'LECTURER', 'STUDENT']}>
            <StudentGroupsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/topic-registrations"
        element={
          <ProtectedRoute roles={['ADMIN', 'LECTURER', 'STUDENT']}>
            <TopicRegistrationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/submissions"
        element={
          <ProtectedRoute roles={['ADMIN', 'LECTURER', 'STUDENT']}>
            <SubmissionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/defense-committees"
        element={
          <ProtectedRoute roles={['ADMIN', 'LECTURER']}>
            <DefenseCommitteesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/committee-topic-assignments"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <CommitteeTopicAssignmentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/statistics"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <StatisticsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/evaluations"
        element={
          <ProtectedRoute roles={['ADMIN', 'LECTURER', 'STUDENT']}>
            <EvaluationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute roles={['ADMIN', 'LECTURER', 'STUDENT']}>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
