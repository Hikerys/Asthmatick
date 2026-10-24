package app.asthma.tick;

import android.Manifest;
import android.app.AlarmManager;
import android.content.*;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.graphics.*;
import android.graphics.drawable.*;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import android.text.InputType;
import android.view.*;
import android.widget.*;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.graphics.Insets;
import androidx.core.view.*;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.bottomsheet.*;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.android.material.materialswitch.MaterialSwitch;
import com.google.android.material.progressindicator.LinearProgressIndicator;
import com.google.android.material.shape.ShapeAppearanceModel;
import com.google.android.material.textfield.*;
import java.io.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import org.json.*;

public class MainActivity extends AppCompatActivity {
  private NativeStore store;
  private JSONObject data, settings;
  Palette p;
  private BottomSheetDialog pickerSheet;
  private final Map<String, String> translations = new HashMap<>();
  private LinearLayout root, content;
  private FrameLayout body;
  private ScrollView scroll;
  private int tab = 0, period = 0, offset = 0;
  private LocalDate selected = LocalDate.now(), month = LocalDate.now().withDayOfMonth(1),
                    customStart = LocalDate.now().minusDays(6), customEnd = LocalDate.now();
  private final ArrayDeque<Integer> history = new ArrayDeque<>();
  private final Handler handler = new Handler(Looper.getMainLooper());
  private final ExecutorService io = Executors.newSingleThreadExecutor();
  private BottomSheetDialog activeSheet;
  private JSONObject draft;
  private int draftType = -1;
  private Ringtone preview;
  private boolean busy;
  private final Runnable refresh = new Runnable() {
    public void run() {
      if (data != null && activeSheet == null && !busy)
        renderScreen();
      handler.postDelayed(this, 30000);
    }
  };
  private final ActivityResultLauncher<String> exportFile = registerForActivityResult(
      new ActivityResultContracts.CreateDocument("application/octet-stream"), uri -> {
        if (uri != null)
          backup(uri, false);
      });
  private final ActivityResultLauncher<String[]> importFile =
      registerForActivityResult(new ActivityResultContracts.OpenDocument(), uri -> {
        if (uri != null)
          backup(uri, true);
      });
  private final ActivityResultLauncher<String> permission =
      registerForActivityResult(new ActivityResultContracts.RequestPermission(), granted -> {
        setSetting("notificationsEnabled", granted);
        if (!granted)
          toast("Уведомления отключены");
      });

