/**
 * ESG Calculation Utilities
 * 
 * Extracted and adapted from:
 * - Agri_API/utils/calculations.js - CO2 calculations
 * - Bluwave_Form scoring logic - Assessment scoring
 * - agritectum-roof-calculator types - ESG interfaces
 * 
 * Provides building-specific ESG calculation functions for the agritectum platform.
 */

import { Building, RoofType, Report, RoofDivisionAreas, ESGMetrics } from '../types';

/**
 * Climate zone factors for CO2 calculations
 * Based on location (latitude/longitude) or building type
 */
export const CLIMATE_FACTORS = {
  temperate: 1.0,    // Baseline (Nordic countries)
  tropical: 1.2,
  arid: 0.9,
  continental: 1.1,
  polar: 0.8,
} as const;

export type ClimateZone = keyof typeof CLIMATE_FACTORS;

/**
 * Carbon intensity factors per roof type (kg CO₂ per m²)
 * Based on material production and lifecycle
 */
export const CARBON_FACTORS: Record<RoofType, number> = {
  tile: 15.5,
  metal: 8.2,      // Lower due to recyclability
  shingle: 12.8,
  slate: 20.1,     // Higher due to extraction
  flat: 10.5,
  other: 15.0,
};

/**
 * Sustainability scores per roof type (0-100)
 * Based on material lifecycle, recyclability, and environmental impact
 */
export const SUSTAINABILITY_SCORES: Record<RoofType, number> = {
  metal: 85,       // Highly recyclable, long lifespan
  flat: 75,       // Good for green roofs
  tile: 65,       // Moderate recyclability
  shingle: 55,    // Lower recyclability
  slate: 50,      // High extraction impact
  other: 60,
};

/**
 * Solar potential efficiency factors per roof type
 * Percentage of roof area suitable for solar panels
 */
export const SOLAR_EFFICIENCY_FACTORS: Record<RoofType, number> = {
  flat: 0.95,     // Optimal for solar
  metal: 0.85,    // Good for mounting
  tile: 0.70,     // Moderate suitability
  shingle: 0.75,  // Moderate suitability
  slate: 0.60,    // Lower suitability
  other: 0.70,
};

/**
 * GWP (Global Warming Potential) factors per roof type
 * kg CO₂ equivalent per m²
 */
export const GWP_FACTORS: Record<RoofType, number> = {
  tile: 3.5,
  metal: 2.0,     // Lower due to recyclability
  shingle: 3.0,
  slate: 4.5,     // Higher extraction impact
  flat: 2.5,
  other: 3.33,
};

/**
 * Calculate carbon footprint for a building based on roof size and type
 * @param roofSize - Roof area in square meters
 * @param roofType - Type of roofing material
 * @param materialCost - Optional material cost for more accurate calculation
 * @returns Carbon footprint in kg CO₂
 */
export function calculateCarbonFootprint(
  roofSize: number,
  roofType: RoofType,
  materialCost?: number
): number {
  if (!roofSize || roofSize <= 0) return 0;
  
  const baseFootprint = roofSize * CARBON_FACTORS[roofType];
  
  // If material cost is provided, adjust based on cost per m²
  if (materialCost && materialCost > 0) {
    const costPerSqm = materialCost / roofSize;
    // Higher cost materials often have higher carbon intensity
    const costFactor = Math.min(1.5, Math.max(0.7, costPerSqm / 100));
    return baseFootprint * costFactor;
  }
  
  return baseFootprint;
}

/**
 * Calculate sustainability score for a building
 * @param roofType - Type of roofing material
 * @param roofSize - Roof area in square meters (for bonus points)
 * @returns Sustainability score (0-100)
 */
export function calculateSustainabilityScore(
  roofType: RoofType,
  roofSize?: number
): number {
  let score = SUSTAINABILITY_SCORES[roofType];
  
  // Bonus points for larger roofs (more impact potential)
  if (roofSize && roofSize > 100) {
    const sizeBonus = Math.min(10, Math.floor(roofSize / 100));
    score = Math.min(100, score + sizeBonus);
  }
  
  return Math.round(score);
}

/**
 * Calculate solar potential for a building
 * @param roofSize - Roof area in square meters
 * @param roofType - Type of roofing material
 * @returns Potential annual energy generation in kWh/year
 */
export function calculateSolarPotential(
  roofSize: number,
  roofType: RoofType
): number {
  if (!roofSize || roofSize <= 0) return 0;
  
  // Average solar irradiance in Nordic countries: ~1000 kWh/m²/year
  const baseIrradiance = 1000;
  const efficiency = SOLAR_EFFICIENCY_FACTORS[roofType];
  const panelEfficiency = 0.20; // 20% panel efficiency
  
  return Math.round(roofSize * baseIrradiance * efficiency * panelEfficiency);
}

