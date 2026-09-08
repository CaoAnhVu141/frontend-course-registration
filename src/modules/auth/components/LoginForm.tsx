import { useState } from 'react'
import type { FormEvent } from 'react'
import { login } from '../services/authApi'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys'

type LoginFormProps = {
  onLoginSuccess?: () => void
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!username.trim() || !password) {
      setMessage('Vui lòng nhập đầy đủ thông tin.')
      setMessageType('error')
      return
    }

    setIsLoading(true)
    setMessage('')
    setMessageType('')

    try {
      const data = await login({
        username: username.trim(),
        password,
      })

      if (!data.accessToken) {
        throw new Error('Đăng nhập thành công nhưng backend chưa trả accessToken.')
      }

      tokenStorage.save(data)
      sessionStorage.setItem(STORAGE_KEYS.loginSuccessMessage, 'true')

      setMessage('Đăng nhập thành công!')
      setMessageType('success')

      setTimeout(() => {
        onLoginSuccess?.()
      }, 700)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Không thể kết nối đến máy chủ. Hãy kiểm tra Backend Spring Boot.',
      )
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="username">Tên đăng nhập</label>
        <div className="input-box">
          <span className="input-icon">👤</span>
          <input
            id="username"
            type="text"
            placeholder="Nhập tên đăng nhập"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="password">Mật khẩu</label>
        <div className="input-box">
          <span className="input-icon">🔒</span>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            className="password-toggle"
            type="button"
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? '🙈' : '👁'}
          </button>
        </div>
      </div>

      <div className={`message ${messageType}`}>{message}</div>

      <button className="login-button" type="submit" disabled={isLoading}>
        {isLoading ? <span className="loading" /> : 'Đăng nhập'}
      </button>
    </form>
  )
}
