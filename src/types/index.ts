// ─── Medicine Types ────────────────────────────────────────────────────────────

export type MealRelation = 'before_meal' | 'after_meal' | 'with_meal' | 'empty_stomach' | 'any';

export type DoseStatus = 'pending' | 'taken' | 'skipped' | 'snoozed';

export type FrequencyType = 'daily' | 'alternate_days' | 'weekly' | 'custom';

export interface DoseTime {
  id: string;
  hour: number;   // 0-23
  minute: number; // 0-59
  label?: string; // e.g., "Subah", "Raat"
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;          // e.g., "500mg", "1 tablet"
  frequency: FrequencyType;
  times: DoseTime[];
  mealRelation: MealRelation;
  startDate: string;       // ISO date string
  endDate?: string;        // ISO date string, undefined = indefinite
  instructions?: string;   // Additional notes
  color: string;           // UI accent color
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Dose Log Types ────────────────────────────────────────────────────────────

export interface DoseLog {
  id: string;
  medicineId: string;
  medicineName: string;
  scheduledTime: string;   // ISO datetime string
  takenAt?: string;        // ISO datetime string, undefined if not taken
  status: DoseStatus;
  date: string;            // YYYY-MM-DD
  snoozeUntil?: string;    // ISO datetime string
}

// ─── Today's Schedule ──────────────────────────────────────────────────────────

export interface TodayDose {
  medicine: Medicine;
  doseTime: DoseTime;
  scheduledTime: Date;
  log?: DoseLog;
  status: DoseStatus;
}

// ─── Parser Result ────────────────────────────────────────────────────────────

export interface ParsedMedicine {
  name: string;
  dosage: string;
  times: DoseTime[];
  mealRelation: MealRelation;
  frequency: FrequencyType;
  startDate: string;
  rawInput: string;
  confidence: number;       // 0-1 confidence score
  warnings: string[];       // Warnings or ambiguities
}

// ─── Adherence Stats ──────────────────────────────────────────────────────────

export interface AdherenceStats {
  date: string;
  total: number;
  taken: number;
  skipped: number;
  pending: number;
  percentage: number;
}

export interface WeeklyAdherence {
  days: AdherenceStats[];
  overallPercentage: number;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface ScheduledNotification {
  medicineId: string;
  doseTimeId: string;
  notificationId: string;
}

// ─── UI State ────────────────────────────────────────────────────────────────

export type BottomTabParamList = {
  Home: undefined;
  Add: { prefillText?: string } | undefined;
  History: undefined;
  Medicines: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  MedicineDetail: { medicineId: string };
  EditMedicine: { medicineId: string };
};

// ─── Voice State ─────────────────────────────────────────────────────────────

export type VoiceState = 'idle' | 'listening' | 'processing' | 'done' | 'error';
