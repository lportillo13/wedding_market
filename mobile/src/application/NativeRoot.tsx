import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import App from './App';

export default function NativeRoot() {
  return <SafeAreaProvider initialMetrics={initialWindowMetrics}><App /></SafeAreaProvider>;
}
