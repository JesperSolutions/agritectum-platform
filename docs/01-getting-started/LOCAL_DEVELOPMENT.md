# 🚀 Local Development with Firebase Emulators

This guide explains how to develop locally using Firebase Emulators - a completely **FREE** way to test your app without affecting production data or incurring any costs.

## ✅ What's Already Set Up

All configuration files have been updated:

- ✅ `firebase.json` - Emulator configuration added
- ✅ `src/config/firebase.ts` - Auto-connects to emulators in dev mode
- ✅ `.gitignore` - Emulator data excluded from Git
- ✅ `package.json` - New scripts added

## 🎯 Benefits

1. **100% FREE** - No Firebase costs whatsoever
2. **Safe Testing** - Never touch production data
3. **Offline Development** - Work without internet
4. **Fast Reset** - Clear all data instantly
5. **Unlimited Storage** - No limits on local storage

## 📋 Quick Start

### Step 1: Start Firebase Emulators

Open a terminal and run:

```bash
npm run emulators
```

This will start:

- **Auth Emulator** on port 9099
- **Firestore Emulator** on port 8080
- **Storage Emulator** on port 9199
- **Functions Emulator** on port 5001
- **Emulator UI** on port 4000 (http://localhost:4000)

### Step 2: Start Development Server

Open a **new terminal** (keep emulators running) and run:

```bash
npm run dev
```

Your app will now connect to local emulators instead of production Firebase!

### Step 3: Open the App

- **Your App**: http://localhost:5173
- **Emulator UI**: http://localhost:4000

## 🎮 Daily Workflow

### Starting Development

```bash
# Terminal 1: Start emulators
npm run emulators

# Terminal 2: Start dev server
npm run dev
```

### With Data Persistence

To save emulator data between sessions:

```bash
# Instead of 'npm run emulators', use:
npm run emulators:export

# This will:
# - Import previous data on start
# - Export data when you stop (Ctrl+C)
```

## 🗂️ Emulator UI Features

Visit http://localhost:4000 to access:

1. **Authentication** - View/create test users
2. **Firestore** - Browse and edit documents
3. **Storage** - View uploaded files
4. **Logs** - See all Firebase operations

## 🧪 Creating Test Data

### Option 1: Through the App

1. Start emulators
2. Open your app (http://localhost:5173)
3. Create users, reports, etc. normally
4. Data stays in emulators

### Option 2: Through Emulator UI

1. Open http://localhost:4000
2. Go to Authentication
3. Add test users manually
4. Go to Firestore
5. Add test documents

### Option 3: Export/Import

Save your test data:

```bash
# Export current emulator data
firebase emulators:export ./emulator-data

# Import data when starting
firebase emulators:start --import=./emulator-data
```

## 🔄 Switching Between Environments

### Local Development (Emulators)

```bash
npm run emulators  # Terminal 1
npm run dev        # Terminal 2
```

### Production Testing

```bash
# Stop emulators (Ctrl+C)
npm run dev        # Connects to production
```

The app automatically detects if emulators are running!

## 📊 Available Commands

| Command                    | Description                           |
| -------------------------- | ------------------------------------- |
| `npm run emulators`        | Start emulators (no data persistence) |
| `npm run emulators:export` | Start emulators with data save/load   |
| `npm run dev`              | Start dev server                      |
| `npm run build`            | Build for production                  |
| `npm run deploy`           | Deploy to production Firebase         |
| `npm run deploy:rules`     | Deploy only security rules            |

## 🎨 Visual Indicators

When running in development mode, you'll see:

- Console logs: "🔥 Connecting to Firebase Emulators..."
- Console logs: "✅ Connected to Firebase Emulators"
- Console logs: "📊 Emulator UI: http://localhost:4000"

If emulators aren't running, you'll see:

- Warning: "⚠️ Could not connect to emulators"

## 🔧 Troubleshooting

### Emulators won't start

```bash
# Kill any processes using the ports
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process

# Or change ports in firebase.json
```

### App connects to production instead of emulators

1. Make sure emulators are running (check http://localhost:4000)
2. Restart your dev server (`npm run dev`)
3. Check console for "✅ Connected to Firebase Emulators"

### Clear all emulator data

```bash
# Stop emulators (Ctrl+C)
# Delete emulator data
rm -rf emulator-data

# Restart emulators
npm run emulators
```

## 🚀 Working on Any Device

### On This Device

```bash
git pull origin main
npm install
npm run emulators    # Terminal 1
npm run dev          # Terminal 2
```

### On Another Device

```bash
# Clone/pull latest
git clone <repo-url>
cd Taklaget
npm install

# Start developing
npm run emulators    # Terminal 1
npm run dev          # Terminal 2
```

The emulator data is in `.gitignore`, so each device has its own test data!

## 📝 Best Practices

1. **Always use emulators for development** - Never test directly on production
2. **Export your test data** - Use `npm run emulators:export` to save test scenarios
3. **Commit your code** - Push to GitHub regularly
4. **Test before deploying** - Build and test locally before deploying to production

## 🎯 Production Deployment

When ready to deploy:

```bash
# Build production bundle
npm run build

# Deploy to production Firebase
npm run deploy

# Or just hosting
firebase deploy --only hosting
```

## 📚 More Information

- [Firebase Emulator Suite Docs](https://firebase.google.com/docs/emulator-suite)
- [Firestore Emulator](https://firebase.google.com/docs/emulator-suite/connect_firestore)
- [Storage Emulator](https://firebase.google.com/docs/emulator-suite/connect_storage)

---

## 💡 Quick Reference

### Starting Development

```bash
npm run emulators  # Start emulators
npm run dev        # Start dev server (new terminal)
```

### URLs

- App: http://localhost:5173
- Emulator UI: http://localhost:4000

### Stop Everything

- Press `Ctrl+C` in both terminals

---

**Happy Coding!** 🚀 You now have a completely free local development environment!
