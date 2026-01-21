# Translations Reference

Translation system documentation and status for Agritectum Platform.

## Overview

The system uses **React Intl** for internationalization (i18n) with support for multiple languages.

**Supported Languages:**

- 🇸🇪 Swedish (sv-SE) - Primary language
- 🇬🇧 English (en-US) - Fallback language

---

## Translation Files

### Source Files

**Location:** `src/locales/`

```
src/locales/
├── en.json          # English translations
├── sv.json          # Swedish translations
└── index.ts         # Translation setup
```

### File Structure

Each translation file is a flat JSON object with namespaced keys:

```json
{
  "common.buttons.save": "Spara",
  "common.buttons.cancel": "Avbryt",
  "common.buttons.delete": "Ta bort",
  "reports.title": "Rapporter",
  "reports.new": "Ny rapport",
  "validation.required": "Detta fält är obligatoriskt"
}
```

---

## Key Translation Areas

### 1. Common UI Elements

```json
{
  "common.buttons.save": "Spara",
  "common.buttons.cancel": "Avbryt",
  "common.buttons.delete": "Ta bort",
  "common.buttons.edit": "Redigera",
  "common.buttons.add": "Lägg till",
  "common.buttons.search": "Sök",
  "common.buttons.close": "Stäng"
}
```

### 2. Forms & Validation

```json
{
  "forms.labels.name": "Namn",
  "forms.labels.email": "E-postadress",
  "forms.labels.phone": "Telefon",
  "validation.required": "Detta fält är obligatoriskt",
  "validation.email": "Ogiltig e-postadress",
  "validation.phone": "Ogiltigt telefonnummer"
}
```

### 3. Reports

```json
{
  "reports.title": "Rapporter",
  "reports.new": "Ny rapport",
  "reports.edit": "Redigera rapport",
  "reports.view": "Visa rapport",
  "reports.status.draft": "Utkast",
  "reports.status.completed": "Slutförd",
  "reports.status.sent": "Skickad"
}
```

### 4. Authentication

```json
{
  "auth.login": "Logga in",
  "auth.logout": "Logga ut",
  "auth.email": "E-postadress",
  "auth.password": "Lösenord",
  "auth.forgotPassword": "Glömt lösenord?"
}
```

### 5. Roles & Permissions

```json
{
  "roles.superadmin": "Systemadministratör",
  "roles.branchAdmin": "Filialchef",
  "roles.inspector": "Inspektör"
}
```

---

## Adding New Translations

### Step 1: Add to Both Language Files

**File:** `src/locales/sv.json`

```json
{
  "myfeature.title": "Min funktion"
}
```

**File:** `src/locales/en.json`

```json
{
  "myfeature.title": "My Feature"
}
```

### Step 2: Use in Components

```typescript
import { useIntl } from 'react-intl';

export const MyComponent = () => {
  const intl = useIntl();

  return (
    <h1>{intl.formatMessage({ id: 'myfeature.title' })}</h1>
  );
};
```

### Step 3: Verify Coverage

Run translation checker:

```bash
node scripts/find-missing-translations.cjs
```

This will report:

- Missing translations in any language
- Unused translation keys
- Translation coverage percentage

---

## Translation Status

### Current Coverage

**Swedish:** ~1,224+ keys translated  
**English:** ~1,224+ keys translated  
**Coverage:** ~98%

### Missing Translations

Check for missing translations:

```bash
npm run generate:translations
```

### Translation Inventory

**Location:** `src/locales/TRANSLATION_INVENTORY.md`

Complete listing of all translation keys organized by feature:

- Authentication & User Management
- Report Management
- Customer Management
- Offer Management
- Appointment Scheduling
- Navigation & Common
- Error Messages
- Form Labels & Validation

---

## Language Setup

### Configuration

**File:** `src/locales/index.ts`

