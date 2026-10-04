import { Movie } from '../types/movie';

export const DEFAULT_WATCHMODE_KEY = 'm7qi2uQVHnSyBp8PamGB9G8EzcSkDDCKa3hjoKN6';

export function getWatchmodeApiKey(): string {
  return localStorage.getItem('chitrokatha_watchmode_key')?.trim() || DEFAULT_WATCHMODE_KEY;
}

export function setWatchmodeApiKey(key: string): void {
  localStorage.setItem('chitrokatha_watchmode_key', key.trim());
}

export interface WatchmodeSource {
  source_id: number;
  name: string;
  type: 'free' | 'sub' | 'rent' | 'buy';
  region?: string;
  web_url: string;
  format?: '4K' | 'HD' | 'SD';
  price?: number | null;
}

export interface WatchmodeTitleDetail {
  id: number;
  title: string;
  original_title?: string;
  plot_overview?: string;
  type: string;
  year?: number;
  release_date?: string;
  imdb_id?: string;
  tmdb_id?: number;
  tmdb_type?: string;
  genres?: number[];
  genre_names?: string[];
  runtime_minutes?: number;
  user_rating?: number;
  critic_score?: number;
  poster?: string;
  backdrop?: string;
  trailer?: string;
  trailer_thumbnail?: string;
  sources?: WatchmodeSource[];
}

export interface WatchmodeSearchResult {
  id: number;
  name: string;
  type: string;
  year?: number;
  imdb_id?: string;
  tmdb_id?: number;
}

export interface WatchmodeQuotaStatus {
  quota: number;
  quotaUsed: number;
}

