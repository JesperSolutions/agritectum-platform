# ESG System Inventory Report

**Date:** 2025-01-11  
**Status:** Exploratory Inventory  
**Purpose:** Identify any ESG-related functionality in the codebase

## Executive Summary

After a comprehensive search of the entire codebase (including legacy, unused, and archived files), **no fully implemented ESG system was found in the main codebase**. The codebase contains only **marketing mentions** and **placeholder references** to ESG features that are not currently functional.

**However, three complete ESG-related systems were discovered in separate project folders:**

1. **Bluwave_Form** - Complete ESG assessment application with 13-question scoring system
2. **Agri_API** - Full CO2 calculation API with social/environmental metrics and SDG alignment
3. **agritectum-roof-calculator** - ESG dashboard with GRI compliance and financial analysis

These systems provide comprehensive ESG functionality that can be integrated or used as reference for implementing ESG features in the main platform.

## Findings Overview

### Status Categories

- **Active:** Currently implemented and functional
- **Unused:** Code exists but not referenced/imported
- **Partial:** Incomplete implementation or stub
- **Archived:** Moved to legacy directories
- **Marketing:** Mentioned in marketing/docs but not implemented

## Detailed Inventory

### 1. Marketing Page References

**File:** `src/components/MarketingPage.tsx`  
**Lines:** 538-574  
**Status:** `marketing` - UI text only, no functionality

**Content:**

- Section titled "ESG Reporting" (line 542)
- Lists four ESG features as marketing points:
  - CO₂ Impact Tracking (line 548)
  - Material Lifecycle (line 555)
  - Safety Compliance (line 562)
  - Nordic Standards (line 569)

**Description:** Marketing section describing ESG features that are advertised but not implemented. No actual ESG calculation, tracking, or reporting functionality is associated with these descriptions.

**Additional Reference:** Line 99 mentions "ESG reporting" in the hero section as a feature.

---

### 2. Service Agreement Form Reference

**File:** `src/components/serviceAgreements/ServiceAgreementForm.tsx`  
**Line:** 776  
**Status:** `partial` - Text mention only, no functionality

**Content:**

```typescript
<li>{t('serviceAgreement.form.serviceReport.esgReport') || 'ESG-rapport (miljø, social, governance)'}</li>
```

**Description:** This is a bullet point in a list of service report types that are mentioned as part of a service agreement. The ESG report is listed alongside other report types (photo documentation, damage description, recommendations, etc.) but there is no actual ESG report generation functionality.

**Translation Keys:** The translation key exists in all locale files:

- `src/locales/en/serviceAgreements.json` (line 236)
- `src/locales/sv/serviceAgreements.json` (line 236)
- `src/locales/da/serviceAgreements.json` (line 236)
- `src/locales/de/serviceAgreements.json` (line 236)

---

### 3. Translation Files

**Files:**

- `src/locales/en/serviceAgreements.json` (line 236)
- `src/locales/sv/serviceAgreements.json` (line 236)
- `src/locales/da/serviceAgreements.json` (line 236)
- `src/locales/de/serviceAgreements.json` (line 236)

**Status:** `partial` - Translation keys exist but no corresponding functionality

**Content:**

```json
"serviceAgreement.form.serviceReport.esgReport": "ESG report (environmental, social, governance)"
```

**Description:** Translation keys for "ESG report" exist in all four supported languages (English, Swedish, Danish, German), indicating this was planned but never implemented.

---

### 4. Related Infrastructure (Potential ESG Foundation)

#### 4.1 Roof Size Measurement

**File:** `src/components/RoofSizeMeasurer.tsx`  
**Status:** `active` - Functional but not used for ESG

**Description:** Component that calculates roof area in square meters using polygon drawing on a Leaflet map. The calculated area could be used for ESG calculations (energy efficiency, solar potential, material usage) but is currently only used for roof size tracking.

**Key Functions:**

- `calculatePolygonArea()` - Calculates area in square meters from polygon coordinates
- Stores roof area in `roofSize` field (number in m²)

**Potential ESG Use:** Roof area is fundamental for:

- Calculating potential solar panel coverage
- Estimating material usage and waste
- Energy efficiency calculations (roof area × insulation value)
- Carbon footprint estimation (materials per m²)

