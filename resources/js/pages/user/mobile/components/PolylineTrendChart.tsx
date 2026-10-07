import React from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export interface ChartDataPoint {
    date: string;
    value: number;
    label?: string;
}

export interface PolylineTrendChartProps {
    data: ChartDataPoint[];
    startDateLabel?: string;
    endDateLabel?: string;
    valuePrefix?: string;
    valueSuffix?: string;
    height?: number;
}

export function PolylineTrendChart({
    data,
    startDateLabel,
    endDateLabel,
    valuePrefix = 'Rp ',
    valueSuffix = '',
    height = 175,
}: PolylineTrendChartProps) {
    if (!data || data.length === 0) {
        return (
            <div
                className="w-full flex items-center justify-center text-xs text-zinc-500 bg-white/50 rounded-2xl border border-dashed border-zinc-300"
                style={{ height }}
            >
                Data historis tidak tersedia
            </div>
        );
    }

    const firstPoint = data[0];
    const lastPoint = data[data.length - 1];

    const displayStart = startDateLabel || firstPoint?.date || '';
    const displayEnd = endDateLabel || lastPoint?.date || '';

    return (
        <div className="w-full select-none">
            <div style={{ width: '100%', height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="fintechChartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#059669" stopOpacity={0.22} />
                                <stop offset="100%" stopColor="#059669" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            stroke="#E4E4E7"
                            strokeDasharray="0"
                            vertical={true}
                            horizontal={false}
                        />

                        <XAxis dataKey="date" hide={true} />
                        <YAxis hide={true} domain={['auto', 'auto']} />

                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload as ChartDataPoint;
                                    const val = item.value;
                                    const formattedVal =
                                        typeof val === 'number'
                                            ? val.toLocaleString('id-ID', {
                                                  maximumFractionDigits: 2,
                                              })
                                            : val;

                                    return (
                                        <div className="bg-white rounded-xl px-2.5 py-1.5 shadow-md border border-zinc-200 text-center">
                                            <div className="text-[13px] font-bold text-zinc-900 font-sans tabular-nums leading-tight">
                                                {valuePrefix}
                                                {formattedVal}
                                                {valueSuffix}
                                            </div>
                                            <div className="text-[11px] text-zinc-500 mt-0.5 leading-none">
                                                {item.label || item.date}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        {/* Polyline Lurus (Linear, Tidak di-smooth) */}
                        <Area
                            type="linear"
                            dataKey="value"
                            stroke="#059669"
                            strokeWidth={2}
                            strokeLinejoin="round"
                            fill="url(#fintechChartGrad)"
                            dot={{
                                r: 3.5,
                                fill: '#FFFFFF',
                                stroke: '#059669',
                                strokeWidth: 2,
                            }}
                            activeDot={{
                                r: 5,
                                fill: '#059669',
                                stroke: '#FFFFFF',
                                strokeWidth: 3,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Sumbu X Awal & Akhir */}
            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 px-1 font-medium">
                <span>{displayStart}</span>
                <span>{displayEnd}</span>
            </div>
        </div>
    );
}

export default PolylineTrendChart;
