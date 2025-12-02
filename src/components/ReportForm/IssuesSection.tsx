import React from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Issue, IssueType, IssueSeverity } from '../types';
import AccessibleButton from '../AccessibleButton';

interface IssuesSectionProps {
  issues: Issue[];
  onAddIssue: () => void;
  onUpdateIssue: (index: number, issue: Partial<Issue>) => void;
  onRemoveIssue: (index: number) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

const issueTypeOptions: { value: IssueType; label: string }[] = [
  { value: 'leak', label: 'Leak' },
  { value: 'damage', label: 'Damage' },
  { value: 'wear', label: 'Wear' },
  { value: 'structural', label: 'Structural' },
  { value: 'ventilation', label: 'Ventilation' },
  { value: 'gutters', label: 'Gutters' },
  { value: 'flashing', label: 'Flashing' },
  { value: 'other', label: 'Other' },
];

const severityOptions: { value: IssueSeverity; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'critical', label: 'Critical', color: 'text-red-600' },
];

const IssuesSection: React.FC<IssuesSectionProps> = ({
  issues,
  onAddIssue,
  onUpdateIssue,
  onRemoveIssue,
  errors,
  touched,
}) => {
  return (
    <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center'>
          <AlertTriangle className='w-5 h-5 text-blue-600 mr-2' />
          <h3 className='text-lg font-semibold text-gray-900'>Issues Found</h3>
        </div>
        <AccessibleButton
          variant='secondary'
          size='sm'
          onClick={onAddIssue}
          leftIcon={<Plus className='w-4 h-4' />}
          aria-label='Add new issue'
        >
          Add Issue
        </AccessibleButton>
      </div>

      {issues.length === 0 ? (
        <div className='text-center py-8 text-gray-500'>
          <AlertTriangle className='w-12 h-12 mx-auto mb-4 text-gray-300' />
          <p>
            No issues documented yet. Click "Add Issue" to start documenting problems found during
            the inspection.
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {issues.map((issue, index) => (
            <div key={issue.id} className='border border-gray-200 rounded-lg p-4'>
              <div className='flex items-start justify-between mb-3'>
                <h4 className='font-medium text-gray-900'>Issue #{index + 1}</h4>
                <AccessibleButton
                  variant='ghost'
                  size='sm'
                  onClick={() => onRemoveIssue(index)}
                  leftIcon={<Trash2 className='w-4 h-4' />}
                  aria-label={`Remove issue ${index + 1}`}
                  className='text-red-600 hover:text-red-700'
                >
                  Remove
                </AccessibleButton>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Issue Type <span className='text-red-500'>*</span>
                  </label>
                  <select
                    value={issue.type}
                    onChange={e => onUpdateIssue(index, { type: e.target.value as IssueType })}
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                  >
                    <option value=''>Select issue type</option>
                    {issueTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Severity <span className='text-red-500'>*</span>
                  </label>
                  <select
                    value={issue.severity}
                    onChange={e =>
                      onUpdateIssue(index, { severity: e.target.value as IssueSeverity })
                    }
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                  >
                    <option value=''>Select severity</option>
                    {severityOptions.map(option => (
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
                    value={issue.description}
                    onChange={e => onUpdateIssue(index, { description: e.target.value })}
                    rows={3}
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                    placeholder='Describe the issue in detail...'
                  />
                </div>

                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Location <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={issue.location}
                    onChange={e => onUpdateIssue(index, { location: e.target.value })}
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                    placeholder='e.g., North side, near chimney, etc.'
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {errors.issuesFound && touched.issuesFound && (
        <p className='text-sm text-red-600 mt-2'>{errors.issuesFound}</p>
      )}
    </div>
  );
};

export default IssuesSection;
