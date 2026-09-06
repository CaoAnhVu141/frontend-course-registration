export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export type NotificationItem = {
    id: number
    type: NotificationType
    message: string
    duration: number
    isClosing?: boolean
}

export type NotificationContextValue = {
    show: (
        type: NotificationType,
        message: string,
        duration?: number,
    ) => void
    success: (message: string, duration?: number) => void
    error: (message: string, duration?: number) => void
    warning: (message: string, duration?: number) => void
    info: (message: string, duration?: number) => void
    remove: (id: number) => void
}
