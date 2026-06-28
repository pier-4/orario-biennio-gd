import React, { useState, useEffect } from "react";
import academicWeeks from "@/lib/weeks.json";

function getWeekInfo(date) {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const active = academicWeeks.find((w) => {
    const [sY, sM, sD] = w.start.split("-");
    const start = new Date(Number(sY), Number(sM) - 1, Number(sD));
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

const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];
const DAYS_SHORT = ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"];

function formatDate(date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function CalendarGrid({ selected, onSelect, onClose }) {
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-slate-800">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-bold text-slate-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const thisDate = new Date(viewYear, viewMonth, day);
          const isSelected =
            selected.getDate() === day &&
            selected.getMonth() === viewMonth &&
            selected.getFullYear() === viewYear;
          return (
            <button
              key={day}
              onClick={() => {
                onSelect(thisDate);
                onClose();
              }}
              className={`text-xs rounded-md py-1 cursor-pointer transition-colors ${
                isSelected
                  ? "bg-blue-500 text-white font-bold"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </>
  );
}

function CalendarPopup({ selected, onSelect, onClose }) {
  return (
    <>
      {/* Mobile: fullscreen centered modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 md:hidden"
        onClick={onClose}
      >
        <div
          className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-64"
          onClick={(e) => e.stopPropagation()}
        >
          <CalendarGrid
            selected={selected}
            onSelect={onSelect}
            onClose={onClose}
          />
        </div>
      </div>

      {/* Desktop: dropdown below button */}
      <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-64 hidden md:block">
        <CalendarGrid
          selected={selected}
          onSelect={onSelect}
          onClose={onClose}
        />
      </div>
    </>
  );
}

export default function CurrentWeekIndicator() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const [selected, setSelected] = useState(now);
  const [open, setOpen] = useState(false);
  const [currentInfo, setCurrentInfo] = useState(() => getWeekInfo(now));

  useEffect(() => {
    setCurrentInfo(getWeekInfo(selected));
  }, [selected]);

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

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="px-3 py-1.5 text-sm rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
        >
          📅 {formatDate(selected)}
        </button>
        {open && (
          <CalendarPopup
            selected={selected}
            onSelect={setSelected}
            onClose={() => setOpen(false)}
          />
        )}
      </div>

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