// Check real quota from WatchMode API
export async function fetchWatchmodeStatus(): Promise<WatchmodeQuotaStatus | null> {
  const key = getWatchmodeApiKey();
  try {
    const res = await fetch(`https://api.watchmode.com/v1/status/?apiKey=${key}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('WatchMode status check error:', err);
    return null;
  }
}

// Convert WatchMode title detail to Movie type
export function transformWatchmodeToMovie(item: WatchmodeTitleDetail): Movie {
  const rating = item.user_rating ? Number(item.user_rating.toFixed(1)) : 8.0;
  const year = item.year || 2024;
  const runtimeMin = item.runtime_minutes || 115;
  const poster = item.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';
  const backdrop = item.backdrop || poster;
  const genres = item.genre_names && item.genre_names.length > 0 ? item.genre_names : ['Cinema', 'Drama'];

  // Map sources
  const mappedServers = (item.sources || []).map((s) => ({
    id: `wm-${s.source_id}-${s.name.replace(/\s+/g, '-').toLowerCase()}`,
    nameBn: `${s.name} (${s.type === 'free' ? 'সম্পূর্ণ ফ্রি' : 'অফিসিয়াল ওটিটি'})`,
    nameEn: `${s.name} (${s.type === 'free' ? '100% Free' : 'Official OTT'})`,
    url: s.web_url,
    quality: s.format === '4K' ? '4K' : 'HD',
    type: s.type === 'free' ? 'archive' as const : 'embed' as const,
  }));

  // Extract YouTube ID if trailer is a YouTube URL
  let trailerYt = '';
  if (item.trailer) {
    const match = item.trailer.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) trailerYt = match[1];
  }

  return {
    id: `wm-${item.id}`,
    imdbId: item.imdb_id || `tt${item.id}`,
    tmdbId: item.tmdb_id || item.id,
    titleBn: item.title,
    titleEn: item.title,
    synopsisBn: item.plot_overview || 'ওয়াচমোড এপিআই থেকে সরাসরি সংগৃহীত সারসংক্ষেপ।',
    synopsisEn: item.plot_overview || 'No synopsis provided by WatchMode API.',
    year,
    rating,
    runtime: `${runtimeMin} মিনিট`,
    runtimeBn: `${runtimeMin} মিনিট`,
    genres,
    genresBn: genres,
    director: 'WatchMode Verified Production',
    directorBn: 'ওয়াচমোড ভেরিফাইড প্রযোজনা',
    cast: ['Leading Cast & Stars'],
    castBn: ['মূল অভিনয়শিল্পী দল'],
    poster,
    backdrop,
    streamingServers: mappedServers.length > 0 ? mappedServers : [
      {
        id: 'wm-default',
        nameBn: 'ওয়াচমোড ক্লাউড স্ট্রিম',
        nameEn: 'WatchMode Cloud Stream',
        url: item.trailer || 'https://www.youtube.com/watch?v=Jvurpf91omw',
        quality: '1080p FHD',
        type: 'embed',
      }
    ],
    category: 'hollywood',
    origin: 'curated',
    quality: '1080p FHD',
    audio: ['English'],
    subtitles: ['English', 'বাংলা'],
    archiveEmbedUrl: trailerYt ? `https://www.youtube-nocookie.com/embed/${trailerYt}` : undefined,
  };
}

// Search WatchMode by title
export async function searchWatchmodeMovies(query: string): Promise<Movie[]> {
  if (!query.trim()) return [];
  const key = getWatchmodeApiKey();
  try {
    const res = await fetch(
      `https://api.watchmode.com/v1/search/?apiKey=${key}&search_field=name&search_value=${encodeURIComponent(query)}`
    );
    if (!res.ok) return [];
    const data: { title_results?: WatchmodeSearchResult[] } = await res.json();
    if (!data.title_results || data.title_results.length === 0) return [];

    // Fetch details for top 4 search results
    const detailPromises = data.title_results.slice(0, 4).map(async (item) => {
      try {
        const detailRes = await fetch(
          `https://api.watchmode.com/v1/title/${item.id}/details/?apiKey=${key}&append_to_response=sources`
        );
        if (!detailRes.ok) return null;
        const detail: WatchmodeTitleDetail = await detailRes.json();
        return transformWatchmodeToMovie(detail);
      } catch {
        return null;
      }
    });

    const movies = await Promise.all(detailPromises);
    return movies.filter((m): m is Movie => m !== null);
  } catch (err) {
    console.error('WatchMode search error:', err);
    return [];
  }
}

// Fetch popular trending titles from WatchMode API
export async function fetchWatchmodePopularMovies(): Promise<Movie[]> {
  const key = getWatchmodeApiKey();
  try {
    const res = await fetch(
      `https://api.watchmode.com/v1/list-titles/?apiKey=${key}&types=movie&limit=8&sort_by=popularity_desc`
    );
    if (!res.ok) return [];
    const data: { titles?: Array<{ id: number; title: string; year: number; imdb_id: string; tmdb_id: number }> } = await res.json();
    if (!data.titles || data.titles.length === 0) return [];

    // Fetch details for first 5 titles
    const detailPromises = data.titles.slice(0, 5).map(async (t) => {
      try {
        const detailRes = await fetch(
          `https://api.watchmode.com/v1/title/${t.id}/details/?apiKey=${key}&append_to_response=sources`
        );
        if (!detailRes.ok) return null;
        const detail: WatchmodeTitleDetail = await detailRes.json();
        return transformWatchmodeToMovie(detail);
      } catch {
        return null;
      }
    });

    const movies = await Promise.all(detailPromises);
    return movies.filter((m): m is Movie => m !== null);
  } catch (err) {
    console.warn('WatchMode popular fetch error:', err);
    return [];
  }
}

// Fetch Watchmode sources for a movie
export async function fetchWatchmodeSourcesByImdb(imdbId: string): Promise<WatchmodeSource[]> {
  if (!imdbId) return [];
  const key = getWatchmodeApiKey();
  try {
    const searchRes = await fetch(
      `https://api.watchmode.com/v1/search/?apiKey=${key}&search_field=imdb_id&search_value=${imdbId}`
    );
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const titleId = searchData.title_results?.[0]?.id;
    if (!titleId) return [];

    const sourcesRes = await fetch(
      `https://api.watchmode.com/v1/title/${titleId}/sources/?apiKey=${key}`
    );
    if (!sourcesRes.ok) return [];
    const sourcesData: WatchmodeSource[] = await sourcesRes.json();
    return Array.isArray(sourcesData) ? sourcesData.slice(0, 6) : [];
  } catch (err) {
    console.warn('Watchmode sources error:', err);
    return [];
  }
}

export type StreamingSource = WatchmodeSource;
export const fetchWatchmodeSources = fetchWatchmodeSourcesByImdb;
