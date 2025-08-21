import React, { useRef, useState } from 'react';
import { View, Text, Button, Image, Alert, ScrollView, StyleSheet } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import RNFS from 'react-native-fs';

export default function Screenshot() {
  const viewShotRef = useRef<ViewShot>(null);
  const [uri, setUri] = useState<string | null>(null);
  const content = 'नमस्कार, मोबाईल डेअरी!\nग्राहक: रमेश पाटील\nदूध: २.० कि.ग्रा.';

  const captureAndSave = async () => {
    try {
      if (!viewShotRef.current) {
        Alert.alert("Error", "ViewShot not ready yet!");
        return;
      }

      // use captureRef instead of .capture()
      const capturedUri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
      });

      if (!capturedUri) {
        throw new Error("No URI returned from capture");
      }

      console.log("Captured at:", capturedUri);

      const currTime = Date.now();

      // Define save path
      const newFilePath = `${RNFS.DocumentDirectoryPath}/screenshot_${currTime}.png`;

      // Copy instead of move (safer, avoids "no file found")
      await RNFS.copyFile(capturedUri.replace('file://', ''), newFilePath);

      Alert.alert('Saved!', `Image saved at: ${newFilePath}`);
      setUri('file://' + newFilePath);
    } catch (error) {
      console.error('Error saving screenshot:', error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* Wrap content to capture */}
      <ViewShot ref={viewShotRef}>
        <View collapsable={false} style={styles.contentWrap}>
            <View style={styles.paper}>
                <Text style={styles.title}>मोबाईल डेअरी</Text>
                <Text style={styles.body}>{content}</Text>
            </View>
        </View>
      </ViewShot>

      <Button title="Capture & Save" onPress={captureAndSave} />

      {uri && (
        <View style={{ width: 200, height: 200 }}>
            <Image
                source={{ uri }}
                style={{ flex: 1 }}
                resizeMode="contain"
            />
        </View>
      )}
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
