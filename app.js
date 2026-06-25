// app.js

const TUBE_CAPACITY = 10;
const COLORS = ['Y', 'O', 'P', 'B', 'G', 'V', 'R', 'C', 'M', 'T', 'BR', 'W'];
const COLOR_NAMES = {
    'Y': 'Yellow', 'O': 'Orange', 'P': 'Pink', 'B': 'Blue', 'G': 'Green',
    'V': 'Violet', 'R': 'Red', 'C': 'Cyan', 'M': 'Magenta', 'T': 'Teal',
    'BR': 'Brown', 'W': 'White'
};

// Game State
let tubes = [];
let initialTubesState = [];
let selectedTube = null;
let gameMode = 'classic'; // 'classic', 'challenge-par', 'challenge-mystery', 'challenge-squeeze', 'challenge-locked'
let colorsCount = 5;
let isPremiumUnlocked = false;
let isLockedTubeUnlocked = false;

// Challenge specifics
let undoStack = [];
let solutionPath = [];
let currentStep = 0;
let deviationCount = 0;
let movesMade = 0;
let maxMoves = 0;

// DOM Elements
const boardEl = document.getElementById('game-board');
const hudModeDisplay = document.getElementById('current-mode-display');
const hudMoveDisplay = document.getElementById('move-counter-display');
const hintDisplay = document.getElementById('hint-display');

// Overlays
const menuOverlay = document.getElementById('menu-overlay');
const paywallOverlay = document.getElementById('paywall-overlay');
const gameoverOverlay = document.getElementById('gameover-overlay');
const winOverlay = document.getElementById('win-overlay');

// Color buttons selection
const colorBtns = document.querySelectorAll('.color-btn');
const challengeBtns = document.querySelectorAll('.challenge-select-btn');

/* ==========================================
   INITIALIZATION
   ========================================== */

function initGame() {
    tubes = [];
    selectedTube = null;
    undoStack = [];
    solutionPath = [];
    movesMade = 0;
    isLockedTubeUnlocked = false;
    
    hideHint();
    winOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');
    menuOverlay.classList.add('hidden');
    
    if (gameMode === 'classic') {
        generateClassicMode();
    } else {
        generateChallengeMode(gameMode);
    }
    
    // Copy initial layout state for resets
    initialTubesState = tubes.map(tube => [...tube]);
    updateResetButton();
    
    // Update HUD display
    updateHUD();
    
    updateDebugDisplay("Game Initialized");
    
    renderBoard();
}

function updateHUD() {
    if (gameMode === 'classic') {
        hudModeDisplay.textContent = `Easy ${colorsCount} Colors`;
        hudMoveDisplay.classList.remove('hidden');
        hudMoveDisplay.textContent = `Moves: ${movesMade}`;
    } else {
        let modeName = '';
        switch(gameMode) {
            case 'challenge-par': modeName = 'Par Challenge'; break;
            case 'challenge-mystery': modeName = 'Mystery Sort'; break;
            case 'challenge-squeeze': modeName = 'Tight Squeeze'; break;
            case 'challenge-locked': modeName = 'Locked Tubes'; break;
        }
        hudModeDisplay.textContent = modeName;
        
        if (gameMode === 'challenge-par') {
            hudMoveDisplay.classList.remove('hidden');
            hudMoveDisplay.textContent = `Moves: ${movesMade} / ${maxMoves}`;
        } else {
            hudMoveDisplay.classList.add('hidden');
        }
    }
}

/* ==========================================
   BOARD GENERATORS
   ========================================== */

