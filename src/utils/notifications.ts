import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { TodoDto } from '../services/todo.service';

// Register global notification behavior so foreground banners, alerts, and sounds fire reliably
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const GLOBAL_REMINDER_ID = 'global-daily-task-reminder';
const STORE_KEY_GLOBAL_ENABLED = 'nexodus_global_reminder_enabled';
const STORE_KEY_GLOBAL_TIME = 'nexodus_global_reminder_time';

/**
 * Configure Android notification channel (required for Android 8.0+)
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Recordatorios',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00F0FF',
      enableVibrate: true,
      enableLights: true,
    });
  }
}

/**
 * Request notification permissions safely
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    await setupNotificationChannel();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Helper to safely extract hour and minute from strings like "09:00", "20:30", or ISO dates
 */
export function parseNotificationHourAndMinute(timeStr?: string): { hour: number; minute: number } | null {
  if (!timeStr) return null;
  const trimmed = timeStr.trim();

  // If ISO string containing 'T', parse as Date
  if (trimmed.includes('T')) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return { hour: d.getHours(), minute: d.getMinutes() };
    }
  }

  // Handle "HH:mm" (e.g. "09:00", "20:30")
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m) && h >= 0 && h < 24 && m >= 0 && m < 60) {
      return { hour: h, minute: m };
    }
  }

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return { hour: d.getHours(), minute: d.getMinutes() };
  }

  return null;
}

/**
 * Map day string or day number (1=Mon ... 7=Sun) to Expo Notifications weekday (1=Sun, 2=Mon ... 7=Sat)
 */
function parseCustomDayToExpoWeekday(val: string | number): number | null {
  const str = String(val).trim().toUpperCase();
  const letterMap: Record<string, number> = {
    'D': 1, 'L': 2, 'M': 3, 'X': 4, 'J': 5, 'V': 6, 'S': 7
  };
  if (letterMap[str]) return letterMap[str];

  const num = parseInt(str, 10);
  if (!isNaN(num)) {
    // In our app: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
    // In Expo Notifications: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
    if (num >= 1 && num <= 6) return num + 1;
    if (num === 7) return 1;
  }

  return null;
}

/**
 * Schedules notification for a specific Todo or Habit
 */
export async function scheduleTodoNotification(todo: TodoDto) {
  // Always cancel previous scheduled alerts for this todo to avoid duplicates
  await cancelTodoNotification(todo);

  if (!todo.notificationsEnabled || !todo.notificationTime) {
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const time = parseNotificationHourAndMinute(todo.notificationTime);
  if (!time) {
    console.warn('Invalid notificationTime format:', todo.notificationTime);
    return;
  }

  const { hour, minute } = time;
  const rawFreq = (todo.frequency || '').toLowerCase().trim();
  const isDaily = rawFreq === 'daily' || rawFreq === 'diario';
  const isWeekly = rawFreq === 'weekly' || rawFreq === 'semanal';

  if (todo.isHabit && isDaily) {
    // Daily recurring habit
    await Notifications.scheduleNotificationAsync({
      identifier: todo.id,
      content: {
        title: '🔥 Hora de tu hábito',
        body: todo.task,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: 'default',
        hour,
        minute,
      },
    });
  } else if ((todo.isHabit || isWeekly) && todo.customDays) {
    // Weekly repeating habit or task on specified days
    const days = todo.customDays.split(',');
    for (const d of days) {
      const weekday = parseCustomDayToExpoWeekday(d);
      if (weekday) {
        await Notifications.scheduleNotificationAsync({
          identifier: `${todo.id}-weekday-${weekday}`,
          content: {
            title: todo.isHabit ? '🔥 Hora de tu hábito' : '📌 Tarea programada',
            body: todo.task,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            channelId: 'default',
            weekday,
            hour,
            minute,
          },
        });
      }
    }
  } else if (isDaily) {
    // Non-habit task repeating daily
    await Notifications.scheduleNotificationAsync({
      identifier: todo.id,
      content: {
        title: '📌 Recordatorio diario',
        body: todo.task,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: 'default',
        hour,
        minute,
      },
    });
  } else {
    // One-time or single day task: compute target date
    const target = new Date();
    target.setHours(hour, minute, 0, 0);

    // If target time today has already elapsed, schedule for tomorrow
    if (target.getTime() <= Date.now()) {
      target.setDate(target.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      identifier: todo.id,
      content: {
        title: '📌 Recordatorio de tarea',
        body: todo.task,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        channelId: 'default',
        date: target,
      },
    });
  }
}

/**
 * Cancels all scheduled notifications associated with a todo
 */
export async function cancelTodoNotification(todo: TodoDto | { id: string }) {
  try {
    await Notifications.cancelScheduledNotificationAsync(todo.id);
    // Cancel all possible weekday variations
    for (let weekday = 1; weekday <= 7; weekday++) {
      await Notifications.cancelScheduledNotificationAsync(`${todo.id}-weekday-${weekday}`);
      await Notifications.cancelScheduledNotificationAsync(`${todo.id}-${weekday}`);
    }
  } catch (e) {
    console.warn('Error canceling todo notification:', e);
  }
}

/**
 * Retrieves the stored global daily reminder configuration
 */
export async function getGlobalReminderConfig(): Promise<{ enabled: boolean; time: string }> {
  try {
    const enabledStr = await SecureStore.getItemAsync(STORE_KEY_GLOBAL_ENABLED);
    const timeStr = await SecureStore.getItemAsync(STORE_KEY_GLOBAL_TIME);
    return {
      enabled: enabledStr === 'true',
      time: timeStr || '20:00',
    };
  } catch (e) {
    return { enabled: false, time: '20:00' };
  }
}

/**
 * Schedules the global daily reminder to check daily tasks
 */
export async function scheduleGlobalReminder(timeStr: string): Promise<boolean> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return false;

  const parsed = parseNotificationHourAndMinute(timeStr);
  if (!parsed) return false;

  // Cancel any existing reminder
  await cancelGlobalReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: GLOBAL_REMINDER_ID,
    content: {
      title: '📌 Revisa tus tareas de hoy',
      body: '¿Ya revisaste o marcaste tus tareas pendientes de hoy?',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      channelId: 'default',
      hour: parsed.hour,
      minute: parsed.minute,
    },
  });

  await SecureStore.setItemAsync(STORE_KEY_GLOBAL_ENABLED, 'true');
  await SecureStore.setItemAsync(STORE_KEY_GLOBAL_TIME, timeStr);
  return true;
}

/**
 * Cancels the global daily reminder
 */
export async function cancelGlobalReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(GLOBAL_REMINDER_ID);
  } catch (e) {
    // Ignore if not scheduled
  }
  await SecureStore.setItemAsync(STORE_KEY_GLOBAL_ENABLED, 'false');
}
