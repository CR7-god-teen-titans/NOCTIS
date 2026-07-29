/* ==========================================================================
   NOCTIS - ENEMIES & VILLAINS
   Types: walker, caster, kaelen, umbra, boss (Malakor),
          dark_crow, zephyr, nyx, void_boss, silas_boss
   ========================================================================== */

const BOSS_TYPES = ['boss', 'umbra', 'kaelen', 'dark_crow', 'zephyr', 'nyx', 'void_boss', 'silas_boss'];

class Enemy {
  constructor(x, y, type = 'walker') {
    this.x = x;
    this.y = y;
    this.type = type;

    // Size config per type
    const sizes = {
      walker: { w: 45, h: 65 },
      caster: { w: 45, h: 65 },
      phantom: { w: 40, h: 50 },
      brute: { w: 60, h: 75 },
      crawler: { w: 50, h: 30 },
      bomber: { w: 40, h: 50 },
      sentinel: { w: 50, h: 70 },
      wraith: { w: 40, h: 55 },
      kaelen: { w: 75, h: 100 },
      umbra: { w: 85, h: 110 },
      boss: { w: 85, h: 110 },
      dark_crow: { w: 80, h: 105 },
      zephyr: { w: 60, h: 90 },
      nyx: { w: 80, h: 110 },
      void_boss: { w: 95, h: 120 },
      silas_boss: { w: 65, h: 95 }
    };
    const sz = sizes[type] || sizes.walker;
    this.width = sz.w;
    this.height = sz.h;

    // HP config per type
    const hpMap = {
      walker: 60, caster: 40, phantom: 50, brute: 120, crawler: 35,
      bomber: 30, sentinel: 80, wraith: 45, kaelen: 250, umbra: 450, boss: 600,
      dark_crow: 500, zephyr: 350, nyx: 700, void_boss: 900, silas_boss: 400
    };
    this.maxHp = hpMap[type] || 60;
    this.hp = this.maxHp;
    this.vx = 0;
    this.vy = 0;

    const speedMap = {
      walker: 3, caster: 3, phantom: 4, brute: 2, crawler: 5.5,
      bomber: 3.5, sentinel: 2.5, wraith: 6, kaelen: 3, umbra: 6, boss: 3.5,
      dark_crow: 4, zephyr: 7, nyx: 3, void_boss: 2.5, silas_boss: 5.5
    };
    this.speed = speedMap[type] || 3;

    this.attackCooldown = 0;
    this.isDead = false;
    this.facing = 'left';

    // Boss & Villain State
    this.phase = 1;
    this.bossState = 'IDLE';
    this.stateTimer = 0;

    this.projectiles = [];
  }

  isBossType() {
    return BOSS_TYPES.includes(this.type);
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
    } else if (this.type === 'phantom') {
      if (distToPlayer < 600) {
        this.vx = this.facing === 'right' ? this.speed : -this.speed;
        this.vy = Math.sin(Date.now() / 150) * 2;
        if (distToPlayer <= 40 && Math.abs(player.y - this.y) < 60 && this.attackCooldown <= 0) {
          player.takeDamage(15);
          this.attackCooldown = 60;
        }
      } else {
        this.vx = 0;
        this.vy = 0;
      }
    } else if (this.type === 'brute') {
      if (distToPlayer < 500 && distToPlayer > 55) {
        this.vx = this.facing === 'right' ? this.speed : -this.speed;
      } else {
        this.vx = 0;
      }
      if (distToPlayer <= 60 && this.attackCooldown <= 0) {
        player.takeDamage(25);
        this.attackCooldown = 90;
        soundEngine.playHit();
      }
    } else if (this.type === 'crawler') {
      if (distToPlayer < 400 && distToPlayer > 60) {
        this.vx = this.facing === 'right' ? this.speed : -this.speed;
      } else {
        this.vx = 0;
      }
      if (distToPlayer <= 100 && this.attackCooldown <= 0) {
        this.vy = -6;
        this.vx = this.facing === 'right' ? 6 : -6;
        this.attackCooldown = 80;
        soundEngine.playDash();
      } else if (this.y < groundY - this.height) {
        this.vy += 0.4;
      }
      if (distToPlayer <= 45 && Math.abs(player.y - this.y) < 40 && this.attackCooldown > 50) {
        player.takeDamage(12);
        this.attackCooldown = 40;
        soundEngine.playHit();
      }
    } else if (this.type === 'bomber') {
      if (distToPlayer < 500) {
        this.vx = this.facing === 'right' ? this.speed : -this.speed;
        if (distToPlayer < 40 && Math.abs(player.y - this.y) < 50) {
          player.takeDamage(20);
          this.hp = 0;
          this.isDead = true;
          soundEngine.playHit();
        }
      } else {
        this.vx = 0;
      }
    } else if (this.type === 'sentinel') {
      this.stateTimer++;
      if (this.stateTimer < 120) {
        if (distToPlayer < 400 && distToPlayer > 50) {
          this.vx = this.facing === 'right' ? this.speed * 0.5 : -this.speed * 0.5;
        } else {
          this.vx = 0;
        }
      } else if (this.stateTimer < 180) {
        this.vx = this.facing === 'right' ? this.speed * 1.5 : -this.speed * 1.5;
        if (distToPlayer <= 50 && this.attackCooldown <= 0) {
          player.takeDamage(15);
          this.attackCooldown = 60;
          soundEngine.playSlash();
        }
      } else {
        this.stateTimer = 0;
      }
    } else if (this.type === 'wraith') {
      this.stateTimer++;
      const targetY = player.y - 120;
      if (this.stateTimer < 100) {
        if (distToPlayer > 30) this.vx = this.facing === 'right' ? this.speed : -this.speed;
        else this.vx = 0;
        this.vy = (targetY - this.y) * 0.05;
      } else if (this.stateTimer < 140) {
        this.vx = this.facing === 'right' ? 7 : -7;
        this.vy = 6;
        if (distToPlayer <= 45 && Math.abs(player.y - this.y) < 50 && this.attackCooldown <= 0) {
          player.takeDamage(15);
          this.attackCooldown = 60;
          soundEngine.playSlash();
        }
      } else if (this.stateTimer < 180) {
        this.vy = -5;
        this.vx = 0;
      } else {
        this.stateTimer = 0;
      }
    } else if (this.type === 'kaelen') {
      if (distToPlayer < 600 && this.attackCooldown <= 0) {
        this.shootProjectile(player);
        this.shootProjectile(player);
        this.attackCooldown = 80;
        soundEngine.playDarkPulse();
      }
      this.vx = (Math.sin(Date.now() / 300) * 2);
    } else if (this.type === 'umbra') {
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
      if (Math.random() < 0.02 && this.attackCooldown <= 0) {
        this.x += this.facing === 'right' ? 140 : -140;
        soundEngine.playDash();
      }
    } else if (this.type === 'boss') {
      this.updateBossAI(player, groundY);
    } else if (this.type === 'dark_crow') {
      this.updateDarkCrowAI(player, groundY);
    } else if (this.type === 'zephyr') {
      this.updateZephyrAI(player, groundY);
    } else if (this.type === 'nyx') {
      this.updateNyxAI(player, groundY);
    } else if (this.type === 'void_boss') {
      this.updateVoidAI(player, groundY);
    } else if (this.type === 'silas_boss') {
      this.updateSilasAI(player, groundY);
    }

