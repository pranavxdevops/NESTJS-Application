import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  end: number;
  duration?: number; // milliseconds
}

export default function AnimatedCounter({ end, duration = 5000 }: AnimatedCounterProps) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const value = Math.round(progress * end);
      setCurrent(value);
      if (progress < 1) {
        ref.current = requestAnimationFrame(step);
      }
    };

    ref.current = requestAnimationFrame(step);

    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
      startRef.current = null;
    };
  }, [end, duration]);

  return <span>{current.toLocaleString()}</span>;
}