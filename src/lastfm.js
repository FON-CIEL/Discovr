const API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

// 1. Récupérer les morceaux similaires
export const getSimilarTracks = async (trackName, artistName) => {
  const params = new URLSearchParams({
    method: "track.getsimilar",
    track: trackName,
    artist: artistName,
    api_key: API_KEY,
    format: "json",
    limit: "100"
  });

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    const data = await response.json();
    return data.similartracks?.track || [];
  } catch (error) {
    console.error("Erreur Last.fm (Similar Tracks):", error);
    return [];
  }
};

// 2. Récupérer les morceaux par genre (Tag)
export const getTopTracksByGenre = async (genre) => {
  const params = new URLSearchParams({
    method: "tag.gettoptracks",
    tag: genre,
    api_key: API_KEY,
    format: "json",
    limit: "100"
  });

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    const data = await response.json();
    return data.tracks?.track || [];
  } catch (error) {
    console.error("Erreur Last.fm (Top Tracks Genre):", error);
    return [];
  }
};

// 3. Barre de recherche globale (autocomplétion)
export const searchTracks = async (query) => {
  const params = new URLSearchParams({
    method: "track.search",
    track: query,
    api_key: API_KEY,
    format: "json",
    limit: "100"
  });

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    const data = await response.json();
    return data.results?.trackmatches?.track || [];
  } catch (error) {
    console.error("Erreur lors de la recherche globale Last.fm :", error);
    return [];
  }
};
