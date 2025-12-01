
export const generateDailyTimeSlots = (intervalMinutes: number = 30): string[] => {
  const slots: string[] = [];
  const startHour = 8; // 8 AM
  const endHour = 18; // 6 PM

  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      slots.push(`${hour}:${minute}`);
    }
  }
  return slots;
};
