/* ---------------------------
   CONFIG
---------------------------- */

const GRID_SIZE = 4;
const STORAGE_KEY = "bullshit-bingo-state";
const LANG_KEY = "bullshit-bingo-lang";

/* ---------------------------
   STATE
---------------------------- */

let currentLanguage = null; // "en" or "gsw"
let bingoCount = 0;
let completedLines = new Set();
let boardState = [];
let markedState = [];
let cells = [];
let soundEnabled = false;

/* ---------------------------
   TEXT
---------------------------- */

const TEXT = {
    en: {
      subtitle: "Tap events as they happen",
      enableSound: "🔊 Enable sound",
      soundEnabled: "🔊 Sound enabled",
      reset: "New card",
      bingo1: "🎉 BINGO! Take a shot 🥃",
      bingoN: n => `🎉 ${n}× BINGO! Take a shot 🥃`,
      finishTitle: "🎉 Bingo Complete 🎉",
      finish:
        "You won the bingo, there are no prizes, but at least you are drunk now.",
      finishBack: "⬅ Back to start"
    },
    gsw: {
      subtitle: "Berühr Situatione wo passiered",
      enableSound: "🔊 Mit Ton",
      soundEnabled: "🔊 Ton aktiviert",
      reset: "Neui Charte",
      bingo1: "🎉 BINGO! Gratis Schnaps 🥃",
      bingoN: n => `🎉 ${n}× BINGO! Und en Schnaps 🥃`,
      finishTitle: "🎉 Bingo fertiiiig 🎉",
      finish:
        "Gratuliere, du hesch gwunne! Es gid leider ke Priise aber immerhin bisch jetzt bsoffe.",
      finishBack: "⬅ Zrugg zun Aafang"
    }
  };

/* ---------------------------
   AUDIO
---------------------------- */

let bingoSounds = [];
let specialBingoSounds = {};
let soundEnabledSound = null;

function loadSounds() {
  const basePath =
    currentLanguage === "gsw" ? "sounds_swissgerman" : "sounds";
  const ext = currentLanguage === "gsw" ? "wav" : "mp3";

  bingoSounds = [
    new Audio(`${basePath}/bingo1.${ext}`),
    new Audio(`${basePath}/bingo2.${ext}`),
    new Audio(`${basePath}/bingo3.${ext}`),
    new Audio(`${basePath}/bingo4.${ext}`)
  ];

  specialBingoSounds = {
    2: new Audio(`${basePath}/doublebingo.${ext}`),
    3: new Audio(`${basePath}/triplebingo.${ext}`),
    4: new Audio(`${basePath}/quadruplebingo.${ext}`),
    5: new Audio(`${basePath}/fivebingos.${ext}`),
    crazy: new Audio(`${basePath}/crazybingo.${ext}`)
  };

  soundEnabledSound = new Audio(`${basePath}/soundenabled.${ext}`);
  soundEnabledSound.volume = 0.8;

  [...bingoSounds, ...Object.values(specialBingoSounds)].forEach(s => {
    s.volume = 0.8;
  });
}

function playBingoSound(count) {
  if (!soundEnabled) return;

  let sound;
  if (count === 1) {
    sound = bingoSounds[Math.floor(Math.random() * bingoSounds.length)];
  } else if (count <= 5 && specialBingoSounds[count]) {
    sound = specialBingoSounds[count];
  } else {
    sound = specialBingoSounds.crazy;
  }

  sound.currentTime = 0;
  sound.play().catch(() => {});
}

/* ---------------------------
   DATA
---------------------------- */

const EVENTS = {
  en: [
    "Politics are mentioned",
    "Awkward silence",
    "Wine gets spilled",
    "Someone talks about work too long",
    "A phone rings at the table",
    "Someone flexes their career",
    "The food is discussed critically",
    "Someone mentions crypto",
    "A child cries",
    "Someone checks their phone",
    "Old family story",
    "Unexpected guest",
    "Complaints about prices",
    "Discussion about parenting",
    "Someone praises the food loudly",
    "TV gets turned on"
  ],
  gsw: [
    "\"Mittlerwiile chammer you nur no SVP wähle\"",
    "\"FDP isch en gueti Partei\"",
    "Oliver wird fertiggmacht",
    "Felix seid was licht frauefeindlichs",
    "Peter bringt sin eigene Wii mit",
    "\"Wieso gahds so lang bis de Lachs gschnitte isch\"",
    "Peter Sexismus",
    "Ueli seid 10 Minute lang nüt",
    "\"Euri Chinder sind so smart\"",
    "Oliver und Felix flexed",
    "Oliver sini Karriere",
    "De Lachs isch dieses Jahr speziell guet",
    "Felix isst ke chalte Fisch",
    "Eis Chind chotzt",
    "Immobiliepriise",
    "Giorgia lütet ah"
  ]
};

/* ---------------------------
   DOM
---------------------------- */

