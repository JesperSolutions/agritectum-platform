/**
 * ESG Service
 *
 * Provides functions to calculate and manage ESG metrics for buildings.
 * Integrates with buildingService and reportService to aggregate data.
 * Also manages ESG Service Reports created by branch managers.
 */

import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Building, Report, ESGMetrics, ESGServiceReport, RoofDivisionAreas } from '../types';
import { calculateBuildingESG, calculateESGFromDivisions } from '../utils/esgCalculations';
import { getReportsByBuildingId } from './reportService';
import { getBuildingImprovements } from './buildingImprovementService';
import { logger } from '../utils/logger';

const removeUndefinedFields = <T extends Record<string, unknown>>(data: T): T => {
  const cleanedEntries = Object.entries(data).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      if (value === undefined) {
        return acc;
      }
      acc[key] = value;
      return acc;
    },
    {}
  );

  return cleanedEntries as T;
};

/**
 * Calculate ESG metrics for a building
 * @param building - Building object
 * @param branchId - Optional branch ID for filtering reports
 * @returns ESG metrics object
 */
export async function calculateBuildingESGMetrics(
  building: Building,
  branchId?: string
): Promise<ESGMetrics> {
  try {
    // Fetch reports for this building to get material cost data
    let reports: Report[] = [];
    try {
      reports = await getReportsByBuildingId(building.id, branchId);
    } catch (error) {
      logger.warn('Could not fetch reports for ESG calculation:', error);
      // Continue without reports - calculations will use defaults
    }

    // Fetch saved improvements for this building
    let savedImprovements = null;
    try {
      savedImprovements = await getBuildingImprovements(building.id);
    } catch (error) {
      logger.warn('Could not fetch improvements for ESG calculation:', error);
      // Continue without improvements
    }

    // Calculate comprehensive ESG metrics
    const metrics = calculateBuildingESG(building, reports);

    // If improvements exist, enhance the metrics
    if (savedImprovements && savedImprovements.improvements.length > 0) {
      // Enhance metrics with improvement impact
      const improvementImpact = savedImprovements.metrics;

      // Update metrics with improvement data
      metrics.sustainabilityScore = Math.min(
        100,
        metrics.sustainabilityScore +
          (improvementImpact.sustainabilityScore - (building.esgMetrics?.sustainabilityScore || 50))
      );
      metrics.annualCO2Offset += improvementImpact.annualCO2Reduction;
      metrics.solarPotential += improvementImpact.annualEnergySavings; // Add energy savings to solar potential
      metrics.neutralityTimeline =
        improvementImpact.neutralityTimeline || metrics.neutralityTimeline;

      // Update rating based on new score
      const { getSustainabilityRating } = await import('../utils/esgCalculations');
      metrics.rating = getSustainabilityRating(metrics.sustainabilityScore);
    }

    return {
      ...metrics,
      lastCalculated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error calculating ESG metrics:', error);
    throw new Error('Failed to calculate ESG metrics');
  }
}

/**
 * Get ESG metrics for a building (cached or calculated)
 * @param building - Building object
 * @param branchId - Optional branch ID
 * @param forceRecalculate - Force recalculation even if cached
 * @returns ESG metrics object
 */
export async function getBuildingESGMetrics(
  building: Building,
  branchId?: string,
  forceRecalculate: boolean = false
): Promise<ESGMetrics> {
  // If building already has cached metrics and not forcing recalculation
  if (building.esgMetrics && !forceRecalculate) {
    // Check if metrics are recent (less than 30 days old)
    if (building.esgMetrics.lastCalculated) {
      const lastCalculated = new Date(building.esgMetrics.lastCalculated);
      const daysSinceCalculation = (Date.now() - lastCalculated.getTime()) / (1000 * 60 * 60 * 24);

      // Use cached metrics if less than 30 days old
      if (daysSinceCalculation < 30) {
        return building.esgMetrics;
      }
    }
  }

  // Calculate new metrics
  return calculateBuildingESGMetrics(building, branchId);
}

/**
 * Calculate aggregated ESG metrics for multiple buildings
 * @param buildings - Array of building objects
 * @param branchId - Optional branch ID
 * @returns Aggregated ESG metrics
 */
export async function calculateAggregatedESG(
  buildings: Building[],
  branchId?: string
): Promise<{
  totalCarbonFootprint: number;
  totalAnnualCO2Offset: number;
  averageSustainabilityScore: number;
  totalSolarPotential: number;
  averageRecyclingPotential: number;
  totalSDGs: string[];
  buildingCount: number;
}> {
  const metrics = await Promise.all(
    buildings.map(building => calculateBuildingESGMetrics(building, branchId).catch(() => null))
  );

  const validMetrics = metrics.filter((m): m is ESGMetrics => m !== null);

  if (validMetrics.length === 0) {
    return {
      totalCarbonFootprint: 0,
      totalAnnualCO2Offset: 0,
      averageSustainabilityScore: 0,
      totalSolarPotential: 0,
      averageRecyclingPotential: 0,
      totalSDGs: [],
      buildingCount: 0,
    };
  }

  const totalCarbonFootprint = validMetrics.reduce((sum, m) => sum + m.carbonFootprint, 0);
  const totalAnnualCO2Offset = validMetrics.reduce((sum, m) => sum + m.annualCO2Offset, 0);
  const averageSustainabilityScore =
    validMetrics.reduce((sum, m) => sum + m.sustainabilityScore, 0) / validMetrics.length;
  const totalSolarPotential = validMetrics.reduce((sum, m) => sum + m.solarPotential, 0);
  const averageRecyclingPotential =
    validMetrics.reduce((sum, m) => sum + m.recyclingPotential, 0) / validMetrics.length;

  // Collect unique SDGs
  const allSDGs = new Set<string>();
  validMetrics.forEach(m => {
    m.sdgAlignment.forEach(sdg => allSDGs.add(sdg));
  });

  return {
    totalCarbonFootprint: Math.round(totalCarbonFootprint),
    totalAnnualCO2Offset: Math.round(totalAnnualCO2Offset),
    averageSustainabilityScore: Math.round(averageSustainabilityScore),
    totalSolarPotential: Math.round(totalSolarPotential),
    averageRecyclingPotential: Math.round(averageRecyclingPotential),
    totalSDGs: Array.from(allSDGs),
    buildingCount: validMetrics.length,
  };
}

/**
 * ESG Service Report Functions
 * Functions for managing ESG service reports created by branch managers
 */

/**
 * Create a new ESG service report
 * @param reportData - Report data (buildingId, branchId, roofSize, divisions)
 * @returns Created report ID
 */
export async function createESGServiceReport(
  reportData: Omit<
    ESGServiceReport,
    'id' | 'createdAt' | 'updatedAt' | 'calculatedMetrics' | 'isPublic' | 'publicLinkId'
  >
): Promise<string> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User must be authenticated');
    }

    // Validate divisions sum to 100
    const totalPercentage =
      reportData.divisions.greenRoof +
      reportData.divisions.noxReduction +
      reportData.divisions.coolRoof +
      reportData.divisions.socialActivities;

    if (Math.abs(totalPercentage - 100) > 0.1) {
      throw new Error('Division percentages must sum to 100%');
    }

    // Calculate ESG metrics from divisions
    const calculatedMetrics = calculateESGFromDivisions(reportData.roofSize, reportData.divisions);

    const reportsRef = collection(db, 'esgServiceReports');
    const reportWithDefaults = {
      ...reportData,
      createdBy: user.uid,
      calculatedMetrics,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cleanedData = removeUndefinedFields(reportWithDefaults);
    const docRef = await addDoc(reportsRef, cleanedData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating ESG service report:', error);
    throw error;
  }
}

