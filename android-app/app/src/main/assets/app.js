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

let lastMoveForAnimation = null;

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
const paywallOverlay = document.getElementById('paywall-overlay');
const gameoverOverlay = document.getElementById('gameover-overlay');
const winOverlay = document.getElementById('win-overlay');
const settingsOverlay = document.getElementById('settings-overlay');
const confirmHomeOverlay = document.getElementById('confirm-home-overlay');
const splashScreen = document.getElementById('splash-screen');
const homeScreen = document.getElementById('home-screen');
const gameView = document.getElementById('game-view');

function showOverlay(el) {
    if (!el) return;
    el.classList.remove('hidden');
    el.style.setProperty('display', 'flex', 'important');
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('pointer-events', 'auto', 'important');
}

function hideOverlay(el) {
    if (!el) return;
    el.classList.add('hidden');
    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('opacity', '0', 'important');
    el.style.setProperty('pointer-events', 'none', 'important');
}

function showScreen(screenId) {
    const screens = ['splash-screen', 'home-screen', 'game-view', 'classic-menu', 'challenges-menu'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === screenId) {
                el.classList.remove('hidden');
                el.style.display = (id === 'game-view' || id === 'classic-menu' || id === 'challenges-menu') ? 'block' : 'flex';
            } else {
                el.classList.add('hidden');
                el.style.display = 'none';
            }
        }
    });
}

/* ==========================================
   SYNTHESIZED AUDIO ENGINE
   ========================================== */

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.enabled = localStorage.getItem('soundEnabled') !== 'false';
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTap() {
        if (!this.enabled) return;
        try {
            this.init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.15);
        } catch (e) {
            console.error("Audio error", e);
        }
    }

    playPour() {
        if (!this.enabled) return;
        try {
            this.init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(480, this.ctx.currentTime + 0.2);

            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.2);
        } catch (e) {
            console.error("Audio error", e);
        }
    }

    playError() {
        if (!this.enabled) return;
        try {
            this.init();
            const playBuzz = (time) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(130, time);

                gain.gain.setValueAtTime(0.12, time);
                gain.gain.linearRampToValueAtTime(0.01, time + 0.15);

                osc.start(time);
                osc.stop(time + 0.15);
            };

            const now = this.ctx.currentTime;
            playBuzz(now);
            playBuzz(now + 0.18);
        } catch (e) {
            console.error("Audio error", e);
        }
    }

    playWin() {
        if (!this.enabled) return;
        try {
            this.init();
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
            const now = this.ctx.currentTime;
            
            notes.forEach((freq, idx) => {
                const noteTime = now + idx * 0.08;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);
                
                gain.gain.setValueAtTime(0.08, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

                osc.start(noteTime);
                osc.stop(noteTime + 0.4);
            });
        } catch (e) {
            console.error("Audio error", e);
        }
    }

    toggle(state) {
        this.enabled = state;
        localStorage.setItem('soundEnabled', state ? 'true' : 'false');
    }
}

