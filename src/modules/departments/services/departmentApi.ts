import { apiClient } from '../../../shared/services/apiClient'
import type {
  ApiResponse,
  Department,
  DepartmentRequest,
} from '../types/department.type'

const DEPARTMENTS_PATH = '/api/departments'

export async function getDepartments(): Promise<Department[]> {
  const response = await apiClient<ApiResponse<Department[]>>(DEPARTMENTS_PATH)
  return response.data
}

export async function createDepartment(
  payload: DepartmentRequest,
): Promise<ApiResponse<Department>> {
  return apiClient<ApiResponse<Department>>(DEPARTMENTS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateDepartment(
  departmentId: number,
  payload: DepartmentRequest,
): Promise<ApiResponse<Department>> {
  return apiClient<ApiResponse<Department>>(
    `${DEPARTMENTS_PATH}/${departmentId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )
}

export async function deleteDepartment(
  departmentId: number,
): Promise<ApiResponse<null>> {
  return apiClient<ApiResponse<null>>(
    `${DEPARTMENTS_PATH}/${departmentId}`,
    {
      method: 'DELETE',
    },
  )
}