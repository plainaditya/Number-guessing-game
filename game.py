from __future__ import annotations

import random
from dataclasses import dataclass


MIN_NUMBER = 1
MAX_NUMBER = 100
MAX_ATTEMPTS = 7


@dataclass(frozen=True)
class GameConfig:
    min_number: int = MIN_NUMBER
    max_number: int = MAX_NUMBER
    max_attempts: int = MAX_ATTEMPTS


def print_banner() -> None:
    print("\n" + "=" * 48)
    print("🎮  NUMBER GUESSING GAME")
    print("=" * 48)
    print(f"Guess the secret number between {MIN_NUMBER} and {MAX_NUMBER}.")
    print(f"You have {MAX_ATTEMPTS} attempts. Good luck!\n")


def get_valid_guess(min_number: int, max_number: int) -> int:
    """Prompt the user until a valid guess is entered."""
    while True:
        raw = input(f"Enter your guess ({min_number}-{max_number}): ").strip()

        try:
            guess = int(raw)
        except ValueError:
            print("❌ Invalid input. Please enter a whole number.")
            continue

        if not (min_number <= guess <= max_number):
            print(f"⚠️ Please choose a number between {min_number} and {max_number}.")
            continue

        return guess


def choose_difficulty() -> GameConfig:
    """Let the player choose a difficulty level."""
    levels = {
        "1": (1, 50, 6),
        "2": (1, 100, 7),
        "3": (1, 200, 8),
    }

    print("Select difficulty:")
    print("  1) Easy   - 1 to 50   | 6 attempts")
    print("  2) Medium - 1 to 100  | 7 attempts")
    print("  3) Hard   - 1 to 200  | 8 attempts")

    while True:
        choice = input("Choose 1, 2, or 3: ").strip()
        if choice in levels:
            min_number, max_number, attempts = levels[choice]
            return GameConfig(min_number=min_number, max_number=max_number, max_attempts=attempts)
        print("❌ Invalid choice. Please select 1, 2, or 3.")


def play_round(config: GameConfig) -> bool:
    """Run one full round of the game."""
    secret_number = random.randint(config.min_number, config.max_number)
    attempts_left = config.max_attempts
    attempts_used = 0
    previous_guesses: list[int] = []

    print(f"\nI have chosen a number between {config.min_number} and {config.max_number}.")
    print(f"You get {config.max_attempts} attempts.\n")

    while attempts_left > 0:
        print(f"Attempts left: {attempts_left}")
        guess = get_valid_guess(config.min_number, config.max_number)
        attempts_used += 1
        attempts_left -= 1

        if guess in previous_guesses:
            print("ℹ️ You already tried that number.")
        previous_guesses.append(guess)

        if guess < secret_number:
            print("📉 Too low. Try a bigger number.\n")
        elif guess > secret_number:
            print("📈 Too high. Try a smaller number.\n")
        else:
            print(f"\n🎉 Correct! You guessed it in {attempts_used} attempt(s).")
            print(f"✅ Secret number: {secret_number}")
            return True

    print("\n💥 Game over.")
    print(f"The correct number was {secret_number}.")
    return False


def ask_play_again() -> bool:
    while True:
        answer = input("Play again? (y/n): ").strip().lower()
        if answer in {"y", "yes"}:
            return True
        if answer in {"n", "no"}:
            return False
        print("Please enter y or n.")


def main() -> None:
    print_banner()

    while True:
        config = choose_difficulty()
        play_round(config)

        if not ask_play_again():
            print("\nThanks for playing. See you next time! 👋")
            break


if __name__ == "__main__":
    main()
