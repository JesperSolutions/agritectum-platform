import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../contexts/ReportContextSimple';
import {
  Plus,
  FileText,
  DollarSign,
  Users,
  Calendar,
  Share2,
  Download,
  Edit,
  X,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { useIntl } from '../../hooks/useIntl';
import { logger } from '../../utils/logger';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
  disabled?: boolean;
  requiresAuth?: boolean;
}

interface QuickActionsProps {
  context?: 'report' | 'customer' | 'offer' | 'dashboard' | 'reports' | 'offers';
  reportId?: string;
  customerId?: string;
  className?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  context = 'dashboard',
  reportId,
  customerId,
  className = '',
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useIntl();

  const [isOpen, setIsOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Determine if FAB should be visible based on scroll position and context
  useEffect(() => {
    try {
      const stored = localStorage.getItem('agritectum:quickActions:hidden');
      if (stored === 'true') {
        setIsDismissed(true);
      }
    } catch (error) {
      logger.warn('Unable to read quick action preferences', error);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const threshold = window.innerWidth < 768 ? 20 : 80;

      const shouldShowBackToTop = scrollY > 200;
      setShowBackToTop(shouldShowBackToTop);

      if (documentHeight <= windowHeight + 100 && scrollY <= threshold) {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('agritectum:quickActions:hidden', 'true');
    } catch (error) {
      logger.warn('Unable to persist quick action preference', error);
    }
  };

  const handleRestore = () => {
    setIsDismissed(false);
    try {
      localStorage.removeItem('agritectum:quickActions:hidden');
    } catch (error) {
      logger.warn('Unable to clear quick action preference', error);
    }
  };

  // Generate contextual quick actions
  const generateActions = (): QuickAction[] => {
    const actions: QuickAction[] = [];

    switch (context) {
      case 'dashboard':
        actions.push(
          {
            id: 'new-report',
            label: t('quickActions.newReport'),
            icon: <FileText className='w-5 h-5' />,
            onClick: () => navigate('/report/new'),
            color: 'primary',
            requiresAuth: true,
          },
          {
            id: 'new-customer',
            label: t('quickActions.newCustomer'),
            icon: <Users className='w-5 h-5' />,
            onClick: () => navigate('/admin/customers'),
            color: 'secondary',
            requiresAuth: true,
          },
          {
            id: 'view-reports',
            label: t('quickActions.viewReports'),
            icon: <FileText className='w-5 h-5' />,
            onClick: () => navigate('/reports'),
            color: 'secondary',
          }
        );
        break;

      case 'reports':
        actions.push(
          {
            id: 'new-report',
            label: t('quickActions.newReport'),
            icon: <FileText className='w-5 h-5' />,
            onClick: () => navigate('/report/new'),
            color: 'primary',
            requiresAuth: true,
          },
          {
            id: 'export-reports',
            label: t('quickActions.exportReports'),
            icon: <Download className='w-5 h-5' />,
            onClick: () => {
              // Implement bulk export functionality
              logger.log('Export reports functionality');
            },
            color: 'secondary',
            requiresAuth: true,
          }
        );
        break;

      case 'report':
        if (reportId) {
          actions.push(
            {
              id: 'edit-report',
              label: t('quickActions.editReport'),
              icon: <Edit className='w-5 h-5' />,
              onClick: () => navigate(`/report/edit/${reportId}`),
              color: 'primary',
              requiresAuth: true,
            },
            {
              id: 'create-offer',
              label: t('quickActions.createOffer'),
              icon: <DollarSign className='w-5 h-5' />,
              onClick: () => {
                // Navigate to offer creation with report context
                navigate(`/offers/new?reportId=${reportId}`);
              },
              color: 'success',
              requiresAuth: true,
            },
            {
              id: 'share-report',
              label: t('quickActions.shareReport'),
              icon: <Share2 className='w-5 h-5' />,
              onClick: () => {
                // Implement share functionality
                logger.log('Share report functionality');
              },
              color: 'secondary',
            },
            {
              id: 'download-pdf',
              label: t('quickActions.downloadPDF'),
              icon: <Download className='w-5 h-5' />,
              onClick: () => {
                // Implement PDF download
                logger.log('Download PDF functionality');
              },
              color: 'secondary',
            }
          );
        }
        break;

      case 'offers':
        actions.push(
          {
            id: 'new-offer',
            label: t('quickActions.newOffer'),
            icon: <DollarSign className='w-5 h-5' />,
            onClick: () => navigate('/offers/new'),
            color: 'primary',
            requiresAuth: true,
          },
          {
            id: 'view-reports',
            label: t('quickActions.viewReports'),
            icon: <FileText className='w-5 h-5' />,
            onClick: () => navigate('/reports'),
            color: 'secondary',
          }
        );
        break;

      case 'customer':
        if (customerId) {
          actions.push(
            {
              id: 'new-report',
              label: t('quickActions.newReport'),
              icon: <FileText className='w-5 h-5' />,
              onClick: () => navigate(`/report/new?customerId=${customerId}`),
              color: 'primary',
              requiresAuth: true,
            },
            {
              id: 'create-offer',
              label: t('quickActions.createOffer'),
              icon: <DollarSign className='w-5 h-5' />,
              onClick: () => navigate(`/offers/new?customerId=${customerId}`),
              color: 'success',
              requiresAuth: true,
            },
            {
              id: 'schedule-appointment',
              label: t('quickActions.scheduleAppointment'),
              icon: <Calendar className='w-5 h-5' />,
              onClick: () => navigate(`/schedule/new?customerId=${customerId}`),
              color: 'secondary',
              requiresAuth: true,
            }
          );
        }
        break;

      default:
        break;
    }

    // Filter actions based on authentication requirements
    return actions.filter(action => !action.requiresAuth || currentUser);
  };

  const actions = generateActions();

  // Don't show FAB if no actions available or user not authenticated
  if (actions.length === 0) {
    return null;
  }

  if (isDismissed) {
    return (
      <div className={`fixed bottom-6 right-6 z-30 ${className}`}>
        <button
          onClick={handleRestore}
          className='flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-200 text-slate-700 shadow-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500'
          aria-label={t('quickActions.restore')}
        >
          <Eye className='w-4 h-4' />
          <span className='text-sm font-medium'>{t('quickActions.restore')}</span>
        </button>
      </div>
    );
  }

  const getActionColor = (color: string = 'primary') => {
    switch (color) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {!isOpen && (
        <button
          onClick={handleDismiss}
          className='absolute -top-3 right-16 px-2 py-1 text-xs font-medium bg-white/80 text-slate-600 rounded-full shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300'
          aria-label={t('quickActions.hide')}
          title={t('quickActions.hide')}
        >
          <X className='w-4 h-4' />
        </button>
      )}

      {/* Action Menu */}
      {isOpen && (
        <div className='absolute bottom-16 right-0 mb-2 space-y-2'>
          {actions.map((action, index) => (
            <div
              key={action.id}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-200 transform ${
                isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
              } ${getActionColor(action.color)}`}
              style={{
                transitionDelay: `${index * 50}ms`,
              }}
            >
              <button
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                disabled={action.disabled}
                className='flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded-md'
              >
                {action.icon}
                <span className='font-medium'>{action.label}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform ${
          isOpen
            ? 'bg-red-600 hover:bg-red-700 rotate-45'
            : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
        } text-white flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-300`}
        aria-label={isOpen ? t('quickActions.closeMenu') : t('quickActions.openMenu')}
      >
        {isOpen ? <X className='w-6 h-6' /> : <Plus className='w-6 h-6' />}
      </button>

      {/* Back to Top Button (when scrolled down) */}
      {showBackToTop && !isOpen && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className='absolute bottom-20 right-0 w-10 h-10 rounded-full bg-gray-600 hover:bg-gray-700 text-white shadow-lg transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-300'
          aria-label={t('quickActions.backToTop')}
        >
          <ChevronUp className='w-5 h-5' />
        </button>
      )}
    </div>
  );
};

export default QuickActions;
