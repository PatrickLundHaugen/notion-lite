import { useState, useEffect } from 'react';

// This custom hook takes a value and a delay, and returns a "debounced"
// version of that value. The returned value will only update after the
// original value has stopped changing for the specified delay period.
export function useDebounce<T>(value: T, delay: number): T {
  // State to hold the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // This is the cleanup function. It runs whenever the `value` or `delay`
    // changes. It cancels the previous timer, preventing the old (stale)
    // value from being set.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-run the effect if value or delay changes

  return debouncedValue;
}