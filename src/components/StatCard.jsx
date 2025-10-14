import React from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'


export default function StatCard({ title, value, smallData }) {
return (
<div className="bg-white rounded-lg p-4 shadow-sm h-full flex flex-col justify-between">
<div className="flex items-start gap-3">
<div className="w-10 h-10 rounded-md bg-indigo-50 flex items-center justify-center">
<svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
</svg>
</div>
<div>
<div className="text-xs text-slate-400">{title}</div>
<div className="text-2xl font-semibold">{value}</div>
</div>
</div>


<div className="mt-3 w-full" style={{ height: 46 }}>
<ResponsiveContainer width="100%" height={46}>
<LineChart data={smallData}>
<Line type="monotone" dataKey="v" stroke="#60A5FA" strokeWidth={2} dot={false} />
</LineChart>
</ResponsiveContainer>
</div>
</div>
)
}