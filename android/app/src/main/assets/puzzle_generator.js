// puzzle_generator.js
// Gerador avançado e configurável de caça-palavras deslizante em português
// com suporte a 3 níveis de vocabulário (Fácil, Médio, Difícil) e Temas (Geral, Princesas, Animais, Desenhos)

class PuzzleGenerator {
    constructor(wordsData, themesData = {}) {
        this.words = wordsData.words || [];
        this.displayMap = Object.assign({}, wordsData.display || {});
        this.themes = (typeof THEMES_DATA !== 'undefined') ? THEMES_DATA : (themesData || {});
        this.facilLimit = wordsData.facilLimit || 2500;
        this.medioLimit = wordsData.medioLimit || 7500;
        this.dificilLimit = wordsData.dificilLimit || this.words.length;
        this.wordSet = new Set(this.words);
        this.trie = {};

        // Mapeamento e agrupamento por categoria temática
        this.themeWordsByCat = {};
        this.themeWordsByCatAndLen = {};

        for (const catKey of Object.keys(this.themes)) {
            const cat = this.themes[catKey];
            const catWords = cat.words || [];
            this.themeWordsByCat[catKey] = catWords;
            this.themeWordsByCatAndLen[catKey] = {};
            catWords.forEach(w => {
                this.wordSet.add(w);
                const len = w.length;
                if (!this.themeWordsByCatAndLen[catKey][len]) {
                    this.themeWordsByCatAndLen[catKey][len] = [];
                }
                this.themeWordsByCatAndLen[catKey][len].push(w);
            });
            if (cat.display) {
                Object.assign(this.displayMap, cat.display);
            }
        }

        // Dicionários particionados por dificuldade
        this.wordsByDifficulty = {
            facil: this.words.slice(0, this.facilLimit),
            medio: this.words.slice(0, this.medioLimit),
            dificil: this.words
        };

        this.difficultySets = {
            facil: new Set(this.wordsByDifficulty.facil),
            medio: new Set(this.wordsByDifficulty.medio),
            dificil: this.wordSet
        };

        this.wordsByDiffAndLen = {
            facil: {},
            medio: {},
            dificil: {}
        };

        this.buildTrie();
    }

    insertTrie(w) {
        let node = this.trie;
        for (let j = 0; j < w.length; j++) {
            const ch = w[j];
            if (!node[ch]) node[ch] = {};
            node = node[ch];
        }
        node['$'] = w;
    }

    buildTrie() {
        for (let i = 0; i < this.words.length; i++) {
            const w = this.words[i];
            const len = w.length;

            // Classificação por dificuldade
            if (i < this.facilLimit) {
                if (!this.wordsByDiffAndLen.facil[len]) this.wordsByDiffAndLen.facil[len] = [];
                this.wordsByDiffAndLen.facil[len].push(w);
            }
            if (i < this.medioLimit) {
                if (!this.wordsByDiffAndLen.medio[len]) this.wordsByDiffAndLen.medio[len] = [];
                this.wordsByDiffAndLen.medio[len].push(w);
            }
            if (!this.wordsByDiffAndLen.dificil[len]) this.wordsByDiffAndLen.dificil[len] = [];
            this.wordsByDiffAndLen.dificil[len].push(w);

            this.insertTrie(w);
        }

        // Insere palavras dos temas na Trie
        for (const catKey of Object.keys(this.themeWordsByCat)) {
            const catWords = this.themeWordsByCat[catKey];
            for (const tw of catWords) {
                this.insertTrie(tw);
            }
        }
    }