// Classic Mode Generator (Reverse Scramble)
function generateClassicMode() {
    const selectedColors = COLORS.slice(0, colorsCount);
    const capacity = getTubeCapacity(0);
    const numTubes = colorsCount + 1; // colorsCount sorted tubes + 1 buffer tube
    
    let state = [];
    // Start with completely sorted state
    for (let i = 0; i < colorsCount; i++) {
        state.push(Array(capacity).fill(selectedColors[i]));
    }
    state.push([]); // Add 1 empty buffer tube
    
    let path = [];
    let lastMove = null;
    const scrambleSteps = colorsCount * 12; // e.g. 36 steps for 3 colors, 48 for 4, 60 for 5
    
    for (let step = 0; step < scrambleSteps; step++) {
        let validMoves = [];
        for (let src = 0; src < numTubes; src++) {
            for (let tgt = 0; tgt < numTubes; tgt++) {
                if (src === tgt) continue;
                if (state[src].length === 0) continue;
                if (state[tgt].length >= capacity) continue;
                
                // Prevent immediate backtrack
                if (lastMove && lastMove.src === tgt && lastMove.tgt === src) {
                    continue;
                }
                
                validMoves.push({ src, tgt });
            }
        }
        
        if (validMoves.length === 0) break;
        
        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
        const ball = state[move.src].pop();
        state[move.tgt].push(ball);
        
        path.unshift({ src: move.tgt, tgt: move.src });
        lastMove = move;
    }
    
    tubes = state;
    solutionPath = path;
    maxMoves = path.length;
}

// Challenge Modes Generator (Scramble method)
function generateChallengeMode(mode) {
    const numTubes = mode === 'challenge-locked' ? 7 : 6;
    let state = [];
    // Use 5 colors for challenge modes
    const challengeColors = COLORS.slice(0, 5);
    
    for (let i = 0; i < 5; i++) {
        state.push(Array(TUBE_CAPACITY).fill(challengeColors[i]));
    }
    while (state.length < numTubes) {
        state.push([]);
    }

    let path = [];
    let lastMove = null;
    const scrambleSteps = 60;
    
    for (let step = 0; step < scrambleSteps; step++) {
        let validMoves = [];
        for (let src = 0; src < numTubes; src++) {
            for (let tgt = 0; tgt < numTubes; tgt++) {
                if (src === tgt) continue;
                if (state[src].length === 0) continue;
                
                // Capacity check
                let cap = TUBE_CAPACITY;
                if (mode === 'challenge-squeeze' && tgt === 5) {
                    cap = 3;
                }
                if (state[tgt].length >= cap) continue;
                
                // Locked check during scramble
                if (mode === 'challenge-locked' && (src === 6 || tgt === 6)) {
                    continue;
                }
                
                // Prevent immediate backtrack
                if (lastMove && lastMove.src === tgt && lastMove.tgt === src) {
                    continue;
                }
                
                validMoves.push({ src, tgt });
            }
        }
        
        if (validMoves.length === 0) break;
        
        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
        const ball = state[move.src].pop();
        state[move.tgt].push(ball);
        
        path.unshift({ src: move.tgt, tgt: move.src });
        lastMove = move;
    }
    
    tubes = state;
    solutionPath = path;
    
    if (mode === 'challenge-par') {
        maxMoves = Math.floor(path.length * 1.1) + 8;
        hudMoveDisplay.textContent = `Moves: 0 / ${maxMoves}`;
    }
}

/* ==========================================
   RENDERING
   ========================================== */

function renderBoard() {
    boardEl.innerHTML = '';
    
    // Set appropriate columns class on board for responsive resizing
    boardEl.className = `cols-${tubes.length}`;
    
    tubes.forEach((tube, tubeIndex) => {
        const container = document.createElement('div');
        container.className = 'tube-container';
        
        // Locked tube styling for Locked Tubes mode
        const isLocked = isTubeLocked(tubeIndex);
        if (isLocked) {
            container.classList.add('locked-container');
        }
        
        container.onclick = () => {
            if (!isLocked) handleTubeClick(tubeIndex);
        };
        
        const tubeDiv = document.createElement('div');
        tubeDiv.className = 'tube';
        
        // Squeeze mode visual indicator
        if (gameMode === 'challenge-squeeze' && tubeIndex === 5) {
            tubeDiv.classList.add('capacity-3');
        }
        
        // Classic mode 3-color capacity 6 visual indicator
        if (gameMode === 'classic' && colorsCount === 3) {
            tubeDiv.classList.add('capacity-6');
        }
        
        if (isLocked) {
            tubeDiv.classList.add('locked');
        }
        
        // Render balls bottom to top
        tube.forEach((color, ballIndex) => {
            const ball = document.createElement('div');
            
            // Check Mystery Sort Mode
            const isMystery = gameMode === 'challenge-mystery' && ballIndex !== tube.length - 1;
            
            if (isMystery) {
                ball.className = 'ball mystery';
            } else {
                ball.className = `ball color-${color}`;
            }
            
            // Selection bounce animation
            if (tubeIndex === selectedTube && ballIndex === tube.length - 1) {
                ball.classList.add('selected');
            }
            
            tubeDiv.appendChild(ball);
        });
        
        container.appendChild(tubeDiv);
        boardEl.appendChild(container);
    });
}

