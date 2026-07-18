export const authEndpoint = "https://accounts.spotify.com/authorize";
const redirectUri = "http://127.0.0.1:5173/";

// 1. METS TON CLIENT ID ICI
const clientId = "ef262804f97842828eeb7f7047568930"; 

const scopes = [
  "user-read-currently-playing",
  "user-read-recently-played",
  "user-read-playback-state",
  "user-top-read",
  "user-modify-playback-state",
  "playlist-read-private",          
  "playlist-read-collaborative"   
];

// Fonctions utilitaires pour le chiffrement PKCE requises par Spotify
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return transformArrayBufferToString(values, possible);
};

const transformArrayBufferToString = (values, possible) => {
  let text = '';
  for (let i = 0; i < values.length; i++) {
    text += possible[values[i] % possible.length];
  }
  return text;
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64urlencode = (a) => {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// 2. Fonction pour démarrer la connexion (génère les codes secrets)
export const redirectToSpotifyAuth = async () => {
  const codeVerifier = generateRandomString(64);
  window.localStorage.setItem('code_verifier', codeVerifier);

  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64urlencode(hashed);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scopes.join(' '),
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  window.location.href = `${authEndpoint}?${params.toString()}`;
};

// 3. Fonction cruciale qui échange le "code" de l'URL contre le VRAI "access_token"
export const getAccessToken = async (code) => {
  const codeVerifier = window.localStorage.getItem('code_verifier');

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  };

  const response = await fetch("https://accounts.spotify.com/api/token", payload);
  const data = await response.json();
  return data.access_token;
};