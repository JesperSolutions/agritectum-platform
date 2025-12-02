import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, MapPin, X, FileImage, AlertCircle } from 'lucide-react';
import { useIntl } from '../hooks/useIntl';
import { Issue, IssueSeverity, RoofPinMarker } from '../types';
import { uploadImageToStorage, validateImageFile, ImageUploadProgress } from '../services/imageUploadService';
import { validateRoofPins } from '../utils/formDataValidation';

interface RoofImageAnnotationProps {
  roofImageUrl?: string;
  pins: RoofPinMarker[];
  availableIssues: Issue[];
  reportId: string;
  onImageChange: (url: string | null) => void;
  onPinsChange: (pins: RoofPinMarker[]) => void;
  disabled?: boolean;
  className?: string;
}

const RoofImageAnnotation: React.FC<RoofImageAnnotationProps> = ({
  roofImageUrl,
  pins: propsPins,
  availableIssues,
  reportId,
  onImageChange,
  onPinsChange,
  disabled = false,
  className = '',
}) => {
  const { t } = useIntl();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<ImageUploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPins, setShowPins] = useState(true);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Validate and sanitize pins on prop change
  const validatedPins = React.useMemo(() => {
    return validateRoofPins(propsPins || []);
  }, [propsPins]);

  // Notify parent if pins were invalid and corrected (only once on mount/change)
  useEffect(() => {
    const originalLength = propsPins?.length || 0;
    const validatedLength = validatedPins.length;
    
    // Check if any pin was filtered out or coordinates were clamped
    const hasChanges = validatedLength !== originalLength || 
      validatedPins.some((pin, idx) => {
        const original = propsPins?.[idx];
        return !original || pin.x !== original.x || pin.y !== original.y;
      });

    // Only update if there are actual corrections needed (even if length is 0, we want to clear invalid pins)
    if (hasChanges) {
      onPinsChange(validatedPins);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propsPins]); // Only run when propsPins change, not on every validatedPins change

  const getSeverityColor = (severity: IssueSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-600';
      default:
        return 'bg-blue-500';
    }
  };

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setError(null);

      try {
        const validationError = validateImageFile(file);
        if (validationError) {
          throw new Error(validationError);
        }

        // Upload roof image to storage
        const result = await uploadImageToStorage(file, reportId, 'roof-overview', (progress) => {
          setUploadProgress(progress);
        });

        onImageChange(result.url);
      } catch (err: any) {
        console.error('Error uploading roof image:', err);
        setError(err.message || 'Failed to upload image');
      } finally {
        setUploading(false);
        setUploadProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
      }
    },
    [reportId, onImageChange]
  );

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !roofImageUrl) return;

    const rect = imageContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Create new pin
    const newPin: RoofPinMarker = {
      id: `pin_${Date.now()}`,
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      severity: 'medium', // Default severity
    };

    onPinsChange([...validatedPins, newPin]);
    setSelectedPin(newPin.id);
  };

  const handlePinClick = (e: React.MouseEvent, pinId: string) => {
    e.stopPropagation();
    if (selectedPin === pinId) {
      setSelectedPin(null);
    } else {
      setSelectedPin(pinId);
    }
  };

  const handleRemovePin = (pinId: string) => {
    onPinsChange(validatedPins.filter((p) => p.id !== pinId));
    if (selectedPin === pinId) {
      setSelectedPin(null);
    }
  };

  const handlePinIssueLink = (pinId: string, issueId: string) => {
    const updatedPins = validatedPins.map((pin: RoofPinMarker) => (pin.id === pinId ? { ...pin, issueId } : pin));
    onPinsChange(updatedPins);
    setSelectedPin(null);
  };

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

  const handleRemoveImage = () => {
    onImageChange(null);
    onPinsChange([]); // Clear pins when image is removed
  };

  const getPinIssue = (pin: RoofPinMarker) => {
    if (!pin.issueId) return null;
    return availableIssues.find((issue) => issue.id === pin.issueId);
  };

  if (!roofImageUrl) {
    return (
      <div className={`${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('form.labels.roofOverviewImage')}
        </label>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">
            {t('form.messages.uploadRoofImage')}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            {t('form.messages.addPinsToMarkIssues')}
          </p>

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={handleGalleryClick}
              disabled={disabled || uploading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <FileImage className="w-4 h-4" />
              {t('form.buttons.selectFromGallery')}
            </button>

            <button
              type="button"
              onClick={handleCameraClick}
              disabled={disabled || uploading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Camera className="w-4 h-4" />
              {t('form.buttons.takePhoto')}
            </button>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || uploading}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || uploading}
          />

          {/* Upload Progress */}
          {uploading && uploadProgress && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-800">{t('form.messages.uploadingImages')}</span>
                <span className="text-sm text-blue-600">{Math.round(uploadProgress.percentage)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {t('form.labels.roofOverviewImage')}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPins(!showPins)}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          >
            {showPins ? t('form.buttons.hidePins') : t('form.buttons.showPins')} ({validatedPins.length})
          </button>
          <button
            type="button"
            onClick={handleRemoveImage}
            disabled={disabled || uploading}
            className="text-red-600 hover:text-red-800 disabled:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
        <div
          ref={imageContainerRef}
          onClick={handleImageClick}
          className="relative cursor-crosshair select-none"
          style={{ userSelect: 'none', touchAction: 'none' }}
        >
          <img
            src={roofImageUrl}
            alt="Roof overview"
            className="w-full h-auto max-h-96 object-contain"
            draggable={false}
          />

          {/* Pins Overlay */}
          {showPins &&
            validatedPins.map((pin) => {
              const issue = getPinIssue(pin);
              const isSelected = selectedPin === pin.id;
              return (
                <div
                  key={pin.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
                    isSelected ? 'z-10' : 'z-0'
                  }`}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  onClick={(e) => handlePinClick(e, pin.id)}
                >
                  <div
                    className={`${getSeverityColor(pin.severity)} w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer transition-all hover:scale-110 ${
                      isSelected ? 'ring-2 ring-blue-500 scale-110' : ''
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-white mx-auto mt-0.5" />
                  </div>

                  {/* Pin Label */}
                  {issue && (
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white rounded px-2 py-1 shadow-lg text-xs whitespace-nowrap">
                      {issue.title || issue.type}
                    </div>
                  )}

                  {/* Remove button on selected pin */}
                  {isSelected && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePin(pin.id);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-600">
            {t('roofImage.pinInstruction') || '💡 Klicka på bilden för att lägga till markörer som markerar problemplatser. Markörer kan länkas till specifika problem.'}
          </p>
        </div>
      </div>

      {/* Pin Configuration Panel */}
      {selectedPin && (
        <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Configure Pin</h4>
            <button
              type="button"
              onClick={() => setSelectedPin(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={validatedPins.find((p) => p.id === selectedPin)?.severity || 'medium'}
                onChange={(e) => {
                  const updatedPins = validatedPins.map((p) =>
                    p.id === selectedPin ? { ...p, severity: e.target.value as IssueSeverity } : p
                  );
                  onPinsChange(updatedPins);
                }}
                className="block w-full text-sm border-gray-300 rounded-md shadow-sm"
                disabled={disabled}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {availableIssues.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Link to Issue (Optional)
                </label>
                <select
                  value={validatedPins.find((p) => p.id === selectedPin)?.issueId || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      handlePinIssueLink(selectedPin, e.target.value);
                    }
                  }}
                  className="block w-full text-sm border-gray-300 rounded-md shadow-sm"
                  disabled={disabled}
                >
                  <option value="">No issue linked</option>
                  {availableIssues.map((issue) => (
                    <option key={issue.id} value={issue.id}>
                      {issue.title || issue.type} - {issue.severity}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoofImageAnnotation;

