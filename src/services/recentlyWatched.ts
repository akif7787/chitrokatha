import { Movie } from '../types/movie';
import { curatedMovies } from '../data/moviesData';

const STORAGE_KEY = 'chitrokatha_recently_watched';
const INITIALIZED_KEY = 'chitrokatha_recently_watched_init';
const MAX_RECENT_ITEMS = 10;

export interface RecentlyWatchedItem {
  movie: Movie;
  watchedAt: number; // timestamp
  progressPercent?: number;
}

export const getRecentlyWatched = (): RecentlyWatchedItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_RECENT_ITEMS);
      }
    }

    // If user has not cleared history and never interacted, seed initial 4 popular movies
    const isInitialized = localStorage.getItem(INITIALIZED_KEY);
    if (!isInitialized && curatedMovies && curatedMovies.length > 0) {
      const initialSeed: RecentlyWatchedItem[] = curatedMovies.slice(0, 4).map((m, idx) => ({
        movie: m,
        watchedAt: Date.now() - (idx + 1) * 3600000,
        progressPercent: [75, 45, 90, 60][idx] || 50,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeed));
      localStorage.setItem(INITIALIZED_KEY, 'true');
      return initialSeed;
    }
  } catch (e) {
    console.error('Failed to load recently watched:', e);
  }
  return [];
};

export const saveRecentlyWatched = (items: RecentlyWatchedItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_RECENT_ITEMS)));
  } catch (e) {
    console.error('Failed to save recently watched:', e);
  }
};

export const recordMovieInteraction = (movie: Movie): RecentlyWatchedItem[] => {
  try {
    const current = getRecentlyWatched();
    // Remove if already exists to move it to the top (MRU - Most Recently Used)
    const filtered = current.filter((item) => String(item.movie.id) !== String(movie.id));
    
    // Pseudo random or realistic progress (e.g. 45% - 85% or 100%)
    const pseudoProgress = Math.floor(Math.random() * 40) + 45;

    const updated: RecentlyWatchedItem[] = [
      {
        movie,
        watchedAt: Date.now(),
        progressPercent: pseudoProgress,
      },
      ...filtered,
    ].slice(0, MAX_RECENT_ITEMS);

    saveRecentlyWatched(updated);
    // Dispatch custom event so any listening component updates instantaneously
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recently_watched_updated', { detail: updated }));
    }
    return updated;
  } catch (e) {
    console.error('Failed to record movie interaction:', e);
    return [];
  }
};

export const clearRecentlyWatched = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recently_watched_updated', { detail: [] }));
    }
  } catch (e) {
    console.error('Failed to clear recently watched:', e);
  }
};
