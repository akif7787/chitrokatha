import { Movie } from '../types/movie';

const DB_NAME = 'ChitroKathaOfflineCacheDB';
const DB_VERSION = 1;
const STORE_WATCHLIST = 'offline_watchlist';
const STORE_FAVORITES = 'offline_favorites';
const STORE_POSTERS = 'offline_posters';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_WATCHLIST)) {
        db.createObjectStore(STORE_WATCHLIST, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_FAVORITES)) {
        db.createObjectStore(STORE_FAVORITES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_POSTERS)) {
        db.createObjectStore(STORE_POSTERS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cache poster image as Base64 in IndexedDB for reliable offline rendering
 */
export async function cachePosterImage(movieId: string | number, posterUrl: string): Promise<string | null> {
  if (!posterUrl || posterUrl.startsWith('data:') || posterUrl.startsWith('blob:')) {
    return posterUrl;
  }

  try {
    const db = await openDB();
    // Check if already cached
    const existing = await new Promise<{ dataUrl: string } | null>((resolve) => {
      const tx = db.transaction(STORE_POSTERS, 'readonly');
      const req = tx.objectStore(STORE_POSTERS).get(String(movieId));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (existing && existing.dataUrl) {
      return existing.dataUrl;
    }

    // Fetch and convert to base64
    const response = await fetch(posterUrl, { mode: 'cors' });
    if (!response.ok) return null;

    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Save to IndexedDB
    const tx = db.transaction(STORE_POSTERS, 'readwrite');
    tx.objectStore(STORE_POSTERS).put({
      id: String(movieId),
      url: posterUrl,
      dataUrl,
      cachedAt: new Date().toISOString(),
    });

    return dataUrl;
  } catch (err) {
    // Graceful fallback on CORS or network error
    return null;
  }
}

/**
 * Retrieve cached poster DataURL from IndexedDB
 */
export async function getCachedPoster(movieId: string | number): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_POSTERS, 'readonly');
      const req = tx.objectStore(STORE_POSTERS).get(String(movieId));
      req.onsuccess = () => resolve(req.result?.dataUrl || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Synchronize full Watchlist movies into IndexedDB
 */
export async function syncWatchlistToIndexedDB(movies: Movie[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_WATCHLIST, 'readwrite');
    const store = tx.objectStore(STORE_WATCHLIST);

    // Clear old entries and insert fresh list
    store.clear();
    for (const movie of movies) {
      store.put({
        ...movie,
        id: String(movie.id),
        cachedAt: new Date().toISOString(),
      });
      // Background cache poster in parallel
      if (movie.poster) {
        cachePosterImage(movie.id, movie.poster).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Could not sync Watchlist to IndexedDB:', err);
  }
}

/**
 * Load Watchlist movies from IndexedDB
 */
export async function loadWatchlistFromIndexedDB(): Promise<Movie[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_WATCHLIST, 'readonly');
      const req = tx.objectStore(STORE_WATCHLIST).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Synchronize full Favorites movies into IndexedDB
 */
export async function syncFavoritesToIndexedDB(movies: Movie[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_FAVORITES, 'readwrite');
    const store = tx.objectStore(STORE_FAVORITES);

    // Clear old entries and insert fresh list
    store.clear();
    for (const movie of movies) {
      store.put({
        ...movie,
        id: String(movie.id),
        cachedAt: new Date().toISOString(),
      });
      // Background cache poster in parallel
      if (movie.poster) {
        cachePosterImage(movie.id, movie.poster).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Could not sync Favorites to IndexedDB:', err);
  }
}

/**
 * Load Favorites movies from IndexedDB
 */
export async function loadFavoritesFromIndexedDB(): Promise<Movie[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_FAVORITES, 'readonly');
      const req = tx.objectStore(STORE_FAVORITES).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Get Offline Storage statistics
 */
export async function getOfflineStorageStats(): Promise<{
  watchlistCount: number;
  favoritesCount: number;
  cachedPostersCount: number;
  isAvailable: boolean;
}> {
  try {
    const db = await openDB();

    const [wCount, fCount, pCount] = await Promise.all([
      new Promise<number>((res) => {
        const req = db.transaction(STORE_WATCHLIST, 'readonly').objectStore(STORE_WATCHLIST).count();
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(0);
      }),
      new Promise<number>((res) => {
        const req = db.transaction(STORE_FAVORITES, 'readonly').objectStore(STORE_FAVORITES).count();
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(0);
      }),
      new Promise<number>((res) => {
        const req = db.transaction(STORE_POSTERS, 'readonly').objectStore(STORE_POSTERS).count();
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(0);
      }),
    ]);

    return {
      watchlistCount: wCount,
      favoritesCount: fCount,
      cachedPostersCount: pCount,
      isAvailable: true,
    };
  } catch {
    return {
      watchlistCount: 0,
      favoritesCount: 0,
      cachedPostersCount: 0,
      isAvailable: false,
    };
  }
}