  @Override
  protected void attachBaseContext(Context base) {
    String language = "ru";
    try (NativeStore database = new NativeStore(base)) {
      language = database.load().getJSONObject("settings").optString("language", "ru");
    } catch (Exception ignored) { /* onCreate presents the database error without overwriting it. */
    }
    android.content.res.Configuration config =
        new android.content.res.Configuration(base.getResources().getConfiguration());
    config.setLocale(Locale.forLanguageTag(language));
    super.attachBaseContext(base.createConfigurationContext(config));
  }
  @Override
  public void onCreate(Bundle state) {
    super.onCreate(state);
    try {
      store = new NativeStore(this);
      data = store.load();
      settings = data.getJSONObject("settings");
      try (BufferedReader reader = new BufferedReader(
               new InputStreamReader(getResources().openRawResource(R.raw.translations),
                   java.nio.charset.StandardCharsets.UTF_8))) {
        String line;
        while ((line = reader.readLine()) != null) {
          int at = line.indexOf('|');
          if (at > 0)
            translations.put(line.substring(0, at), line.substring(at + 1));
        }
      }
      if (state != null) {
        tab = state.getInt("tab");
        period = state.getInt("period");
        offset = state.getInt("offset");
        selected = LocalDate.parse(state.getString("selected"));
        month = LocalDate.parse(state.getString("month"));
        customStart = LocalDate.parse(state.getString("start"));
        customEnd = LocalDate.parse(state.getString("end"));
        for (int t : state.getIntArray("history")) history.add(t);
      }
      applyTheme();
      render();
      ReminderReceiver.sync(this, data);
      getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
        public void handleOnBackPressed() {
          if (!history.isEmpty()) {
            tab = history.removeLast();
            render();
          } else if (tab != 0) {
            tab = 0;
            render();
          } else
            finish();
        }
      });
      if (state != null && state.containsKey("draft"))
        edit(state.getInt("draftType"), new JSONObject(state.getString("draft")), true);
      else if (!settings.optBoolean("hasSeenOnboarding"))
        onboarding(0);
    } catch (Exception e) {
      android.util.Log.e("Asthmatick", "Cannot load records", e);
      TextView error = new TextView(this);
      error.setPadding(24, 48, 24, 24);
      error.setText("Не удалось открыть данные. Перезапустите приложение. Не очищайте данные "
          + "приложения, чтобы сохранить записи.");
      setContentView(error);
    }
  }
  @Override
  protected void onResume() {
    super.onResume();
    handler.postDelayed(refresh, 1000);
    if (data != null)
      ReminderReceiver.sync(this, data);
  }
  @Override
  protected void onPause() {
    super.onPause();
    handler.removeCallbacks(refresh);
    if (preview != null)
      preview.stop();
  }
  @Override
  protected void onDestroy() {
    super.onDestroy();
    if (pickerSheet != null)
      pickerSheet.dismiss();
    if (activeSheet != null)
      activeSheet.dismiss();
    io.shutdown();
    if (store != null && !busy)
      store.close();
  }
  @Override
  protected void onSaveInstanceState(Bundle out) {
    super.onSaveInstanceState(out);
    out.putInt("tab", tab);
    out.putInt("period", period);
    out.putInt("offset", offset);
    out.putString("selected", selected.toString());
    out.putString("month", month.toString());
    out.putString("start", customStart.toString());
    out.putString("end", customEnd.toString());
    out.putIntArray("history", history.stream().mapToInt(Integer::intValue).toArray());
    if (draft != null) {
      out.putString("draft", draft.toString());
      out.putInt("draftType", draftType);
    }
  }
  boolean en() {
    return settings.optString("language", "ru").equals("en");
  }
  String tr(String s) {
    if (en() && s.endsWith(" ✓"))
      return translations.getOrDefault(
                 s.substring(0, s.length() - 2), s.substring(0, s.length() - 2))
          + " ✓";
    return en() ? translations.getOrDefault(s, s) : s;
  }
  Locale locale() {
    return en() ? Locale.US : Locale.forLanguageTag("ru");
  }
  String dateLabel(LocalDate d) {
    return d.format(DateTimeFormatter.ofPattern("d MMMM yyyy", locale()));
  }
  private String shortDateLabel(LocalDate date) {
    return date.equals(LocalDate.now()) ? tr("Сегодня")
        : date.equals(LocalDate.now().minusDays(1))
        ? tr("Вчера")
        : date.format(DateTimeFormatter.ofPattern("d MMM", locale()));
  }
  String timeLabel(String s) {
    try {
      return LocalTime.parse(s).format(
          DateTimeFormatter.ofPattern(en() ? "h:mm a" : "HH:mm", locale()));
    } catch (Exception e) {
      return s;
    }
  }
  int dp(float n) {
    return Math.round(n * getResources().getDisplayMetrics().density);
  }
  private void applyTheme() {
    String theme = settings.optString("theme", "light");
    getDelegate().setLocalNightMode(theme.equals("dark") ? AppCompatDelegate.MODE_NIGHT_YES
            : theme.equals("light")                      ? AppCompatDelegate.MODE_NIGHT_NO
                                    : AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
    p = new Palette(this, theme);
  }
  LinearLayout column() {
    LinearLayout v = new LinearLayout(this);
    v.setOrientation(LinearLayout.VERTICAL);
    return v;
  }
  LinearLayout row() {
    LinearLayout v = new LinearLayout(this);
    v.setOrientation(LinearLayout.HORIZONTAL);
    v.setGravity(Gravity.CENTER_VERTICAL);
    return v;
  }
  void pad(View v, int x, int y) {
    v.setPadding(dp(x), dp(y), dp(x), dp(y));
  }
  TextView raw(String s, int size, int color, boolean bold) {
    TextView v = new TextView(this);
    v.setText(s);
    v.setTextSize(size);
    v.setTextColor(color);
    v.setFontFeatureSettings("kern");
    if (bold)
      v.setTypeface(
          android.graphics.Typeface.create("sans-serif-medium", android.graphics.Typeface.NORMAL));
    return v;
  }
  TextView text(String s, int size, int color, boolean bold) {
    return raw(tr(s), size, color, bold);
  }
  void add(LinearLayout parent, View v, int bottom) {
    LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
    lp.bottomMargin = dp(bottom);
    parent.addView(v, lp);
  }
  GradientDrawable shape(int color, int radius) {
    GradientDrawable d = new GradientDrawable();
    d.setColor(color);
    d.setCornerRadius(dp(radius));
    return d;
  }
  Drawable icon(int id, int color) {
    Drawable d = androidx.appcompat.content.res.AppCompatResources.getDrawable(this, id).mutate();
    if (color != 0)
      d.setTint(color);
    return d;
  }
  private ImageView image(int id, int size, int color) {
    ImageView v = new ImageView(this);
    v.setImageDrawable(icon(id, color));
    v.setLayoutParams(new LinearLayout.LayoutParams(dp(size), dp(size)));
    v.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
    return v;
  }
  ImageButton iconButton(int id, String label, Runnable action) {
    ImageButton v = new ImageButton(this);
    v.setImageDrawable(icon(id, p.sub));
    v.setContentDescription(tr(label));
    v.setBackground(
        new RippleDrawable(ColorStateList.valueOf(0x221a9b8c), shape(Color.TRANSPARENT, 24), null));
    v.setLayoutParams(new LinearLayout.LayoutParams(dp(48), dp(48)));
    v.setOnClickListener(w -> action.run());
    return v;
  }
  MaterialButton button(String title, boolean filled, Runnable action) {
    MaterialButton b = new MaterialButton(this);
    b.setText(tr(title));
    b.setTextSize(14);
    if (title.equals("‹") || title.equals("›")) {
      b.setPadding(0, 0, 0, 0);
      b.setMinWidth(0);
      b.setTextSize(24);
    }
    b.setAllCaps(false);
    b.setLetterSpacing(0);
    b.setCornerRadius(dp(24));
    b.setMinHeight(dp(48));
    b.setInsetTop(dp(2));
    b.setInsetBottom(dp(2));
    b.setTextColor(filled ? Color.WHITE : p.primary);
    b.setBackgroundTintList(ColorStateList.valueOf(filled ? p.primary : p.tint));
    b.setOnClickListener(v -> action.run());
    return b;
  }
  private MaterialCardView card(LinearLayout parent, int color, int radius, int padding) {
    MaterialCardView c = new MaterialCardView(this);
    c.setCardBackgroundColor(color);
    c.setClipToOutline(true);
    c.setRadius(dp(radius));
    c.setStrokeWidth(dp(1));
    c.setStrokeColor(p.border);
    c.setCardElevation(dp(1));
    c.setContentPadding(dp(padding), dp(padding), dp(padding), dp(padding));
    add(parent, c, 10);
    return c;
  }
  private LinearLayout cardColumn(LinearLayout parent, int color, int radius, int padding) {
    MaterialCardView c = card(parent, color, radius, padding);
    LinearLayout col = column();
    c.addView(col);
    return col;
  }
  void heading(LinearLayout parent, String title) {
    TextView h = text(title, 22, p.text, true);
    add(parent, h, 16);
  }
  private void toast(String s) {
    Toast.makeText(this, tr(s), Toast.LENGTH_LONG).show();
  }
  private void navigate(int next) {
    if (next == tab)
      return;
    scroll = null;
    if (next == 0)
      history.clear();
    else
      history.add(tab);
    tab = next;
    render();
  }
  private void render() {
    root = column();
    root.setBackground(
        new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[] {p.bg, p.bg2}));
    setContentView(root);
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
      Insets bars = insets.getInsets(
          WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
      v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
      return insets;
    });
    WindowCompat.getInsetsController(getWindow(), root).setAppearanceLightStatusBars(!p.dark);
    WindowCompat.getInsetsController(getWindow(), root).setAppearanceLightNavigationBars(!p.dark);
    LinearLayout bar = row();
    pad(bar, 16, 8);
    bar.setMinimumHeight(dp(64));
    bar.setBackground(
        new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[] {p.head, p.head2}));
    bar.setElevation(dp(1));
    bar.addView(image(R.drawable.ic_lungs, 38, 0));
    TextView title = raw("Asthmatick", 22, p.text, true);
    title.setPadding(dp(12), 0, 0, 0);
    bar.addView(title, new LinearLayout.LayoutParams(0, -2, 1));
    TextView version = raw("v2.0.0", 12, p.primary, true);
    pad(version, 10, 4);
    version.setBackground(shape(p.tint, 8));
    bar.addView(version);
    ImageButton settingsButton = iconButton(R.drawable.ic_settings, "Настройки", () -> navigate(3));
    settingsButton.setImageDrawable(icon(R.drawable.ic_settings, tab == 3 ? p.primary : p.text));
    if (tab == 3)
      settingsButton.setBackground(shape(p.tint, 24));
    bar.addView(settingsButton);
    root.addView(bar);
    body = new FrameLayout(this);
    root.addView(body, new LinearLayout.LayoutParams(-1, 0, 1));
    BottomNavigationView nav = new BottomNavigationView(this);
    nav.setBackground(shape(p.nav, 24));
    nav.setElevation(dp(3));
    nav.setLabelVisibilityMode(
        com.google.android.material.navigation.NavigationBarView.LABEL_VISIBILITY_LABELED);
    nav.setItemIconSize(dp(24));
    nav.setItemActiveIndicatorColor(ColorStateList.valueOf(p.tint));
    nav.setItemActiveIndicatorWidth(dp(64));
    nav.setItemActiveIndicatorHeight(dp(32));
    ColorStateList colors =
        new ColorStateList(new int[][] {new int[] {android.R.attr.state_checked}, new int[] {}},
            new int[] {p.primary, p.sub});
    nav.setItemTextColor(colors);
    nav.setItemIconTintList(colors);
    nav.getMenu().add(0, 1, 0, tr("Мой день")).setIcon(R.drawable.ic_home);
    nav.getMenu().add(0, 2, 1, tr("Календарь")).setIcon(R.drawable.ic_calendar);
    nav.getMenu().add(0, 3, 2, tr("Статистика")).setIcon(R.drawable.ic_stats);
    if (tab < 3)
      nav.setSelectedItemId(tab + 1);
    else {
      nav.getMenu().setGroupCheckable(0, true, false);
      for (int i = 0; i < 3; i++) nav.getMenu().getItem(i).setChecked(false);
    }
    nav.setOnItemSelectedListener(item -> {
      navigate(item.getItemId() - 1);
      return true;
    });
    root.addView(nav, new LinearLayout.LayoutParams(-1, dp(76)));
    renderScreen();
  }
  private void renderScreen() {
    if (body == null)
      return;
    int oldY = scroll == null ? 0 : scroll.getScrollY();
    body.removeAllViews();
    if (tab == 0)
      body.addView(new Decor(), new FrameLayout.LayoutParams(-1, -1));
    scroll = new ScrollView(this);
    scroll.setFillViewport(true);
    scroll.setClipToPadding(false);
    scroll.setVerticalScrollBarEnabled(false);
    content = column();
    pad(content, 16, 16);
    content.setPadding(dp(16), dp(16), dp(16), dp(tab == 0 ? 24 : 24));
    scroll.addView(content);
    body.addView(scroll, new FrameLayout.LayoutParams(-1, -1));
    if (tab == 0)
      home();
    else if (tab == 1)
      calendar();
    else if (tab == 2)
      statistics();
    else
      preferences();
    adaptWideLayout();
    if (tab == 0) {
      FloatingActionButton fab = new FloatingActionButton(this);
      fab.setImageDrawable(icon(R.drawable.ic_plus, Color.WHITE));
      fab.setImageTintList(ColorStateList.valueOf(Color.WHITE));
      fab.setBackgroundTintList(ColorStateList.valueOf(p.primary));
      fab.setShapeAppearanceModel(ShapeAppearanceModel.builder().setAllCornerSizes(dp(16)).build());
      fab.setCompatElevation(dp(6));
      fab.setContentDescription(tr("Добавить"));
      FrameLayout.LayoutParams lp =
          new FrameLayout.LayoutParams(dp(56), dp(56), Gravity.BOTTOM | Gravity.END);
      lp.setMargins(dp(16), dp(16), dp(16), dp(16));
      body.addView(fab, lp);
      fab.setOnClickListener(v -> addMenu());
    }
    scroll.post(() -> scroll.scrollTo(0, oldY));
  }
  private void adaptWideLayout() {
    if (getResources().getConfiguration().screenWidthDp < 700)
      return;
    int gutter = Math.min(
        56, Math.max(24, Math.round(getResources().getConfiguration().screenWidthDp * .04f)));
    content.setPadding(dp(gutter), dp(24), dp(gutter), dp(24));
    if (tab == 0 && content.getChildCount() > 2) {
      List<View> cards = new ArrayList<>();
      while (content.getChildCount() > 1) {
        View child = content.getChildAt(1);
        content.removeView(child);
        cards.add(child);
      }
      for (int i = 0; i < cards.size(); i += 2) {
        LinearLayout pair = row();
        pair.setGravity(Gravity.TOP);
        for (int j = i; j < Math.min(i + 2, cards.size()); j++) {
          LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -2, 1);
          if (j > i)
            lp.leftMargin = dp(18);
          pair.addView(cards.get(j), lp);
        }
        if (i + 1 == cards.size())
          pair.addView(new View(this), new LinearLayout.LayoutParams(0, 1, 1));
        add(content, pair, 12);
      }
    } else if (tab == 1 && content.getChildCount() > 1) {
      View calendar = content.getChildAt(0);
      content.removeView(calendar);
      LinearLayout timeline = column();
      while (content.getChildCount() > 0) {
        View child = content.getChildAt(0);
        content.removeView(child);
        timeline.addView(child);
      }
      LinearLayout pair = row();
      pair.setGravity(Gravity.TOP);
      pair.addView(calendar, new LinearLayout.LayoutParams(0, -2, 1));
      LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -2, 1);
      lp.leftMargin = dp(24);
      pair.addView(timeline, lp);
      add(content, pair, 0);
    } else if (tab == 2 && content.getChildCount() >= 2) {
      int n = content.getChildCount();
      View first = content.getChildAt(n - 2), second = content.getChildAt(n - 1);
      if (first instanceof MaterialCardView && second instanceof MaterialCardView) {
        content.removeView(first);
        content.removeView(second);
        LinearLayout pair = row();
        pair.setGravity(Gravity.TOP);
        pair.addView(first, new LinearLayout.LayoutParams(0, -2, 1));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -2, 1);
        lp.leftMargin = dp(22);
        pair.addView(second, lp);
        add(content, pair, 0);
      }
    } else if (tab == 3 && content.getChildCount() >= 7) {
      LinearLayout left = column(), right = column();
      for (int i = 0; i < 4; i++) {
        View child = content.getChildAt(0);
        content.removeView(child);
        (i < 2 ? left : right).addView(child);
      }
      LinearLayout pair = row();
      pair.setGravity(Gravity.TOP);
      pair.addView(left, new LinearLayout.LayoutParams(0, -2, 1));
      LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -2, 1);
      lp.leftMargin = dp(24);
      pair.addView(right, lp);
      content.addView(pair, 0, new LinearLayout.LayoutParams(-1, -2));
    }
  }
  private class Decor extends View {
    final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    Decor() {
      super(MainActivity.this);
      setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO);
    }
    @Override
    protected void onDraw(Canvas canvas) {
      paint.setColor(p.tint);
      paint.setAlpha(115);
      canvas.drawOval(
          -getWidth() * .1f, getHeight() - dp(100), getWidth() * 1.1f, getHeight() + dp(40), paint);
      Drawable lungs = icon(R.drawable.ic_lungs_watermark, p.wm);
      lungs.setAlpha(217);
      lungs.setBounds(dp(12), getHeight() - dp(200), dp(122), getHeight() - dp(70));
      lungs.draw(canvas);
    }
  }
  private void home() {
    LinearLayout greet = cardColumn(content, p.greet, 16, 16);
    ((LinearLayout.LayoutParams) ((View) greet.getParent()).getLayoutParams()).bottomMargin =
        dp(16);
    LinearLayout r = row();
    int hour = LocalTime.now().getHour();
    r.addView(image(hour < 5 || hour >= 23 ? R.drawable.ic_moon
            : hour < 12                    ? R.drawable.ic_sunrise
            : hour >= 18                   ? R.drawable.ic_sunset
                                           : R.drawable.ic_sun,
        40, p.primary));
    LinearLayout copy = column();
    copy.setPadding(dp(16), 0, 0, 0);
    add(copy,
        text(hour < 5       ? "Доброй ночи!"
                : hour < 12 ? "Доброе утро!"
                : hour < 18 ? "Добрый день!"
                : hour < 23 ? "Добрый вечер!"
                            : "Доброй ночи!",
            19, p.primary, true),
        2);
    add(copy, text("Следуйте плану — дышите легче", 14, p.sub, false), 0);
    r.addView(copy, new LinearLayout.LayoutParams(0, -2, 1));
    greet.addView(r);
    timeline(LocalDate.now());
  }
  private static class Entry {
    final int type;
    final JSONObject record;
    Entry(int type, JSONObject record) {
      this.type = type;
      this.record = record;
    }
  }
  private List<Entry> entries(LocalDate date) {
    List<Entry> list = new ArrayList<>();
    for (int t = 0; t < 3; t++)
      for (JSONObject o : Records.list(data, t))
        if (t == 0 ? Records.contains(o.optJSONArray("days"), date.getDayOfWeek().getValue())
                   : o.optString("date").equals(date.toString()))
          list.add(new Entry(t, o));
    list.sort(Comparator.comparing(
        e -> e.type == 0 ? Records.time(e.record, date) : e.record.optString("time")));
    return list;
  }
  private String entryTitle(Entry e) {
    return e.type == 1 ? e.record.optString("trigger", tr("Приступ астмы"))
                       : e.record.optString("title");
  }
  private String severityLabel(int severity) {
    return tr(new String[] {
        "Легкое состояние", "Среднее состояние", "Тяжелое состояние"}[Math.max(0, severity)]);
  }
  private int severityColor(int s) {
    return new int[] {0xfff9e46b, 0xfff8b04b, 0xfff06a68}[Math.max(0, s)];
  }
  private void timeline(LocalDate date) {
    List<Entry> list = entries(date);
    if (list.isEmpty()) {
      LinearLayout c = cardColumn(content, p.card, 16, 24);
      if (tab == 1) {
        add(c, text("Нет записей и приступов на выбранный день.", 14, p.sub, false), 0);
        return;
      }
      TextView title = text("На сегодня расписание пусто", 18, p.text, true);
      title.setGravity(Gravity.CENTER);
      add(c, title, 6);
      TextView desc = text("Нажмите кнопку «+» ниже, чтобы добавить приём лекарств, зафиксировать "
              + "состояние или сделать заметку.",
          14, p.sub, false);
      desc.setGravity(Gravity.CENTER);
      add(c, desc, 0);
      return;
    }
    for (Entry entry : list) {
      JSONObject o = entry.record;
      MaterialCardView c = card(content, p.card, 16, 14);
      LinearLayout r = row();
      c.addView(r);
      badge(r, entry.type);
      LinearLayout copy = column();
      LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(0, -2, 1);
      cp.setMargins(dp(14), 0, dp(6), 0);
      r.addView(copy, cp);
      String time = entry.type == 0 ? Records.time(o, date) : o.optString("time");
      LinearLayout top = row();
      add(copy, top, 2);
      top.addView(raw(timeLabel(time), 17, p.text, true));
      ScheduleRules.Status status =
          entry.type == 0 ? Records.status(o, date, LocalDateTime.now()) : null;
      if (status != null) {
        String label = status == ScheduleRules.Status.COMPLETED ? "выполнено"
            : status == ScheduleRules.Status.MISSED             ? "пропущено"
                                                                : "планируется";
        int col = status == ScheduleRules.Status.COMPLETED ? 0xff17a05d
            : status == ScheduleRules.Status.MISSED        ? 0xfff06a68
                                                           : p.sub;
        TextView chip = text(label, 11, col, true);
        pad(chip, 8, 2);
        chip.setBackground(shape((col & 0xffffff) | 0x24000000, 6));
        LinearLayout.LayoutParams cl = new LinearLayout.LayoutParams(-2, -2);
        cl.leftMargin = dp(8);
        top.addView(chip, cl);
      }
      TextView name = raw(entryTitle(entry), 15, p.text, false);
      name.setMaxLines(1);
      name.setEllipsize(android.text.TextUtils.TruncateAt.END);
      add(copy, name, 2);
      String subtitle = entry.type == 1 ? severityLabel(Records.severity(o))
                                        : o.optString(entry.type == 0 ? "note" : "description");
      if (!subtitle.isEmpty()) {
        TextView sub = raw(subtitle, 13,
            entry.type == 1
                ? (p.dark ? severityColor(Records.severity(o))
                          : new int[] {0xffc48208, 0xffea650d, 0xffe54845}[Records.severity(o)])
                : p.sub,
            false);
        sub.setMaxLines(1);
        sub.setEllipsize(android.text.TextUtils.TruncateAt.END);
        add(copy, sub, 0);
      }
      if (entry.type == 0) {
        ImageButton statusButton = iconButton(
            status == ScheduleRules.Status.COMPLETED ? R.drawable.ic_check : R.drawable.ic_clock,
            status == ScheduleRules.Status.COMPLETED ? "Отменить выполнение"
                                                     : "Отметить выполненным",
            () -> toggle(entry, date));
        if (status == ScheduleRules.Status.COMPLETED)
          statusButton.setBackground(
              new android.graphics.drawable.InsetDrawable(shape(p.green, 12), dp(5)));
        if (status == ScheduleRules.Status.MISSED) {
          GradientDrawable missedBackground = shape(0x26f06a68, 16);
          missedBackground.setStroke(dp(1.5f), 0x66f06a68);
          statusButton.setBackground(
              new android.graphics.drawable.InsetDrawable(missedBackground, dp(8)));
          statusButton.setImageDrawable(icon(R.drawable.ic_plus, 0xfff06a68));
          statusButton.setRotation(45);
          statusButton.setContentDescription(tr("Пропущено"));
        }
        r.addView(statusButton);
      } else
        r.addView(image(R.drawable.ic_chevron, 22, p.sub));
      c.setOnClickListener(v -> detail(entry, date));
    }
  }
  private void badge(LinearLayout parent, int type) {
    ImageView v =
        image(new int[] {R.drawable.ic_inhaler, R.drawable.ic_attack, R.drawable.ic_note}[type], 44,
            type == 0       ? 0
                : type == 1 ? 0xff7b4bc4
                            : p.primary);
    pad(v, 9, 9);
    v.setBackground(shape(new int[] {p.blue, p.purple, p.green}[type], 12));
    parent.addView(v);
  }
  private boolean persist(JSONObject next) {
    if (busy)
      return false;
    try {
      store.save(next);
      data = next;
      settings = data.getJSONObject("settings");
      try {
        ReminderReceiver.sync(this, data);
      } catch (RuntimeException alarmError) {
        android.util.Log.e("Asthmatick", "Reminder sync failed", alarmError);
      }
      return true;
    } catch (Exception e) {
      android.util.Log.e("Asthmatick", "Save failed", e);
      toast("Не удалось сохранить данные. Проверьте свободное место и перезапустите приложение.");
      return false;
    }
  }
  private void setSetting(String key, Object value) {
    JSONObject next = Records.copy(data);
    Records.put(next.optJSONObject("settings"), key, value);
    if (persist(next)) {
      applyTheme();
      render();
    }
  }
  private void toggle(Entry entry, LocalDate date) {
    JSONObject next = Records.copy(data);
    for (JSONObject o : Records.list(next, entry.type))
      if (o.optString("id").equals(entry.record.optString("id"))) {
        if (entry.type == 0) {
          ScheduleRules.Status status = Records.status(o, date, LocalDateTime.now());
          if (status != ScheduleRules.Status.AVAILABLE
              && status != ScheduleRules.Status.COMPLETED) {
            toast(status == ScheduleRules.Status.MISSED ? "Пропущено"
                    : en()
                    ? "Available within one hour of the scheduled time"
                    : "Приём доступен за час до и в течение часа после назначенного времени");
            return;
          }
          JSONArray dates = o.optJSONArray("completedDates");
          JSONObject times = o.optJSONObject("completionTimes");
          if (times == null)
            times = new JSONObject();
          if (status == ScheduleRules.Status.COMPLETED) {
            JSONArray retained = new JSONArray();
            for (int i = 0; i < dates.length(); i++)
              if (!date.toString().equals(dates.optString(i)))
                retained.put(dates.optString(i));
            dates = retained;
            times.remove(date.toString());
          } else {
            dates.put(date.toString());
            Records.put(times, date.toString(),
                LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
          }
          Records.put(o, "completedDates", dates);
          Records.put(o, "completionTimes", times);
        } else
          Records.put(o, "completed", !o.optBoolean("completed", true));
        break;
      }
    if (persist(next)) {
      closeSheet();
      renderScreen();
    }
  }
  private int worst(LocalDate date) {
    int worst = -1;
    for (JSONObject a : Records.list(data, 1))
      if (a.optString("date").equals(date.toString()))
        worst = Math.max(worst, Records.severity(a));
    return worst;
  }
  private void calendar() {
    LinearLayout cal = cardColumn(content, p.card, 22, 16);
    LinearLayout title = row();
    String name = month.format(DateTimeFormatter.ofPattern("LLLL", locale()));
    TextView h =
        raw(name.substring(0, 1).toUpperCase(locale()) + name.substring(1), 24, p.text, true);
    title.addView(h, new LinearLayout.LayoutParams(0, -2, 1));
    MaterialButton prev = button("‹", false, () -> {
      month = month.minusMonths(1);
      renderScreen();
    });
    prev.setContentDescription(tr("Предыдущий месяц"));
    MaterialButton next = button("›", false, () -> {
      month = month.plusMonths(1);
      renderScreen();
    });
    next.setContentDescription(tr("Следующий месяц"));
    title.addView(prev, new LinearLayout.LayoutParams(dp(48), dp(48)));
    title.addView(next, new LinearLayout.LayoutParams(dp(48), dp(48)));
    add(cal, title, 12);
    LinearLayout labels = row();
    String[] weekdays = en() ? new String[] {"MO", "TU", "WE", "TH", "FR", "SA", "SU"}
                             : new String[] {"ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"};
    for (String day : weekdays) {
      TextView label = raw(day, 12, p.sub, true);
      label.setGravity(Gravity.CENTER);
      labels.addView(label, new LinearLayout.LayoutParams(0, dp(28), 1));
    }
    add(cal, labels, 4);
    int blanks = month.getDayOfWeek().getValue() - 1;
    int count = month.lengthOfMonth();
    for (int week = 0; week < (blanks + count + 6) / 7; week++) {
      LinearLayout days = row();
      for (int d = 0; d < 7; d++) {
        int day = week * 7 + d - blanks + 1;
        FrameLayout slot = new FrameLayout(this);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(44), 1);
        days.addView(slot, lp);
        FrameLayout cell = new FrameLayout(this);
        slot.addView(cell, new FrameLayout.LayoutParams(dp(38), dp(38), Gravity.CENTER));
        if (day < 1 || day > count)
          continue;
        LocalDate date = month.withDayOfMonth(day);
        int severity = worst(date);
        GradientDrawable bg = shape(date.equals(selected) ? p.primary
                : severity >= 0                           ? severityColor(severity)
                                                          : p.day,
            19);
        if (date.equals(selected))
          cell.setElevation(dp(2));
        cell.setBackground(new RippleDrawable(ColorStateList.valueOf(0x331a9b8c), bg, null));
        TextView label = raw(String.valueOf(day), 15,
            date.equals(selected) ? Color.WHITE
                : severity >= 0   ? 0xff0f2b46
                                  : p.text,
            true);
        label.setGravity(Gravity.CENTER);
        cell.addView(label, new FrameLayout.LayoutParams(-1, -1));
        if (!entries(date).isEmpty()) {
          View dot = new View(this);
          dot.setBackground(shape(date.equals(selected) ? Color.WHITE : p.primary, 3));
          FrameLayout.LayoutParams dl = new FrameLayout.LayoutParams(
              dp(4), dp(4), Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL);
          dl.bottomMargin = dp(5);
          cell.addView(dot, dl);
        }
        cell.setContentDescription(
            dateLabel(date) + (severity >= 0 ? ", " + severityLabel(severity) : ""));
        cell.setOnClickListener(v -> {
          selected = date;
          renderScreen();
        });
      }
      cal.addView(days);
    }
    LinearLayout banner = row();
    pad(banner, 16, 12);
    banner.setBackground(shape(p.tint, 16));
    banner.addView(image(R.drawable.ic_calendar, 30, p.primary));
    LinearLayout words = column();
    words.setPadding(dp(14), 0, 0, 0);
    add(words,
        raw((selected.equals(LocalDate.now()) ? tr("Сегодня") + ", " : "")
                + selected.format(DateTimeFormatter.ofPattern("d MMMM", locale())),
            16, p.primary, true),
        2);
    int severity = worst(selected);
    add(words,
        text(severity < 0       ? "Всё в порядке. Продолжайте план."
                : severity == 0 ? "Зафиксирована легкая одышка."
                : severity == 1 ? "Зафиксирована выраженная одышка."
                                : "Внимание: Зафиксировано удушье!",
            13, p.sub, false),
        0);
    banner.addView(words, new LinearLayout.LayoutParams(0, -2, 1));
    banner.addView(image(R.drawable.ic_chevron, 22, p.sub));
    add(cal, banner, 0);
    banner.setOnClickListener(v -> {
      selected = LocalDate.now();
      month = selected.withDayOfMonth(1);
      renderScreen();
    });
    TextView events = raw((en() ? "Events on this day" : "События на этот день") + " ("
            + entries(selected).size() + ")",
        13, p.sub, true);
    events.setPadding(dp(6), dp(6), 0, 0);
    add(content, events, 10);
    timeline(selected);
  }
  private void segments(
      LinearLayout parent, String[] labels, int chosen, java.util.function.IntConsumer select) {
    LinearLayout r = row();
    r.setBackground(shape(p.tint, 14));
    pad(r, 3, 3);
    for (int i = 0; i < labels.length; i++) {
      final int index = i;
      MaterialButton b = button(labels[i], false, () -> select.accept(index));
      b.setBackgroundTintList(ColorStateList.valueOf(i == chosen ? p.card : Color.TRANSPARENT));
      b.setTextColor(i == chosen ? p.primary : p.sub);
      b.setElevation(dp(i == chosen ? 1 : 0));
      b.setPadding(dp(3), 0, dp(3), 0);
      b.setMinWidth(0);
      r.addView(b, new LinearLayout.LayoutParams(0, dp(48), 1));
    }
    add(parent, r, 12);
  }
  private void statistics() {
    heading(content, "Статистика");
    segments(content, new String[] {"Неделя", "Месяц", "Свой период"}, period, i -> {
      period = i;
      offset = 0;
      renderScreen();
    });
    LocalDate today = LocalDate.now();
    LocalDate start = period == 0
        ? today.minusDays(today.getDayOfWeek().getValue() - 1).plusWeeks(offset)
        : period == 1 ? today.withDayOfMonth(1).plusMonths(offset)
                      : customStart;
    LocalDate end = period == 0 ? start.plusDays(6)
        : period == 1           ? start.withDayOfMonth(start.lengthOfMonth())
                                : customEnd;
    if (period == 2) {
      add(content,
          button(tr("С") + "  " + dateLabel(start), false, () -> pickDate(customStart, d -> {
            customStart = d;
            renderScreen();
          })), 6);
      add(content, button(tr("По") + "  " + dateLabel(end), false, () -> pickDate(customEnd, d -> {
        customEnd = d;
        renderScreen();
      })), 12);
    } else {
      LinearLayout range = row();
      range.addView(button("‹", false, () -> {
        offset--;
        renderScreen();
      }), new LinearLayout.LayoutParams(dp(48), dp(48)));
      TextView rangeText = raw(dateLabel(start) + " — " + dateLabel(end), 13, p.sub, false);
      rangeText.setGravity(Gravity.CENTER);
      range.addView(rangeText, new LinearLayout.LayoutParams(0, -2, 1));
      MaterialButton b = button("›", false, () -> {
        offset++;
        renderScreen();
      });
      b.setEnabled(offset < 0);
      range.addView(b, new LinearLayout.LayoutParams(dp(48), dp(48)));
      add(content, range, 16);
    }
    if (end.isBefore(start)) {
      add(content,
          text("Укажите корректный период: дата начала должна быть раньше даты конца.", 14, p.sub,
              false),
          12);
      return;
    }
    int complete = 0, missed = 0, planned = 0;
    LocalDate last = end.isAfter(today) ? today : end;
    for (JSONObject event : Records.list(data, 0)) {
      LocalDate created = Instant.ofEpochMilli(event.optLong("createdAt"))
                              .atZone(ZoneId.systemDefault())
                              .toLocalDate();
      LocalDate first = start.isBefore(created) ? created : start;
      for (LocalDate day = first; !day.isAfter(last); day = day.plusDays(1))
        if (Records.contains(event.optJSONArray("days"), day.getDayOfWeek().getValue())) {
          ScheduleRules.Status status = Records.status(event, day, LocalDateTime.now());
          if (status == ScheduleRules.Status.COMPLETED)
            complete++;
          else if (status == ScheduleRules.Status.MISSED)
            missed++;
          else
            planned++;
        }
    }
    int[] attacks = new int[3];
    Set<String> days = new HashSet<>();
    for (JSONObject a : Records.list(data, 1)) {
      LocalDate d = LocalDate.parse(a.optString("date"));
      if (!d.isBefore(start) && !d.isAfter(end)) {
        attacks[Records.severity(a)]++;
        days.add(d.toString());
      }
    }
    LinearLayout c = cardColumn(content, p.card, 22, 18);
    add(c, text("Приёмы по расписанию", 16, p.text, true), 16);
    LinearLayout counts = row();
    statNumber(counts, complete, "Выполнено");
    statNumber(counts, missed, "Пропущено");
    add(c, counts, 14);
    int percent = complete + missed == 0 ? 0 : Math.round(100f * complete / (complete + missed));
    LinearProgressIndicator progress = new LinearProgressIndicator(this);
    progress.setTrackCornerRadius(dp(6));
    progress.setTrackThickness(dp(8));
    progress.setIndicatorColor(p.primary);
    progress.setTrackColor(p.tint);
    progress.setProgress(percent);
    add(c, progress, 10);
    add(c,
        raw(complete + missed == 0 ? tr("Пока нет завершённых приёмов")
                                   : (en() ? "Completed " + percent + "% of doses"
                                           : "Выполнено " + percent + "% приёмов"),
            12, p.sub, false),
        0);
    if (planned > 0)
      add(c,
          raw((en() ? "Still planned today: " : "Ещё запланировано сегодня: ") + planned, 12, p.sub,
              false),
          0);
    LinearLayout a = cardColumn(content, p.card, 22, 18);
    add(a, text("Приступы", 16, p.text, true), 16);
    add(a, raw(String.valueOf(attacks[0] + attacks[1] + attacks[2]), 30, p.text, true), 4);
    add(a, text("Всего за период", 13, p.sub, false), 16);
    for (int s = 0; s < 3; s++) {
      LinearLayout r = row();
      TextView label = raw(severityLabel(s), 14, p.text, false);
      r.addView(label, new LinearLayout.LayoutParams(0, -2, 1));
      r.addView(raw(String.valueOf(attacks[s]), 22, severityColor(s), true));
      add(a, r, 10);
    }
    add(a,
        raw((en() ? "Days with symptoms: " : "Дней с приступами: ") + days.size(), 12, p.sub,
            false),
        0);
  }
  private void statNumber(LinearLayout parent, int n, String label) {
    LinearLayout c = column();
    TextView count = raw(String.valueOf(n), 30, p.text, true);
    count.setGravity(Gravity.START);
    add(c, count, 4);
    TextView l = text(label, 13, p.sub, false);
    l.setGravity(Gravity.START);
    add(c, l, 0);
    parent.addView(c, new LinearLayout.LayoutParams(0, -2, 1));
  }
  private void closeSheet() {
    if (activeSheet != null) {
      activeSheet.dismiss();
      activeSheet = null;
    }
    draft = null;
    draftType = -1;
  }
  private LinearLayout sheet(String title) {
    closeSheet();
    BottomSheetDialog dialog = new BottomSheetDialog(this);
    activeSheet = dialog;
    LinearLayout col = column();
    pad(col, 22, 16);
    View handle = new View(this);
    handle.setBackground(shape(p.sub, 3));
    LinearLayout.LayoutParams hp = new LinearLayout.LayoutParams(dp(40), dp(4));
    hp.gravity = Gravity.CENTER_HORIZONTAL;
    hp.bottomMargin = dp(22);
    col.addView(handle, hp);
    if (!title.isEmpty())
      heading(col, title);
    ScrollView sc = new ScrollView(this);
    sc.setFillViewport(false);
    sc.setBackground(shape(p.card, 28));
    sc.setClipToOutline(true);
    sc.addView(col);
    dialog.setContentView(sc);
    dialog.setOnDismissListener(d -> {
      if (activeSheet == dialog) {
        activeSheet = null;
        draft = null;
        draftType = -1;
      }
      if (preview != null)
        preview.stop();
    });
    dialog.setOnShowListener(d -> {
      FrameLayout bottom =
          dialog.findViewById(com.google.android.material.R.id.design_bottom_sheet);
      if (bottom != null) {
        bottom.setBackground(shape(p.card, 28));
        bottom.setBackgroundTintList(ColorStateList.valueOf(p.card));
        BottomSheetBehavior<FrameLayout> behavior = BottomSheetBehavior.from(bottom);
        behavior.setState(BottomSheetBehavior.STATE_EXPANDED);
        behavior.setSkipCollapsed(true);
        behavior.setMaxWidth(dp(640));
      }
      dialog.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
    });
    dialog.show();
    return col;
  }
  private void option(
      LinearLayout parent, int iconId, int tint, String title, String subtitle, Runnable action) {
    MaterialCardView c = card(parent, p.card, 16, 14);
    if ("settings-group".equals(parent.getTag())) {
      c.setRadius(0);
      c.setCardElevation(0);
      c.setStrokeWidth(0);
      ((LinearLayout.LayoutParams) c.getLayoutParams()).bottomMargin = 0;
      if (parent.getChildCount() > 1) {
        View divider = new View(this);
        divider.setBackgroundColor(p.border);
        parent.addView(
            divider, parent.getChildCount() - 1, new LinearLayout.LayoutParams(-1, dp(1)));
      }
    }
    LinearLayout r = row();
    ImageView image = image(iconId, 44, tint);
    pad(image, 9, 9);
    image.setBackground(shape(tint == 0xff7b4bc4 ? p.purple
            : tint == 0xff2f7be0                 ? p.blue
                                                 : p.green,
        12));
    r.addView(image);
    LinearLayout words = column();
    words.setPadding(dp(14), 0, dp(6), 0);
    add(words, text(title, 16, p.text, true), 3);
    if (!subtitle.isEmpty())
      add(words, text(subtitle, 13, p.sub, false), 0);
    r.addView(words, new LinearLayout.LayoutParams(0, -2, 1));
    r.addView(image(R.drawable.ic_chevron, 22, p.sub));
    c.addView(r);
    c.setOnClickListener(v -> action.run());
  }
  private void optionRadio(LinearLayout parent, int iconId, String title, String subtitle,
      boolean checked, Runnable action) {
    option(parent, iconId, p.primary, title, subtitle, action);
    MaterialCardView card = (MaterialCardView) parent.getChildAt(parent.getChildCount() - 1);
    LinearLayout row = (LinearLayout) card.getChildAt(0);
    row.removeViewAt(row.getChildCount() - 1);
    com.google.android.material.radiobutton.MaterialRadioButton radio =
        new com.google.android.material.radiobutton.MaterialRadioButton(this);
    radio.setButtonTintList(ColorStateList.valueOf(checked ? p.primary : p.sub));
    radio.setChecked(checked);
    radio.setClickable(false);
    radio.setFocusable(false);
    radio.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
    row.addView(radio, new LinearLayout.LayoutParams(dp(32), dp(48)));
    card.setContentDescription(tr(title) + (checked ? (en() ? ", selected" : ", выбрано") : ""));
  }
  private void addMenu() {
    LinearLayout col = sheet("Что вы хотите добавить?");
    String[] titles = {"Событие в расписание", "Приступ / Состояние", "Простая заметка"};
    String[] subs = {"Настройка времени и дней недели приёма", "Выбор тяжести и фиксация времени",
        "Самочувствие, комментарий, пикфлоуметрия"};
    for (int i = 0; i < 3; i++) {
      final int t = i;
      option(col, new int[] {R.drawable.ic_inhaler, R.drawable.ic_attack, R.drawable.ic_note}[i],
          new int[] {0, 0xff7b4bc4, p.primary}[i], titles[i], subs[i], () -> edit(t, null, false));
    }
    add(col, button("Отмена", false, this::closeSheet), 0);
  }
  private void detail(Entry entry, LocalDate date) {
    JSONObject o = entry.record;
    LinearLayout col = sheet(entry.type == 0 ? "Событие расписания"
            : entry.type == 1                ? "Приступ / Состояние"
                                             : "Заметка");
    add(col,
        raw(timeLabel(entry.type == 0 ? Records.time(o, date) : o.optString("time")), 22, p.text,
            true),
        16);
    LinearLayout c = cardColumn(col, p.tint, 16, 16);
    add(c, raw(entryTitle(entry), 18, p.text, true), 12);
    if (entry.type == 1)
      add(c, raw(severityLabel(Records.severity(o)), 14, p.text, true), 12);
    String note = o.optString(entry.type == 2 ? "description" : "note");
    if (!note.isEmpty())
      add(c, raw(note, 15, p.text, false), 12);
    if (entry.type == 0) {
      LocalTime time = LocalTime.parse(o.optString("time"));
      add(c, raw(tr("Время приёма") + ": " + timeLabel(time.toString()), 14, p.sub, false), 6);
      add(c,
          raw(timeLabel(time.minusHours(1).toString()) + " — "
                  + timeLabel(time.plusHours(1).toString()),
              14, p.sub, false),
          6);
      ScheduleRules.Status status = Records.status(o, date, LocalDateTime.now());
      add(c,
          text(status == ScheduleRules.Status.COMPLETED   ? "Выполнено"
                  : status == ScheduleRules.Status.MISSED ? "Пропущено"
                                                          : "Запланировано",
              15, p.primary, true),
          4);
    }
    if (entry.type == 0)
      add(col,
          button(Records.completed(o, date) ? "Отменить выполнение" : "Отметить выполненным",
              true, () -> toggle(entry, date)),
          8);
    add(col, button("Редактировать", false, () -> edit(entry.type, o, false)), 8);
    add(col,
        button("Удалить", false,
            ()
                -> new MaterialAlertDialogBuilder(this)
                    .setTitle(tr("Удалить") + "?")
                    .setMessage(entryTitle(entry))
                    .setNegativeButton(tr("Отмена"), null)
                    .setPositiveButton(tr("Удалить"),
                        (d, w) -> {
                          JSONObject next = Records.copy(data);
                          JSONArray retained = new JSONArray();
                          for (JSONObject item : Records.list(next, entry.type))
                            if (!item.optString("id").equals(o.optString("id")))
                              retained.put(item);
                          Records.put(next, Records.KEYS[entry.type], retained);
                          if (persist(next)) {
                            closeSheet();
                            renderScreen();
                          }
                        })
                    .show()),
        0);
  }
  private void pickDate(LocalDate initial, java.util.function.Consumer<LocalDate> callback) {
    pickerSheet = PickerSheets.date(this, initial, callback);
  }
  private void pickTime(String initial, java.util.function.Consumer<String> callback) {
    pickerSheet = PickerSheets.time(this, initial, callback);
  }
  private TextInputEditText field(
      LinearLayout parent, JSONObject target, String key, String label, boolean multiline) {
    TextInputLayout box = new TextInputLayout(this);
    add(parent, text(label, 13, p.sub, true), 6);
    box.setHintEnabled(false);
    box.setBoxBackgroundMode(TextInputLayout.BOX_BACKGROUND_OUTLINE);
    box.setBoxCornerRadii(dp(10), dp(10), dp(10), dp(10));
    box.setBoxStrokeColor(p.primary);
    box.setBoxBackgroundColor(p.tint);
    box.setDefaultHintTextColor(ColorStateList.valueOf(p.sub));
    TextInputEditText input = new TextInputEditText(box.getContext());
    input.setText(target.optString(key));
    input.setTextColor(p.text);
    input.setTextSize(15);
    input.setContentDescription(tr(label));
    input.setInputType(InputType.TYPE_CLASS_TEXT
        | (multiline ? InputType.TYPE_TEXT_FLAG_MULTI_LINE
                     : InputType.TYPE_TEXT_FLAG_CAP_SENTENCES));
    input.setMinLines(multiline ? 3 : 1);
    input.setMaxLines(multiline ? 8 : 1);
    input.setFilters(
        new android.text.InputFilter[] {new android.text.InputFilter.LengthFilter(20000)});
    box.addView(input);
    input.addTextChangedListener(new android.text.TextWatcher() {
      public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
      public void onTextChanged(CharSequence s, int start, int before, int count) {
        Records.put(target, key, s.toString());
      }
      public void afterTextChanged(android.text.Editable e) {}
    });
    add(parent, box, 14);
    return input;
  }
  private void edit(int type, JSONObject initial, boolean restoring) {
    boolean existing = initial != null && !initial.optBoolean("_new", false);
    JSONObject form = initial == null ? new JSONObject() : Records.copy(initial);
    if (initial == null) {
      Records.put(form, "id", UUID.randomUUID().toString());
      Records.put(form, "createdAt", System.currentTimeMillis());
      Records.put(form, "_new", true);
      Records.put(form, "time",
          type == 0 ? "08:00" : LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
      if (type == 0) {
        Records.put(form, "days", new JSONArray(Arrays.asList(1, 2, 3, 4, 5, 6, 7)));
        Records.put(form, "completedDates", new JSONArray());
      } else {
        Records.put(form, "date", (tab == 1 ? selected : LocalDate.now()).toString());
        Records.put(form, "completed", true);
      }
      if (type == 1)
        Records.put(form, "severity", "medium");
    }
    LinearLayout col =
        sheet(type == 0 ? (existing ? "Редактировать событие" : "Событие в расписание")
                : type == 1
                ? (existing ? "Редактировать состояние" : "Зафиксировать приступ / состояние")
                : (existing ? "Редактировать заметку" : "Новая заметка"));
    draft = form;
    draftType = type;
    TextInputEditText title = type == 1
        ? null
        : field(col, form, "title",
              type == 0 ? "Название или лекарство" : "Заголовок / описание события", false);
    if (type == 1) {
      add(col, text("Тяжесть состояния", 13, p.sub, true), 8);
      LinearLayout r = row();
      String[] names = {"Легкое", "Среднее", "Тяжелое"};
      String[] descriptions = {"Легкая одышка", "Выраженная одышка", "Удушье"};
      String[] severities = {"light", "medium", "heavy"};
      for (int i = 0; i < 3; i++) {
        final int index = i;
        MaterialButton b = button("", false, () -> {});
        android.text.SpannableString caption =
            new android.text.SpannableString(tr(names[i]) + "\n" + tr(descriptions[i]));
        caption.setSpan(new android.text.style.AbsoluteSizeSpan(11, true),
            tr(names[i]).length() + 1, caption.length(), 0);
        b.setText(caption);
        b.setMinWidth(0);
        b.setCornerRadius(dp(12));
        b.setPadding(dp(3), 0, dp(3), 0);
        b.setTextColor(0xff0f2b46);
        b.setBackgroundTintList(ColorStateList.valueOf(severityColor(i)));
        b.setStrokeWidth(severities[i].equals(form.optString("severity")) ? dp(2) : 0);
        b.setStrokeColor(ColorStateList.valueOf(p.text));
        b.setAlpha(severities[i].equals(form.optString("severity")) ? 1f : .6f);
        b.setOnClickListener(v -> {
          Records.put(form, "severity", severities[index]);
          for (int j = 0; j < r.getChildCount(); j++) {
            MaterialButton child = (MaterialButton) r.getChildAt(j);
            child.setAlpha(j == index ? 1f : .6f);
            child.setStrokeWidth(j == index ? dp(2) : 0);
          }
        });
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(72), 1);
        lp.setMargins(dp(3), 0, dp(3), 0);
        r.addView(b, lp);
      }
      add(col, r, 16);
    }
    LinearLayout timeDate = row();
    LinearLayout timeCol = column();
    timeDate.addView(timeCol, new LinearLayout.LayoutParams(0, -2, 1));
    add(timeCol, text(type == 0 ? "Время приёма" : "Время", 13, p.sub, true), 4);
    MaterialButton time = button(timeLabel(form.optString("time")), false, () -> {});
    time.setBackgroundTintList(ColorStateList.valueOf(p.tint));
    time.setTextColor(p.text);
    time.setCornerRadius(dp(10));
    time.setIcon(icon(R.drawable.ic_clock, p.sub));
    time.setIconGravity(MaterialButton.ICON_GRAVITY_END);
    time.setIconTint(ColorStateList.valueOf(p.sub));
    time.setOnClickListener(v -> pickTime(form.optString("time"), value -> {
      Records.put(form, "time", value);
      time.setText(timeLabel(value));
    }));
    add(timeCol, time, 0);
    add(col, timeDate, 14);
    if (type != 0) {
      LinearLayout dateCol = column();
      LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -2, 1);
      lp.leftMargin = dp(10);
      timeDate.addView(dateCol, lp);
      add(dateCol, text("Дата", 13, p.sub, true), 4);
      MaterialButton date =
          button(shortDateLabel(LocalDate.parse(form.optString("date"))), false, () -> {});
      date.setBackgroundTintList(ColorStateList.valueOf(p.tint));
      date.setTextColor(p.text);
      date.setCornerRadius(dp(10));
      date.setTextSize(13);
      date.setPadding(dp(8), 0, dp(8), 0);
      date.setOnClickListener(v -> pickDate(LocalDate.parse(form.optString("date")), value -> {
        Records.put(form, "date", value.toString());
        date.setText(shortDateLabel(value));
      }));
      add(dateCol, date, 0);
    } else {
      add(col, text("Дни недели", 13, p.sub, true), 6);
      LinearLayout days = row();
      String[] labels = en() ? new String[] {"Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"}
                             : new String[] {"Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"};
      Runnable updateDays = () -> {
        for (int i = 0; i < 7; i++) {
          MaterialButton b = (MaterialButton) days.getChildAt(i);
          boolean on = Records.contains(form.optJSONArray("days"), i + 1);
          b.setBackgroundTintList(ColorStateList.valueOf(on ? p.primary : p.day));
          b.setTextColor(on ? Color.WHITE : p.text);
        }
      };
      for (int i = 0; i < 7; i++) {
        final int day = i + 1;
        MaterialButton b = button(labels[i], false, () -> {
          JSONArray old = form.optJSONArray("days");
          boolean selected = Records.contains(old, day);
          if (selected && old.length() == 1)
            return;
          JSONArray next = new JSONArray();
          for (int d = 1; d <= 7; d++)
            if (d == day ? !selected : Records.contains(old, d))
              next.put(d);
          Records.put(form, "days", next);
          updateDays.run();
        });
        b.setPadding(0, 0, 0, 0);
        b.setMinWidth(0);
        b.setTextSize(12);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(48), 1);
        lp.setMargins(dp(2), 0, dp(2), 0);
        days.addView(b, lp);
      }
      add(col, days, 8);
      updateDays.run();
      LinearLayout presets = row();
      MaterialButton all = button("Все", false, () -> {
        Records.put(form, "days", new JSONArray(Arrays.asList(1, 2, 3, 4, 5, 6, 7)));
        updateDays.run();
      });
      MaterialButton weekdays = button("Будни", false, () -> {
        Records.put(form, "days", new JSONArray(Arrays.asList(1, 2, 3, 4, 5)));
        updateDays.run();
      });
      presets.addView(all, new LinearLayout.LayoutParams(0, dp(48), 1));
      presets.addView(weekdays, new LinearLayout.LayoutParams(0, dp(48), 1));
      add(col, presets, 14);
    }
    if (type == 1)
      field(col, form, "trigger", "Причина / триггер (необязательно)", false);
    field(col, form, type == 2 ? "description" : "note",
        type == 0       ? "Заметка (необязательно)"
            : type == 1 ? "Заметка / принятые меры (необязательно)"
                        : "Подробности (необязательно)",
        type != 0);
    LinearLayout actions = row();
    actions.addView(
        button("Отмена", false, this::closeSheet), new LinearLayout.LayoutParams(0, -2, 1));
    actions.addView(
        button(existing     ? "Сохранить"
                : type == 1 ? "Зафиксировать"
                            : "Добавить",
            true,
            () -> {
              if (title != null && form.optString("title").trim().isEmpty()) {
                title.setError(en() ? "Enter a title" : "Введите название");
                title.requestFocus();
                return;
              }
              JSONObject value = Records.copy(form);
              value.remove("_new");
              for (String key : Arrays.asList("title", "note", "trigger", "description"))
                if (value.has(key))
                  Records.put(value, key, value.optString(key).trim());
              JSONObject next = Records.copy(data);
              JSONArray records = new JSONArray();
              boolean found = false;
              for (JSONObject o : Records.list(next, type)) {
                if (o.optString("id").equals(value.optString("id"))) {
                  records.put(value);
                  found = true;
                } else
                  records.put(o);
              }
              if (!found)
                records.put(value);
              Records.put(next, Records.KEYS[type], records);
              if (persist(next)) {
                closeSheet();
                renderScreen();
              }
            }),
        new LinearLayout.LayoutParams(0, -2, 1));
    add(col, actions, 8);
  }
  private void preferences() {
    add(content, text("Предпочтения", 12, p.primary, true), 8);
    LinearLayout main = cardColumn(content, p.card, 16, 0);
    main.setTag("settings-group");
    option(main, R.drawable.ic_bell, 0xff2f7be0, "Уведомления",
        settings.optBoolean("notificationsEnabled", false) ? "Включены (напоминания активны)"
                                                           : "Напоминания и оповещения",
        this::notifications);
    option(
        main, R.drawable.ic_sound, p.primary, "Звук уведомления", soundTitle(), this::soundSheet);
    option(main, R.drawable.ic_note, 0xff7b4bc4, "Тема приложения",
        settings.optString("theme", "light").equals("dark")        ? "Тёмная"
            : settings.optString("theme", "light").equals("light") ? "Светлая"
                                                                   : "Как в системе (MD3)",
        this::themeSheet);
    add(content, text("Резервное копирование", 13, p.primary, true), 10);
    LinearLayout backup = cardColumn(content, p.card, 16, 0);
    backup.setTag("settings-group");
    option(backup, R.drawable.ic_import, p.primary, "Импортировать данные",
        "Загрузить из резервной копии", () -> {
          LinearLayout col = sheet("Импорт базы данных");
          add(col,
              text("Выберите резервную копию Asthmatick в формате SQLite (.db). Текущие записи "
                      + "будут заменены данными из файла.",
                  14, p.sub, false),
              16);
          add(col,
              button("Выбрать файл .db с устройства", true,
                  () -> importFile.launch(new String[] {"*/*"})),
              8);
          add(col, button("Отмена", false, this::closeSheet), 0);
        });
    int count =
        Records.list(data, 0).size() + Records.list(data, 1).size() + Records.list(data, 2).size();
    option(backup, R.drawable.ic_export, 0xff2f7be0, "Экспортировать данные",
        en() ? "Save to device (" + count + " records)"
             : "Сохранить на устройство (" + count + " записей)",
        () -> {
          LinearLayout col = sheet("Экспорт базы данных");
          String[] labels = {"Расписание приёма:", "Зафиксировано приступов:", "Заметок:"};
          for (int i = 0; i < 3; i++)
            add(col, raw(tr(labels[i]) + " " + Records.list(data, i).size(), 15, p.sub, false), 10);
          add(col,
              button("Сохранить файл .db", true,
                  () -> exportFile.launch("asthmatick_backup_" + LocalDate.now() + ".db")),
              0);
        });
    add(content, text("О приложении", 13, p.primary, true), 10);
    LinearLayout about = cardColumn(content, p.card, 16, 0);
    about.setTag("settings-group");
    option(about, R.drawable.ic_info, 0xff7b4bc4, "Справочная информация", "О приложении и версия",
        this::info);
    View languageDivider = new View(this);
    languageDivider.setBackgroundColor(p.border);
    about.addView(languageDivider, new LinearLayout.LayoutParams(-1, dp(1)));
    LinearLayout language = row();
    pad(language, 14, 14);
    ImageView languageIcon = image(R.drawable.ic_language, 44, p.primary);
    pad(languageIcon, 9, 9);
    languageIcon.setBackground(shape(p.green, 12));
    language.addView(languageIcon);
    LinearLayout languageText = column();
    languageText.setPadding(dp(12), 0, 0, 0);
    add(languageText, text("Язык / Language", 16, p.text, true), 3);
    add(languageText, raw("Русский / English", 13, p.sub, false), 0);
    language.addView(languageText, new LinearLayout.LayoutParams(0, -2, 1));
    LinearLayout languageButtons = row();
    languageButtons.setBackground(shape(p.tint, 24));
    pad(languageButtons, 4, 2);
    for (int i = 0; i < 2; i++) {
      final int selectedLanguage = i;
      MaterialButton b = button(i == 0 ? "RU" : "EN", false,
          () -> setSetting("language", selectedLanguage == 0 ? "ru" : "en"));
      b.setMinWidth(0);
      b.setPadding(0, 0, 0, 0);
      b.setCornerRadius(dp(24));
      b.setBackgroundTintList(ColorStateList.valueOf((en() ? 1 : 0) == i ? p.card : p.tint));
      languageButtons.addView(b, new LinearLayout.LayoutParams(dp(42), dp(42)));
    }
    language.addView(languageButtons);
    add(about, language, 0);
    LinearLayout footer = row();
    footer.setGravity(Gravity.CENTER);
    footer.setPadding(0, dp(40), 0, dp(12));
    String[] legalTitles = {"Политика конфиденциальности", "Пользовательское соглашение"};
    for (int i = 0; i < 2; i++) {
      final int resource = i == 0 ? R.raw.privacy : R.raw.terms;
      TextView link = text(legalTitles[i], 12, p.sub, false);
      link.setGravity(Gravity.CENTER);
      link.setAlpha(.6f);
      link.setMinHeight(dp(48));
      link.setOnClickListener(v -> legal(resource));
      footer.addView(link, new LinearLayout.LayoutParams(0, -2, 1));
    }
    add(content, footer, 0);
  }
  private void themeSheet() {
    LinearLayout col = sheet("Тема приложения");
    String[] keys = {"light", "dark", "system"};
    String[] titles = {"Светлая тема", "Тёмная тема", "Как в системе (MD3)"};
    String[] subs = {
        "Нежная светлая палитра", "Глубокая тёмная палитра", "По обоям телефона (Material You)"};
    for (int i = 0; i < 3; i++) {
      final int index = i;
      optionRadio(col,
          i == 1       ? R.drawable.ic_moon
              : i == 2 ? R.drawable.ic_phone
                       : R.drawable.ic_sun,
          titles[i], subs[i], settings.optString("theme", "light").equals(keys[i]), () -> {
            closeSheet();
            setSetting("theme", keys[index]);
          });
    }
  }
  private void notifications() {
    LinearLayout col = sheet("Уведомления");
    MaterialSwitch enabled = new MaterialSwitch(this);
    enabled.setText(tr("Включить напоминания"));
    enabled.setTextColor(p.text);
    boolean granted = Build.VERSION.SDK_INT < 33
        || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
            == PackageManager.PERMISSION_GRANTED;
    enabled.setChecked(granted && settings.optBoolean("notificationsEnabled", false));
    enabled.setOnCheckedChangeListener((b, checked) -> {
      if (checked && Build.VERSION.SDK_INT >= 33
          && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
              != PackageManager.PERMISSION_GRANTED) {
        permission.launch(Manifest.permission.POST_NOTIFICATIONS);
      } else
        setSetting("notificationsEnabled", checked);
    });
    add(col, enabled, 12);
    boolean exact =
        Build.VERSION.SDK_INT < 31 || getSystemService(AlarmManager.class).canScheduleExactAlarms();
    add(col,
        text(exact     ? "Точные напоминания разрешены"
                : en() ? "Allow exact reminders in Android settings"
                       : "Разрешите точные напоминания в настройках Android",
            14, p.sub, false),
        12);
    if (!exact)
      add(col,
          button(en() ? "Allow exact reminders" : "Разрешить точные напоминания", false, () -> {
            if (Build.VERSION.SDK_INT >= 31)
              startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                  Uri.parse("package:" + getPackageName())));
          }), 12);
    add(col, button("Готово", true, this::closeSheet), 0);
  }
  private static final String[] SOUND_KEYS = {
      "system", "sound_chime", "sound_breeze", "sound_digital", "sound_marimba"};
  private static final String[] SOUND_LABELS = {
      "Системный звук", "Колокольчик", "Лёгкий бриз", "Электронный сигнал", "Маримба"};
  private String soundTitle() {
    int index =
        Arrays.asList(SOUND_KEYS).indexOf(settings.optString("notificationSound", "system"));
    return SOUND_LABELS[Math.max(index, 0)];
  }
  private void soundSheet() {
    LinearLayout col = sheet("Звук уведомления");
    String[] subtitles = {"Стандартный сигнал вашего устройства", "Мягкий переливающийся звон",
        "Спокойное гармоничное созвучие", "Чёткий современный двойной сигнал",
        "Тёплый акустический тон"};
    for (int i = 0; i < SOUND_KEYS.length; i++) {
      final int index = i;
      optionRadio(col, R.drawable.ic_sound, SOUND_LABELS[i], subtitles[i],
          settings.optString("notificationSound", "system").equals(SOUND_KEYS[i]), () -> {
            setSetting("notificationSound", SOUND_KEYS[index]);
            soundSheet();
            if (preview != null)
              preview.stop();
            preview =
                RingtoneManager.getRingtone(this, ReminderReceiver.sound(this, SOUND_KEYS[index]));
            if (preview != null) {
              preview.play();
              handler.postDelayed(() -> {
                if (preview != null)
                  preview.stop();
              }, 4000);
            }
          });
    }
    add(col,
        button("Проверить текущий звук уведомлением", false,
            ()
                -> ReminderReceiver.notify(
                    this, settings, "Asthmatick", tr("Время приёма"), "test")),
        8);
    add(col, button("Готово", true, this::closeSheet), 0);
  }

  private void backup(Uri uri, boolean restore) {
    if (busy)
      return;
    busy = true;
    setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LOCKED);
    closeSheet();
    LinearLayout wait = sheet(restore ? "Импорт базы данных" : "Экспорт базы данных");
    add(wait, new com.google.android.material.progressindicator.CircularProgressIndicator(this),
        16);
    activeSheet.setCancelable(false);
    io.execute(() -> {
      JSONObject imported = null;
      Exception failure = null;
      try {
        if (restore)
          imported = store.importFrom(uri);
        else
          store.exportTo(uri);
      } catch (Exception e) {
        failure = e;
      }
      JSONObject result = imported;
      Exception error = failure;
      runOnUiThread(() -> {
        busy = false;
        setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        if (isDestroyed()) {
          store.close();
          return;
        }
        closeSheet();
        if (error != null) {
          android.util.Log.e("Asthmatick", "Backup operation failed", error);
          toast(en() ? "Could not read or save the backup. Your records were not changed."
                     : "Не удалось прочитать или сохранить резервную копию. Записи не изменены.");
        } else {
          if (result != null) {
            data = result;
            settings = data.optJSONObject("settings");
            applyTheme();
            ReminderReceiver.sync(this, data);
            render();
          }
          toast(restore ? (en() ? "Backup restored" : "Резервная копия восстановлена")
                        : (en() ? "Backup saved" : "Резервная копия сохранена"));
        }
      });
    });
  }
  private void info() {
    LinearLayout col = sheet("Справочная информация");
    LinearLayout logo = row();
    logo.setGravity(Gravity.CENTER);
    logo.addView(image(R.drawable.ic_lungs, 56, 0));
    add(col, logo, 8);
    TextView title = raw("Asthmatick", 24, p.text, true);
    title.setGravity(Gravity.CENTER);
    add(col, title, 6);
    add(col, text("Трекер приступов и дневник астмы", 14, p.sub, false), 16);
    LinearLayout details = cardColumn(col, p.tint, 16, 14);
    add(details, raw("Package ID: app.asthma.tick", 14, p.text, true), 8);
    add(details, raw(tr("Версия:") + " 2.0.0", 14, p.text, true), 8);
    add(details, text("100% Локально", 14, p.primary, true), 0);
    add(col,
        text("Данное приложение не является медицинским продуктом и служит исключительно для "
                + "трекера и контроля расписания.",
            14, p.sub, false),
        16);
    add(col, button("Повторить вступительную инструкцию", false, () -> onboarding(0)), 8);
    add(col, button("Понятно", true, this::closeSheet), 0);
  }
  private void legal(int resource) {
    LinearLayout col = sheet("");
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(
             getResources().openRawResource(resource), java.nio.charset.StandardCharsets.UTF_8))) {
      String line;
      while ((line = reader.readLine()) != null)
        if (!line.trim().isEmpty())
          add(col, text(line, 14, p.text, false), 14);
    } catch (IOException e) {
      toast(en() ? "Could not open text" : "Не удалось открыть текст");
    }
    add(col, button("Понятно", true, this::closeSheet), 0);
  }
  private void onboarding(int step) {
    LinearLayout col = sheet("");
    activeSheet.setOnCancelListener(dialog -> setSetting("hasSeenOnboarding", true));
    FrameLayout top = new FrameLayout(this);
    TextView badge = raw(
        en() ? "STEP " + (step + 1) + " OF 3" : "ШАГ " + (step + 1) + " ИЗ 3", 12, p.primary, true);
    pad(badge, 10, 4);
    badge.setBackground(shape(p.tint, 8));
    top.addView(badge, new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER));
    LinearLayout languages = row();
    languages.setBackground(shape(p.tint, 20));
    for (int i = 0; i < 2; i++) {
      final int selectedLanguage = i;
      MaterialButton b = button(i == 0 ? "RU" : "EN", false, () -> {
        setSetting("language", selectedLanguage == 0 ? "ru" : "en");
        onboarding(step);
      });
      b.setMinWidth(0);
      b.setPadding(0, 0, 0, 0);
      b.setTextSize(11);
      b.setBackgroundTintList(ColorStateList.valueOf((en() ? 1 : 0) == i ? p.card : p.tint));
      languages.addView(b, new LinearLayout.LayoutParams(dp(36), dp(34)));
    }
    top.addView(
        languages, new FrameLayout.LayoutParams(-2, -2, Gravity.END | Gravity.CENTER_VERTICAL));
    add(col, top, 16);
    FrameLayout circle = new FrameLayout(this);
    circle.setBackground(shape(step == 0 ? p.tint : step == 1 ? p.green : 0xfffef3c7, 45));
    ImageView symbol = image(step == 0 ? R.drawable.ic_lungs
            : step == 1                ? R.drawable.ic_shield
                                       : R.drawable.ic_warning,
        step == 0 ? 58 : 44,
        step == 0       ? 0
            : step == 1 ? p.primary
                        : 0xffd97706);
    circle.addView(symbol,
        new FrameLayout.LayoutParams(
            dp(step == 0 ? 58 : 44), dp(step == 0 ? 58 : 44), Gravity.CENTER));
    LinearLayout.LayoutParams circleParams = new LinearLayout.LayoutParams(dp(90), dp(90));
    circleParams.gravity = Gravity.CENTER_HORIZONTAL;
    circleParams.bottomMargin = dp(16);
    col.addView(circle, circleParams);
    TextView title = text(new String[] {"Добро пожаловать в Asthmatick", "100% конфиденциальность",
                              "Важное предупреждение"}[step],
        22, p.text, true);
    title.setGravity(Gravity.CENTER);
    add(col, title, 8);
    TextView description =
        text(new String[] {"Удобный и надёжный трекер расписания и контроля приступов астмы.",
                 "Все ваши данные сохраняются исключительно локально на вашем устройстве.",
                 "Данное приложение не является медицинским продуктом и служит только для трекера "
                     + "и дневника."}[step],
            15, p.sub, false);
    description.setGravity(Gravity.CENTER);
    add(col, description, 24);
    LinearLayout dots = row();
    dots.setGravity(Gravity.CENTER);
    for (int i = 0; i < 3; i++) {
      View dot = new View(this);
      dot.setBackground(shape(i == step ? p.primary : p.sub, 3));
      LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(i == step ? 22 : 6), dp(6));
      lp.setMargins(dp(4), 0, dp(4), 0);
      dots.addView(dot, lp);
    }
    add(col, dots, 24);
    LinearLayout actions = row();
    if (step > 0) {
      actions.addView(button("Назад", false, () -> onboarding(step - 1)),
          new LinearLayout.LayoutParams(0, -2, 1));
    }
    MaterialButton next = button(step == 2 ? "Начать" : "Далее", true, () -> {
      if (step < 2)
        onboarding(step + 1);
      else {
        closeSheet();
        setSetting("hasSeenOnboarding", true);
      }
    });
    LinearLayout.LayoutParams nextParams = new LinearLayout.LayoutParams(0, -2, 1);
    if (step > 0)
      nextParams.leftMargin = dp(8);
    actions.addView(next, nextParams);
    add(col, actions, 0);
  }
}