const sounds = new AudioEngine();

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
    hideOverlay(winOverlay);
    hideOverlay(gameoverOverlay);
    showScreen('game-view');
    
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
    
    // Set appropriate classes on board for flex positioning
    boardEl.className = 'flex flex-row justify-center items-end gap-2 sm:gap-3 md:gap-4 w-full h-[360px] sm:h-[400px] md:h-[440px] px-2 select-none';
    
    // Dynamically calculate responsive tube width based on count to fit on screen
    const availableWidth = boardEl.clientWidth || window.innerWidth;
    const boardHeight = boardEl.clientHeight || 400;
    const padding = 32; // padding px
    const gap = 12; // gap size average
    const maxTubes = tubes.length;
    const computedWidth = Math.min(64, Math.floor((availableWidth - padding - (maxTubes - 1) * gap) / maxTubes));
    const tubeWidthStr = `${Math.max(34, computedWidth)}px`;

    tubes.forEach((tube, tubeIndex) => {
        const isLocked = isTubeLocked(tubeIndex);
        const cap = getTubeCapacity(tubeIndex);
        
        const tubeDiv = document.createElement('div');
        // Test tubes are rounded-b-full and open at the top.
        tubeDiv.className = 'glass-tube rounded-b-full rounded-t-none flex flex-col-reverse justify-start items-center p-1.5 pb-4 relative cursor-pointer';
        tubeDiv.style.width = tubeWidthStr;
        tubeDiv.dataset.index = tubeIndex;
        
        // Append realistic flared test tube rim
        const rim = document.createElement('div');
        rim.className = 'tube-rim';
        tubeDiv.appendChild(rim);
        
        // Selected tube animation
        if (tubeIndex === selectedTube) {
            tubeDiv.classList.add('tube-selected');
            const beam = document.createElement('div');
            beam.className = 'light-beam';
            tubeDiv.appendChild(beam);
        }

        // Locked tube styling / overlay
        if (isLocked) {
            tubeDiv.classList.add('opacity-60');
            const lockDiv = document.createElement('div');
            lockDiv.className = 'locked-tube-lock';
            lockDiv.innerHTML = '<svg class="w-5 h-5 text-secondary" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>';
            tubeDiv.appendChild(lockDiv);
        } else {
            // Click fallback
            tubeDiv.onclick = () => handleTubeClick(tubeIndex);
            
            // Touch/Mouse down drag start
            tubeDiv.ontouchstart = (e) => {
                e.preventDefault();
                handleTubeClick(tubeIndex);
            };
            tubeDiv.onmousedown = (e) => {
                handleTubeClick(tubeIndex);
            };
        }
        
        // Calculate tube heights and responsive ball size dynamically to guarantee they fit in the tube
        let tubeHeight = boardHeight;
        if (cap === 3) {
            tubeHeight = Math.floor(boardHeight * 0.45);
            tubeDiv.style.height = `${tubeHeight}px`;
            tubeDiv.classList.add('border-dotted', 'border-secondary/40');
        } else if (cap === 6) {
            tubeHeight = Math.floor(boardHeight * 0.68);
            tubeDiv.style.height = `${tubeHeight}px`;
        } else {
            tubeHeight = Math.floor(boardHeight * 0.90);
            tubeDiv.style.height = `${tubeHeight}px`;
        }
        
        // Calculate max ball size based on capacity and tube height
        const maxBallSize = Math.floor((tubeHeight - 20 - (cap - 1) * 2) / cap);
        const tubeWidth = Math.max(34, computedWidth);
        const ballSize = Math.min(tubeWidth - 8, maxBallSize);
        const ballSizeStr = `${ballSize}px`;

        // Render balls bottom to top
        tube.forEach((color, ballIndex) => {
            const ball = document.createElement('div');
            const isMystery = gameMode === 'challenge-mystery' && ballIndex !== tube.length - 1;
            
            if (isMystery) {
                ball.className = 'sphere sphere-mystery';
            } else {
                ball.className = `sphere sphere-${color}`;
            }
            
            // Set dynamic size to prevent overflow
            ball.style.width = ballSizeStr;
            ball.style.height = ballSizeStr;
            ball.style.margin = '1px auto';
            
            // Render highlight inside
            const highlight = document.createElement('div');
            highlight.className = 'absolute inset-0 sphere-highlight rounded-full mix-blend-screen';
            ball.appendChild(highlight);
            
            const shadow = document.createElement('div');
            shadow.className = 'absolute inset-0 sphere-shadow rounded-full';
            ball.appendChild(shadow);
            
            // Selection bounce / glow animation
            if (tubeIndex === selectedTube && ballIndex === tube.length - 1) {
                ball.classList.add('sphere-selected-glow', 'animate-pulse');
            }
            
            // Settle gravity slide down animation
            if (lastMoveForAnimation && tubeIndex === lastMoveForAnimation.tubeIndex && ballIndex === lastMoveForAnimation.ballIndex) {
                ball.classList.add('sphere-animate-fall');
                // Trigger a light tactile vibration bounce when the ball lands at the bottom
                setTimeout(() => {
                    if (navigator.vibrate) {
                        navigator.vibrate(12); // Short crisp haptic tap
                    }
                }, 350);
            }
            
            tubeDiv.appendChild(ball);
        });
        
        boardEl.appendChild(tubeDiv);
    });
    
    // Clear animation state after rendering
    lastMoveForAnimation = null;
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
            sounds.playTap();
            renderBoard();
        }
    } else {
        if (selectedTube === index) {
            selectedTube = null;
            sounds.playTap();
            renderBoard();
        } else {
            if (isValidMove(selectedTube, index)) {
                executeMove(selectedTube, index);
            } else {
                selectedTube = null;
                sounds.playError();
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
    sounds.playPour();
    selectedTube = null;
    movesMade++;
    
    // Set animation state for gravity fall
    lastMoveForAnimation = { tubeIndex: tgt, ballIndex: tubes[tgt].length - 1 };
    
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
            showOverlay(gameoverOverlay);
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
    
    // Set animation state for undo gravity fall
    lastMoveForAnimation = { tubeIndex: last.src, ballIndex: tubes[last.src].length - 1 };
    
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
        sounds.playWin();
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
            showOverlay(winOverlay);
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
    showScreen('home-screen');
    hideOverlay(winOverlay);
    hideOverlay(gameoverOverlay);
    hideOverlay(resetOverlay);
    hideOverlay(settingsOverlay);
    hideOverlay(confirmHomeOverlay);
}

function confirmGoHome() {
    const isGameActive = !gameView.classList.contains('hidden');
    const hasStarted = movesMade > 0;
    const isNotEnded = winOverlay.classList.contains('hidden') && gameoverOverlay.classList.contains('hidden');
    
    if (isGameActive && hasStarted && isNotEnded) {
        showOverlay(confirmHomeOverlay);
    } else {
        showMainMenu();
    }
}

function handleCheckout() {
    // Simulate transaction
    isPremiumUnlocked = true;
    hideOverlay(paywallOverlay);
    
    // Unlock color buttons in Menu
    const premiumBtns = document.querySelectorAll('.premium-lock');
    premiumBtns.forEach(btn => {
        btn.classList.remove('premium-lock', 'text-on-surface-variant/50', 'border-white/5');
        btn.classList.add('border-white/10', 'hover:border-primary/50', 'hover:bg-white/5');
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
            showOverlay(paywallOverlay);
            return;
        }
        
        // Set active button
        colorBtns.forEach(b => {
            b.classList.remove('active', 'border-primary', 'bg-primary/20', 'text-primary');
            b.classList.add('border-white/10');
        });
        btn.classList.add('active', 'border-primary', 'bg-primary/20', 'text-primary');
        btn.classList.remove('border-white/10');
        
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
        showOverlay(resetOverlay);
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
    hideOverlay(winOverlay);
    hideOverlay(gameoverOverlay);
    
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
            
            hideOverlay(resetOverlay);
            
            alert("🎉 Rewarded ad completed! You got 1 free reset.");
            
            // Execute reset automatically
            handleReset();
        }
    }, 1000);
}

