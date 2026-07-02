/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Calculator, 
  History, 
  Keyboard, 
  AlertTriangle, 
  HelpCircle,
  Bookmark,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { motion } from "motion/react";

import { HistoryItem, Theme } from "./types";
import { calculate, formatFormulaForDisplay } from "./utils/mathEngine";
import ThemeToggle from "./components/ThemeToggle";
import HistoryDrawer from "./components/HistoryDrawer";
import ShortcutsModal from "./components/ShortcutsModal";
import CalculatorKeypad from "./components/CalculatorKeypad";

export default function App() {
  // --- States ---
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("nexuscalc_theme");
    return (saved as Theme) || "dark";
  });

  const [formula, setFormula] = useState("");
  const [currentInput, setCurrentInput] = useState("");
  const [lastFormula, setLastFormula] = useState(""); // Completed calculation to show after pressing '='
  const [isDegrees, setIsDegrees] = useState(true); // Default to Degree mode
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEvaluated, setIsEvaluated] = useState(false);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem("nexuscalc_history");
    return saved ? JSON.parse(saved) : [];
  });

  // Dialog/Modal states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Precision settings states
  const [precisionMode, setPrecisionMode] = useState<"fixed" | "scientific">(() => {
    const saved = localStorage.getItem("nexuscalc_precision_mode");
    return (saved as "fixed" | "scientific") || "fixed";
  });

  const [decimalPlaces, setDecimalPlaces] = useState<"auto" | number>(() => {
    const saved = localStorage.getItem("nexuscalc_decimal_places");
    if (saved === "auto" || saved === null) return "auto";
    const parsed = parseInt(saved, 10);
    return isNaN(parsed) ? "auto" : parsed;
  });

  const [rawResult, setRawResult] = useState<number | null>(null);

  // Vibration feedback
  const triggerVibration = () => {
    if (typeof window !== "undefined" && window.navigator && typeof window.navigator.vibrate === "function") {
      try {
        window.navigator.vibrate(10);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    localStorage.setItem("nexuscalc_precision_mode", precisionMode);
  }, [precisionMode]);

  useEffect(() => {
    localStorage.setItem("nexuscalc_decimal_places", String(decimalPlaces));
  }, [decimalPlaces]);

  // Sync theme with HTML document element for tailwind dark: selectors
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("nexuscalc_theme", theme);
  }, [theme]);

  // --- Keyboard Input Mapping ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard commands when drawer or modal is open (except Escape)
      if (isHistoryOpen || isShortcutsOpen) {
        if (e.key === "Escape") {
          setIsHistoryOpen(false);
          setIsShortcutsOpen(false);
        }
        return;
      }

      const key = e.key;

      if (/[0-9]/.test(key)) {
        handleBtnPress(key);
      } else if (key === ".") {
        handleBtnPress(".");
      } else if (key === "+") {
        handleBtnPress("+");
      } else if (key === "-") {
        handleBtnPress("-");
      } else if (key === "*") {
        handleBtnPress("*");
      } else if (key === "/") {
        handleBtnPress("/");
      } else if (key === "Enter" || key === "=") {
        e.preventDefault();
        handleBtnPress("equals");
      } else if (key === "Backspace") {
        handleBtnPress("backspace");
      } else if (key === "Escape") {
        handleBtnPress("ac");
      } else if (key === "(") {
        handleBtnPress("(");
      } else if (key === ")") {
        handleBtnPress(")");
      } else if (key === "%") {
        handleBtnPress("percent");
      } else if (key === "^") {
        handleBtnPress("pow");
      } else if (key.toLowerCase() === "s") {
        handleBtnPress("sin");
      } else if (key.toLowerCase() === "c") {
        handleBtnPress("cos");
      } else if (key.toLowerCase() === "t") {
        handleBtnPress("tan");
      } else if (key.toLowerCase() === "q") {
        handleBtnPress("sqrt");
      } else if (key.toLowerCase() === "l") {
        handleBtnPress("ln");
      } else if (key.toLowerCase() === "g") {
        handleBtnPress("log");
      } else if (key.toLowerCase() === "p") {
        handleBtnPress("pi");
      } else if (key.toLowerCase() === "e") {
        handleBtnPress("e");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [formula, currentInput, isDegrees, isHistoryOpen, isShortcutsOpen, isEvaluated, history, rawResult, precisionMode, decimalPlaces]);

  // --- Button Actions Handler ---
  const handleBtnPress = (action: string) => {
    // Reset rawResult if not a precision/operators action
    if (action !== "equals" && action !== "deg-rad" && !["+", "-", "*", "/"].includes(action)) {
      setRawResult(null);
    }

    // If in error state, only allow resetting via 'ac' or character removal via 'backspace'
    if (isError && action !== "ac" && action !== "backspace") {
      return;
    }

    switch (action) {
      case "ac":
        setFormula("");
        setCurrentInput("");
        setLastFormula("");
        setIsError(false);
        setErrorMessage("");
        setIsEvaluated(false);
        break;

      case "c":
        setCurrentInput("");
        break;

      case "backspace":
        if (isError) {
          setFormula("");
          setCurrentInput("");
          setIsError(false);
          setErrorMessage("");
          setIsEvaluated(false);
        } else if (currentInput) {
          setCurrentInput(currentInput.slice(0, -1));
        } else if (formula) {
          // Intelligent backspacing of expression track
          let trimmed = formula.trim();
          
          // Check if it ends with function calls and delete them completely
          if (trimmed.endsWith("sin(") || trimmed.endsWith("cos(") || trimmed.endsWith("tan(") || trimmed.endsWith("log(") || trimmed.endsWith("ln(")) {
            const lastSpaceIdx = trimmed.lastIndexOf(" ");
            trimmed = lastSpaceIdx !== -1 ? trimmed.substring(0, lastSpaceIdx) : "";
          } else if (trimmed.endsWith("sqrt(")) {
            const lastSpaceIdx = trimmed.lastIndexOf(" ");
            trimmed = lastSpaceIdx !== -1 ? trimmed.substring(0, lastSpaceIdx) : "";
          } else {
            // Delete last token
            const lastSpaceIdx = trimmed.lastIndexOf(" ");
            trimmed = lastSpaceIdx !== -1 ? trimmed.substring(0, lastSpaceIdx) : "";
          }
          setFormula(trimmed);
        }
        break;

      case "neg":
        if (isEvaluated) {
          setCurrentInput(currentInput.startsWith("-") ? currentInput.slice(1) : "-" + currentInput);
          setIsEvaluated(false);
          setLastFormula("");
        } else if (currentInput) {
          setCurrentInput(currentInput.startsWith("-") ? currentInput.slice(1) : "-" + currentInput);
        } else {
          setCurrentInput("-");
        }
        break;

      case "percent":
        if (isEvaluated) {
          try {
            const val = Number(currentInput) / 100;
            setCurrentInput(String(val));
            setLastFormula(`${currentInput}% =`);
            setIsEvaluated(true);
          } catch {
            // silent fail
          }
        } else if (currentInput && !currentInput.endsWith("%")) {
          setCurrentInput(currentInput + "%");
        }
        break;

      case "deg-rad":
        setIsDegrees(!isDegrees);
        break;

      case "pi":
      case "e": {
        const symbol = action === "pi" ? "π" : "e";
        if (isEvaluated) {
          setFormula("");
          setCurrentInput(symbol);
          setIsEvaluated(false);
          setLastFormula("");
        } else if (currentInput) {
          setFormula(prev => prev + (prev ? " " : "") + currentInput + " * ");
          setCurrentInput(symbol);
        } else {
          setCurrentInput(symbol);
        }
        break;
      }

      case "(":
        if (isEvaluated) {
          setFormula("(");
          setCurrentInput("");
          setIsEvaluated(false);
          setLastFormula("");
        } else if (currentInput) {
          setFormula(prev => prev + (prev ? " " : "") + currentInput + " * (");
          setCurrentInput("");
        } else {
          setFormula(prev => prev + (prev ? " " : "") + "(");
        }
        break;

      case ")":
        if (currentInput) {
          setFormula(prev => prev + (prev ? " " : "") + currentInput + " )");
          setCurrentInput("");
        } else {
          setFormula(prev => prev + (prev ? " " : "") + " )");
        }
        break;

      case "sqr":
        if (isEvaluated) {
          setFormula(`${currentInput} ^ 2`);
          setCurrentInput("");
          setIsEvaluated(false);
          setLastFormula("");
        } else if (currentInput) {
          setFormula(prev => prev + (prev ? " " : "") + currentInput + " ^ 2");
          setCurrentInput("");
        } else {
          setFormula(prev => prev + (prev ? " " : "") + " ^ 2");
        }
        break;

      case "pow":
        if (isEvaluated) {
          setFormula(`${currentInput} ^ `);
          setCurrentInput("");
          setIsEvaluated(false);
          setLastFormula("");
        } else if (currentInput) {
          setFormula(prev => prev + (prev ? " " : "") + currentInput + " ^ ");
          setCurrentInput("");
        } else {
          setFormula(prev => prev + (prev ? " " : "") + " ^ ");
        }
        break;

      case "sin":
      case "cos":
      case "tan":
      case "sqrt":
      case "ln":
      case "log": {
        const funcSymbol = action === "sqrt" ? "√(" : `${action}(`;
        if (isEvaluated) {
          setFormula(funcSymbol);
          setCurrentInput("");
          setIsEvaluated(false);
          setLastFormula("");
        } else if (currentInput) {
          setFormula(prev => prev + (prev ? " " : "") + currentInput + " * " + funcSymbol);
          setCurrentInput("");
        } else {
          setFormula(prev => prev + (prev ? " " : "") + funcSymbol);
        }
        break;
      }

      case "+":
      case "-":
      case "*":
      case "/": {
        if (isEvaluated) {
          const valueToUse = rawResult !== null 
            ? formatValueWithPrecision(rawResult, precisionMode, decimalPlaces) 
            : currentInput;
          setFormula(valueToUse + " " + action + " ");
          setCurrentInput("");
          setIsEvaluated(false);
          setLastFormula("");
          setRawResult(null);
        } else if (currentInput) {
          setFormula(prev => prev + (prev ? " " : "") + currentInput + " " + action + " ");
          setCurrentInput("");
        } else if (formula) {
          let trimmed = formula.trim();
          const lastChar = trimmed.slice(-1);
          if (["+", "-", "*", "/"].includes(lastChar)) {
            // Replace consecutive operator with latest
            setFormula(trimmed.slice(0, -1) + action + " ");
          } else {
            setFormula(prev => prev + " " + action + " ");
          }
        } else if (action === "-") {
          setCurrentInput("-");
        }
        break;
      }

      case "equals": {
        let finalExpression = formula;
        if (currentInput) {
          finalExpression += (finalExpression ? " " : "") + currentInput;
        }

        if (!finalExpression.trim()) return;

        try {
          const result = calculate(finalExpression, isDegrees);
          const formattedResult = String(result);

          // Add item to history log
          const newItem: HistoryItem = {
            id: Math.random().toString(36).substring(2, 9),
            expression: finalExpression,
            result: formattedResult,
            timestamp: Date.now(),
          };

          const updatedHistory = [newItem, ...history].slice(0, 50);
          setHistory(updatedHistory);
          localStorage.setItem("nexuscalc_history", JSON.stringify(updatedHistory));

          // Set states
          setLastFormula(finalExpression + " =");
          setRawResult(result);
          setCurrentInput(formattedResult);
          setFormula("");
          setIsEvaluated(true);
        } catch (err: any) {
          setIsError(true);
          setErrorMessage(err.message || "Error");
          setCurrentInput("Error");
          setRawResult(null);
          setLastFormula(finalExpression + " =");
        }
        break;
      }

      default: {
        // Handle digit or decimal
        if (isEvaluated) {
          setFormula("");
          setCurrentInput(action);
          setIsEvaluated(false);
          setLastFormula("");
        } else if (currentInput === "0" && action !== ".") {
          setCurrentInput(action);
        } else if (action === "." && currentInput.includes(".")) {
          return; // Guard against multiple decimal points in a single token
        } else {
          setCurrentInput(currentInput + action);
        }
        break;
      }
    }
  };

  // --- History Interaction ---
  const handleSelectHistoryItem = (expression: string, result: string) => {
    setFormula(expression);
    setCurrentInput(result);
    setLastFormula("");
    setIsError(false);
    
    const parsed = Number(result);
    setRawResult(isNaN(parsed) ? null : parsed);
    setIsEvaluated(true);
    
    setIsHistoryOpen(false);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem("nexuscalc_history", JSON.stringify(updated));
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    localStorage.setItem("nexuscalc_history", JSON.stringify([]));
  };

  const formatValueWithPrecision = (val: number, mode: "fixed" | "scientific", precision: "auto" | number): string => {
    if (isNaN(val) || !isFinite(val)) {
      return String(val);
    }
    if (precision === "auto") {
      if (mode === "scientific") {
        return val.toExponential();
      }
      return String(val);
    }
    
    if (mode === "scientific") {
      return val.toExponential(precision);
    } else {
      return val.toFixed(precision);
    }
  };

  // Dynamic sizing of the output string to prevent viewport overflow
  const getOutputFontSizeClass = (text: string) => {
    const len = text.length;
    if (len <= 10) return "text-4xl sm:text-5xl md:text-6xl font-semibold";
    if (len <= 15) return "text-3xl sm:text-4xl md:text-5xl font-semibold";
    if (len <= 20) return "text-2xl sm:text-3xl md:text-4xl font-medium";
    return "text-lg sm:text-xl md:text-2xl font-normal break-all";
  };

  const activeOutputValue = isError 
    ? errorMessage 
    : isEvaluated && rawResult !== null
      ? formatValueWithPrecision(rawResult, precisionMode, decimalPlaces)
      : currentInput || formatFormulaForDisplay(formula) || "0";

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      
      {/* 1. Header Navigation Bar */}
      <header className="w-full border-b border-zinc-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Calculator className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">
              Nexus<span className="text-blue-500">Calc</span>
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-slate-500 uppercase tracking-widest font-semibold leading-none">
              Precision Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Active angle mode display on header */}
          <button
            id="header-deg-rad-toggle"
            onClick={() => {
              triggerVibration();
              setIsDegrees(!isDegrees);
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-zinc-500 dark:text-slate-400 border border-zinc-200/40 dark:border-slate-800/40 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>{isDegrees ? "Degrees Mode" : "Radians Mode"}</span>
          </button>

          <ThemeToggle theme={theme} onChange={setTheme} />

          {/* Collapsible History side trigger */}
          <button
            id="open-history-btn"
            onClick={() => setIsHistoryOpen(true)}
            className="relative p-2 hover:bg-zinc-100 dark:hover:bg-slate-900 text-zinc-600 dark:text-slate-400 rounded-xl transition-all cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-slate-800"
            aria-label="View history"
            title="History Log"
          >
            <History className="w-5.5 h-5.5" />
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-fade-in shadow-sm shadow-blue-500/30">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Body Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 md:py-12 flex flex-col justify-center items-center">
        
        {/* Calculator Canvas Wrapper */}
        <div className="w-full bg-white dark:bg-slate-950/40 backdrop-blur-md md:border md:border-zinc-200/80 md:dark:border-slate-800/60 rounded-3xl md:shadow-2xl md:dark:shadow-black/60 overflow-hidden flex flex-col">
          
          {/* Display Area Panel */}
          <div className="p-6 sm:p-8 bg-zinc-100/30 dark:bg-slate-900/60 border-b border-zinc-200/50 dark:border-slate-800 flex flex-col justify-end min-h-48 relative overflow-hidden">
            {/* Ambient glows inside display */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Top Indicator Line */}
            <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-slate-500 font-medium mb-3 select-none">
              <button
                id="display-deg-rad-toggle"
                onClick={() => {
                  triggerVibration();
                  setIsDegrees(!isDegrees);
                }}
                className="flex items-center gap-1.5 bg-zinc-200/60 hover:bg-zinc-300/60 dark:bg-slate-800 dark:hover:bg-slate-700/80 px-2.5 py-1 rounded-md cursor-pointer transition-colors"
              >
                <span className={isDegrees ? "text-blue-500 font-bold" : ""}>DEG</span>
                <span className="text-zinc-300 dark:text-slate-700">|</span>
                <span className={!isDegrees ? "text-blue-500 font-bold" : ""}>RAD</span>
              </button>
              <div className="flex items-center gap-1.5 text-[10px]">
                <kbd className="px-1.5 py-0.5 bg-zinc-200/50 dark:bg-slate-800 border border-zinc-300/30 dark:border-slate-700 rounded-sm font-mono text-[9px]">ESC</kbd>
                <span>resets all</span>
              </div>
            </div>

            {/* Formula Sequence (Track) */}
            <div className="text-right text-zinc-400 dark:text-slate-500 font-mono text-sm sm:text-base min-h-[1.5rem] tracking-tight mb-2 select-all overflow-x-auto whitespace-nowrap scrollbar-none">
              {isEvaluated 
                ? formatFormulaForDisplay(lastFormula) 
                : formatFormulaForDisplay(formula) || <span className="opacity-0">0</span>
              }
            </div>

            {/* Primary Current Value Display */}
            <div className="text-right select-all font-mono tracking-tight overflow-hidden mt-1">
              <span className={`transition-all duration-150 ${getOutputFontSizeClass(activeOutputValue)} ${
                isError 
                  ? "text-red-500 dark:text-red-400 font-semibold" 
                  : "text-zinc-900 dark:text-white"
              }`}>
                {activeOutputValue}
              </span>
            </div>
          </div>

          {/* Precision Settings Control Bar */}
          <div className="px-6 py-3 bg-zinc-50/50 dark:bg-slate-900/40 border-b border-zinc-200/50 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-zinc-500 dark:text-slate-400 select-none">
            {/* Left: Mode toggle */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[10px] uppercase tracking-wider text-zinc-400 dark:text-slate-500">
                Precision Mode:
              </span>
              <div className="inline-flex bg-zinc-200/60 dark:bg-slate-800 p-0.5 rounded-lg border border-zinc-300/20 dark:border-slate-700/30">
                <button
                  id="precision-mode-fixed-btn"
                  onClick={() => {
                    triggerVibration();
                    setPrecisionMode("fixed");
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    precisionMode === "fixed"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-300"
                  }`}
                >
                  Fixed Decimal
                </button>
                <button
                  id="precision-mode-sci-btn"
                  onClick={() => {
                    triggerVibration();
                    setPrecisionMode("scientific");
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    precisionMode === "scientific"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-300"
                  }`}
                >
                  Scientific
                </button>
              </div>
            </div>

            {/* Right: Decimal selector */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[10px] uppercase tracking-wider text-zinc-400 dark:text-slate-500">
                {precisionMode === "scientific" ? "Significant Figs:" : "Decimal Places:"}
              </span>
              <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
                <select
                  id="precision-digits-select"
                  value={decimalPlaces}
                  onChange={(e) => {
                    triggerVibration();
                    const val = e.target.value;
                    setDecimalPlaces(val === "auto" ? "auto" : parseInt(val, 10));
                  }}
                  className="bg-zinc-100 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-semibold text-zinc-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
                >
                  <option value="auto">Auto</option>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? (precisionMode === "scientific" ? "fig" : "place") : (precisionMode === "scientific" ? "figs" : "places")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Keypad Grid Wrapper */}
          <div className="p-6 sm:p-8 bg-white dark:bg-slate-950/40">
            <CalculatorKeypad 
              onBtnPress={handleBtnPress}
              isDegrees={isDegrees}
              onToggleDegRad={() => handleBtnPress("deg-rad")}
            />
          </div>

        </div>

        {/* Floating Quick Keyboard Shortcuts Help Trigger */}
        <button
          id="keyboard-quick-help-btn"
          onClick={() => setIsShortcutsOpen(true)}
          className="mt-6 flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 px-4 py-2 bg-white dark:bg-slate-900/40 border border-zinc-200/50 dark:border-slate-800/40 hover:border-blue-500/20 rounded-full shadow-xs cursor-pointer transition-all hover:scale-[1.02]"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>Interactive Keyboard Shortcuts Mapped</span>
        </button>

      </main>

      {/* 3. Footer Component */}
      <footer className="w-full border-t border-zinc-200 dark:border-slate-900 bg-white dark:bg-slate-950 px-6 py-6 text-center select-none z-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-400 dark:text-slate-500 font-medium">
          
          <div className="flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
            <span>Engineered with precision</span>
            <span className="text-slate-300 dark:text-slate-800">|</span>
            <span>© 2026 NexusCalc</span>
          </div>

          <div className="flex items-center gap-6 uppercase tracking-widest text-[10px]">
            <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Privacy Policy</a>
            <button
              id="footer-shortcut-trigger"
              onClick={() => setIsShortcutsOpen(true)}
              className="hover:text-blue-500 dark:hover:text-blue-400 font-bold cursor-pointer transition-colors"
            >
              Shortcuts Map
            </button>
          </div>

        </div>
      </footer>

      {/* 4. Side drawers & modal panels */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearAll={handleClearAllHistory}
        onDeleteItem={handleDeleteHistoryItem}
        onSelectExpression={handleSelectHistoryItem}
      />

      <ShortcutsModal 
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

    </div>
  );
}