---

#### 4.2 Building Data Model

**File:** `src/types/index.ts`  
**Lines:** 431-444  
**Status:** `active` - Contains fields that could support ESG

**Interface:**

```typescript
export interface Building {
  id: string;
  companyId?: string;
  customerId?: string;
  address: string;
  buildingType?: 'residential' | 'commercial' | 'industrial';
  roofType?: RoofType; // 'tile' | 'metal' | 'shingle' | 'slate' | 'flat' | 'other'
  roofSize?: number; // m²
  latitude?: number;
  longitude?: number;
  createdAt: string;
  createdBy: string;
  branchId?: string;
}
```

**Description:** Building interface contains basic information that could be used for ESG calculations:

- `roofSize` - Area in square meters (could calculate energy efficiency)
- `roofType` - Material type (could assess sustainability)
- `buildingType` - Building classification (could affect calculations)
- `latitude/longitude` - Location (could determine climate zone, solar potential)

**Missing ESG Fields:** No environmental metrics, energy ratings, or sustainability scores.

---

#### 4.3 Report Data Model

**File:** `src/types/index.ts`  
**Lines:** 193-238  
**Status:** `active` - Contains fields that could support ESG

**Relevant Fields:**

```typescript
roofType: RoofType;
roofAge?: number;
roofSize?: number; // Total roof area in square meters
materialCost?: number; // Material cost in SEK
```

**Description:** Report interface contains roof information and material cost that could be used for ESG calculations, but no ESG-specific fields exist.

---

#### 4.4 Material Cost Tracking

**Files:**

- `src/types/index.ts` (Report interface, line 234)
- `src/types/index.ts` (Offer interface, line 348)

**Status:** `active` - Material costs tracked but not analyzed for ESG

**Description:** Material costs are tracked in reports and offers, which could be used to calculate:

- Material usage per project
- Recycling potential
- Carbon footprint of materials
- Sustainable material percentage

However, no ESG analysis or material lifecycle tracking exists.

---

### 5. Analytics Dashboard

**File:** `src/components/admin/AnalyticsDashboard.tsx`  
**Lines:** 92-97, 248-262  
**Status:** `active` - Tracks roof types but no ESG analysis

**Content:**

- Tracks reports by roof type (line 248-262)
- Displays roof type distribution and revenue per type
- No environmental impact or sustainability scoring

**Description:** Analytics dashboard aggregates roof types (`tile`, `metal`, `shingle`, `slate`, `flat`, `other`) but doesn't calculate environmental impact or sustainability metrics.

---

### 6. Product Roadmap Reference

**File:** `docs/06-project-management/PRODUCT_ROADMAP.md`  
**Status:** `archived` - Strategic planning document

**Description:** Product roadmap document from October 2025 that does not mention ESG features in the roadmap or gaps sections. ESG is not listed as a planned feature.

---

## What Was NOT Found

After comprehensive searching, the following ESG-related functionality is **completely absent**:

### Missing Components

- ❌ No ESG calculation functions
- ❌ No carbon footprint calculators
- ❌ No energy efficiency scoring
- ❌ No material lifecycle tracking
- ❌ No environmental impact metrics
- ❌ No sustainability scoring systems
- ❌ No green roofing certifications
- ❌ No LEED or other certification tracking
- ❌ No ESG report generation components
- ❌ No ESG data models or interfaces
- ❌ No ESG-specific database collections
- ❌ No ESG API integrations
- ❌ No environmental metrics services
- ❌ No commented-out ESG code
- ❌ No TODO/FIXME notes about ESG
- ❌ No partially implemented ESG modules

### Missing UI Components

- ❌ No ESG dashboard sections
- ❌ No environmental metrics displays
- ❌ No sustainability scorecards
- ❌ No carbon footprint visualizations
- ❌ No material recycling tracking UI
- ❌ No ESG report export functionality

---

## Related Infrastructure (Could Support ESG)

### Available Building Blocks

#### 1. Roof Area Calculation

- **Component:** `RoofSizeMeasurer.tsx`
- **Functionality:** Calculates roof area in square meters
- **ESG Potential:** Foundation for energy efficiency and solar potential calculations

