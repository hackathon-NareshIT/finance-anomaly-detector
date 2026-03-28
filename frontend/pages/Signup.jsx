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
    logoText: { fontSize: '16px', fontWeight: '600', color: 'var(--text)' },
    heading: { fontSize: '22px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' },
    sub: { fontSize: '14px', color: 'var(--text2)', marginBottom: '1.75rem' },
    label: { display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text2)', marginBottom: '6px' },
    input: {
        width: '100%', padding: '10px 14px',
        background: 'var(--bg3)', border: '1px solid var(--border)',
        borderRadius: '8px', color: 'var(--text)', fontSize: '14px', marginBottom: '1rem',
    },
    btn: {
        width: '100%', padding: '11px', background: 'var(--accent)',
        color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', marginTop: '4px',
    },
    error: {
        background: 'var(--danger-bg)', border: '1px solid var(--danger)',
        borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--danger)', marginBottom: '1rem',
    },
    success: {
        background: 'var(--success-bg)', border: '1px solid var(--success)',
        borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--success)', marginBottom: '1rem',
    },
    footer: { textAlign: 'center', marginTop: '1.25rem', fontSize: '13px', color: 'var(--text2)' },
}

export default function Signup() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async () => {
        if (!email || !password || !confirm) { setError('Please fill in all fields.'); return }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
        if (password !== confirm) { setError('Passwords do not match.'); return }
        setLoading(true)
        setError('')
        try {
            const res = await axios.post(`${API}/auth/signup`, { email, password })
            login({ id: res.data.user_id, email: res.data.email }, res.data.access_token)
            navigate('/')
        } catch (e) {
            setError(e.response?.data?.detail || 'Signup failed. Try a different email.')
        } finally {
            setLoading(false)
        }
    }

    const inputFocus = e => e.target.style.borderColor = 'var(--accent)'
    const inputBlur = e => e.target.style.borderColor = 'var(--border)'

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.logo}>
                    <div style={styles.logoIcon}>⚡</div>
                    <span style={styles.logoText}>AnomalyDetect</span>
                </div>

                <h1 style={styles.heading}>Create account</h1>
                <p style={styles.sub}>Start detecting anomalies in your spending</p>

                {error && <div style={styles.error}>{error}</div>}
                {success && <div style={styles.success}>{success}</div>}

                <label style={styles.label}>Email</label>
                <input style={styles.input} type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onFocus={inputFocus} onBlur={inputBlur} />

                <label style={styles.label}>Password</label>
                <input style={styles.input} type="password" placeholder="Min. 6 characters"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onFocus={inputFocus} onBlur={inputBlur} />

                <label style={styles.label}>Confirm password</label>
                <input style={styles.input} type="password" placeholder="Repeat password"
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    onFocus={inputFocus} onBlur={inputBlur}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

                <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
                    onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Creating account...' : 'Create account'}
                </button>

                <p style={styles.footer}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
                </p>
            </div>
        </div>
    )
}
