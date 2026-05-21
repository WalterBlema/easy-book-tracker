// ─────────────────────────────────────────────────────────────
// TEMPLATE — copie este arquivo para firebase-config.js
// e preencha com suas credenciais do Firebase Console.
//
// No Vercel: NÃO precisa fazer isso manualmente.
// O build.sh injeta as variáveis de ambiente automaticamente.
// Veja o README para o passo a passo completo.
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "seu-projeto.firebaseapp.com",
  projectId:         "seu-projeto",
  storageBucket:     "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};

export const FIREBASE_ENABLED = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
