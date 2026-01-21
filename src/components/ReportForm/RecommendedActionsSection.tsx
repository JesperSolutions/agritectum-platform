import React from 'react';
import { CheckCircle, Plus, Trash2 } from 'lucide-react';
import { RecommendedAction, ActionPriority, ActionUrgency } from '../types';
import AccessibleButton from '../AccessibleButton';

interface RecommendedActionsSectionProps {
  actions: RecommendedAction[];
  onAddAction: () => void;
  onUpdateAction: (index: number, action: Partial<RecommendedAction>) => void;
  onRemoveAction: (index: number) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

const priorityOptions: { value: ActionPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-red-600' },
];

const urgencyOptions: { value: ActionUrgency; label: string; color: string }[] = [
  { value: 'immediate', label: 'Immediate', color: 'text-red-600' },
  { value: 'short_term', label: 'Short Term', color: 'text-orange-600' },
  { value: 'long_term', label: 'Long Term', color: 'text-blue-600' },
];

const RecommendedActionsSection: React.FC<RecommendedActionsSectionProps> = ({
  actions,
  onAddAction,
  onUpdateAction,
  onRemoveAction,
  errors,
  touched,
}) => {
  return (
    <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center'>
          <CheckCircle className='w-5 h-5 text-blue-600 mr-2' />
          <h3 className='text-lg font-semibold text-gray-900'>Recommended Actions</h3>
        </div>
        <AccessibleButton
          variant='secondary'
          size='sm'
          onClick={onAddAction}
          leftIcon={<Plus className='w-4 h-4' />}
          aria-label='Add new recommended action'
        >
          Add Action
        </AccessibleButton>
      </div>

      {actions.length === 0 ? (
        <div className='text-center py-8 text-gray-500'>
          <CheckCircle className='w-12 h-12 mx-auto mb-4 text-gray-300' />
          <p>
            No recommended actions yet. Click "Add Action" to start documenting repair
            recommendations.
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {actions.map((action, index) => (
            <div key={action.id} className='border border-gray-200 rounded-lg p-4'>
              <div className='flex items-start justify-between mb-3'>
                <h4 className='font-medium text-gray-900'>Action #{index + 1}</h4>
                <AccessibleButton
                  variant='ghost'
                  size='sm'
                  onClick={() => onRemoveAction(index)}
                  leftIcon={<Trash2 className='w-4 h-4' />}
                  aria-label={`Remove action ${index + 1}`}
                  className='text-red-600 hover:text-red-700'
                >
                  Remove
                </AccessibleButton>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Priority <span className='text-red-500'>*</span>
                  </label>
                  <select
                    value={action.priority}
                    onChange={e =>
                      onUpdateAction(index, { priority: e.target.value as ActionPriority })
                    }
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                  >
                    <option value=''>Select priority</option>
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Urgency <span className='text-red-500'>*</span>
                  </label>
                  <select
                    value={action.urgency}
                    onChange={e =>
                      onUpdateAction(index, { urgency: e.target.value as ActionUrgency })
                    }
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                  >
                    <option value=''>Select urgency</option>
                    {urgencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Description <span className='text-red-500'>*</span>
                  </label>
                  <textarea
                    value={action.description}
                    onChange={e => onUpdateAction(index, { description: e.target.value })}
                    rows={3}
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                    placeholder='Describe the recommended action in detail...'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Estimated Cost (SEK)
                  </label>
                  <select
                    value={action.estimatedCost || ''}
                    onChange={e =>
                      onUpdateAction(index, {
                        estimatedCost: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                  >
                    <option value=''>Välj intervall</option>
                    <option value='250'>0-500 SEK</option>
                    <option value='750'>500-1000 SEK</option>
                    <option value='1250'>1000-1500 SEK</option>
                    <option value='1750'>1500-2000 SEK</option>
                    <option value='2250'>2000-2500 SEK</option>
                    <option value='2750'>2500-3000 SEK</option>
                    <option value='3250'>3000-3500 SEK</option>
                    <option value='3750'>3500-4000 SEK</option>
                    <option value='4250'>4000-4500 SEK</option>
                    <option value='4750'>4500-5000 SEK</option>
                    <option value='5500'>5000+ SEK</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {errors.recommendedActions && touched.recommendedActions && (
        <p className='text-sm text-red-600 mt-2'>{errors.recommendedActions}</p>
      )}
    </div>
  );
};

export default RecommendedActionsSection;
