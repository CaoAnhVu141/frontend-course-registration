import { apiClient } from '../../../shared/services/apiClient'
import type { LoginRequest, LoginResponse } from '../types/auth.type'

export function login(payload: LoginRequest) {
    return apiClient<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}