// HUD & Utility actions
document.getElementById('btn-menu').addEventListener('click', confirmGoHome);
document.getElementById('btn-undo').addEventListener('click', undoMove);
document.getElementById('btn-hint').addEventListener('click', showHint);
document.getElementById('btn-reset').addEventListener('click', handleReset);

// Navigation controls mapping (mobile footer buttons)
const btnUndoNav = document.getElementById('btn-undo-nav');
if (btnUndoNav) btnUndoNav.addEventListener('click', undoMove);

// Confirm Home Dialog bindings
const btnConfirmHomeYes = document.getElementById('btn-confirm-home-yes');
if (btnConfirmHomeYes) {
    btnConfirmHomeYes.addEventListener('click', () => {
        hideOverlay(confirmHomeOverlay);
        showMainMenu();
    });
}
const btnConfirmHomeNo = document.getElementById('btn-confirm-home-no');
if (btnConfirmHomeNo) {
    btnConfirmHomeNo.addEventListener('click', () => {
        hideOverlay(confirmHomeOverlay);
    });
}

// Classic & Challenges screen Back buttons
const btnClassicBack = document.getElementById('btn-classic-back');
if (btnClassicBack) btnClassicBack.addEventListener('click', showMainMenu);

const btnChallengesBack = document.getElementById('btn-challenges-back');
if (btnChallengesBack) btnChallengesBack.addEventListener('click', showMainMenu);

