// Create starfield background
function createStars() {
  const starsContainer = document.getElementById('stars');
  const starsCount = 150;
  
  for (let i = 0; i < starsCount; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    
    const size = Math.random() * 3;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    
    star.style.animationDelay = `${Math.random() * 5}s`;
    
    starsContainer.appendChild(star);
  }
}

// Game configuration
const board = document.getElementById('board');
const dice = document.getElementById('dice');
const rollBtn = document.getElementById('rollDice');
const playerInfo = document.getElementById('currentPlayerName');
const boardContainer = document.getElementById('boardContainer');
const floatingToggle = document.getElementById('floatingToggle');
const playerScores = document.getElementById('playerScores');
const gameMessages = document.getElementById('gameMessages');

const players = ['red','green','blue','yellow'];
const playerNames = {red: 'Red', green: 'Green', yellow: 'Yellow', blue: 'Blue'};
let currentPlayerIndex = 0;

// Game state
let consecutiveSixes = 0;
let currentDiceValue = 0;
let waitingForRoll = true;
let waitingForMove = false;

// Track token positions for kill logic
const tokenPositions = new Map();

// Player statistics
const playerStats = {
  red: { tokensOut: 0, tokensFinished: 0, kills: 0 },
  green: { tokensOut: 0, tokensFinished: 0, kills: 0 },
  yellow: { tokensOut: 0, tokensFinished: 0, kills: 0 },
  blue: { tokensOut: 0, tokensFinished: 0, kills: 0 }
};

// Three consecutive sixes penalty system
let movesDuringCurrentTurn = [];
let turnStartTokenStates = {};

// ---------- Build path cells ----------
function addPathCells(rows, cols) {
  for (let r of rows) {
    for (let c of cols) {
      const div = document.createElement('div');
      div.className = 'cell path-cell';
      div.style.gridRow = r;
      div.style.gridColumn = c;
      div.dataset.row = r;
      div.dataset.col = c;
      board.appendChild(div);
    }
  }
}

// Color specific path cells
function colorCell(r,c,color){
  const cell = Array.from(document.querySelectorAll('.cell.path-cell'))
    .find(x => parseInt(x.style.gridRow) === r && parseInt(x.style.gridColumn) === c);
  if(cell) cell.style.background = color;
}

// Apply path colors
function applyPathColors() {
  const yellowPath = [{row:14,col:7},{row:14,col:8}];
  for(let r=10;r<=14;r++) yellowPath.push({row:r,col:8});
  yellowPath.forEach(pos => colorCell(pos.row,pos.col,'rgba(241, 196, 15, 0.6)'));

  const greenPath = [{row:2,col:8},{row:2,col:9},{row:3,col:8},{row:4,col:8},{row:5,col:8},{row:6,col:8}];
  greenPath.forEach(pos => colorCell(pos.row,pos.col,'rgba(39, 174, 96, 0.6)'));

  const redPath = [{row:8,col:2},{row:8,col:3},{row:8,col:4},{row:8,col:5},{row:8,col:6},{row:7,col:2}];
  redPath.forEach(pos => colorCell(pos.row,pos.col,'rgba(231, 76, 60, 0.6)'));

  const bluePath = [];
  for(let col=10;col<=14;col++) bluePath.push({row:8,col:col});
  bluePath.push({row:9,col:14});
  bluePath.forEach(pos => colorCell(pos.row,pos.col,'rgba(52, 152, 219, 0.6)'));

  // Add extra colored cells
  const extraCells = [
    {row:9, col:3, color:'rgba(231, 76, 60, 0.6)'},
    {row:11, col:4, color:'rgba(241, 196, 15, 0.6)'},
    {row:1, col:4, color:'rgba(52, 152, 219, 0.6)'},
    {row:3, col:3, color:'rgba(39, 174, 96, 0.6)'},
    {row:3, col:7, color:'rgba(39, 174, 96, 0.6)'},
    {row:7, col:13, color:'rgba(52, 152, 219, 0.6)'},
    {row:13, col:9, color:'rgba(241, 196, 15, 0.6)'}
  ];
  extraCells.forEach(pos => colorCell(pos.row,pos.col,pos.color));
}

