/**
 * Notification Service
 * Handles scheduling, cancelling, and managing local push notifications
 * Works fully offline using expo-notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { Medicine, DoseTime } from '../types';
import {
  saveNotificationId,
  getNotificationIds,
  deleteNotificationIds,
} from '../db/database';
import { formatTime } from '../utils/helpers';

// ─── Configure Notification Handler ──────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Init & Permission Request ────────────────────────────────────────────────

export async function initNotifications(): Promise<boolean> {
  if (!Device.isDevice) {
    // Simulator: skip permission, notifications won't work anyway
    return false;
  }
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    Alert.alert(
      'Notification Permission',
      'Dawai ke reminders ke liye notification permission zaroori hai. Settings mein enable karein.',
      [{ text: 'OK' }]
    );
    return false;
  }
  
  // Android: create notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medicine-reminders', {
      name: 'Dawai Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
    
    await Notifications.setNotificationChannelAsync('medicine-snooze', {
      name: 'Snooze Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4ECDC4',
      sound: 'default',
      enableVibrate: true,
    });
  }
  
  return true;
}

// ─── Schedule Notifications for a Medicine ───────────────────────────────────

export async function scheduleMedicineNotifications(medicine: Medicine): Promise<void> {
  // First cancel any existing notifications for this medicine
  await cancelMedicineNotifications(medicine.id);
  
  for (const doseTime of medicine.times) {
    const notificationId = await scheduleRepeatingNotification(medicine, doseTime);
    if (notificationId) {
      await saveNotificationId(medicine.id, doseTime.id, notificationId);
    }
  }
}

// ─── Schedule a Single Repeating Notification ────────────────────────────────

async function scheduleRepeatingNotification(
  medicine: Medicine,
  doseTime: DoseTime
): Promise<string | null> {
  try {
    const timeLabel = doseTime.label || formatTime(doseTime.hour, doseTime.minute);
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💊 ${medicine.name} lene ka waqt!`,
        body: buildNotificationBody(medicine, doseTime),
        data: {
          medicineId: medicine.id,
          doseTimeId: doseTime.id,
          medicineName: medicine.name,
          type: 'medicine_reminder',
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        // Android specific
        ...(Platform.OS === 'android' && {
          channelId: 'medicine-reminders',
          color: medicine.color,
          sticky: false,
          vibrate: [0, 250, 250, 250],
        }),
        categoryIdentifier: 'medicine-reminder',
      },
      trigger: {
        hour: doseTime.hour,
        minute: doseTime.minute,
        repeats: true,
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
      },
    });
    
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return null;
  }
}

// ─── Build Notification Body ──────────────────────────────────────────────────

function buildNotificationBody(medicine: Medicine, doseTime: DoseTime): string {
  const timeStr = formatTime(doseTime.hour, doseTime.minute);
  const parts = [`${medicine.dosage}`, timeStr];
  
  const mealMap: Record<string, string> = {
    before_meal: 'Khane se pehle',
    after_meal: 'Khane ke baad',
    with_meal: 'Khane ke saath',
    empty_stomach: 'Khali pet',
    any: '',
  };
  
  const mealText = mealMap[medicine.mealRelation];
  if (mealText) parts.push(mealText);
  
  return parts.filter(Boolean).join(' • ');
}

// ─── Cancel Notifications for a Medicine ─────────────────────────────────────

export async function cancelMedicineNotifications(medicineId: string): Promise<void> {
  try {
    const stored = await getNotificationIds(medicineId);
    for (const { notificationId } of stored) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
    await deleteNotificationIds(medicineId);
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
  }
}

// ─── Schedule a Snooze Notification ──────────────────────────────────────────

export async function scheduleSnoozeNotification(
  medicine: Medicine,
  doseTime: DoseTime,
  snoozeMinutes: number = 10
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ ${medicine.name} — Snooze khatam!`,
        body: `${snoozeMinutes} minutes pehle yaad dilaya tha. Abhi lo!`,
        data: {
          medicineId: medicine.id,
          doseTimeId: doseTime.id,
          type: 'snooze_reminder',
        },
        sound: 'default',
        ...(Platform.OS === 'android' && {
          channelId: 'medicine-snooze',
          color: medicine.color,
        }),
      },
      trigger: {
        seconds: snoozeMinutes * 60,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });
    
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule snooze:', error);
    return null;
  }
}

// ─── Register Action Categories ──────────────────────────────────────────────

export async function registerNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('medicine-reminder', [
    {
      identifier: 'TAKEN',
      buttonTitle: '✅ Le Li',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'SNOOZE',
      buttonTitle: '⏰ 10 min baad',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'SKIP',
      buttonTitle: '⏭️ Skip',
      options: { opensAppToForeground: false, isDestructive: true },
    },
  ]);
}

// ─── Get All Scheduled Notifications (debug) ─────────────────────────────────

export async function getAllScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// ─── Cancel All Notifications ─────────────────────────────────────────────────

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
