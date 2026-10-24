package app.asthma.tick;

import static org.junit.Assert.*;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.view.*;
import android.widget.TextView;
import com.google.android.material.chip.ChipGroup;
import org.json.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28, qualifiers = "w412dp-h892dp-mdpi")
@org.robolectric.annotation.GraphicsMode(org.robolectric.annotation.GraphicsMode.Mode.NATIVE)
public class NativeMigrationTest {
  private Context context;
  @Before
  public void setup() {
    org.robolectric.shadows.ShadowLog.stream = System.out;
    context = RuntimeEnvironment.getApplication();
    context.deleteDatabase("asthmatick.db");
  }
  private JSONObject fixture() throws Exception {
    return new JSONObject(
        "{\"scheduleEvents\":[{\"id\":\"old-id\",\"title\":\"Лекарство\",\"time\":\"08:00\","
        + "\"days\":[1,2,3,4,5,6,7],\"completedDates\":[\"2026-10-22\"],\"completionTimes\":{"
        + "\"2026-10-22\":\"08:17\"},\"createdAt\":1000}],\"attacks\":[],\"notes\":[],\"settings\":"
        + "{\"theme\":\"light\",\"language\":\"ru\",\"hasSeenOnboarding\":true}}");
  }
  @Test
  public void readsExistingV132DatabaseWithoutLosingHistory() throws Exception {
    try (SQLiteDatabase db = context.openOrCreateDatabase("asthmatick.db", 0, null)) {
      for (String table : Records.TABLES)
        db.execSQL("CREATE TABLE " + table + " (id TEXT PRIMARY KEY, data TEXT NOT NULL)");
      db.execSQL(
          "CREATE TABLE settings (id INTEGER PRIMARY KEY CHECK(id = 1), data TEXT NOT NULL)");
      db.execSQL("CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
      db.execSQL("INSERT INTO metadata VALUES ('initialized','1')");
      db.execSQL("INSERT INTO schedule_events VALUES (?,?)",
          new Object[] {
              "old-id", fixture().getJSONArray("scheduleEvents").getJSONObject(0).toString()});
      db.execSQL("INSERT INTO settings VALUES (1,?)",
          new Object[] {fixture().getJSONObject("settings").toString()});
      db.setVersion(1);
    }
    try (NativeStore store = new NativeStore(context)) {
      JSONObject loaded = store.load();
      assertEquals("08:17",
          loaded.getJSONArray("scheduleEvents")
              .getJSONObject(0)
              .getJSONObject("completionTimes")
              .getString("2026-10-22"));
      store.save(loaded);
      assertEquals(
          "old-id", store.load().getJSONArray("scheduleEvents").getJSONObject(0).getString("id"));
    }
  }
  @Test
  public void rejectsInvalidRestoreBeforeChangingLiveData() throws Exception {
    try (NativeStore store = new NativeStore(context)) {
      JSONObject valid = fixture();
      store.save(valid);
      JSONObject bad = fixture();
      bad.getJSONArray("scheduleEvents").getJSONObject(0).put("time", "25:80");
      try {
        store.save(bad);
        fail("Invalid time accepted");
      } catch (JSONException expected) {
      }
      assertEquals(
          "08:00", store.load().getJSONArray("scheduleEvents").getJSONObject(0).getString("time"));
    }
  }
  @Test
  public void rendersAllFourScreensAsNativeViews() throws Exception {
    try (NativeStore store = new NativeStore(context)) {
      store.save(fixture());
    }
    try (ActivityController<MainActivity> controller =
             Robolectric.buildActivity(MainActivity.class).setup()) {
      MainActivity activity = controller.get();
      View root = activity.findViewById(android.R.id.content);
      assertNative(root);
      assertNotNull(find(root, "Asthmatick"));
      screenshot(root, "home");
      for (String screen : new String[] {"Календарь", "Статистика"}) {
        View target = find(root, screen);
        assertNotNull(target);
        while (!target.isClickable() && target.getParent() instanceof View)
          target = (View) target.getParent();
        target.performClick();
        if (screen.equals("Статистика"))
          assertNotNull(find(root, "Приёмы по расписанию"));
        screenshot(root, screen.equals("Статистика") ? "statistics" : "calendar");
        assertNative(root);
      }
      View settings = findDescription(root, "Настройки");
      assertNotNull(settings);
      settings.performClick();
      assertNotNull(find(root, "Резервное копирование"));
      assertNative(root);
      screenshot(root, "settings");
    }
  }
  @Test
  public void exportAndRestoreRoundTrip() throws Exception {
    java.io.File file = new java.io.File(context.getCacheDir(), "roundtrip.db");
    try (NativeStore store = new NativeStore(context)) {
      store.save(fixture());
      store.exportTo(android.net.Uri.fromFile(file));
      JSONObject cleared = fixture();
      cleared.put("scheduleEvents", new JSONArray());
      store.save(cleared);
      store.importFrom(android.net.Uri.fromFile(file));
      assertEquals(
          "old-id", store.load().getJSONArray("scheduleEvents").getJSONObject(0).getString("id"));
      java.nio.file.Files.write(file.toPath(), new byte[] {1, 2, 3});
      try {
        store.importFrom(android.net.Uri.fromFile(file));
        fail("Corrupt backup accepted");
      } catch (Exception expected) {
      }
      assertEquals(1, store.load().getJSONArray("scheduleEvents").length());
    } finally {
      file.delete();
    }
  }
  @Test
  public void createsNoteThroughNativeFormAndRetainsItAfterRestart() throws Exception {
    try (NativeStore store = new NativeStore(context)) {
      store.save(fixture());
    }
    try (ActivityController<MainActivity> controller =
             Robolectric.buildActivity(MainActivity.class).setup()) {
      MainActivity activity = controller.get();
      View root = activity.findViewById(android.R.id.content);
      findDescription(root, "Добавить").performClick();
      android.app.Dialog menu = org.robolectric.shadows.ShadowDialog.getLatestDialog();
      View option = find(menu.getWindow().getDecorView(), "Простая заметка");
      while (!option.isClickable()) option = (View) option.getParent();
      option.performClick();
      android.app.Dialog form = org.robolectric.shadows.ShadowDialog.getLatestDialog();
      View formRoot = form.getWindow().getDecorView();
      ((android.widget.EditText) findDescription(formRoot, "Заголовок / описание события"))
          .setText("Проверка нативной заметки");
      screenshot(formRoot, "note-form");
      find(formRoot, "Добавить").performClick();
    }
    try (NativeStore store = new NativeStore(context)) {
      assertEquals("Проверка нативной заметки",
          store.load().getJSONArray("notes").getJSONObject(0).getString("title"));
    }
  }
  @Test
  public void nativeTimePickerWrapsMidnightAndOnlyConfirmsOnSelection() throws Exception {
    try (NativeStore store = new NativeStore(context)) {
      store.save(fixture());
    }
    try (ActivityController<MainActivity> controller =
             Robolectric.buildActivity(MainActivity.class).setup()) {
      java.util.concurrent.atomic.AtomicReference<String> result =
          new java.util.concurrent.atomic.AtomicReference<>();
      com.google.android.material.bottomsheet.BottomSheetDialog dialog =
          PickerSheets.time(controller.get(), "23:50", result::set);
      View root = dialog.getWindow().getDecorView();
      ChipGroup presets = findChipGroup(root);
      assertNotNull(presets);
      find(root, "+15 мин").performClick();
      assertSame(presets, findChipGroup(root));
      findDescription(root, "Прибавить час").performClick();
      assertSame(presets, findChipGroup(root));
      findDescription(root, "Убавить час").performClick();
      assertNull(result.get());
      screenshot(root, "time-picker");
      find(root, "Выбрать 00:05").performClick();
      assertEquals("00:05", result.get());
      java.util.concurrent.atomic.AtomicReference<java.time.LocalDate> date =
          new java.util.concurrent.atomic.AtomicReference<>();
      dialog = PickerSheets.date(controller.get(), java.time.LocalDate.now(), date::set);
      root = dialog.getWindow().getDecorView();
      find(root, "Вчера").performClick();
      assertNull(date.get());
      screenshot(root, "date-picker");
      find(root, "Выбрать дату").performClick();
      assertEquals(java.time.LocalDate.now().minusDays(1), date.get());
    }
  }
  @Test
  public void onlyScheduledEventsOfferCompletionInDetails() throws Exception {
    JSONObject data = fixture();
    String today = java.time.LocalDate.now().toString();
    data.getJSONArray("attacks").put(new JSONObject()
        .put("id", "attack-1").put("date", today).put("time", "11:00")
        .put("trigger", "Проверка приступа").put("severity", "light").put("createdAt", 1000));
    data.getJSONArray("notes").put(new JSONObject()
        .put("id", "note-1").put("date", today).put("time", "12:00")
        .put("title", "Проверка заметки").put("createdAt", 1000));
    try (NativeStore store = new NativeStore(context)) {
      store.save(data);
    }
    try (ActivityController<MainActivity> controller =
             Robolectric.buildActivity(MainActivity.class).setup()) {
      View root = controller.get().findViewById(android.R.id.content);
      for (String title : new String[] {"Проверка приступа", "Проверка заметки"}) {
        View card = find(root, title);
        assertNotNull(card);
        while (!card.isClickable() && card.getParent() instanceof View)
          card = (View) card.getParent();
        card.performClick();
        android.app.Dialog detail = org.robolectric.shadows.ShadowDialog.getLatestDialog();
        View detailRoot = detail.getWindow().getDecorView();
        assertNotNull(find(detailRoot, "Редактировать"));
        assertNull(find(detailRoot, "Отметить выполненным"));
        assertNull(find(detailRoot, "Отменить выполнение"));
        screenshot(detailRoot, title.equals("Проверка приступа") ? "attack-detail" : "note-detail");
        detail.dismiss();
      }
    }
  }
  @Test
  @Config(sdk = 35, qualifiers = "w412dp-h892dp-mdpi")
  public void darkEnglishScreenAndMonetRolesRenderOnAndroid15() throws Exception {
    JSONObject data = fixture();
    data.getJSONObject("settings").put("theme", "dark").put("language", "en");
    try (NativeStore store = new NativeStore(context)) {
      store.save(data);
    }
    try (ActivityController<MainActivity> controller =
             Robolectric.buildActivity(MainActivity.class).setup()) {
      MainActivity activity = controller.get();
      View root = activity.findViewById(android.R.id.content);
      assertNotNull(find(root, "Asthmatick"));
      assertNotNull(find(root, "Statistics"));
      assertNotNull(find(root, "Лекарство"));
      assertTrue(activity.p.dark);
      assertNative(root);
      assertNotEquals(0, new Palette(activity, "system").primary);
      screenshot(root, "home-dark-en");
    }
  }
  @Test
  @Config(qualifiers = "w800dp-h1100dp-mdpi")
  public void tabletKeepsTwoColumnTimeline() throws Exception {
    JSONObject data = fixture();
    JSONObject note = new JSONObject();
    note.put("id", "tablet-note")
        .put("title", "Tablet note")
        .put("date", java.time.LocalDate.now().toString())
        .put("time", "13:00")
        .put("createdAt", 1000);
    data.getJSONArray("notes").put(note);
    try (NativeStore store = new NativeStore(context)) {
      store.save(data);
    }
    try (ActivityController<MainActivity> controller =
             Robolectric.buildActivity(MainActivity.class).setup()) {
      View root = controller.get().findViewById(android.R.id.content);
      assertNotNull(find(root, "Tablet note"));
      screenshot(root, "home-tablet");
    }
  }
  private void screenshot(View root, String name) throws Exception {
    int width = context.getResources().getConfiguration().screenWidthDp,
        height = context.getResources().getConfiguration().screenHeightDp;
    root.measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
        View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY));
    root.layout(0, 0, width, height);
    android.graphics.Bitmap image = android.graphics.Bitmap.createBitmap(
        width, height, android.graphics.Bitmap.Config.ARGB_8888);
    root.draw(new android.graphics.Canvas(image));
    java.io.File directory = new java.io.File("build/native-previews");
    directory.mkdirs();
    try (java.io.FileOutputStream out =
             new java.io.FileOutputStream(new java.io.File(directory, name + ".png"))) {
      image.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, out);
    }
    image.recycle();
  }
  private void assertNative(View view) {
    assertFalse(view instanceof android.webkit.WebView);
    if (view instanceof ViewGroup) {
      ViewGroup group = (ViewGroup) view;
      for (int i = 0; i < group.getChildCount(); i++) assertNative(group.getChildAt(i));
    }
  }
  private View find(View view, String text) {
    if (view instanceof TextView && text.contentEquals(((TextView) view).getText()))
      return view;
    if (view instanceof ViewGroup) {
      ViewGroup group = (ViewGroup) view;
      for (int i = 0; i < group.getChildCount(); i++) {
        View result = find(group.getChildAt(i), text);
        if (result != null)
          return result;
      }
    }
    return null;
  }
  private View findDescription(View view, String text) {
    if (text.contentEquals(
            view.getContentDescription() == null ? "" : view.getContentDescription()))
      return view;
    if (view instanceof ViewGroup) {
      ViewGroup group = (ViewGroup) view;
      for (int i = 0; i < group.getChildCount(); i++) {
        View result = findDescription(group.getChildAt(i), text);
        if (result != null)
          return result;
      }
    }
    return null;
  }
  private ChipGroup findChipGroup(View view) {
    if (view instanceof ChipGroup)
      return (ChipGroup) view;
    if (view instanceof ViewGroup) {
      ViewGroup group = (ViewGroup) view;
      for (int i = 0; i < group.getChildCount(); i++) {
        ChipGroup result = findChipGroup(group.getChildAt(i));
        if (result != null)
          return result;
      }
    }
    return null;
  }
}
