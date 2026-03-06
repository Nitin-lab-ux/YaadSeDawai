import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface Props {
  emoji?: string;
  title: string;
  subtitle?: string;
}

const EmptyState: React.FC<Props> = ({
  emoji = '💊',
  title,
  subtitle,
}) => (
  <View style={styles.container}>
    <Text style={styles.emoji}>{emoji}</Text>
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.section * 2,
    paddingHorizontal: spacing.xxxl,
    gap: spacing.md,
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  subtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 22,
  },
});

export default EmptyState;
