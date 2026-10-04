import { Movie } from '../types/movie';

const STORAGE_KEY = 'chitrokatha_admin_movies';

export function getAdminMovies(): Movie[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading admin movies from storage:', err);
    return [];
  }
}

export function saveAdminMovie(movie: Movie): Movie[] {
  try {
    const current = getAdminMovies();
    const existingIndex = current.findIndex((m) => String(m.id) === String(movie.id));
    let updated: Movie[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = movie;
    } else {
      updated = [movie, ...current];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving admin movie:', err);
    return getAdminMovies();
  }
}

export function deleteAdminMovie(id: string | number): Movie[] {
  try {
    const current = getAdminMovies();
    const updated = current.filter((m) => String(m.id) !== String(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error deleting admin movie:', err);
    return getAdminMovies();
  }
}
