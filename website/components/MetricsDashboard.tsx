"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Clock,
  FileSpreadsheet,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

type TimeRange = "30d" | "quarterly" | "annual";

interface ChartPoint {
  label: string;
  value: number; // 0 - 100 scale for SVG curve
  displayVal: string;
  metric: string;
}

export function MetricsDashboard() {
  const [range, setRange] = useState<TimeRange>("30d");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Datasets for each toggle
  const datasets: Record<TimeRange, { title: string; color: string; gradientId: string; points: ChartPoint[]; highlight: string }> = {
    "30d": {
      title: "30-Day On-Premise Punctuality & Verification Rate",
      color: "#00E5FF",
      gradientId: "grad-30d",
      highlight: "Maximum Punctuality (+42% Efficiency)",
      points: [
        { label: "Day 01", value: 45, displayVal: "71.4%", metric: "Initial baseline pre-deployment" },
        { label: "Day 05", value: 58, displayVal: "80.2%", metric: "Kiosk terminal pairing active" },
        { label: "Day 10", value: 68, displayVal: "87.5%", metric: "Facial enrollment completed" },
        { label: "Day 15", value: 76, displayVal: "92.1%", metric: "Zero proxy check-ins detected" },
        { label: "Day 20", value: 85, displayVal: "96.4%", metric: "Break overstay alerts active" },
        { label: "Day 25", value: 92, displayVal: "98.1%", metric: "Automated penalty rules online" },
        { label: "Day 30", value: 96, displayVal: "99.2%", metric: "Reconciled Excel payroll generated" },
      ],
    },
    quarterly: {
      title: "Quarterly Workforce Compliance & Hour Recovery",
      color: "#10B981",
      gradientId: "grad-quarterly",
      highlight: "Peak Compliance (99.6% Attendance)",
      points: [
        { label: "Month 1 - W1", value: 50, displayVal: "74.8%", metric: "Manual logs phased out" },
        { label: "Month 1 - W3", value: 65, displayVal: "84.5%", metric: "Shift policies enforced" },
        { label: "Month 2 - W1", value: 75, displayVal: "91.0%", metric: "Break duration normalized" },
        { label: "Month 2 - W3", value: 84, displayVal: "95.6%", metric: "Department punctuality surge" },
        { label: "Month 3 - W1", value: 91, displayVal: "98.4%", metric: "Audit disputes reduced by 94%" },
        { label: "Month 3 - W4", value: 98, displayVal: "99.6%", metric: "Full enterprise automation" },
      ],
    },
    annual: {
      title: "Annual Cumulative Payroll Hours Protected",
      color: "#60A5FA",
      gradientId: "grad-annual",
      highlight: "+1,840 Cumulative Hours Saved",
      points: [
        { label: "Q1", value: 40, displayVal: "+240 hrs", metric: "First quarter ghost worker purge" },
        { label: "Q2", value: 62, displayVal: "+680 hrs", metric: "Break discipline optimization" },
        { label: "Q3", value: 82, displayVal: "+1,240 hrs", metric: "Automated dispute resolution" },
        { label: "Q4", value: 97, displayVal: "+1,840 hrs", metric: "Audited payroll integrity achieved" },
      ],
    },
  };

  const currentData = datasets[range];
  const points = currentData.points;

  // Generate SVG smooth bezier curve coordinates
  const svgWidth = 800;
  const svgHeight = 240;
  const paddingX = 40;
  const paddingY = 30;

  const coords = points.map((p, i) => {
    const x = paddingX + (i / (points.length - 1)) * (svgWidth - paddingX * 2);
    // Invert y because SVG y=0 is top
    const y = svgHeight - paddingY - (p.value / 100) * (svgHeight - paddingY * 2);
    return { x, y, ...p };
  });

  // Construct smooth cubic bezier path
  const buildSmoothPath = () => {
    if (coords.length === 0) return "";
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = i > 0 ? coords[i - 1] : coords[i];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = i < coords.length - 2 ? coords[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = buildSmoothPath();
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${svgHeight} L ${coords[0].x} ${svgHeight} Z`;

  const kpis = [
    {
      value: "+98%",
      label: "Attendance Accuracy",
      detail: "Eliminates buddy-punching & logbook forgery",
      icon: ShieldCheck,
      color: "text-cyan-400",
      border: "border-cyan-400/20",
    },
    {
      value: "-85%",
      label: "Buddy Punching & Lateness",
      detail: "Enforced via strict grace periods & break alarms",
      icon: TrendingUp,
      color: "text-sky-400",
      border: "border-sky-400/20",
    },
    {
      value: "< 2s",
      label: "Biometric Kiosk Punch",
      detail: "Sub-second facial scan on paired terminals",
      icon: Zap,
      color: "text-amber-400",
      border: "border-amber-400/20",
    },
    {
      value: "100%",
      label: "Verified Payroll Export",
      detail: "1-Click direct Microsoft Excel & CSV download",
      icon: FileSpreadsheet,
      color: "text-emerald-400",
      border: "border-emerald-400/20",
    },
  ];

  const activeHover = hoveredIdx !== null ? coords[hoveredIdx] : coords[coords.length - 1];

  return (
    <section id="results" className="py-20 sm:py-28 bg-[#090A0F] text-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 relative z-10 space-y-14 sm:space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-mono font-medium text-sky-300">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>Results & Measurable ROI</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-tight leading-[1.18]">
              Eliminate Time-Theft and Automate{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                Shift Compliance
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Empirical data collected from corporate offices, medical facilities, educational institutions, and manufacturing sites using TimeLogic hardware-anchored attendance.
            </p>
          </div>

          {/* Timeframe Toggle Buttons */}
          <div className="flex items-center p-1 rounded-full bg-[#0E121B] border border-white/[0.08] self-start md:self-auto shadow-sm">
            <button
              type="button"
              onClick={() => {
                setRange("30d");
                setHoveredIdx(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-mono font-semibold transition-all ${
                range === "30d"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => {
                setRange("quarterly");
                setHoveredIdx(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-mono font-semibold transition-all ${
                range === "quarterly"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Quarterly
            </button>
            <button
              type="button"
              onClick={() => {
                setRange("annual");
                setHoveredIdx(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-mono font-semibold transition-all ${
                range === "annual"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Annual
            </button>
          </div>
        </div>

        {/* ── Interactive SVG Area Curve Chart ── */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0E121B] p-5 sm:p-8 shadow-xl relative overflow-hidden">
          {/* Chart Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
            <div className="space-y-1">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                {currentData.title}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {activeHover.displayVal}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-400/25 text-sky-300 text-xs font-mono flex items-center gap-1">
                  <ArrowUpRight size={13} />
                  {currentData.highlight}
                </span>
              </div>
            </div>

            {/* Dynamic Telemetry Tooltip */}
            <div className="bg-[#141824] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs font-mono shadow-sm self-start sm:self-auto">
              <div className="text-slate-400 text-[10px] uppercase">
                Active Telemetry Node · {activeHover.label}
              </div>
              <div className="text-sky-300 font-semibold mt-0.5">
                {activeHover.metric}
              </div>
            </div>
          </div>

          {/* SVG Area Curve */}
          <div className="mt-6 relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id={currentData.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={currentData.color} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={currentData.color} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                const y = paddingY + frac * (svgHeight - paddingY * 2);
                return (
                  <line
                    key={idx}
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Area Gradient Fill */}
              <path d={areaPath} fill={`url(#${currentData.gradientId})`} />

              {/* Line Curve */}
              <path
                d={linePath}
                fill="none"
                stroke={currentData.color}
                strokeWidth="3.2"
                strokeLinecap="round"
                filter="drop-shadow(0 0 10px rgba(0, 229, 255, 0.5))"
              />

              {/* Data Points */}
              {coords.map((pt, idx) => {
                const isHovered = hoveredIdx === idx || (hoveredIdx === null && idx === coords.length - 1);
                return (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                  >
                    {/* Invisible larger hover hit area */}
                    <circle cx={pt.x} cy={pt.y} r={18} fill="transparent" />
                    
                    {/* Outer glow ring when hovered */}
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={9}
                        fill="none"
                        stroke={currentData.color}
                        strokeWidth="2"
                        className="animate-ping opacity-75"
                      />
                    )}

                    {/* Inner solid point */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? "#ffffff" : currentData.color}
                      stroke={isHovered ? currentData.color : "#07090E"}
                      strokeWidth={2}
                      className="transition-all duration-200"
                    />

                    {/* Point Label underneath */}
                    <text
                      x={pt.x}
                      y={svgHeight - 6}
                      textAnchor="middle"
                      fill={isHovered ? "#ffffff" : "#94a3b8"}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight={isHovered ? "bold" : "normal"}
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Hover over any data point on the curve to inspect verified milestones</span>
            <span className="hidden sm:inline text-cyan-400 font-medium">Tamper-Proof Audit Sync: 100%</span>
          </div>
        </div>

        {/* ── 4 Live KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-xl bg-[#0E121B] border border-white/[0.08] shadow-xs space-y-3 transition-transform hover:-translate-y-0.5 duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${kpi.color}`}>
                    {kpi.value}
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center text-slate-300">
                    <Icon size={18} />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {kpi.label}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {kpi.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
