import React, { useState, useCallback } from 'react';
import { X, AlertCircle, Eye } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface MultiImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
  className?: string;
  reportId?: string;
  issueId?: string;
  maxImages?: number;
}

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  images = [],
  onChange,
  disabled = false,
  className = '',
  reportId,
  issueId,
  maxImages = 20,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleImageAdd = useCallback(
    (imageUrl: string) => {
      if (images.length < maxImages) {
        onChange([...images, imageUrl]);
      }
    },
    [images, maxImages, onChange]
  );

  const handleImageRemove = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages);
    },
    [images, onChange]
  );

  const _handleImageUpdate = useCallback(
    (index: number, imageUrl: string | null) => {
      if (imageUrl === null) {
        handleImageRemove(index);
      } else {
        const newImages = [...images];
        newImages[index] = imageUrl;
        onChange(newImages);
      }
    },
    [images, onChange, handleImageRemove]
  );

  const canAddMore = images.length < maxImages;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Image Grid */}
      {images.length > 0 && (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
          {images.map((imageUrl, index) => (
            <div key={index} className='relative group'>
              <img
                src={imageUrl}
                alt={`Issue image ${index + 1}`}
                className='w-full h-24 object-cover rounded-lg border border-gray-300'
                loading='lazy'
              />

              {/* Overlay with actions */}
              <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center'>
                <div className='opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2'>
                  <button
                    type='button'
                    onClick={() => setPreviewImage(imageUrl)}
                    className='p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors'
                    aria-label='Preview image'
                  >
                    <Eye className='w-4 h-4 text-gray-700' />
                  </button>
                  <button
                    type='button'
                    onClick={() => handleImageRemove(index)}
                    disabled={disabled}
                    className='p-2 bg-red-500 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors disabled:opacity-50'
                    aria-label='Remove image'
                  >
                    <X className='w-4 h-4 text-white' />
                  </button>
                </div>
              </div>

              {/* Image number badge */}
              <div className='absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded'>
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Image Button */}
      {canAddMore && (
        <div className='flex justify-center'>
          <ImageUpload
            value=''
            onChange={handleImageAdd}
            disabled={disabled}
            reportId={reportId}
            issueId={issueId}
            maxImages={maxImages}
            currentImageCount={images.length}
            className='w-full max-w-xs'
          />
        </div>
      )}

      {/* Image Limit Warning */}
      {images.length >= maxImages && (
        <div className='flex items-center justify-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <AlertCircle className='w-5 h-5 text-yellow-600 mr-2' />
          <p className='text-sm text-yellow-800'>
            Maximum {maxImages} images reached for this issue
          </p>
        </div>
      )}

      {/* Image Counter */}
      <div className='text-center'>
        <p className='text-sm text-gray-500'>
          {images.length} / {maxImages} images
        </p>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'>
          <div className='relative max-w-4xl max-h-full'>
            <img
              src={previewImage}
              alt='Image preview'
              className='max-w-full max-h-full object-contain rounded-lg'
            />
            <button
              type='button'
              onClick={() => setPreviewImage(null)}
              className='absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors'
              aria-label='Close preview'
            >
              <X className='w-6 h-6' />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;
