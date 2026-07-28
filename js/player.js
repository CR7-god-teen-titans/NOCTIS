/* ==========================================================================
   NOCTIS - PLAYER & PARTICLE SYSTEM
   ========================================================================== */

// --- PARTICLE SYSTEM ---
class Particle {
  constructor(x, y, vx, vy, color, size, life, shape = 'circle') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.shape = shape;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  draw(ctx, cameraX) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;

    const screenX = this.x - cameraX;
    ctx.beginPath();
    if (this.shape === 'circle') {
      ctx.arc(screenX, this.y, Math.max(1, this.size * (this.life / this.maxLife)), 0, Math.PI * 2);
    } else {
      ctx.rect(screenX - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
    ctx.fill();
    ctx.restore();
  }
}

// --- NOCTIS PLAYER CLASS ---
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 48;
    this.height = 72;
    this.vx = 0;
    this.vy = 0;
    this.facing = 'right';

    // Stats & Health
    this.maxHp = 100;
    this.hp = 100;
    this.rage = 0; // 0 to 100
    this.maxRage = 100;
    this.isRageMode = false;
    this.rageTimer = 0;

    // Movement Parameters
    this.speed = 6;
    this.jumpForce = -14;
    this.gravity = 0.65;
    this.isGrounded = false;
    this.canDoubleJump = true;

    // Combat & Dash
    this.state = 'IDLE'; // IDLE, RUN, JUMP, SLASH, DASH, RAGE_TRANSFORM
    this.isAttacking = false;
    this.attackFrame = 0;
    this.attackBox = null;
    this.comboIndex = 0;

    this.isDashing = false;
    this.dashCooldown = 0;
    this.invulnerableTimer = 0;

    // Upgrades
    this.upgrades = {
      blade: 0,
      rageGain: 0,
      health: 0,
      bazooka: 0
    };

    // Bazooka Power
    this.bazookaCooldown = 0;
    this.bazookaProjectiles = [];

