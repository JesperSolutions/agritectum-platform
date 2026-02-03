# Building Owner Portal - Buildings Feature

## Overview
Building owners can now add their buildings directly through the portal, and these buildings are automatically visible to roofers and branch admins in the platform.

## Architecture

### Data Model
Buildings are stored in the `buildings` Firestore collection with these key fields:

```typescript
{
  id: string;
  name?: string;              // Building name (e.g., "Main Office")
  address: string;            // Physical address
  customerId?: string;        // For customer-owned buildings
  companyId?: string;         // For company-owned buildings
  branchId?: string;          // Links to serving branch
  buildingType?: 'residential' | 'commercial' | 'industrial';
  roofType?: RoofType;
  roofSize?: number;          // m²
  latitude?: number;          // Auto-geocoded
  longitude?: number;         // Auto-geocoded
  createdAt: string;
  createdBy: string;          // User UID who created it
}
```

## User Flows

### 1. Building Owner Creates Building
**Where**: `/portal/buildings`

1. Click "Add Building" button
2. Fill in building information:
   - **Name** (required) - e.g., "Main Office", "Warehouse A"
   - **Address** (required) - Street, city, postal code
   - **Building Type** (optional) - residential, commercial, industrial
   - **Roof Type** (optional) - tile, metal, shingle, slate, flat, etc.
   - **Roof Size** (optional) - area in m²

3. System automatically:
   - Geocodes the address (converts to GPS coordinates)
   - Sets `customerId` to the customer's company/user ID
   - Sets `createdBy` to the current user's UID
   - Records creation timestamp

4. Building appears in customer's building list

### 2. Roofer/Inspector Views Buildings
**Where**: `/schedule` (Appointments page)

1. Roofers see buildings in appointment creation form
2. Building must have matching `branchId`
3. Visibility includes:
   - Branch admin-created buildings
   - Customer-created buildings in their branch area

### 3. Branch Admin Manages Buildings
**Where**: `/admin` dashboard

1. Can view all buildings in their branch
2. Can see both:
   - Admin-created buildings
   - Customer-added buildings for their area
3. Can assign buildings to appointments/visits

## Visibility & Permissions

### Building Owner (Customer)
- ✅ Create buildings for themselves
- ✅ View their own buildings
- ✅ Update their buildings
- ✅ Delete their buildings
- ❌ See roofers/appointments by default (only via scheduled visits)

### Roofer/Inspector
- ✅ View buildings in their branch
- ✅ Create appointments for any building in branch
- ✅ See customer info when building is linked to appointment
- ✅ View building details when visiting

### Branch Admin
- ✅ Create buildings
- ✅ View all buildings in branch
- ✅ Update buildings
- ✅ Delete buildings
- ✅ Assign buildings to roofers
- ✅ View customer buildings in their area

### Superadmin
- ✅ Full access to all buildings across all branches

## Security Rules

**File**: `firestore.rules` (lines 511-560)

### Read Access
```javascript
allow read: if isAuthenticated() && (
  // Customers see own buildings
  (isCustomer() && (
    resource.data.customerId == uid ||
    resource.data.customerId == companyId ||
    resource.data.companyId == companyId
  )) ||
  // Admins/Roofers see buildings in their branch
  (isSuperadmin() || 
   isBranchAdmin() || 
   isInspector()) && resource.data.branchId == userBranchId
)
```

### Create Access
```javascript
allow create: if isAuthenticated() && (
  // Customers create with customerId
  (isCustomer() && request.data.customerId == companyId) ||
  // Admins create with branchId
  (isBranchAdmin() && request.data.branchId == userBranchId)
) && request.data.createdBy == uid
```

### Update/Delete Access
```javascript
allow update/delete: if isAuthenticated() && (
  // Customers can modify own
  (isCustomer() && resource.data.customerId == companyId) ||
  // Admins can modify in their branch
  (isBranchAdmin() && resource.data.branchId == userBranchId)
)
```

## Database Queries

### For Customers (Portal)
**Function**: `getBuildingsByCustomer(customerId)`

Returns buildings where:
- `customerId == companyId || uid`

Used in: Building owner portal list

### For Roofers (Schedule)
**Function**: `getVisibleBuildingsForBranch(branchId)`

Returns buildings where:
- `branchId == userBranchId`

Includes both admin-created and customer-created buildings in that branch.

### For Branch Admins
**Function**: `getBuildingsByBranch(branchId)`

Returns all buildings in their branch, including customer-added ones.

## Service Functions

**File**: `src/services/buildingService.ts`

### `createBuilding(buildingData)`
- Creates new building
- Auto-geocodes address
- Sets timestamps and user info
- Returns building ID

