import dayjs from 'dayjs';
import dayjstimezone from 'dayjs/plugin/timezone';
import dayjsutc from 'dayjs/plugin/utc';

dayjs.extend(dayjsutc);
dayjs.extend(dayjstimezone);

/** Time zones the browser knows about; empty when it cannot list them. */
export const supportedTimezones: string[] =
  (
    Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
  ).supportedValuesOf?.('timeZone') ?? [];

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function localTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Formats an instant as the values of `<input type="date">` and `<input type="time">`. */
export function toZonedInputs(date: Date, tz: string) {
  const d = dayjs(date).tz(tz);
  return { date: d.format('YYYY-MM-DD'), time: d.format('HH:mm') };
}

/**
 * Converts the values of a date and a time input, read as wall-clock time in
 * `tz`, to an instant. Returns null while either input is incomplete, which
 * includes a year still being typed: the input reports it as 0002, 0020, ...
 */
export function fromZonedInputs(
  dateStr: string,
  timeStr: string,
  tz: string,
): Date | null {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const timeParts = /^(\d{2}):(\d{2})(?::|$)/.exec(timeStr);
  if (!dateParts || !timeParts) return null;
  const [year, month, day] = dateParts.slice(1).map(Number);
  const [hour, minute] = timeParts.slice(1).map(Number);
  // Below 100 the year would be read as 19xx.
  if (year < 1000) return null;
  const d = dayjs.tz(`${year}-${month}-${day} ${hour}:${minute}`, tz);
  return d.isValid() ? d.toDate() : null;
}

/** Formats an instant as the value of an `<input type="date">`, in UTC. */
export function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}
