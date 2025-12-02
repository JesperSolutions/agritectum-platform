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
import { serverTimestamp } from 'firebase/firestore';
import { Report, User, canAccessAllBranches, canAccessBranch } from '../types';
import { generateReportPDF } from './simplePdfService';
import * as branchService from './branchService';

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
    const reports = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Report[];

    // Filter reports by customer name and optionally by email/phone
    const customerReports = reports.filter(report => {
      const nameMatch = report.customerName?.toLowerCase() === customerName.toLowerCase();
      
      if (nameMatch && (customerEmail || customerPhone)) {
        // If we have additional identifiers, use them for more precise matching
        const emailMatch = customerEmail ? report.customerEmail?.toLowerCase() === customerEmail.toLowerCase() : true;
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
    console.error('Error getting latest report for customer:', error);
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
    const reports = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Report[];
    
    // For inspectors, filter to show only their own reports
    let filteredReports = reports;
    if (user.permissionLevel === 0) {
      filteredReports = reports.filter(report => report.createdBy === user.uid);
    }
    
    // Sort manually in JavaScript (newest first)
    return filteredReports.sort((a, b) => {
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return bDate.getTime() - aDate.getTime();
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
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

    return { id: reportSnap.id, ...reportSnap.data() } as Report;
  } catch (error) {
    console.error('Error fetching report:', error);
    throw new Error('Failed to fetch report');
  }
};

export const createReport = async (
  reportData: Omit<Report, 'id'>,
  branchId?: string
): Promise<string> => {
  try {
    console.log('🔍 ReportService Debug - Creating report with:', { branchId, reportData });

    if (!branchId) {
      throw new Error('Branch ID is required to create a report');
    }

    // Find or create customer
    console.log('🔍 ReportService Debug - Finding/creating customer...');
    const { findOrCreateCustomer, updateCustomerStats } = await import('./customerService');
    const customerId = await findOrCreateCustomer({
      customerName: reportData.customerName,
      customerEmail: reportData.customerEmail,
      customerPhone: reportData.customerPhone,
      customerAddress: reportData.customerAddress,
      createdBy: reportData.createdBy,
      branchId: branchId,
    });
    console.log('🔍 ReportService Debug - Customer ID:', customerId);

    // Create the report document
    console.log('🔍 ReportService Debug - Creating report document...');
    const reportsRef = collection(db, 'reports');
    
    // Filter out undefined values to prevent Firestore errors
    const cleanReportData = Object.fromEntries(
      Object.entries(reportData).filter(([_, value]) => value !== undefined)
    );
    
    const docRef = await addDoc(reportsRef, {
      ...cleanReportData,
      branchId: branchId,
      createdAt: serverTimestamp(),
      lastEdited: serverTimestamp(),
    });
    console.log('🔍 ReportService Debug - Report created with ID:', docRef.id);

    // Update customer stats
    console.log('🔍 ReportService Debug - Updating customer stats...');
    await updateCustomerStats(customerId, reportData.estimatedCost || 0, false);
    console.log('🔍 ReportService Debug - Customer stats updated');

    return docRef.id;
  } catch (error) {
    console.error('🔍 ReportService Debug - Error creating report:', error);
    console.error('🔍 ReportService Debug - Error details:', {
      message: error.message,
      stack: error.stack,
      branchId,
      reportData,
    });
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
    console.error('Error updating report:', error);
    throw new Error('Failed to update report');
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
      console.error('Error updating customer stats on delete:', customerError);
      // Don't throw error as this is a background operation
    }
  } catch (error) {
    console.error('Error deleting report:', error);
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
        console.warn('Could not load branch information for PDF:', error);
      }
    }

    // Generate PDF using simplified service
    const result = await generateReportPDF(reportId, {
      format: 'A4',
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
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
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

export const getBranchReports = async (branchId: string, limitCount = 50): Promise<Report[]> => {
  try {
    const reportsRef = collection(db, 'reports');
    const q = query(
      reportsRef,
      where('branchId', '==', branchId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const reports: Report[] = [];

    querySnapshot.forEach(doc => {
      reports.push({ id: doc.id, ...doc.data() } as Report);
    });

    return reports;
  } catch (error) {
    console.error('Error fetching branch reports:', error);
    throw new Error('Failed to fetch branch reports');
  }
};
