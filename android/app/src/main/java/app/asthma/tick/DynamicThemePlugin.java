package app.asthma.tick;

import android.app.WallpaperColors;
import android.app.WallpaperManager;
import android.content.Context;
import android.graphics.Color;
import android.os.Build;
import android.util.Log;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.ColorUtils;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DynamicTheme")
public class DynamicThemePlugin extends Plugin {

    private static final String TAG = "DynamicTheme";

    private String toHex(int color) {
        return String.format("#%06X", (0xFFFFFF & color));
    }

    private int getFrameworkColor(Context context, int resId) {
        try {
            return ContextCompat.getColor(context, resId);
        } catch (Throwable t) {
            return 0;
        }
    }

    private JSObject generateSchemeFromSeed(int seedColor, boolean isDark) {
        JSObject obj = new JSObject();
        try {
            float[] hsl = new float[3];
            ColorUtils.colorToHSL(seedColor, hsl);
            float hue = hsl[0];
            float sat = Math.max(0.30f, Math.min(0.85f, hsl[1]));
            float neutSat = 0.08f;
            float secSat = sat * 0.45f;

            int primary = ColorUtils.HSLToColor(new float[]{hue, sat, isDark ? 0.78f : 0.40f});
            int onPrimary = isDark ? 0xFF00363F : 0xFFFFFFFF;
            int primaryContainer = ColorUtils.HSLToColor(new float[]{hue, sat * 0.70f, isDark ? 0.28f : 0.88f});
            int onPrimaryContainer = isDark ? 0xFFE0F7FA : 0xFF002026;

            int secondaryContainer = ColorUtils.HSLToColor(new float[]{hue, secSat, isDark ? 0.28f : 0.88f});
            int onSecondaryContainer = isDark ? 0xFFEAEAEA : 0xFF1A1A1A;

            int surface = ColorUtils.HSLToColor(new float[]{hue, neutSat, isDark ? 0.08f : 0.98f});
            int onSurface = ColorUtils.HSLToColor(new float[]{hue, neutSat, isDark ? 0.90f : 0.10f});
            int surfaceVariant = ColorUtils.HSLToColor(new float[]{hue, neutSat, isDark ? 0.22f : 0.90f});
            int onSurfaceVariant = ColorUtils.HSLToColor(new float[]{hue, neutSat, isDark ? 0.78f : 0.35f});

            int surfaceContainer = ColorUtils.HSLToColor(new float[]{hue, neutSat, isDark ? 0.14f : 0.93f});
            int surfaceContainerHigh = ColorUtils.HSLToColor(new float[]{hue, neutSat, isDark ? 0.18f : 0.90f});
            int surfaceContainerLowest = ColorUtils.HSLToColor(new float[]{hue, neutSat, isDark ? 0.04f : 0.98f});

            int outline = ColorUtils.HSLToColor(new float[]{hue, neutSat, isDark ? 0.55f : 0.48f});
            int outlineVariant = ColorUtils.HSLToColor(new float[]{hue, neutSat, isDark ? 0.26f : 0.80f});

            obj.put("primary", toHex(primary));
            obj.put("onPrimary", toHex(onPrimary));
            obj.put("primaryContainer", toHex(primaryContainer));
            obj.put("onPrimaryContainer", toHex(onPrimaryContainer));
            obj.put("secondary", toHex(primary));
            obj.put("onSecondary", toHex(onPrimary));
            obj.put("secondaryContainer", toHex(secondaryContainer));
            obj.put("onSecondaryContainer", toHex(onSecondaryContainer));
            obj.put("surface", toHex(surface));
            obj.put("onSurface", toHex(onSurface));
            obj.put("surfaceVariant", toHex(surfaceVariant));
            obj.put("onSurfaceVariant", toHex(onSurfaceVariant));
            obj.put("surfaceContainer", toHex(surfaceContainer));
            obj.put("surfaceContainerHigh", toHex(surfaceContainerHigh));
            obj.put("surfaceContainerLowest", toHex(surfaceContainerLowest));
            obj.put("outline", toHex(outline));
            obj.put("outlineVariant", toHex(outlineVariant));
        } catch (Throwable t) {
            Log.e(TAG, "Error generating scheme from seed", t);
        }
        return obj;
    }

