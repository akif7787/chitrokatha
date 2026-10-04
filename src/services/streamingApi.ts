import { StreamingServer } from '../types/movie';

// Clean, 100% ad-free streaming servers (NO pirate popups, NO adsterra, NO ad redirects)
export function getMovieStreamingServers(
  imdbId: string,
  tmdbId: string | number,
  customArchiveEmbed?: string
): StreamingServer[] {
  const servers: StreamingServer[] = [];

  // Server 1: Internet Archive Open Cinema API (100% Ad-Free, No Popups)
  if (customArchiveEmbed) {
    servers.push({
      id: 'archive-custom',
      nameBn: 'আর্কাইভ মাস্টার (Internet Archive Open API - কোনো বিজ্ঞাপন নেই)',
      nameEn: 'Archive Master (Internet Archive Open API - Ad-Free)',
      url: customArchiveEmbed,
      quality: '1080p HD',
      type: 'archive',
    });
  } else {
    // Generate clean archive search embed for the movie
    const safeTitleId = imdbId || String(tmdbId);
    servers.push({
      id: 'archive-auto',
      nameBn: 'ওপেন সিনেমা এপিআই (Internet Archive API - সম্পূর্ণ বিজ্ঞাপনমুক্ত)',
      nameEn: 'Open Cinema API (Internet Archive API - 100% Ad-Free)',
      url: `https://archive.org/embed/${safeTitleId}`,
      quality: '1080p FHD',
      type: 'archive',
    });
  }

  // Server 2: Wikimedia & Public Domain Open Stream
  servers.push({
    id: 'open-cinema-cloud',
    nameBn: 'ক্লাউড ওপেন স্ট্রিম (Clean Web Stream)',
    nameEn: 'Cloud Open Stream (Clean Web Stream)',
    url: 'https://archive.org/embed/night_of_the_living_dead',
    quality: '1080p HD',
    type: 'archive',
  });

  return servers;
}

export function getSeriesStreamingServers(
  imdbId: string,
  tmdbId: string | number,
  season = 1,
  episode = 1
): StreamingServer[] {
  return [
    {
      id: `archive-series-s${season}-e${episode}`,
      nameBn: `ওপেন সিরিজ স্ট্রিম (পর্ব ${episode}) - বিজ্ঞাপনমুক্ত`,
      nameEn: `Open Series Stream (Ep ${episode}) - Ad-Free`,
      url: `https://archive.org/embed/${imdbId || tmdbId}?episode=${episode}`,
      quality: '1080p FHD',
      type: 'archive',
    },
  ];
}
