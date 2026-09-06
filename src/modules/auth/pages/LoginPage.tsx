import { LoginForm } from '../components/LoginForm'
import './LoginPage.css'

export function LoginPage() {
  function handleLoginSuccess() {
    window.location.href = '/dashboard'
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo">
          <div className="logo-icon">🎓</div>
          <h1>Log In</h1>
          <p>Hệ thống đăng nhập thông tin</p>
        </div>

        <LoginForm onLoginSuccess={handleLoginSuccess} />

        <div className="login-footer">
          <p>© 2026 Course Registration</p>
        </div>
      </div>
    </div>
  )
}