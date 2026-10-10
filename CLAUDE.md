# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Native Android app to control the BatMobile Zumo robot over classic Bluetooth (SPP). Sends single ASCII characters to the robot's SoftwareSerial Bluetooth module.

## Build & Run

```bash
# Install dependencies
npm install

# Run on connected Android device (USB debug enabled)
npm run android

# Build release APK
cd android && ./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

# Install the APK on the USB-connected phone
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

If `adb devices` shows the phone as `unauthorized`, the user must accept the "Allow USB debugging?" prompt on the phone (see README).

## Android SDK versions

| Param | Value |
|-------|-------|
| `compileSdkVersion` | 36 |
| `targetSdkVersion` | 36 |
| `minSdkVersion` | 24 |
| `buildToolsVersion` | 36.0.0 |
| `ndkVersion` | 27.1.12297006 |

See `install_sdk_ndk_android.md` for full SDK installation instructions.

## Architecture

Single-file app — all logic lives in `App.tsx`:

- **`requestPermissions()`** — requests `BLUETOOTH_CONNECT` + `BLUETOOTH_SCAN` (Android 12+) or `ACCESS_FINE_LOCATION` (Android < 12).
- **`App`** — root component managing connection state. Switches between the device picker (`FlatList`) and the control pad.
- **`DirButton`** — reusable button using `Pressable` with `onPressIn`/`onPressOut` for hold-to-move behavior.

## Command Protocol

Characters sent over Bluetooth to the robot:

| Char | Action |
|------|--------|
| `z` | Avance (maintenir) |
| `s` | Recule (maintenir) |
| `q` | Pivote à gauche (maintenir) |
| `d` | Pivote à droite (maintenir) |
| ` ` (espace) | Stop |

Forward (`z`), backward (`s`) and turn (`q`/`d`) buttons send their character on `onPressIn` and a stop character (`' '`) on `onPressOut`: the robot moves as long as the button is held. The app does not repeat commands while held, so the robot firmware must not use a keep-alive timeout.

**Safety limitations** (documented in README, "Limites de sécurité connues"): because there is no keep-alive, a lost stop character leaves the robot moving. Currently: `send()` swallows write errors; no `onDeviceDisconnected` listener, so `connected` stays `true` after a link loss; `disconnect()` and app backgrounding do not send `' '` first; releasing one button while another is held sends a stop. Any change to the command flow should keep these in mind.

## Key Dependencies

- `react-native-bluetooth-classic ^1.73.0-rc.17` — classic Bluetooth SPP; the `build.gradle` in its pub cache must use `mavenCentral()` instead of the defunct `jcenter()`.
- `react-native 0.85.3`
