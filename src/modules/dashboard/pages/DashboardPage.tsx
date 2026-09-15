import { useCallback, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { getRoleLabel, hasRole } from '../../../shared/utils/roleLabel'
import type { AuthUser } from '../../auth/types/auth.type'
import { getDepartments } from '../../departments/services/departmentApi'
import type { Department } from '../../departments/types/department.type'
import { getExpertiseTags } from '../../expertisetags/services/expertiseTagApi'
import type { ExpertiseTag } from '../../expertisetags/types/expertiseTag.type'
import { getMyLecturerProfile } from '../../lecturers/services/lecturerApi'
import type { Lecturer } from '../../lecturers/types/lecturer.type'
import { useNotification } from '../../notification'
import { getMyStudentProfile } from '../../students/services/studentApi'
import type { Student } from '../../students/types/student.type'
import { AppLoading } from '../../ui'
import { DashboardLayout } from '../components/DashboardLayout'

type DetailItem = {
  label: string
  value?: string | number | null
}

type DetailCardData = {
  title: string
  details: DetailItem[]
}

type Profile =
  | { kind: 'student'; data: Student }
  | { kind: 'lecturer'; data: Lecturer }
  | { kind: 'admin'; data: AuthUser }

function DetailCard({ title, details }: DetailCardData) {
  return (
    <section className="profile-card">
      <h2>{title}</h2>
      <dl>
        {details.map(({ label, value }) => (
          <div className="profile-row" key={label}>
            <dt>{label}</dt>
            <dd>{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function DashboardPage() {
  const { success, error: showError } = useNotification()
  const user = useMemo(() => tokenStorage.getUser(), [])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [expertiseTags, setExpertiseTags] = useState<ExpertiseTag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const isStudent = hasRole(user?.roles, 'STUDENT')
  const isLecturer = hasRole(user?.roles, 'LECTURER')

  const loadProfile = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setLoadError('')

      const [departmentData, expertiseTagData] = await Promise.all([
        getDepartments().catch(() => []),
        isLecturer ? getExpertiseTags().catch(() => []) : Promise.resolve([]),
      ])

      setDepartments(departmentData)
      setExpertiseTags(expertiseTagData)

      if (isStudent) {
        const response = await getMyStudentProfile()
        setProfile({ kind: 'student', data: response.data })
        return
      }

      if (isLecturer) {
        const response = await getMyLecturerProfile()
        setProfile({ kind: 'lecturer', data: response.data })
        return
      }

      setProfile({ kind: 'admin', data: user })
    } catch (requestError) {
      const message = getErrorMessage(requestError)
      setLoadError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }, [isLecturer, isStudent, showError, user])

  useEffect(() => {
    const loginMessage = sessionStorage.getItem(
      STORAGE_KEYS.loginSuccessMessage,
    )

    if (!loginMessage) return

    sessionStorage.removeItem(STORAGE_KEYS.loginSuccessMessage)
    success(loginMessage)
  }, [success])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const cards = useMemo(
    () => getProfileCards(profile, departments, expertiseTags),
    [departments, expertiseTags, profile],
  )

  return (
    <DashboardLayout title="THÔNG TIN CÁ NHÂN">
      {isLoading ? (
        <section className="profile-card profile-loading">
          <AppLoading label="Đang tải thông tin cá nhân" />
        </section>
      ) : loadError ? (
        <section className="profile-card profile-message error" role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={() => void loadProfile()}>
            Thử lại
          </button>
        </section>
      ) : (
        <div className="personal-information">
          {cards.map((card) => (
            <DetailCard key={card.title} {...card} />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

function getProfileCards(
  profile: Profile | null,
  departments: Department[],
  expertiseTags: ExpertiseTag[],
): DetailCardData[] {
  if (!profile) return []

  const accountDetails = getAccountDetails(profile.data)

  if (profile.kind === 'student') {
    const student = profile.data

    return [
      {
        title: 'Thông tin tài khoản',
        details: accountDetails,
      },
      {
        title: 'Thông tin sinh viên',
        details: [
          { label: 'Mã sinh viên', value: student.studentCode },
          { label: 'Lớp', value: student.className },
          {
            label: 'Khoa / phòng ban',
            value: getDepartmentName(student.departmentId, departments),
          },
          { label: 'ID khoa / phòng ban', value: student.departmentId },
        ],
      },
    ]
  }

  if (profile.kind === 'lecturer') {
    const lecturer = profile.data

    return [
      {
        title: 'Thông tin tài khoản',
        details: accountDetails,
      },
      {
        title: 'Thông tin giảng viên',
        details: [
          { label: 'Mã giảng viên', value: lecturer.lecturerCode },
          {
            label: 'Khoa / phòng ban',
            value: getDepartmentName(lecturer.departmentId, departments),
          },
          { label: 'ID khoa / phòng ban', value: lecturer.departmentId },
          { label: 'Học hàm / học vị', value: lecturer.academicTitle },
          {
            label: 'Tải phản biện tối đa',
            value: lecturer.maxReviewLoad,
          },
        ],
      },
      {
        title: 'Chuyên môn',
        details: [
          {
            label: 'Danh sách chuyên môn',
            value: getExpertiseTagNames(lecturer.expertiseTagIds, expertiseTags),
          },
          {
            label: 'ID chuyên môn',
            value: lecturer.expertiseTagIds?.join(', '),
          },
        ],
      },
    ]
  }

  return [
    {
      title: 'Thông tin quản trị viên',
      details: accountDetails,
    },
  ]
}

function getAccountDetails(user: AuthUser | Student | Lecturer): DetailItem[] {
  const userId = 'userId' in user ? user.userId : user.id

  return [
    { label: 'User ID', value: userId },
    { label: 'Tên đăng nhập', value: user.username },
    { label: 'Email', value: user.email },
    { label: 'Vai trò', value: getRoleLabel(user.roles) },
  ]
}

function getDepartmentName(
  departmentId: number | undefined,
  departments: Department[],
) {
  if (!departmentId) return undefined

  return departments.find((department) => department.departmentId === departmentId)
    ?.name
}

function getExpertiseTagNames(
  expertiseTagIds: number[] | undefined,
  expertiseTags: ExpertiseTag[],
) {
  if (!expertiseTagIds?.length) return undefined

  const tagNameById = new Map(expertiseTags.map((tag) => [tag.id, tag.name]))

  return expertiseTagIds
    .map((id) => tagNameById.get(id) ?? `#${id}`)
    .join(', ')
}

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return 'Chưa có dữ liệu'
  }

  return value
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không thể tải thông tin cá nhân.'
}
