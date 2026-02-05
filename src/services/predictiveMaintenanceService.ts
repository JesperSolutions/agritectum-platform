/**
 * Predictive Maintenance Service
 * Generates maintenance recommendations based on building data, history, and patterns
 */

import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Building, MaintenancePrediction, Report } from '../types';
import { logger } from '../utils/logger';

/**
 * Generate maintenance predictions for a building
 */
export const generateMaintenancePredictions = async (
  buildingId: string
): Promise<MaintenancePrediction[]> => {
  try {
    const building = await getBuildingData(buildingId);
    if (!building) {
      throw new Error('Building not found');
    }

    const reports = await getBuildingReports(buildingId);
    const predictions: MaintenancePrediction[] = [];

    // Prediction 1: Inspection Due
    const inspectionPrediction = await predictInspectionDue(building, reports);
    if (inspectionPrediction) predictions.push(inspectionPrediction);

    // Prediction 2: Roof Age-Based Maintenance
    const roofAgePrediction = predictRoofMaintenance(building);
    if (roofAgePrediction) predictions.push(roofAgePrediction);

    // Prediction 3: Issue-Based Repairs
    const repairPredictions = predictRepairsFromIssues(building, reports);
    predictions.push(...repairPredictions);

    // Prediction 4: Seasonal Maintenance
    const seasonalPrediction = predictSeasonalMaintenance(building);
    if (seasonalPrediction) predictions.push(seasonalPrediction);

    // Prediction 5: Weather-Based
    const weatherPrediction = await predictWeatherMaintenance(building);
    if (weatherPrediction) predictions.push(weatherPrediction);

    return predictions.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  } catch (error) {
    logger.error('Error generating maintenance predictions:', error);
    throw new Error('Failed to generate predictions');
  }
};

/**
 * Predict when next inspection is due
 */
const predictInspectionDue = async (
  building: Building,
  reports: Report[]
): Promise<MaintenancePrediction | null> => {
  if (reports.length === 0) {
    return {
      buildingId: building.id,
      buildingName: building.name || building.address,
      predictionType: 'inspection_due',
      priority: 'high',
      recommendedAction: 'Schedule initial building inspection',
      estimatedCost: { min: 2000, max: 5000 },
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      reasoning: 'No previous inspections found. Initial inspection recommended within 1 week.',
      confidence: 95,
    };
  }

  const lastReport = reports[0]; // Assuming sorted by date desc
  const lastInspectionDate = new Date(lastReport.inspectionDate || lastReport.createdAt);
  const daysSinceInspection = (Date.now() - lastInspectionDate.getTime()) / (1000 * 60 * 60 * 24);

  // Determine inspection interval based on building type and roof type
  let recommendedInterval = 365; // Default 1 year
  if (building.roofType === 'flat_bitumen_2layer' || building.roofType?.startsWith('flat_')) {
    recommendedInterval = 180; // Flat roofs need more frequent inspection
  }
  if (building.buildingType === 'commercial' || building.buildingType === 'industrial') {
    recommendedInterval = 365;
  }

  if (daysSinceInspection > recommendedInterval) {
    return {
      buildingId: building.id,
      buildingName: building.name || building.address,
      predictionType: 'inspection_due',
      priority: daysSinceInspection > recommendedInterval * 1.5 ? 'high' : 'medium',
      recommendedAction: `Schedule roof inspection (last inspection ${Math.floor(daysSinceInspection)} days ago)`,
      estimatedCost: { min: 1500, max: 4000 },
      dueDate: new Date().toISOString(),
      reasoning: `Based on ${building.roofType} roof type and building use, inspection recommended every ${Math.floor(recommendedInterval / 30)} months.`,
      confidence: 90,
    };
  }

  return null;
};

/**
 * Predict roof maintenance based on age
 */
const predictRoofMaintenance = (building: Building): MaintenancePrediction | null => {
  const constructionYear = building.constructionYear;
  if (!constructionYear) return null;

  const currentYear = new Date().getFullYear();
  const buildingAge = currentYear - constructionYear;

  // Different roof types have different lifespans
  const roofLifespan: Record<string, number> = {
    tile: 50,
    metal: 40,
    shingle: 20,
    slate: 75,
    flat_bitumen_2layer: 15,
    flat_bitumen_3layer: 20,
    flat_pvc: 25,
    flat_tpo: 25,
    flat_epdm: 25,
  };

  const expectedLifespan = roofLifespan[building.roofType || 'tile'] || 30;
  const percentOfLifespan = (buildingAge / expectedLifespan) * 100;

  if (percentOfLifespan > 80) {
    return {
      buildingId: building.id,
      buildingName: building.name || building.address,
      predictionType: 'repair_recommended',
      priority: percentOfLifespan > 95 ? 'critical' : 'high',
      recommendedAction: 'Consider roof replacement or major renovation',
      estimatedCost: {
        min: (building.roofSize || 100) * 500,
        max: (building.roofSize || 100) * 1200,
      },
      reasoning: `Roof is ${buildingAge} years old (${percentOfLifespan.toFixed(0)}% of expected ${expectedLifespan}-year lifespan for ${building.roofType} roofs).`,
      confidence: 85,
    };
  } else if (percentOfLifespan > 60) {
    return {
      buildingId: building.id,
      buildingName: building.name || building.address,
      predictionType: 'repair_recommended',
      priority: 'medium',
      recommendedAction: 'Schedule preventive maintenance and detailed inspection',
      estimatedCost: {
        min: (building.roofSize || 100) * 50,
        max: (building.roofSize || 100) * 200,
      },
      reasoning: `Roof has reached ${percentOfLifespan.toFixed(0)}% of expected lifespan. Preventive maintenance can extend life.`,
      confidence: 75,
    };
  }

  return null;
};