// Paywall actions
document.getElementById('btn-paywall-close').addEventListener('click', () => {
    hideOverlay(paywallOverlay);
});
document.getElementById('btn-paywall-buy').addEventListener('click', handleCheckout);

// Resets Paywall actions
document.getElementById('btn-reset-close').addEventListener('click', () => {
    hideOverlay(resetOverlay);
});
document.getElementById('btn-watch-ad').addEventListener('click', watchAd);
document.getElementById('btn-reset-buy').addEventListener('click', () => {
    localStorage.setItem('unlimitedResets', 'true');
    hideOverlay(resetOverlay);
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

// Home Screen Button Listeners
document.getElementById('btn-home-play').addEventListener('click', () => {
    showScreen('classic-menu');
});
document.getElementById('btn-home-challenges').addEventListener('click', () => {
    showScreen('challenges-menu');
});
document.getElementById('btn-home-settings').addEventListener('click', () => {
    showOverlay(settingsOverlay);
});
document.getElementById('btn-home-premium').addEventListener('click', () => {
    showOverlay(paywallOverlay);
});

// Settings Overlay Listeners
document.getElementById('btn-settings-close').addEventListener('click', () => {
    hideOverlay(settingsOverlay);
});

function toggleTheme() {
    const checkbox = document.getElementById('btn-settings-theme');
    const isLight = checkbox ? checkbox.checked : document.body.classList.contains('light-theme');
    if (isLight) {
        document.body.classList.add('light-theme');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-theme');
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
    updateThemeUI();
}

function updateThemeUI() {
    const isLight = document.body.classList.contains('light-theme');
    const checkbox = document.getElementById('btn-settings-theme');
    if (checkbox) {
        checkbox.checked = isLight;
    }
}

const themeToggleEl = document.getElementById('btn-settings-theme');
if (themeToggleEl) themeToggleEl.addEventListener('change', toggleTheme);

// Sound toggling
function toggleSound() {
    const checkbox = document.getElementById('btn-settings-sound');
    const enabled = checkbox ? checkbox.checked : !sounds.enabled;
    sounds.toggle(enabled);
    updateSoundUI();
}

function updateSoundUI() {
    const checkbox = document.getElementById('btn-settings-sound');
    if (checkbox) {
        checkbox.checked = sounds.enabled;
    }
}

const soundToggleEl = document.getElementById('btn-settings-sound');
if (soundToggleEl) soundToggleEl.addEventListener('change', toggleSound);

// Clear data setting
document.getElementById('btn-settings-clear').addEventListener('click', () => {
    if (confirm("⚠️ Are you sure you want to clear all progress, unlocked features, and settings? This cannot be undone.")) {
        localStorage.clear();
        alert("🎉 Game data cleared! Reloading...");
        location.reload();
    }
});

function initSettingsUI() {
    // Load theme setting
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        document.documentElement.classList.remove('dark');
    } else {
        document.body.classList.remove('light-theme');
        document.documentElement.classList.add('dark');
    }
    updateThemeUI();
    
    // Load sound setting
    updateSoundUI();
}

// Debug display
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

// Android hardware back key simulation
window.onAndroidBack = function() {
    // If confirm overlay is open, dismiss it
    if (!confirmHomeOverlay.classList.contains('hidden')) {
        hideOverlay(confirmHomeOverlay);
        return true;
    }
    // If settings overlay is open, close it
    if (!settingsOverlay.classList.contains('hidden')) {
        hideOverlay(settingsOverlay);
        return true;
    }
    // If classic menu is active, back to home screen
    if (!document.getElementById('classic-menu').classList.contains('hidden')) {
        showMainMenu();
        return true;
    }
    // If challenges menu is active, back to home screen
    if (!document.getElementById('challenges-menu').classList.contains('hidden')) {
        showMainMenu();
        return true;
    }
    // If paywall overlay is open, close it
    if (!paywallOverlay.classList.contains('hidden')) {
        hideOverlay(paywallOverlay);
        return true;
    }
    // If resets overlay is open, close it
    if (!resetOverlay.classList.contains('hidden')) {
        hideOverlay(resetOverlay);
        return true;
    }
    // If gameplay view is active, exit to home screen
    const gameActive = !gameView.classList.contains('hidden');
    if (gameActive) {
        confirmGoHome();
        return true;
    }
    // Otherwise, let Android exit the application
    return false;
};

// Initialize Application Settings and Screens
initSettingsUI();
showScreen('splash-screen');

// Hide Splash Screen and transition to Home Screen after 2.5 seconds
setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => {
            showScreen('home-screen');
        }, 500);
    } else {
        showScreen('home-screen');
    }
}, 2500);

