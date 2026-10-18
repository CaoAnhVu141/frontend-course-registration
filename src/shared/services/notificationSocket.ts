import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { tokenStorage } from './tokenStorage'
import type { AppNotification } from '../../modules/notifications/types/notification.type'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
// Backend STOMP endpoint (SockJS): ví dụ http://localhost:8080/ws
const WS_ENDPOINT = `${API_BASE_URL}/ws`
// Đích riêng từng user mà backend đẩy thông báo tới.
const USER_QUEUE = '/user/queue/notifications'

type NotificationListener = (notification: AppNotification) => void

let client: Client | null = null
const listeners = new Set<NotificationListener>()

// Kết nối WebSocket (idempotent — gọi nhiều lần vẫn chỉ 1 kết nối).
export function connectNotificationSocket() {
  if (client) return

  const token = tokenStorage.getAccessToken()
  if (!token) return

  const stompClient = new Client({
    // Dùng SockJS vì backend cấu hình .withSockJS()
    webSocketFactory: () => new SockJS(WS_ENDPOINT),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    onConnect: () => {
      stompClient.subscribe(USER_QUEUE, (message) => {
        try {
          const notification = JSON.parse(message.body) as AppNotification
          listeners.forEach((listener) => listener(notification))
        } catch {
          // Bỏ qua message không parse được.
        }
      })
    },
  })

  stompClient.activate()
  client = stompClient
}

// Ngắt kết nối (gọi khi đăng xuất).
export function disconnectNotificationSocket() {
  if (!client) return
  void client.deactivate()
  client = null
}

// Đăng ký lắng nghe thông báo mới; trả về hàm hủy đăng ký.
export function onNotificationReceived(listener: NotificationListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
