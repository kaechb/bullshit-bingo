/* ---------------------------
   CONFIG
---------------------------- */

const GRID_SIZE = 4;
const STORAGE_KEY = "bullshit-bingo-state";

/* ---------------------------
   STATE
---------------------------- */

let bingoCount = 0;
let completedLines = new Set();
let boardState = [];
let markedState = [];
let cells = [];
let soundEnabled = false;

/* ---------------------------
   AUDIO
---------------------------- */

const bingoSounds = [
  new Audio("sounds/bingo1.mp3"),
  new Audio("sounds/bingo2.mp3"),
  new Audio("sounds/bingo3.mp3"),
  new Audio("sounds/bingo4.mp3")
];

const specialBingoSounds = {
  2: new Audio("sounds/doublebingo.mp3"),
  3: new Audio("sounds/triplebingo.mp3"),
  4: new Audio("sounds/quadruplebingo.mp3"),
  5: new Audio("sounds/fivebingos.mp3"),
  crazy: new Audio("sounds/crazybingo.mp3")
};
const soundEnabledSound = new Audio("sounds/soundenabled.mp3");
soundEnabledSound.volume = 0.8;

[...bingoSounds, ...Object.values(specialBingoSounds)].forEach(s => {
  s.volume = 0.8;
});

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

const EVENTS = [
  "\"Mittlerwiile chammer you nur no SVP wähle\"",
  "\"FDP isch en gueti Partei\"",
  "N-wort",
  "Oliver wird fertiggmacht",
  "Felix seid was licht frauefeindlichs",
  "Peter bringt sin eigene Wii mit",
  "\"Wieso gahds so lang bis de lachs gschnitte isch\"",
  "Peter sexismus",
  "Ueli seid 10 minute lang nüt",
  "\"Euri chinder sind so smart\"",
  "Oliver und Felix flexed",
  "Oliver sini Karriere",
  "De Lachs das Jahr isch speziell gut",
  "Felix: Ich iss ke chalte Fisch",
  "Eis chinnd chotzt",
  "Immobiliepriise",
  "Erziehungstyps",
  "Fraue redet über Stille",
  "Fraue werdet gfragt wenns so wiit esch",
  "Das Jahr isch d Ernti schlecht gsi",
  "Giorgia lütet ah"
];

/* ---------------------------
   DOM
---------------------------- */

const gridEl = document.getElementById("bingo-grid");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("reset-btn");
const soundBtn = document.getElementById("sound-btn");

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

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  try {
    const data = JSON.parse(raw);
    boardState = data.boardState;
    markedState = data.markedState;
    bingoCount = data.bingoCount || 0;
    completedLines = new Set(data.completedLines || []);
    return true;
  } catch {
    return false;
  }
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

  checkBingo();
}

function createNewBoard() {
  bingoCount = 0;
  completedLines.clear();
  boardState = shuffle(EVENTS).slice(0, GRID_SIZE * GRID_SIZE);
  markedState = Array(GRID_SIZE * GRID_SIZE).fill(false);

  statusEl.textContent = "";
  document.querySelector(".app").classList.remove("bingo");

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
        ? "🎉 BINGO! Gratis Schnaps 🥃"
        : `🎉 ${bingoCount}× BINGO! Und en Schnaps 🥃`;

    playBingoSound(bingoCount);
    document.querySelector(".app").classList.add("bingo");
    saveState();
  }
}

/* ---------------------------
   EVENTS
---------------------------- */

resetBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  createNewBoard();
});

soundBtn.addEventListener("click", () => {
    soundEnabledSound.currentTime = 0;

    soundEnabledSound.play().then(() => {
      soundEnabled = true;
      soundBtn.textContent = "🔊 Ton aktiviert";
    }).catch(() => {});
  });

/* ---------------------------
   INIT
---------------------------- */

if (!loadState()) {
  createNewBoard();
} else {
  renderBoard();
}