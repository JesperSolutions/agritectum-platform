/**
 * Portfolio Service
 * Handles multi-building portfolio analytics and management
 */

import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Building,
  PortfolioMetrics,
  BuildingComparison,
  BuildingFinancialRecord,
  Report,
  ServiceAgreement,
  ScheduledVisit,
} from '../types';
import { logger } from '../utils/logger';

/**
 * Get portfolio metrics for a customer
 */
export const getPortfolioMetrics = async (customerId: string): Promise<PortfolioMetrics> => {
  try {
    // Fetch all buildings for customer
    const buildingsRef = collection(db, 'buildings');
    const buildingsQuery = query(
      buildingsRef,
      where('customerId', '==', customerId)
    );
    const buildingsSnapshot = await getDocs(buildingsQuery);
    const buildings = buildingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Building[];

    if (buildings.length === 0) {
      return {
        totalBuildings: 0,
        totalValue: 0,
        totalArea: 0,
        averageConditionScore: 0,
        totalAnnualCosts: 0,
        totalAnnualIncome: 0,
        portfolioROI: 0,
        buildingsRequiringAttention: 0,
        upcomingMaintenanceCount: 0,
        expiringDocumentsCount: 0,
      };
    }

    // Calculate metrics
    const totalBuildings = buildings.length;
    const totalValue = buildings.reduce((sum, b) => sum + (b.currentValue || 0), 0);
    const totalArea = buildings.reduce((sum, b) => sum + (b.totalArea || b.roofSize || 0), 0);
    const averageConditionScore =
      buildings.reduce((sum, b) => sum + (b.conditionScore || 75), 0) / totalBuildings;

    // Count buildings requiring attention (condition score < 60)
    const buildingsRequiringAttention = buildings.filter(
      b => (b.conditionScore || 75) < 60
    ).length;

    // Get financial data for all buildings
    const financialPromises = buildings.map(b => getBuildingFinancials(b.id));
    const financialResults = await Promise.all(financialPromises);

    const totalAnnualCosts = financialResults.reduce((sum, f) => sum + f.expenses, 0);
    const totalAnnualIncome = financialResults.reduce((sum, f) => sum + f.income, 0);
    const portfolioROI = totalValue > 0 ? ((totalAnnualIncome - totalAnnualCosts) / totalValue) * 100 : 0;

    // Get upcoming maintenance count
    const upcomingMaintenanceCount = await getUpcomingMaintenanceCount(buildings);

    // Get expiring documents count
    const expiringDocumentsCount = await getExpiringDocumentsCount(buildings);

    return {
      totalBuildings,
      totalValue,
      totalArea,
      averageConditionScore,
      totalAnnualCosts,
      totalAnnualIncome,
      portfolioROI,
      buildingsRequiringAttention,
      upcomingMaintenanceCount,
      expiringDocumentsCount,
    };
  } catch (error) {
    logger.error('Error getting portfolio metrics:', error);
    throw new Error('Failed to load portfolio metrics');
  }
};

/**
 * Compare multiple buildings
 */
export const compareBu buildings = async (buildingIds: string[]): Promise<BuildingComparison[]> => {
  try {
    const comparisons: BuildingComparison[] = [];

    for (const buildingId of buildingIds) {
      const building = await getBuildingById(buildingId);
      if (!building) continue;

      const financials = await getBuildingFinancials(buildingId);
      const reports = await getBuildingReports(buildingId);
      const lastReport = reports[0]; // Assuming sorted by date desc

      const area = building.totalArea || building.roofSize || 1;
      const issuesCount = lastReport?.issuesFound?.length || 0;

      comparisons.push({
        buildingId: building.id,
        buildingName: building.name || building.address,
        address: building.address,
        totalCosts: financials.expenses,
        costPerSqm: financials.expenses / area,
        maintenanceFrequency: reports.length,
        conditionScore: building.conditionScore || 75,
        lastInspectionDate: lastReport?.inspectionDate,
        issuesCount,
      });
    }

    return comparisons.sort((a, b) => b.totalCosts - a.totalCosts);
  } catch (error) {
    logger.error('Error comparing buildings:', error);
    throw new Error('Failed to compare buildings');
  }
};

/**
 * Get building by ID
 */
const getBuildingById = async (buildingId: string): Promise<Building | null> => {
  try {
    const buildingRef = collection(db, 'buildings');
    const snapshot = await getDocs(query(buildingRef, where('__name__', '==', buildingId)));
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Building;
  } catch (error) {
    return null;
  }
};

/**
 * Get building financials (mock - to be implemented with real data)
 */
const getBuildingFinancials = async (buildingId: string): Promise<{ income: number; expenses: number }> => {
  try {
    const financialsRef = collection(db, 'buildingFinancials');
    const q = query(financialsRef, where('buildingId', '==', buildingId));
    const snapshot = await getDocs(q);

    let income = 0;
    let expenses = 0;

    snapshot.docs.forEach(doc => {
      const record = doc.data() as BuildingFinancialRecord;
      if (record.type === 'income') {
        income += record.amount;
      } else {
        expenses += record.amount;
      }
    });

    return { income, expenses };
  } catch (error) {
    return { income: 0, expenses: 0 };
  }
};

/**
 * Get building reports
 */
const getBuildingReports = async (buildingId: string): Promise<Report[]> => {
  try {
    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, where('buildingId', '==', buildingId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Report[];
  } catch (error) {
    return [];
  }
};

/**
 * Get upcoming maintenance count
 */
const getUpcomingMaintenanceCount = async (buildings: Building[]): Promise<number> => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let count = 0;
    for (const building of buildings) {
      const visitsRef = collection(db, 'scheduledVisits');
      const q = query(
        visitsRef,
        where('buildingId', '==', building.id),
        where('status', '==', 'scheduled')
      );
      const snapshot = await getDocs(q);

      snapshot.docs.forEach(doc => {
        const visit = doc.data() as ScheduledVisit;
        const visitDate = new Date(visit.scheduledDate);
        if (visitDate >= now && visitDate <= thirtyDaysFromNow) {
          count++;
        }
      });
    }

    return count;
  } catch (error) {
    return 0;
  }
};

/**
 * Get expiring documents count
 */
const getExpiringDocumentsCount = async (buildings: Building[]): Promise<number> => {
  try {
    const now = new Date();
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    let count = 0;
    for (const building of buildings) {
      if (building.documents) {
        building.documents.forEach(doc => {
          if (doc.expirationDate) {
            const expDate = new Date(doc.expirationDate);
            if (expDate >= now && expDate <= sixtyDaysFromNow) {
              count++;
            }
          }
        });
      }
    }

    return count;
  } catch (error) {
    return 0;
  }
};

/**
 * Get portfolio performance trends
 */
export const getPortfolioTrends = async (
  customerId: string,
  months: number = 12
): Promise<{
  months: string[];
  costs: number[];
  income: number[];
  buildingCount: number[];
}> => {
  try {
    const trends = {
      months: [] as string[],
      costs: [] as number[],
      income: [] as number[],
      buildingCount: [] as number[],
    };

    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toISOString().substring(0, 7);
      trends.months.push(monthStr);

      // Mock data - to be replaced with real queries
      trends.costs.push(Math.random() * 10000 + 5000);
      trends.income.push(Math.random() * 15000 + 10000);
      trends.buildingCount.push(Math.floor(Math.random() * 3) + 5);
    }

    return trends;
  } catch (error) {
    logger.error('Error getting portfolio trends:', error);
    throw new Error('Failed to load portfolio trends');
  }
};
