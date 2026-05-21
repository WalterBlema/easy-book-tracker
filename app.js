// ════════════════════════════════════════════════════════════
//  Easy Book Tracker — main app
//  - Firebase Auth + Firestore (with localStorage fallback)
//  - CRUD livros, decorações, temas
//  - Google Books API para busca automática de capas
// ════════════════════════════════════════════════════════════

import { firebaseConfig, FIREBASE_ENABLED } from './firebase-config.js';

// Lazy-loaded Firebase modules
let _fb = null;
async function fb(){
  if(_fb) return _fb;
  const [{ initializeApp }, auth, store] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'),
  ]);
  const app = initializeApp(firebaseConfig);
  _fb = { app, auth: auth.getAuth(app), db: store.getFirestore(app), authMod: auth, storeMod: store };
  return _fb;
}

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const DEFAULT_LISTS = {
  genres: ['Fantasia','Romance','Ficção Científica','Mistério','Mito','Histórico','Memórias','Ensaio','Suspense'],
  statuses: ['Lido','Em leitura','Para ler','Abandonado','Desejado'],
  formats: ['Físico','Kindle','Ebook','Audiolivro'],
};

// ─── Emoji Database (name + tags for search) ──────────────────────────────────
const EMOJI_DB = [
  // Plantas
  {e:'🌱',n:'broto planta',t:'plantas natureza verde crescimento'},
  {e:'🪴',n:'vaso planta',t:'plantas natureza vaso interior'},
  {e:'🌿',n:'folha erva',t:'plantas natureza verde folha'},
  {e:'🍃',n:'folhas vento',t:'plantas natureza folha verde'},
  {e:'🍀',n:'trevo sorte',t:'plantas natureza verde sorte'},
  {e:'🌾',n:'trigo espiga',t:'plantas natureza campo'},
  {e:'🌵',n:'cacto deserto',t:'plantas natureza cacto'},
  {e:'🌲',n:'arvore pinheiro',t:'plantas natureza arvore'},
  {e:'🌳',n:'arvore frondosa',t:'plantas natureza arvore'},
  {e:'🎋',n:'bambu',t:'plantas natureza bambu'},
  {e:'🎍',n:'pinheiro decorado',t:'plantas natureza pinheiro'},
  {e:'🍂',n:'folha outono',t:'plantas natureza outono folha'},
  {e:'🍁',n:'folha bordo',t:'plantas natureza outono folha'},
  {e:'🍄',n:'cogumelo',t:'plantas natureza cogumelo'},
  {e:'🌰',n:'castanha',t:'plantas natureza outono'},
  {e:'🪨',n:'pedra rocha',t:'plantas natureza pedra'},
  {e:'🪵',n:'tronco madeira',t:'plantas natureza madeira'},
  // Flores
  {e:'🌸',n:'flor cerejeira',t:'plantas flores rosa sakura'},
  {e:'🌺',n:'hibisco flor',t:'plantas flores vermelho'},
  {e:'🌷',n:'tulipa flor',t:'plantas flores rosa'},
  {e:'🌻',n:'girassol flor',t:'plantas flores amarelo'},
  {e:'🌼',n:'margarida flor',t:'plantas flores amarelo'},
  {e:'🌹',n:'rosa flor',t:'plantas flores vermelho amor'},
  {e:'🥀',n:'flor murcha',t:'plantas flores'},
  {e:'💐',n:'buque flores',t:'plantas flores buque'},
  {e:'🪻',n:'jacinto flor',t:'plantas flores roxa'},
  // Animais
  {e:'🐱',n:'gato rosto',t:'animais gato felino'},
  {e:'🐈',n:'gato',t:'animais gato felino'},
  {e:'🐈‍⬛',n:'gato preto',t:'animais gato felino preto'},
  {e:'🦁',n:'leao',t:'animais selvagem felino'},
  {e:'🐯',n:'tigre',t:'animais selvagem felino'},
  {e:'🦊',n:'raposa',t:'animais raposa fox'},
  {e:'🐺',n:'lobo',t:'animais lobo wolf'},
  {e:'🐻',n:'urso',t:'animais urso bear'},
  {e:'🐼',n:'panda',t:'animais panda'},
  {e:'🦔',n:'porco espinho',t:'animais'},
  {e:'🐇',n:'coelho',t:'animais coelho rabbit'},
  {e:'🐿️',n:'esquilo',t:'animais esquilo'},
  {e:'🦦',n:'lontra',t:'animais lontra'},
  {e:'🦥',n:'preguica',t:'animais preguica'},
  {e:'🐢',n:'tartaruga',t:'animais reptil'},
  {e:'🐍',n:'cobra',t:'animais reptil'},
  {e:'🦎',n:'lagarto',t:'animais reptil'},
  {e:'🐸',n:'sapo',t:'animais sapo'},
  {e:'🦋',n:'borboleta',t:'animais inseto borboleta'},
  {e:'🐝',n:'abelha',t:'animais inseto abelha'},
  {e:'🐛',n:'lagarta',t:'animais inseto'},
  {e:'🐌',n:'caracol',t:'animais molusco'},
  {e:'🐞',n:'joaninha',t:'animais inseto'},
  {e:'🦉',n:'coruja',t:'animais ave noite sabedoria'},
  {e:'🐦',n:'passaro',t:'animais ave passaro'},
  {e:'🦜',n:'papagaio',t:'animais ave colorido'},
  {e:'🦅',n:'aguia',t:'animais ave'},
  {e:'🦚',n:'pavao',t:'animais ave colorido'},
  {e:'🐧',n:'pinguim',t:'animais ave frio'},
  {e:'🦆',n:'pato',t:'animais ave'},
  {e:'🐠',n:'peixe colorido',t:'animais peixe'},
  {e:'🐡',n:'peixe baiacú',t:'animais peixe'},
  {e:'🐙',n:'polvo',t:'animais oceano'},
  {e:'🦑',n:'lula',t:'animais oceano'},
  {e:'🦐',n:'camarao',t:'animais oceano'},
  {e:'🐚',n:'concha',t:'animais oceano praia'},
  {e:'🐉',n:'dragao',t:'animais mitologia dragao'},
  {e:'🦄',n:'unicornio',t:'animais mitologia magico'},
  // Comida & Bebida
  {e:'☕',n:'cafe',t:'comida bebida cafe quente'},
  {e:'🫖',n:'chaleira',t:'comida bebida cha'},
  {e:'🍵',n:'cha xicara',t:'comida bebida cha verde'},
  {e:'🧋',n:'bubble tea',t:'comida bebida cha'},
  {e:'🥛',n:'leite',t:'comida bebida leite'},
  {e:'🍫',n:'chocolate',t:'comida doce chocolate'},
  {e:'🍬',n:'bala doce',t:'comida doce'},
  {e:'🍭',n:'pirulito',t:'comida doce'},
  {e:'🍰',n:'bolo fatia',t:'comida doce bolo'},
  {e:'🎂',n:'bolo aniversario',t:'comida doce bolo'},
  {e:'🧁',n:'cupcake',t:'comida doce bolo'},
  {e:'🍩',n:'rosquinha',t:'comida doce'},
  {e:'🍪',n:'biscoito cookie',t:'comida doce'},
  {e:'🥐',n:'croissant',t:'comida padaria'},
  {e:'🥐',n:'croissant pao',t:'comida padaria'},
  {e:'🍞',n:'pao',t:'comida padaria'},
  {e:'🥖',n:'baguete',t:'comida padaria'},
  {e:'🧇',n:'waffle',t:'comida cafe'},
  {e:'🍯',n:'mel pote',t:'comida doce mel'},
  {e:'🍓',n:'morango',t:'comida fruta'},
  {e:'🍒',n:'cereja',t:'comida fruta'},
  {e:'🍑',n:'pessego',t:'comida fruta'},
  {e:'🫐',n:'mirtilo',t:'comida fruta'},
  {e:'🍇',n:'uva',t:'comida fruta'},
  {e:'🍎',n:'maca vermelha',t:'comida fruta'},
  {e:'🍋',n:'limao',t:'comida fruta'},
  {e:'🍷',n:'vinho taca',t:'comida bebida alcool'},
  {e:'🥃',n:'whisky copo',t:'comida bebida alcool'},
  {e:'🍸',n:'cocktail',t:'comida bebida alcool'},
  {e:'🍺',n:'cerveja',t:'comida bebida alcool'},
  // Livros & Escrita
  {e:'📚',n:'pilha livros',t:'livros leitura'},
  {e:'📖',n:'livro aberto',t:'livros leitura'},
  {e:'📕',n:'livro vermelho',t:'livros leitura'},
  {e:'📗',n:'livro verde',t:'livros leitura'},
  {e:'📘',n:'livro azul',t:'livros leitura'},
  {e:'📙',n:'livro laranja',t:'livros leitura'},
  {e:'📓',n:'caderno',t:'livros escrita'},
  {e:'📔',n:'caderno decorado',t:'livros escrita'},
  {e:'📒',n:'ledger caderno',t:'livros escrita'},
  {e:'📜',n:'pergaminho rolo',t:'livros escrita antigo'},
  {e:'📄',n:'folha papel',t:'livros escrita'},
  {e:'📝',n:'memorando',t:'livros escrita'},
  {e:'🖊️',n:'caneta esferografica',t:'livros escrita'},
  {e:'🖋️',n:'caneta tinteiro',t:'livros escrita'},
  {e:'✒️',n:'pena caneta',t:'livros escrita'},
  {e:'🪶',n:'pena escrita',t:'livros escrita'},
  {e:'🔖',n:'marcador pagina',t:'livros leitura'},
  {e:'🗂️',n:'pasta fichario',t:'livros organizar'},
  {e:'📌',n:'percevejo',t:'livros escritorio'},
  {e:'📍',n:'alfinete',t:'livros escritorio'},
  // Magia & Cosmo
  {e:'✨',n:'brilho estrelas',t:'magia cosmo brilho'},
  {e:'💫',n:'tonteira estrela',t:'magia cosmo'},
  {e:'⭐',n:'estrela',t:'magia cosmo estrela'},
  {e:'🌟',n:'estrela brilhante',t:'magia cosmo estrela'},
  {e:'🌠',n:'estrela cadente',t:'magia cosmo'},
  {e:'🌌',n:'galaxia via lactea',t:'magia cosmo espaco'},
  {e:'🌙',n:'lua crescente',t:'magia cosmo lua'},
  {e:'🌛',n:'lua rosto esquerda',t:'magia cosmo lua'},
  {e:'🌜',n:'lua rosto direita',t:'magia cosmo lua'},
  {e:'🌚',n:'lua cheia rosto',t:'magia cosmo lua'},
  {e:'🌝',n:'lua cheia feliz',t:'magia cosmo lua'},
  {e:'🪐',n:'saturno planeta',t:'magia cosmo espaco'},
  {e:'☄️',n:'cometa',t:'magia cosmo espaco'},
  {e:'🔮',n:'bola cristal',t:'magia cosmo magico'},
  {e:'🧿',n:'olho mau amuleto',t:'magia proteção'},
  {e:'🪬',n:'hamsa mao',t:'magia proteção'},
  {e:'🧲',n:'ima magico',t:'magia'},
  {e:'⚡',n:'raio trovao',t:'magia energia'},
  {e:'🌀',n:'redemoinho',t:'magia cosmo'},
  {e:'🎆',n:'fogos de artificio',t:'magia celebracao'},
  {e:'🎇',n:'sparkler fogos',t:'magia celebracao'},
  // Objetos & Decoração
  {e:'🕯️',n:'vela',t:'objetos luz aconchego'},
  {e:'🪔',n:'lamparina oleo',t:'objetos luz'},
  {e:'🔦',n:'lanterna',t:'objetos luz'},
  {e:'💡',n:'lampada ideia',t:'objetos luz'},
  {e:'🗝️',n:'chave antiga',t:'objetos misterio'},
  {e:'🔑',n:'chave',t:'objetos'},
  {e:'🪞',n:'espelho',t:'objetos decoracao'},
  {e:'🖼️',n:'quadro moldura',t:'objetos arte decoracao'},
  {e:'🏺',n:'vaso anfora',t:'objetos decoracao antigo'},
  {e:'🪆',n:'matrioshka boneca',t:'objetos decoracao'},
  {e:'🧸',n:'ursinho pelucia',t:'objetos brinquedo'},
  {e:'🎀',n:'laco fita',t:'objetos decoracao'},
  {e:'🎁',n:'presente caixa',t:'objetos presente'},
  {e:'🎭',n:'mascaras teatro',t:'objetos arte'},
  {e:'🎨',n:'paleta tinta',t:'objetos arte'},
  {e:'🎻',n:'violino instrumento',t:'objetos musica'},
  {e:'🎷',n:'saxofone',t:'objetos musica'},
  {e:'🎹',n:'piano teclado',t:'objetos musica'},
  {e:'🎵',n:'nota musical',t:'objetos musica'},
  {e:'🎶',n:'notas musicais',t:'objetos musica'},
  {e:'⌛',n:'ampulheta',t:'objetos tempo'},
  {e:'⏳',n:'ampulheta areia',t:'objetos tempo'},
  {e:'🕰️',n:'relogio antigo',t:'objetos tempo'},
  {e:'🧭',n:'bussola',t:'objetos aventura'},
  {e:'🗺️',n:'mapa mundo',t:'objetos aventura'},
  {e:'⚓',n:'ancora',t:'objetos nautico'},
  {e:'🧩',n:'peca puzzle',t:'objetos jogo'},
  {e:'♟️',n:'xadrez peca',t:'objetos jogo'},
  {e:'🎲',n:'dado',t:'objetos jogo'},
  {e:'🪄',n:'varinha magica',t:'objetos magico'},
  {e:'👑',n:'coroa rei',t:'objetos realeza'},
  {e:'💍',n:'anel',t:'objetos joias'},
  {e:'💎',n:'diamante joias',t:'objetos joias'},
  {e:'🪙',n:'moeda',t:'objetos dinheiro'},
  {e:'🔭',n:'telescopio',t:'objetos ciencia'},
  {e:'🔬',n:'microscopio',t:'objetos ciencia'},
  {e:'⚗️',n:'frasco laboratorio',t:'objetos ciencia'},
  {e:'🧪',n:'tubo ensaio',t:'objetos ciencia'},
  {e:'🌂',n:'guarda chuva',t:'objetos tempo chuva'},
  {e:'☂️',n:'umbrella',t:'objetos chuva'},
  {e:'🧺',n:'cesta',t:'objetos casa'},
  {e:'🫙',n:'pote vidro',t:'objetos casa'},
  {e:'🪣',n:'balde',t:'objetos casa'},
  {e:'🛋️',n:'sofa poltrona',t:'objetos movel casa'},
  {e:'🪑',n:'cadeira',t:'objetos movel'},
  {e:'🪟',n:'janela',t:'objetos casa'},
  {e:'🪴',n:'vaso planta janela',t:'objetos casa plantas'},
  {e:'🧲',n:'ima',t:'objetos'},
  // Símbolos & Extras
  {e:'❤️',n:'coracao vermelho',t:'amor coração'},
  {e:'🧡',n:'coracao laranja',t:'amor coração'},
  {e:'💛',n:'coracao amarelo',t:'amor coração'},
  {e:'💚',n:'coracao verde',t:'amor coração'},
  {e:'💙',n:'coracao azul',t:'amor coração'},
  {e:'💜',n:'coracao roxo',t:'amor coração'},
  {e:'🖤',n:'coracao preto',t:'amor coração'},
  {e:'🤍',n:'coracao branco',t:'amor coração'},
  {e:'🌈',n:'arco iris',t:'colorido natureza'},
  {e:'☁️',n:'nuvem',t:'natureza ceu'},
  {e:'⛅',n:'nuvem sol',t:'natureza ceu'},
  {e:'🌤️',n:'sol poucas nuvens',t:'natureza ceu'},
  {e:'🌦️',n:'chuva nuvens',t:'natureza ceu'},
  {e:'❄️',n:'floco neve',t:'natureza frio inverno'},
  {e:'☃️',n:'boneco neve',t:'natureza frio inverno'},
  {e:'🔥',n:'fogo chama',t:'fogo energia'},
  {e:'💧',n:'gota agua',t:'natureza agua'},
  {e:'🌊',n:'onda mar',t:'natureza agua oceano'},
  {e:'🍃',n:'folhas voando',t:'plantas natureza'},
];

