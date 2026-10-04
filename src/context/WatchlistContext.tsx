import React, { createContext, useContext, useState, useEffect } from 'react';
import { Movie, UserReview, WatchHistoryItem } from '../types/movie';
import { syncWatchlistToIndexedDB, loadWatchlistFromIndexedDB } from '../services/offlineCacheDB';

interface WatchlistContextType {
  watchlist: Movie[];
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (movieId: string | number) => void;
  isInWatchlist: (movieId: string | number) => boolean;
  toggleWatchlist: (movie: Movie) => void;
  history: WatchHistoryItem[];
  recordWatch: (movieId: string | number, progressPercent?: number) => void;
  reviews: UserReview[];
  addReview: (movieId: string | number, userName: string, rating: number, comment: string) => void;
  getMovieReviews: (movieId: string | number) => UserReview[];
}

const defaultReviews: UserReview[] = [
  {
    id: 'rev-1',
    movieId: 'hawa',
    userName: 'রাকিব হাসান (Rakib Hasan)',
    rating: 5,
    comment: 'অসাধারণ নির্মাণ শৈলী! মেজবাউর রহমান সুমন ভাইয়ের সিনেমাটোগ্রাফি আর চঞ্চল চৌধুরীর অভিনয় অসাধারণ।',
    date: '২০২৪-০২-১২'
  },
  {
    id: 'rev-2',
    movieId: 'toofan',
    userName: 'সৌম্য ব্যানার্জি (Soumya Banerjee)',
    rating: 5,
    comment: 'শাকিব খানের অ্যাকশন লুক আর মিমি চক্রবর্তীর উপস্থিতি পুরো সিনেমাকে জমিয়ে দিয়েছে। দুর্দান্ত কমার্শিয়াল সিনেমা!',
    date: '২০২৪-০৭-০১'
  },
  {
    id: 'rev-3',
    movieId: 'aynabaji',
    userName: 'Tanvir Ahmed',
    rating: 5,
    comment: 'One of the best psychological thrillers in the history of Bengali cinema. Chanchal Chowdhury at his peak.',
    date: '২০২৩-১১-১৮'
  },
  {
    id: 'rev-4',
    movieId: 'oppenheimer',
    userName: 'Farhan Kabir',
    rating: 5,
    comment: 'Christopher Nolan masterpiece. Cillian Murphy’s eyes convey haunting emotion.',
    date: '২০২৪-০১-১০'
  }
];

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<Movie[]>(() => {
    try {
      const saved = localStorage.getItem('chitrokatha_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState<WatchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('chitrokatha_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [reviews, setReviews] = useState<UserReview[]>(() => {
    try {
      const saved = localStorage.getItem('chitrokatha_reviews');
      return saved ? JSON.parse(saved) : defaultReviews;
    } catch {
      return defaultReviews;
    }
  });

  // Sync to IndexedDB for offline resilience whenever watchlist updates
  useEffect(() => {
    localStorage.setItem('chitrokatha_watchlist', JSON.stringify(watchlist));
    syncWatchlistToIndexedDB(watchlist).catch(() => {});
  }, [watchlist]);

  // On mount: hydrate from IndexedDB if localStorage was empty or cleared
  useEffect(() => {
    if (watchlist.length === 0) {
      loadWatchlistFromIndexedDB().then((cached) => {
        if (cached && cached.length > 0) {
          setWatchlist(cached);
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chitrokatha_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('chitrokatha_reviews', JSON.stringify(reviews));
  }, [reviews]);

  const addToWatchlist = (movie: Movie) => {
    if (!isInWatchlist(movie.id)) {
      setWatchlist((prev) => [movie, ...prev]);
    }
  };

  const removeFromWatchlist = (movieId: string | number) => {
    setWatchlist((prev) => prev.filter((m) => String(m.id) !== String(movieId)));
  };

  const isInWatchlist = (movieId: string | number): boolean => {
    return watchlist.some((m) => String(m.id) === String(movieId));
  };

  const toggleWatchlist = (movie: Movie) => {
    if (isInWatchlist(movie.id)) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }
  };

  const recordWatch = (movieId: string | number, progressPercent = 100) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => String(item.movieId) !== String(movieId));
      return [
        {
          movieId,
          progressPercent,
          lastWatched: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 20); // Keep last 20
    });
  };

  const addReview = (movieId: string | number, userName: string, rating: number, comment: string) => {
    const newReview: UserReview = {
      id: `rev-${Date.now()}`,
      movieId,
      userName: userName.trim() || 'Anonymous Reviewer',
      rating,
      comment: comment.trim(),
      date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    };
    setReviews((prev) => [newReview, ...prev]);
  };

  const getMovieReviews = (movieId: string | number): UserReview[] => {
    return reviews.filter((r) => String(r.movieId) === String(movieId));
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        toggleWatchlist,
        history,
        recordWatch,
        reviews,
        addReview,
        getMovieReviews,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = (): WatchlistContextType => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
