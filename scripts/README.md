# Scripts Directory

This directory contains utility scripts for the Taklaget application.

## Structure

- **Root scripts/** - Production and maintenance scripts
- **scripts/setup/** - One-time setup and test scripts

## Production Scripts

### `analyze-firebase-costs.cjs`
Analyzes Firebase usage and provides cost estimates.

### `production-monitor.cjs`
Monitors production environment health and performance.

### `reset-inspector-passwords.cjs`
Resets passwords for inspector accounts in development.

### `reset-inspector-passwords.ps1`
PowerShell version of the password reset script.

### `reset-production-inspector-passwords.cjs`
Resets passwords for inspector accounts in production (use with caution).

## Setup Scripts

Setup scripts are located in `scripts/setup/` and are typically used for:
- Initial database setup
- Adding test data
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