// ---------- Game paths ----------
const paths = {
  red: [
    {row:7,col:2}, {row:7,col:3}, {row:7,col:4}, {row:7,col:5}, {row:7,col:6},
    {row:6,col:7}, {row:5,col:7}, {row:4,col:7}, {row:3,col:7}, {row:2,col:7}, {row:1,col:7},
    {row:1,col:8}, {row:1,col:9},
    {row:2,col:9}, {row:3,col:9}, {row:4,col:9}, {row:5,col:9}, {row:6,col:9},
    {row:7,col:10}, {row:7,col:11}, {row:7,col:12}, {row:7,col:13}, {row:7,col:14}, {row:7,col:15},
    {row:8,col:15}, {row:9,col:15},
    {row:9,col:14}, {row:9,col:13}, {row:9,col:12}, {row:9,col:11}, {row:9,col:10},
    {row:10,col:9}, {row:11,col:9}, {row:12,col:9}, {row:13,col:9}, {row:14,col:9}, {row:15,col:9},
    {row:15,col:8}, {row:15,col:7},
    {row:14,col:7}, {row:13,col:7}, {row:12,col:7}, {row:11,col:7}, {row:10,col:7},
    {row:9,col:6}, {row:9,col:5}, {row:9,col:4}, {row:9,col:3}, {row:9,col:2}, {row:9,col:1},
    {row:8,col:1}, {row:8,col:2}, {row:8,col:3}, {row:8,col:4}, {row:8,col:5}, {row:8,col:6}
  ],
  
  green: [
    {row:2,col:9}, {row:3,col:9}, {row:4,col:9}, {row:5,col:9}, {row:6,col:9},
    {row:7,col:10}, {row:7,col:11}, {row:7,col:12}, {row:7,col:13}, {row:7,col:14}, {row:7,col:15},
    {row:8,col:15}, {row:9,col:15},
    {row:9,col:14}, {row:9,col:13}, {row:9,col:12}, {row:9,col:11}, {row:9,col:10},
    {row:10,col:9}, {row:11,col:9}, {row:12,col:9}, {row:13,col:9}, {row:14,col:9}, {row:15,col:9},
    {row:15,col:8}, {row:15,col:7},
    {row:14,col:7}, {row:13,col:7}, {row:12,col:7}, {row:11,col:7}, {row:10,col:7},
    {row:9,col:6}, {row:9,col:5}, {row:9,col:4}, {row:9,col:3}, {row:9,col:2}, {row:9,col:1},
    {row:8,col:1}, {row:7,col:1},
    {row:7,col:2}, {row:7,col:3}, {row:7,col:4}, {row:7,col:5}, {row:7,col:6},
    {row:6,col:7}, {row:5,col:7}, {row:4,col:7}, {row:3,col:7}, {row:2,col:7}, {row:1,col:7},
    {row:1,col:8}, {row:2,col:8}, {row:3,col:8}, {row:4,col:8}, {row:5,col:8}, {row:6,col:8}
  ],

  yellow: [
    {row:14,col:7}, {row:13,col:7}, {row:12,col:7}, {row:11,col:7}, {row:10,col:7},
    {row:9,col:6}, {row:9,col:5}, {row:9,col:4}, {row:9,col:3}, {row:9,col:2}, {row:9,col:1},
    {row:8,col:1}, {row:7,col:1},
    {row:7,col:2}, {row:7,col:3}, {row:7,col:4}, {row:7,col:5}, {row:7,col:6},
    {row:6,col:7}, {row:5,col:7}, {row:4,col:7}, {row:3,col:7}, {row:2,col:7}, {row:1,col:7},
    {row:1,col:8}, {row:1,col:9},
    {row:2,col:9}, {row:3,col:9}, {row:4,col:9}, {row:5,col:9}, {row:6,col:9},
    {row:7,col:10}, {row:7,col:11}, {row:7,col:12}, {row:7,col:13}, {row:7,col:14}, {row:7,col:15},
    {row:8,col:15}, {row:9,col:15},
    {row:9,col:14}, {row:9,col:13}, {row:9,col:12}, {row:9,col:11}, {row:9,col:10},
    {row:10,col:9}, {row:11,col:9}, {row:12,col:9}, {row:13,col:9}, {row:14,col:9}, {row:15,col:9},
    {row:15,col:8}, {row:14,col:8}, {row:13,col:8}, {row:12,col:8}, {row:11,col:8}, {row:10,col:8}
  ],

  blue: [
    {row:9,col:14}, {row:9,col:13}, {row:9,col:12}, {row:9,col:11}, {row:9,col:10},
    {row:10,col:9}, {row:11,col:9}, {row:12,col:9}, {row:13,col:9}, {row:14,col:9}, {row:15,col:9},
    {row:15,col:8}, {row:15,col:7},
    {row:14,col:7}, {row:13,col:7}, {row:12,col:7}, {row:11,col:7}, {row:10,col:7},
    {row:9,col:6}, {row:9,col:5}, {row:9,col:4}, {row:9,col:3}, {row:9,col:2}, {row:9,col:1},
    {row:8,col:1}, {row:7,col:1},
    {row:7,col:2}, {row:7,col:3}, {row:7,col:4}, {row:7,col:5}, {row:7,col:6},
    {row:6,col:7}, {row:5,col:7}, {row:4,col:7}, {row:3,col:7}, {row:2,col:7}, {row:1,col:7},
    {row:1,col:8}, {row:1,col:9},
    {row:2,col:9}, {row:3,col:9}, {row:4,col:9}, {row:5,col:9}, {row:6,col:9},
    {row:7,col:10}, {row:7,col:11}, {row:7,col:12}, {row:7,col:13}, {row:7,col:14}, {row:7,col:15},
    
    {row:8,col:15}, {row:8,col:14}, {row:8,col:13}, {row:8,col:12}, {row:8,col:11}, {row:8,col:10}
  ]
};

