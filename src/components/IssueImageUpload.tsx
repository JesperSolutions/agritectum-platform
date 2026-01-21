import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Camera, FileImage, AlertCircle, Clipboard } from 'lucide-react';
import { useIntl } from '../hooks/useIntl';
import {
  uploadImageToStorage,
  validateImageFile,
  ImageUploadProgress,
} from '../services/imageUploadService';

interface IssueImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
  className?: string;
  reportId: string;
  issueId: string;
  maxImages?: number;
}

const IssueImageUpload: React.FC<IssueImageUploadProps> = ({
  images = [],
  onChange,
  disabled = false,
  className = '',
  reportId,
  issueId,
  maxImages = 5,
}) => {
  const { t } = useIntl();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<ImageUploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPasteHint, setShowPasteHint] = useState(false);

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      // Only handle paste if this component is visible and not uploading
      if (!containerRef.current || disabled || uploading) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];

      // Check for image items in clipboard
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            imageFiles.push(blob);
          }
        }
      }

      if (imageFiles.length === 0) return;

      // Prevent default paste behavior
      event.preventDefault();

      // Check image limit
      if (images.length + imageFiles.length > maxImages) {
        setError(`Maximum ${maxImages} images allowed per issue`);
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const uploadPromises = imageFiles.map(async file => {
          // Validate file
          const validationError = validateImageFile(file);
          if (validationError) {
            throw new Error(validationError);
          }

          // Upload image
          const result = await uploadImageToStorage(file, reportId, issueId, progress => {
            setUploadProgress(progress);
          });

          return result.url;
        });

        const newImageUrls = await Promise.all(uploadPromises);
        onChange([...images, ...newImageUrls]);
      } catch (err: any) {
        console.error('Error uploading pasted images:', err);
        setError(err.message || 'Failed to upload pasted images');
      } finally {
        setUploading(false);
        setUploadProgress(null);
      }
    };

    // Add listener
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [images, maxImages, reportId, issueId, onChange, disabled, uploading]);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      // Check image limit
      if (images.length + files.length > maxImages) {
        setError(`Maximum ${maxImages} images allowed per issue`);
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const uploadPromises = Array.from(files).map(async file => {
          // Validate file
          const validationError = validateImageFile(file);
          if (validationError) {
            throw new Error(validationError);
          }

          // Upload image
          const result = await uploadImageToStorage(file, reportId, issueId, progress => {
            setUploadProgress(progress);
          });

          return result.url;
        });

        const newImageUrls = await Promise.all(uploadPromises);
        onChange([...images, ...newImageUrls]);
      } catch (err: any) {
        console.error('Error uploading images:', err);
        setError(err.message || 'Failed to upload images');
      } finally {
        setUploading(false);
        setUploadProgress(null);
        // Reset file inputs
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
      }
    },
    [images, maxImages, reportId, issueId, onChange]
  );

  const handleRemoveImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages);
    },
    [images, onChange]
  );

  const handleGalleryClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleCameraClick = () => {
    if (!disabled && !uploading) {
      cameraInputRef.current?.click();
    }
  };

  const isAtLimit = images.length >= maxImages;

  return (
    <div
      ref={containerRef}
      className={`space-y-3 ${className}`}
      onMouseEnter={() => !uploading && setShowPasteHint(true)}
      onMouseLeave={() => setShowPasteHint(false)}
    >
      {/* Upload Controls */}
      {!isAtLimit && (
        <div className='flex gap-2'>
          <button
            type='button'
            onClick={handleGalleryClick}
            disabled={disabled || uploading}
            className='flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'
          >
            <FileImage className='w-4 h-4' />
            {t('form.buttons.selectFromGallery')}
          </button>

          <button
            type='button'
            onClick={handleCameraClick}
            disabled={disabled || uploading}
            className='flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'
          >
            <Camera className='w-4 h-4' />
            {t('form.buttons.takePhoto')}
          </button>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        multiple
        onChange={handleFileSelect}
        className='hidden'
        disabled={disabled || uploading}
      />

      <input
        ref={cameraInputRef}
        type='file'
        accept='image/*'
        capture='environment'
        onChange={handleFileSelect}
        className='hidden'
        disabled={disabled || uploading}
      />

      {/* Upload Progress */}
      {uploading && uploadProgress && (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm text-blue-800'>{t('form.messages.uploadingImages')}</span>
            <span className='text-sm text-blue-600'>{Math.round(uploadProgress.percentage)}%</span>
          </div>
          <div className='w-full bg-blue-200 rounded-full h-2'>
            <div
              className='bg-blue-600 h-2 rounded-full transition-all duration-300'
              style={{ width: `${uploadProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2'>
          <AlertCircle className='w-4 h-4 text-red-600 flex-shrink-0' />
          <span className='text-sm text-red-800'>{error}</span>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
          {images.map((imageUrl, index) => (
            <div key={index} className='relative group'>
              <img
                src={imageUrl}
                alt={`Issue image ${index + 1}`}
                className='w-full h-24 object-cover rounded-lg border border-gray-300'
                loading='lazy'
              />
              <button
                type='button'
                onClick={() => handleRemoveImage(index)}
                disabled={disabled || uploading}
                className='absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50'
                aria-label={`Remove image ${index + 1}`}
              >
                <X className='w-3 h-3' />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
          <Camera className='w-8 h-8 text-gray-400 mx-auto mb-2' />
          <p className='text-sm text-gray-600 mb-2'>{t('form.messages.noImagesUploaded')}</p>
          <p className='text-xs text-gray-500'>{t('form.messages.clickButtonsToAddImages')}</p>
        </div>
      )}

      {/* Image Count */}
      {images.length > 0 && (
        <p className='text-xs text-gray-500 text-center'>
          {images.length} / {maxImages} {t('form.labels.images')}
        </p>
      )}
    </div>
  );
};

export default IssueImageUpload;