// Categoria → filtro de tags
const EMOJI_CATS = {
  plantas: 'plantas flores',
  animais: 'animais',
  comida:  'comida bebida',
  livros:  'livros escrita',
  magia:   'magia cosmo espaco',
  objetos: 'objetos arte musica',
  tudo:    '',
};

function filterEmojis(cat, query){
  let pool;
  if(cat === 'tema'){
    pool = getThemePalette().map(e => {
      const found = EMOJI_DB.find(x => x.e === e);
      return found || { e, n: e, t: '' };
    });
  } else if(cat === 'tudo' || !EMOJI_CATS[cat]){
    pool = EMOJI_DB;
  } else {
    const tags = EMOJI_CATS[cat].split(' ');
    pool = EMOJI_DB.filter(x => tags.some(tag => x.t.includes(tag) || x.n.includes(tag)));
  }
  if(!query) return pool;
  const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  return pool.filter(x => {
    const text = (x.n + ' ' + x.t).normalize('NFD').replace(/[̀-ͯ]/g,'');
    return text.includes(q);
  });
}

// Theme-specific decoration palettes
const THEME_PALETTES = {
  biblioteca: [
    '🌱','🪴','🌿','🍃','🌵','🌲','🌳','🥀',     // plants
    '☕','🫖','🍵','🥐','🍰','🍯','🕯️',           // cozy food/drink
    '📚','📖','📜','🪶','🖋️','🔖','🗝️',           // books & writing
    '🌙','⭐','🔮','🧿','💎','🏺','🎻',            // decor & magic
    '🐱','🦉','🐢','🦋','🦔',                     // animals
  ],
  pergaminho: [
    '🌿','🍃','🌾','🍂','🍁','🌼','🥀','🌸',
    '☕','🍵','🧇','🥐','🍞','🏺',
    '📜','🪶','🖋️','🗝️','📖','📕','⌛',
    '🌙','🕯️','⭐','🔮','🧿',
    '🦉','🐢','🐌','🐦',
  ],
  doce: [
    '🌸','🌷','🌺','🌻','🌼','🌹','🪻','💐',
    '🍰','🧁','🍪','🍫','🍬','🍭','🧇','🥐',
    '☕','🫖','🍵','🧋','🍓','🍒','🍑',
    '🐱','🐰','🐷','🦊','🐶','🐻','🧸','🦄',
    '✨','💫','🌟','💎','🎀','🎁',
  ],
  editorial: [
    '📰','🗞️','📋','📄','📝','✒️','🖊️','🖋️',
    '📚','📖','📕','📗','📘','🔖','📌','📍',
    '☕','🖥️','🗝️','⌛','🔭','🏛️',
    '🎭','🎬','🎨','🖼️','📷','🔍',
    '⭐','🌟','💡','🔦',
  ],
  cosmos: [
    '🌌','🌠','✨','💫','⭐','🌟','🌙','🌛','🌜','🌚',
    '🪐','🌍','🌏','🌎','☄️','🛸','🚀','🛰️',
    '🔮','💜','💙','🌀','⚡','🌊',
    '🦋','🐉','🦅','🦋','🦚','🦜',
    '💎','💠','🔵','🟣','🔷',
  ],
  botanica: [
    '🌿','🌱','🪴','🌾','🍃','🌵','🌲','🌳','🎋','🎍',
    '🌸','🌺','🌷','🌻','🌼','🥀','🍀','🌹',
    '🍂','🍁','🍄','🌰','🐚','🪨','🪵',
    '🦋','🐛','🐢','🐌','🦔','🐝','🐞','🦜',
    '☕','🍵','🧺','🏺','🪶',
  ],
  cyberpunk: [
    '⚡','🔋','💡','🔦','🖥️','🤖','🦾','🦿',
    '🎮','🕹️','📡','📻','🔭','🔬','⚙️','🔩',
    '🌐','💾','💿','📀','🔌','🖱️',
    '🐉','🦅','🦋','💀','☠️',
    '🌀','⭐','💥','⚠️','🚨','🔴','🟢','🟣',
  ],
  noir: [
    '🕯️','🌙','🌑','⭐','🔮','🗝️','🪞','🎩',
    '🥃','🍷','🍸','🎴','🃏','🎭','🎻','🎷',
    '🐈','🦅','🐍','🦇','🐺',
    '💎','🪙','💍','⌚','🔭','🏛️',
    '📜','🖋️','🗺️','🗿','🏺','⚔️',
  ],
  default: [
    '🌱','🪴','🌿','🌸','🌺','🌷','🌻','🍃','🍀','🌾','🌵','🍂','🌼','🪻',
    '☕','🫖','🍵','🥐','🍰','🧁','🍪','🍫','🍯',
    '🐷','🐱','🐶','🐰','🦊','🐻','🦔','🦋','🐢','🦉',
    '📚','📖','📜','🪶','🖋️','🔖',
    '🕯️','🌙','⭐','✨','💫','🌟','🔮','🗝️','💎',
  ],
};

