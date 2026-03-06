/**
 * Parser Service — Understands Hindi, English, and Hinglish medicine commands
 *
 * Handles inputs like:
 *   "Kal se Metformin 500mg subah 8 aur raat 8 khane ke baad"
 *   "Dolo 650 daily 9 am"
 *   "BP wali dawai shaam 7:30"
 *   "Aaj se Vitamin D 1 tab subah khali pet"
 */

import { ParsedMedicine, DoseTime, MealRelation, FrequencyType } from '../types';
import {
  TIME_KEYWORDS,
  MEAL_RELATION_MAP,
  FREQUENCY_MAP,
  START_DATE_MAP,
  MEDICINE_DOSE_UNITS,
  COMMON_MEDICINES_HINT,
  buildDoseTime,
} from '../constants/hindi';
import { generateId, getTodayString } from '../utils/helpers';
import { format, addDays, parseISO } from 'date-fns';

// ─── Main Parse Function ──────────────────────────────────────────────────────

export function parseMedicineCommand(input: string): ParsedMedicine | null {
  if (!input.trim()) return null;
  
  const normalized = normalizeInput(input);
  const warnings: string[] = [];
  let confidence = 0.5;
  
  // 1. Extract meal relation (do first to avoid time confusion)
  const { relation: mealRelation, cleaned: afterMealClean } = extractMealRelation(normalized);
  
  // 2. Extract frequency
  const { frequency, cleaned: afterFreqClean } = extractFrequency(afterMealClean);
  
  // 3. Extract start date
  const { startDate, cleaned: afterDateClean } = extractStartDate(afterFreqClean);
  
  // 4. Extract times (explicit times like "8 am", "8:30", "subah")
  const { times, cleaned: afterTimeClean } = extractTimes(afterDateClean);
  
  if (times.length === 0) {
    warnings.push('Koi time nahi mila — default subah 8AM set kiya');
    times.push(buildDoseTime(8, 0, 'Subah'));
  } else {
    confidence += 0.2;
  }
  
  // 5. Extract dosage
  const { dosage, cleaned: afterDosageClean } = extractDosage(afterTimeClean);
  
  // 6. What remains is the medicine name
  const name = extractMedicineName(afterDosageClean, input);
  
  if (name.length < 2) {
    warnings.push('Medicine ka naam clear nahi mila — please check karein');
    confidence -= 0.2;
  } else {
    confidence += 0.2;
  }
  
  if (mealRelation !== 'any') confidence += 0.1;
  if (dosage !== '1 tablet') confidence += 0.1;
  
  return {
    name: capitalizeName(name),
    dosage,
    times,
    mealRelation,
    frequency,
    startDate,
    rawInput: input,
    confidence: Math.min(1, Math.max(0, confidence)),
    warnings,
  };
}

// ─── Normalize Input ──────────────────────────────────────────────────────────

