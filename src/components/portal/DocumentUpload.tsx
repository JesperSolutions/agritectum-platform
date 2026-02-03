import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Download, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import {
  uploadBuildingDocument,
  deleteBuildingDocument,
  getBuildingDocumentUrl,
  formatFileSize,
  validateFile,
  MAX_DOCUMENTS,
} from '../../services/buildingDocumentService';
import { BuildingDocument } from '../../types';
import { logger } from '../../utils/logger';

interface DocumentUploadProps {
  buildingId: string;
  documents: BuildingDocument[];
  onDocumentsChange: (documents: BuildingDocument[]) => void;
  userId: string;
  isEditable?: boolean;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  buildingId,
  documents = [],
  onDocumentsChange,
  userId,
  isEditable = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadError(null);
    setUploadSuccess(null);

    // Validate
    const validation = validateFile(file, documents.length);
    if (!validation.isValid) {
      setUploadError(validation.errors[0]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);

    try {
      const newDocument = await uploadBuildingDocument(buildingId, file, userId);
      onDocumentsChange([...documents, newDocument]);
      setUploadSuccess(`✓ "${file.name}" uploaded successfully`);

      // Clear file input
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload document';
      setUploadError(errorMessage);
      logger.error('Document upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (document: BuildingDocument) => {
    try {
      setDownloadingId(document.id);
      const url = await getBuildingDocumentUrl(document.storagePath);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = document.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logger.log('📥 Document downloaded:', {
        documentId: document.id,
        fileName: document.fileName,
      });
    } catch (error) {
      logger.error('Failed to download document:', error);
      setUploadError('Failed to download document');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (document: BuildingDocument) => {
    if (!window.confirm(`Delete "${document.fileName}"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(document.id);
      await deleteBuildingDocument(buildingId, document, userId);
      onDocumentsChange(documents.filter((d) => d.id !== document.id));
      setUploadError(null);
      setUploadSuccess(`✓ Document deleted`);
      setTimeout(() => setUploadSuccess(null), 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete document';
      setUploadError(errorMessage);
      logger.error('Document deletion failed:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const isFull = documents.length >= MAX_DOCUMENTS;
  const remainingSlots = MAX_DOCUMENTS - documents.length;

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-600" />
        Documentation & Files
      </h3>

      {/* Upload Section */}
      {isEditable && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <label className="block font-medium text-gray-700">
              Attach Documents
              <span className="text-xs text-gray-500 font-normal ml-2">
                ({documents.length}/{MAX_DOCUMENTS})
              </span>
            </label>
            {isFull && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Maximum documents reached
              </span>
            )}
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isFull
                ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                : 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 cursor-pointer'
            }`}
            onClick={() => {
              if (!isFull && !isUploading && fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              disabled={isFull || isUploading}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
              className="hidden"
            />

            <Upload className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            {isUploading ? (
              <p className="text-gray-600 font-medium">Uploading...</p>
            ) : isFull ? (
              <p className="text-gray-600">Maximum documents reached</p>
            ) : (
              <>
                <p className="text-gray-700 font-medium">Click to upload a document</p>
                <p className="text-xs text-gray-500 mt-1">
                  Max 3MB per file • PDF, DOC, DOCX, JPG, PNG, GIF, XLS, XLSX
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
                </p>
              </>
            )}
          </div>

          {/* Messages */}
          {uploadError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          )}

          {uploadSuccess && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{uploadSuccess}</p>
            </div>
          )}
        </div>
      )}

      {/* Documents List */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3">
          {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
        </h4>

        {documents.length === 0 ? (
          <div className="p-4 text-center bg-gray-50 rounded-lg border border-gray-200">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No documents attached yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {document.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(document.fileSize)} •{' '}
                      {new Date(document.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {isEditable && (
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => handleDownload(document)}
                      disabled={downloadingId === document.id}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Download document"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(document)}
                      disabled={deletingId === document.id}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;
