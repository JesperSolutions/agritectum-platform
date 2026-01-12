/**
 * Building Improvement Calculation Utilities
 * 
 * Adapted from Agri_API/utils/calculations.js
 * Provides functions to calculate ESG impact of building improvements
 */

import { Building, RoofType, RoofImprovement, ImprovementType, ImprovementMetrics } from '../types';

/**
 * Cost factors per improvement type (EUR per m²)
 * Adapted from Agri_API cost factors
 */
export const IMPROVEMENT_COST_FACTORS: Record<ImprovementType, number> = {
  green_roof: 120, // Green Areas
  solar_panels: 350, // Solar Power
  water_management: 80, // Water Management
  insulation: 150, // Enhanced insulation
  cooling: 200, // Cooling systems
  biodiversity: 100, // Biodiversity enhancements
};

/**
 * Annual CO2 reduction per m² for each improvement type (kg CO₂/m²/year)
 */
export const IMPROVEMENT_CO2_REDUCTION: Record<ImprovementType, number> = {
  green_roof: 0.5, // Plant absorption
  solar_panels: 4.4, // Based on 0.15 kg CO₂/kWh × ~30 kWh/m²/year
  water_management: 0.2, // Reduced treatment needs
  insulation: 0.8, // Reduced heating needs
  cooling: 0.3, // Reduced cooling energy
  biodiversity: 0.1, // Indirect benefits
};

/**
 * Annual energy savings per m² for each improvement type (kWh/m²/year)
 */
export const IMPROVEMENT_ENERGY_SAVINGS: Record<ImprovementType, number> = {
  green_roof: 0, // No direct energy savings
  solar_panels: 30, // Average solar generation in Nordic countries
  water_management: 0, // No direct energy savings
  insulation: 5, // Reduced heating needs
  cooling: 3, // Reduced cooling needs
  biodiversity: 0, // No direct energy savings
};

/**
 * Annual water savings per m² for each improvement type (m³/m²/year)
 */
export const IMPROVEMENT_WATER_SAVINGS: Record<ImprovementType, number> = {
  green_roof: 0.15, // Water retention
  solar_panels: 0,
  water_management: 0.2, // Water collection
  insulation: 0,
  cooling: 0,
  biodiversity: 0.05, // Indirect water benefits
};

/**
 * Calculate total cost for improvements
 * @param improvements - Array of roof improvements
 * @param roofArea - Total roof area in m²
 * @returns Total cost in EUR
 */
export function calculateTotalCost(
  improvements: RoofImprovement[],
  roofArea: number
): number {
  let totalCost = 0;

  for (const improvement of improvements) {
    const areaForImprovement = roofArea * (improvement.percentage / 100);
    const cost = areaForImprovement * improvement.costPerSqm;
    totalCost += cost;
  }

  return Math.round(totalCost);
}

/**
 * Calculate annual CO2 reduction from improvements
 * @param improvements - Array of roof improvements
 * @param roofArea - Total roof area in m²
 * @returns Annual CO2 reduction in kg
 */
export function calculateAnnualCO2Reduction(
  improvements: RoofImprovement[],
  roofArea: number
): number {
  let totalReduction = 0;

  for (const improvement of improvements) {
    const areaForImprovement = roofArea * (improvement.percentage / 100);
    const reduction = areaForImprovement * IMPROVEMENT_CO2_REDUCTION[improvement.type];
    totalReduction += reduction;
  }

  return Math.round(totalReduction);
}

/**
 * Calculate annual energy savings from improvements
 * @param improvements - Array of roof improvements
 * @param roofArea - Total roof area in m²
 * @returns Annual energy savings in kWh
 */
export function calculateAnnualEnergySavings(
  improvements: RoofImprovement[],
  roofArea: number
): number {
  let totalSavings = 0;

  for (const improvement of improvements) {
    const areaForImprovement = roofArea * (improvement.percentage / 100);
    const savings = areaForImprovement * IMPROVEMENT_ENERGY_SAVINGS[improvement.type];
    totalSavings += savings;
  }

  return Math.round(totalSavings);
}

