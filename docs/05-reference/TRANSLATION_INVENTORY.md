# Translation Inventory & Reference

## Overview

This document provides a complete inventory of all translatable elements in the Taklaget Service App. Use this as a reference when adding new features or updating existing translations.

> **📋 Quick Links:**
> - **Auto-Generated Inventory:** `TRANSLATION_INVENTORY_AUTO.md` (complete listing of all 1,224+ keys)
> - **This Manual:** Reference guide with examples and patterns
> - **Generate Fresh:** `npm run generate:translations` (or `node scripts/generate-translation-inventory.cjs`)

## Current Statistics (Updated 2025-01-27)

- **Total Translation Keys:** 1,224
- **Categories:** 18
- **Locale Files:** 14 JSON files
- **Supported Locale:** Swedish (sv) only

## Translation Architecture

The app uses a modular translation system with Swedish (`sv`) locale:

```
src/locales/
├── sv/
│   ├── common.json          # Common UI elements
│   ├── navigation.json       # Navigation menu items
│   ├── dashboard.json       # Dashboard/overview screens
│   ├── reports.json         # Reports listing/views
│   ├── reportForm.json       # Report creation/editing form
│   ├── offers.json           # Offers functionality
│   ├── customers.json        # Customer management
│   ├── schedule.json         # Scheduling/appointments
│   ├── admin.json            # Admin features
│   ├── email.json            # Email templates
│   ├── validation.json       # Form validation messages
│   ├── errors.json           # Error messages
│   ├── address.json          # Address-related text
│   ├── login.json            # Login/authentication
│   └── index.ts              # Aggregator
└── index.ts                  # Locale selector
```

All locale files are combined via `src/locales/sv/index.ts`.

---

## Translation Key Reference

### Common UI Elements (`common.json`)

**Prefix:** `common.*`

| Key | Type | Swedish Translation | Usage |
|-----|------|---------------------|-------|
| `common.signOut` | Button | Logga ut | Logout button |
| `common.buttons.save` | Button | Spara | Save button |
| `common.buttons.cancel` | Button | Avbryt | Cancel button |
| `common.buttons.delete` | Button | Ta bort | Delete button |
| `common.buttons.edit` | Button | Redigera | Edit button |
| `common.buttons.create` | Button | Skapa | Create button |
| `common.status.active` | Status | Aktiv | Active status |
| `common.status.inactive` | Status | Inaktiv | Inactive status |
| `common.messages.loading` | Message | Laddar... | Loading state |
| `common.messages.success` | Message | Lyckades | Success message |
| `common.messages.error` | Message | Ett fel uppstod | Error message |

**All Common Keys:**
- Buttons: `save`, `cancel`, `delete`, `edit`, `view`, `create`, `update`, `submit`, `confirm`, `close`, `back`, `next`, `previous`, `refresh`, `search`, `filter`, `sort`, `export`, `import`, `download`, `upload`, `selectAll`, `deselectAll`, `clear`, `reset`, `loading`, `saving`, `deleting`, `processing`
- Status: `active`, `inactive`, `pending`, `completed`, `draft`, `sent`, `archived`, `published`, `unpublished`
- Labels: `name`, `email`, `phone`, `address`, `date`, `time`, `status`, `description`, `notes`, `actions`, `created`, `updated`, `modified`, `optional`, `required`
- Messages: `loading`, `saving`, `deleting`, `processing`, `success`, `error`, `warning`, `info`, `confirm`, `cancel`
- Validation: `required`, `email`, `phone`, `minLength`, `maxLength`, `pattern`
- Pagination: `previous`, `next`, `page`, `of`, `showing`, `itemsPerPage`
- Empty State: `title`, `description`, `action`
- Error State: `title`, `description`, `retry`
- Confirm Dialog: `title`, `message`, `description`, `yes`, `no`
- Accessibility: `close`, `menu`, `navigation`, `mainContent`, `sidebar`, `loading`, `error`, `success`

---

### Navigation (`navigation.json`)

**Prefix:** `navigation.*`

All menu items and navigation elements:

- `navigation.overview`, `navigation.profile`, `navigation.reports`, `navigation.offers`, `navigation.schedule`, `navigation.customers`, `navigation.users`, `navigation.analytics`, `navigation.branches`, `navigation.settings`, `navigation.logout`

---

### Dashboard (`dashboard.json`)

**Prefix:** `dashboard.*` or `DASHBOARD.*` (uppercase variant)

**Key Metrics:**
- `DASHBOARD.TOTALREPORTS` - Total number of reports
- `DASHBOARD.COMPLETIONRATE` - Report completion rate
- `DASHBOARD.PENDINGREPORTS` - Pending reports count
- `DASHBOARD.TEAMPRODUCTIVITY` - Team productivity metrics
- `DASHBOARD.LASTUPDATED` - Last update timestamp