#### 2. Material Cost Tracking

- **Location:** Report and Offer interfaces
- **Functionality:** Tracks material costs per project
- **ESG Potential:** Could calculate material usage, waste, and recycling potential

#### 3. Roof Type Classification

- **Location:** `RoofType` enum in `types/index.ts`
- **Values:** `'tile' | 'metal' | 'shingle' | 'slate' | 'flat' | 'other'`
- **ESG Potential:** Different materials have different environmental impacts and lifespans

#### 4. Building Type Classification

- **Location:** Building interface
- **Values:** `'residential' | 'commercial' | 'industrial'`
- **ESG Potential:** Different building types have different regulatory and environmental requirements

#### 5. Location Data (Latitude/Longitude)

- **Location:** Building and Report interfaces
- **ESG Potential:** Could determine climate zone, solar potential, local regulations

#### 6. Analytics Infrastructure

- **Location:** `AnalyticsDashboard.tsx`
- **ESG Potential:** Could be extended to track environmental metrics and trends

---

## Recommendations for Revival

### High-Priority Opportunities

#### 1. Building Profile ESG Section

**File:** `src/components/portal/BuildingDetail.tsx`

**Current State:** Displays building metadata, reports, service agreements, and activity timeline.

**Recommendation:** Add an ESG metrics section that could include:

- Roof area (already tracked)
- Potential solar panel capacity (calculate from roof area and roof type)
- Material sustainability score (based on roof type)
- Carbon footprint estimate (based on material costs and roof size)
- Energy efficiency rating (placeholder for future)

**Implementation Path:**

```typescript
// Add to Building interface
export interface Building {
  // ... existing fields
  esgMetrics?: {
    roofArea?: number; // Already exists as roofSize
    solarPotential?: number; // kWh/year potential
    sustainabilityScore?: number; // 0-100 based on roof type
    carbonFootprint?: number; // kg CO₂ equivalent
    energyRating?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  };
}
```

---

#### 2. ESG Report Generation

**Files:**

- `src/services/simplePdfService.ts`
- `src/components/serviceAgreements/ServiceAgreementForm.tsx`

**Current State:** Service Agreement form mentions ESG report, but no generation exists.

**Recommendation:** Implement ESG report generation that aggregates:

- Building-level metrics (roof area, type, age)
- Material usage across all reports for a building
- Carbon footprint calculations
- Energy efficiency estimates
- Sustainability recommendations

**Implementation Path:**

```typescript
// New service: src/services/esgService.ts
export interface ESGReport {
  buildingId: string;
  reportDate: string;
  environmental: {
    carbonFootprint: number; // kg CO₂
    materialRecyclingRate: number; // %
    energyEfficiency: number; // kWh/m²/year
  };
  social: {
    safetyComplianceScore: number; // 0-100
    workerSafetyIncidents: number;
  };
  governance: {
    complianceStatus: 'compliant' | 'partial' | 'non-compliant';
    certifications: string[];
  };
}
```

---

#### 3. Material Lifecycle Tracking

**Files:**

- `src/types/index.ts` (Report interface)
- `src/services/reportService.ts`

**Current State:** Material costs are tracked but not analyzed.

**Recommendation:** Track material lifecycle data:

- Material type per roof type
- Recycling potential
- Waste generation
- Sustainable material percentage

**Implementation Path:**

```typescript
// Add to Report interface
export interface Report {
  // ... existing fields
  materialBreakdown?: {
    roofingMaterial?: string;
    quantity?: number; // m² or units
    recyclable?: boolean;
    recycledContent?: number; // %
    carbonIntensity?: number; // kg CO₂ per m²
  };
}
```

---

#### 4. CO₂ Impact Tracking

**Current State:** Mentioned in marketing but not implemented.

**Recommendation:** Calculate CO₂ impact from:

- Material production (based on material costs and types)
- Transportation (based on travel costs)
- Installation process (based on labor costs)
- Waste disposal (based on roof size and material)

**Implementation Path:**

