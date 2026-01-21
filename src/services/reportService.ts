import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { logger } from '../utils/logger';
import { serverTimestamp } from 'firebase/firestore';
import { Report, User, canAccessAllBranches, canAccessBranch } from '../types';
import * as branchService from './branchService';
import { migrateReport, migrateReports } from '../utils/reportMigration';

// Get the latest report for a specific customer
export const getLatestReportForCustomer = async (
  customerName: string,
  customerEmail?: string,
  customerPhone?: string,
  branchId?: string
): Promise<Report | null> => {
  try {
    const reportsRef = collection(db, 'reports');
    let q;

    if (branchId) {
      q = query(reportsRef, where('branchId', '==', branchId));
    } else {
      q = query(reportsRef);
    }

    const querySnapshot = await getDocs(q);
    const reports = querySnapshot.docs.map(doc =>
      migrateReport({
        id: doc.id,
        ...doc.data(),
      })
    ) as Report[];

    // Filter reports by customer name and optionally by email/phone
    const customerReports = reports.filter(report => {
      const nameMatch = report.customerName?.toLowerCase() === customerName.toLowerCase();

      if (nameMatch && (customerEmail || customerPhone)) {
        // If we have additional identifiers, use them for more precise matching
        const emailMatch = customerEmail
          ? report.customerEmail?.toLowerCase() === customerEmail.toLowerCase()
          : true;
        const phoneMatch = customerPhone ? report.customerPhone === customerPhone : true;
        return emailMatch && phoneMatch;
      }

      return nameMatch;
    });

    if (customerReports.length === 0) {
      return null;
    }

    // Sort by creation date (newest first) and return the latest
    customerReports.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return customerReports[0];
  } catch (error) {
    return null;
  }
};

export const getReports = async (user: User): Promise<Report[]> => {
  try {
    const reportsRef = collection(db, 'reports');
    let q;

    // Use simpler queries that don't require complex indexes
    if (canAccessAllBranches(user.permissionLevel)) {
      // Permission level 2 (Super Admin) can see all reports from all branches
      q = query(reportsRef);
    } else if (user.permissionLevel >= 1 && user.branchId) {
      // Permission level 1 (Branch Admin) can see all reports from their branch
      q = query(reportsRef, where('branchId', '==', user.branchId));
    } else if (user.permissionLevel >= 0 && user.branchId) {
      // Permission level 0 (Inspector) can see all reports from their branch
      // This allows them to relate new reports to existing ones
      q = query(reportsRef, where('branchId', '==', user.branchId));
    } else {
      // No access
      return [];
    }

    const querySnapshot = await getDocs(q);
    const reports = querySnapshot.docs.map(doc =>
      migrateReport({
        id: doc.id,
        ...doc.data(),
      })
    ) as Report[];

    // Inspectors can see all reports in their branch (no additional filtering)
    // This allows them to see customer history and relate reports

    // Sort manually in JavaScript (newest first)
    return reports.sort((a, b) => {
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return bDate.getTime() - aDate.getTime();
    });
  } catch (error) {
    throw new Error('Failed to fetch reports');
  }
};

export const getReport = async (reportId: string, branchId?: string): Promise<Report | null> => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const reportSnap = await getDoc(reportRef);

    if (!reportSnap.exists()) {
      return null;
    }

    return migrateReport({ id: reportSnap.id, ...reportSnap.data() }) as Report;
  } catch (error) {
    throw new Error('Failed to fetch report');
  }
};

// Get reports by building ID
export const getReportsByBuildingId = async (
  buildingId: string,
  branchId?: string,
  companyId?: string
): Promise<Report[]> => {
  try {
    const reportsRef = collection(db, 'reports');

    // Simple query: just filter by buildingId
    // Firestore security rules will handle access control
    const q = query(reportsRef, where('buildingId', '==', buildingId));

    const querySnapshot = await getDocs(q);

    const results = querySnapshot.docs.map(doc =>
      migrateReport({
        id: doc.id,
        ...doc.data(),
      })
    ) as Report[];

    // Sort by createdAt descending (client-side)
    const sortedResults = results.sort((a, b) => {
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return bDate.getTime() - aDate.getTime();
    });

    return sortedResults;
  } catch (error: any) {
    throw error;
  }
};

