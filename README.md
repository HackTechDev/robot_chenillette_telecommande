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

## Installer l'APK sur le smartphone

Brancher le téléphone en USB (débogage USB activé), puis vérifier qu'il est détecté :

```bash
adb devices -l
```

Transférer et installer l'APK (`-r` remplace la version déjà installée) :

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

> `adb` se trouve dans `$ANDROID_HOME/platform-tools` (par ex. `~/android-sdk/platform-tools/adb`).

### Problème : téléphone `unauthorized`

Si `adb devices` affiche le téléphone avec l'état `unauthorized` :

```
List of devices attached
ZY32KDR97N             unauthorized usb:1-8 transport_id:1
```

le téléphone n'a pas encore autorisé cet ordinateur pour le débogage USB, et l'installation échoue.

**Solution :**

1. Déverrouiller le téléphone : une fenêtre **« Autoriser le débogage USB ? »** s'affiche.
2. Cocher **« Toujours autoriser depuis cet ordinateur »** puis appuyer sur **Autoriser**.
3. Relancer `adb devices -l` : l'état doit maintenant être `device`.

Si la fenêtre n'apparaît pas : débrancher puis rebrancher le câble USB. En dernier recours, aller dans **Options pour les développeurs → Révoquer les autorisations de débogage USB**, puis rebrancher le téléphone.

## Utilisation

1. Ouvrir l'app et appuyer sur **Connecter**
2. Sélectionner **BatMobile** dans la liste des appareils appairés
3. Utiliser le pad directionnel :

| Bouton | Action |
|--------|--------|
| ▲ | Maintenir = avance, relâcher = stop |
| ▼ | Maintenir = recule, relâcher = stop |
| ↺ | Maintenir = pivote à gauche, relâcher = stop |
| ↻ | Maintenir = pivote à droite, relâcher = stop |
| ■ | Stop immédiat |
| 🤏 | Maintenir = ferme la pince progressivement, relâcher = s'arrête |
| ✋ | Maintenir = ouvre la pince progressivement, relâcher = s'arrête |
| Tete ▲ | Maintenir = lève la tête progressivement, relâcher = s'arrête |
| Tete ▼ | Maintenir = baisse la tête progressivement, relâcher = s'arrête |

> Les boutons sont grisés tant que le robot n'est pas connecté.

## Limites de sécurité connues

Les mouvements reposent sur deux caractères seulement : la commande est envoyée **une seule fois** à l'appui, et le stop (espace) **une seule fois** au relâchement. Le firmware n'a pas de délai de sécurité (keep-alive) : si le stop n'arrive pas, le robot continue de bouger.

| Problème | Conséquence |
|----------|-------------|
| **Perte de la liaison Bluetooth pendant un mouvement** (robot hors de portée, module coupé) | Le stop n'arrive jamais : le robot continue d'avancer ou de pivoter. Les erreurs d'envoi sont ignorées silencieusement par l'app (`catch (_) {}` dans `send()`). |
| **Perte de connexion non détectée** | L'app n'écoute pas les déconnexions : elle reste affichée « Connecté » et les boutons restent actifs alors que plus rien n'est transmis. |
| **Déconnexion ou passage en arrière-plan sans stop** | Le bouton **Connecté** coupe la liaison sans envoyer d'espace. Si on quitte l'app (bouton accueil, appel entrant…) pendant qu'un bouton est maintenu, le relâchement n'est jamais reçu. Dans les deux cas, le robot garde son dernier mouvement. |
| **Appui sur plusieurs boutons** | Maintenir ▲ puis appuyer et relâcher ↺ envoie un stop : le robot s'arrête alors que ▲ est toujours maintenu. |

**En pratique :** garder le robot à portée, toujours relâcher les boutons avant de se déconnecter ou de quitter l'app, et pouvoir couper l'alimentation du robot à la main.

**Pistes de correction :**

- *Côté app* : envoyer un stop avant `disconnect()` et lors du passage en arrière-plan (`AppState`), écouter les déconnexions (`onDeviceDisconnected`) pour mettre à jour l'interface, et signaler les erreurs d'envoi.
- *Côté firmware + app* : ajouter un délai de sécurité dans le firmware (arrêt si aucune commande depuis ~300 ms) et faire renvoyer la commande périodiquement par l'app tant que le bouton est maintenu.

## Dépendances principales

| Package | Rôle |
|---------|------|
| `react-native-bluetooth-classic` | Communication Bluetooth série (SPP) |
| `react-native` 0.85.3 | Framework UI |
