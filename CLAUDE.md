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
```

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
| `q` | Pivote à gauche 45° (tap) |
| `d` | Pivote à droite 45° (tap) |
| ` ` (espace) | Stop |

Forward (`z`) and backward (`s`) send a stop character (`' '`) on `onPressOut`. Turn buttons (`q`/`d`) send a single character — the robot stops automatically after 45°.

## Key Dependencies

- `react-native-bluetooth-classic ^1.73.0-rc.17` — classic Bluetooth SPP; the `build.gradle` in its pub cache must use `mavenCentral()` instead of the defunct `jcenter()`.
- `react-native 0.85.3`
