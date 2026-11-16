import { useState } from 'react';

export interface Codec<T> {
  /** Returns undefined when the stored value is unusable. */
  parse: (raw: string) => T | undefined;
  serialize: (value: T) => string;
}

export const stringCodec: Codec<string> = {
  parse: (raw) => raw || undefined,
  serialize: (value) => value,
};

export const booleanCodec: Codec<boolean> = {
  parse: (raw) => (raw === 'true' ? true : raw === 'false' ? false : undefined),
  serialize: (value) => String(value),
};

/**
 * Like useState, but the initial value is read from localStorage and every
 * update is written back to it. The default is not stored until it is changed.
 */
export function usePersistentState<T>(
  key: string,
  initial: () => T,
  codec: Codec<T>,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = codec.parse(raw);
      if (parsed !== undefined) return parsed;
      localStorage.removeItem(key);
    }
    return initial();
  });

  const setAndStore = (next: T) => {
    localStorage.setItem(key, codec.serialize(next));
    setValue(next);
  };

  return [value, setAndStore];
}
