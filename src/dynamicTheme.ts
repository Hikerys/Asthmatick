import { registerPlugin } from "@capacitor/core";

export interface DynamicColorRoles {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerLowest?: string;
  outline: string;
  outlineVariant: string;
}

export interface DynamicThemeResult {
  isAvailable: boolean;
  source?: "monet" | "wallpaper";
  light?: Partial<DynamicColorRoles>;
  dark?: Partial<DynamicColorRoles>;
}

const DynamicThemeNative = registerPlugin<{
  getDynamicColors(): Promise<DynamicThemeResult>;
}>("DynamicTheme");

// Standard Material You baseline palette (used when running on web / localhost without Android native Monet)
const WEB_MD3_FALLBACK: { light: DynamicColorRoles; dark: DynamicColorRoles } = {
  light: {
    primary: "#00658f",
    onPrimary: "#ffffff",
    primaryContainer: "#c7e7ff",
    onPrimaryContainer: "#001e2e",
    secondary: "#4f616e",
    onSecondary: "#ffffff",
    secondaryContainer: "#d2e5f5",
    onSecondaryContainer: "#0b1d29",
    surface: "#f7f9fc",
    onSurface: "#181c1f",
    surfaceVariant: "#dee3e9",
    onSurfaceVariant: "#41474d",
    surfaceContainer: "#ecf0f4",
    surfaceContainerHigh: "#e6ebf0",
    surfaceContainerLowest: "#ffffff",
    outline: "#71787e",
    outlineVariant: "#c1c7ce",
  },
  dark: {
    primary: "#84cfff",
    onPrimary: "#00344c",
    primaryContainer: "#004c6d",
    onPrimaryContainer: "#c7e7ff",
    secondary: "#b6c9d8",
    onSecondary: "#21323f",
    secondaryContainer: "#374955",
    onSecondaryContainer: "#d2e5f5",
    surface: "#101416",
    onSurface: "#e0e3e6",
    surfaceVariant: "#41474d",
    onSurfaceVariant: "#c1c7ce",
    surfaceContainer: "#1c2023",
    surfaceContainerHigh: "#272b2d",
    surfaceContainerLowest: "#0b0e11",
    outline: "#8b9297",
    outlineVariant: "#41474d",
  },
};

let cachedNativeResult: DynamicThemeResult | null = null;
let hasCheckedNative = false;

export async function getNativeDynamicTheme(): Promise<DynamicThemeResult | null> {
  if (hasCheckedNative && cachedNativeResult) return cachedNativeResult;
  try {
    const res = await DynamicThemeNative.getDynamicColors();
    hasCheckedNative = true;
    cachedNativeResult = res;
    return res;
  } catch (err) {
    hasCheckedNative = true;
    cachedNativeResult = null;
    return null;
  }
}

const DYNAMIC_CSS_PROPERTIES = [
  "--teal",
  "--teal2",
  "--tint",
  "--bg1",
  "--bg2",
  "--head",
  "--head2",
  "--card",
  "--card2",
  "--nav",
  "--navi",
  "--text",
  "--sub",
  "--border",
  "--day",
  "--greet",
  "--wm",
  "--blue",
  "--purple",
  "--green",
  "--md-sys-color-primary",
  "--md-sys-color-on-primary",
  "--md-sys-color-primary-container",
  "--md-sys-color-on-primary-container",
  "--md-sys-color-surface",
  "--md-sys-color-on-surface",
  "--md-sys-color-on-surface-variant",
  "--md-sys-color-outline",
];

export function removeDynamicThemeStyles(): void {
  const elements = [document.documentElement, document.body];
  elements.forEach((el) => {
    DYNAMIC_CSS_PROPERTIES.forEach((prop) => {
      el.style.removeProperty(prop);
    });
    el.removeAttribute("data-md3-dynamic");
    el.style.removeProperty("background-color");
  });
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", "#1a9b8c");
  }
}

