import dayjs from "dayjs";
import dayjstimezone from "dayjs/plugin/timezone";
import dayjsutc from "dayjs/plugin/utc";
import { lskTime } from "./constants";

dayjs.extend(dayjsutc);
dayjs.extend(dayjstimezone);

export function updateDateTz(date: Date, amdStr: string, timeStr: string, tz: string) {
  if (!amdStr || !timeStr) return;
  const [year, month, day] = amdStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const d1 = dayjs.tz(`${year}-${month}-${day} ${hour}:${minute}`, tz).utc();
  date.setUTCFullYear(d1.year());
  date.setUTCMonth(d1.month());
  date.setUTCDate(d1.date());
  date.setUTCHours(d1.hour());
  date.setUTCMinutes(d1.minute());
  date.setUTCSeconds(d1.second());
  localStorage.setItem(lskTime, date.valueOf().toString());
}