function getThemePalette(){
  return THEME_PALETTES[state.theme] || THEME_PALETTES.default;
}

const state = {
  user: null,                       // {uid, email, name, photo, isGuest}
  books: [],
  decorations: [],
  theme: 'biblioteca',
  lists: { ...DEFAULT_LISTS },
  loading: false,
  unsubscribers: [],                // firestore listeners to cleanup
};

// ─────────────────────────────────────────────
// STORAGE  (Firebase OR localStorage)
// ─────────────────────────────────────────────
const LS_KEY = 'ebt:v1';

function lsRead(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  } catch(e){ return null; }
}
function lsWrite(data){
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch(e){}
}
function lsSnapshot(){
  return {
    theme: state.theme,
    lists: state.lists,
    books: state.books,
    decorations: state.decorations,
  };
}
function persistLocal(){
  if(state.user?.isGuest || !FIREBASE_ENABLED){
    lsWrite(lsSnapshot());
  }
}

function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36); }

// Add/update book
async function saveBook(book){
  if(!book.id) book.id = uid();
  if(!book.createdAt) book.createdAt = Date.now();
  book.updatedAt = Date.now();

  const idx = state.books.findIndex(b => b.id === book.id);
  if(idx >= 0) state.books[idx] = book; else state.books.push(book);

  if(state.user?.isGuest || !FIREBASE_ENABLED){
    persistLocal();
  } else {
    const { db, storeMod } = await fb();
    const { doc, setDoc } = storeMod;
    await setDoc(doc(db, 'users', state.user.uid, 'books', book.id), book);
  }
  rerenderAll();
}
async function deleteBook(id){
  state.books = state.books.filter(b => b.id !== id);
  if(state.user?.isGuest || !FIREBASE_ENABLED){
    persistLocal();
  } else {
    const { db, storeMod } = await fb();
    const { doc, deleteDoc } = storeMod;
    await deleteDoc(doc(db, 'users', state.user.uid, 'books', id));
  }
  rerenderAll();
}
async function saveProfile(){
  if(state.user?.isGuest || !FIREBASE_ENABLED){
    persistLocal(); return;
  }
  const { db, storeMod } = await fb();
  const { doc, setDoc } = storeMod;
  await setDoc(doc(db, 'users', state.user.uid), {
    email: state.user.email,
    displayName: state.user.name,
    photoURL: state.user.photo,
    theme: state.theme,
    lists: state.lists,
    decorations: state.decorations,
    updatedAt: Date.now(),
  }, { merge: true });
}

// Load all user data from Firestore
async function loadFromFirestore(){
  const { db, storeMod } = await fb();
  const { doc, getDoc, collection, onSnapshot, query } = storeMod;

  // Profile
  const profSnap = await getDoc(doc(db, 'users', state.user.uid));
  if(profSnap.exists()){
    const p = profSnap.data();
    state.theme = p.theme || 'biblioteca';
    state.lists = p.lists || { ...DEFAULT_LISTS };
    state.decorations = p.decorations || [];
  }
  applyTheme(state.theme);

  // Books — live subscribe
  const unsub = onSnapshot(collection(db, 'users', state.user.uid, 'books'), (qs) => {
    state.books = [];
    qs.forEach(d => state.books.push(d.data()));
    rerenderAll();
  });
  state.unsubscribers.push(unsub);
}

function loadFromLocal(){
  const data = lsRead();
  if(data){
    state.theme = data.theme || 'biblioteca';
    state.lists = data.lists || { ...DEFAULT_LISTS };
    state.books = data.books || [];
    state.decorations = data.decorations || [];
  }
  applyTheme(state.theme);
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
function setUser(user){
  state.user = user;
  if(user){
    document.getElementById('login-screen').hidden = true;
    document.getElementById('app').hidden = false;
    paintUser();
    if(user.isGuest || !FIREBASE_ENABLED){
      loadFromLocal();
      rerenderAll();
    } else {
      loadFromFirestore();
    }
  } else {
    document.getElementById('login-screen').hidden = false;
    document.getElementById('app').hidden = true;
    // cleanup listeners
    state.unsubscribers.forEach(u => { try { u(); } catch(e){} });
    state.unsubscribers = [];
  }
}

function paintUser(){
  const u = state.user;
  const avatar = u?.photo || '';
  const name = u?.name || u?.email || 'Visitante';
  const email = u?.email || (u?.isGuest ? 'sem conta · local' : '');
  document.getElementById('user-name').textContent = name;
  document.getElementById('user-avatar').src = avatar || svgAvatar(name);
  document.getElementById('dd-avatar').src = avatar || svgAvatar(name);
  document.getElementById('dd-name').textContent = name;
  document.getElementById('dd-email').textContent = email;
  document.getElementById('account-status').textContent =
    u?.isGuest ? 'Modo local (localStorage) — dados ficam só neste navegador' :
    !FIREBASE_ENABLED ? 'Firebase não configurado — usando modo local' :
    `Conectado como ${email}`;
}

function svgAvatar(name){
  const initial = (name||'?').trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#9a7434"/><text x="50%" y="55%" font-size="20" font-family="serif" fill="#f3d98a" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${initial}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

async function signInGoogle(){
  if(!FIREBASE_ENABLED){
    showAuthError('Firebase ainda não configurado. Use "Continuar sem conta" ou edite firebase-config.js.');
    return;
  }
  const { auth, authMod } = await fb();
  const provider = new authMod.GoogleAuthProvider();
  try {
    // Popup is faster and doesn't reload the page; fallback to redirect if blocked
    await authMod.signInWithPopup(auth, provider);
  } catch(popupErr){
    if(popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/popup-closed-by-user'){
      // Browser blocked the popup — fall back to full-page redirect
      try { await authMod.signInWithRedirect(auth, provider); }
      catch(e){ showAuthError(authErrMsg(e.code) || e.message); }
    } else {
      showAuthError(authErrMsg(popupErr.code) || popupErr.message);
    }
  }
}
async function signInEmail(email, password, isCreate){
  if(!FIREBASE_ENABLED){
    showAuthError('Firebase ainda não configurado. Use "Continuar sem conta" ou edite firebase-config.js.');
    return;
  }
  try {
    const { auth, authMod } = await fb();
    if(isCreate){
      await authMod.createUserWithEmailAndPassword(auth, email, password);
    } else {
      await authMod.signInWithEmailAndPassword(auth, email, password);
    }
  } catch(e){
    showAuthError(translateAuthError(e.code) || e.message);
  }
}
function translateAuthError(code){
  const map = {
    'auth/invalid-email':'Email inválido.',
    'auth/user-not-found':'Conta não encontrada. Tente criar uma.',
    'auth/wrong-password':'Senha incorreta.',
    'auth/invalid-credential':'Email ou senha incorretos.',
    'auth/email-already-in-use':'Já existe uma conta com esse email.',
    'auth/weak-password':'Senha muito curta (mínimo 6).',
    'auth/popup-closed-by-user':'Pop-up de login fechado.',
  };
  return map[code];
}
async function signOut(){
  if(state.user?.isGuest || !FIREBASE_ENABLED){
    setUser(null); return;
  }
  const { auth, authMod } = await fb();
  await authMod.signOut(auth);
}
function showAuthError(msg){
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.hidden = false;
}

// ─────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────
function applyTheme(theme){
  if(!['biblioteca','pergaminho','doce','editorial','cosmos','botanica','cyberpunk','noir'].includes(theme)) theme = 'biblioteca';
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-card').forEach(c => c.classList.toggle('is-active', c.dataset.theme === theme));
}
async function setTheme(theme){
  applyTheme(theme);
  await saveProfile();
  toast('Tema aplicado · ' + theme);
}

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────
function activateTab(name){
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.dataset.panel === name));
  rerenderAll();
}

