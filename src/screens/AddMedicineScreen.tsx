import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Speech from 'expo-speech';

import { parseMedicineCommand, getParsePreview } from '../services/parserService';
import { createMedicineFromParsed } from '../services/reminderService';
import { colors, spacing, radius, typography, shadows } from '../theme';
import VoiceInput from '../components/VoiceInput';
import { BottomTabParamList, ParsedMedicine, DoseTime } from '../types';
import { formatTime } from '../utils/helpers';

// Suggestion chips
const SUGGESTIONS = [
  'Dolo 650 subah 8 aur raat 9 khane ke baad',
  'Metformin 500mg subah aur raat khali pet',
  'Vitamin D3 1 tablet subah khane ke saath',
  'BP wali dawai shaam 7 baje',
  'Omeprazole 20mg subah khali pet',
  'Kal se Azithromycin 500mg daily 9 am',
];

type AddRoute = RouteProp<BottomTabParamList, 'Add'>;

const AddMedicineScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<AddRoute>();
  
  const [inputText, setInputText] = useState(route.params?.prefillText || '');
  const [parsed, setParsed] = useState<ParsedMedicine | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const previewAnim = useRef(new Animated.Value(0)).current;
  
  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
    if (text.length > 5) {
      const result = parseMedicineCommand(text);
      setParsed(result);
      if (result && !parsed) {
        Animated.spring(previewAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }).start();
      }
    } else {
      setParsed(null);
    }
  }, [parsed]);
  
  const handleVoiceResult = useCallback((text: string) => {
    setInputText(text);
    handleTextChange(text);
    setShowVoice(false);
    // Optional: speak confirmation
    Speech.speak(`${text} — samajh gaya`, { language: 'hi-IN', rate: 0.9 });
  }, []);
  
  const handleSuggestion = (text: string) => {
    setInputText(text);
    handleTextChange(text);
  };
  
  const handleSave = async () => {
    if (!parsed) {
      Alert.alert('⚠️ Pehle Parse Karein', 'Koi dawai command daalo pehle!');
      return;
    }
    
    if (parsed.name === 'Unknown Medicine') {
      Alert.alert(
        'Medicine Ka Naam?',
        'Medicine ka naam clear nahi hua. Dobara try karein?',
        [
          { text: 'Nahi, Save Karo', onPress: () => doSave() },
          { text: 'Dobara Try', style: 'cancel' },
        ]
      );
      return;
    }
    
    doSave();
  };
  
  const doSave = async () => {
    if (!parsed) return;
    setIsCreating(true);
    try {
      await createMedicineFromParsed(parsed);
      Speech.speak(`${parsed.name} add ho gayi`, { language: 'hi-IN', rate: 0.9 });
      navigation.navigate('Home');
      
      setTimeout(() => {
        Alert.alert(
          '✅ Dawai Add Ho Gayi!',
          `${parsed.name} ka reminder set ho gaya hai.\n${parsed.times.map(t => formatTime(t.hour, t.minute)).join(' aur ')} baje yaad dilayenge.`,
          [{ text: 'Shukriya!' }]
        );
      }, 500);
    } catch (err) {
      Alert.alert('Error', 'Dawai save nahi ho saki. Dobara try karein.');
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Dawai Add Karo</Text>
            <Text style={styles.subtitle}>
              Hindi, English, ya Hinglish mein bolo ya likho
            </Text>
          </View>
          
          {/* Input area */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              value={inputText}
              onChangeText={handleTextChange}
              placeholder="Jaise: Metformin 500mg subah 8 aur raat 9 khane ke baad"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              multiline
              numberOfLines={3}
              autoCorrect={false}
              autoCapitalize="none"
            />
            
            {/* Voice toggle button */}
            <TouchableOpacity
              style={styles.voiceToggle}
              onPress={() => setShowVoice(v => !v)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showVoice ? 'keyboard-outline' : 'mic-outline'}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          
          {/* Voice input panel */}
          {showVoice && (
            <View style={styles.voicePanel}>
              <Text style={styles.voiceInstruct}>
                🎤 Microphone dabao aur dawai ke baare mein bolo
              </Text>
              <VoiceInput onResult={handleVoiceResult} />
            </View>
          )}
          
          {/* Parse preview */}
          {parsed && (
            <Animated.View
              style={[
                styles.previewCard,
                {
                  opacity: previewAnim,
                  transform: [{ translateY: previewAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })}],
                },
              ]}
            >
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>📋 Samajha:</Text>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: parsed.confidence > 0.7 ? colors.taken + '20' : colors.accent3 + '20' }
                ]}>
                  <Text style={[
                    styles.confidenceText,
                    { color: parsed.confidence > 0.7 ? colors.taken : colors.accent3 }
                  ]}>
                    {Math.round(parsed.confidence * 100)}% sure
                  </Text>
                </View>
              </View>
              
              <ParsePreviewRow icon="medkit-outline" label="Dawai" value={parsed.name} />
              <ParsePreviewRow icon="flask-outline" label="Dose" value={parsed.dosage} />
              <ParsePreviewRow
                icon="time-outline"
                label="Waqt"
                value={parsed.times.map(t => t.label || formatTime(t.hour, t.minute)).join(', ')}
              />
              <ParsePreviewRow
                icon="restaurant-outline"
                label="Khana"
                value={
                  { before_meal: 'Khane Se Pehle', after_meal: 'Khane Ke Baad',
                    with_meal: 'Khane Ke Saath', empty_stomach: 'Khali Pet', any: 'Koi Waqt' }
                  [parsed.mealRelation]
                }
              />
              <ParsePreviewRow
                icon="calendar-outline"
                label="Shuru"
                value={parsed.startDate === new Date().toISOString().split('T')[0] ? 'Aaj Se' : 'Kal Se'}
              />
              
              {parsed.warnings.length > 0 && (
                <View style={styles.warningsBox}>
                  {parsed.warnings.map((w, i) => (
                    <Text key={i} style={styles.warningText}>⚠️ {w}</Text>
                  ))}
                </View>
              )}
            </Animated.View>
          )}
          
          {/* Save button */}
          {parsed && (
            <TouchableOpacity
              style={[styles.saveBtn, isCreating && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isCreating}
              activeOpacity={0.85}
            >
              {isCreating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  <Text style={styles.saveBtnText}>Dawai Save Karo</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {/* Examples */}
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestLabel}>💡 Examples</Text>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionChip}
                onPress={() => handleSuggestion(s)}
                activeOpacity={0.75}
              >
                <Ionicons name="flash-outline" size={14} color={colors.primary} />
                <Text style={styles.suggestionText} numberOfLines={1}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const ParsePreviewRow: React.FC<{ icon: string; label: string; value: string }> = ({
  icon, label, value
}) => (
  <View style={styles.previewRow}>
    <View style={styles.previewIcon}>
      <Ionicons name={icon as any} size={14} color={colors.primary} />
    </View>
    <Text style={styles.previewLabel}>{label}:</Text>
    <Text style={styles.previewValue} numberOfLines={1}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  title: {
    ...typography.h1,
    fontSize: 26,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 15,
    padding: spacing.lg,
    paddingRight: 50,
    minHeight: 90,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  voiceToggle: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voicePanel: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  voiceInstruct: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  previewTitle: {
    ...typography.h3,
    color: colors.primary,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewIcon: {
    width: 24,
    alignItems: 'center',
  },
  previewLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
    width: 55,
  },
  previewValue: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  warningsBox: {
    backgroundColor: colors.accent3 + '15',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  warningText: {
    fontSize: 12,
    color: colors.accent3,
    lineHeight: 18,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  suggestionsSection: {
    gap: spacing.sm,
  },
  suggestLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  suggestionText: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.textSecondary,
  },
});

export default AddMedicineScreen;
