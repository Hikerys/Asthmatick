import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.asthma.tick",
  appName: "Asthmatick",
  webDir: "dist",
  backgroundColor: "#F0F7F6",
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_lungs",
      iconColor: "#168B7A",
    },
  },
};

export default config;