/**
 * Calculate material recycling potential
 * @param roofType - Type of roofing material
 * @param roofSize - Roof area in square meters
 * @returns Recycling potential percentage (0-100)
 */
export function calculateRecyclingPotential(
  roofType: RoofType,
  roofSize: number
): number {
  const recyclingRates: Record<RoofType, number> = {
    metal: 95,     // Highly recyclable
    tile: 70,     // Moderate recyclability
    flat: 60,     // Depends on materials
    shingle: 40,  // Lower recyclability
    slate: 30,    // Difficult to recycle
    other: 50,
  };
  
  return recyclingRates[roofType] || 50;
}

/**
 * Calculate CO2 neutrality timeline
 * Based on roof improvements and natural decline
 * @param initialCO2 - Initial CO2 impact in kg
 * @param annualReduction - Annual CO2 reduction in kg/year
 * @param declineRate - Natural decline rate (default: 0.03)
 * @returns Years to CO2 neutrality, or null if not achievable
 */
export function calculateNeutralityTimeline(
  initialCO2: number,
  annualReduction: number,
  declineRate: number = 0.03
): number | null {
  if (annualReduction <= 0) return null;
  
  // Simplified calculation: years = initial / (annual_reduction + natural_decline)
  const naturalDecline = initialCO2 * declineRate;
  const totalAnnualReduction = annualReduction + naturalDecline;
  
  if (totalAnnualReduction <= 0) return null;
  
  const years = initialCO2 / totalAnnualReduction;
  return years > 100 ? null : Math.round(years * 10) / 10;
}

/**
 * Calculate annual CO2 offset from roof improvements
 * @param roofSize - Roof area in square meters
 * @param roofType - Type of roofing material
 * @param improvements - Optional improvements (solar, green roof, etc.)
 * @returns Annual CO2 offset in kg
 */
export function calculateAnnualCO2Offset(
  roofSize: number,
  roofType: RoofType,
  improvements?: {
    solar?: boolean;
    greenRoof?: boolean;
    waterManagement?: boolean;
  }
): number {
  if (!roofSize || roofSize <= 0) return 0;
  
  let offset = 0;
  
  // Solar panel offset (if applicable)
  if (improvements?.solar) {
    const solarPotential = calculateSolarPotential(roofSize, roofType);
    // Average CO2 per kWh in Nordic grid: ~0.15 kg CO₂/kWh
    offset += solarPotential * 0.15;
  }
  
  // Green roof offset (plant absorption)
  if (improvements?.greenRoof) {
    // Average plant absorption: ~0.5 kg CO₂ per m² per year
    offset += roofSize * 0.5;
  }
  
  // Water management offset (reduced treatment)
  if (improvements?.waterManagement) {
    // Water retention reduces treatment needs: ~0.2 kg CO₂ per m² per year
    offset += roofSize * 0.2;
  }
  
  return Math.round(offset);
}

/**
 * Get SDG alignment for a building based on roof type and improvements
 * @param roofType - Type of roofing material
 * @param improvements - Optional improvements
 * @returns Array of SDG goals addressed
 */
export function getSDGAlignment(
  roofType: RoofType,
  improvements?: {
    solar?: boolean;
    greenRoof?: boolean;
    waterManagement?: boolean;
  }
): string[] {
  const sdgs: string[] = [];
  
  // Always applicable SDGs
  sdgs.push('Climate Action');
  sdgs.push('Sustainable Cities and Communities');
  
  // Solar improvements
  if (improvements?.solar) {
    sdgs.push('Affordable and Clean Energy');
  }
  
  // Green roof improvements
  if (improvements?.greenRoof) {
    sdgs.push('Good Health and Well-being');
    sdgs.push('Life on Land');
  }
  
  // Water management
  if (improvements?.waterManagement) {
    sdgs.push('Clean Water and Sanitation');
  }
  
  // Recyclable materials
  if (roofType === 'metal' || roofType === 'tile') {
    sdgs.push('Responsible Consumption and Production');
  }
  
  return sdgs;
}

/**
 * Calculate SDG alignment score
 * @param sdgs - Array of SDG goals addressed
 * @returns Alignment score (0-100)
 */
export function calculateSDGScore(sdgs: string[]): number {
  // Maximum of 17 SDGs, score based on percentage
  return Math.min(100, Math.round((sdgs.length / 17) * 100));
}

/**
 * Get sustainability rating based on score
 * @param score - Sustainability score (0-100)
 * @returns Rating string
 */
export function getSustainabilityRating(score: number): string {
  if (score >= 90) return 'Outstanding';
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 50) return 'Satisfactory';
  if (score >= 40) return 'Acceptable';
  return 'Needs Improvement';
}

