import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AdherenceStats } from '../types';
import { colors, spacing, radius, typography } from '../theme';
import { format, parseISO } from 'date-fns';

interface Props {
  stats: AdherenceStats[];
}

const AdherenceSummary: React.FC<Props> = ({ stats }) => {
  if (!stats.length) return null;
  
  const totalTaken = stats.reduce((s, d) => s + d.taken, 0);
  const totalDoses = stats.reduce((s, d) => s + d.total, 0);
  const overallPct = totalDoses > 0 ? Math.round((totalTaken / totalDoses) * 100) : 0;
  
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container}>
      {/* Overall percentage */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.label}>Is Hafte Ki Adherence</Text>
          <Text style={styles.overall}>
            {overallPct}%
            <Text style={styles.overallSub}> doses li gayi</Text>
          </Text>
        </View>
        
        {/* Circular indicator */}
        <CircleIndicator percentage={overallPct} />
      </View>

      {/* Bar chart */}
      <View style={styles.barsContainer}>
        {stats.map((day, idx) => {
          const dayDate = parseISO(day.date);
          const dayChar = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][dayDate.getDay()];
          const isToday = day.date === format(new Date(), 'yyyy-MM-dd');
          const barHeight = day.total > 0 ? Math.max((day.percentage / 100) * 60, 4) : 4;
          
          return (
            <View key={day.date} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: barHeight,
                      backgroundColor:
                        day.percentage >= 80 ? colors.taken :
                        day.percentage >= 50 ? colors.accent3 :
                        day.total === 0 ? colors.border :
                        colors.skipped,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {dayChar}
              </Text>
              {isToday && <View style={styles.todayDot} />}
            </View>
          );
        })}
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color={colors.taken} label="80%+" />
        <LegendItem color={colors.accent3} label="50%+" />
        <LegendItem color={colors.skipped} label="<50%" />
      </View>
    </View>
  );
};

const CircleIndicator: React.FC<{ percentage: number }> = ({ percentage }) => {
  const color =
    percentage >= 80 ? colors.taken :
    percentage >= 50 ? colors.accent3 :
    colors.skipped;

  return (
    <View style={[styles.circle, { borderColor: color }]}>
      <Text style={[styles.circleText, { color }]}>{percentage}</Text>
      <Text style={styles.circleLabel}>%</Text>
    </View>
  );
};

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.label,
    marginBottom: 4,
  },
  overall: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  overallSub: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  circleText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  circleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
    paddingTop: spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  barTrack: {
    height: 60,
    width: 24,
    backgroundColor: colors.bgElevated,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  dayLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  dayLabelToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
});

export default AdherenceSummary;