**Dashboard Sections:**
- `dashboard.title` - Main dashboard title
- `dashboard.branchAdmin` - Branch admin header
- `dashboard.branchOverview` - Branch overview subtitle
- `dashboard.teamActivity` - Team activity section

**Role & Status:**
- `dashboard.roles.inspector` - Inspector role
- `dashboard.roles.admin` - Admin role
- `dashboard.status.active` - Active status
- `dashboard.status.inactive` - Inactive status

**Metrics:**
- `dashboard.active` - Active count
- `dashboard.completed` - Completed count
- `dashboard.status` - Status label
- `dashboard.vsLastWeek` - Comparison text
- `dashboard.aboveTarget` - Above target message
- `dashboard.requiresAttention` - Requires attention message
- `dashboard.thisWeek` - This week label

**Complete Dashboard Keys:**
- Greetings: `greeting.morning`, `greeting.afternoon`, `greeting.evening`
- Stats: `stats.totalReports`, `stats.draftReports`, `stats.completedReports`, `stats.sentReports`, `stats.offers`, `stats.customers`, `stats.revenue`
- Quick Actions: `quickActions.createReport`, `quickActions.viewReports`, `quickActions.manageCustomers`, `quickActions.viewOffers`
- Recent Reports: `recentReports.title`, `recentReports.viewAll`, `recentReports.noReports`, `recentReports.createFirst`
- Appointments: `upcomingAppointments.*`
- Offers: `pendingOffers.*`
- Branch Info: `branchInfo.*`
- Performance: `performance.*`
- Alerts: `alerts.*`
- Charts: `charts.*`
- Loading: `loading.*`
- Errors: `error.*`

---

### Report Form (`reportForm.json`)

**Prefix:** `form.*`

**Titles:**
- `form.title.create` - "Skapa ny rapport"
- `form.title.edit` - "Redigera rapport"
- `form.title.createOffer` - "Skapa offert"
- `form.title.editOffer` - "Redigera offert"

**Sections:**
- `form.sections.customerInfo` - Kundinformation
- `form.sections.inspectionDetails` - Inspektionsdetaljer
- `form.sections.issues` - Brister
- `form.sections.issuesFound` - Brister
- `form.sections.recommendedActions` - Rekommenderade åtgärder
- `form.sections.offer` - Offert

**Fields (Labels):**
- `form.fields.customerName` - Kundnamn
- `form.fields.customerAddress` - Adress
- `form.fields.customerPhone` - Telefonnummer
- `form.fields.customerEmail` - E-postadress
- `form.fields.inspectionDate` - Inspektionsdatum
- `form.fields.roofType` - Taktyp
- `form.fields.roofAge` - Takålder
- `form.fields.conditionNotes` - Tillståndsanteckningar
- `form.fields.issueTitle` - Bristtitel
- `form.fields.issueDescription` - Beskrivning
- `form.fields.issueSeverity` - Allvarlighetsgrad
- `form.fields.issueType` - Bristtyp
- `form.fields.issueLocation` - Plats
- `form.fields.actionTitle` - Åtgärdstitel
- `form.fields.actionDescription` - Beskrivning
- `form.fields.actionPriority` - Prioritet
- `form.fields.actionUrgency` - Brådska
- `form.fields.estimatedCost` - Beräknad kostnad
- `form.fields.offerTitle` - Offerttitel
- `form.fields.offerDescription` - Offertbeskrivning
- `form.fields.offerValidUntil` - Giltig till

**Placeholders:**
All field placeholders follow pattern: `form.fields.{fieldName}Placeholder`

**Buttons:**
- `form.buttons.save` - Spara
- `form.buttons.cancel` - Avbryt
- `form.buttons.submit` - Skicka
- `form.buttons.next` - Nästa
- `form.buttons.previous` - Föregående
- `form.buttons.addIssue` - Lägg till brist
- `form.buttons.addAction` - Lägg till åtgärd
- `form.buttons.removeIssue` - Ta bort brist
- `form.buttons.removeAction` - Ta bort åtgärd
- `form.buttons.templates` - Mallar
- `form.buttons.uploadImage` - Ladda upp bild
- `form.buttons.selectFromGallery` - Välj från galleri
- `form.buttons.takePhoto` - Ta foto

