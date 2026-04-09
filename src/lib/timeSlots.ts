export interface TimeSlot {
  time: string; // HH:MM format
  display: string; // Arabic display
}

export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  // 9:00 AM to 11:00 PM, 40-minute intervals
  let hour = 9;
  let minute = 0;

  while (hour < 23 || (hour === 23 && minute === 0)) {
    const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    const period = hour < 12 ? "صباحاً" : "مساءً";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const display = `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
    slots.push({ time: timeStr, display });

    minute += 40;
    if (minute >= 60) {
      hour += Math.floor(minute / 60);
      minute = minute % 60;
    }
  }

  return slots;
}

export const TIME_SLOTS = generateTimeSlots();
