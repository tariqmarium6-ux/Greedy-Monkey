class BaseEntity {
    constructor(lane, y, lanesX) {
        this.lane = lane;
        this.y = y;
        this.lanesX = lanesX;
        this.x = lanesX[lane];
        this.width = 40;
        this.height = 40;
        this.isCollected = false;
        this.isHit = false;
    }

    update(scrollSpeed) {
        this.y += scrollSpeed; // Scroll down relative to player climbing speed
    }

    isOutOfBounds() {
        return this.y > 800; // Off screen bottom
    }
}

// 🍌 Banana: Collectible Item
class Banana extends BaseEntity {
    constructor(lane, y, lanesX) {
        super(lane, y, lanesX);
        this.radius = 16;
        this.angleOffset = Math.random() * Math.PI * 2; // For floating animations
        this.sparkleAngle = 0;
    }

    update(scrollSpeed) {
        super.update(scrollSpeed);
        this.sparkleAngle += 0.05;
    }

    draw(ctx) {
        if (this.isCollected) return;

        ctx.save();
        // Floating wave animation
        const floatY = this.y + Math.sin(Date.now() * 0.005 + this.angleOffset) * 6;
        ctx.translate(this.x, floatY);

        // Premium yellow glow
        ctx.shadowColor = 'rgba(255, 235, 59, 0.6)';
        ctx.shadowBlur = 12;

        // Draw Banana shape using Bezier curves for a smooth organic cartoon banana
        ctx.fillStyle = '#FFEB3B'; // Sunny yellow
        ctx.beginPath();
        // Inner crescent curve
        ctx.arc(0, 0, 16, 0.2 * Math.PI, 0.8 * Math.PI);
        // Outer crescent curve
        ctx.arc(0, -6, 16, 0.7 * Math.PI, 0.3 * Math.PI, true);
        ctx.closePath();
        ctx.fill();

        // Tip of the banana (dark brown stem)
        ctx.fillStyle = '#5C3A21';
        ctx.beginPath();
        ctx.arc(12, 10, 3, 0, Math.PI * 2);
        ctx.arc(-12, 10, 3, 0, Math.PI * 2);
        ctx.fill();

        // White banana highlight line for professional vector look
        ctx.strokeStyle = '#FFFDF0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -2, 12, 0.4 * Math.PI, 0.6 * Math.PI);
        ctx.stroke();

        // Little sparkle effect
        ctx.shadowBlur = 0; // reset shadow
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.save();
        ctx.translate(6, -8);
        ctx.rotate(this.sparkleAngle);
        ctx.beginPath();
        ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
        ctx.moveTo(0, -4); ctx.lineTo(0, 4);
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }

    checkCollision(player) {
        if (this.isCollected) return false;

        // Player collision circle check
        const dx = this.x - player.x;
        const dy = this.y - (player.y - player.jumpHeight);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.radius + player.radius) {
            this.isCollected = true;
            return true;
        }
        return false;
    }
}

// 🕷️ Spider: Mid-air Obstacle (Dodge by staying low, hit if jumping!)
class Spider extends BaseEntity {
    constructor(lane, y, lanesX) {
        super(lane, y, lanesX);
        this.radius = 20;
        this.swingOffset = Math.random() * 100;
        this.hangingHeight = 150; // Lives in mid-air
        this.theta = 0;
    }

    update(scrollSpeed) {
        super.update(scrollSpeed);
        // Pendulum physics swing effect (angle back and forth)
        this.theta = Math.sin(Date.now() * 0.003 + this.swingOffset) * 0.25;
        // Position relative to thread swing
        this.currentX = this.x + Math.sin(this.theta) * this.hangingHeight;
        this.currentY = this.y - this.hangingHeight * Math.cos(this.theta) + 30;
    }

    draw(ctx) {
        if (this.isHit) return;

        ctx.save();

        // 1. Draw glowing silk thread
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x, -200); // Silk hangs from far above
        ctx.lineTo(this.currentX, this.currentY);
        ctx.stroke();

        ctx.translate(this.currentX, this.currentY);
        ctx.rotate(this.theta); // Rotate spider body with swing angle

        // 2. Premium Legs (glowing hot pink/purple curves with segment joints)
        ctx.strokeStyle = '#FF2E93';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        const legWiggle = Math.sin(Date.now() * 0.015 + this.swingOffset) * 5;

        for (let i = -1; i <= 1; i += 2) {
            // Legs index (-1 left side, 1 right side)
            // Leg 1 (Front)
            ctx.beginPath();
            ctx.moveTo(0, -3);
            ctx.quadraticCurveTo(24 * i, -18 + legWiggle, 28 * i, -6 + legWiggle);
            ctx.stroke();

            // Leg 2 (Middle)
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(28 * i, legWiggle, 34 * i, 12 + legWiggle);
            ctx.stroke();

            // Leg 3 (Back)
            ctx.beginPath();
            ctx.moveTo(0, 3);
            ctx.quadraticCurveTo(22 * i, 18 - legWiggle, 26 * i, 28 - legWiggle);
            ctx.stroke();
        }

