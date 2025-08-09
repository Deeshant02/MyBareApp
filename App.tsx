/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import MyClassComponent from './app/login';
import Router from './app/router';
// import { SafeAreaView } from 'react-native/types_generated/index';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <Router />
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'plum'
  },
});

export default App;