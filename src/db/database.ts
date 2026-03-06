import * as SQLite from 'expo-sqlite';
import { Medicine, DoseLog, DoseStatus, ScheduledNotification } from '../types';

let db: SQLite.SQLiteDatabase;

// ─── Initialize Database ───────────────────────────────────────────────────────

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('yaad_se_dawai.db');
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL DEFAULT '1 tablet',
      frequency TEXT NOT NULL DEFAULT 'daily',
      times TEXT NOT NULL DEFAULT '[]',
      meal_relation TEXT NOT NULL DEFAULT 'any',
      start_date TEXT NOT NULL,
      end_date TEXT,
      instructions TEXT,
      color TEXT NOT NULL DEFAULT '#FF6B35',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS dose_logs (
      id TEXT PRIMARY KEY NOT NULL,
      medicine_id TEXT NOT NULL,
      medicine_name TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      taken_at TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      date TEXT NOT NULL,
      snooze_until TEXT,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS scheduled_notifications (
      medicine_id TEXT NOT NULL,
      dose_time_id TEXT NOT NULL,
      notification_id TEXT NOT NULL,
      PRIMARY KEY (medicine_id, dose_time_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_dose_logs_date ON dose_logs(date);
    CREATE INDEX IF NOT EXISTS idx_dose_logs_medicine_id ON dose_logs(medicine_id);
    CREATE INDEX IF NOT EXISTS idx_medicines_active ON medicines(is_active);
  `);
}

// ─── Medicine CRUD ────────────────────────────────────────────────────────────

export async function insertMedicine(medicine: Medicine): Promise<void> {
  await db.runAsync(
    `INSERT INTO medicines 
      (id, name, dosage, frequency, times, meal_relation, start_date, end_date, instructions, color, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      medicine.id,
      medicine.name,
      medicine.dosage,
      medicine.frequency,
      JSON.stringify(medicine.times),
      medicine.mealRelation,
      medicine.startDate,
      medicine.endDate ?? null,
      medicine.instructions ?? null,
      medicine.color,
      medicine.isActive ? 1 : 0,
      medicine.createdAt,
      medicine.updatedAt,
    ]
  );
}

export async function getAllMedicines(): Promise<Medicine[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM medicines WHERE is_active = 1 ORDER BY created_at DESC'
  );
  return rows.map(rowToMedicine);
}

export async function getMedicineById(id: string): Promise<Medicine | null> {
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM medicines WHERE id = ?',
    [id]
  );
  return row ? rowToMedicine(row) : null;
}

export async function updateMedicine(medicine: Medicine): Promise<void> {
  await db.runAsync(
    `UPDATE medicines SET
      name = ?, dosage = ?, frequency = ?, times = ?, meal_relation = ?,
      start_date = ?, end_date = ?, instructions = ?, color = ?,
      is_active = ?, updated_at = ?
      WHERE id = ?`,
    [
      medicine.name,
      medicine.dosage,
      medicine.frequency,
      JSON.stringify(medicine.times),
      medicine.mealRelation,
      medicine.startDate,
      medicine.endDate ?? null,
      medicine.instructions ?? null,
      medicine.color,
      medicine.isActive ? 1 : 0,
      new Date().toISOString(),
      medicine.id,
    ]
  );
}

export async function deleteMedicine(id: string): Promise<void> {
  // Soft delete
  await db.runAsync(
    'UPDATE medicines SET is_active = 0, updated_at = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
}

// ─── Dose Log CRUD ────────────────────────────────────────────────────────────

export async function upsertDoseLog(log: DoseLog): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO dose_logs
      (id, medicine_id, medicine_name, scheduled_time, taken_at, status, date, snooze_until)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      log.id,
      log.medicineId,
      log.medicineName,
      log.scheduledTime,
      log.takenAt ?? null,
      log.status,
      log.date,
      log.snoozeUntil ?? null,
    ]
  );
}

export async function getDoseLogsByDate(date: string): Promise<DoseLog[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM dose_logs WHERE date = ? ORDER BY scheduled_time ASC',
    [date]
  );
  return rows.map(rowToDoseLog);
}

export async function getDoseLogsByMedicine(medicineId: string, limit = 30): Promise<DoseLog[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM dose_logs WHERE medicine_id = ? ORDER BY scheduled_time DESC LIMIT ?',
    [medicineId, limit]
  );
  return rows.map(rowToDoseLog);
}

export async function getDoseLogBySchedule(
  medicineId: string,
  date: string,
  scheduledTime: string
): Promise<DoseLog | null> {
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM dose_logs WHERE medicine_id = ? AND date = ? AND scheduled_time = ?',
    [medicineId, date, scheduledTime]
  );
  return row ? rowToDoseLog(row) : null;
}

export async function updateDoseStatus(
  logId: string,
  status: DoseStatus,
  takenAt?: string,
  snoozeUntil?: string
): Promise<void> {
  await db.runAsync(
    'UPDATE dose_logs SET status = ?, taken_at = ?, snooze_until = ? WHERE id = ?',
    [status, takenAt ?? null, snoozeUntil ?? null, logId]
  );
}

export async function getAdherenceForDateRange(
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; total: number; taken: number; skipped: number; pending: number }>> {
  const rows = await db.getAllAsync<any>(
    `SELECT date,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken,
      SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM dose_logs
    WHERE date >= ? AND date <= ?
    GROUP BY date
    ORDER BY date ASC`,
    [startDate, endDate]
  );
  return rows;
}

// ─── Notification Storage ─────────────────────────────────────────────────────

export async function saveNotificationId(
  medicineId: string,
  doseTimeId: string,
  notificationId: string
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO scheduled_notifications (medicine_id, dose_time_id, notification_id)
     VALUES (?, ?, ?)`,
    [medicineId, doseTimeId, notificationId]
  );
}

export async function getNotificationIds(medicineId: string): Promise<ScheduledNotification[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM scheduled_notifications WHERE medicine_id = ?',
    [medicineId]
  );
  return rows.map((r: any) => ({
    medicineId: r.medicine_id,
    doseTimeId: r.dose_time_id,
    notificationId: r.notification_id,
  }));
}

export async function deleteNotificationIds(medicineId: string): Promise<void> {
  await db.runAsync(
    'DELETE FROM scheduled_notifications WHERE medicine_id = ?',
    [medicineId]
  );
}

// ─── Row Converters ───────────────────────────────────────────────────────────

function rowToMedicine(row: any): Medicine {
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    times: JSON.parse(row.times || '[]'),
    mealRelation: row.meal_relation,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    instructions: row.instructions ?? undefined,
    color: row.color,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToDoseLog(row: any): DoseLog {
  return {
    id: row.id,
    medicineId: row.medicine_id,
    medicineName: row.medicine_name,
    scheduledTime: row.scheduled_time,
    takenAt: row.taken_at ?? undefined,
    status: row.status,
    date: row.date,
    snoozeUntil: row.snooze_until ?? undefined,
  };
}
