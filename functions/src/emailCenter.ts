export type EmailServiceMode = 'disabled' | 'log-only' | 'enabled';
export type EmailProviderId = 'trigger-email-extension' | 'sendgrid';

export interface EmailCenterConfig {
  mode: EmailServiceMode;
  provider: EmailProviderId;
}

const normalizeMode = (value?: string): EmailServiceMode => {
  if (value === 'enabled' || value === 'log-only' || value === 'disabled') {
    return value;
  }
  return 'disabled';
};

const normalizeProvider = (value?: string): EmailProviderId => {
  if (value === 'sendgrid' || value === 'trigger-email-extension') {
    return value;
  }
  return 'trigger-email-extension';
};

export const getEmailCenterConfig = (): EmailCenterConfig => {
  const mode = normalizeMode(process.env.EMAIL_SERVICE_MODE);
  const provider = normalizeProvider(process.env.EMAIL_PROVIDER);

  return { mode, provider };
};

export const isEmailServiceEnabled = (): boolean => getEmailCenterConfig().mode === 'enabled';
export const isEmailServiceLogOnly = (): boolean => getEmailCenterConfig().mode === 'log-only';
export const isSendGridProvider = (): boolean => getEmailCenterConfig().provider === 'sendgrid';