**Labels:**
- `form.labels.issue` - Brist #{number}
- `form.labels.issueTitle` - Bristtitel
- `form.labels.issueType` - Bristtyp
- `form.labels.issueSeverity` - Allvarlighetsgrad
- `form.labels.issueLocation` - Plats
- `form.labels.issueDescription` - Beskrivning
- `form.labels.actionDescription` - Beskrivning
- `form.labels.actionPriority` - Prioritet
- `form.labels.actionUrgency` - Brådska
- `form.labels.estimatedCost` - Beräknad kostnad
- `form.labels.optional` - valfritt
- `form.labels.required` - obligatoriskt
- `form.labels.images` - bilder
- `form.labels.issueImages` - Bilder av problemet
- `form.labels.issuesIdentified` - brister identifierade

**Messages:**
- `form.messages.saving` - Sparar...
- `form.messages.saved` - Sparad
- `form.messages.submitting` - Skickar...
- `form.messages.submitted` - Skickad
- `form.messages.draftLoaded` - Utkast laddat
- `form.messages.draftDeleted` - Utkast raderat
- `form.messages.uploadingImages` - Laddar upp bilder
- `form.messages.noImagesUploaded` - Inga bilder uppladdade än
- `form.messages.clickButtonsToAddImages` - Klicka på knapparna ovan för att lägga till bilder
- `form.messages.reportNotFound` - Rapporten hittades inte
- `form.messages.failedToLoadReport` - Kunde inte ladda rapport
- `form.messages.failedToSaveReport` - Kunde inte spara rapport
- `form.messages.failedToSubmitReport` - Kunde inte skicka rapport
- `form.messages.failedToDeleteDraft` - Kunde inte radera utkast

**Validation:**
- `form.validation.summaryTitle` - "Vänligen korrigera följande fel:"
- `form.validation.summaryDescription` - "Det finns fel i formuläret som måste åtgärdas innan du kan fortsätta."
- `form.validation.customerNameRequired` - Kundnamn är obligatoriskt
- `form.validation.customerAddressRequired` - Kundadress är obligatorisk
- `form.validation.customerEmailInvalid` - Ange en giltig e-postadress
- `form.validation.customerPhoneInvalid` - Ange ett giltigt telefonnummer
- `form.validation.inspectionDateRequired` - Inspektionsdatum är obligatoriskt
- `form.validation.inspectionDateFuture` - Inspektionsdatumet måste vara i framtiden
- `form.validation.roofTypeRequired` - Taktyp är obligatorisk
- `form.validation.roofAgeInvalid` - Takålder måste vara ett positivt nummer
- `form.validation.offerValidUntilAfterInspection` - Offertens giltighet måste vara efter inspektionsdatumet
- `form.validation.issueTitleRequired` - Bristtitel är obligatorisk

**Steps:**
- `form.steps.customerInfo` - Kundinformation
- `form.steps.inspectionDetails` - Inspektionsdetaljer
- `form.steps.issues` - Brister
- `form.steps.actions` - Åtgärder
- `form.steps.offer` - Offert
- `form.steps.review` - Granskning
- `form.steps.stepOf` - steg av

**Progress:**
- `form.progress.saving` - Sparar utkast...
- `form.progress.saved` - Utkast sparat
- `form.progress.autoSave` - Automatisk sparning
- `form.progress.lastSaved` - Senast sparat: {time}

**Templates:**
- `form.templates.title` - Mallar
- `form.templates.selectTemplate` - Välj mall
- `form.templates.noTemplates` - Inga mallar tillgängliga
- `form.templates.createFromTemplate` - Skapa från mall
- `form.templates.customTemplate` - Anpassad mall

**Help:**
- `form.help.customerInfo` - Ange grundläggande kundinformation för rapporten
- `form.help.inspectionDetails` - Beskriv inspektionsdetaljer och takets tillstånd
- `form.help.issues` - Dokumentera alla brister som hittades under inspektionen
- `form.help.actions` - Rekommendera åtgärder för att åtgärda brister
- `form.help.offer` - Skapa offert baserat på rekommenderade åtgärder

---

### Login (`login.json`)

**Prefix:** `login.*`

| Key | Swedish | Usage |
|-----|---------|-------|
| `login.title` | Välkommen tillbaka | Login page title |
| `login.subtitle` | Logga in på ditt konto för att fortsätta | Login subtitle |
| `login.email` | E-postadress | Email field label |
| `login.password` | Lösenord | Password field label |
| `login.signin` | Logga in | Sign in button |
| `login.rememberMe` | Kom ihåg mig | Remember me checkbox |
| `login.forgotPassword` | Glömt lösenord? | Forgot password link |
| `login.signingIn` | Loggar in... | Signing in state |
| `login.errors.invalidCredentials` | Ogiltiga inloggningsuppgifter | Invalid credentials error |
| `login.errors.emailRequired` | E-postadress är obligatorisk | Email required error |
| `login.errors.passwordRequired` | Lösenord är obligatoriskt | Password required error |
| `login.errors.networkError` | Nätverksfel. Försök igen senare. | Network error |
| `login.success` | Inloggning lyckades | Login success message |