// ─────────────────────────────────────────────
// RENDER — Painel
// ─────────────────────────────────────────────
function renderPainel(){
  const year = document.getElementById('year-pick').value;
  const filterByYear = b => {
    if(year === 'Todos') return true;
    if(!b.endDate) return false;
    return b.endDate.startsWith(year);
  };
  const yearBooks = state.books.filter(filterByYear);

  const lidos = yearBooks.filter(b => b.status === 'Lido').length;
  const emLeitura = state.books.filter(b => b.status === 'Em leitura').length;
  const paraLer = state.books.filter(b => b.status === 'Para ler').length;
  const pages = yearBooks.filter(b => b.status === 'Lido').reduce((a,b) => a + (Number(b.pages)||0), 0);

  document.getElementById('stat-read').textContent = lidos;
  document.getElementById('stat-reading').textContent = emLeitura;
  document.getElementById('stat-tbr').textContent = paraLer;
  document.getElementById('stat-pages').textContent = pages.toLocaleString('pt-BR');
  document.getElementById('stat-read-delta').textContent = year === 'Todos' ? 'em todos os anos' : `em ${year}`;

  // Donut
  const total = state.books.length || 1;
  const pct = Math.round((state.books.filter(b => b.status === 'Lido').length / total) * 100);
  document.getElementById('donut-pct').textContent = pct + '%';
  document.getElementById('donut-fill').setAttribute('stroke-dasharray', `${pct} ${100 - pct}`);

  // Status bars
  const counts = {
    'Lido': state.books.filter(b => b.status === 'Lido').length,
    'Em leitura': state.books.filter(b => b.status === 'Em leitura').length,
    'Para ler': state.books.filter(b => b.status === 'Para ler').length,
    'Abandonado': state.books.filter(b => b.status === 'Abandonado').length,
    'Desejado': state.books.filter(b => b.status === 'Desejado').length,
  };
  const max = Math.max(...Object.values(counts), 1);
  const sb = document.getElementById('status-bars');
  sb.innerHTML = Object.entries(counts).map(([name, n]) => `
    <div class="sb-row">
      <span class="sb-name">${name}</span>
      <span class="sb-bar"><i style="width:${(n/max)*100}%"></i></span>
      <span class="sb-n">${n}</span>
    </div>
  `).join('');

  // Monthly chart
  const months = [0,0,0,0,0,0,0,0,0,0,0,0];
  yearBooks.forEach(b => {
    if(b.status === 'Lido' && b.endDate){
      const m = parseInt(b.endDate.slice(5,7),10) - 1;
      if(m>=0 && m<12) months[m]++;
    }
  });
  const mmax = Math.max(...months, 1);
  const monthLabels = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  document.getElementById('months-chart').innerHTML = months.map((n,i) => `
    <div class="mc-col">
      <div class="mc-bar" style="height:${(n/mmax)*100}%" title="${monthLabels[i]} · ${n} livro(s)"></div>
      <span class="mc-lbl">${monthLabels[i]}</span>
    </div>
  `).join('');
  document.getElementById('months-year').textContent = year;

  // Top author / genre / format
  const mode = (arr) => {
    const c = {};
    arr.forEach(v => { if(v) c[v] = (c[v]||0)+1; });
    let top = '—', n = 0;
    for(const k in c){ if(c[k] > n){ n = c[k]; top = k; } }
    return top;
  };
  const finished = state.books.filter(b => b.status === 'Lido');
  document.getElementById('favs-list').innerHTML = `
    <div class="kv-row"><span class="k">Autor mais lido</span><span class="v">${mode(finished.map(b => b.author))}</span></div>
    <div class="kv-row"><span class="k">Gênero favorito</span><span class="v">${mode(finished.map(b => b.genre))}</span></div>
    <div class="kv-row"><span class="k">Formato dominante</span><span class="v">${mode(finished.map(b => b.format))}</span></div>
    <div class="kv-row"><span class="k">Total de páginas</span><span class="v">${state.books.reduce((a,b) => a + (Number(b.pages)||0), 0).toLocaleString('pt-BR')}</span></div>
  `;

  // Recent reads
  const recent = finished
    .filter(b => b.endDate)
    .sort((a,b) => b.endDate.localeCompare(a.endDate))
    .slice(0, 4);
  document.getElementById('recent-reads').innerHTML = recent.length === 0
    ? '<p class="muted" style="margin:0;font-size:13px;">Nada finalizado ainda. Marque um livro como <em>Lido</em> e ele aparecerá aqui.</p>'
    : recent.map(b => `
      <div class="rr-row">
        <div class="rr-cover">${b.coverUrl ? `<img src="${b.coverUrl}" alt=""/>` : ''}</div>
        <div class="rr-info">
          <div class="rr-title">${escapeHtml(b.title||'')}</div>
          <div class="rr-author">${escapeHtml(b.author||'')}</div>
        </div>
        <div class="rr-meta">${renderStars(b.rating)}<br/><small>${formatDateShort(b.endDate)}</small></div>
      </div>
    `).join('');

  renderShelves(finished);
}

