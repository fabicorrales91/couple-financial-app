import * as React from "react";

/**
 * Anima la transicion de un numero desde su valor anterior hasta el nuevo,
 * tipo "odometro". Devuelve el valor intermedio a renderizar en cada frame.
 */
export function useAnimatedNumber(target: number, durationMs = 700) {
  const [displayValue, setDisplayValue] = React.useState(target);
  const fromRef = React.useRef(target);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const from = fromRef.current;
    const to = target;

    if (from === to) {
      setDisplayValue(to);
      return;
    }

    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      // ease-out cubic: transicion suave que desacelera al final
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return displayValue;
}
