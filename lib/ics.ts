/**
 * lib/ics.ts — ICS (iCalendar) file builder + Google Calendar URL helper
 *
 * RFC 5545 compliant. Works with Google Calendar, Apple Calendar,
 * Outlook, and any standards-compliant calendar application.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  url?: string;
  /** All-day event: provide Date objects (time part is ignored) */
  allDay: true;
  dtstart: Date;
  /** Exclusive end: per RFC 5545 §3.6.1, DTEND for all-day = day AFTER last day */
  dtend: Date;
}

export interface TimedCalendarEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  url?: string;
  allDay: false;
  dtstart: Date;
  dtend: Date;
}

type AnyEvent = CalendarEvent | TimedCalendarEvent;

// ── Formatters ─────────────────────────────────────────────────────────────────

/** YYYYMMDD — for all-day event date values */
function fmtDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${dd}`;
}

/** YYYYMMDDTHHmmssZ — for timed event datetime values */
function fmtDateTime(d: Date): string {
  return d.toISOString().replace(/[-:.]/g, "").replace("000Z", "Z");
}

/** Escape special ICS chars in text fields */
function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Fold long ICS lines per RFC 5545 §3.1:
 * lines MUST NOT exceed 75 octets; fold with CRLF + single whitespace.
 */
function foldLine(line: string): string {
  const MAX = 75;
  if (line.length <= MAX) return line;
  const chunks: string[] = [];
  let i = 0;
  chunks.push(line.slice(0, MAX));
  i = MAX;
  while (i < line.length) {
    chunks.push(" " + line.slice(i, i + MAX - 1));
    i += MAX - 1;
  }
  return chunks.join("\r\n");
}

// ── Builder ────────────────────────────────────────────────────────────────────

/**
 * Build a complete VCALENDAR string from an array of events.
 *
 * @param events   Array of CalendarEvent (all-day) or TimedCalendarEvent
 * @param calName  Display name of the calendar (shown in most calendar apps)
 */
export function buildICSFile(events: AnyEvent[], calName = "NAMO"): string {
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NAMO//Neural Analytics for Management Optimization//EN",
    `X-WR-CALNAME:${icsEscape(calName)}`,
    "X-WR-TIMEZONE:UTC",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const ev of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${ev.uid}`));
    lines.push(`DTSTAMP:${fmtDateTime(now)}`);

    if (ev.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${fmtDate(ev.dtstart)}`);
      lines.push(`DTEND;VALUE=DATE:${fmtDate(ev.dtend)}`);
    } else {
      lines.push(`DTSTART:${fmtDateTime(ev.dtstart)}`);
      lines.push(`DTEND:${fmtDateTime(ev.dtend)}`);
    }

    lines.push(foldLine(`SUMMARY:${icsEscape(ev.summary)}`));

    if (ev.description) {
      lines.push(foldLine(`DESCRIPTION:${icsEscape(ev.description)}`));
    }
    if (ev.location) {
      lines.push(foldLine(`LOCATION:${icsEscape(ev.location)}`));
    }
    if (ev.url) {
      lines.push(foldLine(`URL:${ev.url}`));
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// ── Google Calendar URL ────────────────────────────────────────────────────────

/**
 * Build a "Add to Google Calendar" URL.
 * Opens calendar.google.com with the event pre-filled — no API key needed.
 */
export function buildGoogleCalendarUrl(opts: {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:.]/g, "").replace("000Z", "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${fmt(opts.start)}/${fmt(opts.end)}`,
  });
  if (opts.description) params.set("details", opts.description);
  if (opts.location)    params.set("location", opts.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
