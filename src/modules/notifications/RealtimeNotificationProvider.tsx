import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { tokenStorage } from '../../shared/services/tokenStorage'
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
  onNotificationReceived,
} from '../../shared/services/notificationSocket'
import { useNotification } from '../notification'
import { getUnreadCount } from './services/notificationApi'

type RealtimeNotificationContextValue = {
  unreadCount: number
  setUnreadCount: (value: number) => void
  refreshUnreadCount: () => Promise<void>
}

const RealtimeNotificationContext =
  createContext<RealtimeNotificationContextValue>({
    unreadCount: 0,
    setUnreadCount: () => {},
    refreshUnreadCount: async () => {},
  })

export function RealtimeNotificationProvider({
  children,
}: {
  children: ReactNode
}) {
  const { info } = useNotification()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnreadCount = useCallback(async () => {
    if (!tokenStorage.getAccessToken()) {
      setUnreadCount(0)
      return
    }

    try {
      setUnreadCount(await getUnreadCount())
    } catch {
      // Không chặn UI nếu lấy số chưa đọc lỗi.
    }
  }, [])

  // Nhận thông báo mới theo thời gian thực: tăng badge + hiện toast.
  useEffect(() => {
    return onNotificationReceived((notification) => {
      setUnreadCount((current) => current + 1)
      info(`🔔 ${notification.title}`)
    })
  }, [info])

  // Kết nối/ngắt WebSocket theo trạng thái đăng nhập (login/logout đều điều hướng).
  useEffect(() => {
    if (tokenStorage.getAccessToken()) {
      connectNotificationSocket()
      void refreshUnreadCount()
    } else {
      disconnectNotificationSocket()
      setUnreadCount(0)
    }
  }, [location.pathname, refreshUnreadCount])

  return (
    <RealtimeNotificationContext.Provider
      value={{ unreadCount, setUnreadCount, refreshUnreadCount }}
    >
      {children}
    </RealtimeNotificationContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRealtimeNotifications() {
  return useContext(RealtimeNotificationContext)
}
