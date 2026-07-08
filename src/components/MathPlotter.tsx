/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { Activity, Plus, Minus, RotateCcw, Sparkles, RefreshCw, AlertCircle, Info, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { calculate, formatFormulaForDisplay } from "../utils/mathEngine";

interface MathPlotterProps {
  calculatorValue: string;
  isDegrees: boolean;
  triggerVibration: () => void;
}

interface PlotPoint {
  x: number;
  y: number;
}

const PRESET_FUNCTIONS = [
  { label: "sin(x)", formula: "sin(x)" },
  { label: "cos(x)", formula: "cos(x)" },
  { label: "tan(x)", formula: "tan(x)" },
  { label: "Parabola", formula: "x^2 - 4" },
  { label: "Cubic", formula: "0.1x^3 - x" },
  { label: "Hyperbola", formula: "1 / x" },
  { label: "Square Root", formula: "sqrt(x)" },
  { label: "Gaussian", formula: "e^(-(x^2))" },
];

export default function MathPlotter({
  calculatorValue,
  isDegrees,
  triggerVibration,
}: MathPlotterProps) {
  const [expression, setExpression] = useState<string>("sin(x)");
  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const [yMin, setYMin] = useState<number>(-10);
  const [yMax, setYMax] = useState<number>(10);
  
  // Dimensions for responsive canvas
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState<number>(500);
  const [height, setHeight] = useState<number>(320);

  // Hover states
  const [hoverData, setHoverData] = useState<{ x: number; y: number; screenX: number; screenY: number } | null>(null);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [plotError, setPlotError] = useState<string | null>(null);

  // ResizeObserver for fluid SVG scaling
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: entryWidth } = entry.contentRect;
        setWidth(entryWidth);
        // Keep a 1.6 ratio or clamp
        setHeight(Math.max(280, Math.min(360, entryWidth * 0.6)));
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Try to pre-populate with calculator value if it contains "x" or looks like an expression
  const handleImportFromCalculator = () => {
    triggerVibration();
    // Clean formula of visual spaces or '='
    const cleaned = calculatorValue.replace(/=/g, "").trim();
    if (cleaned && cleaned !== "0" && cleaned !== "Error") {
      setExpression(cleaned);
      setPlotError(null);
    }
  };

  // Generate plotting points
  const points: PlotPoint[] = [];
  const samples = 300;
  const step = (xMax - xMin) / samples;

  let hasValidPoint = false;
  let testError: string | null = null;

  // We sample 300 points to build a high-resolution graph line
  for (let i = 0; i <= samples; i++) {
    const x = xMin + i * step;
    try {
      const y = calculate(expression, isDegrees, x);
      if (!isNaN(y) && isFinite(y)) {
        points.push({ x, y });
        hasValidPoint = true;
      }
    } catch (err: any) {
      testError = err.message || "Invalid syntax";
    }
  }

  // Update error message state based on plotting success
  useEffect(() => {
    if (!hasValidPoint && expression.trim() !== "") {
      setPlotError(testError || "No plottable coordinates found in range.");
    } else {
      setPlotError(null);
    }
  }, [expression, xMin, xMax, isDegrees]);

  // Handle Preset Clicks
  const handlePresetSelect = (presetFormula: string) => {
    triggerVibration();
    setExpression(presetFormula);
    setPlotError(null);
    // Auto-adjust range for specific functions
    if (presetFormula === "sqrt(x)") {
      setXMin(-2);
      setXMax(12);
      setYMin(-2);
      setYMax(5);
    } else if (presetFormula === "e^(-(x^2))") {
      setXMin(-4);
      setXMax(4);
      setYMin(-0.5);
      setYMax(1.5);
    } else {
      setXMin(-10);
      setXMax(10);
      setYMin(-10);
      setYMax(10);
    }
  };

  // Reset range defaults
  const handleResetRange = () => {
    triggerVibration();
    setXMin(-10);
    setXMax(10);
    setYMin(-10);
    setYMax(10);
  };

  const handleZoom = (factor: number) => {
    triggerVibration();
    const xCenter = (xMin + xMax) / 2;
    const yCenter = (yMin + yMax) / 2;
    const xHalfRange = ((xMax - xMin) / 2) * factor;
    const yHalfRange = ((yMax - yMin) / 2) * factor;

    setXMin(parseFloat((xCenter - xHalfRange).toFixed(2)));
    setXMax(parseFloat((xCenter + xHalfRange).toFixed(2)));
    setYMin(parseFloat((yCenter - yHalfRange).toFixed(2)));
    setYMax(parseFloat((yCenter + yHalfRange).toFixed(2)));
  };

  // SVG margins
  const margin = { top: 20, right: 25, bottom: 25, left: 35 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // D3 Scales
  const xScale = d3.scaleLinear().domain([xMin, xMax]).range([margin.left, width - margin.right]);
  const yScale = d3.scaleLinear().domain([yMin, yMax]).range([height - margin.bottom, margin.top]);

  // Generate gridline ticks
  const xTicks = xScale.ticks(10);
  const yTicks = yScale.ticks(8);

  // Generate line path using D3 Line Generator
  const lineGenerator = d3
    .line<PlotPoint>()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y))
    .defined((d) => !isNaN(d.y) && isFinite(d.y) && d.y >= yMin - 5 && d.y <= yMax + 5);

  const pathD = hasValidPoint ? lineGenerator(points) || "" : "";

  // Interactive mouse move over SVG
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current || points.length === 0) return;
    
    setIsHovering(true);
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;

    // Convert screen pixel coordinate back to math x value
    const mathX = xScale.invert(mouseX);

    // Find the closest sampled point in our array to the hovered x
    let closestPoint: PlotPoint = points[0];
    let minDiff = Math.abs(points[0].x - mathX);

    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(points[i].x - mathX);
      if (diff < minDiff) {
        minDiff = diff;
        closestPoint = points[i];
      }
    }

    // Now convert back to screen coordinate for the exact circle position
    const screenX = xScale(closestPoint.x);
    const screenY = yScale(closestPoint.y);

    setHoverData({
      x: closestPoint.x,
      y: closestPoint.y,
      screenX,
      screenY,
    });
  };

  return (
    <div className="flex flex-col gap-5" id="math-plotter-panel">
      
      {/* Top Title/Action Row */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-slate-400">
          <Activity className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-sm tracking-tight text-zinc-700 dark:text-slate-300">
            2D Math Function Plotter (D3 Engine)
          </span>
        </div>
        
        <button
          onClick={handleImportFromCalculator}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-blue-200/30"
          title="Import active expression from Scientific Engine"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Import Formula</span>
        </button>
      </div>

      {/* Input row */}
      <div className="flex flex-col gap-2">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-slate-500">
          Function Equation: $y = f(x)$
        </label>
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-zinc-50 dark:bg-slate-900/60 border border-zinc-200/50 dark:border-slate-800/60 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all">
          <span className="text-sm font-bold text-zinc-400 dark:text-slate-500 font-mono">y =</span>
          <input
            type="text"
            value={expression}
            onChange={(e) => {
              setExpression(e.target.value);
              setPlotError(null);
            }}
            className="flex-1 bg-transparent text-base font-bold font-mono text-zinc-900 dark:text-white outline-none"
            placeholder="e.g. sin(x) + 0.5x"
          />
        </div>
      </div>

      {/* Error Block */}
      {plotError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200/50 dark:border-red-900/40 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{plotError}</span>
        </div>
      )}

      {/* Presets Block */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-slate-500">
          Quick Math Templates
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_FUNCTIONS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetSelect(preset.formula)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                expression === preset.formula
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-zinc-100 hover:bg-zinc-200/80 dark:bg-slate-900/50 dark:hover:bg-slate-900 border border-zinc-200/30 dark:border-slate-800/30 text-zinc-600 dark:text-slate-400"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Plot Stage & Grid Range Sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* SVG Stage container */}
        <div 
          ref={containerRef} 
          className="lg:col-span-9 p-2 rounded-2xl border border-zinc-200/60 dark:border-slate-800 bg-zinc-50/30 dark:bg-slate-950/20 relative flex items-center justify-center min-h-[300px] overflow-hidden select-none"
        >
          {points.length > 0 && !plotError ? (
            <svg
              ref={svgRef}
              width={width}
              height={height}
              className="overflow-visible cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* Background Grid Lines */}
              <g stroke="currentColor" strokeOpacity={0.06} className="grid-lines text-zinc-900 dark:text-white">
                {/* Vertical Grids */}
                {xTicks.map((tick, idx) => (
                  <line
                    key={`v-${idx}`}
                    x1={xScale(tick)}
                    x2={xScale(tick)}
                    y1={margin.top}
                    y2={height - margin.bottom}
                    strokeWidth={1}
                  />
                ))}
                {/* Horizontal Grids */}
                {yTicks.map((tick, idx) => (
                  <line
                    key={`h-${idx}`}
                    x1={margin.left}
                    x2={width - margin.right}
                    y1={yScale(tick)}
                    y2={yScale(tick)}
                    strokeWidth={1}
                  />
                ))}
              </g>

              {/* Principal Axes (X = 0, Y = 0) */}
              <g stroke="currentColor" strokeOpacity={0.4} className="text-zinc-400 dark:text-slate-700">
                {/* Y-axis line at X = 0 (if in range) */}
                {xMin <= 0 && xMax >= 0 && (
                  <line
                    x1={xScale(0)}
                    x2={xScale(0)}
                    y1={margin.top}
                    y2={height - margin.bottom}
                    strokeWidth={1.5}
                  />
                )}
                {/* X-axis line at Y = 0 (if in range) */}
                {yMin <= 0 && yMax >= 0 && (
                  <line
                    x1={margin.left}
                    x2={width - margin.right}
                    y1={yScale(0)}
                    y2={yScale(0)}
                    strokeWidth={1.5}
                  />
                )}
              </g>

              {/* Tick Labels */}
              <g fill="currentColor" className="text-[9px] font-mono text-zinc-400 dark:text-slate-500">
                {/* X-axis labels */}
                {xTicks.map((tick, idx) => (
                  <text
                    key={`xl-${idx}`}
                    x={xScale(tick)}
                    y={height - margin.bottom + 14}
                    textAnchor="middle"
                  >
                    {tick}
                  </text>
                ))}
                {/* Y-axis labels */}
                {yTicks.map((tick, idx) => (
                  <text
                    key={`yl-${idx}`}
                    x={margin.left - 6}
                    y={yScale(tick) + 3}
                    textAnchor="end"
                  >
                    {tick}
                  </text>
                ))}
              </g>

              {/* D3 Path representing math function */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#function-gradient)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Color Gradient for visual flair */}
              <defs>
                <linearGradient id="function-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              {/* Dynamic Interactive Cursor Hover Effects */}
              {isHovering && hoverData && (
                <g>
                  {/* Vertical coordinate highlight line */}
                  <line
                    x1={hoverData.screenX}
                    x2={hoverData.screenX}
                    y1={margin.top}
                    y2={height - margin.bottom}
                    stroke="currentColor"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    className="text-blue-500/40 dark:text-blue-400/30"
                  />
                  {/* Horizontal coordinate highlight line */}
                  <line
                    x1={margin.left}
                    x2={width - margin.right}
                    y1={hoverData.screenY}
                    y2={hoverData.screenY}
                    stroke="currentColor"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    className="text-blue-500/40 dark:text-blue-400/30"
                  />

                  {/* Pulsing focal point circle */}
                  <circle
                    cx={hoverData.screenX}
                    cy={hoverData.screenY}
                    r={6}
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    className="shadow-sm"
                  />
                  <circle
                    cx={hoverData.screenX}
                    cy={hoverData.screenY}
                    r={12}
                    fill="#3b82f6"
                    fillOpacity={0.15}
                    className="animate-ping"
                    style={{ animationDuration: "1.8s" }}
                  />

                  {/* Hover Floating Tooltip HUD */}
                  <g transform={`translate(${hoverData.screenX + 15 > width - 100 ? hoverData.screenX - 115 : hoverData.screenX + 12}, ${hoverData.screenY - 35 < margin.top ? hoverData.screenY + 12 : hoverData.screenY - 45})`}>
                    <rect
                      width={100}
                      height={42}
                      rx={8}
                      fill="rgba(15, 23, 42, 0.9)"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth={1}
                    />
                    <text x={8} y={16} fill="#ffffff" className="text-[9px] font-bold font-sans">
                      X: {hoverData.x.toFixed(3)}
                    </text>
                    <text x={8} y={30} fill="#3b82f6" className="text-[9px] font-bold font-sans">
                      Y: {hoverData.y.toFixed(3)}
                    </text>
                  </g>
                </g>
              )}
            </svg>
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-400 dark:text-slate-600 py-12">
              <Activity className="w-10 h-10 stroke-[1.5] animate-pulse text-zinc-300 dark:text-slate-800" />
              <span className="text-xs font-semibold">Ready to plot mathematical graphs</span>
            </div>
          )}
        </div>

        {/* Ranges and zoom controls sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-3.5 justify-between">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-slate-900/40 border border-zinc-200/40 dark:border-slate-800/60 flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-slate-500 border-b border-zinc-200/40 dark:border-slate-800 pb-1.5">
              Grid Bounds
            </span>
            
            {/* Range adjustment inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-zinc-400 dark:text-slate-500 mb-0.5">X Min</label>
                <input
                  type="number"
                  value={xMin}
                  onChange={(e) => setXMin(parseFloat(e.target.value) || -10)}
                  className="w-full bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-zinc-700 dark:text-slate-300 outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-zinc-400 dark:text-slate-500 mb-0.5">X Max</label>
                <input
                  type="number"
                  value={xMax}
                  onChange={(e) => setXMax(parseFloat(e.target.value) || 10)}
                  className="w-full bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-zinc-700 dark:text-slate-300 outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-zinc-400 dark:text-slate-500 mb-0.5">Y Min</label>
                <input
                  type="number"
                  value={yMin}
                  onChange={(e) => setYMin(parseFloat(e.target.value) || -10)}
                  className="w-full bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-zinc-700 dark:text-slate-300 outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-zinc-400 dark:text-slate-500 mb-0.5">Y Max</label>
                <input
                  type="number"
                  value={yMax}
                  onChange={(e) => setYMax(parseFloat(e.target.value) || 10)}
                  className="w-full bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-zinc-700 dark:text-slate-300 outline-none"
                />
              </div>
            </div>

            {/* Quick zoom buttons */}
            <div className="flex gap-1.5 mt-1.5">
              <button
                onClick={() => handleZoom(0.5)}
                className="flex-1 flex items-center justify-center gap-1 p-2 bg-white hover:bg-zinc-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-zinc-700 dark:text-slate-300 cursor-pointer active:scale-95 transition-all"
                title="Zoom In"
              >
                <Plus className="w-3.5 h-3.5 text-blue-500" />
                <span>Zoom In</span>
              </button>
              <button
                onClick={() => handleZoom(2.0)}
                className="flex-1 flex items-center justify-center gap-1 p-2 bg-white hover:bg-zinc-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-zinc-700 dark:text-slate-300 cursor-pointer active:scale-95 transition-all"
                title="Zoom Out"
              >
                <Minus className="w-3.5 h-3.5 text-blue-500" />
                <span>Zoom Out</span>
              </button>
            </div>
          </div>

          {/* Reset range button */}
          <button
            onClick={handleResetRange}
            className="w-full flex items-center justify-center gap-1.5 p-2.5 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-slate-400 cursor-pointer transition-colors border border-zinc-200/30 dark:border-slate-800/30"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Plot Range</span>
          </button>
        </div>

      </div>

      {/* Info footer */}
      <div className="flex gap-2 p-3.5 rounded-2xl bg-zinc-50/50 dark:bg-slate-900/10 border border-zinc-100 dark:border-slate-900/60 text-[11px] text-zinc-500 dark:text-slate-400 leading-relaxed font-medium">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          Type formulas containing variables like <code className="px-1 py-0.5 bg-zinc-100 dark:bg-slate-900 rounded font-mono text-[10px] text-blue-500 font-bold">x</code>. 
          Use trigonometric functions such as <code className="font-mono text-zinc-700 dark:text-slate-300">sin(x)</code>, exponentiation <code className="font-mono text-zinc-700 dark:text-slate-300">x^2</code>, percentage, constants like <code className="font-mono text-zinc-700 dark:text-slate-300">pi</code> or <code className="font-mono text-zinc-700 dark:text-slate-300">e</code>, or functions like <code className="font-mono text-zinc-700 dark:text-slate-300">sqrt(x)</code>.
        </div>
      </div>

    </div>
  );
}
