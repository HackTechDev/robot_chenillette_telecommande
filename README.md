# BatMobile — Application React Native

Application Android de télécommande Bluetooth pour le robot Zumo Shield BatMobile.

## Prérequis

- Node.js >= 22.11.0
- Android SDK (build-tools + platform-tools)
- Java 17+
- Un téléphone Android appairé avec le module Bluetooth **BatMobile**

## Installation

```bash
npm install
```

## Lancer sur un appareil Android

Brancher le téléphone en USB (débogage USB activé) :

```bash
npm run android
```

## Compiler un APK

```bash
cd android && ./gradlew assembleRelease
```

L'APK est généré dans `android/app/build/outputs/apk/release/app-release.apk`.

## Utilisation

1. Ouvrir l'app et appuyer sur **Connecter**
2. Sélectionner **BatMobile** dans la liste des appareils appairés
3. Utiliser le pad directionnel :

| Bouton | Action |
|--------|--------|
| ▲ | Maintenir = avance, relâcher = stop |
| ▼ | Maintenir = recule, relâcher = stop |
| ↺ | Pivoter à gauche de 45° |
| ↻ | Pivoter à droite de 45° |
| ■ | Stop immédiat |

> Les boutons sont grisés tant que le robot n'est pas connecté.

## Dépendances principales

| Package | Rôle |
|---------|------|
| `react-native-bluetooth-classic` | Communication Bluetooth série (SPP) |
| `react-native` 0.85.3 | Framework UI |
