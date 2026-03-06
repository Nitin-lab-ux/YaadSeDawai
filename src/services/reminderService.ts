/**
 * Reminder Service
 * High-level service combining parser, DB, and notifications
 */

import { Medicine, ParsedMedicine, DoseLog, TodayDose, DoseStatus, AdherenceStats } from '../types';
import { generateId, getTodayString, getRandomMedicineColor } from '../utils/helpers';
import {
  insertMedicine,
  getAllMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  upsertDoseLog,
  getDoseLogsByDate,
  getDoseLogsByMedicine,
  getDoseLogBySchedule,
  updateDoseStatus,
  getAdherenceForDateRange,
} from '../db/database';
import {
  scheduleMedicineNotifications,
  cancelMedicineNotifications,
  scheduleSnoozeNotification,
} from './notificationService';
import { format, subDays, parseISO, addMinutes } from 'date-fns';

// ─── Create Medicine from Parsed Result ──────────────────────────────────────

export async function createMedicineFromParsed(parsed: ParsedMedicine): Promise<Medicine> {
  const now = new Date().toISOString();
  
  const medicine: Medicine = {
    id: generateId(),
    name: parsed.name,
    dosage: parsed.dosage,
    frequency: parsed.frequency,
    times: parsed.times.map(t => ({ ...t, id: t.id || generateId() })),
    mealRelation: parsed.mealRelation,
    startDate: parsed.startDate,
    endDate: undefined,
    instructions: undefined,
    color: getRandomMedicineColor(),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  
  await insertMedicine(medicine);
  await scheduleMedicineNotifications(medicine);
  
  return medicine;
}

// ─── Create Medicine Manually ─────────────────────────────────────────────────

export async function createMedicine(data: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medicine> {
  const now = new Date().toISOString();
  
  const medicine: Medicine = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  
  await insertMedicine(medicine);
  await scheduleMedicineNotifications(medicine);
  
  return medicine;
}

// ─── Update Medicine ──────────────────────────────────────────────────────────

export async function editMedicine(medicine: Medicine): Promise<void> {
  const updated = { ...medicine, updatedAt: new Date().toISOString() };
  await updateMedicine(updated);
  await scheduleMedicineNotifications(updated); // Reschedule notifications
}

// ─── Delete Medicine ──────────────────────────────────────────────────────────

export async function removeMedicine(medicineId: string): Promise<void> {
  await cancelMedicineNotifications(medicineId);
  await deleteMedicine(medicineId);
}

// ─── Get Today's Schedule ────────────────────────────────────────────────────

export async function getTodaySchedule(): Promise<TodayDose[]> {
  const today = getTodayString();
  const medicines = await getAllMedicines();
  const logs = await getDoseLogsByDate(today);
  
  const todayDoses: TodayDose[] = [];
  
  for (const medicine of medicines) {
    if (!medicine.isActive) continue;
    
    // Check if medicine is active on today's date
    if (!isMedicineActiveOnDate(medicine, today)) continue;
    
    for (const doseTime of medicine.times) {
      const scheduledTime = new Date();
      scheduledTime.setHours(doseTime.hour, doseTime.minute, 0, 0);
      
      // Find matching log
      const log = logs.find(
        l => l.medicineId === medicine.id && 
             l.scheduledTime === scheduledTime.toISOString()
      );
      
      todayDoses.push({
        medicine,
        doseTime,
        scheduledTime,
        log,
        status: log?.status ?? 'pending',
      });
    }
  }
  
  // Sort by scheduled time
  return todayDoses.sort(
    (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()
  );
}

// ─── Check if Medicine Active on Date ────────────────────────────────────────

function isMedicineActiveOnDate(medicine: Medicine, date: string): boolean {
  if (date < medicine.startDate) return false;
  if (medicine.endDate && date > medicine.endDate) return false;
  return true;
}

// ─── Record Dose Action ───────────────────────────────────────────────────────

export async function recordDoseAction(
  medicine: Medicine,
  scheduledTime: Date,
  action: 'taken' | 'skipped' | 'snoozed',
  existingLogId?: string
): Promise<DoseLog> {
  const today = getTodayString();
  const now = new Date();
  
  const logId = existingLogId || generateId();
  let snoozeUntil: string | undefined;
  
  if (action === 'snoozed') {
    const snoozeTime = addMinutes(now, 10);
    snoozeUntil = snoozeTime.toISOString();
    
    // Find the matching dose time for snooze
    const matchingDoseTime = medicine.times.find(
      t => t.hour === scheduledTime.getHours() && t.minute === scheduledTime.getMinutes()
    );
    if (matchingDoseTime) {
      await scheduleSnoozeNotification(medicine, matchingDoseTime, 10);
    }
  }
  
  const log: DoseLog = {
    id: logId,
    medicineId: medicine.id,
    medicineName: medicine.name,
    scheduledTime: scheduledTime.toISOString(),
    takenAt: action === 'taken' ? now.toISOString() : undefined,
    status: action,
    date: today,
    snoozeUntil,
  };
  
  await upsertDoseLog(log);
  return log;
}

// ─── Get Adherence Stats ──────────────────────────────────────────────────────

export async function getWeeklyAdherence(): Promise<AdherenceStats[]> {
  const today = getTodayString();
  const weekAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
  
  const rawStats = await getAdherenceForDateRange(weekAgo, today);
  
  // Fill in days with no data
  const stats: AdherenceStats[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const found = rawStats.find(s => s.date === date);
    
    if (found) {
      stats.push({
        date,
        total: found.total,
        taken: found.taken,
        skipped: found.skipped,
        pending: found.pending,
        percentage: found.total > 0 ? Math.round((found.taken / found.total) * 100) : 0,
      });
    } else {
      stats.push({ date, total: 0, taken: 0, skipped: 0, pending: 0, percentage: 0 });
    }
  }
  
  return stats;
}

// ─── Get Medicine Dose History ────────────────────────────────────────────────

export async function getMedicineDoseHistory(medicineId: string): Promise<DoseLog[]> {
  return getDoseLogsByMedicine(medicineId, 60);
}
