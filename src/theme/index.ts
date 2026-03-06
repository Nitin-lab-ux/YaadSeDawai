import { Dimensions } from 'react-native';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Color Palette ────────────────────────────────────────────────────────────

export const colors = {
  // Dark backgrounds
  bg: '#0D0D1A',
  bgCard: '#1A1A2E',
  bgElevated: '#16213E',
  bgInput: '#1E1E38',
  bgModal: '#12122B',
  
  // Brand
  primary: '#FF6B35',
  primaryLight: '#FF8C5A',
  primaryDark: '#E55A24',
  primaryGlow: 'rgba(255, 107, 53, 0.15)',
  
  // Accents
  accent1: '#4ECDC4',  // Teal - taken
  accent2: '#45B7D1',  // Blue - pending
  accent3: '#FFE66D',  // Yellow - snooze
  accent4: '#FF6B6B',  // Red - skipped/alert
  accent5: '#96CEB4',  // Green - success
  
  // Status colors
  taken: '#4ECDC4',
  pending: '#45B7D1',
  skipped: '#FF6B6B',
  snoozed: '#FFE66D',
  
  // Text
  textPrimary: '#F0F0FF',
  textSecondary: '#A0A0C0',
  textMuted: '#606080',
  textOnPrimary: '#FFFFFF',
  
  // Border
  border: '#2A2A4A',
  borderLight: 'rgba(255,255,255,0.08)',
  
  // Overlay
  overlay: 'rgba(0,0,0,0.7)',
  shimmer: 'rgba(255,255,255,0.05)',
  
  // Nav
  navBg: '#111128',
  navActive: '#FF6B35',
  navInactive: '#505070',
};

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  // Display
  display: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  
  // Headings
  h1: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  
  // Body
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  
  // Label
  label: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  
  // Caption
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
};

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
};

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 999,
};

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
};

// ─── Status Config ────────────────────────────────────────────────────────────

export const statusConfig = {
  taken: {
    color: colors.taken,
    bg: 'rgba(78, 205, 196, 0.12)',
    label: 'Le Li ✅',
    emoji: '✅',
  },
  pending: {
    color: colors.pending,
    bg: 'rgba(69, 183, 209, 0.12)',
    label: 'Baaki Hai',
    emoji: '⏳',
  },
  skipped: {
    color: colors.skipped,
    bg: 'rgba(255, 107, 107, 0.12)',
    label: 'Skip Ki',
    emoji: '⏭️',
  },
  snoozed: {
    color: colors.snoozed,
    bg: 'rgba(255, 230, 109, 0.12)',
    label: 'Snooze',
    emoji: '⏰',
  },
};

// ─── Global Styles ────────────────────────────────────────────────────────────

export const globalStyles = {
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
};
