"use client";
import React, { useCallback, useState, useSyncExternalStore } from "react";
import CurrentWeekIndicator from "@/components/CurrentWeek";

// Sostituisci con il tuo import effettivo
import data from "../lib/db.json";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const IT_DAYS = {
  Monday: "Lunedì",
  Tuesday: "Martedì",
  Wednesday: "Mercoledì",
  Thursday: "Giovedì",
  Friday: "Venerdì",
  Saturday: "Sabato",
};
const EN_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const TERMS = ["T1", "T2", "T3"];

// "Oggi" risolto via useSyncExternalStore: l'idratazione usa il snapshot del
// server (null), poi React aggiorna con il giorno reale del client. Nessun
// new Date() durante il render, nessun setState dentro un effect.
const subscribeToday = () => () => {};
const getTodayDay = () => EN_DAYS[new Date().getDay()];
const getServerTodayDay = () => null;

export default function Schedule() {
  const [activeTerm, setActiveTerm] = useState("T1");
  const [activeWeek, setActiveWeek] = useState("A");

  // Giorno della settimana odierno (inglese, come dayOfWeek in db.json)
  const todayDay = useSyncExternalStore(
    subscribeToday,
    getTodayDay,
    getServerTodayDay,
  );

  // Allinea i filtri alla settimana della data selezionata (all'avvio e quando
  // si cambia data dal calendario). Fuori calendario o in pausa si ripiega
  // sulla Settimana A, mentre il trimestre resta quello gia' scelto.
  const handleInfoChange = useCallback((info) => {
    if (!info) {
      setActiveWeek("A");
      return;
    }
    setActiveTerm(info.term);
    setActiveWeek(info.type);
  }, []);

  // Filtra i dati in base al trimestre e alle settimane selezionate
  const filteredData = data.filter((item) => {
    const isTermMatch = item.term.includes(activeTerm);
    const isWeekMatch = item.week.includes(activeWeek);
    return isTermMatch && isWeekMatch;
  });

  return (
    <div className="min-h-screen font-sans">
      {/* Barra superiore: titolo + indicatore settimana/data */}
      <header className="border-b border-zinc-700 bg-zinc-800/85">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-lg font-semibold tracking-tight pl-1 text-zinc-300 whitespace-nowrap">
            Orari <span className="text-zinc-50">GD</span> Biennio
          </h1>
          <CurrentWeekIndicator onInfoChange={handleInfoChange} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Controlli Filtri */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
          {/* Filtro Trimestre */}
          <div
            className="flex gap-1 rounded-full bg-zinc-700/80 p-1"
            role="group"
            aria-label="Selettore trimestre"
          >
            {TERMS.map((term) => (
              <button
                key={term}
                onClick={() => setActiveTerm(term)}
                aria-pressed={activeTerm === term}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                  activeTerm === term
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {term}
              </button>
            ))}
          </div>

          {/* Divisore Visivo */}
          <div className="hidden sm:block w-px h-8 bg-zinc-600 rounded-full"></div>

          {/* Filtro Settimane */}
          <div
            className="flex gap-1 rounded-full bg-zinc-700/80 p-1"
            role="group"
            aria-label="Selettore settimane"
          >
            <button
              onClick={() => setActiveWeek("A")}
              aria-pressed={activeWeek === "A"}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                activeWeek === "A"
                  ? "bg-red-100 text-red-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Settimana A
            </button>
            <button
              onClick={() => setActiveWeek("B")}
              aria-pressed={activeWeek === "B"}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                activeWeek === "B"
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Settimana B
            </button>
          </div>
        </div>

        {/* Griglia Calendario — nessun re-mount: i filtri aggiornano istantaneamente */}
        <div className="animate-grid-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {DAYS.map((day) => {
            const dayClasses = filteredData.filter(
              (item) => item.dayOfWeek === day,
            );
            const amClasses = dayClasses.filter((item) =>
              item.period.includes("AM"),
            );
            const pmClasses = dayClasses.filter((item) =>
              item.period.includes("PM"),
            );
            const isToday = todayDay === day;

            return (
              <section
                key={day}
                className={`flex flex-col rounded-xl bg-slate-50 overflow-hidden border shadow-md transition-shadow ${
                  isToday
                    ? activeWeek === "A"
                      ? "border-red-400 ring-2 ring-red-400/60"
                      : "border-blue-400 ring-2 ring-blue-400/60"
                    : "border-slate-300"
                }`}
              >
                <header className="flex items-center justify-between px-3 py-2.5 bg-slate-200/70 border-b border-slate-300">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
                    {IT_DAYS[day]}
                  </h2>
                  {isToday && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                        activeWeek === "A"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      Oggi
                    </span>
                  )}
                </header>

                {/* Fascia AM */}
                <div className="flex-1 p-3 border-b border-slate-200">
                  <h3 className="text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center justify-between">
                    <span>AM</span>
                    <span className="tabular-nums">09:00 – 13:00</span>
                  </h3>
                  {amClasses.length > 0 ? (
                    <ul className="space-y-3">
                      {amClasses.map((cls) => (
                        <ClassCard key={`${cls.id}-am`} data={cls} />
                      ))}
                    </ul>
                  ) : (
                    <EmptyState />
                  )}
                </div>

                {/* Fascia PM */}
                <div className="flex-1 p-3">
                  <h3 className="text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center justify-between">
                    <span>PM</span>
                    <span className="tabular-nums">14:00 – 18:00</span>
                  </h3>
                  {pmClasses.length > 0 ? (
                    <ul className="space-y-3">
                      {pmClasses.map((cls) => (
                        <ClassCard key={`${cls.id}-pm`} data={cls} />
                      ))}
                    </ul>
                  ) : (
                    <EmptyState />
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

// Stato vuoto leggero per fasce senza lezioni
function EmptyState() {
  return (
    <p className="text-xs text-slate-500 italic border border-dashed border-slate-300 rounded-lg px-3 py-2 text-center">
      Nessuna lezione
    </p>
  );
}

// Sotto-componente per le singole schede materia
function ClassCard({ data }) {
  return (
    <li className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm flex flex-col gap-2 transition hover:shadow-md hover:border-slate-400">
      <h4 className="font-semibold text-sm xl:text-[13px] leading-snug text-slate-900">
        {data.subject}
      </h4>
      <p className="text-xs text-slate-500">{data.professor}</p>

      {/* Sezione inferiore: Indicatori Settimana (sinistra) e Aula (destra) */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex gap-1">
          {data.week.includes("A") && (
            <span className="px-2 py-0.5 rounded-md  text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
              A
            </span>
          )}
          {data.week.includes("B") && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
              B
            </span>
          )}
        </div>

        <span className="px-2 py-0.5 rounded-md  text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
          Aula {data.classe}
        </span>
      </div>
    </li>
  );
}
