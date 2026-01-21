# 🔔 Taklaget Notification System

## Overview

The Taklaget Notification System is a comprehensive, real-time notification management solution built with React, TypeScript, and Firebase. It provides users with instant updates about system events, report statuses, email deliveries, and more.

## 🚀 Features

### Core Functionality

- **Real-time Notifications**: Live updates from Firestore
- **Multiple Notification Types**: Info, warning, success, error, urgent
- **Interactive Actions**: Clickable notification buttons for navigation
- **Priority System**: Low, medium, high, urgent priority levels
- **Category Organization**: Report, user, system, email, security categories
- **Read/Unread Management**: Mark individual or all notifications as read
- **Notification Deletion**: Remove notifications permanently

### User Experience

- **Swedish Localization**: Complete UI translation
- **Responsive Design**: Works on desktop and mobile
- **Settings Panel**: Customizable notification preferences
- **Email Integration**: Configurable email notification settings
- **Unread Count Badge**: Visual indicator of unread notifications
- **Loading States**: Smooth loading indicators
- **Error Handling**: Graceful error management

### Security & Privacy

- **User Isolation**: Users can only see their own notifications
- **Firestore Rules**: Secure database access controls
- **Authentication Required**: All operations require user authentication
- **Data Persistence**: Notifications stored securely in Firestore

## 🏗️ Architecture

### Components

#### NotificationCenter

- **Location**: `src/components/NotificationCenter.tsx`
- **Purpose**: Main notification display and management interface
- **Features**: Real-time updates, action handling, settings integration

#### NotificationSettings

- **Location**: `src/components/NotificationSettings.tsx`
- **Purpose**: User preference management panel
- **Features**: Email preferences, delivery methods, frequency settings

### Services

#### NotificationService

- **Location**: `src/services/notificationService.ts`
- **Purpose**: Core notification CRUD operations
- **Features**: Create, read, update, delete, statistics, cleanup

#### EmailPreferenceService

- **Location**: `src/services/emailPreferenceService.ts`
- **Purpose**: Email notification preference management
- **Features**: User preferences, unsubscribe functionality

### Context

#### NotificationContext

- **Location**: `src/contexts/NotificationContext.tsx`
- **Purpose**: Global notification state management
- **Features**: Real-time subscriptions, state management, error handling

### Hooks

#### useNotificationEvents

- **Location**: `src/hooks/useNotificationEvents.ts`
- **Purpose**: Event-triggered notification creation
- **Features**: Report, user, system, email event notifications

## 📊 Database Schema

### Notifications Collection

```typescript
interface Notification {
  id: string; // Unique identifier
  userId: string; // Owner user ID
  type: 'info' | 'warning' | 'success' | 'error' | 'urgent';
  title: string; // Display title
  message: string; // Content
  timestamp: Date; // Creation time
  read: boolean; // Read status
  action?: {
    // Optional action button
    label: string;
    onClick: string;
    type: 'navigate' | 'api' | 'modal';
  };
  metadata?: {
    // Additional data
    reportId?: string;
    userId?: string;
    branchId?: string;
    customerId?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: 'report' | 'user' | 'system' | 'email' | 'security';
  };
  expiresAt?: Date; // Optional expiration
  createdAt: Date; // Database creation time
  updatedAt: Date; // Last update time
}
```

### Email Preferences Collection

```typescript
interface EmailPreferences {
  email: string; // User email
  subscribed: boolean; // Subscription status
  preferences: {
    inspectionComplete: boolean;
    urgentIssues: boolean;
    weeklyDigest: boolean;
    marketingEmails: boolean;
    systemNotifications: boolean;
  };
  unsubscribeToken: string; // Security token
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔒 Security Rules

### Firestore Rules

```javascript
// Notifications collection
match /notifications/{notificationId} {
  allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
  allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
}

// Email preferences collection
match /emailPreferences/{email} {
  allow read, write: if isAuthenticated() && request.auth.token.email == email;
}
```

## 🎯 Usage Examples

### Creating Notifications

```typescript
import { useNotificationEvents } from '../hooks/useNotificationEvents';

const MyComponent = () => {
  const { notifyReportCreated, notifyEmailSent } = useNotificationEvents();

  const handleReportCreate = async report => {
    await notifyReportCreated(report);
  };

  const handleEmailSend = async (recipient, subject) => {
    await notifyEmailSent(recipient, subject);
  };
};
```

### Using Notification Context

```typescript
import { useNotifications } from '../contexts/NotificationContext';

const MyComponent = () => {
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications();

  const handleMarkAsRead = async id => {
    await markAsRead(id);
  };
};
```

## 🌍 Localization

All notification text is localized in Swedish using the `useIntl` hook:

```typescript
const { t } = useIntl();

// Usage examples
t('notifications.title'); // "Notifieringar"
t('notifications.markAllAsRead'); // "Markera alla som lästa"
t('notifications.noNotifications'); // "Inga notifieringar"
```

## 🚀 Deployment

### Prerequisites

- Firebase project configured
- Firestore rules deployed
- Authentication enabled
- Hosting configured

### Build and Deploy

```bash
npm run build
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

## 🧪 Testing

### Manual Testing

1. Login with test credentials
2. Click notification bell icon
3. Verify real-time updates
4. Test notification actions
5. Configure settings
6. Test different user roles

### Test Credentials

- **Superadmin**: `admin@taklaget.onmicrosoft.com` / `Taklaget2025!`
- **Branch Admin**: `malmo.manager@taklaget.se` / `Malmo2025!`
- **Inspector**: `petra.petersson@taklaget.se` / `Petra2025!`

## 📈 Performance

### Optimization Features

- **Real-time Subscriptions**: Efficient Firestore listeners
- **Pagination**: Limited notification queries (50 most recent)
- **Cleanup**: Automatic old notification removal
- **Caching**: Optimized state management
- **Error Boundaries**: Graceful error handling

### Monitoring

- Console logging for debugging
- Error tracking and reporting
- Performance metrics collection
- User interaction analytics

## 🔧 Maintenance

### Regular Tasks

- Monitor notification volume
- Clean up old notifications
- Update user preferences
- Review security rules
- Performance optimization

### Troubleshooting

- Check Firestore rules
- Verify user authentication
- Review console errors
- Test notification creation
- Validate user permissions

## 📞 Support

For technical support or questions about the notification system:

- **Development Team**: Taklaget Development Team
- **Version**: 1.0.0
- **Last Updated**: 2024-09-22
- **Documentation**: This file and inline code comments

---

_This notification system is production-ready and fully integrated with the Taklaget application._
