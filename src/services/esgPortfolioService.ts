import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  QueryConstraint,
} from 'firebase/firestore';
import { Building, ESGPortfolioMetrics, BuildingESGInsight } from '../types';
import { logger } from '../utils/logger';

/**
 * ESG Portfolio Service - Aggregates and analyzes ESG metrics across all buildings
 * in a customer's portfolio.
 */

// Calculate sustainability potential score based on current utilization and roof area
function calculateSustainabilityPotentialScore(
  building: Building,
  portfolioAverage: number
): number {
  if (!building.roofSize) return 0;

  const baseScore = 50;
  const hasSolar = building.esgMetrics?.features?.solarPanels?.installed ? 20 : 0;
  const hasGreen = building.esgMetrics?.features?.greenRoof?.installed ? 15 : 0;
  const hasWhite = building.esgMetrics?.features?.whiteRoof?.installed ? 10 : 0;
  const hasNox = building.esgMetrics?.features?.noxTreatment?.installed ? 10 : 0;
  const hasWater = building.esgMetrics?.features?.blueRoof?.installed ? 5 : 0;

  const currentUtilization = hasSolar + hasGreen + hasWhite + hasNox + hasWater;
  const potentialScore = baseScore + currentUtilization;

  return Math.min(100, potentialScore);
}

// Estimate solar capacity based on roof area and climate
function estimateSolarCapacity(roofArea: number, latitude?: number): number {
  // Base: 0.2 kW per m² (typical modern panels: 200-250W per 1.5-2m²)
  let estimatedCapacity = roofArea * 0.2;

  // Adjust for latitude (higher latitude = lower efficiency potential)
  if (latitude) {
    const adjustmentFactor = 1.2 - (Math.abs(latitude) / 90) * 0.4; // Range: 0.8-1.2
    estimatedCapacity *= adjustmentFactor;
  }

  return Math.round(estimatedCapacity * 10) / 10;
}

// Estimate CO2 reduction from solar panels
function estimateCO2Reduction(solarCapacity: number): number {
  // Assuming: 1 kW solar saves ~1.2 tons CO2/year (typical for Denmark/Northern Europe)
  // = 1200 kg CO2/year per kW
  return Math.round(solarCapacity * 1200);
}

/**
 * Get aggregate ESG metrics for all buildings in a customer's portfolio
 */