```typescript
// New utility: src/utils/esgCalculations.ts
export const calculateCarbonFootprint = (
  roofSize: number,
  roofType: RoofType,
  materialCost: number,
  travelDistance?: number
): number => {
  // Carbon intensity factors per roof type (kg CO₂ per m²)
  const carbonFactors = {
    tile: 15.5,
    metal: 8.2,
    shingle: 12.8,
    slate: 20.1,
    flat: 10.5,
    other: 15.0,
  };

  const baseFootprint = roofSize * (carbonFactors[roofType] || 15.0);
  const travelFootprint = travelDistance ? travelDistance * 0.12 : 0; // kg CO₂ per km
  return baseFootprint + travelFootprint;
};
```

---

## Data Model Extensions Needed

### Building Interface Extensions

```typescript
export interface Building {
  // ... existing fields

  // ESG Metrics (new)
  esgMetrics?: {
    sustainabilityScore?: number; // 0-100
    carbonFootprint?: number; // kg CO₂
    energyRating?: string;
    lastCalculated?: string; // ISO date
  };

  // Material Tracking (new)
  materialHistory?: Array<{
    date: string;
    materialType: string;
    quantity: number;
    recycled: boolean;
  }>;
}
```

### Report Interface Extensions

```typescript
export interface Report {
  // ... existing fields

  // ESG Data (new)
  environmentalImpact?: {
    carbonFootprint?: number; // kg CO₂
    materialUsage?: number; // m² or kg
    wasteGenerated?: number; // m² or kg
    recyclablePercentage?: number; // %
  };

  // Material Details (new)
  materialDetails?: {
    primaryMaterial?: string;
    secondaryMaterials?: string[];
    recyclingPotential?: 'high' | 'medium' | 'low';
    sustainableCertifications?: string[];
  };
}
```

---

## Integration Opportunities

### Building Profile Dashboard Integration

**File:** `src/components/portal/BuildingDetail.tsx`

**Current Sections:**

1. Building metadata
2. Map view
3. Reports list
4. Service agreements
5. Activity timeline

**Recommendation:** Add new "ESG Metrics" section that displays:

- Sustainability scorecard
- Carbon footprint over time
- Material lifecycle summary
- Energy efficiency rating
- Recommendations for improvement

---

### Analytics Dashboard Integration

**File:** `src/components/admin/AnalyticsDashboard.tsx`

**Current Analytics:**

- Revenue metrics
- Report statistics
- Roof type distribution
- Customer insights

**Recommendation:** Add ESG analytics section:

- Total carbon footprint across all buildings
- Material recycling rate
- Energy efficiency trends
- Sustainability score distribution
- Environmental impact by branch

---

## Implementation Complexity Assessment

### Low Complexity (Quick Wins)

1. **Roof Type Sustainability Scoring** - Simple lookup table based on roof type
2. **Basic Carbon Footprint** - Simple calculation based on roof size and type
3. **ESG Display Section** - UI component to show existing data (roof size, type)

### Medium Complexity

1. **Material Lifecycle Tracking** - Requires data model changes and tracking logic
2. **Energy Efficiency Calculations** - Requires formulas and potentially external data
3. **ESG Report Generation** - Requires PDF generation and data aggregation

### High Complexity

1. **Full ESG System** - Complete tracking, calculations, and reporting
2. **Integration with External APIs** - Solar potential APIs, certification databases
3. **Real-time Carbon Tracking** - Live updates based on operations

---

## Conclusion

The codebase contains **no implemented ESG functionality**. All ESG references are:

1. **Marketing text** in `MarketingPage.tsx`
2. **Translation keys** in service agreement forms
3. **Placeholder mentions** in service agreement descriptions

However, the codebase has **solid infrastructure** that could support ESG features:

- Roof area calculation (RoofSizeMeasurer)
- Material cost tracking (Reports, Offers)
- Building and roof type classification
- Location data (lat/lon)
- Analytics infrastructure

**Recommendation:** The ESG features mentioned in marketing could be implemented using the existing building data model and roof measurement infrastructure. The building profile dashboard (`BuildingDetail.tsx`) would be the ideal location to add ESG metrics sections.

---

---

## Major Discoveries: Complete ESG Systems in Subfolders

### Discovery 1: Bluwave_Form - ESG Assessment Application

