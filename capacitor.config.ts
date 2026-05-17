import { CapacitorConfig } from "@capacitor/cli";

// Capacitor scaffold for Auralis.
// Install + initialize with: see docs/MOBILE.md
const config: CapacitorConfig = {
  appId: "app.auralis.music",
  appName: "Auralis",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
  },
  ios: {
    contentInset: "always",
  },
  android: {
    backgroundColor: "#0c0917",
  },
};

export default config;
