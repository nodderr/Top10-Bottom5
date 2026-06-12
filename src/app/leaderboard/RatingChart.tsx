'use client';

import { useMemo, useState, useRef, useEffect } from 'react';

export interface TimelinePoint {
  ts: string;
  rating: number;
  delta: number | null;
  roomCode: string;
  roundNumber: number;
}

interface Props {
  points: TimelinePoint[];
  baseline?: number;
}

const VB_W = 600;
const VB_H = 220;
const PAD_L = 40;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 22;

function formatTooltipDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RatingChart({ points, baseline = 1200 }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const geometry = useMemo(() => {
    if (points.length === 0) return null;
    const ratings = points.map((p) => p.rating);
    const minR = Math.min(...ratings, baseline);
    const maxR = Math.max(...ratings, baseline);
    // Pad the y-range so points don't sit on the edge
    const pad = Math.max(20, Math.round((maxR - minR) * 0.15));
    const yMin = minR - pad;
    const yMax = maxR + pad;
    const span = Math.max(1, yMax - yMin);

    const innerW = VB_W - PAD_L - PAD_R;
    const innerH = VB_H - PAD_T - PAD_B;

    // X positions: spread evenly by index. (Using index instead of time so a
    // burst of rounds isn't visually compressed; time labels still apply.)
    const n = points.length;
    const xs =
      n === 1
        ? [PAD_L + innerW / 2]
        : points.map((_, i) => PAD_L + (i / (n - 1)) * innerW);

    const ys = points.map((p) => PAD_T + innerH - ((p.rating - yMin) / span) * innerH);

    const baseY = PAD_T + innerH - ((baseline - yMin) / span) * innerH;

    const polyline = points.map((_, i) => `${xs[i]},${ys[i]}`).join(' ');

    // Find peak
    let peakIdx = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].rating > points[peakIdx].rating) peakIdx = i;
    }

    return { xs, ys, baseY, polyline, yMin, yMax, peakIdx };
  }, [points, baseline]);

  // Close tooltip when clicking outside the chart on touch devices
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setHoverIdx(null);
    }
    if (hoverIdx !== null) {
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }
  }, [hoverIdx]);

  if (points.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border)] bg-[var(--surface-2)] h-[220px] flex flex-col items-center justify-center gap-1.5">
        <p className="text-2xl">📈</p>
        <p className="text-sm font-display font-bold text-[var(--text-muted)] uppercase tracking-[0.18em]">
          No rated rounds yet
        </p>
      </div>
    );
  }

  const g = geometry!;
  const hovered = hoverIdx !== null ? points[hoverIdx] : null;
  const hoverX = hoverIdx !== null ? g.xs[hoverIdx] : 0;
  const hoverY = hoverIdx !== null ? g.ys[hoverIdx] : 0;

  // Translate SVG coords into container-percentage so the tooltip lines up
  // regardless of the rendered chart width.
  const tooltipLeftPct = (hoverX / VB_W) * 100;
  const tooltipTopPct = (hoverY / VB_H) * 100;

  // Y-axis labels: min, baseline, max
  const yLabels = [g.yMax, baseline, g.yMin];

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-auto block"
        preserveAspectRatio="none"
        role="img"
        aria-label="Rating over time"
      >
        {/* y-axis labels */}
        {yLabels.map((val) => {
          const y = PAD_T + (VB_H - PAD_T - PAD_B) * (1 - (val - g.yMin) / Math.max(1, g.yMax - g.yMin));
          return (
            <g key={val}>
              <line
                x1={PAD_L}
                x2={VB_W - PAD_R}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeWidth={val === baseline ? 1 : 0.5}
                strokeDasharray={val === baseline ? '3 4' : '1 5'}
                opacity={val === baseline ? 0.7 : 0.4}
              />
              <text
                x={PAD_L - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill="var(--text-muted)"
              >
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* Filled area under the line (subtle) */}
        <defs>
          <linearGradient id="rating-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--blue)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          fill="url(#rating-area)"
          points={`${g.xs[0]},${VB_H - PAD_B} ${g.polyline} ${g.xs[g.xs.length - 1]},${VB_H - PAD_B}`}
        />

        {/* Line */}
        <polyline
          points={g.polyline}
          fill="none"
          stroke="var(--blue)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Peak marker (only if more than 1 point) */}
        {points.length > 1 && (
          <g>
            <circle
              cx={g.xs[g.peakIdx]}
              cy={g.ys[g.peakIdx]}
              r={5}
              fill="var(--yellow)"
              stroke="var(--bg)"
              strokeWidth={1.5}
            />
            <text
              x={g.xs[g.peakIdx]}
              y={g.ys[g.peakIdx] - 9}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-display)"
              fontWeight="700"
              fill="var(--yellow)"
            >
              PEAK {points[g.peakIdx].rating}
            </text>
          </g>
        )}

        {/* Point dots + hit areas */}
        {points.map((_, i) => (
          <g key={i}>
            <circle
              cx={g.xs[i]}
              cy={g.ys[i]}
              r={hoverIdx === i ? 4 : 2.5}
              fill={hoverIdx === i ? 'var(--blue)' : 'var(--surface)'}
              stroke="var(--blue)"
              strokeWidth={1.5}
            />
            {/* Larger transparent hit area */}
            <circle
              cx={g.xs[i]}
              cy={g.ys[i]}
              r={12}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              onClick={() => setHoverIdx((c) => (c === i ? null : i))}
            />
          </g>
        ))}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)]"
          style={{ left: `${tooltipLeftPct}%`, top: `${tooltipTopPct}%` }}
        >
          <div className="bg-[var(--surface)] border border-[var(--border-strong)] shadow-[var(--shadow)] px-3 py-2 whitespace-nowrap">
            <p className="text-[10px] font-display font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {formatTooltipDate(hovered.ts)}
            </p>
            <p className="font-display font-extrabold text-base text-[var(--text)] tabular leading-tight mt-0.5">
              {hovered.rating}
              {hovered.delta != null && (
                <span
                  className={`ml-2 text-xs ${
                    hovered.delta > 0
                      ? 'text-[var(--success)]'
                      : hovered.delta < 0
                      ? 'text-[var(--danger)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {hovered.delta > 0 ? '+' : ''}
                  {hovered.delta}
                </span>
              )}
            </p>
            <p className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
              Room {hovered.roomCode} · R{hovered.roundNumber}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
