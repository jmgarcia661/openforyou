const pad = (n: number) => String(n).padStart(2, "0");

function zonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const list = formatter.formatToParts(date);
  const get = (type: string) => Number(list.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

/** Diferença, em milissegundos, entre a hora local de um fuso e a hora UTC. */
function offsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Converte "2026-11-23T18:00" (hora local num fuso) para o instante UTC correspondente. */
export function zonedTimeToUtc(local: string, timeZone: string): Date {
  const [datePart, timePart] = local.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const first = offsetMs(new Date(guess), timeZone);
  let utc = guess - first;
  const second = offsetMs(new Date(utc), timeZone);
  if (second !== first) utc = guess - second;
  return new Date(utc);
}

/** Converte um instante UTC para o formato de um campo datetime-local, na hora de um fuso. */
export function utcToZonedInput(iso: string, timeZone: string): { date: string; time: string } {
  const p = zonedParts(new Date(iso), timeZone);
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` };
}

/** Soma dias a uma hora local "YYYY-MM-DDTHH:mm", mantendo a hora do relógio. */
export function addDaysLocal(local: string, days: number): string {
  const [datePart, timePart] = local.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const moved = new Date(Date.UTC(y, mo - 1, d + days));
  return `${moved.getUTCFullYear()}-${pad(moved.getUTCMonth() + 1)}-${pad(moved.getUTCDate())}T${timePart}`;
}

export function dayKey(iso: string, timeZone: string): string {
  const p = zonedParts(new Date(iso), timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(iso));
}

export function formatDayHeading(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long", timeZone }).format(
    new Date(iso),
  );
}

export function formatDateTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export const TIMEZONES = [
  "Europe/Lisbon",
  "Atlantic/Azores",
  "Atlantic/Madeira",
  "Europe/London",
  "Europe/Paris",
  "Europe/Zurich",
  "Europe/Madrid",
  "America/Sao_Paulo",
  "America/New_York",
  "Africa/Luanda",
  "Africa/Maputo",
];
