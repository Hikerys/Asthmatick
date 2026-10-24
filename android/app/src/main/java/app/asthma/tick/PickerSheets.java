package app.asthma.tick;

import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.*;
import android.widget.*;
import com.google.android.material.bottomsheet.*;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.chip.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.function.Consumer;

/** Original date/time layouts rendered exclusively by native Material and Android views. */
final class PickerSheets {
  private final MainActivity host;
  private final BottomSheetDialog dialog;
  private final LinearLayout content;
  private PickerSheets(MainActivity host) {
    this.host = host;
    dialog = new BottomSheetDialog(host);
    content = host.column();
    host.pad(content, 22, 16);
    ScrollView scroll = new ScrollView(host);
    scroll.setBackground(host.shape(host.p.card, 28));
    scroll.setClipToOutline(true);
    scroll.addView(content);
    dialog.setContentView(scroll);
    dialog.setOnShowListener(d -> {
      FrameLayout sheet = dialog.findViewById(com.google.android.material.R.id.design_bottom_sheet);
      if (sheet != null) {
        sheet.setBackgroundTintList(ColorStateList.valueOf(host.p.card));
        BottomSheetBehavior<FrameLayout> behavior = BottomSheetBehavior.from(sheet);
        behavior.setMaxWidth(host.dp(640));
        behavior.setState(BottomSheetBehavior.STATE_EXPANDED);
        behavior.setSkipCollapsed(true);
      }
    });
  }
  private void title(String title) {
    content.removeAllViews();
    View handle = new View(host);
    handle.setBackground(host.shape(host.p.sub, 3));
    LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(host.dp(40), host.dp(4));
    lp.gravity = Gravity.CENTER_HORIZONTAL;
    lp.bottomMargin = host.dp(22);
    content.addView(handle, lp);
    host.heading(content, title);
  }
  private MaterialButton small(String text, Runnable action) {
    MaterialButton b = host.button(text, false, action);
    b.setPadding(host.dp(4), 0, host.dp(4), 0);
    b.setMinWidth(0);
    b.setCornerRadius(host.dp(10));
    b.setTextSize(text.equals("‹") || text.equals("›") ? 24 : 13);
    b.setBackgroundTintList(ColorStateList.valueOf(host.p.card));
    b.setTextColor(host.p.text);
    b.setStrokeWidth(host.dp(1));
    b.setStrokeColor(ColorStateList.valueOf(host.p.border));
    return b;
  }
  private void equal(LinearLayout row, View view) {
    LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -2, 1);
    if (row.getChildCount() > 0)
      lp.leftMargin = host.dp(8);
    row.addView(view, lp);
  }
  private void actions(String confirm, Runnable action) {
    LinearLayout row = host.row();
    equal(row, host.button("Отмена", false, dialog::dismiss));
    MaterialButton save = host.button(confirm, true, () -> {
      action.run();
      dialog.dismiss();
    });
    LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -2, 1.4f);
    lp.leftMargin = host.dp(8);
    row.addView(save, lp);
    host.add(content, row, 4);
  }
  static BottomSheetDialog time(MainActivity host, String initial, Consumer<String> callback) {
    PickerSheets picker = new PickerSheets(host);
    LocalTime[] selected = {LocalTime.parse(initial)};
    TextView[] numbers = new TextView[2];
    MaterialButton[] periods = new MaterialButton[2];
    MaterialButton[] confirm = new MaterialButton[1];
    Runnable refresh = () -> {
      int hour = selected[0].getHour();
      numbers[0].setText(host.en() ? String.valueOf(hour % 12 == 0 ? 12 : hour % 12)
                                    : String.format(Locale.ROOT, "%02d", hour));
      numbers[1].setText(String.format(Locale.ROOT, "%02d", selected[0].getMinute()));
      if (host.en()) {
        for (int i = 0; i < periods.length; i++) {
          boolean active = hour / 12 == i;
          periods[i].setBackgroundTintList(
              ColorStateList.valueOf(active ? host.p.primary : host.p.card));
          periods[i].setTextColor(active ? Color.WHITE : host.p.text);
        }
      }
      String time = selected[0].format(DateTimeFormatter.ofPattern("HH:mm"));
      confirm[0].setText((host.en() ? "Select " : "Выбрать ") + host.timeLabel(time));
    };
    picker.title("Выбор времени");
    host.add(picker.content,
        host.text("Настройте стрелками или выберите быстрый шаблон", 14, host.p.sub, false), 18);
    LinearLayout steppers = host.row();
    steppers.setGravity(Gravity.CENTER);
    host.pad(steppers, 10, 16);
    steppers.setBackground(host.shape(host.p.tint, 20));
    for (int field = 0; field < 2; field++) {
        final int f = field;
        LinearLayout column = host.column();
        column.setGravity(Gravity.CENTER);
        Runnable increase = () -> {
          selected[0] = f == 0 ? selected[0].plusHours(1)
                               : selected[0].withMinute((selected[0].getMinute() + 1) % 60);
          refresh.run();
        };
        Runnable decrease = () -> {
          selected[0] = f == 0 ? selected[0].minusHours(1)
                               : selected[0].withMinute((selected[0].getMinute() + 59) % 60);
          refresh.run();
        };
        ImageButton up = host.iconButton(
            R.drawable.ic_chevron, f == 0 ? "Прибавить час" : "Прибавить минуту", increase);
        up.setRotation(270);
        up.setBackground(host.shape(host.p.card, 12));
        column.addView(up);
        TextView number = host.raw("00", 40, host.p.text, true);
        numbers[f] = number;
        number.setGravity(Gravity.CENTER);
        column.addView(number, new LinearLayout.LayoutParams(host.dp(80), host.dp(58)));
        ImageButton down = host.iconButton(
            R.drawable.ic_chevron, f == 0 ? "Убавить час" : "Убавить минуту", decrease);
        down.setRotation(90);
        down.setBackground(host.shape(host.p.card, 12));
        column.addView(down);
        TextView label = host.text(f == 0 ? "часы" : "минуты", 12, host.p.sub, true);
        label.setGravity(Gravity.CENTER);
        label.setPadding(0, host.dp(8), 0, 0);
        column.addView(label);
        steppers.addView(column);
        if (field == 0) {
          TextView colon = host.raw(":", 36, host.p.sub, true);
          colon.setGravity(Gravity.CENTER);
          steppers.addView(colon, new LinearLayout.LayoutParams(host.dp(36), -2));
        }
    }
    if (host.en()) {
        LinearLayout periodColumn = host.column();
        periodColumn.setPadding(host.dp(10), 0, 0, 0);
        for (int ampm = 0; ampm < 2; ampm++) {
          final int half = ampm;
          MaterialButton b = picker.small(ampm == 0 ? "AM" : "PM", () -> {
            selected[0] = selected[0].withHour(selected[0].getHour() % 12 + half * 12);
            refresh.run();
          });
          periods[ampm] = b;
          periodColumn.addView(b, new LinearLayout.LayoutParams(host.dp(52), host.dp(48)));
        }
        steppers.addView(periodColumn);
    }
    host.add(picker.content, steppers, 16);
    LinearLayout offsets = host.row();
    for (int minutes : new int[] {-15, -5, 5, 15})
        picker.equal(offsets,
            picker.small(
                (minutes < 0 ? "−" : "+") + Math.abs(minutes) + " " + (host.en() ? "min" : "мин"),
                () -> {
                  selected[0] = selected[0].plusMinutes(minutes);
                  refresh.run();
                }));
    host.add(picker.content, offsets, 16);
    host.add(picker.content, host.text("Быстрые шаблоны", 12, host.p.sub, true), 8);
    ChipGroup presets = new ChipGroup(host);
    presets.setChipSpacingHorizontal(host.dp(8));
    presets.setChipSpacingVertical(host.dp(4));
    String[] names = host.en()
          ? new String[] {"⏱️ Now", "🌅 Morning 8:00 AM", "☀️ Afternoon 1:00 PM",
                "🌆 Evening 7:00 PM", "🌙 Bedtime 10:00 PM"}
          : new String[] {
                "⏱️ Сейчас", "🌅 Утро 08:00", "☀️ День 13:00", "🌆 Вечер 19:00", "🌙 На ночь 22:00"};
    for (int i = 0; i < names.length; i++) {
        final int preset = i;
        Chip chip = new Chip(host);
        chip.setText(names[i]);
        chip.setTextSize(13);
        chip.setTextColor(i == 0 ? host.p.primary : host.p.text);
        chip.setChipBackgroundColor(ColorStateList.valueOf(i == 0 ? host.p.tint : host.p.card));
        chip.setChipStrokeColor(ColorStateList.valueOf(i == 0 ? host.p.primary : host.p.border));
        chip.setChipStrokeWidth(host.dp(1));
        chip.setChipCornerRadius(host.dp(8));
        chip.setOnClickListener(v -> {
          selected[0] = preset == 0 ? LocalTime.now().withSecond(0).withNano(0)
                                    : LocalTime.of(new int[] {0, 8, 13, 19, 22}[preset], 0);
          refresh.run();
        });
        presets.addView(chip);
    }
    host.add(picker.content, presets, 20);
    LinearLayout actions = host.row();
    picker.equal(actions, host.button("Отмена", false, picker.dialog::dismiss));
    confirm[0] = host.button("", true, () -> {
      callback.accept(selected[0].format(DateTimeFormatter.ofPattern("HH:mm")));
      picker.dialog.dismiss();
    });
    LinearLayout.LayoutParams confirmLayout = new LinearLayout.LayoutParams(0, -2, 1.4f);
    confirmLayout.leftMargin = host.dp(8);
    actions.addView(confirm[0], confirmLayout);
    host.add(picker.content, actions, 4);
    refresh.run();
    picker.dialog.show();
    return picker.dialog;
  }
  static BottomSheetDialog date(
      MainActivity host, LocalDate initial, Consumer<LocalDate> callback) {
    PickerSheets picker = new PickerSheets(host);
    LocalDate[] selected = {initial}, month = {initial.withDayOfMonth(1)};
    Runnable[] render = new Runnable[1];
    render[0] = () -> {
      picker.title("Выбор даты");
      host.add(picker.content,
          host.raw(
              selected[0].format(DateTimeFormatter.ofPattern("EEE, d MMMM yyyy", host.locale())),
              14, host.p.sub, false),
          16);
      LinearLayout quick = host.row();
      String[] labels = {"Вчера", "Сегодня", "Завтра"};
      for (int i = 0; i < 3; i++) {
        final LocalDate day = LocalDate.now().plusDays(i - 1);
        MaterialButton b = picker.small(labels[i], () -> {
          selected[0] = day;
          month[0] = day.withDayOfMonth(1);
          render[0].run();
        });
        b.setCornerRadius(host.dp(8));
        b.setBackgroundTintList(
            ColorStateList.valueOf(day.equals(selected[0]) ? host.p.primary : host.p.tint));
        b.setTextColor(day.equals(selected[0]) ? Color.WHITE : host.p.text);
        picker.equal(quick, b);
      }
      host.add(picker.content, quick, 16);
      LinearLayout calendar = host.column();
      host.pad(calendar, 12, 12);
      calendar.setBackground(host.shape(host.p.tint, 16));
      LinearLayout header = host.row();
      TextView title =
          host.raw(month[0].format(DateTimeFormatter.ofPattern("LLLL yyyy", host.locale())), 18,
              host.p.text, true);
      header.addView(title, new LinearLayout.LayoutParams(0, -2, 1));
      MaterialButton prev = picker.small("‹", () -> {
        month[0] = month[0].minusMonths(1);
        render[0].run();
      });
      prev.setContentDescription(host.tr("Предыдущий месяц"));
      MaterialButton next = picker.small("›", () -> {
        month[0] = month[0].plusMonths(1);
        render[0].run();
      });
      next.setContentDescription(host.tr("Следующий месяц"));
      header.addView(prev, new LinearLayout.LayoutParams(host.dp(44), host.dp(44)));
      header.addView(next, new LinearLayout.LayoutParams(host.dp(44), host.dp(44)));
      host.add(calendar, header, 8);
      String[] days = host.en() ? new String[] {"MO", "TU", "WE", "TH", "FR", "SA", "SU"}
                                : new String[] {"ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"};
      LinearLayout names = host.row();
      for (String day : days) {
        TextView label = host.raw(day, 12, host.p.sub, true);
        label.setGravity(Gravity.CENTER);
        names.addView(label, new LinearLayout.LayoutParams(0, host.dp(28), 1));
      }
      host.add(calendar, names, 8);
      int blanks = month[0].getDayOfWeek().getValue() - 1, count = month[0].lengthOfMonth();
      for (int week = 0; week < (blanks + count + 6) / 7; week++) {
        LinearLayout row = host.row();
        for (int d = 0; d < 7; d++) {
          int day = week * 7 + d - blanks + 1;
          FrameLayout slot = new FrameLayout(host);
          row.addView(slot, new LinearLayout.LayoutParams(0, host.dp(42), 1));
          if (day < 1 || day > count)
            continue;
          LocalDate date = month[0].withDayOfMonth(day);
          TextView label = host.raw(
              String.valueOf(day), 15, date.equals(selected[0]) ? Color.WHITE : host.p.text, true);
          label.setGravity(Gravity.CENTER);
          GradientDrawable bg =
              host.shape(date.equals(selected[0]) ? host.p.primary : Color.TRANSPARENT, 18);
          if (date.equals(LocalDate.now()) && !date.equals(selected[0]))
            bg.setStroke(host.dp(2), host.p.primary);
          label.setBackground(bg);
          label.setContentDescription(host.dateLabel(date));
          slot.addView(
              label, new FrameLayout.LayoutParams(host.dp(36), host.dp(36), Gravity.CENTER));
          label.setOnClickListener(v -> {
            selected[0] = date;
            render[0].run();
          });
        }
        calendar.addView(row);
      }
      host.add(picker.content, calendar, 20);
      picker.actions("Выбрать дату", () -> callback.accept(selected[0]));
    };
    render[0].run();
    picker.dialog.show();
    return picker.dialog;
  }
}
