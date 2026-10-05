import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Sparkles,
  Flame,
  Filter,
  X,
  Play,
  Star,
  Film,
  RotateCcw,
  MousePointerClick,
  Compass,
} from 'lucide-react';
import { Movie } from '../types/movie';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { useWatchlist } from '../context/WatchlistContext';
import { getRecentlyWatched } from '../services/recentlyWatched';
import { MovieCard } from './MovieCard';

interface GenreCloudProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onPlayMovie: (movie: Movie) => void;
}

interface GenreNode extends d3.SimulationNodeDatum {
  id: string;
  nameEn: string;
  nameBn: string;
  count: number;
  activityScore: number;
  radius: number;
  colorStart: string;
  colorEnd: string;
  textColor: string;
}

const GENRE_PALETTES: Record<string, { start: string; end: string; text: string }> = {
  Action: { start: '#e11d48', end: '#9f1239', text: '#ffe4e6' }, // Rose/crimson
  Drama: { start: '#f59e0b', end: '#b45309', text: '#fef3c7' }, // Amber
  Thriller: { start: '#8b5cf6', end: '#5b21b6', text: '#ede9fe' }, // Violet
  Romance: { start: '#ec4899', end: '#9d174d', text: '#fce7f3' }, // Pink
  Crime: { start: '#dc2626', end: '#7f1d1d', text: '#fee2e2' }, // Red
  Mystery: { start: '#06b6d4', end: '#0e7490', text: '#cffafe' }, // Cyan
  Comedy: { start: '#eab308', end: '#854d0e', text: '#fef9c3' }, // Yellow
  'Sci-Fi': { start: '#10b981', end: '#047857', text: '#d1fae5' }, // Emerald
  Fantasy: { start: '#6366f1', end: '#3730a3', text: '#e0e7ff' }, // Indigo
  History: { start: '#d97706', end: '#78350f', text: '#fef3c7' }, // Bronze
  Family: { start: '#14b8a6', end: '#0f766e', text: '#ccfbf1' }, // Teal
  Horror: { start: '#4c1d95', end: '#1e1b4b', text: '#e9d5ff' }, // Dark purple
  Adventure: { start: '#ea580c', end: '#9a3412', text: '#ffedd5' }, // Orange
};

const GENRE_TRANSLATIONS: Record<string, string> = {
  Action: 'অ্যাকশন',
  Drama: 'ড্রামা',
  Thriller: 'থ্রিলার',
  Romance: 'রোমান্স',
  Crime: 'ক্রাইম',
  Mystery: 'রহস্য',
  Comedy: 'কমেডি',
  'Sci-Fi': 'সাই-ফাই',
  Fantasy: 'ফ্যান্টাসি',
  History: 'ইতিহাস',
  Family: 'পারিবারিক',
  Horror: 'ভৌতিক',
  Adventure: 'অ্যাডভেঞ্চার',
  Biography: 'জীবনী',
  Animation: 'অ্যানিমেশন',
};

