/**
 * ==============================================================================
 * NUMBER GUESSING GAME — MINIMALIST CLIENT ENGINE
 * Author: Aditya Singh (github.com/plainaditya)
 * Clean, restrained, classic gameplay.
 * ==============================================================================
 */

(() => {
    // --------------------------------------------------------------------------
    // 1. Subtle Sound Synthesis (Web Audio API)
    // --------------------------------------------------------------------------
    let audioCtx = null;
    let soundOn = true;

    function getAudioCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function playTone(freq, type = 'sine', duration = 0.08, gain = 0.08) {
        if (!soundOn) return;
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            g.gain.setValueAtTime(gain, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (_) {}
    }

    const sound = {
        click: () => playTone(600, 'sine', 0.04, 0.05),
        higher: () => playTone(360, 'sine', 0.1, 0.08),
        lower: () => playTone(540, 'sine', 0.1, 0.08),
        win: () => {
            if (!soundOn) return;
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                setTimeout(() => playTone(f, 'sine', 0.22, 0.15), i * 90);
            });
        },
        lose: () => playTone(180, 'triangle', 0.25, 0.1)
    };

    // --------------------------------------------------------------------------
    // 2. Confetti Particle Canvas
    // --------------------------------------------------------------------------
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let confettiActive = false;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function triggerConfetti() {
        particles = [];
        const colors = ['#f1f3f7', '#8c93a3', '#10b981', '#3b82f6', '#f59e0b'];
        for (let i = 0; i < 90; i++) {
            particles.push({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.7) * 14,
                size: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 8,
                opacity: 1
            });
        }
        confettiActive = true;
        animateConfetti();
    }

    function animateConfetti() {
        if (!confettiActive) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let living = 0;
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.32;
            p.rotation += p.rotSpeed;
            p.opacity -= 0.009;

            if (p.opacity > 0) {
                living++;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
                ctx.restore();
            }
        });

        if (living > 0) requestAnimationFrame(animateConfetti);
        else {
            confettiActive = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    // --------------------------------------------------------------------------
    // 3. Game Data & Math Clues
    // --------------------------------------------------------------------------
    const CONFIGS = {
        easy: { min: 1, max: 50, attempts: 6 },
        medium: { min: 1, max: 100, attempts: 7 },
        hard: { min: 1, max: 200, attempts: 8 }
    };

    let diff = 'medium';
    let secret = 0;
    let attemptsLeft = 7;
    let maxAttempts = 7;
    let lowBound = 1;
    let highBound = 100;
    let originalMin = 1;
    let originalMax = 100;
    let guesses = [];
    let startTime = 0;

    function isPrime(n) {
        if (n < 2) return false;
        for (let i = 2; i <= Math.sqrt(n); i++) {
            if (n % i === 0) return false;
        }
        return true;
    }

    function generateClue(n) {
        const clues = [];
        clues.push(`The secret number is <strong>${n % 2 === 0 ? 'EVEN' : 'ODD'}</strong>.`);
        [3, 5, 10].forEach(d => {
            if (n % d === 0 && n !== d) clues.push(`The number is divisible by <strong>${d}</strong>.`);
        });
        clues.push(`The number is <strong>${isPrime(n) ? 'PRIME' : 'COMPOSITE'}</strong>.`);
        const sum = String(n).split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
        clues.push(`The sum of its digits equals <strong>${sum}</strong>.`);
        return clues[Math.floor(Math.random() * clues.length)];
    }

    // --------------------------------------------------------------------------
    // 4. DOM Elements
    // --------------------------------------------------------------------------
    const gameCard = document.getElementById('gameCard');
    const attemptsPills = document.getElementById('attemptsPills');
    const rangeBadge = document.getElementById('rangeBadge');
    const promptTitle = document.getElementById('promptTitle');
    const promptFeedback = document.getElementById('promptFeedback');
    const rangeMin = document.getElementById('rangeMin');
    const rangeMax = document.getElementById('rangeMax');
    const rangeFill = document.getElementById('rangeFill');
    const guessInput = document.getElementById('guessInput');
    const submitBtn = document.getElementById('submitBtn');
    const clueToggleBtn = document.getElementById('clueToggleBtn');
    const clueBox = document.getElementById('clueBox');
    const clueText = document.getElementById('clueText');
    const newRoundBtn = document.getElementById('newRoundBtn');
    const historyChips = document.getElementById('historyChips');

    // Header Sound Toggle
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const soundIcon = document.getElementById('soundIcon');
    soundToggleBtn.addEventListener('click', () => {
        soundOn = !soundOn;
        soundIcon.textContent = soundOn ? '🔊' : '🔇';
    });

    // Modal Elements
    const resultModal = document.getElementById('resultModal');
    const modalHeading = document.getElementById('modalHeading');
    const modalSub = document.getElementById('modalSub');
    const metricSecret = document.getElementById('metricSecret');
    const metricAttempts = document.getElementById('metricAttempts');
    const metricTime = document.getElementById('metricTime');
    const modalPlayAgainBtn = document.getElementById('modalPlayAgainBtn');

    // --------------------------------------------------------------------------
    // 5. Game Loop
    // --------------------------------------------------------------------------
    function renderAttemptPips() {
        attemptsPills.innerHTML = '';
        for (let i = 0; i < maxAttempts; i++) {
            const pip = document.createElement('div');
            pip.className = `attempt-pip ${i < attemptsLeft ? 'active' : 'used'}`;
            attemptsPills.appendChild(pip);
        }
    }

    function updateRangeBar() {
        rangeBadge.textContent = `${lowBound} – ${highBound}`;
        rangeMin.textContent = lowBound;
        rangeMax.textContent = highBound;

        const total = originalMax - originalMin;
        const leftPct = ((lowBound - originalMin) / total) * 100;
        const rightPct = ((originalMax - highBound) / total) * 100;

        rangeFill.style.left = `${leftPct}%`;
        rangeFill.style.right = `${rightPct}%`;
    }

    function initGame() {
        const conf = CONFIGS[diff];
        originalMin = conf.min;
        originalMax = conf.max;
        lowBound = conf.min;
        highBound = conf.max;
        maxAttempts = conf.attempts;
        attemptsLeft = conf.attempts;
        secret = Math.floor(Math.random() * (conf.max - conf.min + 1)) + conf.min;
        guesses = [];
        startTime = Date.now();

        promptTitle.textContent = 'Guess the number';
        promptFeedback.textContent = `Enter an integer between ${lowBound} and ${highBound}.`;
        promptFeedback.className = 'prompt-feedback';
        guessInput.value = '';
        guessInput.min = lowBound;
        guessInput.max = highBound;
        historyChips.innerHTML = '';
        clueBox.classList.remove('visible');
        resultModal.classList.remove('active');

        renderAttemptPips();
        updateRangeBar();
        guessInput.focus();
    }

    function handleGuess() {
        const val = parseInt(guessInput.value.trim(), 10);
        guessInput.value = '';

        if (isNaN(val) || val < originalMin || val > originalMax) {
            promptFeedback.textContent = `Enter a number between ${originalMin} and ${originalMax}.`;
            return;
        }

        if (guesses.includes(val)) {
            promptFeedback.textContent = `You already tried ${val}. Pick another number.`;
            return;
        }

        guesses.push(val);
        attemptsLeft--;
        renderAttemptPips();

        // Check Victory
        if (val === secret) {
            handleVictory();
            return;
        }

        // Card Micro-Shake
        gameCard.classList.remove('shake');
        void gameCard.offsetWidth;
        gameCard.classList.add('shake');

        // History Tile
        const tile = document.createElement('span');
        tile.className = `history-tile ${val > secret ? 'lower' : 'higher'}`;
        tile.innerHTML = `<span>${val}</span> <small>${val > secret ? '▼' : '▲'}</small>`;
        historyChips.appendChild(tile);

        if (val < secret) {
            sound.higher();
            lowBound = Math.max(lowBound, val + 1);
            promptTitle.textContent = `${val} is too low`;
            promptFeedback.textContent = 'Try a higher number.';
            promptFeedback.className = 'prompt-feedback higher';
        } else {
            sound.lower();
            highBound = Math.min(highBound, val - 1);
            promptTitle.textContent = `${val} is too high`;
            promptFeedback.textContent = 'Try a lower number.';
            promptFeedback.className = 'prompt-feedback lower';
        }

        updateRangeBar();

        if (attemptsLeft <= 0) {
            handleDefeat();
        } else {
            guessInput.focus();
        }
    }

    function handleVictory() {
        sound.win();
        triggerConfetti();
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const used = maxAttempts - attemptsLeft;

        modalHeading.textContent = 'Spot on!';
        modalSub.textContent = `You found the secret number with ${attemptsLeft} attempts remaining.`;
        metricSecret.textContent = secret;
        metricAttempts.textContent = `${used}/${maxAttempts}`;
        metricTime.textContent = `${duration}s`;
        resultModal.classList.add('active');
    }

    function handleDefeat() {
        sound.lose();
        modalHeading.textContent = 'Out of attempts';
        modalSub.textContent = `The correct number was ${secret}. Better luck on the next run!`;
        metricSecret.textContent = secret;
        metricAttempts.textContent = `${maxAttempts}/${maxAttempts}`;
        metricTime.textContent = '--';
        resultModal.classList.add('active');
    }

    // Submit actions
    submitBtn.addEventListener('click', () => {
        sound.click();
        handleGuess();
    });

    guessInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sound.click();
            handleGuess();
        }
    });

    // Clue Button
    clueToggleBtn.addEventListener('click', () => {
        sound.click();
        clueText.innerHTML = generateClue(secret);
        clueBox.classList.toggle('visible');
    });

    // Reset Buttons
    newRoundBtn.addEventListener('click', () => {
        sound.click();
        initGame();
    });

    modalPlayAgainBtn.addEventListener('click', () => {
        sound.click();
        initGame();
    });

    // Difficulty selection
    document.querySelectorAll('.diff-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            sound.click();
            document.querySelectorAll('.diff-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            diff = chip.dataset.diff;
            initGame();
        });
    });

    // Start on load
    initGame();
})();
