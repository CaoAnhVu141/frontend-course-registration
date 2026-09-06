const API_BASE_URL = 'http://localhost:8080'

export async function apiClient<TResponse>(
    path: string,
    options?: RequestInit,
): Promise<TResponse> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        ...options,
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Có lỗi xảy ra')
    }

    return data as TResponse
}