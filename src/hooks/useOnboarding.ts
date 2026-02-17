import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { logger } from '../utils/logger';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  highlightSelector?: string;
  actionUrl?: string;
  actionLabel?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  skipAllowed?: boolean;
}

export interface OnboardingState {
  userId: string;
  isNewUser: boolean;
  completedSteps: string[];
  currentStepIndex: number;
  skipped: boolean;
  completedAt?: Date;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Agritectum Portal',
    description: 'Manage your buildings, service agreements, and inspection reports in one place.',
    position: 'bottom',
    skipAllowed: false,
  },
  {
    id: 'buildings',
    title: 'Your Buildings',
    description: 'Add and manage all your properties here. Click "Add Building" to get started.',
    highlightSelector: '[data-tour="buildings-section"]',
    actionUrl: '/portal/buildings',
    actionLabel: 'View Buildings',
    position: 'right',
    skipAllowed: true,
  },
  {
    id: 'agreements',
    title: 'Service Agreements',
    description: 'Browse service agreements and keep track of maintenance schedules.',
    highlightSelector: '[data-tour="agreements-section"]',
    actionUrl: '/portal/service-agreements',
    actionLabel: 'View Agreements',
    position: 'right',
    skipAllowed: true,
  },
  {
    id: 'visits',
    title: 'Scheduled Visits',
    description: 'See upcoming inspections and maintenance visits at a glance.',
    highlightSelector: '[data-tour="visits-section"]',
    actionUrl: '/portal/scheduled-visits',
    actionLabel: 'View Visits',
    position: 'right',
    skipAllowed: true,
  },
  {
    id: 'dashboard',
    title: 'Customize Your Dashboard',
    description: 'Click the sliders icon to customize which widgets you want to see.',
    highlightSelector: '[data-tour="customize-button"]',
    position: 'left',
    skipAllowed: true,
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You can access this tour anytime from your profile settings.',
    position: 'bottom',
    skipAllowed: false,
  },
];

export const useOnboarding = () => {
  const { currentUser } = useAuth();
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);

  // Initialize onboarding state
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    if (currentUser.role !== 'customer') {
      setShowTour(false);
      setLoading(false);
      return;
    }

    const loadOnboardingState = async () => {
      try {
        const onboardingRef = doc(db, 'users', currentUser.uid, 'preferences', 'onboarding');
        const snapshot = await getDoc(onboardingRef);

        if (snapshot.exists()) {
          const data = snapshot.data() as OnboardingState;
          setOnboardingState(data);
          // Show tour if not completed and not skipped
          if (!data.skipped && data.completedSteps.length < ONBOARDING_STEPS.length) {
            setShowTour(true);
          }
        } else {
          // New user - initialize onboarding
          const newState: OnboardingState = {
            userId: currentUser.uid,
            isNewUser: true,
            completedSteps: [],
            currentStepIndex: 0,
            skipped: false,
          };
          await setDoc(onboardingRef, newState);
          setOnboardingState(newState);
          setShowTour(true);
        }
      } catch (error) {
        logger.error('Error loading onboarding state:', error);
        // Silently fail - show tour anyway
        setShowTour(true);
      } finally {
        setLoading(false);
      }
    };

    loadOnboardingState();
  }, [currentUser]);

  const updateOnboardingState = useCallback(
    async (updates: Partial<OnboardingState>) => {
      if (!currentUser || !onboardingState) return;

      try {
        const onboardingRef = doc(db, 'users', currentUser.uid, 'preferences', 'onboarding');
        const newState = { ...onboardingState, ...updates };
        await updateDoc(onboardingRef, newState);
        setOnboardingState(newState);
      } catch (error) {
        logger.error('Error updating onboarding state:', error);
      }
    },
    [currentUser, onboardingState]
  );

  const completeStep = useCallback(
    async (stepId: string) => {
      if (!onboardingState) return;

      const newCompleted = [...new Set([...onboardingState.completedSteps, stepId])];
      const allCompleted = newCompleted.length === ONBOARDING_STEPS.length;

      await updateOnboardingState({
        completedSteps: newCompleted,
        currentStepIndex: Math.min(
          onboardingState.currentStepIndex + 1,
          ONBOARDING_STEPS.length - 1
        ),
        ...(allCompleted && { completedAt: new Date() }),
      });
    },
    [onboardingState, updateOnboardingState]
  );

  const nextStep = useCallback(async () => {
    if (!onboardingState) return;

    const nextIndex = Math.min(onboardingState.currentStepIndex + 1, ONBOARDING_STEPS.length - 1);
    await updateOnboardingState({
      currentStepIndex: nextIndex,
      completedSteps: [...new Set([...onboardingState.completedSteps, ONBOARDING_STEPS[onboardingState.currentStepIndex].id])],
    });
  }, [onboardingState, updateOnboardingState]);

  const prevStep = useCallback(async () => {
    if (!onboardingState) return;

    const prevIndex = Math.max(onboardingState.currentStepIndex - 1, 0);
    await updateOnboardingState({
      currentStepIndex: prevIndex,
    });
  }, [onboardingState, updateOnboardingState]);

  const skipTour = useCallback(async () => {
    await updateOnboardingState({
      skipped: true,
    });
    setShowTour(false);
  }, [updateOnboardingState]);

  const restartTour = useCallback(async () => {
    await updateOnboardingState({
      currentStepIndex: 0,
      completedSteps: [],
      skipped: false,
    });
    setShowTour(true);
  }, [updateOnboardingState]);

  const getCurrentStep = () => {
    if (!onboardingState) return null;
    return ONBOARDING_STEPS[onboardingState.currentStepIndex];
  };

  const getProgressPercent = () => {
    if (!onboardingState) return 0;
    return (onboardingState.completedSteps.length / ONBOARDING_STEPS.length) * 100;
  };

  return {
    onboardingState,
    loading,
    showTour,
    setShowTour,
    steps: ONBOARDING_STEPS,
    currentStep: getCurrentStep(),
    isOnLastStep: onboardingState ? onboardingState.currentStepIndex === ONBOARDING_STEPS.length - 1 : false,
    progressPercent: getProgressPercent(),
    completeStep,
    nextStep,
    prevStep,
    skipTour,
    restartTour,
  };
};
