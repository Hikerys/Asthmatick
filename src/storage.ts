import { Capacitor, registerPlugin } from "@capacitor/core";
import { ScheduleEvent, AttackRecord, NoteRecord, AppSettings, Severity } from "./types";
import { normalizeTime } from "./time";

const NativeDatabase = registerPlugin<{
  initialize(options: { legacy: string }): Promise<{ snapshot: string }>;
  save(options: { snapshot: string }): Promise<void>;
  exportDatabase(options: { filename: string }): Promise<{ success?: boolean; cancelled?: boolean }>;
  importDatabase(): Promise<{ success?: boolean; cancelled?: boolean; snapshot?: string }>;
}>("AsthmatickDatabase");

const SCHEDULE_KEY = "asthmatick_schedule_events";
const ATTACKS_KEY = "asthmatick_attacks";
const NOTES_KEY = "asthmatick_notes";
const SETTINGS_KEY = "asthmatick_settings";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  language: "ru",
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

interface Snapshot {
  scheduleEvents: ScheduleEvent[];
  attacks: AttackRecord[];
  notes: NoteRecord[];
  settings: AppSettings;
}

const DATABASE_NAME = "asthmatick";
const DATABASE_STORE = "data";
let snapshot: Snapshot = { scheduleEvents: [], attacks: [], notes: [], settings: DEFAULT_SETTINGS };
let pendingSave: Promise<void> = Promise.resolve();
let database: IDBDatabase | null = null;

function legacySnapshot(): Snapshot {
  const read = (key: string, fallback: unknown) => {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
    catch { return fallback; }
  };
  const records = <T extends { id: string }>(key: string): T[] => {
    const value = read(key, []);
    return Array.isArray(value) ? value.filter((item): item is T => item && typeof item.id === "string") : [];
  };
  const oldSettings = read(SETTINGS_KEY, {});
  return {
    scheduleEvents: records<ScheduleEvent>(SCHEDULE_KEY),
    attacks: records<AttackRecord>(ATTACKS_KEY),
    notes: records<NoteRecord>(NOTES_KEY),
    settings: { ...DEFAULT_SETTINGS, ...(oldSettings && typeof oldSettings === "object" ? oldSettings : {}) },
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(DATABASE_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readWeb(): Promise<Snapshot | undefined> {
  return new Promise((resolve, reject) => {
    const request = database!.transaction(DATABASE_STORE).objectStore(DATABASE_STORE).get("snapshot");
    request.onsuccess = () => resolve(request.result as Snapshot | undefined);
    request.onerror = () => reject(request.error);
  });
}

function saveWeb(value: Snapshot): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database!.transaction(DATABASE_STORE, "readwrite");
    transaction.objectStore(DATABASE_STORE).put(value, "snapshot");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function writeSnapshot(value: Snapshot): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await NativeDatabase.save({ snapshot: JSON.stringify(value) });
  } else {
    await saveWeb(value);
  }
}

export async function initializeStorage(): Promise<void> {
  const legacy = legacySnapshot();
  if (Capacitor.isNativePlatform()) {
    const result = await NativeDatabase.initialize({ legacy: JSON.stringify(legacy) });
    snapshot = JSON.parse(result.snapshot) as Snapshot;
  } else {
    database = await openDatabase();
    const saved = await readWeb();
    snapshot = saved || legacy;
    if (!saved) await saveWeb(snapshot);
  }
  snapshot.settings = { ...DEFAULT_SETTINGS, ...snapshot.settings };
  normalizeSnapshotTimes();
  // Legacy data stays available until migration is committed. Clearing browser data
  // afterwards does not affect Android's SQLite database.
}

function normalizeSnapshotTimes(): void {
  let changed = false;
  const fix = (value: string) => {
    const normalized = normalizeTime(value);
    if (normalized !== value) changed = true;
    return normalized;
  };
  snapshot.scheduleEvents = snapshot.scheduleEvents.map((event) => ({
    ...event,
    time: fix(event.time),
    completionTimes: event.completionTimes && Object.fromEntries(
      Object.entries(event.completionTimes).map(([date, time]) => [date, fix(time)])
    ),
  }));
  snapshot.attacks = snapshot.attacks.map((attack) => ({ ...attack, time: fix(attack.time) }));
  snapshot.notes = snapshot.notes.map((note) => ({ ...note, time: fix(note.time) }));
  if (changed) persist();
}

function persist(): void {
  const value = JSON.parse(JSON.stringify(snapshot)) as Snapshot;
  pendingSave = pendingSave.catch(() => {}).then(() => writeSnapshot(value));
  pendingSave.catch((error) => {
    console.error("Could not save Asthmatick data", error);
    window.dispatchEvent(new Event("asthmatick-storage-error"));
  });
}

export function waitForStorage(): Promise<void> { return pendingSave; }
export function loadScheduleEvents(): ScheduleEvent[] { return snapshot.scheduleEvents; }
export function saveScheduleEvents(events: ScheduleEvent[]): void { snapshot.scheduleEvents = events.map((event) => ({ ...event, time: normalizeTime(event.time) })); persist(); }
export function loadAttacks(): AttackRecord[] { return snapshot.attacks; }
export function saveAttacks(attacks: AttackRecord[]): void { snapshot.attacks = attacks.map((attack) => ({ ...attack, time: normalizeTime(attack.time) })); persist(); }
export function loadNotes(): NoteRecord[] { return snapshot.notes; }
export function saveNotes(notes: NoteRecord[]): void { snapshot.notes = notes.map((note) => ({ ...note, time: normalizeTime(note.time) })); persist(); }
export function loadSettings(): AppSettings { return snapshot.settings; }
export function saveSettings(settings: AppSettings): void { snapshot.settings = settings; persist(); }

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

export async function exportSQLiteBackup(filename: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) throw new Error("Экспорт SQLite доступен в приложении Android.");
  await pendingSave;
  const result = await NativeDatabase.exportDatabase({ filename });
  return result.success === true;
}

export async function importSQLiteBackup(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) throw new Error("Импорт SQLite доступен в приложении Android.");
  await pendingSave;
  const result = await NativeDatabase.importDatabase();
  if (!result.success || !result.snapshot) return false;
  const imported = JSON.parse(result.snapshot) as Snapshot;
  snapshot = { ...imported, settings: { ...DEFAULT_SETTINGS, ...imported.settings } };
  normalizeSnapshotTimes();
  return true;
}
