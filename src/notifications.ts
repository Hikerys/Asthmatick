import { LocalNotifications } from "@capacitor/local-notifications";
import { ScheduleEvent, NotificationSound } from "./types";

export interface SoundOption {
  id: NotificationSound;
  title: string;
  subtitle: string;
  soundFile?: string;
}

export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: "system",
    title: "Системный звук",
    subtitle: "Стандартный сигнал вашего устройства",
  },
  {
    id: "sound_chime",
    title: "Колокольчик",
    subtitle: "Мягкий переливающийся звон",
    soundFile: "sound_chime.wav",
  },
  {
    id: "sound_breeze",
    title: "Лёгкий бриз",
    subtitle: "Спокойное гармоничное созвучие",
    soundFile: "sound_breeze.wav",
  },
  {
    id: "sound_digital",
    title: "Электронный сигнал",
    subtitle: "Чёткий современный двойной сигнал",
    soundFile: "sound_digital.wav",
  },
  {
    id: "sound_marimba",
    title: "Маримба",
    subtitle: "Тёплый акустический тон",
    soundFile: "sound_marimba.wav",
  },
];

export function getChannelId(sound: NotificationSound = "system"): string {
  return sound === "system" ? "asthmatick_reminders_v2" : `asthmatick_reminders_${sound}`;
}

/**
 * Initializes and registers high-priority notification channel on Android for chosen sound.
 * Android channels accept importance from 0 to 4 (4 = IMPORTANCE_HIGH).
 * Level 4 guarantees sound, vibration, and heads-up banner display.
 */
export async function setupNotificationChannel(sound: NotificationSound = "system"): Promise<void> {
  try {
    const channelId = getChannelId(sound);
    const soundOpt = SOUND_OPTIONS.find((s) => s.id === sound);

    await LocalNotifications.createChannel({
      id: channelId,
      name: `Напоминания (${soundOpt?.title || "Системный"})`,
      description: "Напоминания о приёме лекарств и ингаляций",
      importance: 4, // IMPORTANCE_HIGH (4) on Android: heads-up banner, sound, vibration
      visibility: 1, // VISIBILITY_PUBLIC (shows on lockscreen)
      vibration: true,
      lights: true,
      lightColor: "#168B7A",
      sound: soundOpt?.soundFile,
    });
  } catch (err) {
    console.warn("setupNotificationChannel error:", err);
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  try {
    await setupNotificationChannel();
    const status = await LocalNotifications.checkPermissions();
    return status.display === "granted";
  } catch (err) {
    if ("Notification" in window) {
      return Notification.permission === "granted";
    }
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    await setupNotificationChannel();
    const status = await LocalNotifications.requestPermissions();
    return status.display === "granted";
  } catch (err) {
    if ("Notification" in window) {
      const res = await Notification.requestPermission();
      return res === "granted";
    }
    return false;
  }
}

/**
 * Checks whether Android allows exact alarms (SCHEDULE_EXACT_ALARM).
 * On Android < 12, always returns true.
 */
export async function checkExactAlarmPermission(): Promise<boolean> {
  try {
    const exact = await LocalNotifications.checkExactNotificationSetting();
    return exact.exact_alarm === "granted";
  } catch (err) {
    return true;
  }
}

/**
 * Opens system settings screen for Exact Alarms ("Будильники и напоминания").
 */
export async function openExactAlarmSettings(): Promise<void> {
  try {
    await LocalNotifications.changeExactNotificationSetting();
  } catch (err) {
    console.warn("Could not open exact alarm settings:", err);
  }
}

export async function sendTestNotification(sound: NotificationSound = "system"): Promise<void> {
  await setupNotificationChannel(sound);
  const channelId = getChannelId(sound);
  const soundOpt = SOUND_OPTIONS.find((s) => s.id === sound);

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Asthmatick: Тестовое напоминание",
          body: `Звук: ${soundOpt?.title || "Системный"}. Уведомления успешно работают!`,
          id: Math.floor(Math.random() * 100000) + 1,
          channelId,
          sound: soundOpt?.soundFile,
          foreground: true,
          actionTypeId: "",
          extra: null,
        },
      ],
    });
  } catch (err) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Asthmatick: Тестовое напоминание", {
        body: `Звук: ${soundOpt?.title || "Системный"}. Уведомления успешно работают!`,
      });
    } else {
      alert("Уведомление от Asthmatick: Проверка напоминаний успешна!");
    }
  }
}

export async function clearAllNotifications(): Promise<void> {
  try {
    await LocalNotifications.cancelAll();
  } catch (err) {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Stable, deterministic 32-bit positive integer ID for notification per event and day
 */
function getDeterministicNotificationId(eventId: string, dayOfWeek: number): number {
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = (hash << 5) - hash + eventId.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 100000) * 10 + dayOfWeek;
}

export async function syncScheduleNotifications(
  events: ScheduleEvent[],
  sound: NotificationSound = "system"
): Promise<void> {
  try {
    await setupNotificationChannel(sound);

    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) {
      await clearAllNotifications();
      return;
    }

    // Cancel previously scheduled alarms before re-registering
    await clearAllNotifications();

    if (events.length === 0) {
      return;
    }

    const hasExact = await checkExactAlarmPermission();
    const channelId = getChannelId(sound);
    const soundOpt = SOUND_OPTIONS.find((s) => s.id === sound);
    const notifs = [];

    for (const ev of events) {
      const [hStr, mStr] = ev.time.split(":");
      const hours = parseInt(hStr, 10);
      const minutes = parseInt(mStr, 10);

      if (isNaN(hours) || isNaN(minutes)) continue;

      for (const dayOfWeek of ev.days) {
        // Capacitor weekday: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
        const capacitorWeekday = dayOfWeek === 7 ? 1 : dayOfWeek + 1;
        const notifId = getDeterministicNotificationId(ev.id, dayOfWeek);

        notifs.push({
          title: "Asthmatick: Время по плану",
          body: ev.title + (ev.note ? ` (${ev.note})` : ""),
          id: notifId,
          channelId,
          sound: soundOpt?.soundFile,
          foreground: true,
          // Only flag isExactNotification if permission is granted to prevent unwanted settings jumps
          isExactNotification: hasExact,
          isExactMandatory: false,
          schedule: {
            on: {
              weekday: capacitorWeekday as any,
              hour: hours,
              minute: minutes,
              second: 0, // Explicitly 0 seconds to avoid arbitrary minute-offset drift
            },
            repeats: true,
            allowWhileIdle: true, // Guarantees wake-up even in Doze/standby
          },
        });
      }
    }

    if (notifs.length > 0) {
      await LocalNotifications.schedule({ notifications: notifs });
    }
  } catch (err) {
    console.warn("Could not sync local notifications:", err);
  }
}

// Audio preview handler in webview
let currentAudio: HTMLAudioElement | null = null;

export function playSoundPreview(sound: NotificationSound): void {
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }

    if (sound === "system") {
      playWebAudioBeep();
      return;
    }

    const soundOpt = SOUND_OPTIONS.find((s) => s.id === sound);
    if (!soundOpt?.soundFile) {
      playWebAudioBeep();
      return;
    }

    const audio = new Audio(`./sounds/${soundOpt.soundFile}`);
    currentAudio = audio;
    audio.play().catch(() => {
      playWebAudioBeep();
    });
  } catch {
    playWebAudioBeep();
  }
}

function playWebAudioBeep(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // ignore
  }
}
