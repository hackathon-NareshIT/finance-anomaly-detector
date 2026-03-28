import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import UploadZone from '../components/UploadZone'
import MetricCards from '../components/MetricCards'
import SpendingChart from '../components/SpendingChart'
import TransactionList from '../components/TransactionList'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Navbar({ user, onLogout, onReset }) {
    return (
        <nav style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 2rem', height: '56px',
            background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
            position: 'sticky', top: 0, zIndex: 100,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '30px', height: '30px', background: 'var(--accent)',
                    borderRadius: '8px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '14px',
                }}>⚡</div>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>AnomalyDetect</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{user?.email}</span>

                {onReset && (
                    <button onClick={onReset} style={{
                        padding: '5px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        background: 'var(--bg3)',
                        color: 'var(--text2)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer'
                    }}>
                        New scan
                    </button>
                )}

                <button onClick={onLogout} style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: 'transparent',
                    color: 'var(--text3)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer'
                }}>
                    Logout
                </button>
            </div>
        </nav>
    )
}

export default function Dashboard() {
    const { user, token, logout } = useAuth()

    const [result, setResult] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')

    const handleReset = () => {
        setResult(null)
        setError('')
        setUploading(false)
    }

    const handleUpload = async (file) => {
        setUploading(true)
        setError('')

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await axios.post(`${API}/transactions/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            setResult(res.data)

        } catch (e) {
            const detail = e.response?.data?.detail

            const message = typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail.map(d => d.msg || d).join(', ')
                    : 'Upload failed. Please check your format.'

            setError(message)

        } finally {
            setUploading(false)
        }
    }

    return (
        <>
            <Navbar
                user={user}
                onLogout={logout}
                onReset={result ? handleReset : null}
            />

            <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>

                {!result ? (
                    <>
                        <div style={{ marginBottom: '2rem' }}>
                            <h1 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '8px' }}>
                                Finance Anomaly Detector
                            </h1>
                            <p style={{ fontSize: '15px', color: 'var(--text2)', maxWidth: '520px' }}>
                                Upload your bank transaction CSV or PDF and detect anomalies instantly.
                            </p>
                        </div>

                        {error && (
                            <div style={{
                                background: 'var(--danger-bg)',
                                border: '1px solid var(--danger)',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                fontSize: '14px',
                                color: 'var(--danger)',
                                marginBottom: '1.5rem',
                            }}>
                                ⚠ {error}
                            </div>
                        )}

                        <UploadZone onUpload={handleUpload} loading={uploading} />
                    </>
                ) : (
                    <>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '1.5rem',
                            flexWrap: 'wrap',
                            gap: '10px'
                        }}>
                            <div>
                                <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>
                                    Analysis complete
                                </h1>
                                <p style={{ fontSize: '14px', color: 'var(--text2)' }}>
                                    {result.anomaly_count > 0
                                        ? `Found ${result.anomaly_count} anomalies`
                                        : 'No anomalies detected'}
                                </p>
                            </div>

                            <button
                                onClick={handleReset}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    color: 'var(--text)',
                                    cursor: 'pointer'
                                }}
                            >
                                Upload another file
                            </button>
                        </div>

                        <MetricCards data={result} />
                        <SpendingChart categoryBreakdown={result.category_breakdown || {}} />
                        <TransactionList transactions={result.transactions || []} />
                    </>
                )}
            </main>
        </>
    )
}