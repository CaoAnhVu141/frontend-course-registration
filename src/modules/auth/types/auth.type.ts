export type LoginRequest = {
    username: string
    password: string
}

export type LoginResponse = {
    accessToken?: string
    refreshToken?: string
    tokenType?: string
    message?: string
}

export type BackendLoginResponse = LoginResponse & {
    token?: string
    access_token?: string
    refresh_token?: string
    token_type?: string
    data?: BackendLoginResponse
}
