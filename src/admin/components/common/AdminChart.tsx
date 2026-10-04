import React, { useState } from 'react';
import { revenueTimeframes } from '../../data/adminMockData';

type Timeframe = 'today' | '7days' | '30days' | '12months';

export const AdminChart: React.FC = () => {
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('7days');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = revenueTimeframes[activeTimeframe];
  const maxRevenue = Math.max(...data.map((d) => d.revenue)) * 1.15;
  const minRevenue = Math.min(...data.map((d) => d.revenue)) * 0.85;

  // Chart Dimensions
  const width = 600;
  const height = 220;
  const paddingX = 40;
  const paddingY = 25;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((d.revenue - minRevenue) / (maxRevenue - minRevenue)) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  // SVG Path String
  const linePath = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  const totalTimeframeRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="bg-[#0e1219]/90 border border-white/5 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-base font-semibold text-white">Revenue Overview</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Total in period: <span className="font-semibold text-zinc-200">৳{totalTimeframeRevenue.toLocaleString()}</span>
          </p>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/5 rounded-xl self-start sm:self-auto">
          {(['today', '7days', '30days', '12months'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setActiveTimeframe(tf);
                setHoveredIndex(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTimeframe === tf
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tf === 'today' ? 'Today' : tf === '7days' ? '7 Days' : tf === '30days' ? '30 Days' : '12 Months'}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full h-[220px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = paddingY + pct * (height - paddingY * 2);
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#revenueGradient)" />

          {/* Stroke Line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#lineStroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Points */}
          {points.map((p, i) => (
            <g key={i} className="cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 6 : 4}
                className={`transition-all duration-200 ${
                  hoveredIndex === i
                    ? 'fill-rose-500 stroke-white stroke-2'
                    : 'fill-zinc-900 stroke-rose-400 stroke-2'
                }`}
                onMouseEnter={() => setHoveredIndex(i)}
              />
              {/* Invisible larger hover zone */}
              <circle
                cx={p.x}
                cy={p.y}
                r="18"
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          ))}
        </svg>

        {/* Tooltip Overlay */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100}%`
            }}
          >
            <div className="bg-[#121721] border border-rose-500/30 shadow-xl shadow-black/80 px-3 py-2 rounded-xl text-xs backdrop-blur-md">
              <div className="text-zinc-400 font-medium">{points[hoveredIndex].date}</div>
              <div className="text-rose-400 font-bold text-sm">
                ৳{points[hoveredIndex].revenue.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {points[hoveredIndex].transactions} transactions
              </div>
            </div>
          </div>
        )}
      </div>

      {/* X-Axis Labels */}
      <div className="flex justify-between items-center px-4 mt-3 text-[11px] font-mono text-zinc-500">
        {data.map((d, i) => (
          <span
            key={i}
            className={`${hoveredIndex === i ? 'text-rose-400 font-bold' : ''}`}
          >
            {d.date}
          </span>
        ))}
      </div>
    </div>
  );
};
