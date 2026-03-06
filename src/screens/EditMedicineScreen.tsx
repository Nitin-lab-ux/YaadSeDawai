import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Medicine, DoseTime, MealRelation, FrequencyType } from '../types';
import { getMedicineById } from '../db/database';
import { editMedicine } from '../services/reminderService';
import { colors, spacing, radius, typography, globalStyles } from '../theme';
import { formatTime, generateId, MEDICINE_COLORS } from '../utils/helpers';

type EditRoute = RouteProp<{ EditMedicine: { medicineId: string } }, 'EditMedicine'>;

const MEAL_OPTIONS: { value: MealRelation; label: string }[] = [
  { value: 'any', label: 'Koi Waqt' },
  { value: 'before_meal', label: 'Khane Se Pehle' },
  { value: 'after_meal', label: 'Khane Ke Baad' },
  { value: 'with_meal', label: 'Khane Ke Saath' },
  { value: 'empty_stomach', label: 'Khali Pet' },
];

const FREQ_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: 'daily', label: 'Rozana' },
  { value: 'alternate_days', label: 'Ek Din Chod Ke' },
  { value: 'weekly', label: 'Har Hafte' },
];

export default function EditMedicineScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<EditRoute>();
  const { medicineId } = route.params;

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [mealRelation, setMealRelation] = useState<MealRelation>('any');
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [times, setTimes] = useState<DoseTime[]>([]);
  const [color, setColor] = useState('#FF6B35');
  const [saving, setSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeIdx, setEditingTimeIdx] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const med = await getMedicineById(medicineId);
      if (med) {
        setMedicine(med);
        setName(med.name);
        setDosage(med.dosage);
        setMealRelation(med.mealRelation);
        setFrequency(med.frequency);
        setTimes(med.times);
        setColor(med.color);
      }
    })();
  }, [medicineId]);

  const handleSave = async () => {
    if (!medicine) return;
    if (!name.trim()) { Alert.alert('', 'Medicine ka naam daalo'); return; }
    if (times.length === 0) { Alert.alert('', 'Kam se kam ek time daalo'); return; }

    setSaving(true);
    try {
      await editMedicine({ ...medicine, name: name.trim(), dosage, mealRelation, frequency, times, color, updatedAt: new Date().toISOString() });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Save nahi ho saka');
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = (_: any, date?: Date) => {
    setShowTimePicker(false);
    if (!date || editingTimeIdx === null) return;
    const updated = [...times];
    updated[editingTimeIdx] = { ...updated[editingTimeIdx], hour: date.getHours(), minute: date.getMinutes() };
    setTimes(updated);
  };

  const addTime = () => {
    setTimes(t => [...t, { id: generateId(), hour: 8, minute: 0, label: 'Subah' }]);
  };

  if (!medicine) return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Dawai</Text>
        </View>

        <Field label="Dawai Ka Naam">
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholderTextColor={colors.textMuted} placeholder="jaise: Metformin" />
        </Field>

        <Field label="Dose / Quantity">
          <TextInput value={dosage} onChangeText={setDosage} style={styles.input} placeholderTextColor={colors.textMuted} placeholder="jaise: 500mg, 1 tablet" />
        </Field>

        <Field label="Reminder Times">
          {times.map((t, i) => (
            <View key={t.id} style={styles.timeRow}>
              <TouchableOpacity style={styles.timeBtn} onPress={() => { setEditingTimeIdx(i); setShowTimePicker(true); }}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={styles.timeBtnText}>{formatTime(t.hour, t.minute)}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTimes(ts => ts.filter((_, idx) => idx !== i))}>
                <Ionicons name="close-circle" size={20} color={colors.accent4} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addTimeBtn} onPress={addTime}>
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 13 }}>Time Add Karo</Text>
          </TouchableOpacity>
        </Field>

        <Field label="Khane Ke Saath?">
          <View style={styles.optionsRow}>
            {MEAL_OPTIONS.map(o => (
              <TouchableOpacity key={o.value} onPress={() => setMealRelation(o.value)}
                style={[styles.optionChip, mealRelation === o.value && styles.optionChipActive]}>
                <Text style={[styles.optionText, mealRelation === o.value && styles.optionTextActive]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Kitni Baar?">
          <View style={styles.optionsRow}>
            {FREQ_OPTIONS.map(o => (
              <TouchableOpacity key={o.value} onPress={() => setFrequency(o.value)}
                style={[styles.optionChip, frequency === o.value && styles.optionChipActive]}>
                <Text style={[styles.optionText, frequency === o.value && styles.optionTextActive]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Color">
          <View style={styles.colorsRow}>
            {MEDICINE_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => setColor(c)}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]} />
            ))}
          </View>
        </Field>

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>✅ Changes Save Karo</Text>}
        </TouchableOpacity>

        {showTimePicker && editingTimeIdx !== null && (
          <DateTimePicker mode="time" value={(() => { const d = new Date(); d.setHours(times[editingTimeIdx].hour, times[editingTimeIdx].minute); return d; })()} onChange={handleTimeChange} is24Hour={false} />
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl, paddingTop: spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h1, fontSize: 22 },
  field: { marginBottom: spacing.xl },
  fieldLabel: { ...typography.label, marginBottom: spacing.sm },
  input: { backgroundColor: colors.bgInput, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, fontSize: 15, padding: spacing.lg },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  timeBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary + '50', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  timeBtnText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  addTimeBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  optionChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  optionText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  optionTextActive: { color: colors.primary, fontWeight: '700' },
  colorsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.15 }] },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.xl, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
