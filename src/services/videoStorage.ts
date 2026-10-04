// IndexedDB service for storing local direct movie video files and posters
const DB_NAME = 'ChitroKathaMediaDB';
const DB_VERSION = 1;
const STORE_VIDEOS = 'movie_videos';
const STORE_POSTERS = 'movie_posters';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db: IDBDatabase = event.target.result;
      if (!db.objectStoreNames.contains(STORE_VIDEOS)) {
        db.createObjectStore(STORE_VIDEOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_POSTERS)) {
        db.createObjectStore(STORE_POSTERS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save direct uploaded video file Blob
export async function saveVideoBlob(movieId: string | number, file: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VIDEOS, 'readwrite');
    const store = tx.objectStore(STORE_VIDEOS);
    store.put({ id: String(movieId), blob: file, name: (file as any).name || 'movie.mp4', type: file.type });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Retrieve direct uploaded video file Blob and create blob URL
export async function getVideoBlobUrl(movieId: string | number): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VIDEOS, 'readonly');
    const store = tx.objectStore(STORE_VIDEOS);
    const req = store.get(String(movieId));

    req.onsuccess = () => {
      if (req.result && req.result.blob) {
        const url = URL.createObjectURL(req.result.blob);
        resolve(url);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// Delete video blob from IndexedDB
export async function deleteVideoBlob(movieId: string | number): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_VIDEOS, 'readwrite');
    tx.objectStore(STORE_VIDEOS).delete(String(movieId));
  } catch (err) {
    console.warn('Failed to delete video blob from DB:', err);
  }
}

/**
 * Smart URL converter:
 * Handles:
 * 1. YouTube links (youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/...) -> converts to embed
 * 2. Google Drive links (drive.google.com/file/d/ID/..., drive.google.com/open?id=ID) -> converts to /preview embed
 * 3. Direct video files (.mp4, .webm, blob:) -> direct stream
 */
export function resolveStreamingMedia(urlOrId: string): {
  type: 'youtube' | 'gdrive' | 'direct' | 'embed';
  resolvedUrl: string;
} {
  const trimmed = (urlOrId || '').trim();
  if (!trimmed) {
    return { type: 'direct', resolvedUrl: '' };
  }

  // 1. YouTube Link Detection
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      resolvedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
    };
  }

  // 2. Google Drive Link Detection
  // e.g., https://drive.google.com/file/d/1A2B3C4D5E.../view?usp=sharing
  // or https://drive.google.com/open?id=1A2B3C4D5E...
  const gDriveMatch1 = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  const gDriveMatch2 = trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/i);
  const driveId = gDriveMatch1?.[1] || gDriveMatch2?.[1];

  if (driveId) {
    return {
      type: 'gdrive',
      resolvedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
    };
  }

  // 3. Direct MP4 / WebM / Media Blob URL
  if (
    trimmed.startsWith('blob:') ||
    trimmed.includes('.mp4') ||
    trimmed.includes('.webm') ||
    trimmed.includes('.mkv') ||
    trimmed.includes('.m3u8')
  ) {
    return {
      type: 'direct',
      resolvedUrl: trimmed,
    };
  }

  // 4. Default Embed
  return {
    type: 'embed',
    resolvedUrl: trimmed,
  };
}
