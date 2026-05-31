import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
  FlatList,
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
        {/* Avancer */}
        <DirButton
          label="▲"
          enabled={connected}
          onPressIn={() => send('z')}
          onPressOut={() => send(' ')}
        />
        <View style={styles.row}>
          {/* Gauche 45° */}
          <DirButton
            label="↺"
            enabled={connected}
            onPressIn={() => send('q')}
          />
          {/* Stop */}
          <DirButton
            label="■"
            enabled={connected}
            onPressIn={() => send(' ')}
          />
          {/* Droite 45° */}
          <DirButton
            label="↻"
            enabled={connected}
            onPressIn={() => send('d')}
          />
        </View>
        {/* Reculer */}
        <DirButton
          label="▼"
          enabled={connected}
          onPressIn={() => send('s')}
          onPressOut={() => send(' ')}
        />

        {/* Pince */}
        <View style={styles.row}>
          <DirButton
            label="🤏"
            enabled={connected}
            onPressIn={() => send('v')}
          />
          <DirButton
            label="✋"
            enabled={connected}
            onPressIn={() => send('c')}
          />
        </View>
      </View>
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
    padding: 20,
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
