import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { TodayDose, AdherenceStats } from '../types';
import { getTodaySchedule, recordDoseAction, getWeeklyAdherence } from '../services/reminderService';
import { colors, spacing, typography, radius, globalStyles } from '../theme';
import DoseCard from '../components/DoseCard';
import AdherenceSummary from '../components/AdherenceSummary';
import EmptyState from '../components/EmptyState';
import { getGreeting } from '../utils/helpers';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [doses, setDoses] = useState<TodayDose[]>([]);
  const [adherence, setAdherence] = useState<AdherenceStats[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      const [todayDoses, weeklyStats] = await Promise.all([
        getTodaySchedule(),
        getWeeklyAdherence(),
      ]);
      setDoses(todayDoses);
      setAdherence(weeklyStats);
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const handleTaken = async (dose: TodayDose) => {
    try {
      await recordDoseAction(
        dose.medicine,
        dose.scheduledTime,
        'taken',
        dose.log?.id
      );
      await loadData();
    } catch (err) {
      Alert.alert('Oops', 'Kuch gadbad hua. Dobara try karein.');
    }
  };

  const handleSkip = async (dose: TodayDose) => {
    Alert.alert(
      'Skip Karein?',
      `${dose.medicine.name} ki ye dose skip karein?`,
      [
        { text: 'Nahi', style: 'cancel' },
        {
          text: 'Skip Karein',
          style: 'destructive',
          onPress: async () => {
            await recordDoseAction(
              dose.medicine,
              dose.scheduledTime,
              'skipped',
              dose.log?.id
            );
            await loadData();
          },
        },
      ]
    );
  };

  const handleSnooze = async (dose: TodayDose) => {
    await recordDoseAction(
      dose.medicine,
      dose.scheduledTime,
      'snoozed',
      dose.log?.id
    );
    await loadData();
    Alert.alert('⏰ Snooze!', '10 minute mein yaad dilayenge!', [{ text: 'OK' }]);
  };

  // Partition doses
  const pendingDoses = doses.filter(d => d.status === 'pending' || d.status === 'snoozed');
  const doneDoses = doses.filter(d => d.status === 'taken' || d.status === 'skipped');
  
  const takenCount = doneDoses.filter(d => d.status === 'taken').length;
  const totalCount = doses.length;
  const progressPct = totalCount > 0 ? (takenCount / totalCount) * 100 : 0;

  const today = format(new Date(), 'EEEE, d MMMM');

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.date}>{today}</Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('Add')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={22} color={colors.textOnPrimary} />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          {totalCount > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Aaj Ka Progress</Text>
                <Text style={styles.progressCount}>
                  {takenCount}/{totalCount} doses li
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[styles.progressFill, { width: `${progressPct}%` }]}
                />
              </View>
            </View>
          )}

          {/* Pending doses */}
          {pendingDoses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                ⏳ Baaki Dawaiyan ({pendingDoses.length})
              </Text>
              {pendingDoses.map((dose, i) => (
                <DoseCard
                  key={`${dose.medicine.id}-${dose.doseTime.id}`}
                  dose={dose}
                  onTaken={() => handleTaken(dose)}
                  onSkip={() => handleSkip(dose)}
                  onSnooze={() => handleSnooze(dose)}
                />
              ))}
            </View>
          )}

          {/* Empty state */}
          {doses.length === 0 && !loading && (
            <EmptyState
              emoji="🌟"
              title="Aaj Ke Liye Koi Dawai Nahi"
              subtitle="Dawai add karne ke liye neeche + button dabao ya bolo"
            />
          )}

          {/* Done doses */}
          {doneDoses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                ✅ Ho Gayi ({doneDoses.length})
              </Text>
              {doneDoses.map((dose) => (
                <DoseCard
                  key={`${dose.medicine.id}-${dose.doseTime.id}-done`}
                  dose={dose}
                  onTaken={() => handleTaken(dose)}
                  onSkip={() => handleSkip(dose)}
                  onSnooze={() => handleSnooze(dose)}
                />
              ))}
            </View>
          )}

          {/* Weekly adherence */}
          {adherence.length > 0 && (
            <View style={styles.section}>
              <AdherenceSummary stats={adherence} />
            </View>
          )}

          {/* Bottom padding */}
          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  greeting: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  date: {
    ...typography.h1,
    fontSize: 22,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  progressSection: {
    marginBottom: spacing.xl,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.label,
  },
  progressCount: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.taken,
    borderRadius: 3,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontSize: 12,
  },
});

export default HomeScreen;
