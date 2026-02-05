/**
 * Report Stage Manager Hook
 *
 * Manages the multi-stage workflow for roof reports
 * Integrates with ReportForm to control stage progression
 */

import React, { useState, useCallback } from 'react';
import { Report } from '../types';

export type ReportStage = 'stage1' | 'stage2' | 'stage3';

interface StageInfo {
  stage: ReportStage;
  label: string;
  progress: number;
  description: string;
  nextButtonText: string;
  showOnSiteFields: boolean;
  showAnnotationFields: boolean;
  showCompletionFields: boolean;
}

const STAGE_CONFIG: Record<ReportStage, StageInfo> = {
  stage1: {
    stage: 'stage1',
    label: 'On-Site Data Collection',
    progress: 33,
    description: 'Collect initial roof data, take photos, and document conditions on-site',
    nextButtonText: 'Save & Go to Office',
    showOnSiteFields: true,
    showAnnotationFields: false,
    showCompletionFields: false,
  },
  stage2: {
    stage: 'stage2',
    label: 'Annotation & Mapping',
    progress: 66,
    description: 'Annotate findings, map issues to roof locations, and add descriptions',
    nextButtonText: 'Mark Complete',
    showOnSiteFields: true,
    showAnnotationFields: true,
    showCompletionFields: false,
  },
  stage3: {
    stage: 'stage3',
    label: 'Completed',
    progress: 100,
    description: 'Report ready for branch manager review, pricing, and estimation',
    nextButtonText: 'Submit for Review',
    showOnSiteFields: true,
    showAnnotationFields: true,
    showCompletionFields: true,
  },
};

interface UseReportStageOptions {
  initialStage?: ReportStage;
  onStageChange?: (stage: ReportStage) => void;
}

export const useReportStage = (options?: UseReportStageOptions) => {
  const [currentStage, setCurrentStage] = useState<ReportStage>(
    options?.initialStage || 'stage1'
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  const stageInfo = STAGE_CONFIG[currentStage];

  const advanceStage = useCallback(async () => {
    setIsTransitioning(true);
    try {
      const nextStage = currentStage === 'stage1' ? 'stage2' : 'stage3';
      setCurrentStage(nextStage);
      options?.onStageChange?.(nextStage);
    } finally {
      setIsTransitioning(false);
    }
  }, [currentStage, options]);

  const setStage = useCallback((stage: ReportStage) => {
    setCurrentStage(stage);
    options?.onStageChange?.(stage);
  }, [options]);

  const canAdvance = currentStage !== 'stage3';

  return {
    currentStage,
    stageInfo,
    isTransitioning,
    advanceStage,
    setStage,
    canAdvance,
    STAGE_CONFIG,
  };
};

/**
 * Stage Progress Indicator Component
 * Shows visual progress bar and current stage info
 */
interface StageProgressProps {
  stage: ReportStage;
  compact?: boolean;
}

export const StageProgress: React.FC<StageProgressProps> = ({ stage, compact = false }) => {
  const info = STAGE_CONFIG[stage];

  if (compact) {
    return (
      <div className='flex items-center gap-2 text-sm'>
        <div className='flex gap-1'>
          {(['stage1', 'stage2', 'stage3'] as ReportStage[]).map((s) => (
            <div
              key={s}
              className={`h-2 w-8 rounded-full transition-all ${
                s === stage || 
                (stage === 'stage2' && s === 'stage1') || 
                (stage === 'stage3' && (s === 'stage1' || s === 'stage2'))
                  ? 'bg-blue-600'
                  : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
        <span className='font-medium text-slate-600'>{info.progress}%</span>
      </div>
    );
  }

  return (
    <div className='bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-lg border border-slate-200'>
      <div className='flex items-center justify-between mb-3'>
        <div>
          <h3 className='font-semibold text-slate-900 text-lg'>{info.label}</h3>
          <p className='text-sm text-slate-600'>{info.description}</p>
        </div>
        <div className='text-right'>
          <div className='text-2xl font-bold text-blue-600'>{info.progress}%</div>
          <div className='text-xs text-slate-500'>Progress</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className='w-full bg-slate-300 rounded-full h-2'>
        <div
          className='h-2 bg-blue-600 rounded-full transition-all duration-300'
          style={{ width: `${info.progress}%` }}
        />
      </div>

      {/* Stage Indicators */}
      <div className='flex justify-between mt-3 text-xs font-medium'>
        {(['stage1', 'stage2', 'stage3'] as ReportStage[]).map((s) => {
          const stageName = STAGE_CONFIG[s].label;
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
  );
};

/**
 * Stage-aware field visibility utility
 * Use this to conditionally show/hide fields based on current stage
 */
export const shouldShowField = (
  fieldStage: 'onsite' | 'annotation' | 'completion',
  currentStage: ReportStage
): boolean => {
  const info = STAGE_CONFIG[currentStage];

  switch (fieldStage) {
    case 'onsite':
      return info.showOnSiteFields;
    case 'annotation':
      return info.showAnnotationFields;
    case 'completion':
      return info.showCompletionFields;
    default:
      return true;
  }
};

/**
 * Helper to update report with stage info before saving
 */
export const addStageMetadata = (
  report: Partial<Report>,
  stage: ReportStage
): Partial<Report> => {
  const now = new Date().toISOString();

  return {
    ...report,
    reportStage: stage,
    ...(stage === 'stage1' && { stage1CompletedAt: now }),
    ...(stage === 'stage2' && { stage2CompletedAt: now }),
    lastEdited: now,
  };
};