/**
 * Update an existing ESG service report
 * @param reportId - Report ID
 * @param updates - Updates to apply
 */
export async function updateESGServiceReport(
  reportId: string,
  updates: Partial<Omit<ESGServiceReport, 'id' | 'createdAt' | 'createdBy' | 'branchId'>>
): Promise<void> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User must be authenticated');
    }

    // If divisions or roofSize are updated, recalculate metrics
    if (updates.divisions || updates.roofSize) {
      const report = await getESGServiceReport(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      const roofSize = updates.roofSize ?? report.roofSize;
      const divisions = updates.divisions ?? report.divisions;

      // Validate divisions sum to 100
      const totalPercentage =
        divisions.greenRoof +
        divisions.noxReduction +
        divisions.coolRoof +
        divisions.socialActivities;

      if (Math.abs(totalPercentage - 100) > 0.1) {
        throw new Error('Division percentages must sum to 100%');
      }

      // Recalculate metrics
      updates.calculatedMetrics = calculateESGFromDivisions(roofSize, divisions);
    }

    const reportRef = doc(db, 'esgServiceReports', reportId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const cleanedData = removeUndefinedFields(updateData);
    await updateDoc(reportRef, cleanedData);
  } catch (error) {
    console.error('Error updating ESG service report:', error);
    throw error;
  }
}

