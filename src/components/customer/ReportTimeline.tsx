import React from 'react';
import { Report } from '../../types';
import { Calendar, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { useIntl } from '../../hooks/useIntl';
import { formatCurrencyAmount, getCurrencyPreference } from '../../utils/currencyUtils';

interface ReportTimelineProps {
  reports: Report[];
  buildingId?: string;
  className?: string;
}

interface TimelineItem {
  report: Report;
  trend: 'improving' | 'declining' | 'stable';
  trendValue: number; // Percentage change
}

const ReportTimeline: React.FC<ReportTimelineProps> = ({ reports, buildingId, className = '' }) => {
  const { t, locale } = useIntl();
  const currency = getCurrencyPreference();

  // Sort reports by date (newest first)
  const sortedReports = [...reports].sort((a, b) => {
    const dateA = new Date(a.inspectionDate || a.createdAt).getTime();
    const dateB = new Date(b.inspectionDate || b.createdAt).getTime();
    return dateB - dateA;
  });

  // Calculate trends by comparing issues count
  const calculateTrends = (): TimelineItem[] => {
    return sortedReports.map((report, index) => {
      if (index === sortedReports.length - 1) {
        // First (oldest) report - no trend
        return { report, trend: 'stable', trendValue: 0 };
      }

      const previousReport = sortedReports[index + 1];
      const currentIssues = report.issuesFound?.length || 0;
      const previousIssues = previousReport.issuesFound?.length || 0;

      if (currentIssues < previousIssues) {
        const change = ((previousIssues - currentIssues) / previousIssues) * 100;
        return { report, trend: 'improving', trendValue: Math.round(change) };
      } else if (currentIssues > previousIssues) {
        const change = ((currentIssues - previousIssues) / previousIssues) * 100;
        return { report, trend: 'declining', trendValue: Math.round(change) };
      }

      return { report, trend: 'stable', trendValue: 0 };
    });
  };

  const timelineItems = calculateTrends();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className='w-4 h-4 text-green-600' />;
      case 'declining':
        return <TrendingDown className='w-4 h-4 text-red-600' />;
      default:
        return <Minus className='w-4 h-4 text-gray-400' />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'border-green-500 bg-green-50';
      case 'declining':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getCriticalIssuesCount = (report: Report): number => {
    return report.issuesFound?.filter(issue => issue.severity === 'critical' || issue.severity === 'high').length || 0;
  };

  if (timelineItems.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className='text-center py-8'>
          <FileText className='w-12 h-12 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-600'>{t('customerDashboard.timeline.noReports') || 'No inspection reports yet'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 ${className}`}>
      <h3 className='text-lg font-semibold text-gray-900 mb-6 flex items-center'>
        <Calendar className='w-5 h-5 mr-2 text-gray-600' />
        {t('customerDashboard.timeline.title') || 'Inspection History'}
      </h3>

      <div className='relative'>
        {/* Timeline line */}
        <div className='absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200'></div>

        <div className='space-y-6'>
          {timelineItems.map((item, index) => {
            const report = item.report;
            const inspectionDate = new Date(report.inspectionDate || report.createdAt);
            const criticalIssues = getCriticalIssuesCount(report);
            const totalIssues = report.issuesFound?.length || 0;

            return (
              <div key={report.id} className='relative flex items-start'>
                {/* Timeline dot */}
                <div className={`absolute left-3 w-3 h-3 rounded-full border-2 ${
                  criticalIssues > 0 ? 'bg-red-500 border-red-600' : 'bg-green-500 border-green-600'
                } z-10`}></div>

                {/* Content card */}
                <div className={`ml-8 flex-1 border-l-4 rounded-lg p-4 ${getTrendColor(item.trend)}`}>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4 text-gray-600' />
                      <span className='font-medium text-gray-900'>
                        {inspectionDate.toLocaleDateString(locale, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      {item.trend !== 'stable' && (
                        <div className='flex items-center gap-1 text-sm'>
                          {getTrendIcon(item.trend)}
                          <span className={item.trend === 'improving' ? 'text-green-700' : 'text-red-700'}>
                            {item.trendValue}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className='flex items-center gap-4 text-sm'>
                      {criticalIssues > 0 && (
                        <div className='flex items-center gap-1 text-red-700'>
                          <AlertCircle className='w-4 h-4' />
                          <span>{criticalIssues} {t('customerDashboard.timeline.critical') || 'Critical'}</span>
                        </div>
                      )}
                      <div className='flex items-center gap-1 text-gray-600'>
                        <FileText className='w-4 h-4' />
                        <span>{totalIssues} {t('customerDashboard.timeline.issues') || 'Issues'}</span>
                      </div>
                    </div>
                  </div>

                  {report.conditionNotes && (
                    <p className='text-sm text-gray-700 mb-2 line-clamp-2'>{report.conditionNotes}</p>
                  )}

                  {report.offerValue && (
                    <div className='mt-2 text-sm'>
                      <span className='text-gray-600'>{t('customerDashboard.timeline.offerValue') || 'Offer Value'}: </span>
                      <span className='font-semibold text-gray-900'>
                        {formatCurrencyAmount(report.offerValue, currency, locale)}
                      </span>
                    </div>
                  )}

                  <div className='mt-3 flex items-center gap-2'>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      report.status === 'sent' || report.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : report.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {report.status === 'sent' || report.status === 'completed' ? (
                        <span className='flex items-center gap-1'>
                          <CheckCircle className='w-3 h-3' />
                          {t('customerDashboard.timeline.completed') || 'Completed'}
                        </span>
                      ) : (
                        t(`report.status.${report.status}`) || report.status
                      )}
                    </span>
                    {report.pdfLink && (
                      <a
                        href={report.pdfLink}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-xs text-blue-600 hover:text-blue-800 underline'
                      >
                        {t('customerDashboard.timeline.viewPDF') || 'View PDF'}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {timelineItems.length > 1 && (
        <div className='mt-6 pt-6 border-t border-gray-200'>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-gray-900'>{timelineItems.length}</p>
              <p className='text-xs text-gray-600'>{t('customerDashboard.timeline.totalInspections') || 'Total Inspections'}</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-green-600'>
                {timelineItems.filter(item => item.trend === 'improving').length}
              </p>
              <p className='text-xs text-gray-600'>{t('customerDashboard.timeline.improving') || 'Improving'}</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-red-600'>
                {timelineItems.filter(item => item.trend === 'declining').length}
              </p>
              <p className='text-xs text-gray-600'>{t('customerDashboard.timeline.declining') || 'Declining'}</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-gray-900'>
                {timelineItems.reduce((sum, item) => sum + (item.report.issuesFound?.length || 0), 0)}
              </p>
              <p className='text-xs text-gray-600'>{t('customerDashboard.timeline.totalIssues') || 'Total Issues'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTimeline;

