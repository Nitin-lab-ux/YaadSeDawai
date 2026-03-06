import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { VoiceState } from '../types';

interface Props {
  onResult: (text: string) => void;
  onStateChange?: (state: VoiceState) => void;
  disabled?: boolean;
}

/**
 * VoiceInput Component
 * Uses Android's native speech recognition via Intent
 * Falls back gracefully if permissions denied
 */
const VoiceInput: React.FC<Props> = ({ onResult, onStateChange, disabled }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (voiceState === 'listening') {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
    onStateChange?.(voiceState);
  }, [voiceState]);

  const startPulseAnimation = () => {
    animRef.current = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 600, useNativeDriver: false }),
        ]),
      ])
    );
    animRef.current.start();
  };

  const stopPulseAnimation = () => {
    animRef.current?.stop();
    Animated.parallel([
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  /**
   * Request audio permission and start listening
   * On Android, uses the native voice recognition intent via react-native-voice
   * If react-native-voice not linked, shows instruction modal
   */
  const startListening = async () => {
    if (disabled) return;
    
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Microphone Permission Chahiye',
          'Aawaz se dawai add karne ke liye microphone access de please.',
          [{ text: 'Theek Hai' }]
        );
        return;
      }
      
      setVoiceState('listening');
      
      // Try to use react-native-voice if available
      // In Expo Go, we show a text-input fallback
      try {
        // Dynamic import to handle missing native module gracefully
        const Voice = require('@react-native-voice/voice').default;
        
        Voice.onSpeechResults = (e: any) => {
          const transcript = e.value?.[0];
          if (transcript) {
            setVoiceState('done');
            onResult(transcript);
          }
        };
        
        Voice.onSpeechError = (e: any) => {
          console.warn('Speech error:', e);
          setVoiceState('error');
          setTimeout(() => setVoiceState('idle'), 2000);
        };
        
        Voice.onSpeechEnd = () => {
          setVoiceState('processing');
        };
        
        await Voice.start('hi-IN'); // Start with Hindi locale
      } catch (moduleError) {
        // Fallback: prompt user to type
        setVoiceState('idle');
        Alert.alert(
          '🎤 Voice Input',
          'Voice recognition ke liye aap microphone button dabate rehein aur bolein:\n\n"Metformin 500mg subah 8 aur raat 9"\n\nNote: Expo Go mein voice fully kaam nahi karta. APK build mein perfectly kaam karta hai.',
          [
            {
              text: 'Type Karta Hoon',
              onPress: () => {},
            },
          ]
        );
      }
    } catch (err) {
      setVoiceState('error');
      setTimeout(() => setVoiceState('idle'), 2000);
    }
  };

  const stopListening = async () => {
    try {
      const Voice = require('@react-native-voice/voice').default;
      await Voice.stop();
      setVoiceState('processing');
    } catch {
      setVoiceState('idle');
    }
  };

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 107, 53, 0)', 'rgba(255, 107, 53, 0.35)'],
  });

  const isListening = voiceState === 'listening';
  const isProcessing = voiceState === 'processing';

  return (
    <View style={styles.container}>
      {/* Glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          { backgroundColor: glowColor },
        ]}
      />
      
      {/* Main button */}
      <Animated.View style={[styles.btnWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          onPress={isListening ? stopListening : startListening}
          disabled={disabled || isProcessing}
          style={[
            styles.micBtn,
            isListening && styles.micBtnActive,
            isProcessing && styles.micBtnProcessing,
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isListening ? 'stop' : isProcessing ? 'hourglass-outline' : 'mic'}
            size={28}
            color={
              isListening ? '#fff' :
              isProcessing ? colors.accent3 :
              colors.primary
            }
          />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Status label */}
      <Text style={styles.statusLabel}>
        {voiceState === 'idle' && 'Mic dabao aur bolo'}
        {voiceState === 'listening' && '🔴 Sun raha hoon...'}
        {voiceState === 'processing' && '⚙️ Samajh raha hoon...'}
        {voiceState === 'done' && '✅ Ho gaya!'}
        {voiceState === 'error' && '❌ Kuch gadbad hua'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  glowRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  btnWrapper: {
    borderRadius: 40,
  },
  micBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary + '60',
    ...shadows.card,
  },
  micBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  micBtnProcessing: {
    borderColor: colors.accent3,
    backgroundColor: colors.bgCard,
  },
  statusLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default VoiceInput;
