// @ts-nocheck
import { useState, useCallback, useRef } from 'react';

interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
}

interface UseLoadingProgressReturn {
  loadingState: LoadingState;
  startLoading: (message?: string) => void;
  updateProgress: (progress: number, message?: string) => void;
  finishLoading: () => void;
  withProgress: <T>(
    asyncFn: (updateProgress: (progress: number, message?: string) => void) => Promise<T>,
    initialMessage?: string
  ) => Promise<T>;
}

export const useLoadingProgress = (): UseLoadingProgressReturn => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    message: 'Loading...'
  });

  const timeoutRef = useRef<NodeJS.Timeout>();

  const startLoading = useCallback((message = 'Loading...') => {
    setLoadingState({
      isLoading: true,
      progress: 0,
      message
    });
  }, []);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
      message: message || prev.message
    }));
  }, []);

  const finishLoading = useCallback(() => {
    // Show 100% briefly before hiding
    setLoadingState(prev => ({
      ...prev,
      progress: 100
    }));

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Hide loading after a short delay
    timeoutRef.current = setTimeout(() => {
      setLoadingState({
        isLoading: false,
        progress: 0,
        message: 'Loading...'
      });
    }, 500);
  }, []);

  const withProgress = useCallback(async <T,>(
    asyncFn: (updateProgress: (progress: number, message?: string) => void) => Promise<T>,
    initialMessage = 'Loading...',
    minDisplayTime = 2000 // Minimum 2 seconds to show loading screen
  ): Promise<T> => {
    const startTime = Date.now();
    let showLoading = false;

    // Start loading after a small delay to avoid flash for quick operations
    const loadingTimeout = setTimeout(() => {
      showLoading = true;
      startLoading(initialMessage);
    }, 200);

    try {
      const result = await asyncFn(updateProgress);

      const elapsedTime = Date.now() - startTime;

      // Clear the timeout if operation completed before 200ms
      clearTimeout(loadingTimeout);

      if (showLoading) {
        // If we showed loading and operation was quick, ensure minimum display time
        if (elapsedTime < minDisplayTime) {
          await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsedTime));
        }
        finishLoading();
      }

      return result;
    } catch (error) {
      clearTimeout(loadingTimeout);
      if (showLoading) {
        finishLoading();
      }
      throw error;
    }
  }, [startLoading, updateProgress, finishLoading]);

  const withQuickProgress = useCallback(async <T,>(
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    // For operations under 2 seconds, don't show loading screen
    return withProgress(async () => await asyncFn(), 'Loading...', 0);
  }, [withProgress]);

  return {
    loadingState,
    startLoading,
    updateProgress,
    finishLoading,
    withProgress,
    withQuickProgress
  };
};

// Helper functions for common loading scenarios
export const simulateProgress = (
  updateProgress: (progress: number, message?: string) => void,
  duration: number = 2000,
  steps: Array<{ progress: number; message: string; delay?: number }> = []
) => {
  return new Promise<void>((resolve) => {
    if (steps.length === 0) {
      // Default simulation
      const interval = duration / 100;
      let current = 0;

      const timer = setInterval(() => {
        current += Math.random() * 5 + 1;
        if (current >= 100) {
          current = 100;
          updateProgress(current, 'Finishing up...');
          clearInterval(timer);
          setTimeout(resolve, 200);
        } else {
          updateProgress(current);
        }
      }, interval);
    } else {
      // Step-based simulation
      let stepIndex = 0;

      const processStep = () => {
        if (stepIndex >= steps.length) {
          resolve();
          return;
        }

        const step = steps[stepIndex];
        updateProgress(step.progress, step.message);
        stepIndex++;

        setTimeout(processStep, step.delay || 500);
      };

      processStep();
    }
  });
};

export default useLoadingProgress;
