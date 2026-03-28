import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts'

const COLORS = ['#4f8ef7', '#30c07a', '#f0a030', '#f05a5a', '#a78bfa', '#64748b']

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '13px',
            color: 'var(--text)',
        }}>
            <p style={{ fontWeight: '600', marginBottom: '4px' }}>{label || payload[0]?.name}</p>
            <p style={{ color: 'var(--accent)' }}>₹{Math.round(payload[0]?.value).toLocaleString('en-IN')}</p>
        </div>
    )
}

export default function SpendingChart({ categoryBreakdown }) {
    const barData = Object.entries(categoryBreakdown)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value: Math.round(value) }))

    const pieData = barData.map(d => ({ name: d.name, value: d.value }))

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '1.5rem',
        }}>
            {/* Bar chart */}
            <div style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.1rem 1.25rem',
            }}>
                <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text2)', marginBottom: '1rem' }}>
                    Spending by category
                </p>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={110}
                            tick={{ fontSize: 12, fill: 'var(--text2)', fontFamily: 'DM Sans' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                            {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Donut chart */}
            <div style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.1rem 1.25rem',
            }}>
                <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text2)', marginBottom: '1rem' }}>
                    Category breakdown
                </p>
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="45%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                        >
                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: '12px', color: 'var(--text2)' }}
                            iconType="circle"
                            iconSize={8}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
