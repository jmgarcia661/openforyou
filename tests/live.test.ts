import { describe, expect, it } from "vitest";
import { buildIcs, effectiveStatus, googleCalendarUrl, type LiveEvent } from "@/lib/live";

const event: LiveEvent = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Yoga, para soltar; costas",
  description: "Uma aula suave.",
  event_type: "yoga_gentle",
  level: null,
  teacher: null,
  materials: null,
  starts_at: "2026-11-23T18:00:00.000Z",
  duration_min: 60,
  timezone: "Europe/Lisbon",
  status: "scheduled",
  waiting_opens_min: 15,
  waiting_message: null,
  delay_message: null,
  late_message: null,
  entries_open: true,
  has_recording: true,
  recording_content_id: null,
};

describe("effectiveStatus", () => {
  it("fica agendada antes da janela da sala de espera", () => {
    expect(effectiveStatus(event, new Date("2026-11-23T17:00:00Z"))).toBe("scheduled");
  });
  it("abre a sala de espera 15 minutos antes", () => {
    expect(effectiveStatus(event, new Date("2026-11-23T17:46:00Z"))).toBe("waiting");
  });
  it("mantém em direto enquanto o administrador não terminar", () => {
    expect(effectiveStatus({ ...event, status: "live" }, new Date("2026-11-23T20:30:00Z"))).toBe("live");
  });
  it("dá como terminada uma aula esquecida sem terminar", () => {
    expect(effectiveStatus(event, new Date("2026-11-23T21:30:00Z"))).toBe("ended");
  });
  it("respeita o cancelamento", () => {
    expect(effectiveStatus({ ...event, status: "cancelled" }, new Date("2026-11-23T17:50:00Z"))).toBe("cancelled");
  });
});

describe("buildIcs", () => {
  const ics = buildIcs(event, "https://openforyou.vercel.app", new Date("2026-10-23T10:00:00Z"));
  it("tem as datas em UTC", () => {
    expect(ics).toContain("DTSTART:20261123T180000Z");
    expect(ics).toContain("DTEND:20261123T190000Z");
  });
  it("escapa vírgulas e pontos e vírgulas no título", () => {
    expect(ics).toContain("SUMMARY:Yoga\\, para soltar\\; costas");
  });
  it("usa o formato correto de linhas", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});

describe("googleCalendarUrl", () => {
  it("leva as datas e o título", () => {
    const url = googleCalendarUrl(event, "https://openforyou.vercel.app");
    expect(url).toContain("dates=20261123T180000Z%2F20261123T190000Z");
    expect(url).toContain("calendar.google.com");
  });
});
