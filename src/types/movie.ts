export type Language = 'bn' | 'en';

export type ContentType = 'movie' | 'drama' | 'series';
export type ContentIndustry = 'bangla' | 'hindi' | 'english' | 'pakistani' | 'korean' | 'other';

export interface StreamingServer {
  id: string;
  nameBn: string;
  nameEn: string;
  url: string;
  quality: string;
  type: 'embed' | 'stream' | 'archive';
}

export interface Movie {
  id: string | number;
  imdbId: string;
  tmdbId: string | number;
  titleBn: string;
  titleEn: string;
  synopsisBn: string;
  synopsisEn: string;
  year: number;
  rating: number; // e.g. 8.5
  runtime: string;
  runtimeBn?: string;
  genres: string[];
  genresBn: string[];
  director: string;
  directorBn: string;
  cast: string[];
  castBn: string[];
  poster: string;
  backdrop: string;
  streamingServers: StreamingServer[];
  category: 'bangla' | 'hollywood' | 'bollywood' | 'series' | 'natok' | 'classic' | 'trending';
  contentType?: ContentType;
  industry?: ContentIndustry;
  origin: 'curated' | 'tvmaze' | 'omdb' | 'archive' | 'admin';
  isFeatured?: boolean;
  isTop10?: number;
  isTrending?: boolean;
  viewsCount?: string;
  trailerUrl?: string;
  isFreeWithAds?: boolean;
  quality: '4K UHD' | '1080p FHD' | 'HD';
  audio: string[];
  subtitles: string[];
  boxOffice?: string;
  awards?: string;
  rottenTomatoesScore?: string;
  metacriticScore?: string;
  archiveEmbedUrl?: string;
  directStreamUrl?: string;
  isComingSoon?: boolean;
  expectedReleaseDate?: string;
  expectedReleaseDateBn?: string;
}

export interface UserReview {
  id: string;
  movieId: string | number;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
}

export interface WatchHistoryItem {
  movieId: string | number;
  progressPercent: number;
  lastWatched: string;
}
