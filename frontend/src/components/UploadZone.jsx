import { useState, useRef } from 'react'

export default function UploadZone({ onUpload, loading }) {
    const [dragging, setDragging] = useState(false)
    const inputRef = useRef()

    const handleFile = (file) => {
        if (!file) return
        if (!file.name.endsWith('.csv')) {
            alert('Please upload a CSV file.')
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
                accept=".csv"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])}
            />

            {loading ? (
                <>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚙️</div>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>
                        Analyzing your transactions...
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text2)' }}>
                        Running Isolation Forest — this takes a few seconds
                    </p>
                    <div style={{
                        margin: '16px auto 0',
                        width: '200px', height: '3px',
                        background: 'var(--border)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            width: '40%',
                            background: 'var(--accent)',
                            borderRadius: '2px',
                            animation: 'slide 1.2s ease-in-out infinite',
                        }} />
                    </div>
                    <style>{`@keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(600%)} }`}</style>
                </>
            ) : (
                <>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📂</div>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>
                        Drop your bank CSV here
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
                        or click to browse — supports any bank export format
                    </p>
                    <div style={{
                        display: 'inline-block',
                        padding: '8px 20px',
                        background: 'var(--accent)',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                    }}>
                        Choose CSV file
                    </div>
                    <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text3)' }}>
                        CSV must have: date, merchant/description, amount columns
                    </p>
                </>
            )}
        </div>
    )
}
