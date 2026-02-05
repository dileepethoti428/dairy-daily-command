import { useEffect, useCallback, useState } from 'react';
import { useBlocker, useLocation } from 'react-router-dom';

interface UseUnsavedChangesOptions {
  isDirty: boolean;
  message?: string;
}

export function useUnsavedChanges({ isDirty, message }: UseUnsavedChangesOptions) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const location = useLocation();

  // Try to use the blocker API if available (data routers only)
  // This is a safe wrapper that won't crash with legacy BrowserRouter
  let blocker: { state: string; proceed?: () => void; reset?: () => void } = { state: 'unblocked' };
  
  try {
    // useBlocker only works with data routers created via createBrowserRouter
    // With legacy BrowserRouter, this will throw an error
    blocker = useBlocker(
      ({ currentLocation, nextLocation }) =>
        isDirty && currentLocation.pathname !== nextLocation.pathname
    );
  } catch {
    // Fallback: useBlocker is not available with legacy BrowserRouter
    // We'll rely only on beforeunload for browser navigation protection
  }

  // Handle browser beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = message || 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, message]);

  // Show custom prompt when blocked
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowPrompt(true);
    }
  }, [blocker.state]);

  const confirmNavigation = useCallback(() => {
    if (blocker.state === 'blocked' && blocker.proceed) {
      blocker.proceed();
    }
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
    setShowPrompt(false);
  }, [blocker, pendingNavigation]);

  const cancelNavigation = useCallback(() => {
    if (blocker.state === 'blocked' && blocker.reset) {
      blocker.reset();
    }
    setPendingNavigation(null);
    setShowPrompt(false);
  }, [blocker]);

  // Helper to wrap navigation calls with unsaved changes check
  const checkBeforeNavigate = useCallback((navigate: () => void) => {
    if (isDirty) {
      setPendingNavigation(() => navigate);
      setShowPrompt(true);
      return false;
    }
    return true;
  }, [isDirty]);

  return {
    showPrompt,
    confirmNavigation,
    cancelNavigation,
    isBlocked: blocker.state === 'blocked',
    checkBeforeNavigate,
  };
}
