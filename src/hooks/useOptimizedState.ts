import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Optimized state hook that prevents unnecessary re-renders
 * by using refs for values that don't need to trigger re-renders
 */
export function useOptimizedState<T>(initialValue: T) {
  const [state, setState] = useState(initialValue);
  const stateRef = useRef(initialValue);
  const listenersRef = useRef<Set<() => void>>(new Set());

  // Update ref when state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setOptimizedState = useCallback((newValue: T | ((prev: T) => T)) => {
    const nextValue =
      typeof newValue === 'function' ? (newValue as (prev: T) => T)(stateRef.current) : newValue;

    // Only update if value actually changed
    if (nextValue !== stateRef.current) {
      setState(nextValue);
      stateRef.current = nextValue;

      // Notify listeners
      listenersRef.current.forEach(listener => listener());
    }
  }, []);

  const getCurrentValue = useCallback(() => stateRef.current, []);

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return {
    state,
    setState: setOptimizedState,
    getCurrentValue,
    subscribe,
  };
}

/**
 * Hook for managing complex state with selective updates
 */
export function useSelectiveState<T extends Record<string, any>>(initialState: T) {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(initialState);
  const listenersRef = useRef<Map<keyof T, Set<() => void>>>(new Map());

  // Update ref when state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setState(prev => {
      const newState = { ...prev, [field]: value };
      stateRef.current = newState;
      return newState;
    });

    // Notify field-specific listeners
    const fieldListeners = listenersRef.current.get(field);
    if (fieldListeners) {
      fieldListeners.forEach(listener => listener());
    }
  }, []);

  const updateFields = useCallback((updates: Partial<T>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      stateRef.current = newState;
      return newState;
    });

    // Notify listeners for all updated fields
    Object.keys(updates).forEach(field => {
      const fieldListeners = listenersRef.current.get(field as keyof T);
      if (fieldListeners) {
        fieldListeners.forEach(listener => listener());
      }
    });
  }, []);

  const subscribeToField = useCallback(<K extends keyof T>(field: K, listener: () => void) => {
    if (!listenersRef.current.has(field)) {
      listenersRef.current.set(field, new Set());
    }
    listenersRef.current.get(field)!.add(listener);

    return () => {
      const fieldListeners = listenersRef.current.get(field);
      if (fieldListeners) {
        fieldListeners.delete(listener);
      }
    };
  }, []);

  const getFieldValue = useCallback(<K extends keyof T>(field: K): T[K] => {
    return stateRef.current[field];
  }, []);

  return {
    state,
    updateField,
    updateFields,
    subscribeToField,
    getFieldValue,
    getCurrentValue: () => stateRef.current,
  };
}

/**
 * Hook for managing async state with loading and error states
 */
export function useAsyncState<T>(initialValue: T) {
  const [state, setState] = useState({
    data: initialValue,
    loading: false,
    error: null as Error | null,
  });

  const stateRef = useRef(state);
  const listenersRef = useRef<Set<() => void>>(new Set());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setData = useCallback((data: T) => {
    setState(prev => {
      const newState = { ...prev, data, error: null };
      stateRef.current = newState;
      return newState;
    });

    listenersRef.current.forEach(listener => listener());
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => {
      const newState = { ...prev, loading };
      stateRef.current = newState;
      return newState;
    });

    listenersRef.current.forEach(listener => listener());
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState(prev => {
      const newState = { ...prev, error, loading: false };
      stateRef.current = newState;
      return newState;
    });

    listenersRef.current.forEach(listener => listener());
  }, []);

  const executeAsync = useCallback(
    async <R>(
      asyncFn: () => Promise<R>,
      onSuccess?: (result: R) => void,
      onError?: (error: Error) => void
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFn();
        setData(result as T);
        onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error as Error;
        setError(err);
        onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setData, setLoading, setError]
  );

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return {
    ...state,
    setData,
    setLoading,
    setError,
    executeAsync,
    subscribe,
    getCurrentValue: () => stateRef.current,
  };
}

/**
 * Hook for managing form state with validation
 */
export function useFormState<T extends Record<string, any>>(initialState: T) {
  const [state, setState] = useState({
    values: initialState,
    errors: {} as Record<keyof T, string>,
    touched: {} as Record<keyof T, boolean>,
    isValid: true,
    isDirty: false,
  });

  const stateRef = useRef(state);
  const initialValuesRef = useRef(initialState);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setState(prev => {
      const newValues = { ...prev.values, [field]: value };
      const newErrors = { ...prev.errors };
      delete newErrors[field]; // Clear error when user types

      const isDirty = JSON.stringify(newValues) !== JSON.stringify(initialValuesRef.current);

      return {
        ...prev,
        values: newValues,
        errors: newErrors,
        isDirty,
        isValid: Object.keys(newErrors).length === 0,
      };
    });
  }, []);

  const setFieldError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
      isValid: false,
    }));
  }, []);

  const setFieldTouched = useCallback(<K extends keyof T>(field: K, touched: boolean) => {
    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: touched },
    }));
  }, []);

  const setErrors = useCallback((errors: Record<keyof T, string>) => {
    setState(prev => ({
      ...prev,
      errors,
      isValid: Object.keys(errors).length === 0,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      values: initialValuesRef.current,
      errors: {},
      touched: {},
      isValid: true,
      isDirty: false,
    });
  }, []);

  const resetToValues = useCallback((newValues: T) => {
    initialValuesRef.current = newValues;
    setState({
      values: newValues,
      errors: {},
      touched: {},
      isValid: true,
      isDirty: false,
    });
  }, []);

  return {
    ...state,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setErrors,
    reset,
    resetToValues,
    getCurrentValue: () => stateRef.current,
  };
}
