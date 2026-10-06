import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { getWeekInfo } from "@/lib/academicWeeks";

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
          aria-label="Mese precedente"
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
        >
          ‹
        </button>
        <span className="text-sm font-bold text-slate-800">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          aria-label="Mese successivo"
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
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
          const isToday =
            new Date().getFullYear() === viewYear &&
            new Date().getMonth() === viewMonth &&
            new Date().getDate() === day;
          return (
            <button
              key={day}
              onClick={() => {
                onSelect(thisDate);
                onClose();
              }}
              className={`text-sm rounded-full aspect-square flex items-center justify-center cursor-pointer transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : isToday
                    ? "ring-1 ring-blue-300 font-semibold text-blue-700 hover:bg-blue-50"
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
      {/* Mobile: bottom sheet che scorre dal basso.
          Portaled su <body>: backdrop-blur della barra sticky creerebbe un
          containing block per gli elementi fixed, vincolandola all'header. */}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end bg-slate-900/30 backdrop-blur-sm md:hidden"
            onClick={onClose}
          >
            <div
              className="animate-sheet-in w-full bg-white border-t border-slate-200 rounded-t-2xl shadow-2xl p-4 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Maniglia del foglio */}
              <div className="w-10 h-1.5 rounded-full bg-slate-300 mx-auto mb-4" />
              <CalendarGrid
                selected={selected}
                onSelect={onSelect}
                onClose={onClose}
              />
            </div>
          </div>,
          document.body,
        )}

      {/* Desktop: dropdown sotto il pulsante */}
      <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-72 hidden md:block">
        <CalendarGrid
          selected={selected}
          onSelect={onSelect}
          onClose={onClose}
        />
      </div>
    </>
  );
}

export default function CurrentWeekIndicator({ onInfoChange }) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const [selected, setSelected] = useState(now);
  const [open, setOpen] = useState(false);
  const info = useMemo(() => getWeekInfo(selected), [selected]);

  // Comunica al genitore la settimana risolta (null durante le pause),
  // cosi' il toggle Settimana A/B e il trimestre restano coerenti con la data.
  useEffect(() => {
    onInfoChange?.(info);
  }, [info, onInfoChange]);

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-sans">
      {/* Badge settimana corrente */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm">
        {info ? (
          <>
            <span className="font-black text-slate-900 text-base tracking-tight">
              {info.term}
            </span>
            <span className="text-slate-300 font-bold">•</span>
            <span className="font-semibold text-slate-600 text-sm tabular-nums">
              Sett. {info.week}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black border shadow-sm ${info.colorClass}`}
            >
              {info.type}
            </span>
          </>
        ) : (
          <span className="text-sm text-slate-500 font-medium">
            Break / Nessuna lezione
          </span>
        )}
      </div>

      {/* Selettore data */}
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Scegli data"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm rounded-full border border-slate-200 bg-white text-slate-700 font-medium shadow-sm hover:bg-slate-50 cursor-pointer transition-colors"
        >
          📅 <span className="tabular-nums">{formatDate(selected)}</span>
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
        href="https://www.accademiabellearti.fr.it/didattica/calendario-didattico/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
      >
        Calendario didattico ↗
      </a>
    </div>
  );
}
