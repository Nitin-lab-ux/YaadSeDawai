# 💊 Yaad se Dawai — Medicine Reminder App

> Hindi + English + Hinglish voice & text commands → automatic schedule → local notifications

---

## 🏗️ Project Architecture

```
yaad-se-dawai/
├── App.tsx                          # Entry point — init DB + notifications
├── app.json                         # Expo config, permissions, plugins
├── package.json
├── tsconfig.json
├── babel.config.js
│
└── src/
    ├── types/
    │   └── index.ts                 # All TypeScript interfaces
    │
    ├── constants/
    │   └── hindi.ts                 # Hindi/Hinglish keyword maps
    │
    ├── utils/
    │   └── helpers.ts               # formatTime, generateId, colors, etc.
    │
    ├── db/
    │   └── database.ts              # SQLite: init, CRUD for medicines + logs
    │
    ├── services/
    │   ├── parserService.ts         # NLP parser: text → ParsedMedicine
    │   ├── notificationService.ts   # Expo notifications: schedule/cancel
    │   └── reminderService.ts       # High-level: create/edit/delete + adherence
    │
    ├── theme/
    │   └── index.ts                 # Colors, typography, spacing, shadows
    │
    ├── components/
    │   ├── MedicineCard.tsx         # Medicine list item card
    │   ├── DoseCard.tsx             # Today dose card with Taken/Skip/Snooze
    │   ├── VoiceInput.tsx           # Mic button with animation
    │   ├── AdherenceSummary.tsx     # Weekly bar chart
    │   └── EmptyState.tsx           # Empty state placeholder
    │
    ├── screens/
    │   ├── HomeScreen.tsx           # Today's schedule + progress + adherence
    │   ├── AddMedicineScreen.tsx    # Text/Voice input + parse preview + save
    │   ├── MedicinesScreen.tsx      # All medicines list
    │   ├── HistoryScreen.tsx        # 14-day dose log history
    │   └── MedicineDetailScreen.tsx # Single medicine stats + history
    │
    └── navigation/
        └── AppNavigator.tsx         # Bottom tabs + stack navigator
```

---

## 🚀 Setup Instructions

### Prerequisites
```bash
node >= 18
npm >= 9
Java JDK 17 (for Android build)
Android Studio (for emulator or device)
```

### Step 1: Install Expo CLI & EAS CLI
```bash
npm install -g expo-cli eas-cli
```

### Step 2: Clone & Install Dependencies
```bash
cd yaad-se-dawai
npm install
```

### Step 3: Create placeholder assets (required)
```bash
mkdir -p assets
# Add these 4 files to ./assets/ (use any placeholder 1024x1024 PNG):
# - icon.png
# - splash.png
# - adaptive-icon.png
# - notification-icon.png  (96x96 white icon on transparent)
```

### Step 4: Run on Android
```bash
# Option A: Expo Go (no voice, limited notifications)
npx expo start --android

# Option B: Development Build (FULL FEATURES - recommended)
npx expo run:android
```

---

## 📱 Running with Full Features (Recommended)

Expo Go doesn't support native voice recognition.  
To get full voice recognition + exact notifications, use a **development build**:

```bash
# 1. Build dev client APK
npx expo run:android --variant debug

# 2. Install the generated APK on your device/emulator
# Find at: android/app/build/outputs/apk/debug/app-debug.apk

# 3. Start dev server
npx expo start --dev-client
```

---

## 🏭 Production APK Build

### Option A: Local Build (requires Android Studio + JDK 17)
```bash
# Generate a keystore (first time only)
cd android
keytool -genkey -v -keystore release.keystore -alias yaadsedawai -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
cd ..
npx expo run:android --variant release
# APK: android/app/build/outputs/apk/release/app-release.apk
```

### Option B: EAS Build (cloud, no local JDK needed) ✅ Easier
```bash
# 1. Login to Expo
eas login

# 2. Configure project (run once)
eas build:configure

# 3. Build APK (preview profile = APK, not AAB)
eas build --platform android --profile preview

# 4. Build AAB for Play Store
eas build --platform android --profile production
```

### Option C: GitHub Actions se 1-click APK build ✅ (sabse easy)
1. Expo account me login karo aur token banao:
   - https://expo.dev/accounts/[your-username]/settings/access-tokens
2. GitHub repo me jao → **Settings → Secrets and variables → Actions**
3. New secret add karo:
   - Name: `EXPO_TOKEN`
   - Value: Expo access token
4. GitHub me **Actions** tab kholo
5. Workflow run karo: **Build Android APK (EAS)**
6. Build complete hone par APK link workflow summary me mil jayega

Workflow file: `.github/workflows/android-apk.yml`

### eas.json for EAS builds:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

---

## 🎤 Voice Recognition Setup

The app uses `@react-native-voice/voice` which uses Android's built-in speech recognition.

