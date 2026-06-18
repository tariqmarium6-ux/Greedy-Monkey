# Greedy Monkey 🍌

A colorful, playful, and fast-paced 2D vertical endless climber game built for the browser. Help the monkey climb the jungle vines, dodge obstacles, collect bananas, and win the ultimate Banana Tree Trophy!

---

## 🎨 Game Theme & Vibes
*   **Childish Aesthetics**: Bubblegum pink, sunny yellow, and cocoa brown color scheme with bouncy cartoon animations.
*   **Character Skins**: Customize your monkey with 5 unique vector skins:
    *   🐒 **Classic**: The original brown monkey with pink blushing cheeks.
    *   🤖 **Cyber**: Futuristic grey skin with glowing neon cyan visor and cybernetic details.
    *   👑 **Golden**: Golden skin wearing a gem-studded crown and sparkling aura.
    *   🥷 **Ninja**: Stealth black outfit with a red headband wiggling in the wind.
    *   🚀 **Astro**: Astronaut suit with a glass bubble helmet reflection.
*   **Retro Chiptunes**: Synthesized sound effects (jump boings, banana chimes, crash noises) and a happy chiptune background melody generated procedurally in the browser via the **Web Audio API**.

---

## ⚙️ Tech Stack & Databases

### Frontend
*   **HTML5 Canvas**: Procedural vector path drawings for characters, obstacles, and scrolling vines.
*   **Vanilla CSS**: Playful menus, custom buttons, glassmorphic HUD overlays, and responsive mobile-optimized layouts.
*   **JavaScript (ES6+)**: Game loops (`requestAnimationFrame`), physics engine, collision algorithms, and particle bursts.

### Backend & Databases (SQL)
The game runs a **Node.js/Express** backend utilizing **dual SQLite databases**:
1.  📁 **Global Leaderboard (`global.db`)**: Stores names and scores globally to list the Top 5 players overall.
2.  📁 **Personal History (`personal.db`)**: Tracks every game played on your local machine to calculate self-competition metrics:
    *   Detects if you achieved a new Personal Best.
    *   Compares your current run against your average score.
    *   Tallies how many of your past runs you beat.

---

## 🎮 How to Play

### Controls
*   **Keyboard**:
    *   Move Left: `Left Arrow` / `A`
    *   Move Right: `Right Arrow` / `D`
    *   Jump: `Spacebar` / `Up Arrow` / `W`
*   **Touch / Mouse**:
    *   Tap Left 40% of screen to switch lanes left.
    *   Tap Right 40% of screen to switch lanes right.
    *   Tap Center 20% to jump.

### Rules
*   Collect **10 bananas** to win the game and receive your trophy!
*   If you hit an obstacle (Spiders 🕷️, Coconuts 🥥, Thorny Branches 🌵) and have bananas, you drop 1 banana as a shield.
*   If you hit an obstacle with **0 bananas**, the monkey falls down (**Game Over**).

---

## 🚀 Getting Started (Running Locally)

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation & Launch
1.  Clone the repository and navigate to the project directory:
    ```bash
    cd Greedy-Monkey
    ```
2.  Install the backend dependencies:
    ```bash
    npm install
    ```
3.  Start the Express server:
    ```bash
    npm start
    ```
4.  Open your browser and play at:
    **[http://localhost:8000](http://localhost:8000)**