// ---------- Home positions (centered in each house) ----------
const homePositions = {
  red:   [
    {r:3,c:3}, {r:3,c:4}, 
    {r:4,c:3}, {r:4,c:4}
  ],
  green: [
    {r:3,c:12}, {r:3,c:13}, 
    {r:4,c:12}, {r:4,c:13}
  ],
  yellow:[
    {r:12,c:3}, {r:12,c:4}, 
    {r:13,c:3}, {r:13,c:4}
  ],
  blue:  [
    {r:12,c:12}, {r:12,c:13}, 
    {r:13,c:12}, {r:13,c:13}
  ]
};

// Starting squares (first index in each path)
const startSquare = {
  red: paths.red[0],
  green: paths.green[0],
  yellow: paths.yellow[0],
  blue: paths.blue[0]
};

// ---------- Create tokens and track their state ----------
const tokens = { red: [], green: [], yellow: [], blue: [] };
const tokenState = { red: [], green: [], yellow: [], blue: [] };

function createToken(color, idx) {
  const t = document.createElement('div');
  t.className = 'token';
  t.dataset.color = color;
  t.dataset.idx = idx;
  t.dataset.state = -1;  // -1 = in home
  
  // Position token in home using CSS Grid
  const hp = homePositions[color][idx];
  t.style.gridRow = hp.r;
  t.style.gridColumn = hp.c;
  t.style.position = 'relative';
  t.style.top = '0';
  t.style.left = '0';

  const inner = document.createElement('div');
  inner.className = 'token-inner';
  
  // Add unique symbol to each token
  const symbol = document.createElement('div');
  symbol.className = 'token-symbol';
  const symbols = ['★', '♦', '♠', '♥'];
  symbol.textContent = symbols[idx];
  inner.appendChild(symbol);
  
  t.appendChild(inner);
  board.appendChild(t);
  tokens[color].push(t);
  tokenState[color].push(-1);
}

// ---------- Smooth movement functions ----------
function moveTokenSmoothly(token, targetRow, targetCol, duration, callback) {
  token.style.transition = `all ${duration}ms ease-in-out`;
  token.style.gridRow = targetRow;
  token.style.gridColumn = targetCol;
  
  setTimeout(() => {
    token.style.transition = '';
    if (callback) callback();
  }, duration);
}

function moveTokenThroughPath(color, tokenIndex, startState, endState, callback) {
  const token = tokens[color][tokenIndex];
  let currentStep = startState;
  
  function moveNextStep() {
    if (currentStep < endState) {
      currentStep++;
      const position = paths[color][currentStep];
      moveTokenSmoothly(token, position.row, position.col, 300, moveNextStep);
    } else {
      if (callback) callback();
    }
  }
  
  moveNextStep();
}

// ---------- Fast backward movement for killed tokens ----------
function moveTokenThroughPathBackwardFast(color, tokenIndex, startState, callback) {
  const token = tokens[color][tokenIndex];
  let currentStep = startState;
  
  function movePrevStep() {
    if (currentStep > 0) {
      currentStep--;
      const position = paths[color][currentStep];
      // Fast movement - 100ms per step instead of 300ms
      moveTokenSmoothly(token, position.row, position.col, 100, movePrevStep);
    } else {
      // Final move to home position
      const homePos = homePositions[color][tokenIndex];
      moveTokenSmoothly(token, homePos.r, homePos.c, 100, callback);
    }
  }
  
  movePrevStep();
}

// ---------- Kill animation ----------
function playKillAnimation(token, callback) {
  // Step 1: Explosion grow (0 → 0.5s)
  token.style.transform = 'scale(1.5)';
  token.style.filter = 'brightness(2)';
  token.style.transition = 'all 0.5s ease-in-out';
  
  setTimeout(() => {
    // Step 2: Shrink + fade (0.5s → 1.5s)
    token.style.transform = 'scale(0.8)';
    token.style.filter = 'brightness(1)';
    token.style.opacity = '0.7';
    token.style.transition = 'all 1s ease-in-out';
    
    setTimeout(() => {
      // Step 3: Reset clean (1.5s → 2s)
      token.style.transform = '';
      token.style.filter = '';
      token.style.opacity = '';
      token.style.transition = '';
      if (callback) callback();
    }, 1000); // 1s
  }, 500); // 0.5s
}


