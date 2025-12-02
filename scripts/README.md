# Scripts Directory

This directory contains utility scripts for the platform.

## Structure

- **Root scripts/** - Production and maintenance scripts
- **scripts/setup/** - One-time setup scripts
- **scripts/operations/** - Operational utility scripts

## Production Scripts

### `analyze-firebase-costs.cjs`
Analyzes Firebase usage and provides cost estimates.

### `production-monitor.cjs`
Monitors production environment health and performance.

### `check-reports.cjs`
Query and inspect reports from Firestore (supports emulator and production).

### `inspect-firestore.cjs`
Inspect Firestore database structure and data.

### `list-report-creators.cjs`
List users who have created reports.

### `delete-reports-by-user.cjs`
Delete reports created by a specific user.

### `debug-customer-deletion.cjs`
Debug customer deletion operations.

### `verify-branch-admins.cjs`
Verify branch admin permissions and claims.

### `verify-production-claims.cjs`
Verify user claims in production environment.

### `find-missing-translations.cjs`
Find missing translation keys across locales.

### `generate-translation-inventory.cjs`
Generate inventory of all translation keys.

## Setup Scripts

Setup scripts are located in `scripts/setup/` and are typically used for:
- Initial database setup
- Database cleanup
- User management
- Branch configuration

These scripts are for development and setup purposes only. Refer to individual script comments for usage instructions.

## Usage

Most scripts require Firebase Admin SDK credentials and can be run with:

```bash
node scripts/<script-name>.cjs
```

For PowerShell scripts:
```powershell
.\scripts\reset-inspector-passwords.ps1
```

## Security Note

Never commit service account JSON files or credentials to version control. These should be stored securely and referenced via environment variables.

