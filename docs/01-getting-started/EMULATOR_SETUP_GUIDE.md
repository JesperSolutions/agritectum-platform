# Firebase Emulators - First Time Setup

## 🎯 What You Need to Do ONCE

Firebase Emulators are already configured, but you need to initialize them the first time.

## Step-by-Step Setup

### 1. Make Sure Firebase CLI is Installed

```bash
firebase --version
```

If you get an error, install Firebase CLI:

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase (if not already)

```bash
firebase login
```

### 3. Initialize Emulators

Run this command in your project root:

```bash
firebase init emulators
```

When prompted:

1. **"Which Firebase emulators do you want to set up?"**
   - ✅ Authentication Emulator
   - ✅ Firestore Emulator
   - ✅ Storage Emulator
   - ✅ Functions Emulator
   - (Use spacebar to select, Enter to confirm)

2. **"Which port do you want to use for the auth emulator?"**
   - Press Enter (uses default: 9099)

3. **"Which port do you want to use for the firestore emulator?"**
   - Press Enter (uses default: 8080)

4. **"Which port do you want to use for the storage emulator?"**
   - Press Enter (uses default: 9199)

5. **"Which port do you want to use for the functions emulator?"**
   - Press Enter (uses default: 5001)

6. **"Would you like to enable the Emulator UI?"**
   - Yes (press Enter)

7. **"Which port do you want to use for the Emulator UI?"**
   - Press Enter (uses default: 4000)

8. **"Would you like to download the emulators now?"**
   - Yes (press Enter)

This will download the emulator binaries (~300MB).

### 4. Verify Setup

Check that `firebase.json` has the emulators section:

```bash
cat firebase.json
```

You should see the emulators configuration at the bottom.

### 5. Test the Setup

```bash
# Start emulators
npm run emulators
```

You should see:

```
✔  All emulators ready! It is now safe to connect your app.
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect your app. │
│ i  View Emulator UI at http://127.0.0.1:4000                │
└─────────────────────────────────────────────────────────────┘

┌────────────────┬────────────────┬─────────────────────────────────┐
│ Emulator       │ Host:Port      │ View in Emulator UI             │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Authentication │ 127.0.0.1:9099 │ http://127.0.0.1:4000/auth      │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Firestore      │ 127.0.0.1:8080 │ http://127.0.0.1:4000/firestore │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Storage        │ 127.0.0.1:9199 │ http://127.0.0.1:4000/storage   │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Functions      │ 127.0.0.1:5001 │ http://127.0.0.1:4000/functions │
└────────────────┴────────────────┴─────────────────────────────────┘
```

### 6. Open Another Terminal and Start Dev Server

```bash
npm run dev
```

### 7. Open Your Browser

- **App**: http://localhost:5173
- **Emulator UI**: http://localhost:4000

You should see in the browser console:

```
🔥 Connecting to Firebase Emulators...
✅ Connected to Firebase Emulators
📊 Emulator UI: http://localhost:4000
```

## ✅ Done!

You're all set! From now on, just run:

```bash
npm run emulators  # Terminal 1
npm run dev        # Terminal 2
```

## 🎯 Next Steps

1. Create test users in the Emulator UI
2. Create test reports through your app
3. See everything in real-time in the Emulator UI

## 🔧 Troubleshooting

### Port Already in Use

If you get "Port already in use" errors:

**Windows PowerShell:**

```powershell
# Find and kill process on port 8080 (adjust port as needed)
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process
```

**Alternative:** Change ports in `firebase.json`

### Emulators Downloaded but Won't Start

```bash
# Clear Firebase cache
firebase setup:emulators:firestore
firebase setup:emulators:storage
```

### Can't Connect to Emulators

1. Check emulators are running (visit http://localhost:4000)
2. Restart dev server
3. Check browser console for connection messages

## 📝 Common Commands

```bash
# Start emulators
npm run emulators

# Start emulators with data persistence
npm run emulators:export

# Export current data
firebase emulators:export ./emulator-data

# Import data on start
firebase emulators:start --import=./emulator-data

# Clear all data
rm -rf emulator-data
```

---

**Need Help?** Check `docs/LOCAL_DEVELOPMENT.md` for detailed usage guide!
