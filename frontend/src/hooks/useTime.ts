import { useState, useEffect } from 'react';

export function useTime(updateInterval: number = 10000) { // every 10 seconds
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [updateInterval]);

  return time;
}