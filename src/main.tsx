import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { NotificationProvider } from './modules/notification'
import { ConfirmationProvider } from './modules/confirmation'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <ConfirmationProvider>
          <App />
        </ConfirmationProvider>
      </NotificationProvider>
    </BrowserRouter>
  </StrictMode>,
)
