import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { BibleVersion } from '@/types/bible';

const VERSION_STORAGE_KEY = 'bible-version';

const VERSION_NAMES: Record<BibleVersion, string> = {
  krv: '개역개정',
  nkrv: '새번역',
};

interface BibleVersionContextValue {
  version: BibleVersion;
  setVersion: (v: BibleVersion) => void;
  versionName: string;
}

const BibleVersionContext = createContext<BibleVersionContextValue | undefined>(
  undefined,
);

function getStoredVersion(): BibleVersion {
  try {
    const stored = localStorage.getItem(VERSION_STORAGE_KEY);
    if (stored === 'krv' || stored === 'nkrv') return stored;
  } catch {
    // localStorage may be unavailable
  }
  return 'krv';
}

export function BibleVersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersionState] = useState<BibleVersion>(getStoredVersion);

  const setVersion = useCallback((v: BibleVersion) => {
    setVersionState(v);
    try {
      localStorage.setItem(VERSION_STORAGE_KEY, v);
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  const versionName = VERSION_NAMES[version];

  return (
    <BibleVersionContext.Provider value={{ version, setVersion, versionName }}>
      {children}
    </BibleVersionContext.Provider>
  );
}

export function useBibleVersion(): BibleVersionContextValue {
  const context = useContext(BibleVersionContext);
  if (context === undefined) {
    throw new Error(
      'useBibleVersion must be used within a BibleVersionProvider',
    );
  }
  return context;
}