```typescript
import en from './en.json';
import sv from './sv.json';

const messages = {
  en,
  sv,
};

const defaultLocale = 'sv'; // Swedish is default
const supportedLocales = ['en', 'sv'];
```

### Runtime Language Switching

Users can switch language in settings:

```typescript
// Get current language
const currentLanguage = useIntl().locale;

// Change language
const setLanguage = (lang: 'en' | 'sv') => {
  localStorage.setItem('language', lang);
  window.location.reload();
};
```

---

## Best Practices

### 1. Use Consistent Keys

✅ Good:

```json
{
  "common.buttons.save": "Spara",
  "reports.buttons.generate": "Generera rapport"
}
```

❌ Bad:

```json
{
  "button_save": "Spara",
  "generate_btn": "Generera rapport"
}
```

### 2. Group Related Keys

✅ Good:

```json
{
  "forms.labels.name": "Namn",
  "forms.labels.email": "E-post",
  "forms.validation.required": "Obligatoriskt"
}
```

❌ Bad:

```json
{
  "form_name": "Namn",
  "email_label": "E-post",
  "required_validation": "Obligatoriskt"
}
```

### 3. Use Placeholder for Variables

```typescript
// Translation
"welcome.greeting": "Hej {name}!"

// Usage
intl.formatMessage(
  { id: 'welcome.greeting' },
  { name: 'Anna' }
)
// Output: "Hej Anna!"
```

### 4. Handle Plurals

```typescript
intl.formatMessage({ id: 'reports.count' }, { count: 5 });
```

---

## Maintenance

### Before Each Release

1. **Check Coverage**

   ```bash
   npm run generate:translations
   ```

2. **Verify No Raw Keys**
   - Search for translation keys in output
   - Fix any broken translations

3. **Test Both Languages**
   - Switch to English
   - Verify all text displays
   - Switch to Swedish
   - Verify all text displays

### Adding New Features

1. Add translation keys to both language files
2. Use translation ID in component
3. Test in both languages
4. Run coverage check

### Removing Features

1. Remove translation keys from both files
2. Verify no components reference deleted keys
3. Run linter to catch orphaned references

---

## Language-Specific Notes

### Swedish Translations

**Considerations:**

- Use formal "ni/er" (plural "you") for professional context
- Use correct case for titles and names
- Date format: DD/MM/YYYY (Swedish standard)
- Time format: HH:MM (24-hour)
- Currency: SEK (Swedish Krona)

### English Translations

**Considerations:**

- Use US English spelling (color, not colour)
- Use friendly/informal tone where appropriate
- Date format: MM/DD/YYYY (US standard)
- Time format: HH:MM (24-hour, converted to 12-hour with AM/PM where needed)
- Currency: EUR or local equivalent

---

## Tools & Scripts

### Generate Translation Inventory

```bash
node scripts/generate-translation-inventory.cjs
```

Generates:

- `TRANSLATION_INVENTORY.md` - Organized list of all keys
- Missing translation report
- Orphaned keys report

### Find Missing Translations

```bash
node scripts/find-missing-translations.cjs
```

Reports:

- Keys in one language but not another
- Unused translation keys
- Coverage statistics

---

## Troubleshooting

### Key Shows "myapp.feature.title"

**Cause**: Translation key not found  
**Fix**: Add key to both language files

```json
{
  "myapp.feature.title": "My Title"
}
```

### Language Won't Change

**Cause**: Browser cache or localStorage  
**Fix**: Clear browser cache and localStorage

### Some Text Still in English

**Cause**: New feature added without translations  
**Fix**: Run `npm run generate:translations` and add missing keys

---

## Future Enhancements

**Planned:**

- [ ] Add more languages (German, Spanish)
- [ ] Community translation contribution system
- [ ] Automatic translation using AI
- [ ] Right-to-left (RTL) language support
- [ ] Regional date/time formats

---

**Last Updated**: January 2026  
**Current Keys**: 1,224+  
**Languages Supported**: 2  
**Translation Tool**: React Intl
