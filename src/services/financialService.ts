/**
 * Financial Service
 * Handles building-level financial tracking, reporting, and analysis
 */

import { db } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { BuildingFinancialRecord, BuildingFinancialSummary } from '../types';
import { logger } from '../utils/logger';

/**
 * Add a financial record for a building
 */
export const addFinancialRecord = async (
  record: Omit<BuildingFinancialRecord, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const financialsRef = collection(db, 'buildingFinancials');
    const docRef = await addDoc(financialsRef, {
      ...record,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    logger.error('Error adding financial record:', error);
    throw new Error('Failed to add financial record');
  }
};

/**
 * Get financial records for a building
 */
export const getBuildingFinancials = async (
  buildingId: string,
  startDate?: string,
  endDate?: string
): Promise<BuildingFinancialRecord[]> => {
  try {
    const financialsRef = collection(db, 'buildingFinancials');
    let q = query(
      financialsRef,
      where('buildingId', '==', buildingId),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    let records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as BuildingFinancialRecord[];

    // Filter by date range if provided
    if (startDate) {
      records = records.filter(r => r.date >= startDate);
    }
    if (endDate) {
      records = records.filter(r => r.date <= endDate);
    }

    return records;
  } catch (error) {
    logger.error('Error getting building financials:', error);
    throw new Error('Failed to load financial records');
  }
};

/**
 * Get financial summary for a building
 */
export const getBuildingFinancialSummary = async (
  buildingId: string,
  startDate: string,
  endDate: string
): Promise<BuildingFinancialSummary> => {
  try {
    const records = await getBuildingFinancials(buildingId, startDate, endDate);

    const summary: BuildingFinancialSummary = {
      buildingId,
      totalIncome: 0,
      totalExpenses: 0,
      maintenanceCosts: 0,
      improvementCosts: 0,
      taxesPaid: 0,
      insuranceCosts: 0,
      netCashFlow: 0,
      roi: 0,
      period: { start: startDate, end: endDate },
    };

    records.forEach(record => {
      if (record.type === 'income') {
        summary.totalIncome += record.amount;
      } else {
        summary.totalExpenses += record.amount;
        
        switch (record.type) {
          case 'maintenance':
            summary.maintenanceCosts += record.amount;
            break;
          case 'improvement':
            summary.improvementCosts += record.amount;
            break;
          case 'tax':
            summary.taxesPaid += record.amount;
            break;
          case 'insurance':
            summary.insuranceCosts += record.amount;
            break;
        }
      }
    });

    summary.netCashFlow = summary.totalIncome - summary.totalExpenses;
    
    // Calculate ROI if building value is available
    // This would need to fetch building data
    summary.roi = 0; // Placeholder

    return summary;
  } catch (error) {
    logger.error('Error getting financial summary:', error);
    throw new Error('Failed to generate financial summary');
  }
};

/**
 * Generate tax report for a building
 */
export const generateTaxReport = async (
  buildingId: string,
  taxYear: number
): Promise<{
  year: number;
  totalIncome: number;
  deductibleExpenses: number;
  maintenanceCosts: number;
  improvementCosts: number;
  depreciation: number;
  taxableIncome: number;
  records: BuildingFinancialRecord[];
}> => {
  try {
    const startDate = `${taxYear}-01-01`;
    const endDate = `${taxYear}-12-31`;
    
    const records = await getBuildingFinancials(buildingId, startDate, endDate);
    const deductibleRecords = records.filter(r => r.taxDeductible);

    const report = {
      year: taxYear,
      totalIncome: records
        .filter(r => r.type === 'income')
        .reduce((sum, r) => sum + r.amount, 0),
      deductibleExpenses: deductibleRecords
        .filter(r => r.type !== 'income')
        .reduce((sum, r) => sum + r.amount, 0),
      maintenanceCosts: deductibleRecords
        .filter(r => r.type === 'maintenance')
        .reduce((sum, r) => sum + r.amount, 0),
      improvementCosts: records
        .filter(r => r.type === 'improvement')
        .reduce((sum, r) => sum + r.amount, 0),
      depreciation: 0, // Would calculate from building data
      taxableIncome: 0,
      records: deductibleRecords,
    };

    report.taxableIncome = report.totalIncome - report.deductibleExpenses - report.depreciation;

    return report;
  } catch (error) {
    logger.error('Error generating tax report:', error);
    throw new Error('Failed to generate tax report');
  }
};

/**
 * Calculate depreciation for a building
 */
export const calculateDepreciation = (
  acquisitionCost: number,
  acquisitionDate: string,
  method: 'straight-line' | 'declining-balance' = 'straight-line',
  usefulLife: number = 27.5 // Standard for residential real estate in many jurisdictions
): number => {
  const yearsOwned = (new Date().getTime() - new Date(acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
  
  if (method === 'straight-line') {
    const annualDepreciation = acquisitionCost / usefulLife;
    return annualDepreciation * Math.min(yearsOwned, usefulLife);
  }
  
  // Simplified declining balance
  const rate = 2 / usefulLife;
  let remainingValue = acquisitionCost;
  for (let i = 0; i < Math.floor(yearsOwned); i++) {
    remainingValue -= remainingValue * rate;
  }
  return acquisitionCost - remainingValue;
};

/**
 * Get cost breakdown by category
 */
export const getCostBreakdown = async (
  buildingId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, number>> => {
  try {
    const records = await getBuildingFinancials(buildingId, startDate, endDate);
    const breakdown: Record<string, number> = {};

    records.forEach(record => {
      if (record.type !== 'income') {
        const category = record.category || record.type;
        breakdown[category] = (breakdown[category] || 0) + record.amount;
      }
    });

    return breakdown;
  } catch (error) {
    logger.error('Error getting cost breakdown:', error);
    throw new Error('Failed to get cost breakdown');
  }
};
