import { useEffect, useCallback, useState } from 'react';
import { useBlocker } from 'react-router-dom';

interface UseUnsavedChangesOptions {
  isDirty: boolean;
  message?: string;
}

export function useUnsavedChanges({ isDirty, message }: UseUnsavedChangesOptions) {
  const [showPrompt, setShowPrompt] = useState(false);
  
  // Block navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

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
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
    setShowPrompt(false);
  }, [blocker]);

  const cancelNavigation = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
    setShowPrompt(false);
  }, [blocker]);

  return {
    showPrompt,
    confirmNavigation,
    cancelNavigation,
    isBlocked: blocker.state === 'blocked',
  };
}
