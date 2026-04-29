import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DashboardNavigator from './src/navigation/DashboardNavigator';
import colors from './src/constants/colors';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <DashboardNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
