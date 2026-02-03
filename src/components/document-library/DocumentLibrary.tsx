import React, { useState, useMemo } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { Building, FileText, Calendar, Trash2, Download, Eye } from 'lucide-react';
import { useIntl } from '../../hooks/useIntl';
import { formatDate } from '../../utils/dateUtils';
import EmptyState from '../empty-states/EmptyState';

export interface Document {
  id: string;
  name: string;
  type: 'agreement' | 'report' | 'invoice' | 'certificate' | 'permit' | 'other';
  buildingId: string;
  buildingName: string;
  uploadedAt: Date;
  uploadedBy: string;
  size: number;
  fileUrl: string;
  category?: string;
}

interface DocumentLibraryProps {
  documents?: Document[];
  loading?: boolean;
  onDelete?: (documentId: string) => Promise<void>;
}

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  documents = [],
  loading = false,
  onDelete,
}) => {
  const { t } = useIntl();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [selectedBuilding, setSelectedBuilding] = useState<string | 'all'>('all');
  const [selectedType, setSelectedType] = useState<Document['type'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesBuilding = selectedBuilding === 'all' || doc.buildingId === selectedBuilding;
      const matchesType = selectedType === 'all' || doc.type === selectedType;
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesBuilding && matchesType && matchesSearch;
    });
  }, [documents, selectedBuilding, selectedType, searchQuery]);

  const uniqueBuildings = useMemo(() => {
    return [...new Set(documents.map(d => d.buildingId))];
  }, [documents]);

  const buildingNames = useMemo(() => {
    const map: Record<string, string> = {};
    documents.forEach(doc => {
      map[doc.buildingId] = doc.buildingName;
    });
    return map;
  }, [documents]);

  const handleDelete = async (documentId: string) => {
    if (!onDelete) return;
    
    setDeletingId(documentId);
    try {
      await onDelete(documentId);
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'agreement':
        return <FileText className='w-5 h-5 text-blue-600' />;
      case 'report':
        return <FileText className='w-5 h-5 text-purple-600' />;
      case 'invoice':
        return <FileText className='w-5 h-5 text-green-600' />;
      case 'certificate':
        return <FileText className='w-5 h-5 text-amber-600' />;
      case 'permit':
        return <FileText className='w-5 h-5 text-red-600' />;
      default:
        return <FileText className='w-5 h-5 text-gray-600' />;
    }
  };

  if (documents.length === 0 && !loading) {
    return <EmptyState type='documents' />;
  }

  if (isMobile) {
    return (
      <div className='space-y-4'>
        {/* Mobile Filters */}
        <div className='sticky top-0 bg-white z-10 space-y-3 pb-4'>
          <input
            type='text'
            placeholder='Search documents...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500'
          />

          {uniqueBuildings.length > 1 && (
            <select
              value={selectedBuilding}
              onChange={e => setSelectedBuilding(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>All Buildings</option>
              {uniqueBuildings.map(bId => (
                <option key={bId} value={bId}>
                  {buildingNames[bId]}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value as any)}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500'
          >
            <option value='all'>All Types</option>
            <option value='agreement'>Service Agreements</option>
            <option value='report'>Reports</option>
            <option value='invoice'>Invoices</option>
            <option value='certificate'>Certificates</option>
            <option value='permit'>Permits</option>
            <option value='other'>Other</option>
          </select>
        </div>

        {/* Mobile Card List */}
        <div className='space-y-3'>
          {filteredDocuments.map(doc => (
            <div
              key={doc.id}
              className='bg-white rounded-lg border border-gray-200 p-4 space-y-3'
            >
              <div className='flex items-start gap-3'>
                {getDocumentIcon(doc.type)}
                <div className='flex-1 min-w-0'>
                  <p className='font-medium text-gray-900 truncate'>{doc.name}</p>
                  <p className='text-xs text-gray-500'>{buildingNames[doc.buildingId]}</p>
                  <div className='flex gap-2 text-xs text-gray-500 mt-1'>
                    <span>{doc.type}</span>
                    <span>•</span>
                    <span>{formatFileSize(doc.size)}</span>
                  </div>
                </div>
              </div>

              <div className='text-xs text-gray-500'>
                Uploaded {formatDate(new Date(doc.uploadedAt))}
              </div>

              <div className='flex gap-2'>
                <a
                  href={doc.fileUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors'
                >
                  <Download className='w-4 h-4' />
                  Download
                </a>
                {onDelete && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className='px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <div className='text-center py-8'>
            <p className='text-gray-600'>No documents found</p>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className='space-y-6'>
      {/* Desktop Filters */}
      <div className='sticky top-0 bg-white z-10 pb-4 space-y-4'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center'>
          <div className='flex-1'>
            <input
              type='text'
              placeholder='Search documents...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
            />
          </div>

          {uniqueBuildings.length > 1 && (
            <select
              value={selectedBuilding}
              onChange={e => setSelectedBuilding(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-48'
            >
              <option value='all'>All Buildings</option>
              {uniqueBuildings.map(bId => (
                <option key={bId} value={bId}>
                  {buildingNames[bId]}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value as any)}
            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-48'
          >
            <option value='all'>All Types</option>
            <option value='agreement'>Service Agreements</option>
            <option value='report'>Reports</option>
            <option value='invoice'>Invoices</option>
            <option value='certificate'>Certificates</option>
            <option value='permit'>Permits</option>
            <option value='other'>Other</option>
          </select>
        </div>

        {filteredDocuments.length > 0 && (
          <p className='text-sm text-gray-600'>
            Showing {filteredDocuments.length} of {documents.length} documents
          </p>
        )}
      </div>

      {/* Desktop Table */}
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='border-b border-gray-200 bg-gray-50'>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                Document
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                Building
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                Type
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                Size
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                Uploaded
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200'>
            {filteredDocuments.map(doc => (
              <tr key={doc.id} className='hover:bg-gray-50 transition-colors'>
                <td className='px-6 py-4'>
                  <div className='flex items-center gap-3'>
                    {getDocumentIcon(doc.type)}
                    <span className='font-medium text-gray-900'>{doc.name}</span>
                  </div>
                </td>
                <td className='px-6 py-4 text-sm text-gray-600'>
                  {buildingNames[doc.buildingId]}
                </td>
                <td className='px-6 py-4 text-sm'>
                  <span className='px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                    {doc.type}
                  </span>
                </td>
                <td className='px-6 py-4 text-sm text-gray-600'>{formatFileSize(doc.size)}</td>
                <td className='px-6 py-4 text-sm text-gray-600'>
                  {formatDate(new Date(doc.uploadedAt))}
                </td>
                <td className='px-6 py-4'>
                  <div className='flex items-center gap-2'>
                    <a
                      href={doc.fileUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                      title='Download'
                    >
                      <Download className='w-4 h-4' />
                    </a>
                    {onDelete && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className='p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors'
                        title='Delete'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredDocuments.length === 0 && (
        <div className='text-center py-12'>
          <FileText className='w-12 h-12 text-gray-300 mx-auto mb-4' />
          <p className='text-gray-600'>No documents found matching your filters</p>
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;
