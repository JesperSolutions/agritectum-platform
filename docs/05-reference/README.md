# Technical Reference

Technical documentation and reference materials.

## Core References

### System Architecture

**File**: [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)

Complete system design including:

- Tech stack overview
- Component architecture
- Data flow diagrams
- Firebase integration
- Third-party services

---

### Technical Reference

**File**: [TECHNICAL_REFERENCE.md](TECHNICAL_REFERENCE.md)

Detailed technical documentation including:

- Component structure
- Service layer design
- Data models
- State management
- Authentication & authorization
- Form handling
- Error handling
- Performance optimizations

---

### Functionality Inventory

**File**: [FUNCTIONALITY_INVENTORY.md](FUNCTIONALITY_INVENTORY.md)

Complete feature list covering:

- All user roles and capabilities
- Route to functionality mapping
- Feature matrix by role
- User flows
- Form specifications
- Data relationships

---

### Firestore Database Structure

**File**: [FIRESTORE_DATABASE_STRUCTURE.md](FIRESTORE_DATABASE_STRUCTURE.md)

Database schema documentation:

- Collection structure
- Document models
- Field definitions
- Relationships
- Indexing strategy

---

### Quick Reference

**File**: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

Quick lookup for common items:

- Route mapping
- Component paths
- Role capabilities matrix
- Function references

---

## Localization

### Translations Reference

**File**: [TRANSLATIONS.md](TRANSLATIONS.md)

Translation system documentation:

- Supported languages
- How to add translations
- Translation files location
- Language setup
- Best practices
- Translation tools and scripts

---

## Quick Lookup Tables

### Routes & Functionality

| Route             | Component        | Allowed Roles |
| ----------------- | ---------------- | ------------- |
| `/login`          | LoginForm        | Public        |
| `/dashboard`      | Dashboard        | Inspector+    |
| `/report/new`     | ReportForm       | Inspector+    |
| `/admin/users`    | UserManagement   | Admin+        |
| `/admin/branches` | BranchManagement | Superadmin    |

See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for complete table.

---

### Role Capabilities

| Capability      | Inspector | Branch Admin | Superadmin |
| --------------- | :-------: | :----------: | :--------: |
| Create Reports  |    ✅     |      ✅      |     ✅     |
| Manage Team     |    ❌     |      ✅      |     ✅     |
| Manage Branches |    ❌     |      ❌      |     ✅     |
| View Analytics  |    ❌     |      ✅      |     ✅     |

See [TECHNICAL_REFERENCE.md](TECHNICAL_REFERENCE.md) for complete matrix.

---

## Firestore Collections

```
/users/{uid}
  - Personal user data, role info, permissions

/branches/{branchId}
  - Branch information, contact details

/reports/{reportId}
  - Inspection reports with details and metadata

/customers/{customerId}
  - Customer/property information

/offers/{offerId}
  - Quotes and offers

/appointments/{appointmentId}
  - Scheduled appointments and inspections
```

See [FIRESTORE_DATABASE_STRUCTURE.md](FIRESTORE_DATABASE_STRUCTURE.md) for full schema.

---

## Finding What You Need

**Looking for...?**

- **How to authenticate users** → [TECHNICAL_REFERENCE.md](TECHNICAL_REFERENCE.md#6-authentication--authorization)
- **Database schema** → [FIRESTORE_DATABASE_STRUCTURE.md](FIRESTORE_DATABASE_STRUCTURE.md)
- **Component list** → [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- **Feature details** → [FUNCTIONALITY_INVENTORY.md](FUNCTIONALITY_INVENTORY.md)
- **System overview** → [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)
- **Translation keys** → [TRANSLATIONS.md](TRANSLATIONS.md)

---

**Related Documentation**:

- [Security Practices](../04-administration/security/SECURITY.md)
- [Testing Procedures](../04-administration/qa/TESTING.md)
- [Permission System](../04-administration/PERMISSION_SYSTEM.md)
