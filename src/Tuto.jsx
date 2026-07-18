import React from 'react';
import { Link } from 'react-router-dom';

function Tuto() {
  return (
    <div style={{ 
      padding: '40px 20px', 
      maxWidth: '800px', 
      margin: '0 auto', 
      lineHeight: '1.6',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 10px 0' }}>
          <span style={{ color: '#E31B23' }}>Comment importer ta playlist sur Spotify ?</span> 
        </h1>

      </div>

      <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
        Les étapes à suivre
      </h2>

      <ol style={{ paddingLeft: '20px', color: '#ddd', fontSize: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <li>
          <strong style={{ color: 'white', fontSize: '18px' }}>Génère et exporte ta playlist</strong><br />
          Rends-toi sur le mixeur Discovr, crée ta playlist et clique sur le bouton rouge <strong>"Exporter la playlist"</strong> en bas à droite. Un fichier <code>.m3u</code> va se télécharger sur ton ordinateur ou ton téléphone.
        </li>
        
        <li>
          <strong style={{ color: 'white', fontSize: '18px' }}>Utilise un service de transfert</strong><br />
          <span style={{ display: 'inline-block', marginTop: '8px', lineHeight: '1.5' }}>
            Ouvre un nouvel onglet et rends-toi sur un site de transfert de playlists Spotify :{' '}
            <a 
              href="https://www.tunemymusic.com/fr/transfer?mode=spotify" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#E31B23', textDecoration: 'underline', fontWeight: 'bold' }}
            >
              TuneMyMusic
            </a>
            . Cette plateforme est officielle et sécurisée.
          </span>
        </li>

        <li>
          <strong style={{ color: 'white', fontSize: '18px' }}>Importe ton fichier fichier .m3u</strong><br />
          Sur le site de transfert, clique sur "Commencer". Pour la source, choisis <strong>"Télécharger un fichier"</strong> (Upload file) et sélectionne le fichier <code>.m3u</code> que tu viens de télécharger depuis Discovr.
        </li>

        <li>
          <strong style={{ color: 'white', fontSize: '18px' }}>Choisis la destination</strong><br />
          Sélectionne <strong>Spotify</strong> comme plateforme de destination. Le site te demandera de te connecter à ton compte Spotify et d'autoriser l'accès pour qu'il puisse y créer la playlist.
        </li>

        <li>
          <strong style={{ color: 'white', fontSize: '18px' }}>Lance le transfert </strong><br />
          Valide l'opération. En quelques secondes, l'outil va chercher les morceaux correspondants et créer la playlist directement dans ton application Spotify. 
        </li>
      </ol>

      <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '40px 0' }} />

      <div style={{ textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Prêt à écouter de nouveaux sons ?</h3>
        <Link to="/" style={{ 
          display: 'inline-block',
          backgroundColor: '#E31B23', 
          color: 'white', 
          padding: '12px 25px', 
          borderRadius: '30px', 
          textDecoration: 'none', 
          fontWeight: 'bold',
          transition: 'background-color 0.2s'
        }}>
          Retourner au Mixeur
        </Link>
      </div>

    </div>
  );
}

export default Tuto;