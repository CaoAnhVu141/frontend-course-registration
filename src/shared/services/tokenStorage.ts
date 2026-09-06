import { STORAGE_KEYS } from '../constants/storageKeys'

type TokenPayload = {
    accessToken?: string
    refreshToken?: string
    tokenType?: string
}

export const tokenStorage = {
    save(tokens: TokenPayload) {
        if (tokens.accessToken) {
            localStorage.setItem(STORAGE_KEYS.accessToken, tokens.accessToken)
        }

        if (tokens.refreshToken) {
            localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken)
        }

        if (tokens.tokenType) {
            localStorage.setItem(STORAGE_KEYS.tokenType, tokens.tokenType)
        }
    },

    getAccessToken() {
        return localStorage.getItem(STORAGE_KEYS.accessToken)
    },

    clear() {
        localStorage.removeItem(STORAGE_KEYS.accessToken)
        localStorage.removeItem(STORAGE_KEYS.refreshToken)
        localStorage.removeItem(STORAGE_KEYS.tokenType)
    },
}