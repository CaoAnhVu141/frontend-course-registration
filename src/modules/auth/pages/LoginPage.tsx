import { useEffect } from 'react'
import { useNotification } from '../../notification'
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys'
import { LoginForm } from '../components/LoginForm'
import './LoginPage.css'

const brandTitle = [
  ['TRƯỜNG', 'ĐẠI', 'HỌC'],
  ['CÔNG', 'NGHỆ', 'KỸ', 'THUẬT'],
  ['TP.', 'HỒ', 'CHÍ', 'MINH'],
]

export function LoginPage() {
  const { success, warning } = useNotification()

  useEffect(() => {
    const logoutMessage = sessionStorage.getItem(STORAGE_KEYS.logoutMessage)

    if (logoutMessage) {
      sessionStorage.removeItem(STORAGE_KEYS.logoutMessage)
      success(logoutMessage)
    }

    const sessionExpiredMessage = sessionStorage.getItem(
      STORAGE_KEYS.sessionExpiredMessage,
    )

    if (sessionExpiredMessage) {
      sessionStorage.removeItem(STORAGE_KEYS.sessionExpiredMessage)
      warning(sessionExpiredMessage)
    }
  }, [success, warning])

  function handleLoginSuccess() {
    window.location.href = '/dashboard'
  }

  return (
    <main className="auth-page">
      <aside className="auth-brand" aria-label="Giới thiệu hệ thống">
        <span className="auth-brand-orb one" aria-hidden="true" />
        <span className="auth-brand-orb two" aria-hidden="true" />

        <div className="auth-brand-inner">
          <p className="auth-brand-eyebrow">Cổng thông tin khóa luận</p>

          <h1 className="auth-brand-title">
            {brandTitle.map((line, lineIndex) => (
              <span className="auth-brand-line" key={line.join(' ')}>
                {line.map((word, wordIndex) => (
                  <span
                    className="auth-brand-word"
                    key={word}
                    style={{
                      animationDelay: `${0.18 + lineIndex * 0.28 + wordIndex * 0.09}s`,
                    }}
                  >
                    <span
                      className="auth-brand-word-inner"
                      style={{
                        animationDelay: `${lineIndex * 0.18 + wordIndex * 0.12}s, ${
                          lineIndex * 0.28 + wordIndex * 0.09
                        }s`,
                      }}
                    >
                      {word}
                    </span>
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <p className="auth-brand-desc">
            Hệ thống quản lý đăng ký, xét duyệt và bảo vệ khóa luận tốt nghiệp.
          </p>
        </div>
      </aside>

      <div className="login-container">
        <div className="login-box">
          <div className="logo">
            <h1>Đăng Nhập</h1>
            <p>Hệ thống đăng nhập thông tin</p>
          </div>

          <LoginForm onLoginSuccess={handleLoginSuccess} />

          <div className="login-footer">
          </div>
        </div>
      </div>
    </main>
  )
}