// ---------- Three consecutive sixes penalty functions ----------
function saveTurnStartState() {
  turnStartTokenStates = {
    red: [...tokenState.red],
    green: [...tokenState.green],
    yellow: [...tokenState.yellow],
    blue: [...tokenState.blue]
  };
  movesDuringCurrentTurn = [];
}

function recordMove(color, tokenIndex, fromState, toState, killedToken = null) {
  movesDuringCurrentTurn.push({
    color,
    tokenIndex,
    fromState,
    toState,
    killedToken
  });
}

function applyThreeSixesPenalty() {
  const currentColor = players[currentPlayerIndex];
  
  // Reset token states to turn start
  for (let color of players) {
    for (let i = 0; i < tokenState[color].length; i++) {
      const originalState = turnStartTokenStates[color][i];
      tokenState[color][i] = originalState;
      
      const token = tokens[color][i];
      token.dataset.state = originalState;
      
      if (originalState === -1) {
        const homePos = homePositions[color][i];
        token.style.gridRow = homePos.r;
        token.style.gridColumn = homePos.c;
        token.classList.remove('finished');
        updateTokenPosition(token, homePos.r, homePos.c);
      } else if (originalState === 'finished') {
        const centerPos = { row: 8, col: 8 };
        token.style.gridRow = centerPos.row;
        token.style.gridColumn = centerPos.col;
        token.classList.add('finished');
        updateTokenPosition(token, centerPos.row, centerPos.col);
      } else {
        const pathPos = paths[color][originalState];
        token.style.gridRow = pathPos.row;
        token.style.gridColumn = pathPos.col;
        token.classList.remove('finished');
        updateTokenPosition(token, pathPos.row, pathPos.col);
      }
    }
  }
  
  updateScoreboard();
  
  consecutiveSixes = 0;
  movesDuringCurrentTurn = [];
  resetSelectable();
  waitingForMove = false;
  
  setTimeout(() => {
    showMessage(`Three consecutive sixes! ${playerNames[currentColor]}'s turn cancelled and all moves undone!`, 'warning');
    advanceTurn();
  }, 1000);
}

// ---------- Automatic movement when only one token is out ----------
function hasOnlyOneTokenOut(color) {
  const tokensOut = tokenState[color].filter(state => 
    typeof state === 'number' && state >= 0 && state !== 'finished'
  ).length;
  const tokensFinished = tokenState[color].filter(state => state === 'finished').length;
  
  return tokensOut === 1 && tokensFinished === 0;
}

function getOnlyMovableTokenIndex(color) {
  for (let i = 0; i < tokenState[color].length; i++) {
    const state = tokenState[color][i];
    if (typeof state === 'number' && state >= 0 && state !== 'finished') {
      return i;
    }
  }
  return -1;
}

function autoMoveToken(color, tokenIndex, diceValue) {
  const tokenEl = tokens[color][tokenIndex];
  const currentState = tokenState[color][tokenIndex];
  
  if (typeof currentState === 'number' && currentState >= 0) {
    const targetPosition = currentState + diceValue;
    const finalVisiblePosition = paths[color].length - 1;
    const finishPosition = paths[color].length;
    const stepsToFinish = finishPosition - currentState;
    
    if (diceValue === stepsToFinish) {
      recordMove(color, tokenIndex, currentState, 'finished');
      
      moveTokenToCenter(color, tokenIndex, tokenEl);
      afterMoveProcess(color, tokenIndex, false, true);
      return;
    }
    
    if (targetPosition <= finalVisiblePosition) {
      recordMove(color, tokenIndex, currentState, targetPosition);
      
      moveTokenThroughPath(color, tokenIndex, currentState, targetPosition, () => {
        tokenState[color][tokenIndex] = targetPosition;
        tokenEl.dataset.state = targetPosition;
        
        const newPosition = paths[color][targetPosition];
        updateTokenPosition(tokenEl, newPosition.row, newPosition.col);
        const killed = checkForKill(newPosition.row, newPosition.col, tokenEl);
        afterMoveProcess(color, tokenIndex, killed);
      });
      return;
    }
    
    showMessage(`Auto-move failed! Need exactly ${stepsToFinish} to finish, but rolled ${diceValue}`, 'warning');
    
    setTimeout(() => advanceTurn(), 500);
    return;
  }
}

