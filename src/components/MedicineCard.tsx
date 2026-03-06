import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Medicine } from '../types';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { formatTime, getMealRelationText, getFrequencyText } from '../utils/helpers';

interface Props {
  medicine: Medicine;
  onPress?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

const MedicineCard: React.FC<Props> = ({ medicine, onPress, onDelete, onEdit }) => {
  const timeLabels = medicine.times.map(t =>
    t.label || formatTime(t.hour, t.minute)
  ).join(', ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Color accent stripe */}
      <View style={[styles.colorStripe, { backgroundColor: medicine.color }]} />
      
      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.nameContainer}>
            <View style={[styles.dot, { backgroundColor: medicine.color }]} />
            <Text style={styles.medicineName} numberOfLines={1}>
              {medicine.name}
            </Text>
          </View>
          
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity
                onPress={onEdit}
                style={styles.actionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="pencil-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={onDelete}
                style={styles.actionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color={colors.accent4} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Dosage */}
        <Text style={styles.dosage}>{medicine.dosage}</Text>
        
        {/* Info chips */}
        <View style={styles.chipsRow}>
          <InfoChip
            icon="time-outline"
            label={timeLabels}
            color={medicine.color}
          />
          <InfoChip
            icon="restaurant-outline"
            label={getMealRelationText(medicine.mealRelation)}
            color={colors.accent1}
          />
          <InfoChip
            icon="repeat-outline"
            label={getFrequencyText(medicine.frequency)}
            color={colors.accent2}
          />
        </View>
      </View>
    </Pressable>
  );
};

const InfoChip: React.FC<{
  icon: string;
  label: string;
  color: string;
}> = ({ icon, label, color }) => (
  <View style={[styles.chip, { borderColor: color + '40', backgroundColor: color + '12' }]}>
    <Ionicons name={icon as any} size={11} color={color} />
    <Text style={[styles.chipText, { color }]} numberOfLines={1}>
      {label}
    </Text>
  </View>
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
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  colorStripe: {
    width: 4,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  medicineName: {
    ...typography.h3,
    flex: 1,
  },
  dosage: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
    marginLeft: spacing.md + 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 100,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    padding: 4,
  },
});

export default MedicineCard;