function isTubeLocked(index) {
    if (gameMode === 'challenge-locked' && index === 6) {
        return !isLockedTubeUnlocked;
    }
    return false;
}

/* ==========================================
   GAME INTERACTION & LOGIC
   ========================================== */

function handleTubeClick(index) {
    if (selectedTube === null) {
        if (tubes[index].length > 0) {
            selectedTube = index;
            renderBoard();
        }
    } else {
        if (selectedTube === index) {
            selectedTube = null;
            renderBoard();
        } else {
            if (isValidMove(selectedTube, index)) {
                executeMove(selectedTube, index);
            } else {
                selectedTube = null;
                renderBoard();
            }
        }
    }
}

function getTubeCapacity(index) {
    if (gameMode === 'classic' && colorsCount === 3) {
        return 6;
    }
    if (gameMode === 'challenge-squeeze' && index === 5) {
        return 3;
    }
    return TUBE_CAPACITY;
}

function isValidMove(src, tgt) {
    if (src === tgt) return false;
    const srcTube = tubes[src];
    const tgtTube = tubes[tgt];
    
    if (srcTube.length === 0) return false;
    if (tgtTube.length >= getTubeCapacity(tgt)) return false;
    
    // Under new rules: same-color stacking is relaxed for all challenge/classic modes
    // Anyone can place any color on any other color
    return true;
}

function executeMove(src, tgt) {
    const ball = tubes[src].pop();
    tubes[tgt].push(ball);
    selectedTube = null;
    movesMade++;
    
    // Check if a tube unlocks in Locked Tubes mode
    let unlockedThisTurn = false;
    if (gameMode === 'challenge-locked' && !isLockedTubeUnlocked) {
        if (checkCompletedTubes() > 0) {
            isLockedTubeUnlocked = true;
            unlockedThisTurn = true;
        }
    }
    
    undoStack.push({ src, tgt, unlockedThisTurn });
    
    hideHint();
    renderBoard();
    updateHUD();
    
    const won = checkWin(false);
    if (!won && gameMode === 'challenge-par' && movesMade >= maxMoves) {
        setTimeout(() => {
            gameoverOverlay.classList.remove('hidden');
        }, 200);
    }
}

function checkCompletedTubes() {
    let completed = 0;
    // Don't count empty tubes or the locked tube (index 6)
    for (let i = 0; i < tubes.length; i++) {
        if (i === 6) continue;
        const tube = tubes[i];
        if (tube.length === TUBE_CAPACITY) {
            const first = tube[0];
            if (tube.every(c => c === first)) {
                completed++;
            }
        }
    }
    return completed;
}

function undoMove() {
    if (undoStack.length === 0) return;
    
    const last = undoStack.pop();
    const ball = tubes[last.tgt].pop();
    tubes[last.src].push(ball);
    selectedTube = null;
    movesMade--;
    
    if (last.unlockedThisTurn) {
        isLockedTubeUnlocked = false;
    }
    
    hideHint();
    renderBoard();
    updateHUD();
}

/* ==========================================
   HINTS
   ========================================== */

function isStateSolved(state, requiredCompleted) {
    let completedCount = 0;
    let emptyCount = 0;
    const totalTubes = state.length;
    
    for (let i = 0; i < totalTubes; i++) {
        const tube = state[i];
        if (tube.length === 0) {
            emptyCount++;
        } else if (tube.length === getTubeCapacity(i)) {
            const first = tube[0];
            if (tube.every(c => c === first)) {
                completedCount++;
            }
        }
    }
    return (completedCount === requiredCompleted && (completedCount + emptyCount === totalTubes));
}

