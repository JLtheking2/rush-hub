import { useEffect, useState } from 'react';

/** True once every card font has loaded; text-fitting must re-measure on change. */
const useFontsReady = (): boolean => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (typeof document === 'undefined' || !('fonts' in document)) {
      setReady(true);
      return undefined;
    }
    document.fonts.ready.then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
};

export default useFontsReady;
