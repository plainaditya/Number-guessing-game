from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import datetime


MIN_NUMBER = 1
MAX_NUMBER = 100
DEFAULT_ATTEMPTS = 7


@dataclass(frozen=True)
class GameConfig:
    name: str
    min_number: int
    max_number: int
    attempts: int


DIFFICULTIES = {
    "1": GameConfig(name="Easy", min_number=1, max_number=50, attempts=6),
    "2": GameConfig(name="Medium", min_number=1, max_number=100, attempts=7),
    "3": GameConfig(name="Hard", min_number=1, max_number=200, attempts=8),
}


def clear_spacing() -> None:
    print("\n" + "─" * 52)


def print_header() -> None:
    clear_spacing()
    print("🎮  NUMBER GUESSING GAME")
    print("─" * 52)
    print("Guess the hidden number with smart hints and limited attempts.")
    print("Clean UI. Better flow. Professional terminal experience.")
    clear_spacing()


def select_difficulty() -> GameConfig:
    print("Choose a difficulty:")
    for key, config in DIFFICULTIES.items():
        print(f"  {key}) {config.name:<6} | {config.min_number} to {config.max_number} | {config.attempts} attempts")

    while True:
        choice = input("Enter 1, 2, or 3: ").strip()
        if choice in DIFFICULTIES:
            selected = DIFFICULTIES[choice]
            print(f"\nSelected: {selected.name}\n")
            return selected
        print("❌ Invalid choice. Please select 1, 2, or 3.")


def get_valid_guess(min_number: int, max_number: int) -> int:
    while True:
        raw = input(f"Your guess ({min_number}-{max_number}): ").strip()

        try:
            guess = int(raw)
        except ValueError:
            print("❌ Enter a whole number only.")
            continue

        if guess < min_number or guess > max_number:
            print(f"⚠️ Stay within {min_number} and {max_number}.")
            continue

        return guess


def score_round(attempts_used: int, max_attempts: int) -> int:
    base = 100
    penalty = 12 * (attempts_used - 1)
    bonus = max(0, 8 * (max_attempts - attempts_used))
    return max(10, base - penalty + bonus)


def play_round(config: GameConfig) -> bool:
    secret_number = random.randint(config.min_number, config.max_number)
    previous_guesses: list[int] = []
    attempts_left = config.attempts
    attempts_used = 0
    lower_bound = config.min_number
    upper_bound = config.max_number
    started_at = datetime.now()

    print(f"I picked a number between {config.min_number} and {config.max_number}.")
    print(f"You have {config.attempts} attempts. Good luck.")
    print("Hint: Every guess narrows the range.\n")

    while attempts_left > 0:
        print(f"Attempts left: {attempts_left}")
        print(f"Current safe range: {lower_bound} to {upper_bound}")
        guess = get_valid_guess(config.min_number, config.max_number)
        attempts_used += 1
        attempts_left -= 1

        if guess in previous_guesses:
            print("ℹ️ You already tried that number.")
        previous_guesses.append(guess)

        if guess < secret_number:
            lower_bound = max(lower_bound, guess + 1)
            print("📉 Too low.")
        elif guess > secret_number:
            upper_bound = min(upper_bound, guess - 1)
            print("📈 Too high.")
        else:
            elapsed = (datetime.now() - started_at).total_seconds()
            score = score_round(attempts_used, config.attempts)
            print("\n🎉 Correct.")
            print(f"✅ Number: {secret_number}")
            print(f"🏆 Attempts: {attempts_used}/{config.attempts}")
            print(f"⭐ Score: {score}")
            print(f"⏱️ Time: {elapsed:.1f} seconds")
            return True

        print()

    print("💥 No attempts left.")
    print(f"The correct number was: {secret_number}")
    return False


def ask_play_again() -> bool:
    while True:
        answer = input("Play again? (y/n): ").strip().lower()
        if answer in {"y", "yes"}:
            return True
        if answer in {"n", "no"}:
            return False
        print("Please type y or n.")


def main() -> None:
    print_header()

    while True:
        config = select_difficulty()
        play_round(config)

        if not ask_play_again():
            print("\nThanks for playing. Come back for a better score next time. 👋")
            break


if __name__ == "__main__":
    main()
