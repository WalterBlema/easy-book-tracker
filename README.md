# 📖 Easy Book Tracker

Acompanhe sua leitura, wishlist e estantes — com tema personalizável e decorações temáticas. Funciona como app local (sem servidor) ou conectado ao Firebase com login Google / e-mail.

---

## ✨ O que tem dentro

- **6 abas:** Painel · Book Tracker · Resenhas & Galeria · Wishlist · Para Ler · Configurações
- **8 temas trocáveis:** Biblioteca · Pergaminho · Doce · Editorial · Cosmos · Botânica · Cyberpunk · Noir
- **Login** com Google ou e-mail/senha (Firebase), ou **modo local** sem conta
- **Busca de capas automática** via Google Books API (fallback para Open Library)
- **Decorações temáticas** por estilo, arrastáveis nas prateleiras, com controle de tamanho
- **CRUD completo:** adicionar, editar, excluir livros · filtros · busca · estrelas · pimentas
- **Painel reativo:** estatísticas, donut de status, gráfico mensal, autores favoritos
- **Layout biblioteca:** estantes laterais flanqueando o painel central
- **Backup:** exportar/importar JSON

---

## 🚀 Deploy completo (Firebase + Vercel)

### Etapa 1 — Criar o projeto Firebase (5 min)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com/) → **Adicionar projeto**
2. Dê um nome (ex: `easy-book-tracker`) e clique em continuar
3. Desative o Google Analytics se quiser simplificar → **Criar projeto**

---

### Etapa 2 — Ativar Authentication

1. No menu lateral: **Authentication** → **Get started**
2. Aba **Sign-in method** → habilite os dois métodos:

**Google:**
- Clique em Google → ative o toggle
- Escolha um e-mail de suporte (o seu mesmo)
- Salvar

**E-mail/Senha:**
- Clique em E-mail/Senha → ative o primeiro toggle (não precisa do link mágico)
- Salvar

---

### Etapa 3 — Criar o banco de dados Firestore

1. No menu lateral: **Firestore Database** → **Create database**
2. Escolha **Production mode** → Próximo
3. Região: **southamerica-east1 (São Paulo)** → Ativar

**Configurar as regras de segurança** (muito importante):

1. Vá em **Firestore Database** → aba **Rules**
2. Substitua tudo pelo seguinte:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Cada usuário só lê e escreve os próprios dados
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid;
    }

    // Nenhuma outra coleção é acessível
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Clique em **Publish**

---

### Etapa 4 — Pegar as credenciais do Firebase

1. Clique no ⚙️ ao lado de **Project Overview** → **Project settings**
2. Role até **Your apps** → clique no ícone **</>** (Web)
3. Dê um apelido (ex: `easy-book-tracker-web`) → **Register app**
4. Copie o objeto `firebaseConfig` que aparecer:

```js
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXX",
  authDomain: "easy-book-tracker.firebaseapp.com",
  projectId: "easy-book-tracker",
  storageBucket: "easy-book-tracker.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

---

### Etapa 5 — Configurar no GitHub

1. Crie um repositório no GitHub (pode ser privado ou público)
2. Suba esta pasta:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/easy-book-tracker.git
git push -u origin main
```

> **Atenção:** o arquivo `firebase-config.js` está no `.gitignore` propositalmente — as credenciais nunca vão para o repositório. Elas ficam seguras no Vercel (próxima etapa).

---

### Etapa 6 — Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com/) → **Add New… → Project**
2. Importe o repositório que você acabou de criar
3. Framework Preset: **Other** (é estático)
4. **Antes de dar Deploy**, clique em **Environment Variables** e adicione as 6 variáveis abaixo:

| Nome da variável               | Valor (copie do firebaseConfig)      |
|--------------------------------|--------------------------------------|
| `FIREBASE_API_KEY`             | o valor de `apiKey`                  |
| `FIREBASE_AUTH_DOMAIN`         | o valor de `authDomain`              |
| `FIREBASE_PROJECT_ID`          | o valor de `projectId`               |
| `FIREBASE_STORAGE_BUCKET`      | o valor de `storageBucket`           |
| `FIREBASE_MESSAGING_SENDER_ID` | o valor de `messagingSenderId`       |
| `FIREBASE_APP_ID`              | o valor de `appId`                   |

