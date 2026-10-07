export type Severity = "light" | "medium" | "heavy";

export interface ScheduleEvent {
  id: string;
  title: string;
  time: string; // "HH:mm"
  days: number[]; // 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
  note?: string;
  completedDates: string[]; // ["YYYY-MM-DD"]
  completionTimes?: Record<string, string>; // { "YYYY-MM-DD": "HH:mm" }
  createdAt: number;
}

export interface AttackRecord {
  id: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  severity: Severity;
  trigger?: string; // Optional trigger/cause e.g. "пробежка"
  note?: string;
  completed?: boolean;
  createdAt: number;
}

export interface NoteRecord {
  id: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  title: string;
  description?: string;
  completed?: boolean;
  createdAt: number;
}

export interface AppSettings {
  theme: "light" | "dark";
  notificationsEnabled: boolean;
  hasSeenOnboarding: boolean;
}

export interface DatabaseBackup {
  version: string;
  exportDate: string;
  packageId: string;
  scheduleEvents: ScheduleEvent[];
  attacks: AttackRecord[];
  notes: NoteRecord[];
  settings: AppSettings;
}

export type TimelineItem =
  | {
      type: "schedule";
      id: string;
      time: string;
      title: string;
      subtitle: string;
      completed: boolean;
      isMissed?: boolean;
      isTooEarly?: boolean;
      canComplete?: boolean;
      windowStartTime?: string;
      windowEndTime?: string;
      originalTime?: string;
      raw: ScheduleEvent;
    }
  | {
      type: "attack";
      id: string;
      time: string;
      title: string;
      subtitle: string;
      severity: Severity;
      completed: boolean;
      raw: AttackRecord;
    }
  | {
      type: "note";
      id: string;
      time: string;
      title: string;
      subtitle: string;
      completed: boolean;
      raw: NoteRecord;
    };
