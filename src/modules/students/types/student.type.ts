import type { UserRole } from '../../auth/types/auth.type'

export type Student = {
  userId: number
  username: string
  name: string
  email: string
  roles: UserRole[]
  studentCode: string
  departmentId: number
  className: string
  status?: boolean | number | string
}

export type UpdateStudentRequest = {
  name: string
  studentCode: string
  departmentId?: number
  className: string
}

export type RegisterStudentRequest = UpdateStudentRequest & {
  username: string
  email: string
  password: string
}

export type ApiResponse<T> = {
  timestamp: string
  status: number
  message: string
  data: T
}
