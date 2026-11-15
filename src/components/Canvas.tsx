import { useEffect, useRef, type CanvasHTMLAttributes } from 'react';

interface CanvasProps extends CanvasHTMLAttributes<HTMLCanvasElement> {
  /** Size in CSS pixels, which is also the coordinate space of `draw`. */
  width: number;
  height: number;
  /** Paints the canvas. Called with a cleared context whenever it changes. */
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export function Canvas({ draw, width, height, ...props }: CanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  // Back the canvas with device pixels, or it is blurry on phone screens.
  const scale = window.devicePixelRatio || 1;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    // reset() also restores the drawing state, but is missing in old browsers
    const resettable = ctx as CanvasRenderingContext2D & { reset?: () => void };
    if (resettable.reset) {
      resettable.reset();
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    ctx.scale(scale, scale);
    draw(ctx);
  }, [draw, width, height, scale]);

  return (
    <canvas
      ref={ref}
      width={Math.round(width * scale)}
      height={Math.round(height * scale)}
      style={{ width, height }}
      {...props}
    />
  );
}