5. Clique em **Deploy**

O build roda o `build.sh`, que injeta as variáveis e gera o `firebase-config.js` no servidor. Suas credenciais nunca ficam no código.

---

### Etapa 7 — Autorizar o domínio no Firebase

Depois do deploy, o Vercel vai te dar uma URL como `easy-book-tracker.vercel.app`.

1. Firebase Console → **Authentication** → **Settings** → aba **Authorized domains**
2. Clique em **Add domain**
3. Digite `easy-book-tracker.vercel.app` (sem `https://`)
4. Salvar

Agora o login com Google vai funcionar no seu domínio.

---

## 🔒 Segurança — o que já está configurado

| Camada | O que protege | Status |
|---|---|---|
| **Firestore Rules** | Cada usuário só acessa seus próprios dados | ✅ Etapa 3 |
| **Auth Domains** | Bloqueia login Google em domínios não autorizados | ✅ Etapa 7 |
| **HTTP Headers** | XSS, clickjacking, MIME sniffing, HSTS | ✅ `vercel.json` |
| **Content Security Policy** | Bloqueia scripts e conexões não autorizados | ✅ `vercel.json` |
| **Credenciais fora do git** | API keys nunca aparecem no repositório | ✅ `.gitignore` + `build.sh` |

### Segurança extra (opcional mas recomendado)

**Restringir a API Key no Google Cloud** para que ela só funcione no seu domínio:

1. Acesse [console.cloud.google.com](https://console.cloud.google.com/)
2. Selecione o projeto Firebase → menu **APIs & Services** → **Credentials**
3. Clique na sua API Key
4. Em **Application restrictions** → selecione **HTTP referrers**
5. Adicione: `https://easy-book-tracker.vercel.app/*` (adapte para sua URL real)
6. Em **API restrictions** → **Restrict key** → selecione:
   - `Identity Toolkit API`
   - `Cloud Firestore API`
   - `Token Service API`
7. Salvar

Isso faz com que a chave só funcione no seu domínio — mesmo que alguém copie ela, não consegue usar.

---

## 🧪 Rodar localmente

Para rodar local **com Firebase** (não só localStorage):

1. Copie o template: `firebase-config.example.js` → `firebase-config.js`
2. Preencha com seus valores reais
3. Rode um servidor estático:

```bash
# Node.js
npx serve .

# Python
python3 -m http.server 8080

# Windows: dê dois cliques no start.bat
```

**Não abra direto com `file://`** — módulos ES e Firebase precisam de `http://`.

---

## 📦 Estrutura de arquivos

```
index.html                 ← shell do app
styles.css                 ← todos os temas e componentes
app.js                     ← lógica (auth, CRUD, render, decorações, busca)
firebase-config.js         ← suas credenciais (no .gitignore — não vai ao git)
firebase-config.example.js ← template para uso local
build.sh                   ← script de build para Vercel (injeta env vars)
vercel.json                ← config de deploy + headers de segurança
start.bat                  ← servidor local para Windows
README.md                  ← este arquivo
.gitignore
```

---

## ❓ Modo local (sem Firebase)

Se `firebase-config.js` estiver vazio ou ausente, o app funciona 100% no navegador:

- Dados salvos em `localStorage`
- "Login" só simbólico — clique em **Continuar sem conta**
- ⚠️ Limpar cache do navegador = perde tudo. Use **Exportar JSON** regularmente.

---

## 🐛 Problemas comuns

| Sintoma | Solução |
|---|---|
| Pop-up Google bloqueado | Permita pop-ups para o domínio |
| `auth/unauthorized-domain` | Adicione o domínio em Authentication → Settings → Authorized domains |
| Build falha no Vercel | Confira se todas as 6 variáveis de ambiente foram adicionadas |
| Capas não aparecem | Google Books pode bloquear algumas — o campo de URL manual sempre funciona |
| Tela branca / quebrada | F12 → Console → copie o erro |

---

## 📜 Licença

Faça o que quiser com o código. Os emojis são Unicode padrão, sem licença adicional.

Feito com 🌿 e ☕.