function normalizeInput(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    // Normalize separators
    .replace(/\baur\b/g, ' and ')
    .replace(/\b(or)\b/g, ' and ')
    // Common typo fixes
    .replace(/dawai/g, 'medicine')
    .replace(/dawa\b/g, 'medicine')
    .replace(/goli/g, 'tablet')
    .replace(/goliyan/g, 'tablets')
    // Normalize "ek" to numbers
    .replace(/\bek\b/g, '1')
    .replace(/\bdo\b/g, '2')
    .replace(/\bteen\b/g, '3')
    // Normalize AM/PM
    .replace(/\bbaje\b/g, '')
    .replace(/\bbaj\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Extract Meal Relation ────────────────────────────────────────────────────

function extractMealRelation(text: string): { relation: MealRelation; cleaned: string } {
  let cleaned = text;
  
  for (const { patterns, relation } of MEAL_RELATION_MAP) {
    for (const pattern of patterns) {
      if (cleaned.includes(pattern)) {
        cleaned = cleaned.replace(pattern, ' ').trim();
        return { relation, cleaned };
      }
    }
  }
  
  return { relation: 'any', cleaned };
}

// ─── Extract Frequency ────────────────────────────────────────────────────────

function extractFrequency(text: string): { frequency: FrequencyType; cleaned: string } {
  let cleaned = text;
  
  for (const { patterns, frequency } of FREQUENCY_MAP) {
    for (const pattern of patterns) {
      if (cleaned.includes(pattern)) {
        cleaned = cleaned.replace(pattern, ' ').trim();
        return { frequency, cleaned };
      }
    }
  }
  
  return { frequency: 'daily', cleaned };
}

// ─── Extract Start Date ───────────────────────────────────────────────────────

function extractStartDate(text: string): { startDate: string; cleaned: string } {
  let cleaned = text;
  
  for (const { patterns, offsetDays } of START_DATE_MAP) {
    for (const pattern of patterns) {
      if (cleaned.includes(pattern)) {
        cleaned = cleaned.replace(pattern, ' ').trim();
        const date = addDays(new Date(), offsetDays);
        return { startDate: format(date, 'yyyy-MM-dd'), cleaned };
      }
    }
  }
  
  return { startDate: getTodayString(), cleaned };
}

// ─── Extract Times ────────────────────────────────────────────────────────────

function extractTimes(text: string): { times: DoseTime[]; cleaned: string } {
  const times: DoseTime[] = [];
  let cleaned = text;
  
  // 1. Look for keyword + explicit time: "subah 8", "raat 9:30", "morning 7 am"
  const keywordWithTimeRegex = /\b(subah|savere|morning|dopahar|afternoon|shaam|evening|raat|night)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/gi;
  cleaned = cleaned.replace(keywordWithTimeRegex, (match, keyword, hour, minute, ampm) => {
    const parsed = parseTimeComponents(
      parseInt(hour),
      minute ? parseInt(minute) : 0,
      ampm,
      keyword.toLowerCase()
    );
    const label = (TIME_KEYWORDS[keyword.toLowerCase()] || {}).label || capitalizeName(keyword);
    times.push(buildDoseTime(parsed.hour, parsed.minute, label));
    return ' ';
  });
  
  // 2. Look for explicit time only: "8 am", "21:00", "8:30 pm", "7:30"
  const explicitTimeRegex = /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b|\b(\d{1,2})\s*(am|pm)\b/gi;
  cleaned = cleaned.replace(explicitTimeRegex, (match, h1, m1, ap1, h2, ap2) => {
    const hour = parseInt(h1 || h2);
    const minute = m1 ? parseInt(m1) : 0;
    const ampm = ap1 || ap2;
    const parsed = parseTimeComponents(hour, minute, ampm, undefined);
    times.push(buildDoseTime(parsed.hour, parsed.minute));
    return ' ';
  });
  
  // 3. Look for Hindi time keywords alone: "subah", "shaam", "raat"
  const timeKeywordRegex = new RegExp(
    `\\b(${Object.keys(TIME_KEYWORDS).sort((a,b) => b.length - a.length).join('|')})\\b`,
    'gi'
  );
  cleaned = cleaned.replace(timeKeywordRegex, (match) => {
    const key = match.toLowerCase();
    const timeConfig = TIME_KEYWORDS[key];
    if (timeConfig && !times.find(t => t.hour === timeConfig.hour)) {
      times.push(buildDoseTime(timeConfig.hour, timeConfig.minute, timeConfig.label));
    }
    return ' ';
  });
  
  // Deduplicate by hour:minute
  const uniqueTimes = deduplicateTimes(times);
  
  return { times: uniqueTimes, cleaned: cleaned.replace(/\s+/g, ' ').trim() };
}

// ─── Parse Time Components ────────────────────────────────────────────────────

function parseTimeComponents(
  hour: number,
  minute: number,
  ampm?: string,
  keyword?: string
): { hour: number; minute: number } {
  let h = hour;
  
  if (ampm) {
    const am = ampm.toLowerCase() === 'am';
    if (am && h === 12) h = 0;
    if (!am && h !== 12) h += 12;
  } else if (keyword) {
    // Use keyword context to determine AM/PM
    const kw = keyword.toLowerCase();
    const isNight = ['raat', 'night', 'rat', 'raat ko', 'evening', 'shaam'].includes(kw);
    const isMorning = ['subah', 'savere', 'morning'].includes(kw);
    
    if (isNight && h < 12 && h !== 0) {
      // "raat 8" → 20:00
      if (h < 9) h += 12;
    } else if (isMorning && h >= 12) {
      h -= 12;
    }
  } else {
    // No context: treat ≤6 as PM (6 → 18), else AM
    if (h <= 6 && h !== 0 && h !== 12) h += 12;
  }
  
  return { hour: Math.min(h, 23), minute: Math.min(minute, 59) };
}

// ─── Deduplicate Times ────────────────────────────────────────────────────────

function deduplicateTimes(times: DoseTime[]): DoseTime[] {
  const seen = new Set<string>();
  return times.filter(t => {
    const key = `${t.hour}:${t.minute}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
}

// ─── Extract Dosage ───────────────────────────────────────────────────────────

function extractDosage(text: string): { dosage: string; cleaned: string } {
  let cleaned = text;
  
  // Match patterns like "500mg", "500 mg", "1 tablet", "2 tablets", "10ml"
  const dosageRegex = /\b(\d+(?:\.\d+)?)\s*(mg|ml|mcg|g|tablet|tablets|tab|capsule|cap|drops|drop|goli)\b/gi;
  const match = dosageRegex.exec(cleaned);
  
  if (match) {
    const dosage = `${match[1]}${match[2].toLowerCase()}`;
    cleaned = cleaned.replace(match[0], ' ').trim();
    return { dosage, cleaned };
  }
  
  // Check for just a number before medicine name (could be dose)
  const numMatch = /\b(\d+)\b/.exec(cleaned);
  if (numMatch) {
    const num = parseInt(numMatch[1]);
    // If it's a plausible dose number (1-1000)
    if (num >= 1 && num <= 1000) {
      cleaned = cleaned.replace(numMatch[0], ' ').trim();
      return { dosage: `${num}mg`, cleaned };
    }
  }
  
  return { dosage: '1 tablet', cleaned };
}

// ─── Extract Medicine Name ─────────────────────────────────────────────────────

function extractMedicineName(cleaned: string, original: string): string {
  // Check for common shortcut names
  const lower = cleaned.toLowerCase();
  for (const [shortcut, name] of Object.entries(COMMON_MEDICINES_HINT)) {
    if (lower.includes(shortcut)) {
      return name;
    }
  }
  
  // Remove common filler words
  const fillerWords = [
    'medicine', 'tablet', 'tablets', 'capsule', 'daily', 'ek', 'do',
    'lena', 'khana', 'khani', 'pena', 'and', 'se', 'ko', 'mein',
    'the', 'a', 'an', 'is', 'are', 'wali', 'wala',
  ];
  
  let name = cleaned
    .split(/\s+/)
    .filter(word => {
      const w = word.toLowerCase().trim();
      return w.length > 1 && !fillerWords.includes(w) && !/^\d+$/.test(w);
    })
    .join(' ')
    .trim();
  
  // If still empty, try to grab the first capitalized word from the original
  if (!name) {
    const originalWords = original.split(/\s+/);
    for (const word of originalWords) {
      if (/^[A-Z]/.test(word) && word.length > 2) {
        name = word;
        break;
      }
    }
  }
  
  return name || 'Unknown Medicine';
}

// ─── Capitalize ───────────────────────────────────────────────────────────────

function capitalizeName(name: string): string {
  return name
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ─── Quick Parse for display preview ─────────────────────────────────────────

export function getParsePreview(input: string): string {
  const result = parseMedicineCommand(input);
  if (!result) return '';
  
  const timeStr = result.times
    .map(t => {
      const h = t.hour % 12 || 12;
      const m = t.minute.toString().padStart(2, '0');
      const ampm = t.hour < 12 ? 'AM' : 'PM';
      return t.label || `${h}:${m} ${ampm}`;
    })
    .join(', ');
  
  return `${result.name} • ${result.dosage} • ${timeStr}`;
}
