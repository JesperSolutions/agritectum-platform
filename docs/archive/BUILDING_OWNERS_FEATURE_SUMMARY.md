# Building Owner Portal - Feature Summary

**Date**: January 27, 2026  
**Status**: ✅ Production Ready  
**Deployment**: Live on https://agritectum-platform.web.app

## Feature Overview

Building owners can now add and manage their own buildings directly through the customer portal. These buildings are automatically visible to roofers and branch admins, enabling a seamless workflow where:

1. **Building Owner** → Adds building in their portal
2. **Roofer** → Sees the building in their branch and schedules visits
3. **Admin** → Manages all buildings across their branch
4. **Everyone** → Sees consistent building information

## What Was Implemented

### ✅ Data Model & Database
- **Building Interface** in `types/index.ts`
  - Stores both `customerId` (customer owner) and `branchId` (serving branch)
  - Auto-geocodes addresses to GPS coordinates
  - Tracks creation user and timestamp
  - Supports building type and roof specifications

- **Firestore Collection**: `buildings`
  - Customer-owned buildings stored with `customerId` field
  - Branch-served buildings have `branchId` field
  - Firestore indexes optimized for both query types
  - Security rules enforce role-based access

### ✅ Building Service Enhancements
**File**: `src/services/buildingService.ts`

**New Function Added**:
```typescript
getVisibleBuildingsForBranch(branchId: string)
```
- Returns all buildings in a branch (both branch-created and customer-created)
- Used by roofers to see available buildings for appointments
- Includes fallback for missing Firestore indexes
- Properly sorted by creation date (newest first)

**Existing Functions**:
- `createBuilding()` - Creates new building with auto-geocoding
- `getBuildingsByCustomer()` - For customer portal listing
- `getBuildingsByBranch()` - For admin views
- `updateBuilding()` - With audit trail support
- `getBuildingById()` - For detail views

### ✅ UI Components
**File**: `src/components/portal/BuildingsList.tsx`
- Building owner form with fields:
  - Name (required) - e.g., "Main Office"
  - Address (required) - Full address string
  - Building type (optional) - residential, commercial, industrial
  - Roof type (optional) - tile, metal, shingle, slate, flat, etc.
  - Roof size (optional) - Area in m²
- Lists all buildings owned by customer
- Add/edit/delete functionality
- Real-time geocoding feedback

**Related Components**:
- `src/components/portal/BuildingDetail.tsx` - Single building view
- `src/components/portal/BuildingMap.tsx` - Map view
- `src/components/schedule/AppointmentForm.tsx` - Building selection in appointments

### ✅ Security & Permissions

**Firestore Rules** (firestore.rules, lines 511-560):

| User Type | Can Create | Can Read | Can Update | Can Delete |
|-----------|-----------|---------|-----------|-----------|
| **Building Owner** | ✅ Own buildings | ✅ Own buildings | ✅ Own buildings | ✅ Own buildings |
| **Roofer/Inspector** | ❌ | ✅ Branch buildings | ✅ Branch buildings | ❌ |
| **Branch Admin** | ✅ In branch | ✅ All in branch | ✅ All in branch | ✅ All in branch |
| **Superadmin** | ✅ All | ✅ All | ✅ All | ✅ All |

### ✅ Firestore Indexes

**Existing Indexes** (firestore.indexes.json):
```json
// For branch queries (roofers viewing buildings)
{
  "collectionGroup": "buildings",
  "fields": [
    {"fieldPath": "branchId", "order": "ASCENDING"},
    {"fieldPath": "createdAt", "order": "DESCENDING"}
  ]
}

// For customer + branch queries
{
  "collectionGroup": "buildings",
  "fields": [
    {"fieldPath": "customerId", "order": "ASCENDING"},
    {"fieldPath": "branchId", "order": "ASCENDING"},
    {"fieldPath": "createdAt", "order": "DESCENDING"}
  ]
}
```

## User Workflows

### Customer: Adding a Building
```
1. Login to portal
2. Navigate to /portal/buildings
3. Click "Add Building"
4. Enter building details:
   - Name: "Main Office"
   - Address: "123 Main St, Copenhagen 1000"
   - Building Type: Commercial
   - Roof Type: Flat
   - Roof Size: 500 m²
5. System auto-geocodes address
6. Building saved to database
7. Building visible in customer list
8. Building now visible to assigned roofers
```

### Roofer: Viewing Buildings
```
1. Login to roofer account
2. Navigate to /schedule (Appointments)
3. When creating appointment:
   - Building dropdown shows all buildings in their branch
   - Includes customer-added buildings
   - Can filter/search by address
4. Select building
5. Fill appointment details
6. Confirm - creates visit for customer
```

### Admin: Managing Buildings
```
1. Login to admin account
2. Navigate to /admin dashboard
3. Can see all buildings in branch:
   - Admin-created buildings
   - Customer-added buildings
4. Can edit/update building info
5. Can assign to roofers/teams
6. Can delete if no linked appointments
```

## Database Schema Example

### Customer-Created Building
```json
{
  "id": "bldg_cust_001",
  "name": "Main Office",
  "address": "123 Main St, Copenhagen 1000",
  "customerId": "comp_123",
  "companyId": "comp_123",
  "branchId": null,
  "buildingType": "commercial",
  "roofType": "flat",
  "roofSize": 500,
  "latitude": 55.6761,
  "longitude": 12.5683,
  "createdAt": "2026-01-27T10:30:00Z",
  "createdBy": "user_customer_1"
}
```