function findNextMoveHint() {
    const startState = tubes.map(t => [...t]);
    const requiredCompleted = gameMode === 'classic' ? colorsCount : 5;
    
    if (isStateSolved(startState, requiredCompleted)) {
        return null;
    }
    
    // Heuristic: misplaced balls count
    const getHeuristic = (state) => {
        let counts = {};
        for (let i = 0; i < state.length; i++) {
            const tube = state[i];
            for (let j = 0; j < tube.length; j++) {
                const color = tube[j];
                if (!counts[color]) {
                    counts[color] = Array(state.length).fill(0);
                }
                counts[color][i]++;
            }
        }
        
        let misplaced = 0;
        for (const color in counts) {
            const tubeCounts = counts[color];
            const maxInTube = Math.max(...tubeCounts);
            const totalColorBalls = tubeCounts.reduce((a, b) => a + b, 0);
            misplaced += (totalColorBalls - maxInTube);
        }
        return misplaced;
    };
    
    const serialize = (state) => {
        return state.map(tube => tube.join(',')).join('|');
    };
    
    let openList = [];
    let visited = new Set();
    
    const startH = getHeuristic(startState);
    openList.push({
        state: startState,
        path: [],
        g: 0,
        h: startH,
        f: startH
    });
    visited.add(serialize(startState));
    
    let iterations = 0;
    const maxIterations = 2000;
    
    while (openList.length > 0 && iterations < maxIterations) {
        iterations++;
        const current = openList.shift();
        
        if (isStateSolved(current.state, requiredCompleted)) {
            return current.path[0];
        }
        
        const numTubes = current.state.length;
        for (let src = 0; src < numTubes; src++) {
            if (current.state[src].length === 0) continue;
            
            for (let tgt = 0; tgt < numTubes; tgt++) {
                if (src === tgt) continue;
                if (current.state[tgt].length >= getTubeCapacity(tgt)) continue;
                
                if (gameMode === 'challenge-locked' && !isLockedTubeUnlocked && (src === 6 || tgt === 6)) {
                    continue;
                }
                
                let nextState = current.state.map(t => [...t]);
                const ball = nextState[src].pop();
                nextState[tgt].push(ball);
                
                const key = serialize(nextState);
                if (!visited.has(key)) {
                    visited.add(key);
                    
                    const nextG = current.g + 1;
                    const nextH = getHeuristic(nextState);
                    const nextF = nextG + nextH;
                    const nextPath = [...current.path, { src, tgt }];
                    
                    const item = {
                        state: nextState,
                        path: nextPath,
                        g: nextG,
                        h: nextH,
                        f: nextF
                    };
                    
                    let insertIdx = 0;
                    while (insertIdx < openList.length && openList[insertIdx].f < nextF) {
                        insertIdx++;
                    }
                    openList.splice(insertIdx, 0, item);
                }
            }
        }
    }
    
    return getFallbackMove();
}

function getFallbackMove() {
    let validMoves = [];
    const numTubes = tubes.length;
    for (let src = 0; src < numTubes; src++) {
        if (tubes[src].length === 0) continue;
        for (let tgt = 0; tgt < numTubes; tgt++) {
            if (src === tgt) continue;
            if (tubes[tgt].length >= getTubeCapacity(tgt)) continue;
            if (gameMode === 'challenge-locked' && !isLockedTubeUnlocked && (src === 6 || tgt === 6)) {
                continue;
            }
            
            const srcBall = tubes[src][tubes[src].length - 1];
            const tgtBall = tubes[tgt].length > 0 ? tubes[tgt][tubes[tgt].length - 1] : null;
            if (tgtBall === srcBall) {
                return { src, tgt };
            }
            validMoves.push({ src, tgt });
        }
    }
    if (validMoves.length > 0) {
        return validMoves[0];
    }
    return null;
}

