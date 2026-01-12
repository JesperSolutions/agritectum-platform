/**
 * Building Improvement Service
 * 
 * Provides functions to save, load, and calculate building ESG improvements
 */

import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  Building,
  BuildingImprovements,
  RoofImprovement,
  ImprovementType,
} from '../types';
import { calculateImprovementImpact } from '../utils/improvementCalculations';
import { IMPROVEMENT_COST_FACTORS } from '../utils/improvementCalculations';

/**
 * Get all buildings for a branch
 * @param branchId - Branch ID
 * @returns Array of buildings
 */
export async function getBuildingsByBranch(
  branchId: string
): Promise<Building[]> {
  try {
    const buildingsRef = collection(db, 'buildings');
    const q = query(
      buildingsRef,
      where('branchId', '==', branchId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Building[];
  } catch (error) {
    console.error('Error fetching buildings by branch:', error);
    throw error;
  }
}

/**
 * Calculate improvement impact for a building
 * @param building - Building object
 * @param improvements - Array of roof improvements
 * @returns Calculated impact metrics
 */
export function calculateBuildingImprovementImpact(
  building: Building,
  improvements: RoofImprovement[]
) {
  return calculateImprovementImpact(building, improvements);
}

/**
 * Save building improvements to Firestore
 * @param buildingId - Building ID
 * @param improvements - Array of roof improvements
 * @param calculatedMetrics - Calculated impact metrics
 * @returns Document ID
 */
export async function saveBuildingImprovements(
  buildingId: string,
  improvements: RoofImprovement[],
  calculatedMetrics: ReturnType<typeof calculateImprovementImpact>
): Promise<string> {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    // Get building to get branchId and roofArea
    const buildingRef = doc(db, 'buildings', buildingId);
    const buildingSnap = await getDoc(buildingRef);
    if (!buildingSnap.exists()) {
      throw new Error('Building not found');
    }
    const building = buildingSnap.data() as Building;

    const improvementsData: Omit<BuildingImprovements, 'id'> = {
      buildingId,
      roofArea: building.roofSize || 0,
      improvements,
      calculatedAt: new Date().toISOString(),
      calculatedBy: currentUser.uid,
      branchId: building.branchId || '',
      metrics: {
        totalCost: calculatedMetrics.totalCost,
        annualCO2Reduction: calculatedMetrics.annualCO2Reduction,
        annualEnergySavings: calculatedMetrics.annualEnergySavings,
        annualWaterSavings: calculatedMetrics.annualWaterSavings,
        paybackPeriod: calculatedMetrics.paybackPeriod,
        roi10Year: calculatedMetrics.roi10Year,
        sustainabilityScore: calculatedMetrics.sustainabilityScore,
        neutralityTimeline: calculatedMetrics.neutralityTimeline,
      },
      scenarios: calculatedMetrics.scenarios,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Check if improvements already exist for this building
    const improvementsRef = collection(db, 'buildingImprovements');
    const existingQuery = query(
      improvementsRef,
      where('buildingId', '==', buildingId)
    );
    const existingSnap = await getDocs(existingQuery);

    if (!existingSnap.empty) {
      // Update existing document
      const existingDoc = existingSnap.docs[0];
      await updateDoc(doc(db, 'buildingImprovements', existingDoc.id), {
        ...improvementsData,
        updatedAt: new Date().toISOString(),
      });
      return existingDoc.id;
    } else {
      // Create new document
      const docRef = await addDoc(improvementsRef, improvementsData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving building improvements:', error);
    throw error;
  }
}

/**
 * Get building improvements from Firestore
 * @param buildingId - Building ID
 * @returns Building improvements or null
 */
export async function getBuildingImprovements(
  buildingId: string
): Promise<BuildingImprovements | null> {
  try {
    const improvementsRef = collection(db, 'buildingImprovements');
    const q = query(
      improvementsRef,
      where('buildingId', '==', buildingId),
      orderBy('calculatedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as BuildingImprovements;
  } catch (error) {
    console.error('Error fetching building improvements:', error);
    throw error;
  }
}

/**
 * Get improvement recommendations for a building
 * @param building - Building object
 * @returns Array of recommended improvements
 */
export function getImprovementRecommendations(
  building: Building
): Array<{
  type: ImprovementType;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  suggestedPercentage: number;
}> {
  const recommendations: Array<{
    type: ImprovementType;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    suggestedPercentage: number;
  }> = [];

  const roofType = building.roofType;
  const roofSize = building.roofSize || 0;

  // Green roof recommendations (especially for flat roofs)
  if (roofType === 'flat' && roofSize > 50) {
    recommendations.push({
      type: 'green_roof',
      priority: 'high',
      reason: 'Flat roofs are ideal for green roof installations',
      suggestedPercentage: 40,
    });
  }

  // Solar panel recommendations
  if (roofSize > 30) {
    const solarPriority =
      roofType === 'flat' || roofType === 'metal' ? 'high' : 'medium';
    recommendations.push({
      type: 'solar_panels',
      priority: solarPriority,
      reason:
        roofType === 'flat' || roofType === 'metal'
          ? 'Optimal roof type for solar panel installation'
          : 'Good potential for solar energy generation',
      suggestedPercentage: 30,
    });
  }

  // Water management recommendations (for larger roofs)
  if (roofSize > 100) {
    recommendations.push({
      type: 'water_management',
      priority: 'medium',
      reason: 'Large roof area provides significant water collection potential',
      suggestedPercentage: 20,
    });
  }

  // Insulation recommendations (for older buildings)
  if (building.buildingType === 'commercial' || building.buildingType === 'industrial') {
    recommendations.push({
      type: 'insulation',
      priority: 'medium',
      reason: 'Commercial/industrial buildings benefit from enhanced insulation',
      suggestedPercentage: 10,
    });
  }

  return recommendations;
}

/**
 * Create default improvements based on recommendations
 * @param building - Building object
 * @returns Array of default roof improvements
 */
export function createDefaultImprovements(
  building: Building
): RoofImprovement[] {
  const recommendations = getImprovementRecommendations(building);
  const improvements: RoofImprovement[] = [];

  for (const rec of recommendations) {
    improvements.push({
      type: rec.type,
      percentage: rec.suggestedPercentage,
      startYear: 0, // Immediate
      costPerSqm: IMPROVEMENT_COST_FACTORS[rec.type],
    });
  }

  return improvements;
}
