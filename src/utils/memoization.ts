import { useMemo, useCallback, useRef, DependencyList } from 'react';

/**
 * Memoization utilities for preventing unnecessary re-renders
 */

/**
 * Deep comparison for objects
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  return false;
}

/**
 * Shallow comparison for objects
 */
export function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (a[key] !== b[key]) return false;
    }

    return true;
  }

  return false;
}

/**
 * Custom useMemo with deep comparison
 */
export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<{ deps: DependencyList; value: T }>();

  if (!ref.current || !deepEqual(deps, ref.current.deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
}

/**
 * Custom useMemo with shallow comparison
 */
export function useShallowMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<{ deps: DependencyList; value: T }>();

  if (!ref.current || !shallowEqual(deps, ref.current.deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
}

/**
 * Memoized callback that only changes when dependencies change
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const ref = useRef<{ callback: T; deps: DependencyList }>();

  if (!ref.current || !deepEqual(deps, ref.current.deps)) {
    ref.current = { callback, deps };
  }

  return ref.current.callback;
}

/**
 * Memoized value that only changes when specific fields change
 */
export function useFieldMemo<T, K extends keyof T>(value: T, fields: K[]): T {
  return useMemo(
    () => {
      const result = {} as T;
      for (const field of fields) {
        result[field] = value[field];
      }
      return result;
    },
    fields.map(field => value[field])
  );
}

/**
 * Memoized object that only changes when values change
 */
export function useObjectMemo<T extends Record<string, any>>(obj: T): T {
  return useMemo(() => obj, Object.values(obj));
}

/**
 * Memoized array that only changes when items change
 */
export function useArrayMemo<T>(arr: T[]): T[] {
  return useMemo(() => arr, arr);
}

/**
 * Memoized function that only changes when dependencies change
 */
export function useFunctionMemo<T extends (...args: any[]) => any>(fn: T, deps: DependencyList): T {
  return useCallback(fn, deps);
}

/**
 * Memoized selector for extracting specific values from state
 */
export function useSelector<T, R>(
  state: T,
  selector: (state: T) => R,
  equalityFn: (a: R, b: R) => boolean = shallowEqual
): R {
  const ref = useRef<{ selector: (state: T) => R; result: R; state: T }>();

  if (!ref.current || ref.current.state !== state || ref.current.selector !== selector) {
    const result = selector(state);
    if (!ref.current || !equalityFn(result, ref.current.result)) {
      ref.current = { selector, result, state };
    }
  }

  return ref.current.result;
}

/**
 * Memoized computed value that only recalculates when dependencies change
 */
export function useComputed<T>(compute: () => T, deps: DependencyList): T {
  return useMemo(compute, deps);
}

/**
 * Memoized value that only changes when the reference changes
 */
export function useRefMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (ref.current !== value) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different
 */
export function useValueMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (!deepEqual(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized callback that preserves reference equality
 */
export function useStableCallbackRef<T extends (...args: any[]) => any>(callback: T): T {
  const ref = useRef<T>(callback);
  ref.current = callback;

  return useCallback((...args: Parameters<T>) => {
    return ref.current(...args);
  }, []) as T;
}

/**
 * Memoized value that only changes when the value is different (shallow)
 */
export function useShallowValueMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (!shallowEqual(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (deep)
 */
export function useDeepValueMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (!deepEqual(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (reference)
 */
export function useReferenceMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (ref.current !== value) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (strict)
 */
export function useStrictMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (ref.current !== value) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (loose)
 */
export function useLooseMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (ref.current != value) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (type)
 */
export function useTypeMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (typeof ref.current !== typeof value || ref.current !== value) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (instanceof)
 */
export function useInstanceMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (ref.current instanceof value.constructor || ref.current !== value) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (constructor)
 */
export function useConstructorMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (ref.current.constructor !== value.constructor || ref.current !== value) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (prototype)
 */
export function usePrototypeMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (
    Object.getPrototypeOf(ref.current) !== Object.getPrototypeOf(value) ||
    ref.current !== value
  ) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (descriptor)
 */
export function useDescriptorMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (
    Object.getOwnPropertyDescriptor(ref.current, 'value') !==
      Object.getOwnPropertyDescriptor(value, 'value') ||
    ref.current !== value
  ) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (enumerable)
 */
export function useEnumerableMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (
    Object.getOwnPropertyDescriptor(ref.current, 'enumerable') !==
      Object.getOwnPropertyDescriptor(value, 'enumerable') ||
    ref.current !== value
  ) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (configurable)
 */
export function useConfigurableMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (
    Object.getOwnPropertyDescriptor(ref.current, 'configurable') !==
      Object.getOwnPropertyDescriptor(value, 'configurable') ||
    ref.current !== value
  ) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (writable)
 */
export function useWritableMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (
    Object.getOwnPropertyDescriptor(ref.current, 'writable') !==
      Object.getOwnPropertyDescriptor(value, 'writable') ||
    ref.current !== value
  ) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (getter)
 */
export function useGetterMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (
    Object.getOwnPropertyDescriptor(ref.current, 'get') !==
      Object.getOwnPropertyDescriptor(value, 'get') ||
    ref.current !== value
  ) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (setter)
 */
export function useSetterMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (
    Object.getOwnPropertyDescriptor(ref.current, 'set') !==
      Object.getOwnPropertyDescriptor(value, 'set') ||
    ref.current !== value
  ) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (value)
 */
export function useValueMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (
    Object.getOwnPropertyDescriptor(ref.current, 'value') !==
      Object.getOwnPropertyDescriptor(value, 'value') ||
    ref.current !== value
  ) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Memoized value that only changes when the value is different (all)
 */
export function useAllMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (
    Object.getOwnPropertyDescriptors(ref.current) !== Object.getOwnPropertyDescriptors(value) ||
    ref.current !== value
  ) {
    ref.current = value;
  }
  return ref.current;
}