**Location:** `F:\GitHub\Bluwave_Form`  
**Status:** `complete` - Fully functional assessment application  
**Technology:** React 18, Vite, EmailJS, jsPDF

#### Components

**1. Main Assessment Component**

- **File:** `src/components/ESGAssessment.jsx` (318 lines)
- **Features:**
  - Multi-step assessment flow (landing → contact → questions → results)
  - Weighted scoring system (17 points max, 4 critical questions with weight 2)
  - Section-based scoring (4 sections with individual scores)
  - Level-based recommendations (beginner/intermediate/advanced)

**2. Question System**

- **File:** `src/components/AssessmentQuestions.jsx`
- **Content:** 13 questions across 4 sections:
  - Section 1: Forståelse og bevidsthed (Q1-3, max 4 points)
  - Section 2: Mål og data (Q4-6, max 4 points)
  - Section 3: Strategi og forretning (Q7-9, max 4 points)
  - Section 4: Risici og fremtidssikring (Q10-13, max 5 points)

**3. Results Display**

- **File:** `src/components/ResultsDisplay.jsx`
- **Features:**
  - Score visualization with colored circles
  - Section breakdown with percentage scores
  - Personalized recommendations
  - PDF generation (using jsPDF + html2canvas)
  - Email sharing functionality

**4. Email Service**

- **File:** `src/services/emailService.js`
- **Features:**
  - Dual email system (customer report + Bluwave lead notification)
  - EmailJS integration
  - Formatted response templates

#### Scoring Algorithm

```javascript
// Weighted scoring system
const weights = {
  q3: 2, // Identified significant ESG factors
  q5: 2, // Data collection processes
  q8: 2, // Customer inquiries about ESG
  q10: 2, // Can document ESG work
};

// Score ranges determine recommendations:
// 0-6: Beginner (opstartsfasen)
// 7-12: Intermediate (har fat i tingene)
// 13-17: Advanced (godt i gang)
```

---

### Discovery 2: Agri_API - CO2 Calculation API

**Location:** `F:\GitHub\Agri_API`  
**Status:** `complete` - Full REST API for CO2 calculations  
**Technology:** Node.js, Express, SQLite, Swagger

#### Core Features

**1. Standard CO2 Calculations**

- **File:** `utils/calculations.js`
- **Functions:**
  - `performCalculations()` - Standard CO2 calculations with exponential decay model
  - Climate zone factors (temperate, tropical, arid, continental, polar)
  - Efficiency degradation modeling
  - Timeline generation with 1000 points for smooth curves

**2. Enhanced Social Impact Calculations**

- **File:** `utils/calculations.js` - `performEnhancedCalculations()`
- **Features:**
  - Social impact scoring (weighted average of 8 metrics)
  - Health impact calculations (hypertension, mortality reduction)
  - SDG alignment scoring
  - Sustainability score: (Environmental × 0.4) + (Social × 0.3) + (Health × 0.2) + (SDG × 0.1)

**3. API Endpoints**

- **File:** `routes/calculations.js`, `routes/social.js`
- **Endpoints:**
  - `POST /simple-calculate` - Basic CO2 calculation with minimal input
  - `POST /calculate` - Full CO2 calculation with all parameters
  - `POST /sales` - Sales summary optimized for presentations
  - `POST /batch` - Batch calculation for multiple buildings
  - `POST /compare` - Scenario comparison
  - `POST /social/enhanced-calculate` - Enhanced calculation with social metrics
  - `POST /social/sdg-report` - SDG alignment report
  - `POST /social/health-impact` - Health impact assessment

#### Mathematical Models

**Standard CO2 Calculation:**

```
CO2(t) = Initial_CO2 × e^(-decline_rate × t × climate_factor) - Σ(improvements)
```

**Climate Factors:**

- Temperate: 1.0 (baseline)
- Tropical: 1.2
- Arid: 0.9
- Continental: 1.1
- Polar: 0.8

**Efficiency Degradation:**

```
efficiency(t) = max(0, 1 - efficiency_degradation × years_active)
```

**SDG Alignment:**

```
SDG_Score = (Number_of_SDGs_Addressed ÷ 17) × 100
```

