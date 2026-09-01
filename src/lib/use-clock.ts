import { useEffect, useRef, useState } from "react";

/** Elapsed seconds since the clock started. Frame-driven, client only. */
export function useClock(active = true) {
  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = (now: number) => {
      if (start.current === null) start.current = now;
      setElapsed((now - start.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return elapsed;
}

/** Calls onFinish once when elapsed passes the given duration. */
export function useFinishAt(elapsed: number, at: number, onFinish: () => void) {
  const done = useRef(false);
  useEffect(() => {
    if (!done.current && elapsed >= at) {
      done.current = true;
      onFinish();
    }
  }, [elapsed, at, onFinish]);
}
