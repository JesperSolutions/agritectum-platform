# Setup Scripts

This directory contains one-time setup and development scripts used during initial project configuration and testing.

## Purpose

These scripts were used to:
- Set up initial database structure
- Add test data and branches
- Configure user accounts and permissions
- Clean up test data
- Debug and inspect database state

## Important Notes

⚠️ **These scripts are for setup and development only.**

- Most scripts modify production data
- Always review script contents before running
- Backup data before running destructive operations
- Test in development environment first

## Script Categories

### Branch Management
- `add-branches-firebase-cli.cjs` - Add branches via Firebase CLI
- `add-branches-to-firestore.cjs` - Add branches to Firestore
- `add-company-branches.cjs` - Add company-specific branches
- `add-smaland-branch.cjs` - Add Småland branch
- `add-test-branches.cjs` - Add test branches
- `check-existing-branches.cjs` - Check existing branches

### User Management
- `add-new-users.cjs` - Add new users
- `fix-test-users.cjs` - Fix test user data
- `find-and-remove-test-user.cjs` - Find and remove test users
- `remove-test-user.cjs` - Remove test user

### Claims and Permissions
- `fix-branch-admin-claims.cjs` - Fix branch admin claims
- `set-branch-admin-claims.cjs` - Set branch admin claims

### Database Operations
- `cleanup-database.cjs` - Clean up database
- `database-crosscheck.cjs` - Cross-check database consistency
- `inspect-database.cjs` - Inspect database state

## Usage

Scripts require Firebase Admin SDK and proper credentials:

```bash
node scripts/setup/<script-name>.cjs
```

## Deprecation Notice

These scripts are archived and may not be maintained. For production operations, use the main application interface or production scripts in the parent directory.

