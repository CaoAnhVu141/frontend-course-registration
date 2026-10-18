import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { NotificationProvider } from './modules/notification'
import { ConfirmationProvider } from './modules/confirmation'
import { RealtimeNotificationProvider } from './modules/notifications'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <RealtimeNotificationProvider>
          <ConfirmationProvider>
            <App />
          </ConfirmationProvider>
        </RealtimeNotificationProvider>
      </NotificationProvider>
    </BrowserRouter>
  </StrictMode>,
)
