import { apiClient } from '../../../shared/services/apiClient'
import type { ApiResponse, Student, RegisterStudentRequest, UpdateStudentRequest } from '../types/student.type'

const STUDENTS_PATH = '/api/students'

export async function getStudents(): Promise<Student[]> {
  const response = await apiClient<ApiResponse<Student[]>>(STUDENTS_PATH)
  return response.data.filter((student) => !isInactive(student.status))
}

function isInactive(status: Student['status']) {
  return status === false || status === 0 || status === 'false' || status === '0'
}

export function getStudent(userId: number) {
  return apiClient<ApiResponse<Student>>(`${STUDENTS_PATH}/${userId}`)
}

export function getMyStudentProfile() {
  return apiClient<ApiResponse<Student>>(`${STUDENTS_PATH}/me`)
}

// Tra cứu sinh viên theo mã số (ADMIN, LECTURER, STUDENT).
export async function getStudentByCode(studentCode: string): Promise<Student> {
  const response = await apiClient<ApiResponse<Student>>(
    `${STUDENTS_PATH}/by-code/${encodeURIComponent(studentCode)}`,
  )
  return response.data
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
