// const API_BASE_URL = 'http://localhost:8080'
import { tokenStorage } from './tokenStorage'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { normalizeRoles } from '../utils/roleLabel'
import type { BackendLoginResponse } from '../../modules/auth/types/auth.type'

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL

const AUTH_PATH_PREFIX = '/api/auth/'
const SESSION_EXPIRED_MESSAGE =
    'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'

// Chỉ cho phép một request làm mới token tại một thời điểm,
// các request 401 còn lại sẽ chờ chung kết quả này.
let refreshPromise: Promise<string | null> | null = null

export async function apiClient<TResponse>(
    path: string,
    options?: RequestInit,
    allowRefresh = true,
): Promise<TResponse> {
    const accessToken = tokenStorage.getAccessToken()
    const response = await request(path, options, accessToken)

    if (
        response.status === 401 &&
        accessToken &&
        allowRefresh &&
        !path.startsWith(AUTH_PATH_PREFIX)
    ) {
        const refreshedToken = await getRefreshedAccessToken()

        if (refreshedToken) {
            return apiClient<TResponse>(path, options, false)
        }

        handleSessionExpired()
    }

    const data = await response.json().catch(() => null)

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

function request(
    path: string,
    options: RequestInit | undefined,
    accessToken: string | null,
) {
    const headers = new Headers(options?.headers)
    headers.set('Content-Type', 'application/json')

    if (accessToken) {
        headers.set(
            'Authorization',
            `${tokenStorage.getTokenType()} ${accessToken}`,
        )
    }

    return fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    })
}

function getRefreshedAccessToken() {
    if (!refreshPromise) {
        const pendingRefresh = refreshAccessToken().finally(() => {
            if (refreshPromise === pendingRefresh) {
                refreshPromise = null
            }
        })

        refreshPromise = pendingRefresh
    }

    return refreshPromise
}

async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = tokenStorage.getRefreshToken()

    if (!refreshToken) {
        return null
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}${AUTH_PATH_PREFIX}refresh-token`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            },
        )

        if (!response.ok) {
            return null
        }

        const result: BackendLoginResponse | null = await response
            .json()
            .catch(() => null)
        const payload = result?.data
        const accessToken =
            payload?.accessToken ?? payload?.access_token ?? payload?.token

        if (!accessToken) {
            return null
        }

        tokenStorage.save({
            accessToken,
            refreshToken: payload?.refreshToken ?? payload?.refresh_token,
            tokenType: payload?.tokenType ?? payload?.token_type,
            user: {
                id: payload?.id,
                username: payload?.username,
                email: payload?.email,
                roles: normalizeRoles(payload?.roles),
            },
        })

        return accessToken
    } catch {
        return null
    }
}

function handleSessionExpired() {
    tokenStorage.clear()

    if (window.location.pathname !== '/') {
        sessionStorage.setItem(
            STORAGE_KEYS.sessionExpiredMessage,
            SESSION_EXPIRED_MESSAGE,
        )
        window.location.href = '/'
    }
}