export const getReportsByCustomerId = async (
  customerId: string,
  branchId?: string
): Promise<Report[]> => {
  try {
    const reportsRef = collection(db, 'reports');
    let q;

    // Try to query by customerId first (for new reports)
    try {
      if (branchId) {
        q = query(
          reportsRef,
          where('customerId', '==', customerId),
          where('branchId', '==', branchId)
        );
      } else {
        q = query(reportsRef, where('customerId', '==', customerId));
      }

      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc =>
        migrateReport({
          id: doc.id,
          ...doc.data(),
        })
      ) as Report[];

      // Sort by createdAt descending (client-side)
      const sortedReports = reports.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return bDate.getTime() - aDate.getTime();
      });

      // If we found reports with customerId, return them
      if (sortedReports.length > 0) {
        return sortedReports;
      }
    } catch (indexError: any) {
      // If index doesn't exist, fall back to client-side filtering
      if (
        indexError.code === 'failed-precondition' ||
        indexError.code === 9 ||
        indexError.message?.includes('index')
      ) {
        logger.warn(
          '⚠️ Missing Firestore index for customerId. Falling back to client-side filtering.'
        );
      }
    }

    // Fallback: Get all reports and filter by customerId or customerName
    // First, get the customer to match by name
    const { getCustomerById } = await import('./customerService');
    const customer = await getCustomerById(customerId);

    if (!customer) {
      return [];
    }

    // Fetch all reports (with branch filter if provided)
    if (branchId) {
      q = query(reportsRef, where('branchId', '==', branchId));
    } else {
      q = query(reportsRef);
    }

    const querySnapshot = await getDocs(q);
    const allReports = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Report[];

    // Filter by customerId (for new reports) or customerName (for legacy reports)
    const customerReports = allReports.filter(report => {
      // Match by customerId if available
      if (report.customerId === customerId) {
        return true;
      }
      // Fallback: match by customer name for legacy reports
      if (report.customerName?.toLowerCase() === customer.name?.toLowerCase()) {
        return true;
      }
      return false;
    });

    // Sort by creation date (newest first)
    return customerReports.sort((a, b) => {
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return bDate.getTime() - aDate.getTime();
    });
  } catch (error) {
    throw new Error('Failed to fetch reports by customer ID');
  }
};

export const createReport = async (
  reportData: Omit<Report, 'id'>,
  branchId?: string
): Promise<string> => {
  try {
    logger.log('🔍 ReportService Debug - Creating report with:', { branchId, reportData });

    if (!branchId) {
      throw new Error('Branch ID is required to create a report');
    }

    // Find or create customer
    logger.log('🔍 ReportService Debug - Finding/creating customer...');
    const { findOrCreateCustomer, updateCustomerStats } = await import('./customerService');
    const customerId = await findOrCreateCustomer({
      customerName: reportData.customerName,
      customerEmail: reportData.customerEmail,
      customerPhone: reportData.customerPhone,
      customerAddress: reportData.customerAddress,
      createdBy: reportData.createdBy,
      branchId: branchId,
    });
    logger.log('🔍 ReportService Debug - Customer ID:', customerId);

    // Find or create building - all reports must be linked to a building
    logger.log('🔍 ReportService Debug - Finding/creating building...');
    const { findOrCreateBuilding, getBuildingById } = await import('./buildingService');

    let buildingId: string;

    // If buildingId is provided, use it (user selected existing building)
    if (reportData.buildingId) {
      buildingId = reportData.buildingId;
      logger.log('🔍 ReportService Debug - Using provided building ID:', buildingId);
    } else {
      // Otherwise, find or create building based on address
      const buildingAddress = reportData.buildingAddress || reportData.customerAddress;

      if (!buildingAddress) {
        throw new Error('Building address is required to create a report');
      }

      buildingId = await findOrCreateBuilding(
        customerId,
        buildingAddress,
        branchId,
        reportData.roofType,
        reportData.roofSize,
        undefined, // buildingType - can be inferred later
        reportData.createdBy
      );
      logger.log('🔍 ReportService Debug - Created/found building ID:', buildingId);
    }

    // Get building details to use as source of truth
    const building = await getBuildingById(buildingId);

    // Get customer's company ID if they belong to a company
    const { getCustomerById } = await import('./customerService');
    const customer = await getCustomerById(customerId);
    const companyId = customer?.companyId;

    // Create the report document
    logger.log('🔍 ReportService Debug - Creating report document...');
    const reportsRef = collection(db, 'reports');

    // Use building data as source of truth for roof information
    const reportWithBuilding = {
      ...reportData,
      buildingId: buildingId, // Required: Link to building
      customerId: customerId,
      companyId: companyId, // Add company ID for easier filtering by customers in companies
      buildingName: building?.name || 'N/A', // Add building name from linked building
      buildingAddress: building?.address || buildingAddress, // Use building address as source of truth
      roofType: building?.roofType || reportData.roofType, // Prefer building's roof type
      roofSize: building?.roofSize || reportData.roofSize, // Prefer building's roof size
      // Add building snapshot for audit trail
      buildingSnapshot: building
        ? {
            id: building.id,
            buildingId: building.id,
            address: building.address,
            buildingType: building.buildingType,
            roofType: building.roofType,
            roofSize: building.roofSize,
            latitude: building.latitude,
            longitude: building.longitude,
            changedBy: reportData.createdBy,
            changedAt: new Date().toISOString(),
          }
        : undefined,
    };

    // Filter out undefined values to prevent Firestore errors
    const cleanReportData = Object.fromEntries(
      Object.entries(reportWithBuilding).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(reportsRef, {
      ...cleanReportData,
      branchId: branchId,
      createdAt: serverTimestamp(),
      lastEdited: serverTimestamp(),
    });
    logger.log('🔍 ReportService Debug - Report created with ID:', docRef.id);

    // Update customer stats
    logger.log('🔍 ReportService Debug - Updating customer stats...');
    await updateCustomerStats(customerId, reportData.estimatedCost || 0, false);
    logger.log('🔍 ReportService Debug - Customer stats updated');

    // Send notification to customer when report is completed
    if (reportData.status === 'completed' && customer?.email) {
      try {
        const { createNotification, sendEmailNotification } = await import('./notificationService');

        // Get user document to find userId
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('email', '==', customer.email));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const userId = userSnapshot.docs[0].id;

          // Create in-app notification
          await createNotification({
            userId,
            customerId: customerId,
            type: 'report_completed',
            title: 'Inspection Report Ready',
            message: `Your inspection report for ${building?.address || buildingAddress} is now available.`,
            link: `/portal/buildings/${buildingId}`,
            metadata: {
              reportId: docRef.id,
              buildingId: buildingId,
            },
          });

          // 📧 EMAIL NOTIFICATIONS - Currently disabled for testing
          // TODO: Enable email notifications once testing is complete
          // Uncomment the block below to send email notifications to customers
          /*
          if (customer.notificationPreferences?.email !== false) {
            await sendEmailNotification(
              customer.email,
              'Your Inspection Report is Ready',
              `Hello ${customer.name},\n\nYour inspection report for the property at ${building?.address || buildingAddress} has been completed and is now available for review.\n\nPlease log in to your customer portal to view the full report.\n\nBest regards,\nAgritectum Team`
            );
          }
          */
        }
      } catch (notificationError) {
        logger.error('Failed to send notification:', notificationError);
        // Don't throw - report creation should succeed even if notification fails
      }
    }

    return docRef.id;
  } catch (error) {
    throw new Error(`Failed to create report: ${error.message}`);
  }
};

