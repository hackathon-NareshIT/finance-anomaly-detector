const card = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '1.1rem 1.25rem',
}

export default function MetricCards({ data }) {
    const metrics = [
        {
            label: 'Total spent',
            value: `₹${data.total_spent.toLocaleString('en-IN')}`,
            sub: `${data.total_transactions} transactions`,
            color: 'var(--text)',
        },
        {
            label: 'Avg transaction',
            value: `₹${Math.round(data.avg_transaction).toLocaleString('en-IN')}`,
            sub: 'Per transaction',
            color: 'var(--text)',
        },
        {
            label: 'Anomalies flagged',
            value: data.anomaly_count,
            sub: `${((data.anomaly_count / data.total_transactions) * 100).toFixed(1)}% of transactions`,
            color: data.anomaly_count > 0 ? 'var(--danger)' : 'var(--success)',
        },
        {
            label: 'Top category',
            value: (() => {
                const entries = Object.entries(data.category_breakdown)
                if (!entries.length) return '—'
                return entries.sort((a, b) => b[1] - a[1])[0][0]
            })(),
            sub: (() => {
                const entries = Object.entries(data.category_breakdown)
                if (!entries.length) return ''
                const top = entries.sort((a, b) => b[1] - a[1])[0]
                return `₹${Math.round(top[1]).toLocaleString('en-IN')} spent`
            })(),
            color: 'var(--accent)',
        },
    ]

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginBottom: '1.5rem',
        }}>
            {metrics.map((m, i) => (
                <div key={i} style={card}>
                    <p style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '500', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {m.label}
                    </p>
                    <p style={{ fontSize: '22px', fontWeight: '600', color: m.color, marginBottom: '3px' }}>
                        {m.value}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text2)' }}>{m.sub}</p>
                </div>
            ))}
        </div>
    )
}
