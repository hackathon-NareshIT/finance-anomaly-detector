import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '1rem',
    },
    card: {
        width: '100%',
        maxWidth: '400px',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '2rem',
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '2rem',
    },
    logoIcon: {
        width: '36px',
        height: '36px',
        background: 'var(--accent)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
    },
    logoText: {
        fontSize: '16px',
        fontWeight: '600',
        color: 'var(--text)',
    },
    heading: {
        fontSize: '22px',
        fontWeight: '600',
        marginBottom: '6px',
        color: 'var(--text)',
    },
    sub: {
        fontSize: '14px',
        color: 'var(--text2)',
        marginBottom: '1.75rem',
    },
    label: {
        display: 'block',
        fontSize: '13px',
        fontWeight: '500',
        color: 'var(--text2)',
        marginBottom: '6px',
    },
    input: {
        width: '100%',
        padding: '10px 14px',
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        color: 'var(--text)',
        fontSize: '14px',
        marginBottom: '1rem',
        transition: 'border-color 0.2s',
    },
    btn: {
        width: '100%',
        padding: '11px',
        background: 'var(--accent)',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        marginTop: '4px',
        transition: 'background 0.2s, opacity 0.2s',
    },
    error: {
        background: 'var(--danger-bg)',
        border: '1px solid var(--danger)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
        color: 'var(--danger)',
        marginBottom: '1rem',
    },
    footer: {
        textAlign: 'center',
        marginTop: '1.25rem',
        fontSize: '13px',
        color: 'var(--text2)',
    },
}

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async () => {
        if (!email || !password) { setError('Please fill in all fields.'); return }
        setLoading(true)
        setError('')
        try {
            const res = await axios.post(`${API}/auth/login`, { email, password })
            login({ id: res.data.user_id, email: res.data.email }, res.data.access_token)
            navigate('/')
        } catch (e) {
            setError(e.response?.data?.detail || 'Login failed. Check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    const handleKey = (e) => { if (e.key === 'Enter') handleSubmit() }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.logo}>
                    <div style={styles.logoIcon}>⚡</div>
                    <span style={styles.logoText}>AnomalyDetect</span>
                </div>

                <h1 style={styles.heading}>Welcome back</h1>
                <p style={styles.sub}>Sign in to your account to continue</p>

                {error && <div style={styles.error}>{error}</div>}

                <label style={styles.label} htmlFor="login-email">Email</label>
                <input
                    id="login-email"
                    style={styles.input}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={handleKey}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <label style={styles.label}>Password</label>
                <input
                    style={styles.input}
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={handleKey}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />

                <button
                    style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>

                <p style={styles.footer}>
                    Don't have an account?{' '}
                    <Link to="/signup" style={{ color: 'var(--accent)' }}>Sign up</Link>
                </p>
            </div>
        </div>
    )
}
