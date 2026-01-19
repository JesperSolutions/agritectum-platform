import React, { useState, useEffect } from 'react';
import { DollarSign, Edit2, Save, X, Pencil } from 'lucide-react';
import { Report } from '../../types';
import { useIntl } from '../../hooks/useIntl';

interface CostSummaryCardProps {
  report: Report;
  isEditable: boolean;
  canEdit: boolean;
  onUpdate?: (costs: {
    laborCost: number;
    materialCost: number;
    travelCost: number;
    overheadCost: number;
  }) => Promise<void>;
}

const CostSummaryCard: React.FC<CostSummaryCardProps> = ({
  report,
  isEditable,
  canEdit,
  onUpdate,
}) => {
  const { t, formatCurrency } = useIntl();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [costs, setCosts] = useState({
    laborCost: report.laborCost || 0,
    materialCost: report.materialCost || 0,
    travelCost: report.travelCost || 0,
    overheadCost: report.overheadCost || 0,
  });

  // Sync costs when report changes (but not while editing)
  useEffect(() => {
    if (!isEditing) {
      setCosts({
        laborCost: report.laborCost || 0,
        materialCost: report.materialCost || 0,
        travelCost: report.travelCost || 0,
        overheadCost: report.overheadCost || 0,
      });
      setHasChanges(false);
    }
  }, [report.laborCost, report.materialCost, report.travelCost, report.overheadCost, isEditing]);

  // Track changes
  useEffect(() => {
    if (isEditing) {
      const changed = 
        costs.laborCost !== (report.laborCost || 0) ||
        costs.materialCost !== (report.materialCost || 0) ||
        costs.travelCost !== (report.travelCost || 0) ||
        costs.overheadCost !== (report.overheadCost || 0);
      setHasChanges(changed);
    }
  }, [costs, report, isEditing]);

  const formatCurrencySafe = (value: number) => formatCurrency(value);

  // Calculate recommended actions total
  const recommendedActionsTotal = (report.recommendedActions || []).reduce(
    (sum, action) => sum + (action.estimatedCost || 0),
    0
  );

  // Calculate subtotal (recommended actions + cost fields)
  const subtotal = recommendedActionsTotal + costs.laborCost + costs.materialCost + costs.travelCost + costs.overheadCost;

  // Total estimate (same as subtotal for now, profit margin can be added later)
  const totalEstimate = subtotal;

  const handleSave = async () => {
    if (!onUpdate) return;
    
    setIsSaving(true);
    try {
      await onUpdate(costs);
      setIsEditing(false);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving costs:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCosts({
      laborCost: report.laborCost || 0,
      materialCost: report.materialCost || 0,
      travelCost: report.travelCost || 0,
      overheadCost: report.overheadCost || 0,
    });
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const showEditButton = isEditable && canEdit && !isEditing;
  const showEditMode = isEditable && canEdit && isEditing;

  return (
    <div className='bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center space-x-3'>
          <div className='p-2 bg-blue-100 rounded-lg'>
            <DollarSign className='w-6 h-6 text-blue-600' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>
              {t('costEstimate.title') || 'Kostnadsuppskattning'}
            </h2>
            {showEditButton && (
              <p className='text-xs text-gray-500 mt-0.5'>
                Klicka på "Redigera" för att ändra kostnader
              </p>
            )}
          </div>
        </div>
        {showEditButton && (
          <button
            onClick={handleStartEdit}
            className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105'
          >
            <Edit2 className='w-4 h-4 mr-2' />
            {t('costEstimate.edit') || 'Redigera'}
          </button>
        )}
        {showEditMode && (
          <div className='flex items-center space-x-2'>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg'
            >
              <Save className='w-4 h-4 mr-2' />
              {isSaving ? 'Sparar...' : (t('costEstimate.save') || 'Spara')}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className='inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all'
            >
              <X className='w-4 h-4 mr-2' />
              {t('costEstimate.cancel') || 'Avbryt'}
            </button>
          </div>
        )}
      </div>

      {/* Total Estimate - Very Prominent */}
      <div className='mb-6 pb-6 border-b-2 border-gray-200'>
        <div className='text-xs uppercase tracking-wide text-gray-500 mb-2 font-medium'>
          {t('costEstimate.total') || 'Total uppskattning'}
        </div>
        <div className='text-5xl font-bold text-gray-900'>
          {formatCurrencySafe(totalEstimate)}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className='space-y-4'>
        {/* Recommended Actions */}
        {recommendedActionsTotal > 0 && (
          <div className='flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-200'>
            <div className='flex items-center'>
              <span className='text-sm font-medium text-gray-700'>
                {t('costEstimate.recommendedActions') || 'Rekommenderade åtgärder'}
              </span>
            </div>
            <span className='text-base font-semibold text-gray-900'>
              {formatCurrencySafe(recommendedActionsTotal)}
            </span>
          </div>
        )}

        {/* Editable Cost Fields */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Labor Cost */}
          <div className={`flex flex-col py-3 px-4 rounded-lg border-2 transition-all ${
            showEditMode 
              ? 'bg-blue-50 border-blue-300' 
              : canEdit && showEditButton
              ? 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className='flex items-center justify-between mb-2'>
              <label className='text-sm font-medium text-gray-700'>
                {t('costEstimate.labor') || 'Arbetskostnad'}
              </label>
              {showEditMode && <Pencil className='w-3 h-3 text-blue-600' />}
            </div>
            {showEditMode ? (
              <input
                type='number'
                value={costs.laborCost || ''}
                onChange={(e) => setCosts({ ...costs, laborCost: parseFloat(e.target.value) || 0 })}
                className='w-full px-3 py-2 text-base font-semibold border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
                placeholder='0'
                min='0'
                step='100'
                autoFocus={false}
              />
            ) : (
              <div className='text-lg font-semibold text-gray-900'>
                {formatCurrencySafe(costs.laborCost)}
              </div>
            )}
          </div>

          {/* Material Cost */}
          <div className={`flex flex-col py-3 px-4 rounded-lg border-2 transition-all ${
            showEditMode 
              ? 'bg-blue-50 border-blue-300' 
              : canEdit && showEditButton
              ? 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className='flex items-center justify-between mb-2'>
              <label className='text-sm font-medium text-gray-700'>
                {t('costEstimate.material') || 'Materialkostnad'}
              </label>
              {showEditMode && <Pencil className='w-3 h-3 text-blue-600' />}
            </div>
            {showEditMode ? (
              <input
                type='number'
                value={costs.materialCost || ''}
                onChange={(e) => setCosts({ ...costs, materialCost: parseFloat(e.target.value) || 0 })}
                className='w-full px-3 py-2 text-base font-semibold border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
                placeholder='0'
                min='0'
                step='100'
              />
            ) : (
              <div className='text-lg font-semibold text-gray-900'>
                {formatCurrencySafe(costs.materialCost)}
              </div>
            )}
          </div>

          {/* Travel Cost */}
          <div className={`flex flex-col py-3 px-4 rounded-lg border-2 transition-all ${
            showEditMode 
              ? 'bg-blue-50 border-blue-300' 
              : canEdit && showEditButton
              ? 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className='flex items-center justify-between mb-2'>
              <label className='text-sm font-medium text-gray-700'>
                {t('costEstimate.travel') || 'Resekostnad'}
              </label>
              {showEditMode && <Pencil className='w-3 h-3 text-blue-600' />}
            </div>
            {showEditMode ? (
              <input
                type='number'
                value={costs.travelCost || ''}
                onChange={(e) => setCosts({ ...costs, travelCost: parseFloat(e.target.value) || 0 })}
                className='w-full px-3 py-2 text-base font-semibold border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
                placeholder='0'
                min='0'
                step='100'
              />
            ) : (
              <div className='text-lg font-semibold text-gray-900'>
                {formatCurrencySafe(costs.travelCost)}
              </div>
            )}
          </div>

          {/* Overhead Cost */}
          <div className={`flex flex-col py-3 px-4 rounded-lg border-2 transition-all ${
            showEditMode 
              ? 'bg-blue-50 border-blue-300' 
              : canEdit && showEditButton
              ? 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className='flex items-center justify-between mb-2'>
              <label className='text-sm font-medium text-gray-700'>
                {t('costEstimate.overhead') || 'Omkostnader'}
              </label>
              {showEditMode && <Pencil className='w-3 h-3 text-blue-600' />}
            </div>
            {showEditMode ? (
              <input
                type='number'
                value={costs.overheadCost || ''}
                onChange={(e) => setCosts({ ...costs, overheadCost: parseFloat(e.target.value) || 0 })}
                className='w-full px-3 py-2 text-base font-semibold border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
                placeholder='0'
                min='0'
                step='100'
              />
            ) : (
              <div className='text-lg font-semibold text-gray-900'>
                {formatCurrencySafe(costs.overheadCost)}
              </div>
            )}
          </div>
        </div>

        {/* Subtotal - Visual Separator */}
        <div className='flex items-center justify-between py-4 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 mt-6'>
          <span className='text-base font-bold text-gray-900'>
            {t('costEstimate.subtotal') || 'Delsumma'}
          </span>
          <span className='text-xl font-bold text-blue-700'>
            {formatCurrencySafe(subtotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CostSummaryCard;

