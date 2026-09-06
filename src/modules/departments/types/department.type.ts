export type Department = {
  departmentId: number
  name: string
}

export type DepartmentRequest = {
  name: string
}

export type ApiResponse<T> = {
  timestamp: string
  status: number
  message: string
  data: T
}
