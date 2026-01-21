import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Loader2, Camera, FileImage, AlertCircle, Clipboard } from 'lucide-react';
import {
  uploadImageToStorage,
  validateImageFile,
  ImageUploadProgress,
} from '../services/imageUploadService';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
  reportId?: string;
  issueId?: string;
  maxImages?: number;
  currentImageCount?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  reportId,
  issueId,
  maxImages = 20,
  currentImageCount = 0,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<ImageUploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPasteHint, setShowPasteHint] = useState(false);

  const isAtLimit = currentImageCount >= maxImages;

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      // Only handle paste if this component is visible and not uploading
      if (!containerRef.current || disabled || uploading || isAtLimit) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      let imageFile: File | null = null;

      // Check for image items in clipboard
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            imageFile = blob;
            break; // Only take first image
          }
        }
      }

      if (!imageFile) return;

      // Prevent default paste behavior
      event.preventDefault();

      // Validate file
      const validationError = validateImageFile(imageFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      setUploading(true);
      setError(null);
      setUploadProgress({ loaded: 0, total: imageFile.size, percentage: 0 });

      try {
        if (reportId && issueId) {
          // Upload to Firebase Storage
          const result = await uploadImageToStorage(imageFile, reportId, issueId, progress =>
            setUploadProgress(progress)
          );
          onChange(result.url);
        } else {
          // Fallback to base64 for development
          const reader = new FileReader();
          reader.onload = e => {
            const result = e.target?.result as string;
            onChange(result);
            setUploading(false);
            setUploadProgress(null);
          };
          reader.onerror = () => {
            setError('Failed to read pasted image');
            setUploading(false);
            setUploadProgress(null);
          };
          reader.readAsDataURL(imageFile);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process pasted image');
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
  }, [reportId, issueId, maxImages, currentImageCount, onChange, disabled, uploading, isAtLimit]);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Check image limit
      if (currentImageCount >= maxImages) {
        setError(`Maximum ${maxImages} images allowed per report`);
        return;
      }

      // Validate file
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setUploading(true);
      setError(null);
      setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });

      try {
        if (reportId && issueId) {
          // Upload to Firebase Storage
          const result = await uploadImageToStorage(file, reportId, issueId, progress =>
            setUploadProgress(progress)
          );
          onChange(result.url);
        } else {
          // Fallback to base64 for development
          const reader = new FileReader();
          reader.onload = e => {
            const result = e.target?.result as string;
            onChange(result);
            setUploading(false);
            setUploadProgress(null);
          };
          reader.onerror = () => {
            setError('Failed to read image');
            setUploading(false);
            setUploadProgress(null);
          };
          reader.readAsDataURL(file);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process image');
      } finally {
        setUploading(false);
        setUploadProgress(null);
      }
    },
    [reportId, issueId, maxImages, currentImageCount, onChange]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const handleClick = useCallback(() => {
    if (!disabled && !uploading && currentImageCount < maxImages) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading, currentImageCount, maxImages]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={() => !uploading && setShowPasteHint(true)}
      onMouseLeave={() => setShowPasteHint(false)}
    >
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        capture='environment' // Use back camera on mobile
        onChange={handleFileSelect}
        className='hidden'
        disabled={disabled || uploading || isAtLimit}
      />

      {value ? (
        <div className='relative group'>
          <img
            src={value}
            alt='Issue image'
            className='w-full h-32 object-cover rounded-lg border border-gray-300'
            loading='lazy'
          />
          <button
            type='button'
            onClick={handleRemove}
            disabled={disabled || uploading}
            className='absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50'
            aria-label='Remove image'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={`
            w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors
            ${
              disabled || uploading || isAtLimit
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-gray-400 hover:border-blue-500 hover:bg-blue-50'
            }
          `}
          role='button'
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          aria-label='Upload image'
        >
          {uploading ? (
            <div className='flex flex-col items-center'>
              <Loader2 className='w-8 h-8 text-blue-500 animate-spin mb-2' />
              {uploadProgress && (
                <div className='w-full max-w-32'>
                  <div className='bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-blue-500 h-2 rounded-full transition-all duration-300'
                      style={{ width: `${uploadProgress.percentage}%` }}
                    />
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    {Math.round(uploadProgress.percentage)}%
                  </p>
                </div>
              )}
            </div>
          ) : isAtLimit ? (
            <div className='flex flex-col items-center text-gray-400'>
              <AlertCircle className='w-8 h-8 mb-2' />
              <p className='text-sm text-center'>Maximum {maxImages} images reached</p>
            </div>
          ) : (
            <div className='flex flex-col items-center'>
              <div className='flex space-x-2 mb-2'>
                <Camera className='w-6 h-6 text-gray-400' />
                <FileImage className='w-6 h-6 text-gray-400' />
              </div>
              <p className='text-sm text-gray-500 text-center'>Tap to upload image</p>
              <p className='text-xs text-gray-400 text-center'>JPEG, PNG, WebP up to 5MB</p>
              <p className='text-xs text-gray-400 text-center'>
                {currentImageCount}/{maxImages} images
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className='mt-2 p-2 bg-red-50 border border-red-200 rounded-md'>
          <div className='flex items-center'>
            <AlertCircle className='w-4 h-4 text-red-500 mr-2' />
            <p className='text-sm text-red-600'>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
