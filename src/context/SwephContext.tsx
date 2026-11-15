import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { loadFonts } from '../lib/fonts';
import { SwEph, swephInit } from '../lib/sweph';

const SwephContext = createContext<SwEph | null>(null);

/**
 * Loads the Swiss Ephemeris WASM module and the glyph fonts, and renders its
 * children once both are ready.
 */
export function SwephProvider({ children }: { children: ReactNode }) {
  const [sweph, setSweph] = useState<SwEph | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([swephInit(), loadFonts()])
      .then(([sweph]) => {
        if (!cancelled) setSweph(sweph);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p role="alert" className="p-8 text-center text-rose-400">
        Failed to load: {error}
      </p>
    );
  }
  if (!sweph) {
    return <p className="p-8 text-center text-slate-500">Loading…</p>;
  }
  return (
    <SwephContext.Provider value={sweph}>{children}</SwephContext.Provider>
  );
}

export function useSweph(): SwEph {
  const sweph = useContext(SwephContext);
  if (!sweph) throw new Error('useSweph must be used within a SwephProvider');
  return sweph;
}
