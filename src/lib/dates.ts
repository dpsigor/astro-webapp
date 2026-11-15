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
 * `tz`, to an instant. Returns null while either input is incomplete.
 */
export function fromZonedInputs(
  dateStr: string,
  timeStr: string,
  tz: string,
): Date | null {
  if (!dateStr || !timeStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  const d = dayjs.tz(`${year}-${month}-${day} ${hour}:${minute}`, tz);
  return d.isValid() ? d.toDate() : null;
}

/** Formats an instant as the value of an `<input type="date">`, in UTC. */
export function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}
