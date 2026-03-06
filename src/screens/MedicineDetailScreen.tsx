import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';

import { Medicine, DoseLog } from '../types';
import { getMedicineById } from '../db/database';
import { removeMedicine, getMedicineDoseHistory } from '../services/reminderService';
import { colors, spacing, radius, typography, globalStyles, statusConfig, shadows } from '../theme';
import { formatTime, getMealRelationText, getFrequencyText, formatDisplayDate } from '../utils/helpers';
import { RootStackParamList } from '../types';

type DetailRoute = RouteProp<RootStackParamList, 'MedicineDetail'>;

const MedicineDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<DetailRoute>();
  const { medicineId } = route.params;
  
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [history, setHistory] = useState<DoseLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const med = await getMedicineById(medicineId);
        setMedicine(med);
        if (med) {
          const hist = await getMedicineDoseHistory(medicineId);
          setHistory(hist);
        }
      })();
    }, [medicineId])
  );

  if (!medicine) return null;
  
  const takenCount = history.filter(h => h.status === 'taken').length;
  const totalCount = history.length;
  const adherencePct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  const handleDelete = () => {
    Alert.alert(
      '🗑️ Delete Karein?',
      `"${medicine.name}" aur uske saare reminders hamesha ke liye delete ho jayenge.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Karo',
          style: 'destructive',
          onPress: async () => {
            await removeMedicine(medicineId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.skipped} />
          </TouchableOpacity>
        </View>
        
        {/* Medicine hero */}
        <View style={styles.heroCard}>
          <View style={[styles.heroDot, { backgroundColor: medicine.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{medicine.name}</Text>
            <Text style={styles.heroDosage}>{medicine.dosage}</Text>
          </View>
          <View style={[styles.adherenceCircle, { borderColor: medicine.color }]}>
            <Text style={[styles.adherenceNum, { color: medicine.color }]}>{adherencePct}%</Text>
            <Text style={styles.adherenceLabel}>taken</Text>
          </View>
        </View>
        
        {/* Details */}
        <View style={styles.detailsCard}>
          <DetailRow
            icon="time-outline"
            label="Waqt"
            value={medicine.times.map(t => t.label || formatTime(t.hour, t.minute)).join(', ')}
          />
          <DetailRow
            icon="restaurant-outline"
            label="Khana"
            value={getMealRelationText(medicine.mealRelation)}
          />
          <DetailRow
            icon="repeat-outline"
            label="Frequency"
            value={getFrequencyText(medicine.frequency)}
          />
          <DetailRow
            icon="calendar-outline"
            label="Shuru"
            value={formatDisplayDate(medicine.startDate)}
            noBorder
          />
        </View>
        
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard emoji="✅" value={takenCount.toString()} label="Li Gayi" color={colors.taken} />
          <StatCard
            emoji="⏭️"
            value={history.filter(h => h.status === 'skipped').length.toString()}
            label="Skip Ki"
            color={colors.skipped}
          />
          <StatCard emoji="📅" value={totalCount.toString()} label="Total" color={colors.accent2} />
        </View>
        
        {/* History */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent History</Text>
            {history.slice(0, 10).map(log => {
              const cfg = statusConfig[log.status];
              return (
                <View key={log.id} style={styles.historyItem}>
                  <Text style={styles.historyDate}>
                    {format(parseISO(log.date), 'd MMM')} • {format(new Date(log.scheduledTime), 'h:mm a')}
                  </Text>
                  <View style={[styles.histBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.histBadgeText, { color: cfg.color }]}>
                      {cfg.emoji} {cfg.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  noBorder?: boolean;
}> = ({ icon, label, value, noBorder }) => (
  <View style={[styles.detailRow, !noBorder && styles.detailRowBorder]}>
    <View style={styles.detailIconWrap}>
      <Ionicons name={icon as any} size={16} color={colors.primary} />
    </View>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const StatCard: React.FC<{
  emoji: string;
  value: string;
  label: string;
  color: string;
}> = ({ emoji, value, label, color }) => (
  <View style={[styles.statCard, { borderColor: color + '30' }]}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.skipped + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  heroDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  heroName: {
    ...typography.h1,
    fontSize: 22,
  },
  heroDosage: {
    ...typography.bodySmall,
    marginTop: 4,
  },
  adherenceCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adherenceNum: {
    fontSize: 15,
    fontWeight: '800',
  },
  adherenceLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '500',
  },
  detailsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailIconWrap: {
    width: 28,
    alignItems: 'center',
  },
  detailLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
    width: 70,
  },
  detailValue: {
    ...typography.body,
    flex: 1,
    fontSize: 14,
    textAlign: 'right',
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statEmoji: { fontSize: 22 },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  historySection: {},
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  histBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  histBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default MedicineDetailScreen;
