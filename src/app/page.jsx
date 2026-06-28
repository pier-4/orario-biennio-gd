"use client";
import React, { useState } from "react";

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
const TERMS = ["T1", "T2", "T3"];

export default function Schedule() {
  const [activeTerm, setActiveTerm] = useState("T1");

  // Filtra i dati in base al trimestre selezionato
  const termData = data.filter((item) => item.term.includes(activeTerm));

  return (
    <div className="max-w-7xl mx-auto p-4 font-sans bg-zinc-100 min-h-screen min-w-screen">
      {/* Controlli Trimestre */}
      <div
        className="flex gap-2 mb-8"
        role="group"
        aria-label="Selettore trimestre"
      >
        {TERMS.map((term) => (
          <button
            key={term}
            onClick={() => setActiveTerm(term)}
            aria-pressed={activeTerm === term}
            className={`px-6 py-2 rounded-md font-semibold transition-colors ${
              activeTerm === term
                ? "bg-slate-900 text-white"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {term}
          </button>
        ))}
      </div>

      {/* Griglia Calendario */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {DAYS.map((day) => {
          const dayClasses = termData.filter((item) => item.dayOfWeek === day);
          const amClasses = dayClasses.filter((item) =>
            item.period.includes("AM"),
          );
          const pmClasses = dayClasses.filter((item) =>
            item.period.includes("PM"),
          );

          return (
            <section
              key={day}
              className="flex flex-col border rounded-lg bg-slate-50 overflow-hidden"
            >
              <header className="bg-slate-200 p-3 text-center font-bold uppercase tracking-wider text-sm text-slate-800">
                {day}
              </header>

              {/* Fascia AM */}
              <div className="flex-1 p-3 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase flex items-center justify-between">
                  <span>AM</span>
                  <span>09:00 - 13:00</span>
                </h3>
                <ul className="space-y-3">
                  {amClasses.map((cls) => (
                    <ClassCard key={`${cls.id}-am`} data={cls} />
                  ))}
                  {amClasses.length === 0 && (
                    <p className="text-sm text-slate-400 italic">
                      Nessuna lezione
                    </p>
                  )}
                </ul>
              </div>

              {/* Fascia PM */}
              <div className="flex-1 p-3">
                <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase flex items-center justify-between">
                  <span>PM</span>
                  <span>14:00 - 18:00</span>
                </h3>
                <ul className="space-y-3">
                  {pmClasses.map((cls) => (
                    <ClassCard key={`${cls.id}-pm`} data={cls} />
                  ))}
                  {pmClasses.length === 0 && (
                    <p className="text-sm text-slate-400 italic">
                      Nessuna lezione
                    </p>
                  )}
                </ul>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// Sotto-componente per le singole schede materia
function ClassCard({ data }) {
  return (
    <li className="bg-white p-3 rounded shadow-sm border border-slate-100 flex flex-col gap-2">
      <h4 className="font-semibold text-sm leading-tight text-slate-900">
        {data.subject}
      </h4>
      <p className="text-xs text-slate-600">{data.professor}</p>

      {/* Indicatori Settimana A/B */}
      <div className="flex gap-1 mt-auto pt-2">
        {data.week.includes("A") && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
            Sett A
          </span>
        )}
        {data.week.includes("B") && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
            Sett B
          </span>
        )}
      </div>
    </li>
  );
}