/**
 * Predict repairs based on previous issues
 */
const predictRepairsFromIssues = (building: Building, reports: Report[]): MaintenancePrediction[] => {
  const predictions: MaintenancePrediction[] = [];

  if (reports.length === 0) return predictions;

  const lastReport = reports[0];
  const criticalIssues = lastReport.issuesFound?.filter(issue => issue.severity === 'critical') || [];
  const highIssues = lastReport.issuesFound?.filter(issue => issue.severity === 'high') || [];

  if (criticalIssues.length > 0) {
    predictions.push({
      buildingId: building.id,
      buildingName: building.name || building.address,
      predictionType: 'urgent',
      priority: 'critical',
      recommendedAction: `Address ${criticalIssues.length} critical issue(s) immediately`,
      estimatedCost: {
        min: criticalIssues.length * 2000,
        max: criticalIssues.length * 8000,
      },
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      reasoning: `Last inspection found ${criticalIssues.length} critical issues: ${criticalIssues.map(i => i.type).join(', ')}`,
      confidence: 95,
    });
  }

  if (highIssues.length > 2) {
    predictions.push({
      buildingId: building.id,
      buildingName: building.name || building.address,
      predictionType: 'repair_recommended',
      priority: 'high',
      recommendedAction: `Schedule repairs for ${highIssues.length} high-priority issues`,
      estimatedCost: {
        min: highIssues.length * 1000,
        max: highIssues.length * 5000,
      },
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      reasoning: `Multiple high-priority issues detected in last inspection`,
      confidence: 85,
    });
  }

  return predictions;
};

/**
 * Predict seasonal maintenance needs
 */
const predictSeasonalMaintenance = (building: Building): MaintenancePrediction | null => {
  const now = new Date();
  const month = now.getMonth(); // 0-11

  // Spring (March-May): Gutters and drainage
  if (month >= 2 && month <= 4) {
    return {
      buildingId: building.id,
      buildingName: building.name || building.address,
      predictionType: 'seasonal_maintenance',
      priority: 'medium',
      recommendedAction: 'Spring gutter cleaning and drainage inspection',
      estimatedCost: { min: 500, max: 1500 },
      reasoning: 'Spring is optimal for gutter cleaning after winter and before heavy rains.',
      confidence: 70,
    };
  }

  // Fall (September-November): Winter preparation
  if (month >= 8 && month <= 10) {
    return {
      buildingId: building.id,
      buildingName: building.name || building.address,
      predictionType: 'seasonal_maintenance',
      priority: 'medium',
      recommendedAction: 'Fall maintenance: Clean gutters, inspect roof for winter readiness',
      estimatedCost: { min: 600, max: 2000 },
      reasoning: 'Fall preparation prevents winter damage from ice, snow, and freezing temperatures.',
      confidence: 75,
    };
  }

  return null;
};

/**
 * Predict weather-based maintenance (simplified - would integrate with weather API)
 */
const predictWeatherMaintenance = async (building: Building): Promise<MaintenancePrediction | null> => {
  // Simplified logic - in production, integrate with weather API
  const latitude = building.latitude;
  const longitude = building.longitude;

  if (!latitude || !longitude) return null;

  // Mock: If building is in northern region (latitude > 55), recommend winter prep
  if (latitude > 55) {
    const now = new Date();
    const month = now.getMonth();

    // October-November: winter is coming
    if (month >= 9 && month <= 10) {
      return {
        buildingId: building.id,
        buildingName: building.name || building.address,
        predictionType: 'seasonal_maintenance',
        priority: 'high',
        recommendedAction: 'Winter preparation: Insulation check, snow load assessment',
        estimatedCost: { min: 1000, max: 3000 },
        reasoning: 'Building located in region with harsh winters. Preventive winter preparation recommended.',
        confidence: 80,
      };
    }
  }

  return null;
};

/**
 * Get building data
 */
const getBuildingData = async (buildingId: string): Promise<Building | null> => {
  try {
    const buildingRef = collection(db, 'buildings');
    const q = query(buildingRef, where('__name__', '==', buildingId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Building;
  } catch (error) {
    return null;
  }
};

/**
 * Get building reports sorted by date
 */
const getBuildingReports = async (buildingId: string): Promise<Report[]> => {
  try {
    const reportsRef = collection(db, 'reports');
    const q = query(
      reportsRef,
      where('buildingId', '==', buildingId),
      orderBy('inspectionDate', 'desc'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Report[];
  } catch (error) {
    logger.warn('Error fetching building reports:', error);
    return [];
  }
};

/**
 * Generate predictions for entire portfolio
 */
export const generatePortfolioPredictions = async (
  customerId: string
): Promise<MaintenancePrediction[]> => {
  try {
    // Get all buildings for customer
    const buildingsRef = collection(db, 'buildings');
    const q = query(buildingsRef, where('customerId', '==', customerId));
    const snapshot = await getDocs(q);
    const buildings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Building[];

    // Generate predictions for each building
    const allPredictions: MaintenancePrediction[] = [];
    for (const building of buildings) {
      const predictions = await generateMaintenancePredictions(building.id);
      allPredictions.push(...predictions);
    }

    // Sort by priority
    return allPredictions.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  } catch (error) {
    logger.error('Error generating portfolio predictions:', error);
    throw new Error('Failed to generate portfolio predictions');
  }
};
