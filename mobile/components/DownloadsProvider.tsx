import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Toast from 'react-native-toast-message';
import * as FileSystem from 'expo-file-system/legacy';

import type { Episode } from 'constants/types';

// Where downloaded audio + the manifest live on-device.
const DIR = (FileSystem.documentDirectory ?? '') + 'downloads/';
const MANIFEST = DIR + 'manifest.json';

interface Entry {
  episode: Episode;
  ext: string;
  bytes: number;
}
type Manifest = Record<string, Entry>;

// Files are keyed by episode id + extension; we rebuild the absolute uri each
// launch from the current documentDirectory (it can change across reinstalls).
const uriFor = (id: string, ext: string) => `${DIR}${id}.${ext}`;

/** Reactive download state — re-renders consumers as downloads/progress change. */
export interface DownloadsState {
  downloads: Manifest;
  /** episodeId → 0..1 while a download is in flight. */
  progress: Record<string, number>;
}

/** Stable actions — identity never changes, safe for other providers to hold. */
export interface DownloadsApi {
  download: (episode: Episode) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** Local file uri for an episode if downloaded, else null (for offline play). */
  localUri: (id: string) => string | null;
}

const StateContext = createContext<DownloadsState | null>(null);
const ApiContext = createContext<DownloadsApi | null>(null);

export function DownloadsProvider({ children }: { children: ReactNode }) {
  const manifestRef = useRef<Manifest>({});
  const inflight = useRef<Set<string>>(new Set());
  const [downloads, setDownloads] = useState<Manifest>({});
  const [progress, setProgress] = useState<Record<string, number>>({});

  const persist = useCallback((m: Manifest) => {
    FileSystem.writeAsStringAsync(MANIFEST, JSON.stringify(m)).catch(() => {});
  }, []);

  const apply = useCallback(
    (m: Manifest) => {
      manifestRef.current = m;
      setDownloads(m);
      persist(m);
    },
    [persist]
  );

  const setProg = useCallback((id: string, v: number | null) => {
    setProgress((p) => {
      const next = { ...p };
      if (v == null) delete next[id];
      else next[id] = v;
      return next;
    });
  }, []);

  // Load the saved manifest on mount, pruning any entries whose files vanished.
  useEffect(() => {
    (async () => {
      try {
        if (!FileSystem.documentDirectory) return;
        const info = await FileSystem.getInfoAsync(MANIFEST);
        if (!info.exists) return;
        const parsed: Manifest = JSON.parse(await FileSystem.readAsStringAsync(MANIFEST));
        const pruned: Manifest = {};
        for (const [id, e] of Object.entries(parsed)) {
          const fi = await FileSystem.getInfoAsync(uriFor(id, e.ext));
          if (fi.exists) pruned[id] = e;
        }
        manifestRef.current = pruned;
        setDownloads(pruned);
        if (Object.keys(pruned).length !== Object.keys(parsed).length) persist(pruned);
      } catch {
        /* ignore a missing/corrupt manifest */
      }
    })();
  }, [persist]);

  const api = useMemo<DownloadsApi>(
    () => ({
      localUri: (id) => {
        const e = manifestRef.current[id];
        return e ? uriFor(id, e.ext) : null;
      },

      download: async (episode) => {
        const id = episode.id;
        if (!episode.audioUrl || !FileSystem.documentDirectory) return;
        if (manifestRef.current[id] || inflight.current.has(id)) return;

        inflight.current.add(id);
        setProg(id, 0);
        try {
          await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
          const ext = (episode.audioUrl.split('?')[0].match(/\.(\w+)$/)?.[1] || 'mp3').toLowerCase();
          const dest = uriFor(id, ext);
          const task = FileSystem.createDownloadResumable(episode.audioUrl, dest, {}, (p) => {
            const total = p.totalBytesExpectedToWrite;
            if (total > 0) setProg(id, p.totalBytesWritten / total);
          });
          const res = await task.downloadAsync();
          if (!res?.uri) throw new Error('Download failed');
          const fi = await FileSystem.getInfoAsync(res.uri);
          const bytes = fi.exists ? (fi.size ?? 0) : 0;
          apply({ ...manifestRef.current, [id]: { episode, ext, bytes } });
        } catch {
          Toast.show({
            type: 'error',
            text1: 'Download failed',
            text2: 'Could not save this episode for offline.',
          });
        } finally {
          inflight.current.delete(id);
          setProg(id, null);
        }
      },

      remove: async (id) => {
        const e = manifestRef.current[id];
        if (e) await FileSystem.deleteAsync(uriFor(id, e.ext), { idempotent: true }).catch(() => {});
        const next = { ...manifestRef.current };
        delete next[id];
        apply(next);
      },
    }),
    [apply, setProg]
  );

  const stateValue = useMemo<DownloadsState>(
    () => ({ downloads, progress }),
    [downloads, progress]
  );

  return (
    <ApiContext.Provider value={api}>
      <StateContext.Provider value={stateValue}>{children}</StateContext.Provider>
    </ApiContext.Provider>
  );
}

export function useDownloads(): DownloadsState {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useDownloads must be used within a <DownloadsProvider>');
  return ctx;
}

export function useDownloadActions(): DownloadsApi {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useDownloadActions must be used within a <DownloadsProvider>');
  return ctx;
}
