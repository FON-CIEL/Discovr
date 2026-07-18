import React from 'react';
import { Link } from 'react-router-dom';

function APropos() {
  return (
    <div style={{ 
      padding: '60px 20px', 
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      maxWidth: '800px',
      margin: '0 auto' 
    }}>
      {/* Titre avec la police et le style du tuto */}
      <h1 style={{ textAlign: 'center', fontSize: '36px', fontWeight: '800', marginBottom: '40px', color: '#E31B23' }}>
        À Propos
      </h1>
      
      <p style={{ fontSize: '20px', lineHeight: '1.8', marginBottom: '25px', textAlign: 'justify' }}>
        <strong>Discovr</strong> est un projet né d'un constat simple : aujourd'hui, les algorithmes des plateformes de streaming 
        les plus connues ont tendance à nous proposer toujours les mêmes sons, en boucle, sans nous permettre de 
        faire de nouvelles découvertes.
      </p>

      <p style={{ fontSize: '20px', lineHeight: '1.8', marginBottom: '25px', textAlign: 'justify' }}>
        <strong>Discovr</strong> a été conçu pour casser cette routine. Grâce aux différents outils proposés, tu 
        peux facilement trouver de nouveaux morceaux en partant d'une musique spécifique ou d'un style qui te plaît, 
        te permettant ainsi de découvrir tes prochains coups de cœur.
      </p>

      <p style={{ fontSize: '20px', lineHeight: '1.8', marginBottom: '25px', textAlign: 'justify' }}>
        Sur le plan technique, l'application a été développée en utilisant le langage JavaScript et la bibliothèque React.
        Pour offrir cette expérience de découverte, elle s'appuie sur l'API de Last.fm, qui sert de moteur de recommandation,
        et sur l'API iTunes Search, qui permet de récupérer les informations et les extraits audio nécessaires
      </p>

    {/* Bouton de retour */}
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

export default APropos;