import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { NotificationProvider } from './modules/notification'
import { ConfirmationProvider } from './modules/confirmation'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationProvider>
      <ConfirmationProvider>
        <App />
      </ConfirmationProvider>
    </NotificationProvider>
  </StrictMode>,
)
