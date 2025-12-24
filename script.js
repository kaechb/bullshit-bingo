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
    markedState
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
  boardState = shuffle(EVENTS).slice(0, GRID_SIZE * GRID_SIZE);
  markedState = Array(GRID_SIZE * GRID_SIZE).fill(false);
  saveState();
  renderBoard();
}
let bingoTriggered = false;

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

  const bingo = lines.some(line =>
    line.every(i => markedState[i])
  );

  if (bingo && !bingoTriggered) {
    bingoTriggered = true;

    statusEl.textContent = "🎉 BINGO! Take a shot 🥃";
    playRandomBingoSound();
    document.querySelector(".app").classList.add("bingo");
  }

  if (!bingo) {
    statusEl.textContent = "";
    bingoTriggered = false;
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
normalizeCellSize();
function normalizeCellSize() {
    let maxSize = 0;

    cells.forEach(cell => {
      const rect = cell.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      if (size > maxSize) maxSize = size;
    });

    cells.forEach(cell => {
      cell.style.width = maxSize + "px";
      cell.style.height = maxSize + "px";
    });
  }

  const bingoSounds = [
    new Audio("sounds/bingo1.mp3"),
    new Audio("sounds/bingo2.mp3"),
    new Audio("sounds/bingo3.mp3")
  ];
  bingoSounds.forEach(s => s.volume = 0.8);
  function playRandomBingoSound() {
    const sound = bingoSounds[Math.floor(Math.random() * bingoSounds.length)];
    sound.currentTime = 0;
    sound.play();
  }