#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Script de build para Vercel.
# Gera firebase-config.js a partir das variáveis de ambiente
# configuradas no painel do Vercel.
# ─────────────────────────────────────────────────────────────

cat > firebase-config.js << EOF
// Gerado automaticamente pelo build.sh — não edite.
export const firebaseConfig = {
  apiKey:            "${FIREBASE_API_KEY}",
  authDomain:        "${FIREBASE_AUTH_DOMAIN}",
  projectId:         "${FIREBASE_PROJECT_ID}",
  storageBucket:     "${FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${FIREBASE_MESSAGING_SENDER_ID}",
  appId:             "${FIREBASE_APP_ID}"
};
export const FIREBASE_ENABLED = Boolean("${FIREBASE_API_KEY}" && "${FIREBASE_PROJECT_ID}");
EOF

echo "✓ firebase-config.js gerado com sucesso."
