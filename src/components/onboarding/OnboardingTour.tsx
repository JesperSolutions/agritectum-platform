import React, { useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft, X, SkipForward } from 'lucide-react';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useIntl } from '../../hooks/useIntl';

const OnboardingTour: React.FC = () => {
  const { t } = useIntl();
  const {
    showTour,
    setShowTour,
    currentStep,
    steps,
    isOnLastStep,
    nextStep,
    prevStep,
    skipTour,
    progressPercent,
  } = useOnboarding();
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; height: number }>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  // Update highlight element position when step changes
  useEffect(() => {
    if (!showTour || !currentStep?.highlightSelector) {
      setHighlightElement(null);
      return;
    }

    const timer = setTimeout(() => {
      const element = document.querySelector(currentStep.highlightSelector!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightElement(element as HTMLElement);
        setPosition({
          top: rect.top + window.scrollY - 8,
          left: rect.left + window.scrollX - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [showTour, currentStep]);

  if (!showTour || !currentStep) {
    return null;
  }

  const getTooltipPosition = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      zIndex: 9999,
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      maxWidth: '320px',
      border: '1px solid #e5e7eb',
    };

    if (currentStep.highlightSelector) {
      const offset = 16;
      switch (currentStep.position || 'top') {
        case 'top':
          return {
            ...baseStyle,
            top: `${position.top - 340}px`,
            left: `${position.left + position.width / 2 - 160}px`,
          };
        case 'bottom':
          return {
            ...baseStyle,
            top: `${position.top + position.height + offset}px`,
            left: `${position.left + position.width / 2 - 160}px`,
          };
        case 'left':
          return {
            ...baseStyle,
            top: `${position.top + position.height / 2 - 100}px`,
            left: `${position.left - 340}px`,
          };
        case 'right':
          return {
            ...baseStyle,
            top: `${position.top + position.height / 2 - 100}px`,
            left: `${position.left + position.width + offset}px`,
          };
        default:
          return baseStyle;
      }
    }

    // Center on screen if no highlight element
    return {
      ...baseStyle,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  };

  const currentStepIndex = steps.findIndex(s => s.id === currentStep.id);
  const isFirstStep = currentStepIndex === 0;

  return (
    <>
      {/* Overlay */}
      {currentStep.highlightSelector && (
        <div className='fixed inset-0 z-40 bg-black/50 pointer-events-none' />
      )}

      {/* Highlight box */}
      {highlightElement && currentStep.highlightSelector && (
        <div
          className='fixed z-50 border-2 border-blue-500 rounded-lg pointer-events-none bg-blue-50/20'
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            height: `${position.height}px`,
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)',
          }}
        />
      )}

      {/* Tooltip */}
      <div style={getTooltipPosition()} className='animate-in fade-in zoom-in-95'>
        {/* Progress bar */}
        <div className='mb-4'>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-xs font-medium text-gray-600'>
              {currentStepIndex + 1} of {steps.length}
            </span>
            <button
              onClick={() => setShowTour(false)}
              className='p-1 hover:bg-gray-100 rounded-md transition-colors'
              aria-label='Close tour'
            >
              <X className='w-4 h-4 text-gray-500' />
            </button>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-1.5'>
            <div
              className='bg-blue-500 h-1.5 rounded-full transition-all'
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className='mb-6'>
          <h3 className='text-lg font-bold text-gray-900 mb-2'>{currentStep.title}</h3>
          <p className='text-sm text-gray-600 leading-relaxed'>{currentStep.description}</p>
        </div>

        {/* Action button */}
        {currentStep.actionUrl && currentStep.actionLabel && (
          <a
            href={currentStep.actionUrl}
            className='inline-block w-full text-center px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors mb-4'
          >
            {currentStep.actionLabel}
          </a>
        )}

        {/* Navigation */}
        <div className='flex gap-2 items-center'>
          <button
            onClick={prevStep}
            disabled={isFirstStep}
            className='p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            aria-label='Previous step'
          >
            <ChevronLeft className='w-4 h-4' />
          </button>

          <div className='flex-1' />

          {currentStep.skipAllowed && (
            <button
              onClick={skipTour}
              className='text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1'
            >
              <SkipForward className='w-4 h-4' />
              Skip
            </button>
          )}

          <button
            onClick={isOnLastStep ? () => setShowTour(false) : nextStep}
            className='p-2 hover:bg-blue-100 rounded-md transition-colors bg-blue-50'
            aria-label={isOnLastStep ? 'Close tour' : 'Next step'}
          >
            <ChevronRight className='w-4 h-4 text-blue-600' />
          </button>
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;
