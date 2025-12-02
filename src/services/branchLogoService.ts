import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { AppError, ErrorCodes, getErrorMessage, logError } from '../utils/errorHandler';

export interface LogoUploadResult {
  url: string;
  name: string;
  size: number;
}

/**
 * Upload branch logo to Firebase Storage
 */
export const uploadBranchLogo = async (
  file: File,
  branchId: string,
  onProgress?: (progress: number) => void
): Promise<LogoUploadResult> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new AppError(ErrorCodes.FILE_INVALID_TYPE, 'Please select an image file');
    }

    // Validate file size (max 2MB for logos)
    if (file.size > 2 * 1024 * 1024) {
      throw new AppError(ErrorCodes.FILE_TOO_LARGE, 'Logo must be smaller than 2MB');
    }

    // Compress image if needed
    const compressedFile = await compressLogoImage(file);

    // Create storage reference
    const fileName = `logo_${Date.now()}.${compressedFile.name.split('.').pop()}`;
    const storageRef = ref(storage, `branches/${branchId}/logo/${fileName}`);

    // Upload with progress tracking
    const uploadTask = uploadBytes(storageRef, compressedFile);

    // Simulate progress for better UX
    if (onProgress) {
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 20, 90);
        onProgress(progress);
      }, 100);

      await uploadTask;
      clearInterval(progressInterval);
      onProgress(100);
    } else {
      await uploadTask;
    }

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    return {
      url: downloadURL,
      name: fileName,
      size: compressedFile.size,
    };
  } catch (error) {
    logError(error as Error, 'branchLogoService.uploadBranchLogo');
    throw new AppError(ErrorCodes.FILE_UPLOAD_FAILED, getErrorMessage(error), {
      branchId,
      fileName: file.name,
    });
  }
};

/**
 * Delete branch logo from Firebase Storage
 */
export const deleteBranchLogo = async (logoUrl: string): Promise<void> => {
  try {
    // Extract the path from the URL
    const url = new URL(logoUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);

    if (!pathMatch) {
      throw new Error('Invalid logo URL');
    }

    const logoPath = decodeURIComponent(pathMatch[1]);
    const logoRef = ref(storage, logoPath);

    await deleteObject(logoRef);
  } catch (error) {
    logError(error as Error, 'branchLogoService.deleteBranchLogo');
    // Don't throw error for deletion failures
  }
};

/**
 * Compress logo image for optimal storage
 */
const compressLogoImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set maximum dimensions for logos
      const maxWidth = 400;
      const maxHeight = 400;

      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress logo'));
          }
        },
        'image/jpeg',
        0.9 // Higher quality for logos
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};
