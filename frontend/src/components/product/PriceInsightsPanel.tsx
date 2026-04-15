"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  getPriceHistory,
  getPriceRecommendation,
  getAIAnalysis,
} from "@/services/price-tracking.service";
import type { PriceHistory, PriceRecommendation } from "@/types/price-tracking";
import type { PriceTrackingAIAnalysis } from "@/services/price-tracking.service";
import { PriceAlertForm } from "./PriceAlertForm";

type PriceInsightsPanelProps = {
  productId: string;
  className?: string;
  initialAIAnalysis?: PriceTrackingAIAnalysis | null;
};

type RangeFilter = "30d" | "90d";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function formatRs(value: number) {
  return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getConfidenceTone(confidence: string) {
  if (confidence === "high") {
    return {
      badge: "bg-[#dff5ee] text-[#1f5449] border-[#8fd4bf]",
      bar: "bg-[#5fd0b8]",
    };
  }

  if (confidence === "medium") {
    return {
      badge: "bg-[#f5eedb] text-[#7f5417] border-[#e7c37c]",
      bar: "bg-[#f0b64d]",
    };
  }

  return {
    badge: "bg-[#efdfdf] text-[#8a4747] border-[#e0b3b3]",
    bar: "bg-[#dd8c8c]",
  };
}

function getVerdictTint(verdict: string) {
  if (verdict.toLowerCase().includes("buy")) {
    return {
      pill: "bg-[#dff5ee] text-[#1f5449]",
    };
  }

  if (verdict.toLowerCase().includes("wait")) {
    return {
      pill: "bg-[#f5eedb] text-[#7f5417]",
    };
  }

  return {
    pill: "bg-white/10 text-white",
  };
}

function DropGauge({ value }: { value: number }) {
  const percent = clamp(value, 0, 100);
  const angle = 180 - (percent / 100) * 180;
  const radians = (angle * Math.PI) / 180;
  const needleX = 100 + Math.cos(radians) * 58;
  const needleY = 100 - Math.sin(radians) * 58;

  return (
    <div className="relative mx-auto h-36 w-full max-w-60">
      <svg viewBox="0 0 200 120" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="gaugeTrack" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f29a98" />
            <stop offset="33%" stopColor="#f0b04d" />
            <stop offset="66%" stopColor="#85d8a6" />
            <stop offset="100%" stopColor="#59d0b8" />
          </linearGradient>
        </defs>
        <path
          d="M 30 100 A 70 70 0 0 1 170 100"
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 30 100 A 70 70 0 0 1 170 100"
          fill="none"
          stroke="url(#gaugeTrack)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * 220} 220`}
        />
        <line
          x1="100"
          y1="100"
          x2={needleX}
          y2={needleY}
          stroke="#f7f2e8"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="5.5" fill="#f7f2e8" />
      </svg>
    </div>
  );
}

export function PriceInsightsPanel({
  productId,
  className,
  initialAIAnalysis = null,
}: PriceInsightsPanelProps) {
  const [recommendation, setRecommendation] =
    useState<PriceRecommendation | null>(null);
  const [historyData, setHistoryData] = useState<PriceHistory | null>(null);
  const [aiAnalysis, setAiAnalysis] =
    useState<PriceTrackingAIAnalysis | null>(initialAIAnalysis);
  const [isAIAnalysisLoading, setIsAIAnalysisLoading] =
    useState(!initialAIAnalysis);
  const [range, setRange] = useState<RangeFilter>("90d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialAIAnalysis) {
      setAiAnalysis(initialAIAnalysis);
      setIsAIAnalysisLoading(false);
    }
  }, [initialAIAnalysis]);

  const chartModel = useMemo(() => {
    const source = historyData?.graphData?.length
      ? historyData.graphData
      : historyData?.history || [];
    if (source.length < 2) {
      return null;
    }

    const now = Date.now();
    const rangeDays = range === "30d" ? 30 : 90;
    const cutoffTime = now - rangeDays * 24 * 60 * 60 * 1000;

    const normalizedSource = source
      .map((point) => ({
        price: Number(point.price),
        date: point.date,
        timestamp: new Date(point.date).getTime(),
      }))
      .filter((point) => Number.isFinite(point.price));

    const filtered = normalizedSource.filter(
      (point) =>
        Number.isFinite(point.timestamp) && point.timestamp >= cutoffTime
    );

    const chartPointsSource =
      filtered.length >= 2
        ? filtered
        : normalizedSource.slice(-Math.min(8, normalizedSource.length));
    if (chartPointsSource.length < 2) {
      return null;
    }

    const prices = chartPointsSource.map((point) => point.price);
    const labels = chartPointsSource.map((point) => {
      const parsedDate = new Date(point.date);
      if (Number.isNaN(parsedDate.getTime())) return "N/A";
      return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
    });
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const startPrice = chartPointsSource[0].price;
    const endPrice = chartPointsSource[chartPointsSource.length - 1].price;
    const trendPercent =
      ((endPrice - startPrice) / Math.max(startPrice, 1)) * 100;

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
          label: "Price",
          data: chartModel.prices,
          fill: true,
          borderColor: "#5fd0b8",
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 3,
          tension: 0.35,
          backgroundColor: (context: ScriptableContext<"line">) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) {
              return "rgba(95, 208, 184, 0.18)";
            }

            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom
            );
            gradient.addColorStop(0, "rgba(95, 208, 184, 0.28)");
            gradient.addColorStop(1, "rgba(95, 208, 184, 0.04)");
            return gradient;
          },
        },
      ],
    };
  }, [chartModel]);

  const chartOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#171717",
          titleColor: "#f7f2e8",
          bodyColor: "#f7f2e8",
          borderColor: "rgba(255,255,255,0.12)",
          borderWidth: 1,
          displayColors: false,
          callbacks: {
            title: (items) => items[0]?.label || "",
            label: (item) => {
              const yValue =
                typeof item.parsed.y === "number" ? item.parsed.y : 0;
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
            color: "rgba(247, 242, 232, 0.65)",
            font: {
              size: 10,
            },
          },
        },
        y: {
          grid: {
            color: "rgba(255, 255, 255, 0.08)",
          },
          ticks: {
            color: "rgba(247, 242, 232, 0.65)",
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
        setError("");
        const [recommendationResult, historyResult] =
          await Promise.allSettled([
            getPriceRecommendation(productId),
            getPriceHistory(productId),
          ]);

        if (recommendationResult.status !== "fulfilled") {
          throw recommendationResult.reason;
        }

        if (!isCancelled) {
          setRecommendation(recommendationResult.value);
          setHistoryData(
            historyResult.status === "fulfilled" ? historyResult.value : null
          );
        }

        if (!initialAIAnalysis) {
          if (!isCancelled) {
            setIsAIAnalysisLoading(true);
          }

          getAIAnalysis(productId)
            .then((aiResult) => {
              if (!isCancelled) {
                setAiAnalysis(aiResult);
                setIsAIAnalysisLoading(false);
              }
            })
            .catch(() => {
              if (!isCancelled) {
                setAiAnalysis(null);
                setIsAIAnalysisLoading(false);
              }
            });
        } else if (!isCancelled) {
          setIsAIAnalysisLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to load price insights";
          setError(message);
          setIsAIAnalysisLoading(false);
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
      <div
        className={`rounded-[28px] border border-white/10 bg-[#232323] p-5 text-[#f6f3ec] ${className || "mt-6"}`}
      >
        <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.95fr]">
          <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="h-5 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="h-11 w-44 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-12 w-full animate-pulse rounded-2xl bg-white/10" />
          </div>
          <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="h-5 w-28 animate-pulse rounded-full bg-white/10" />
            <div className="h-28 animate-pulse rounded-3xl bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !recommendation) {
    return (
      <div
        className={`rounded-[28px] border border-white/10 bg-[#232323] p-5 text-[#f6f3ec] ${className || "mt-6"}`}
      >
        <p className="text-sm font-semibold">Price Intelligence</p>
        <p className="mt-2 text-xs text-[#d8d4cb]/75">
          {error || "Price insights not available right now."}
        </p>
      </div>
    );
  }

  const verdictTone = getVerdictTint(recommendation.verdict);
  const confidenceTone = getConfidenceTone(recommendation.confidence || "low");
  const currentPrice = recommendation.currentPrice;
  const averagePrice = historyData?.average_price ?? currentPrice;
  const lowestPrice = historyData?.lowest_price ?? currentPrice;
  const highestPrice = historyData?.highest_price ?? currentPrice;
  const priceVsAverage = averagePrice
    ? ((currentPrice - averagePrice) / averagePrice) * 100
    : 0;
  const priceVsLow = lowestPrice
    ? ((currentPrice - lowestPrice) / Math.max(lowestPrice, 1)) * 100
    : 0;
  const gaugeValue = clamp(recommendation.dropProbability, 0, 100);
  const gaugeLabel =
    gaugeValue >= 70 ? "strong" : gaugeValue >= 40 ? "moderate" : "weak";
  const liveInsight = isAIAnalysisLoading
    ? "Analyzing price trends..."
    : aiAnalysis?.aiExplanation || recommendation.reason;
  const normalizedInsight = liveInsight
    .replace(/lowest\s+ever/gi, "90-day low")
    .replace(/all[-\s]*time/gi, "90-day");
  const fairLowRaw = aiAnalysis?.fairRange?.low ?? averagePrice * 0.92;
  const fairHighRaw = aiAnalysis?.fairRange?.high ?? averagePrice * 1.08;
  const fairLow = Math.min(fairLowRaw, fairHighRaw);
  const fairHigh = Math.max(fairLowRaw, fairHighRaw);
  const domainLow = Math.min(lowestPrice, fairLow, currentPrice);
  const domainHigh = Math.max(highestPrice, fairHigh, currentPrice);
  const rangeSize = Math.max(domainHigh - domainLow, 1);
  const markerLeft = clamp(
    ((currentPrice - domainLow) / rangeSize) * 100,
    0,
    100
  );
  const fairStart = clamp(
    ((fairLow - domainLow) / rangeSize) * 100,
    0,
    100
  );
  const fairEnd = clamp(
    ((fairHigh - domainLow) / rangeSize) * 100,
    0,
    100
  );
  const fairBandWidth = Math.max(fairEnd - fairStart, 8);
  const tolerance = Math.max(averagePrice * 0.005, 1);
  const verdictLower = (recommendation.verdict || "").toLowerCase();
  const isCautiousVerdict =
    verdictLower.includes("wait") || verdictLower.includes("not ideal");
  const isBelowFairRange = currentPrice < fairLow - tolerance;
  const isAboveFairRange = currentPrice > fairHigh + tolerance;
  const isNearUpperFairRange =
    currentPrice >= fairHigh - tolerance && currentPrice <= fairHigh + tolerance;
  const isNearLowerFairRange =
    currentPrice <= fairLow + tolerance && currentPrice >= fairLow - tolerance;
  const fairRangeMessage = isBelowFairRange
    ? "Current price is below the fair range. This is an unusually strong deal based on recent price behavior."
    : isAboveFairRange
      ? "Current price is above the fair range. The chart suggests waiting for a better buying window."
      : isNearUpperFairRange
        ? "Current price is within the fair range but near its upper edge. Waiting may give a better entry."
        : isNearLowerFairRange
          ? "Current price is within the fair range and near its lower edge. This is a favorable buying zone."
      : isCautiousVerdict
        ? "Current price is within the fair range, but trend signals suggest waiting for a slightly better entry."
        : "Current price falls within the fair range. Not the 90-day low, but a strong deal based on recent history.";

  return (
    <div
      className={`rounded-[28px] border border-white/10 bg-[#232323] p-4.5 text-[#f6f3ec] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.75)] sm:p-5 ${className || "mt-6"}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.28em] text-[#d8d4cb]/65">
          Price Intelligence
        </p>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${confidenceTone.badge}`}
        >
          Signal: {recommendation.confidence}
        </span>
      </div>

      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4.5 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#d8d4cb]/65">
                Current Price
              </p>
              <div className="mt-1 flex flex-wrap items-end gap-2.5">
                <p className="text-[2.7rem] font-semibold leading-none tracking-tight text-[#f7f2e8] sm:text-[3rem]">
                  {formatRs(currentPrice)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5 pt-1 text-right">
              <span
                className={`rounded-full px-4.5 py-2 text-sm font-semibold leading-none ${verdictTone.pill}`}
              >
                {recommendation.verdict}
              </span>
              <span className="rounded-full border border-[#f2d3bd]/25 bg-[#f7eadf] px-4 py-1.5 text-xs font-semibold text-[#8d5d2b]">
                {Math.abs(priceVsAverage).toFixed(0)}% off average
              </span>
            </div>
          </div>

          <div className="mt-5 rounded-[22px] border border-white/10 bg-[#171717] p-4">
            <div className="flex items-start gap-3 rounded-[18px] border border-white/10 bg-white/5 p-3.25">
              <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dff5ee] text-[#1f5449]">
                <Image
                  src="/Copilot_20260405_163707.png"
                  alt="AI"
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
              </div>
              <p
                className={`text-sm leading-relaxed ${isAIAnalysisLoading ? "animate-pulse text-[#f1efe7]/80" : "text-[#f1efe7]"}`}
              >
                {normalizedInsight}
              </p>
            </div>

            <div className="mt-10 min-h-29.5 rounded-[18px] border border-white/10 bg-[#111111] p-4">
              <div className="grid min-h-20.5 grid-cols-3 items-stretch gap-3">
                <div className="flex h-full flex-col justify-start text-left">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#d8d4cb]/55">
                    90d Low
                  </p>
                  <p className="mt-1 text-base font-semibold text-[#59d0b8]">
                    {formatRs(lowestPrice)}
                  </p>
                </div>

                <div className="flex h-full translate-y-4 flex-col items-center justify-end text-center">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#d8d4cb]/55">
                    90d Average
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[#f7f2e8]">
                    {formatRs(averagePrice)}
                  </p>
                </div>

                <div className="flex h-full flex-col justify-start text-right">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#d8d4cb]/55">
                    90d High
                  </p>
                  <p className="mt-1 text-base font-semibold text-[#f28b82]">
                    {formatRs(highestPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4.5 sm:p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[#d8d4cb]/65">
            Drop Signal
          </p>
          <DropGauge value={gaugeValue} />
          <div className="-mt-1.5 text-center">
            <p className="text-[2rem] font-semibold text-[#f7f2e8]">
              {Math.round(gaugeValue)}%
            </p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#d8d4cb]/65">
              drop probability
            </p>
          </div>

          <div className="mt-4 space-y-3.5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[12px] text-[#d8d4cb]/75">
                <span>price vs average</span>
                <span
                  className={
                    priceVsAverage <= 0 ? "text-[#59d0b8]" : "text-[#f28b82]"
                  }
                >
                  {priceVsAverage > 0 ? "+" : ""}
                  {priceVsAverage.toFixed(0)}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${priceVsAverage <= 0 ? "bg-[#59d0b8]" : "bg-[#f28b82]"}`}
                  style={{
                    width: `${clamp(Math.abs(priceVsAverage) * 7, 18, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-[12px] text-[#d8d4cb]/75">
                <span>price vs 90d low</span>
                <span
                  className={
                    priceVsLow <= 0 ? "text-[#59d0b8]" : "text-[#f0b64d]"
                  }
                >
                  {priceVsLow > 0 ? "+" : ""}
                  {priceVsLow.toFixed(0)}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${priceVsLow <= 0 ? "bg-[#59d0b8]" : "bg-[#f0b64d]"}`}
                  style={{
                    width: `${clamp(Math.abs(priceVsLow) * 5, 18, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-[12px] text-[#d8d4cb]/75">
                <span>model confidence</span>
                <span className="capitalize text-[#f7f2e8]">{gaugeLabel}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${confidenceTone.bar}`}
                  style={{ width: `${clamp(gaugeValue, 28, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[28px] border border-white/10 bg-[#232323] p-3.5 sm:p-4.5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#d8d4cb]/65">
              Price History
            </p>
            <p className="mt-1 text-sm text-[#d8d4cb]/80">
              {range === "30d" ? "30-day trend" : "90-day trend"}
            </p>
          </div>
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1">
            {(["30d", "90d"] as RangeFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  range === item
                    ? "bg-[#e4572e] text-white shadow-[0_10px_24px_-18px_rgba(228,87,46,0.8)]"
                    : "text-[#d8d4cb]/75 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {chartModel ? (
          <div className="rounded-[22px] border border-white/10 bg-[#1b1b1b] p-3.5">
            <div className="relative h-52 overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,rgba(95,208,184,0.07)_0%,rgba(95,208,184,0)_100%)] p-2 sm:h-60">
              {chartData ? (
                <Line data={chartData} options={chartOptions} />
              ) : null}
            </div>
            <div className="mt-3.5 grid gap-2.5 text-sm text-[#f6f3ec] sm:grid-cols-3">
              <p>
                Trend:{" "}
                <span
                  className={`font-semibold ${chartModel.trendPercent <= 0 ? "text-[#59d0b8]" : "text-[#f28b82]"}`}
                >
                  {chartModel.trendPercent > 0 ? "+" : ""}
                  {chartModel.trendPercent.toFixed(1)}%
                </span>
              </p>
              <p>
                Low:{" "}
                <span className="font-semibold text-[#f7f2e8]">
                  {formatRs(chartModel.minPrice)}
                </span>
              </p>
              <p>
                High:{" "}
                <span className="font-semibold text-[#f7f2e8]">
                  {formatRs(chartModel.maxPrice)}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <p className="rounded-[22px] border border-dashed border-white/10 bg-white/5 p-4 text-sm text-[#d8d4cb]/75">
            Need more price history to render graph.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3.5 lg:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-[#232323] p-3.5 sm:p-4.5">
          <p className="text-xs uppercase tracking-[0.2em] text-[#d8d4cb]/65">
            Fair Price Range
          </p>
          <div className="mt-3.5 rounded-[22px] border border-white/10 bg-[#1b1b1b] p-3.5">
            <div className="relative h-3 rounded-full bg-white/10">
              <div
                className="absolute inset-y-0 rounded-full bg-[#78cbb6]"
                style={{ left: `${fairStart}%`, width: `${fairBandWidth}%` }}
              />
              <div
                className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[3px] border-[#1b1b1b] bg-[#78cbb6] shadow-[0_0_0_4px_rgba(120,203,182,0.18)]"
                style={{ left: `calc(${markerLeft}% - 10px)` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-[#f6f3ec]">
              <span>{formatRs(fairLow)}</span>
              <span className="font-semibold text-[#78cbb6]">
                {formatRs(currentPrice)} now
              </span>
              <span>{formatRs(fairHigh)}</span>
            </div>
          </div>
          <div className="mt-3.5 rounded-[20px] border border-white/8 bg-white/5 p-3 text-sm text-[#efece4]">
            {fairRangeMessage}
          </div>
        </div>

        <PriceAlertForm productId={productId} currentPrice={currentPrice} />
      </div>
    </div>
  );
}