export const updateReport = async (
  reportId: string,
  updates: Partial<Report>,
  branchId?: string
): Promise<void> => {
  try {
    const reportRef = doc(db, 'reports', reportId);

    // Filter out undefined values to prevent Firestore errors
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(reportRef, {
      ...cleanUpdates,
      lastEdited: serverTimestamp(),
    });
  } catch (error) {
    // Check if it's a permission error
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied: You do not have access to update this report');
    }

    throw new Error('Failed to update report: ' + error.message);
  }
};

export const deleteReport = async (reportId: string, branchId?: string): Promise<void> => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const reportSnap = await getDoc(reportRef);

    if (!reportSnap.exists()) {
      throw new Error('Report not found');
    }

    const reportData = { id: reportSnap.id, ...reportSnap.data() } as Report;
    await deleteDoc(reportRef);

    // Update customer stats if we have report data
    try {
      const { searchCustomers, updateCustomerStats } = await import('./customerService');
      const customers = await searchCustomers(reportData.customerName);
      const customer = customers.find(
        c => c.email === reportData.customerEmail || c.phone === reportData.customerPhone
      );

      if (customer) {
        await updateCustomerStats(customer.id, reportData.estimatedCost || 0, true);
      }
    } catch (customerError) {
      // Don't throw error as this is a background operation
    }
  } catch (error) {
    throw new Error('Failed to delete report');
  }
};

export const generatePDF = async (reportId: string, branchId?: string): Promise<string> => {
  try {
    const report = await getReport(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Get branch information if branchId is provided
    let branchInfo = null;
    if (branchId) {
      try {
        const branch = await branchService.getBranchById(branchId);
        if (branch) {
          branchInfo = {
            name: branch.name,
            logoUrl: branch.logoUrl,
          };
        }
      } catch (error) {
        logger.warn('Could not load branch information for PDF:', error);
      }
    }

    // Lazy load PDF generation service
    const { generateReportPDF } = await import('./simplePdfService');

    // Generate PDF using simplified service
    const result = await generateReportPDF(reportId, {
      format: 'A4',
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px',
      },
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate PDF');
    }

    const pdfBlob = result.blob!;

    // Upload to Firebase Storage
    const fileName = `reports/${reportId}/inspection-report-${Date.now()}.pdf`;
    const storageRef = ref(storage, fileName);

    const snapshot = await uploadBytes(storageRef, pdfBlob);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Update report with PDF link
    await updateReport(reportId, { pdfLink: downloadURL });

    return downloadURL;
  } catch (error) {
    throw new Error('Failed to generate PDF');
  }
};

export const getBranchReports = async (branchId: string, limitCount = 50): Promise<Report[]> => {
  try {
    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, where('branchId', '==', branchId), limit(limitCount));

    const querySnapshot = await getDocs(q);
    const reports: Report[] = [];

    querySnapshot.forEach(doc => {
      reports.push({ id: doc.id, ...doc.data() } as Report);
    });

    // Sort client-side since we removed orderBy to avoid requiring composite indexes
    return reports.sort((a, b) => {
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return bDate.getTime() - aDate.getTime();
    });
  } catch (error) {
    throw new Error('Failed to fetch branch reports');
  }
};