    private JSObject extractFrameworkMonetRoles(Context context, boolean isDark) {
        JSObject obj = new JSObject();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                int primary = getFrameworkColor(context, isDark ? android.R.color.system_accent1_200 : android.R.color.system_accent1_600);
                int primaryContainer = getFrameworkColor(context, isDark ? android.R.color.system_accent1_700 : android.R.color.system_accent1_100);
                int onPrimaryContainer = getFrameworkColor(context, isDark ? android.R.color.system_accent1_100 : android.R.color.system_accent1_900);
                int onPrimary = isDark ? 0xFF00363F : 0xFFFFFFFF;

                int secondaryContainer = getFrameworkColor(context, isDark ? android.R.color.system_accent2_700 : android.R.color.system_accent2_100);
                int surface = getFrameworkColor(context, isDark ? android.R.color.system_neutral1_900 : android.R.color.system_neutral1_10);
                int surfaceContainer = getFrameworkColor(context, isDark ? android.R.color.system_neutral1_800 : android.R.color.system_neutral1_50);
                int surfaceContainerHigh = getFrameworkColor(context, isDark ? android.R.color.system_neutral1_700 : android.R.color.system_neutral1_100);
                int surfaceContainerLowest = isDark ? 0xFF0B0E11 : surface;

                int onSurface = getFrameworkColor(context, isDark ? android.R.color.system_neutral1_100 : android.R.color.system_neutral1_900);
                int surfaceVariant = getFrameworkColor(context, isDark ? android.R.color.system_neutral2_700 : android.R.color.system_neutral2_100);
                int onSurfaceVariant = getFrameworkColor(context, isDark ? android.R.color.system_neutral2_200 : android.R.color.system_neutral2_700);

                int outline = getFrameworkColor(context, isDark ? android.R.color.system_neutral2_400 : android.R.color.system_neutral2_500);
                int outlineVariant = getFrameworkColor(context, isDark ? android.R.color.system_neutral2_700 : android.R.color.system_neutral2_200);

                if (primary != 0 && surface != 0) {
                    obj.put("primary", toHex(primary));
                    obj.put("onPrimary", toHex(onPrimary));
                    obj.put("primaryContainer", toHex(primaryContainer));
                    obj.put("onPrimaryContainer", toHex(onPrimaryContainer));
                    obj.put("secondary", toHex(primary));
                    obj.put("onSecondary", toHex(onPrimary));
                    obj.put("secondaryContainer", toHex(secondaryContainer));
                    obj.put("onSecondaryContainer", isDark ? "#EAEAEA" : "#1A1A1A");
                    obj.put("surface", toHex(surface));
                    obj.put("onSurface", toHex(onSurface));
                    obj.put("surfaceVariant", toHex(surfaceVariant));
                    obj.put("onSurfaceVariant", toHex(onSurfaceVariant));
                    obj.put("surfaceContainer", toHex(surfaceContainer));
                    obj.put("surfaceContainerHigh", toHex(surfaceContainerHigh));
                    obj.put("surfaceContainerLowest", toHex(surfaceContainerLowest));
                    obj.put("outline", toHex(outline));
                    obj.put("outlineVariant", toHex(outlineVariant));
                    return obj;
                }
            }
        } catch (Throwable t) {
            Log.e(TAG, "Framework Monet extraction failed", t);
        }
        return null;
    }

    private Integer getWallpaperSeedColor(Context context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                WallpaperManager wm = WallpaperManager.getInstance(context);
                WallpaperColors wc = wm.getWallpaperColors(WallpaperManager.FLAG_SYSTEM);
                if (wc != null) {
                    Color primary = wc.getPrimaryColor();
                    if (primary != null) {
                        return primary.toArgb();
                    }
                }
            }
        } catch (Throwable t) {
            Log.e(TAG, "WallpaperManager seed extraction failed", t);
        }
        return null;
    }

    @PluginMethod
    public void getDynamicColors(PluginCall call) {
        Context context = getContext();
        JSObject ret = new JSObject();

        // 1. Try Android 12+ framework Monet tokens
        JSObject lightMonet = extractFrameworkMonetRoles(context, false);
        JSObject darkMonet = extractFrameworkMonetRoles(context, true);

        if (lightMonet != null && darkMonet != null) {
            Log.i(TAG, "Using Android 12+ system framework Monet colors");
            ret.put("isAvailable", true);
            ret.put("source", "monet");
            ret.put("light", lightMonet);
            ret.put("dark", darkMonet);
            call.resolve(ret);
            return;
        }

        // 2. Fallback: extract seed from WallpaperManager (Android 8.1+)
        Integer wallpaperSeed = getWallpaperSeedColor(context);
        if (wallpaperSeed != null && wallpaperSeed != 0) {
            Log.i(TAG, "Using WallpaperManager seed color: " + toHex(wallpaperSeed));
            ret.put("isAvailable", true);
            ret.put("source", "wallpaper");
            ret.put("light", generateSchemeFromSeed(wallpaperSeed, false));
            ret.put("dark", generateSchemeFromSeed(wallpaperSeed, true));
            call.resolve(ret);
            return;
        }

        ret.put("isAvailable", false);
        call.resolve(ret);
    }
}
