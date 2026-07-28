/* ==========================================================================
   NOCTIS - ENEMIES & BOSS MALAKOR
   ========================================================================== */

class Enemy {
  constructor(x, y, type = 'walker') {
    this.x = x;
    this.y = y;
    this.type = type; // 'walker', 'caster', 'kaelen', 'umbra', 'boss'
    this.width = (type === 'boss' || type === 'umbra') ? 85 : 45;
    this.height = (type === 'boss' || type === 'umbra') ? 110 : 65;

    this.maxHp = type === 'boss' ? 600 : (type === 'umbra' ? 450 : (type === 'kaelen' ? 250 : (type === 'caster' ? 40 : 60)));
    this.hp = this.maxHp;
    this.vx = 0;
    this.vy = 0;
    this.speed = type === 'umbra' ? 6 : (type === 'boss' ? 3.5 : 3);

    this.attackCooldown = 0;
    this.isDead = false;
    this.facing = 'left';

    // Boss & Villain State
    this.phase = 1;
    this.bossState = 'IDLE';
    this.stateTimer = 0;

    this.projectiles = [];
  }

  update(player, groundY) {
    if (this.isDead) return;

    if (this.attackCooldown > 0) this.attackCooldown--;

    const distToPlayer = Math.abs(player.x - this.x);
    this.facing = player.x > this.x ? 'right' : 'left';

    if (this.type === 'walker') {
      if (distToPlayer < 400 && distToPlayer > 35) {
        this.vx = this.facing === 'right' ? this.speed : -this.speed;
      } else {
        this.vx = 0;
      }

      if (distToPlayer <= 45 && this.attackCooldown <= 0) {
        player.takeDamage(15);
        this.attackCooldown = 60;
      }
    } else if (this.type === 'caster') {
      if (distToPlayer < 500 && distToPlayer > 250) {
        this.vx = this.facing === 'right' ? this.speed : -this.speed;
      } else if (distToPlayer <= 200) {
        this.vx = this.facing === 'right' ? -this.speed : this.speed;
      } else {
        this.vx = 0;
      }

      if (distToPlayer < 450 && this.attackCooldown <= 0) {
        this.shootProjectile(player);
        this.attackCooldown = 110;
      }
    } else if (this.type === 'kaelen') {
      // Kaelen: Teleports & summons shadow marionette projectiles
      if (distToPlayer < 600 && this.attackCooldown <= 0) {
        this.shootProjectile(player);
        this.shootProjectile(player);
        this.attackCooldown = 80;
        soundEngine.playDarkPulse();
      }
      this.vx = (Math.sin(Date.now() / 300) * 2);
    } else if (this.type === 'umbra') {
      // Umbra Noctis: Dark Doppelgänger that mimics player dash & slashes
      if (distToPlayer > 50) {
        this.vx = this.facing === 'right' ? this.speed : -this.speed;
      } else {
        this.vx = 0;
        if (this.attackCooldown <= 0) {
          player.takeDamage(30);
          this.attackCooldown = 40;
          soundEngine.playSlash();
        }
      }

      // Random Shadow Dash
      if (Math.random() < 0.02 && this.attackCooldown <= 0) {
        this.x += this.facing === 'right' ? 140 : -140;
        soundEngine.playDash();
      }
    } else if (this.type === 'boss') {
      this.updateBossAI(player, groundY);
    }

    // Physics
    this.x += this.vx;
    this.y += this.vy;

    // Ground check
    if (this.y + this.height >= groundY) {
      this.y = groundY - this.height;
      this.vy = 0;
    }

    // Update projectiles
    this.projectiles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      const hitX = p.x >= player.x && p.x <= player.x + player.width;
      const hitY = p.y >= player.y && p.y <= player.y + player.height;
      if (hitX && hitY) {
        player.takeDamage(p.damage);
        p.active = false;
      }
    });
    this.projectiles = this.projectiles.filter(p => p.active && Math.abs(p.x - this.x) < 800);
  }

  updateBossAI(player, groundY) {
    const hpRatio = this.hp / this.maxHp;

    // Phase Transitions
    if (hpRatio <= 0.3) this.phase = 3;
    else if (hpRatio <= 0.65) this.phase = 2;
    else this.phase = 1;

    this.stateTimer++;

    const distToPlayer = Math.abs(player.x - this.x);

    // AI Logic by Phase
    if (this.bossState === 'IDLE') {
      if (this.stateTimer > 40) {
        this.stateTimer = 0;
        const rand = Math.random();

        if (this.phase === 1) {
          this.bossState = rand > 0.4 ? 'SLASH_ATTACK' : 'TELEPORT';
        } else if (this.phase === 2) {
          this.bossState = rand > 0.5 ? 'CHAOS_RAIN' : 'LASER_BEAM';
        } else {
          this.bossState = rand > 0.3 ? 'FRENZY_PULSE' : 'TELEPORT';
        }
      }
    } else if (this.bossState === 'TELEPORT') {
      // Teleport behind player
      this.x = player.x + (player.facing === 'right' ? -120 : 120);
      this.bossState = 'SLASH_ATTACK';
      this.stateTimer = 0;
      soundEngine.playDash();
    } else if (this.bossState === 'SLASH_ATTACK') {
      if (distToPlayer > 60) {
        this.vx = this.facing === 'right' ? 5 : -5;
      } else {
        this.vx = 0;
        if (this.attackCooldown <= 0) {
          player.takeDamage(25);
          this.attackCooldown = 50;
          soundEngine.playSlash();
        }
        if (this.stateTimer > 30) {
          this.bossState = 'IDLE';
          this.stateTimer = 0;
        }
      }
    } else if (this.bossState === 'CHAOS_RAIN') {
      this.vx = 0;
      if (this.stateTimer % 15 === 0) {
        this.shootProjectile(player);
      }
      if (this.stateTimer > 60) {
        this.bossState = 'IDLE';
        this.stateTimer = 0;
      }
    } else if (this.bossState === 'LASER_BEAM') {
      this.vx = 0;
      if (this.stateTimer === 20) {
        player.takeDamage(35);
        soundEngine.playDarkPulse();
      }
      if (this.stateTimer > 50) {
        this.bossState = 'IDLE';
        this.stateTimer = 0;
      }
    } else if (this.bossState === 'FRENZY_PULSE') {
      this.vx = this.facing === 'right' ? 7 : -7;
      if (distToPlayer < 80 && this.attackCooldown <= 0) {
        player.takeDamage(30);
        this.attackCooldown = 30;
        soundEngine.playHit();
      }
      if (this.stateTimer > 70) {
        this.bossState = 'IDLE';
        this.stateTimer = 0;
      }
    }
  }

  shootProjectile(player) {
    soundEngine.playDarkPulse();
    const dir = player.x > this.x ? 1 : -1;
    this.projectiles.push({
      x: this.x + (dir === 1 ? this.width : 0),
      y: this.y + 20,
      vx: dir * 7,
      vy: (Math.random() - 0.5) * 2,
      damage: 15,
      active: true
    });
  }

  takeDamage(amount) {
    this.hp -= amount;
    soundEngine.playHit();
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }

  draw(ctx, cameraX) {
    if (this.isDead) return;

    const sx = this.x - cameraX;
    const sy = this.y;
    const w = this.width;
    const h = this.height;
    const right = this.facing === 'right';
    const time = Date.now();

    // Draw Projectiles
    this.projectiles.forEach(p => {
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ef4444';
      ctx.beginPath();
      ctx.arc(p.x - cameraX, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();

    if (this.type === 'boss' || this.type === 'umbra' || this.type === 'kaelen') {
      const isUmbra = this.type === 'umbra';
      const isKaelen = this.type === 'kaelen';

      const glowColor = isUmbra ? '#ef4444' : (isKaelen ? '#a855f7' : (this.phase === 3 ? '#ef4444' : '#a855f7'));
      const bodyColor = isUmbra ? '#2a0808' : (isKaelen ? '#3b0764' : (this.phase === 3 ? '#450a0a' : '#1e1b4b'));
      const accentColor = isUmbra ? '#ff0033' : '#a855f7';

      ctx.shadowBlur = 20;
      ctx.shadowColor = glowColor;

      // --- BOSS CAPE ---
      const capeDir = right ? -1 : 1;
      const capeWave = Math.sin(time / 120) * 6;
      const capeX = right ? sx - 6 : sx + w + 6;
      ctx.fillStyle = isUmbra ? 'rgba(180, 20, 20, 0.4)' : 'rgba(100, 20, 180, 0.4)';
      ctx.beginPath();
      ctx.moveTo(capeX, sy + 18);
      ctx.quadraticCurveTo(capeX + capeDir * (22 + capeWave), sy + h * 0.5, capeX + capeDir * (16 + capeWave * 0.5), sy + h - 5);
      ctx.lineTo(capeX, sy + h - 20);
      ctx.closePath();
      ctx.fill();

      // --- BOSS LEGS ---
      const legY = sy + h - 30;
      ctx.fillStyle = bodyColor;
      ctx.fillRect(sx + 16, legY, 12, 30);
      ctx.fillRect(sx + w - 28, legY, 12, 30);
      // Boots
      ctx.fillStyle = accentColor;
      ctx.fillRect(sx + 14, legY + 24, 16, 6);
      ctx.fillRect(sx + w - 30, legY + 24, 16, 6);

      // --- BOSS TORSO (armored) ---
      const torsoY = sy + 22;
      const torsoH = h - 52;
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.roundRect(sx + 8, torsoY, w - 16, torsoH, [6, 6, 3, 3]);
      ctx.fill();

      // Armor rune lines
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6 + Math.sin(time / 300) * 0.3;
      ctx.beginPath();
      ctx.moveTo(sx + w / 2, torsoY + 6);
      ctx.lineTo(sx + w / 2, torsoY + torsoH - 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + 14, torsoY + torsoH / 2);
      ctx.lineTo(sx + w - 14, torsoY + torsoH / 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Shoulder pads
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(sx + 10, torsoY + 4, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx + w - 10, torsoY + 4, 8, 0, Math.PI * 2);
      ctx.fill();

      // --- BOSS ARMS ---
      ctx.fillStyle = bodyColor;
      ctx.fillRect(sx, torsoY + 8, 10, 28);
      ctx.fillRect(sx + w - 10, torsoY + 8, 10, 28);

      // --- BOSS HEAD ---
      const headR = 16;
      const headCX = sx + w / 2;
      const headCY = sy + 16;
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
      ctx.fill();

      // Horns
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.moveTo(sx + 14, sy + 8);
      ctx.lineTo(sx + 8, sy - 16);
      ctx.lineTo(sx + 22, sy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx + w - 14, sy + 8);
      ctx.lineTo(sx + w - 8, sy - 16);
      ctx.lineTo(sx + w - 22, sy + 4);
      ctx.closePath();
      ctx.fill();

      // Boss Eyes (glowing)
      ctx.fillStyle = isUmbra ? '#ff0000' : '#ff0055';
      ctx.shadowBlur = 12;
      ctx.shadowColor = isUmbra ? '#ff0000' : '#ff0055';
      const bossEyeX = right ? headCX + 2 : headCX - 12;
      ctx.fillRect(bossEyeX, headCY - 3, 4, 4);
      ctx.fillRect(bossEyeX + 6, headCY - 3, 4, 4);
      ctx.shadowBlur = 0;

      // Draw Overhead HP Bar & Name
      const barWidth = 140;
      const barX = sx + (w / 2) - (barWidth / 2);
      const barY = sy - 36;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX, barY, barWidth, 10);
      ctx.fillStyle = isUmbra ? '#ef4444' : '#a855f7';
      ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), 10);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(barX, barY, barWidth, 10);

      ctx.fillStyle = '#fff';
      ctx.font = '9px Orbitron';
      ctx.textAlign = 'center';
      const vName = isUmbra ? 'UMBRA NOCTIS' : (isKaelen ? 'KAELEN' : 'MALAKOR');
      ctx.fillText(vName, barX + (barWidth / 2), barY - 4);

    } else {
      // ===== STANDARD MINIONS =====
      const isWalker = this.type === 'walker';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ef4444';

      if (isWalker) {
        // --- SHADOW WALKER: hunched creature ---
        // Legs
        const legSwing = Math.sin(time / 100) * 5;
        ctx.fillStyle = '#0a0f1a';
        ctx.save();
        ctx.translate(sx + 10, sy + h - 20);
        ctx.rotate(legSwing * Math.PI / 180);
        ctx.fillRect(-4, 0, 8, 20);
        ctx.restore();
        ctx.save();
        ctx.translate(sx + w - 10, sy + h - 20);
        ctx.rotate(-legSwing * Math.PI / 180);
        ctx.fillRect(-4, 0, 8, 20);
        ctx.restore();

        // Body (hunched oval)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h / 2 - 2, w / 2 - 2, h / 2 - 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head (smaller, forward-leaning)
        const headOff = right ? 8 : -8;
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(sx + w / 2 + headOff, sy + 14, 10, 0, Math.PI * 2);
        ctx.fill();

        // Claws
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        const clawX = right ? sx + w + 2 : sx - 2;
        const clawDir = right ? 1 : -1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(clawX, sy + 26 + i * 6);
          ctx.lineTo(clawX + clawDir * 10, sy + 22 + i * 6);
          ctx.stroke();
        }

        // Red eyes
        ctx.fillStyle = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ef4444';
        const eyeX = right ? sx + w / 2 + headOff + 2 : sx + w / 2 + headOff - 6;
        ctx.fillRect(eyeX, sy + 12, 2, 3);
        ctx.fillRect(eyeX + 3, sy + 12, 2, 3);

      } else {
        // --- SHADE CASTER: hooded mage ---
        // Robe body (triangular)
        ctx.fillStyle = '#581c87';
        ctx.beginPath();
        ctx.moveTo(sx + w / 2, sy + 18);
        ctx.lineTo(sx - 2, sy + h);
        ctx.lineTo(sx + w + 2, sy + h);
        ctx.closePath();
        ctx.fill();

        // Hood
        ctx.fillStyle = '#3b0764';
        ctx.beginPath();
        ctx.arc(sx + w / 2, sy + 16, 13, 0, Math.PI * 2);
        ctx.fill();

        // Hood point
        ctx.beginPath();
        ctx.moveTo(sx + w / 2 - 8, sy + 6);
        ctx.lineTo(sx + w / 2, sy - 8);
        ctx.lineTo(sx + w / 2 + 8, sy + 6);
        ctx.closePath();
        ctx.fill();

        // Glowing eyes inside hood
        ctx.fillStyle = '#c084fc';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#c084fc';
        const mEyeX = right ? sx + w / 2 + 1 : sx + w / 2 - 7;
        ctx.fillRect(mEyeX, sy + 15, 2, 3);
        ctx.fillRect(mEyeX + 4, sy + 15, 2, 3);

        // Staff
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        const staffX = right ? sx + w + 4 : sx - 4;
        ctx.beginPath();
        ctx.moveTo(staffX, sy + 10);
        ctx.lineTo(staffX, sy + h - 5);
        ctx.stroke();
        // Staff orb
        ctx.fillStyle = '#c084fc';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#a855f7';
        ctx.beginPath();
        ctx.arc(staffX, sy + 8, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      // Health Bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(sx, sy - 10, w, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(sx, sy - 10, w * (this.hp / this.maxHp), 5);
    }

    ctx.restore();
  }
}