// ---------- Token click handler ----------
function onTokenClick(event) {
  const tokenEl = event.currentTarget;
  
  if (!tokenEl.classList.contains('selectable')) {
    return;
  }
  
  const color = tokenEl.dataset.color;
  const tokenIndex = parseInt(tokenEl.dataset.idx, 10);
  
  if (color !== players[currentPlayerIndex]) {
    return;
  }
  
  if (!waitingForMove) {
    return;
  }
  
  const currentState = tokenState[color][tokenIndex];
  const dice = currentDiceValue;
  
  // Move from home to start (requires 6)
  if (currentState === -1 && dice === 6) {
    const startPos = startSquare[color];
    
    recordMove(color, tokenIndex, currentState, 0);
    
    moveTokenSmoothly(tokenEl, startPos.row, startPos.col, 300, () => {
      tokenState[color][tokenIndex] = 0;
      tokenEl.dataset.state = 0;
      updateTokenPosition(tokenEl, startPos.row, startPos.col);
      
      playerStats[color].tokensOut++;
      updateScoreboard();
      
      afterMoveProcess(color, tokenIndex, false);
    });
    return;
  }
  
  // Move along path - UPDATED FOR EXACT DICE FINISH
  if (typeof currentState === 'number' && currentState >= 0) {
    const targetPosition = currentState + dice;
    const finalVisiblePosition = paths[color].length - 1;
    const finishPosition = paths[color].length;
    const stepsToFinish = finishPosition - currentState;
    
    // EXACT FINISH LOGIC: Token can only finish with exact dice value
    if (dice === stepsToFinish) {
      recordMove(color, tokenIndex, currentState, 'finished');
      
      moveTokenToCenter(color, tokenIndex, tokenEl);
      afterMoveProcess(color, tokenIndex, false, true);
      return;
    }
    
    // Normal movement within visible path (can't overshoot finish)
    if (targetPosition <= finalVisiblePosition) {
      recordMove(color, tokenIndex, currentState, targetPosition);
      
      moveTokenThroughPath(color, tokenIndex, currentState, targetPosition, () => {
        tokenState[color][tokenIndex] = targetPosition;
        tokenEl.dataset.state = targetPosition;
        
        const newPosition = paths[color][targetPosition];
        updateTokenPosition(tokenEl, newPosition.row, newPosition.col);
        const killed = checkForKill(newPosition.row, newPosition.col, tokenEl);
        afterMoveProcess(color, tokenIndex, killed);
      });
      return;
    }
    
    // If dice value is larger than needed steps, token cannot move
    showMessage(`Cannot move! Need exactly ${stepsToFinish} to finish, but rolled ${dice}`, 'warning');
    return;
  }
}

// ---------- Move token to center finish ----------
function moveTokenToCenter(color, tokenIndex, tokenEl) {
  const centerPositions = {
    red: { row: 8, col: 7 },
    green: { row: 7, col: 8 },
    yellow: { row: 9, col: 8 },
    blue: { row: 8, col: 9 }
  };
  
  const centerPos = centerPositions[color];
  
  moveTokenSmoothly(tokenEl, centerPos.row, centerPos.col, 300, () => {
    tokenState[color][tokenIndex] = 'finished';
    tokenEl.dataset.state = 'finished';
    tokenEl.classList.add('finished');
    updateTokenPosition(tokenEl, centerPos.row, centerPos.col);
    
    playerStats[color].tokensFinished++;
    updateScoreboard();
    
    showMessage(`${playerNames[color]} token reached the finish with exact dice!`, 'finish');
    
    checkGameWin(color);
  });
}

// ---------- Check if player won the game ----------
function checkGameWin(color) {
  const finishedTokens = tokenState[color].filter(state => state === 'finished').length;
  
  if (finishedTokens === 4) {
    setTimeout(() => {
      showGameWinMessage(color);
    }, 1000);
  }
}

