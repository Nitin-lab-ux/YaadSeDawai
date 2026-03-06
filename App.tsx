import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/db/database';
import { initNotifications, registerNotificationCategories } from './src/services/notificationService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getAllMedicines } from './src/db/database';
import { recordDoseAction } from './src/services/reminderService';

export default function App() {
  const notifListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    (async () => {
      await initDatabase();
      await initNotifications();
      await registerNotificationCategories();
    })();

    // Handle notification action button taps (Taken / Snooze / Skip)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(async response => {
      const { actionIdentifier, notification } = response;
      const data = notification.request.content.data as any;
      if (!data?.medicineId) return;

      const medicines = await getAllMedicines();
      const medicine = medicines.find(m => m.id === data.medicineId);
      if (!medicine) return;

      const doseTime = medicine.times.find(t => t.id === data.doseTimeId);
      if (!doseTime) return;

      const scheduledDate = new Date();
      scheduledDate.setHours(doseTime.hour, doseTime.minute, 0, 0);

      if (actionIdentifier === 'TAKEN') {
        await recordDoseAction(medicine, scheduledDate, 'taken');
      } else if (actionIdentifier === 'SKIP') {
        await recordDoseAction(medicine, scheduledDate, 'skipped');
      } else if (actionIdentifier === 'SNOOZE') {
        await recordDoseAction(medicine, scheduledDate, 'snoozed');
      }
    });

    return () => {
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#1A1A2E" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
