import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Platform, findNodeHandle } from 'react-native';
import { navigate } from '../services/api/navigation-service';
import { BleManager, Device } from 'react-native-ble-plx';
import { RouteProp, useRoute } from '@react-navigation/native';
import { encode as btoa, decode as atob } from 'base-64';
import ViewShot, { captureRef, captureScreen } from 'react-native-view-shot';
import * as UPNG from 'upng-js';

type Params = {
    id: string;
    name?: string | null;
};

export default function PrinterDetail() {
    const route = useRoute<RouteProp<Record<string, Params>, string>>();
    const { id, name } = (route.params || {}) as Params;

    const managerRef = useRef(new BleManager());
    const [device, setDevice] = useState<Device | null>(null);
    const [serviceUUID, setServiceUUID] = useState<string | null>(null);
    const [characteristicUUID, setCharacteristicUUID] = useState<string | null>(null);
    const [text, setText] = useState<string>('Hello from MobileDairy\n');
    const [status, setStatus] = useState<string>('');
    const [marathiText, setMarathiText] = useState<string>('नमस्कार, मोबाईल डेअरी!\nग्राहक: रमेश पाटील\nदूध: २.० कि.ग्रा.');
    const viewShotRef = useRef<ViewShot | null>(null);
    const [shotReady, setShotReady] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                // If already connected in previous screen, this will resolve quickly
                const d = await managerRef.current.connectToDevice(id, { timeout: 8000 }).catch(async () => {
                    return await managerRef.current.devices([id]).then(ds => ds[0]);
                });
                if (!d) throw new Error('Device not found');
                // For Android, increase MTU to allow larger packets
                let connected = d;
                if (Platform.OS === 'android') {
                    try { connected = await d.requestMTU(185); } catch {}
                }
                connected = await connected.discoverAllServicesAndCharacteristics();
                setDevice(connected);

                // Try to find a writable characteristic (common BLE printer UUIDs first)
                const candidateServices = await connected.services();

                // Prefer known UUIDs often used by BLE printers
                const preferredServiceUUIDs = [
                    '0000FFE0-0000-1000-8000-00805F9B34FB', // HM-10 style
                    '0000AE30-0000-1000-8000-00805F9B34FB',
                    '18F0'
                ].map(u => u.toUpperCase());

                let foundService: string | null = null;
                let foundChar: string | null = null;

                // 1) Look in preferred service UUIDs
                for (const s of candidateServices) {
                    const su = s.uuid.toUpperCase();
                    const chars = await connected.characteristicsForService(su);
                    for (const c of chars) {
                        const writable = (c as any).isWritableWithoutResponse || (c as any).isWritableWithResponse;
                        if (writable && preferredServiceUUIDs.includes(su)) {
                            foundService = su;
                            foundChar = c.uuid;
                            break;
                        }
                    }
                    if (foundService) break;
                }

                // 2) Fallback: first writable anywhere
                if (!foundService) {
                    for (const s of candidateServices) {
                        const su = s.uuid.toUpperCase();
                        const chars = await connected.characteristicsForService(su);
                        for (const c of chars) {
                            const writable = (c as any).isWritableWithoutResponse || (c as any).isWritableWithResponse;
                            if (writable) {
                                foundService = su;
                                foundChar = c.uuid;
                                break;
                            }
                        }
                        if (foundService) break;
                    }
                }

                if (!foundService || !foundChar) {
                    setStatus('No writable characteristic found.');
                } else {
                    setServiceUUID(foundService);
                    setCharacteristicUUID(foundChar);
                    setStatus('Ready to print');
                }
            } catch (e: any) {
                setStatus(e?.message || 'Failed to prepare device');
            }
        };
        init();
        return () => {
            managerRef.current.destroy();
        };
    }, [id]);

    const stringToBytes = (s: string): number[] => {
        const out: number[] = [];
        for (let i = 0; i < s.length; i++) {
            out.push(s.charCodeAt(i) & 0xff);
        }
        return out;
    };

    const writeBytesChunked = async (bytes: number[]) => {
        if (!device || !serviceUUID || !characteristicUUID) throw new Error('Printer not ready');
        // Use a conservative chunk size for maximum compatibility
        const chunkSize = 20;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, i + chunkSize);
            const chunkStr = String.fromCharCode.apply(null, chunk as any);
            const payload = btoa(chunkStr);
            try {
                await device.writeCharacteristicWithoutResponseForService(serviceUUID, characteristicUUID, payload);
            } catch {
                await device.writeCharacteristicWithResponseForService(serviceUUID, characteristicUUID, payload);
            }
        }
    };

    // ESC/POS helpers
    const ESC = 0x1b; // escape
    const GS = 0x1d;  // group separator
    const LF = 0x0a;  // line feed

    const cmdInit = () => [ESC, 0x40];
    const cmdAlign = (mode: 'left' | 'center' | 'right') => [ESC, 0x61, mode === 'left' ? 0 : mode === 'center' ? 1 : 2];
    const cmdBold = (on: boolean) => [ESC, 0x45, on ? 1 : 0];
    const cmdDoubleHW = (on: boolean) => [GS, 0x21, on ? 0x11 : 0x00];
    const cmdCut = () => [GS, 0x56, 0x42, 0x00]; // feed and cut (if supported)

    const line = (text: string) => [...stringToBytes(text), LF];

    const divider = (width: number) => line(''.padEnd(width, '-'));

    const columns = (left: string, right: string, width: number) => {
        const gap = 1;
        const rightWidth = Math.min(right.length, Math.floor(width / 2));
        const leftWidth = width - rightWidth - gap;
        const l = (left.length > leftWidth ? left.slice(0, leftWidth) : left).padEnd(leftWidth, ' ');
        const r = (right.length > rightWidth ? right.slice(0, rightWidth) : right).padStart(rightWidth, ' ');
        return line(l + ' '.repeat(gap) + r);
    };

    const print = async () => {
        try {
            if (!device || !serviceUUID || !characteristicUUID) {
                Alert.alert('Printer', 'Printer not ready.');
                return;
            }
            const bytes = stringToBytes('\n\n\n\n' + (text.endsWith('\n') ? text : text + '\n') + '\n\n\n\n');
            await writeBytesChunked(bytes);
            setStatus('Printed');
        } catch (e: any) {
            setStatus(e?.message || 'Print failed');
        }
    };

    const printSampleReceipt = async () => {
        try {
            if (!device || !serviceUUID || !characteristicUUID) {
                Alert.alert('Printer', 'Printer not ready.');
                return;
            }
            const width = 32; // common for 58mm printers; use 42 for 80mm
            let buf: number[] = [];
            buf.push(0x1B, 0x64, 3);
            buf.push(...cmdCut());
            buf.push(...cmdInit());
            buf.push(...cmdAlign('center'));
            buf.push(...cmdBold(true));
            buf.push(...cmdDoubleHW(true));
            buf.push(...line('MobileDairy'));
            buf.push(...cmdDoubleHW(false));
            buf.push(...cmdBold(false));
            buf.push(...line('Sales Receipt'));
            buf.push(...divider(width));
            buf.push(...cmdAlign('left'));
            buf.push(...columns('Date: 2025-08-18 10:30', 'No: 12345', width));
            buf.push(...divider(width));
            buf.push(...columns('Item', 'Amount', width));
            buf.push(...columns('Milk 2.0kg x 32.50', '65.00', width));
            buf.push(...columns('Fat Adj 0.10', '1.00', width));
            buf.push(...divider(width));
            buf.push(...columns('Subtotal', '66.00', width));
            buf.push(...columns('Tax 5%', '3.30', width));
            buf.push(...columns('Total', '69.30', width));
            buf.push(...divider(width));
            buf.push(...cmdAlign('center'));
            buf.push(...line('Thank you!'));
            buf.push(LF, LF, LF);
            buf.push(...cmdCut());
            await writeBytesChunked(buf);
            setStatus('Printed sample receipt');
        } catch (e: any) {
            setStatus(e?.message || 'Print failed');
        }
    };

    // Convert base64 PNG to monochrome ESC/POS raster bytes and print
    const printMarathiAsImage = async () => {
        try {
            if (!device || !serviceUUID || !characteristicUUID) {
                Alert.alert('Printer', 'Printer not ready.');
                return;
            }
            if (!viewShotRef.current) {
                Alert.alert('Printer', 'Preview not ready.');
                return;
            }
            // Allow a few frames for layout/texture before capture (Android reliability)
            if (!shotReady) {
                await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 300)));
            }
            // Capture using a native node handle for reliability
            const node = findNodeHandle(viewShotRef.current as any);
            if (!node || node === -1) throw new Error('Snapshot node not ready');
            const base64Png = await captureRef(node as any, { result: 'base64', format: 'png', quality: 1 });
            if (!base64Png) throw new Error('Snapshot failed');
            // Decode base64 -> Uint8Array
            const binary = atob(base64Png);
            const pngBytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) pngBytes[i] = binary.charCodeAt(i);
            // Decode PNG
            const png = UPNG.decode(pngBytes.buffer);
            const rgba = UPNG.toRGBA8(png)[0];
            const width = png.width as number;
            const height = png.height as number;
            const bytesPerRow = Math.ceil(width / 8);
            const raster: number[] = [];
            // Build GS v 0 raster header
            const xL = bytesPerRow & 0xff;
            const xH = (bytesPerRow >> 8) & 0xff;
            const yL = height & 0xff;
            const yH = (height >> 8) & 0xff;
            const header = [GS, 0x76, 0x30, 0x00, xL, xH, yL, yH];
            raster.push(...cmdInit());
            raster.push(...cmdAlign('left'));
            raster.push(...header);
            // Threshold and pack bits MSB->LSB per byte
            const data = new Uint8Array(rgba);
            let idx = 0;
            for (let y = 0; y < height; y++) {
                for (let xb = 0; xb < bytesPerRow; xb++) {
                    let byteVal = 0;
                    for (let bit = 0; bit < 8; bit++) {
                        const x = xb * 8 + bit;
                        let on = 0;
                        if (x < width) {
                            const p = (y * width + x) * 4;
                            const r = data[p];
                            const g = data[p + 1];
                            const b = data[p + 2];
                            // simple luminance threshold
                            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                            on = lum < 200 ? 1 : 0; // black pixel if dark
                        }
                        byteVal |= (on ? 1 : 0) << (7 - bit);
                    }
                    raster.push(byteVal);
                    idx++;
                }
            }
            raster.push(LF, LF);
            await writeBytesChunked(raster);
            setStatus('Printed Marathi as image');
        } catch (e: any) {
            setStatus(e?.message || 'Print failed');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Selected printer</Text>
            <Text style={styles.subtitle}>{name || id}</Text>
            <TextInput
                style={styles.input}
                placeholder="Type text to print"
                value={text}
                onChangeText={setText}
                multiline
            />
            <Pressable onPress={print} style={[styles.button, styles.buttonPrimary]}>
                <Text style={styles.buttonText}>Print Text</Text>
            </Pressable>
            <Pressable onPress={printSampleReceipt} style={[styles.button, styles.buttonSecondary]}>
                <Text style={styles.buttonText}>Print Sample Receipt</Text>
            </Pressable>
            <Pressable onPress={() => navigate('PrintPreview', { id, name, content: marathiText })} style={[styles.button, styles.buttonSecondary]}>
                <Text style={styles.buttonText}>Open Print Preview</Text>
            </Pressable>
            {!!status && <Text style={styles.status}>{status}</Text>}
            {/* Hidden preview area to render Marathi text using RN text shaping */}
            <ViewShot
                ref={viewShotRef}
                options={{ format: 'png', quality: 1 }}
                onLayout={() => setShotReady(true)}
                style={{ opacity: 0.01, width: 384, alignSelf: 'center' }}
            >
                <View
                    collapsable={false}
                    renderToHardwareTextureAndroid={true}
                    needsOffscreenAlphaCompositing={true}
                    style={{ width: 384, padding: 12, backgroundColor: 'white' }}
                >
                    <Text style={{ fontSize: 18, fontWeight: '600', textAlign: 'center' }}>मोबाईल डेअरी</Text>
                    <Text style={{ marginTop: 8 }}>{marathiText}</Text>
                </View>
            </ViewShot>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16
    },
    title: {
        fontSize: 18,
        fontWeight: '600'
    },
    subtitle: {
        marginTop: 4,
        color: '#555',
        marginBottom: 12
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 12,
        minHeight: 120,
        textAlignVertical: 'top'
    },
    button: {
        marginTop: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center'
    },
    buttonPrimary: {
        backgroundColor: '#3d8e83'
    },
    buttonText: {
        color: 'white',
        fontWeight: '600'
    },
    buttonSecondary: {
        backgroundColor: '#393185'
    },
    status: {
        marginTop: 10,
        color: '#333'
    }
});


