// const API_BASE_URL = 'http://localhost:8080'
import { tokenStorage } from './tokenStorage'
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL

export async function apiClient<TResponse>(
    path: string,
    options?: RequestInit,
): Promise<TResponse> {
    const headers = new Headers(options?.headers)
    headers.set('Content-Type', 'application/json')

    const accessToken = localStorage.getItem('accessToken')
    const tokenType = localStorage.getItem('tokenType') ?? 'Bearer'

    if (accessToken) {
        headers.set('Authorization', `${tokenType} ${accessToken}`)
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    })

    const data = await response.json().catch(() => null)

    if (response.status === 401 && accessToken) {
        tokenStorage.clear();

        if (window.location.pathname !== '/') {
            window.location.href = '/'
        }
    }

    if (!response.ok) {
        const details =
            data?.details && typeof data.details === 'object'
                ? Object.values(data.details)
                    .filter((value) => typeof value === 'string')
                    .join(', ')
                : ''

        throw new Error(
            details ||
            data?.message ||
            data?.error ||
            'Có lỗi xảy ra',
        )
    }

    return data as TResponse
}
