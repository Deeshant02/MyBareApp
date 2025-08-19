import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Platform, PermissionsAndroid, AppState, Linking } from 'react-native';
import { navigate } from '../services/api/navigation-service';
import { BleManager } from 'react-native-ble-plx';
import * as RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import AndroidOpenSettings from 'react-native-android-open-settings';

type ScannedDevice = {
    id: string;
    name: string | null;
    rssi: number | null;
};

export default function PrinterComponent() {
    const managerRef = useRef(new BleManager());
    const [isScanning, setIsScanning] = useState(false);
    const [devices, setDevices] = useState<Record<string, ScannedDevice>>({});
    const [bleState, setBleState] = useState<string>('Unknown');
    const [message, setMessage] = useState<string | null>(null);
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [connectedId, setConnectedId] = useState<string | null>(null);

    useEffect(() => {
        const subscription = managerRef.current.onStateChange((state: any) => {
            setBleState(String(state));
        }, true);
        const appStateSub = AppState.addEventListener('change', (next) => {
            if (next === 'active') {
                managerRef.current.state().then((s: any) => setBleState(String(s))).catch(() => {});
            }
        });
        return () => {
            subscription.remove();
            appStateSub.remove();
            managerRef.current.destroy();
        };
    }, []);

    const requestPermissions = async (): Promise<boolean> => {
        try {
            if (Platform.OS === 'android') {
                // Android 12+ requires BLUETOOTH_SCAN/CONNECT; older need location
                const sdk = Number(Platform.Version);
                if (sdk >= 31) {
                    const scan = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN as any
                    );
                    const connect = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT as any
                    );
                    return (
                        scan === PermissionsAndroid.RESULTS.GRANTED &&
                        connect === PermissionsAndroid.RESULTS.GRANTED
                    );
                } else {
                    const fine = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                    );
                    if (fine !== PermissionsAndroid.RESULTS.GRANTED) return false;
                    try {
                        // Prompt user to enable Location Services, required for BLE scans on many Android versions
                        await RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({ interval: 10000, fastInterval: 5000 });
                    } catch {}
                    return true;
                }
            }
            // iOS shows CoreBluetooth prompts based on Info.plist keys
            return true;
        } catch {
            setMessage('Permission request failed');
            return false;
        }
    };

    const ensureBleReady = async (): Promise<boolean> => {
        const ok = await requestPermissions();
        if (!ok) return false;
        let state = await managerRef.current.state();
        setBleState(String(state));
        if (String(state) !== 'PoweredOn') {
            setMessage('Bluetooth is not powered on');
            return false;
        }
        return true;
    };

    const startScan = async () => {
        setMessage(null);
        const ready = await ensureBleReady();
        if (!ready) return;
        if (isScanning) return;
        setDevices({});
        setIsScanning(true);
        try {
            managerRef.current.startDeviceScan(null, { allowDuplicates: false }, (error: any, device: any) => {
                if (error) {
                    setMessage(error.message);
                    stopScan();
                    return;
                }
                if (device) {
                    setDevices((prev) => {
                        if (prev[device.id]) return prev;
                        const next = { ...prev };
                        next[device.id] = {
                            id: device.id,
                            name: device.name ?? (device as any).localName ?? 'Unknown',
                            rssi: device.rssi ?? null,
                        };
                        return next;
                    });
                }
            });
        } catch (e: any) {
            setMessage(e?.message || 'Scan failed');
            setIsScanning(false);
        }
    };

    const stopScan = () => {
        try {
            managerRef.current.stopDeviceScan();
        } catch {}
        setIsScanning(false);
    };

    const list = useMemo(() => Object.values(devices).sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999)), [devices]);

    const connectTo = async (d: ScannedDevice) => {
        try {
            const ready = await ensureBleReady();
            if (!ready) return;
            // Avoid multiple parallel attempts
            if (connectingId || connectedId === d.id) return;
            setConnectingId(d.id);
            // Scanning can interfere with connection on some stacks
            if (isScanning) stopScan();

            const device = await managerRef.current.connectToDevice(d.id, { timeout: 10000 });
            await device.discoverAllServicesAndCharacteristics();
            setConnectedId(d.id);
            setMessage(`Connected to ${d.name || d.id}`);
        } catch (e: any) {
            setMessage(e?.message || 'Connect failed');
        } finally {
            setConnectingId(null);
        }
    };

    const disconnect = async () => {
        if (!connectedId) return;
        try {
            await managerRef.current.cancelDeviceConnection(connectedId);
            setMessage('Disconnected');
        } catch (e: any) {
            setMessage(e?.message || 'Disconnect failed');
        } finally {
            setConnectedId(null);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.controls}>
                <Pressable onPress={isScanning ? stopScan : startScan} style={[styles.button, isScanning ? styles.buttonStop : styles.buttonStart]}>
                    <Text style={styles.buttonText}>{isScanning ? 'Stop Scanning' : 'Scan for Devices'}</Text>
                </Pressable>
                <Text style={styles.status}>BLE: {bleState}</Text>
                {Platform.OS === 'android' && bleState !== 'PoweredOn' ? (
                    <Pressable onPress={() => AndroidOpenSettings.bluetoothSettings()} style={[styles.button, styles.buttonStart]}>
                        <Text style={styles.buttonText}>Open BT Settings</Text>
                    </Pressable>
                ) : connectedId ? (
                    <Pressable onPress={disconnect} style={[styles.button, styles.buttonStop]}>
                        <Text style={styles.buttonText}>Disconnect</Text>
                    </Pressable>
                ) : null}
            </View>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <FlatList
                data={list}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                renderItem={({ item }) => (
                    <Pressable onPress={() => navigate('PrinterDetail', { id: item.id, name: item.name })} style={styles.row} disabled={!!connectingId}>
                        <View>
                            <Text style={styles.name}>{item.name || 'Unknown'}</Text>
                            <Text style={styles.sub}>{item.id}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.rssi}>{item.rssi ?? ''}</Text>
                            {connectingId === item.id ? (
                                <Text style={styles.connecting}>Connecting…</Text>
                            ) : connectedId === item.id ? (
                                <Text style={styles.connected}>Connected</Text>
                            ) : null}
                        </View>
                    </Pressable>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No devices yet. Tap Scan.</Text>}
                contentContainerStyle={list.length === 0 ? styles.emptyContainer : undefined}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#eee'
    },
    status: {
        fontSize: 12,
        color: '#555'
    },
    button: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 6
    },
    buttonStart: {
        backgroundColor: '#3d8e83'
    },
    buttonStop: {
        backgroundColor: '#bf2f2f'
    },
    buttonText: {
        color: 'white',
        fontWeight: '600'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14
    },
    name: {
        fontSize: 16,
        fontWeight: '500'
    },
    sub: {
        fontSize: 12,
        color: '#666'
    },
    rssi: {
        color: '#333'
    },
    connecting: {
        color: '#3d8e83',
        fontSize: 12
    },
    connected: {
        color: '#3d8e83',
        fontSize: 12,
        fontWeight: '600'
    },
    sep: {
        height: 1,
        backgroundColor: '#eee'
    },
    empty: {
        textAlign: 'center',
        padding: 24,
        color: '#666'
    },
    emptyContainer: {
        flexGrow: 1,
        justifyContent: 'center'
    },
    message: {
        color: '#3d3d3d',
        paddingHorizontal: 12,
        paddingTop: 8
    }
});

