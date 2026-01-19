import React from 'react';
import { CheckCircle, Clock, DollarSign } from 'lucide-react';
import { RecommendedAction } from '../types';
import { useIntl } from '../../hooks/useIntl';

interface RecommendedActionsListProps {
  actions: RecommendedAction[];
}

const RecommendedActionsList: React.FC<RecommendedActionsListProps> = ({ actions }) => {
  const { formatCurrency } = useIntl();
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return '⚡';
      case 'short_term':
        return '📅';
      case 'long_term':
        return '📆';
      default:
        return '⏰';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return 'Immediate';
      case 'short_term':
        return 'Short Term';
      case 'long_term':
        return 'Long Term';
      default:
        return urgency;
    }
  };

  const totalCost = actions.reduce((sum, action) => sum + (action.estimatedCost || 0), 0);

  if (actions.length === 0) {
    return (
      <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
        <div className='text-center py-8'>
          <CheckCircle className='w-12 h-12 mx-auto mb-4 text-gray-300' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>No Recommendations</h3>
          <p className='text-gray-600'>
            No specific recommendations were provided for this inspection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center'>
          <CheckCircle className='w-5 h-5 text-blue-600 mr-2' />
          <h3 className='text-lg font-semibold text-gray-900'>
            Recommended Actions ({actions.length})
          </h3>
        </div>

        {totalCost > 0 && (
          <div className='flex items-center text-sm text-gray-600'>
            <DollarSign className='w-4 h-4 mr-1' />
            <span className='font-medium'>Total: {formatCurrency(totalCost)}</span>
          </div>
        )}
      </div>

      <div className='space-y-4'>
        {actions.map((action, index) => (
          <div
            key={action.id}
            className={`p-4 rounded-lg border ${getPriorityColor(action.priority)}`}
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center mb-2'>
                  <span className='text-lg mr-2'>{getUrgencyIcon(action.urgency)}</span>
                  <h4 className='font-medium'>Action #{index + 1}</h4>
                  <div className='ml-3 flex items-center space-x-2'>
                    <span className='px-2 py-1 text-xs font-medium rounded-full bg-white bg-opacity-50'>
                      {action.priority.toUpperCase()}
                    </span>
                    <span className='text-xs text-gray-600'>{getUrgencyText(action.urgency)}</span>
                  </div>
                </div>

                <p className='text-sm mb-2'>{action.description}</p>

                {action.estimatedCost && action.estimatedCost > 0 && (
                  <div className='flex items-center text-xs text-gray-600'>
                    <DollarSign className='w-3 h-3 mr-1' />
                    <span>Estimated cost: {formatCurrency(action.estimatedCost)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedActionsList;
