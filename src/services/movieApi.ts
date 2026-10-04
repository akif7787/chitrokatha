import { Movie } from '../types/movie';
import { fetchWatchmodePopularMovies, searchWatchmodeMovies } from './watchmodeApi';

export async function fetchLiveOnlineMovies(): Promise<Movie[]> {
  try {
    return await fetchWatchmodePopularMovies();
  } catch (err) {
    console.error('WatchMode live API fetch error:', err);
    return [];
  }
}

export async function searchLiveOnlineApi(query: string): Promise<Movie[]> {
  if (!query.trim()) return [];
  try {
    return await searchWatchmodeMovies(query);
  } catch (err) {
    console.error('WatchMode search API error:', err);
    return [];
  }
}
