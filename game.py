"""
================================================================================
🎮 NUMBER GUESSING MASTER (v2.0)
An advanced, feature-rich CLI guessing game with multiple modes,
smart mathematical hints, binary search AI, and persistent statistics.

Author: Aditya Singh (github.com/plainaditya)
License: MIT
================================================================================
"""

from __future__ import annotations

import json
import math
import os
import random
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path


# ==============================================================================
# Terminal Color & Styling Utilities (Pure Standard Library)
# ==============================================================================
# Enable virtual terminal processing on Windows for ANSI colors
if sys.platform == "win32":
    os.system("")


class Style:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    ITALIC = "\033[3m"
    UNDERLINE = "\033[4m"

    # Foreground Colors
    BLACK = "\033[30m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"

    # Backgrounds
    BG_BLUE = "\033[44m"
    BG_GREEN = "\033[42m"
    BG_RED = "\033[41m"


def clear_screen() -> None:
    """Clear terminal screen across Windows, macOS, and Linux."""
    os.system("cls" if os.name == "nt" else "clear")


def print_banner() -> None:
    """Display futuristic CLI header banner."""
    banner = f"""
{Style.CYAN}{Style.BOLD}╔══════════════════════════════════════════════════════════════════╗
║   🎮  N U M B E R   G U E S S I N G   M A S T E R   (v 2 . 0)    ║
║   Logic • Binary Search • Smart Hints • Persistent Stats        ║
╚══════════════════════════════════════════════════════════════════╝{Style.RESET}
"""
    print(banner)


# ==============================================================================
# Configurations & Data Models
# ==============================================================================
@dataclass(frozen=True)
class Difficulty:
    name: str
    min_num: int
    max_num: int
    attempts: int
    desc: str


DIFFICULTIES: dict[str, Difficulty] = {
    "1": Difficulty("Easy", 1, 50, 7, "Great for warmups (1-50)"),
    "2": Difficulty("Medium", 1, 100, 7, "Standard classic range (1-100)"),
    "3": Difficulty("Hard", 1, 250, 8, "Wider range, strategic guessing (1-250)"),
    "4": Difficulty("Nightmare", 1, 1000, 10, "Binary search masters only (1-1000)"),
}

STATS_FILE = Path(__file__).parent / "stats.json"


