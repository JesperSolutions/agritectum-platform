import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { monitorEmailDelivery, getEmailDeliveryStatus } from '../services/triggerEmailService';

interface EmailDeliveryStatusProps {
  reportId: string;
  messageId?: string;
  showDetails?: boolean;
}

interface DeliveryInfo {
  state: string;
  delivery?: {
    state: string;
    startTime?: any;
    endTime?: any;
    error?: string;
    attempts?: number;
    info?: {
      messageId?: string;
      accepted?: string[];
      rejected?: string[];
      pending?: string[];
      response?: string;
    };
  };
  error?: string;
}

export const EmailDeliveryStatus: React.FC<EmailDeliveryStatusProps> = ({
  reportId,
  messageId,
  showDetails = false,
}) => {
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(showDetails);

  const fetchDeliveryStatus = async () => {
    if (!messageId) return;

    setIsLoading(true);
    try {
      const status = await monitorEmailDelivery(messageId);
      setDeliveryInfo(status);
    } catch (error) {
      console.error('Error fetching delivery status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmailLogs = async () => {
    setIsLoading(true);
    try {
      const logs = await getEmailDeliveryStatus(reportId);
      setEmailLogs(logs);
    } catch (error) {
      console.error('Error fetching email logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatus = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchDeliveryStatus(), fetchEmailLogs()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (messageId) {
      fetchDeliveryStatus();
    }
    fetchEmailLogs();
  }, [reportId, messageId]);

  const getStatusIcon = (state: string) => {
    switch (state?.toLowerCase()) {
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'error':
        return <XCircle className='h-4 w-4 text-red-600' />;
      case 'processing':
        return <RefreshCw className='h-4 w-4 text-blue-600 animate-spin' />;
      case 'pending':
        return <Clock className='h-4 w-4 text-yellow-600' />;
      default:
        return <AlertCircle className='h-4 w-4 text-gray-600' />;
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state?.toLowerCase()) {
      case 'success':
        return (
          <Badge variant='default' className='bg-green-100 text-green-800'>
            Delivered
          </Badge>
        );
      case 'error':
        return <Badge variant='destructive'>Failed</Badge>;
      case 'processing':
        return (
          <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
            Processing
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant='outline' className='border-yellow-500 text-yellow-700'>
            Pending
          </Badge>
        );
      default:
        return <Badge variant='outline'>Unknown</Badge>;
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString();
      }
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Mail className='h-5 w-5' />
              Email Delivery Status
            </CardTitle>
            <CardDescription>
              Monitor the delivery status of emails sent for this report
            </CardDescription>
          </div>
          <Button variant='outline' size='sm' onClick={refreshStatus} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Current Delivery Status */}
        {deliveryInfo && messageId && (
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                {getStatusIcon(deliveryInfo.state)}
                <span className='font-medium'>Current Status</span>
              </div>
              {getStatusBadge(deliveryInfo.state)}
            </div>

            {deliveryInfo.delivery && (
              <div className='bg-gray-50 p-3 rounded-lg space-y-2'>
                {deliveryInfo.delivery.info?.messageId && (
                  <div className='text-sm'>
                    <span className='font-medium'>Message ID:</span>{' '}
                    {deliveryInfo.delivery.info.messageId}
                  </div>
                )}

                {deliveryInfo.delivery.attempts && (
                  <div className='text-sm'>
                    <span className='font-medium'>Attempts:</span> {deliveryInfo.delivery.attempts}
                  </div>
                )}

                {deliveryInfo.delivery.startTime && (
                  <div className='text-sm'>
                    <span className='font-medium'>Started:</span>{' '}
                    {formatTimestamp(deliveryInfo.delivery.startTime)}
                  </div>
                )}

                {deliveryInfo.delivery.endTime && (
                  <div className='text-sm'>
                    <span className='font-medium'>Completed:</span>{' '}
                    {formatTimestamp(deliveryInfo.delivery.endTime)}
                  </div>
                )}

                {deliveryInfo.delivery.error && (
                  <Alert className='border-red-200 bg-red-50'>
                    <XCircle className='h-4 w-4 text-red-600' />
                    <AlertDescription className='text-red-800'>
                      {deliveryInfo.delivery.error}
                    </AlertDescription>
                  </Alert>
                )}

                {deliveryInfo.delivery.info && (
                  <div className='space-y-2'>
                    {deliveryInfo.delivery.info.accepted &&
                      deliveryInfo.delivery.info.accepted.length > 0 && (
                        <div className='text-sm'>
                          <span className='font-medium text-green-700'>Accepted:</span>
                          <div className='ml-2 text-green-600'>
                            {deliveryInfo.delivery.info.accepted.map((email, index) => (
                              <div key={index}>• {email}</div>
                            ))}
                          </div>
                        </div>
                      )}

                    {deliveryInfo.delivery.info.rejected &&
                      deliveryInfo.delivery.info.rejected.length > 0 && (
                        <div className='text-sm'>
                          <span className='font-medium text-red-700'>Rejected:</span>
                          <div className='ml-2 text-red-600'>
                            {deliveryInfo.delivery.info.rejected.map((email, index) => (
                              <div key={index}>• {email}</div>
                            ))}
                          </div>
                        </div>
                      )}

                    {deliveryInfo.delivery.info.response && (
                      <div className='text-sm'>
                        <span className='font-medium'>Server Response:</span>
                        <div className='ml-2 font-mono text-xs bg-gray-100 p-2 rounded'>
                          {deliveryInfo.delivery.info.response}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Email Logs */}
        {emailLogs.length > 0 && (
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h4 className='font-medium'>Email History</h4>
              <Button variant='ghost' size='sm' onClick={() => setShowAllDetails(!showAllDetails)}>
                {showAllDetails ? (
                  <>
                    <EyeOff className='h-4 w-4 mr-1' />
                    Hide Details
                  </>
                ) : (
                  <>
                    <Eye className='h-4 w-4 mr-1' />
                    Show Details
                  </>
                )}
              </Button>
            </div>

            <div className='space-y-2'>
              {emailLogs.map((log, index) => (
                <div key={log.id || index} className='border rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center gap-2'>
                      {getStatusIcon(log.status)}
                      <span className='font-medium'>{log.templateId}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      {getStatusBadge(log.status)}
                      <span className='text-sm text-gray-500'>{formatTimestamp(log.sentAt)}</span>
                    </div>
                  </div>

                  <div className='text-sm text-gray-600 space-y-1'>
                    <div>
                      <span className='font-medium'>To:</span> {log.customerEmail}
                    </div>
                    <div>
                      <span className='font-medium'>Customer:</span> {log.customerName}
                    </div>
                    {log.messageId && (
                      <div>
                        <span className='font-medium'>Message ID:</span> {log.messageId}
                      </div>
                    )}
                    {log.errorMessage && (
                      <Alert className='border-red-200 bg-red-50'>
                        <XCircle className='h-4 w-4 text-red-600' />
                        <AlertDescription className='text-red-800'>
                          {log.errorMessage}
                        </AlertDescription>
                      </Alert>
                    )}

                    {showAllDetails && log.deliveryInfo && (
                      <div className='mt-2 p-2 bg-gray-50 rounded text-xs'>
                        <div className='font-medium mb-1'>Delivery Info:</div>
                        <pre className='whitespace-pre-wrap'>
                          {JSON.stringify(log.deliveryInfo, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {emailLogs.length === 0 && !isLoading && (
          <div className='text-center text-gray-500 py-4'>
            No email history found for this report
          </div>
        )}

        {isLoading && (
          <div className='text-center py-4'>
            <RefreshCw className='h-6 w-6 animate-spin mx-auto mb-2' />
            <div className='text-sm text-gray-500'>Loading delivery status...</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
