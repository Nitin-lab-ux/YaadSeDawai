# Yaad se Dawai 💊

Offline-first medicine reminder app (Hindi + English + Hinglish) with AI-style auto schedule parsing.

## What works now
- Text command to auto-create medicine reminders
- Voice command input (speech recognition module wired)
- Daily local notifications (offline schedule)
- Local data storage (AsyncStorage)
- Delete medicine entries

## Example commands
- `Kal se Metformin 500mg subah 8 aur raat 8 khane ke baad`
- `Dolo 650 daily 9 am`
- `BP wali dawai subah 7:30 aur shaam 7:30`

## Tech
- Expo + React Native + TypeScript
- expo-notifications
- expo-speech-recognition
- expo-speech
- AsyncStorage

## Offline behavior
- Saved medicine list works fully offline
- Notifications work offline (once scheduled)
- Voice recognition uses device speech service (offline support device dependent)

## Integrated references
As requested, these repos were integrated as architecture references for future upgrades:
- https://github.com/VoltAgent/awesome-openclaw-skills
- https://github.com/supermemoryai/openclaw-supermemory

Planned usage in next iteration:
- Better agentic command parsing
- Smarter memory/context for medicine habits
- Advanced skills-driven workflows

## Run
```bash
npm install
npx expo start
```

## Android build
```bash
npx expo run:android
```
(Needs Android SDK setup)

## Direct APK install via GitHub flow
To get installable APK links from your repo workflow:

1. Create Expo account and login once locally:
```bash
npx expo login
npx eas login
```
2. In GitHub repo settings → Secrets and variables → Actions, add:
- `EXPO_TOKEN` (from Expo account access token)
3. Push to `main` or run workflow manually:
- `.github/workflows/android-apk.yml`
4. Workflow will build APK using EAS (`preview` profile).
5. Share the generated install link from EAS build output in Actions logs.

This gives a production-like installable APK pipeline from GitHub updates.
