# Administration

Operational, maintenance, and security documentation.

## Quick Navigation

### Security 🔒

**Folder**: `security/`

- [SECURITY.md](security/SECURITY.md) - Security audit, fixes, and best practices

---

### Quality Assurance ✅

**Folder**: `qa/`

- [TESTING.md](qa/TESTING.md) - QA procedures, test accounts, testing workflows

---

### Permissions & Roles 👥

[PERMISSION_SYSTEM.md](PERMISSION_SYSTEM.md) - User roles, permission levels, custom claims

---

### System Security 🛡️

[SECURITY_IMPROVEMENTS.md](SECURITY_IMPROVEMENTS.md) - Security best practices and measures

---

## Administration Tasks

### User Management

1. **Create User**
   - Go to Admin → Users
   - Enter email and select role
   - Set permissions level

2. **Reset Password**

   ```bash
   node scripts/reset-inspector-passwords.cjs
   ```

3. **Update Permissions**
   ```bash
   node scripts/update-user-claims.cjs
   ```

### Branch Management

1. **Create Branch**
   - Go to Admin → Branches
   - Enter branch details
   - Assign branch admin

2. **Assign Permissions**
   - Set branch admin
   - Configure branch inspectors

### Monitoring

- Check Firebase Console for errors
- Monitor Cloud Function logs
- Review authentication failures
- Track email delivery status

---

## Important Links

- [Firestore Structure](../05-reference/FIRESTORE_DATABASE_STRUCTURE.md)
- [System Architecture](../05-reference/SYSTEM_ARCHITECTURE.md)
- [Testing Guide](qa/TESTING.md)

---

## Emergency Procedures

### System Down

1. Check Firebase status
2. Review Cloud Function logs
3. Check for quota limits exceeded
4. Review Firestore billing
5. Contact Firebase support if needed

### Security Incident

1. Revoke compromised credentials
2. Force password reset for affected users
3. Review audit logs
4. Document incident
5. Implement fixes

---

**Last Updated**: January 2026

- **qa/ISSUES_FOUND_DURING_FIX.md** - Issues and resolutions

### Branch Admin Verification

- **BRANCH_ADMIN_VERIFICATION_GUIDE.md** - Complete verification process
- **BRANCH_ADMIN_CHECKLIST.md** - Quick verification checklist
- **BRANCH_ADMIN_VERIFICATION_SUMMARY.md** - Verification summary

## Quick Access

### For System Administrators

1. **Permission System** - `PERMISSION_SYSTEM.md`
2. **Security Audit** - `security/SECURITY_AUDIT.md`
3. **Branch Admin Verification** - `BRANCH_ADMIN_VERIFICATION_GUIDE.md`
4. **QA Testing** - `qa/QA_TESTING_GUIDE.md`

### For Branch Admins

1. **Permission System** - `PERMISSION_SYSTEM.md`
2. **QA Quick Reference** - `qa/QA_QUICK_REFERENCE.md`
3. **Security Improvements** - `SECURITY_IMPROVEMENTS.md`

### For QA Team

1. **QA Testing Guide** - `qa/QA_TESTING_GUIDE.md`
2. **QA Quick Reference** - `qa/QA_QUICK_REFERENCE.md`
3. **QA Fixes** - `qa/QA_FIXES_IMPLEMENTED.md`
4. **Issues Found** - `qa/ISSUES_FOUND_DURING_FIX.md`

## User Roles

### Inspector (Level 0)

- Create and edit own reports
- Manage appointments
- View assigned reports
- Access only assigned branch

### Branch Admin (Level 1)

- All Inspector permissions
- Manage branch users
- Manage branch customers
- View branch analytics
- Edit all branch reports
- **Verification:** See `BRANCH_ADMIN_VERIFICATION_GUIDE.md`

### Super Admin (Level 2)

- All Branch Admin permissions
- Manage all branches
- Manage all users
- System configuration
- Access all branches

## Verification Tools

### Automated Verification

```bash
node scripts/verify-branch-admins.cjs
```

**What it checks:**

- All branches exist and are active
- All branch admins have correct configurations
- Custom claims are set correctly
- No permission mismatches
- All branches have admins

### Manual Verification

Use the checklist in `BRANCH_ADMIN_CHECKLIST.md` for manual verification through Firebase Console.

## Security Best Practices

1. **Never commit service account keys** - Always use environment variables
2. **Review Firebase rules regularly** - Ensure they match current requirements
3. **Keep dependencies updated** - Regularly audit for security vulnerabilities
4. **Use HTTPS only** - Enforce secure connections
5. **Implement least privilege** - Grant minimum necessary permissions
6. **Regular audits** - Verify branch admin configurations weekly

## Maintenance

### Weekly

- Run branch admin verification
- Check for security updates
- Review QA test results
- Update documentation

### Monthly

- Full security audit
- Permission review
- User access review
- Documentation update

### Quarterly

- Complete system audit
- Security assessment
- Performance review
- Major documentation updates

## Related Documentation

- **Getting Started**: `../01-getting-started/`
- **Features**: `../02-features/`
- **Deployment**: `../03-deployment/`
- **Code Review**: `../08-code-review/`
- **Requirements**: `../09-requirements/`

## Support

For questions about administration:

1. Check this README and relevant documentation
2. Review troubleshooting guides
3. Check security documentation
4. Contact the development team

---

_Last updated: January 2025_
