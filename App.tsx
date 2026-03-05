import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

type Med = {
  id: string;
  name: string;
  dose: string;
  times: string[]; // HH:MM
  notes?: string;
};

type DoseLog = {
  id: string;
  medId: string;
  medName: string;
  status: 'taken' | 'skipped';
  at: string;
};

const STORAGE_KEY = 'yaad-se-dawai:list:v1';
const LOG_KEY = 'yaad-se-dawai:log:v1';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function normalizeTime(raw: string): string | null {
  const cleaned = raw.trim().toLowerCase().replace('.', ':');
  const m = cleaned.match(/(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?/);
  if (!m) return null;
  let h = Number(m[1]);
  const mm = Number(m[2] ?? '0');
  const ampm = m[3];
  if (Number.isNaN(h) || Number.isNaN(mm) || h > 23 || mm > 59) return null;
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function extractTimes(text: string): string[] {
  const t = text.toLowerCase();
  const slots: string[] = [];

  const regex = /(\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?)/g;
  const found = t.match(regex) ?? [];
  for (const f of found) {
    const n = normalizeTime(f);
    if (n && !slots.includes(n)) slots.push(n);
  }

  if (slots.length === 0) {
    if (/(subah|morning)/.test(t)) slots.push('08:00');
    if (/(dopahar|afternoon|lunch)/.test(t)) slots.push('14:00');
    if (/(shaam|evening)/.test(t)) slots.push('18:00');
    if (/(raat|night)/.test(t)) slots.push('21:00');
  }

  return slots.slice(0, 6);
}

function parseMedicineCommand(input: string): Omit<Med, 'id'> | null {
  const txt = input.trim();
  if (!txt) return null;

  const lower = txt.toLowerCase();
  const times = extractTimes(lower);

  let name = txt;
  const stopWords = ['roz', 'daily', 'subah', 'raat', 'shaam', 'dopahar', 'after meal', 'before meal', 'khane ke baad', 'khane se pehle'];
  for (const w of stopWords) name = name.replace(new RegExp(w, 'ig'), '');
  name = name.replace(/\d{1,2}(:\d{1,2})?\s*(am|pm)?/ig, '').replace(/\s+/g, ' ').trim();

  const doseMatch = txt.match(/(\d+\s?(mg|ml|g|tablet|tab|capsule|cap|drops?))/i);
  const dose = doseMatch ? doseMatch[1] : '1 dose';

  if (!name) name = 'Dawai';
  if (times.length === 0) times.push('08:00');

  const notes = /(khane ke baad|after meal)/i.test(txt)
    ? 'After meal'
    : /(khane se pehle|before meal)/i.test(txt)
      ? 'Before meal'
      : '';

  return { name, dose, times, notes };
}

async function requestPermissions() {
  if (Device.isDevice) {
    const n = await Notifications.requestPermissionsAsync();
    if (n.status !== 'granted') Alert.alert('Permission required', 'Notification permission dena zaroori hai.');
  }
  await ExpoSpeechRecognitionModule.requestPermissionsAsync();
}

function nextTriggerFor(timeHHMM: string) {
  const [h, m] = timeHHMM.split(':').map(Number);
  return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: m } as Notifications.DailyTriggerInput;
}

export default function App() {
  const [command, setCommand] = useState('');
  const [list, setList] = useState<Med[]>([]);
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [isListening, setIsListening] = useState(false);

  useSpeechRecognitionEvent('result', (event) => {
    const txt = event.results?.[0]?.transcript ?? '';
    if (txt) setCommand(txt);
  });

  useSpeechRecognitionEvent('end', () => setIsListening(false));
  useSpeechRecognitionEvent('error', () => setIsListening(false));

  useEffect(() => {
    requestPermissions();
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setList(JSON.parse(saved));
      const savedLogs = await AsyncStorage.getItem(LOG_KEY);
      if (savedLogs) setLogs(JSON.parse(savedLogs));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, [list]);

  useEffect(() => {
    AsyncStorage.setItem(LOG_KEY, JSON.stringify(logs));
  }, [logs]);

  const totalReminders = useMemo(() => list.reduce((acc, m) => acc + m.times.length, 0), [list]);

  const addFromAI = async () => {
    const parsed = parseMedicineCommand(command);
    if (!parsed) return;

    const med: Med = { ...parsed, id: Date.now().toString() };
    setList((prev) => [med, ...prev]);

    for (const t of med.times) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Yaad se Dawai 💊',
          body: `${med.name} (${med.dose}) ka time ho gaya${med.notes ? ` • ${med.notes}` : ''}`,
        },
        trigger: nextTriggerFor(t),
      });
    }

    Speech.speak(`${med.name} set ho gayi. Reminder active hai.`, { language: 'hi-IN' });
    setCommand('');
  };

  const deleteMed = async (id: string) => {
    setList((prev) => prev.filter((x) => x.id !== id));
  };

  const markDose = (med: Med, status: 'taken' | 'skipped') => {
    const log: DoseLog = {
      id: `${Date.now()}-${Math.random()}`,
      medId: med.id,
      medName: med.name,
      status,
      at: new Date().toISOString(),
    };
    setLogs((prev) => [log, ...prev].slice(0, 100));
    if (status === 'taken') {
      Speech.speak(`${med.name} marked as taken`, { language: 'en-US' });
    }
  };

  const snoozeMed = async (med: Med) => {
    const triggerDate = new Date(Date.now() + 10 * 60 * 1000);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Yaad se Dawai 💊 (Snooze)',
        body: `${med.name} (${med.dose}) ka snoozed reminder`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
    Alert.alert('Snoozed', `${med.name} reminder 10 min baad aayega.`);
  };

  const startVoice = async () => {
    try {
      setIsListening(true);
      ExpoSpeechRecognitionModule.start({
        lang: 'hi-IN',
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: true,
      });
    } catch {
      setIsListening(false);
      Alert.alert('Voice unavailable', 'Voice recognition start nahi hua. Text command use karo.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Yaad se Dawai</Text>
      <Text style={styles.sub}>Offline-first AI medicine reminder (Hindi + English + Hinglish)</Text>

      <View style={styles.card}>
        <Text style={styles.label}>AI Command</Text>
        <TextInput
          value={command}
          onChangeText={setCommand}
          placeholder="e.g. Kal se Metformin 500mg subah 8 aur raat 8 khane ke baad"
          multiline
          style={styles.input}
          placeholderTextColor="#6b7280"
        />
        <View style={styles.row}>
          <TouchableOpacity style={styles.btnPrimary} onPress={addFromAI}>
            <Text style={styles.btnText}>Auto Set Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnGhost} onPress={startVoice}>
            <Text style={styles.btnGhostText}>{isListening ? 'Listening…' : 'Voice Input'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.meta}>Medicines: {list.length} • Daily reminders: {totalReminders}</Text>

      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemSub}>{item.dose} • {item.times.join(', ')} {item.notes ? `• ${item.notes}` : ''}</Text>
              <View style={styles.rowSmall}>
                <TouchableOpacity onPress={() => markDose(item, 'taken')} style={styles.takeBtn}>
                  <Text style={styles.smallBtnText}>Taken</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => markDose(item, 'skipped')} style={styles.skipBtn}>
                  <Text style={styles.smallBtnText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => snoozeMed(item)} style={styles.snoozeBtn}>
                  <Text style={styles.smallBtnText}>Snooze 10m</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteMed(item.id)} style={styles.deleteBtn}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 28 }}>Abhi koi medicine add nahi hai.</Text>}
        ListFooterComponent={
          <View style={styles.logBox}>
            <Text style={styles.logTitle}>Recent Dose Activity</Text>
            {logs.length === 0 ? (
              <Text style={styles.logItem}>No activity yet.</Text>
            ) : (
              logs.slice(0, 6).map((l) => (
                <Text key={l.id} style={styles.logItem}>
                  {l.status === 'taken' ? '✅' : '⏭️'} {l.medName} • {new Date(l.at).toLocaleString()}
                </Text>
              ))
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7ff', padding: 16 },
  title: { fontSize: 30, fontWeight: '900', color: '#172554' },
  sub: { marginTop: 4, color: '#334155', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#dbeafe' },
  label: { fontWeight: '700', color: '#1e3a8a', marginBottom: 8 },
  input: { minHeight: 90, borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, padding: 12, color: '#111827', textAlignVertical: 'top', backgroundColor: '#f8fbff' },
  row: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btnPrimary: { flex: 1, backgroundColor: '#2563eb', borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
  btnText: { color: '#fff', fontWeight: '800' },
  btnGhost: { paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#93c5fd', justifyContent: 'center', backgroundColor: '#eff6ff' },
  btnGhostText: { color: '#1d4ed8', fontWeight: '700' },
  meta: { marginVertical: 12, color: '#334155', fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, marginBottom: 8 },
  itemTitle: { fontWeight: '800', color: '#0f172a', fontSize: 16 },
  itemSub: { color: '#334155', marginTop: 2 },
  rowSmall: { flexDirection: 'row', gap: 8, marginTop: 8 },
  takeBtn: { backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  skipBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  snoozeBtn: { backgroundColor: '#0ea5e9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  deleteBtn: { backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  logBox: { marginTop: 14, backgroundColor: '#ffffff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#dbeafe' },
  logTitle: { fontWeight: '800', color: '#1e3a8a', marginBottom: 8 },
  logItem: { color: '#334155', fontSize: 12, marginBottom: 6 },
});
