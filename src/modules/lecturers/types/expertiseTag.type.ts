export type ExpertiseTag = {
    id: number
    name: string
    status: boolean
}

export type ApiResponse<T> = {
    timestamp: string
    status: number
    message: string
    data: T
}
