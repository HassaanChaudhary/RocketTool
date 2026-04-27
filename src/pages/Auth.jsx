import { useState } from 'react'
import { supabase } from '../superbase-client'

function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.5rem', marginBottom: '0.75rem', boxSizing: 'border-box',
    backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #444', borderRadius: '4px'
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#000' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '2rem', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#111' }}>
        <h2 style={{ color: '#fff', marginBottom: '1.2rem' }}>{isLogin ? 'Log In' : 'Sign Up'}</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          {error && <p style={{ color: '#ff6b6b', marginBottom: '0.75rem' }}>{error}</p>}
          {message && <p style={{ color: '#6BC48E', marginBottom: '0.75rem' }}>{message}</p>}
          <button type="submit" style={{ width: '100%', padding: '0.6rem', backgroundColor: '#222', color: '#fff', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}>
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center', color: '#aaa' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span
            onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null) }}
            style={{ cursor: 'pointer', color: '#fff', textDecoration: 'underline' }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </span>
        </p>
      </div>
    </div>
  )
}

export default Auth
