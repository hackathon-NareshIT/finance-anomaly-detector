import { useState, useRef } from 'react'

export default function UploadZone({ onUpload, loading }) {
    const [dragging, setDragging] = useState(false)
    const inputRef = useRef()

    const handleFile = (file) => {
        if (!file) return
        const name = file.name.toLowerCase()
        if (!name.endsWith('.csv') && !name.endsWith('.pdf')) {
            alert('Please upload a CSV or PDF file.')
            return
        }
        onUpload(file)
    }

    const onDrop = (e) => {
        e.preventDefault()
        setDragging(false)
        handleFile(e.dataTransfer.files[0])
    }

    return (
        <div
            onClick={() => !loading && inputRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            style={{
                border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border2)'}`,
                borderRadius: '16px',
                padding: '3rem 2rem',
                textAlign: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: dragging ? 'rgba(79,142,247,0.06)' : 'var(--bg2)',
                transition: 'all 0.2s',
            }}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".csv,.pdf"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])}
            />

            {loading ? (
                <>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚙️</div>
                    <p style={{
                        fontSize: '15px', fontWeight: '600',
                        color: 'var(--text)', marginBottom: '6px',
                    }}>
                        Analyzing your transactions...
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text2)' }}>
                        Running Isolation Forest — this takes a few seconds
                    </p>
                    <div style={{
                        margin: '16px auto 0', width: '200px', height: '3px',
                        background: 'var(--border)', borderRadius: '2px', overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%', width: '40%',
                            background: 'var(--accent)', borderRadius: '2px',
                            animation: 'slide 1.2s ease-in-out infinite',
                        }} />
                    </div>
                    <style>{`@keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(600%)} }`}</style>
                </>
            ) : (
                <>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📂</div>
                    <p style={{
                        fontSize: '15px', fontWeight: '600',
                        color: 'var(--text)', marginBottom: '6px',
                    }}>
                        Drop your bank statement here
                    </p>
                    <p style={{
                        fontSize: '13px', color: 'var(--text2)', marginBottom: '20px',
                    }}>
                        or click to browse — CSV and PDF both supported
                    </p>

                    {/* Format badges */}
                    <div style={{
                        display: 'flex', justifyContent: 'center',
                        flexWrap: 'wrap', gap: '8px', marginBottom: '20px',
                    }}>
                        {[
                            { label: 'PhonePe CSV', color: '#4f8ef7' },
                            { label: 'PhonePe PDF', color: '#4f8ef7' },
                            { label: 'HDFC CSV', color: '#30c07a' },
                            { label: 'SBI CSV', color: '#30c07a' },
                            { label: 'ICICI CSV', color: '#30c07a' },
                            { label: 'Generic PDF', color: '#f0a030' },
                        ].map(b => (
                            <span key={b.label} style={{
                                fontSize: '11px', padding: '3px 10px',
                                borderRadius: '99px',
                                border: `1px solid ${b.color}40`,
                                background: `${b.color}15`,
                                color: b.color,
                                fontWeight: '500',
                            }}>
                                {b.label}
                            </span>
                        ))}
                    </div>

                    <div style={{
                        display: 'inline-block', padding: '8px 20px',
                        background: 'var(--accent)', color: '#fff',
                        borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                    }}>
                        Choose file
                    </div>

                    {/* PhonePe format hint */}
                    <div style={{
                        marginTop: '20px',
                        background: 'var(--bg3)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        textAlign: 'left',
                        maxWidth: '480px',
                        margin: '20px auto 0',
                    }}>
                        <p style={{
                            fontSize: '12px', fontWeight: '600',
                            color: 'var(--text2)', marginBottom: '8px',
                        }}>
                            Expected column formats
                        </p>

                        {/* PhonePe format */}
                        <p style={{ fontSize: '11px', color: 'var(--accent)', marginBottom: '4px', fontWeight: '500' }}>
                            PhonePe CSV / PDF
                        </p>
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '4px', marginBottom: '10px',
                        }}>
                            {['Date', 'Transaction Details', 'Type', 'Amount'].map(col => (
                                <div key={col} style={{
                                    background: 'var(--bg2)', border: '1px solid var(--border)',
                                    borderRadius: '4px', padding: '4px 6px',
                                    fontSize: '10px', color: 'var(--text2)',
                                    textAlign: 'center',
                                }}>
                                    {col}
                                </div>
                            ))}
                        </div>

                        {/* Generic format */}
                        <p style={{ fontSize: '11px', color: '#30c07a', marginBottom: '4px', fontWeight: '500' }}>
                            Generic bank CSV / PDF
                        </p>
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '4px',
                        }}>
                            {['Date', 'Description / Narration', 'Amount / Debit'].map(col => (
                                <div key={col} style={{
                                    background: 'var(--bg2)', border: '1px solid var(--border)',
                                    borderRadius: '4px', padding: '4px 6px',
                                    fontSize: '10px', color: 'var(--text2)',
                                    textAlign: 'center',
                                }}>
                                    {col}
                                </div>
                            ))}
                        </div>

                        <p style={{
                            fontSize: '11px', color: 'var(--text3)',
                            marginTop: '8px', lineHeight: '1.5',
                        }}>
                            Only <strong style={{ color: 'var(--text2)' }}>Debit</strong> transactions
                            are analyzed. Credit/received entries are automatically skipped.
                        </p>
                    </div>
                </>
            )}
        </div>
    )
}