function showHint() {
    const hint = findNextMoveHint();
    if (hint) {
        hintDisplay.textContent = `Hint: Move top ball from Tube ${hint.src + 1} to Tube ${hint.tgt + 1}`;
    } else {
        hintDisplay.textContent = "You are in the winning state!";
    }
    hintDisplay.classList.remove('hidden');
}

function hideHint() {
    hintDisplay.classList.add('hidden');
}

/* ==========================================
   WIN / LOSE CONDITION
   ========================================== */

function checkWin(checkOnly = false) {
    const requiredCompleted = gameMode === 'classic' ? colorsCount : 5;
    const isWon = isStateSolved(tubes, requiredCompleted);
    
    console.log(`[checkWin] gameMode=${gameMode}, colorsCount=${colorsCount}, totalTubes=${tubes.length}, requiredCompleted=${requiredCompleted}, isWon=${isWon}`);
    
    updateDebugDisplay(`Mode: ${gameMode} | Colors: ${colorsCount} | Tubes: ${tubes.length} | Target: ${requiredCompleted} | Won: ${isWon}`);
    
    if (isWon && !checkOnly) {
        setTimeout(() => {
            const msg = document.getElementById('win-message');
            const retrySameBtn = document.getElementById('btn-win-retry-same');
            
            if (gameMode === 'challenge-par') {
                msg.textContent = `You beat the Par Challenge in ${movesMade} moves (Par was ${maxMoves})!`;
                retrySameBtn.classList.add('hidden');
            } else {
                msg.textContent = "Amazing! You sorted all colors perfectly.";
                retrySameBtn.classList.add('hidden');
            }
            winOverlay.classList.remove('hidden');
        }, 200);
    }
    
    return isWon;
}

function getClassicOptimalMoves(colors) {
    if (colors === 3) return 20;
    return 20 + (colors - 3) * 15 - (colors > 3 ? 5 : 0);
}

/* ==========================================
   UI MENU ACTIONS & OVERLAYS
   ========================================== */

function showMainMenu() {
    menuOverlay.classList.remove('hidden');
    winOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');
    if (resetOverlay) resetOverlay.classList.add('hidden');
}

function handleCheckout() {
    // Simulate transaction
    isPremiumUnlocked = true;
    paywallOverlay.classList.add('hidden');
    
    // Unlock color buttons in Menu
    const premiumBtns = document.querySelectorAll('.premium-lock');
    premiumBtns.forEach(btn => {
        btn.classList.remove('premium-lock');
        btn.innerHTML = btn.dataset.colors;
    });
    
    alert("🎉 Thank you! Premium unlocked. You can now select 6-10 colors.");
}

/* ==========================================
   EVENT LISTENERS
   ========================================== */

// Classic Color selections
colorBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const num = parseInt(btn.dataset.colors);
        if (num >= 6 && !isPremiumUnlocked) {
            paywallOverlay.classList.remove('hidden');
            return;
        }
        
        // Set active button
        colorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        gameMode = 'classic';
        colorsCount = num;
        initGame();
    });
});

// Challenge selections
challengeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const challenge = btn.dataset.challenge;
        gameMode = `challenge-${challenge}`;
        initGame();
    });
});

// Resets tracking logic
function getResetsLeft() {
    if (localStorage.getItem('unlimitedResets') === 'true') {
        return 'unlimited';
    }
    const todayStr = new Date().toDateString();
    const lastDate = localStorage.getItem('lastResetDate');
    if (lastDate !== todayStr) {
        localStorage.setItem('lastResetDate', todayStr);
        localStorage.setItem('freeResetsLeft', '3');
        return 3;
    }
    const left = localStorage.getItem('freeResetsLeft');
    return left !== null ? parseInt(left) : 3;
}

function useReset() {
    if (localStorage.getItem('unlimitedResets') === 'true') return true;
    const left = getResetsLeft();
    if (left > 0) {
        localStorage.setItem('freeResetsLeft', (left - 1).toString());
        return true;
    }
    return false;
}

const resetOverlay = document.getElementById('reset-paywall-overlay');

function handleReset() {
    const hasResets = useReset();
    updateResetButton();
    
    if (hasResets) {
        resetLevelState();
    } else {
        resetOverlay.classList.remove('hidden');
    }
}

