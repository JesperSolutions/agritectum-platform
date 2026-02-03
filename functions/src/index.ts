/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from 'firebase-functions';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Email functions for Trigger Email extension
import { queueMail, queueBulkMail } from './emailQueue';
import { mailerWebhook, addSuppression, removeSuppression, getSuppressions } from './mailerWebhook';
// SendGrid functions (disabled by default via EMAIL_SERVICE_MODE)
import { sendgridEmailTrigger } from './sendgridEmailTrigger';
import { sendgridWebhook } from './sendgridWebhook';
import { retryFailedSendgridEmails } from './retryFailedSendgridEmails';

// User management functions
import { setUserClaims, setUserClaimsHttp } from './setUserClaims';
import { createUserWithAuth } from './createUserWithAuth';
import { resetUserPassword, viewUserPassword } from './userPasswordManagement';

// Offer follow-up functions
import {
  checkOfferFollowUps,
  testOfferFollowUp,
  publicRespondToOffer,
  checkEmailHealth,
} from './offerFollowUp';

// Appointment reminder functions
import { sendAppointmentReminders } from './appointmentReminders';
// Backfill utilities
import { backfillOfferTimestamps } from './backfillOfferTimestamps';
import { backfillReportTimestamps } from './backfillReportTimestamps';

// User cleanup functions
// import { deleteLinusReports, deleteLinusReportsByEmail, dryRunLinusReports } from './deleteLinusReports';

// PDF generation functions
import { generateReportPDF } from './simplePdfService';

// Customer and building functions
import { onCustomerUserCreate } from './onCustomerUserCreate';
import { onBuildingCreate } from './onBuildingCreate';

// Relationship validation functions - Phase 3
import {
  validateReportBuilding,
  validateOfferReport,
  validateBuildingReferences,
  validateAppointmentReferences,
  validateDocumentRelationships,
} from './relationshipValidation';

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// Set global options for EU region
setGlobalOptions({
  maxInstances: 10,
  region: 'europe-west1',
});

// Export email functions
export { queueMail, queueBulkMail };
export { mailerWebhook, addSuppression, removeSuppression, getSuppressions };
export { sendgridEmailTrigger, sendgridWebhook, retryFailedSendgridEmails };

// Export user management functions
export { setUserClaims, setUserClaimsHttp };
export { createUserWithAuth };
export { resetUserPassword, viewUserPassword };

// Export offer follow-up functions
export { checkOfferFollowUps, testOfferFollowUp };
export { publicRespondToOffer };
export { checkEmailHealth };

// Export appointment reminder functions
export { sendAppointmentReminders };
// Export maintenance functions
export { backfillOfferTimestamps };
export { backfillReportTimestamps };

// Export user cleanup functions
// export { deleteLinusReports, deleteLinusReportsByEmail, dryRunLinusReports };

// Export PDF generation functions
export { generateReportPDF };

// Export customer and building functions
export { onCustomerUserCreate };
export { onBuildingCreate };

// Export relationship validation functions - Phase 3
export { validateReportBuilding };
export { validateOfferReport };
export { validateBuildingReferences };
export { validateAppointmentReferences };
export { validateDocumentRelationships };

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