export async function getPortfolioESGMetrics(
  customerId: string
): Promise<ESGPortfolioMetrics> {
  try {
    const buildingsRef = collection(db, 'buildings');
    const constraints: QueryConstraint[] = [where('customerId', '==', customerId)];

    const q = query(buildingsRef, ...constraints);
    const snapshot = await getDocs(q);
    const buildings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Building));

    if (buildings.length === 0) {
      return createEmptyPortfolioMetrics();
    }

    let totalRoofArea = 0;
    let totalSolarPanels = 0;
    let totalSolarCapacity = 0;
    let totalSolarOutput = 0;
    let buildingsWithSolar = 0;

    let buildingsWithNoxTreatment = 0;
    let buildingsWithWhiteRoof = 0;
    let totalWhiteRoofArea = 0;

    let buildingsWithGreenRoof = 0;
    let totalGreenRoofArea = 0;

    let buildingsWithBlueRoof = 0;
    let totalBlueRoofArea = 0;
    let totalWaterStorageCapacity = 0;

    let totalCO2Footprint = 0;
    let totalCO2Offset = 0;
    let totalSustainabilityScore = 0;

    const underutilizedBuildings: BuildingESGInsight[] = [];
    const highPotentialBuildings: BuildingESGInsight[] = [];

    // First pass: aggregate metrics
    buildings.forEach(building => {
      const roofArea = building.roofSize || 0;
      totalRoofArea += roofArea;

      const esgFeatures = building.esgMetrics?.features;

      // Solar metrics
      if (esgFeatures?.solarPanels?.installed) {
        buildingsWithSolar++;
        totalSolarPanels += esgFeatures.solarPanels.count || 0;
        totalSolarCapacity += esgFeatures.solarPanels.capacity || 0;
        totalSolarOutput += esgFeatures.solarPanels.annualOutput || 0;
      }

      // NOx treatment
      if (esgFeatures?.noxTreatment?.installed) {
        buildingsWithNoxTreatment++;
      }

      // White roof
      if (esgFeatures?.whiteRoof?.installed) {
        buildingsWithWhiteRoof++;
        totalWhiteRoofArea += esgFeatures.whiteRoof.area || 0;
      }

      // Green roof
      if (esgFeatures?.greenRoof?.installed) {
        buildingsWithGreenRoof++;
        totalGreenRoofArea += esgFeatures.greenRoof.area || 0;
      }

      // Blue roof
      if (esgFeatures?.blueRoof?.installed) {
        buildingsWithBlueRoof++;
        totalBlueRoofArea += esgFeatures.blueRoof.area || 0;
        totalWaterStorageCapacity += esgFeatures.blueRoof.storageCapacity || 0;
      }

      // CO2 metrics
      totalCO2Footprint += building.esgMetrics?.carbonFootprint || 0;
      totalCO2Offset += building.esgMetrics?.annualCO2Offset || 0;
      totalSustainabilityScore += building.esgMetrics?.sustainabilityScore || 0;
    });

    const averageSustainabilityScore =
      buildings.length > 0 ? Math.round(totalSustainabilityScore / buildings.length) : 0;

    // Second pass: identify insights and underutilized buildings
    buildings.forEach(building => {
      const roofArea = building.roofSize || 0;
      const utilizationScore = calculateRoofUtilizationScore(building);
      const potentialScore = calculateSustainabilityPotentialScore(
        building,
        averageSustainabilityScore
      );

      const potentialSolarCapacity = estimateSolarCapacity(
        roofArea,
        building.latitude
      );
      const currentSolarCapacity = building.esgMetrics?.features?.solarPanels?.capacity || 0;
      const unusedSolarCapacity = Math.max(0, potentialSolarCapacity - currentSolarCapacity);

      const potentialCO2Reduction = estimateCO2Reduction(unusedSolarCapacity);

      const insight: BuildingESGInsight = {
        buildingId: building.id,
        buildingName: building.name || building.address,
        roofArea,
        utilizationScore,
        sustainabilityPotentialScore: potentialScore,
        potentialSolarCapacity,
        potentialCO2Reduction,
        estimatedInvestmentRequired: Math.round(unusedSolarCapacity * 2500), // €2500/kW typical
        roi: Math.round((unusedSolarCapacity * 25000) / 50000), // ~€2500/kW cost, €1000/kW/year savings
        quickWins: generateQuickWins(building),
        priorityRecommendations: generateRecommendations(building, unusedSolarCapacity),
      };

      if (utilizationScore < 40) {
        underutilizedBuildings.push(insight);
      }

      if (potentialScore > 70) {
        highPotentialBuildings.push(insight);
      }
    });

    // Sort by potential (highest first)
    underutilizedBuildings.sort((a, b) => b.potentialCO2Reduction - a.potentialCO2Reduction);
    highPotentialBuildings.sort((a, b) => b.sustainabilityPotentialScore - a.sustainabilityPotentialScore);

    const roofAreaUtilization = totalRoofArea > 0
      ? Math.round(((totalWhiteRoofArea + totalGreenRoofArea + totalBlueRoofArea) / totalRoofArea) * 100)
      : 0;

    const netCO2Footprint = Math.max(0, totalCO2Footprint - totalCO2Offset);

    return {
      totalBuildings: buildings.length,
      totalRoofArea,
      roofAreaUtilizationPercentage: roofAreaUtilization,

      totalSolarPanels,
      totalSolarCapacity,
      totalSolarOutput,
      buildingsWithSolar,
      solarPenetration: buildings.length > 0
        ? Math.round((buildingsWithSolar / buildings.length) * 100)
        : 0,

      buildingsWithNoxTreatment,
      noxTreatmentPenetration: buildings.length > 0
        ? Math.round((buildingsWithNoxTreatment / buildings.length) * 100)
        : 0,

      totalWhiteRoofArea,
      whiteRoofCoverage: totalRoofArea > 0
        ? Math.round((totalWhiteRoofArea / totalRoofArea) * 100)
        : 0,
      buildingsWithWhiteRoof,

      totalGreenRoofArea,
      greenRoofCoverage: totalRoofArea > 0
        ? Math.round((totalGreenRoofArea / totalRoofArea) * 100)
        : 0,
      buildingsWithGreenRoof,

      totalBlueRoofArea,
      blueRoofCoverage: totalRoofArea > 0
        ? Math.round((totalBlueRoofArea / totalRoofArea) * 100)
        : 0,
      totalWaterStorageCapacity,
      buildingsWithBlueRoof,

      totalCO2Footprint,
      totalCO2Offset,
      netCO2Footprint,

      averageSustainabilityScore,
      portfolioRating: getRatingFromScore(averageSustainabilityScore),

      underutilizedBuildings: underutilizedBuildings.slice(0, 5),
      highPotentialBuildings: highPotentialBuildings.slice(0, 5),
    };
  } catch (error) {
    logger.error('[esgPortfolioService] Error calculating portfolio metrics:', error);
    throw error;
  }
}

