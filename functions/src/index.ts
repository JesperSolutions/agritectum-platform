
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

// User management functions
import { setUserClaims, setUserClaimsHttp } from './setUserClaims';
import { createUserWithAuth } from './createUserWithAuth';
import { createCustomerWithAuth } from './createCustomerWithAuth';
import { resetUserPassword, viewUserPassword } from './userPasswordManagement';

// Offer follow-up functions
import { checkOfferFollowUps, testOfferFollowUp, publicRespondToOffer, checkEmailHealth } from './offerFollowUp';
// Backfill utilities
import { backfillOfferTimestamps } from './backfillOfferTimestamps';
import { backfillReportTimestamps } from './backfillReportTimestamps';

// User cleanup functions
// import { deleteLinusReports, deleteLinusReportsByEmail, dryRunLinusReports } from './deleteLinusReports';

// PDF generation functions
import { generateReportPDF } from './simplePdfService';



// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// Set global options for EU region
setGlobalOptions({
  maxInstances: 10,
});

// Export email functions
export { queueMail, queueBulkMail };
export { mailerWebhook, addSuppression, removeSuppression, getSuppressions };

// Export user management functions
export { setUserClaims, setUserClaimsHttp };
export { createUserWithAuth };
export { createCustomerWithAuth };
export { resetUserPassword, viewUserPassword };

// Export offer follow-up functions
export { checkOfferFollowUps, testOfferFollowUp };
export { publicRespondToOffer };
export { checkEmailHealth };
// Export maintenance functions
export { backfillOfferTimestamps };
export { backfillReportTimestamps };

// Export user cleanup functions
// export { deleteLinusReports, deleteLinusReportsByEmail, dryRunLinusReports };

// Export PDF generation functions
export { generateReportPDF };



// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
