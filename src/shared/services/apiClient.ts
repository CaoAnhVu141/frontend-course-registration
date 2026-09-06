const API_BASE_URL = 'http://localhost:8080'

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

    if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Có lỗi xảy ra')
    }

    return data as TResponse
}
