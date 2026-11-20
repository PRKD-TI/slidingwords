// game.js
// Lógica principal do Caça-Palavras Deslizante

document.addEventListener('DOMContentLoaded', () => {
    // Instancia gerador e som
    const sound = new SoundManager();
    const generator = new PuzzleGenerator(WORDS_DATA, (typeof THEMES_DATA !== 'undefined' ? THEMES_DATA : {}));

    // Estado do jogo
    let currentPuzzle = null;
    let N = 3;
    let M = 4;
    let targetWordCount = 6;
    let minWordLen = 3;
    let maxWordLen = 8;
    let currentDifficulty = 'medio';
    let modalDifficulty = 'medio';
    let currentWordTheme = 'geral';
    let modalWordTheme = 'geral';
    let currentTheme = 'dark';
    try {
        currentTheme = localStorage.getItem('slidingwords_theme') || 'dark';
    } catch (e) {}
    let isDragging = false;
    let currentPath = []; // Array de [r, c]
    let currentWord = '';
    let hiddenCells = new Set(); // Chaves "r,c"
    let foundTargetsCount = 0;
    let bonusWords = new Set();
    let score = 0;
    let secondsElapsed = 0;
    let timerInterval = null;

    // Elementos do DOM
    const boardEl = document.getElementById('letter-grid');
    const slotsEl = document.getElementById('target-slots');
    const wordPreviewEl = document.getElementById('word-preview');
    const svgOverlay = document.getElementById('path-overlay');
    const scoreValEl = document.getElementById('score-val');
    const foundCounterEl = document.getElementById('found-counter');
    const timerValEl = document.getElementById('timer-val');
    const toastEl = document.getElementById('toast');

    // Botões
    const btnNewGame = document.getElementById('btn-new-game');
    const btnHint = document.getElementById('btn-hint');
    const btnSound = document.getElementById('btn-sound');
    const btnTheme = document.getElementById('btn-theme');
    const btnDimensions = document.getElementById('btn-dimensions');
    const btnHelp = document.getElementById('btn-help');

    // Modais
    const modalDimensions = document.getElementById('modal-dimensions');
    const modalHelp = document.getElementById('modal-help');
    const modalVictory = document.getElementById('modal-victory');

    // Iniciar áudio no primeiro clique/toque do usuário
    const unlockAudio = () => {
        sound.init();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    // Toast feedback
    let toastTimeout = null;
    function showToast(msg, type = 'info') {
        clearTimeout(toastTimeout);
        toastEl.textContent = msg;
        toastEl.className = `toast show ${type}`;
        toastTimeout = setTimeout(() => {
            toastEl.className = 'toast';
        }, 2200);
    }

    // Timer
    function startTimer() {
        clearInterval(timerInterval);
        secondsElapsed = 0;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            secondsElapsed++;
            updateTimerDisplay();
        }, 1000);
    }

    function updateTimerDisplay() {
        const m = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
        const s = (secondsElapsed % 60).toString().padStart(2, '0');
        timerValEl.textContent = `${m}:${s}`;
    }

    // Inicializar novo quebra-cabeça com parâmetros configuráveis
    function startNewGame(rows = N, cols = M, count = targetWordCount, minL = minWordLen, maxL = maxWordLen, diff = currentDifficulty, theme = currentWordTheme) {
        N = rows;
        M = cols;
        targetWordCount = count;
        minWordLen = minL;
        maxWordLen = maxL;
        currentDifficulty = diff;
        currentWordTheme = theme || 'geral';
        boardEl.classList.add('loading');
        
        setTimeout(() => {
            currentPuzzle = generator.generatePuzzle(N, M, targetWordCount, minWordLen, maxWordLen, currentDifficulty, currentWordTheme);
            if (!currentPuzzle && currentWordTheme !== 'geral') {
                // Se tema restrito não convergir no tamanho selecionado, tenta com vocabulário geral
                currentPuzzle = generator.generatePuzzle(N, M, targetWordCount, minWordLen, maxWordLen, currentDifficulty, 'geral');
            }
            if (!currentPuzzle) {
                // Fallback seguro se ainda não convergir
                currentPuzzle = generator.generatePuzzle(3, 4, 6, 3, 8, currentDifficulty, 'geral');
                N = 3;
                M = 4;
                targetWordCount = 6;
                minWordLen = 3;
                maxWordLen = 8;
            }

            hiddenCells.clear();
            currentPath = [];
            currentWord = '';
            foundTargetsCount = 0;
            bonusWords.clear();
            score = 0;
            scoreValEl.textContent = '0';
            foundCounterEl.textContent = `0 / ${targetWordCount}`;

            // Verifica se alguma célula não faz parte de nenhuma das palavras
            updateCellVisibility();

            renderSlots();
            renderGrid();
            clearDragPath();
            startTimer();
            boardEl.classList.remove('loading');

            const sizeLabel = document.getElementById('current-dimension-label');
            if (sizeLabel) sizeLabel.textContent = `${N}x${M}`;

            const themeIcons = {
                geral: '',
                princesas: '👑 Princesas • ',
                animais: '🐾 Animais • ',
                desenhos: '📺 Desenhos • '
            };
            const themePrefix = themeIcons[currentWordTheme] || '';

            const configLabel = document.getElementById('current-config-label');
            if (configLabel) configLabel.textContent = `${themePrefix}${targetWordCount} pal. (${minWordLen}-${maxWordLen} letras)`;

            const diffNames = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
            const diffLabel = document.getElementById('current-diff-label');
            if (diffLabel) diffLabel.textContent = diffNames[currentDifficulty] || 'Médio';

            const slotsTitle = document.getElementById('slots-title');
            if (slotsTitle) slotsTitle.textContent = `PALAVRAS A ENCONTRAR (${targetWordCount}):`;
        }, 30);
    }

    // Renderizar os slots de palavras com espaços lúdicos para cada letra
    function renderSlots() {
        slotsEl.innerHTML = '';
        currentPuzzle.targets.forEach((target) => {
            const slot = document.createElement('div');
            slot.className = 'target-slot';
            slot.id = `slot-${target.id}`;

            const wordDisplay = document.createElement('div');
            wordDisplay.className = 'slot-boxes';

            // Espaços visuais (casinhas) para cada letra da palavra
            for (let i = 0; i < target.length; i++) {
                const box = document.createElement('div');
                box.className = 'slot-box';
                wordDisplay.appendChild(box);
            }

            slot.appendChild(wordDisplay);
            slotsEl.appendChild(slot);
        });
    }

    // Renderizar a matriz de letras N x M com estilo adaptativo
    function renderGrid() {
        boardEl.innerHTML = '';
        boardEl.style.gridTemplateRows = `repeat(${N}, 1fr)`;
        boardEl.style.gridTemplateColumns = `repeat(${M}, 1fr)`;

        // Dimensionamento adaptativo para matrizes de 3x3 até 10x10
        const maxDim = Math.max(N, M);
        const gap = maxDim >= 8 ? '4px' : (maxDim >= 6 ? '6px' : '8px');
        const radius = maxDim >= 8 ? '6px' : (maxDim >= 6 ? '8px' : '12px');
        const border = maxDim >= 8 ? '1px' : '2px';
        const charSize = maxDim >= 8 
            ? 'clamp(0.65rem, 2.7vw, 1.05rem)' 
            : (maxDim >= 6 ? 'clamp(0.85rem, 3.5vw, 1.35rem)' : 'clamp(1.1rem, 4.5vw, 1.8rem)');

        boardEl.style.setProperty('--grid-gap', gap);
        boardEl.style.setProperty('--tile-radius', radius);
        boardEl.style.setProperty('--tile-border', border);
        boardEl.style.setProperty('--char-size', charSize);

        for (let r = 0; r < N; r++) {
            for (let c = 0; c < M; c++) {
                const letter = currentPuzzle.grid[r][c];
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.row = r;
                tile.dataset.col = c;
                tile.id = `tile-${r}-${c}`;

                const charSpan = document.createElement('span');
                charSpan.className = 'tile-char';
                charSpan.textContent = letter;
                tile.appendChild(charSpan);

                if (hiddenCells.has(`${r},${c}`)) {
                    tile.classList.add('hidden');
                }

                // Eventos de mouse
                tile.addEventListener('mousedown', (e) => onStartSelect(r, c, e));
                tile.addEventListener('mouseenter', () => onMoveSelect(r, c));

                boardEl.appendChild(tile);
            }
        }
        adjustSvgSize();
    }

    // Atualiza a visibilidade das células:
    // "Quando formada uma palavra, as letras que não fazem parte de mais nenhuma outra devem ser ocultadas da matriz."
    function updateCellVisibility() {
        // Coleta todas as células que ainda são necessárias para as palavras NÃO encontradas
        const activeCells = new Set();
        currentPuzzle.targets.forEach(target => {
            if (!target.found) {
                target.path.forEach(([r, c]) => {
                    activeCells.add(`${r},${c}`);
                });
            }
        });

        // Oculta qualquer célula que não faz parte de nenhuma palavra ativa restante
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < M; c++) {
                const key = `${r},${c}`;
                if (!activeCells.has(key)) {
                    if (!hiddenCells.has(key)) {
                        hiddenCells.add(key);
                        const tile = document.getElementById(`tile-${r}-${c}`);
                        if (tile) {
                            tile.classList.add('hidden');
                        }
                    }
                }
            }
        }
    }

    // Ajusta o tamanho da camada SVG de conexões
    function adjustSvgSize() {
        const rect = boardEl.getBoundingClientRect();
        svgOverlay.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
        svgOverlay.style.width = `${rect.width}px`;
        svgOverlay.style.height = `${rect.height}px`;
    }
    window.addEventListener('resize', adjustSvgSize);

    // Converte coordenadas da matriz para centro do elemento na SVG
    function getTileCenter(r, c) {
        const tile = document.getElementById(`tile-${r}-${c}`);
        if (!tile) return { x: 0, y: 0 };
        const boardRect = boardEl.getBoundingClientRect();
        const tileRect = tile.getBoundingClientRect();
        return {
            x: (tileRect.left + tileRect.right) / 2 - boardRect.left,
            y: (tileRect.top + tileRect.bottom) / 2 - boardRect.top
        };
    }

    // Desenha a linha dinâmica do arrasto
    function drawDragPath() {
        adjustSvgSize();
        svgOverlay.innerHTML = '';
        if (currentPath.length < 2) return;

        let d = '';
        currentPath.forEach(([r, c], idx) => {
            const pt = getTileCenter(r, c);
            if (idx === 0) {
                d += `M ${pt.x} ${pt.y}`;
            } else {
                d += ` L ${pt.x} ${pt.y}`;
            }
        });

        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', d);
        pathEl.setAttribute('class', 'drag-path-line');
        svgOverlay.appendChild(pathEl);
    }

    // Interações de toque / mouse
    function onStartSelect(r, c, e) {
        if (e && e.button !== 0) return; // apenas botão esquerdo
        if (hiddenCells.has(`${r},${c}`)) return;

        isDragging = true;
        currentPath = [[r, c]];
        currentWord = currentPuzzle.grid[r][c];

        updateSelectionUI();
        sound.playSelect(1);
        sound.vibrate(20);
    }

    function onMoveSelect(r, c) {
        if (!isDragging) return;
        if (hiddenCells.has(`${r},${c}`)) return;

        const len = currentPath.length;
        if (len === 0) return;

        const [lastR, lastC] = currentPath[len - 1];

        // Se o usuário voltou para o bloco anterior, faz backtrack (desfaz último passo)
        if (len >= 2) {
            const [prevR, prevC] = currentPath[len - 2];
            if (r === prevR && c === prevC) {
                currentPath.pop();
                currentWord = currentWord.slice(0, -1);
                updateSelectionUI();
                sound.playSelect(currentPath.length);
                return;
            }
        }

        // Se já está no caminho, não pode repetir na mesma palavra
        const alreadyInPath = currentPath.some(([pr, pc]) => pr === r && pc === c);
        if (alreadyInPath) return;

        // Verifica se o movimento é estritamente adjacente na HORIZONTAL ou VERTICAL
        const dr = Math.abs(r - lastR);
        const dc = Math.abs(c - lastC);
        const isOrthoAdjacent = (dr + dc === 1);

        if (isOrthoAdjacent) {
            currentPath.push([r, c]);
            currentWord += currentPuzzle.grid[r][c];
            updateSelectionUI();
            sound.playSelect(currentPath.length);
            sound.vibrate(25);
        }
    }

    function onEndSelect() {
        if (!isDragging) return;
        isDragging = false;

        if (currentPath.length >= 3) {
            checkFormedWord(currentWord, currentPath);
        }

        clearDragPath();
    }

    function updateSelectionUI() {
        // Limpa destaques anteriores
        document.querySelectorAll('.tile.selected').forEach(t => t.classList.remove('selected', 'first-selected'));

        currentPath.forEach(([r, c], idx) => {
            const tile = document.getElementById(`tile-${r}-${c}`);
            if (tile) {
                tile.classList.add('selected');
                if (idx === 0) tile.classList.add('first-selected');
            }
        });

        drawDragPath();

        // Atualiza pílula flutuante
        if (currentWord.length > 0) {
            wordPreviewEl.textContent = currentWord;
            wordPreviewEl.classList.add('visible');
        } else {
            wordPreviewEl.classList.remove('visible');
        }
    }

    function clearDragPath() {
        currentPath = [];
        currentWord = '';
        svgOverlay.innerHTML = '';
        document.querySelectorAll('.tile.selected').forEach(t => t.classList.remove('selected', 'first-selected'));
        wordPreviewEl.classList.remove('visible');
    }

    // Valida a palavra formada
    function checkFormedWord(word, path) {
        // 1. Verifica se corresponde a um dos 6 alvos ainda não encontrados
        const targetMatch = currentPuzzle.targets.find(t => !t.found && t.word === word);

        if (targetMatch) {
            // Palavra alvo encontrada!
            targetMatch.found = true;
            foundTargetsCount++;
            foundCounterEl.textContent = `${foundTargetsCount} / ${targetWordCount}`;

            // Pontuação: 100 base + 25 por letra + bônus de velocidade
            const pts = 100 + word.length * 25;
            score += pts;
            scoreValEl.textContent = score;

            // Atualiza slot visual da palavra
            markSlotAsFound(targetMatch);

            // Efeito sonoro alegre
            sound.playWordSuccess();
            sound.vibrate(50);
            showToast(`+${pts} pts! Encontrou "${targetMatch.displayWord}"!`, 'success');

            // REGRA FUNDAMENTAL:
            // "Quando formada uma palavra, as letras que não fazem parte de mais nenhuma outra devem ser ocultadas da matriz."
            updateCellVisibility();

            // Verifica vitória (todas as palavras encontradas)
            if (foundTargetsCount === targetWordCount) {
                setTimeout(onVictory, 600);
            }
            return;
        }

        // 2. Já foi encontrada anteriormente?
        const alreadyFound = currentPuzzle.targets.find(t => t.found && t.word === word);
        if (alreadyFound) {
            showToast(`"${alreadyFound.displayWord}" já foi encontrada!`, 'warn');
            sound.playFail();
            return;
        }

        // 3. É uma palavra válida do dicionário português (bônus)?
        if (generator.wordSet.has(word) && !bonusWords.has(word)) {
            bonusWords.add(word);
            score += 40;
            scoreValEl.textContent = score;
            const display = generator.displayMap[word] || word;
            showToast(`Bônus! "${display}" é válida no dicionário (+40 pts)!`, 'info');
            sound.playBonusWord();
            return;
        }

        // 4. Palavra inválida
        sound.playFail();
    }

    // Anima o preenchimento dos espaços com as letras encontradas
    function markSlotAsFound(target) {
        const slot = document.getElementById(`slot-${target.id}`);
        if (!slot) return;

        slot.classList.add('found');
        const boxes = slot.querySelectorAll('.slot-box');

        for (let i = 0; i < target.displayWord.length; i++) {
            const box = boxes[i] || document.createElement('div');
            box.className = 'slot-box filled';
            box.textContent = target.displayWord[i];
            box.style.animationDelay = `${i * 0.06}s`;
            if (!boxes[i]) {
                slot.querySelector('.slot-boxes').appendChild(box);
            }
        }
    }

    // Tela de vitória
    function onVictory() {
        clearInterval(timerInterval);
        sound.playVictory();

        document.getElementById('vic-score').textContent = score;
        document.getElementById('vic-time').textContent = timerValEl.textContent;
        document.getElementById('vic-bonus').textContent = bonusWords.size;

        modalVictory.classList.add('active');
        triggerConfetti();
    }

    // Efeito de confetes leve com canvas
    function triggerConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces = [];
        const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

        for (let i = 0; i < 90; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * -canvas.height,
                w: Math.random() * 8 + 4,
                h: Math.random() * 6 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 3 + 2,
                speedX: (Math.random() - 0.5) * 2,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 8
            });
        }

        let animFrame;
        const startTime = Date.now();

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });

            if (Date.now() - startTime < 4000) {
                animFrame = requestAnimationFrame(render);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        render();
    }

    // Suporte para TOUCH no dispositivo móvel / navegador
    boardEl.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const tile = el ? el.closest('.tile') : null;
        if (tile) {
            const r = parseInt(tile.dataset.row, 10);
            const c = parseInt(tile.dataset.col, 10);
            onStartSelect(r, c);
        }
    }, { passive: false });

    boardEl.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDragging) return;
        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const tile = el ? el.closest('.tile') : null;
        if (tile) {
            const r = parseInt(tile.dataset.row, 10);
            const c = parseInt(tile.dataset.col, 10);
            onMoveSelect(r, c);
        }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        if (isDragging) {
            onEndSelect();
        }
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            onEndSelect();
        }
    });

    // Dica (destaca a primeira letra de uma palavra ainda não encontrada)
    btnHint.addEventListener('click', () => {
        const unfound = currentPuzzle.targets.filter(t => !t.found);
        if (unfound.length === 0) return;

        // Pega uma palavra não encontrada aleatória
        const target = unfound[Math.floor(Math.random() * unfound.length)];
        const [r0, c0] = target.path[0];
        const tile = document.getElementById(`tile-${r0}-${c0}`);
        
        if (tile) {
            tile.classList.add('hint-pulse');
            setTimeout(() => tile.classList.remove('hint-pulse'), 1800);
            
            // Também destaca a primeira casinha do slot correspondente
            const slot = document.getElementById(`slot-${target.id}`);
            if (slot) {
                const firstBox = slot.querySelector('.slot-box:not(.filled)');
                if (firstBox) {
                    firstBox.classList.add('hint-box-pulse');
                    setTimeout(() => firstBox.classList.remove('hint-box-pulse'), 1800);
                }
            }

            showToast(`Dica: uma das palavras começa em (${r0 + 1}, ${c0 + 1}) com "${target.word[0]}"!`, 'info');
            sound.playBonusWord();
        }
    });

    // Toggle som
    btnSound.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        btnSound.textContent = isMuted ? '🔇' : '🔊';
        btnSound.title = isMuted ? 'Ativar Som' : 'Desativar Som';
        showToast(isMuted ? 'Som desativado' : 'Som ativado', 'info');
    });
    // Atualiza ícone inicial de som
    if (sound.muted) btnSound.textContent = '🔇';

    // Gerenciamento de Tema (Claro / Escuro)
    function applyTheme(theme) {
        currentTheme = (theme === 'light') ? 'light' : 'dark';
        const isLight = (currentTheme === 'light');
        document.documentElement.classList.toggle('light-theme', isLight);
        document.body.classList.toggle('light-theme', isLight);
        document.documentElement.setAttribute('data-theme', currentTheme);
        document.body.setAttribute('data-theme', currentTheme);

        try {
            localStorage.setItem('slidingwords_theme', currentTheme);
        } catch (e) {}

        if (btnTheme) {
            btnTheme.textContent = isLight ? '🌙' : '☀️';
            btnTheme.title = isLight ? 'Ativar Modo Escuro' : 'Ativar Modo Claro';
        }

        document.querySelectorAll('.btn-theme-opt').forEach(b => {
            b.classList.toggle('active', b.dataset.theme === currentTheme);
        });
    }

    if (btnTheme) {
        btnTheme.addEventListener('click', () => {
            const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(nextTheme);
            showToast(nextTheme === 'light' ? 'Modo Claro ativado ☀️' : 'Modo Escuro ativado 🌙', 'info');
        });
    }

    document.querySelectorAll('.btn-theme-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedTheme = btn.dataset.theme;
            applyTheme(selectedTheme);
            showToast(selectedTheme === 'light' ? 'Modo Claro ativado ☀️' : 'Modo Escuro ativado 🌙', 'info');
        });
    });

    // Novo Jogo (mantém a configuração atual)
    btnNewGame.addEventListener('click', () => {
        startNewGame(N, M, targetWordCount, minWordLen, maxWordLen, currentDifficulty, currentWordTheme);
        showToast(`Novo tabuleiro ${N}x${M} gerado!`, 'info');
    });

    // Modal de Configuração Avançada
    btnDimensions.addEventListener('click', () => {
        document.getElementById('input-rows').value = N;
        document.getElementById('input-cols').value = M;
        document.getElementById('input-words').value = targetWordCount;
        document.getElementById('input-min-len').value = minWordLen;
        document.getElementById('input-max-len').value = maxWordLen;

        document.getElementById('val-rows').textContent = N;
        document.getElementById('val-cols').textContent = M;
        document.getElementById('val-words').textContent = targetWordCount;
        document.getElementById('val-min-len').textContent = minWordLen;
        document.getElementById('val-max-len').textContent = maxWordLen;

        modalDifficulty = currentDifficulty;
        document.querySelectorAll('.btn-diff').forEach(b => {
            b.classList.toggle('active', b.dataset.diff === modalDifficulty);
        });

        modalWordTheme = currentWordTheme;
        document.querySelectorAll('.btn-cat').forEach(b => {
            b.classList.toggle('active', (b.dataset.category || 'geral') === modalWordTheme);
        });

        document.querySelectorAll('.btn-theme-opt').forEach(b => {
            b.classList.toggle('active', b.dataset.theme === currentTheme);
        });

        modalDimensions.classList.add('active');
    });

    // Seleção de dificuldade
    document.querySelectorAll('.btn-diff').forEach(btn => {
        btn.addEventListener('click', () => {
            modalDifficulty = btn.dataset.diff;
            document.querySelectorAll('.btn-diff').forEach(b => {
                b.classList.toggle('active', b.dataset.diff === modalDifficulty);
            });
        });
    });

    // Seleção de Tema de Palavras (Geral, Princesas, Animais, Desenhos)
    document.querySelectorAll('.btn-cat').forEach(btn => {
        btn.addEventListener('click', () => {
            modalWordTheme = btn.dataset.category || 'geral';
            document.querySelectorAll('.btn-cat').forEach(b => {
                b.classList.toggle('active', (b.dataset.category || 'geral') === modalWordTheme);
            });
        });
    });

    document.getElementById('input-rows').addEventListener('input', (e) => {
        document.getElementById('val-rows').textContent = e.target.value;
    });
    document.getElementById('input-cols').addEventListener('input', (e) => {
        document.getElementById('val-cols').textContent = e.target.value;
    });
    document.getElementById('input-words').addEventListener('input', (e) => {
        document.getElementById('val-words').textContent = e.target.value;
    });
    document.getElementById('input-min-len').addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        document.getElementById('val-min-len').textContent = val;
        const maxInput = document.getElementById('input-max-len');
        if (val > parseInt(maxInput.value, 10)) {
            maxInput.value = val;
            document.getElementById('val-max-len').textContent = val;
        }
    });
    document.getElementById('input-max-len').addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        document.getElementById('val-max-len').textContent = val;
        const minInput = document.getElementById('input-min-len');
        if (val < parseInt(minInput.value, 10)) {
            minInput.value = val;
            document.getElementById('val-min-len').textContent = val;
        }
    });

    // Predefinições rápidas
    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const r = parseInt(btn.dataset.rows, 10);
            const c = parseInt(btn.dataset.cols, 10);
            const w = parseInt(btn.dataset.words, 10);
            const mi = parseInt(btn.dataset.min, 10);
            const ma = parseInt(btn.dataset.max, 10);

            document.getElementById('input-rows').value = r;
            document.getElementById('input-cols').value = c;
            document.getElementById('input-words').value = w;
            document.getElementById('input-min-len').value = mi;
            document.getElementById('input-max-len').value = ma;

            document.getElementById('val-rows').textContent = r;
            document.getElementById('val-cols').textContent = c;
            document.getElementById('val-words').textContent = w;
            document.getElementById('val-min-len').textContent = mi;
            document.getElementById('val-max-len').textContent = ma;
        });
    });

    document.getElementById('btn-apply-dimensions').addEventListener('click', () => {
        const newN = parseInt(document.getElementById('input-rows').value, 10);
        const newM = parseInt(document.getElementById('input-cols').value, 10);
        const newCount = parseInt(document.getElementById('input-words').value, 10);
        const newMin = parseInt(document.getElementById('input-min-len').value, 10);
        const newMax = parseInt(document.getElementById('input-max-len').value, 10);

        modalDimensions.classList.remove('active');
        startNewGame(newN, newM, newCount, newMin, newMax, modalDifficulty, modalWordTheme);
        const diffNames = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
        const themeLabels = {
            geral: '',
            princesas: ' • 👑 Princesas',
            animais: ' • 🐾 Animais',
            desenhos: ' • 📺 Desenhos'
        };
        const themeText = themeLabels[modalWordTheme] || '';
        showToast(`Desafio ${newN}x${newM} (${diffNames[modalDifficulty] || 'Médio'}${themeText}) gerado!`, 'info');
    });

    document.getElementById('btn-close-dimensions').addEventListener('click', () => {
        modalDimensions.classList.remove('active');
    });

    // Modal de Ajuda
    btnHelp.addEventListener('click', () => {
        modalHelp.classList.add('active');
    });
    document.getElementById('btn-close-help').addEventListener('click', () => {
        modalHelp.classList.remove('active');
    });

    // Vitória: próximo nível
    document.getElementById('btn-next-level').addEventListener('click', () => {
        modalVictory.classList.remove('active');
        startNewGame(N, M, targetWordCount, minWordLen, maxWordLen, currentDifficulty, currentWordTheme);
    });

    // Fechar modais ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
            e.target.classList.remove('active');
        }
    });

    // Aplicar tema salvo ou padrão
    applyTheme(currentTheme);

    // Iniciar jogo inaugural (padrão 3x4, 6 palavras, 3 a 8 letras, Médio)
    startNewGame(3, 4, 6, 3, 8, 'medio');
});
