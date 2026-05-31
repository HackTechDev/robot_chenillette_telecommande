# Installation de l'Android SDK sur Ubuntu

Ce guide explique comment installer les composants Android SDK nécessaires pour compiler l'application BatMobile React Native.

## Versions requises par le projet

| Composant | Version |
|-----------|---------|
| Build Tools | 36.0.0 |
| Compile SDK / Target SDK | 36 (Android 16) |
| Min SDK | 24 (Android 7.0) |
| Java | 17+ |

---

## 1. Installer Java

```bash
sudo apt update
sudo apt install openjdk-17-jdk
```

Vérifier :

```bash
java -version
```

---

## 2. Installer les Command Line Tools (sdkmanager)

Télécharger les outils en ligne de commande depuis le site officiel :

```bash
# Créer le dossier SDK
mkdir -p ~/android-sdk/cmdline-tools

# Télécharger (vérifier la dernière version sur https://developer.android.com/studio#command-tools)
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdline-tools.zip

# Extraire dans le bon dossier
unzip /tmp/cmdline-tools.zip -d /tmp/cmdline-tools-tmp
mv /tmp/cmdline-tools-tmp/cmdline-tools ~/android-sdk/cmdline-tools/latest
rm -rf /tmp/cmdline-tools-tmp /tmp/cmdline-tools.zip
```

---

## 3. Configurer les variables d'environnement

Ajouter dans `~/.bashrc` ou `~/.zshrc` :

```bash
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Recharger :

```bash
source ~/.bashrc   # ou source ~/.zshrc
```

---

## 4. Accepter les licences

```bash
sdkmanager --licenses
```

Appuyer sur `y` puis `Entrée` pour chaque licence.

---

## 5. Installer les composants SDK

```bash
sdkmanager "platform-tools" \
           "build-tools;36.0.0" \
           "platforms;android-36"
```

Vérifier l'installation :

```bash
sdkmanager --list | grep "Installed"
```

---

## 6. Configurer le projet React Native

Créer ou mettre à jour `android/local.properties` dans le projet :

```bash
echo "sdk.dir=$HOME/android-sdk" > /home/util01/Arduino/batmobile_rn/android/local.properties
```

---

## 7. Vérifier avec React Native

```bash
cd /home/util01/Arduino/batmobile_rn
npx react-native doctor
```

Tous les points Android doivent être verts.
