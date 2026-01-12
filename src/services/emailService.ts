/**
 * @legacy
 * @deprecated Legacy email service wrapper - now redirects to Trigger Email service
 * @movedDate 2025-01-11 (marked as legacy)
 * @reason This file is a legacy wrapper for backward compatibility
 * 
 * This file was marked as legacy on 2025-01-11 because:
 * - It re-exports everything from triggerEmailService.ts
 * - Kept for backward compatibility only
 * - Should be migrated to triggerEmailService.ts
 * 
 * Migration: Import directly from './triggerEmailService' instead of './emailService'
 * See src/legacy/ARCHIVE_MANIFEST.md for details
 */

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
