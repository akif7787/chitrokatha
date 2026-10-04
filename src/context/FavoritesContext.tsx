import React, { createContext, useContext, useState, useEffect } from 'react';
import { Movie } from '../types/movie';
import { syncFavoritesToIndexedDB, loadFavoritesFromIndexedDB } from '../services/offlineCacheDB';

interface FavoritesContextType {
  favorites: Movie[];
  addToFavorites: (movie: Movie) => void;
  removeFromFavorites: (movieId: string | number) => void;
  isFavorite: (movieId: string | number) => boolean;
  toggleFavorite: (movie: Movie) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Movie[]>(() => {
    try {
      const saved = localStorage.getItem('chitrokatha_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage and IndexedDB
  useEffect(() => {
    try {
      localStorage.setItem('chitrokatha_favorites', JSON.stringify(favorites));
      syncFavoritesToIndexedDB(favorites).catch(() => {});
    } catch (err) {
      console.error('Failed to save favorites to localStorage', err);
    }
  }, [favorites]);

  // On mount: hydrate from IndexedDB if localStorage was empty or cleared
  useEffect(() => {
    if (favorites.length === 0) {
      loadFavoritesFromIndexedDB().then((cached) => {
        if (cached && cached.length > 0) {
          setFavorites(cached);
        }
      }).catch(() => {});
    }
  }, []);

  const addToFavorites = (movie: Movie) => {
    setFavorites((prev) => {
      if (prev.some((item) => String(item.id) === String(movie.id))) {
        return prev;
      }
      return [movie, ...prev];
    });
  };

  const removeFromFavorites = (movieId: string | number) => {
    setFavorites((prev) => prev.filter((item) => String(item.id) !== String(movieId)));
  };

  const isFavorite = (movieId: string | number) => {
    return favorites.some((item) => String(item.id) === String(movieId));
  };

  const toggleFavorite = (movie: Movie) => {
    if (isFavorite(movie.id)) {
      removeFromFavorites(movie.id);
    } else {
      addToFavorites(movie);
    }
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        toggleFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