export const GenreCloud: React.FC<GenreCloudProps> = ({
  movies,
  onSelectMovie,
  onPlayMovie,
}) => {
  const { language, getTitle } = useLanguage();
  const { favorites } = useFavorites();
  const { watchlist } = useWatchlist();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [hoveredGenre, setHoveredGenre] = useState<GenreNode | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 380,
  });

  // Calculate dynamic genre weights based on catalog + user activity
  const genreData = useMemo(() => {
    const recent = getRecentlyWatched();
    const recentMovieIds = new Set(recent.map((r) => String(r.movie.id)));
    const favoriteSet = new Set(favorites.map(String));
    const watchlistSet = new Set(watchlist.map(String));

    const counts: Record<string, { count: number; activity: number }> = {};

    movies.forEach((m) => {
      const isRecent = recentMovieIds.has(String(m.id));
      const isFav = favoriteSet.has(String(m.id));
      const isWatch = watchlistSet.has(String(m.id));

      const activityBonus = (isRecent ? 4 : 0) + (isFav ? 5 : 0) + (isWatch ? 3 : 0);

      m.genres.forEach((genre) => {
        if (!counts[genre]) {
          counts[genre] = { count: 0, activity: 0 };
        }
        counts[genre].count += 1;
        counts[genre].activity += 1 + activityBonus;
      });
    });

    const entries = Object.entries(counts);
    if (entries.length === 0) return [];

    const maxActivity = Math.max(...entries.map(([, v]) => v.activity), 1);
    const minActivity = Math.min(...entries.map(([, v]) => v.activity), 1);

    // Responsive radius scaling
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const minR = isMobile ? 32 : 42;
    const maxR = isMobile ? 58 : 78;

    const radiusScale = d3
      .scaleSqrt()
      .domain([minActivity, maxActivity])
      .range([minR, maxR]);

    return entries
      .sort((a, b) => b[1].activity - a[1].activity)
      .slice(0, 14) // Top 14 dynamic genres
      .map(([genre, val]) => {
        const palette = GENRE_PALETTES[genre] || {
          start: '#64748b',
          end: '#334155',
          text: '#f8fafc',
        };
        return {
          id: genre,
          nameEn: genre,
          nameBn: GENRE_TRANSLATIONS[genre] || genre,
          count: val.count,
          activityScore: val.activity,
          radius: radiusScale(val.activity),
          colorStart: palette.start,
          colorEnd: palette.end,
          textColor: palette.text,
        } as GenreNode;
      });
  }, [movies, favorites, watchlist]);

  // Handle responsive resizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = Math.max(containerRef.current.clientWidth, 320);
        const height = width < 640 ? 320 : 380;
        setDimensions({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Filtered movies matching selected genre
  const filteredMovies = useMemo(() => {
    if (!selectedGenre) return [];
    return movies.filter((m) => m.genres.includes(selectedGenre));
  }, [movies, selectedGenre]);

  // D3 Force Simulation Effect
  useEffect(() => {
    if (!svgRef.current || genreData.length === 0) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    // Create defs for gradients and glows
    const defs = svg.append('defs');

    // Filter for drop shadow
    const filter = defs
      .append('filter')
      .attr('id', 'bubble-glow')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');

    filter
      .append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '4')
      .attr('stdDeviation', '6')
      .attr('flood-color', '#000000')
      .attr('flood-opacity', '0.7');

    // Create radial gradients for each genre node
    genreData.forEach((node) => {
      const gradient = defs
        .append('radialGradient')
        .attr('id', `grad-${node.id.replace(/[^a-z0-9]/gi, '')}`)
        .attr('cx', '35%')
        .attr('cy', '35%')
        .attr('r', '70%');

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', node.colorStart)
        .attr('stop-opacity', '1');

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', node.colorEnd)
        .attr('stop-opacity', '0.9');
    });

    // Clone nodes for D3 simulation mutation
    const nodes: GenreNode[] = genreData.map((d) => ({
      ...d,
      x: width / 2 + (Math.random() - 0.5) * 120,
      y: height / 2 + (Math.random() - 0.5) * 100,
    }));

    // Setup Force Simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.06))
      .force(
        'collide',
        d3
          .forceCollide<GenreNode>()
          .radius((d) => d.radius + 6)
          .strength(0.9)
          .iterations(2)
      )
      .force('x', d3.forceX(width / 2).strength(0.04))
      .force('y', d3.forceY(height / 2).strength(0.04))
      .force('charge', d3.forceManyBody().strength(-15));

    // Container Group
    const container = svg.append('g').attr('class', 'bubble-container');

    // Bubble Groups
    const nodeGroups = container
      .selectAll<SVGGElement, GenreNode>('.bubble-node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'bubble-node')
      .style('cursor', 'pointer');

    // Outer Selection / Highlight Ring
    const selectionRings = nodeGroups
      .append('circle')
      .attr('class', 'selection-ring')
      .attr('r', (d) => d.radius + 4)
      .attr('fill', 'none')
      .attr('stroke', (d) => (selectedGenre === d.id ? '#ffffff' : 'transparent'))
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', (d) => (selectedGenre === d.id ? 'none' : '4 4'))
      .attr('filter', 'url(#bubble-glow)');

    // Main Circle
    const circles = nodeGroups
      .append('circle')
      .attr('class', 'main-circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => `url(#grad-${d.id.replace(/[^a-z0-9]/gi, '')})`)
      .attr('stroke', (d) => (selectedGenre === d.id ? '#ffffff' : 'rgba(255,255,255,0.2)'))
      .attr('stroke-width', (d) => (selectedGenre === d.id ? 2.5 : 1))
      .attr('filter', 'url(#bubble-glow)')
      .style('transition', 'stroke 0.2s, stroke-width 0.2s');

    // Genre Label (Bangla / English)
    const titleText = nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => (d.radius > 45 ? '-0.2em' : '0.3em'))
      .attr('fill', '#ffffff')
      .attr('font-size', (d) => `${Math.max(d.radius * 0.26, 11)}px`)
      .attr('font-weight', '800')
      .attr('letter-spacing', '0.02em')
      .style('font-family', 'Cinzel, sans-serif')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 2px 4px rgba(0,0,0,0.8)')
      .text((d) => (language === 'bn' ? d.nameBn : d.nameEn));

    // Secondary count or English subtext
    const subText = nodeGroups
      .filter((d) => d.radius >= 42)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.3em')
      .attr('fill', 'rgba(255,255,255,0.85)')
      .attr('font-size', (d) => `${Math.max(d.radius * 0.18, 9)}px`)
      .attr('font-weight', '600')
      .style('font-family', 'monospace')
      .style('pointer-events', 'none')
      .text((d) =>
        language === 'bn'
          ? `${d.count}টি কনটেন্ট`
          : `${d.count} titles`
      );

    // Interactive Drag Behaviors
    const drag = d3
      .drag<SVGGElement, GenreNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeGroups.call(drag);

    // Mouse Click & Hover
    nodeGroups
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedGenre((prev) => (prev === d.id ? null : d.id));
      })
      .on('mouseenter', (event: MouseEvent, d: GenreNode) => {
        setHoveredGenre(d);
        if (event.currentTarget) {
          d3.select(event.currentTarget as SVGGElement)
            .select('.main-circle')
            .transition()
            .duration(150)
            .attr('transform', 'scale(1.08)');
        }
      })
      .on('mouseleave', (event: MouseEvent) => {
        setHoveredGenre(null);
        if (event.currentTarget) {
          d3.select(event.currentTarget as SVGGElement)
            .select('.main-circle')
            .transition()
            .duration(150)
            .attr('transform', 'scale(1)');
        }
      });

    // Simulation Tick Update
    simulation.on('tick', () => {
      // Keep bubbles bounded within dimensions
      nodes.forEach((d) => {
        d.x = Math.max(d.radius + 10, Math.min(width - d.radius - 10, d.x || width / 2));
        d.y = Math.max(d.radius + 10, Math.min(height - d.radius - 10, d.y || height / 2));
      });

      nodeGroups.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [genreData, dimensions, language, selectedGenre]);

  return (
    <section
      ref={containerRef}
      className="relative w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-8 my-6"
    >
      {/* Background Cinematic Glow Container */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#0c0f18]/90 via-[#090b12]/95 to-[#07080d] border border-white/10 p-5 sm:p-7 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-rose-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-black text-white font-cinzel tracking-wide">
                  {language === 'bn' ? 'ইন্টারেক্টিভ জনরা ক্লাউড' : 'Interactive Genre Cloud'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/30 font-bold uppercase">
                  D3.js
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-light">
              {language === 'bn'
                ? 'আপনার দেখা ও পছন্দের ভিত্তিতে জনরার আকার বড় বা ছোট হয়। বাবল ক্লিক করে নির্দিষ্ট জনরা ফিল্টার করুন।'
                : 'Dynamic bubbles sized by your viewing activity & favorites. Click any bubble to filter movies.'}
            </p>
          </div>

          {/* Quick Filter Control State */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedGenre && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-600/25 border border-rose-500/50 text-rose-300 text-xs font-bold animate-in fade-in">
                <Filter className="w-3.5 h-3.5" />
                <span>
                  {language === 'bn' ? 'নির্বাচিত:' : 'Selected:'}{' '}
                  {language === 'bn'
                    ? GENRE_TRANSLATIONS[selectedGenre] || selectedGenre
                    : selectedGenre}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedGenre(null)}
                  className="p-0.5 hover:bg-rose-500/30 rounded-md transition-colors ml-1 cursor-pointer"
                  title={language === 'bn' ? 'ফিল্টার মুছুন' : 'Clear filter'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400 font-mono">
              <MousePointerClick className="w-3 h-3 text-amber-400 animate-bounce" />
              <span>{language === 'bn' ? 'ড্র্যাগ ও ক্লিক যোগ্য' : 'Draggable & Clickable'}</span>
            </div>

            {selectedGenre && (
              <button
                type="button"
                onClick={() => setSelectedGenre(null)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs border border-white/10 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'bn' ? 'সব দেখুন' : 'Show All'}</span>
              </button>
            )}
          </div>
        </div>

        {/* D3 SVG Cloud Canvas */}
        <div className="relative w-full overflow-hidden flex items-center justify-center my-2">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-auto select-none"
            style={{ maxHeight: `${dimensions.height}px` }}
          />

          {/* Interactive Hover HUD Tooltip */}
          {hoveredGenre && (
            <div className="absolute top-3 right-3 pointer-events-none px-3 py-2 rounded-xl bg-black/85 border border-white/15 backdrop-blur-xl shadow-xl text-left space-y-0.5 z-20 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: hoveredGenre.colorStart }}
                />
                <h4 className="text-xs font-bold text-white font-cinzel">
                  {language === 'bn' ? hoveredGenre.nameBn : hoveredGenre.nameEn}
                </h4>
              </div>
              <p className="text-[10px] text-slate-300 font-mono">
                {language === 'bn' ? 'মোট সিনেমা:' : 'Total Titles:'} {hoveredGenre.count}
              </p>
              <p className="text-[9px] text-amber-400 font-mono">
                {language === 'bn' ? 'অ্যাক্টিভিটি স্কোর:' : 'Activity Score:'}{' '}
                {hoveredGenre.activityScore}
              </p>
            </div>
          )}
        </div>

        {/* Selected Genre Movies Showcase Drawer */}
        {selectedGenre && (
          <div className="relative mt-4 pt-4 border-t border-white/10 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-600/30 text-rose-400 flex items-center justify-center text-xs font-bold border border-rose-500/40">
                  <Film className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white font-cinzel">
                  {language === 'bn'
                    ? `‘${GENRE_TRANSLATIONS[selectedGenre] || selectedGenre}’ জনরার সিনেমা ও নাটক`
                    : `Filtered by: ${selectedGenre}`}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  {filteredMovies.length} {language === 'bn' ? 'টি' : 'titles'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGenre(null)}
                className="text-xs text-slate-400 hover:text-rose-400 font-medium cursor-pointer"
              >
                {language === 'bn' ? 'ফিল্টার বন্ধ করুন' : 'Close filter'}
              </button>
            </div>

            {/* Horizontal Carousel of matching movies */}
            {filteredMovies.length > 0 ? (
              <div className="flex items-start gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x pt-1">
                {filteredMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className="w-36 sm:w-44 md:w-52 shrink-0 snap-start"
                  >
                    <MovieCard
                      movie={movie}
                      onSelect={onSelectMovie}
                      onPlayTrailer={(m) => onPlayMovie(m)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                {language === 'bn'
                  ? 'এই জনরায় কোনো কনটেন্ট পাওয়া যায়নি।'
                  : 'No titles found matching this genre.'}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
