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

## Direct APK download on GitHub (Recommended: EAS Cloud)
Use workflow: `.github/workflows/eas-cloud-apk-release.yml`

Steps:
1. Repo Settings → Secrets and variables → Actions
2. Add secret: `EXPO_TOKEN`
3. Open **Actions** tab
4. Run workflow **EAS Cloud APK Release**
5. Workflow will build APK on EAS cloud, download it, and attach it to GitHub Release

Direct latest release link:
- `https://github.com/Nitin-lab-ux/Yaad-Se-Dawai/releases/latest`

## Fallback local runner build
If cloud workflow has provider issues, use:
- `.github/workflows/direct-apk-release.yml`
(Gradle-based debug APK build on GitHub runner)
