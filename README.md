# 🎮 Number Guessing Master (Python 3)

[![Python Version](https://img.shields.io/badge/Python-3.8%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Style](https://img.shields.io/badge/Code%20Style-PEP8-green.svg)](https://pep8.org/)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-Yes-emerald.svg)]()

An advanced, feature-rich terminal game built with modern Python. Combines probability, binary search optimization, smart mathematical clues, and persistent career statistics.

---

## 🌟 Key Features

### 1. Multiple Game Modes
- 🎯 **Classic Guessing**: 4 difficulty tiers from *Easy (1–50)* to *Nightmare (1–1000)* with limited attempts and dynamic range tracking.
- 🤖 **AI Mind Reader (Reverse Mode)**: Think of a number in your head — the AI uses optimal **Binary Search ($O(\log_2 N)$)** to guess it in 7 steps or fewer!
- ⚡ **Speed Blitz (Timed Challenge)**: 45-second rapid-fire countdown round.
- 📊 **Career Statistics & Leaderboard**: Automatically tracks games played, win rate, best streaks, and high scores in `stats.json`.

### 2. Intelligent Math Hint Engine
Type `h` anytime during a game to reveal mathematical clues:
- **Temperature Distance Radar**: Hot/Cold indicators (`🔥 BURNING HOT`, `♨️ WARM`, `❄️ COOL`, `🧊 FREEZING`) based on $|guess - secret|$.
- **Parity & Divisibility Clues**: Detects whether the secret is Even/Odd or divisible by 3, 5, 7, 10.
- **Prime Number Check**: Informs you if the target number is Prime or Composite.
- **Digit Sum**: Sum of the individual digits of the target number.

### 3. Clean Terminal UI
- Cross-platform ANSI colorization (Windows VT100, macOS, Linux).
- Status bars showing safe range boundaries and previous guesses.
- Graceful error handling (handles letters, symbols, and out-of-bounds input).

---

## 🚀 How to Run

### Requirements
- **Python 3.8+** (No external dependencies required — built with 100% standard library!)

### Run in Terminal
```bash
# Clone the repository
git clone https://github.com/plainaditya/Number-guessing-game.git

# Navigate into the folder
cd Number-guessing-game

# Run the game
python game.py
```

---

## 🧮 Mathematical Insight: The Binary Search Algorithm

In standard binary search, each comparison eliminates **half** of the remaining search space.

$$\text{Maximum Attempts} = \lceil \log_2(N) \rceil$$

For a range of **1 to 100**:
$$\log_2(100) \approx 6.64 \implies \text{Guaranteed in } 7 \text{ guesses or fewer!}$$

For a range of **1 to 1000**:
$$\log_2(1000) \approx 9.96 \implies \text{Guaranteed in } 10 \text{ guesses or fewer!}$$

Mode 2 (*AI Mind Reader*) demonstrates this exact mathematical principle interactively.

---

## 📂 Project Structure

```
Number-guessing-game/
├── game.py          # Main game engine, modes, hint engine, and CLI loop
├── stats.json       # Persistent player statistics (auto-generated on first win)
└── README.md        # Comprehensive documentation
```

---

## 👤 Author

**Aditya Singh**
- GitHub: [@plainaditya](https://github.com/plainaditya)
- Portfolio: [plainaditya-portfolio.vercel.app](https://plainaditya-portfolio.vercel.app)

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
