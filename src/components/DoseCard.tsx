import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TodayDose, DoseStatus } from '../types';
import { colors, spacing, radius, typography, shadows, statusConfig } from '../theme';
import { formatTime, getTimeUntil, getMealRelationText } from '../utils/helpers';
import * as Haptics from 'expo-haptics';

interface Props {
  dose: TodayDose;
  onTaken: () => void;
  onSkip: () => void;
  onSnooze: () => void;
}

const DoseCard: React.FC<Props> = ({ dose, onTaken, onSkip, onSnooze }) => {
  const { medicine, doseTime, status } = dose;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const isPast = new Date() > dose.scheduledTime;
  const timeStr = formatTime(doseTime.hour, doseTime.minute);
  const timeUntil = getTimeUntil(doseTime);
  const config = statusConfig[status];

  const handleTaken = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onTaken();
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSkip();
  };

  const handleSnooze = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSnooze();
  };

  const isTaken = status === 'taken';
  const isSkipped = status === 'skipped';
  const isDone = isTaken || isSkipped;

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }, isDone && styles.cardDone]}>
      {/* Color accent */}
      <View style={[styles.colorBar, { backgroundColor: medicine.color }]} />
      
      <View style={styles.body}>
        {/* Top: Time + Status */}
        <View style={styles.topRow}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{timeStr}</Text>
            {!isDone && (
              <Text style={[styles.timeUntil, { color: isPast ? colors.accent4 : colors.textMuted }]}>
                {timeUntil}
              </Text>
            )}
          </View>
          
          {isDone && (
            <View style={[styles.statusBadge, { backgroundColor: config.bg, borderColor: config.color + '50' }]}>
              <Text style={[styles.statusText, { color: config.color }]}>
                {config.emoji} {config.label}
              </Text>
            </View>
          )}
        </View>
        
        {/* Medicine info */}
        <View style={styles.medicineRow}>
          <View style={[styles.medicineDot, { backgroundColor: medicine.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.medicineName, isDone && styles.textFaded]}>
              {medicine.name}
            </Text>
            <Text style={styles.dosageText}>
              {medicine.dosage} • {getMealRelationText(medicine.mealRelation)}
            </Text>
          </View>
        </View>
        
        {/* Action Buttons — only if not done */}
        {!isDone && (
          <View style={styles.actionsRow}>
            <ActionButton
              label="Le Li"
              emoji="✅"
              color={colors.taken}
              onPress={handleTaken}
              primary
            />
            <ActionButton
              label="10 Min"
              emoji="⏰"
              color={colors.snoozed}
              onPress={handleSnooze}
            />
            <ActionButton
              label="Skip"
              emoji="⏭️"
              color={colors.skipped}
              onPress={handleSkip}
            />
          </View>
        )}
        
        {/* Re-take option if taken (undo) */}
        {isTaken && dose.log?.takenAt && (
          <Text style={styles.takenAt}>
            {new Date(dose.log.takenAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })} baje li
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const ActionButton: React.FC<{
  label: string;
  emoji: string;
  color: string;
  onPress: () => void;
  primary?: boolean;
}> = ({ label, emoji, color, onPress, primary }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.actionBtn,
      { borderColor: color + '60', backgroundColor: color + (primary ? '20' : '10') },
      primary && styles.actionBtnPrimary,
    ]}
    activeOpacity={0.75}
  >
    <Text style={styles.actionEmoji}>{emoji}</Text>
    <Text style={[styles.actionLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.card,
  },
  cardDone: {
    opacity: 0.7,
    borderColor: colors.border,
  },
  colorBar: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timeContainer: {
    gap: 2,
  },
  timeText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  timeUntil: {
    fontSize: 12,
    fontWeight: '400',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  medicineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  medicineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  medicineName: {
    ...typography.h3,
    fontSize: 16,
  },
  textFaded: {
    color: colors.textMuted,
  },
  dosageText: {
    ...typography.caption,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  actionBtnPrimary: {
    flex: 1.3,
  },
  actionEmoji: {
    fontSize: 13,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  takenAt: {
    fontSize: 11,
    color: colors.taken,
    marginTop: 4,
    textAlign: 'right',
  },
});

export default DoseCard;
