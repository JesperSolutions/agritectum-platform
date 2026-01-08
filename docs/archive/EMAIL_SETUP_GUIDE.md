# 📧 Email Setup Guide - SendGrid Integration

## 🚀 **Quick Setup (5 minutes)**

### **Step 1: Create SendGrid Account**

1. Go to [SendGrid.com](https://sendgrid.com)
2. Sign up for a free account (100 emails/day)
3. Verify your email address

### **Step 2: Get API Key**

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Choose **Restricted Access**
4. Give it a name: "Taklaget Email Service"
5. Set permissions:
   - ✅ **Mail Send**: Full Access
   - ✅ **Mail Settings**: Read Access
6. Click **Create & View**
7. **Copy the API key** (you won't see it again!)

### **Step 3: Configure Environment Variables**

Create a `.env.local` file in your project root:

```bash
# SendGrid Configuration
VITE_SENDGRID_API_KEY=your_sendgrid_api_key_here

# Optional: Custom from email (defaults to noreply@taklaget.se)
VITE_FROM_EMAIL=reports@taklaget.se
```

### **Step 4: Verify Domain (Optional but Recommended)**

1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Add your domain: `taklaget.se`
4. Follow the DNS setup instructions
5. This prevents emails from going to spam

## 🔧 **Alternative: AWS SES Setup**

If you prefer AWS SES (cheaper for high volume):

### **Step 1: AWS Account**

1. Create AWS account
2. Go to **SES** service
3. Verify your email address

### **Step 2: Get Credentials**

1. Go to **IAM** → **Users**
2. Create user with **SESFullAccess** policy
3. Generate access keys

### **Step 3: Update Environment**

```bash
VITE_AWS_ACCESS_KEY_ID=your_access_key
VITE_AWS_SECRET_ACCESS_KEY=your_secret_key
VITE_AWS_REGION=eu-west-1
```

## 🧪 **Testing Email Functionality**

### **Test SendGrid Connection**

```javascript
import { testSendGridConnection } from './src/services/sendgridService';

// Test if SendGrid is working
const isConnected = await testSendGridConnection();
console.log('SendGrid connected:', isConnected);
```

### **Test Email Sending**

1. **Log in** to your app
2. **Go to any report**
3. **Click "Send to Customer"**
4. **Check your email** (or the recipient's email)
5. **Check console** for success/error messages

## 📊 **Email Service Comparison**

| Service        | Free Tier    | Cost After Free | Setup Difficulty | Reliability          |
| -------------- | ------------ | --------------- | ---------------- | -------------------- |
| **SendGrid**   | 100/day      | $19.95/month    | ⭐⭐ Easy        | ⭐⭐⭐⭐⭐ Excellent |
| **AWS SES**    | 62,000/month | $0.10/1,000     | ⭐⭐⭐ Medium    | ⭐⭐⭐⭐⭐ Excellent |
| **Nodemailer** | Free         | Varies          | ⭐⭐⭐⭐ Hard    | ⭐⭐⭐ Good          |

## 🎯 **Recommended Setup for Taklaget**

### **For Development/Testing**

- **SendGrid Free Tier**: 100 emails/day
- **Perfect for**: Testing and small-scale usage
- **Setup time**: 5 minutes

### **For Production**

- **SendGrid Pro**: $19.95/month for 50,000 emails
- **Or AWS SES**: $0.10 per 1,000 emails (much cheaper for high volume)
- **Domain verification**: Essential for deliverability

## 🔒 **Security Notes**

### **Environment Variables**

- ✅ **Never commit** `.env.local` to git
- ✅ **Use** `.env.example` for documentation
- ✅ **Rotate** API keys regularly

### **Email Security**

- ✅ **Verify domain** to prevent spam
- ✅ **Use HTTPS** for all email links
- ✅ **Validate** email addresses before sending

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"API key not configured"**
   - Check `.env.local` file exists
   - Verify `VITE_SENDGRID_API_KEY` is set
   - Restart development server

2. **"Email sending failed"**
   - Check SendGrid account status
   - Verify API key permissions
   - Check email address format

3. **"Emails going to spam"**
   - Verify your domain with SendGrid
   - Use proper from email address
   - Include unsubscribe links

### **Debug Steps**

1. **Check console** for error messages
2. **Test connection** with `testSendGridConnection()`
3. **Verify API key** in SendGrid dashboard
4. **Check email logs** in SendGrid activity

## 🎉 **Next Steps After Setup**

1. **Test email sending** with a real report
2. **Verify domain** for better deliverability
3. **Monitor email logs** in SendGrid dashboard
4. **Set up email templates** for different report types
5. **Add unsubscribe functionality** (required for production)

Your email system will be fully functional once you complete the SendGrid setup! 🚀