/**
 * Calculate roof utilization score (0-100)
 */
function calculateRoofUtilizationScore(building: Building): number {
  if (!building.roofSize || building.roofSize === 0) return 0;

  const features = building.esgMetrics?.features;
  let utilizationArea = 0;

  if (features?.solarPanels?.installed) utilizationArea += (features.solarPanels.area || 0);
  if (features?.greenRoof?.installed) utilizationArea += (features.greenRoof.area || 0);
  if (features?.whiteRoof?.installed) utilizationArea += (features.whiteRoof.area || 0);
  if (features?.blueRoof?.installed) utilizationArea += (features.blueRoof.area || 0);

  return Math.min(100, Math.round((utilizationArea / building.roofSize) * 100));
}

/**
 * Generate quick win recommendations
 */
function generateQuickWins(building: Building): string[] {
  const wins: string[] = [];
  const features = building.esgMetrics?.features;

  if (!features?.whiteRoof?.installed && (building.roofSize || 0) > 100) {
    wins.push('Add white roof paint (low cost, quick ROI)');
  }

  if (!features?.solarPanels?.installed && (building.roofSize || 0) > 150) {
    wins.push('Install solar panels (government subsidies available)');
  }

  if (!features?.blueRoof?.installed && (building.roofSize || 0) > 200) {
    wins.push('Implement blue roof for water management');
  }

  if (!features?.noxTreatment?.installed) {
    wins.push('Install NOx treatment system');
  }

  return wins;
}

/**
 * Generate priority recommendations
 */
function generateRecommendations(
  building: Building,
  potentialSolarCapacity: number
): BuildingESGInsight['priorityRecommendations'] {
  const recommendations: BuildingESGInsight['priorityRecommendations'] = [];

  if (potentialSolarCapacity > 5 && !building.esgMetrics?.features?.solarPanels?.installed) {
    recommendations.push({
      feature: 'Solar Panels',
      priority: 'critical',
      impact: `${Math.round(potentialSolarCapacity)} kW capacity, ${estimateCO2Reduction(potentialSolarCapacity)} kg CO₂/year reduction`,
      estimatedCost: Math.round(potentialSolarCapacity * 2500),
    });
  }

  if (!building.esgMetrics?.features?.blueRoof?.installed && (building.roofSize || 0) > 200) {
    recommendations.push({
      feature: 'Blue Roof (Water Management)',
      priority: 'high',
      impact: 'Manage stormwater, reduce flooding risk, improve urban climate',
      estimatedCost: Math.round((building.roofSize || 0) * 150),
    });
  }

  if (!building.esgMetrics?.features?.greenRoof?.installed && (building.roofSize || 0) > 300) {
    recommendations.push({
      feature: 'Green Roof',
      priority: 'high',
      impact: 'Improve insulation, biodiversity, stormwater management',
      estimatedCost: Math.round((building.roofSize || 0) * 200),
    });
  }

  if (!building.esgMetrics?.features?.noxTreatment?.installed) {
    recommendations.push({
      feature: 'NOx Treatment',
      priority: 'medium',
      impact: 'Reduce air pollution, improve ESG score',
      estimatedCost: 8000,
    });
  }

  return recommendations.slice(0, 3); // Top 3
}

/**
 * Get rating based on sustainability score
 */
function getRatingFromScore(score: number): string {
  if (score >= 90) return 'Platinum';
  if (score >= 80) return 'Gold';
  if (score >= 70) return 'Silver';
  if (score >= 60) return 'Bronze';
  if (score >= 50) return 'Standard';
  return 'Below Standard';
}

/**
 * Export portfolio summary to CSV
 */
