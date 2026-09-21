import { TaskHabitItem } from '../features/tasks/components/TaskHabitCard';

export const isItemActiveForDate = (item: TaskHabitItem, date: Date, isTomorrow: boolean) => {
  if (isTomorrow && item.isCompleted) return false;

  if (!item.frequency || item.frequency === 'Ninguna' || item.frequency === 'Un solo día' || item.frequency === '') {
    if (isTomorrow) return false; 
    
    if (!item.isCompleted) return true;
    
    if (item.isCompleted) {
      if (item.lastCompletedAt) {
        const completedDate = new Date(item.lastCompletedAt);
        return completedDate.toDateString() === date.toDateString();
      }
      if (item.updatedAt) {
         const updatedDate = new Date(item.updatedAt);
         return updatedDate.toDateString() === date.toDateString();
      }
      return false;
    }
  }

  if (item.frequency === 'Daily') {
    return true;
  }

  if (item.frequency === 'Weekly') {
    const jsDay = date.getDay();
    const targetDayNum = jsDay === 0 ? 7 : jsDay; // 1 = Monday, ..., 7 = Sunday
    const scheduledDays = item.customDays ? item.customDays.split(',').map(d => parseInt(d.trim(), 10)) : [];
    return scheduledDays.includes(targetDayNum);
  }

  if (item.frequency === 'Monthly') {
    const targetDateNum = date.getDate();
    const scheduledDates = item.customDays ? item.customDays.split(',').map(d => parseInt(d.trim(), 10)) : [];
    return scheduledDates.includes(targetDateNum);
  }

  return true;
};