@dataclass
class PlayerStats:
    games_played: int = 0
    games_won: int = 0
    current_streak: int = 0
    best_streak: int = 0
    high_score: int = 0
    total_guesses: int = 0

    @classmethod
    def load(cls) -> PlayerStats:
        if STATS_FILE.exists():
            try:
                with open(STATS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return cls(**data)
            except Exception:
                pass
        return cls()

    def save(self) -> None:
        try:
            with open(STATS_FILE, "w", encoding="utf-8") as f:
                json.dump(asdict(self), f, indent=2)
        except Exception as e:
            print(f"{Style.RED}Warning: Could not save stats ({e}){Style.RESET}")

    def record_win(self, score: int, guesses: int) -> None:
        self.games_played += 1
        self.games_won += 1
        self.total_guesses += guesses
        self.current_streak += 1
        if self.current_streak > self.best_streak:
            self.best_streak = self.current_streak
        if score > self.high_score:
            self.high_score = score
        self.save()

    def record_loss(self, guesses: int) -> None:
        self.games_played += 1
        self.total_guesses += guesses
        self.current_streak = 0
        self.save()


# ==============================================================================
# Smart Mathematical Hint Generator
# ==============================================================================
class HintEngine:
    """Generates intelligent mathematical clues about the secret number."""

    @staticmethod
    def get_temperature(guess: int, secret: int) -> str:
        diff = abs(guess - secret)
        if diff == 0:
            return f"{Style.GREEN}🎯 BULLSEYE!{Style.RESET}"
        elif diff <= 3:
            return f"{Style.RED}{Style.BOLD}🔥 BURNING HOT! (Within 3 numbers){Style.RESET}"
        elif diff <= 8:
            return f"{Style.YELLOW}♨️  WARM! (Within 8 numbers){Style.RESET}"
        elif diff <= 20:
            return f"{Style.BLUE}❄️  COOL (Within 20 numbers){Style.RESET}"
        else:
            return f"{Style.MAGENTA}🧊 FREEZING (Very far away){Style.RESET}"

    @staticmethod
    def is_prime(n: int) -> bool:
        if n < 2:
            return False
        for i in range(2, int(math.isqrt(n)) + 1):
            if n % i == 0:
                return False
        return True

    @classmethod
    def generate_clue(cls, secret: int, hints_given: list[str]) -> str:
        clues: list[str] = []

        # Parity clue
        parity = "EVEN" if secret % 2 == 0 else "ODD"
        clues.append(f"The hidden number is {Style.BOLD}{parity}{Style.RESET}.")

        # Divisibility clues
        for divisor in [3, 5, 7, 10]:
            if secret % divisor == 0 and divisor != secret:
                clues.append(f"The number is cleanly divisible by {Style.BOLD}{divisor}{Style.RESET}.")

        # Prime clue
        if cls.is_prime(secret):
            clues.append(f"The hidden number is a {Style.BOLD}PRIME number{Style.RESET}!")
        else:
            clues.append(f"The hidden number is a {Style.BOLD}COMPOSITE number{Style.RESET}.")

        # Digit sum clue
        digit_sum = sum(int(d) for d in str(secret))
        clues.append(f"The sum of its digits equals {Style.BOLD}{digit_sum}{Style.RESET}.")

        # Range quadrant
        if secret > 50:
            clues.append(f"The number is in the {Style.BOLD}upper half{Style.RESET} of the scale.")
        else:
            clues.append(f"The number is in the {Style.BOLD}lower half{Style.RESET} of the scale.")

        # Return a fresh clue
        unused = [c for c in clues if c not in hints_given]
        if unused:
            chosen = random.choice(unused)
            hints_given.append(chosen)
            return chosen
        return f"The number is between {max(1, secret - 5)} and {secret + 5}."


# ==============================================================================
# Game Mode 1: Classic Mode
# ==============================================================================
def play_classic_mode(diff: Difficulty, stats: PlayerStats) -> None:
    clear_screen()
    print_banner()
    print(f"{Style.BOLD}MODE: CLASSIC GUESSING [{diff.name.upper()}]{Style.RESET}")
    print(f"I have picked a secret integer from {Style.CYAN}{diff.min_num}{Style.RESET} to {Style.CYAN}{diff.max_num}{Style.RESET}.")
    print(f"You have {Style.YELLOW}{diff.attempts} attempts{Style.RESET}. Type {Style.MAGENTA}'h'{Style.RESET} anytime for a mathematical clue.\n")

    secret = random.randint(diff.min_num, diff.max_num)
    attempts_left = diff.attempts
    attempts_used = 0
    low_bound = diff.min_num
    high_bound = diff.max_num
    previous_guesses: list[int] = []
    hints_used: list[str] = []
    start_time = time.time()

    while attempts_left > 0:
        # Status Bar
        print(f"{Style.DIM}──────────────────────────────────────────────────────────{Style.RESET}")
        print(f"❤️  Attempts Left: {Style.BOLD}{attempts_left}{Style.RESET} | 🎯 Safe Range: [{Style.CYAN}{low_bound}{Style.RESET} ... {Style.CYAN}{high_bound}{Style.RESET}]")
        if previous_guesses:
            history_str = ", ".join(str(g) for g in previous_guesses[-5:])
            print(f"📝 Recent: [{history_str}]")

        user_input = input(f"{Style.BOLD}Enter your guess ({low_bound}-{high_bound}) or 'h' for hint: {Style.RESET}").strip().lower()

        # Handle Hint Request
        if user_input in ("h", "hint"):
            clue = HintEngine.generate_clue(secret, hints_used)
            print(f"\n💡 {Style.YELLOW}{Style.BOLD}HINT:{Style.RESET} {clue}\n")
            continue

        # Validate Numerical Input
        try:
            guess = int(user_input)
        except ValueError:
            print(f"{Style.RED}❌ Please enter a valid whole number or 'h'.{Style.RESET}\n")
            continue

        if guess < diff.min_num or guess > diff.max_num:
            print(f"{Style.YELLOW}⚠️  Number out of bounds! Stay between {diff.min_num} and {diff.max_num}.{Style.RESET}\n")
            continue

        if guess in previous_guesses:
            print(f"{Style.MAGENTA}⚠️  You already tried {guess}! Choose a new number.{Style.RESET}\n")
            continue

        attempts_used += 1
        attempts_left -= 1
        previous_guesses.append(guess)

        # Check Win
        if guess == secret:
            elapsed = round(time.time() - start_time, 1)
            # Scoring: base + attempt bonus - hint penalty
            base_score = 100 * (diff.max_num // 50)
            bonus = attempts_left * 25
            hint_penalty = len(hints_used) * 15
            final_score = max(20, base_score + bonus - hint_penalty)

            print(f"\n{Style.GREEN}{Style.BOLD}══════════════════════════════════════════════════════════{Style.RESET}")
            print(f"{Style.GREEN}{Style.BOLD}🎉 VICTORY! You guessed the correct number: {secret}!{Style.RESET}")
            print(f"{Style.GREEN}{Style.BOLD}══════════════════════════════════════════════════════════{Style.RESET}")
            print(f"⏱️  Time Elapsed: {Style.CYAN}{elapsed}s{Style.RESET}")
            print(f"📊 Attempts Used: {Style.CYAN}{attempts_used} / {diff.attempts}{Style.RESET}")
            print(f"💡 Hints Used:    {Style.CYAN}{len(hints_used)}{Style.RESET}")
            print(f"⭐ Final Score:   {Style.YELLOW}{Style.BOLD}{final_score} PTS{Style.RESET}\n")

            stats.record_win(final_score, attempts_used)
            return

        # Distance Feedback
        temp = HintEngine.get_temperature(guess, secret)
        if guess < secret:
            low_bound = max(low_bound, guess + 1)
            print(f"📈 {Style.RED}TOO LOW!{Style.RESET} The secret is higher. | {temp}\n")
        else:
            high_bound = min(high_bound, guess - 1)
            print(f"📉 {Style.BLUE}TOO HIGH!{Style.RESET} The secret is lower. | {temp}\n")

    # Game Over
    print(f"\n{Style.RED}{Style.BOLD}💥 GAME OVER! You've run out of attempts.{Style.RESET}")
    print(f"The correct secret number was: {Style.YELLOW}{Style.BOLD}{secret}{Style.RESET}\n")
    stats.record_loss(attempts_used)


# ==============================================================================
# Game Mode 2: AI Mind Reader (Binary Search Demonstration)
# ==============================================================================
def play_ai_mind_reader() -> None:
    clear_screen()
    print_banner()
    print(f"{Style.BOLD}MODE: AI MIND READER (Binary Search Engine){Style.RESET}")
    print("Think of any secret integer between 1 and 100 in your head.")
    print("The computer will guess it using optimal Binary Search logic in <= 7 steps!\n")
    input(f"{Style.CYAN}Got your number ready? Press ENTER to start...{Style.RESET}")

    low = 1
    high = 100
    steps = 0

    while low <= high:
        steps += 1
        guess = (low + high) // 2
        print(f"\n{Style.DIM}──────────────────────────────────────────{Style.RESET}")
        print(f"Step {steps} | Current Search Space: [{low} ... {high}]")
        print(f"🤖 Computer Guesses: {Style.BOLD}{Style.CYAN}{guess}{Style.RESET}")
        print("Is your number:")
        print("  [c] Correct!")
        print("  [h] Higher than this guess")
        print("  [l] Lower than this guess")

        feedback = input(f"{Style.BOLD}Enter c, h, or l: {Style.RESET}").strip().lower()

        if feedback == "c":
            print(f"\n{Style.GREEN}{Style.BOLD}🎯 BINGO! The AI found your number ({guess}) in only {steps} steps!{Style.RESET}")
            print(f"{Style.CYAN}Mathematical insight:{Style.RESET} Binary Search cuts the search space in half with every step ($O(\\log_2 N)$).")
            print(f"For N=100, $\\log_2(100) \\approx 6.64$, meaning 7 steps is guaranteed mathematically!\n")
            return
        elif feedback == "h":
            low = guess + 1
        elif feedback == "l":
            high = guess - 1
        else:
            print(f"{Style.RED}Invalid input. Please enter 'c', 'h', or 'l'.{Style.RESET}")
            steps -= 1

    print(f"\n{Style.YELLOW}🤔 Hmm, something didn't add up! Check if your answers were consistent.{Style.RESET}\n")


# ==============================================================================
# Game Mode 3: Speed Blitz (Timed Countdown Mode)
# ==============================================================================
def play_blitz_mode(stats: PlayerStats) -> None:
    clear_screen()
    print_banner()
    print(f"{Style.BOLD}MODE: SPEED BLITZ (45-Second Challenge){Style.RESET}")
    print("Guess the secret number between 1 and 100 before the 45-second clock runs out!")
    print("Unlimited attempts, but speed is everything!\n")
    input(f"{Style.YELLOW}Press ENTER when ready to start the clock...{Style.RESET}")

    secret = random.randint(1, 100)
    time_limit = 45.0
    start_time = time.time()
    guesses = 0
    low = 1
    high = 100

    while True:
        elapsed = time.time() - start_time
        remaining = time_limit - elapsed

        if remaining <= 0:
            print(f"\n{Style.RED}{Style.BOLD}⏰ TIME'S UP! The clock ran out.{Style.RESET}")
            print(f"The secret number was: {Style.YELLOW}{secret}{Style.RESET}\n")
            stats.record_loss(guesses)
            return

        print(f"⏱️  Time Remaining: {Style.YELLOW}{remaining:.1f}s{Style.RESET} | Range: [{low}..{high}]")
        user_input = input(f"{Style.BOLD}Your guess: {Style.RESET}").strip()

        try:
            guess = int(user_input)
        except ValueError:
            print(f"{Style.RED}Enter a number!{Style.RESET}\n")
            continue

        guesses += 1
        if guess == secret:
            score = int(remaining * 20) + 100
            print(f"\n{Style.GREEN}{Style.BOLD}⚡ BLITZ CLEARED! Secret was {secret}!{Style.RESET}")
            print(f"Time Taken: {Style.CYAN}{elapsed:.1f}s{Style.RESET} | Guesses: {Style.CYAN}{guesses}{Style.RESET} | Score: {Style.YELLOW}{score} PTS{Style.RESET}\n")
            stats.record_win(score, guesses)
            return
        elif guess < secret:
            low = max(low, guess + 1)
            print(f"📈 Higher! ({HintEngine.get_temperature(guess, secret)})\n")
        else:
            high = min(high, guess - 1)
            print(f"📉 Lower! ({HintEngine.get_temperature(guess, secret)})\n")


# ==============================================================================
# Leaderboard & Statistics Viewer
# ==============================================================================
def display_statistics(stats: PlayerStats) -> None:
    clear_screen()
    print_banner()
    win_rate = (stats.games_won / stats.games_played * 100) if stats.games_played > 0 else 0.0
    avg_guesses = (stats.total_guesses / stats.games_played) if stats.games_played > 0 else 0.0

    print(f"{Style.BOLD}🏆 PLAYER CAREER STATISTICS{Style.RESET}")
    print(f"{Style.DIM}──────────────────────────────────────────{Style.RESET}")
    print(f"  🎮 Games Played:       {Style.CYAN}{stats.games_played}{Style.RESET}")
    print(f"  ✅ Games Won:          {Style.GREEN}{stats.games_won}{Style.RESET}")
    print(f"  📊 Win Rate:           {Style.YELLOW}{win_rate:.1f}%{Style.RESET}")
    print(f"  🔥 Current Streak:     {Style.MAGENTA}{stats.current_streak} wins{Style.RESET}")
    print(f"  👑 Best Streak:        {Style.MAGENTA}{stats.best_streak} wins{Style.RESET}")
    print(f"  ⭐ All-Time High Score:{Style.YELLOW}{Style.BOLD}{stats.high_score} PTS{Style.RESET}")
    print(f"  🎯 Avg Guesses/Game:   {Style.CYAN}{avg_guesses:.1f}{Style.RESET}")
    print(f"{Style.DIM}──────────────────────────────────────────{Style.RESET}\n")
    input("Press ENTER to return to menu...")


# ==============================================================================
# Main Menu Flow
# ==============================================================================
def main() -> None:
    stats = PlayerStats.load()

    while True:
        clear_screen()
        print_banner()
        print(f"{Style.BOLD}SELECT GAME MODE:{Style.RESET}")
        print(f"  {Style.CYAN}[1]{Style.RESET} Classic Guessing (Choose Difficulty)")
        print(f"  {Style.CYAN}[2]{Style.RESET} AI Mind Reader (Binary Search Algorithm)")
        print(f"  {Style.CYAN}[3]{Style.RESET} Speed Blitz (45-Second Timed Rush)")
        print(f"  {Style.CYAN}[4]{Style.RESET} View Career Statistics & High Scores")
        print(f"  {Style.CYAN}[5]{Style.RESET} Exit Game")
        print(f"{Style.DIM}──────────────────────────────────────────────────────────{Style.RESET}")

        choice = input(f"{Style.BOLD}Enter choice (1-5): {Style.RESET}").strip()

        if choice == "1":
            print("\nSelect Difficulty:")
            for k, d in DIFFICULTIES.items():
                print(f"  [{k}] {d.name:<10} | Range: {d.min_num}..{d.max_num:<4} | Attempts: {d.attempts} ({d.desc})")
            diff_choice = input("Choice (1-4): ").strip()
            diff = DIFFICULTIES.get(diff_choice, DIFFICULTIES["2"])
            play_classic_mode(diff, stats)
            input("Press ENTER to continue...")

        elif choice == "2":
            play_ai_mind_reader()
            input("Press ENTER to continue...")

        elif choice == "3":
            play_blitz_mode(stats)
            input("Press ENTER to continue...")

        elif choice == "4":
            display_statistics(stats)

        elif choice == "5":
            print(f"\n{Style.GREEN}Thanks for playing Number Guessing Master! Keep building & coding! 👋{Style.RESET}\n")
            break
        else:
            print(f"{Style.RED}Invalid option. Please choose 1 to 5.{Style.RESET}")
            time.sleep(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Style.YELLOW}Session ended. See you next time!{Style.RESET}")
