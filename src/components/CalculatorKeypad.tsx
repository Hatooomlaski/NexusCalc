/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ReactNode } from "react";
import { CornerDownLeft, RotateCcw, Delete, Compass } from "lucide-react";

interface CalcButton {
  label: string;
  action: string;
  type: "num" | "op" | "sci" | "special" | "equals";
  visualLabel?: ReactNode;
}

interface CalculatorKeypadProps {
  onBtnPress: (action: string) => void;
  isDegrees: boolean;
  onToggleDegRad: () => void;
}

export default function CalculatorKeypad({
  onBtnPress,
  isDegrees,
  onToggleDegRad,
}: CalculatorKeypadProps) {
  // Mobile active tab: "standard" or "scientific"
  const [activeTab, setActiveTab] = useState<"standard" | "scientific">("standard");

  // Provide haptic vibration feedback for physical/mobile feeling
  const triggerVibration = () => {
    if (typeof window !== "undefined" && window.navigator && typeof window.navigator.vibrate === "function") {
      try {
        window.navigator.vibrate(10); // 10ms is short, clean, and satisfying
      } catch (err) {
        // Ignore failures gracefully
      }
    }
  };

  // Scientific-only buttons
  const scientificButtons: CalcButton[] = [
    { label: "DEG/RAD", action: "deg-rad", type: "special", visualLabel: (
      <span className="flex flex-col items-center leading-none">
        <span className="text-[10px] font-bold text-blue-500">{isDegrees ? "DEG" : "RAD"}</span>
        <span className="text-[8px] text-zinc-400 dark:text-slate-500">Toggle</span>
      </span>
    )},
    { label: "(", action: "(", type: "sci" },
    { label: ")", action: ")", type: "sci" },
    { label: "xʸ", action: "pow", type: "sci", visualLabel: <span>x<sup>y</sup></span> },
    
    { label: "sin", action: "sin", type: "sci" },
    { label: "cos", action: "cos", type: "sci" },
    { label: "tan", action: "tan", type: "sci" },
    { label: "x²", action: "sqr", type: "sci", visualLabel: <span>x<sup>2</sup></span> },
    
    { label: "ln", action: "ln", type: "sci" },
    { label: "log", action: "log", type: "sci" },
    { label: "√", action: "sqrt", type: "sci" },
    { label: "e", action: "e", type: "sci", visualLabel: <span className="italic">e</span> },
    
    { label: "π", action: "pi", type: "sci", visualLabel: <span className="font-sans">π</span> },
    { label: "±", action: "neg", type: "sci" },
    { label: "%", action: "percent", type: "sci" },
    { label: "AC", action: "ac", type: "special", visualLabel: <span className="text-red-500 font-semibold">AC</span> },
  ];

  // Standard-only buttons
  const standardButtons: CalcButton[] = [
    { label: "C", action: "c", type: "special", visualLabel: <span className="text-zinc-600 dark:text-zinc-400 font-medium">C</span> },
    { label: "±", action: "neg", type: "special", visualLabel: "±" },
    { label: "%", action: "percent", type: "special", visualLabel: "%" },
    { label: "÷", action: "/", type: "op", visualLabel: "÷" },
    
    { label: "7", action: "7", type: "num" },
    { label: "8", action: "8", type: "num" },
    { label: "9", action: "9", type: "num" },
    { label: "×", action: "*", type: "op", visualLabel: "×" },
    
    { label: "4", action: "4", type: "num" },
    { label: "5", action: "5", type: "num" },
    { label: "6", action: "6", type: "num" },
    { label: "−", action: "-", type: "op", visualLabel: "−" },
    
    { label: "1", action: "1", type: "num" },
    { label: "2", action: "2", type: "num" },
    { label: "3", action: "3", type: "num" },
    { label: "+", action: "+", type: "op", visualLabel: "+" },
    
    { label: "0", action: "0", type: "num" },
    { label: ".", action: ".", type: "num" },
    { label: "⌫", action: "backspace", type: "special", visualLabel: <Delete className="w-4 h-4 text-zinc-600 dark:text-zinc-400" /> },
    { label: "=", action: "equals", type: "equals", visualLabel: <span className="text-xl font-bold text-white">=</span> },
  ];

  // Get style class based on button type
  const getBtnClasses = (btn: CalcButton) => {
    const base = "h-14 sm:h-16 flex items-center justify-center text-base sm:text-lg font-mono rounded-2xl select-none cursor-pointer transition-all active:scale-95 duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/50";
    
    switch (btn.type) {
      case "num":
        return `${base} bg-white dark:bg-slate-800 border border-zinc-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-zinc-800 dark:text-slate-100 font-semibold shadow-xs`;
      case "op":
        return `${base} bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm`;
      case "sci":
        return `${base} bg-zinc-100 dark:bg-slate-900/60 border border-zinc-200/40 dark:border-slate-800/40 hover:bg-zinc-200/50 dark:hover:bg-slate-800 text-zinc-600 dark:text-slate-300 font-medium`;
      case "special":
        return `${base} bg-zinc-100 dark:bg-slate-900 border border-zinc-200/40 dark:border-slate-800 hover:bg-zinc-200/50 dark:hover:bg-slate-800 text-zinc-700 dark:text-slate-200 font-medium`;
      case "equals":
        return `${base} bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20 col-span-1`;
      default:
        return base;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile Mode Tabs */}
      <div className="flex md:hidden bg-zinc-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-slate-800/60">
        <button
          id="mobile-tab-standard-btn"
          onClick={() => {
            triggerVibration();
            setActiveTab("standard");
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-all duration-200 ${
            activeTab === "standard"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-zinc-500 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-300"
          }`}
        >
          Standard
        </button>
        <button
          id="mobile-tab-scientific-btn"
          onClick={() => {
            triggerVibration();
            setActiveTab("scientific");
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-all duration-200 ${
            activeTab === "scientific"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-zinc-500 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-300"
          }`}
        >
          Scientific
        </button>
      </div>

      {/* Grid container: Grid of buttons */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
        {/* Scientific Button Pad */}
        <div
          id="scientific-pad"
          className={`grid grid-cols-4 gap-3 sm:gap-4 md:col-span-5 ${
            activeTab === "scientific" ? "block" : "hidden md:grid"
          }`}
        >
          {scientificButtons.map((btn, idx) => (
            <button
              id={`btn-sci-${btn.action}-${idx}`}
              key={`sci-${idx}`}
              onClick={() => {
                triggerVibration();
                if (btn.action === "deg-rad") {
                  onToggleDegRad();
                } else {
                  onBtnPress(btn.action);
                }
              }}
              className={getBtnClasses(btn)}
            >
              {btn.visualLabel || btn.label}
            </button>
          ))}
        </div>

        {/* Vertical Separator for Desktop */}
        <div className="hidden md:block w-px bg-zinc-200 dark:bg-slate-800 h-full col-span-1 justify-self-center self-center py-20" />

        {/* Standard Button Pad */}
        <div
          id="standard-pad"
          className={`grid grid-cols-4 gap-3 sm:gap-4 md:col-span-6 ${
            activeTab === "standard" ? "block" : "hidden md:grid"
          }`}
        >
          {standardButtons.map((btn, idx) => {
            // Modify standard C key behavior on mobile tab or show AC as primary reset
            let resolvedBtn = btn;
            if (activeTab === "scientific" && btn.action === "c") {
              // Replace "C" with "AC" if we are viewing scientific pad to enable easy reset
              resolvedBtn = { label: "AC", action: "ac", type: "special", visualLabel: <span className="text-red-500 font-semibold">AC</span> };
            }
            return (
              <button
                id={`btn-std-${resolvedBtn.action}-${idx}`}
                key={`std-${idx}`}
                onClick={() => {
                  triggerVibration();
                  onBtnPress(resolvedBtn.action);
                }}
                className={getBtnClasses(resolvedBtn)}
              >
                {resolvedBtn.visualLabel || resolvedBtn.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
