import { apiClient } from '../../../shared/services/apiClient'
import type {
    ApiResponse,
    Lecturer,
    RegisterLecturerRequest,
    UpdateLecturerRequest,
} from '../types/lecturer.type'

const LECTURERS_PATH = '/api/lecturers'

export async function getLecturers(): Promise<Lecturer[]> {
    const response = await apiClient<ApiResponse<Lecturer[]>>(LECTURERS_PATH)
    return response.data
}

export async function getMyLecturerProfile(): Promise<ApiResponse<Lecturer>> {
    return apiClient<ApiResponse<Lecturer>>(`${LECTURERS_PATH}/me`)
}

export async function createLecturer(
    payload: RegisterLecturerRequest,
): Promise<ApiResponse<Lecturer>> {
    return apiClient<ApiResponse<Lecturer>>(`${LECTURERS_PATH}/register`, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export async function updateLecturer(
    userId: number,
    payload: UpdateLecturerRequest,
): Promise<ApiResponse<Lecturer>> {
    return apiClient<ApiResponse<Lecturer>>(`${LECTURERS_PATH}/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    })
}

export async function deleteLecturer(
    userId: number,
): Promise<ApiResponse<null>> {
    return apiClient<ApiResponse<null>>(`${LECTURERS_PATH}/${userId}`, {
        method: 'DELETE',
    })
}