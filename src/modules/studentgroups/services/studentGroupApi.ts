import { apiClient } from '../../../shared/services/apiClient'
import type {
  ApiResponse,
  CreateStudentGroupRequest,
  StudentGroup,
} from '../types/studentGroup.type'

const STUDENT_GROUPS_PATH = '/api/student-groups'

export async function getStudentGroups(): Promise<StudentGroup[]> {
  const response = await apiClient<ApiResponse<StudentGroup[]>>(
    STUDENT_GROUPS_PATH,
  )

  return response.data
}

export async function getStudentGroupsByRegistrationPeriod(
  registrationPeriodId: number,
): Promise<StudentGroup[]> {
  const response = await apiClient<ApiResponse<StudentGroup[]>>(
    `${STUDENT_GROUPS_PATH}/registration-period/${registrationPeriodId}`,
  )

  return response.data
}

// Sinh viên xem các nhóm của chính mình.
export async function getMyStudentGroups(): Promise<StudentGroup[]> {
  const response = await apiClient<ApiResponse<StudentGroup[]>>(
    `${STUDENT_GROUPS_PATH}/me`,
  )

  return response.data
}

export function getStudentGroup(studentGroupId: number) {
  return apiClient<ApiResponse<StudentGroup>>(
    `${STUDENT_GROUPS_PATH}/${studentGroupId}`,
  )
}

export function createStudentGroup(payload: CreateStudentGroupRequest) {
  return apiClient<ApiResponse<StudentGroup>>(STUDENT_GROUPS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteStudentGroup(studentGroupId: number) {
  return apiClient<ApiResponse<null>>(
    `${STUDENT_GROUPS_PATH}/${studentGroupId}`,
    { method: 'DELETE' },
  )
}
