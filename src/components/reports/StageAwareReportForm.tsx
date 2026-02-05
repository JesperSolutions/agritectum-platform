/**
 * Stage-Aware Report Form Wrapper
 * 
 * Manages which sections of the report form are visible based on the current stage:
 * - Stage 1 (On-Site): Customer info, inspection details, issues, photos
 * - Stage 2 (Annotation): Issues, annotations, recommended actions
 * - Stage 3 (Completion): Final review, cost estimation, completion
 */

import React, { useMemo } from 'react';
import { Report, ReportStage } from '../../types';
import { useIntl } from '../../hooks/useIntl';
import { CheckCircle2, AlertCircle, ClipboardList } from 'lucide-react';

interface StageAwareReportFormProps {
  report: Report;
  children: React.ReactNode;
  currentStage: ReportStage;
}

interface StageConfig {
  showCustomerInfo: boolean;
  showInspectionDetails: boolean;
  showIssues: boolean;
  showAnnotations: boolean;
  showRecommendedActions: boolean;
  showCostEstimate: boolean;
  showReview: boolean;
  label: string;
  description: string;
  color: string;
  progress: number;
}

/**
 * Get which sections should be visible for each stage
 */
const getStageConfig = (stage: ReportStage): StageConfig => {
  switch (stage) {
    case 'stage1':
      return {
        showCustomerInfo: true,
        showInspectionDetails: true,
        showIssues: true,
        showAnnotations: false,
        showRecommendedActions: false,
        showCostEstimate: false,
        showReview: false,
        label: 'On-Site Data Collection',
        description: 'Collect customer info, inspection details, and identify issues',
        color: 'blue',
        progress: 33,
      };
    case 'stage2':
      return {
        showCustomerInfo: true, // Can view but not edit
        showInspectionDetails: true, // Can view but not edit
        showIssues: true,
        showAnnotations: true,
        showRecommendedActions: true,
        showCostEstimate: false,
        showReview: false,
        label: 'Annotation & Mapping',
        description: 'Annotate issues, add recommended actions, and estimate costs',
        color: 'amber',
        progress: 66,
      };
    case 'stage3':
      return {
        showCustomerInfo: true, // Read-only
        showInspectionDetails: true, // Read-only
        showIssues: true, // Read-only
        showAnnotations: true, // Read-only
        showRecommendedActions: true, // Read-only
        showCostEstimate: true,
        showReview: true,
        label: 'Final Review & Completion',
        description: 'Review, verify costs, and complete the report',
        color: 'green',
        progress: 100,
      };
  }
};

/**
 * Stage Progress Indicator Component
 */
export const StageProgressIndicator: React.FC<{ stage: ReportStage }> = ({ stage }) => {
  const { t } = useIntl();
  const config = getStageConfig(stage);

  const stageLabels: Record<ReportStage, string> = {
    stage1: t('reports.library.stage1OnSite') || 'On-Site',
    stage2: t('reports.library.stage2Annotation') || 'Annotation',
    stage3: t('reports.library.stage3Complete') || 'Completed',
  };

  return (
    <div className='mb-8'>
      {/* Stage Header */}
      <div className='bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200 mb-6'>
        <div className='flex items-start justify-between mb-4'>
          <div>
            <h2 className='text-2xl font-bold text-slate-900 mb-2'>
              {stageLabels[stage]}
            </h2>
            <p className='text-slate-600 text-sm'>
              {config.description}
            </p>
          </div>
          <div className='text-right'>
            <div className='text-3xl font-bold text-slate-900'>{config.progress}%</div>
            <div className='text-xs text-slate-500'>Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='w-full bg-slate-300 rounded-full h-2'>
          <div
            className='h-2 bg-blue-600 rounded-full transition-all duration-300'
            style={{ width: `${config.progress}%` }}
          />
        </div>

        {/* Stage Indicators */}
        <div className='flex justify-between mt-4 text-xs font-medium'>
          {(['stage1', 'stage2', 'stage3'] as ReportStage[]).map((s) => {
            const stageName = stageLabels[s];
            const isActive =
              s === stage ||
              (stage === 'stage2' && s === 'stage1') ||
              (stage === 'stage3' && (s === 'stage1' || s === 'stage2'));

            return (
              <div key={s} className={isActive ? 'text-blue-600 font-semibold' : 'text-slate-500'}>
                {stageName.split(' ')[0]}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Info Card */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
        <div className='flex gap-3'>
          <AlertCircle className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
          <div className='text-sm text-blue-800'>
            <p className='font-medium mb-1'>
              {stage === 'stage1' && 'Stage 1: Collect data and identify issues on-site'}
              {stage === 'stage2' && 'Stage 2: Annotate findings and add recommended actions'}
              {stage === 'stage3' && 'Stage 3: Complete your report and prepare for submission'}
            </p>
            <p className='text-blue-700 text-xs'>
              {stage === 'stage1' && 'You can save your progress and continue editing. Move to Stage 2 when ready to annotate.'}
              {stage === 'stage2' && 'Review and edit issues. Add cost estimates for recommended actions.'}
              {stage === 'stage3' && 'Final review of all information. Cost estimation complete. Ready to submit.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main wrapper component that controls visibility of form sections
 */
export const StageAwareReportForm: React.FC<StageAwareReportFormProps> = ({
  report,
  children,
  currentStage,
}) => {
  const config = useMemo(() => getStageConfig(currentStage), [currentStage]);

  // Note: The actual form sections are controlled via attributes passed to ReportForm
  // This component can be extended to filter/reorganize sections as needed

  return (
    <div className='space-y-6'>
      <StageProgressIndicator stage={currentStage} />
      
      {/* Form sections will be rendered by ReportForm based on visibility config */}
      {children}
    </div>
  );
};

/**
 * Export stage config for use in ReportForm to determine visibility
 */
export { getStageConfig };
export type { StageConfig };