/**
 * Determine climate zone from latitude
 * Simplified for Nordic countries (defaults to temperate)
 * @param latitude - Building latitude
 * @returns Climate zone
 */
export function getClimateZone(latitude?: number): ClimateZone {
  if (!latitude) return 'temperate';
  
  // Simplified: Nordic countries are mostly temperate
  if (latitude >= 55 && latitude <= 72) return 'temperate';
  if (latitude > 72) return 'polar';
  if (latitude < 55) return 'continental';
  
  return 'temperate';
}

/**
 * Roof type specifications from agritectum-roof-calculator
 * These match the 4 division areas used in ESG service reports
 */
const ROOF_TYPE_SPECS = {
  'Green Roof System': {
    co2: 2.1, // kg CO₂ per m² per year
    nox: 0.05, // kg NOₓ per m² per year
    energy: 1.5, // kWh per m² per year
  },
  'Photocatalytic Coating': {
    co2: 1.94,
    nox: 0.1,
    energy: 0,
  },
  'White - Cool Roof Coating': {
    co2: 6.65,
    nox: 0.02,
    energy: 8.5,
  },
  'Social Activities Area': {
    co2: 0.5,
    nox: 0.02,
    energy: 0,
  },
} as const;

/**
 * Calculate ESG metrics from roof division areas
 * Based on the calculation logic from agritectum-roof-calculator
 * @param roofSize - Total roof area in m²
 * @param divisions - Percentage allocation for each division area
 * @returns Comprehensive ESG metrics
 */
export function calculateESGFromDivisions(
  roofSize: number,
  divisions: RoofDivisionAreas
): ESGMetrics {
  if (!roofSize || roofSize <= 0) {
    return {
      sustainabilityScore: 0,
      carbonFootprint: 0,
      solarPotential: 0,
      recyclingPotential: 0,
      annualCO2Offset: 0,
      neutralityTimeline: null,
      sdgAlignment: [],
      sdgScore: 0,
      rating: 'Needs Improvement',
      lastCalculated: new Date().toISOString(),
    };
  }

  // Validate percentages sum to 100
  const totalPercentage = divisions.greenRoof + divisions.noxReduction + divisions.coolRoof + divisions.socialActivities;
  if (Math.abs(totalPercentage - 100) > 0.1) {
    throw new Error('Division percentages must sum to 100%');
  }

  let totalCo2PerYear = 0;
  let totalNoxPerYear = 0;
  let totalEnergyPerYear = 0;

  // Calculate metrics for each division area
  // Green Roof Area
  const greenRoofSize = (divisions.greenRoof / 100) * roofSize;
  const greenRoofData = ROOF_TYPE_SPECS['Green Roof System'];
  totalCo2PerYear += greenRoofData.co2 * greenRoofSize;
  totalNoxPerYear += greenRoofData.nox * greenRoofSize;
  totalEnergyPerYear += greenRoofData.energy * greenRoofSize;

  // NOx Reduction Area
  const noxReductionSize = (divisions.noxReduction / 100) * roofSize;
  const noxReductionData = ROOF_TYPE_SPECS['Photocatalytic Coating'];
  totalCo2PerYear += noxReductionData.co2 * noxReductionSize;
  totalNoxPerYear += noxReductionData.nox * noxReductionSize;
  totalEnergyPerYear += noxReductionData.energy * noxReductionSize;

  // Cool Roof Area
  const coolRoofSize = (divisions.coolRoof / 100) * roofSize;
  const coolRoofData = ROOF_TYPE_SPECS['White - Cool Roof Coating'];
  totalCo2PerYear += coolRoofData.co2 * coolRoofSize;
  totalNoxPerYear += coolRoofData.nox * coolRoofSize;
  totalEnergyPerYear += coolRoofData.energy * coolRoofSize;

  // Social Activities Area
  const socialSize = (divisions.socialActivities / 100) * roofSize;
  const socialData = ROOF_TYPE_SPECS['Social Activities Area'];
  totalCo2PerYear += socialData.co2 * socialSize;
  totalNoxPerYear += socialData.nox * socialSize;
  totalEnergyPerYear += socialData.energy * socialSize;

  // Calculate initial carbon footprint (manufacturing footprint)
  const initialCo2 = 19 * roofSize; // kg CO₂ from manufacturing

  // Annual CO2 offset is the total CO2 reduction
  const annualCO2Offset = Math.round(totalCo2PerYear);

  // Calculate carbon footprint (initial manufacturing footprint)
  const carbonFootprint = Math.round(initialCo2);

  // Calculate neutrality timeline
  const neutralityTimeline = totalCo2PerYear > 0
    ? Math.ceil(initialCo2 / totalCo2PerYear)
    : null;

  // Calculate sustainability score based on total CO2 offset and roof size
  // Higher CO2 offset and larger roof = higher score
  const baseScore = Math.min(100, Math.round((totalCo2PerYear / roofSize) * 10));
  const sizeBonus = roofSize > 100 ? Math.min(10, Math.floor(roofSize / 100)) : 0;
  const sustainabilityScore = Math.min(100, baseScore + sizeBonus);

  // Calculate solar potential (using default calculation)
  // For division-based calculations, we can estimate based on cool roof area (best for solar)
  const solarPotential = Math.round(coolRoofSize * 100); // Simplified calculation

  // Calculate recycling potential (weighted average based on areas)
  // Green roofs and cool roofs have better recycling potential
  const greenRoofRecycling = 70; // Moderate
  const coolRoofRecycling = 60; // Moderate
  const photocatalyticRecycling = 50; // Lower
  const socialRecycling = 60; // Moderate

  const weightedRecycling = (
    (divisions.greenRoof / 100) * greenRoofRecycling +
    (divisions.coolRoof / 100) * coolRoofRecycling +
    (divisions.noxReduction / 100) * photocatalyticRecycling +
    (divisions.socialActivities / 100) * socialRecycling
  );
  const recyclingPotential = Math.round(weightedRecycling);

  // Get SDG alignment based on division areas
  const sdgAlignment: string[] = ['Climate Action', 'Sustainable Cities and Communities'];
  if (divisions.greenRoof > 0) {
    sdgAlignment.push('Good Health and Well-being', 'Life on Land');
  }
  if (divisions.noxReduction > 0) {
    sdgAlignment.push('Clean Air'); // Air quality improvement
  }
  if (divisions.coolRoof > 0) {
    sdgAlignment.push('Affordable and Clean Energy');
  }
  if (divisions.socialActivities > 0) {
    sdgAlignment.push('Good Health and Well-being'); // Social benefits
  }

  // Remove duplicates
  const uniqueSDGs = Array.from(new Set(sdgAlignment));
  const sdgScore = calculateSDGScore(uniqueSDGs);
  const rating = getSustainabilityRating(sustainabilityScore);

  return {
    sustainabilityScore,
    carbonFootprint,
    solarPotential,
    recyclingPotential,
    annualCO2Offset,
    neutralityTimeline,
    sdgAlignment: uniqueSDGs,
    sdgScore,
    rating,
    lastCalculated: new Date().toISOString(),
  };
}

