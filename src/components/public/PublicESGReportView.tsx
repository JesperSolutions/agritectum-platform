/**
 * Public ESG Report View Component - Professional Edition
 * 
 * Customer-facing view for ESG service reports with premium design
 * Accessed via public link, no authentication required
 * Features: Beautiful animations, interactive charts, professional layout
 */

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useIntl } from '../../hooks/useIntl';
import { ESGServiceReport, ESGMetrics, Building } from '../../types';
import { getPublicESGServiceReport } from '../../services/esgService';
import { calculateESGFromDivisions } from '../../utils/esgCalculations';
import { getBuildingById } from '../../services/buildingService';
import LoadingSpinner from '../common/LoadingSpinner';
import EnhancedErrorDisplay from '../EnhancedErrorDisplay';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Leaf,
  Sun,
  Wind,
  Droplets,
  TrendingUp,
  Target,
  Award,
  Calendar,
  Download,
  Building as BuildingIcon,
  MapPin,
  Check,
  ArrowRight,
  Zap,
  Trees,
  Users,
} from 'lucide-react';

// Scroll animation hook
const useScrollAnimation = () => {
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-scroll-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return visibleElements;
};

interface ScrollAnimateProps {
  id: string;
  visibleElements: Set<string>;
}

const ScaledElement: React.FC<ScrollAnimateProps & { children: React.ReactNode }> = ({
  id,
  visibleElements: _visibleElements,
  children,
}) => (
  <div
    id={id}
    data-scroll-animate
    className="transition-all duration-700 opacity-100 translate-y-0"
  >
    {children}
  </div>
);

