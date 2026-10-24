package app.asthma.tick;

import java.time.*;
import java.util.*;
import org.json.*;

/** The persisted JSON schema is unchanged from v1.3.2. */
final class Records {
  static final String[] TABLES = {"schedule_events", "attacks", "notes"};
  static final String[] KEYS = {"scheduleEvents", "attacks", "notes"};
  static void put(JSONObject o, String key, Object value) {
    try {
      o.put(key, value);
    } catch (JSONException e) {
      throw new IllegalArgumentException(e);
    }
  }
  static JSONObject copy(JSONObject o) {
    try {
      return new JSONObject(o.toString());
    } catch (JSONException e) {
      throw new IllegalArgumentException(e);
    }
  }
  static boolean contains(JSONArray a, Object value) {
    if (a != null)
      for (int i = 0; i < a.length(); i++)
        if (value.equals(a.opt(i)))
          return true;
    return false;
  }
  static List<JSONObject> list(JSONObject snapshot, int type) {
    List<JSONObject> result = new ArrayList<>();
    JSONArray a = snapshot.optJSONArray(KEYS[type]);
    if (a != null)
      for (int i = 0; i < a.length(); i++) result.add(a.optJSONObject(i));
    return result;
  }
  static boolean completed(JSONObject event, LocalDate date) {
    return contains(event.optJSONArray("completedDates"), date.toString());
  }
  static ScheduleRules.Status status(JSONObject event, LocalDate date, LocalDateTime now) {
    return ScheduleRules.status(
        LocalTime.parse(event.optString("time")), date, now, completed(event, date));
  }
  static String time(JSONObject event, LocalDate date) {
    JSONObject times = event.optJSONObject("completionTimes");
    return completed(event, date) && times != null
        ? times.optString(date.toString(), event.optString("time"))
        : event.optString("time");
  }
  static int severity(JSONObject o) {
    return Arrays.asList("light", "medium", "heavy").indexOf(o.optString("severity"));
  }
  static void validate(JSONObject snapshot) throws JSONException {
    for (int t = 0; t < 3; t++) {
      JSONArray a = snapshot.getJSONArray(KEYS[t]);
      Set<String> ids = new HashSet<>();
      if (a.length() > 100000)
        throw new JSONException("Too many records");
      for (int i = 0; i < a.length(); i++) {
        JSONObject o = a.getJSONObject(i);
        String id = o.getString("id");
        if (id.isEmpty() || id.length() > 256 || !ids.add(id))
          throw new JSONException("Invalid record ID");
        try {
          LocalTime.parse(o.getString("time"));
          if (t != 0)
            LocalDate.parse(o.getString("date"));
        } catch (RuntimeException e) {
          throw new JSONException("Invalid date or time");
        }
        if (o.getLong("createdAt") < 0)
          throw new JSONException("Invalid creation time");
        if (t == 0) {
          o.getString("title");
          JSONArray days = o.getJSONArray("days");
          if (days.length() == 0 || days.length() > 7)
            throw new JSONException("Invalid weekdays");
          for (int j = 0; j < days.length(); j++)
            if (days.getInt(j) < 1 || days.getInt(j) > 7)
              throw new JSONException("Invalid weekday");
          JSONArray completed = o.getJSONArray("completedDates");
          for (int j = 0; j < completed.length(); j++) LocalDate.parse(completed.getString(j));
          JSONObject times = o.optJSONObject("completionTimes");
          if (times != null)
            for (Iterator<String> it = times.keys(); it.hasNext();) {
              String k = it.next();
              LocalDate.parse(k);
              LocalTime.parse(times.getString(k));
            }
        } else if (t == 1 && severity(o) < 0)
          throw new JSONException("Invalid severity");
        else if (t == 2)
          o.getString("title");
      }
    }
    JSONObject settings = snapshot.getJSONObject("settings");
    if (!Arrays.asList("light", "dark", "system").contains(settings.optString("theme", "system")))
      throw new JSONException("Invalid theme");
    if (!Arrays.asList("ru", "en").contains(settings.optString("language", "ru")))
      throw new JSONException("Invalid language");
  }
}
