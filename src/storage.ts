import { ScheduleEvent, AttackRecord, NoteRecord, AppSettings, DatabaseBackup, Severity, APP_VERSION } from "./types";

const SCHEDULE_KEY = "asthmatick_schedule_events";
const ATTACKS_KEY = "asthmatick_attacks";
const NOTES_KEY = "asthmatick_notes";
const SETTINGS_KEY = "asthmatick_settings";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  notificationsEnabled: false,
  notificationSound: "system",
  hasSeenOnboarding: false,
};

// Formats Date to YYYY-MM-DD
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Current day of week in ISO (1 = Monday, ..., 7 = Sunday)
export function getIsoDayOfWeek(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export function loadScheduleEvents(): ScheduleEvent[] {
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveScheduleEvents(events: ScheduleEvent[]): void {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(events));
}

export function loadAttacks(): AttackRecord[] {
  try {
    const raw = localStorage.getItem(ATTACKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAttacks(attacks: AttackRecord[]): void {
  localStorage.setItem(ATTACKS_KEY, JSON.stringify(attacks));
}

export function loadNotes(): NoteRecord[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotes(notes: NoteRecord[]): void {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Get worst attack severity for a given date string ("YYYY-MM-DD")
export function getWorstSeverityForDate(dateStr: string, attacks: AttackRecord[]): Severity | null {
  const dayAttacks = attacks.filter((a) => a.date === dateStr);
  if (dayAttacks.length === 0) return null;

  if (dayAttacks.some((a) => a.severity === "heavy")) return "heavy";
  if (dayAttacks.some((a) => a.severity === "medium")) return "medium";
  if (dayAttacks.some((a) => a.severity === "light")) return "light";
  return null;
}

export interface ScheduleStatusInfo {
  isCompleted: boolean;
  isMissed: boolean;
  isTooEarly: boolean;
  canComplete: boolean;
  windowStartTime: string;
  windowEndTime: string;
  displayTime: string;
  statusText: string;
}

export function getScheduleStatusInfo(
  event: ScheduleEvent,
  targetDateStr: string,
  now: Date = new Date()
): ScheduleStatusInfo {
  const isCompleted = !!event.completedDates?.includes(targetDateStr);
  const completionTime = event.completionTimes?.[targetDateStr];
  const displayTime = isCompleted && completionTime ? completionTime : event.time;

  const [h, m] = event.time.split(":").map(Number);
  const schedMinutes = (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  const startMin = schedMinutes - 60;
  const endMin = schedMinutes + 60;

  const formatMinStr = (mins: number) => {
    const normalized = ((mins % 1440) + 1440) % 1440;
    const hh = String(Math.floor(normalized / 60)).padStart(2, "0");
    const mm = String(normalized % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const windowStartTime = formatMinStr(startMin);
  const windowEndTime = formatMinStr(endMin);

  if (isCompleted) {
    return {
      isCompleted: true,
      isMissed: false,
      isTooEarly: false,
      canComplete: false,
      windowStartTime,
      windowEndTime,
      displayTime,
      statusText: "Выполнено",
    };
  }

  const todayStr = formatDateKey(now);

  if (targetDateStr < todayStr) {
    return {
      isCompleted: false,
      isMissed: true,
      isTooEarly: false,
      canComplete: false,
      windowStartTime,
      windowEndTime,
      displayTime,
      statusText: "Пропущено",
    };
  }

  if (targetDateStr > todayStr) {
    return {
      isCompleted: false,
      isMissed: false,
      isTooEarly: true,
      canComplete: false,
      windowStartTime,
      windowEndTime,
      displayTime,
      statusText: "Запланировано",
    };
  }

  // targetDateStr === todayStr
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (nowMinutes < startMin) {
    return {
      isCompleted: false,
      isMissed: false,
      isTooEarly: true,
      canComplete: false,
      windowStartTime,
      windowEndTime,
      displayTime,
      statusText: "Запланировано",
    };
  } else if (nowMinutes > endMin) {
    return {
      isCompleted: false,
      isMissed: true,
      isTooEarly: false,
      canComplete: false,
      windowStartTime,
      windowEndTime,
      displayTime,
      statusText: "Пропущено",
    };
  } else {
    return {
      isCompleted: false,
      isMissed: false,
      isTooEarly: false,
      canComplete: true,
      windowStartTime,
      windowEndTime,
      displayTime,
      statusText: "Запланировано",
    };
  }
}

// Export full backup
export function createDatabaseBackup(): DatabaseBackup {
  return {
    version: APP_VERSION,
    exportDate: new Date().toISOString(),
    packageId: "app.asthma.tick",
    scheduleEvents: loadScheduleEvents(),
    attacks: loadAttacks(),
    notes: loadNotes(),
    settings: loadSettings(),
  };
}

// Import full backup
export function restoreDatabaseBackup(backup: DatabaseBackup): boolean {
  try {
    if (!backup || !backup.packageId) {
      throw new Error("Invalid backup format");
    }
    if (Array.isArray(backup.scheduleEvents)) {
      saveScheduleEvents(backup.scheduleEvents);
    }
    if (Array.isArray(backup.attacks)) {
      saveAttacks(backup.attacks);
    }
    if (Array.isArray(backup.notes)) {
      saveNotes(backup.notes);
    }
    if (backup.settings) {
      saveSettings({ ...DEFAULT_SETTINGS, ...backup.settings });
    }
    return true;
  } catch (err) {
    console.error("Failed to restore backup:", err);
    return false;
  }
}
