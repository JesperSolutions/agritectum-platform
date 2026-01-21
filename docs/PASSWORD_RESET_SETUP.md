# Password Reset Setup Guide

## Overview

The password reset functionality has been implemented and allows users to reset their own passwords via email links.

## Implementation Details

### Components Created

1. **ForgotPasswordForm** (`src/components/forms/ForgotPasswordForm.tsx`)
   - User enters their email address
   - Sends password reset email via Firebase

2. **ResetPasswordForm** (`src/components/forms/ResetPasswordForm.tsx`)
   - User sets new password from email link
   - Validates password strength
   - Confirms password reset

### Routes Added

- `/forgot-password` - Forgot password form
- `/reset-password` - Reset password form (accessed via email link)

### Services Updated

- `src/services/authService.ts` - Added:
  - `sendPasswordReset()` - Sends password reset email
  - `verifyResetCode()` - Verifies reset code from email
  - `confirmPasswordReset()` - Confirms password reset with new password

## Firebase Configuration Required

### 1. Action URL Settings

The password reset email will redirect users to:

```
https://your-domain.com/reset-password
```

**For Production:**

- Go to Firebase Console > Authentication > Templates > Password reset
- Set the action URL to: `https://taklaget-service-app.web.app/reset-password`
- Or use your custom domain if configured

**For Test:**

- Set action URL to: `https://taklaget-service-app-test.web.app/reset-password`

### 2. Email Template Customization (Optional)

Firebase uses default email templates, but you can customize them:

1. Go to Firebase Console > Authentication > Templates
2. Select "Password reset"
3. Customize the email subject and body
4. The reset link will be automatically included

### 3. Authorized Domains

Ensure your domain is authorized:

1. Go to Firebase Console > Authentication > Settings > Authorized domains
2. Add your production domain (e.g., `taklaget-service-app.web.app`)
3. Add your custom domain if you have one

## How It Works

1. **User requests password reset:**
   - User clicks "Forgot password?" on login page
   - Enters their email address
   - System sends password reset email via Firebase

2. **User receives email:**
   - Email contains a secure link with reset code
   - Link expires after 1 hour (Firebase default)

3. **User resets password:**
   - Clicks link in email
   - Redirected to `/reset-password?oobCode=...&mode=resetPassword`
   - Enters new password (min 8 chars, uppercase, lowercase, number)
   - Password is reset and user is redirected to login

## Security Features

- Reset links expire after 1 hour
- Reset codes are single-use
- Password strength validation (min 8 chars, mixed case, numbers)
- Email verification before sending reset link
- No user enumeration (doesn't reveal if email exists)

## Testing

### Test Password Reset Flow:

1. Go to `/login`
2. Click "Forgot password?"
3. Enter a valid user email
4. Check email for reset link
5. Click link and set new password
6. Login with new password

### Test Error Cases:

- Invalid email format
- Expired reset link
- Weak password
- Mismatched passwords

## Troubleshooting

### Reset link doesn't work:

- Check Firebase action URL is set correctly
- Verify domain is authorized in Firebase
- Check that link hasn't expired (1 hour limit)

### Email not received:

- Check spam folder
- Verify email address is correct
- Check Firebase email sending limits
- Verify SMTP settings in Firebase (if using custom SMTP)

### Reset password page shows error:

- Verify reset code is valid and not expired
- Check browser console for errors
- Ensure Firebase project is correctly configured

## Notes

- The reset link format is: `/reset-password?oobCode=CODE&mode=resetPassword`
- Firebase automatically handles the reset code validation
- The action URL in `sendPasswordReset()` is set dynamically based on `window.location.origin`
- For production, ensure the action URL matches your deployed domain
