import React from 'react';
import { Calendar, User, MapPin, Phone, Mail, Edit, Download, Share, Archive } from 'lucide-react';
import { Report } from '../types';
import AccessibleButton from '../AccessibleButton';
import AgritectumLogo from '../AgritectumLogo';

interface ReportHeaderProps {
  report: Report;
  branchInfo: { name: string; logoUrl?: string } | null;
  canEdit: boolean;
  onEdit: () => void;
  onDownload: () => void;
  onShare: () => void;
  onArchive: () => void;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({
  report,
  branchInfo,
  canEdit,
  onEdit,
  onDownload,
  onShare,
  onArchive,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div className='flex items-center space-x-4'>
          {/* Branch Logo */}
          <div className='flex-shrink-0'>
            {branchInfo?.logoUrl ? (
              <img
                src={branchInfo.logoUrl}
                alt={`${branchInfo.name} logo`}
                className='w-12 h-12 rounded-lg object-cover'
                onError={e => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-logo');
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }}
              />
            ) : null}
            {(!branchInfo?.logoUrl || branchInfo.logoUrl === '') && (
              <div className='fallback-logo flex items-center justify-center w-12 h-12'>
                <AgritectumLogo size='sm' showText={false} />
              </div>
            )}
          </div>

          <div>
            <h1 className='text-2xl font-bold text-gray-900'>{report.customerName}</h1>
            <div className='flex items-center space-x-4 mt-1 text-sm text-gray-600'>
              <span className='flex items-center'>
                <Calendar className='w-4 h-4 mr-1' />
                {new Date(report.inspectionDate).toLocaleDateString('sv-SE')}
              </span>
              <span className='flex items-center'>
                <User className='w-4 h-4 mr-1' />
                {report.createdByName}
              </span>
            </div>
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}
          >
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </span>

          {canEdit && (
            <AccessibleButton
              variant='secondary'
              size='sm'
              onClick={onEdit}
              leftIcon={<Edit className='w-4 h-4' />}
              aria-label='Edit report'
            >
              Edit
            </AccessibleButton>
          )}

          <AccessibleButton
            variant='secondary'
            size='sm'
            onClick={onDownload}
            leftIcon={<Download className='w-4 h-4' />}
            aria-label='Download report'
          >
            Download
          </AccessibleButton>

          <AccessibleButton
            variant='secondary'
            size='sm'
            onClick={onShare}
            leftIcon={<Share className='w-4 h-4' />}
            aria-label='Share report'
          >
            Share
          </AccessibleButton>

          {canEdit && (
            <AccessibleButton
              variant='ghost'
              size='sm'
              onClick={onArchive}
              leftIcon={<Archive className='w-4 h-4' />}
              aria-label='Archive report'
            >
              Archive
            </AccessibleButton>
          )}
        </div>
      </div>

      {/* Customer Information */}
      <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <div className='flex items-center text-sm text-gray-600'>
            <MapPin className='w-4 h-4 mr-2' />
            {report.customerAddress}
          </div>
          {report.customerPhone && (
            <div className='flex items-center text-sm text-gray-600'>
              <Phone className='w-4 h-4 mr-2' />
              {report.customerPhone}
            </div>
          )}
          {report.customerEmail && (
            <div className='flex items-center text-sm text-gray-600'>
              <Mail className='w-4 h-4 mr-2' />
              {report.customerEmail}
            </div>
          )}
        </div>

        <div className='space-y-2 text-sm text-gray-600'>
          <div>
            <strong>Roof Type:</strong> {report.roofType}
          </div>
          {report.roofAge && (
            <div>
              <strong>Roof Age:</strong> {report.roofAge} years
            </div>
          )}
          {report.inspectionDuration && (
            <div>
              <strong>Duration:</strong> {report.inspectionDuration} minutes
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportHeader;
