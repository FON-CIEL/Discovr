import { useState, useEffect } from 'react';
import { getSimilarTracks, getTopTracksByGenre, searchTracks } from './lastfm';

function Generateur() {
  const [searchInput, setSearchInput] = useState('');
  const [suggestionsMenu, setSuggestionsMenu] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mixLoading, setMixLoading] = useState(false);
  
  const [playlistName, setPlaylistName] = useState('My Discover');
  const [myPlaylist, setMyPlaylist] = useState([]);

  const [currentPreviewUrl, setCurrentPreviewUrl] = useState(null);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [genreInput, setGenreInput] = useState('');
  
  const [isExportHovered, setIsExportHovered] = useState(false);
  const [isMixHovered, setIsMixHovered] = useState(false);
  const [isResetHovered, setIsResetHovered] = useState(false);
  const [isOptionsHovered, setIsOptionsHovered] = useState(false);
  
  // États pour les filtres et l'affichage du volet
  const [showOptions, setShowOptions] = useState(false);
  const [filterGenre, setFilterGenre] = useState('');
  const [filterLimit, setFilterLimit] = useState(50);

  // Configuration de la pagination commune
  const tracksPerPage = 10;

  // Pagination pour les recommandations (gauche)
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination pour la playlist (droite)
  const [currentPlaylistPage, setCurrentPlaylistPage] = useState(1);

  useEffect(() => {
    const savedPlaylist = localStorage.getItem('discovr_playlist');
    if (savedPlaylist) setMyPlaylist(JSON.parse(savedPlaylist));
  }, []);

  const saveToLocalStorage = (updatedPlaylist) => {
    setMyPlaylist(updatedPlaylist);
    localStorage.setItem('discovr_playlist', JSON.stringify(updatedPlaylist));
    setCurrentPlaylistPage(1);
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Récupère la pochette d'album et la preview audio depuis iTunes
  const fetchTrackDetailsFromiTunes = async (trackName, artistName) => {
    try {
      const query = encodeURIComponent(`${artistName} ${trackName}`);
      const response = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=1`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return {
          previewUrl: data.results[0].previewUrl || null,
          artworkUrl: data.results[0].artworkUrl100 ? data.results[0].artworkUrl100.replace('100x100bb', '300x300bb') : 'https://via.placeholder.com/150?text=🎵'
        };
      }
    } catch (e) {
      console.error("Erreur détails iTunes", e);
    }
    return { previewUrl: null, artworkUrl: 'https://via.placeholder.com/150?text=🎵' };
  };

  // Charge en arrière-plan les visuels iTunes pour la page actuelle
  const fetchImagesForCurrentPage = (trackList, startIndex) => {
    const pageTracks = trackList.slice(startIndex, startIndex + tracksPerPage);
    pageTracks.forEach(async (track, index) => {
      if (track.imageUrl && !track.imageUrl.includes('placeholder.com')) return;

      const details = await fetchTrackDetailsFromiTunes(track.name, track.artist);
      if (details && details.artworkUrl) {
        setRecommendations(prev => {
          const updated = [...prev];
          const globalIndex = startIndex + index;
          if (updated[globalIndex]) {
            updated[globalIndex].imageUrl = details.artworkUrl;
          }
          return updated;
        });
      }
    });
  };

  // Déclenche le chargement des images des recommandations quand on change de page
  useEffect(() => {
    if (recommendations.length > 0) {
      const startIndex = (currentPage - 1) * tracksPerPage;
      fetchImagesForCurrentPage(recommendations, startIndex);
    }
  }, [currentPage, recommendations.length]);

  const generateSmartMix = async () => {
    setMixLoading(true);
    let rawTracks = [];

    if (myPlaylist.length > 0) {
      const shuffledFavorites = shuffleArray(myPlaylist).slice(0, 5);
      for (const track of shuffledFavorites) {
        try {
          const similars = await getSimilarTracks(track.name, track.artist);
          rawTracks = [...rawTracks, ...similars];
        } catch(e) { console.error(e); }
      }
    } 

    const targetGenre = filterGenre.trim() || 'rock';
    try {
      const genreTracks = await getTopTracksByGenre(targetGenre);
      rawTracks = [...rawTracks, ...genreTracks];
    } catch(e) { console.error(e); }

    const uniqueTracksMap = new Map();
    rawTracks.forEach(track => {
      const tName = track.name;
      const aName = track.artist?.name || track.artist;
      if (tName && aName) {
        const key = `${tName.toLowerCase().trim()}-${aName.toLowerCase().trim()}`;
        if (!uniqueTracksMap.has(key)) {
          uniqueTracksMap.set(key, { name: tName, artist: aName, imageUrl: 'https://via.placeholder.com/150?text=🎵', previewUrl: null });
        }
      }
    });

    const finalSelection = shuffleArray(Array.from(uniqueTracksMap.values())).slice(0, filterLimit);
    saveToLocalStorage(finalSelection); 
    setMixLoading(false);

    // Charger les images de la première page de la nouvelle playlist générée
    finalSelection.slice(0, tracksPerPage).forEach(async (track, index) => {
      const details = await fetchTrackDetailsFromiTunes(track.name, track.artist);
      if (details && details.artworkUrl) {
        setMyPlaylist(prev => {
          const updated = [...prev];
          if (updated[index]) updated[index].imageUrl = details.artworkUrl;
          return updated;
        });
      }
    });
  };

  const resetPlaylist = () => {
    if (window.confirm("Es-tu sûr de vouloir vider toute ta playlist ?")) {
      saveToLocalStorage([]);
    }
  };

  // Auto-suggestion dans la recherche avec images iTunes instantanées
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchInput.trim().length > 2) {
        const results = await searchTracks(searchInput);
        
        const basicSuggestions = await Promise.all(
          results.slice(0, 6).map(async (track) => {
            const query = encodeURIComponent(`${track.artist} ${track.name}`);
            let img = 'https://via.placeholder.com/40?text=🎵';
            try {
              const res = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=1`);
              const data = await res.json();
              if (data.results && data.results[0]?.artworkUrl60) {
                img = data.results[0].artworkUrl60;
              }
            } catch (e) { console.error(e); }
            
            return { name: track.name, artist: track.artist, imageUrl: img };
          })
        );
        setSuggestionsMenu(basicSuggestions);
      } else {
        setSuggestionsMenu([]);
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  const handleSelectTrack = async (trackName, artistName) => {
    setSearchInput(''); 
    setSuggestionsMenu([]);
    setLoading(true);
    setCurrentPage(1);
    
    const results = await getSimilarTracks(trackName, artistName);
    
    const uniqueMap = new Map();
    results.forEach(track => {
      const name = track.name;
      const artist = track.artist?.name || track.artist;
      if (name && artist) {
        const key = `${name.toLowerCase().trim()}-${artist.toLowerCase().trim()}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, { name: name, artist: artist, imageUrl: 'https://via.placeholder.com/150?text=🎵', previewUrl: null });
        }
      }
    });

    // Remise en place de l'aléatoire ici !
    const trackList = shuffleArray(Array.from(uniqueMap.values()));
    setRecommendations(trackList);
    setLoading(false);
  };

  const handleGenreClick = async (genre) => {
    setLoading(true);
    setCurrentPage(1);
    const results = await getTopTracksByGenre(genre);
    
    const uniqueMap = new Map();
    results.forEach(track => {
      const name = track.name;
      const artist = track.artist?.name || track.artist;
      if (name && artist) {
        const key = `${name.toLowerCase().trim()}-${artist.toLowerCase().trim()}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, { name: name, artist: artist, imageUrl: 'https://via.placeholder.com/150?text=🎵', previewUrl: null });
        }
      }
    });

    // Remise en place de l'aléatoire ici aussi !
    const trackList = shuffleArray(Array.from(uniqueMap.values()));
    setRecommendations(trackList);
    setLoading(false);
  };

  const playPreview = async (globalIndex, trackName, artistName, isFromPlaylist = false) => {
    const globalId = isFromPlaylist ? `play-${globalIndex}` : `rec-${globalIndex}`;

    if (playingTrackId === globalId) {
      setCurrentPreviewUrl(null);
      setPlayingTrackId(null);
      return;
    }

    try {
      const details = await fetchTrackDetailsFromiTunes(trackName, artistName);
      if (details && details.previewUrl) {
        setCurrentPreviewUrl(details.previewUrl);
        setPlayingTrackId(globalId);

        if (details.artworkUrl) {
          if (isFromPlaylist) {
            const updated = [...myPlaylist];
            if (updated[globalIndex]) {
              updated[globalIndex].imageUrl = details.artworkUrl;
              setMyPlaylist(updated);
            }
          } else {
            const updatedRecs = [...recommendations];
            if (updatedRecs[globalIndex]) {
              updatedRecs[globalIndex].imageUrl = details.artworkUrl;
              setRecommendations(updatedRecs);
            }
          }
        }
      } else {
        alert("Aucun extrait disponible pour ce morceau.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addToPlaylist = async (track) => {
    if (myPlaylist.some(t => t.name === track.name && t.artist === track.artist)) {
      return alert("Ce morceau est déjà dans ta playlist !");
    }
    
    let finalTrack = { ...track };
    if (track.imageUrl.includes('placeholder.com')) {
      const details = await fetchTrackDetailsFromiTunes(track.name, track.artist);
      if (details && details.artworkUrl) {
        finalTrack.imageUrl = details.artworkUrl;
      }
    }

    const updated = [...myPlaylist, finalTrack];
    saveToLocalStorage(updated);
  };

  const removeFromPlaylist = (indexToRemove) => {
    const updated = myPlaylist.filter((_, index) => index !== indexToRemove);
    saveToLocalStorage(updated);
    
    const newTotalPages = Math.ceil(updated.length / tracksPerPage);
    if (currentPlaylistPage > newTotalPages && newTotalPages > 0) {
      setCurrentPlaylistPage(newTotalPages);
    }
  };

  // Chargement des images en arrière plan pour la playlist quand elle change de page
  useEffect(() => {
    if (myPlaylist.length > 0) {
      const startIndex = (currentPlaylistPage - 1) * tracksPerPage;
      const pageTracks = myPlaylist.slice(startIndex, startIndex + tracksPerPage);
      
      pageTracks.forEach(async (track, index) => {
        if (track.imageUrl && !track.imageUrl.includes('placeholder.com')) return;
        
        const details = await fetchTrackDetailsFromiTunes(track.name, track.artist);
        if (details && details.artworkUrl) {
          setMyPlaylist(prev => {
            const updated = [...prev];
            const globalIndex = startIndex + index;
            if (updated[globalIndex]) updated[globalIndex].imageUrl = details.artworkUrl;
            return updated;
          });
        }
      });
    }
  }, [currentPlaylistPage, myPlaylist.length]);

  const exportPlaylist = () => {
    if (myPlaylist.length === 0) return alert("Ta playlist est vide !");
    let fileContent = "#EXTM3U\n";
    myPlaylist.forEach(track => {
      fileContent += `#EXTINF:-1,${track.artist} - ${track.name}\n`;
      fileContent += `https://itunes.apple.com/search?term=${encodeURIComponent(track.artist + ' ' + track.name)}\n`;
    });

    const blob = new Blob([fileContent], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${playlistName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.m3u`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Logique de calcul pour la pagination gauche (Recommandations)
  const indexOfLastTrack = currentPage * tracksPerPage;
  const indexOfFirstTrack = indexOfLastTrack - tracksPerPage;
  const currentTracks = recommendations.slice(indexOfFirstTrack, indexOfLastTrack);
  const totalPages = Math.ceil(recommendations.length / tracksPerPage);

  // Logique de calcul pour la pagination droite (Playlist)
  const indexOfLastPlaylistTrack = currentPlaylistPage * tracksPerPage;
  const indexOfFirstPlaylistTrack = indexOfLastPlaylistTrack - tracksPerPage;
  const currentPlaylistTracks = myPlaylist.slice(indexOfFirstPlaylistTrack, indexOfLastPlaylistTrack);
  const totalPlaylistPages = Math.ceil(myPlaylist.length / tracksPerPage);

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', padding: '40px 20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
        <h1 style={{ margin: 0, fontSize: '48px', fontWeight: '800', color: '#ffffff' }}>
          Discovr<span style={{ color: '#E31B23' }}>.</span>
        </h1>
      </div>

      {currentPreviewUrl && (
        <audio src={currentPreviewUrl} autoPlay style={{ display: 'none' }} onEnded={() => setPlayingTrackId(null)} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', width: '100%', maxWidth: '1400px', margin: '0 auto', alignItems: 'start' }}>
        
        {/* COLONNE GAUCHE (Recherche et Découverte) */}
        <div>
          <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '15px', marginBottom: '20px', position: 'relative' }}>
            <h3>Rechercher un morceau :</h3>
            <input 
              type="text" 
              placeholder="Tape un titre ou un artiste..." 
              value={searchInput} 
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault(); // Empêche de valider la playlist à droite
              }}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: '15px', border: 'none', backgroundColor: '#333', color: 'white' }}
            />

            {suggestionsMenu.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: '20px', right: '20px', backgroundColor: '#222', borderRadius: '8px', zIndex: 10, marginTop: '5px', overflow: 'hidden', border: '1px solid #444' }}>
                {suggestionsMenu.map((track, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleSelectTrack(track.name, track.artist)}
                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <img src={track.imageUrl} alt="" style={{ width: '35px', height: '35px', borderRadius: '4px', objectFit: 'cover' }} />
                    <div>
                      <span style={{ fontWeight: 'bold', display: 'block', fontSize: '14px' }}>{track.name}</span>
                      <span style={{ color: '#aaa', fontSize: '12px' }}>{track.artist}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '15px', marginBottom: '30px' }}>
            <h3>Rechercher un style musical :</h3>
            <input 
              type="text" 
              placeholder="Tape un genre (ex: rock, lofi, techno...)" 
              value={genreInput} 
              onChange={(e) => setGenreInput(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Bloque le déclenchement sauvage du bouton de droite
                  if (genreInput.trim().length > 0) {
                    handleGenreClick(genreInput.trim().toLowerCase());
                  }
                }
              }}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: '15px', border: 'none', backgroundColor: '#333', color: 'white' }}
            />
          </div>

          <div>
            <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', margin: 0 }}>À toi de découvrir ({recommendations.length} résultats) :</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
              {currentTracks.length > 0 ? (
                currentTracks.map((track, index) => {
                  const globalIndex = indexOfFirstTrack + index;
                  const globalId = `rec-${globalIndex}`;
                  return (
                    <div key={globalIndex} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#181818', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                        <img src={track.imageUrl} alt="" style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' }} />
                        <div>
                          <h4 style={{ margin: '0 0 5px 0' }}>{track.name}</h4>
                          <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>{track.artist}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => playPreview(globalIndex, track.name, track.artist, false)} style={{ backgroundColor: playingTrackId === globalId ? '#1DB954' : '#333', color: 'white', border: 'none', borderRadius: '50px', padding: '9px 12px', cursor: 'pointer' }}>
                          {playingTrackId === globalId ? '⏸' : '▶'}
                        </button>
                        <button onClick={() => addToPlaylist(track)} style={{ backgroundColor: '#E31B23', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#aaa' }}>Utilise la recherche à gauche pour envoyer du son !</p>
              )}
            </div>

            {/* BOUTONS DE PAGINATION POUR LES RÉSULTATS */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ backgroundColor: currentPage === 1 ? '#222' : '#333', color: currentPage === 1 ? '#555' : 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' }}
                >
                  Précédent
                </button>
                <span style={{ fontSize: '14px', color: '#aaa' }}>Page {currentPage} / {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{ backgroundColor: currentPage === totalPages ? '#222' : '#333', color: currentPage === totalPages ? '#555' : 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' }}
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE (Playlist) */}
        <div style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '15px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            
            {/* BOUTON OPTIONS RETRACTABLE */}
            <button 
              onClick={() => setShowOptions(!showOptions)}
              onMouseEnter={() => setIsOptionsHovered(true)}
              onMouseLeave={() => setIsOptionsHovered(false)}
              style={{
                width: '100%',
                backgroundColor: isOptionsHovered ? '#3a3a3a' : '#252525',
                color: '#aaa',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <span> Options de mixage</span>
              <span>{showOptions ? '▲' : '▼'}</span>
            </button>

            {/* LE PANNEAU DES FILTRES SANS DÉROULANTE */}
            {showOptions && (
              <div style={{ backgroundColor: '#252525', padding: '15px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '2px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '6px' }}>Style musical ciblé</label>
                  <input 
                    type="text"
                    placeholder="Ex: synthwave, lofi, rap..."
                    value={filterGenre}
                    onChange={(e) => setFilterGenre(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.preventDefault(); // Évite aussi de lancer le mix depuis ce champ filtre
                    }}
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', boxSizing: 'border-box', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '6px' }}>Taille du mix (nombre de titres)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[20, 30, 50, 100].map((limit) => (
                      <button
                        key={limit}
                        type="button"
                        onClick={() => setFilterLimit(limit)}
                        style={{
                          flex: 1,
                          padding: '6px 0',
                          backgroundColor: filterLimit === limit ? '#E31B23' : '#333',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        {limit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <button 
                type="button" // <--- AJOUTÉ ICI
                onClick={generateSmartMix}
                disabled={mixLoading}
                onMouseEnter={() => setIsMixHovered(true)}
                onMouseLeave={() => setIsMixHovered(false)}
                style={{
                  flex: 3,
                  background: isMixHovered ? 'linear-gradient(45deg, #FF1E27, #B30006)' : 'linear-gradient(45deg, #E31B23, #990005)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: mixLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(227, 27, 35, 0.2)',
                  transition: 'all 0.2s ease',
                  opacity: mixLoading ? 0.7 : 1
                }}
              >
                {mixLoading ? 'Mix en cours...' : 'Générer ma playlist'}
              </button>

              <button 
                type="button" // <--- AJOUTÉ ICI
                onClick={resetPlaylist}
                onMouseEnter={() => setIsResetHovered(true)}
                onMouseLeave={() => setIsResetHovered(false)}
                style={{
                  flex: 1,
                  backgroundColor: isResetHovered ? '#444' : '#2a2a2a',
                  color: '#ff4444',
                  border: '1px solid #444',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                 Vider
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>
            <input 
              type="text" 
              value={playlistName} 
              onChange={(e) => setPlaylistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault(); // Évite la validation sur le nom de la playlist
              }}
              style={{ background: 'transparent', border: 'none', borderBottom: '1px dashed #666', color: '#E31B23', fontSize: '24px', fontWeight: 'bold', outline: 'none' }} 
            />
            <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>{myPlaylist.length} titre(s) enregistré(s)</p>
          </div>

          {/* SECTION CONTENANT LES MORCEAUX DE LA PLAYLIST TRONQUÉS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', flex: 1 }}>
            {currentPlaylistTracks.length > 0 ? (
              currentPlaylistTracks.map((track, index) => {
                const globalIndex = indexOfFirstPlaylistTrack + index;
                const globalId = `play-${globalIndex}`;
                return (
                  <div key={globalIndex} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#121212', padding: '10px 15px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <img src={track.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                      <div>
                        <h5 style={{ margin: '0 0 3px 0' }}>{track.name}</h5>
                        <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>{track.artist}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button onClick={() => playPreview(globalIndex, track.name, track.artist, true)} style={{ backgroundColor: playingTrackId === globalId ? '#1DB954' : '#222', color: 'white', border: 'none', borderRadius: '50px', padding: '6px 10px', cursor: 'pointer', fontSize: '11px' }}>
                        {playingTrackId === globalId ? '⏸' : '▶'}
                      </button>
                      <button onClick={() => removeFromPlaylist(globalIndex)} style={{ background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
                <p>Playlist vide</p>
              </div>
            )}
          </div>

          {/* BOUTONS DE PAGINATION POUR LA PLAYLIST (DROITE) */}
          {totalPlaylistPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: 'auto', marginBottom: '20px' }}>
              <button 
                onClick={() => setCurrentPlaylistPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPlaylistPage === 1}
                style={{ backgroundColor: currentPlaylistPage === 1 ? '#222' : '#333', color: currentPlaylistPage === 1 ? '#555' : 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: currentPlaylistPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s', fontSize: '13px' }}
              >
                Précédent
              </button>
              <span style={{ fontSize: '13px', color: '#aaa' }}>Page {currentPlaylistPage} / {totalPlaylistPages}</span>
              <button 
                onClick={() => setCurrentPlaylistPage(prev => Math.min(prev + 1, totalPlaylistPages))}
                disabled={currentPlaylistPage === totalPlaylistPages}
                style={{ backgroundColor: currentPlaylistPage === totalPlaylistPages ? '#222' : '#333', color: currentPlaylistPage === totalPlaylistPages ? '#555' : 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: currentPlaylistPage === totalPlaylistPages ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s', fontSize: '13px' }}
              >
                Suivant
              </button>
            </div>
          )}

          {myPlaylist.length > 0 && (
            <button 
              onClick={exportPlaylist} 
              onMouseEnter={() => setIsExportHovered(true)}
              onMouseLeave={() => setIsExportHovered(false)}
              style={{ 
                width: '100%', 
                backgroundColor: isExportHovered ? '#ff0000' : '#ff1125', 
                color: 'white', 
                padding: '16px', 
                border: 'none', 
                borderRadius: '30px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                transition: '0.2s',
                marginTop: 'auto'
              }}
            >
              Exporter la playlist
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default Generateur;