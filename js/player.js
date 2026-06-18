class Monkey {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Lane setup: 3 vertical vines
        this.laneWidth = canvasWidth / 3;
        this.lanes = [
            this.laneWidth * 0.5,                  // Lane 0 (Left): ~66px
            this.laneWidth * 1.5,                  // Lane 1 (Middle): ~200px
            this.laneWidth * 2.5                   // Lane 2 (Right): ~333px
        ];
        this.currentLane = 1; // Start in middle lane

        // Coordinates
        this.x = this.lanes[this.currentLane];
        this.y = canvasHeight - 150; // Keep monkey near bottom
        this.targetX = this.x;

        // Jump physics
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
        this.gravity = 0.65;
        this.isJumping = false;

        // Visuals
        this.radius = 28;
        this.angle = 0; // Wiggle rotation for climbing effect
        this.climbSpeed = 0.085;
        this.time = 0;

        // Skins setup
        this.skin = localStorage.getItem('greedy_monkey_selected_skin') || 'classic';
        this.skins = {
            classic: {
                body: '#8B5A2B', tummy: '#F5D0A9', ears: '#8B5A2B', innerEars: '#FF99CC',
                face: '#F5D0A9', eyes: '#261300', mouth: '#8B5A2B', accent: '#FF66B2'
            },
            cyber: {
                body: '#3A4454', tummy: '#1C2331', ears: '#546A7B', innerEars: '#00F0FF',
                face: '#1C2331', eyes: '#00F0FF', mouth: '#00F0FF', accent: '#00F0FF',
                visor: true, glow: true
            },
            golden: {
                body: '#E5A93B', tummy: '#FFFDD0', ears: '#E5A93B', innerEars: '#FFD700',
                face: '#FFE5B4', eyes: '#5C3A21', mouth: '#5C3A21', accent: '#FF3366',
                crown: true, sparkle: true
            },
            ninja: {
                body: '#1C1C1C', tummy: '#404040', ears: '#1C1C1C', innerEars: '#D62246',
                face: '#1C1C1C', eyes: '#FFFFFF', mouth: '#FFFFFF', accent: '#D62246',
                headband: true
            },
            astro: {
                body: '#F1F5F9', tummy: '#CBD5E1', ears: '#CBD5E1', innerEars: '#FF6B6B',
                face: '#475569', eyes: '#FFFFFF', mouth: '#FFFFFF', accent: '#FF6B6B',
                helmet: true
            }
        };
    }

    setSkin(skinName) {
        if (this.skins[skinName]) {
            this.skin = skinName;
            localStorage.setItem('greedy_monkey_selected_skin', skinName);
        }
    }

    moveLeft() {
        if (this.currentLane > 0) {
            this.currentLane--;
            this.targetX = this.lanes[this.currentLane];
            gameAudio.playJump();
        }
    }

    moveRight() {
        if (this.currentLane < 2) {
            this.currentLane++;
            this.targetX = this.lanes[this.currentLane];
            gameAudio.playJump();
        }
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = 14.5;
            gameAudio.playJump();
        }
    }

    update() {
        this.time += this.climbSpeed;
        
        // Smoothly slide horizontally between lanes
        this.x += (this.targetX - this.x) * 0.26;

        // Jump physics
        if (this.isJumping) {
            this.jumpHeight += this.jumpVelocity;
            this.jumpVelocity -= this.gravity;

            if (this.jumpHeight <= 0) {
                this.jumpHeight = 0;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        }

        // Climbing wiggle rotation (only when not jumping)
        if (!this.isJumping) {
            this.angle = Math.sin(this.time) * 0.08;
        } else {
            this.angle = (this.jumpVelocity > 0 ? 0.15 : -0.15); // Leaning in mid-air
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Calculate rendering position including jump height
        const renderY = this.y - this.jumpHeight;
        
        ctx.translate(this.x, renderY);
        ctx.rotate(this.angle);

        const skinConfig = this.skins[this.skin];

        // Custom Cyber / Golden Glow shadows
        if (skinConfig.glow) {
            ctx.shadowColor = skinConfig.eyes;
            ctx.shadowBlur = 12;
        } else if (skinConfig.sparkle) {
            ctx.shadowColor = '#FFF59D';
            ctx.shadowBlur = 15;
        }

        // --- DRAW MONKEY ---
        
        // 1. Long Curly Tail (Base body color)
        ctx.beginPath();
        ctx.strokeStyle = skinConfig.body;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.moveTo(-10, 20);
        // Draw spiral tail
        ctx.bezierCurveTo(-30, 40, -40, 0, -25, -15);
        ctx.stroke();

        // Remove glow effect for smaller sub-parts if wanted, or keep for premium feel
        ctx.shadowBlur = 0; 

        // 2. Arms (reaching out to vine)
        ctx.fillStyle = skinConfig.body;
        ctx.beginPath();
        ctx.arc(-22, 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(22, 10, 8, 0, Math.PI * 2);
        ctx.fill();

        // 3. Feet
        ctx.beginPath();
        ctx.arc(-15, 30, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(15, 30, 7, 0, Math.PI * 2);
        ctx.fill();

        // 4. Body (Oval)
        ctx.fillStyle = skinConfig.body;
        ctx.beginPath();
        ctx.ellipse(0, 15, 20, 24, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lighter tummy patch
        ctx.fillStyle = skinConfig.tummy;
        ctx.beginPath();
        ctx.ellipse(0, 15, 12, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Special Space logo for Astro
        if (this.skin === 'astro') {
            ctx.fillStyle = '#FF6B6B'; // Red star badge
            ctx.beginPath();
            ctx.arc(0, 12, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // 5. Ears (Outer ears and Inner ears)
        ctx.fillStyle = skinConfig.ears;
        ctx.beginPath();
        ctx.arc(-26, -12, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(26, -12, 12, 0, Math.PI * 2);
        ctx.fill();

        // Inner ears
        ctx.fillStyle = skinConfig.innerEars;
        ctx.beginPath();
        ctx.arc(-26, -12, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(26, -12, 7, 0, Math.PI * 2);
        ctx.fill();

        // 6. Head
        ctx.fillStyle = skinConfig.body;
        ctx.beginPath();
        ctx.arc(0, -10, 26, 0, Math.PI * 2);
        ctx.fill();

        // 7. Face Mask / Visor / Helmet details
        if (skinConfig.visor) {
            // Cyber glass visor
            ctx.fillStyle = skinConfig.face;
            ctx.beginPath();
            ctx.roundRect(-20, -18, 40, 22, 6);
            ctx.fill();

            ctx.fillStyle = skinConfig.eyes; // Glowing neon visor
            ctx.shadowColor = skinConfig.eyes;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(-16, -12, 32, 7, 3);
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        } else {
            // Standard Face lobes for other skins
            ctx.fillStyle = skinConfig.face;
            ctx.beginPath();
            ctx.arc(-10, -8, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(10, -8, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, -2, 12, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = skinConfig.eyes;
            ctx.beginPath();
            ctx.arc(-8, -10, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(8, -10, 4, 0, Math.PI * 2);
            ctx.fill();

            // Eye highlights (if not ninja/astro plain eyes)
            if (this.skin !== 'ninja' && this.skin !== 'astro') {
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(-9.5, -11.5, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(6.5, -11.5, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Blushing Cheeks
            ctx.fillStyle = 'rgba(255, 102, 178, 0.45)';
            ctx.beginPath();
            ctx.arc(-16, -2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(16, -2, 5, 0, Math.PI * 2);
            ctx.fill();

            // Nose & Smile
            ctx.strokeStyle = skinConfig.mouth;
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-2, -2);
            ctx.lineTo(2, -2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 2, 4, 0, Math.PI);
            ctx.stroke();
        }

        // 8. Custom Extra Accessories (Crown, Headband, Helmet dome)
        if (skinConfig.crown) {
            // Golden crown on head
            ctx.save();
            ctx.translate(0, -38);
            ctx.fillStyle = '#FFD700'; // Pure gold crown
            ctx.strokeStyle = '#B38F00';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-15, 5);
            ctx.lineTo(-15, -10);
            ctx.lineTo(-7, -2);
            ctx.lineTo(0, -15);
            ctx.lineTo(7, -2);
            ctx.lineTo(15, -10);
            ctx.lineTo(15, 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Small red gem on crown center
            ctx.fillStyle = '#FF3366';
            ctx.beginPath();
            ctx.arc(0, -2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (skinConfig.headband) {
            // Ninja red headband wraps forehead
            ctx.fillStyle = '#D62246';
            ctx.beginPath();
            ctx.roundRect(-24, -23, 48, 6, 2);
            ctx.fill();

            // Headband metal plate
            ctx.fillStyle = '#CBD5E1';
            ctx.beginPath();
            ctx.roundRect(-6, -23, 12, 6, 1);
            ctx.fill();

            // Headband ribbons blowing in wind
            ctx.save();
            ctx.translate(22, -20);
            ctx.rotate(Math.sin(this.time) * 0.15);
            ctx.fillStyle = '#D62246';
            ctx.beginPath();
            ctx.moveTo(0, -1);
            ctx.lineTo(16, 5);
            ctx.lineTo(12, 10);
            ctx.lineTo(-2, 3);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        if (skinConfig.helmet) {
            // Spacesuit glass helmet dome
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
            ctx.lineWidth = 2.5;
            ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
            ctx.beginPath();
            ctx.arc(0, -10, 31, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Helmet reflection sheen
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -10, 27, -Math.PI * 0.45, -Math.PI * 0.1);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }
}
