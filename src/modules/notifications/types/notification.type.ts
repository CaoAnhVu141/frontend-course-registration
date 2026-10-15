export type NotificationTarget = 'ALL' | 'STUDENT' | 'LECTURER'

export type NotificationType =
  | 'ANNOUNCEMENT'
  | 'TOPIC_PUBLISHED'
  | 'REGISTRATION_DECISION'
  | 'FEEDBACK'
  | 'RESULT_PUBLISHED'

export type AppNotification = {
  id: number
  type: NotificationType
  title: string
  content: string
  readed: boolean
  readedAt?: string | null
  createdAt: string
}

export type CreateNotificationRequest = {
  target: NotificationTarget
  title: string
  content: string
}

export type ApiResponse<T> = {
  timestamp?: string
  status?: number
  message: string
  data: T
}