// ─── Bookshelves ───
const SPINE_PALETTE = [
  // Vermelhos & Rosas
  ['#7a2f38','#3a1218'], // vermelho bordo
  ['#6b2235','#2a0c18'], // vinho escuro fosco
  ['#c44a3a','#5a1c10'], // vermelho tijolo
  ['#c04030','#581810'], // vermelho tomate
  ['#c44470','#5a1a30'], // rosa escuro
  ['#e09585','#9a3a2a'], // rosa salmão suave
  ['#c98898','#6a3838'], // rosa antigo
  ['#e8c0cc','#9a5060'], // rosa bebê claro
  ['#e048a8','#7a1055'], // rosa chiclete
  // Roxos & Lilases
  ['#5a2e5a','#280e28'], // roxo berinjela profundo
  ['#3c2060','#160830'], // roxo profundo
  ['#7535a8','#321055'], // violeta vibrante
  ['#8875b8','#3a3068'], // roxo ametista
  ['#b8a8d8','#5a4888'], // lilás lavanda
  ['#9878e0','#422e78'], // lilás orquídea médio
  // Azuis
  ['#3a4288','#14183a'], // azul índigo fechado
  ['#2e5870','#0e2030'], // azul petróleo escuro
  ['#5f7a8a','#243040'], // azul cadete acinzentado
  ['#7898b8','#384858'], // azul serenity acinzentado
  ['#6ab8c8','#285860'], // azul turquesa claro
  // Verdes
  ['#1e5028','#081a0e'], // verde bandeira escuro
  ['#4a6038','#1c2814'], // verde militar escuro
  ['#5a9080','#203a34'], // verde água suave
  ['#7dab8a','#2e4a38'], // verde chá pastel
  ['#8db8a0','#384e40'], // verde menta dessaturado
  ['#50c098','#185840'], // verde hortelã médio
  ['#90d890','#386838'], // verde claro pastel
  // Marrons & Bege
  ['#9b6b4b','#4a2e1e'], // marrom argila
  ['#9b7838','#4a3418'], // marrom ocre
  ['#7e4020','#381808'], // marrom chocolate
  ['#c8ab82','#7a5838'], // bege areia
  // Amarelo
  ['#c8982a','#5e4010'], // amarelo mostarda
];
function hashStr(s){
  let h = 5381;
  for(let i = 0; i < (s||'').length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}
function spineColor(b){
  return SPINE_PALETTE[hashStr((b.title||'') + (b.author||'')) % SPINE_PALETTE.length];
}
function spineHeight(b){
  const p = Number(b.pages) || 0;
  const h = hashStr((b.title||'') + 'h');
  if(p > 0){
    // 200 págs ≈ 67%, 800 págs ≈ 97% — com variação orgânica de ±6%
    const base = Math.min(97, 63 + Math.round((p / 850) * 34));
    const vary = (h % 13) - 6;
    return Math.max(58, Math.min(100, base + vary));
  }
  // Sem páginas: range amplo 62–94%
  return 62 + (h % 33);
}
function spineTilt(b){
  const h = hashStr((b.title||'') + (b.author||'') + 'tilt');
  // ~1 em 5 livros ganha uma leve inclinação
  if(h % 5 === 0){
    const dir = (h % 2 === 0) ? 1 : -1;
    return dir * (3 + (h % 7)); // 3–9 graus
  }
  return 0;
}
function spineWidth(b){
  const p = Number(b.pages) || 0;
  if(p > 0) return Math.min(46, Math.max(22, 22 + Math.round(p / 45)));
  return 24 + (hashStr(b.author||b.title) % 16);
}

function renderShelves(finished){
  const leftHost  = document.getElementById('shelves-left');
  const rightHost = document.getElementById('shelves-right');
  if(!leftHost || !rightHost) return;

  const emptyHTML = `
    <div class="shelf-col-empty">
      <i data-lucide="library"></i>
      <p>Leia um livro!</p>
    </div>`;

  if(!finished || finished.length === 0){
    leftHost.innerHTML = emptyHTML;
    rightHost.innerHTML = emptyHTML;
    initIcons();
    return;
  }

  const byGenre = {};
  finished.forEach(b => {
    const g = b.genre || 'Outros';
    (byGenre[g] = byGenre[g] || []).push(b);
  });
  // Up to 6 genres, split evenly between left and right columns
  const shelves = Object.entries(byGenre)
    .sort((a,b) => b[1].length - a[1].length)
    .slice(0, 8);
  const leftShelves  = shelves.filter((_,i) => i % 2 === 0);
  const rightShelves = shelves.filter((_,i) => i % 2 === 1);

  function buildHTML(pairs){
    if(!pairs.length) return emptyHTML;
    return pairs.map(([genre, books]) => {
      books.sort((a,b) => (a.author||'').localeCompare(b.author||'','pt'));
      let prevColorIdx = -1;
      const bookItems = books.map((b,i) => {
        let ci = hashStr((b.title||'') + (b.author||'')) % SPINE_PALETTE.length;
        if(ci === prevColorIdx) ci = (ci + 1) % SPINE_PALETTE.length;
        prevColorIdx = ci;
        return { type:'book', data:b, pos: books.length === 1 ? 0.5 : i / (books.length - 1), colorIdx: ci };
      });
      const allItems = bookItems.slice().sort((a,b) => a.pos - b.pos);

      function renderItem(item){
        const b = item.data;
        const [c1,c2] = SPINE_PALETTE[item.colorIdx];
        const tilt = spineTilt(b);
        const tiltStyle = tilt ? `transform:rotate(${tilt}deg);transform-origin:bottom center;` : '';
        return `<button class="book-spine${tilt ? ' is-tilted' : ''}" data-id="${b.id}"
          style="background:linear-gradient(135deg,${c1},${c2});height:${spineHeight(b)}%;flex-basis:${spineWidth(b)}px;${tiltStyle}"
          title="${attr(b.title)} — ${attr(b.author||'')}">
          <span class="spine-top"></span>
          <span class="spine-title">${escapeHtml(b.title)}</span>
          <span class="spine-bottom"></span>
        </button>`;
      }

      // Split into rows of max 10 items so the shelf wraps into 2+ planks
      const ROW_SIZE = 10;
      const rows = [];
      for(let i = 0; i < allItems.length; i += ROW_SIZE) rows.push(allItems.slice(i, i + ROW_SIZE));
      const shelvesHTML = rows.map((rowItems, rowIdx) => {
        const rowDecos = (state.decorations||[]).filter(d => d.genre === genre && (d.row||0) === rowIdx);
        const decoHTML = rowDecos.map(d => renderShelfDecorEl(d)).join('');
        return `<div class="shelf"><div class="shelf-row" data-genre="${attr(genre)}" data-row="${rowIdx}">${rowItems.map(renderItem).join('')}${decoHTML}</div></div>`;
      }).join('');

      return `
        <div class="shelf-label">${escapeHtml(genre)} <span class="muted">· ${books.length}</span></div>
        ${shelvesHTML}`;
    }).join('');
  }

  leftHost.innerHTML  = buildHTML(leftShelves);
  rightHost.innerHTML = buildHTML(rightShelves);
}

// ─────────────────────────────────────────────
// RENDER — Tabela
// ─────────────────────────────────────────────
function renderTabela(){
  const q = (document.getElementById('search-books').value || '').toLowerCase();
  const fS = document.getElementById('filter-status').value;
  const fG = document.getElementById('filter-genre').value;
  const fF = document.getElementById('filter-format').value;

  const filtered = state.books.filter(b => {
    if(fS && b.status !== fS) return false;
    if(fG && b.genre !== fG) return false;
    if(fF && b.format !== fF) return false;
    if(q){
      const hay = (b.title+' '+(b.author||'')+' '+(b.series||'')).toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
  filtered.sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0));

  const tbody = document.getElementById('books-tbody');
  tbody.innerHTML = filtered.map(b => `
    <tr data-id="${b.id}">
      <td>${b.coverUrl ? `<img class="bt-cover" src="${b.coverUrl}" alt=""/>` : `<div class="bt-cover"></div>`}</td>
      <td>
        <div class="bt-title">${escapeHtml(b.title||'')}</div>
        ${b.series ? `<div class="bt-author">${escapeHtml(b.series)}</div>` : ''}
      </td>
      <td>${escapeHtml(b.author||'')}</td>
      <td>${b.genre ? `<span class="pill">${escapeHtml(b.genre)}</span>` : ''}</td>
      <td>${b.format ? `<span class="pill">${escapeHtml(b.format)}</span>` : ''}</td>
      <td>${b.status ? `<span class="pill s-${slug(b.status)}">${escapeHtml(b.status)}</span>` : ''}</td>
      <td>${b.pages || ''}</td>
      <td>${formatDateShort(b.startDate)}</td>
      <td>${formatDateShort(b.endDate)}</td>
      <td><span class="stars">${renderStars(b.rating)}</span></td>
      <td>${b.spice ? '🌶'.repeat(b.spice) : ''}</td>
      <td>${b.price ? 'R$ ' + Number(b.price).toFixed(2).replace('.',',') : ''}</td>
      <td><button class="row-delete" data-del="${b.id}" title="Excluir">🗑</button></td>
    </tr>
  `).join('');

  document.getElementById('books-empty').hidden = filtered.length > 0;

  // Populate genre filter
  const genreSel = document.getElementById('filter-genre');
  const curG = genreSel.value;
  genreSel.innerHTML = '<option value="">Todos os gêneros</option>' + state.lists.genres.map(g => `<option ${g===curG?'selected':''}>${escapeHtml(g)}</option>`).join('');
}

// ─────────────────────────────────────────────
// RENDER — Resenhas
// ─────────────────────────────────────────────
function renderResenhas(){
  const fR = document.getElementById('gallery-filter-rating').value;
  const fG = document.getElementById('gallery-filter-genre').value;
  const sort = document.getElementById('gallery-sort').value;

  let list = state.books.filter(b => b.status === 'Lido' && (b.rating||0) > 0);
  if(fR) list = list.filter(b => b.rating >= Number(fR));
  if(fG) list = list.filter(b => b.genre === fG);
  if(sort === 'rating') list.sort((a,b) => (b.rating||0) - (a.rating||0));
  else if(sort === 'title') list.sort((a,b) => (a.title||'').localeCompare(b.title||'','pt'));
  else list.sort((a,b) => (b.endDate||'').localeCompare(a.endDate||''));

  document.getElementById('gallery-grid').innerHTML = list.map(b => renderCoverCard(b)).join('');
  document.getElementById('gallery-empty').hidden = list.length > 0;

  // Genre filter
  const g = document.getElementById('gallery-filter-genre');
  const cur = g.value;
  g.innerHTML = '<option value="">Todos os gêneros</option>' + state.lists.genres.map(x => `<option ${x===cur?'selected':''}>${escapeHtml(x)}</option>`).join('');
}

function renderCoverCard(b){
  return `
    <div class="g-card" data-id="${b.id}">
      <div class="g-cover">
        ${b.coverUrl ? `<img src="${b.coverUrl}" alt="${escapeHtml(b.title||'')}"/>` : `<div class="g-cover-fallback">${escapeHtml(b.title||'')}</div>`}
      </div>
      <div class="g-meta">
        <div class="g-title">${escapeHtml(b.title||'')}</div>
        <div class="g-author">${escapeHtml(b.author||'')}</div>
        ${b.rating ? `<div class="g-stars">${renderStars(b.rating)}</div>` : ''}
      </div>
    </div>`;
}

// ─────────────────────────────────────────────
// RENDER — Wishlist
// ─────────────────────────────────────────────
function renderWishlist(){
  const list = state.books.filter(b => b.status === 'Desejado');
  const total = list.reduce((a,b) => a + (Number(b.price)||0), 0);
  document.getElementById('wishlist-total').textContent = 'R$ ' + total.toFixed(2).replace('.',',');
  document.getElementById('wish-grid').innerHTML = list.map(b => `
    <div class="wish-card" data-id="${b.id}">
      <div class="wish-cover">${b.coverUrl ? `<img src="${b.coverUrl}"/>` : ''}</div>
      <div class="wish-meta">
        <div class="wish-title">${escapeHtml(b.title||'')}</div>
        <div class="wish-author">${escapeHtml(b.author||'')}</div>
        <div class="wish-row"><span>${escapeHtml(b.genre||'')}</span><span>${escapeHtml(b.format||'')}</span></div>
        <div class="wish-row"><span>${escapeHtml(b.notes||'')}</span><span class="wish-price">${b.price ? 'R$ ' + Number(b.price).toFixed(2).replace('.',',') : ''}</span></div>
      </div>
    </div>
  `).join('');
  document.getElementById('wish-empty').hidden = list.length > 0;
}

// ─────────────────────────────────────────────
// RENDER — TBR
// ─────────────────────────────────────────────
function renderTBR(){
  const list = state.books.filter(b => b.status === 'Para ler');
  document.getElementById('tbr-grid').innerHTML = list.map(b => renderCoverCard(b)).join('');
  document.getElementById('tbr-empty').hidden = list.length > 0;
}

// ─────────────────────────────────────────────
// RENDER — Config
// ─────────────────────────────────────────────
function renderConfig(){
  const renderList = (key, ulId) => {
    const ul = document.getElementById(ulId);
    ul.innerHTML = state.lists[key].map((v,i) => `<li><span>${escapeHtml(v)}</span><button data-removelist="${key}" data-i="${i}">×</button></li>`).join('');
  };
  renderList('genres','list-genres');
  renderList('statuses','list-statuses');
  renderList('formats','list-formats');
}

// ─────────────────────────────────────────────
// DRAG-TO-SHELF DECORATION SYSTEM
// ─────────────────────────────────────────────
let _decorDrag   = null;  // {src, type} while in placement mode
let _decorResize = null;  // {id, startX, startY, startSize} while resizing
let _pendingCustomSrc = null; // base64 data URL from file upload

/** Render one shelf decoration inline inside a .shelf-row */
function renderShelfDecorEl(d){
  const src  = d.src || d.emoji || '';
  const type = d.type || (src.startsWith('data:') || src.startsWith('http') ? 'img' : 'emoji');
  const size = d.size || 36;
  const inner = type === 'img'
    ? `<img src="${attr(src)}" alt="" draggable="false" style="width:${size}px;height:${size}px;object-fit:contain;">`
    : `<span style="font-size:${size}px;line-height:1;">${escapeHtml(src)}</span>`;
  return `<div class="shelf-decor" data-did="${d.id}" style="left:${(d.pos||0)*100}%;">
    ${inner}
    <button class="decor-del-btn"    data-did="${d.id}" title="Remover">×</button>
    <div    class="decor-resize-handle" data-did="${d.id}" title="Redimensionar"></div>
  </div>`;
}

function _exitPlacement(){
  _decorDrag = null;
  document.body.classList.remove('placing-mode');
  const ghost = document.getElementById('sticker-ghost');
  if(ghost) ghost.hidden = true;
  document.querySelectorAll('.shelf-row.drop-target').forEach(el => el.classList.remove('drop-target'));
}

// ── Resize handle: pointerdown/move/up ──────────────────
document.addEventListener('pointerdown', (e) => {
  const handle = e.target.closest('.decor-resize-handle');
  if(!handle) return;
  e.preventDefault(); e.stopPropagation();
  const id = handle.dataset.did;
  const d  = state.decorations.find(x => x.id === id);
  if(!d) return;
  handle.setPointerCapture(e.pointerId);
  _decorResize = { id, startX: e.clientX, startY: e.clientY, startSize: d.size || 36 };
  handle.closest('.shelf-decor')?.classList.add('resizing');
});

document.addEventListener('pointermove', (e) => {
  if(!_decorResize) return;
  e.preventDefault();
  const { id, startX, startY, startSize } = _decorResize;
  // Diagonal delta: right+down = bigger, left+up = smaller
  const delta = ((e.clientX - startX) + (e.clientY - startY)) / 1.4;
  const newSize = Math.max(16, Math.min(140, Math.round(startSize + delta)));
  // Live update DOM without re-rendering
  const el = document.querySelector(`.shelf-decor[data-did="${id}"]`);
  if(!el) return;
  const img  = el.querySelector('img');
  const span = el.querySelector('span');
  if(img)  { img.style.width = newSize + 'px'; img.style.height = newSize + 'px'; }
  if(span) { span.style.fontSize = newSize + 'px'; }
});

document.addEventListener('pointerup', async (e) => {
  if(!_decorResize) return;
  const { id, startX, startY, startSize } = _decorResize;
  _decorResize = null;
  document.querySelectorAll('.shelf-decor.resizing').forEach(el => el.classList.remove('resizing'));
  const delta = ((e.clientX - startX) + (e.clientY - startY)) / 1.4;
  const newSize = Math.max(16, Math.min(140, Math.round(startSize + delta)));
  const d = state.decorations.find(x => x.id === id);
  if(d){ d.size = newSize; await saveProfile(); persistLocal(); }
});
// ────────────────────────────────────────────────────────

// Click on .decor-pick → enter placement mode (ghost follows mouse freely)
// Click again while in placement mode → place on shelf OR cancel if outside shelf
document.addEventListener('click', async (e) => {
  const pick = e.target.closest('.decor-pick');

  if(pick){
    // Enter (or replace) placement mode
    const src  = pick.dataset.add || _pendingCustomSrc;
    const type = pick.dataset.type || 'emoji';
    if(!src) return;
    _decorDrag = { src, type };
    document.body.classList.add('placing-mode');
    const ghost = document.getElementById('sticker-ghost');
    if(ghost){
      ghost.innerHTML = type === 'img'
        ? `<img src="${attr(src)}" style="width:48px;height:48px;object-fit:contain;">`
        : `<span style="font-size:44px;line-height:1;">${escapeHtml(src)}</span>`;
      ghost.style.left = e.clientX + 'px';
      ghost.style.top  = e.clientY + 'px';
      ghost.hidden = false;
    }
    closeDecorDrawer();
    toast('Clique numa prateleira para posicionar · ESC cancela', '');
    return;
  }

  if(!_decorDrag) return;
  // Ignore clicks on the resize handle or delete button (handled separately)
  if(e.target.closest('.decor-resize-handle, .decor-del-btn')) return;

  const row = e.target.closest('.shelf-row');
  if(!row){
    // Clicked outside any shelf → cancel placement
    _exitPlacement();
    return;
  }

  // Place decoration on the clicked shelf row
  const { src, type } = _decorDrag;
  _exitPlacement();
  const genre  = row.dataset.genre;
  const rowIdx = parseInt(row.dataset.row) || 0;
  const rect   = row.getBoundingClientRect();
  const pos    = Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width));
  state.decorations.push({ id: uid(), src, type, genre, row: rowIdx, pos, size: type === 'img' ? 48 : 36 });
  await saveProfile(); persistLocal();
  renderPainel();
  toast('Decoração adicionada ✨');
});

