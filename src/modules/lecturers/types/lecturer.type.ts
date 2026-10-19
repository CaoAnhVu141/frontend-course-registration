import type { UserRole } from '../../auth/types/auth.type'

export type Lecturer = {
    userId: number
    username: string
    name: string
    email: string
    roles: UserRole[]
    lecturerCode: string
    departmentId: number
    academicTitle?: string
    maxReviewLoad: number
    expertiseTagIds: number[]
}

export type RegisterLecturerRequest = {
    username?: string
    name?: string
    email?: string
    password?: string
    lecturerCode?: string
    departmentId?: number
    academicTitle?: string
    maxReviewLoad?: number
    expertiseTagIds?: number[]
}

export type UpdateLecturerRequest = {
    name?: string
    lecturerCode?: string
    departmentId?: number
    academicTitle?: string
    maxReviewLoad?: number
    expertiseTagIds?: number[]
}

export type ApiResponse<T> = {
    timestamp: string
    status: number
    message: string
    data: T
}
