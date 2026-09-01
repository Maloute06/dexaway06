import { useEffect, useRef } from "react";

/**
 * Fond animé "aurora" : nappes violet / olive qui dérivent lentement
 * et suivent la souris (parallaxe). Purement décoratif.
 */
export function AuroraBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const apply = (x: number, y: number) => {
      el.style.setProperty("--mx", x.toFixed(4));
      el.style.setProperty("--my", y.toFixed(4));
    };

    apply(0.5, 0.4);

    const onMove = (e: PointerEvent | MouseEvent) => {
      apply(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    };

    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) apply(t.clientX / window.innerWidth, t.clientY / window.innerHeight);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="aurora-root">
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
      <div className="aurora-noise" />
    </div>
  );
}
