import { useState } from 'react'

const CAT_ICONS = {
    'Food & dining': '🍔',
    'Transport': '🚗',
    'Shopping': '🛒',
    'Entertainment': '🎬',
    'Utilities': '⚡',
    'Other': '💳',
}

function ScoreBadge({ score, isAnomaly }) {
    const safeScore = score ?? 0
    const color = safeScore >= 0.7 ? 'var(--danger)' : safeScore >= 0.4 ? 'var(--warning)' : 'var(--success)'
    const bg = safeScore >= 0.7 ? 'var(--danger-bg)' : safeScore >= 0.4 ? 'var(--warning-bg)' : 'var(--success-bg)'
    const label = safeScore >= 0.7 ? 'High risk' : safeScore >= 0.4 ? 'Watch' : 'Normal'
    return (
        <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '99px',
            background: bg,
            color,
            fontWeight: '500',
            fontFamily: 'var(--mono)',
            whiteSpace: 'nowrap',
        }}>
            {label} {safeScore.toFixed(2)}        </span>
    )
}

function TransactionRow({ txn }) {
    const [open, setOpen] = useState(false)

    return (
        <div style={{ marginBottom: '6px' }}>
            <div
                onClick={() => txn.is_anomaly && setOpen(o => !o)}
                onKeyDown={(e) => txn.is_anomaly && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen(o => !o))}
                tabIndex={txn.is_anomaly ? 0 : undefined}
                role={txn.is_anomaly ? 'button' : undefined}
                aria-expanded={txn.is_anomaly ? open : undefined}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    background: 'var(--bg2)',
                    border: `1px solid ${txn.is_anomaly ? 'var(--danger)' : 'var(--border)'}`,
                    borderLeft: txn.is_anomaly ? '3px solid var(--danger)' : '1px solid var(--border)',
                    borderRadius: txn.is_anomaly ? '0 10px 10px 0' : '10px',
                    cursor: txn.is_anomaly ? 'pointer' : 'default',
                    transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => txn.is_anomaly && (e.currentTarget.style.background = 'var(--bg3)')}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}            >
                <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', flexShrink: 0,
                }}>
                    {CAT_ICONS[txn.category] || '💳'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: '500', fontSize: '14px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {txn.merchant}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
                        {txn.category} · {txn.date}
                    </p>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{
                        fontWeight: '600', fontSize: '14px',
                        fontFamily: 'var(--mono)', marginBottom: '4px',
                    }}>
                        ₹{(txn.amount ?? 0).toLocaleString('en-IN')}
                    </p>
                <ScoreBadge score={txn.anomaly_score} isAnomaly={txn.is_anomaly} />
            </div>

            {txn.is_anomaly && (
                <div style={{ fontSize: '12px', color: 'var(--text3)', flexShrink: 0, marginLeft: '4px' }}>
                    {open ? '▲' : '▼'}
                </div>
            )}
        </div>

            {
        open && txn.reason && (
            <div style={{
                margin: '2px 0 0 4px',
                padding: '10px 14px',
                background: 'var(--warning-bg)',
                border: '1px solid var(--warning)',
                borderLeft: '3px solid var(--warning)',
                borderRadius: '0 8px 8px 0',
                fontSize: '13px',
                color: 'var(--text2)',
                lineHeight: '1.6',
            }}>
                ⚠ {txn.reason}
            </div>
        )
    }
        </div >
    )
}

export default function TransactionList({ transactions }) {
    const [filter, setFilter] = useState('all')

    const filtered = transactions.filter(t => {
        if (filter === 'anomaly') return t.is_anomaly
        if (filter === 'normal') return !t.is_anomaly
        return true
    })

    const anomalyCount = transactions.filter(t => t.is_anomaly).length

    const tabStyle = (active) => ({
        padding: '5px 14px',
        borderRadius: '99px',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'rgba(79,142,247,0.15)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text2)',
        fontSize: '13px',
        fontWeight: active ? '600' : '400',
        cursor: 'pointer',
        transition: 'all 0.15s',
    })

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>Transactions</h2>
                    {anomalyCount > 0 && (
                        <span style={{
                            fontSize: '11px', padding: '2px 8px', borderRadius: '99px',
                            background: 'var(--danger-bg)', color: 'var(--danger)', fontWeight: '600',
                        }}>
                            {anomalyCount} anomalies
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {['all', 'anomaly', 'normal'].map(f => (
                        <button key={f} style={tabStyle(filter === f)} onClick={() => setFilter(f)}>
                            {f === 'all' ? 'All' : f === 'anomaly' ? 'Anomalies' : 'Normal'}
                        </button>
                    ))}
                </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '10px' }}>
                Click any flagged transaction to see why it was detected
            </p>

            {filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text3)', padding: '2rem', fontSize: '14px' }}>
                    No transactions to show
                </p>
            ) : (
                filtered.map(txn => <TransactionRow key={txn.id} txn={txn} />)
            )}
        </div>
    )
}
