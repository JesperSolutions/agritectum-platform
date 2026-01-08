# TagLacket Permission Hierarchy

## 🔐 **User Role Hierarchy**

### **1. Super Admin (Highest Level)**

**Access Level**: Global System Access
**Permissions**:

- ✅ **Full System Access**: Can access all branches, users, and data
- ✅ **User Management**: Create, edit, delete any user across all branches
- ✅ **Branch Management**: Create, edit, delete branches
- ✅ **Report Management**: View, edit, delete any report in any branch
- ✅ **Analytics**: Full analytics dashboard with all data
- ✅ **System Settings**: Configure system-wide settings
- ✅ **Security**: Manage security policies and access controls
- ✅ **Data Export**: Export any data from any branch
- ✅ **Audit Logs**: Access to all system audit logs

**Restrictions**:

- ❌ Cannot be assigned to a specific branch (global access only)
- ❌ Cannot be deleted by other users
- ❌ Cannot have permissions reduced

### **2. Branch Admin (Branch Level)**

**Access Level**: Branch-Specific Management
**Permissions**:

- ✅ **Branch Data**: Full access to their assigned branch only
- ✅ **User Management**: Create, edit, delete users within their branch
- ✅ **Report Management**: View, edit, delete reports within their branch
- ✅ **Analytics**: Branch-specific analytics dashboard
- ✅ **Customer Management**: Manage customers for their branch
- ✅ **Report Templates**: Create and manage report templates
- ✅ **Branch Settings**: Configure branch-specific settings

**Restrictions**:

- ❌ Cannot access other branches' data
- ❌ Cannot create or delete branches
- ❌ Cannot manage other branch admins
- ❌ Cannot access system-wide settings
- ❌ Cannot view super admin analytics

### **3. Inspector (User Level)**

**Access Level**: Personal Report Management
**Permissions**:

- ✅ **Own Reports**: Create, edit, view, delete their own reports
- ✅ **Report Creation**: Create new inspection reports
- ✅ **Report Status**: Change status of their own reports (draft → sent → archived)
- ✅ **PDF Export**: Export their own reports to PDF
- ✅ **Customer Data**: View customer information for their reports
- ✅ **Offline Access**: Work offline and sync when online

**Restrictions**:

- ❌ Cannot view other inspectors' reports
- ❌ Cannot manage users
- ❌ Cannot access analytics
- ❌ Cannot manage branch settings
- ❌ Cannot access admin functions

## 🏢 **Branch Data Isolation**

### **Data Segregation Rules**:

1. **Reports**: Each branch can only access reports created within their branch
2. **Users**: Branch admins can only manage users assigned to their branch
3. **Customers**: Customer data is isolated per branch
4. **Analytics**: Branch admins see only their branch data, super admins see all data

### **Cross-Branch Access**:

- **Super Admin**: Can access all branches
- **Branch Admin**: Can only access their assigned branch
- **Inspector**: Can only access their own reports within their branch

## 📊 **Analytics Access Levels**

### **Super Admin Analytics**:

- Global metrics across all branches
- Branch comparison data
- System-wide performance metrics
- All user activity
- Revenue across all branches
- Critical issues across all branches

### **Branch Admin Analytics**:

- Branch-specific metrics only
- Their branch's performance data
- Their branch's user activity
- Revenue for their branch only
- Issues within their branch only

## 🔒 **Security Implementation**

### **Frontend Security**:

- Route protection based on user roles
- Component-level permission checks
- Data filtering based on user permissions
- UI elements hidden based on role

### **Backend Security**:

- Firebase Security Rules enforce data access
- Custom claims validate user permissions
- Database queries filtered by branch assignment
- API endpoints protected by role validation

## 🚀 **Permission Matrix**

| Feature          | Super Admin   | Branch Admin     | Inspector     |
| ---------------- | ------------- | ---------------- | ------------- |
| View All Reports | ✅            | ❌ (Branch Only) | ❌ (Own Only) |
| Create Reports   | ✅            | ✅               | ✅            |
| Edit Any Report  | ✅            | ❌ (Branch Only) | ❌ (Own Only) |
| Delete Reports   | ✅            | ❌ (Branch Only) | ❌ (Own Only) |
| Manage Users     | ✅            | ❌ (Branch Only) | ❌            |
| Manage Branches  | ✅            | ❌               | ❌            |
| View Analytics   | ✅ (All Data) | ✅ (Branch Only) | ❌            |
| Export Data      | ✅ (All)      | ✅ (Branch Only) | ✅ (Own Only) |
| System Settings  | ✅            | ❌               | ❌            |

## 🎯 **Best Practices**

### **For Super Admins**:

- Use analytics to monitor system-wide performance
- Regularly review user permissions
- Monitor critical issues across all branches
- Maintain security policies

### **For Branch Admins**:

- Focus on branch-specific metrics
- Manage team performance
- Monitor branch revenue and issues
- Train and support inspectors

### **For Inspectors**:

- Focus on report quality
- Use offline capabilities effectively
- Follow reporting standards
- Communicate with branch admin

## 🔧 **Implementation Notes**

### **Current Implementation**:

- ✅ Role-based routing implemented
- ✅ Component-level permission checks
- ✅ Data filtering by branch
- ✅ Analytics dashboard with role-based data
- ✅ Firebase Security Rules configured

### **Future Enhancements**:

- [ ] Granular permission system
- [ ] Permission inheritance
- [ ] Temporary permission grants
- [ ] Audit trail for permission changes
- [ ] Role-based UI customization
