import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform, ScrollView, Dimensions } from 'react-native';
import { captureRef, captureScreen } from 'react-native-view-shot';
import { BleManager, Device } from 'react-native-ble-plx';
import { RouteProp, useRoute } from '@react-navigation/native';
import { encode as btoa, decode as atob } from 'base-64';
import { navigate, goBack } from '../services/api/navigation-service';

type Params = {
  id: string;
  name?: string | null;
  content: string;
};

export default function PrintPreview() {
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const { id, name, content } = (route.params || {}) as Params;

  const managerRef = useRef(new BleManager());
  const [device, setDevice] = useState<Device | null>(null);
  const [serviceUUID, setServiceUUID] = useState<string | null>(null);
  const [characteristicUUID, setCharacteristicUUID] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      try {
        const d = await managerRef.current.connectToDevice(id, { timeout: 8000 }).catch(async () => {
          return await managerRef.current.devices([id]).then(ds => ds[0]);
        });
        if (!d) throw new Error('Device not found');
        let connected = d;
        if (Platform.OS === 'android') {
          try { connected = await d.requestMTU(185); } catch {}
        }
        connected = await connected.discoverAllServicesAndCharacteristics();
        setDevice(connected);

        const candidateServices = await connected.services();
        const preferredServiceUUIDs = [
          '0000FFE0-0000-1000-8000-00805F9B34FB',
          '0000AE30-0000-1000-8000-00805F9B34FB',
          '18F0'
        ].map(u => u.toUpperCase());

        let foundService: string | null = null;
        let foundChar: string | null = null;
        for (const s of candidateServices) {
          const su = s.uuid.toUpperCase();
          const chars = await connected.characteristicsForService(su);
          for (const c of chars) {
            const writable = (c as any).isWritableWithoutResponse || (c as any).isWritableWithResponse;
            if (writable && preferredServiceUUIDs.includes(su)) {
              foundService = su; foundChar = c.uuid; break;
            }
          }
          if (foundService) break;
        }
        if (!foundService) {
          for (const s of candidateServices) {
            const su = s.uuid.toUpperCase();
            const chars = await connected.characteristicsForService(su);
            for (const c of chars) {
              const writable = (c as any).isWritableWithoutResponse || (c as any).isWritableWithResponse;
              if (writable) { foundService = su; foundChar = c.uuid; break; }
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
    return () => { managerRef.current.destroy(); };
  }, [id]);

  const writeBytesChunked = async (bytes: number[]) => {
    if (!device || !serviceUUID || !characteristicUUID) throw new Error('Printer not ready');
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

  // ESC/POS
  const ESC = 0x1b; const GS = 0x1d; const LF = 0x0a;
  const cmdInit = () => [ESC, 0x40];
  const cmdAlign = (mode: 'left'|'center'|'right') => [ESC, 0x61, mode === 'left' ? 0 : mode === 'center' ? 1 : 2];
  const viewRef = useRef<View>(null);

  const printNow = async () => {
    try {
      debugger;
      if (!device || !serviceUUID || !characteristicUUID) {
        Alert.alert('Printer', 'Printer not ready.');
        return;
      }
      // Wait for frame and capture entire screen for maximum reliability
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 300)));
      // const base64Png = await captureScreen({ result: 'base64', format: 'png', quality: 1 });
      // console.log(base64Png);
      // const base64Png = await captureScreen({ format: 'png', quality: 0.8 });
      // console.log("📸 Saved screenshot:", base64Png);
      const base64Png = await captureRef(viewRef, { format: "png", quality: 1 });
      console.log("✅ Saved View Image:", base64Png);
      const binary = atob(base64Png);
      const pngBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) pngBytes[i] = binary.charCodeAt(i);
      // Decode PNG -> RGBA using UPNG (dynamic import to keep bundle light)
      const UPNG = await import('upng-js');
      const png = UPNG.decode(pngBytes.buffer);
      const rgba = UPNG.toRGBA8(png)[0];
      const winWidth = Dimensions.get('window').width;
      const targetWidth = 384; // 58mm printers
      // If screen wider than 384, we will center content area; but we print full-screen snapshot.
      const width = (png.width as number);
      const height = (png.height as number);
      // Convert entire image to monochrome raster (larger, but robust). Optionally crop center 384 later.
      const bytesPerRow = Math.ceil(width / 8);
      const header = [GS, 0x76, 0x30, 0x00, bytesPerRow & 0xff, (bytesPerRow >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff];
      const raster: number[] = [];
      raster.push(...cmdInit());
      raster.push(...cmdAlign('left'));
      raster.push(...header);
      const data = new Uint8Array(rgba);
      for (let y = 0; y < height; y++) {
        for (let xb = 0; xb < bytesPerRow; xb++) {
          let byteVal = 0;
          for (let bit = 0; bit < 8; bit++) {
            const x = xb * 8 + bit;
            let on = 0;
            if (x < width) {
              const p = (y * width + x) * 4;
              const r = data[p]; const g = data[p+1]; const b = data[p+2];
              const lum = 0.299*r + 0.587*g + 0.114*b;
              on = lum < 200 ? 1 : 0;
            }
            byteVal |= (on ? 1 : 0) << (7 - bit);
          }
          raster.push(byteVal);
        }
      }
      raster.push(LF, LF);
      await writeBytesChunked(raster);
      setStatus('Printed');
    } catch (e: any) {
      setStatus(e?.message || 'Print failed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => goBack()} style={[styles.button, styles.secondary]}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
        <Pressable onPress={printNow} style={[styles.button, styles.primary]}>
          <Text style={styles.buttonText}>Print</Text>
        </Pressable>
      </View>

      <ScrollView collapsable={false} contentContainerStyle={styles.contentWrap}>
        <View ref={viewRef} collapsable={false} style={styles.paper}>
          <Text style={styles.title}>मोबाईल डेअरी</Text>
          <Text style={styles.body}>{content}</Text>
        </View>
      </ScrollView>
      {!!status && <Text style={styles.status}>{status}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderColor: '#ddd', backgroundColor: 'white'
  },
  button: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6 },
  primary: { backgroundColor: '#3d8e83' },
  secondary: { backgroundColor: '#393185' },
  buttonText: { color: 'white', fontWeight: '600' },
  contentWrap: { padding: 16, alignItems: 'center' },
  paper: { width: 384, backgroundColor: 'white', padding: 12, borderRadius: 4 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  body: { fontSize: 16, lineHeight: 24 },
  status: { textAlign: 'center', padding: 8, color: '#333' }
});