    // Particles array
    this.particles = [];
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.rage = 0;
    this.isRageMode = false;
    this.state = 'IDLE';
    this.isAttacking = false;
    this.bazookaCooldown = 0;
    this.bazookaProjectiles = [];
    this.particles = [];
  }

  // --- UPGRADE APPLIER ---
  applyUpgrades() {
    this.maxHp = 100 + (this.upgrades.health * 40);
    this.hp = Math.min(this.hp, this.maxHp);
  }

  // --- INPUT CONTROLLER ---
  handleInput(keys) {
    if (this.state === 'RAGE_TRANSFORM' && this.transformTimer > 0) return;

    const moveSpeed = this.isRageMode ? this.speed * 1.4 : this.speed;

    // Movement (A / D or Left / Right)
    if (keys['KeyA'] || keys['ArrowLeft']) {
      this.vx = -moveSpeed;
      this.facing = 'left';
      if (this.isGrounded && !this.isAttacking) this.state = 'RUN';
    } else if (keys['KeyD'] || keys['ArrowRight']) {
      this.vx = moveSpeed;
      this.facing = 'right';
      if (this.isGrounded && !this.isAttacking) this.state = 'RUN';
    } else {
      this.vx *= 0.7;
      if (this.isGrounded && !this.isAttacking) this.state = 'IDLE';
    }

    // Jump (W / Space / Up)
    if (keys['KeyW'] || keys['Space'] || keys['ArrowUp']) {
      if (!keys._jumpPressed) {
        keys._jumpPressed = true;
        if (this.isGrounded) {
          this.vy = this.jumpForce;
          this.isGrounded = false;
          this.canDoubleJump = true;
          this.createJumpParticles();
          soundEngine.playDash();
        } else if (this.canDoubleJump) {
          this.vy = this.jumpForce * 0.85;
          this.canDoubleJump = false;
          this.createJumpParticles();
          soundEngine.playDash();
        }
      }
    } else {
      keys._jumpPressed = false;
    }

    // Attack (J / Z)
    if ((keys['KeyJ'] || keys['KeyZ']) && !this.isAttacking) {
      if (!keys._attackPressed) {
        keys._attackPressed = true;
        this.performAttack();
      }
    } else if (!keys['KeyJ'] && !keys['KeyZ']) {
      keys._attackPressed = false;
    }

    // Dash (K / X)
    if ((keys['KeyK'] || keys['KeyX']) && this.dashCooldown <= 0) {
      if (!keys._dashPressed) {
        keys._dashPressed = true;
        this.performDash();
      }
    } else if (!keys['KeyK'] && !keys['KeyX']) {
      keys._dashPressed = false;
    }

    // Activate Dark Rage Mode (R / C)
    if ((keys['KeyR'] || keys['KeyC']) && this.rage >= this.maxRage && !this.isRageMode) {
      this.activateRageMode();
    }

    // Special Claw Blast in Rage Mode (L / V)
    if ((keys['KeyL'] || keys['KeyV']) && this.isRageMode && !this.isAttacking) {
      if (!keys._specialPressed) {
        keys._specialPressed = true;
        this.performDarkClawBlast();
      }
    } else if (!keys['KeyL'] && !keys['KeyV']) {
      keys._specialPressed = false;
    }

    // Bazooka / Chaos Launcher (I / B)
    if ((keys['KeyI'] || keys['KeyB']) && this.bazookaCooldown <= 0) {
      if (!keys._bazookaPressed) {
        keys._bazookaPressed = true;
        this.performBazooka();
      }
    } else if (!keys['KeyI'] && !keys['KeyB']) {
      keys._bazookaPressed = false;
    }
  }

  // --- ACTIONS & COMBAT ---
  performBazooka() {
    this.bazookaCooldown = 45;
    soundEngine.playBazooka();

    const dir = this.facing === 'right' ? 1 : -1;
    const startX = this.facing === 'right' ? this.x + this.width + 5 : this.x - 20;

    this.bazookaProjectiles.push({
      x: startX,
      y: this.y + 20,
      startX: startX,
      vx: dir * 14,
      vy: 0,
      radius: 10,
      damage: 9999,
      aoeRadius: 300,
      active: true,
      exploded: false
    });
  }

  // --- ACTIONS & COMBAT ---
  performAttack() {
    this.isAttacking = true;
    this.attackFrame = 0;
    this.comboIndex = (this.comboIndex + 1) % 2;
    this.state = 'SLASH';
    soundEngine.playSlash();

    // Create attack hitbox in front of player
    const reach = this.isRageMode ? 85 : 65;
    const attackX = this.facing === 'right' ? this.x + this.width : this.x - reach;
    this.attackBox = {
      x: attackX,
      y: this.y + 10,
      width: reach,
      height: this.height - 10,
      damage: (20 + (this.upgrades.blade * 6)) * (this.isRageMode ? 2.2 : 1.0),
      hitEnemies: new Set()
    };

    // Slash Arc Particles
    this.createSlashParticles();
  }

  performDarkClawBlast() {
    this.isAttacking = true;
    this.attackFrame = 0;
    this.state = 'DARK_CLAWS';
    soundEngine.playDarkPulse();

    const reach = 120;
    const attackX = this.facing === 'right' ? this.x + this.width : this.x - reach;
    this.attackBox = {
      x: attackX,
      y: this.y - 10,
      width: reach,
      height: this.height + 20,
      damage: 60 + (this.upgrades.blade * 10),
      hitEnemies: new Set()
    };

    this.createDarkBlastParticles();
  }

  performDash() {
    this.isDashing = true;
    this.dashCooldown = 35;
    this.invulnerableTimer = 20;
    const dashPower = this.isRageMode ? 18 : 14;
    this.vx = this.facing === 'right' ? dashPower : -dashPower;
    soundEngine.playDash();
    this.createDashTrail();
  }

  activateRageMode() {
    this.isRageMode = true;
    this.rageTimer = 400; // ~7 seconds of dark rage
    this.transformTimer = 25; // 25 frames transformation burst
    this.state = 'RAGE_TRANSFORM';
    this.invulnerableTimer = 60;
    soundEngine.playRageRoar();
    soundEngine.startBGM(true);

    // Erupt particles
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      this.particles.push(new Particle(
        this.x + this.width / 2,
        this.y + this.height / 2,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Math.random() > 0.5 ? '#a855f7' : '#ef4444',
        Math.random() * 8 + 4,
        35
      ));
    }
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) return;

    this.hp -= amount;
    this.invulnerableTimer = 30;
    soundEngine.playHit();

    // Gain rage from taking hits
    const rageGainFactor = 1 + (this.upgrades.rageGain * 0.3);
    this.addRage(15 * rageGainFactor);

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'DEAD';
    }
  }

  addRage(amount) {
    if (this.isRageMode) return;
    this.rage = Math.min(this.maxRage, this.rage + amount);
  }

  // --- UPDATE & PHYSICS ---
  update(groundY) {
    // Gravity & Movement
    this.x += this.vx;
    this.vy += this.gravity;
    this.y += this.vy;

    // Ground Collision
    if (this.y + this.height >= groundY) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Dash & Timers
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.bazookaCooldown > 0) this.bazookaCooldown--;
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;

    if (this.state === 'RAGE_TRANSFORM') {
      this.transformTimer--;
      if (this.transformTimer <= 0) {
        this.state = 'IDLE';
      }
    }

    // Update Bazooka Shell Trajectories
    this.bazookaProjectiles.forEach(shell => {
      if (!shell.active) return;
      shell.x += shell.vx;
      shell.y += shell.vy;

      // Trail particles
      if (Math.random() < 0.8) {
        this.particles.push(new Particle(
          shell.x, shell.y,
          -shell.vx * 0.2 + (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          Math.random() > 0.5 ? '#fbbf24' : '#ef4444',
          Math.random() * 6 + 3, 15
        ));
      }

      // Remove if traveled too far without hitting anything
      if (Math.abs(shell.x - shell.startX) > 1500) {
        shell.active = false;
      }
    });

    // Rage Mode Timer
    if (this.isRageMode) {
      this.rageTimer--;
      this.rage = (this.rageTimer / 400) * 100;
      this.createAuraParticles();

      if (this.rageTimer <= 0) {
        this.isRageMode = false;
        this.rage = 0;
        soundEngine.startBGM(false);
      }
    }

    // Attack frame countdown
    if (this.isAttacking) {
      this.attackFrame++;
      if (this.attackFrame > 15) {
        this.isAttacking = false;
        this.attackBox = null;
        if (this.state === 'SLASH' || this.state === 'DARK_CLAWS') {
          this.state = 'IDLE';
        }
      }
    }

    // Update internal particles
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => p.life > 0);
  }

  // --- PARTICLE CREATORS ---
  createAuraParticles() {
    if (Math.random() < 0.7) {
      const color = Math.random() > 0.4 ? '#a855f7' : '#ef4444';
      this.particles.push(new Particle(
        this.x + Math.random() * this.width,
        this.y + this.height - Math.random() * 20,
        (Math.random() - 0.5) * 2,
        -Math.random() * 4 - 2,
        color,
        Math.random() * 6 + 2,
        25
      ));
    }
  }

  createSlashParticles() {
    const color = this.isRageMode ? '#a855f7' : '#00d2ff';
    const attackX = this.facing === 'right' ? this.x + this.width + 10 : this.x - 10;
    for (let i = 0; i < 15; i++) {
      this.particles.push(new Particle(
        attackX,
        this.y + Math.random() * this.height,
        (this.facing === 'right' ? 1 : -1) * (Math.random() * 6 + 3),
        (Math.random() - 0.5) * 4,
        color,
        Math.random() * 5 + 2,
        18
      ));
    }
  }

  createDarkBlastParticles() {
    const attackX = this.facing === 'right' ? this.x + this.width : this.x;
    for (let i = 0; i < 30; i++) {
      this.particles.push(new Particle(
        attackX,
        this.y + Math.random() * this.height,
        (this.facing === 'right' ? 1 : -1) * (Math.random() * 12 + 6),
        (Math.random() - 0.5) * 8,
        Math.random() > 0.3 ? '#a855f7' : '#ef4444',
        Math.random() * 8 + 3,
        25
      ));
    }
  }

  createDashTrail() {
    const color = this.isRageMode ? 'rgba(168, 85, 247, 0.6)' : 'rgba(0, 210, 255, 0.6)';
    for (let i = 0; i < 8; i++) {
      this.particles.push(new Particle(
        this.x + Math.random() * this.width,
        this.y + Math.random() * this.height,
        0, 0, color, 8, 15, 'rect'
      ));
    }
  }

  createJumpParticles() {
    for (let i = 0; i < 10; i++) {
      this.particles.push(new Particle(
        this.x + this.width / 2,
        this.y + this.height,
        (Math.random() - 0.5) * 4,
        Math.random() * 2 + 1,
        'rgba(255, 255, 255, 0.5)',
        4, 15
      ));
    }
  }

  // --- RENDERING ---
  draw(ctx, cameraX) {
    // Render Bazooka Missiles
    this.bazookaProjectiles.forEach(shell => {
      if (!shell.active) return;
      ctx.save();
      const sx = shell.x - cameraX;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#fbbf24';
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(sx, shell.y, shell.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(sx, shell.y, shell.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw particles behind/around player
    this.particles.forEach(p => p.draw(ctx, cameraX));

    const sx = this.x - cameraX;
    const sy = this.y;
    const w = this.width;
    const h = this.height;
    const rage = this.isRageMode;
    const right = this.facing === 'right';
    const time = Date.now();

    ctx.save();

    // Invulnerability flashing
    if (this.invulnerableTimer % 4 > 2) {
      ctx.globalAlpha = 0.5;
    }

    // Aura glow
    ctx.shadowBlur = rage ? 30 : 12;
    ctx.shadowColor = rage ? '#a855f7' : '#00d2ff';

    // --- CAPE / CLOAK ---
    const capeDir = right ? -1 : 1;
    const capeWave = Math.sin(time / 150) * 4;
    const capeX = right ? sx - 4 : sx + w + 4;
    ctx.fillStyle = rage ? 'rgba(120, 30, 180, 0.6)' : 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.moveTo(capeX, sy + 14);
    ctx.quadraticCurveTo(capeX + capeDir * (14 + capeWave), sy + h * 0.5, capeX + capeDir * (8 + capeWave * 0.6), sy + h - 6);
    ctx.lineTo(capeX, sy + h - 18);
    ctx.closePath();
    ctx.fill();

    // --- LEGS (with walk animation) ---
    const isRunning = this.state === 'RUN';
    const legSwing = isRunning ? Math.sin(time / 80) * 6 : 0;
    const legY = sy + h - 24;
    const legW = 8;
    const legH = 24;

    // Left leg
    ctx.fillStyle = rage ? '#2e1065' : '#1e293b';
    ctx.save();
    ctx.translate(sx + 10, legY);
    ctx.rotate(legSwing * Math.PI / 180);
    ctx.fillRect(-legW / 2, 0, legW, legH);
    // Boot
    ctx.fillStyle = rage ? '#581c87' : '#334155';
    ctx.fillRect(-legW / 2 - 1, legH - 5, legW + 2, 5);
    ctx.restore();

    // Right leg
    ctx.fillStyle = rage ? '#2e1065' : '#1e293b';
    ctx.save();
    ctx.translate(sx + w - 10, legY);
    ctx.rotate(-legSwing * Math.PI / 180);
    ctx.fillRect(-legW / 2, 0, legW, legH);
    ctx.fillStyle = rage ? '#581c87' : '#334155';
    ctx.fillRect(-legW / 2 - 1, legH - 5, legW + 2, 5);
    ctx.restore();

    // --- TORSO / BODY ---
    const torsoY = sy + 16;
    const torsoH = h - 40;
    ctx.fillStyle = rage ? '#3b0764' : '#1e293b';
    // Rounded torso
    ctx.beginPath();
    ctx.roundRect(sx + 6, torsoY, w - 12, torsoH, [4, 4, 2, 2]);
    ctx.fill();

    // Armor stripe down the center
    ctx.fillStyle = rage ? '#a855f7' : '#00d2ff';
    ctx.fillRect(sx + w / 2 - 2, torsoY + 4, 4, torsoH - 8);

    // Belt
    ctx.fillStyle = rage ? '#7c3aed' : '#475569';
    ctx.fillRect(sx + 6, torsoY + torsoH - 6, w - 12, 5);

    // --- ARMS ---
    const armY = torsoY + 4;
    const armW = 7;
    const armH = 20;
    const attackSwing = this.isAttacking ? Math.sin(this.attackFrame / 15 * Math.PI) * 40 : 0;

    // Back arm
    ctx.fillStyle = rage ? '#4c1d95' : '#1e3a5f';
    const backArmX = right ? sx + 2 : sx + w - 2 - armW;
    ctx.save();
    ctx.translate(backArmX + armW / 2, armY);
    ctx.fillRect(-armW / 2, 0, armW, armH);
    ctx.restore();

    // Front arm (swings when attacking)
    ctx.fillStyle = rage ? '#4c1d95' : '#1e3a5f';
    const frontArmX = right ? sx + w - 2 - armW : sx + 2;
    ctx.save();
    ctx.translate(frontArmX + armW / 2, armY);
    ctx.rotate((right ? -1 : 1) * attackSwing * Math.PI / 180);
    ctx.fillRect(-armW / 2, 0, armW, armH);
    // Hand
    ctx.fillStyle = rage ? '#c084fc' : '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, armH, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- HEAD ---
    const headR = 11;
    const headCX = sx + w / 2;
    const headCY = sy + 12;

    // Head circle
    ctx.fillStyle = rage ? '#581c87' : '#334155';
    ctx.beginPath();
    ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
    ctx.fill();

    // Hair (spiky)
    ctx.fillStyle = rage ? '#a855f7' : '#1e293b';
    const hairDir = right ? 1 : -1;
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i - 2) * 0.35;
      const spikeLen = 7 + (i % 2) * 4;
      ctx.beginPath();
      ctx.moveTo(headCX + Math.cos(angle) * headR * 0.6, headCY + Math.sin(angle) * headR * 0.6);
      ctx.lineTo(headCX + Math.cos(angle - 0.15) * (headR + spikeLen), headCY + Math.sin(angle - 0.15) * (headR + spikeLen));
      ctx.lineTo(headCX + Math.cos(angle + 0.2) * headR * 0.8, headCY + Math.sin(angle + 0.2) * headR * 0.8);
      ctx.closePath();
      ctx.fill();
    }

    // Glowing Eyes
    ctx.fillStyle = rage ? '#ff0055' : '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = rage ? '#ff0055' : '#00f0ff';
    const eyeBaseX = right ? headCX + 2 : headCX - 8;
    ctx.fillRect(eyeBaseX, headCY - 2, 3, 3);
    ctx.fillRect(eyeBaseX + 4, headCY - 2, 3, 3);
    ctx.shadowBlur = 0;

    // --- SWORD (when attacking) ---
    if (this.isAttacking && this.attackBox) {
      ctx.save();
      const swordColor = rage ? '#ef4444' : '#00d2ff';
      ctx.strokeStyle = swordColor;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = swordColor;

      const swordStartX = right ? sx + w : sx;
      const swordEndX = right ? sx + w + 50 : sx - 50;
      const swordY = sy + 28;
      const swingAngle = Math.sin(this.attackFrame / 15 * Math.PI) * 25;

      ctx.beginPath();
      ctx.moveTo(swordStartX, swordY);
      ctx.lineTo(swordEndX, swordY - swingAngle);
      ctx.stroke();

      // Sword tip glow
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(swordEndX, swordY - swingAngle, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}
