package app.asthma.tick;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import java.time.*;
import java.util.*;
import org.json.*;

/** One next occurrence per schedule, rearmed after delivery, reboot and clock changes. */
public class ReminderReceiver extends BroadcastReceiver {
  private static PendingIntent pending(Context c, String id) {
    Intent i = new Intent(c, ReminderReceiver.class)
                   .setAction("app.asthma.tick.REMIND")
                   .setData(Uri.parse("asthmatick:reminder/" + Uri.encode(id)))
                   .putExtra("id", id);
    return PendingIntent.getBroadcast(
        c, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
  }
  static void sync(Context c, JSONObject snapshot) {
    AlarmManager alarms = c.getSystemService(AlarmManager.class);
    android.content.SharedPreferences prefs =
        c.getSharedPreferences("native_reminders", Context.MODE_PRIVATE);
    for (String id : prefs.getStringSet("ids", Collections.emptySet()))
      alarms.cancel(pending(c, id));
    Set<String> ids = new HashSet<>();
    if (snapshot.optJSONObject("settings").optBoolean("notificationsEnabled", false)) {
      ZonedDateTime now = ZonedDateTime.now();
      for (JSONObject event : Records.list(snapshot, 0)) {
        for (int i = 0; i <= 7; i++) {
          LocalDate date = now.toLocalDate().plusDays(i);
          if (!Records.contains(event.optJSONArray("days"), date.getDayOfWeek().getValue())
              || Records.completed(event, date))
            continue;
          ZonedDateTime next =
              date.atTime(LocalTime.parse(event.optString("time"))).atZone(now.getZone());
          if (!next.isAfter(now))
            continue;
          String id = event.optString("id");
          PendingIntent pi = pending(c, id);
          long at = next.toInstant().toEpochMilli();
          try {
            if (Build.VERSION.SDK_INT < 31 || alarms.canScheduleExactAlarms())
              alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            else
              alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
          } catch (SecurityException e) {
            alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
          }
          ids.add(id);
          break;
        }
      }
    }
    prefs.edit().putStringSet("ids", ids).apply();
  }
  static Uri sound(Context c, String name) {
    if (!Arrays.asList("sound_chime", "sound_breeze", "sound_digital", "sound_marimba")
            .contains(name))
      return android.provider.Settings.System.DEFAULT_NOTIFICATION_URI;
    return Uri.parse("android.resource://" + c.getPackageName() + "/raw/" + name);
  }
  static void notify(Context c, JSONObject settings, String title, String body, String tag) {
    if (Build.VERSION.SDK_INT >= 33
        && ContextCompat.checkSelfPermission(c, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED)
      return;
    String sound = settings.optString("notificationSound", "system");
    String channel = "native_medicine_" + sound;
    NotificationManager manager = c.getSystemService(NotificationManager.class);
    if (Build.VERSION.SDK_INT >= 26) {
      NotificationChannel ch =
          new NotificationChannel(channel, "Asthmatick", NotificationManager.IMPORTANCE_HIGH);
      ch.setSound(sound(c, sound),
          new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build());
      ch.enableVibration(true);
      manager.createNotificationChannel(ch);
    }
    PendingIntent open = PendingIntent.getActivity(c, 0, new Intent(c, MainActivity.class),
        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    manager.notify(tag, 1,
        new NotificationCompat.Builder(c, channel)
            .setSmallIcon(R.drawable.ic_stat_lungs)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setContentIntent(open)
            .setAutoCancel(true)
            .setSound(sound(c, sound))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build());
  }
  @Override
  public void onReceive(Context c, Intent intent) {
    if (!Arrays
            .asList("app.asthma.tick.REMIND", Intent.ACTION_BOOT_COMPLETED,
                Intent.ACTION_MY_PACKAGE_REPLACED, Intent.ACTION_TIME_CHANGED,
                Intent.ACTION_TIMEZONE_CHANGED,
                "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED")
            .contains(intent.getAction()))
      return;
    PendingResult result = goAsync();
    new Thread(() -> {
      try (NativeStore store = new NativeStore(c)) {
        JSONObject snapshot = store.load();
        String id = intent.getStringExtra("id");
        JSONObject settings = snapshot.getJSONObject("settings");
        if (id != null && settings.optBoolean("notificationsEnabled", false))
          for (JSONObject event : Records.list(snapshot, 0)) {
            if (id.equals(event.optString("id")) && !Records.completed(event, LocalDate.now())
                && Records.contains(
                    event.optJSONArray("days"), LocalDate.now().getDayOfWeek().getValue())) {
              notify(c, settings, event.optString("title"),
                  event.optString("time") + " · " + event.optString("note"), id);
              break;
            }
          }
        sync(c, snapshot);
      } catch (Exception e) {
        android.util.Log.e("Asthmatick", "Reminder scheduling failed", e);
      } finally {
        result.finish();
      }
    }, "asthmatick-reminders").start();
  }
}
