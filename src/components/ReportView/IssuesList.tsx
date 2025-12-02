import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Issue } from '../types';

interface IssuesListProps {
  issues: Issue[];
}

const IssuesList: React.FC<IssuesListProps> = ({ issues }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  if (issues.length === 0) {
    return (
      <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
        <div className='text-center py-8'>
          <AlertTriangle className='w-12 h-12 mx-auto mb-4 text-gray-300' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>No Issues Found</h3>
          <p className='text-gray-600'>No issues were identified during this inspection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
      <div className='flex items-center mb-4'>
        <AlertTriangle className='w-5 h-5 text-blue-600 mr-2' />
        <h3 className='text-lg font-semibold text-gray-900'>Issues Found ({issues.length})</h3>
      </div>

      <div className='space-y-4'>
        {issues.map((issue, index) => (
          <div
            key={issue.id}
            className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center mb-2'>
                  <span className='text-lg mr-2'>{getSeverityIcon(issue.severity)}</span>
                  <h4 className='font-medium capitalize'>{issue.type}</h4>
                  <span className='ml-2 px-2 py-1 text-xs font-medium rounded-full bg-white bg-opacity-50'>
                    {issue.severity.toUpperCase()}
                  </span>
                </div>

                <p className='text-sm mb-2'>{issue.description}</p>

                <div className='text-xs text-gray-600'>
                  <strong>Location:</strong> {issue.location}
                </div>

                {issue.images && issue.images.length > 0 && (
                  <div className='mt-3'>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                      {issue.images.map((imageUrl, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={imageUrl}
                          alt={`Issue ${index + 1} image ${imgIndex + 1}`}
                          className='w-full h-20 object-cover rounded border'
                        />
                      ))}
                    </div>
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

export default IssuesList;
