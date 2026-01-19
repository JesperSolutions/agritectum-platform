import React from 'react';
import { FileText, Calendar, User, MapPin } from 'lucide-react';
import { Report } from '../types';
import { useIntl } from '../../hooks/useIntl';

interface ReportSummaryProps {
  report: Report;
}

const ReportSummary: React.FC<ReportSummaryProps> = ({ report }) => {
  const { formatCurrency } = useIntl();
  const criticalIssues =
    report.issuesFound?.filter(issue => issue.severity === 'critical').length || 0;
  const highPriorityActions =
    report.recommendedActions?.filter(action => action.priority === 'high').length || 0;
  const totalCost =
    report.recommendedActions?.reduce((sum, action) => sum + (action.estimatedCost || 0), 0) || 0;

  return (
    <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
      <div className='flex items-center mb-4'>
        <FileText className='w-5 h-5 text-blue-600 mr-2' />
        <h3 className='text-lg font-semibold text-gray-900'>Report Summary</h3>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-gray-50 p-4 rounded-lg'>
          <div className='text-2xl font-bold text-gray-900'>{report.issuesFound?.length || 0}</div>
          <div className='text-sm text-gray-600'>Total Issues</div>
          {criticalIssues > 0 && (
            <div className='text-xs text-red-600 mt-1'>{criticalIssues} critical</div>
          )}
        </div>

        <div className='bg-gray-50 p-4 rounded-lg'>
          <div className='text-2xl font-bold text-gray-900'>
            {report.recommendedActions?.length || 0}
          </div>
          <div className='text-sm text-gray-600'>Recommended Actions</div>
          {highPriorityActions > 0 && (
            <div className='text-xs text-orange-600 mt-1'>{highPriorityActions} high priority</div>
          )}
        </div>

        <div className='bg-gray-50 p-4 rounded-lg'>
          <div className='text-2xl font-bold text-gray-900'>
            {totalCost > 0 ? formatCurrency(totalCost) : 'N/A'}
          </div>
          <div className='text-sm text-gray-600'>Estimated Cost</div>
        </div>

        <div className='bg-gray-50 p-4 rounded-lg'>
          <div className='text-2xl font-bold text-gray-900'>
            {report.inspectionDuration ? `${report.inspectionDuration} min` : 'N/A'}
          </div>
          <div className='text-sm text-gray-600'>Inspection Duration</div>
        </div>
      </div>

      {report.conditionNotes && (
        <div className='mt-6'>
          <h4 className='text-sm font-medium text-gray-900 mb-2'>Condition Notes</h4>
          <p className='text-sm text-gray-600 bg-gray-50 p-3 rounded-lg'>{report.conditionNotes}</p>
        </div>
      )}
    </div>
  );
};

export default ReportSummary;
