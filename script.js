const CONFIG = {
    ROWS: 10,
    COLS: 10,
    MINES: 15
};

let board = [];
let firstClick = true;
let isGameOver = false;
let timerInterval;
let seconds = 0;
let translations = {};

const boardElem = document.getElementById('board');
const flagModeInput = document.getElementById('flag-mode');
const mineCountDisplay = document.getElementById('mine-count');
const timerDisplay = document.getElementById('timer');

function initGame() {
    isGameOver = false;
    firstClick = true;
    seconds = 0;
    board = [];
    boardElem.innerHTML = '';
    boardElem.style.gridTemplateColumns = `repeat(${CONFIG.COLS}, 1fr)`;
    mineCountDisplay.textContent = CONFIG.MINES.toString().padStart(3, '0');
    clearInterval(timerInterval);
    timerDisplay.textContent = '000';
    
    for (let r = 0; r < CONFIG.ROWS; r++) {
        board[r] = [];
        for (let c = 0; c < CONFIG.COLS; c++) {
            const cellElem = document.createElement('div');
            cellElem.classList.add('cell');
            
            const cell = {
                r, c,
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0,
                elem: cellElem
            };

            cellElem.addEventListener('click', () => handleAction(r, c));
            cellElem.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                toggleFlag(r, c);
            });
            
            boardElem.appendChild(cellElem);
            board[r][c] = cell;
        }
    }
}

function handleAction(r, c) {
    if (isGameOver) return;
    if (flagModeInput && flagModeInput.checked) {
        toggleFlag(r, c);
    } else {
        revealCell(r, c);
    }
}

function toggleFlag(r, c) {
    const cell = board[r][c];
    if (cell.isRevealed) return;
    cell.isFlagged = !cell.isFlagged;
    cell.elem.classList.toggle('flagged');
    cell.elem.textContent = cell.isFlagged ? '🚩' : '';
    
    const flaggedCount = board.flat().filter(c => c.isFlagged).length;
    mineCountDisplay.textContent = Math.max(0, CONFIG.MINES - flaggedCount).toString().padStart(3, '0');
}

function revealCell(r, c) {
    const cell = board[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    if (firstClick) {
        firstClick = false;
        generateMines(r, c);
        startTimer();
    }

    cell.isRevealed = true;
    cell.elem.classList.add('revealed');

    if (cell.isMine) {
        endGame(false);
        return;
    }

    if (cell.neighborMines > 0) {
        cell.elem.textContent = cell.neighborMines;
        cell.elem.classList.add(`n-${cell.neighborMines}`);
    } else {
        getNeighbors(r, c).forEach(nb => revealCell(nb.r, nb.c));
    }
    
    checkWin();
}

function generateMines(safeR, safeC) {
    let placed = 0;
    while (placed < CONFIG.MINES) {
        let r = Math.floor(Math.random() * CONFIG.ROWS);
        let c = Math.floor(Math.random() * CONFIG.COLS);
        if (!board[r][c].isMine && (r !== safeR || c !== safeC)) {
            board[r][c].isMine = true;
            placed++;
        }
    }
    board.flat().forEach(cell => {
        if (!cell.isMine) {
            cell.neighborMines = getNeighbors(cell.r, cell.c).filter(n => n.isMine).length;
        }
    });
}

function getNeighbors(r, c) {
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < CONFIG.ROWS && nc >= 0 && nc < CONFIG.COLS) {
                neighbors.push(board[nr][nc]);
            }
        }
    }
    return neighbors;
}

function startTimer() {
    timerInterval = setInterval(() => {
        seconds++;
        timerDisplay.textContent = seconds.toString().padStart(3, '0');
    }, 1000);
}

function checkWin() {
    const win = board.flat().every(c => c.isMine || c.isRevealed);
    if (win) endGame(true);
}

function endGame(won) {
    isGameOver = true;
    clearInterval(timerInterval);
    board.flat().forEach(c => { if(c.isMine) { c.elem.classList.add('mine'); c.elem.textContent = '💣'; } });
    
    const message = won ? translations.victory : translations.game_over;
    setTimeout(() => alert(message), 100);
}

async function loadLanguage(lang) {
    try {
        const response = await fetch(`./languages/${lang}.json`);
        translations = await response.json();
        applyTranslations();
    } catch (error) {
        console.error("Error loading language file:", error);
    }
}

function applyTranslations() {
    // Actualiza todos los elementos que tengan el atributo data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) {
            el.textContent = translations[key];
        }
    });
}

// Inicialización
document.getElementById('reset-btn').addEventListener('click', initGame);

// Detectar idioma del navegador (por defecto español si no es inglés)
const userLang = navigator.language.startsWith('en') ? 'en' : 'es';
loadLanguage(userLang).then(() => initGame());