    getNeighbors(r, c, N, M) {
        const res = [];
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Estritamente horizontal ou vertical
        for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < N && nc >= 0 && nc < M) {
                res.push([nr, nc]);
            }
        }
        return res;
    }

    // Busca todas as palavras válidas do dicionário com poda eficiente por minLen/maxLen
    findAllWordsInGrid(grid, N, M, minLen = 3, maxLen = 8) {
        const found = new Map(); // word -> path
        const visited = Array.from({ length: N }, () => Array(M).fill(false));

        const dfs = (r, c, node, path) => {
            const ch = grid[r][c];
            if (!node[ch]) return;

            const nxt = node[ch];
            path.push([r, c]);
            visited[r][c] = true;

            if (nxt['$']) {
                const w = nxt['$'];
                if (w.length >= minLen && w.length <= maxLen) {
                    if (!found.has(w) || path.length < found.get(w).length) {
                        found.set(w, [...path]);
                    }
                }
            }

            // Poda ramos maiores que maxLen
            if (path.length < maxLen) {
                const neighbors = this.getNeighbors(r, c, N, M);
                for (const [nr, nc] of neighbors) {
                    if (!visited[nr][nc]) {
                        dfs(nr, nc, nxt, path);
                    }
                }
            }

            visited[r][c] = false;
            path.pop();
        };

        for (let r = 0; r < N; r++) {
            for (let c = 0; c < M; c++) {
                dfs(r, c, this.trie, []);
            }
        }

        return found;
    }

    // Gera o tabuleiro conforme parâmetros customizados:
    // N (linhas: 3 a 10), M (colunas: 3 a 10), targetCount (3 a 16), minLen/maxLen (3 a 12)
    // difficulty: 'facil' (apenas comuns), 'medio' (fáceis + médias, padrão), 'dificil' (todas)
    // theme: 'geral' (todas palavras do vocabulário), 'princesas', 'animais', 'desenhos'
    generatePuzzle(N = 3, M = 4, targetCount = 6, minLen = 3, maxLen = 8, difficulty = 'medio', theme = 'geral', maxAttempts = 150) {
        const freqLetters = 'AEIOURSTLMNDC';
        const totalCells = N * M;
        const actualMinLen = Math.max(3, Math.min(minLen, maxLen, totalCells));
        const actualMaxLen = Math.max(actualMinLen, Math.min(maxLen, totalCells));
        const actualTargetCount = Math.max(3, targetCount);
        const validDiff = ['facil', 'medio', 'dificil'].includes(difficulty) ? difficulty : 'medio';

        const poolByLen = this.wordsByDiffAndLen[validDiff];
        const fullPool = this.wordsByDifficulty[validDiff];
        const allowedTargetSet = this.difficultySets[validDiff];

        const hasTheme = Boolean(theme && theme !== 'geral' && this.themeWordsByCat[theme] && this.themeWordsByCat[theme].length > 0);
        const themeWords = hasTheme ? this.themeWordsByCat[theme] : null;
        const themeWordsByLen = hasTheme ? this.themeWordsByCatAndLen[theme] : null;
        const themeSet = hasTheme ? new Set(themeWords) : null;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const grid = Array.from({ length: N }, () => Array(M).fill(''));

            const canFit = (word, path) => {
                for (let i = 0; i < path.length; i++) {
                    const [r, c] = path[i];
                    if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
                        return false;
                    }
                }
                return true;
            };

            // Semear palavras ortogonais com tamanhos dentro da faixa selecionada
            const numSeeds = Math.max(actualTargetCount * 2, Math.floor(totalCells * 0.9));
            for (let s = 0; s < numSeeds; s++) {
                const targetLen = Math.floor(Math.random() * (actualMaxLen - actualMinLen + 1)) + actualMinLen;
                let pool = null;
                if (hasTheme) {
                    pool = (themeWordsByLen[targetLen] && themeWordsByLen[targetLen].length > 0) ? themeWordsByLen[targetLen] : themeWords;
                } else {
                    pool = poolByLen[targetLen] || fullPool;
                }
                const candWord = pool[Math.floor(Math.random() * pool.length)];

                for (let t = 0; t < 12; t++) {
                    const startR = Math.floor(Math.random() * N);
                    const startC = Math.floor(Math.random() * M);
                    const path = [[startR, startC]];
                    const visited = new Set([`${startR},${startC}`]);
                    let ok = true;

                    for (let step = 0; step < candWord.length - 1; step++) {
                        const [currR, currC] = path[path.length - 1];
                        const neighbors = this.getNeighbors(currR, currC, N, M)
                            .filter(([nr, nc]) => !visited.has(`${nr},${nc}`));

                        if (neighbors.length === 0) {
                            ok = false;
                            break;
                        }
                        const nextCell = neighbors[Math.floor(Math.random() * neighbors.length)];
                        visited.add(`${nextCell[0]},${nextCell[1]}`);
                        path.push(nextCell);
                    }

                    if (ok && canFit(candWord, path)) {
                        for (let i = 0; i < path.length; i++) {
                            const [r, c] = path[i];
                            grid[r][c] = candWord[i];
                        }
                        break;
                    }
                }
            }

            // Preenche células vazias com letras frequentes do português
            for (let r = 0; r < N; r++) {
                for (let c = 0; c < M; c++) {
                    if (grid[r][c] === '') {
                        grid[r][c] = freqLetters[Math.floor(Math.random() * freqLetters.length)];
                    }
                }
            }

            // Busca todas as palavras no grid dentro do limite de tamanho
            const allWordsMap = this.findAllWordsInGrid(grid, N, M, actualMinLen, actualMaxLen);

            // Filtra os alvos: se tiver tema ativo, prioriza as palavras do tema
            let candidateWords = [];
            if (hasTheme) {
                const themeCandidates = Array.from(allWordsMap.keys()).filter(w => themeSet.has(w));
                if (themeCandidates.length >= actualTargetCount) {
                    candidateWords = themeCandidates;
                } else {
                    const regularCandidates = Array.from(allWordsMap.keys())
                        .filter(w => !themeSet.has(w) && allowedTargetSet.has(w));
                    candidateWords = [...themeCandidates, ...regularCandidates];
                }
            } else {
                candidateWords = Array.from(allWordsMap.keys()).filter(w => allowedTargetSet.has(w));
            }

            if (candidateWords.length < actualTargetCount) {
                continue;
            }

            // Tenta selecionar targetCount palavras maximizando a cobertura de células
            for (let shuffleTry = 0; shuffleTry < 20; shuffleTry++) {
                const pool = [...candidateWords];
                pool.sort((a, b) => {
                    if (hasTheme) {
                        const isThemeA = themeSet.has(a) ? 1 : 0;
                        const isThemeB = themeSet.has(b) ? 1 : 0;
                        if (isThemeA !== isThemeB) return isThemeB - isThemeA; // Palavras do tema sempre primeiro
                    }
                    const diff = b.length - a.length;
                    return diff !== 0 ? diff : (Math.random() - 0.5);
                });

                const selected = [];
                const coveredCells = new Set();

                for (const w of pool) {
                    const path = allWordsMap.get(w);
                    const pathKeySet = new Set(path.map(([r, c]) => `${r},${c}`));
                    
                    let addsNew = false;
                    for (const k of pathKeySet) {
                        if (!coveredCells.has(k)) {
                            addsNew = true;
                            break;
                        }
                    }

                    if (addsNew || selected.length < actualTargetCount) {
                        selected.push(w);
                        for (const k of pathKeySet) coveredCells.add(k);
                        if (selected.length === actualTargetCount) break;
                    }
                }

                const minCoverageRatio = totalCells <= 16 ? 0.95 : (totalCells <= 36 ? 0.75 : 0.5);
                const isGoodCoverage = (coveredCells.size >= totalCells * minCoverageRatio) || (attempt > 60);

                if (selected.length === actualTargetCount && isGoodCoverage) {
                    const targets = selected.map((word, idx) => ({
                        id: idx,
                        word: word,
                        displayWord: this.displayMap[word] || word,
                        length: word.length,
                        path: allWordsMap.get(word),
                        found: false,
                        isTheme: hasTheme && themeSet.has(word)
                    }));

                    targets.sort((a, b) => a.length - b.length || a.displayWord.localeCompare(b.displayWord));
                    targets.forEach((t, i) => t.id = i);

                    return {
                        N,
                        M,
                        grid,
                        targets,
                        allWordsMap,
                        totalCells,
                        targetCount: actualTargetCount,
                        minLen: actualMinLen,
                        maxLen: actualMaxLen,
                        difficulty: validDiff,
                        theme: hasTheme ? theme : 'geral',
                        coveredCount: coveredCells.size
                    };
                }
            }
        }

        console.warn(`Fallback na geração para ${N}x${M} (${validDiff}, tema: ${theme})`);
        return null;
    }
}
