import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import {
  EmailDeliveryStatus,
  getRecentEmailStatus,
  getEmailStats,
  formatDeliveryStatus,
  formatEmailTimestamp,
} from '../../services/emailStatusService';
import SkeletonLoader from '../common/SkeletonLoader';

const EmailStatusDashboard: React.FC = () => {
  const [emails, setEmails] = useState<EmailDeliveryStatus[]>([]);
  const [stats, setStats] = useState<{
    totalSent: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    pendingDeliveries: number;
    successRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEmailData();
  }, []);

  const loadEmailData = async () => {
    try {
      setLoading(true);
      setError('');

      const [emailData, statsData] = await Promise.all([getRecentEmailStatus(20), getEmailStats()]);

      setEmails(emailData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading email data:', err);
      setError('Failed to load email status data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: EmailDeliveryStatus) => {
    const deliveryStatus = formatDeliveryStatus(status);

    switch (deliveryStatus.status) {
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'error':
        return <XCircle className='h-4 w-4 text-red-600' />;
      case 'pending':
      default:
        return <Clock className='h-4 w-4 text-yellow-600' />;
    }
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        {/* Stats Skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='bg-white p-6 rounded-lg shadow-sm border'>
              <SkeletonLoader type='text' lines={2} />
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className='bg-white rounded-lg shadow-sm border'>
          <div className='p-6 border-b'>
            <SkeletonLoader type='text' lines={1} />
          </div>
          <div className='p-6'>
            <SkeletonLoader type='table' rows={5} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <XCircle className='h-5 w-5 text-red-600' />
            <div>
              <h3 className='text-red-800 font-medium'>Error Loading Email Status</h3>
              <p className='text-red-600 text-sm'>{error}</p>
            </div>
          </div>
          <button
            onClick={loadEmailData}
            className='flex items-center space-x-2 px-3 py-2 text-sm text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors'
          >
            <RefreshCw className='h-4 w-4' />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Email Statistics */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {/* Total Sent */}
          <div className='bg-white p-6 rounded-lg shadow-sm border'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Sent</p>
                <p className='text-2xl font-bold text-gray-900'>{stats.totalSent}</p>
              </div>
              <Mail className='h-8 w-8 text-blue-600' />
            </div>
          </div>

          {/* Success Rate */}
          <div className='bg-white p-6 rounded-lg shadow-sm border'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Success Rate</p>
                <p className='text-2xl font-bold text-green-600'>{stats.successRate}%</p>
              </div>
              <TrendingUp className='h-8 w-8 text-green-600' />
            </div>
          </div>

          {/* Successful Deliveries */}
          <div className='bg-white p-6 rounded-lg shadow-sm border'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Delivered</p>
                <p className='text-2xl font-bold text-green-600'>{stats.successfulDeliveries}</p>
              </div>
              <CheckCircle className='h-8 w-8 text-green-600' />
            </div>
          </div>

          {/* Failed Deliveries */}
          <div className='bg-white p-6 rounded-lg shadow-sm border'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Failed</p>
                <p className='text-2xl font-bold text-red-600'>{stats.failedDeliveries}</p>
              </div>
              <XCircle className='h-8 w-8 text-red-600' />
            </div>
          </div>
        </div>
      )}

      {/* Recent Email Status */}
      <div className='bg-white rounded-lg shadow-sm border'>
        <div className='p-6 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>Recent Email Deliveries</h3>
            <button
              onClick={loadEmailData}
              className='flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors'
            >
              <RefreshCw className='h-4 w-4' />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Recipient
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Subject
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Template
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Sent At
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Details
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {emails.length === 0 ? (
                <tr>
                  <td colSpan={6} className='px-6 py-12 text-center text-gray-500'>
                    No emails found
                  </td>
                </tr>
              ) : (
                emails.map(email => {
                  const deliveryStatus = formatDeliveryStatus(email);

                  return (
                    <tr key={email.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center space-x-2'>
                          {getStatusIcon(email)}
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${deliveryStatus.color}`}
                          >
                            {deliveryStatus.message}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {email.to}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-900 max-w-xs truncate'>
                        {email.subject}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {email.template || 'N/A'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {formatEmailTimestamp(email.createdAt)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {email.delivery?.attempts ? `${email.delivery.attempts} attempts` : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmailStatusDashboard;
