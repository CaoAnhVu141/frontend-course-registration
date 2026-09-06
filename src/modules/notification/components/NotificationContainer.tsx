import type { NotificationItem } from '../types/notification.type'

type NotificationContainerProps = {
  notifications: NotificationItem[]
  onRemove: (id: number) => void
}

const notificationTitles = {
  success: 'Thành công',
  error: 'Thất bại',
  warning: 'Cảnh báo',
  info: 'Thông báo',
}

const notificationIcons = {
  success: '✓',
  error: '!',
  warning: '!',
  info: 'i',
}

export function NotificationContainer({
  notifications,
  onRemove,
}: NotificationContainerProps) {
  return (
    <div
      className="notification-container"
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification-item ${notification.type} ${
            notification.isClosing ? 'closing' : ''
          }`}
          role="status"
        >
          <span className="notification-icon">
            {notificationIcons[notification.type]}
          </span>

          <div className="notification-content">
            <strong>{notificationTitles[notification.type]}</strong>
            <p>{notification.message}</p>
          </div>

          <button
            type="button"
            className="notification-close"
            onClick={() => onRemove(notification.id)}
            aria-label="Đóng thông báo"
            title="Đóng"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
