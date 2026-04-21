import React, { useState, useMemo } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { Building, FileText, Calendar, Trash2, Download, Eye, AlertTriangle } from 'lucide-react';
import { useIntl } from '../../hooks/useIntl';
import { formatDate } from '../../utils/dateFormatter';
import EmptyState from '../empty-states/EmptyState';
import AccessibleModal from '../AccessibleModal';
import AccessibleButton from '../AccessibleButton';

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
  // Fix #3: require an AccessibleModal confirmation before deleting a
  // document. The document to delete is held in local state while the modal
  // is open; cancel clears it without calling onDelete.
  const [pendingDelete, setPendingDelete] = useState<Document | null>(null);

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

  const requestDelete = (document: Document) => {
    if (!onDelete) return;
    setPendingDelete(document);
  };

  const cancelDelete = () => {
    setPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!onDelete || !pendingDelete) return;

    const documentId = pendingDelete.id;
    setDeletingId(documentId);
    try {
      await onDelete(documentId);
      setPendingDelete(null);
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
        return <FileText className='w-5 h-5 text-[#7DA8CC]' />;
      case 'report':
        return <FileText className='w-5 h-5 text-[#956098]' />;
      case 'invoice':
        return <FileText className='w-5 h-5 text-[#A1BA53]' />;
      case 'certificate':
        return <FileText className='w-5 h-5 text-amber-600' />;
      case 'permit':
        return <FileText className='w-5 h-5 text-[#DA5062]' />;
      default:
        return <FileText className='w-5 h-5 text-gray-600' />;
    }
  };

  if (documents.length === 0 && !loading) {
    return <EmptyState type='documents' />;
  }

  // Fix #3: shared delete-confirmation modal rendered in both mobile and
  // desktop branches. Reuses AccessibleModal for focus trap + ARIA.
  const deleteConfirmModal = (
    <AccessibleModal
      isOpen={pendingDelete !== null}
      onClose={cancelDelete}
      title={t('common.confirm.title')}
      size='sm'
    >
      <div className='space-y-4'>
        <div className='flex items-start gap-3'>
          <AlertTriangle
            className='w-6 h-6 text-[#DA5062] flex-shrink-0 mt-0.5'
            aria-hidden='true'
          />
          <p className='text-sm text-gray-700'>
            {pendingDelete ? t('documents.confirmDelete', { fileName: pendingDelete.name }) : ''}
          </p>
        </div>
        <div className='flex justify-end gap-2'>
          <AccessibleButton
            variant='secondary'
            onClick={cancelDelete}
            disabled={deletingId !== null}
          >
            {t('common.buttons.cancel')}
          </AccessibleButton>
          <AccessibleButton
            variant='danger'
            onClick={confirmDelete}
            loading={deletingId !== null}
            disabled={deletingId !== null}
          >
            {t('common.buttons.delete')}
          </AccessibleButton>
        </div>
      </div>
    </AccessibleModal>
  );

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
            className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7DA8CC]'
          />

          {uniqueBuildings.length > 1 && (
            <select
              value={selectedBuilding}
              onChange={e => setSelectedBuilding(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7DA8CC]'
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
            className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7DA8CC]'
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
            <div key={doc.id} className='bg-white rounded-lg border border-gray-200 p-4 space-y-3'>
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
                  className='flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-[#7DA8CC] border border-[#7DA8CC]/40 rounded-lg hover:bg-[#7DA8CC]/10 transition-colors'
                >
                  <Download className='w-4 h-4' />
                  Download
                </a>
                {onDelete && (
                  <button
                    onClick={() => requestDelete(doc)}
                    disabled={deletingId === doc.id}
                    className='px-3 py-2 text-[#DA5062] border border-[#DA5062]/40 rounded-lg hover:bg-[#DA5062]/10 disabled:opacity-50 transition-colors'
                    aria-label={t('documents.actions.delete')}
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
        {deleteConfirmModal}
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
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7DA8CC]'
            />
          </div>

          {uniqueBuildings.length > 1 && (
            <select
              value={selectedBuilding}
              onChange={e => setSelectedBuilding(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7DA8CC] min-w-48'
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
            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7DA8CC] min-w-48'
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
                <td className='px-6 py-4 text-sm text-gray-600'>{buildingNames[doc.buildingId]}</td>
                <td className='px-6 py-4 text-sm'>
                  <span className='px-3 py-1 rounded-full text-xs font-medium bg-[#7DA8CC]/15 text-[#476279]'>
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
                      className='p-2 text-[#7DA8CC] hover:bg-[#7DA8CC]/10 rounded-lg transition-colors'
                      title='Download'
                    >
                      <Download className='w-4 h-4' />
                    </a>
                    {onDelete && (
                      <button
                        onClick={() => requestDelete(doc)}
                        disabled={deletingId === doc.id}
                        className='p-2 text-[#DA5062] hover:bg-[#DA5062]/10 rounded-lg disabled:opacity-50 transition-colors'
                        title={t('documents.actions.delete')}
                        aria-label={t('documents.actions.delete')}
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
      {deleteConfirmModal}
    </div>
  );
};

export default DocumentLibrary;