/**
 * Calculate comprehensive ESG metrics for a building
 * @param building - Building object
 * @param reports - Optional array of reports for historical data
 * @returns Comprehensive ESG metrics
 */
export function calculateBuildingESG(
  building: Building,
  reports?: Report[]
): {
  sustainabilityScore: number;
  carbonFootprint: number;
  solarPotential: number;
  recyclingPotential: number;
  annualCO2Offset: number;
  neutralityTimeline: number | null;
  sdgAlignment: string[];
  sdgScore: number;
  rating: string;
} {
  const roofSize = building.roofSize || 0;
  const roofType = building.roofType || 'other';
  
  // Calculate material cost from reports if available
  const materialCost = reports?.reduce((sum, report) => {
    return sum + (report.materialCost || 0);
  }, 0);
  
  // Calculate carbon footprint
  const carbonFootprint = calculateCarbonFootprint(
    roofSize,
    roofType,
    materialCost
  );
  
  // Calculate sustainability score
  const sustainabilityScore = calculateSustainabilityScore(roofType, roofSize);
  
  // Calculate solar potential
  const solarPotential = calculateSolarPotential(roofSize, roofType);
  
  // Calculate recycling potential
  const recyclingPotential = calculateRecyclingPotential(roofType, roofSize);
  
  // Estimate improvements based on roof type
  const improvements = {
    solar: roofType === 'flat' || roofType === 'metal',
    greenRoof: roofType === 'flat',
    waterManagement: roofType === 'flat',
  };
  
  // Calculate annual CO2 offset
  const annualCO2Offset = calculateAnnualCO2Offset(
    roofSize,
    roofType,
    improvements
  );
  
  // Calculate neutrality timeline
  const neutralityTimeline = calculateNeutralityTimeline(
    carbonFootprint,
    annualCO2Offset
  );
  
  // Get SDG alignment
  const sdgAlignment = getSDGAlignment(roofType, improvements);
  const sdgScore = calculateSDGScore(sdgAlignment);
  
  // Get rating
  const rating = getSustainabilityRating(sustainabilityScore);
  
  return {
    sustainabilityScore,
    carbonFootprint,
    solarPotential,
    recyclingPotential,
    annualCO2Offset,
    neutralityTimeline,
    sdgAlignment,
    sdgScore,
    rating,
  };
}
