import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useIntl } from '../../hooks/useIntl';

/**
 * Floating Action Button (FAB) for quick access to primary actions
 * Follows Material Design principles
 */
const FloatingActionButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useIntl();

  // Don't show FAB on mobile when on scheduled visits page (avoid duplication)
  const isOnScheduledVisitsPage = location.pathname.includes('/scheduled-visits');

  const handleScheduleVisit = () => {
    navigate('/portal/scheduled-visits');
    // Trigger the "Add Visit" form if possible via URL state
    setTimeout(() => {
      const addButton = document.querySelector('[data-action="schedule-visit"]') as HTMLButtonElement;
      if (addButton) {
        addButton.click();
      }
    }, 300);
  };

  if (isOnScheduledVisitsPage) {
    return null;
  }

  return (
    <>
      {/* Desktop FAB */}
      <button
        onClick={handleScheduleVisit}
        className="hidden lg:flex fixed bottom-6 right-6 w-14 h-14 bg-slate-700 hover:bg-slate-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 items-center justify-center group z-40"
        aria-label={t('navigation.scheduledVisits') || 'Schedule Visit'}
        title={t('navigation.scheduledVisits') || 'Schedule Visit'}
      >
        <Calendar className="w-6 h-6" aria-hidden="true" />
        
        {/* Tooltip */}
        <span className="absolute right-full mr-3 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {t('navigation.scheduledVisits') || 'Schedule Visit'}
        </span>
      </button>

      {/* Mobile FAB - slightly smaller, different position */}
      <button
        onClick={handleScheduleVisit}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-slate-700 hover:bg-slate-800 text-white rounded-full shadow-lg active:shadow-2xl transition-all duration-200 flex items-center justify-center z-40"
        aria-label={t('navigation.scheduledVisits') || 'Schedule Visit'}
      >
        <Calendar className="w-6 h-6" aria-hidden="true" />
      </button>
    </>
  );
};

export default FloatingActionButton;