// ---------- Show game win message ----------
function showGameWinMessage(winningColor) {
  const winMessage = document.createElement('div');
  winMessage.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: ${winningColor};
      padding: 40px;
      border-radius: 20px;
      text-align: center;
      z-index: 10000;
      border: 4px solid ${winningColor};
      box-shadow: 0 0 50px ${winningColor};
      font-family: 'Orbitron', sans-serif;
    ">
      <h1 style="font-size: 3rem; margin-bottom: 20px; text-transform: uppercase;">
        🏆 VICTORY! 🏆
      </h1>
      <p style="font-size: 2rem; margin-bottom: 30px;">
        ${playerNames[winningColor]} PLAYER WINS!
      </p>
      <button onclick="location.reload()" style="
        padding: 15px 30px;
        font-size: 1.2rem;
        background: linear-gradient(135deg, #ff00cc, #3333ff);
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-family: 'Orbitron', sans-serif;
      ">
        PLAY AGAIN
      </button>
    </div>
  `;
  
  document.body.appendChild(winMessage);
}

// ---------- Attach click listeners to ALL tokens ----------
function attachTokenListeners() {
  for (let color of players) {
    for (let i = 0; i < tokens[color].length; i++) {
      const token = tokens[color][i];
      token.removeEventListener('click', onTokenClick);
      token.addEventListener('click', onTokenClick);
    }
  }
}

// ---------- Token position tracking ----------
function updateTokenPosition(token, row, col) {
  const key = `${row},${col}`;
  
  // Remove token from previous position
  for (let [pos, tokensAtPos] of tokenPositions.entries()) {
    const index = tokensAtPos.indexOf(token);
    if (index !== -1) {
      tokensAtPos.splice(index, 1);
      if (tokensAtPos.length === 0) {
        tokenPositions.delete(pos);
      }
      break;
    }
  }
  
  // Add token to new position
  if (!tokenPositions.has(key)) {
    tokenPositions.set(key, []);
  }
  tokenPositions.get(key).push(token);
  
  updateTokenStacking(row, col);
}

function updateTokenStacking(row, col) {
  const key = `${row},${col}`;
  const tokensAtPos = tokenPositions.get(key);
  
  if (!tokensAtPos || tokensAtPos.length <= 1) {
    tokensAtPos?.forEach(token => {
      token.style.transform = '';
      token.style.opacity = '1';
      token.style.zIndex = '10';
    });
    return;
  }
  
  const currentPlayerColor = players[currentPlayerIndex];
  
  tokensAtPos.sort((a, b) => {
    if (a.dataset.color === currentPlayerColor && b.dataset.color !== currentPlayerColor) return -1;
    if (a.dataset.color !== currentPlayerColor && b.dataset.color === currentPlayerColor) return 1;
    return 0;
  });
  
  tokensAtPos.forEach((token, index) => {
    if (index === 0) {
      token.style.transform = 'translate(0, 0)';
      token.style.opacity = '1';
      token.style.zIndex = '10';
    } else if (index === 1) {
      token.style.transform = 'translate(4px, 2px) scale(0.9)';
      token.style.opacity = '0.8';
      token.style.zIndex = '9';
    } else {
      token.style.transform = 'translate(-2px, 4px) scale(0.85)';
      token.style.opacity = '0.7';
      token.style.zIndex = '8';
    }
  });
}

// ---------- Kill logic ----------
// ---------- Kill logic ----------
function checkForKill(row, col, movingToken) {
  const key = `${row},${col}`;
  const tokensAtPos = tokenPositions.get(key);
  
  if (!tokensAtPos || tokensAtPos.length <= 1) return false;

  // ✅ SAFE CELL CHECK (no kills allowed here)
  const cell = Array.from(document.querySelectorAll('.cell'))
    .find(x => parseInt(x.style.gridRow) === row && parseInt(x.style.gridColumn) === col);
  
  if (cell && (
       cell.classList.contains('red-house') || 
       cell.classList.contains('green-house') || 
       cell.classList.contains('yellow-house') || 
       cell.classList.contains('blue-house') ||
       (cell.style.background !== 'rgba(20, 25, 45, 0.6)' && 
        cell.style.background !== 'rgba(30, 35, 60, 0.6)' && 
        cell.style.background !== '')
     )) {
    return false;
  }

  // ✅ BLOCK CHECK: if any color has >= 2 tokens here → block → no kill
  const colorGroups = {};
  tokensAtPos.forEach(token => {
    const color = token.dataset.color;
    if (!colorGroups[color]) colorGroups[color] = [];
    colorGroups[color].push(token);
  });

  for (let color in colorGroups) {
    if (colorGroups[color].length >= 2) {
      console.log(`🛑 Block detected for ${color} → no kill allowed`);
      return false;
    }
  }

  // ✅ Now find killable tokens (different color, not the moving one)
  const otherTokens = tokensAtPos.filter(token => 
    token !== movingToken && token.dataset.color !== movingToken.dataset.color
  );
  
  if (otherTokens.length > 0) {
    const killedToken = otherTokens[0];
    const killedColor = killedToken.dataset.color;
    const killedIdx = parseInt(killedToken.dataset.idx, 10);
    const killedCurrentState = tokenState[killedColor][killedIdx];
    
    // Record kill
    const currentMove = movesDuringCurrentTurn[movesDuringCurrentTurn.length - 1];
    if (currentMove) {
      currentMove.killedToken = { color: killedColor, index: killedIdx, state: killedCurrentState };
    }
    
    // Play animation & send home
    playKillAnimation(killedToken, () => {
      if (typeof killedCurrentState === 'number' && killedCurrentState >= 0) {
        moveTokenThroughPathBackwardFast(killedColor, killedIdx, killedCurrentState, () => {
          tokenState[killedColor][killedIdx] = -1;
          killedToken.dataset.state = -1;
          const homePos = homePositions[killedColor][killedIdx];
          updateTokenPosition(killedToken, homePos.r, homePos.c);
          playerStats[movingToken.dataset.color].kills++;
          playerStats[killedColor].tokensOut = Math.max(0, playerStats[killedColor].tokensOut - 1);
          updateScoreboard();
          showMessage(`${playerNames[movingToken.dataset.color]} eliminated ${playerNames[killedColor]}'s token!`, 'kill');
        });
      } else {
        const homePos = homePositions[killedColor][killedIdx];
        moveTokenSmoothly(killedToken, homePos.r, homePos.c, 150, () => {
          tokenState[killedColor][killedIdx] = -1;
          killedToken.dataset.state = -1;
          updateTokenPosition(killedToken, homePos.r, homePos.c);
          playerStats[movingToken.dataset.color].kills++;
          playerStats[killedColor].tokensOut = Math.max(0, playerStats[killedColor].tokensOut - 1);
          updateScoreboard();
          showMessage(`${playerNames[movingToken.dataset.color]} eliminated ${playerNames[killedColor]}'s token!`, 'kill');
        });
      }
    });
    return true;
  }
  
  return false;
}


