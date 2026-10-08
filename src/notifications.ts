import { LocalNotifications } from "@capacitor/local-notifications";
import { ScheduleEvent } from "./types";

export const REMINDER_CHANNEL_ID = "asthmatick_reminders_v2";

/**
 * Initializes and registers high-priority notification channel on Android.
 * Android channels accept importance from 0 to 4 (4 = IMPORTANCE_HIGH).
 * Level 4 guarantees sound, vibration, and heads-up banner display.
 * (Level 5 is invalid in Android and throws IllegalArgumentException).
 */
export async function setupNotificationChannel(): Promise<void> {
  try {
    // Delete legacy/corrupted channel if it exists
    try {
      await LocalNotifications.deleteChannel({ id: "asthmatick_reminders" });
    } catch {
      // ignore
    }

    await LocalNotifications.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: "Напоминания Asthmatick",
      description: "Напоминания о приёме лекарств и ингаляций",
      importance: 4, // IMPORTANCE_HIGH (4) on Android: heads-up banner, sound, vibration
      visibility: 1, // VISIBILITY_PUBLIC (shows on lockscreen)
      vibration: true,
      lights: true,
      lightColor: "#168B7A",
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

export async function sendTestNotification(): Promise<void> {
  await setupNotificationChannel();

  try {
    // Schedule immediate notification without waiting for alarm manager
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Asthmatick: Тестовое напоминание",
          body: "Уведомления успешно работают! Дышите легко.",
          id: Math.floor(Math.random() * 100000) + 1,
          channelId: REMINDER_CHANNEL_ID,
          foreground: true,
          actionTypeId: "",
          extra: null,
        },
      ],
    });
  } catch (err) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Asthmatick: Тестовое напоминание", {
        body: "Уведомления успешно работают! Дышите легко.",
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

export async function syncScheduleNotifications(events: ScheduleEvent[]): Promise<void> {
  try {
    await setupNotificationChannel();

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
          channelId: REMINDER_CHANNEL_ID,
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