function resetLevelState() {
    tubes = initialTubesState.map(tube => [...tube]);
    selectedTube = null;
    undoStack = [];
    currentStep = 0;
    deviationCount = 0;
    movesMade = 0;
    isLockedTubeUnlocked = false;
    
    hideHint();
    winOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');
    
    updateHUD();
    renderBoard();
}

function updateResetButton() {
    const resetsLeft = getResetsLeft();
    const resetTextEl = document.getElementById('reset-btn-text');
    if (resetTextEl) {
        resetTextEl.textContent = `Reset (${resetsLeft === 'unlimited' ? '∞' : resetsLeft})`;
    }
}

// Watch ad reward simulation
function watchAd() {
    const adLoader = document.getElementById('ad-loader');
    const countdown = document.getElementById('ad-countdown');
    const watchBtn = document.getElementById('btn-watch-ad');
    const buyBtn = document.getElementById('btn-reset-buy');
    const closeBtn = document.getElementById('btn-reset-close');
    
    watchBtn.disabled = true;
    buyBtn.disabled = true;
    closeBtn.disabled = true;
    adLoader.classList.remove('hidden');
    
    let seconds = 4;
    countdown.textContent = `Watching ad (${seconds}s)...`;
    
    const interval = setInterval(() => {
        seconds--;
        if (seconds > 0) {
            countdown.textContent = `Watching ad (${seconds}s)...`;
        } else {
            clearInterval(interval);
            
            // Award reset
            const left = getResetsLeft();
            if (left !== 'unlimited') {
                localStorage.setItem('freeResetsLeft', (left + 1).toString());
            }
            
            // Reset state UI
            adLoader.classList.add('hidden');
            watchBtn.disabled = false;
            buyBtn.disabled = false;
            closeBtn.disabled = false;
            
            resetOverlay.classList.add('hidden');
            
            alert("🎉 Rewarded ad completed! You got 1 free reset.");
            
            // Execute reset automatically
            handleReset();
        }
    }, 1000);
}

// HUD & Utility actions
document.getElementById('btn-menu').addEventListener('click', showMainMenu);
document.getElementById('btn-undo').addEventListener('click', undoMove);
document.getElementById('btn-hint').addEventListener('click', showHint);
document.getElementById('btn-reset').addEventListener('click', handleReset);

// Paywall actions
document.getElementById('btn-paywall-close').addEventListener('click', () => {
    paywallOverlay.classList.add('hidden');
});
document.getElementById('btn-paywall-buy').addEventListener('click', handleCheckout);

// Resets Paywall actions
document.getElementById('btn-reset-close').addEventListener('click', () => {
    resetOverlay.classList.add('hidden');
});
document.getElementById('btn-watch-ad').addEventListener('click', watchAd);
document.getElementById('btn-reset-buy').addEventListener('click', () => {
    localStorage.setItem('unlimitedResets', 'true');
    resetOverlay.classList.add('hidden');
    updateResetButton();
    alert("🎉 Resets Unlocked! You now have unlimited resets.");
});

// Overlays replay / back buttons
document.getElementById('btn-win-retry-same').addEventListener('click', () => {
    resetLevelState();
});
document.getElementById('btn-win-replay').addEventListener('click', () => initGame());
document.getElementById('btn-win-menu').addEventListener('click', showMainMenu);

document.getElementById('btn-gameover-retry').addEventListener('click', () => initGame());
document.getElementById('btn-gameover-menu').addEventListener('click', showMainMenu);

// Theme toggle settings
const themeToggleBtn = document.getElementById('btn-theme-toggle');
const themeIcon = document.getElementById('theme-btn-icon');
const themeText = document.getElementById('theme-btn-text');

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    if (isLight) {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark Mode';
    }
});

function updateDebugDisplay(message) {
    const debugEl = document.getElementById('debug-display');
    if (debugEl) {
        debugEl.textContent = message;
    }
}

window.onerror = function(message, source, lineno, colno, error) {
    updateDebugDisplay(`Error: ${message} at line ${lineno}`);
    return false;
};

// Start game
showMainMenu();
