package app.asthma.tick;

import android.content.Context;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;

final class Palette {
  int bg, bg2, head, head2, card, text, sub, primary, tint, nav, day, greet, wm, blue, purple,
      green, border;
  final boolean dark;
  static int c(String s) {
    return Color.parseColor(s);
  }
  Palette(Context context, String theme) {
    dark = theme.equals("dark")
        || (theme.equals("system")
            && (context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
                == Configuration.UI_MODE_NIGHT_YES);
    bg = c(dark ? "#0e1a22" : "#e9f6f6");
    bg2 = c(dark ? "#101d27" : "#f4f9fb");
    head = c(dark ? "#143339" : "#cfe8e2");
    head2 = c(dark ? "#143339" : "#d9f0ef");
    card = c(dark ? "#172a35" : "#ffffff");
    text = c(dark ? "#e8f3f5" : "#0f2b46");
    sub = c(dark ? "#8ea6b4" : "#6b7f94");
    primary = c(dark ? "#33c2b0" : "#1a9b8c");
    tint = c(dark ? "#1b3a3d" : "#e4f4f0");
    nav = c(dark ? "#13232d" : "#f6fafb");
    day = c(dark ? "#1c3540" : "#dff1f2");
    greet = c(dark ? "#17333a" : "#e3f3ef");
    wm = c(dark ? "#1b3a42" : "#bcd9dc");
    blue = c(dark ? "#1c3350" : "#e3effd");
    purple = c(dark ? "#2b2548" : "#efe6f7");
    green = c(dark ? "#17372f" : "#dff2ec");
    border = dark ? 0x1affffff : 0x1f1e5a6e;
    if (theme.equals("system") && Build.VERSION.SDK_INT >= 31) {
      primary = context.getColor(
          dark ? android.R.color.system_accent1_200 : android.R.color.system_accent1_600);
      tint = context.getColor(
          dark ? android.R.color.system_accent1_700 : android.R.color.system_accent1_100);
      bg = context.getColor(
          dark ? android.R.color.system_neutral1_900 : android.R.color.system_neutral1_10);
      bg2 = head = head2 = card = nav = context.getColor(
          dark ? android.R.color.system_neutral1_800 : android.R.color.system_neutral1_50);
      text = context.getColor(
          dark ? android.R.color.system_neutral1_100 : android.R.color.system_neutral1_900);
      sub = context.getColor(
          dark ? android.R.color.system_neutral2_200 : android.R.color.system_neutral2_700);
      border = context.getColor(
          dark ? android.R.color.system_neutral2_700 : android.R.color.system_neutral2_200);
      day = context.getColor(
          dark ? android.R.color.system_neutral1_700 : android.R.color.system_neutral1_100);
      greet = blue = green = context.getColor(
          dark ? android.R.color.system_accent2_700 : android.R.color.system_accent2_100);
      purple = tint;
      wm = primary;
    } else if (theme.equals("system")) {
      Integer seed = null;
      if (Build.VERSION.SDK_INT >= 27)
        try {
          android.app.WallpaperColors colors =
              android.app.WallpaperManager.getInstance(context).getWallpaperColors(
                  android.app.WallpaperManager.FLAG_SYSTEM);
          if (colors != null)
            seed = colors.getPrimaryColor().toArgb();
        } catch (SecurityException ignored) {
        }
      if (seed != null) {
        float[] hsl = new float[3];
        androidx.core.graphics.ColorUtils.colorToHSL(seed, hsl);
        float h = hsl[0], sat = Math.max(.30f, Math.min(.85f, hsl[1]));
        primary = hsl(h, sat, dark ? .78f : .40f);
        tint = hsl(h, sat * .7f, dark ? .28f : .88f);
        bg = hsl(h, .08f, dark ? .08f : .98f);
        bg2 = hsl(h, .08f, dark ? .14f : .93f);
        text = hsl(h, .08f, dark ? .90f : .10f);
        sub = hsl(h, .08f, dark ? .78f : .35f);
        border = hsl(h, .08f, dark ? .26f : .80f);
        day = hsl(h, .08f, dark ? .18f : .90f);
        greet = hsl(h, sat * .45f, dark ? .28f : .88f);
      } else {
        primary = c(dark ? "#84cfff" : "#00658f");
        tint = c(dark ? "#004c6d" : "#c7e7ff");
        bg = c(dark ? "#101416" : "#f7f9fc");
        bg2 = c(dark ? "#1c2023" : "#ecf0f4");
        text = c(dark ? "#e0e3e6" : "#181c1f");
        sub = c(dark ? "#c1c7ce" : "#41474d");
        border = c(dark ? "#41474d" : "#c1c7ce");
        day = c(dark ? "#272b2d" : "#e6ebf0");
        greet = c(dark ? "#374955" : "#d2e5f5");
      }
      head = head2 = card = nav = bg2;
      blue = green = greet;
      purple = tint;
      wm = primary;
    }
  }
  private static int hsl(float h, float s, float l) {
    return androidx.core.graphics.ColorUtils.HSLToColor(new float[] {h, s, l});
  }
}
