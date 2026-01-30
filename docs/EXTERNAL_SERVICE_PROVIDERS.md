# External Service Providers Feature

## Overview
This feature allows building owners (customers) to add external roofing companies that are not yet on the Agritectum platform. This enables customers to track all their service agreements in one place, regardless of whether the service provider is a platform partner or not.

## Implementation Status: Phase 1 MVP ✅

### Completed Features

#### 1. Data Model
- **New Collection**: `externalServiceProviders`
  - Company information (name, contact, email, phone, address, CVR)
  - Ownership tracking (addedByCustomerId, addedByCompanyId)
  - Sharing capability (isShared flag)
  - Invitation status tracking (none, invited, accepted, declined)
  - Platform linkage support (platformBranchId for when provider joins)

- **Updated Collection**: `serviceAgreements`
  - Added `providerType` field ('internal' | 'external')
  - Made `branchId` optional
  - Added `externalProviderId` field

#### 2. Service Layer
**File**: `src/services/externalProviderService.ts`

Functions implemented:
- `createExternalProvider()` - Create new external company
- `getExternalProvider(id)` - Fetch provider by ID
- `getExternalProvidersByCompany(companyId)` - List providers for a company
- `updateExternalProvider(id, updates)` - Update provider details
- `searchExistingProviders(name, cvr?, companyId?)` - De-duplication search
  - Exact match by CVR number
  - Fuzzy match by company name (case-insensitive)
- `inviteProviderToPlatform(id, invitedBy)` - Mark as invited (prepared for Phase 2)
- `linkProviderToBranch(id, branchId)` - Connect when they join (prepared for Phase 3)

#### 3. UI Components
**File**: `src/components/portal/AddExternalProviderForm.tsx`
- Modal form for adding external providers
- Duplicate detection (runs on company name blur and CVR blur)
- Visual warning when similar providers found
- Required fields: Company name, contact person, email, phone
- Optional fields: Address, CVR, notes
- Share option: Allow other users in company to use this provider
- Form validation with error messages
- Success callback integration

**File**: `src/components/portal/ServiceAgreementsList.tsx` (Updated)
- Added "Add External Provider" button in page header
- Provider type badges:
  - Blue badge with Building2 icon: "Platform Partner"
  - Amber badge with Users icon: "External"
- Integration with AddExternalProviderForm modal

#### 4. Security Rules
**File**: `firestore.rules` (Updated)
- Customers can create external providers
- Customers can read providers they created or shared in their company
- Customers can update/delete providers they created
- Admins have full access to all providers
- Company scope isolation (users only see providers from their company)

## User Flow

### Adding an External Provider
1. Customer navigates to Service Agreements page
2. Clicks "Add External Provider" button
3. Fills in company information:
   - Company name (required) *
   - Contact person (required) *
   - Email (required) *
   - Phone (required) *
   - Address (optional)
   - CVR number (optional, recommended)
   - Notes (optional)
4. System automatically searches for duplicates:
   - When company name is entered
   - When CVR is entered
   - Shows warning if similar providers exist
5. Customer can choose to share with company
6. Clicks "Add Provider"
7. Provider is saved to database
8. *Future*: Can create service agreement with this provider

### Provider Type Display
- Service agreements now show badges indicating provider type
- Platform Partners: Blue badge with building icon
- External Providers: Amber badge with users icon
- Helps users differentiate at a glance

## Database Schema

### ExternalServiceProvider
```typescript
{
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
  cvr?: string; // Danish company registration number
  addedByCustomerId: string; // Who added this provider
  addedByCompanyId: string; // Which company it belongs to
  isShared: boolean; // Can other company users see it?
  invitationStatus: 'none' | 'invited' | 'accepted' | 'declined';
  invitedAt?: Timestamp;
  invitedBy?: string;
  platformBranchId?: string; // Set when provider joins platform
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
}
```

### ServiceAgreement (Updated)
```typescript
{
  // ... existing fields
  providerType: 'internal' | 'external';
  branchId?: string; // Optional now, for internal providers
  externalProviderId?: string; // For external providers
}
```

## De-duplication Strategy

### CVR-based (Exact)
- If CVR is provided, searches for exact match
- Most reliable method for Danish companies
- Returns existing providers with same CVR

### Name-based (Fuzzy)
- Case-insensitive search
- Looks for providers with similar names
- User is warned but can still proceed

### Company Scope
- Searches only within user's company
- Shared providers are included
- Private providers from other companies are excluded

## Future Enhancements (Phase 2 & 3)

### Phase 2: Invitations & Advanced De-duplication
- [ ] Enhanced de-duplication UI with merge options
- [ ] Email invitation system for external providers
- [ ] Invitation tracking and reminders
- [ ] Provider profile preview before invitation
- [ ] Bulk invitation capability

### Phase 3: Auto-migration & Analytics
- [ ] Automatic migration when provider joins platform
  - Service agreements update from external to internal
  - Historical data preserved
  - Notification to customers
- [ ] Analytics dashboard
  - Track invitation acceptance rates
  - Identify popular external providers
  - Conversion metrics (external → platform)
- [ ] Provider recommendations
  - Suggest inviting frequently used externals
  - Show platform benefits to customers

## Technical Notes

### Module System
- ES modules (`"type": "module"`)
- Import/export syntax used throughout

### Security Considerations
- Company-level data isolation
- Only creator can modify/delete providers
- Shared providers readable by company members
- Admins have full access for support

### Error Handling
- Try-catch blocks in all service functions
- Logger integration for debugging
- User-friendly error messages in UI
- Toast notifications for success/failure

### Performance
- Efficient queries using Firestore compound indexes
- Duplicate search limited to company scope
- Form validation to prevent bad data

## Testing Checklist

### Functional Tests
- ✅ Create external provider
- ✅ Provider type badges display correctly
- ⏳ Duplicate detection works
- ⏳ Share option functions
- ⏳ Security rules enforce permissions
- ⏳ Service agreement creation with external provider

### User Experience Tests
- ⏳ Form validation messages
- ⏳ Duplicate warning visibility
- ⏳ Loading states
- ⏳ Error handling
- ⏳ Mobile responsiveness

### Edge Cases
- ⏳ Provider with same name, different CVR
- ⏳ Provider with same CVR (should warn strongly)
- ⏳ Very long company names
- ⏳ Special characters in names
- ⏳ International phone numbers

## Related Documentation
- [Service Agreements](./PRIVATE_OFFER_FLOW.md)
- [Notification System](./NOTIFICATION_SYSTEM.md)
- [Data Integrity](./DATA_INTEGRITY.md)

## Deployment History
- **2026-01-XX**: Phase 1 MVP deployed
  - Data model
  - Service layer
  - Basic UI (form + list badges)
  - Security rules

---

**Status**: ✅ Phase 1 Complete
**Next**: Phase 2 - Invitations & Enhanced De-duplication
**Contact**: Development Team
