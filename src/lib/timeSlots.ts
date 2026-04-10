export interface TimeSlot {
  time: string; // HH:MM format
  display: string; // Arabic display
}

export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];

  const startHour = 9;
  const endHour = 23;
  const interval = 10; // 👈 أهم تغيير

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      if (hour === endHour && minute > 0) break;

      const timeStr = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;

      const period = hour < 12 ? "صباحاً" : "مساءً";
      const displayHour =
        hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

      const display = `${displayHour}:${minute
        .toString()
        .padStart(2, "0")} ${period}`;

      slots.push({
        time: timeStr,
        display,
      });
    }
  }

  return slots;
}

export const TIME_SLOTS = generateTimeSlots();