### `getBuildingsByCustomer(customerId, branchId?)`
- Gets buildings owned by customer
- Used in customer portal
- Filters by customerId

### `getBuildingsByBranch(branchId)`
- Gets all buildings in branch
- For admin views
- Includes customer-created buildings

### `getVisibleBuildingsForBranch(branchId)`
- Gets buildings visible to roofers/admins
- Enhanced function for branch portals
- Includes all buildings in branch scope

### `updateBuilding(buildingId, updates)`
- Updates building info
- Records changes in audit trail
- Allows geo-location updates

### `getBuildingById(buildingId)`
- Gets single building by ID
- Used for detail views
- Checks permissions via Firestore rules

## Firestore Indexes

**File**: `firestore.indexes.json` (lines 312-348)

```json
{
  "collectionGroup": "buildings",
  "fields": [
    { "fieldPath": "branchId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "buildings",
  "fields": [
    { "fieldPath": "customerId", "order": "ASCENDING" },
    { "fieldPath": "branchId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

These indexes enable:
- Branch-based queries for roofers
- Customer + branch queries for mixed visibility
- Efficient sorting by creation date

## Components

### BuildingsList.tsx (Portal)
**File**: `src/components/portal/BuildingsList.tsx`

- Display all customer buildings
- Add new building form
- Building filters
- Links to building details

Features:
- Name, address, type display
- Roof info visualization
- Coordinates shown (if available)
- Edit/delete actions

### BuildingDetail.tsx (Portal)
**File**: `src/components/portal/BuildingDetail.tsx`

- Single building view
- Edit form
- Associated appointments/visits
- ESG improvements (if applicable)

## Workflow Integration

### Customer Creation → Roofer Assignment
1. **Day 1**: Customer adds building in portal
2. **Day 2**: System geocodes address, adds to database
3. **Day 2-3**: Branch admin/roofer sees building in schedule
4. **Day 3+**: Roofer creates appointment for that building
5. **Visit**: Customer receives notification of scheduled visit
6. **Post-Visit**: Report/findings shared back to customer

## Common Issues & Solutions

### Issue: Customer-created building not visible to roofers

**Cause**: Building missing `branchId` field

**Solution**: 
1. Ensure building creation sets appropriate branchId
2. Or update query to include both customerId and branchId matches
3. Check Firestore index exists for compound queries

```typescript
// Option A: Set branchId on customer building
buildingData.branchId = await determineBuildingBranch(address);

// Option B: Update query
const customerBuildings = await getBuildingsByCustomer(customerId);
const allBuildings = [...customerBuildings, ...brandsAdminBuildings];
```

### Issue: Permissions denied when viewing buildings

**Cause**: User role/branch mismatch

**Check**:
1. User has correct role (customer/inspector/branchAdmin)
2. User's branchId matches building's branchId
3. Custom claims are set correctly in Firebase Auth
4. Firestore security rules are deployed

### Issue: Geocoding fails

**Solution**:
- Address must have minimum 5 characters
- Uses Nominatim (OpenStreetMap) API
- Falls back gracefully if API unavailable
- Coordinates optional - building can exist without them

## Testing Checklist

- ✅ Customer can create building in portal
- ✅ Building appears in customer's list
- ✅ Roofer can see customer-created building
- ✅ Building shows in appointment creation
- ✅ Address geocoding works
- ✅ Permissions prevent unauthorized access
- ✅ Multiple customers see only own buildings
- ✅ Branch admins see all buildings in their branch
- ✅ Superadmin sees all buildings
- ✅ Editing preserves creation info (createdBy, createdAt)
- ✅ Deleting checks for related appointments/visits first

## Future Enhancements

### Phase 2
- [ ] Building photo uploads
- [ ] Roof area auto-calculation from satellite imagery
- [ ] Integration with mapping services (Google Maps)
- [ ] Building history/change log
- [ ] Damage assessment workflow

### Phase 3
- [ ] Building maintenance schedules
- [ ] Cost estimation based on roof area/type
- [ ] Integration with third-party property data
- [ ] Duplicate detection (avoid creating building twice)
- [ ] Address autocomplete during creation

### Phase 4
- [ ] Building performance analytics
- [ ] ESG impact calculations
- [ ] Predictive maintenance alerts
- [ ] Batch operations (upload multiple buildings)
- [ ] API for external system integration

## Related Documentation
- [Service Agreements](./PRIVATE_OFFER_FLOW.md)
- [Appointments & Scheduling](./REPORT_CREATION_FLOW_MAP.md)
- [Data Integrity](./DATA_INTEGRITY.md)
- [Notification System](./NOTIFICATION_SYSTEM.md)

---

**Status**: ✅ Production Ready
**Last Updated**: January 27, 2026
**Contact**: Development Team
