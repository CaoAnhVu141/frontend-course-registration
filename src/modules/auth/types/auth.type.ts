export type UserRole = 'LECTURER' | 'STUDENT' | 'ADMIN'

export type AuthUser = {
    id?: string | number
    username?: string
    name?: string
    email?: string
    roles: UserRole[]
}

export type LoginRequest = {
    username: string
    password: string
}

export type LoginResponse = {
    accessToken?: string
    refreshToken?: string
    tokenType?: string
    expiresIn?: number
    message?: string
    user?: AuthUser
}

export type BackendLoginResponse = {
    timestamp?: string
    status?: number
    message?: string
    data?: BackendLoginPayload
}

export type BackendLoginPayload = {
    accessToken?: string
    refreshToken?: string
    tokenType?: string
    token?: string
    access_token?: string
    refresh_token?: string
    token_type?: string
    id?: string | number
    username?: string
    name?: string
    email?: string
    roles?: string[]
    expiresIn?: number
    user?: AuthUser
}
