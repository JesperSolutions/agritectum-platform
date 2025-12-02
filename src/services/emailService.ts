// Legacy email service - now redirects to Trigger Email service
// This file is kept for backward compatibility but should be migrated to triggerEmailService.ts

import { getFunctions, httpsCallable } from 'firebase/functions';

export * from './triggerEmailService';

export const checkEmailHealth = async (): Promise<'ok' | 'fail'> => {
  try {
    const functions = getFunctions();
    const fn = httpsCallable(functions, 'checkEmailHealth');
    const res = await fn();
    if (res.data && res.data.status === 'ok') return 'ok';
    return 'fail';
  } catch {
    return 'fail';
  }
};