// Helper to get tube index from screen coordinates
function getTubeIndexFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const tubeEl = el.closest('.glass-tube');
    if (!tubeEl) return null;
    return parseInt(tubeEl.dataset.index);
}

// State for current hovered tube during drag/swipe
let hoverTubeIndex = null;

// Helper to update visual hover highlights during swipe dragging
function updateHoverHighlight(tgtIndex) {
    if (hoverTubeIndex !== tgtIndex) {
        // Remove hover class from old
        if (hoverTubeIndex !== null) {
            const oldTube = document.querySelector(`.glass-tube[data-index="${hoverTubeIndex}"]`);
            if (oldTube) oldTube.classList.remove('tube-hover');
        }
        hoverTubeIndex = tgtIndex;
        // Add hover class to new (only if it's not the selected source tube)
        if (hoverTubeIndex !== null && hoverTubeIndex !== selectedTube) {
            const newTube = document.querySelector(`.glass-tube[data-index="${hoverTubeIndex}"]`);
            if (newTube) newTube.classList.add('tube-hover');
        }
    }
}

// Global release handlers for touch/swipe support
window.addEventListener('touchmove', (e) => {
    if (selectedTube !== null) {
        e.preventDefault(); // Crucial: prevents mobile browser scrolling/touch cancel
        const touch = e.touches[0];
        const tgtIndex = getTubeIndexFromPoint(touch.clientX, touch.clientY);
        updateHoverHighlight(tgtIndex);
    }
}, { passive: false });

window.addEventListener('mousemove', (e) => {
    if (selectedTube !== null) {
        const tgtIndex = getTubeIndexFromPoint(e.clientX, e.clientY);
        updateHoverHighlight(tgtIndex);
    }
});

window.addEventListener('touchend', (e) => {
    if (selectedTube !== null) {
        const touch = e.changedTouches[0];
        const tgtIndex = getTubeIndexFromPoint(touch.clientX, touch.clientY);
        
        // Clear hover highlights
        updateHoverHighlight(null);
        
        if (tgtIndex !== null && tgtIndex !== selectedTube) {
            if (isValidMove(selectedTube, tgtIndex)) {
                executeMove(selectedTube, tgtIndex);
            } else {
                selectedTube = null;
                sounds.playError();
                renderBoard();
            }
        }
    }
});

window.addEventListener('mouseup', (e) => {
    if (selectedTube !== null) {
        const tgtIndex = getTubeIndexFromPoint(e.clientX, e.clientY);
        
        // Clear hover highlights
        updateHoverHighlight(null);
        
        if (tgtIndex !== null && tgtIndex !== selectedTube) {
            if (isValidMove(selectedTube, tgtIndex)) {
                executeMove(selectedTube, tgtIndex);
            } else {
                selectedTube = null;
                sounds.playError();
                renderBoard();
            }
        }
    }
});