// Ghost follows mouse freely when in placement mode
document.addEventListener('mousemove', (e) => {
  if(!_decorDrag) return;
  const ghost = document.getElementById('sticker-ghost');
  if(ghost && !ghost.hidden){
    ghost.style.left = e.clientX + 'px';
    ghost.style.top  = e.clientY + 'px';
  }
  document.querySelectorAll('.shelf-row.drop-target').forEach(el => el.classList.remove('drop-target'));
  const below = document.elementFromPoint(e.clientX, e.clientY);
  if(below){ const row = below.closest('.shelf-row'); if(row) row.classList.add('drop-target'); }
});

// ESC cancels placement
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && _decorDrag) _exitPlacement();
});

function renderDecorations(){ /* shelf decorations rendered inline in buildHTML */ }
function hideDecorToolbar(){}
function showDecorToolbar(){}

let _decorActiveCat = 'tema';

function renderDecorPalette(){
  const query = (document.getElementById('decor-search')?.value || '').trim();
  const cat   = _decorActiveCat;
  const results = filterEmojis(cat, query);

  const countEl = document.getElementById('decor-count');
  if(countEl) countEl.textContent = results.length ? `${results.length} emoji${results.length !== 1 ? 's' : ''}` : 'Nenhum resultado';

  document.getElementById('decor-palette').innerHTML = results.length
    ? results.map(x => `<button class="decor-pick" data-add="${x.e}" title="${x.n}">${x.e}</button>`).join('')
    : `<div class="decor-empty">Nada encontrado para "<em>${escapeHtml(query)}</em>"</div>`;
}

async function addDecoration(emoji){
  // Find genres that have read books on their shelves
  const genres = [...new Set(
    state.books.filter(b => b.status === 'Lido').map(b => b.genre || 'Outros')
  )];
  if(genres.length === 0){
    toast('Adicione livros lidos para decorar sua estante! 📚', 'error');
    return;
  }
  // Pick a random genre shelf and a random position along it (0–1)
  const genre = genres[Math.floor(Math.random() * genres.length)];
  const pos = Math.random();
  state.decorations.push({ id: uid(), emoji, genre, pos, size: 36 });
  await saveProfile(); persistLocal();
  renderPainel();
  toast(`Adicionado à estante · ${genre} 🌿`);
}
// Kept as stub — old floating drag system no longer active, shelf-obj uses removeDecoration
async function updateDecoration(id, patch){ /* no-op for shelf decorations */ }
async function removeDecoration(id){
  state.decorations = state.decorations.filter(d => d.id !== id);
  await saveProfile(); persistLocal();
  renderPainel();
}
async function clearDecorations(){
  state.decorations = [];
  await saveProfile(); persistLocal();
  renderPainel();
}


// ─────────────────────────────────────────────
// BOOK MODAL
// ─────────────────────────────────────────────
function openBookModal(book){
  const isEdit = !!book;
  const m = document.getElementById('modal-book');
  document.getElementById('book-modal-title').textContent = isEdit ? 'Editar livro' : 'Adicionar livro';
  document.getElementById('book-delete').hidden = !isEdit;
  document.getElementById('cover-search-input').value = '';
  document.getElementById('cover-results').innerHTML = '';

  // populate dropdowns
  fillSel('f-genre', state.lists.genres, book?.genre);
  fillSel('f-format', state.lists.formats, book?.format);
  fillSel('f-status', state.lists.statuses, book?.status || 'Para ler');

  // fields
  setVal('f-id', book?.id || '');
  setVal('f-title', book?.title || '');
  setVal('f-author', book?.author || '');
  setVal('f-series', book?.series || '');
  setVal('f-pages', book?.pages || '');
  setVal('f-start', book?.startDate || '');
  setVal('f-end', book?.endDate || '');
  setVal('f-price', book?.price || '');
  setVal('f-notes', book?.notes || '');
  setVal('f-summary', book?.summary || '');
  setVal('f-quote', book?.quote || '');
  setVal('f-cover', book?.coverUrl || '');
  setVal('f-cover-url', book?.coverUrl || '');
  paintCoverPreview(book?.coverUrl);
  setStarPick('f-rating', book?.rating || 0);
  setStarPick('f-spice', book?.spice || 0);

  m.hidden = false;
  setTimeout(() => { document.getElementById('f-title').focus(); initIcons(); }, 30);
}
function closeBookModal(){
  document.getElementById('modal-book').hidden = true;
}

// ─────────────────────────────────────────────
// BOOK CARD VIEW (Ficha da Biblioteca)
// ─────────────────────────────────────────────
function openBookCard(b){
  const m = document.getElementById('modal-book-card');
  // Capa
  document.getElementById('bc-cover-wrap').innerHTML = b.coverUrl
    ? `<img src="${escapeHtml(b.coverUrl)}" alt="${attr(b.title)}" />`
    : `<div class="bc-cover-empty">📚</div>`;
  // Cabeçalho
  document.getElementById('bc-title').textContent = b.title || '—';
  document.getElementById('bc-author').textContent = b.author ? `de ${b.author}` : '';
  const seriesEl = document.getElementById('bc-series');
  seriesEl.textContent = b.series || '';
  seriesEl.hidden = !b.series;
  const genreEl = document.getElementById('bc-genre-badge');
  genreEl.textContent = b.genre || '';
  genreEl.hidden = !b.genre;
  // Campos
  document.getElementById('bc-format').textContent = b.format || '—';
  document.getElementById('bc-status').textContent = b.status || '—';
  document.getElementById('bc-pages').textContent = b.pages ? Number(b.pages).toLocaleString('pt-BR') + ' págs.' : '—';
  document.getElementById('bc-start').textContent = formatDateShort(b.startDate);
  document.getElementById('bc-end').textContent = formatDateShort(b.endDate);
  // Avaliação
  document.getElementById('bc-stars').innerHTML = b.rating ? renderStars(b.rating) : '';
  document.getElementById('bc-spice').textContent = b.spice ? '🌶'.repeat(b.spice) : '';
  document.getElementById('bc-price-tag').textContent = b.price ? 'R$ ' + Number(b.price).toFixed(2).replace('.',',') : '';
  // Seções de texto
  const showSec = (secId, txtId, content) => {
    document.getElementById(secId).hidden = !content;
    document.getElementById(txtId).textContent = content || '';
  };
  showSec('bc-notes-section',   'bc-notes',   b.notes);
  showSec('bc-summary-section', 'bc-summary', b.summary);
  showSec('bc-quote-section',   'bc-quote',   b.quote);
  m.dataset.bookId = b.id;
  m.hidden = false;
  initIcons();
}
function closeBookCard(){
  document.getElementById('modal-book-card').hidden = true;
}

