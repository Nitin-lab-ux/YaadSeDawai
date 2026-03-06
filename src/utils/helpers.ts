import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import { DoseTime } from '../types';

/**
 * Generate a unique ID (UUID-like)
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Format a Date object to HH:MM string
 */
export function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${ampm}`;
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Format a date string for display
 */
export function formatDisplayDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Aaj';
  if (isTomorrow(date)) return 'Kal';
  if (isYesterday(date)) return 'Kal (Beeta)';
  return format(date, 'dd MMM yyyy');
}

/**
 * Build a Date object for a dose time on a given date
 */
export function buildDoseDate(dateStr: string, doseTime: DoseTime): Date {
  const base = parseISO(dateStr);
  base.setHours(doseTime.hour, doseTime.minute, 0, 0);
  return base;
}

/**
 * Get the scheduled Date for a dose today
 */
export function getTodayDoseTime(doseTime: DoseTime): Date {
  const now = new Date();
  now.setHours(doseTime.hour, doseTime.minute, 0, 0);
  return now;
}

/**
 * Check if a dose time has passed for today
 */
export function isDosePast(doseTime: DoseTime): boolean {
  const now = new Date();
  const doseDate = getTodayDoseTime(doseTime);
  return doseDate < now;
}

/**
 * Get human-readable time difference
 */
export function getTimeUntil(doseTime: DoseTime): string {
  const now = new Date();
  const doseDate = getTodayDoseTime(doseTime);
  const diff = doseDate.getTime() - now.getTime();
  
  if (diff < 0) {
    const ago = Math.abs(diff);
    const mins = Math.floor(ago / 60000);
    if (mins < 60) return `${mins} min pehle`;
    const hrs = Math.floor(mins / 60);
    return `${hrs} ghante pehle`;
  }
  
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min mein`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (remMins === 0) return `${hrs} ghante mein`;
  return `${hrs}h ${remMins}m mein`;
}

/**
 * Get greeting based on current hour
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Subah Ki Shubhkaamnaayein 🌅';
  if (hour < 17) return 'Dopahar Mubarak 🌤️';
  if (hour < 20) return 'Shaam Mubarak 🌇';
  return 'Raat Ko Yaad Rakhein 🌙';
}

/**
 * MEDICINE COLORS palette
 */
// Named export so EditMedicineScreen can import it
export const MEDICINE_COLORS = [
  '#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98FB98', '#F08080',
  '#87CEEB', '#FFB347', '#B0E0E6', '#FFA07A',
];

export function getRandomMedicineColor(): string {
  return MEDICINE_COLORS[Math.floor(Math.random() * MEDICINE_COLORS.length)];
}

/**
 * Meal relation in Hindi
 */
export function getMealRelationText(relation: string): string {
  const map: Record<string, string> = {
    before_meal: 'Khane Se Pehle',
    after_meal: 'Khane Ke Baad',
    with_meal: 'Khane Ke Saath',
    empty_stomach: 'Khali Pet',
    any: 'Kisi Bhi Waqt',
  };
  return map[relation] || 'Kisi Bhi Waqt';
}

/**
 * Frequency in Hindi
 */
export function getFrequencyText(frequency: string): string {
  const map: Record<string, string> = {
    daily: 'Rozana',
    alternate_days: 'Ek Din Chod Ke',
    weekly: 'Har Hafte',
    custom: 'Custom',
  };
  return map[frequency] || frequency;
}
