/**
 * Building Comparison Tool
 * Compare maintenance costs, performance, and metrics across multiple buildings
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Building, BuildingComparison } from '../../types';
import { getBuildingsByCustomer } from '../../services/buildingService';
import { compareBuildings } from '../../services/portfolioService';
import { logger } from '../../utils/logger';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import { Bar } from 'react-chartjs-2';

const BuildingComparisonTool: React.FC = () => {
  const { currentUser } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [comparisons, setComparisons] = useState<BuildingComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadBuildings();
    }
  }, [currentUser]);

  const loadBuildings = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const customerId = currentUser.companyId || currentUser.uid;
      const buildingsList = await getBuildingsByCustomer(customerId);
      setBuildings(buildingsList);
    } catch (error) {
      logger.error('Error loading buildings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingToggle = (buildingId: string) => {
    setSelectedBuildings(prev => {
      if (prev.includes(buildingId)) {
        return prev.filter(id => id !== buildingId);
      } else if (prev.length < 10) {
        // Limit to 10 buildings
        return [...prev, buildingId];
      }
      return prev;
    });
  };

  const handleCompare = async () => {
    if (selectedBuildings.length < 2) {
      alert('Please select at least 2 buildings to compare');
      return;
    }

    try {
      setComparing(true);
      const results = await compareBuildings(selectedBuildings);
      setComparisons(results);
    } catch (error) {
      logger.error('Error comparing buildings:', error);
      alert('Failed to compare buildings');
    } finally {
      setComparing(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingSpinner />
      </div>
    );
  }

  // Chart data
  const costChartData = comparisons.length > 0 ? {
    labels: comparisons.map(c => c.buildingName),
    datasets: [
      {
        label: 'Total Costs (€)',
        data: comparisons.map(c => c.totalCosts),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
      {
        label: 'Cost per m² (€)',
        data: comparisons.map(c => c.costPerSqm),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  } : null;

  const conditionChartData = comparisons.length > 0 ? {
    labels: comparisons.map(c => c.buildingName),
    datasets: [
      {
        label: 'Condition Score',
        data: comparisons.map(c => c.conditionScore),
        backgroundColor: comparisons.map(c =>
          c.conditionScore >= 80
            ? 'rgba(34, 197, 94, 0.6)'
            : c.conditionScore >= 60
            ? 'rgba(234, 179, 8, 0.6)'
            : 'rgba(239, 68, 68, 0.6)'
        ),
        borderColor: comparisons.map(c =>
          c.conditionScore >= 80
            ? 'rgb(34, 197, 94)'
            : c.conditionScore >= 60
            ? 'rgb(234, 179, 8)'
            : 'rgb(239, 68, 68)'
        ),
        borderWidth: 1,
      },
    ],
  } : null;

  // Calculate benchmarks
  const avgCostPerSqm = comparisons.length > 0
    ? comparisons.reduce((sum, c) => sum + c.costPerSqm, 0) / comparisons.length
    : 0;

  const getTrendIcon = (value: number, avg: number) => {
    if (value > avg * 1.1) return <TrendingUp className='w-4 h-4 text-red-600' />;
    if (value < avg * 0.9) return <TrendingDown className='w-4 h-4 text-green-600' />;
    return <Minus className='w-4 h-4 text-gray-600' />;
  };

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Building Comparison</h1>
        <p className='text-gray-600 mt-1'>Compare costs, performance, and metrics across your buildings</p>
      </div>

      {/* Building Selection */}
      <div className='bg-white rounded-lg shadow p-6'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-semibold'>Select Buildings to Compare</h2>
          <span className='text-sm text-gray-500'>
            {selectedBuildings.length} selected (max 10)
          </span>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4'>
          {buildings.map(building => (
            <label
              key={building.id}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                selectedBuildings.includes(building.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <input
                type='checkbox'
                checked={selectedBuildings.includes(building.id)}
                onChange={() => handleBuildingToggle(building.id)}
                className='w-4 h-4 text-blue-600'
              />
              <div className='flex-1 min-w-0'>
                <p className='font-medium text-gray-900 truncate'>
                  {building.name || building.address}
                </p>
                <p className='text-sm text-gray-500 truncate'>{building.address}</p>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={handleCompare}
          disabled={selectedBuildings.length < 2 || comparing}
          className='w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-semibold'
        >
          {comparing ? 'Comparing...' : `Compare ${selectedBuildings.length} Buildings`}
        </button>
      </div>

      {/* Comparison Results */}
      {comparisons.length > 0 && (
        <>
          {/* Charts */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {costChartData && (
              <div className='bg-white rounded-lg shadow p-6'>
                <h3 className='text-lg font-semibold mb-4 flex items-center'>
                  <BarChart3 className='w-5 h-5 mr-2' />
                  Cost Comparison
                </h3>
                <Bar
                  data={costChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' as const },
                    },
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }}
                />
              </div>
            )}

            {conditionChartData && (
              <div className='bg-white rounded-lg shadow p-6'>
                <h3 className='text-lg font-semibold mb-4'>Condition Scores</h3>
                <Bar
                  data={conditionChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: { beginAtZero: true, max: 100 },
                    },
                  }}
                />
              </div>
            )}
          </div>

          {/* Detailed Comparison Table */}
          <div className='bg-white rounded-lg shadow overflow-hidden'>
            <div className='p-6 border-b'>
              <h3 className='text-lg font-semibold'>Detailed Metrics</h3>
              <p className='text-sm text-gray-500 mt-1'>
                Average Cost per m²: €{avgCostPerSqm.toFixed(2)}
              </p>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Building
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Total Costs
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Cost/m²
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Condition
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Maintenance Freq.
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Issues
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Last Inspection
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {comparisons.map((comparison, index) => (
                    <tr key={index} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div>
                          <div className='font-medium text-gray-900'>{comparison.buildingName}</div>
                          <div className='text-sm text-gray-500'>{comparison.address}</div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-gray-900'>
                            €{comparison.totalCosts.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-gray-900'>
                            €{comparison.costPerSqm.toFixed(2)}
                          </span>
                          {getTrendIcon(comparison.costPerSqm, avgCostPerSqm)}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            comparison.conditionScore >= 80
                              ? 'bg-green-100 text-green-800'
                              : comparison.conditionScore >= 60
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {comparison.conditionScore}/100
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {comparison.maintenanceFrequency} times
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        {comparison.issuesCount > 0 ? (
                          <span className='text-sm text-red-600 font-medium'>
                            {comparison.issuesCount} issues
                          </span>
                        ) : (
                          <span className='text-sm text-green-600'>No issues</span>
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {comparison.lastInspectionDate
                          ? new Date(comparison.lastInspectionDate).toLocaleDateString()
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
            <h3 className='text-lg font-semibold text-blue-900 mb-3'>Key Insights</h3>
            <ul className='space-y-2 text-sm text-blue-800'>
              <li>
                • <strong>Highest Cost:</strong>{' '}
                {comparisons[0]?.buildingName} (€{comparisons[0]?.totalCosts.toLocaleString()})
              </li>
              <li>
                • <strong>Best Condition:</strong>{' '}
                {comparisons.reduce((best, curr) =>
                  curr.conditionScore > best.conditionScore ? curr : best
                ).buildingName}{' '}
                (
                {comparisons.reduce((best, curr) =>
                  curr.conditionScore > best.conditionScore ? curr : best
                ).conditionScore}
                /100)
              </li>
              <li>
                • <strong>Most Cost-Effective:</strong>{' '}
                {comparisons.reduce((best, curr) =>
                  curr.costPerSqm < best.costPerSqm ? curr : best
                ).buildingName}{' '}
                (€
                {comparisons
                  .reduce((best, curr) => (curr.costPerSqm < best.costPerSqm ? curr : best))
                  .costPerSqm.toFixed(2)}
                /m²)
              </li>
            </ul>
          </div>
        </>
      )}

      {comparisons.length === 0 && selectedBuildings.length >= 2 && (
        <div className='bg-gray-50 border border-gray-200 rounded-lg p-12 text-center'>
          <p className='text-gray-500'>Click "Compare" to see detailed metrics and charts</p>
        </div>
      )}
    </div>
  );
};

export default BuildingComparisonTool;
