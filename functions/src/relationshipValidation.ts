/**
 * Relationship Validation Functions - Phase 3
 * Prevents invalid foreign key references from being created
 */

import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const db = admin.firestore();

/**
 * Validates that a report's buildingId references an existing building
 */
export const validateReportBuilding = onDocumentCreated(
  { document: 'reports/{reportId}', region: 'europe-west1' },
  async (event) => {
  const reportData = event.data?.data();
  if (!reportData) return;

  const buildingId = reportData.buildingId;
  if (!buildingId) {
    console.error(`Report ${event.params.reportId} created without buildingId`);
    // Don't delete - just log. Firestore rules should prevent this.
    return;
  }

  // Check if building exists
  const buildingDoc = await db.collection('buildings').doc(buildingId).get();
  if (!buildingDoc.exists) {
    console.error(
      `Report ${event.params.reportId} references non-existent building: ${buildingId}`
    );
    // Log for monitoring but don't auto-delete to avoid data loss
    await db.collection('validation_errors').add({
      type: 'invalid_building_reference',
      collection: 'reports',
      documentId: event.params.reportId,
      invalidField: 'buildingId',
      invalidValue: buildingId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    console.log(`✓ Report ${event.params.reportId} has valid building reference`);
  }
});

/**
 * Validates that an offer's reportId references an existing report
 */
export const validateOfferReport = onDocumentCreated(
  { document: 'offers/{offerId}', region: 'europe-west1' },
  async (event) => {
  const offerData = event.data?.data();
  if (!offerData) return;

  const reportId = offerData.reportId;
  if (!reportId) {
    console.error(`Offer ${event.params.offerId} created without reportId`);
    return;
  }

  const reportDoc = await db.collection('reports').doc(reportId).get();
  if (!reportDoc.exists) {
    console.error(`Offer ${event.params.offerId} references non-existent report: ${reportId}`);
    await db.collection('validation_errors').add({
      type: 'invalid_report_reference',
      collection: 'offers',
      documentId: event.params.offerId,
      invalidField: 'reportId',
      invalidValue: reportId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    console.log(`✓ Offer ${event.params.offerId} has valid report reference`);
  }
});

/**
 * Validates that a building's customerId/companyId references exist
 */
export const validateBuildingReferences = onDocumentCreated(
  { document: 'buildings/{buildingId}', region: 'europe-west1' },
  async (event) => {
    const buildingData = event.data?.data();
    if (!buildingData) return;

    const customerId = buildingData.customerId;
    const companyId = buildingData.companyId;

    // Check XOR constraint
    if (customerId && companyId) {
      console.warn(
        `Building ${event.params.buildingId} has both customerId and companyId (should have only one)`
      );
      await db.collection('validation_errors').add({
        type: 'building_multiple_owners',
        collection: 'buildings',
        documentId: event.params.buildingId,
        invalidField: 'customerId,companyId',
        invalidValue: `customer: ${customerId}, company: ${companyId}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    if (!customerId && !companyId) {
      console.error(`Building ${event.params.buildingId} has neither customerId nor companyId`);
      await db.collection('validation_errors').add({
        type: 'building_no_owner',
        collection: 'buildings',
        documentId: event.params.buildingId,
        invalidField: 'customerId,companyId',
        invalidValue: 'both missing',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    // Validate customerId if present
    if (customerId) {
      const customerDoc = await db.collection('customers').doc(customerId).get();
      if (!customerDoc.exists) {
        console.error(
          `Building ${event.params.buildingId} references non-existent customer: ${customerId}`
        );
        await db.collection('validation_errors').add({
          type: 'invalid_customer_reference',
          collection: 'buildings',
          documentId: event.params.buildingId,
          invalidField: 'customerId',
          invalidValue: customerId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        console.log(`✓ Building ${event.params.buildingId} has valid customer reference`);
      }
    }

    // Validate companyId if present
    if (companyId) {
      const companyDoc = await db.collection('companies').doc(companyId).get();
      if (!companyDoc.exists) {
        console.error(
          `Building ${event.params.buildingId} references non-existent company: ${companyId}`
        );
        await db.collection('validation_errors').add({
          type: 'invalid_company_reference',
          collection: 'buildings',
          documentId: event.params.buildingId,
          invalidField: 'companyId',
          invalidValue: companyId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        console.log(`✓ Building ${event.params.buildingId} has valid company reference`);
      }
    }
  }
);

/**
 * Validates that appointments reference valid inspectors and customers
 */
export const validateAppointmentReferences = onDocumentCreated(
  { document: 'appointments/{appointmentId}', region: 'europe-west1' },
  async (event) => {
    const appointmentData = event.data?.data();
    if (!appointmentData) return;

    const inspectorId = appointmentData.assignedInspectorId;
    const customerId = appointmentData.customerId;

    // Validate inspector
    if (!inspectorId) {
      console.error(`Appointment ${event.params.appointmentId} created without assignedInspectorId`);
      return;
    }

    const userDoc = await db.collection('users').doc(inspectorId).get();
    if (!userDoc.exists) {
      console.error(
        `Appointment ${event.params.appointmentId} references non-existent inspector: ${inspectorId}`
      );
      await db.collection('validation_errors').add({
        type: 'invalid_inspector_reference',
        collection: 'appointments',
        documentId: event.params.appointmentId,
        invalidField: 'assignedInspectorId',
        invalidValue: inspectorId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      const userData = userDoc.data();
      if (
        userData?.role !== 'inspector' &&
        userData?.role !== 'branchAdmin' &&
        userData?.role !== 'superadmin'
      ) {
        console.warn(
          `Appointment ${event.params.appointmentId} assigned to non-inspector: ${userData?.role}`
        );
      } else {
        console.log(`✓ Appointment ${event.params.appointmentId} has valid inspector reference`);
      }
    }

    // Validate customer if present
    if (customerId) {
      const customerDoc = await db.collection('customers').doc(customerId).get();
      if (!customerDoc.exists) {
        console.error(
          `Appointment ${event.params.appointmentId} references non-existent customer: ${customerId}`
        );
        await db.collection('validation_errors').add({
          type: 'invalid_customer_reference',
          collection: 'appointments',
          documentId: event.params.appointmentId,
          invalidField: 'customerId',
          invalidValue: customerId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  }
);

/**
 * HTTP callable function to manually validate a document's relationships
 * Usage: functions.httpsCallable('validateDocumentRelationships')({ collection: 'reports', docId: 'xyz' })
 */
export const validateDocumentRelationships = onCall(
  { region: 'europe-west1' },
  async (request) => {
  const { collection, docId } = request.data;

  if (!collection || !docId) {
    throw new HttpsError('invalid-argument', 'Missing collection or docId');
  }

  const doc = await db.collection(collection).doc(docId).get();
  if (!doc.exists) {
    throw new HttpsError('not-found', `Document ${collection}/${docId} not found`);
  }

  const data = doc.data();
  if (!data) {
    throw new HttpsError('not-found', 'Document has no data');
  }

  const issues: string[] = [];

  // Validate based on collection
  switch (collection) {
    case 'reports':
      if (data.buildingId) {
        const building = await db.collection('buildings').doc(data.buildingId).get();
        if (!building.exists) {
          issues.push(`Invalid buildingId: ${data.buildingId}`);
        }
      }
      break;

    case 'offers':
      if (data.reportId) {
        const report = await db.collection('reports').doc(data.reportId).get();
        if (!report.exists) {
          issues.push(`Invalid reportId: ${data.reportId}`);
        }
      }
      break;

    case 'buildings':
      if (data.customerId) {
        const customer = await db.collection('customers').doc(data.customerId).get();
        if (!customer.exists) {
          issues.push(`Invalid customerId: ${data.customerId}`);
        }
      }
      if (data.companyId) {
        const company = await db.collection('companies').doc(data.companyId).get();
        if (!company.exists) {
          issues.push(`Invalid companyId: ${data.companyId}`);
        }
      }
      if (data.customerId && data.companyId) {
        issues.push('Has both customerId and companyId (should have only one)');
      }
      if (!data.customerId && !data.companyId) {
        issues.push('Missing both customerId and companyId (must have one)');
      }
      break;

    case 'appointments':
      if (data.assignedInspectorId) {
        const inspector = await db.collection('users').doc(data.assignedInspectorId).get();
        if (!inspector.exists) {
          issues.push(`Invalid assignedInspectorId: ${data.assignedInspectorId}`);
        }
      }
      if (data.customerId) {
        const customer = await db.collection('customers').doc(data.customerId).get();
        if (!customer.exists) {
          issues.push(`Invalid customerId: ${data.customerId}`);
        }
      }
      break;
  }

  return {
    valid: issues.length === 0,
    issues,
  };
});
