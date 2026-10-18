import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Bell,
  Check,
  CheckCheck,
  Megaphone,
  Send,
} from 'lucide-react'
import { DashboardLayout } from '../../dashboard/components/DashboardLayout'
import { useNotification } from '../../notification'
import { AppLoading } from '../../ui'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { hasRole } from '../../../shared/utils/roleLabel'
import {
  createNotification,
  getMyNotifications,
  markNotificationAsRead,
} from '../services/notificationApi'
import { useRealtimeNotifications } from '../RealtimeNotificationProvider'
import { onNotificationReceived } from '../../../shared/services/notificationSocket'
import type {
  AppNotification,
  NotificationTarget,
  NotificationType,
} from '../types/notification.type'
import './NotificationsPage.css'

const TARGET_OPTIONS: { value: NotificationTarget; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'STUDENT', label: 'Sinh viên' },
  { value: 'LECTURER', label: 'Giảng viên' },
]

const TYPE_LABEL: Record<NotificationType, string> = {
  ANNOUNCEMENT: 'Thông báo',
  TOPIC_PUBLISHED: 'Đề tài',
  REGISTRATION_DECISION: 'Đăng ký',
  FEEDBACK: 'Góp ý',
  RESULT_PUBLISHED: 'Kết quả',
}

export function NotificationsPage() {
  const user = useMemo(() => tokenStorage.getUser(), [])
  const isAdmin = hasRole(user?.roles, 'ADMIN')
  const { success, error: showError } = useNotification()
  const { refreshUnreadCount } = useRealtimeNotifications()

  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [markingId, setMarkingId] = useState<number | null>(null)

  const [target, setTarget] = useState<NotificationTarget>('ALL')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readed).length,
    [notifications],
  )

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError('')
      const data = await getMyNotifications()
      setNotifications(data)
    } catch (error) {
      const message = getErrorMessage(error)
      setLoadError(message)
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  // Thông báo mới đến qua WebSocket: thêm vào đầu danh sách ngay.
  useEffect(() => {
    return onNotificationReceived((notification) => {
      setNotifications((current) =>
        current.some((item) => item.id === notification.id)
          ? current
          : [notification, ...current],
      )
    })
  }, [])

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim() || !content.trim()) {
      showError('Vui lòng nhập tiêu đề và nội dung.')
      return
    }

    try {
      setIsSending(true)
      const response = await createNotification({
        target,
        title: title.trim(),
        content: content.trim(),
      })
      success(`${response.message} (${response.data} người nhận)`)
      setTitle('')
      setContent('')
      void loadNotifications()
    } catch (error) {
      showError(getErrorMessage(error))
    } finally {
      setIsSending(false)
    }
  }

  async function handleMarkRead(notification: AppNotification) {
    try {
      setMarkingId(notification.id)
      const response = await markNotificationAsRead(notification.id)
      setNotifications((current) =>
        current.map((item) =>
          item.id === response.data.id ? response.data : item,
        ),
      )
      void refreshUnreadCount()
    } catch (error) {
      showError(getErrorMessage(error))
    } finally {
      setMarkingId(null)
    }
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter((item) => !item.readed)
    if (unread.length === 0) return

    try {
      const updated = await Promise.all(
        unread.map((item) => markNotificationAsRead(item.id)),
      )
      const map = new Map(updated.map((res) => [res.data.id, res.data]))
      setNotifications((current) =>
        current.map((item) => map.get(item.id) ?? item),
      )
      void refreshUnreadCount()
      success('Đã đánh dấu tất cả là đã đọc.')
    } catch (error) {
      showError(getErrorMessage(error))
    }
  }

  return (
    <DashboardLayout title="THÔNG BÁO" contentClassName="notifications-content">
      {isAdmin && (
        <section className="notification-compose">
          <header className="notification-compose-head">
            <span className="notification-compose-icon" aria-hidden="true">
              <Megaphone size={20} strokeWidth={1.9} />
            </span>
            <div>
              <h2>Đăng thông báo</h2>
              <p>Gửi thông báo tới toàn bộ người dùng hoặc theo nhóm.</p>
            </div>
          </header>

          <form onSubmit={(event) => void handleSend(event)}>
            <div className="notification-compose-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="notification-target">
                  Phạm vi gửi
                </label>
                <select
                  className="form-control"
                  id="notification-target"
                  value={target}
                  onChange={(event) =>
                    setTarget(event.target.value as NotificationTarget)
                  }
                >
                  {TARGET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="notification-title">
                  Tiêu đề
                </label>
                <input
                  className="form-control"
                  id="notification-title"
                  maxLength={255}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="VD: Lịch bảo vệ đợt 1"
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="notification-content">
                Nội dung
              </label>
              <textarea
                className="form-control"
                id="notification-content"
                rows={4}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Nội dung thông báo..."
              />
            </div>

            <div className="notification-compose-actions">
              <button type="submit" disabled={isSending}>
                <Send size={15} strokeWidth={1.9} aria-hidden="true" />
                {isSending ? 'Đang gửi...' : 'Gửi thông báo'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="notification-list-card">
        <header className="notification-list-head">
          <h2>
            Thông báo của tôi
            {unreadCount > 0 && (
              <span className="notification-unread-pill">{unreadCount} mới</span>
            )}
          </h2>
          {unreadCount > 0 && (
            <button
              type="button"
              className="notification-mark-all"
              onClick={() => void handleMarkAllRead()}
            >
              <CheckCheck size={15} strokeWidth={1.9} aria-hidden="true" />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </header>

        {isLoading ? (
          <div className="notification-state">
            <AppLoading />
          </div>
        ) : loadError ? (
          <div className="notification-message error" role="alert">
            {loadError}
            <button type="button" onClick={() => void loadNotifications()}>
              Thử lại
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <Bell size={30} strokeWidth={1.6} aria-hidden="true" />
            <p>Bạn chưa có thông báo nào.</p>
          </div>
        ) : (
          <ul className="notification-list">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`notification-item ${
                  notification.readed ? '' : 'unread'
                }`}
              >
                <div className="notification-item-main">
                  <div className="notification-item-head">
                    <span className="notification-type">
                      {TYPE_LABEL[notification.type] ?? notification.type}
                    </span>
                    <span className="notification-item-title">
                      {notification.title}
                    </span>
                  </div>
                  <p className="notification-item-content">
                    {notification.content}
                  </p>
                  <span className="notification-item-time">
                    {formatDateTime(notification.createdAt)}
                  </span>
                </div>

                {!notification.readed && (
                  <button
                    type="button"
                    className="notification-mark"
                    disabled={markingId === notification.id}
                    onClick={() => void handleMarkRead(notification)}
                    title="Đánh dấu đã đọc"
                  >
                    <Check size={15} strokeWidth={1.9} aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardLayout>
  )
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu.'
}