const langScreen = document.getElementById("lang-screen");
const bingoScreen = document.getElementById("bingo-screen");

const gridEl = document.getElementById("bingo-grid");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("reset-btn");
const soundBtn = document.getElementById("sound-btn");
const subtitleEl = document.getElementById("subtitle");
const backBtn = document.getElementById("back-btn");
/* ---------------------------
   HELPERS
---------------------------- */

function shuffle(array) {
  return array
    .map(v => ({ v, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(o => o.v);
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      boardState,
      markedState,
      bingoCount,
      completedLines: Array.from(completedLines)
    })
  );
}

/* ---------------------------
   BOARD
---------------------------- */

function renderBoard() {
  gridEl.innerHTML = "";
  cells = [];

  boardState.forEach((text, index) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = text;

    if (markedState[index]) {
      cell.classList.add("marked");
    }

    cell.addEventListener("click", () => {
      markedState[index] = !markedState[index];
      cell.classList.toggle("marked");
      saveState();
      checkBingo();
    });

    gridEl.appendChild(cell);
    cells.push(cell);
  });
}

function createNewBoard() {
  bingoCount = 0;
  completedLines.clear();
  boardState = shuffle(EVENTS[currentLanguage]).slice(0, GRID_SIZE * GRID_SIZE);
  markedState = Array(GRID_SIZE * GRID_SIZE).fill(false);

  statusEl.textContent = "";
  saveState();
  renderBoard();
}

/* ---------------------------
   BINGO LOGIC
---------------------------- */

function checkBingo() {
  const lines = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    lines.push([...Array(GRID_SIZE)].map((_, c) => r * GRID_SIZE + c));
  }

  for (let c = 0; c < GRID_SIZE; c++) {
    lines.push([...Array(GRID_SIZE)].map((_, r) => r * GRID_SIZE + c));
  }

  lines.push([...Array(GRID_SIZE)].map((_, i) => i * GRID_SIZE + i));
  lines.push([...Array(GRID_SIZE)].map((_, i) => i * GRID_SIZE + (GRID_SIZE - 1 - i)));

  let newBingo = false;

  lines.forEach((line, idx) => {
    if (line.every(i => markedState[i]) && !completedLines.has(idx)) {
      completedLines.add(idx);
      newBingo = true;
    }
  });

  if (newBingo) {
    bingoCount += 1;

    statusEl.textContent =
      bingoCount === 1
        ? TEXT[currentLanguage].bingo1
        : TEXT[currentLanguage].bingoN(bingoCount);

    playBingoSound(bingoCount);
    saveState();
  }
  if (checkFinished()) {
    bingoScreen.style.display = "none";
    document.getElementById("finish-title").textContent =
    TEXT[currentLanguage].finishTitle;

  document.getElementById("finish-text").textContent =
    TEXT[currentLanguage].finish;

  document.getElementById("finish-back-btn").textContent =
    TEXT[currentLanguage].finishBack;

  document.getElementById("finish-screen").style.display = "block";
  }
}
function checkFinished() {
    return markedState.every(v => v);
  }
/* ---------------------------
   INIT FLOW
---------------------------- */

function startGame(lang) {
  currentLanguage = lang;
  localStorage.setItem(LANG_KEY, lang);

  langScreen.style.display = "none";
  bingoScreen.style.display = "block";

  subtitleEl.textContent = TEXT[lang].subtitle;
  resetBtn.textContent = TEXT[lang].reset;
  soundBtn.textContent = TEXT[lang].enableSound;

  loadSounds();
  createNewBoard();
}

/* ---------------------------
   EVENTS
---------------------------- */

document.getElementById("lang-en").addEventListener("click", () => {
  startGame("en");
});

document.getElementById("lang-gsw").addEventListener("click", () => {
  startGame("gsw");
});

soundBtn.addEventListener("click", () => {
  soundEnabledSound.currentTime = 0;
  soundEnabledSound.play().then(() => {
    soundEnabled = true;
    soundBtn.textContent = TEXT[currentLanguage].soundEnabled;
  }).catch(() => {});
});
if (backBtn) {
    backBtn.addEventListener("click", () => {
      bingoScreen.style.display = "none";
      langScreen.style.display = "block";

      soundEnabled = false;
      statusEl.textContent = "";

      localStorage.removeItem(STORAGE_KEY);
    });
  }
resetBtn.addEventListener("click", createNewBoard);
const finishBackBtn = document.getElementById("finish-back-btn");

if (finishBackBtn) {
  finishBackBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LANG_KEY);

    document.getElementById("finish-screen").style.display = "none";
    bingoScreen.style.display = "none";
    langScreen.style.display = "block";

    soundEnabled = false;
    statusEl.textContent = "";
  });
}
/* ---------------------------
   AUTO START IF SAVED
---------------------------- */

const savedLang = localStorage.getItem(LANG_KEY);
if (savedLang) {
  startGame(savedLang);
}