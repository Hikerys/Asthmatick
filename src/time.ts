import type { AppSettings } from "./types";

/** Times in storage always use local 24-hour HH:mm, independent of UI language. */
export function normalizeTime(value: string): string {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([ap])\.?m\.?)?$/i);
  if (!match) return value;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59 || hour > (match[3] ? 12 : 23) || (match[3] && hour < 1)) return value;
  if (match[3]) hour = hour % 12 + (match[3].toLowerCase() === "p" ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function currentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function displayTime(value: string, language: AppSettings["language"] = document.documentElement.lang === "en" ? "en" : "ru"): string {
  const canonical = normalizeTime(value);
  if (language === "ru" || !/^\d{2}:\d{2}$/.test(canonical)) return canonical;
  const hour = Number(canonical.slice(0, 2));
  return `${hour % 12 || 12}:${canonical.slice(3)} ${hour < 12 ? "AM" : "PM"}`;
}