export async function applyDynamicThemeStyles(isDark: boolean): Promise<boolean> {
  const native = await getNativeDynamicTheme();
  let roles: DynamicColorRoles;

  if (native && native.isAvailable) {
    const nativeScheme = isDark ? native.dark : native.light;
    if (nativeScheme && nativeScheme.primary && nativeScheme.surface) {
      roles = {
        primary: nativeScheme.primary,
        onPrimary: nativeScheme.onPrimary || (isDark ? "#00363F" : "#ffffff"),
        primaryContainer: nativeScheme.primaryContainer || (isDark ? "#1b3a3d" : "#c7e7ff"),
        onPrimaryContainer: nativeScheme.onPrimaryContainer || (isDark ? "#ffffff" : "#001e2e"),
        secondary: nativeScheme.secondary || nativeScheme.primary,
        onSecondary: nativeScheme.onSecondary || (isDark ? "#000000" : "#ffffff"),
        secondaryContainer: nativeScheme.secondaryContainer || nativeScheme.primaryContainer || "#d2e5f5",
        onSecondaryContainer: nativeScheme.onSecondaryContainer || "#000000",
        surface: nativeScheme.surface,
        onSurface: nativeScheme.onSurface || (isDark ? "#e0e3e6" : "#181c1f"),
        surfaceVariant: nativeScheme.surfaceVariant || nativeScheme.surface,
        onSurfaceVariant: nativeScheme.onSurfaceVariant || (isDark ? "#c1c7ce" : "#41474d"),
        surfaceContainer: nativeScheme.surfaceContainer || nativeScheme.surface,
        surfaceContainerHigh: nativeScheme.surfaceContainerHigh || nativeScheme.surface,
        surfaceContainerLowest: nativeScheme.surfaceContainerLowest || (isDark ? "#080e12" : nativeScheme.surface),
        outline: nativeScheme.outline || (isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)"),
        outlineVariant: nativeScheme.outlineVariant || (isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"),
      };
    } else {
      roles = isDark ? WEB_MD3_FALLBACK.dark : WEB_MD3_FALLBACK.light;
    }
  } else {
    roles = isDark ? WEB_MD3_FALLBACK.dark : WEB_MD3_FALLBACK.light;
  }

  const elements = [document.documentElement, document.body];
  elements.forEach((el) => {
    el.setAttribute("data-md3-dynamic", "true");

    // Primary & actions
    el.style.setProperty("--teal", roles.primary, "important");
    el.style.setProperty("--teal2", roles.primary, "important");
    el.style.setProperty("--tint", roles.primaryContainer, "important");

    // Background & surfaces (unified to eliminate any contrast mismatch or white edge bars)
    const bgMain = roles.surface;
    const bgContainer = roles.surfaceContainer || roles.surface;
    el.style.setProperty("--bg1", bgMain, "important");
    el.style.setProperty("--bg2", bgContainer, "important");
    el.style.setProperty("background-color", bgMain, "important");
    el.style.setProperty("--head", roles.surfaceContainer, "important");
    el.style.setProperty("--head2", roles.surfaceContainer, "important");
    el.style.setProperty("--card", roles.surfaceContainer, "important");
    el.style.setProperty("--card2", roles.surfaceContainer, "important");

    // Navigation bar
    el.style.setProperty("--nav", roles.surfaceContainer, "important");
    el.style.setProperty("--navi", roles.onSurfaceVariant, "important");

    // Text & typography
    el.style.setProperty("--text", roles.onSurface, "important");
    el.style.setProperty("--sub", roles.onSurfaceVariant, "important");

    // Borders
    el.style.setProperty("--border", roles.outlineVariant || roles.outline, "important");

    // Calendar & hero cards
    el.style.setProperty("--day", roles.surfaceContainerHigh, "important");
    el.style.setProperty("--greet", roles.secondaryContainer, "important");
    el.style.setProperty("--wm", roles.primary, "important");

    // Category icon badges
    el.style.setProperty("--blue", roles.secondaryContainer, "important");
    el.style.setProperty("--purple", roles.primaryContainer, "important");
    el.style.setProperty("--green", roles.secondaryContainer, "important");

    // MD3 Tokens
    el.style.setProperty("--md-sys-color-primary", roles.primary, "important");
    el.style.setProperty("--md-sys-color-on-primary", roles.onPrimary, "important");
    el.style.setProperty("--md-sys-color-primary-container", roles.primaryContainer, "important");
    el.style.setProperty("--md-sys-color-on-primary-container", roles.onPrimaryContainer, "important");
    el.style.setProperty("--md-sys-color-surface", roles.surface, "important");
    el.style.setProperty("--md-sys-color-on-surface", roles.onSurface, "important");
    el.style.setProperty("--md-sys-color-on-surface-variant", roles.onSurfaceVariant, "important");
    el.style.setProperty("--md-sys-color-outline", roles.outline, "important");
  });

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", roles.surfaceContainer);
  }

  return !!(native && native.isAvailable);
}
