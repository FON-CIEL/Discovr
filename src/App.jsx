import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';

// On importe ton mixeur
import Generateur from './Generateur'; 

import Tuto from './Tuto';
import APropos from './APropos';

function App() {
  // Cet état gère l'ouverture et la fermeture de notre menu déroulant
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fonction pour fermer le menu quand on clique sur un lien
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <Router>
      <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        
        {/* === L'EN-TÊTE === */}
        <nav style={{ padding: '20px 40px', backgroundColor: '#121212', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
          
          {/* TON LOGO IMAGE CLIQUABLE */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/favicon.PNG"
              alt="Logo Discovr" 
              style={{ height: '40px', objectFit: 'contain' }} 
            />
          </Link>
          
          {/* ZONE DU MENU DÉROULANT À DROITE */}
          <div style={{ position: 'relative' }}>
            {/* Le bouton "Hamburger" */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '28px', cursor: 'pointer' }}
            >
              ☰
            </button>

            {/* La liste déroulante (s'affiche seulement si isMenuOpen est true) */}
            {isMenuOpen && (
              <div style={{ 
                position: 'absolute', 
                top: '120%', 
                right: '0', 
                backgroundColor: '#121212', 
                borderRadius: '10px', 
                padding: '10px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '5px', 
                boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                minWidth: '200px',
                zIndex: 100 
              }}>
                <Link to="/" onClick={closeMenu} style={linkStyle}> Le Mixeur</Link>
                <Link to="/tuto" onClick={closeMenu} style={linkStyle}> Tutoriel Spotify</Link>
                <Link to="/a-propos" onClick={closeMenu} style={linkStyle}> À Propos</Link>
              </div>
            )}
          </div>
        </nav>

        {/* === LA ZONE CENTRALE === */}
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Generateur />} />
            <Route path="/tuto" element={<Tuto />} />
            <Route path="/a-propos" element={<APropos />} />
          </Routes>
        </div>

        {/* === LE PIED DE PAGE (FOOTER) === */}
        <footer style={{ marginTop: 'auto', padding: '20px', textAlign: 'center', backgroundColor: '#121212', borderTop: '1px solid #333', color: '#666', fontSize: '13px' }}>
          <p style={{ margin: '0 0 5px 0' }}>© {new Date().getFullYear()} Discovr. Tous droits réservés.</p>
        </footer>

      </div>
    </Router>
  );
}

// Un petit style réutilisable pour que les liens du menu soient jolis
const linkStyle = {
  color: '#e0e0e0',
  textDecoration: 'none',
  fontWeight: 'bold',
  padding: '12px 15px',
  borderRadius: '8px',
  display: 'block',
  transition: 'background-color 0.2s'
};

export default App;