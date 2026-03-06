import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Medicine } from '../types';
import { getAllMedicines } from '../db/database';
import { removeMedicine } from '../services/reminderService';
import MedicineCard from '../components/MedicineCard';
import EmptyState from '../components/EmptyState';
import { colors, spacing, typography, globalStyles } from '../theme';

const MedicinesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadMedicines = useCallback(async () => {
    const all = await getAllMedicines();
    setMedicines(all);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { loadMedicines(); }, [loadMedicines]));

  const handleDelete = (medicine: Medicine) => {
    Alert.alert(
      '🗑️ Delete Karein?',
      `"${medicine.name}" aur uske saare reminders delete ho jayenge.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeMedicine(medicine.id);
            await loadMedicines();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadMedicines(); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Meri Dawaiyan</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('Add')}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.countLabel}>
          {medicines.length} active medicine{medicines.length !== 1 ? 's' : ''}
        </Text>

        {medicines.length === 0 ? (
          <EmptyState
            emoji="💊"
            title="Koi Dawai Nahi"
            subtitle='Neeche "Dawai Add Karo" tab se dawai add karo'
          />
        ) : (
          <View style={styles.list}>
            {medicines.map(m => (
              <MedicineCard
                key={m.id}
                medicine={m}
                onPress={() => navigation.navigate('MedicineDetail', { medicineId: m.id })}
                onEdit={() => navigation.navigate('EditMedicine', { medicineId: m.id })}
                onDelete={() => handleDelete(m)}
              />
            ))}
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.xl,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  title: {
    ...typography.h1,
    fontSize: 24,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countLabel: {
    ...typography.label,
    marginBottom: spacing.xl,
  },
  list: {
    gap: 0,
  },
});

export default MedicinesScreen;
