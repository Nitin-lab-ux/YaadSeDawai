import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { format, subDays, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

import { DoseLog } from '../types';
import { getAdherenceForDateRange, getDoseLogsByDate } from '../db/database';
import { colors, spacing, radius, typography, globalStyles, statusConfig } from '../theme';
import EmptyState from '../components/EmptyState';
import { formatTime } from '../utils/helpers';

interface Section {
  title: string;
  date: string;
  data: DoseLog[];
  taken: number;
  total: number;
}

const HistoryScreen: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    const loaded: Section[] = [];
    
    for (let i = 0; i < 14; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const logs = await getDoseLogsByDate(date);
      
      if (logs.length > 0 || i === 0) {
        const taken = logs.filter(l => l.status === 'taken').length;
        loaded.push({
          title: i === 0 ? 'Aaj' : i === 1 ? 'Kal' : format(parseISO(date), 'd MMM'),
          date,
          data: logs,
          taken,
          total: logs.length,
        });
      }
    }
    
    setSections(loaded);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

  if (sections.length === 0 || sections.every(s => s.data.length === 0)) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
        </View>
        <EmptyState
          emoji="📅"
          title="Abhi Tak Koi Record Nahi"
          subtitle="Jab aap dawai loge ya skip karoge, woh yahan dikhega"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <SectionList
        sections={sections.filter(s => s.data.length > 0)}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadHistory(); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>Pichle 14 din</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionDate}>{section.title}</Text>
            <View style={[
              styles.adherencePill,
              {
                backgroundColor: section.total === 0 ? colors.bgCard :
                  section.taken === section.total ? colors.taken + '20' :
                  section.taken > 0 ? colors.accent3 + '20' :
                  colors.skipped + '20',
              }
            ]}>
              <Text style={[
                styles.adherenceText,
                {
                  color: section.total === 0 ? colors.textMuted :
                    section.taken === section.total ? colors.taken :
                    section.taken > 0 ? colors.accent3 :
                    colors.skipped,
                }
              ]}>
                {section.taken}/{section.total} li
              </Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => <HistoryLogItem log={item} />}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </SafeAreaView>
  );
};

const HistoryLogItem: React.FC<{ log: DoseLog }> = ({ log }) => {
  const config = statusConfig[log.status];
  const scheduledDate = new Date(log.scheduledTime);

  return (
    <View style={styles.logItem}>
      <View style={[styles.logStatusDot, { backgroundColor: config.color }]} />
      
      <View style={styles.logContent}>
        <Text style={styles.logName}>{log.medicineName}</Text>
        <Text style={styles.logTime}>
          {format(scheduledDate, 'h:mm a')}
          {log.takenAt && ` • ${format(new Date(log.takenAt), 'h:mm a')} baje li`}
        </Text>
      </View>
      
      <View style={[styles.logBadge, { backgroundColor: config.bg, borderColor: config.color + '40' }]}>
        <Text style={[styles.logBadgeText, { color: config.color }]}>
          {config.emoji} {config.label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  header: {
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    fontSize: 26,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingTop: spacing.xl,
  },
  sectionDate: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  adherencePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  adherenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  logStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  logContent: {
    flex: 1,
  },
  logName: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
  },
  logTime: {
    ...typography.caption,
    marginTop: 2,
  },
  logBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  logBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default HistoryScreen;
