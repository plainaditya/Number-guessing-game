/**
 * ==============================================================================
 * NUMBER GUESSING MASTER (WEB ARCADE) - CLIENT GAME ENGINE
 * Author: Aditya Singh (github.com/plainaditya)
 * Features: Multi-mode, Web Audio SFX, Confetti, Mathematical Hints, Persistent Stats
 * ==============================================================================
 */

(() => {
    // --------------------------------------------------------------------------
    // 1. Web Audio Synthesizer (Zero External Dependencies)
    // --------------------------------------------------------------------------
    let audioCtx = null;
    let soundEnabled = true;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playTone(freq, type = 'sine', duration = 0.1, gain = 0.15) {
        if (!soundEnabled) return;
        try {
            initAudio();
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            g.gain.setValueAtTime(gain, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            osc.connect(g);
            g.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (_) {}
    }

    const soundEffects = {
        click: () => playTone(580, 'sine', 0.05, 0.08),
        correct: () => {
            if (!soundEnabled) return;
            initAudio();
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
                setTimeout(() => playTone(freq, 'triangle', 0.25, 0.2), idx * 80);
            });
        },
        high: () => {
            playTone(660, 'sawtooth', 0.08, 0.08);
            setTimeout(() => playTone(440, 'sawtooth', 0.12, 0.08), 70);
        },
        low: () => {
            playTone(330, 'sawtooth', 0.08, 0.08);
            setTimeout(() => playTone(550, 'sawtooth', 0.12, 0.08), 70);
        },
        error: () => playTone(160, 'square', 0.2, 0.12),
        hint: () => {
            playTone(880, 'sine', 0.1, 0.1);
            setTimeout(() => playTone(1174, 'sine', 0.15, 0.1), 90);
        }
    };

    // --------------------------------------------------------------------------
    // 2. Confetti Particle Engine
    // --------------------------------------------------------------------------
    const confettiCanvas = document.getElementById('confettiCanvas');
    const ctx = confettiCanvas.getContext('2d');
    let particles = [];
    let confettiActive = false;

    function resizeCanvas() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function triggerConfetti() {
        particles = [];
        const colors = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#a855f7'];
        for (let i = 0; i < 120; i++) {
            particles.push({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.7) * 16,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }
        confettiActive = true;
        animateConfetti();
    }

    function animateConfetti() {
        if (!confettiActive) return;
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        let living = 0;
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.35; // gravity
            p.rotation += p.rotSpeed;
            p.opacity -= 0.008;

            if (p.opacity > 0) {
                living++;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            }
        });

        if (living > 0) {
            requestAnimationFrame(animateConfetti);
        } else {
            confettiActive = false;
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }

    // --------------------------------------------------------------------------
    // 3. Mathematical Clue Engine
    // --------------------------------------------------------------------------
    function isPrime(num) {
        if (num < 2) return false;
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) return false;
        }
        return true;
    }

    function getClue(secret, usedClues) {
        const pool = [];
        const isEven = secret % 2 === 0;
        pool.push(`The secret number is <strong>${isEven ? 'EVEN' : 'ODD'}</strong>.`);

        [3, 5, 7, 10].forEach(d => {
            if (secret % d === 0 && secret !== d) {
                pool.push(`The secret number is cleanly divisible by <strong>${d}</strong>.`);
            }
        });

        pool.push(`The secret number is <strong>${isPrime(secret) ? 'PRIME' : 'COMPOSITE'}</strong>.`);

        const digitSum = String(secret).split('').reduce((sum, d) => sum + parseInt(d, 10), 0);
        pool.push(`The sum of the number's digits is <strong>${digitSum}</strong>.`);

        const fresh = pool.filter(c => !usedClues.includes(c));
        if (fresh.length > 0) {
            const picked = fresh[Math.floor(Math.random() * fresh.length)];
            usedClues.push(picked);
            return picked;
        }
        return `The secret number is within ±5 of ${secret + (Math.random() > 0.5 ? 2 : -2)}.`;
    }

    function getTemperature(guess, secret) {
        const diff = Math.abs(guess - secret);
        if (diff === 0) return '🎯 BULLSEYE!';
        if (diff <= 3) return '🔥 BURNING HOT! (Within 3 numbers)';
        if (diff <= 8) return '♨️ WARM! (Within 8 numbers)';
        if (diff <= 20) return '❄️ COOL (Within 20 numbers)';
        return '🧊 FREEZING (Very far away)';
    }

    // --------------------------------------------------------------------------
    // 4. Game Configuration & State
    // --------------------------------------------------------------------------
    const DIFFICULTIES = {
        easy: { min: 1, max: 50, attempts: 7 },
        medium: { min: 1, max: 100, attempts: 7 },
        hard: { min: 1, max: 250, attempts: 8 },
        nightmare: { min: 1, max: 1000, attempts: 10 }
    };

    let currentMode = 'classic'; // 'classic' | 'ai' | 'blitz'
    let currentDiff = 'medium';
    let secret = 0;
    let attemptsLeft = 7;
    let maxAttempts = 7;
    let lowBound = 1;
    let highBound = 100;
    let originalMin = 1;
    let originalMax = 100;
    let previousGuesses = [];
    let usedClues = [];
    let startTime = null;

    // AI Mode State
    let aiLow = 1;
    let aiHigh = 100;
    let aiGuess = 50;
    let aiStep = 0;

    // Blitz Mode State
    let blitzTimer = null;
    let blitzSecondsRemaining = 45;
    let blitzGuesses = 0;

    // Persistent Stats
    let stats = {
        played: 0,
        won: 0,
        streak: 0,
        bestStreak: 0,
        highScore: 0
    };

    function loadStats() {
        const saved = localStorage.getItem('number_guesser_stats');
        if (saved) {
            try { stats = JSON.parse(saved); } catch (_) {}
        }
    }

    function saveStats() {
        localStorage.setItem('number_guesser_stats', JSON.stringify(stats));
    }

    loadStats();

    // --------------------------------------------------------------------------
    // 5. DOM References
    // --------------------------------------------------------------------------
    const gameCard = document.getElementById('gameCard');
    const classicView = document.getElementById('classicView');
    const aiView = document.getElementById('aiView');
    const blitzView = document.getElementById('blitzView');

    const feedbackHeadline = document.getElementById('feedbackHeadline');
    const feedbackTemp = document.getElementById('feedbackTemp');
    const attemptsCountEl = document.getElementById('attemptsCount');
    const heartsContainer = document.getElementById('heartsContainer');
    const rangeCapsule = document.getElementById('rangeCapsule');
    const rangeMinLabel = document.getElementById('rangeMinLabel');
    const rangeMaxLabel = document.getElementById('rangeMaxLabel');
    const rangeFill = document.getElementById('rangeFill');
    const guessInput = document.getElementById('guessInput');
    const guessBtn = document.getElementById('guessBtn');
    const hintBtn = document.getElementById('hintBtn');
    const hintBox = document.getElementById('hintBox');
    const hintText = document.getElementById('hintText');
    const guessPillsWrap = document.getElementById('guessPillsWrap');
    const resetBtn = document.getElementById('resetBtn');

    // AI View Elements
    const aiStepEl = document.getElementById('aiStep');
    const aiGuessNumEl = document.getElementById('aiGuessNum');
    const aiHigherBtn = document.getElementById('aiHigherBtn');
    const aiLowerBtn = document.getElementById('aiLowerBtn');
    const aiCorrectBtn = document.getElementById('aiCorrectBtn');
    const aiResetBtn = document.getElementById('aiResetBtn');

    // Blitz View Elements
    const blitzTimerFill = document.getElementById('blitzTimerFill');
    const blitzSecondsEl = document.getElementById('blitzSeconds');

    // Modal Elements
    const endModal = document.getElementById('endModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    const modalScoreEl = document.getElementById('modalScore');
    const modalAttemptsEl = document.getElementById('modalAttempts');
    const modalTimeEl = document.getElementById('modalTime');
    const playAgainBtn = document.getElementById('playAgainBtn');

    // Header sound toggle
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const soundIcon = document.getElementById('soundIcon');
    soundToggleBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    });

    // --------------------------------------------------------------------------
    // 6. Classic Mode Engine
    // --------------------------------------------------------------------------
    function renderHearts() {
        heartsContainer.innerHTML = '';
        for (let i = 0; i < maxAttempts; i++) {
            const span = document.createElement('span');
            span.textContent = i < attemptsLeft ? '❤️' : '🖤';
            heartsContainer.appendChild(span);
        }
    }

    function updateRangeTrack() {
        rangeCapsule.textContent = `${lowBound} - ${highBound}`;
        rangeMinLabel.textContent = lowBound;
        rangeMaxLabel.textContent = highBound;

        const totalSpan = originalMax - originalMin;
        const leftPct = ((lowBound - originalMin) / totalSpan) * 100;
        const rightPct = ((originalMax - highBound) / totalSpan) * 100;

        rangeFill.style.left = `${leftPct}%`;
        rangeFill.style.right = `${rightPct}%`;
    }

    function initClassicGame() {
        const conf = DIFFICULTIES[currentDiff];
        originalMin = conf.min;
        originalMax = conf.max;
        lowBound = conf.min;
        highBound = conf.max;
        maxAttempts = conf.attempts;
        attemptsLeft = conf.attempts;
        secret = Math.floor(Math.random() * (conf.max - conf.min + 1)) + conf.min;
        previousGuesses = [];
        usedClues = [];
        startTime = Date.now();

        feedbackHeadline.textContent = `Pick a number between ${lowBound} & ${highBound}`;
        feedbackHeadline.style.color = 'var(--text-main)';
        feedbackTemp.textContent = 'Smart hints and distance radar active.';
        attemptsCountEl.textContent = `${attemptsLeft} / ${maxAttempts}`;
        guessInput.value = '';
        guessInput.min = lowBound;
        guessInput.max = highBound;
        guessInput.placeholder = `${lowBound} - ${highBound}`;
        guessPillsWrap.innerHTML = '';
        hintBox.classList.remove('visible');
        renderHearts();
        updateRangeTrack();
        guessInput.focus();
    }

    function handleGuess() {
        const val = parseInt(guessInput.value.trim(), 10);
        guessInput.value = '';

        if (isNaN(val)) {
            soundEffects.error();
            feedbackHeadline.textContent = 'Enter a valid number!';
            feedbackHeadline.style.color = 'var(--rose)';
            return;
        }

        if (val < originalMin || val > originalMax) {
            soundEffects.error();
            feedbackHeadline.textContent = `Out of bounds! Stay between ${originalMin} and ${originalMax}.`;
            feedbackHeadline.style.color = 'var(--amber)';
            return;
        }

        if (previousGuesses.includes(val)) {
            soundEffects.error();
            feedbackHeadline.textContent = `You already guessed ${val}!`;
            feedbackHeadline.style.color = 'var(--violet)';
            return;
        }

        previousGuesses.push(val);
        attemptsLeft--;
        attemptsCountEl.textContent = `${attemptsLeft} / ${maxAttempts}`;
        renderHearts();

        // Check Win
        if (val === secret) {
            handleVictory();
            return;
        }

        // Pill Tag
        const pill = document.createElement('span');
        pill.className = `guess-pill ${val > secret ? 'too-high' : 'too-low'}`;
        pill.textContent = `${val} (${val > secret ? '↓' : '↑'})`;
        guessPillsWrap.appendChild(pill);

        // Shake Card on wrong guess
        gameCard.classList.remove('shake');
        void gameCard.offsetWidth; // retrigger reflow
        gameCard.classList.add('shake');

        if (val < secret) {
            soundEffects.low();
            lowBound = Math.max(lowBound, val + 1);
            feedbackHeadline.textContent = `📈 ${val} is TOO LOW!`;
            feedbackHeadline.style.color = 'var(--rose)';
        } else {
            soundEffects.high();
            highBound = Math.min(highBound, val - 1);
            feedbackHeadline.textContent = `📉 ${val} is TOO HIGH!`;
            feedbackHeadline.style.color = 'var(--cyan)';
        }

        feedbackTemp.textContent = getTemperature(val, secret);
        updateRangeTrack();

        // Check Defeat
        if (attemptsLeft <= 0) {
            handleDefeat();
        } else {
            guessInput.focus();
        }
    }

    function handleVictory() {
        soundEffects.correct();
        triggerConfetti();

        const timeSec = ((Date.now() - startTime) / 1000).toFixed(1);
        const attemptsUsed = maxAttempts - attemptsLeft;
        const score = Math.max(20, (maxAttempts * 20) + (attemptsLeft * 30) - (usedClues.length * 15));

        stats.played++;
        stats.won++;
        stats.streak++;
        if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
        if (score > stats.highScore) stats.highScore = score;
        saveStats();

        modalIcon.textContent = '🎉';
        modalTitle.textContent = 'VICTORY!';
        modalSubtitle.textContent = `You successfully found the secret number ${secret}!`;
        modalScoreEl.textContent = `${score} PTS`;
        modalAttemptsEl.textContent = `${attemptsUsed} / ${maxAttempts}`;
        modalTimeEl.textContent = `${timeSec}s`;
        endModal.classList.add('active');
    }

    function handleDefeat() {
        soundEffects.error();
        stats.played++;
        stats.streak = 0;
        saveStats();

        modalIcon.textContent = '💥';
        modalTitle.textContent = 'GAME OVER';
        modalSubtitle.textContent = `Out of attempts! The secret number was ${secret}.`;
        modalScoreEl.textContent = `0 PTS`;
        modalAttemptsEl.textContent = `${maxAttempts} / ${maxAttempts}`;
        modalTimeEl.textContent = '--';
        endModal.classList.add('active');
    }

    // Submit actions
    guessBtn.addEventListener('click', () => {
        soundEffects.click();
        handleGuess();
    });

    guessInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleGuess();
        }
    });

    hintBtn.addEventListener('click', () => {
        soundEffects.hint();
        const clue = getClue(secret, usedClues);
        hintText.innerHTML = clue;
        hintBox.classList.add('visible');
    });

    resetBtn.addEventListener('click', () => {
        soundEffects.click();
        initClassicGame();
    });

    playAgainBtn.addEventListener('click', () => {
        soundEffects.click();
        endModal.classList.remove('active');
        if (currentMode === 'classic') initClassicGame();
        else if (currentMode === 'blitz') initBlitzGame();
        else initAiGame();
    });

    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            soundEffects.click();
            document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDiff = btn.dataset.diff;
            initClassicGame();
        });
    });

    // --------------------------------------------------------------------------
    // 7. Mode 2: AI Mind Reader (Binary Search Logic)
    // --------------------------------------------------------------------------
    function initAiGame() {
        aiLow = 1;
        aiHigh = 100;
        aiStep = 1;
        aiGuess = Math.floor((aiLow + aiHigh) / 2);
        aiStepEl.textContent = `Step 1 • Binary Search Space: [1 ... 100]`;
        aiGuessNumEl.textContent = aiGuess;
    }

    function updateAiGuess() {
        aiStep++;
        aiGuess = Math.floor((aiLow + aiHigh) / 2);
        aiStepEl.textContent = `Step ${aiStep} • Search Space: [${aiLow} ... ${aiHigh}]`;
        aiGuessNumEl.textContent = aiGuess;
    }

    aiHigherBtn.addEventListener('click', () => {
        soundEffects.click();
        aiLow = aiGuess + 1;
        if (aiLow > aiHigh) {
            alert('Wait, something is inconsistent! Double check your answers!');
            initAiGame();
            return;
        }
        updateAiGuess();
    });

    aiLowerBtn.addEventListener('click', () => {
        soundEffects.click();
        aiHigh = aiGuess - 1;
        if (aiLow > aiHigh) {
            alert('Wait, something is inconsistent! Double check your answers!');
            initAiGame();
            return;
        }
        updateAiGuess();
    });

    aiCorrectBtn.addEventListener('click', () => {
        soundEffects.correct();
        triggerConfetti();
        modalIcon.textContent = '🤖';
        modalTitle.textContent = 'AI GUESSED IT!';
        modalSubtitle.textContent = `The AI found your number (${aiGuess}) in only ${aiStep} steps using Binary Search!`;
        modalScoreEl.textContent = '100 PTS';
        modalAttemptsEl.textContent = `${aiStep} steps`;
        modalTimeEl.textContent = 'O(log N)';
        endModal.classList.add('active');
    });

    aiResetBtn.addEventListener('click', () => {
        soundEffects.click();
        initAiGame();
    });

    // --------------------------------------------------------------------------
    // 8. Mode 3: Speed Blitz
    // --------------------------------------------------------------------------
    function initBlitzGame() {
        clearInterval(blitzTimer);
        blitzSecondsRemaining = 45;
        blitzGuesses = 0;
        currentDiff = 'medium';
        initClassicGame();

        blitzSecondsEl.textContent = `${blitzSecondsRemaining}s`;
        blitzTimerFill.style.width = '100%';

        blitzTimer = setInterval(() => {
            blitzSecondsRemaining--;
            blitzSecondsEl.textContent = `${blitzSecondsRemaining}s`;
            const pct = (blitzSecondsRemaining / 45) * 100;
            blitzTimerFill.style.width = `${Math.max(0, pct)}%`;

            if (blitzSecondsRemaining <= 0) {
                clearInterval(blitzTimer);
                handleDefeat();
            }
        }, 1000);
    }

    // --------------------------------------------------------------------------
    // 9. Mode Switcher
    // --------------------------------------------------------------------------
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            soundEffects.click();
            document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentMode = tab.dataset.mode;

            clearInterval(blitzTimer);
            endModal.classList.remove('active');

            if (currentMode === 'classic') {
                classicView.style.display = 'block';
                aiView.style.display = 'none';
                blitzView.style.display = 'none';
                initClassicGame();
            } else if (currentMode === 'ai') {
                classicView.style.display = 'none';
                aiView.style.display = 'block';
                blitzView.style.display = 'none';
                initAiGame();
            } else if (currentMode === 'blitz') {
                classicView.style.display = 'block';
                aiView.style.display = 'none';
                blitzView.style.display = 'block';
                initBlitzGame();
            }
        });
    });

    // Start on load
    initClassicGame();
})();