---

### Address Component (`address.json`)

**Prefix:** `address.*`

| Key | Swedish | Usage |
|-----|---------|-------|
| `address.placeholder` | Ange adress... | Address input placeholder |
| `address.searching` | Söker... | Search in progress |

---

## How to Add New Translations

### Step 1: Choose the Right File

Match the translation to the appropriate file by context:
- **UI elements**: `common.json`
- **Dashboard metrics**: `dashboard.json`
- **Form fields**: `reportForm.json`
- **Navigation items**: `navigation.json`
- **Login screen**: `login.json`
- **Address input**: `address.json`
- **Feature-specific**: Create new file (e.g., `issues.json`) and add to `index.ts`

### Step 2: Add the Key

```json
{
  "your.new.key": "Your Swedish translation here"
}
```

### Step 3: Use in Component

```typescript
import { useIntl } from '../hooks/useIntl';

const { t } = useIntl();
const label = t('your.new.key');
```

### Step 4: Update This Document

Add your new key to the appropriate section in this inventory.

---

## Translation Key Naming Conventions

### Format

```
{category}.{subcategory}.{item}
```

### Examples

- `form.fields.customerName` - Form field
- `common.buttons.save` - Common button
- `dashboard.stats.totalReports` - Dashboard statistic
- `login.errors.invalidCredentials` - Error message

### Patterns

1. **Button text**: `{category}.buttons.{action}`
2. **Field labels**: `{category}.fields.{fieldName}`
3. **Placeholders**: `{category}.fields.{fieldName}Placeholder`
4. **Messages**: `{category}.messages.{state}`
5. **Validation**: `{category}.validation.{rule}`
6. **Errors**: `{category}.errors.{errorType}`
7. **Status**: `{category}.status.{status}`

---

## Key Statistics

| File | Approximate Keys | File Size |
|------|------------------|-----------|
| `common.json` | ~80 | 2.5 KB |
| `dashboard.json` | ~60 | 2.0 KB |
| `reportForm.json` | ~100 | 3.5 KB |
| `login.json` | ~15 | 0.5 KB |
| `navigation.json` | ~15 | 0.5 KB |
| `address.json` | ~5 | 0.2 KB |
| **Total** | **~275** | **~9 KB** |

---

## Testing Translations

To test if a translation key exists and works:

```typescript
const { t } = useIntl();
const translated = t('your.key');

// If key missing, will show 'your.key' as fallback
if (translated === 'your.key') {
  console.error('Translation key missing:', 'your.key');
}
```

---

## Common Issues & Solutions

### Issue: Translation Key Shows as Raw Key

**Symptom:** `form.title.createOffer` appears instead of "Skapa offert"

**Solution:**
1. Add key to `src/locales/sv/reportForm.json`
2. Add to `index.ts` if new file
3. Rebuild: `npm run build`
4. Deploy: `firebase deploy --only hosting`

### Issue: Translation Key Not Found

**Symptom:** Console error: `Translation key 'xxx' not found`

**Solution:**
1. Check the key exists in the appropriate JSON file
2. Verify it's exported in `src/locales/sv/index.ts`
3. Clear browser cache
4. Rebuild application

### Issue: Wrong Translation Appears

**Symptom:** Shows "Skapa rapport" instead of "Skapa offert"

**Solution:**
1. Check for duplicate keys
2. Verify locale file is being loaded correctly
3. Check `useIntl` hook is working
4. Clear localStorage (`localStorage.clear()`)

---

## Maintenance Checklist

When adding new features:

- [ ] Add translation keys to appropriate JSON file
- [ ] Follow naming conventions
- [ ] Add Swedish translations
- [ ] Export in `index.ts` if new file
- [ ] Update this inventory document
- [ ] Test translations work
- [ ] Deploy changes

---

## Quick Reference Commands

```bash
# Build translations
npm run build

# Deploy updates
firebase deploy --only hosting

# Check for missing keys (grep pattern)
grep -r "t('key.name')" src/components
```

---

## Contact

For translation issues or questions, refer to:
- Translation files: `src/locales/sv/`
- Hook implementation: `src/hooks/useIntl.ts`
- This document: `docs/05-reference/TRANSLATION_INVENTORY.md`

---

**Last Updated:** 2025-01-27  
**Total Translation Keys:** ~275  
**Supported Locale:** Swedish (sv)  
**Locale Files:** 13 JSON files + 2 TypeScript aggregators

