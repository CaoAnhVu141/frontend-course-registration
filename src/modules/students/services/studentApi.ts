import { apiClient } from '../../../shared/services/apiClient'
import type { ApiResponse, Student, RegisterStudentRequest, UpdateStudentRequest } from '../types/student.type'

const STUDENTS_PATH = '/api/students'

export async function getStudents(): Promise<Student[]> {
  const response = await apiClient<ApiResponse<Student[]>>(STUDENTS_PATH)
  return response.data
}

export function getStudent(userId: number) {
  return apiClient<ApiResponse<Student>>(`${STUDENTS_PATH}/${userId}`)
}

export function getMyStudentProfile() {
  return apiClient<ApiResponse<Student>>(`${STUDENTS_PATH}/me`)
}

export function createStudent(payload: RegisterStudentRequest) {
  return apiClient<ApiResponse<Student>>(`${STUDENTS_PATH}/register`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateStudent(userId: number, payload: UpdateStudentRequest) {
  return apiClient<ApiResponse<Student>>(`${STUDENTS_PATH}/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteStudent(userId: number) {
  return apiClient<ApiResponse<null>>(`${STUDENTS_PATH}/${userId}`, { method: 'DELETE' })
}
