import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

const URL_TO_FETCH = 'https://example.com/';

export default function App() {
  const [result, setResult] = useState('idle');

  const runFetch = async () => {
    setResult('loading');
    try {
      const response = await fetch(URL_TO_FETCH);
      setResult(`status ${response.status}`);
    } catch (error) {
      setResult(`error ${String(error)}`);
    }
  };

  return (
    <View style={styles.container}>
      <Button testID="fetch-button" title={`fetch ${URL_TO_FETCH}`} onPress={runFetch} />
      <Text testID="fetch-result">{result}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
});
