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
                        padding: '5px 12px', borderRadius: '8px', fontSize: '13px',
                        background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)',
                    }}>
                        New scan
                    </button>
                )}
                <button onClick={onLogout} style={{
                    padding: '5px 12px', borderRadius: '8px', fontSize: '13px',
                    background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border)',
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

    const handleUpload = async (file) => {
        setUploading(true)
        setError('')
        const formData = new FormData()
        formData.append('file', file)
        try {
            const res = await axios.post(`${API}/transactions/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            })
            setResult(res.data)
        } catch (e) {
            setError(e.response?.data?.detail || 'Upload failed. Please check your CSV format.')
        } finally {
            setUploading(false)
        }
    }

    return (
        <>
            <Navbar user={user} onLogout={logout} onReset={result ? () => setResult(null) : null} />

            <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>

                {!result ? (
                    <>
                        <div style={{ marginBottom: '2rem' }}>
                            <h1 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '8px' }}>
                                Personal Finance Anomaly Detector
                            </h1>
                            <p style={{ fontSize: '15px', color: 'var(--text2)', maxWidth: '520px' }}>
                                Upload your bank transaction CSV and our Isolation Forest ML model will flag unusual spending patterns with human-readable explanations.
                            </p>
                        </div>

                        {error && (
                            <div style={{
                                background: 'var(--danger-bg)', border: '1px solid var(--danger)',
                                borderRadius: '10px', padding: '12px 16px', fontSize: '14px',
                                color: 'var(--danger)', marginBottom: '1.5rem',
                            }}>
                                ⚠ {error}
                            </div>
                        )}

                        <UploadZone onUpload={handleUpload} loading={uploading} />

                        <div style={{ marginTop: '2rem', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text2)', marginBottom: '10px' }}>
                                Expected CSV format
                            </p>
                            <code style={{
                                display: 'block', fontSize: '12px', fontFamily: 'var(--mono)',
                                color: 'var(--text2)', background: 'var(--bg3)', padding: '12px',
                                borderRadius: '8px', lineHeight: '1.8',
                            }}>
                                date,merchant,amount<br />
                                2026-03-01,Zomato,320<br />
                                2026-03-02,Amazon,8200<br />
                                2026-03-03,Uber,180
                            </code>
                            <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>
                                Column names are flexible — date/txn date, merchant/description/narration, amount/debit all work.
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                                <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>Analysis complete</h1>
                                <p style={{ fontSize: '14px', color: 'var(--text2)' }}>
                                    {result.anomaly_count > 0
                                        ? `Found ${result.anomaly_count} anomalous transaction${result.anomaly_count > 1 ? 's' : ''} — click flagged rows to see explanations`
                                        : 'No anomalies detected — your spending looks normal!'}
                                </p>
                            </div>
                            <span style={{
                                padding: '6px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '600',
                                background: result.anomaly_count > 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
                                color: result.anomaly_count > 0 ? 'var(--danger)' : 'var(--success)',
                                border: `1px solid ${result.anomaly_count > 0 ? 'var(--danger)' : 'var(--success)'}`,
                            }}>
                                {result.anomaly_count > 0 ? `⚠ ${result.anomaly_count} anomalies` : '✓ All clear'}
                            </span>
                        </div>

                        <MetricCards data={result} />
                        <SpendingChart categoryBreakdown={result.category_breakdown} />
                        <TransactionList transactions={result.transactions} />
                    </>
                )}
            </main>
        </>
    )
}