    // Physics
    this.x += this.vx;
    this.y += this.vy;

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

  // ===== MALAKOR BOSS AI =====
  updateBossAI(player, groundY) {
    const hpRatio = this.hp / this.maxHp;
    if (hpRatio <= 0.3) this.phase = 3;
    else if (hpRatio <= 0.65) this.phase = 2;
    else this.phase = 1;

    this.stateTimer++;
    const distToPlayer = Math.abs(player.x - this.x);

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
        if (this.stateTimer > 30) { this.bossState = 'IDLE'; this.stateTimer = 0; }
      }
    } else if (this.bossState === 'CHAOS_RAIN') {
      this.vx = 0;
      if (this.stateTimer % 15 === 0) this.shootProjectile(player);
      if (this.stateTimer > 60) { this.bossState = 'IDLE'; this.stateTimer = 0; }
    } else if (this.bossState === 'LASER_BEAM') {
      this.vx = 0;
      if (this.stateTimer === 20) { player.takeDamage(35); soundEngine.playDarkPulse(); }
      if (this.stateTimer > 50) { this.bossState = 'IDLE'; this.stateTimer = 0; }
    } else if (this.bossState === 'FRENZY_PULSE') {
      this.vx = this.facing === 'right' ? 7 : -7;
      if (distToPlayer < 80 && this.attackCooldown <= 0) {
        player.takeDamage(30);
        this.attackCooldown = 30;
        soundEngine.playHit();
      }
      if (this.stateTimer > 70) { this.bossState = 'IDLE'; this.stateTimer = 0; }
    }
  }

  // ===== DARK CROW AI — Swooping attacks + feather storm =====
  updateDarkCrowAI(player, groundY) {
    const hpRatio = this.hp / this.maxHp;
    this.phase = hpRatio <= 0.4 ? 2 : 1;
    this.stateTimer++;
    const dist = Math.abs(player.x - this.x);

    if (this.bossState === 'IDLE') {
      this.vx = Math.sin(Date.now() / 400) * 3;
      if (this.stateTimer > 50) {
        this.stateTimer = 0;
        const r = Math.random();
        this.bossState = r > 0.6 ? 'SWOOP' : (r > 0.3 ? 'FEATHER_STORM' : 'SHADOW_DIVE');
      }
    } else if (this.bossState === 'SWOOP') {
      // Fast diagonal charge toward player
      this.vx = this.facing === 'right' ? 8 : -8;
      if (dist < 60 && this.attackCooldown <= 0) {
        player.takeDamage(28);
        this.attackCooldown = 45;
        soundEngine.playSlash();
      }
      if (this.stateTimer > 35) { this.bossState = 'IDLE'; this.stateTimer = 0; }
    } else if (this.bossState === 'FEATHER_STORM') {
      this.vx = 0;
      if (this.stateTimer % 10 === 0) {
        // Shoot 3 feathers in spread
        for (let i = -1; i <= 1; i++) {
          this.projectiles.push({
            x: this.x + this.width / 2,
            y: this.y + 30,
            vx: (player.x > this.x ? 6 : -6),
            vy: i * 2.5,
            damage: 12,
            active: true,
            color: '#7c3aed'
          });
        }
        soundEngine.playDarkPulse();
      }
      if (this.stateTimer > 40) { this.bossState = 'IDLE'; this.stateTimer = 0; }
    } else if (this.bossState === 'SHADOW_DIVE') {
      // Teleport above player and dive
      if (this.stateTimer === 1) {
        this.x = player.x;
        this.y = player.y - 200;
        soundEngine.playDash();
      }
      this.vy = 10;
      if (dist < 50 && this.y + this.height >= player.y) {
        if (this.attackCooldown <= 0) {
          player.takeDamage(this.phase === 2 ? 40 : 32);
          this.attackCooldown = 60;
          soundEngine.playHit();
        }
      }
      if (this.stateTimer > 30) { this.bossState = 'IDLE'; this.stateTimer = 0; this.vy = 0; }
    }
  }

  // ===== ZEPHYR AI — Ultra-fast assassin, hit and run =====
  updateZephyrAI(player, groundY) {
    this.stateTimer++;
    const dist = Math.abs(player.x - this.x);

    if (this.bossState === 'IDLE') {
      // Circle player at distance
      this.vx = Math.sin(Date.now() / 200) * this.speed;
      if (this.stateTimer > 30) {
        this.stateTimer = 0;
        this.bossState = Math.random() > 0.5 ? 'DASH_STRIKE' : 'KNIFE_THROW';
      }
    } else if (this.bossState === 'DASH_STRIKE') {
      // Lightning-fast dash through player
      this.vx = this.facing === 'right' ? 12 : -12;
      if (dist < 40 && this.attackCooldown <= 0) {
        player.takeDamage(22);
        this.attackCooldown = 35;
        soundEngine.playSlash();
      }
      if (this.stateTimer > 20) {
        this.bossState = 'IDLE';
        this.stateTimer = 0;
        this.vx = -(this.vx); // reverse direction
      }
    } else if (this.bossState === 'KNIFE_THROW') {
      this.vx = 0;
      if (this.stateTimer % 8 === 0) {
        this.shootProjectile(player);
      }
      if (this.stateTimer > 32) { this.bossState = 'IDLE'; this.stateTimer = 0; }
    }
  }

  // ===== NYX AI — Shadow queen, dark magic caster =====
  updateNyxAI(player, groundY) {
    const hpRatio = this.hp / this.maxHp;
    this.phase = hpRatio <= 0.3 ? 3 : (hpRatio <= 0.6 ? 2 : 1);
    this.stateTimer++;
    const dist = Math.abs(player.x - this.x);

    if (this.bossState === 'IDLE') {
      this.vx = Math.sin(Date.now() / 500) * 2;
      if (this.stateTimer > 45) {
        this.stateTimer = 0;
        const r = Math.random();
        if (this.phase === 1) {
          this.bossState = r > 0.5 ? 'DARK_WAVE' : 'TELEPORT';
        } else if (this.phase === 2) {
          this.bossState = r > 0.4 ? 'SHADOW_CHAINS' : 'DARK_WAVE';
        } else {
          this.bossState = r > 0.3 ? 'NIGHT_STORM' : 'TELEPORT';
        }
      }
    } else if (this.bossState === 'TELEPORT') {
      this.x = player.x + (Math.random() > 0.5 ? 150 : -150);
      this.bossState = 'DARK_WAVE';
      this.stateTimer = 0;
      soundEngine.playDash();
    } else if (this.bossState === 'DARK_WAVE') {
      this.vx = 0;
      if (this.stateTimer % 12 === 0) {
        for (let i = -2; i <= 2; i++) {
          this.projectiles.push({
            x: this.x + this.width / 2,
            y: this.y + 40,
            vx: i * 3,
            vy: 4,
            damage: 18,
            active: true,
            color: '#c026d3'
          });
        }
        soundEngine.playDarkPulse();
      }
      if (this.stateTimer > 36) { this.bossState = 'IDLE'; this.stateTimer = 0; }
    } else if (this.bossState === 'SHADOW_CHAINS') {
      this.vx = this.facing === 'right' ? 4 : -4;
      if (dist < 90 && this.attackCooldown <= 0) {
        player.takeDamage(35);
        this.attackCooldown = 55;
        soundEngine.playSlash();
      }
      if (this.stateTimer > 50) { this.bossState = 'IDLE'; this.stateTimer = 0; }
    } else if (this.bossState === 'NIGHT_STORM') {
      this.vx = 0;
      if (this.stateTimer % 6 === 0) {
        this.projectiles.push({
          x: player.x + (Math.random() - 0.5) * 200,
          y: player.y - 300,
          vx: 0,
          vy: 8,
          damage: 20,
          active: true,
          color: '#a855f7'
        });
      }
      if (this.stateTimer > 55) { this.bossState = 'IDLE'; this.stateTimer = 0; }
    }
  }

  // ===== VOID AI — Cosmic entity, slow but devastating =====
  updateVoidAI(player, groundY) {
    const hpRatio = this.hp / this.maxHp;
    this.phase = hpRatio <= 0.25 ? 3 : (hpRatio <= 0.5 ? 2 : 1);
    this.stateTimer++;
    const dist = Math.abs(player.x - this.x);

    if (this.bossState === 'IDLE') {
      this.vx = 0;
      if (this.stateTimer > 35) {
        this.stateTimer = 0;
        const r = Math.random();
        if (this.phase === 1) {
          this.bossState = r > 0.5 ? 'VOID_BEAM' : 'GRAVITY_PULL';
        } else if (this.phase === 2) {
          this.bossState = r > 0.4 ? 'SINGULARITY' : 'VOID_BEAM';
        } else {
          this.bossState = r > 0.3 ? 'ANNIHILATE' : 'SINGULARITY';
        }
      }
    } else if (this.bossState === 'VOID_BEAM') {
      this.vx = 0;
      if (this.stateTimer === 15) {
        player.takeDamage(40);
        soundEngine.playDarkPulse();
      }
      if (this.stateTimer > 45) { this.bossState = 'IDLE'; this.stateTimer = 0; }
    } else if (this.bossState === 'GRAVITY_PULL') {
      // Pull player toward Void
      if (dist > 60) {
        const pull = player.x > this.x ? -3 : 3;
        player.x += pull;
      } else if (this.attackCooldown <= 0) {
        player.takeDamage(30);
        this.attackCooldown = 50;
        soundEngine.playHit();
      }
      if (this.stateTimer > 60) { this.bossState = 'IDLE'; this.stateTimer = 0; }
    } else if (this.bossState === 'SINGULARITY') {
      this.vx = 0;
      if (this.stateTimer % 8 === 0) {
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2;
          this.projectiles.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            vx: Math.cos(angle) * 5,
            vy: Math.sin(angle) * 5,
            damage: 15,
            active: true,
            color: '#06b6d4'
          });
        }
        soundEngine.playDarkPulse();
      }
      if (this.stateTimer > 48) { this.bossState = 'IDLE'; this.stateTimer = 0; }
    } else if (this.bossState === 'ANNIHILATE') {
      this.vx = this.facing === 'right' ? 5 : -5;
      if (dist < 100 && this.attackCooldown <= 0) {
        player.takeDamage(50);
        this.attackCooldown = 70;
        soundEngine.playSlash();
        soundEngine.playDarkPulse();
      }
      if (this.stateTimer > 60) { this.bossState = 'IDLE'; this.stateTimer = 0; }
    }
  }

  // ===== SILAS BOSS AI — Fast assassin, dual daggers =====
  updateSilasAI(player, groundY) {
    this.stateTimer++;
    const dist = Math.abs(player.x - this.x);

    if (this.bossState === 'IDLE') {
      this.vx = Math.sin(Date.now() / 250) * 4;
      if (this.stateTimer > 25) {
        this.stateTimer = 0;
        const r = Math.random();
        this.bossState = r > 0.5 ? 'SHADOW_STEP' : (r > 0.2 ? 'DAGGER_RUSH' : 'SMOKE_BOMB');
      }
    } else if (this.bossState === 'SHADOW_STEP') {
      // Teleport behind player
      this.x = player.x + (player.facing === 'right' ? -80 : 80);
      this.bossState = 'DAGGER_RUSH';
      this.stateTimer = 0;
      soundEngine.playDash();
    } else if (this.bossState === 'DAGGER_RUSH') {
      this.vx = this.facing === 'right' ? 9 : -9;
      if (dist < 50 && this.attackCooldown <= 0) {
        player.takeDamage(20);
        this.attackCooldown = 25;
        soundEngine.playSlash();
      }
      if (this.stateTimer > 25) { this.bossState = 'IDLE'; this.stateTimer = 0; }
    } else if (this.bossState === 'SMOKE_BOMB') {
      this.vx = 0;
      if (this.stateTimer % 12 === 0) {
        this.shootProjectile(player);
      }
      // Randomly reposition
      if (this.stateTimer === 15) {
        this.x += (Math.random() > 0.5 ? 120 : -120);
        soundEngine.playDash();
      }
      if (this.stateTimer > 36) { this.bossState = 'IDLE'; this.stateTimer = 0; }
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
    if (this.type === 'sentinel' && this.stateTimer < 120) {
      amount = amount / 2;
    }
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
      ctx.fillStyle = p.color || '#ef4444';
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color || '#ef4444';
      ctx.beginPath();
      ctx.arc(p.x - cameraX, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();

    if (this.isBossType()) {
      this.drawBoss(ctx, sx, sy, w, h, right, time);
    } else {
      this.drawMinion(ctx, sx, sy, w, h, right, time);
    }

    ctx.restore();
  }

  drawBoss(ctx, sx, sy, w, h, right, time) {
    // Per-boss color config
    const configs = {
      boss:       { glow: '#a855f7', body: '#1e1b4b', accent: '#a855f7', name: 'MALAKOR',      hpColor: '#a855f7' },
      umbra:      { glow: '#ef4444', body: '#2a0808', accent: '#ff0033', name: 'UMBRA NOCTIS',  hpColor: '#ef4444' },
      kaelen:     { glow: '#a855f7', body: '#3b0764', accent: '#a855f7', name: 'KAELEN',        hpColor: '#a855f7' },
      dark_crow:  { glow: '#7c3aed', body: '#1a1025', accent: '#7c3aed', name: 'THE DARK CROW', hpColor: '#7c3aed' },
      zephyr:     { glow: '#06b6d4', body: '#0c4a6e', accent: '#22d3ee', name: 'ZEPHYR',        hpColor: '#06b6d4' },
      nyx:        { glow: '#c026d3', body: '#3b0764', accent: '#d946ef', name: 'NYX',           hpColor: '#c026d3' },
      void_boss:  { glow: '#06b6d4', body: '#020617', accent: '#06b6d4', name: 'VOID',          hpColor: '#0ea5e9' },
      silas_boss: { glow: '#10b981', body: '#064e3b', accent: '#10b981', name: 'SILAS KANE',    hpColor: '#10b981' }
    };
    const cfg = configs[this.type] || configs.boss;

    ctx.shadowBlur = 20;
    ctx.shadowColor = cfg.glow;

    // --- CAPE ---
    const capeDir = right ? -1 : 1;
    const capeWave = Math.sin(time / 120) * 6;
    const capeX = right ? sx - 6 : sx + w + 6;

    if (this.type === 'dark_crow') {
      // Feathered wing-cape
      ctx.fillStyle = 'rgba(30, 15, 45, 0.6)';
      for (let f = 0; f < 5; f++) {
        const fw = Math.sin(time / (100 + f * 20)) * 4;
        ctx.beginPath();
        ctx.moveTo(capeX, sy + 15 + f * 12);
        ctx.quadraticCurveTo(capeX + capeDir * (25 + fw + f * 3), sy + 20 + f * 12, capeX + capeDir * (18 + fw), sy + 25 + f * 12);
        ctx.lineTo(capeX, sy + 22 + f * 12);
        ctx.closePath();
        ctx.fill();
      }
    } else if (this.type === 'nyx') {
      // Flowing shadow-silk cape
      ctx.fillStyle = 'rgba(120, 20, 160, 0.4)';
      ctx.beginPath();
      ctx.moveTo(capeX, sy + 10);
      ctx.bezierCurveTo(capeX + capeDir * (30 + capeWave), sy + h * 0.3, capeX + capeDir * (20 - capeWave), sy + h * 0.7, capeX + capeDir * (15 + capeWave * 0.5), sy + h + 5);
      ctx.lineTo(capeX, sy + h - 10);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'void_boss') {
      // Cosmic energy tendrils
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 3;
      for (let t2 = 0; t2 < 4; t2++) {
        const tw = Math.sin(time / (150 + t2 * 40) + t2) * 8;
        ctx.beginPath();
        ctx.moveTo(capeX, sy + 20 + t2 * 18);
        ctx.quadraticCurveTo(capeX + capeDir * (30 + tw), sy + 30 + t2 * 18, capeX + capeDir * (20 + tw * 0.5), sy + 40 + t2 * 18);
        ctx.stroke();
      }
    } else {
      // Default cape
      ctx.fillStyle = `rgba(${this.type === 'silas_boss' ? '16,185,129' : '100,20,180'}, 0.4)`;
      ctx.beginPath();
      ctx.moveTo(capeX, sy + 18);
      ctx.quadraticCurveTo(capeX + capeDir * (22 + capeWave), sy + h * 0.5, capeX + capeDir * (16 + capeWave * 0.5), sy + h - 5);
      ctx.lineTo(capeX, sy + h - 20);
      ctx.closePath();
      ctx.fill();
    }

    // --- LEGS ---
    const legY = sy + h - 30;
    ctx.fillStyle = cfg.body;
    ctx.fillRect(sx + 16, legY, 12, 30);
    ctx.fillRect(sx + w - 28, legY, 12, 30);
    ctx.fillStyle = cfg.accent;
    ctx.fillRect(sx + 14, legY + 24, 16, 6);
    ctx.fillRect(sx + w - 30, legY + 24, 16, 6);

    // --- TORSO ---
    const torsoY = sy + 22;
    const torsoH = h - 52;
    ctx.fillStyle = cfg.body;
    ctx.beginPath();
    ctx.roundRect(sx + 8, torsoY, w - 16, torsoH, [6, 6, 3, 3]);
    ctx.fill();

    // Armor details per type
    ctx.strokeStyle = cfg.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6 + Math.sin(time / 300) * 0.3;

    if (this.type === 'dark_crow') {
      // V-shaped crow emblem
      ctx.beginPath();
      ctx.moveTo(sx + 14, torsoY + 8);
      ctx.lineTo(sx + w / 2, torsoY + torsoH - 10);
      ctx.lineTo(sx + w - 14, torsoY + 8);
      ctx.stroke();
    } else if (this.type === 'void_boss') {
      // Spiral cosmic symbol
      ctx.beginPath();
      ctx.arc(sx + w / 2, torsoY + torsoH / 2, 12, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx + w / 2, torsoY + torsoH / 2, 7, Math.PI, Math.PI * 2.5);
      ctx.stroke();
    } else if (this.type === 'nyx') {
      // Crescent moon
      ctx.beginPath();
      ctx.arc(sx + w / 2, torsoY + torsoH / 2, 10, -Math.PI * 0.7, Math.PI * 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx + w / 2 + 5, torsoY + torsoH / 2, 8, -Math.PI * 0.7, Math.PI * 0.7);
      ctx.stroke();
    } else {
      // Default cross pattern
      ctx.beginPath();
      ctx.moveTo(sx + w / 2, torsoY + 6);
      ctx.lineTo(sx + w / 2, torsoY + torsoH - 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + 14, torsoY + torsoH / 2);
      ctx.lineTo(sx + w - 14, torsoY + torsoH / 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Shoulder pads
    ctx.fillStyle = cfg.accent;
    ctx.beginPath(); ctx.arc(sx + 10, torsoY + 4, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + w - 10, torsoY + 4, 8, 0, Math.PI * 2); ctx.fill();

    // --- ARMS ---
    ctx.fillStyle = cfg.body;
    ctx.fillRect(sx, torsoY + 8, 10, 28);
    ctx.fillRect(sx + w - 10, torsoY + 8, 10, 28);

    // --- HEAD ---
    const headR = this.type === 'void_boss' ? 18 : 16;
    const headCX = sx + w / 2;
    const headCY = sy + 16;
    ctx.fillStyle = cfg.body;
    ctx.beginPath();
    ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
    ctx.fill();

    // Head details per type
    if (this.type === 'dark_crow') {
      // Crow mask/beak
      ctx.fillStyle = '#2d1b4e';
      const beakDir = right ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(headCX + beakDir * 8, headCY);
      ctx.lineTo(headCX + beakDir * 22, headCY + 2);
      ctx.lineTo(headCX + beakDir * 8, headCY + 6);
      ctx.closePath();
      ctx.fill();
      // Feather crest
      ctx.fillStyle = '#4c1d95';
      for (let f = 0; f < 3; f++) {
        ctx.beginPath();
        ctx.moveTo(headCX - 4 + f * 4, headCY - headR + 2);
        ctx.lineTo(headCX - 2 + f * 4, headCY - headR - 12 - f * 3);
        ctx.lineTo(headCX + f * 4, headCY - headR + 2);
        ctx.closePath();
        ctx.fill();
      }
    } else if (this.type === 'zephyr') {
      // Assassin mask (half-face)
      ctx.fillStyle = '#155e75';
      ctx.beginPath();
      ctx.arc(headCX, headCY + 3, headR - 2, 0, Math.PI);
      ctx.fill();
      // Wind-swept hair
      ctx.fillStyle = '#22d3ee';
      const hairDir = right ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(headCX + hairDir * 6, headCY - headR + 4);
      ctx.quadraticCurveTo(headCX + hairDir * (22 + Math.sin(time / 100) * 5), headCY - 6, headCX + hairDir * 18, headCY + 4);
      ctx.lineTo(headCX + hairDir * 4, headCY - 2);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'nyx') {
      // Crown of shadow thorns
      ctx.fillStyle = '#d946ef';
      for (let t2 = 0; t2 < 5; t2++) {
        const a = (-0.6 + t2 * 0.3) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(headCX + Math.cos(a) * (headR - 2), headCY + Math.sin(a) * (headR - 2));
        ctx.lineTo(headCX + Math.cos(a) * (headR + 10 + Math.sin(time / 200 + t2) * 3), headCY + Math.sin(a) * (headR + 10));
        ctx.lineTo(headCX + Math.cos(a + 0.1) * (headR - 2), headCY + Math.sin(a + 0.1) * (headR - 2));
        ctx.closePath();
        ctx.fill();
      }
      // Long hair
      ctx.fillStyle = '#86198f';
      const nhDir = right ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(headCX + nhDir * 8, headCY - 4);
      ctx.quadraticCurveTo(headCX + nhDir * 24, headCY + 20, headCX + nhDir * 18, headCY + 35);
      ctx.lineTo(headCX + nhDir * 6, headCY + 10);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'void_boss') {
      // Floating cosmic eye in head
      ctx.fillStyle = '#0ea5e9';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#0ea5e9';
      const eyePulse = Math.sin(time / 200) * 3;
      ctx.beginPath();
      ctx.ellipse(headCX, headCY, 8 + eyePulse, 5 + eyePulse * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(headCX, headCY, 3, 0, Math.PI * 2);
      ctx.fill();
      // Void tendrils from head
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      for (let t2 = 0; t2 < 4; t2++) {
        const a = (t2 / 4) * Math.PI * 2 + time / 500;
        ctx.beginPath();
        ctx.moveTo(headCX, headCY - headR);
        ctx.quadraticCurveTo(headCX + Math.cos(a) * 20, headCY - headR - 15, headCX + Math.cos(a + 0.5) * 15, headCY - headR - 25);
        ctx.stroke();
      }
    } else if (this.type === 'silas_boss') {
      // Silas hood (same as ally but darker)
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.arc(headCX, headCY - 2, headR + 3, -Math.PI, 0);
      ctx.lineTo(headCX + headR + 3, headCY + 2);
      ctx.lineTo(headCX - headR - 3, headCY + 2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(headCX - 6, headCY - 8);
      ctx.lineTo(headCX, headCY - 20);
      ctx.lineTo(headCX + 6, headCY - 8);
      ctx.closePath();
      ctx.fill();
    } else {
      // Default horns (Malakor, Kaelen, Umbra)
      ctx.fillStyle = cfg.accent;
      ctx.beginPath();
      ctx.moveTo(sx + 14, sy + 8); ctx.lineTo(sx + 8, sy - 16); ctx.lineTo(sx + 22, sy + 4);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx + w - 14, sy + 8); ctx.lineTo(sx + w - 8, sy - 16); ctx.lineTo(sx + w - 22, sy + 4);
      ctx.closePath(); ctx.fill();
    }

    // Boss Eyes
    ctx.fillStyle = cfg.glow;
    ctx.shadowBlur = 12;
    ctx.shadowColor = cfg.glow;
    if (this.type !== 'void_boss') {
      const bossEyeX = right ? headCX + 2 : headCX - 12;
      ctx.fillRect(bossEyeX, headCY - 3, 4, 4);
      ctx.fillRect(bossEyeX + 6, headCY - 3, 4, 4);
    }
    ctx.shadowBlur = 0;

    // --- HP BAR & NAME ---
    const barWidth = 140;
    const barX = sx + (w / 2) - (barWidth / 2);
    const barY = sy - 36;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barWidth, 10);
    ctx.fillStyle = cfg.hpColor;
    ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), 10);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(barX, barY, barWidth, 10);

    ctx.fillStyle = '#fff';
    ctx.font = '9px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(cfg.name, barX + (barWidth / 2), barY - 4);
  }

  drawMinion(ctx, sx, sy, w, h, right, time) {
    let hpColor = '#ef4444';
    
    if (this.type === 'walker') {
      hpColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.shadowColor = hpColor;
      const legSwing = Math.sin(time / 100) * 5;
      ctx.fillStyle = '#0a0f1a';
      ctx.save();
      ctx.translate(sx + 10, sy + h - 20); ctx.rotate(legSwing * Math.PI / 180);
      ctx.fillRect(-4, 0, 8, 20); ctx.restore();
      ctx.save();
      ctx.translate(sx + w - 10, sy + h - 20); ctx.rotate(-legSwing * Math.PI / 180);
      ctx.fillRect(-4, 0, 8, 20); ctx.restore();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(sx + w / 2, sy + h / 2 - 2, w / 2 - 2, h / 2 - 12, 0, 0, Math.PI * 2);
      ctx.fill();

      const headOff = right ? 8 : -8;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.arc(sx + w / 2 + headOff, sy + 14, 10, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
      const clawX = right ? sx + w + 2 : sx - 2;
      const clawDir = right ? 1 : -1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(clawX, sy + 26 + i * 6);
        ctx.lineTo(clawX + clawDir * 10, sy + 22 + i * 6); ctx.stroke();
      }

      ctx.fillStyle = '#ef4444'; ctx.shadowBlur = 8; ctx.shadowColor = '#ef4444';
      const eyeX = right ? sx + w / 2 + headOff + 2 : sx + w / 2 + headOff - 6;
      ctx.fillRect(eyeX, sy + 12, 2, 3);
      ctx.fillRect(eyeX + 3, sy + 12, 2, 3);
    } else if (this.type === 'caster') {
      hpColor = '#a855f7';
      ctx.shadowBlur = 10;
      ctx.shadowColor = hpColor;
      
      ctx.fillStyle = '#581c87';
      ctx.beginPath(); ctx.moveTo(sx + w / 2, sy + 18);
      ctx.lineTo(sx - 2, sy + h); ctx.lineTo(sx + w + 2, sy + h);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = '#3b0764';
      ctx.beginPath(); ctx.arc(sx + w / 2, sy + 16, 13, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx + w / 2 - 8, sy + 6); ctx.lineTo(sx + w / 2, sy - 8);
      ctx.lineTo(sx + w / 2 + 8, sy + 6); ctx.closePath(); ctx.fill();

      ctx.fillStyle = '#c084fc'; ctx.shadowBlur = 10; ctx.shadowColor = '#c084fc';
      const mEyeX = right ? sx + w / 2 + 1 : sx + w / 2 - 7;
      ctx.fillRect(mEyeX, sy + 15, 2, 3);
      ctx.fillRect(mEyeX + 4, sy + 15, 2, 3);

      ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2;
      const staffX = right ? sx + w + 4 : sx - 4;
      ctx.beginPath(); ctx.moveTo(staffX, sy + 10); ctx.lineTo(staffX, sy + h - 5); ctx.stroke();
      ctx.fillStyle = '#c084fc'; ctx.shadowBlur = 12; ctx.shadowColor = '#a855f7';
      ctx.beginPath(); ctx.arc(staffX, sy + 8, 5, 0, Math.PI * 2); ctx.fill();
    } else if (this.type === 'phantom') {
      hpColor = '#e0f2fe';
      ctx.shadowBlur = 15;
      ctx.shadowColor = hpColor;
      
      const alpha = 0.4 + Math.abs(Math.sin(time / 150)) * 0.4;
      ctx.globalAlpha = alpha;
      
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(sx + w/2, sy + h/2, w/2, h/2, 0, 0, Math.PI*2);
      ctx.fill();
      
      ctx.beginPath();
      const tailX = sx + w/2;
      const tailY = sy + h - 5;
      const wave = Math.sin(time/100) * 10;
      ctx.moveTo(tailX - 10, tailY);
      ctx.quadraticCurveTo(tailX + wave, tailY + 15, tailX, tailY + 30);
      ctx.quadraticCurveTo(tailX - wave, tailY + 15, tailX + 10, tailY);
      ctx.fill();
      
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#ffffff';
      const eyeX = right ? sx + w/2 + 5 : sx + w/2 - 10;
      ctx.beginPath(); ctx.arc(eyeX, sy + h/3, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeX + 6, sy + h/3, 3, 0, Math.PI*2); ctx.fill();
      
    } else if (this.type === 'brute') {
      hpColor = '#f97316';
      ctx.shadowBlur = 8;
      ctx.shadowColor = hpColor;
      
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(sx, sy + 15, w, h - 15);
      
      ctx.fillStyle = '#292524';
      ctx.fillRect(sx - 5, sy + 15, w + 10, 20);
      
      ctx.fillRect(sx + w/2 - 12, sy, 24, 20);
      
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + 10, sy + 30); ctx.lineTo(sx + 25, sy + 45); ctx.lineTo(sx + 15, sy + 60);
      ctx.moveTo(sx + w - 10, sy + 35); ctx.lineTo(sx + w - 20, sy + 50); ctx.lineTo(sx + w - 5, sy + 65);
      ctx.stroke();
      
      const fistSwing = Math.sin(time / 200) * 5;
      ctx.fillStyle = '#44403c';
      const fistX1 = sx - 10 + (right ? fistSwing : -fistSwing);
      const fistX2 = sx + w - 5 + (right ? -fistSwing : fistSwing);
      ctx.fillRect(fistX1, sy + h - 25, 15, 20);
      ctx.fillRect(fistX2, sy + h - 25, 15, 20);
      
      ctx.fillStyle = '#f97316';
      const eyeX = right ? sx + w/2 + 2 : sx + w/2 - 6;
      ctx.fillRect(eyeX, sy + 5, 4, 3);
      
    } else if (this.type === 'crawler') {
      hpColor = '#dc2626';
      ctx.shadowBlur = 10;
      ctx.shadowColor = hpColor;
      
      const skitterY = Math.abs(Math.sin(time / 50)) * 3;
      
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(sx + w/2, sy + h/2 + skitterY, w/2, h/3, 0, 0, Math.PI*2);
      ctx.fill();
      
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      for(let i=0; i<3; i++) {
        const legSwing = Math.sin(time / 50 + i) * 6;
        ctx.beginPath(); ctx.moveTo(sx + w/2 - 10, sy + h/2 + skitterY); 
        ctx.lineTo(sx - 5 + legSwing, sy + h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx + w/2 + 10, sy + h/2 + skitterY); 
        ctx.lineTo(sx + w + 5 - legSwing, sy + h); ctx.stroke();
      }
      
      ctx.fillStyle = '#ef4444';
      const eyeX = right ? sx + w - 15 : sx + 5;
      ctx.beginPath(); ctx.arc(eyeX, sy + h/2 + skitterY - 2, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeX + 4, sy + h/2 + skitterY - 2, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeX + 8, sy + h/2 + skitterY - 2, 2, 0, Math.PI*2); ctx.fill();
      
    } else if (this.type === 'bomber') {
      hpColor = '#f59e0b';
      ctx.shadowBlur = 15;
      
      const pulse = Math.abs(Math.sin(time / 100));
      ctx.shadowColor = `rgba(245, 158, 11, ${0.5 + pulse*0.5})`;
      
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(sx + w/2, sy + h/2 + 5, w/2, 0, Math.PI*2);
      ctx.fill();
      
      ctx.fillStyle = `rgba(239, 68, 68, ${0.3 + pulse*0.7})`;
      ctx.beginPath();
      ctx.arc(sx + w/2, sy + h/2 + 5, w/3, 0, Math.PI*2);
      ctx.fill();
      
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx + w/2, sy + 5);
      ctx.quadraticCurveTo(sx + w/2 + 10, sy - 5, sx + w/2 + 5, sy - 10);
      ctx.stroke();
      
      if (Math.random() > 0.3) {
        ctx.fillStyle = '#fde047';
        ctx.fillRect(sx + w/2 + 3 + (Math.random()*6-3), sy - 12 + (Math.random()*6-3), 2, 2);
        ctx.fillRect(sx + w/2 + 3 + (Math.random()*6-3), sy - 12 + (Math.random()*6-3), 2, 2);
      }
      
      ctx.fillStyle = '#292524';
      ctx.fillRect(sx + w/2 - 10, sy + h - 5, 6, 8);
      ctx.fillRect(sx + w/2 + 4, sy + h - 5, 6, 8);
      
    } else if (this.type === 'sentinel') {
      hpColor = '#3b82f6';
      ctx.shadowBlur = 5;
      ctx.shadowColor = hpColor;
      
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(sx + 5, sy + 10, w - 10, h - 20);
      
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 5, sy + 10, w - 10, h - 20);
      
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx + 10, sy + 20, w - 20, 10);
      ctx.fillStyle = '#60a5fa';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#60a5fa';
      const scanX = Math.sin(time / 300) * ((w - 30) / 2);
      ctx.fillRect(sx + w/2 - 5 + scanX, sy + 22, 10, 6);
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#64748b';
      const spearX = right ? sx + w - 5 : sx - 5;
      ctx.fillRect(spearX, sy + 30, 8, 35);
      
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(spearX - 2, sy + 30);
      ctx.lineTo(spearX + 10, sy + 30);
      ctx.lineTo(spearX + 4, sy + 10);
      ctx.fill();
      
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx + 15, sy + h - 10, 6, 10);
      ctx.fillRect(sx + w - 21, sy + h - 10, 6, 10);
      
    } else if (this.type === 'wraith') {
      hpColor = '#d946ef';
      ctx.shadowBlur = 15;
      ctx.shadowColor = hpColor;
      
      const hoverY = Math.sin(time / 150) * 4;
      
      ctx.fillStyle = '#4a044e';
      ctx.beginPath();
      ctx.moveTo(sx + w/2, sy + 5 + hoverY);
      ctx.lineTo(sx - 5, sy + h/2 + hoverY);
      ctx.lineTo(sx + 5, sy + h - 10 + hoverY);
      ctx.lineTo(sx + w/2, sy + h + hoverY);
      ctx.lineTo(sx + w - 5, sy + h - 10 + hoverY);
      ctx.lineTo(sx + w + 5, sy + h/2 + hoverY);
      ctx.fill();
      
      ctx.fillStyle = '#701a75';
      ctx.beginPath();
      ctx.moveTo(sx + w/2, sy + 10 + hoverY);
      ctx.lineTo(sx + 10, sy + h/2 + hoverY);
      ctx.lineTo(sx + w/2, sy + h - 15 + hoverY);
      ctx.lineTo(sx + w - 10, sy + h/2 + hoverY);
      ctx.fill();
      
      ctx.fillStyle = '#2e1065';
      ctx.beginPath();
      ctx.arc(sx + w/2, sy + 15 + hoverY, 12, 0, Math.PI*2);
      ctx.fill();
      
      ctx.fillStyle = '#e879f9';
      const eyeX = right ? sx + w/2 + 2 : sx + w/2 - 6;
      ctx.fillRect(eyeX, sy + 12 + hoverY, 3, 3);
      ctx.fillRect(eyeX + 5, sy + 12 + hoverY, 3, 3);
      
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#4a044e';
      ctx.beginPath();
      ctx.moveTo(sx + 10, sy + h + hoverY);
      ctx.lineTo(sx + w - 10, sy + h + hoverY);
      ctx.lineTo(sx + w/2, sy + h + 20 + hoverY);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(sx, sy - 10, w, 5);
    ctx.fillStyle = hpColor;
    ctx.fillRect(sx, sy - 10, w * (this.hp / this.maxHp), 5);
  }
}