export function exportPortfolioESGToCSV(
  metrics: ESGPortfolioMetrics,
  buildings: Building[]
): string {
  const lines: string[] = [];

  // Header
  lines.push('ESG Portfolio Summary');
  lines.push('');

  // Portfolio level metrics
  lines.push('Portfolio Overview');
  lines.push(`Total Buildings,${metrics.totalBuildings}`);
  lines.push(`Total Roof Area (m²),${metrics.totalRoofArea}`);
  lines.push(`Roof Utilization %,${metrics.roofAreaUtilizationPercentage}%`);
  lines.push('');

  lines.push('Solar Metrics');
  lines.push(`Total Solar Panels,${metrics.totalSolarPanels}`);
  lines.push(`Total Solar Capacity (kW),${metrics.totalSolarCapacity}`);
  lines.push(`Total Annual Output (kWh),${metrics.totalSolarOutput}`);
  lines.push(`Buildings with Solar,${metrics.buildingsWithSolar} (${metrics.solarPenetration}%)`);
  lines.push('');

  lines.push('ESG Features');
  lines.push(`Buildings with NOx Treatment,${metrics.buildingsWithNoxTreatment} (${metrics.noxTreatmentPenetration}%)`);
  lines.push(`Buildings with White Roof,${metrics.buildingsWithWhiteRoof} (${metrics.whiteRoofCoverage}%)`);
  lines.push(`Buildings with Green Roof,${metrics.buildingsWithGreenRoof} (${metrics.greenRoofCoverage}%)`);
  lines.push(`Buildings with Blue Roof,${metrics.buildingsWithBlueRoof} (${metrics.blueRoofCoverage}%)`);
  lines.push('');

  lines.push('CO2 & Sustainability');
  lines.push(`Total CO2 Footprint (kg/year),${metrics.totalCO2Footprint}`);
  lines.push(`Total CO2 Offset (kg/year),${metrics.totalCO2Offset}`);
  lines.push(`Net CO2 Footprint (kg/year),${metrics.netCO2Footprint}`);
  lines.push(`Average Sustainability Score,${metrics.averageSustainabilityScore}/100`);
  lines.push(`Portfolio Rating,${metrics.portfolioRating}`);
  lines.push('');

  // Building details
  lines.push('Building Details');
  lines.push(
    'Building Name,Roof Area (m²),Solar Panels,Solar Capacity (kW),White Roof,Green Roof,Blue Roof,NOx Treatment,Sustainability Score'
  );

  buildings.forEach(building => {
    const features = building.esgMetrics?.features;
    lines.push(
      [
        building.name || building.address,
        building.roofSize || 0,
        features?.solarPanels?.installed ? 'Yes' : 'No',
        features?.solarPanels?.capacity || 0,
        features?.whiteRoof?.installed ? 'Yes' : 'No',
        features?.greenRoof?.installed ? 'Yes' : 'No',
        features?.blueRoof?.installed ? 'Yes' : 'No',
        features?.noxTreatment?.installed ? 'Yes' : 'No',
        building.esgMetrics?.sustainabilityScore || 0,
      ].join(',')
    );
  });

  return lines.join('\n');
}

/**
 * Create empty metrics object
 */
function createEmptyPortfolioMetrics(): ESGPortfolioMetrics {
  return {
    totalBuildings: 0,
    totalRoofArea: 0,
    roofAreaUtilizationPercentage: 0,
    totalSolarPanels: 0,
    totalSolarCapacity: 0,
    totalSolarOutput: 0,
    buildingsWithSolar: 0,
    solarPenetration: 0,
    buildingsWithNoxTreatment: 0,
    noxTreatmentPenetration: 0,
    totalWhiteRoofArea: 0,
    whiteRoofCoverage: 0,
    buildingsWithWhiteRoof: 0,
    totalGreenRoofArea: 0,
    greenRoofCoverage: 0,
    buildingsWithGreenRoof: 0,
    totalBlueRoofArea: 0,
    blueRoofCoverage: 0,
    totalWaterStorageCapacity: 0,
    buildingsWithBlueRoof: 0,
    totalCO2Footprint: 0,
    totalCO2Offset: 0,
    netCO2Footprint: 0,
    averageSustainabilityScore: 0,
    portfolioRating: 'Below Standard',
    underutilizedBuildings: [],
    highPotentialBuildings: [],
  };
}