function showMessage(message, type = 'info') {
  const messageEl = document.createElement('div');
  messageEl.textContent = message;
  messageEl.className = `game-message message-${type}`;
  
  gameMessages.appendChild(messageEl);
  
  gameMessages.scrollTop = gameMessages.scrollHeight;
  
  if (gameMessages.children.length > 10) {
    gameMessages.removeChild(gameMessages.children[0]);
  }
}

// ---------- Scoreboard functions ----------
function updateScoreboard() {
  playerScores.innerHTML = '';
  
  players.forEach(color => {
    const scoreEl = document.createElement('div');
    scoreEl.className = 'player-score';
    
    if (color === players[currentPlayerIndex]) {
      scoreEl.classList.add('current');
    }
    
    if (isPlayerWinning(color)) {
      scoreEl.classList.add('winning');
    }
    
    scoreEl.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div class="player-color" style="background: ${color};"></div>
        <div class="player-name">${playerNames[color]}</div>
      </div>
      <div class="player-stats">
        <div class="stat">
          <div>Out</div>
          <div class="stat-value">${playerStats[color].tokensOut}</div>
        </div>
        <div class="stat">
          <div>Finished</div>
          <div class="stat-value">${playerStats[color].tokensFinished}</div>
        </div>
        <div class="stat">
          <div>Kills</div>
          <div class="stat-value">${playerStats[color].kills}</div>
        </div>
      </div>
    `;
    
    playerScores.appendChild(scoreEl);
  });
  
  addInterestingComment();
}

function isPlayerWinning(color) {
  const finishedCounts = players.map(p => playerStats[p].tokensFinished);
  const maxFinished = Math.max(...finishedCounts);
  
  if (playerStats[color].tokensFinished === maxFinished && maxFinished > 0) {
    const playersWithMax = players.filter(p => playerStats[p].tokensFinished === maxFinished);
    
    if (playersWithMax.length === 1) {
      return true;
    } else {
      const outCounts = playersWithMax.map(p => playerStats[p].tokensOut);
      const maxOut = Math.max(...outCounts);
      return playerStats[color].tokensOut === maxOut;
    }
  }
  
  return false;
}

function addInterestingComment() {
  const winningPlayers = players.filter(p => isPlayerWinning(p));
  
  if (winningPlayers.length === 0) return;
  
  const winningPlayer = winningPlayers[0];
  const comments = [
    `Catch ${playerNames[winningPlayer]}! They're dominating the game!`,
    `${playerNames[winningPlayer]} is on a winning streak!`,
    `Watch out! ${playerNames[winningPlayer]} is pulling ahead!`,
    `${playerNames[winningPlayer]} is the one to beat right now!`,
    `The ${playerNames[winningPlayer]} player is showing no mercy!`
  ];
  
  const randomComment = comments[Math.floor(Math.random() * comments.length)];
  
  if (Math.random() < 0.3) {
    showMessage(randomComment, 'warning');
  }
}

// ---------- Dice Function ----------
function rollDice() {
  rollBtn.disabled = true;
  
  dice.classList.add('dice-rolling');
  
  setTimeout(() => {
    currentDiceValue = Math.floor(Math.random() * 6) + 1;
    
    dice.textContent = currentDiceValue;
    dice.classList.remove('dice-rolling');
    
    if (currentDiceValue === 6) {
      consecutiveSixes++;
      
      if (consecutiveSixes >= 3) {
        applyThreeSixesPenalty();
        return;
      }
    } else {
      consecutiveSixes = 0;
    }
    
    const currentColor = players[currentPlayerIndex];
    
    if (hasOnlyOneTokenOut(currentColor) && currentDiceValue !== 6) {
      const tokenIndex = getOnlyMovableTokenIndex(currentColor);
      if (tokenIndex !== -1) {
        autoMoveToken(currentColor, tokenIndex, currentDiceValue);
        return;
      }
    }
    
    rollBtn.disabled = false;
    
    highlightCurrentHouse();
    
    const movable = getMovableTokenIndices(currentColor, currentDiceValue);

    resetSelectable();
    if (movable.length > 0) {
      for (let idx of movable) {
        tokens[currentColor][idx].classList.add('selectable');
      }
      waitingForMove = true;
    } else {
      waitingForMove = false;
      
      if (currentDiceValue === 6) {
        setTimeout(() => {
          enableRollButton(true);
          waitingForRoll = true;
        }, 500);
      } else {
        setTimeout(() => advanceTurn(), 500);
      }
    }
  }, 500);
}

// ---------- Game functions ----------
function highlightCurrentHouse() {
  document.querySelectorAll('.red-house, .green-house, .yellow-house, .blue-house')
    .forEach(h => {
      h.classList.remove('current-player');
      h.style.animation = 'none';
    });
  
  const currentColor = players[currentPlayerIndex];
  const currentHouse = document.querySelector(`.${currentColor}-house`);
  
  if (currentHouse) {
    currentHouse.classList.add('current-player');
    void currentHouse.offsetWidth;
    currentHouse.style.animation = 'borderPulse 2s infinite';
  }
  
  const playerInfo = document.getElementById('currentPlayerName');
  if (playerInfo) {
    playerInfo.textContent = playerNames[currentColor];
    playerInfo.style.color = currentColor;
  }
  
  updateScoreboard();
  
  tokenPositions.forEach((tokens, key) => {
    const [row, col] = key.split(',').map(Number);
    updateTokenStacking(row, col);
  });
}

function enableRollButton(v=true) {
  rollBtn.disabled = !v;
  waitingForRoll = v;
}

function resetSelectable() {
  document.querySelectorAll('.token').forEach(t => t.classList.remove('selectable'));
}

// Get list of movable tokens - UPDATED FOR EXACT DICE FINISH
function getMovableTokenIndices(color, dice) {
  const res = [];
  
  for (let i = 0; i < tokens[color].length; i++) {
    const state = tokenState[color][i];
    
    if (state === 'finished') {
      continue;
    }
    
    if (state === -1) {
      if (dice === 6) {
        res.push(i);
      }
    } else if (typeof state === 'number' && state >= 0) {
      const finalVisiblePosition = paths[color].length - 1;
      const finishPosition = paths[color].length;
      const target = state + dice;
      const stepsToFinish = finishPosition - state;
      
      if (dice === stepsToFinish) {
        res.push(i);
      } else if (target <= finalVisiblePosition) {
        res.push(i);
      }
    }
  }
  
  return res;
}

// Process turn logic after a move
function afterMoveProcess(color, tokenIndex, captured = false, finished = false) {
  resetSelectable();
  waitingForMove = false;

  if (currentDiceValue === 6 || captured || finished) {
    setTimeout(() => {
      enableRollButton(true);
      waitingForRoll = true;
      highlightCurrentHouse();
    }, 500);
    return;
  }

  setTimeout(() => advanceTurn(), 500);
}

// Advance to next player's turn
function advanceTurn() {
  saveTurnStartState();
  
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  
  enableRollButton(true);
  waitingForRoll = true;
  waitingForMove = false;
  
  resetSelectable();
  
  highlightCurrentHouse();
}

// ---------- Initialize game ----------
function initializeGame() {
  createStars();
  
  addPathCells([7,8,9], [1,2,3,4,5,6]);
  addPathCells([7,8,9], [10,11,12,13,14,15]);
  addPathCells([1,2,3,4,5,6], [7,8,9]);
  addPathCells([10,11,12,13,14,15], [7,8,9]);
  
  applyPathColors();
  
  for (let color of players) {
    for (let i = 0; i < 4; i++) createToken(color, i);
  }
  
  setTimeout(() => {
    attachTokenListeners();
  }, 100);
  
  saveTurnStartState();
  highlightCurrentHouse();
  enableRollButton(true);
  
  showMessage("Welcome to Neon Ludo 2077! Red player starts the game.", 'info');
  showMessage("Game now requires EXACT dice roll to finish! No overshooting allowed.", 'info');
  showMessage("Three consecutive sixes will cancel your turn and undo all moves!", 'warning');
  showMessage("Auto-move enabled: When only one token is out, it moves automatically!", 'info');
}

// ---------- Event Listeners ----------
rollBtn.addEventListener('click', ()=> {
  if (!waitingForRoll) return;
  
  enableRollButton(false);
  waitingForRoll = false;
  
  rollDice();
});

// Floating board toggle
floatingToggle.addEventListener('click', () => {
  boardContainer.classList.toggle('floating-disabled');
  if (boardContainer.classList.contains('floating-disabled')) {
    showMessage("Floating animation disabled", 'info');
  } else {
    showMessage("Floating animation enabled", 'info');
  }
});

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeGame);