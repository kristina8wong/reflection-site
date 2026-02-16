import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './AuthView.css'

function isValidEmail(str: string): boolean {
  const trimmed = str.trim()
  if (!trimmed) return false
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(trimmed)
}

export function AuthView() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signup, login } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await login(email, password)
      } else {
        if (!displayName.trim()) {
          setError('Please enter your full name')
          setLoading(false)
          return
        }
        if (!isValidEmail(email)) {
          setError('Please enter a valid email address (e.g. name@example.com)')
          setLoading(false)
          return
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        await signup(email, password, displayName.trim())
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || 'Failed to authenticate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-view">
      <div className="auth-card">
        <h1 className="auth-title">Year Reflection</h1>
        <p className="auth-subtitle">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="displayName">Full Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
                required={!isLogin}
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required={!isLogin}
                minLength={6}
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Loading...' : isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            className="auth-toggle-btn"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setConfirmPassword('')
            }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  )
}
