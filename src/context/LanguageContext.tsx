import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Movie } from '../types/movie';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  getTitle: (movie: Movie) => string;
  getSynopsis: (movie: Movie) => string;
  getGenres: (movie: Movie) => string[];
  getDirector: (movie: Movie) => string;
  getCast: (movie: Movie) => string[];
  getRuntime: (movie: Movie) => string;
}

const translations: Record<string, { bn: string; en: string }> = {
  // Navigation
  appName: { bn: 'চিত্রকথা', en: 'ChitroKatha' },
  appTagline: { bn: 'সিনেমা ও বিনোদন', en: 'Cinema & Streaming' },
  navHome: { bn: 'হোম', en: 'Home' },
  navBangla: { bn: 'বাংলা সিনেমা', en: 'Bangla Cinema' },
  navMovies: { bn: 'মুভিজ', en: 'Movies' },
  navSeries: { bn: 'ওয়েব সিরিজ', en: 'Series' },
  navWatchlist: { bn: 'ওয়াচলিস্ট', en: 'Watchlist' },
  navSearchPlaceholder: { bn: 'সিনেমা, সিরিজ বা শিল্পী খুঁজুন...', en: 'Search movies, series or cast...' },

  // Hero & CTAs
  watchNow: { bn: 'এখন দেখুন', en: 'Watch Now' },
  watchTrailer: { bn: 'ট্রেলার দেখুন', en: 'Watch Trailer' },
  addToWatchlist: { bn: 'ওয়াচলিস্টে রাখুন', en: 'Add to Watchlist' },
  inWatchlist: { bn: 'ওয়াচলিস্টে আছে', en: 'In Watchlist' },
  moreDetails: { bn: 'বিস্তারিত তথ্য', en: 'More Info' },
  featuredMovie: { bn: 'আজকের বিশেষ প্রদর্শনী', en: 'Featured Showcase' },

  // Sections
  secBanglaHits: { bn: 'জনপ্রিয় বাংলা চলচ্চিত্র', en: 'Popular Bengali Cinema' },
  secBanglaHitsSub: { bn: 'ঢালিউড ও টলিউডের কালজয়ী ও সমসাময়িক ব্লকবাস্টার', en: 'Dhallywood & Tollywood classic & modern blockbusters' },
  secHollywood: { bn: 'হলিউড ও বৈশ্বিক সিনেমা', en: 'Hollywood & Global Cinema' },
  secHollywoodSub: { bn: 'বিশ্বসেরা আন্তর্জাতিক চলচ্চিত্র ও অস্কারজয়ী সৃষ্টি', en: 'Critically acclaimed international cinema' },
  secOnlineSeries: { bn: 'ওয়াচমোড এপিআই ট্রেন্ডিং মুভিজ ও সিরিজ', en: 'WatchMode API Trending Titles' },
  secOnlineSeriesSub: { bn: 'সরাসরি ওয়াচমোড এপিআই ও অফিসিয়াল স্ট্রিমিং সোর্স থেকে সংগৃহীত', en: 'Real-time trending titles fetched via official WatchMode API' },
  secClassics: { bn: 'সুবর্ণ যুগের মাস্টারপিস', en: 'Golden Era Masterpieces' },
  secClassicsSub: { bn: 'সত্যজিৎ রায় ও কিংবদন্তি পরিচালকদের অমর সৃষ্টি', en: 'Timeless masterpieces from legendary filmmakers' },
  secContinueWatching: { bn: 'দেখা চালিয়ে যান', en: 'Continue Watching' },
  secWatchlistEmpty: { bn: 'আপনার ওয়াচলিস্ট এখন খালি', en: 'Your watchlist is empty' },
  secWatchlistEmptySub: { bn: 'পছন্দের সিনেমায় ক্লিক করে ওয়াচলিস্টে যুক্ত করুন।', en: 'Browse movies and click the bookmark button to add them.' },

  // Categories & Filters
  allCategories: { bn: 'সব চলচ্চিত্র', en: 'All Cinema' },
  filterAll: { bn: 'সব', en: 'All' },
  filterBangla: { bn: 'বাংলা', en: 'Bangla' },
  filterAction: { bn: 'অ্যাকশন', en: 'Action' },
  filterDrama: { bn: 'ড্রামা', en: 'Drama' },
  filterThriller: { bn: 'থ্রিলার', en: 'Thriller' },
  filterSciFi: { bn: 'সায়েন্স ফিকশন', en: 'Sci-Fi' },
  filterComedy: { bn: 'কমেডি', en: 'Comedy' },
  filterMystery: { bn: 'রহস্য', en: 'Mystery' },

  // Sorting
  sortBy: { bn: 'বাছাই করুন', en: 'Sort By' },
  sortTrending: { bn: 'জনপ্রিয়তা', en: 'Trending' },
  sortRating: { bn: 'সর্বোচ্চ রেটিং', en: 'Highest Rated' },
  sortNewest: { bn: 'নতুন মুক্তি', en: 'Newest Release' },

  // Movie Details Modal
  synopsis: { bn: 'মূল গল্প / সারসংক্ষেপ', en: 'Storyline / Synopsis' },
  director: { bn: 'পরিচালক', en: 'Director' },
  cast: { bn: 'মূল অভিনয়শিল্পী', en: 'Main Cast' },
  releaseYear: { bn: 'মুক্তির সাল', en: 'Release Year' },
  duration: { bn: 'সময়কাল', en: 'Duration' },
  imdbScore: { bn: 'আইএমডিবি রেটিং', en: 'IMDb Rating' },
  audioTracks: { bn: 'অডিও ভাষা', en: 'Audio' },
  subtitlesAvail: { bn: 'সাবটাইটেল', en: 'Subtitles' },
  sourceOrigin: { bn: 'উৎস', en: 'Source' },
  liveApiSource: { bn: 'লাইভ অনলাইন এপিআই', en: 'Live Online API' },
  curatedSource: { bn: 'চিত্রকথা প্রিমিয়াম সংগ্রহ', en: 'ChitroKatha Curated' },
  close: { bn: 'বন্ধ করুন', en: 'Close' },
  theaterModeOn: { bn: 'সিনেমা মোড চালু', en: 'Cinema Mode On' },
  theaterModeOff: { bn: 'সাধারণ মোড', en: 'Normal Mode' },

  // Player controls
  playingNow: { bn: 'চলছে', en: 'Now Playing' },
  trailerPlayer: { bn: 'অফিসিয়াল ট্রেলার', en: 'Official Trailer' },
  movieStream: { bn: 'ফুল ভিডিও স্ট্রিম (HD)', en: 'Full Video Stream (HD)' },
  switchMode: { bn: 'ভিডিও মোড বদলান', en: 'Switch Stream Mode' },

  // Reviews
  userReviews: { bn: 'দর্শক মতামত ও রিভিউ', en: 'Audience Reviews' },
  addReview: { bn: 'আপনার মতামত লিখুন', en: 'Write a Review' },
  yourName: { bn: 'আপনার নাম', en: 'Your Name' },
  yourComment: { bn: 'আপনার রিভিউ লিখুন...', en: 'Write your thoughts on this movie...' },
  submitReview: { bn: 'রিভিউ প্রকাশ করুন', en: 'Post Review' },
  noReviewsYet: { bn: 'এখনো কোনো রিভিউ দেওয়া হয়নি। প্রথম রিভিউটি আপনি দিন!', en: 'No reviews yet. Be the first to review!' },

  // API modal
  apiStatusTitle: { bn: 'অনলাইন এপিআই সংযোগ স্ট্যাটাস', en: 'Online API Connection Status' },
  apiLiveTvMaze: { bn: 'টিভিমেজ (TVMaze) এপিআই: সংযুক্ত ও সক্রিয়', en: 'TVMaze Live API: Connected & Active' },
  apiDesc: { bn: 'লাইভ অনলাইন ডেটাবেস থেকে স্বয়ংক্রিয়ভাবে ট্রেন্ডিং শো ও সিরিজ লোড হচ্ছে। কোনো কী ছাড়াই সম্পূর্ণ উন্মুক্ত।', en: 'Real-time shows and trending media are fetched live from open web APIs without requiring personal credentials.' },
  liveFetchSuccess: { bn: 'অনলাইন ডেটা সফলভাবে রিসিভ হয়েছে', en: 'Live online data fetched successfully' },
  customApiInfo: { bn: 'কাস্টম টিএমডিবি (TMDB) অথবা ওএমডিবি (OMDb) এপিআই কী ব্যবহার করতে পারেন:', en: 'You can optionally supply your personal TMDB or OMDb API key:' },
  saveApiKey: { bn: 'সংরক্ষণ করুন', en: 'Save Key' },

  // Search Results
  searchResultsFor: { bn: 'অনুসন্ধানের ফলাফল', en: 'Search Results' },
  noMoviesFound: { bn: 'কোনো সিনেমা পাওয়া যায়নি', en: 'No movies found' },
  tryDifferentSearch: { bn: 'অন্য কোনো নাম দিয়ে অনুসন্ধান করুন', en: 'Try searching with a different title or keyword' },
  resultsCount: { bn: 'টি সিনেমা পাওয়া গেছে', en: 'movies found' },

  // Footer
  footerTribute: { bn: 'বাংলা ভাষা ও চলচ্চিত্রের প্রতি গভীর শ্রদ্ধায় নিবেদিত', en: 'Dedicated to Bengali literature, cinema & global art' },
  rightsReserved: { bn: 'চিত্রকথা - সর্বস্বত্ব সংরক্ষিত', en: 'ChitroKatha - All Rights Reserved' },
  madeWithLove: { bn: 'সিনেমা প্রেমীদের জন্য নির্মিত', en: 'Crafted for passionate cinema lovers' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('chitrokatha_lang');
    return (saved === 'en' || saved === 'bn') ? saved : 'bn'; // Default to Bengali as requested
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('chitrokatha_lang', lang);
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const item = translations[key];
    if (!item) return key;
    return item[language] || item.bn || key;
  };

  const getTitle = (movie: Movie): string => {
    if (language === 'bn' && movie.titleBn) return movie.titleBn;
    return movie.titleEn || movie.titleBn;
  };

  const getSynopsis = (movie: Movie): string => {
    if (language === 'bn' && movie.synopsisBn) return movie.synopsisBn;
    return movie.synopsisEn || movie.synopsisBn;
  };

  const getGenres = (movie: Movie): string[] => {
    if (language === 'bn' && movie.genresBn && movie.genresBn.length > 0) {
      return movie.genresBn;
    }
    return movie.genres;
  };

  const getDirector = (movie: Movie): string => {
    if (language === 'bn' && movie.directorBn) return movie.directorBn;
    return movie.director;
  };

  const getCast = (movie: Movie): string[] => {
    if (language === 'bn' && movie.castBn && movie.castBn.length > 0) {
      return movie.castBn;
    }
    return movie.cast;
  };

  const getRuntime = (movie: Movie): string => {
    if (language === 'bn' && movie.runtimeBn) return movie.runtimeBn;
    return movie.runtime;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        getTitle,
        getSynopsis,
        getGenres,
        getDirector,
        getCast,
        getRuntime,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