#### UN Sustainable Development Goals Supported

1. Zero Hunger - Urban farming on rooftops
2. Good Health and Well-being - Health issue prevention
3. Clean Water and Sanitation - Water retention and collection
4. Affordable and Clean Energy - Solar panels
5. Decent Work and Economic Growth - Productivity improvements
6. Climate Action - Integrated environmental impact reduction
7. Life on Land - Biodiversity support
8. Partnerships for the Goals - Knowledge exchange

---

### Discovery 3: agritectum-roof-calculator - ESG Dashboard

**Location:** `F:\GitHub\agritectum-roof-calculator`  
**Status:** `complete` - Frontend calculator with ESG dashboard  
**Technology:** React 18, TypeScript, Tailwind CSS, Recharts

#### Components

**1. ESG Dashboard Component**

- **File:** `src/components/ESGDashboard.tsx` (201 lines)
- **Features:**
  - Executive summary with key ESG metrics
  - GRI Standards compliance display
  - Risk assessment visualization
  - Scenario analysis comparison table
  - PDF and Excel export functionality

**2. ESG Type Definitions**

- **File:** `src/types/esg.ts` (121 lines)
- **Interfaces:**
  - `ESGCompliance` - GRI standards, TCFD alignment, SDG alignment, carbon neutrality
  - `FinancialAnalysis` - NPV, IRR, payback period, ROI, risk assessment, scenario analysis
  - `EnvironmentalImpact` - CO2 offset, energy savings, air quality, water retention, biodiversity
  - `StakeholderImpact` - Environmental, social, economic impacts
  - `ProfessionalReport` - Executive summary, detailed analysis, reporting tools

**3. GRI Standards Compliance**

- **G4-EN3:** Direct energy consumption (kWh)
- **G4-EN15:** Direct GHG emissions (kg CO₂)
- **G4-EN16:** Indirect GHG emissions (kg CO₂)
- **G4-EN17:** Other indirect GHG emissions (kg CO₂)
- **G4-EN19:** Reduction of GHG emissions (kg CO₂)

#### Financial Analysis Features

**Scenario Analysis:**

- Optimistic scenario
- Realistic scenario
- Pessimistic scenario

**Metrics Calculated:**

- NPV (Net Present Value)
- IRR (Internal Rate of Return)
- Payback Period
- ROI (Return on Investment)
- Risk Assessment (technical, financial, regulatory, market)

**Incentives Tracking:**

- Government incentives
- Utility incentives
- Tax benefits
- Total incentives

---

## Integration Opportunities

### Option 1: Reference/Embed Separate Tools

- Keep as standalone applications
- Link from agritectum-platform marketing pages
- Share infrastructure if needed (email service, etc.)
- **Pros:** Independent maintenance, no code conflicts
- **Cons:** Separate deployments, potential duplicate code

### Option 2: Integrate Core Functionality

- Extract core scoring logic from Bluwave_Form to `src/utils/esgCalculations.ts`
- Extract API integration from Agri_API to `src/services/esgService.ts`
- Adapt ESGDashboard from roof-calculator for agritectum-platform design system
- Integrate with existing building/report data
- **Pros:** Unified codebase, shared data models, single deployment
- **Cons:** Migration effort, potential breaking changes

### Option 3: Hybrid Approach (Recommended)

- Use Agri_API as backend calculation service
- Adapt ESGDashboard for building-specific metrics
- Use Bluwave_Form assessment logic for building ESG scoring
- Integrate with existing BuildingDetail component
- **Pros:** Leverages existing APIs, maintains separation of concerns, modular architecture
- **Cons:** Requires API integration setup

### Option 4: Use as Blueprint

- Review architecture patterns from all three systems
- Build agritectum-specific ESG features using similar patterns
- Leverage scoring algorithms and calculation models
- Adapt to roof inspection context (material lifecycle, carbon footprint, etc.)
- **Pros:** Custom solution, optimized for agritectum needs
- **Cons:** Most development effort required

---

**Last Updated:** 2025-01-11  
**Next Steps:** Implement ESG features using discovered systems as reference. Recommended approach: Hybrid (Option 3) - integrate calculation logic and adapt dashboard components for building context.
