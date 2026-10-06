import academicWeeks from "./weeks.json";

// Risolve la settimana accademica corrente per una data:
// - settimana dispari => "A", settimana pari => "B"
// - restituisce null durante le pause (Break) o fuori calendario
export function getWeekInfo(date) {
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