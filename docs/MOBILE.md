# Mobile & Desktop Packaging

Auralis ships as a PWA out of the box and can be wrapped as a native iOS
(`.ipa`), Android (`.apk`) app via Capacitor, or as a desktop `.exe`/`.dmg`
via Electron.

---

## 1. PWA (no setup required)

The app already exposes `/manifest.webmanifest` and the violet theme color.
On iOS Safari / Android Chrome, users can tap **Add to Home Screen** to
install. Works offline-friendly for cached HTML & metadata.

To verify:
1. Deploy (Vercel/Cloudflare).
2. Open on a phone, tap the share menu → "Add to Home Screen".

---

## 2. iOS + Android with Capacitor

Capacitor wraps the built web app into a native shell. You'll need:

- **macOS + Xcode** for iOS (and a $99/yr Apple Developer account to publish)
- **Android Studio** for Android

### One-time setup

```bash
# 1. Install Capacitor
bun add @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# 2. Initialize (config already provided at capacitor.config.ts)
npx cap add ios
npx cap add android
```

### Build & open

```bash
# 1. Build the web app
bun run build

# 2. Sync to native projects
npx cap sync

# 3. Open the native IDE
npx cap open ios       # opens Xcode
npx cap open android   # opens Android Studio
```

Press **Run** in the IDE to launch on a simulator or device.

### Producing `.ipa` / `.apk`

- **Android**: in Android Studio → *Build* → *Build Bundle(s) / APK(s)* → *Build APK(s)*.
- **iOS**: in Xcode → *Product* → *Archive* → *Distribute App*.

> Note: native audio streaming uses the system WebView. Audius streams play
> natively. For background playback on iOS, enable the **Audio, AirPlay, and
> Picture in Picture** background mode in Xcode under your target's
> *Signing & Capabilities*.

---

## 3. Desktop with Electron

```bash
bun add -d electron @electron/packager
```

Create `electron/main.cjs`:

```js
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#0c0917",
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  win.loadFile(path.join(__dirname, "..", "dist", "public", "index.html"));
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());
```

Add to `package.json`:
```json
{ "main": "electron/main.cjs" }
```

Make sure `vite.config.ts` sets `base: "./"` so file:// asset paths resolve.

Package:
```bash
bun run build
npx @electron/packager . "Auralis" --platform=darwin --arch=x64 --out=release --overwrite
```

---

## 4. Updating after web changes

For PWA — just redeploy; users get the update on next launch.
For Capacitor wrappers — re-run `bun run build && npx cap sync`, then
re-archive/build in Xcode / Android Studio.
