import React, { useState } from 'react';
import { Upload, Eye, CheckCircle } from 'lucide-react';
import MultiImageUpload from './MultiImageUpload';

const ImageUploadTest: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [testReportId] = useState(`test_${Date.now()}`);
  const [testIssueId] = useState(`issue_${Date.now()}`);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages);
    setUploadStatus(`Images updated: ${newImages.length} images`);
  };

  const handleTestUpload = () => {
    setUploadStatus('Testing image upload...');
    // The MultiImageUpload component will handle the actual upload
  };

  return (
    <div className='space-y-6'>
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
        <h3 className='text-lg font-semibold text-blue-900 mb-2'>Image Upload Test</h3>
        <div className='text-sm text-blue-700 space-y-1'>
          <p>
            <strong>Test Report ID:</strong> {testReportId}
          </p>
          <p>
            <strong>Test Issue ID:</strong> {testIssueId}
          </p>
        </div>
      </div>

      <div className='flex gap-3'>
        <button
          onClick={handleTestUpload}
          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        >
          <Upload className='w-4 h-4 mr-2' />
          Test Upload
        </button>
      </div>

      {uploadStatus && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
          <div className='flex items-center'>
            <CheckCircle className='w-5 h-5 text-green-600 mr-2' />
            <p className='text-sm text-green-800'>{uploadStatus}</p>
          </div>
        </div>
      )}

      <div>
        <h4 className='text-md font-medium text-gray-900 mb-3'>Upload Images:</h4>
        <MultiImageUpload
          images={images}
          onChange={handleImagesChange}
          reportId={testReportId}
          issueId={testIssueId}
          maxImages={5}
        />
      </div>

      <div>
        <h4 className='text-md font-medium text-gray-900 mb-3'>
          Uploaded Images ({images.length}):
        </h4>
        {images.length > 0 ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
            {images.map((imageUrl, index) => (
              <div
                key={index}
                className='bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm'
              >
                <img
                  src={imageUrl}
                  alt={`Uploaded ${index + 1}`}
                  className='w-full h-48 object-cover'
                />
                <div className='p-3'>
                  <p className='text-sm text-gray-600 mb-2'>Image {index + 1}</p>
                  <a
                    href={imageUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center text-sm text-blue-600 hover:text-blue-800'
                  >
                    <Eye className='w-4 h-4 mr-1' />
                    View Full Size
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-8 text-gray-500'>
            <Upload className='w-12 h-12 mx-auto mb-2 text-gray-400' />
            <p>No images uploaded yet.</p>
            <p className='text-sm'>Use the upload area above to add images.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadTest;