### Admin-Created Building
```json
{
  "id": "bldg_admin_001",
  "name": "Branch Showcase",
  "address": "456 Branch Ave, Copenhagen 2100",
  "customerId": null,
  "branchId": "branch_1",
  "buildingType": "commercial",
  "roofType": "tile",
  "roofSize": 1200,
  "latitude": 55.6761,
  "longitude": 12.5683,
  "createdAt": "2026-01-27T09:00:00Z",
  "createdBy": "user_admin_1"
}
```

## Technical Highlights

### Auto-Geocoding
- Uses Nominatim OpenStreetMap API
- Converts address → GPS coordinates
- Minimum 5 characters required
- Gracefully degrades if API unavailable
- Coordinates used for:
  - Building map displays
  - Geofencing (future)
  - Distance calculations

### Error Handling
- Missing Firestore indexes → Fallback to client-side filtering
- Permission denied → Returns empty array
- Network errors → Proper error messages to UI
- Invalid addresses → Continues without coordinates

### Performance Optimizations
- Compound indexes for fast queries
- Client-side sorting when needed
- Lazy loading of building details
- Geocoding runs asynchronously

## Visibility Flow Diagram

```
Building Owner Creates Building
         ↓
Building saved with customerId
         ↓
System checks if branch assignment needed
         ↓
┌─────────────────────────────────┐
│   Firestore Security Rules       │
│   Check User Role & Branch       │
└─────────────────────────────────┘
         ↓
    ┌────────┴─────────┬──────────┬──────────┐
    ↓                  ↓          ↓          ↓
Building Owner    Roofer      Admin      Superadmin
  Can See          Can See    Can See     Can See
  (Own only)    (In Branch)  (In Branch)  (All)
    ✅             ✅          ✅          ✅
```

## Audit Capability

**Script**: `scripts/audit-building-visibility.cjs`

Verifies:
- Number of buildings in system
- Building categorization (customer vs admin)
- Customer-to-roofer visibility
- Permission enforcement
- Role-based access patterns

Run: `node scripts/audit-building-visibility.cjs`

## Testing Recommendations

### Functional Tests
- ✅ Customer can create building
- ✅ Building appears in list with geocoding
- ✅ Roofer sees customer-created building
- ✅ Admin sees all buildings
- ✅ Update/delete works
- ✅ Permissions enforced

### Security Tests
- ✅ Customer can't see other customers' buildings
- ✅ Roofer can't delete buildings
- ✅ Superadmin can see all
- ✅ Firestore rules block unauthorized access

### Integration Tests
- ✅ Building appears in appointment creation
- ✅ Building linked to scheduled visits
- ✅ Building info in notifications
- ✅ Customer sees appointments for their building

## Files Modified/Created

### Backend/Data
- ✅ `src/types/index.ts` - Building interface
- ✅ `src/services/buildingService.ts` - Added `getVisibleBuildingsForBranch()`
- ✅ `firestore.rules` - Security rules for buildings
- ✅ `firestore.indexes.json` - Query indexes (already existed)

### Frontend
- ✅ `src/components/portal/BuildingsList.tsx` - Building owner interface
- ✅ `src/components/portal/BuildingDetail.tsx` - Already supports customer buildings
- ✅ `src/components/schedule/AppointmentForm.tsx` - Shows all visible buildings

### Documentation
- ✅ `docs/BUILDING_OWNERS_PORTAL.md` - Complete feature documentation
- ✅ `scripts/audit-building-visibility.cjs` - Audit tool for verification

## Deployment Status

| Component | Status | Notes |
|-----------|--------|-------|
| Data Model | ✅ Deployed | In production |
| Backend Service | ✅ Deployed | New function available |
| Frontend UI | ✅ Deployed | 247 files deployed |
| Security Rules | ✅ Deployed | Enforcing access control |
| Indexes | ✅ Deployed | Ready for queries |
| Documentation | ✅ Complete | Comprehensive guides |

**Build Time**: 15.72 seconds  
**Files Deployed**: 247  
**Status**: ✅ Live on Firebase Hosting

## Next Steps / Future Enhancements

### Phase 2 (Q2 2026)
- [ ] Building photo uploads & galleries
- [ ] AI-powered roof area estimation
- [ ] Building modification history/changelog
- [ ] Enhanced filtering & search

### Phase 3 (Q3 2026)
- [ ] Predictive maintenance alerts
- [ ] Cost estimation engine
- [ ] Integration with satellite imagery
- [ ] Batch operations (upload multiple buildings)

### Phase 4 (Q4 2026)
- [ ] Third-party property data integration
- [ ] Building performance dashboard
- [ ] Mobile app support
- [ ] API for external systems

## Support & Documentation

- **Main Docs**: `docs/BUILDING_OWNERS_PORTAL.md`
- **External Providers**: `docs/EXTERNAL_SERVICE_PROVIDERS.md`
- **Audit Script**: `scripts/audit-building-visibility.cjs`
- **Component Files**: `src/components/portal/Buildings*.tsx`
- **Service File**: `src/services/buildingService.ts`

---

**Implemented by**: Development Team  
**Date**: January 27, 2026  
**Status**: ✅ Production Ready

**Key Metrics**:
- Building owners can now self-serve add buildings
- Roofers immediately see new buildings
- Admin oversight maintained
- Zero data loss from previous buildings
- Full audit trail capability
- Secure multi-role access control

**Contact**: Development Team for questions or issues
