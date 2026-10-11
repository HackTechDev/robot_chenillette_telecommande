import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
  FlatList,
  PanResponder,
  PermissionsAndroid,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RNBluetoothClassic, {
  BluetoothDevice,
} from 'react-native-bluetooth-classic';

// Vitesse : chiffre '0'..'9' envoyé au robot → (niveau + 1) × SPEED_PER_LEVEL (40..400).
// Doit correspondre à SPEED_PER_LEVEL / SPEED_LEVEL_DEFAULT dans le firmware.
const SPEED_LEVELS = 10;
const SPEED_PER_LEVEL = 40;
const SPEED_LEVEL_DEFAULT = 4;

async function requestPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (Platform.Version >= 31) {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    ]);
    return Object.values(granted).every(
      v => v === PermissionsAndroid.RESULTS.GRANTED,
    );
  }
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export default function App() {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [speedLevel, setSpeedLevel] = useState(SPEED_LEVEL_DEFAULT);
  const deviceRef = useRef<BluetoothDevice | null>(null);

  useEffect(() => {
    deviceRef.current = device;
  }, [device]);

  const send = useCallback(
    async (cmd: string) => {
      try {
        await deviceRef.current?.write(cmd);
      } catch (_) {}
    },
    [],
  );

  const openPicker = async () => {
    const ok = await requestPermissions();
    if (!ok) {
      Alert.alert('Permission refusée', 'Bluetooth requis pour continuer.');
      return;
    }
    try {
      const paired = await RNBluetoothClassic.getBondedDevices();
      setDevices(paired);
      setShowPicker(true);
    } catch (e) {
      Alert.alert('Erreur', String(e));
    }
  };

  const connect = async (d: BluetoothDevice) => {
    setShowPicker(false);
    try {
      const success = await d.connect();
      if (success) {
        // Synchronise la vitesse du robot (réinitialisée à chaque démarrage) avec le slider
        await d.write(String(speedLevel));
        setDevice(d);
        setConnected(true);
      }
    } catch (e) {
      Alert.alert('Connexion échouée', String(e));
    }
  };

  const disconnect = async () => {
    try {
      await device?.disconnect();
    } catch (_) {}
    setDevice(null);
    setConnected(false);
  };

  if (showPicker) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.title}>Choisir un appareil</Text>
        <FlatList
          data={devices}
          keyExtractor={item => item.address}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.deviceItem}
              onPress={() => connect(item)}>
              <Text style={styles.deviceName}>{item.name ?? 'Inconnu'}</Text>
              <Text style={styles.deviceAddr}>{item.address}</Text>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => setShowPicker(false)}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>BatMobile</Text>
        <TouchableOpacity
          style={[styles.btBtn, connected && styles.btBtnActive]}
          onPress={connected ? disconnect : openPicker}>
          <Text style={styles.btBtnText}>
            {connected ? `Connecté — ${device?.name}` : 'Connecter'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pad directionnel */}
      <View style={styles.pad}>
        <View style={styles.driveArea}>
          {/* Vitesse (slider vertical, à gauche des déplacements) */}
          <SpeedSlider
            level={speedLevel}
            onChange={level => {
              setSpeedLevel(level);
              send(String(level));
            }}
          />
          <View style={styles.dpad}>
            {/* Avancer */}
            <DirButton
              label="▲"
              enabled={connected}
              onPressIn={() => send('z')}
              onPressOut={() => send(' ')}
            />
            <View style={styles.row}>
              {/* Gauche (maintenir) */}
              <DirButton
                label="↺"
                enabled={connected}
                onPressIn={() => send('q')}
                onPressOut={() => send(' ')}
              />
              {/* Stop */}
              <DirButton
                label="■"
                enabled={connected}
                onPressIn={() => send(' ')}
              />
              {/* Droite (maintenir) */}
              <DirButton
                label="↻"
                enabled={connected}
                onPressIn={() => send('d')}
                onPressOut={() => send(' ')}
              />
            </View>
            {/* Reculer */}
            <DirButton
              label="▼"
              enabled={connected}
              onPressIn={() => send('s')}
              onPressOut={() => send(' ')}
            />
          </View>
          {/* Contrepoids du slider pour garder le pad centré (se réduit si l'écran est étroit) */}
          <View style={styles.driveSpacer} />
        </View>

        {/* Pince (maintenir) */}
        <View style={styles.row}>
          <DirButton
            label="🤏"
            enabled={connected}
            onPressIn={() => send('v')}
            onPressOut={() => send(' ')}
          />
          <DirButton
            label="✋"
            enabled={connected}
            onPressIn={() => send('c')}
            onPressOut={() => send(' ')}
          />
        </View>

        {/* Tête (maintenir) */}
        <View style={styles.row}>
          <DirButton
            label="Tete ▲"
            enabled={connected}
            onPressIn={() => send('w')}
            onPressOut={() => send(' ')}
          />
          <DirButton
            label="Tete ▼"
            enabled={connected}
            onPressIn={() => send('x')}
            onPressOut={() => send(' ')}
          />
        </View>
      </View>
    </View>
  );
}