const PublicESGReportView: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const { t } = useIntl();
  const [report, setReport] = useState<ESGServiceReport | null>(null);
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const visibleElements = useScrollAnimation();

  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) {
        setError('No report ID provided');
        setLoading(false);
        return;
      }

      try {
        const reportData = await getPublicESGServiceReport(reportId);

        if (!reportData) {
          setError('Report not found or not publicly accessible');
          setLoading(false);
          return;
        }

        if (!reportData.isPublic) {
          setError('This report is not publicly accessible');
          setLoading(false);
          return;
        }

        // Ensure we always have calculated metrics (older reports might miss it)
        const ensuredMetrics = reportData.calculatedMetrics
          ? reportData.calculatedMetrics
          : calculateESGFromDivisions(reportData.roofSize, reportData.divisions);

        setReport({ ...reportData, calculatedMetrics: ensuredMetrics });

        // Load building information
        if (reportData.buildingId) {
          try {
            const buildingData = await getBuildingById(reportData.buildingId);
            if (buildingData) {
              setBuilding(buildingData);
            }
          } catch (error) {
            console.warn('Could not load building information:', error);
          }
        }
      } catch (err) {
        console.error('Error fetching ESG report:', err);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const handleExportPDF = async () => {
    if (!reportRef.current || exportingPdf) return;
    setExportingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const target = reportRef.current;
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        // Skip any element marked with the Tailwind print:hidden utility (download buttons etc.)
        ignoreElements: (el: Element) => el.classList?.contains('print:hidden'),
      });

      // A4 portrait at 72dpi-ish: jsPDF default unit 'mm' -> 210 x 297 mm
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidthMm = pdf.internal.pageSize.getWidth();
      const pageHeightMm = pdf.internal.pageSize.getHeight();
      const imgWidthMm = pageWidthMm;
      const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      let heightLeft = imgHeightMm;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidthMm, imgHeightMm);
      heightLeft -= pageHeightMm;

      while (heightLeft > 0) {
        position = heightLeft - imgHeightMm; // negative offset to shift the image up
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidthMm, imgHeightMm);
        heightLeft -= pageHeightMm;
      }

      const filename = `esg-report-${reportId || 'export'}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('ESG PDF export failed:', err);
      // Fallback to native print so the user is never stuck.
      window.print();
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <EnhancedErrorDisplay
          error={error || 'The requested report could not be found or is no longer available.'}
          title="Report Not Found"
          showContactSupport={true}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Always ensure we have divisions and metrics
  const safeDivisions = report.divisions || {
    greenRoof: 25,
    noxReduction: 25,
    coolRoof: 25,
    socialActivities: 25,
  };
  const metrics = report.calculatedMetrics || calculateESGFromDivisions(report.roofSize || 0, safeDivisions);

  // Calculate segment metrics
  const segments = [
    {
      name: 'Green Roof',
      percentage: safeDivisions.greenRoof,
      icon: Leaf,
      color: 'from-emerald-500 to-[#8a9f47]',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
    },
    {
      name: 'NOₓ Reduction',
      percentage: safeDivisions.noxReduction,
      icon: Wind,
      color: 'from-[#7DA8CC] to-cyan-600',
      lightColor: 'bg-[#7DA8CC]/10',
      textColor: 'text-[#6890b3]',
      borderColor: 'border-[#7DA8CC]/30',
    },
    {
      name: 'Cool Roof',
      percentage: safeDivisions.coolRoof,
      icon: Sun,
      color: 'from-amber-400 to-[#DA5062]',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
    },
    {
      name: 'Social Activities',
      percentage: safeDivisions.socialActivities,
      icon: Users,
      color: 'from-violet-500 to-[#7f5182]',
      lightColor: 'bg-violet-50',
      textColor: 'text-violet-700',
      borderColor: 'border-violet-200',
    },
  ].filter((s) => s.percentage > 0);

  return (
    <div ref={reportRef} className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Premium Header with Hero Section */}
      <div className="relative overflow-hidden">
        {/* Subtle animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#7DA8CC]/100/10 rounded-full blur-3xl" />
        </div>

        {/* Header Content */}
        <div className="relative z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center space-x-2 mb-4 bg-emerald-500/20 text-emerald-100 px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-sm">
                  <Leaf className="w-4 h-4" />
                  <span className="text-sm font-semibold">ESG Sustainability Report</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-4">
                  Your Roof For Good Impact
                </h1>
                <p className="text-xl text-slate-200 max-w-2xl">
                  Discover how your sustainable roofing project contributes to environmental and social goals
                </p>
              </div>
              <button
                onClick={handleExportPDF}
                disabled={exportingPdf}
                className="print:hidden h-12 px-6 bg-white text-slate-900 rounded-lg hover:bg-slate-50 transition-all font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-wait"
              >
                <Download className="w-4 h-4" />
                <span>{exportingPdf ? 'Generating PDF…' : 'Download Report'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Quick Stats Section */}
          <ScaledElement id="quick-stats" visibleElements={visibleElements}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
              {[
                {
                  label: 'Total Roof Area',
                  value: `${report.roofSize.toLocaleString()}`,
                  unit: 'm²',
                  icon: BuildingIcon,
                  gradient: 'from-slate-600 to-slate-700',
                },
                {
                  label: 'Annual CO₂ Offset',
                  value: `${(metrics.annualCO2Offset / 1000).toFixed(1)}`,
                  unit: 'Tons',
                  icon: TrendingUp,
                  gradient: 'from-emerald-600 to-[#73853b]',
                },
                {
                  label: 'Energy Savings',
                  value: `${(metrics.energySavingsKwhPerYear ? metrics.energySavingsKwhPerYear / 1000 : 0).toFixed(0)}`,
                  unit: 'MWh/year',
                  icon: Zap,
                  gradient: 'from-amber-600 to-[#c23d4f]',
                },
                {
                  label: 'Environmental Score',
                  value: `${metrics.sustainabilityScore}`,
                  unit: '/100',
                  icon: Target,
                  gradient: 'from-[#7DA8CC] to-cyan-700',
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <stat.icon className="w-6 h-6 opacity-80" />
                  </div>
                  <div className="mb-1">
                    <p className="text-3xl md:text-4xl font-bold">{stat.value}</p>
                    <p className="text-sm opacity-90">{stat.unit}</p>
                  </div>
                  <p className="text-sm opacity-80 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </ScaledElement>

          {/* Building Information */}
          {building && (
            <ScaledElement id="building-info" visibleElements={visibleElements}>
              <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-12 shadow-sm hover:shadow-md transition-all">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                  <BuildingIcon className="w-6 h-6 mr-3 text-slate-600" />
                  Property Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Address</p>
                    <p className="text-lg text-slate-900 font-medium mt-2">{building.address}</p>
                  </div>
                  {building.buildingType && (
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Building Type</p>
                      <p className="text-lg text-slate-900 font-medium mt-2">{building.buildingType}</p>
                    </div>
                  )}
                </div>
              </div>
            </ScaledElement>
          )}

          {/* Roof Allocation Visualization */}
          <ScaledElement id="roof-allocation" visibleElements={visibleElements}>
            <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-12 shadow-sm hover:shadow-md transition-all">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center">
                <Leaf className="w-6 h-6 mr-3 text-emerald-600" />
                Roof Space Allocation
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {segments.map((segment) => (
                  <div
                    key={segment.name}
                    className={`${segment.lightColor} border ${segment.borderColor} rounded-xl p-4 transition-all hover:shadow-md`}
                  >
                    <div className="flex flex-col h-full">
                      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${segment.color} text-white w-fit mb-3`}>
                        <segment.icon className="w-5 h-5" />
                      </div>
                      <p className={`text-xs font-semibold ${segment.textColor} uppercase tracking-wider mb-2`}>
                        {segment.name}
                      </p>
                      <p className="text-xl font-bold text-slate-900 mb-1">{segment.percentage}%</p>
                      <p className="text-xs text-slate-600">
                        {Math.round((report.roofSize * segment.percentage) / 100).toLocaleString()} m²
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScaledElement>

          {/* Impact Metrics Section */}
          <ScaledElement id="impact-metrics" visibleElements={visibleElements}>
            <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-12 shadow-sm hover:shadow-md transition-all">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-[#7DA8CC]" />
                Environmental Impact
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* CO2 Reduction */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4 mx-auto">
                    <Trees className="w-10 h-10 text-emerald-600" />
                  </div>
                  <p className="text-4xl font-bold text-slate-900 mb-2">
                    {Math.round((metrics.annualCO2Offset || 0) / 20)}
                  </p>
                  <p className="text-sm text-slate-600 mb-2">Trees worth of CO₂ offset</p>
                  <p className="text-xs text-slate-500">
                    Over 40 years: {Math.round(((metrics.annualCO2Offset || 0) / 20) * 40).toLocaleString()}
                  </p>
                </div>

                {/* Energy Savings */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-4 mx-auto">
                    <Zap className="w-10 h-10 text-amber-600" />
                  </div>
                  <p className="text-4xl font-bold text-slate-900 mb-2">
                    {(metrics.energySavingsKwhPerYear ? metrics.energySavingsKwhPerYear / 1000 : 0).toFixed(1)}
                  </p>
                  <p className="text-sm text-slate-600 mb-2">MWh annual energy savings</p>
                  <p className="text-xs text-slate-500">
                    Equivalent to {Math.round((metrics.energySavingsKwhPerYear || 0) / 12)} homes powered
                  </p>
                </div>

                {/* Water Impact */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#7DA8CC]/15 mb-4 mx-auto">
                    <Droplets className="w-10 h-10 text-[#7DA8CC]" />
                  </div>
                  <p className="text-4xl font-bold text-slate-900 mb-2">∞</p>
                  <p className="text-sm text-slate-600 mb-2">Water management</p>
                  <p className="text-xs text-slate-500">Stormwater retention & infiltration</p>
                </div>
              </div>
            </div>
          </ScaledElement>

          {/* 40-Year Impact Projection */}
          <ScaledElement id="projection" visibleElements={visibleElements}>
            <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-12 shadow-sm hover:shadow-md transition-all">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-emerald-600" />
                40-Year Impact Projection
              </h2>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { year: '0', co2: 0, energy: 0 },
                      { year: '5', co2: (metrics.annualCO2Offset || 0) * 5, energy: (metrics.energySavingsKwhPerYear || 0) * 5 / 1000 },
                      { year: '10', co2: (metrics.annualCO2Offset || 0) * 10, energy: (metrics.energySavingsKwhPerYear || 0) * 10 / 1000 },
                      { year: '20', co2: (metrics.annualCO2Offset || 0) * 20, energy: (metrics.energySavingsKwhPerYear || 0) * 20 / 1000 },
                      { year: '30', co2: (metrics.annualCO2Offset || 0) * 30, energy: (metrics.energySavingsKwhPerYear || 0) * 30 / 1000 },
                      { year: '40', co2: (metrics.annualCO2Offset || 0) * 40, energy: (metrics.energySavingsKwhPerYear || 0) * 40 / 1000 },
                    ]}
                  >
                    <defs>
                      <linearGradient id="colorCO2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" stroke="#94a3b8" label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      formatter={(value, name) => {
                        if (name === 'co2') return [value.toFixed(1) + ' tons', 'CO₂ Offset'];
                        return [value.toFixed(1) + ' MWh', 'Energy Saved'];
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="co2"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCO2)"
                      name="CO2"
                    />
                    <Area
                      type="monotone"
                      dataKey="energy"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorEnergy)"
                      name="Energy"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ScaledElement>

          {/* Calculation Methodology & Detailed Breakdown */}
          <ScaledElement id="methodology" visibleElements={visibleElements}>
            <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-12 shadow-sm hover:shadow-md transition-all">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center">
                <Target className="w-6 h-6 mr-3 text-indigo-600" />
                How These Numbers Are Calculated
              </h2>

              <div className="space-y-8">
                {/* Division Breakdown */}
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Your Roof Allocation Strategy</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Your roofing project is divided into 4 strategic segments, each with different environmental benefits. 
                    The percentages below show how your {report.roofSize.toLocaleString()}m² roof is allocated to maximize ESG impact:
                  </p>
                  <div className="space-y-3">
                    {[
                      {
                        division: 'Green Roof System',
                        percentage: safeDivisions.greenRoof,
                        size: Math.round((safeDivisions.greenRoof / 100) * report.roofSize),
                        co2: 2.8,
                        nox: 0.08,
                        energy: 3.2,
                        water: 18.5,
                        description: 'Living vegetation for insulation, air purification, and habitat'
                      },
                      {
                        division: 'Photocatalytic Coating (NOₓ Reduction)',
                        percentage: safeDivisions.noxReduction,
                        size: Math.round((safeDivisions.noxReduction / 100) * report.roofSize),
                        co2: 1.6,
                        nox: 0.12,
                        energy: 0.8,
                        water: 2.1,
                        description: 'Advanced coating that breaks down air pollutants on contact'
                      },
                      {
                        division: 'Cool Roof Coating (White/Reflective)',
                        percentage: safeDivisions.coolRoof,
                        size: Math.round((safeDivisions.coolRoof / 100) * report.roofSize),
                        co2: 4.2,
                        nox: 0.03,
                        energy: 12.8,
                        water: 4.5,
                        description: 'Reflective surface reduces urban heat island effect and cooling costs'
                      },
                      {
                        division: 'Social Activities Area',
                        percentage: safeDivisions.socialActivities,
                        size: Math.round((safeDivisions.socialActivities / 100) * report.roofSize),
                        co2: 1.2,
                        nox: 0.04,
                        energy: 0.5,
                        water: 8.3,
                        description: 'Community space for gardens, recreation, and social connection'
                      },
                    ].map((segment, idx) => (
                      <div key={idx} className="border border-slate-300 rounded-lg p-4 hover:bg-white transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-slate-900">{segment.division}</p>
                            <p className="text-xs text-slate-600 mt-1">{segment.description}</p>
                          </div>
                          <span className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full text-sm">
                            {segment.percentage}% ({segment.size}m²)
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="bg-emerald-50 p-2 rounded">
                            <p className="text-emerald-700 font-bold">{segment.co2}</p>
                            <p className="text-emerald-600">kg CO₂/m²/yr</p>
                          </div>
                          <div className="bg-[#7DA8CC]/10 p-2 rounded">
                            <p className="text-[#6890b3] font-bold">{segment.nox}</p>
                            <p className="text-[#7DA8CC]">kg NOₓ/m²/yr</p>
                          </div>
                          <div className="bg-amber-50 p-2 rounded">
                            <p className="text-amber-700 font-bold">{segment.energy}</p>
                            <p className="text-amber-600">kWh/m²/yr</p>
                          </div>
                          <div className="bg-cyan-50 p-2 rounded">
                            <p className="text-cyan-700 font-bold">{segment.water}</p>
                            <p className="text-cyan-600">L/m²/yr</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Impact Calculation */}
                <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                  <h3 className="text-lg font-bold text-emerald-900 mb-4">Annual Impact Calculation</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between p-3 bg-white rounded border border-emerald-200">
                      <span className="text-slate-700">
                        <strong>CO₂ Offset:</strong> Sum of all divisions × their respective m² × 2.8-4.2 kg CO₂/m²/year
                      </span>
                      <span className="font-bold text-emerald-700">{(metrics.annualCO2Offset || 0).toLocaleString()} kg/yr</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded border border-amber-200">
                      <span className="text-slate-700">
                        <strong>Energy Savings:</strong> Primarily from Cool Roof coating (12.8 kWh/m²/yr) + other segments
                      </span>
                      <span className="font-bold text-amber-700">{(metrics.energySavingsKwhPerYear || 0).toLocaleString()} kWh/yr</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded border border-[#7DA8CC]/30">
                      <span className="text-slate-700">
                        <strong>Manufacturing Footprint:</strong> 19 kg CO₂/m² baseline
                      </span>
                      <span className="font-bold text-[#6890b3]">{(metrics.carbonFootprint || 0).toLocaleString()} kg CO₂</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded border border-cyan-200">
                      <span className="text-slate-700">
                        <strong>Payback Period:</strong> Initial CO₂ footprint ÷ Annual CO₂ offset
                      </span>
                      <span className="font-bold text-cyan-700">
                        {metrics.neutralityTimeline 
                          ? `${metrics.neutralityTimeline} years` 
                          : 'Achieved'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sustainability Factors */}
                <div className="bg-[#7DA8CC]/10 rounded-xl p-6 border border-[#7DA8CC]/30">
                  <h3 className="text-lg font-bold text-[#3b5060] mb-4">Sustainability Scoring Factors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border border-[#7DA8CC]/30">
                      <p className="font-semibold text-slate-900">Recycling Potential</p>
                      <p className="text-slate-600 text-xs mt-1">
                        Weighted average based on material recyclability:
                        Green Roofs (70%), Cool Roof (60%), Photocatalytic (50%), Social (60%)
                      </p>
                      <p className="font-bold text-[#6890b3] mt-2">{metrics.recyclingPotential || 0}% recyclable</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-[#7DA8CC]/30">
                      <p className="font-semibold text-slate-900">Sustainability Score</p>
                      <p className="text-slate-600 text-xs mt-1">
                        Based on: (Annual CO₂ reduction ÷ roof size × 10) + size bonus
                        Higher = More environmental benefit per square meter
                      </p>
                      <p className="font-bold text-[#6890b3] mt-2">{metrics.sustainabilityScore}/100 ({metrics.rating})</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-[#7DA8CC]/30">
                      <p className="font-semibold text-slate-900">Solar Potential</p>
                      <p className="text-slate-600 text-xs mt-1">
                        Estimated based on available roof area suitable for solar panels
                        using Nordic irradiance (~1000 kWh/m²/year) and 20% panel efficiency
                      </p>
                      <p className="font-bold text-[#6890b3] mt-2">{(metrics.solarPotential || 0).toLocaleString()} kWh/year</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-[#7DA8CC]/30">
                      <p className="font-semibold text-slate-900">SDG Alignment</p>
                      <p className="text-slate-600 text-xs mt-1">
                        This project directly supports {(metrics.sdgAlignment || []).length} of the 17 UN Sustainable Development Goals
                      </p>
                      <p className="font-bold text-[#6890b3] mt-2">{metrics.sdgScore}/100 alignment</p>
                    </div>
                  </div>
                </div>

                {/* Data Sources */}
                <div className="bg-slate-100 rounded-xl p-6 border border-slate-300">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">📚 Calculation Basis & Research Sources</h3>
                  <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
                    <li><strong>Green Roof CO₂:</strong> EPA Green Infrastructure studies (2-3 kg CO₂/m²/year)</li>
                    <li><strong>Photocatalytic NOₓ Reduction:</strong> Peer-reviewed studies show 0.08-0.12 kg NOₓ/m²/year reduction</li>
                    <li><strong>Cool Roof Energy:</strong> Lawrence Berkeley National Lab (LBNL) studies: 5-15 kWh/m²/year cooling reduction</li>
                    <li><strong>Water Management:</strong> Green infrastructure research: 10-25 L/m²/year stormwater retention</li>
                    <li><strong>Carbon Factors:</strong> Material lifecycle assessment data and Nordic energy grid carbon intensity</li>
                  </ul>
                </div>
              </div>
            </div>
          </ScaledElement>

          {/* Timeline & Benefits */}
          <ScaledElement id="timeline-benefits" visibleElements={visibleElements}>
            <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-12 shadow-sm hover:shadow-md transition-all">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-violet-600" />
                Long-Term Impact Timeline
              </h2>

              <div className="space-y-4">
                {[
                  { year: 'Year 1', benefit: 'Immediate carbon offset begins', icon: '🌱' },
                  { year: 'Year 5', benefit: 'Cumulative impact equivalent to planting 500+ trees', icon: '🌳' },
                  { year: 'Year 10', benefit: 'Energy savings offset equipment costs', icon: '⚡' },
                  { year: 'Year 20+', benefit: 'Complete environmental payback achieved', icon: '✓' },
                ].map((milestone, idx) => (
                  <div key={idx} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <span className="text-2xl">{milestone.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{milestone.year}</p>
                      <p className="text-sm text-slate-600">{milestone.benefit}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          </ScaledElement>

          {/* Key Achievements */}
          <ScaledElement id="achievements" visibleElements={visibleElements}>
            <div className="bg-gradient-to-br from-emerald-50 to-[#7DA8CC]/10 rounded-2xl border border-emerald-200 p-8 mb-12 shadow-sm hover:shadow-md transition-all">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center">
                <Award className="w-6 h-6 mr-3 text-emerald-600" />
                Key Achievements
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Sustainable Building', value: metrics.sustainabilityScore >= 70 ? '✓' : '–' },
                  { label: 'Carbon Neutral Path', value: metrics.neutralityTimeline ? '✓' : '–' },
                  { label: 'High Recyclability', value: '✓' },
                  { label: 'Renewable Energy Ready', value: metrics.solarPotential > 0 ? '✓' : '–' },
                ].map((achievement, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg border border-white/80">
                    <Check className={`w-5 h-5 ${achievement.value === '✓' ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span className="font-medium text-slate-900">{achievement.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScaledElement>

          {/* Call to Action / Next Steps */}
          <ScaledElement id="next-steps" visibleElements={visibleElements}>
            <div className="bg-slate-900 rounded-2xl p-8 md:p-12 text-white mb-12 shadow-lg">
              <h2 className="text-3xl font-bold mb-4">Ready to Make an Impact?</h2>
              <p className="text-slate-300 mb-6 max-w-2xl">
                This report showcases the significant environmental and social benefits of your sustainable roofing project. 
                Share these results with stakeholders and partners to demonstrate your commitment to sustainability.
              </p>
              <button
                onClick={handleExportPDF}
                disabled={exportingPdf}
                className="print:hidden inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-60 disabled:cursor-wait"
              >
                <Download className="w-4 h-4" />
                <span>{exportingPdf ? 'Generating PDF…' : 'Download Full Report'}</span>
              </button>
            </div>
          </ScaledElement>

          {/* Footer Note */}
          <div className="text-center text-slate-600 text-sm mb-8">
            <p>Report generated on {new Date(report.createdAt).toLocaleDateString()}</p>
            <p className="mt-2 text-slate-500">
              This report is confidential and intended for authorized recipients only
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
};

export default PublicESGReportView;
