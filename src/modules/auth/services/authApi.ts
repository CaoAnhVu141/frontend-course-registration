import { apiClient } from '../../../shared/services/apiClient'
import type {
    BackendLoginResponse,
    LoginRequest,
    LoginResponse,
} from '../types/auth.type'

export async function login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient<BackendLoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    })

    const data = response.data

    if (!data) {
        throw new Error(response.message || 'Backend chưa trả dữ liệu đăng nhập.')
    }

    return {
        accessToken: data.accessToken ?? data.access_token ?? data.token,
        refreshToken: data.refreshToken ?? data.refresh_token,
        tokenType: data.tokenType ?? data.token_type,
        expiresIn: data.expiresIn,
        message: response.message,
        user: {
            id: data.id,
            username: data.username,
            email: data.email,
            roles: data.roles ?? [],
        },
    }
}
