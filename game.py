import random

print("🎮 Number Guessing Game")
print("Guess a number between 1 and 100")

number = random.randint(1, 100)
attempts = 0

while True:
    try:
        guess = int(input("Enter your guess: "))
        attempts += 1
    except:
        print("❌ Please enter a valid number")
        continue

    if guess < number:
        print("📉 Too low!")
    elif guess > number:
        print("📈 Too high!")
    else:
        print(f"🎉 Correct! You guessed it in {attempts} attempts.")
        break
