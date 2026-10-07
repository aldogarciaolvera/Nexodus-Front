import * as Notifications from 'expo-notifications';
import { TodoDto } from '../services/todo.service';

export async function scheduleTodoNotification(todo: TodoDto) {
  // Siempre cancelamos primero para evitar duplicados en actualizaciones
  await Notifications.cancelScheduledNotificationAsync(todo.id);

  if (!todo.notificationsEnabled || !todo.notificationTime) {
    return;
  }

  // Verificar si tenemos permisos
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  const date = new Date(todo.notificationTime);
  const hour = date.getHours();
  const minute = date.getMinutes();

  if (todo.isHabit && todo.frequency === 'Diario') {
    // Para hábitos diarios
    await Notifications.scheduleNotificationAsync({
      identifier: todo.id,
      content: {
        title: '🔥 Hora de tu hábito',
        body: todo.task,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } else if (todo.isHabit && todo.frequency === 'Semanal' && todo.customDays) {
    // Mapear "L,M,X,J,V,S,D" a números de día para notificaciones (1=Domingo, 2=Lunes en expo-notifications)
    const dayMap: Record<string, number> = {
      'D': 1, 'L': 2, 'M': 3, 'X': 4, 'J': 5, 'V': 6, 'S': 7
    };
    const days = todo.customDays.split(',');
    
    // Programar una notificación para cada día seleccionado
    for (const d of days) {
      const weekday = dayMap[d.trim().toUpperCase()];
      if (weekday) {
        await Notifications.scheduleNotificationAsync({
          identifier: `${todo.id}-${weekday}`,
          content: {
            title: '🔥 Hora de tu hábito',
            body: todo.task,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour,
            minute,
          },
        });
      }
    }
  } else {
    // Si la fecha ya pasó para tareas de un solo día (o no recurrentes), no programar
    if (date.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        identifier: todo.id,
        content: {
          title: '📌 Tarea pendiente',
          body: todo.task,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        },
      });
    }
  }
}

export async function cancelTodoNotification(todo: TodoDto) {
  await Notifications.cancelScheduledNotificationAsync(todo.id);
  // Si era semanal, cancelar todas las variantes
  if (todo.isHabit && todo.frequency === 'Semanal' && todo.customDays) {
    const dayMap: Record<string, number> = {
      'D': 1, 'L': 2, 'M': 3, 'X': 4, 'J': 5, 'V': 6, 'S': 7
    };
    for (const d of todo.customDays.split(',')) {
      const weekday = dayMap[d.trim().toUpperCase()];
      if (weekday) {
        await Notifications.cancelScheduledNotificationAsync(`${todo.id}-${weekday}`);
      }
    }
  }
}