**For offline voice recognition on Android:**
1. Go to Settings → General Management → Language → Speech Recognition
2. Download "Hindi" offline language pack
3. The app will now work without internet for voice input

Voice recognition falls back gracefully if not available (shows text prompt).

---

## 🔔 Notification Permissions

The app requests permissions on first launch. If denied:
- Android: Settings → Apps → Yaad se Dawai → Notifications → Enable
- Also enable: Settings → Apps → Yaad se Dawai → Battery → Unrestricted (for background delivery)

For exact alarm scheduling on Android 12+:
- Settings → Apps → Special App Access → Alarms & Reminders → Enable for Yaad se Dawai

---

## 🧪 Test Checklist — Offline Behavior

### ✅ Core Offline Tests
- [ ] Add medicine with text (no internet) → saves to SQLite
- [ ] Add medicine with voice (no internet, Hindi pack installed) → parses + saves
- [ ] Notification fires at scheduled time with phone in airplane mode
- [ ] Mark dose as taken → log persists in SQLite
- [ ] Skip dose → logged and visible in history
- [ ] Snooze dose → notification fires 10 min later
- [ ] Restart app → all medicines + history intact

### ✅ Parser Tests
| Input | Expected |
|-------|---------|
| `Metformin 500mg subah 8 aur raat 9 khane ke baad` | Name: Metformin, 500mg, 08:00 + 21:00, after_meal |
| `Dolo 650 daily 9 am` | Name: Dolo, 650mg, 09:00, daily |
| `BP wali dawai shaam 7:30` | Name: BP Medicine, 19:30 |
| `Kal se Vitamin D 1 tab subah khali pet` | Name: Vitamin D, 1 tablet, 08:00, empty_stomach, startDate: tomorrow |
| `Omeprazole 20mg subah khali pet roz` | Name: Omeprazole, 20mg, 08:00, empty_stomach, daily |

### ✅ Notification Tests
- [ ] Schedule appears in Android notification drawer
- [ ] Action buttons (✅ Le Li, ⏰ 10 min, ⏭️ Skip) work from notification
- [ ] Notification repeats daily at same time
- [ ] Deleting medicine cancels its notifications

### ✅ UI/UX Tests
- [ ] Dose progress bar updates in real time
- [ ] Weekly adherence chart shows correct data
- [ ] Medicine detail shows accurate taken/skip counts
- [ ] Pull-to-refresh works on all screens
- [ ] Dark theme renders correctly on all Android versions

---

## 📋 Supported Commands (Parser)

### Basic
```
Dolo 650 subah 9
Metformin 500mg raat 9
```

### Multiple times
```
Metformin 500mg subah 8 aur raat 8
BP ki dawai subah 7 dopahar 2 aur raat 9
```

### Meal relation
```
Omeprazole 20mg subah khali pet
Vitamin D 1 tab khane ke saath
Paracetamol 650mg khane ke baad
```

### Start date
```
Kal se Azithromycin 500mg daily 9 am
Aaj se Metformin 500mg subah aur raat
```

### Frequency
```
Calcium tablet har roz shaam 6
Vitamin D weekly Sunday 10 am
```

### Hinglish mix
```
Apni BP wali dawai shaam 7:30 lena
Sugar ki medicine subah 7 khali pet
```

---

## 🌱 Future Improvements

1. **Drug interaction checker** — offline DB of common interactions
2. **Caregiver mode** — manage medicines for family members
3. **Photo of prescription** — OCR to auto-extract medicines
4. **Refill reminders** — track remaining quantity
5. **Export PDF report** — share with doctor
6. **Wearable integration** — vibrate reminder on smartwatch
7. **WhatsApp bot** — send reminders via WhatsApp
8. **Multiple languages** — Bengali, Tamil, Gujarati support
9. **Widget** — homescreen dose widget
10. **Backup/Restore** — Google Drive sync for data portability
11. **AI drug information** — local LLM for medicine info (no internet)
12. **Smart scheduling** — suggest optimal times based on drug type
13. **Symptom tracker** — log symptoms alongside doses
14. **Doctor appointment reminders** — linked to medicine courses

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo-sqlite` | Offline SQLite database |
| `expo-notifications` | Local push notifications |
| `expo-speech` | TTS voice confirmations |
| `@react-native-voice/voice` | STT voice recognition |
| `expo-haptics` | Haptic feedback on actions |
| `@react-navigation/native` | Navigation |
| `date-fns` | Date manipulation |

---

## 🔐 Permissions Required

| Permission | Why |
|-----------|-----|
| `RECORD_AUDIO` | Voice command input |
| `RECEIVE_BOOT_COMPLETED` | Reschedule notifications after reboot |
| `SCHEDULE_EXACT_ALARM` | Precise dose timing |
| `POST_NOTIFICATIONS` | Show dose reminders |
| `VIBRATE` | Haptic feedback |

---

*Built with ❤️ for Indian patients who need medicine reminders in their own language.*
