import React, { useState, useEffect } from "react";
import academicWeeks from "@/lib/weeks.json";

function getWeekInfo(day, month, year) {
  const today = new Date(Number(year), Number(month) - 1, Number(day));
  today.setHours(0, 0, 0, 0);

  const active = academicWeeks.find((w) => {
    const [sY, sM, sD] = w.start.split("-");
    const start = new Date(Number(sY), Number(sM) - 1, Number(sD));
    start.setHours(0, 0, 0, 0);
    const [eY, eM, eD] = w.end.split("-");
    const end = new Date(Number(eY), Number(eM) - 1, Number(eD));
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
}

function toInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CurrentWeekIndicator() {
  const now = new Date();
  const [dateStr, setDateStr] = useState(toInputValue(now));
  const [currentInfo, setCurrentInfo] = useState(() => {
    return getWeekInfo(now.getDate(), now.getMonth() + 1, now.getFullYear());
  });

  useEffect(() => {
    if (!dateStr) return;
    const [y, m, d] = dateStr.split("-");
    setCurrentInfo(getWeekInfo(d, m, y));
  }, [dateStr]);

  const handleChange = (e) => setDateStr(e.target.value);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 font-sans">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white shadow-sm">
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
            Break / Nessuna lezione
          </span>
        )}
      </div>

      <input
        type="date"
        value={dateStr}
        onChange={handleChange}
        onBlur={handleChange}
        className="px-3 py-1.5 text-sm rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      />

      <a
        href="/bozza-calendario-26.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-400 hover:text-blue-700 hover:underline font-medium ml-2"
      >
        - Apri calendario didattico
      </a>
    </div>
  );
}