/**
 * Get an ESG service report by ID
 * @param reportId - Report ID
 * @returns Report object or null if not found
 */
export async function getESGServiceReport(reportId: string): Promise<ESGServiceReport | null> {
  try {
    const reportRef = doc(db, 'esgServiceReports', reportId);
    const reportSnap = await getDoc(reportRef);

    if (!reportSnap.exists()) {
      return null;
    }

    return {
      id: reportSnap.id,
      ...reportSnap.data(),
    } as ESGServiceReport;
  } catch (error) {
    console.error('Error getting ESG service report:', error);
    throw error;
  }
}

/**
 * Get all ESG service reports for a branch
 * @param branchId - Branch ID
 * @returns Array of reports
 */
export async function getESGServiceReportsByBranch(branchId: string): Promise<ESGServiceReport[]> {
  try {
    const reportsRef = collection(db, 'esgServiceReports');
    const q = query(reportsRef, where('branchId', '==', branchId), orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ESGServiceReport[];
  } catch (error) {
    console.error('Error getting ESG service reports:', error);
    throw error;
  }
}

/**
 * Get all ESG service reports for a building
 * @param buildingId - Building ID
 * @returns Array of reports
 */
export async function getESGServiceReportsByBuilding(
  buildingId: string,
  branchId?: string
): Promise<ESGServiceReport[]> {
  try {
    const reportsRef = collection(db, 'esgServiceReports');

    // Include branchId in query to satisfy Firestore security rules
    const constraints = [where('buildingId', '==', buildingId), orderBy('createdAt', 'desc')];

    // If branchId provided, add it to the query for security rule compliance
    if (branchId) {
      constraints.unshift(where('branchId', '==', branchId));
    }

    const q = query(reportsRef, ...constraints);

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ESGServiceReport[];
  } catch (error) {
    console.error('Error getting ESG service reports by building:', error);
    throw error;
  }
}

/**
 * Generate a public link for an ESG service report
 * @param reportId - Report ID
 * @returns Public link ID (unique identifier for public access)
 */
export async function generatePublicESGReportLink(reportId: string): Promise<string> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User must be authenticated');
    }

    // Generate unique public link ID
    const publicLinkId = `esg_${reportId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const reportRef = doc(db, 'esgServiceReports', reportId);
    await updateDoc(reportRef, {
      isPublic: true,
      publicLinkId,
      updatedAt: new Date().toISOString(),
    });

    return publicLinkId;
  } catch (error) {
    console.error('Error generating public ESG report link:', error);
    throw error;
  }
}

/**
 * Get a public ESG service report by public link ID
 * @param publicLinkId - Public link ID
 * @returns Report object or null if not found or not public
 */
export async function getPublicESGServiceReport(
  publicLinkId: string
): Promise<ESGServiceReport | null> {
  try {
    const reportsRef = collection(db, 'esgServiceReports');
    const q = query(
      reportsRef,
      where('publicLinkId', '==', publicLinkId),
      where('isPublic', '==', true)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as ESGServiceReport;
  } catch (error) {
    console.error('Error getting public ESG service report:', error);
    throw error;
  }
}

/**
 * Delete an ESG service report
 * @param reportId - Report ID
 */
export async function deleteESGServiceReport(reportId: string): Promise<void> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User must be authenticated');
    }

    const reportRef = doc(db, 'esgServiceReports', reportId);
    await deleteDoc(reportRef);
  } catch (error) {
    console.error('Error deleting ESG service report:', error);
    throw error;
  }
}
