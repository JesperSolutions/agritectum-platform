import React, { useState, useEffect } from 'react';
import {
  Loader2,
  BarChart3,
  Users,
  FileText,
  AlertTriangle,
  Building,
  Activity,
} from 'lucide-react';
import { useIntl } from '../hooks/useIntl';

interface LoadingProgressProps {
  message?: string;
  progress?: number;
  showSteps?: boolean;
  className?: string;
}

const LoadingProgress: React.FC<LoadingProgressProps> = ({
  message = 'Loading...',
  progress = 0,
  showSteps = false,
  className = '',
}) => {
  const { t } = useIntl();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: FileText, labelKey: 'analytics.loadingSteps.loadingReports', color: 'blue' },
    { icon: Users, labelKey: 'analytics.loadingSteps.analyzingCustomers', color: 'green' },
    { icon: BarChart3, labelKey: 'analytics.loadingSteps.calculatingMetrics', color: 'purple' },
    { icon: AlertTriangle, labelKey: 'analytics.loadingSteps.processingIssues', color: 'red' },
    { icon: Building, labelKey: 'analytics.loadingSteps.branchAnalysis', color: 'indigo' },
    { icon: Activity, labelKey: 'analytics.loadingSteps.finalizingData', color: 'orange' },
  ];

  useEffect(() => {
    if (showSteps && progress > 0) {
      const stepIndex = Math.floor((progress / 100) * steps.length);
      setCurrentStep(Math.min(stepIndex, steps.length - 1));
    }
  }, [progress, showSteps, steps.length]);

  const getColorClasses = (color: string, isActive: boolean) => {
    const baseClasses = isActive ? 'text-white' : 'text-gray-400';
    const _bgClasses = isActive ? `bg-${color}-500` : 'bg-gray-200';

    switch (color) {
      case 'blue':
        return `${baseClasses} ${isActive ? 'bg-blue-500' : 'bg-gray-200'}`;
      case 'green':
        return `${baseClasses} ${isActive ? 'bg-green-500' : 'bg-gray-200'}`;
      case 'purple':
        return `${baseClasses} ${isActive ? 'bg-purple-500' : 'bg-gray-200'}`;
      case 'red':
        return `${baseClasses} ${isActive ? 'bg-red-500' : 'bg-gray-200'}`;
      case 'indigo':
        return `${baseClasses} ${isActive ? 'bg-indigo-500' : 'bg-gray-200'}`;
      case 'orange':
        return `${baseClasses} ${isActive ? 'bg-orange-500' : 'bg-gray-200'}`;
      default:
        return `${baseClasses} ${isActive ? 'bg-blue-500' : 'bg-gray-200'}`;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {/* Main Loading Spinner */}
      <div className='relative mb-6'>
        <div className='w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600'></div>
        <div className='absolute inset-0 flex items-center justify-center'>
          <BarChart3 className='w-6 h-6 text-blue-600' />
        </div>
      </div>

      {/* Progress Bar */}
      <div className='w-full max-w-md mb-4'>
        <div className='flex justify-between text-sm text-gray-600 mb-2'>
          <span>{message}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out'
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Steps Indicator */}
      {showSteps && (
        <div className='w-full max-w-2xl'>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStep;
              const isCurrent = index === currentStep;

              return (
                <div
                  key={index}
                  className={`flex items-center space-x-2 p-3 rounded-lg transition-all duration-300 ${
                    isActive ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-full ${getColorClasses(step.color, isActive)}`}>
                    <Icon className='w-4 h-4' />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {t(step.labelKey)}
                  </span>
                  {isCurrent && <Loader2 className='w-3 h-3 animate-spin text-blue-600' />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading Message */}
      <p className='text-gray-600 text-sm mt-4 text-center'>
        {showSteps && currentStep < steps.length
          ? t('analytics.loadingSteps.processing', {
              step: t(steps[currentStep].labelKey).toLowerCase(),
            })
          : t('analytics.loadingSteps.pleaseWait')}
      </p>
    </div>
  );
};

export default LoadingProgress;
