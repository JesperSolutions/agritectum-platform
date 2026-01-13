import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, Check, RotateCcw } from 'lucide-react';
import { useIntl } from '../hooks/useIntl';

interface DefectCameraCaptureProps {
  onImageCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

const DefectCameraCapture: React.FC<DefectCameraCaptureProps> = ({
  onImageCapture,
  onCancel,
}) => {
  const { t } = useIntl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(t('form.validation.invalidImageType') || 'Invalid image type');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('form.validation.imageTooLarge') || 'Image too large (max 5MB)');
        return;
      }

      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setCapturedImage(dataUrl);
        setError(null);
      };
      reader.onerror = () => {
        setError(t('form.validation.imageReadError') || 'Error reading image');
      };
      reader.readAsDataURL(file);
    },
    [t]
  );

  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleGalleryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAccept = () => {
    if (capturedImage) {
      onImageCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-slate-900 flex items-center'>
          <Camera className='w-5 h-5 mr-2' />
          {t('form.defectFlow.captureImage') || 'Take photo of defect'}
        </h3>
        <button
          type='button'
          onClick={onCancel}
          className='text-slate-400 hover:text-slate-600 transition-colors'
          aria-label={t('common.buttons.close') || 'Close'}
        >
          <X className='w-5 h-5' />
        </button>
      </div>

      {error && (
        <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'>
          {error}
        </div>
      )}

      {!capturedImage ? (
        <div className='space-y-4'>
          <p className='text-sm text-slate-600 text-center'>
            {t('form.defectFlow.captureInstructions') || 'Take or select a photo of the defect'}
          </p>

          <div className='flex flex-col sm:flex-row gap-3'>
            <button
              type='button'
              onClick={handleCameraClick}
              className='flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm min-h-[44px] transition-colors'
            >
              <Camera className='w-5 h-5' />
              <span className='font-medium'>{t('form.buttons.takePhoto') || 'Take Photo'}</span>
            </button>

            <button
              type='button'
              onClick={handleGalleryClick}
              className='flex-1 flex items-center justify-center gap-2 px-4 py-4 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 shadow-sm min-h-[44px] transition-colors'
            >
              <RotateCcw className='w-5 h-5' />
              <span className='font-medium'>{t('form.buttons.selectFromGallery') || 'Select from Gallery'}</span>
            </button>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type='file'
            accept='image/*'
            capture='environment'
            onChange={handleFileSelect}
            className='hidden'
          />
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            onChange={handleFileSelect}
            className='hidden'
          />
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50'>
            <img
              src={capturedImage}
              alt={t('form.defectFlow.capturedImage') || 'Captured image'}
              className='w-full h-auto max-h-[400px] object-contain'
            />
          </div>

          <div className='flex flex-col sm:flex-row gap-3'>
            <button
              type='button'
              onClick={handleAccept}
              className='flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm min-h-[44px] transition-colors font-medium'
            >
              <Check className='w-5 h-5' />
              {t('form.defectFlow.acceptImage') || 'Accept Image'}
            </button>

            <button
              type='button'
              onClick={handleRetake}
              className='flex-1 flex items-center justify-center gap-2 px-4 py-4 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 shadow-sm min-h-[44px] transition-colors font-medium'
            >
              <RotateCcw className='w-5 h-5' />
              {t('form.defectFlow.retakeImage') || 'Retake'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectCameraCapture;
