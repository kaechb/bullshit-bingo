let audioUnlocked = false;
let bingoCount = 0;
let completedLines = new Set();
function playBingoSound(count) {
    let sound;

    if (count === 1) {
      sound = bingoSounds[
        Math.floor(Math.random() * bingoSounds.length)
      ];
    } else if (count <= 5 && specialBingoSounds[count]) {
      sound = specialBingoSounds[count];
    } else {
      sound = specialBingoSounds.crazy;
    }

    sound.currentTime = 0;
    sound.play();
  }
  function unlockAudio() {
    if (audioUnlocked) return;

    const allSounds = [
      ...bingoSounds,
      ...Object.values(specialBingoSounds)
    ];

    allSounds.forEach(sound => {
      sound.play().then(() => {
        sound.pause();
        sound.currentTime = 0;
      }).catch(() => {});
    });

    audioUnlocked = true;
  }

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

  [...bingoSounds, ...Object.values(specialBingoSounds)]
    .forEach(s => s.volume = 0.8);
  function playRandomBingoSound() {
    const sound = bingoSounds[Math.floor(Math.random() * bingoSounds.length)];
    sound.currentTime = 0;
    sound.play();
  }
const GRID_SIZE = 4;
const STORAGE_KEY = "christmas-bingo-state";
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
const gridEl = document.getElementById("bingo-grid");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("reset-btn");

let cells = [];
let boardState = [];
let markedState = [];

function shuffle(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

function saveState() {
    const data = {
      boardState,
      markedState,
      bingoCount,
      completedLines: Array.from(completedLines)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

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
        unlockAudio();

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
      const isComplete = line.every(i => markedState[i]);

      if (isComplete && !completedLines.has(idx)) {
        completedLines.add(idx);
        newBingo = true;
      }
    });

if (newBingo) {
  bingoCount += 1;

  let label = "🎉 BINGO! Take a shot 🥃";
  if (bingoCount > 1) {
    label = `🎉 ${bingoCount}× BINGO! Take a shot 🥃`;
  }

  statusEl.textContent = label;
  playBingoSound(bingoCount);
  vibrateBingo();
  document.querySelector(".app").classList.add("bingo");
} else {
      document.querySelector(".app").classList.remove("bingo");
    }
  }
resetBtn.addEventListener("click", () => {
  clearState();
  createNewBoard();
});

if (!loadState()) {
  createNewBoard();
} else {
  renderBoard();
}
