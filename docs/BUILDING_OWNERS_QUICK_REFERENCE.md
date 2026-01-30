# 🏢 Building Owners Portal - Quick Reference

## ✨ What's New

Building owners can now **add their own buildings** directly in the portal. Roofers and branch admins automatically see these buildings.

## 🎯 Quick Links

- **Full Feature Docs**: [`docs/BUILDING_OWNERS_PORTAL.md`](./BUILDING_OWNERS_PORTAL.md)
- **Implementation Summary**: [`docs/BUILDING_OWNERS_FEATURE_SUMMARY.md`](./BUILDING_OWNERS_FEATURE_SUMMARY.md)
- **Building Service**: `src/services/buildingService.ts`
- **Portal Component**: `src/components/portal/BuildingsList.tsx`

## 🚀 User Journeys

### Building Owner
```
Portal → Buildings → + Add Building
  ↓
Enter: Name, Address, Type, Roof Info
  ↓
System auto-geocodes address
  ↓
Building saved & visible in list
```

### Roofer
```
Schedule → Create Appointment
  ↓
Building dropdown shows customer buildings
  ↓
Select customer building
  ↓
Create appointment/visit
```

### Branch Admin
```
Admin → Buildings (all in branch)
  ↓
See both admin-created & customer-added buildings
  ↓
Manage, assign, or modify
```

## 📊 Database Model

```typescript
// Minimal example
{
  id: "string",
  name: "Main Office",
  address: "123 Main St, Copenhagen",
  customerId: "comp_123",  // Customer owner
  createdAt: "2026-01-27T10:30:00Z",
  createdBy: "user_id"
}
```

## 🔐 Security

| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| Owner | Own | Own | Own | Own |
| Roofer | ❌ | Branch | Branch | ❌ |
| Admin | ✅ | Branch | Branch | ✅ |
| Super | ✅ | All | All | ✅ |

## 📁 Key Files

```
src/
├── types/index.ts                          # Building interface
├── services/buildingService.ts              # Service logic
│   └── getVisibleBuildingsForBranch()       # NEW: For roofers
├── components/portal/
│   ├── BuildingsList.tsx                    # Owner UI
│   ├── BuildingDetail.tsx                   # Detail view
│   └── BuildingMap.tsx                      # Map display
└── components/schedule/
    └── AppointmentForm.tsx                  # Uses buildings

firestore.rules                              # Security rules
firestore.indexes.json                       # Query indexes
```

## 🔍 Visibility Rules

- **Customer sees**: Only own buildings
- **Roofer sees**: All buildings in their branch (including customer-added)
- **Admin sees**: All buildings in their branch
- **Super sees**: All buildings everywhere

## 💾 New Query Function

```typescript
// For roofers: Get all visible buildings in a branch
const buildings = await getVisibleBuildingsForBranch(branchId);

// For customers: Get own buildings
const myBuildings = await getBuildingsByCustomer(customerId);

// For admins: Get all in branch
const branchBuildings = await getBuildingsByBranch(branchId);
```

## ⚡ Key Features

✅ **Auto-Geocoding**: Address → GPS coordinates (automatic)  
✅ **Role-Based Access**: Firestore security rules enforce permissions  
✅ **Fast Queries**: Optimized Firestore indexes  
✅ **Error Handling**: Graceful fallbacks if API unavailable  
✅ **Audit Trail**: Tracks creation user and timestamp  

## 🧪 Testing Checklist

- [ ] Can create building as customer
- [ ] Building appears in list
- [ ] Roofer can see building in appointments
- [ ] Admin can see all buildings
- [ ] Edit/delete works correctly
- [ ] Permissions prevent unauthorized access
- [ ] Geocoding finds address

## 🐛 Troubleshooting

### "Building not visible to roofer"
**Check**: Does building have matching branchId?

### "Permission denied"
**Check**: Is user's role correct? Is branchId set?

### "Address not geocoding"
**Check**: Address must be 5+ characters. System continues without coordinates.

## 📞 Support

See complete documentation in:
- `docs/BUILDING_OWNERS_PORTAL.md` - Full details
- `docs/BUILDING_OWNERS_FEATURE_SUMMARY.md` - Summary with examples

## ✅ Status

**Production Ready** - Deployed January 27, 2026

---

**Building owners** → Self-serve portal ✨  
**Roofers** → Instant visibility ✨  
**Admins** → Full control ✨
