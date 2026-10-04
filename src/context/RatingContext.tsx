import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CommunityRatingResult {
  average: number; // e.g. 4.6 (out of 5)
  count: number;   // e.g. 142 ratings
  userRating: number | null; // e.g. 5 if user rated, else null
}

interface RatingContextType {
  userRatings: Record<string, number>;
  rateMovie: (movieId: string | number, stars: number) => void;
  removeRating: (movieId: string | number) => void;
  getUserRating: (movieId: string | number) => number | null;
  getCommunityRating: (movieId: string | number, base10Rating?: number) => CommunityRatingResult;
}

const RatingContext = createContext<RatingContextType | undefined>(undefined);

// Deterministic seed for initial realistic community vote counts
function getInitialVoteSeed(movieId: string | number, base10Rating: number = 8.0): { baseCount: number; baseAverage: number } {
  const str = String(movieId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  // Base vote count between 48 and 180
  const baseCount = 50 + (positiveHash % 130);
  
  // Convert 10-point scale to 5-point scale (e.g. 8.6 / 2 = 4.3)
  const baseAvg = Math.min(5, Math.max(3.0, Number((base10Rating / 2).toFixed(1))));
  return { baseCount, baseAverage: baseAvg };
}

export const RatingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRatings, setUserRatings] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('chitrokatha_user_ratings');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('chitrokatha_user_ratings', JSON.stringify(userRatings));
    } catch (err) {
      console.error('Failed to save user ratings to localStorage', err);
    }
  }, [userRatings]);

  const rateMovie = (movieId: string | number, stars: number) => {
    const validStars = Math.min(5, Math.max(1, Math.round(stars)));
    setUserRatings((prev) => ({
      ...prev,
      [String(movieId)]: validStars,
    }));
  };

  const removeRating = (movieId: string | number) => {
    setUserRatings((prev) => {
      const next = { ...prev };
      delete next[String(movieId)];
      return next;
    });
  };

  const getUserRating = (movieId: string | number): number | null => {
    const val = userRatings[String(movieId)];
    return typeof val === 'number' ? val : null;
  };

  const getCommunityRating = (movieId: string | number, base10Rating: number = 8.0): CommunityRatingResult => {
    const { baseCount, baseAverage } = getInitialVoteSeed(movieId, base10Rating);
    const userRating = getUserRating(movieId);

    if (userRating === null) {
      return {
        average: baseAverage,
        count: baseCount,
        userRating: null,
      };
    }

    // Blend user rating with community
    const totalScore = (baseAverage * baseCount) + userRating;
    const totalVotes = baseCount + 1;
    const blendedAverage = Number((totalScore / totalVotes).toFixed(1));

    return {
      average: blendedAverage,
      count: totalVotes,
      userRating,
    };
  };

  return (
    <RatingContext.Provider
      value={{
        userRatings,
        rateMovie,
        removeRating,
        getUserRating,
        getCommunityRating,
      }}
    >
      {children}
    </RatingContext.Provider>
  );
};

export const useRating = () => {
  const context = useContext(RatingContext);
  if (!context) {
    throw new Error('useRating must be used within a RatingProvider');
  }
  return context;
};
