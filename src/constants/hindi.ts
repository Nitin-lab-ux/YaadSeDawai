import { MealRelation, FrequencyType, DoseTime } from '../types';
import { generateId } from '../utils/helpers';

// ─── Time Keywords → 24-hour time mapping ────────────────────────────────────

export const TIME_KEYWORDS: Record<string, { hour: number; minute: number; label: string }> = {
  // Morning variations
  subah: { hour: 8, minute: 0, label: 'Subah' },
  savere: { hour: 7, minute: 0, label: 'Savere' },
  morning: { hour: 8, minute: 0, label: 'Subah' },
  'subah ke waqt': { hour: 8, minute: 0, label: 'Subah' },
  
  // Afternoon variations
  dopahar: { hour: 13, minute: 0, label: 'Dopahar' },
  dopehr: { hour: 13, minute: 0, label: 'Dopahar' },
  afternoon: { hour: 13, minute: 0, label: 'Dopahar' },
  lunch: { hour: 13, minute: 0, label: 'Lunch' },
  'lunch time': { hour: 13, minute: 0, label: 'Lunch' },
  
  // Evening variations
  shaam: { hour: 18, minute: 0, label: 'Shaam' },
  sham: { hour: 18, minute: 0, label: 'Shaam' },
  evening: { hour: 18, minute: 0, label: 'Shaam' },
  'shaam ko': { hour: 18, minute: 0, label: 'Shaam' },
  
  // Night variations
  raat: { hour: 21, minute: 0, label: 'Raat' },
  rat: { hour: 21, minute: 0, label: 'Raat' },
  night: { hour: 21, minute: 0, label: 'Raat' },
  'raat ko': { hour: 21, minute: 0, label: 'Raat' },
  
  // Bedtime
  'sone se pehle': { hour: 22, minute: 0, label: 'Sone Se Pehle' },
  'sone ke pehle': { hour: 22, minute: 0, label: 'Sone Se Pehle' },
  bedtime: { hour: 22, minute: 0, label: 'Bedtime' },
  'so ne se pehle': { hour: 22, minute: 0, label: 'Sone Se Pehle' },
  
  // Noon
  dopahar12: { hour: 12, minute: 0, label: 'Dopahar' },
  noon: { hour: 12, minute: 0, label: 'Dopahar' },
};

// ─── Meal Relation Keywords ───────────────────────────────────────────────────

export const MEAL_RELATION_MAP: Array<{ patterns: string[]; relation: MealRelation }> = [
  {
    patterns: [
      'khane ke baad', 'khane k baad', 'khaane ke baad',
      'after food', 'after meal', 'after eating',
      'khana khane ke baad', 'after lunch', 'after dinner',
      'khane ke 30 min baad', 'khane ke kuch der baad',
    ],
    relation: 'after_meal',
  },
  {
    patterns: [
      'khane se pehle', 'khane k pehle', 'khaane se pehle',
      'before food', 'before meal', 'before eating',
      'khana khane se pehle', 'before lunch', 'before dinner',
      'khane ke pehle',
    ],
    relation: 'before_meal',
  },
  {
    patterns: [
      'khali pet', 'empty stomach', 'khaali pet',
      'bina khaye', 'without food', 'on empty stomach',
    ],
    relation: 'empty_stomach',
  },
  {
    patterns: [
      'khane ke saath', 'with food', 'with meal',
      'khaane ke saath', 'khana khate waqt',
      'while eating', 'with lunch', 'with dinner',
    ],
    relation: 'with_meal',
  },
];

// ─── Frequency Keywords ───────────────────────────────────────────────────────

export const FREQUENCY_MAP: Array<{ patterns: string[]; frequency: FrequencyType }> = [
  {
    patterns: [
      'daily', 'roz', 'rozana', 'har roz', 'every day',
      'har din', 'din mein', 'per day', 'din mein ek baar',
    ],
    frequency: 'daily',
  },
  {
    patterns: [
      'alternate days', 'ek din chod ke', 'every other day',
      'har doosre din', 'alternate', 'ek din baad',
    ],
    frequency: 'alternate_days',
  },
  {
    patterns: [
      'weekly', 'har hafte', 'week mein ek baar',
      'every week', 'hafte mein', 'once a week',
    ],
    frequency: 'weekly',
  },
];

// ─── Start Date Keywords ──────────────────────────────────────────────────────

export const START_DATE_MAP: Array<{ patterns: string[]; offsetDays: number }> = [
  { patterns: ['aaj se', 'aaj', 'today', 'abhi se', 'from today', 'starting today'], offsetDays: 0 },
  { patterns: ['kal se', 'kal', 'tomorrow', 'from tomorrow', 'starting tomorrow'], offsetDays: 1 },
  { patterns: ['parson se', 'parson', 'day after tomorrow'], offsetDays: 2 },
];

// ─── Common Medicine Patterns (for better parsing confidence) ────────────────

export const MEDICINE_DOSE_UNITS = [
  'mg', 'ml', 'mcg', 'g', 'tablet', 'tablets', 'tab', 'capsule',
  'cap', 'drops', 'drop', 'syrup', 'injection', 'patch', 'goli',
  'goliyan', 'dawai', 'dawa',
];

// ─── Common shortcuts ─────────────────────────────────────────────────────────

export const COMMON_MEDICINES_HINT: Record<string, string> = {
  'bp wali': 'BP Medicine',
  'sugar wali': 'Diabetes Medicine',
  'thyroid wali': 'Thyroid Medicine',
  'heart wali': 'Heart Medicine',
  'vitamin': 'Vitamin',
  'calcium': 'Calcium',
  'iron': 'Iron',
  'painkiller': 'Painkiller',
  'antibiotic': 'Antibiotic',
};

// ─── Helper: Build DoseTime object ────────────────────────────────────────────

export function buildDoseTime(hour: number, minute: number, label?: string): DoseTime {
  return {
    id: generateId(),
    hour,
    minute,
    label: label || formatTimeLabel(hour, minute),
  };
}

function formatTimeLabel(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${ampm}`;
}
