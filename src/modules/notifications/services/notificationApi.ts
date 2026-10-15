import { apiClient } from '../../../shared/services/apiClient'
import type {
  ApiResponse,
  AppNotification,
  CreateNotificationRequest,
} from '../types/notification.type'

const NOTIFICATIONS_PATH = '/api/notifications'

// Admin đăng thông báo (ALL / STUDENT / LECTURER). Trả về số người nhận.
// POST /api/notifications  (ROLE_ADMIN)
export function createNotification(payload: CreateNotificationRequest) {
  return apiClient<ApiResponse<number>>(NOTIFICATIONS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Thông báo của tôi.
// GET /api/notifications/me  (ADMIN, LECTURER, STUDENT)
export async function getMyNotifications(): Promise<AppNotification[]> {
  const response = await apiClient<ApiResponse<AppNotification[]>>(
    `${NOTIFICATIONS_PATH}/me`,
  )

  return response.data
}

// Số thông báo chưa đọc.
// GET /api/notifications/me/unread-count  (ADMIN, LECTURER, STUDENT)
export async function getUnreadCount(): Promise<number> {
  const response = await apiClient<ApiResponse<number>>(
    `${NOTIFICATIONS_PATH}/me/unread-count`,
  )

  return response.data
}

// Đánh dấu một thông báo đã đọc.
// PATCH /api/notifications/{id}/read  (ADMIN, LECTURER, STUDENT)
export function markNotificationAsRead(notificationId: number) {
  return apiClient<ApiResponse<AppNotification>>(
    `${NOTIFICATIONS_PATH}/${notificationId}/read`,
    { method: 'PATCH' },
  )
}