function fillSel(id, opts, sel){
  const e = document.getElementById(id);
  e.innerHTML = '<option value=""></option>' + opts.map(o => `<option ${o===sel?'selected':''}>${escapeHtml(o)}</option>`).join('');
}
function setVal(id, v){ document.getElementById(id).value = v ?? ''; }
function setStarPick(containerId, n){
  document.querySelectorAll(`#${containerId} button`).forEach(b => {
    b.classList.toggle('on', Number(b.dataset.v) <= n);
  });
}
function paintCoverPreview(url){
  const cp = document.getElementById('cover-preview');
  cp.innerHTML = url ? `<img src="${url}" alt=""/>` : `<div class="cover-placeholder">capa</div>`;
}

// Star pick interaction
document.addEventListener('click', (e) => {
  const star = e.target.closest('.star-pick button');
  if(star){
    const v = Number(star.dataset.v);
    const wrap = star.parentElement;
    const cur = wrap.querySelectorAll('button.on').length;
    const next = (cur === v) ? v - 1 : v;
    wrap.querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) <= next));
  }
});

async function submitBook(){
  const id = document.getElementById('f-id').value || null;
  const title = document.getElementById('f-title').value.trim();
  if(!title){ toast('Coloque ao menos um título', 'error'); return; }
  const book = {
    id: id || undefined,
    title,
    author: val('f-author'),
    series: val('f-series'),
    genre: val('f-genre'),
    format: val('f-format'),
    status: val('f-status'),
    pages: Number(val('f-pages')) || 0,
    startDate: val('f-start'),
    endDate: val('f-end'),
    rating: countOn('f-rating'),
    spice: countOn('f-spice'),
    price: Number(val('f-price')) || 0,
    notes: val('f-notes'),
    summary: val('f-summary'),
    quote: val('f-quote'),
    coverUrl: val('f-cover'),
  };
  await saveBook(book);
  closeBookModal();
  toast('Livro salvo · ✓', 'success');
}
function val(id){ return document.getElementById(id).value.trim(); }
function countOn(containerId){ return document.querySelectorAll(`#${containerId} button.on`).length; }

// ─────────────────────────────────────────────
// BOOK COVER SEARCH — Google Books first, Open Library fallback
// ─────────────────────────────────────────────
let coverSearchTimer = null;
async function searchCovers(){
  const q = document.getElementById('cover-search-input').value.trim();
  const out = document.getElementById('cover-results');
  if(!q){ out.innerHTML = ''; return; }
  out.innerHTML = '<p class="muted small" style="margin:8px 4px">Buscando…</p>';

  // ── 1. Google Books (sem chave — funciona no browser, sem cota por IP) ──
  try {
    const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10&printType=books`;
    const gbR = await fetch(gbUrl);
    if(gbR.ok){
      const gbData = await gbR.json();
      const gbItems = (gbData.items || [])
        .filter(it => it.volumeInfo?.title)
        .map(it => {
          const vi = it.volumeInfo;
          let coverUrl = vi.imageLinks?.thumbnail || vi.imageLinks?.smallThumbnail || '';
          coverUrl = coverUrl.replace(/^http:/, 'https:').replace('zoom=1', 'zoom=2');
          return { title: vi.title, author: (vi.authors||[]).slice(0,2).join(', '), pages: vi.pageCount||0, coverUrl };
        });
      if(gbItems.length > 0){ renderCoverResults(out, gbItems); return; }
    }
  } catch(_){}

  // ── 2. Open Library (fallback) ──
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12&fields=key,title,author_name,number_of_pages_median,isbn,cover_i`;
    const r = await fetch(url);
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    const items = (data.docs || [])
      .filter(doc => doc.title)
      .slice(0, 10)
      .map(doc => {
        const coverId = doc.cover_i;
        const isbn    = (doc.isbn || [])[0] || '';
        const coverUrl = coverId
          ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
          : isbn
            ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
            : '';
        return { title: doc.title, author: (doc.author_name||[]).slice(0,2).join(', '), pages: doc.number_of_pages_median||0, coverUrl };
      });
    if(items.length === 0){
      out.innerHTML = '<p class="muted small" style="margin:8px 4px">Nenhum resultado. Tente outro termo.</p>';
      return;
    }
    renderCoverResults(out, items);
  } catch(e){
    out.innerHTML = `<p class="muted small" style="margin:8px 4px">Erro na busca: ${escapeHtml(e.message)}. Verifique sua conexão.</p>`;
  }
}
function renderCoverResults(out, items){
  out.innerHTML = items.map(it => `
    <div class="cr-item" data-title="${attr(it.title)}" data-author="${attr(it.author)}" data-pages="${it.pages}" data-cover="${attr(it.coverUrl)}">
      ${it.coverUrl
        ? `<img src="${it.coverUrl}" alt="" onerror="this.parentElement.querySelector('.cr-no-cover').style.display='grid';this.remove()"><div class="cr-no-cover" style="display:none;aspect-ratio:2/3;place-items:center;background:var(--surface-3);font-size:11px;color:var(--text-dim);">sem capa</div>`
        : `<div class="cr-no-cover" style="display:grid;aspect-ratio:2/3;place-items:center;background:var(--surface-3);font-size:11px;color:var(--text-dim);">sem capa</div>`}
      <div class="cr-title">${escapeHtml(it.title)}</div>
      <div class="cr-author">${escapeHtml(it.author)}</div>
    </div>
  `).join('');
}
function attr(s){ return (s||'').replace(/"/g,'&quot;'); }

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
function escapeHtml(s){
  return (s == null ? '' : String(s))
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function slug(s){ return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,'-'); }
function renderStars(n){
  n = Number(n)||0;
  return '★'.repeat(n) + `<span class="dim">${'★'.repeat(5-n)}</span>`;
}
function formatDateShort(iso){
  if(!iso) return '—';
  const [y,m,d] = iso.split('-');
  if(!d) return iso;
  return `${d}/${m}/${y.slice(2)}`;
}
function toast(msg, kind=''){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (kind ? ' is-'+kind : '');
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 2400);
}

// ─────────────────────────────────────────────
// RERENDER ALL
// ─────────────────────────────────────────────
function rerenderAll(){
  const active = document.querySelector('.panel.active')?.dataset.panel;
  if(active === 'painel') renderPainel();
  if(active === 'tabela') renderTabela();
  if(active === 'resenhas') renderResenhas();
  if(active === 'wishlist') renderWishlist();
  if(active === 'tbr') renderTBR();
  if(active === 'config') renderConfig();
}

// ─────────────────────────────────────────────
// EVENT WIRING
// ─────────────────────────────────────────────
function wire(){
  // Login form
  let isCreateMode = false;
  document.getElementById('btn-google').addEventListener('click', signInGoogle);
  document.getElementById('btn-toggle-mode').addEventListener('click', () => {
    isCreateMode = !isCreateMode;
    document.getElementById('btn-submit-email').textContent = isCreateMode ? 'Criar conta' : 'Entrar';
    document.getElementById('btn-toggle-mode').textContent = isCreateMode ? 'Já tenho conta' : 'Criar conta';
    // show/hide confirm-password field
    const fieldConfirm = document.getElementById('field-confirm');
    const confirmInput = document.getElementById('password-confirm');
    fieldConfirm.hidden = !isCreateMode;
    confirmInput.required = isCreateMode;
    if (!isCreateMode) confirmInput.value = '';
    // swap autocomplete hint for password field
    document.getElementById('password').autocomplete = isCreateMode ? 'new-password' : 'current-password';
    document.getElementById('auth-error').hidden = true;
  });
  document.getElementById('form-email').addEventListener('submit', (e) => {
    e.preventDefault();
    const errEl = document.getElementById('auth-error');
    errEl.hidden = true;
    const email    = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (isCreateMode) {
      const confirm = document.getElementById('password-confirm').value;
      if (password !== confirm) {
        errEl.textContent = 'As senhas não coincidem. Verifique e tente de novo.';
        errEl.hidden = false;
        return;
      }
    }
    signInEmail(email, password, isCreateMode);
  });
  document.getElementById('btn-guest').addEventListener('click', () => {
    setUser({ uid: 'guest', email: '', name: 'Visitante', photo: '', isGuest: true });
  });

  // Tabs
  document.getElementById('tabs').addEventListener('click', (e) => {
    const t = e.target.closest('.tab');
    if(!t) return;
    e.preventDefault();
    activateTab(t.dataset.tab);
    history.replaceState(null, '', '#' + t.dataset.tab);
  });

  // User dropdown
  const trigger = document.getElementById('user-trigger');
  const dd = document.getElementById('user-dropdown');
  trigger.addEventListener('click', () => {
    const open = !dd.hidden;
    dd.hidden = open;
    trigger.setAttribute('aria-expanded', String(!open));
    if(!open) initIcons();
  });
  document.addEventListener('click', (e) => {
    if(!e.target.closest('#user-menu')) dd.hidden = true;
  });
  dd.addEventListener('click', (e) => {
    const a = e.target.dataset.action;
    if(a === 'logout') signOut();
    if(a === 'theme'){ activateTab('config'); dd.hidden = true; }
    if(a === 'decorate'){ activateTab('painel'); openDecorDrawer(); dd.hidden = true; }
    if(a === 'export') exportJSON();
  });

  // FAB + buttons
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-action]');
    if(!a) return;
    const action = a.dataset.action;
    if(action === 'add-book') openBookModal(null);
    if(action === 'add-wishlist') openBookModal({ status: 'Desejado' });
    if(action === 'decorate') openDecorDrawer();
    if(action === 'export') exportJSON();
    if(action === 'import') document.getElementById('import-file').click();
    if(action === 'wipe') wipeAll();
    if(action === 'logout') signOut();
    if(action === 'surprise') surpriseTBR();
  });

  // Filters & search
  ['search-books','filter-status','filter-genre','filter-format','year-pick',
   'gallery-filter-rating','gallery-filter-genre','gallery-sort'].forEach(id => {
    document.getElementById(id).addEventListener('input', rerenderAll);
  });

  // Book modal
  document.getElementById('book-save').addEventListener('click', submitBook);
  document.getElementById('book-delete').addEventListener('click', async () => {
    const id = document.getElementById('f-id').value;
    if(id && confirm('Excluir este livro?')){
      await deleteBook(id);
      closeBookModal();
      toast('Livro excluído', 'success');
    }
  });
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeBookModal));
  document.getElementById('modal-book').addEventListener('click', (e) => {
    if(e.target.id === 'modal-book') closeBookModal();
  });

  // Cover search (debounced)
  const csi = document.getElementById('cover-search-input');
  csi.addEventListener('input', () => {
    clearTimeout(coverSearchTimer);
    coverSearchTimer = setTimeout(searchCovers, 500);
  });
  document.getElementById('cover-search-btn').addEventListener('click', searchCovers);
  csi.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); searchCovers(); } });
  document.getElementById('cover-results').addEventListener('click', (e) => {
    const it = e.target.closest('.cr-item');
    if(!it) return;
    setVal('f-title', it.dataset.title);
    setVal('f-author', it.dataset.author);
    if(it.dataset.pages && Number(it.dataset.pages) > 0) setVal('f-pages', it.dataset.pages);
    setVal('f-cover', it.dataset.cover);
    paintCoverPreview(it.dataset.cover);
    toast('Capa importada ✓');
  });

  // Shelf clicks: book spines open book card
  document.querySelector('[data-panel="painel"]').addEventListener('click', (e) => {
    const spine = e.target.closest('.book-spine');
    if(spine){
      const b = state.books.find(x => x.id === spine.dataset.id);
      if(b) openBookCard(b);
    }
  });

  // Edit / delete row in tabela
  document.getElementById('books-tbody').addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del]');
    if(del){
      e.stopPropagation();
      if(confirm('Excluir este livro?')){ await deleteBook(del.dataset.del); toast('Livro excluído','success'); }
      return;
    }
    const tr = e.target.closest('tr');
    if(tr){
      const b = state.books.find(x => x.id === tr.dataset.id);
      if(b) openBookModal(b);
    }
  });

  // Gallery click → edit
  document.getElementById('gallery-grid').addEventListener('click', clickCard);
  document.getElementById('tbr-grid').addEventListener('click', clickCard);
  document.getElementById('wish-grid').addEventListener('click', clickCard);
  function clickCard(e){
    const c = e.target.closest('[data-id]');
    if(!c) return;
    const b = state.books.find(x => x.id === c.dataset.id);
    if(b) openBookModal(b);
  }

  // Theme picker
  document.getElementById('theme-picker').addEventListener('click', (e) => {
    const card = e.target.closest('.theme-card');
    if(card) setTheme(card.dataset.theme);
  });

  // Editable lists
  document.querySelectorAll('.add-row button').forEach(b => {
    b.addEventListener('click', async () => {
      const list = b.dataset.list;
      const input = b.previousElementSibling;
      const v = input.value.trim();
      if(!v) return;
      if(!state.lists[list].includes(v)){
        state.lists[list].push(v);
        await saveProfile(); persistLocal();
        renderConfig();
      }
      input.value = '';
    });
  });
  document.querySelector('.editable-lists').addEventListener('click', async (e) => {
    const rm = e.target.closest('[data-removelist]');
    if(!rm) return;
    const list = rm.dataset.removelist;
    const i = Number(rm.dataset.i);
    state.lists[list].splice(i, 1);
    await saveProfile(); persistLocal();
    renderConfig();
  });

  // Decor drawer
  document.getElementById('decor-close').addEventListener('click', closeDecorDrawer);
  document.getElementById('decor-clear').addEventListener('click', clearDecorations);
  document.getElementById('btn-clear-decor').addEventListener('click', clearDecorations);
  // Palette item drag is handled at document level via pointerdown on .decor-pick

  // Decor search
  document.getElementById('decor-search').addEventListener('input', () => renderDecorPalette());
  document.getElementById('decor-search').addEventListener('search', () => renderDecorPalette());

  // Decor category tabs
  document.getElementById('decor-cats').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]');
    if(!btn) return;
    _decorActiveCat = btn.dataset.cat;
    document.querySelectorAll('.decor-cat').forEach(b => b.classList.toggle('active', b === btn));
    // Clear search when switching category
    const searchEl = document.getElementById('decor-search');
    if(searchEl) searchEl.value = '';
    renderDecorPalette();
  });

  // Custom image upload via FileReader
  const customFileInput = document.getElementById('custom-sticker-file');
  const customPreview   = document.getElementById('custom-sticker-preview');
  const customImg       = document.getElementById('custom-preview-img');
  customFileInput.addEventListener('change', () => {
    const file = customFileInput.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      _pendingCustomSrc = ev.target.result;
      customImg.src = _pendingCustomSrc;
      customPreview.hidden = false;
    };
    reader.readAsDataURL(file);
  });

  // Delete shelf decoration via × button
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.decor-del-btn');
    if(!btn) return;
    e.stopPropagation();
    await removeDecoration(btn.dataset.did);
  });

  // Import / export
  document.getElementById('import-file').addEventListener('change', handleImport);

  // ── Book card modal ──
  document.getElementById('card-close-x').addEventListener('click', closeBookCard);
  document.getElementById('card-close-btn').addEventListener('click', closeBookCard);
  document.getElementById('card-edit-btn').addEventListener('click', () => {
    const id = document.getElementById('modal-book-card').dataset.bookId;
    closeBookCard();
    const b = state.books.find(x => x.id === id);
    if(b) openBookModal(b);
  });
  document.getElementById('modal-book-card').addEventListener('click', (e) => {
    if(e.target.id === 'modal-book-card') closeBookCard();
  });

  // ── Cover URL paste ──
  document.getElementById('cover-url-btn').addEventListener('click', () => {
    const url = document.getElementById('f-cover-url').value.trim();
    if(url){ setVal('f-cover', url); paintCoverPreview(url); toast('Capa aplicada ✓'); }
  });
  // Aplica ao digitar/colar (com debounce básico)
  let coverUrlTimer = null;
  document.getElementById('f-cover-url').addEventListener('input', (e) => {
    clearTimeout(coverUrlTimer);
    coverUrlTimer = setTimeout(() => {
      const url = e.target.value.trim();
      if(url && url.startsWith('http') && url.includes('.')){
        setVal('f-cover', url);
        paintCoverPreview(url);
      }
    }, 600);
  });
  document.getElementById('f-cover-url').addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      e.preventDefault();
      const url = e.target.value.trim();
      if(url){ setVal('f-cover', url); paintCoverPreview(url); toast('Capa aplicada ✓'); }
    }
  });
}