        // 3. Spider Body (Sleek deep purple gradient with neon spots)
        const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 18);
        grad.addColorStop(0, '#A73EE2');
        grad.addColorStop(1, '#5C1D82');
        ctx.fillStyle = grad;
        
        ctx.shadowColor = 'rgba(167, 62, 226, 0.5)';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Neon Yellow/Green spots for toxic spider look
        ctx.fillStyle = '#39FF14'; 
        ctx.beginPath();
        ctx.arc(-6, -2, 4, 0, Math.PI * 2);
        ctx.arc(6, -2, 4, 0, Math.PI * 2);
        ctx.arc(0, 9, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // 4. Large Cute but Menacing Cartoon Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-5, -6, 5.5, 0, Math.PI * 2);
        ctx.arc(5, -6, 5.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#D62246'; // Red glowing pupils
        ctx.beginPath();
        ctx.arc(-4, -5, 2, 0, Math.PI * 2);
        ctx.arc(4, -5, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    checkCollision(player) {
        if (this.isHit) return false;

        // Spiders hang high! Player only hits spider if they are jumping!
        if (player.jumpHeight > 30) {
            const dx = this.currentX - player.x;
            const dy = this.currentY - (player.y - player.jumpHeight);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.radius + player.radius) {
                this.isHit = true;
                return true;
            }
        }
        return false;
    }
}

// 🥥 Coconut: Falling Obstacle (Dodge by switching lanes, jumping doesn't save you!)
class Coconut extends BaseEntity {
    constructor(lane, y, lanesX) {
        super(lane, y, lanesX);
        this.radius = 18;
        this.fallSpeed = 3.2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.12;
    }

    update(scrollSpeed) {
        // Coconuts fall faster than background scrolling
        this.y += scrollSpeed + this.fallSpeed;
        this.rotation += this.rotSpeed;
    }

    draw(ctx) {
        if (this.isHit) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw Coconut Shell (textured gradient brown)
        const shellGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 18);
        shellGrad.addColorStop(0, '#7D471E');
        shellGrad.addColorStop(1, '#3B1E05');
        ctx.fillStyle = shellGrad;
        
        ctx.shadowColor = 'rgba(59, 30, 5, 0.4)';
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Inner meat ring texture (rough light brown detail)
        ctx.strokeStyle = '#5A3414';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.stroke();

        // Three coconut holes (black spots)
        ctx.fillStyle = '#1F0F02';
        ctx.beginPath();
        ctx.arc(-5, -5, 3, 0, Math.PI * 2);
        ctx.arc(5, -5, 3, 0, Math.PI * 2);
        ctx.arc(0, 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // 3D Highlight curve
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 15, -Math.PI * 0.5, 0);
        ctx.stroke();

        ctx.restore();
    }

    checkCollision(player) {
        if (this.isHit) return false;

        // Coconuts hit you regardless of jump state because they fall on top of you
        const dx = this.x - player.x;
        const dy = this.y - (player.y - player.jumpHeight);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.radius + player.radius) {
            this.isHit = true;
            return true;
        }
        return false;
    }
}

// 🌵 ThornyBranch: Low-lying Obstacle (Dodge by jumping over it!)
class ThornyBranch extends BaseEntity {
    constructor(lane, y, lanesX) {
        super(lane, y, lanesX);
        this.width = 72;
        this.height = 24;
        this.angleOffset = Math.random() * Math.PI;
    }

    draw(ctx) {
        if (this.isHit) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw wooden branch (horizontal textured cocoa brown rect)
        const branchGrad = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
        branchGrad.addColorStop(0, '#85512B');
        branchGrad.addColorStop(1, '#4A2A12');
        ctx.fillStyle = branchGrad;
        
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 6);
        ctx.fill();

        // Bark lines for details
        ctx.strokeStyle = '#321B0B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-24, -2); ctx.lineTo(-10, -2);
        ctx.moveTo(8, 2); ctx.lineTo(24, 2);
        ctx.stroke();

        // Draw sharp glowing pink/magenta thorns
        ctx.fillStyle = '#FF0D72';
        ctx.shadowColor = '#FF0D72';
        ctx.shadowBlur = 6;
        
        const thornPositions = [-20, 0, 20];
        thornPositions.forEach(px => {
            ctx.beginPath();
            ctx.moveTo(px - 6, -this.height / 2);
            ctx.lineTo(px + 6, -this.height / 2);
            ctx.lineTo(px, -this.height / 2 - 12);
            ctx.closePath();
            ctx.fill();
        });
        ctx.shadowBlur = 0; // reset

        // Draw neon green leaf wiggling
        ctx.fillStyle = '#39FF14';
        ctx.beginPath();
        const leafAngle = Math.sin(Date.now() * 0.004 + this.angleOffset) * 0.15;
        ctx.ellipse(-this.width / 2 + 3, -1, 12, 6, Math.PI / 4 + leafAngle, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    checkCollision(player) {
        if (this.isHit) return false;

        // Thorny branch is on the ground. Player can jump over it.
        // If player is high enough (jumpHeight > 45), they fly safely over it!
        if (player.jumpHeight <= 45) {
            const dx = Math.abs(this.x - player.x);
            const dy = Math.abs(this.y - player.y);

            // Simple box collision
            if (dx < (this.width / 2 + player.radius * 0.8) && dy < (this.height / 2 + player.radius * 0.8)) {
                this.isHit = true;
                return true;
            }
        }
        return false;
    }
}