type SpeedSliderProps = {
  level: number;
  onChange: (level: number) => void;
};

// Slider vertical sans dépendance : haut = rapide, bas = lent.
// Le geste est suivi depuis le point de contact initial + le déplacement (gestureState.dy).
function SpeedSlider({level, onChange}: SpeedSliderProps) {
  const heightRef = useRef(0);
  const startYRef = useRef(0);
  const levelRef = useRef(level);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: evt => {
        startYRef.current = evt.nativeEvent.locationY;
        update(startYRef.current);
      },
      onPanResponderMove: (_evt, gesture) =>
        update(startYRef.current + gesture.dy),
    }),
  ).current;

  function update(y: number) {
    const h = heightRef.current;
    if (h <= 0) return;
    const ratio = 1 - Math.min(Math.max(y / h, 0), 1);
    const next = Math.round(ratio * (SPEED_LEVELS - 1));
    if (next !== levelRef.current) {
      levelRef.current = next;
      onChangeRef.current(next);
    }
  }

  return (
    <View style={styles.speed}>
      <Text style={styles.speedValue}>{(level + 1) * SPEED_PER_LEVEL}</Text>
      <View
        style={styles.speedTrack}
        onLayout={e => {
          heightRef.current = e.nativeEvent.layout.height;
        }}
        {...pan.panHandlers}>
        <View
          style={[
            styles.speedFill,
            {height: `${((level + 1) / SPEED_LEVELS) * 100}%`},
          ]}
        />
      </View>
      <Text style={styles.speedLabel}>Vit.</Text>
    </View>
  );
}

type DirButtonProps = {
  label: string;
  enabled: boolean;
  onPressIn: () => void;
  onPressOut?: () => void;
};

function DirButton({label, enabled, onPressIn, onPressOut}: DirButtonProps) {
  return (
    <Pressable
      onPressIn={enabled ? onPressIn : undefined}
      onPressOut={enabled ? onPressOut : undefined}
      style={({pressed}) => [
        styles.btn,
        enabled ? styles.btnEnabled : styles.btnDisabled,
        pressed && enabled && styles.btnPressed,
      ]}>
      <Text style={[styles.btnLabel, !enabled && styles.btnLabelDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
    gap: 16,
  },
  title: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  btBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#555',
  },
  btBtnActive: {
    borderColor: '#4caf50',
  },
  btBtnText: {
    color: '#fff',
    fontSize: 15,
  },
  pad: {
    alignItems: 'center',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  driveArea: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dpad: {
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  driveSpacer: {
    width: 28,
    flexShrink: 1,
  },
  speed: {
    width: 28,
    flexShrink: 0,
    alignItems: 'center',
    gap: 4,
  },
  speedValue: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: 'bold',
  },
  speedTrack: {
    flex: 1,
    width: 28,
    borderRadius: 14,
    backgroundColor: '#2a2a2a',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  speedFill: {
    width: '100%',
    backgroundColor: '#FFD700',
    pointerEvents: 'none',
  },
  speedLabel: {
    color: '#888',
    fontSize: 11,
  },
  btn: {
    width: 90,
    height: 90,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnEnabled: {
    backgroundColor: '#FFD700',
  },
  btnDisabled: {
    backgroundColor: '#2a2a2a',
  },
  btnPressed: {
    backgroundColor: '#c9a800',
  },
  btnLabel: {
    fontSize: 36,
    color: '#111',
    fontWeight: 'bold',
  },
  btnLabelDisabled: {
    color: '#555',
  },
  deviceItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  deviceName: {
    color: '#fff',
    fontSize: 16,
  },
  deviceAddr: {
    color: '#888',
    fontSize: 12,
  },
  cancelBtn: {
    padding: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: '#FFD700',
    fontSize: 16,
  },
});
