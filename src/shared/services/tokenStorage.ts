import { STORAGE_KEYS } from '../constants/storageKeys'
import type { AuthUser } from '../../modules/auth/types/auth.type'

type TokenPayload = {
    accessToken?: string
    refreshToken?: string
    tokenType?: string
    user?: AuthUser
}

export const tokenStorage = {
    save(payload: TokenPayload) {
        if (payload.accessToken) {
            localStorage.setItem(STORAGE_KEYS.accessToken, payload.accessToken)
        }

        if (payload.refreshToken) {
            localStorage.setItem(STORAGE_KEYS.refreshToken, payload.refreshToken)
        }

        if (payload.tokenType) {
            localStorage.setItem(STORAGE_KEYS.tokenType, payload.tokenType)
        }

        if (payload.user) {
            localStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(payload.user))
        }
    },

    getAccessToken() {
        return localStorage.getItem(STORAGE_KEYS.accessToken)
    },

    getUser(): AuthUser | null {
        const rawUser = localStorage.getItem(STORAGE_KEYS.authUser)

        if (!rawUser) {
            return null
        }

        try {
            return JSON.parse(rawUser) as AuthUser
        } catch {
            return null
        }
    },

    clear() {
        localStorage.removeItem(STORAGE_KEYS.accessToken)
        localStorage.removeItem(STORAGE_KEYS.refreshToken)
        localStorage.removeItem(STORAGE_KEYS.tokenType)
        localStorage.removeItem(STORAGE_KEYS.authUser)
    },
}