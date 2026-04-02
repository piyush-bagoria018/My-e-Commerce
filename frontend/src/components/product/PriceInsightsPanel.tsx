'use client';

import { useEffect, useMemo, useState } from 'react';
import {
CategoryScale,
Chart as ChartJS,
Filler,
Legend,
LineElement,
LinearScale,
PointElement,
Title,
Tooltip,
type ChartOptions,
type ScriptableContext,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getPriceHistory, getPriceRecommendation, getAIAnalysis } from '@/services/price-tracking.service';
import type { PriceHistory, PriceRecommendation } from '@/types/price-tracking';
import { PriceAlertForm } from './PriceAlertForm';

type PriceInsightsPanelProps = {
productId: string;
className?: string;
};

type RangeFilter = '30d' | '90d' | 'all';

type AIAnalysis = {
verdict: string;
dropProbability: number;
mlReason: string;
aiExplanation: string;
aiConfidence: string;
fairRange: { low: number; high: number };
currentPrice: number;
};

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function getConfidenceStyle(confidence: string) {
if (confidence === 'high') return 'bg-accent/10 text-accent border-accent/30';
if (confidence === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
return 'bg-slate-100 text-slate-700 border-slate-300';
}

function getVerdictStyle(verdict: string) {
if (verdict.toLowerCase().includes('buy')) return 'text-accent';
if (verdict.toLowerCase().includes('wait')) return 'text-amber-700';
return 'text-foreground';
}

export function PriceInsightsPanel({ productId, className }: PriceInsightsPanelProps) {
const [recommendation, setRecommendation] = useState<PriceRecommendation | null>(null);
const [historyData, setHistoryData] = useState<PriceHistory | null>(null);
const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
const [range, setRange] = useState<RangeFilter>('90d');
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

const chartModel = useMemo(() => {
const source = historyData?.graphData?.length ? historyData.graphData : historyData?.history || [];
if (source.length < 2) {
return null;
}

const now = Date.now();
const rangeDays = range === '30d' ? 30 : range === '90d' ? 90 : 10000;
const cutoffTime = now - rangeDays * 24 * 60 * 60 * 1000;

const normalizedSource = source
.map((point) => ({
price: Number(point.price),
date: point.date,
timestamp: new Date(point.date).getTime(),
}))
.filter((point) => Number.isFinite(point.price));

const filtered =
range === 'all'
? normalizedSource
: normalizedSource.filter((point) => Number.isFinite(point.timestamp) && point.timestamp >= cutoffTime);

const chartPointsSource = filtered.length >= 2 ? filtered : normalizedSource.slice(-Math.min(8, normalizedSource.length));
if (chartPointsSource.length < 2) {
return null;
}

const prices = chartPointsSource.map((point) => point.price);
const labels = chartPointsSource.map((point) => {
const parsedDate = new Date(point.date);
if (Number.isNaN(parsedDate.getTime())) return 'N/A';
return parsedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
});
const minPrice = Math.min(...prices);
const maxPrice = Math.max(...prices);

const startPrice = chartPointsSource[0].price;
const endPrice = chartPointsSource[chartPointsSource.length - 1].price;
const trendPercent = ((endPrice - startPrice) / Math.max(startPrice, 1)) * 100;

return {
labels,
prices,
trendPercent,
minPrice,
maxPrice,
};
}, [historyData, range]);

const chartData = useMemo(() => {
if (!chartModel) return null;

return {
labels: chartModel.labels,
datasets: [
{
label: 'Price',
data: chartModel.prices,
fill: true,
borderColor: '#ea5b2a',
pointRadius: 2,
pointHoverRadius: 4,
borderWidth: 3,
tension: 0.35,
backgroundColor: (context: ScriptableContext<'line'>) => {
const chart = context.chart;
const { ctx, chartArea } = chart;
if (!chartArea) {
return 'rgba(234, 91, 42, 0.14)';
}

const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
gradient.addColorStop(0, 'rgba(234, 91, 42, 0.28)');
gradient.addColorStop(1, 'rgba(234, 91, 42, 0.04)');
return gradient;
},
},
],
};
}, [chartModel]);

const chartOptions = useMemo<ChartOptions<'line'>>(
() => ({
responsive: true,
maintainAspectRatio: false,
interaction: {
mode: 'index',
intersect: false,
},
plugins: {
legend: {
display: false,
},
tooltip: {
displayColors: false,
callbacks: {
title: (items) => items[0]?.label || '',
label: (item) => {
const yValue = typeof item.parsed.y === 'number' ? item.parsed.y : 0;
return `Rs ${Math.round(yValue)}`;
},
},
},
},
scales: {
x: {
grid: {
display: false,
},
ticks: {
maxTicksLimit: 6,
color: '#72808d',
font: {
size: 10,
},
},
},
y: {
grid: {
color: 'rgba(114, 128, 141, 0.14)',
},
ticks: {
color: '#72808d',
font: {
size: 10,
},
callback: (value) => `Rs ${value}`,
},
},
},
}),
[]
);

useEffect(() => {
let isCancelled = false;

const loadRecommendation = async () => {
try {
setLoading(true);
setError('');
const [recommendationResult, historyResult, aiResult] = await Promise.allSettled([
getPriceRecommendation(productId),
getPriceHistory(productId),
getAIAnalysis(productId),
]);

if (recommendationResult.status !== 'fulfilled') {
throw recommendationResult.reason;
}

if (!isCancelled) {
setRecommendation(recommendationResult.value);
setHistoryData(historyResult.status === 'fulfilled' ? historyResult.value : null);
setAiAnalysis(aiResult.status === 'fulfilled' ? aiResult.value : null);
}
} catch (err) {
if (!isCancelled) {
const message = err instanceof Error ? err.message : 'Failed to load price insights';
setError(message);
}
} finally {
if (!isCancelled) {
setLoading(false);
}
}
};

loadRecommendation();

return () => {
isCancelled = true;
};
}, [productId]);

if (loading) {
return (
<div className={`rounded-xl border border-border bg-surface p-4 ${className || 'mt-6'}`}>
<p className="text-sm font-semibold">Price Insights</p>
<div className="mt-3 h-6 w-32 animate-pulse rounded bg-background" />
<div className="mt-2 h-4 w-full animate-pulse rounded bg-background" />
<div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-background" />
<div className="mt-4 h-28 animate-pulse rounded-lg bg-background" />
</div>
);
}

if (error || !recommendation) {
return (
<div className={`rounded-xl border border-border bg-surface p-4 ${className || 'mt-6'}`}>
<p className="text-sm font-semibold">Price Insights</p>
<p className="mt-2 text-xs text-muted">{error || 'Price insights not available right now.'}</p>
</div>
);
}

return (
<div className={`group rounded-xl border border-border bg-surface p-4 transition-shadow duration-300 hover:shadow-[0_10px_35px_-18px_rgba(14,165,233,0.45)] sm:p-5 ${className || 'mt-6'}`}>
<div className="flex flex-wrap items-center justify-between gap-3">
<p className="text-sm font-semibold">Price Insights</p>
<span
className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${getConfidenceStyle(
recommendation.confidence || 'low'
)}`}
>
Signal: {recommendation.confidence}
</span>
</div>

<p className={`mt-3 text-xl font-semibold ${getVerdictStyle(recommendation.verdict)}`}>
{recommendation.verdict}
</p>

{/* ML Reason */}
<p className="mt-1 text-sm text-muted">{recommendation.reason}</p>

{/* AI Explanation - Display prominently */}
{aiAnalysis?.aiExplanation && (
<div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
<p className="text-xs font-semibold text-primary/70 uppercase tracking-wide">AI Analysis</p>
<p className="mt-1 text-sm text-foreground">{aiAnalysis.aiExplanation}</p>
</div>
)}

<div className="mt-4 rounded-lg border border-border bg-background p-3">
<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
<p className="text-xs font-semibold uppercase tracking-wide text-muted">Price trend</p>
<div className="inline-flex items-center rounded-md border border-border bg-surface p-1">
{(['30d', '90d', 'all'] as RangeFilter[]).map((item) => (
<button
key={item}
type="button"
onClick={() => setRange(item)}
className={`rounded px-2 py-1 text-xs font-semibold transition ${
range === item
? 'bg-primary text-white'
: 'text-muted hover:text-foreground'
}`}
>
{item.toUpperCase()}
</button>
))}
</div>
</div>

{chartModel ? (
<div className="relative h-32 overflow-hidden rounded-md border border-border/70 bg-linear-to-b from-primary/5 to-transparent p-2">
{chartData ? <Line data={chartData} options={chartOptions} /> : null}
</div>
) : (
<p className="rounded-md border border-dashed border-border p-4 text-xs text-muted">
Need more price history to render graph.
</p>
)}

{chartModel ? (
<div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-3">
<p>
Trend:{' '}
<span className={`font-semibold ${chartModel.trendPercent <= 0 ? 'text-accent' : 'text-primary'}`}>
{chartModel.trendPercent > 0 ? '+' : ''}
{chartModel.trendPercent.toFixed(1)}%
</span>
</p>
<p>
Low: <span className="font-semibold text-foreground">Rs {Math.round(chartModel.minPrice)}</span>
</p>
<p>
High: <span className="font-semibold text-foreground">Rs {Math.round(chartModel.maxPrice)}</span>
</p>
</div>
) : null}
</div>

<div className="mt-4 grid gap-3 sm:grid-cols-2">
<div className="rounded-lg border border-border bg-background px-3 py-3">
<p className="text-[11px] uppercase tracking-wide text-muted">Drop Probability</p>
<p className="mt-1 text-lg font-semibold">{recommendation.dropProbability}%</p>
</div>
<div className="rounded-lg border border-border bg-background px-3 py-3">
<p className="text-[11px] uppercase tracking-wide text-muted">Fair Price Range</p>
<p className="mt-1 text-lg font-semibold">
Rs {recommendation.fairRange.low} - Rs {recommendation.fairRange.high}
</p>
</div>
</div>

<p className="mt-4 text-xs text-muted">
Current tracked price: <span className="font-semibold text-foreground">Rs {recommendation.currentPrice}</span>
</p>

<PriceAlertForm productId={productId} currentPrice={recommendation.currentPrice} />
</div>
);
}
