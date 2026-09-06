import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { PropsWithChildren } from 'react'
import { NotificationContainer } from '../components/NotificationContainer'
import type {
  NotificationContextValue,
  NotificationItem,
  NotificationType,
} from '../types/notification.type'

const NotificationContext =
  createContext<NotificationContextValue | null>(null)

let notificationId = 0

export function NotificationProvider({
  children,
}: PropsWithChildren) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const remove = useCallback((id: number) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, isClosing: true }
          : notification,
      ),
    )

    window.setTimeout(() => {
      setNotifications((current) =>
        current.filter((notification) => notification.id !== id),
      )
    }, 280)
  }, [])

  const show = useCallback(
    (
      type: NotificationType,
      message: string,
      duration = 3500,
    ) => {
      const id = ++notificationId

      setNotifications((current) => [
        ...current,
        {
          id,
          type,
          message,
          duration,
        },
      ])

      window.setTimeout(() => {
        remove(id)
      }, duration)
    },
    [remove],
  )

  const value = useMemo<NotificationContextValue>(
    () => ({
      show,
      remove,
      success: (message, duration) =>
        show('success', message, duration),
      error: (message, duration) =>
        show('error', message, duration),
      warning: (message, duration) =>
        show('warning', message, duration),
      info: (message, duration) =>
        show('info', message, duration),
    }),
    [remove, show],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <NotificationContainer
        notifications={notifications}
        onRemove={remove}
      />
    </NotificationContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotification() {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error(
      'useNotification phải được dùng bên trong NotificationProvider',
    )
  }

  return context
}
