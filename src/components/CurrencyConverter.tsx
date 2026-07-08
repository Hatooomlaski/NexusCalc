/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ArrowLeftRight, Coins, RefreshCw, ArrowUpRight, ArrowDownLeft, Check, ClipboardCopy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "CNY", name: "Chinese Yuan", symbol: "元", flag: "🇨🇳" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  { code: "MXN", name: "Mexican Peso", symbol: "$", flag: "🇲🇽" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
];

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  JPY: 155.20,
  AUD: 1.50,
  CAD: 1.36,
  CHF: 0.90,
  CNY: 7.24,
  INR: 83.50,
  BRL: 5.15,
  MXN: 17.80,
  SGD: 1.35,
  NZD: 1.63,
  HKD: 7.82,
  ZAR: 18.25,
  AED: 3.67,
};

interface CurrencyConverterProps {
  calculatorValue: string;
  onApplyToCalculator: (val: string) => void;
  triggerVibration: () => void;
}

export default function CurrencyConverter({
  calculatorValue,
  onApplyToCalculator,
  triggerVibration,
}: CurrencyConverterProps) {
  const [amount, setAmount] = useState<string>("100");
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("EUR");
  
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("nexuscalc_rates");
    return saved ? JSON.parse(saved) : FALLBACK_RATES;
  });
  
  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    return localStorage.getItem("nexuscalc_rates_updated") || "Offline Fallback Data";
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Fetch exchange rates
  const fetchRates = async (silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      if (data.result === "success" && data.rates) {
        setRates(data.rates);
        const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " (Live)";
        setLastUpdated(dateStr);
        localStorage.setItem("nexuscalc_rates", JSON.stringify(data.rates));
        localStorage.setItem("nexuscalc_rates_updated", dateStr);
      } else {
        throw new Error("Invalid API format");
      }
    } catch (err: any) {
      console.error("Failed to fetch exchange rates, using fallback:", err);
      if (!silent) {
        setError("Unable to update live rates. Running on cached/fallback rates.");
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Fetch rates on mount
  useEffect(() => {
    fetchRates(true);
  }, []);

  // Calculate conversion
  const getRate = (from: string, to: string): number => {
    const rateUSDToFrom = rates[from] || FALLBACK_RATES[from] || 1;
    const rateUSDToTo = rates[to] || FALLBACK_RATES[to] || 1;
    return rateUSDToTo / rateUSDToFrom;
  };

  const exchangeRate = getRate(fromCurrency, toCurrency);
  const parsedAmount = parseFloat(amount) || 0;
  const result = parsedAmount * exchangeRate;

  // Format currency displays
  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find((c) => c.code === code)?.symbol || "";
  };

  const getCurrencyName = (code: string) => {
    return CURRENCIES.find((c) => c.code === code)?.name || "";
  };

  // Swap currencies
  const handleSwap = () => {
    triggerVibration();
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Quick preset amount trigger
  const handlePresetAmount = (val: string) => {
    triggerVibration();
    setAmount(val);
  };

  // Handle load from Calculator
  const handlePullFromCalculator = () => {
    triggerVibration();
    // Parse valid numeric value from calculator
    const cleanVal = calculatorValue.replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleanVal);
    if (!isNaN(parsed) && isFinite(parsed)) {
      setAmount(Math.abs(parsed).toString());
    }
  };

  // Push to Calculator
  const handlePushToCalculator = () => {
    triggerVibration();
    onApplyToCalculator(result.toFixed(4));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Common quick values table entries
  const commonAmounts = [10, 50, 100, 500, 1000];

  return (
    <div className="flex flex-col gap-6" id="currency-converter-panel">
      {/* Top action row */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-slate-400">
          <Coins className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-sm tracking-tight text-zinc-700 dark:text-slate-300">
            Real-time Exchange Platform
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-400 dark:text-slate-500 font-mono">
            Rates: {lastUpdated}
          </span>
          <button
            onClick={() => {
              triggerVibration();
              fetchRates();
            }}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Exchange Rates"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-500" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-xs rounded-xl border border-amber-200/50 dark:border-amber-900/40 font-medium">
          {error}
        </div>
      )}

      {/* Inputs block */}
      <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 relative">
        
        {/* Source currency panel */}
        <div className="md:col-span-5 p-4 rounded-2xl bg-zinc-50 dark:bg-slate-900/60 border border-zinc-200/50 dark:border-slate-800/60 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-slate-500 mb-1">
            From Currency
          </label>
          <div className="flex items-center justify-between gap-3">
            <select
              value={fromCurrency}
              onChange={(e) => {
                triggerVibration();
                setFromCurrency(e.target.value);
              }}
              className="bg-transparent text-lg font-bold outline-none text-zinc-800 dark:text-white cursor-pointer"
            >
              {CURRENCIES.map((cur) => (
                <option key={cur.code} value={cur.code} className="dark:bg-slate-950 text-zinc-800 dark:text-white">
                  {cur.flag} {cur.code} - {cur.name}
                </option>
              ))}
            </select>
            <span className="text-xl font-bold text-zinc-400 dark:text-slate-600 font-mono">
              {getCurrencySymbol(fromCurrency)}
            </span>
          </div>
          <div className="mt-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white outline-none placeholder:text-zinc-300 dark:placeholder:text-slate-800"
              placeholder="0.00"
              min="0"
            />
          </div>
        </div>

        {/* Swap Button (Desktop & Mobile handles) */}
        <div className="md:col-span-2 flex justify-center z-10">
          <button
            onClick={handleSwap}
            className="p-3 bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-full hover:border-blue-500 hover:text-blue-500 shadow-md hover:shadow-lg dark:shadow-black/60 cursor-pointer active:scale-95 transition-all text-zinc-500 dark:text-slate-400"
            title="Swap Currencies"
          >
            <ArrowLeftRight className="w-5 h-5 rotate-90 md:rotate-0 transition-transform duration-300" />
          </button>
        </div>

        {/* Destination currency panel */}
        <div className="md:col-span-5 p-4 rounded-2xl bg-zinc-50 dark:bg-slate-900/60 border border-zinc-200/50 dark:border-slate-800/60 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-slate-500 mb-1">
            To Currency
          </label>
          <div className="flex items-center justify-between gap-3">
            <select
              value={toCurrency}
              onChange={(e) => {
                triggerVibration();
                setToCurrency(e.target.value);
              }}
              className="bg-transparent text-lg font-bold outline-none text-zinc-800 dark:text-white cursor-pointer"
            >
              {CURRENCIES.map((cur) => (
                <option key={cur.code} value={cur.code} className="dark:bg-slate-950 text-zinc-800 dark:text-white">
                  {cur.flag} {cur.code} - {cur.name}
                </option>
              ))}
            </select>
            <span className="text-xl font-bold text-zinc-400 dark:text-slate-600 font-mono">
              {getCurrencySymbol(toCurrency)}
            </span>
          </div>
          <div className="mt-3">
            <div className="w-full text-2xl font-bold font-mono tracking-tight text-blue-600 dark:text-blue-400 truncate py-1">
              {result.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Integration controls with standard calculator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        {/* Pull calculator value */}
        <button
          onClick={handlePullFromCalculator}
          disabled={!calculatorValue || calculatorValue === "0" || calculatorValue === "Error"}
          className="flex items-center justify-center gap-2 p-3 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-slate-900 dark:hover:bg-slate-800 text-zinc-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-zinc-200/40 dark:border-slate-800/40"
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          <span>Import Current Calc Value:</span>
          <span className="font-mono text-zinc-900 dark:text-white font-bold max-w-[120px] truncate">
            {calculatorValue || "0"}
          </span>
        </button>

        {/* Push to calculator */}
        <button
          onClick={handlePushToCalculator}
          disabled={parsedAmount <= 0}
          className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
            isCopied
              ? "bg-emerald-500 text-white border-emerald-600"
              : "bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-md shadow-blue-900/10"
          } disabled:opacity-45 disabled:cursor-not-allowed`}
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 animate-scale-up" />
              <span>Applied to Calculator Input!</span>
            </>
          ) : (
            <>
              <ArrowUpRight className="w-4 h-4" />
              <span>Export Result to Calculator</span>
            </>
          )}
        </button>
      </div>

      {/* Preset Amount Toggles */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-slate-500">
          Quick Presets ({getCurrencySymbol(fromCurrency)})
        </span>
        <div className="flex flex-wrap gap-2">
          {commonAmounts.map((amt) => (
            <button
              key={amt}
              onClick={() => handlePresetAmount(amt.toString())}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                amount === amt.toString()
                  ? "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-300/40 dark:border-blue-800/50"
                  : "bg-zinc-100 hover:bg-zinc-200/80 dark:bg-slate-900/50 dark:hover:bg-slate-900 border border-zinc-200/30 dark:border-slate-800/30 text-zinc-600 dark:text-slate-400"
              }`}
            >
              {amt}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Rate Overview Grid */}
      <div className="p-4 rounded-2xl bg-zinc-50/50 dark:bg-slate-900/20 border border-zinc-200/30 dark:border-slate-800/40">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-slate-500 mb-3 border-b border-zinc-100/60 dark:border-slate-800/60 pb-1.5">
          <span>Rates Comparison Table</span>
          <span>1 {fromCurrency} equals</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CURRENCIES.filter((c) => c.code !== fromCurrency).slice(0, 6).map((c) => {
            const compRate = getRate(fromCurrency, c.code);
            return (
              <div
                key={c.code}
                className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-950/60 border border-zinc-100 dark:border-slate-900/60 text-xs font-medium"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{c.flag}</span>
                  <span className="text-zinc-500 dark:text-slate-400 text-[11px] font-bold">{c.code}</span>
                </div>
                <span className="font-mono text-[11px] text-zinc-800 dark:text-white font-bold">
                  {compRate >= 100 ? compRate.toFixed(2) : compRate.toFixed(4)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