function openDecorDrawer(){
  // Reset search + category to defaults
  _decorActiveCat = 'tema';
  const searchEl = document.getElementById('decor-search');
  if(searchEl) searchEl.value = '';
  document.querySelectorAll('.decor-cat').forEach(b =>
    b.classList.toggle('active', b.dataset.cat === 'tema')
  );
  document.getElementById('decor-drawer').hidden = false;
  renderDecorPalette();
  initIcons();
}
function closeDecorDrawer(){
  document.getElementById('decor-drawer').hidden = true;
  hideDecorToolbar();
}

function surpriseTBR(){
  const tbr = state.books.filter(b => b.status === 'Para ler');
  if(tbr.length === 0){ toast('Adicione livros à lista Para ler primeiro 📚'); return; }
  const pick = tbr[Math.floor(Math.random()*tbr.length)];
  openBookModal(pick);
  toast(`Que tal "${pick.title}"? 🎲`);
}

function exportJSON(){
  const data = lsSnapshot();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `easy-book-tracker-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Exportado ✓','success');
}
async function handleImport(e){
  const f = e.target.files?.[0];
  if(!f) return;
  try {
    const data = JSON.parse(await f.text());
    if(!confirm(`Importar ${data.books?.length||0} livro(s)? Os atuais serão mantidos.`)) return;
    (data.books||[]).forEach(b => { b.id = b.id || uid(); });
    state.books = [...state.books, ...(data.books||[])];
    if(data.lists) state.lists = data.lists;
    if(data.theme) applyTheme(data.theme);
    if(data.decorations) state.decorations = data.decorations;
    persistLocal();
    if(!state.user?.isGuest && FIREBASE_ENABLED){
      const { db, storeMod } = await fb();
      const { doc, setDoc } = storeMod;
      await Promise.all((data.books||[]).map(b => setDoc(doc(db,'users',state.user.uid,'books',b.id), b)));
      await saveProfile();
    }
    rerenderAll();
    toast('Importado ✓','success');
  } catch(err){
    toast('Erro ao importar: ' + err.message, 'error');
  }
  e.target.value = '';
}
async function wipeAll(){
  if(!confirm('Apagar TODOS os seus livros e decorações?')) return;
  for(const b of [...state.books]) await deleteBook(b.id);
  state.decorations = []; state.lists = { ...DEFAULT_LISTS };
  await saveProfile(); persistLocal();
  rerenderAll(); toast('Tudo apagado','success');
}

// ─────────────────────────────────────────────
// BOOT
// ──────────

// ═══════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════
function initIcons(){
  if(window.lucide) window.lucide.createIcons();
}

async function boot(){
  wire();
  renderDecorPalette();
  initIcons();

  // Initial tab from hash
  const hash = (location.hash || '#painel').slice(1);
  if(['painel','tabela','resenhas','wishlist','tbr','config'].includes(hash)){
    activateTab(hash);
  }

  if(FIREBASE_ENABLED){
    const { auth, authMod } = await fb();

    // Handle Google redirect result (returns from Google OAuth)
    try {
      await authMod.getRedirectResult(auth);
    } catch(e){
      if(e.code !== 'auth/no-current-user')
        showAuthError(authErrMsg(e.code) || e.message);
    }

    authMod.onAuthStateChanged(auth, (user) => {
      if(user){
        setUser({
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || user.email || 'Leitor',
          photo: user.photoURL || '',
          isGuest: false,
        });
      } else {
        setUser(null);
      }
    });
  }
}

boot();
