package app.asthma.tick;

import static org.junit.Assert.*;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import java.io.File;
import java.io.FileOutputStream;
import java.time.LocalDate;
import java.time.ZoneId;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;

/** Reproducible 9:16 screenshots with sample records, never the user's database. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28, qualifiers = "w540dp-h960dp-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class MarketingScreenshotsTest {
  private Context context;

  @Before
  public void setup() {
    context = RuntimeEnvironment.getApplication();
    context.deleteDatabase("asthmatick.db");
  }

  @Test
  public void captureFourLightScreensWithSampleHistory() throws Exception {
    try (NativeStore store = new NativeStore(context)) {
      store.save(sampleData());
    }
    try (ActivityController<MainActivity> controller =
             Robolectric.buildActivity(MainActivity.class).setup()) {
      MainActivity activity = controller.get();
      View root = activity.findViewById(android.R.id.content);
      assertFalse(activity.p.dark);
      assertNotNull(find(root, "Будесонид / формотерол"));
      capture(root, "my-day");
      open(root, "Календарь");
      root = activity.findViewById(android.R.id.content);
      int todayEvents = LocalDate.now().getDayOfWeek().getValue() > 5 ? 4 : 5;
      assertNotNull(find(root, "События на этот день (" + todayEvents + ")"));
      capture(root, "calendar");
      open(root, "Статистика");
      root = activity.findViewById(android.R.id.content);
      assertNotNull(find(root, "Приёмы по расписанию"));
      capture(root, "statistics");
      View settings = findDescription(root, "Настройки");
      assertNotNull(settings);
      settings.performClick();
      root = activity.findViewById(android.R.id.content);
      assertNotNull(find(root, "Резервное копирование"));
      capture(root, "settings");
    }
  }

  private JSONObject sampleData() throws Exception {
    LocalDate today = LocalDate.now();
    long createdAt = today.minusDays(40).atStartOfDay(ZoneId.systemDefault())
                         .toInstant().toEpochMilli();
    JSONArray schedules = new JSONArray();
    String[] titles = {"Будесонид / формотерол", "Дневная ингаляция", "Вечерний контроль"};
    String[] times = {"08:00", "13:00", "20:30"};
    String[] notes = {"2 вдоха после завтрака", "1 вдох после обеда", "Проверить пикфлоуметрию"};
    for (int item = 0; item < titles.length; item++) {
      JSONArray completed = new JSONArray();
      JSONObject completionTimes = new JSONObject();
      for (int ago = 27; ago >= 0; ago--) {
        LocalDate day = today.minusDays(ago);
        if (item == 1 && day.getDayOfWeek().getValue() > 5)
          continue;
        boolean done = item == 0 ? ago == 0 || ago % 7 != 0
            : item == 1 ? ago == 0 || ago % 4 != 0
                        : ago > 0 && ago % 6 != 0;
        if (done) {
          completed.put(day.toString());
          completionTimes.put(day.toString(),
              item == 0 ? "08:06" : item == 1 ? "13:09" : "20:37");
        }
      }
      schedules.put(new JSONObject()
          .put("id", "demo-schedule-" + item)
          .put("title", titles[item]).put("time", times[item])
          .put("note", notes[item]).put("createdAt", createdAt)
          .put("days", item == 1 ? new JSONArray("[1,2,3,4,5]")
                                 : new JSONArray("[1,2,3,4,5,6,7]"))
          .put("completedDates", completed).put("completionTimes", completionTimes));
    }
    JSONArray attacks = new JSONArray();
    int[] daysAgo = {0, 2, 5, 9, 16, 23};
    String[] severity = {"light", "medium", "light", "heavy", "medium", "light"};
    String[] triggers = {"Одышка после прогулки", "Реакция на пыль", "После тренировки",
        "Ночной приступ", "Аллергия на пыльцу", "После уборки"};
    for (int i = 0; i < daysAgo.length; i++)
      attacks.put(new JSONObject()
          .put("id", "demo-attack-" + i).put("date", today.minusDays(daysAgo[i]))
          .put("time", i == 0 ? "10:40" : "17:20")
          .put("severity", severity[i]).put("trigger", triggers[i])
          .put("note", i == 0 ? "Прошло после отдыха и ингаляции" : "Самочувствие улучшилось")
          .put("createdAt", createdAt + i));
    JSONArray diary = new JSONArray();
    int[] noteDays = {0, 1, 3, 6, 11, 15, 20, 26};
    String[] diaryTitles = {"Самочувствие после прогулки", "Пикфлоуметрия утром",
        "Контроль симптомов", "Лёгкая тренировка", "Приём у пульмонолога",
        "Новый план лечения", "Проветривание комнаты", "Самочувствие утром"};
    for (int i = 0; i < noteDays.length; i++)
      diary.put(new JSONObject()
          .put("id", "demo-note-" + i).put("date", today.minusDays(noteDays[i]))
          .put("time", i == 0 ? "12:15" : "09:30")
          .put("title", diaryTitles[i])
          .put("description", i == 0 ? "Дышится спокойно, пикфлоу 420 л/мин"
                                      : "Показатели стабильные")
          .put("createdAt", createdAt + i));
    return new JSONObject()
        .put("scheduleEvents", schedules).put("attacks", attacks).put("notes", diary)
        .put("settings", new JSONObject()
            .put("theme", "light").put("language", "ru")
            .put("hasSeenOnboarding", true));
  }

  private void open(View root, String title) {
    View button = find(root, title);
    assertNotNull(button);
    while (!button.isClickable() && button.getParent() instanceof View)
      button = (View) button.getParent();
    button.performClick();
  }

  private View find(View root, String text) {
    if (root instanceof TextView && text.contentEquals(((TextView) root).getText()))
      return root;
    if (root instanceof ViewGroup) {
      ViewGroup group = (ViewGroup) root;
      for (int i = 0; i < group.getChildCount(); i++) {
        View found = find(group.getChildAt(i), text);
        if (found != null)
          return found;
      }
    }
    return null;
  }

  private View findDescription(View root, String description) {
    if (description.contentEquals(root.getContentDescription() == null
            ? "" : root.getContentDescription()))
      return root;
    if (root instanceof ViewGroup) {
      ViewGroup group = (ViewGroup) root;
      for (int i = 0; i < group.getChildCount(); i++) {
        View found = findDescription(group.getChildAt(i), description);
        if (found != null)
          return found;
      }
    }
    return null;
  }

  private void capture(View root, String name) throws Exception {
    float density = context.getResources().getDisplayMetrics().density;
    int width = Math.round(context.getResources().getConfiguration().screenWidthDp * density);
    int height = Math.round(context.getResources().getConfiguration().screenHeightDp * density);
    assertEquals(1080, width);
    assertEquals(1920, height);
    root.measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
        View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY));
    root.layout(0, 0, width, height);
    Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
    root.draw(new Canvas(bitmap));
    File folder = new File("build/marketing-screenshots");
    assertTrue(folder.isDirectory() || folder.mkdirs());
    try (FileOutputStream out = new FileOutputStream(new File(folder, name + ".png"))) {
      assertTrue(bitmap.compress(Bitmap.CompressFormat.PNG, 100, out));
    }
    bitmap.recycle();
  }
}
