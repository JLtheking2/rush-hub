import { fontLoadSpecs } from '@utils/fonts';
import { useEffect, useState } from 'react';

let loading: Promise<void> | null = null;

/**
 * `document.fonts.ready` can resolve before a lazily-loaded face has even
 * started, so request every registered face explicitly.
 */
const loadCardFonts = (): Promise<void> => {
  if (!loading) {
    loading = Promise.all(
      fontLoadSpecs.map(spec => document.fonts.load(spec).catch(() => [])),
    )
      .then(() => document.fonts.ready)
      .then(() => undefined);
  }
  return loading;
};

/** True once every card font has loaded; text-fitting must re-measure on change. */
const useFontsReady = (): boolean => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (typeof document === 'undefined' || !('fonts' in document)) {
      setReady(true);
      return undefined;
    }
    loadCardFonts().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
};

export default useFontsReady;
