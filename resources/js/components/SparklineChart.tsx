import React, { useId } from 'react';
import {
    Area,
    AreaChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export interface SparklineChartProps {
    prices: number[];
    labels?: string[];
    className?: string;
    showTooltip?: boolean;
    strokeColor?: string;
    gradientColor?: string;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
    prices,
    labels,
    className = 'w-24 h-10',
    showTooltip = false,
    strokeColor: customStroke,
    gradientColor: customGradient,
}) => {
    const rawId = useId();
    // Sanitize ID for SVG defs
    const gradientId = `sparkline-grad-${rawId.replace(/[^a-zA-Z0-9-_]/g, '')}`;

    if (!prices || prices.length === 0) {
        return (
            <div className={`flex items-center justify-center text-xs text-muted-foreground italic ${className}`}>
                -
            </div>
        );
    }

    const firstPrice = Number(prices[0]);
    const lastPrice = Number(prices[prices.length - 1]);
    const isPositive = lastPrice >= firstPrice;

    // If only 1 price is provided, duplicate it so Recharts can render a flat baseline
    const chartPrices = prices.length === 1 ? [prices[0], prices[0]] : prices;
    const data = chartPrices.map((price, index) => ({
        index,
        label: labels && labels[index] ? labels[index] : `Hari ${index + 1}`,
        price: Number(price),
    }));

    const strokeColor = customStroke || (isPositive ? '#10b981' : '#ef4444');
    const gradientColor = customGradient || (isPositive ? '#10b981' : '#ef4444');

    return (
        <div className={`relative block ${className}`} style={{ minWidth: '60px', minHeight: '28px' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={60} minHeight={28}>
                <AreaChart
                    data={data}
                    margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={gradientColor} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={gradientColor} stopOpacity={0.0} />
                        </linearGradient>
                    </defs>

                    <XAxis dataKey="index" hide />
                    <YAxis domain={['dataMin', 'dataMax']} hide />

                    <ReferenceLine
                        y={firstPrice}
                        stroke="#94a3b8"
                        strokeDasharray="3 3"
                        strokeOpacity={0.4}
                    />

                    {showTooltip && (
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload;
                                    return (
                                        <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 shadow-md text-xs">
                                            <p className="font-semibold text-foreground">{item.label}</p>
                                            <p className="text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-0.5">
                                                {item.price} Optimasi
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    )}

                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke={strokeColor}
                        strokeWidth={2}
                        fill={`url(#${gradientId})`}
                        isAnimationActive={false}
                        dot={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SparklineChart;
