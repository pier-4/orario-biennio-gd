import React, { useState, useMemo, useRef } from "react";
import academicWeeks from "@/lib/weeks.json";

export default function CurrentWeekIndicator() {
  const [overrideDate, setOverrideDate] = useState("");
  const inputRef = useRef(null);

  const currentInfo = useMemo(() => {
    const today = overrideDate ? new Date(overrideDate) : new Date();
    today.setHours(0, 0, 0, 0);

    const active = academicWeeks.find((w) => {
      const start = new Date(w.start);
      const end = new Date(w.end);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    });

    if (!active || active.term === "Break") return null;

    const isA = active.week % 2 !== 0;

    return {
      term: active.term,
      week: active.week,
      type: isA ? "A" : "B",
      colorClass: isA
        ? "bg-red-100 text-red-700 border-red-200"
        : "bg-blue-100 text-blue-700 border-blue-200",
    };
  }, [overrideDate]);

  return (
    <div className="flex items-center gap-3 mb-4 font-sans">
      {/* Indicatore Settimana */}
      <div
        onClick={() => inputRef.current?.showPicker()}
        className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
        title="Clicca per testare una data"
      >
        <input
          type="date"
          ref={inputRef}
          onChange={(e) => setOverrideDate(e.target.value)}
          value={overrideDate}
          className="absolute w-0 h-0 opacity-0 pointer-events-none"
        />

        {currentInfo ? (
          <>
            <span className="font-black text-slate-800 text-lg">
              {currentInfo.term}
            </span>
            <span className="text-slate-300 font-bold">•</span>
            <span className="font-semibold text-slate-700">
              {currentInfo.week}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold border ${currentInfo.colorClass}`}
            >
              {currentInfo.type}
            </span>
          </>
        ) : (
          <span className="text-sm text-slate-500 font-medium">
            Nessuna lezione (Break)
          </span>
        )}
      </div>

      {/* Link Calendario PDF */}
      <a
        href="/bozza-calendario-26.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-400 hover:text-blue-700 hover:underline font-medium"
      >
        - Apri calendario didattico
      </a>
    </div>
  );
}
