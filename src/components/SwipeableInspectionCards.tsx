import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, SkipForward } from 'lucide-react';

interface InspectionStep {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
  children: React.ReactNode;
}

interface SwipeableInspectionCardsProps {
  steps: InspectionStep[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onComplete?: () => void;
}

/**
 * SwipeableInspectionCards - A mobile-optimized, swipeable card interface for step-by-step inspection
 * 
 * Features:
 * - Full-screen cards on mobile, multi-card grid on desktop
 * - Swipe gestures to navigate between steps
 * - Skip buttons for optional steps
 * - Progress indicator showing current step and total
 * - Smooth animations and transitions
 */
export const SwipeableInspectionCards: React.FC<SwipeableInspectionCardsProps> = ({
  steps,
  currentStepIndex,
  onStepChange,
  onComplete,
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const minSwipeDistance = 50;

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && !isLastStep) {
      // Swipe left = next step
      goToNextStep();
    }
    if (isRightSwipe && !isFirstStep) {
      // Swipe right = previous step
      goToPreviousStep();
    }
  };

  const goToNextStep = () => {
    if (!isAnimating && !isLastStep) {
      setIsAnimating(true);
      setTimeout(() => {
        onStepChange(currentStepIndex + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const goToPreviousStep = () => {
    if (!isAnimating && !isFirstStep) {
      setIsAnimating(true);
      setTimeout(() => {
        onStepChange(currentStepIndex - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const skipStep = () => {
    if (currentStep.optional) {
      goToNextStep();
    }
  };

  return (
    <div className='w-full'>
      {/* Desktop View - Sidebar + Main Content */}
      <div className='hidden lg:flex gap-6 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6'>
        {/* Sidebar - Step List */}
        <div className='w-80 flex-shrink-0'>
          <div className='sticky top-6 bg-white rounded-2xl shadow-lg p-6 space-y-2'>
            <h3 className='text-lg font-bold text-slate-900 mb-4'>Inspeksjonssteg</h3>
            <div className='space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto'>
              {steps.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => onStepChange(idx)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    idx === currentStepIndex
                      ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                      : 'bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className='flex items-start gap-3'>
                    <div
                      className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        idx === currentStepIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='font-semibold text-slate-900 text-sm truncate'>{step.title}</p>
                      <p className='text-xs text-slate-500 mt-1 line-clamp-2'>{step.description}</p>
                      {step.optional && (
                        <span className='inline-block mt-2 px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded'>
                          Valgfritt
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Current Step */}
        <div className='flex-1 flex flex-col'>
          <div className='bg-white rounded-2xl shadow-lg p-8 flex-1'>
            {/* Progress */}
            <div className='mb-6'>
              <div className='flex items-center justify-between mb-3'>
                <h2 className='text-3xl font-bold text-slate-900'>{currentStep.title}</h2>
                <span className='text-sm font-medium text-slate-600 bg-slate-100 px-4 py-2 rounded-full'>
                  {currentStepIndex + 1} / {steps.length}
                </span>
              </div>
              {currentStep.description && (
                <p className='text-slate-600 text-base mb-4'>{currentStep.description}</p>
              )}
              <div className='w-full bg-slate-200 rounded-full h-2'>
                <div
                  className='bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Content */}
            <div className='mb-8 max-h-[calc(100vh-400px)] overflow-y-auto'>
              {currentStep.children}
            </div>

            {/* Navigation Buttons */}
            <div className='flex gap-4 pt-6 border-t border-slate-200'>
              <button
                onClick={goToPreviousStep}
                disabled={isFirstStep}
                className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  isFirstStep
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ChevronLeft className='w-5 h-5' />
                Tilbake
              </button>

              {currentStep.optional && !isLastStep && (
                <button
                  onClick={skipStep}
                  className='flex-1 py-3 px-6 rounded-xl font-medium text-slate-600 bg-amber-50 hover:bg-amber-100 transition-all border border-amber-200'
                >
                  Hopp over
                </button>
              )}

              <button
                onClick={isLastStep ? onComplete : goToNextStep}
                className='flex-1 py-3 px-6 rounded-xl font-medium transition-all bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2'
              >
                {isLastStep ? (
                  <>
                    <Check className='w-5 h-5' />
                    Fullfør
                  </>
                ) : (
                  <>
                    Neste
                    <ChevronRight className='w-5 h-5' />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet View - Full screen swipeable cards */}
      <div className='lg:hidden'>
        <div className='relative h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100'>
          {/* Progress Bar */}
          <div className='px-4 pt-4 pb-3'>
            <div className='flex items-center justify-between mb-3'>
              <h1 className='text-xl font-bold text-slate-900'>Inspeksjon</h1>
              <span className='text-sm font-medium text-slate-600'>
                {currentStepIndex + 1} av {steps.length}
              </span>
            </div>
            <div className='w-full bg-slate-200 rounded-full h-2'>
              <div
                className='bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300'
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Card Container */}
          <div
            ref={containerRef}
            className='flex-1 flex items-center justify-center overflow-hidden px-4 pb-20'
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={`w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 transition-all duration-300 transform ${
                isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
              }`}
            >
              {/* Step Header */}
              <div className='mb-6'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='flex-shrink-0'>
                    <div className='flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold'>
                      {currentStepIndex + 1}
                    </div>
                  </div>
                  <h2 className='text-2xl font-bold text-slate-900'>{currentStep.title}</h2>
                </div>
                {currentStep.description && (
                  <p className='text-slate-600 text-sm ml-13'>{currentStep.description}</p>
                )}
              </div>

              {/* Step Content */}
              <div className='mb-8 max-h-[calc(100vh-320px)] overflow-y-auto'>
                {currentStep.children}
              </div>

              {/* Action Buttons */}
              <div className='flex flex-col gap-3 mt-8'>
                <div className='flex gap-3'>
                  <button
                    onClick={goToPreviousStep}
                    disabled={isFirstStep}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isFirstStep
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <ChevronLeft className='w-5 h-5' />
                    Tilbake
                  </button>

                  <button
                    onClick={isLastStep ? onComplete : goToNextStep}
                    className='flex-1 py-3 px-4 rounded-xl font-medium transition-all bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2'
                  >
                    {isLastStep ? (
                      <>
                        <Check className='w-5 h-5' />
                        Fullfør
                      </>
                    ) : (
                      <>
                        Neste
                        <ChevronRight className='w-5 h-5' />
                      </>
                    )}
                  </button>
                </div>

                {currentStep.optional && !isLastStep && (
                  <button
                    onClick={skipStep}
                    className='w-full py-2 px-4 rounded-xl font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all flex items-center justify-center gap-2'
                  >
                    <SkipForward className='w-4 h-4' />
                    Hopp over (valgfritt)
                  </button>
                )}
              </div>

              {/* Swipe Hint */}
              <div className='mt-6 text-center text-xs text-slate-400'>
                <p>Sveip for å navigere</p>
              </div>
            </div>
          </div>

          {/* Bottom Navigation Dots */}
          <div className='fixed bottom-4 left-0 right-0 flex justify-center gap-2 px-4'>
            {steps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => onStepChange(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'bg-blue-600 w-8'
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeableInspectionCards;
