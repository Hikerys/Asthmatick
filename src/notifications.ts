import { LocalNotifications } from "@capacitor/local-notifications";
import { ScheduleEvent } from "./types";

const REMINDER_CHANNEL_ID = "asthmatick_reminders";

/**
 * Initializes and registers high-priority notification channel on Android.
 * Importance 5 ensures heads-up display, sound, and vibration even during standby.
 */
export async function setupNotificationChannel(): Promise<void> {
  try {
    await LocalNotifications.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: "Напоминания Asthmatick",
      description: "Напоминания о приёме лекарств и ингаляций",
      importance: 5, // MAX importance on Android (heads-up notification)
      visibility: 1, // VISIBILITY_PUBLIC (shows on lockscreen)
      vibration: true,
      lights: true,
      lightColor: "#168B7A",
    });
  } catch (err) {
    // Web or channels not supported on this platform
    console.debug("setupNotificationChannel:", err);
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
    const granted = status.display === "granted";

    // On Android 12+, check if exact alarms are allowed
    if (granted) {
      try {
        const exact = await LocalNotifications.checkExactNotificationSetting();
        if (exact.exact_alarm === "prompt" || exact.exact_alarm === "denied") {
          await LocalNotifications.changeExactNotificationSetting();
        }
      } catch (e) {
        // Ignored on non-Android or older versions
      }
    }

    return granted;
  } catch (err) {
    if ("Notification" in window) {
      const res = await Notification.requestPermission();
      return res === "granted";
    }
    return false;
  }
}

export async function checkExactAlarmPermission(): Promise<boolean> {
  try {
    const exact = await LocalNotifications.checkExactNotificationSetting();
    return exact.exact_alarm === "granted";
  } catch (err) {
    return true;
  }
}

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
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Asthmatick: Тестовое напоминание",
          body: "Уведомления успешно работают! Дышите легко.",
          id: Math.floor(Math.random() * 100000) + 1,
          channelId: REMINDER_CHANNEL_ID,
          foreground: true,
          isExactNotification: true,
          schedule: {
            at: new Date(Date.now() + 50),
            allowWhileIdle: true,
          },
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

export async function syncScheduleNotifications(events: ScheduleEvent[]): Promise<void> {
  try {
    await setupNotificationChannel();

    // Cancel all previous scheduled notifications
    try {
      await LocalNotifications.cancelAll();
    } catch (e) {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    }

    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) return;

    const notifs = [];
    let idCounter = 1000;

    for (const ev of events) {
      const [hStr, mStr] = ev.time.split(":");
      const hours = parseInt(hStr, 10);
      const minutes = parseInt(mStr, 10);

      if (isNaN(hours) || isNaN(minutes)) continue;

      for (const dayOfWeek of ev.days) {
        idCounter++;
        // Capacitor weekday: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
        const capacitorWeekday = dayOfWeek === 7 ? 1 : dayOfWeek + 1;

        notifs.push({
          title: "Asthmatick: Время по плану",
          body: ev.title + (ev.note ? ` (${ev.note})` : ""),
          id: idCounter,
          channelId: REMINDER_CHANNEL_ID,
          foreground: true,
          isExactNotification: true,
          isExactMandatory: false,
          schedule: {
            on: {
              weekday: capacitorWeekday,
              hour: hours,
              minute: minutes,
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