/**
 * Calculate annual water savings from improvements
 * @param improvements - Array of roof improvements
 * @param roofArea - Total roof area in m²
 * @returns Annual water savings in m³
 */
export function calculateAnnualWaterSavings(
  improvements: RoofImprovement[],
  roofArea: number
): number {
  let totalSavings = 0;

  for (const improvement of improvements) {
    const areaForImprovement = roofArea * (improvement.percentage / 100);
    const savings = areaForImprovement * IMPROVEMENT_WATER_SAVINGS[improvement.type];
    totalSavings += savings;
  }

  return Math.round(totalSavings * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate annual economic benefit from improvements
 * @param improvements - Array of roof improvements
 * @param roofArea - Total roof area in m²
 * @returns Annual economic benefit in EUR
 */
export function calculateAnnualEconomicBenefit(
  improvements: RoofImprovement[],
  roofArea: number
): number {
  // Economic conversion factors
  const co2PricePerKg = 0.05; // EUR per kg CO2e
  const electricityPricePerKwh = 0.25; // EUR per kWh
  const waterPricePerM3 = 2.5; // EUR per m³

  const co2Reduction = calculateAnnualCO2Reduction(improvements, roofArea);
  const energySavings = calculateAnnualEnergySavings(improvements, roofArea);
  const waterSavings = calculateAnnualWaterSavings(improvements, roofArea);

  const carbonBenefit = co2Reduction * co2PricePerKg;
  const electricityBenefit = energySavings * electricityPricePerKwh;
  const waterBenefit = waterSavings * waterPricePerM3;

  return Math.round(carbonBenefit + electricityBenefit + waterBenefit);
}

/**
 * Calculate payback period
 * @param totalCost - Total investment cost
 * @param annualBenefit - Annual economic benefit
 * @returns Payback period in years
 */
export function calculatePaybackPeriod(
  totalCost: number,
  annualBenefit: number
): number {
  if (annualBenefit <= 0) return Infinity;
  return Math.round((totalCost / annualBenefit) * 10) / 10;
}

/**
 * Calculate Net Present Value (NPV)
 * @param totalCost - Initial investment
 * @param annualBenefit - Annual economic benefit
 * @param years - Number of years (default: 10)
 * @param discountRate - Discount rate (default: 0.05 = 5%)
 * @returns NPV in EUR
 */
export function calculateNPV(
  totalCost: number,
  annualBenefit: number,
  years: number = 10,
  discountRate: number = 0.05
): number {
  let npv = -totalCost;

  for (let year = 1; year <= years; year++) {
    const presentValue = annualBenefit / Math.pow(1 + discountRate, year);
    npv += presentValue;
  }

  return Math.round(npv);
}

/**
 * Calculate Internal Rate of Return (IRR)
 * @param totalCost - Initial investment
 * @param annualBenefit - Annual economic benefit
 * @param years - Number of years (default: 10)
 * @returns IRR as percentage
 */
export function calculateIRR(
  totalCost: number,
  annualBenefit: number,
  years: number = 10
): number {
  if (annualBenefit <= 0) return 0;

  // Simple approximation: (annual benefit / total cost) * 100
  // More accurate would require iterative calculation
  const simpleIRR = (annualBenefit / totalCost) * 100;

  // Adjust for time value of money (rough approximation)
  const adjustedIRR = simpleIRR * (1 - 0.1 * Math.log(years));

  return Math.round(adjustedIRR * 10) / 10;
}

/**
 * Calculate Return on Investment (ROI) over 10 years
 * @param totalCost - Initial investment
 * @param annualBenefit - Annual economic benefit
 * @param years - Number of years (default: 10)
 * @returns ROI as percentage
 */
export function calculateROI(
  totalCost: number,
  annualBenefit: number,
  years: number = 10
): number {
  if (totalCost <= 0) return 0;
  const totalBenefit = annualBenefit * years;
  const roi = ((totalBenefit - totalCost) / totalCost) * 100;
  return Math.round(roi * 10) / 10;
}

/**
 * Calculate financial metrics for improvements
 * @param improvements - Array of roof improvements
 * @param roofArea - Total roof area in m²
 * @returns Financial metrics
 */
export function calculateFinancialMetrics(
  improvements: RoofImprovement[],
  roofArea: number
): ImprovementMetrics {
  const totalCost = calculateTotalCost(improvements, roofArea);
  const annualBenefit = calculateAnnualEconomicBenefit(improvements, roofArea);
  const paybackPeriod = calculatePaybackPeriod(totalCost, annualBenefit);
  const npv = calculateNPV(totalCost, annualBenefit);
  const irr = calculateIRR(totalCost, annualBenefit);
  const roi = calculateROI(totalCost, annualBenefit);

  return {
    totalCost,
    annualSavings: annualBenefit,
    paybackPeriod,
    npv,
    irr,
    roi,
  };
}

/**
 * Calculate scenario analysis (optimistic, realistic, pessimistic)
 * @param baseMetrics - Base financial metrics
 * @returns Scenario analysis with adjusted metrics
 */
export function calculateScenarioAnalysis(
  baseMetrics: ImprovementMetrics
): {
  optimistic: ImprovementMetrics;
  realistic: ImprovementMetrics;
  pessimistic: ImprovementMetrics;
} {
  // Optimistic: 20% better performance, 10% lower costs
  const optimistic: ImprovementMetrics = {
    totalCost: Math.round(baseMetrics.totalCost * 0.9),
    annualSavings: Math.round(baseMetrics.annualSavings * 1.2),
    paybackPeriod: calculatePaybackPeriod(
      baseMetrics.totalCost * 0.9,
      baseMetrics.annualSavings * 1.2
    ),
    npv: calculateNPV(
      baseMetrics.totalCost * 0.9,
      baseMetrics.annualSavings * 1.2
    ),
    irr: calculateIRR(baseMetrics.totalCost * 0.9, baseMetrics.annualSavings * 1.2),
    roi: calculateROI(baseMetrics.totalCost * 0.9, baseMetrics.annualSavings * 1.2),
  };

  // Realistic: Base metrics (no adjustment)
  const realistic: ImprovementMetrics = { ...baseMetrics };

  // Pessimistic: 20% worse performance, 10% higher costs
  const pessimistic: ImprovementMetrics = {
    totalCost: Math.round(baseMetrics.totalCost * 1.1),
    annualSavings: Math.round(baseMetrics.annualSavings * 0.8),
    paybackPeriod: calculatePaybackPeriod(
      baseMetrics.totalCost * 1.1,
      baseMetrics.annualSavings * 0.8
    ),
    npv: calculateNPV(
      baseMetrics.totalCost * 1.1,
      baseMetrics.annualSavings * 0.8
    ),
    irr: calculateIRR(baseMetrics.totalCost * 1.1, baseMetrics.annualSavings * 0.8),
    roi: calculateROI(baseMetrics.totalCost * 1.1, baseMetrics.annualSavings * 0.8),
  };

  return {
    optimistic,
    realistic,
    pessimistic,
  };
}

/**
 * Calculate sustainability score based on improvements
 * @param improvements - Array of roof improvements
 * @param roofArea - Total roof area in m²
 * @param baseScore - Base sustainability score (from building)
 * @returns Sustainability score (0-100)
 */
export function calculateSustainabilityScore(
  improvements: RoofImprovement[],
  roofArea: number,
  baseScore: number = 50
): number {
  if (improvements.length === 0) return baseScore;

  // Calculate improvement impact score
  let improvementScore = 0;
  const totalPercentage = improvements.reduce(
    (sum, imp) => sum + imp.percentage,
    0
  );

  // Weight improvements by type and percentage
  const improvementWeights: Record<ImprovementType, number> = {
    green_roof: 1.5, // High impact
    solar_panels: 1.3, // High impact
    water_management: 1.2, // Moderate-high impact
    insulation: 1.1, // Moderate impact
    cooling: 1.0, // Standard impact
    biodiversity: 1.1, // Moderate impact
  };

  for (const improvement of improvements) {
    const weight = improvementWeights[improvement.type] || 1.0;
    const contribution = (improvement.percentage / 100) * weight * 10;
    improvementScore += contribution;
  }

  // Cap improvement score at 50 points (so base + improvements = max 100)
  improvementScore = Math.min(50, improvementScore);

  // Combine base score with improvements
  const finalScore = Math.min(100, baseScore + improvementScore);

  return Math.round(finalScore);
}

/**
 * Calculate CO2 neutrality timeline
 * @param initialCO2 - Initial CO2 footprint
 * @param annualReduction - Annual CO2 reduction from improvements
 * @param declineRate - Natural decline rate (default: 0.03)
 * @returns Years to neutrality, or null if not achievable
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
 * Calculate comprehensive improvement impact
 * @param building - Building object
 * @param improvements - Array of roof improvements
 * @returns Comprehensive impact metrics
 */
export function calculateImprovementImpact(
  building: Building,
  improvements: RoofImprovement[]
): {
  totalCost: number;
  annualCO2Reduction: number;
  annualEnergySavings: number;
  annualWaterSavings: number;
  paybackPeriod: number;
  roi10Year: number;
  sustainabilityScore: number;
  neutralityTimeline: number | null;
  financialMetrics: ImprovementMetrics;
  scenarios: {
    optimistic: ImprovementMetrics;
    realistic: ImprovementMetrics;
    pessimistic: ImprovementMetrics;
  };
} {
  const roofArea = building.roofSize || 0;
  if (roofArea <= 0 || improvements.length === 0) {
    return {
      totalCost: 0,
      annualCO2Reduction: 0,
      annualEnergySavings: 0,
      annualWaterSavings: 0,
      paybackPeriod: Infinity,
      roi10Year: 0,
      sustainabilityScore: 50,
      neutralityTimeline: null,
      financialMetrics: {
        totalCost: 0,
        annualSavings: 0,
        paybackPeriod: Infinity,
        npv: 0,
        irr: 0,
        roi: 0,
      },
      scenarios: {
        optimistic: {
          totalCost: 0,
          annualSavings: 0,
          paybackPeriod: Infinity,
          npv: 0,
          irr: 0,
          roi: 0,
        },
        realistic: {
          totalCost: 0,
          annualSavings: 0,
          paybackPeriod: Infinity,
          npv: 0,
          irr: 0,
          roi: 0,
        },
        pessimistic: {
          totalCost: 0,
          annualSavings: 0,
          paybackPeriod: Infinity,
          npv: 0,
          irr: 0,
          roi: 0,
        },
      },
    };
  }

  const totalCost = calculateTotalCost(improvements, roofArea);
  const annualCO2Reduction = calculateAnnualCO2Reduction(improvements, roofArea);
  const annualEnergySavings = calculateAnnualEnergySavings(improvements, roofArea);
  const annualWaterSavings = calculateAnnualWaterSavings(improvements, roofArea);
  const financialMetrics = calculateFinancialMetrics(improvements, roofArea);
  const scenarios = calculateScenarioAnalysis(financialMetrics);

  // Calculate base sustainability score from building
  const baseScore = building.esgMetrics?.sustainabilityScore || 50;
  const sustainabilityScore = calculateSustainabilityScore(
    improvements,
    roofArea,
    baseScore
  );

  // Calculate neutrality timeline
  const initialCO2 = building.esgMetrics?.carbonFootprint || 0;
  const neutralityTimeline =
    initialCO2 > 0
      ? calculateNeutralityTimeline(initialCO2, annualCO2Reduction)
      : null;

  return {
    totalCost,
    annualCO2Reduction,
    annualEnergySavings,
    annualWaterSavings,
    paybackPeriod: financialMetrics.paybackPeriod,
    roi10Year: financialMetrics.roi,
    sustainabilityScore,
    neutralityTimeline,
    financialMetrics,
    scenarios,
  };
}
