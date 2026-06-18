class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game Dimensions
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Game State
        this.State = { MENU: 0, PLAYING: 1, GAMEOVER: 2, VICTORY: 3 };
        this.currentState = this.State.MENU;

        // Core Objects
        this.player = new Monkey(this.width, this.height);
        this.entities = [];
        this.particles = [];

        // Mechanics
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('greedy_monkey_high_score')) || 0;
        this.baseScrollSpeed = 4;
        this.scrollSpeed = this.baseScrollSpeed;
        this.backgroundOffset = 0;
        
        // Spawn timers
        this.spawnTimer = 0;
        this.spawnInterval = 90; // Spawn entity every 90 frames (1.5 seconds)

        // UI elements
        this.startMenu = document.getElementById('start-menu');
        this.gameOverScreen = document.getElementById('game-over');
        this.victoryMenu = document.getElementById('victory-menu');
        this.hud = document.getElementById('hud');
        this.scoreVal = document.getElementById('score-val');
        this.bananaProgress = document.getElementById('banana-progress');
        this.bananaCountHud = document.getElementById('banana-count-hud');

        // Load username
        const usernameInput = document.getElementById('username-input');
        if (usernameInput) {
            usernameInput.value = localStorage.getItem('greedy_monkey_username') || 'ClimberMonkey';
        }
        
        this.setupEventListeners();
        this.resetGame();
    }

    resetGame() {
        this.player = new Monkey(this.width, this.height);
        this.entities = [];
        this.particles = [];
        this.score = 0;
        this.scrollSpeed = this.baseScrollSpeed;
        this.spawnTimer = 0;
        this.backgroundOffset = 0;
        this.updateHUD();
    }

    start() {
        this.currentState = this.State.PLAYING;
        this.startMenu.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.victoryMenu.classList.add('hidden');
        this.hud.classList.remove('hidden');
        this.resetGame();
        gameAudio.playBgm();
        this.tick();
    }

    victory() {
        this.currentState = this.State.VICTORY;
        this.hud.classList.add('hidden');
        this.victoryMenu.classList.remove('hidden');

        // Play victory melody chimes
        gameAudio.stopBgm();
        gameAudio.playCollect();
        setTimeout(() => gameAudio.playCollect(), 150);
        setTimeout(() => gameAudio.playCollect(), 300);

        this.drawTrophyTree();
        this.submitScoreAndFetchBoards(this.score);
    }

    gameOver() {
        this.currentState = this.State.GAMEOVER;
        this.hud.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');

        // Save local high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('greedy_monkey_high_score', this.highScore.toString());
        }

        this.submitScoreAndFetchBoards(this.score);

        gameAudio.stopBgm();
        if (gameAudio.playGameOverTune) {
            gameAudio.playGameOverTune();
        } else {
            gameAudio.playHit();
        }
    }

    setupEventListeners() {
        // Play buttons
        document.getElementById('start-btn').addEventListener('click', () => {
            const usernameInput = document.getElementById('username-input');
            const username = usernameInput.value.trim() || 'ClimberMonkey';
            localStorage.setItem('greedy_monkey_username', username);
            gameAudio.init();
            this.start();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            gameAudio.init();
            this.start();
        });

        document.getElementById('victory-restart-btn').addEventListener('click', () => {
            gameAudio.init();
            this.start();
        });

        // Sound Toggle Button
        const soundBtn = document.getElementById('sound-btn');
        soundBtn.addEventListener('click', () => {
            const enabled = gameAudio.toggleSound();
            soundBtn.innerText = enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
            soundBtn.blur(); // Remove focus
        });

        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if (this.currentState !== this.State.PLAYING) return;
            
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                this.player.moveLeft();
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                this.player.moveRight();
            } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
                this.player.jump();
                e.preventDefault();
            }
        });

        // Click / Touch Controls (Mobile Zones)
        this.canvas.addEventListener('click', (e) => {
            if (this.currentState !== this.State.PLAYING) return;

            // Get relative click X position
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickXPercent = clickX / rect.width;

            if (clickXPercent < 0.4) {
                this.player.moveLeft();
            } else if (clickXPercent > 0.6) {
                this.player.moveRight();
            } else {
                this.player.jump();
            }
        });
    }

    // Spawn collectibles and hazards
    spawnEntity() {
        const lane = Math.floor(Math.random() * 3);
        const y = -100; // Spawn just off screen top
        const choices = ['banana', 'banana', 'coconut', 'spider', 'branch'];
        const type = choices[Math.floor(Math.random() * choices.length)];

        if (type === 'banana') {
            this.entities.push(new Banana(lane, y, this.player.lanes));
        } else if (type === 'coconut') {
            this.entities.push(new Coconut(lane, y, this.player.lanes));
        } else if (type === 'spider') {
            this.entities.push(new Spider(lane, y, this.player.lanes));
        } else if (type === 'branch') {
            this.entities.push(new ThornyBranch(lane, y, this.player.lanes));
        }
    }

    createBananaBurst(x, y) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 3,
                radius: Math.random() * 4 + 2,
                color: Math.random() > 0.5 ? '#FFEB3B' : '#FFF59D', // Yellow/Light Yellow
                life: 30,
                maxLife: 30
            });
        }
    }

    createHitBurst(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 2,
                radius: Math.random() * 5 + 3,
                color: Math.random() > 0.5 ? '#FF007F' : '#FF66B2', // Red-pink dust
                life: 40,
                maxLife: 40
            });
        }
    }

    createFallingBananaParticle(x, y) {
        this.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: -5, // Leap up then fall down
            radius: 12,
            type: 'banana',
            angle: 0,
            angularVelocity: (Math.random() - 0.5) * 0.2,
            life: 60,
            maxLife: 60
        });
    }

    update() {
        // Speed scaling based on score (since score maxes at 10, we can use score * 0.3)
        this.scrollSpeed = this.baseScrollSpeed + this.score * 0.4;
        this.spawnInterval = Math.max(45, 90 - this.score * 4);

        // Update Background scrolling
        this.backgroundOffset = (this.backgroundOffset + this.scrollSpeed) % 80;

        // Update Player
        this.player.update();

        // Update Entities (Collectibles / Hazards)
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            entity.update(this.scrollSpeed);

            // Check Collision
            if (entity.checkCollision(this.player)) {
                if (entity instanceof Banana) {
                    this.score += 1;
                    gameAudio.playCollect();
                    this.createBananaBurst(entity.x, entity.y);
                    this.updateHUD();

                    if (this.score >= 10) {
                        this.victory();
                        this.entities.splice(i, 1);
                        break;
                    }
                } else {
                    // It is a hazard
                    if (this.score > 0) {
                        // Shielded by bananas
                        this.score -= 1;
                        this.createFallingBananaParticle(this.player.x, this.player.y - 10);
                        gameAudio.playHit();
                        this.createHitBurst(entity.x, entity.y);
                        this.updateHUD();
                    } else {
                        // Game Over! The monkey had 0 bananas and hit a hazard
                        this.createHitBurst(this.player.x, this.player.y);
                        this.gameOver();
                        this.entities.splice(i, 1);
                        return; // Exit update loop
                    }
                }
                this.entities.splice(i, 1);
                continue;
            }

            // Remove out of bounds items
            if (entity.isOutOfBounds()) {
                this.entities.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.18; // Mild gravity on particles
            p.life--;

            if (p.type === 'banana') {
                p.angle += p.angularVelocity;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Spawner
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnEntity();
            this.spawnTimer = 0;
        }
    }

    updateHUD() {
        this.scoreVal.innerText = this.score;
        this.bananaCountHud.innerText = this.score;
        
        // Progress bar percentage (0 to 10 bananas)
        const percent = Math.min(100, (this.score / 10) * 100);
        this.bananaProgress.style.width = percent + '%';
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Draw Scrolling Vines background
        this.drawVines();

        // 2. Draw Obstacles / Collectibles
        this.entities.forEach(entity => entity.draw(this.ctx));

        // 3. Draw Monkey (Player)
        this.player.draw(this.ctx);

        // 4. Draw Particles
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life / p.maxLife;
            
            if (p.type === 'banana') {
                // Draw rotating falling banana
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.angle);
                
                this.ctx.fillStyle = '#FFEB3B';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 12, 0.2 * Math.PI, 0.8 * Math.PI);
                this.ctx.arc(0, -5, 12, 0.7 * Math.PI, 0.3 * Math.PI, true);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.fillStyle = '#663300';
                this.ctx.beginPath();
                this.ctx.arc(9, 7, 2, 0, Math.PI * 2);
                this.ctx.arc(-9, 7, 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Standard circles
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
        });
    }

    drawTrophyTree() {
        const trophyCanvas = document.getElementById('trophyCanvas');
        const tctx = trophyCanvas.getContext('2d');
        const w = trophyCanvas.width;
        const h = trophyCanvas.height;
        
        tctx.clearRect(0, 0, w, h);
        
        tctx.save();
        
        // 1. Trunk (brown segment curves)
        tctx.fillStyle = '#8B5A2B';
        tctx.beginPath();
        tctx.moveTo(w / 2 - 14, h - 25);
        tctx.quadraticCurveTo(w / 2 - 28, h / 2 + 20, w / 2 - 10, h / 2 - 10);
        tctx.lineTo(w / 2 + 10, h / 2 - 10);
        tctx.quadraticCurveTo(w / 2 + 8, h / 2 + 20, w / 2 + 14, h - 25);
        tctx.closePath();
        tctx.fill();
        
        // Trunk segments detail
        tctx.strokeStyle = '#663300';
        tctx.lineWidth = 3;
        tctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
            const ry = h - 45 - (i * 20);
            tctx.beginPath();
            tctx.moveTo(w / 2 - 13 + (i * 1.5), ry);
            tctx.lineTo(w / 2 + 9 - (i * 1.2), ry);
            tctx.stroke();
        }
        
        // 2. Bunches of bananas hanging under leaves
        tctx.save();
        tctx.translate(w / 2, h / 2 - 5);
        tctx.fillStyle = '#FFEB3B';
        tctx.shadowColor = 'rgba(0,0,0,0.1)';
        tctx.shadowBlur = 4;
        
        const drawMiniBanana = (bx, by, rot) => {
            tctx.save();
            tctx.translate(bx, by);
            tctx.rotate(rot);
            tctx.beginPath();
            tctx.arc(0, 0, 10, 0.2 * Math.PI, 0.8 * Math.PI);
            tctx.arc(0, -4, 10, 0.7 * Math.PI, 0.3 * Math.PI, true);
            tctx.closePath();
            tctx.fill();
            
            tctx.fillStyle = '#663300';
            tctx.beginPath();
            tctx.arc(7.5, 6, 1.5, 0, Math.PI * 2);
            tctx.arc(-7.5, 6, 1.5, 0, Math.PI * 2);
            tctx.fill();
            tctx.restore();
        };
        
        // Render 5 little bananas in a cute bunch
        drawMiniBanana(-14, 10, -0.4);
        drawMiniBanana(-7, 14, -0.15);
        drawMiniBanana(7, 14, 0.15);
        drawMiniBanana(14, 10, 0.4);
        drawMiniBanana(0, 8, 0);
        tctx.restore();
        
        // 3. Tree Leaves (Large overlapping green leaf arches)
        tctx.fillStyle = '#4CAF50';
        
        const drawLeaf = (lx, ly, rot, length, width) => {
            tctx.save();
            tctx.translate(lx, ly);
            tctx.rotate(rot);
            
            tctx.beginPath();
            tctx.ellipse(length / 2, 0, length / 2, width, 0, 0, Math.PI * 2);
            tctx.fill();
            
            // Leaf vein
            tctx.strokeStyle = '#2E7D32';
            tctx.lineWidth = 3;
            tctx.beginPath();
            tctx.moveTo(0, 0);
            tctx.lineTo(length - 5, 0);
            tctx.stroke();
            
            tctx.restore();
        };
        
        const leafHeadX = w / 2;
        const leafHeadY = h / 2 - 12;
        
        // Draw 5 big cartoon leaves spreading out
        drawLeaf(leafHeadX, leafHeadY, -Math.PI / 6, 75, 20); // Mid-Left
        drawLeaf(leafHeadX, leafHeadY, -5 * Math.PI / 6, 75, 20); // Mid-Right
        drawLeaf(leafHeadX, leafHeadY, -Math.PI / 2, 80, 22); // Top
        drawLeaf(leafHeadX, leafHeadY, -0.05, 65, 16); // Far-Left
        drawLeaf(leafHeadX, leafHeadY, -Math.PI + 0.05, 65, 16); // Far-Right
        
        // 4. Ground/Pot (Cute pink pot!)
        tctx.fillStyle = '#FF66B2';
        tctx.beginPath();
        tctx.roundRect(w / 2 - 40, h - 25, 80, 20, 6);
        tctx.fill();
        
        tctx.fillStyle = '#FF99CC';
        tctx.beginPath();
        tctx.roundRect(w / 2 - 44, h - 30, 88, 7, 3);
        tctx.fill();
        
        tctx.restore();
    }

    drawVines() {
        const lanePositions = this.player.lanes;
        
        // Draw the 3 vines (vertical pipes with decorative leaves)
        lanePositions.forEach(laneX => {
            // Main vine line (thick playful light green/yellow stripe)
            this.ctx.save();
            this.ctx.strokeStyle = '#8ED973'; // Nice light neon green
            this.ctx.lineWidth = 10;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(laneX, 0);
            this.ctx.lineTo(laneX, this.height);
            this.ctx.stroke();

            // Dark green inner vine stripe for details
            this.ctx.strokeStyle = '#55A630';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(laneX - 1, 0);
            this.ctx.lineTo(laneX - 1, this.height);
            this.ctx.stroke();

            // Draw leaves wiggling and scrolling down the vine
            this.ctx.fillStyle = '#A7F484';
            const leafInterval = 80;
            const startY = -leafInterval + this.backgroundOffset;
            
            for (let y = startY; y < this.height + leafInterval; y += leafInterval) {
                // Alternating leaves left and right of vine
                const side = Math.sin(y) > 0 ? 1 : -1;
                
                this.ctx.save();
                this.ctx.translate(laneX + (8 * side), y);
                this.ctx.rotate(side * (Math.PI / 4 + Math.sin(y * 0.01) * 0.1));
                
                // Draw leaf shape
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
                this.ctx.fill();

                // Draw miniature pink flower bud occasionally on leaf tips for childish vibes!
                if (Math.abs(Math.sin(y * 3)) > 0.8) {
                    this.ctx.fillStyle = '#FF66B2'; // Pink flower
                    this.ctx.beginPath();
                    this.ctx.arc(8, 0, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                this.ctx.restore();
            }
            this.ctx.restore();
        });
    }

    async submitScoreAndFetchBoards(score) {
        const usernameInput = document.getElementById('username-input');
        const username = usernameInput.value.trim() || 'ClimberMonkey';
        
        // Show loading indicator
        const isWin = this.currentState === this.State.VICTORY;
        const feedbackId = isWin ? 'victory-feedback' : 'gameover-feedback';
        const globalBoardId = isWin ? 'global-board-victory' : 'global-board-gameover';
        const personalBoardId = isWin ? 'personal-board-victory' : 'personal-board-gameover';

        const feedbackEl = document.getElementById(feedbackId);
        if (feedbackEl) feedbackEl.innerText = "Submitting score to databases...";

        try {
            // 1. Submit score to global and personal SQL databases
            const response = await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, score })
            });
            const result = await response.json();

            if (result.success) {
                // 2. Render self-competition performance comparison
                const m = result.metrics;
                let feedbackText = "";
                if (m.totalPastGames === 0) {
                    feedbackText = `🎉 Your very first climb! Global Rank: #${m.globalRank}!`;
                } else if (m.isNewPersonalBest) {
                    feedbackText = `👑 New Personal Best! You beat your old record of ${m.pastBest}! Global Rank: #${m.globalRank}!`;
                } else {
                    feedbackText = `💪 You beat ${m.scoresBeaten} of your past runs! Average score: ${m.pastAverage}. Global Rank: #${m.globalRank}`;
                }
                if (feedbackEl) feedbackEl.innerText = feedbackText;

                // 3. Render Personal Bests list
                const personalBoard = document.getElementById(personalBoardId);
                if (personalBoard) {
                    personalBoard.innerHTML = "";
                    result.personalBests.forEach((pbScore, idx) => {
                        const li = document.createElement('li');
                        li.innerHTML = `<span class="rank-num">#${idx+1}</span> <span>You</span> <span class="score-num">${pbScore}</span>`;
                        personalBoard.appendChild(li);
                    });
                }
            }

            // 4. Fetch Global Top 5 Leaderboard
            const boardRes = await fetch('/api/leaderboard');
            const boardData = await boardRes.json();
            if (boardData.success) {
                const globalBoard = document.getElementById(globalBoardId);
                if (globalBoard) {
                    globalBoard.innerHTML = "";
                    boardData.data.slice(0, 5).forEach((entry, idx) => {
                        const li = document.createElement('li');
                        li.innerHTML = `<span class="rank-num">#${idx+1}</span> <span class="player-name">${entry.username}</span> <span class="score-num">${entry.score}</span>`;
                        globalBoard.appendChild(li);
                    });
                }
            }
        } catch (err) {
            console.error("Error connecting to backend database:", err);
            if (feedbackEl) feedbackEl.innerText = "Offline Mode - Leaderboard Unavailable";
        }
    }

    tick() {
        if (this.currentState !== this.State.PLAYING) return;
        
        this.update();
        this.draw();

        requestAnimationFrame(() => this.tick());
    }
}

// Start game instance when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
});
