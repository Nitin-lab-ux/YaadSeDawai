import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import AddMedicineScreen from '../screens/AddMedicineScreen';
import HistoryScreen from '../screens/HistoryScreen';
import MedicinesScreen from '../screens/MedicinesScreen';
import MedicineDetailScreen from '../screens/MedicineDetailScreen';
import EditMedicineScreen from '../screens/EditMedicineScreen';

import { colors, spacing, radius } from '../theme';
import { RootStackParamList, BottomTabParamList } from '../types';

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<BottomTabParamList>();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.navInactive,
      tabBarLabelStyle: styles.tabLabel,
      tabBarIcon: ({ color, focused, size }) => {
        const icons: Record<string, { active: string; inactive: string }> = {
          Home: { active: 'home', inactive: 'home-outline' },
          Add: { active: 'add-circle', inactive: 'add-circle-outline' },
          History: { active: 'calendar', inactive: 'calendar-outline' },
          Medicines: { active: 'medkit', inactive: 'medkit-outline' },
        };
        const iconSet = icons[route.name] || { active: 'ellipse', inactive: 'ellipse-outline' };
        const iconName = focused ? iconSet.active : iconSet.inactive;
        
        if (route.name === 'Add') {
          // Special center button
          return (
            <View style={styles.addTabIcon}>
              <Ionicons name="add" size={28} color="#fff" />
            </View>
          );
        }
        
        return <Ionicons name={iconName as any} size={22} color={color} />;
      },
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ title: 'Aaj', tabBarLabel: 'Aaj' }}
    />
    <Tab.Screen
      name="Add"
      component={AddMedicineScreen}
      options={{ title: 'Dawai Add Karo', tabBarLabel: 'Add Karo' }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{ title: 'History', tabBarLabel: 'History' }}
    />
    <Tab.Screen
      name="Medicines"
      component={MedicinesScreen}
      options={{ title: 'Dawaiyan', tabBarLabel: 'Dawaiyan' }}
    />
  </Tab.Navigator>
);

// ─── Root Stack Navigator ─────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => (
  <NavigationContainer
    theme={{
      dark: true,
      colors: {
        primary: colors.primary,
        background: colors.bg,
        card: colors.navBg,
        text: colors.textPrimary,
        border: colors.border,
        notification: colors.primary,
      },
    }}
  >
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen
        name="MedicineDetail"
        component={MedicineDetailScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="EditMedicine"
        component={EditMedicineScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.navBg,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 84 : 64,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  addTabIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 10,
  },
});

export default AppNavigator;
