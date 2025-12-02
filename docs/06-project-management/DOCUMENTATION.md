# 📚 TagLaget - Complete Documentation

**Production App:** https://taklaget-service-app.web.app  
**Last Updated:** October 1, 2025

---

## 🚀 Quick Navigation

### **For Developers**
- **[README.md](README.md)** - Project overview and quick start
- **[Local Development](docs/LOCAL_DEVELOPMENT.md)** - Daily development workflow
- **[Documentation Index](docs/README.md)** - All documentation organized

### **For Administrators**
- **[System README](docs/SYSTEM_README.md)** - System architecture
- **[Permission Hierarchy](docs/PERMISSION_HIERARCHY.md)** - User roles and access
- **[Email System](docs/EMAIL_SYSTEM_README.md)** - Email configuration

### **For QA/Testing**
- **[QA Testing Guide](docs/QA_TESTING_GUIDE.md)** - Testing procedures
- **[QA Quick Reference](docs/QA_QUICK_REFERENCE.md)** - Quick commands

---

## 🏗️ **System Overview**

TagLaget is a professional roof inspection management system built with:

- **Frontend:** React 18 + TypeScript + Tailwind CSS + Material Design
- **Backend:** Firebase (Firestore, Auth, Storage, Functions)
- **UI Design:** Material Design principles with Roboto font
- **Region:** EU-compliant (europe-west1 functions, europe-west3 Firestore)

### **Key Features:**
- Multi-branch management (3 branches)
- Role-based access (Superadmin, Branch Admin, Inspector)
- Offline-first PWA
- Smart PDF export with Danish CVR compliance
- Real-time notifications
- Email automation with MailerSend

---

## 🎨 **Material Design Implementation**

**Status:** ✅ Complete and deployed (October 1, 2025)

- **[Implementation Checklist](MATERIAL_DESIGN_IMPLEMENTATION.md)** - 171-item detailed checklist
- **[Completion Summary](MATERIAL_DESIGN_COMPLETE.md)** - Usage guide and results

**Visual Changes:**
- Google Material Design look and feel
- Roboto font throughout
- 6-level elevation system
- Consistent spacing and typography
- Smooth 250ms transitions
- Responsive at all resolutions

---

## 📖 **Essential Documentation**

### **Development Setup**
1. Clone repository
2. Run `npm install`
3. Follow [Emulator Setup Guide](docs/EMULATOR_SETUP_GUIDE.md)
4. Start developing with `npm run emulators` + `npm run dev`

### **Production Deployment**
```bash
npm run build
firebase deploy --only hosting
```

### **User Roles**
- **Superadmin** (Level 2): Full system access
- **Branch Admin** (Level 1): Branch-specific management
- **Inspector** (Level 0): Report creation

---

## 🗂️ **Documentation Structure**

All documentation is organized in the **[docs/](docs/)** folder:

- **[docs/README.md](docs/README.md)** - Complete documentation index
- **Current documentation** - Active guides and references
- **[docs/archive/](docs/archive/)** - Historical docs and completed fixes

---

## 📞 **Quick Reference**

### **Default Credentials (After Setup)**
- Superadmin: `admin@taklaget.onmicrosoft.com` / Check with team
- Branch Admin: `malmo.manager@taklaget.se` / Check with team  
- Inspector: `petra.petersson@taklaget.se` / Check with team

### **Important URLs**
- **Production:** https://taklaget-service-app.web.app
- **Local Dev:** http://localhost:5173
- **Emulator UI:** http://localhost:4000
- **Firebase Console:** https://console.firebase.google.com/project/taklaget-service-app

### **Tech Stack**
- React 18 + TypeScript
- Tailwind CSS + Material Design
- Radix UI components
- Firebase (all services)
- Vite build tool

---

**For detailed information, see [docs/README.md](docs/README.md)**

