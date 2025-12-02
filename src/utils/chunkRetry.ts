import React from 'react';

/**
 * Utility for handling chunk loading errors with automatic retry
 * This fixes the "Failed to fetch dynamically imported module" error
 * that occurs when there's a mismatch between cached HTML and new chunks
 */

export async function importWithRetry<T>(
  loader: () => Promise<T>,
  maxRetries: number = 1
): Promise<T> {
  try {
    return await loader();
  } catch (err: any) {
    const isChunkLoad =
      err?.name === 'ChunkLoadError' ||
      /loading chunk|chunk load|Failed to fetch dynamically imported module/i.test(
        err?.message || ''
      );

    if (isChunkLoad && maxRetries > 0) {
      console.warn('Chunk load error detected, attempting page reload...', err);

      // Attempt a hard reload to fetch fresh index.html and chunk map
      window.location.reload();

      // Return a never-resolving promise to satisfy TypeScript
      return new Promise<T>(() => {});
    }

    // Re-throw non-chunk errors or when max retries exceeded
    throw err;
  }
}

/**
 * Wrapper for React.lazy with chunk retry
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  maxRetries: number = 1
) {
  return React.lazy(() => importWithRetry(importFunc, maxRetries));
}
