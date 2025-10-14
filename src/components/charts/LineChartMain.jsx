import React from 'react'
import {
LineChart,
Line,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
ResponsiveContainer,
} from 'recharts'


export default function LineChartMain({ data }) {
return (
<ResponsiveContainer width="100%" height={320}>
<LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
<CartesianGrid strokeDasharray="3 3" stroke="#E6E6E6" />
<XAxis dataKey="day" tick={{ fontSize: 11 }} />
<YAxis tickFormatter={(v) => `${v >= 1000000 ? v / 1000000 + 'M' : v}`}/>
<Tooltip formatter={(value) => new Intl.NumberFormat().format(value)} />
<Line type="monotone" dataKey="deposit" stroke="#60A5FA" strokeWidth={2} dot={false} />
</LineChart>
</ResponsiveContainer>
)
}