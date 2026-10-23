export type LiveStatus = "scheduled" | "waiting" | "live" | "ended" | "cancelled";

export const EVENT_TYPES: Record<string, string> = {
  yoga_active: "Yoga ativo",
  yoga_gentle: "Yoga suave",
  yoga_restorative: "Yoga restaurativo",
  meditation: "Meditação",
  community: "Encontro da comunidade",
  workshop: "Workshop",
  retreat: "Retiro",
  nature: "Experiência na natureza",
};

export const LIVE_STATUS_LABEL: Record<LiveStatus, string> = {
  scheduled: "Agendada",
  waiting: "Sala de espera disponível",
  live: "Em direto",
  ended: "Terminada",
  cancelled: "Cancelada",
};

export type LiveEvent = {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  level: string | null;
  teacher: string | null;
  materials: string | null;
  starts_at: string;
  duration_min: number;
  timezone: string;
  status: LiveStatus;
  waiting_opens_min: number;
  waiting_message: string | null;
  delay_message: string | null;
  late_message: string | null;
  entries_open: boolean;
  has_recording: boolean;
  recording_content_id: string | null;
};

export const LIVE_COLUMNS =
  "id, title, description, event_type, level, teacher, materials, starts_at, duration_min, timezone, status, waiting_opens_min, waiting_message, delay_message, late_message, entries_open, has_recording, recording_content_id";

type StatusInput = Pick<LiveEvent, "status" | "starts_at" | "waiting_opens_min" | "duration_min">;

/**
 * Estado que a pessoa vê. A sala de espera abre sozinha antes da hora marcada,
 * e uma aula esquecida sem terminar passa a "terminada" algum tempo depois do fim.
 */
export function effectiveStatus(event: StatusInput, now: Date = new Date()): LiveStatus {
  const start = new Date(event.starts_at).getTime();
  const t = now.getTime();

  if (event.status === "scheduled" || event.status === "waiting") {
    if (t > start + (event.duration_min + 60) * 60_000) return "ended";
  }
  if (event.status !== "scheduled") return event.status;
  if (t >= start - event.waiting_opens_min * 60_000) return "waiting";
  return "scheduled";
}

export function endsAt(event: Pick<LiveEvent, "starts_at" | "duration_min">): Date {
  return new Date(new Date(event.starts_at).getTime() + event.duration_min * 60_000);
}

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Ficheiro de calendário (.ics) para Apple Calendar, Outlook e outros. */
export function buildIcs(event: LiveEvent, siteUrl: string, now: Date = new Date()): string {
  const link = `${siteUrl}/aulas/${event.id}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Open For You//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@openforyou`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(new Date(event.starts_at))}`,
    `DTEND:${icsDate(endsAt(event))}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(`${event.description ?? ""}\nEntrar pelo Open For You: ${link}`.trim())}`,
    `URL:${link}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

export function googleCalendarUrl(event: LiveEvent, siteUrl: string): string {
  const dates = `${icsDate(new Date(event.starts_at))}/${icsDate(endsAt(event))}`;
  const details = `${event.description ?? ""}\nEntrar pelo Open For You: ${siteUrl}/aulas/${event.id}`.trim();
  const params = new URLSearchParams({ action: "TEMPLATE", text: event.title, dates, details });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
