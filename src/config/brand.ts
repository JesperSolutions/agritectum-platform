/**
 * Brand Configuration
 * 
 * Centralized brand configuration for white-label deployment.
 * Replace these values with your organization's branding.
 */

export const BRAND_CONFIG = {
  // Company Information
  BRAND_NAME: import.meta.env.VITE_BRAND_NAME || 'Agritectum Platform',
  LEGAL_ENTITY: import.meta.env.VITE_LEGAL_ENTITY || 'Agritectum AB',
  LEGAL_ADDRESS: import.meta.env.VITE_LEGAL_ADDRESS || 'Professional Building Management, Sweden',
  COMPANY_NAME: import.meta.env.VITE_COMPANY_NAME || 'Agritectum Platform',
  
  // Contact Information
  SUPPORT_EMAIL: import.meta.env.VITE_SUPPORT_EMAIL || 'support@agritectum-platform.web.app',
  SUPPORT_PHONE: import.meta.env.VITE_SUPPORT_PHONE || '+46 123 456 789',
  FROM_EMAIL: import.meta.env.VITE_FROM_EMAIL || 'noreply@agritectum-platform.web.app',
  REPLY_TO_EMAIL: import.meta.env.VITE_REPLY_TO_EMAIL || 'support@agritectum-platform.web.app',
  
  // Website & URLs
  WEBSITE_URL: import.meta.env.VITE_WEBSITE_URL || 'https://agritectum-platform.web.app',
  UNSUBSCRIBE_URL: import.meta.env.VITE_UNSUBSCRIBE_URL || 'https://agritectum-platform.web.app/unsubscribe',
  
  // Email Configuration
  EMAIL_REASON: import.meta.env.VITE_EMAIL_REASON || 'You\'re receiving this because you have an account with our service.',
};

// Legacy export for backward compatibility
export const brandConfig = {
  brandName: BRAND_CONFIG.BRAND_NAME,
  legalEntity: BRAND_CONFIG.LEGAL_ENTITY,
  legalAddress: BRAND_CONFIG.LEGAL_ADDRESS,
  companyName: BRAND_CONFIG.COMPANY_NAME,
  supportEmail: BRAND_CONFIG.SUPPORT_EMAIL,
  supportPhone: BRAND_CONFIG.SUPPORT_PHONE,
  fromEmail: BRAND_CONFIG.FROM_EMAIL,
  replyToEmail: BRAND_CONFIG.REPLY_TO_EMAIL,
  website: BRAND_CONFIG.WEBSITE_URL,
  unsubscribeUrl: BRAND_CONFIG.UNSUBSCRIBE_URL,
  emailReason: BRAND_CONFIG.EMAIL_REASON,
};

/**
 * Get brand configuration for email templates
 */
export const getBrandConfig = () => ({
  brandName: brandConfig.brandName,
  legalEntity: brandConfig.legalEntity,
  legalAddress: brandConfig.legalAddress,
  emailReason: brandConfig.emailReason,
  unsubscribeUrl: brandConfig.unsubscribeUrl,
  fromEmail: brandConfig.fromEmail,
  replyToEmail: brandConfig.replyToEmail,
  companyName: brandConfig.companyName,
  website: brandConfig.website,
  supportEmail: brandConfig.supportEmail,
  supportPhone: brandConfig.supportPhone,
});

