import { Report } from '../types';
import { logger } from '../utils/logger';

export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface HealthScoreBreakdown {
  freshnessScore: number;
  issuesScore: number;
  maintenanceScore: number;
  totalScore: number;
  grade: HealthGrade;
}

/**
 * SINGLE SOURCE OF TRUTH for health score calculation
 * 
 * Scoring Algorithm:
 * 1. Freshness (0-40 points): Based on days since last inspection
 *    - 0-90 days: 40 points
 *    - 91-180 days: 30 points
 *    - 181-365 days: 20 points
 *    - 365+ days: 0 points
 * 
 * 2. Critical Issues (0-30 points): Based on number of high/critical severity issues
 *    - 0-1 issues: 30 points
 *    - 2-3 issues: 20 points
 *    - 4-5 issues: 10 points
 *    - 5+ issues: 0 points
 * 
 * 3. Maintenance Frequency (0-30 points): Based on number of historical inspections
 *    - 3+ inspections: 30 points
 *    - 2 inspections: 20 points
 *    - 1 inspection: 10 points
 * 
 * Total: 0-100 points
 * Grades:
 * - A: 90-100
 * - B: 80-89
 * - C: 70-79
 * - D: 60-69
 * - F: 0-59
 */

export const calculateBuildingHealth = (
  lastReport: Report | undefined,
  allBuildingReports: Report[]
): HealthScoreBreakdown => {
  if (!lastReport) {
    return {
      freshnessScore: 0,
      issuesScore: 0,
      maintenanceScore: 0,
      totalScore: 0,
      grade: 'F',
    };
  }

  try {
    const lastInspectionDate = new Date(lastReport.inspectionDate);
    const today = new Date();
    const daysSinceInspection = Math.floor(
      (today.getTime() - lastInspectionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate freshness score (0-40 points)
    let freshnessScore = 40;
    if (daysSinceInspection > 365) {
      freshnessScore = 0;
    } else if (daysSinceInspection > 180) {
      freshnessScore = 20;
    } else if (daysSinceInspection > 90) {
      freshnessScore = 30;
    }

    // Calculate issues score (0-30 points)
    const criticalIssues =
      lastReport.issuesFound?.filter(i => i.severity === 'critical' || i.severity === 'high')
        .length || 0;
    let issuesScore = 30;
    if (criticalIssues > 5) {
      issuesScore = 0;
    } else if (criticalIssues > 3) {
      issuesScore = 10;
    } else if (criticalIssues > 1) {
      issuesScore = 20;
    }

    // Calculate maintenance frequency score (0-30 points)
    const inspectionCount = allBuildingReports.length;
    let maintenanceScore = 30;
    if (inspectionCount === 1) {
      maintenanceScore = 10;
    } else if (inspectionCount === 2) {
      maintenanceScore = 20;
    }

    // Total score
    const totalScore = freshnessScore + issuesScore + maintenanceScore;

    // Convert score to grade
    let grade: HealthGrade = 'F';
    if (totalScore >= 90) grade = 'A';
    else if (totalScore >= 80) grade = 'B';
    else if (totalScore >= 70) grade = 'C';
    else if (totalScore >= 60) grade = 'D';

    return {
      freshnessScore,
      issuesScore,
      maintenanceScore,
      totalScore,
      grade,
    };
  } catch (error) {
    logger.error('Error calculating building health:', error);
    return {
      freshnessScore: 0,
      issuesScore: 0,
      maintenanceScore: 0,
      totalScore: 0,
      grade: 'F',
    };
  }
};

/**
 * Determine building status based on days since inspection
 */
export const getBuildingStatus = (daysSinceInspection?: number): 'good' | 'check-soon' | 'urgent' => {
  if (daysSinceInspection === undefined) return 'urgent';
  if (daysSinceInspection <= 180) return 'good';
  if (daysSinceInspection <= 365) return 'check-soon';
  return 'urgent';
};

/**
 * Get color for health grade (consistent across dashboard)
 */
export const getGradeColorClasses = (grade: HealthGrade): string => {
  switch (grade) {
    case 'A':
      return 'text-green-700 bg-green-50 border-green-300';
    case 'B':
      return 'text-blue-700 bg-blue-50 border-blue-300';
    case 'C':
      return 'text-yellow-700 bg-yellow-50 border-yellow-300';
    case 'D':
      return 'text-orange-700 bg-orange-50 border-orange-300';
    case 'F':
      return 'text-red-700 bg-red-50 border-red-300';
  }
};

/**
 * Get color for status (consistent across dashboard)
 */
export const getStatusColorClasses = (status: 'good' | 'check-soon' | 'urgent'): string => {
  switch (status) {
    case 'good':
      return 'text-slate-700 bg-slate-50 border-slate-300';
    case 'check-soon':
      return 'text-slate-600 bg-slate-100 border-slate-400';
    case 'urgent':
      return 'text-slate-800 bg-slate-200 border-slate-500';
  }
};

/**
 * Get display text for status
 */
export const getStatusText = (status: 'good' | 'check-soon' | 'urgent'): string => {
  switch (status) {
    case 'good':
      return 'Good';
    case 'check-soon':
      return 'Review Soon';
    case 'urgent':
      return 'Needs Inspection';
  }
};
