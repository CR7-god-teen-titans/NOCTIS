/* ==========================================================================
   NOCTIS - VANGUARD ECLIPSE ALLY SYSTEM
   Squad: Leo Mercer, Silas Kane, Maya Cross, Kael Draven
   ========================================================================== */

// Polyfill for roundRect if browser doesn't support it
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    this.rect(x, y, w, h);
  };
}

class Ally {
  constructor(x, y, type = 'leo') {
    this.x = x;
    this.y = y;
    this.type = type; // 'leo', 'silas', 'maya', 'kael'
    this.width = 44;
    this.height = 68;
    this.vx = 0;
    this.vy = 0;
    this.facing = 'right';
    this.isGrounded = false;
    this.gravity = 0.65;
    this.particles = [];

    // Per-character stats
    const stats = {
      leo:   { hp: 160, speed: 4.5, damage: 25, cooldown: 45, reach: 60,  color: '#fbbf24', name: 'LEO' },
      silas: { hp: 120, speed: 5.5, damage: 35, cooldown: 30, reach: 75,  color: '#10b981', name: 'SILAS' },
      maya:  { hp: 140, speed: 4.0, damage: 20, cooldown: 55, reach: 90, color: '#f472b6', name: 'MAYA' },
      kael:  { hp: 130, speed: 5.0, damage: 30, cooldown: 35, reach: 65,  color: '#ef4444', name: 'KAEL' }
    };
    const s = stats[type] || stats.leo;
    this.maxHp = s.hp;
    this.hp = s.hp;
    this.speed = s.speed;
    this.damage = s.damage;
    this.baseCooldown = s.cooldown;
    this.reach = s.reach;
    this.allyColor = s.color;
    this.allyName = s.name;
    this.isDead = false;

    // Combat
    this.attackCooldown = 0;
    this.attackFrame = 0;
    this.isAttacking = false;
    this.attackBox = null;

    // Maya ranged projectiles
    this.projectiles = [];
  }

  update(player, enemies, groundY) {
    if (this.isDead) return;

    if (this.attackCooldown > 0) this.attackCooldown--;

    // AI: Find nearest alive enemy
    let nearestEnemy = null;
    let nearestDist = Infinity;
    enemies.forEach(e => {
      if (!e.isDead) {
        const d = Math.abs(e.x - this.x);
        if (d < nearestDist) {
          nearestDist = d;
          nearestEnemy = e;
        }
      }
    });

    // Movement AI differs by type
    const engageRange = this.type === 'maya' ? 350 : 500;
    const stopRange = this.type === 'maya' ? 200 : 50;

    if (nearestEnemy && nearestDist < engageRange) {
      this.facing = nearestEnemy.x > this.x ? 'right' : 'left';

      if (this.type === 'maya') {
        // Maya stays at range
        if (nearestDist < 150) {
          this.vx = this.facing === 'right' ? -this.speed : this.speed;
        } else if (nearestDist > 280) {
          this.vx = this.facing === 'right' ? this.speed : -this.speed;
        } else {
          this.vx *= 0.7;
          if (this.attackCooldown <= 0 && !this.isAttacking) {
            this.performAttack(nearestEnemy);
          }
        }
      } else {
        // Melee characters chase
        if (nearestDist > stopRange) {
          this.vx = this.facing === 'right' ? this.speed : -this.speed;
        } else {
          this.vx = 0;
          if (this.attackCooldown <= 0 && !this.isAttacking) {
            this.performAttack(nearestEnemy);
          }
        }
      }
    } else {
      // Follow player
      const offsets = { leo: -80, silas: -120, maya: -160, kael: -50 };
      const targetX = player.x + (offsets[this.type] || -80);
      const followDist = Math.abs(this.x - targetX);

      if (followDist > 60) {
        this.facing = targetX > this.x ? 'right' : 'left';
        this.vx = this.facing === 'right' ? this.speed * 0.7 : -this.speed * 0.7;
      } else {
        this.vx *= 0.7;
        this.facing = player.facing;
      }
    }

    // Physics
    this.x += this.vx;
    this.vy += this.gravity;
    this.y += this.vy;

    if (this.y + this.height >= groundY) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Attack animation
    if (this.isAttacking) {
      this.attackFrame++;
      if (this.attackFrame > 12) {
        this.isAttacking = false;
        this.attackBox = null;
      }
    }

    // Update Maya's ranged projectiles
    this.projectiles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
    });
    this.projectiles = this.projectiles.filter(p => p.active && Math.abs(p.x - this.x) < 600);

    // Update particles
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => p.life > 0);
  }

  performAttack(target) {
    this.isAttacking = true;
    this.attackFrame = 0;
    this.attackCooldown = this.baseCooldown;

    if (this.type === 'maya') {
      // Maya fires a ranged bolt
      const dir = this.facing === 'right' ? 1 : -1;
      this.projectiles.push({
        x: this.x + (dir === 1 ? this.width : 0),
        y: this.y + 24,
        vx: dir * 10,
        vy: 0,
        damage: this.damage,
        active: true
      });
      soundEngine.playDarkPulse();
    } else {
      // Melee attack
      const attackX = this.facing === 'right' ? this.x + this.width : this.x - this.reach;
      this.attackBox = {
        x: attackX,
        y: this.y + 10,
        width: this.reach,
        height: this.height - 10,
        damage: this.damage,
        hitEnemies: new Set()
      };

      if (this.type === 'silas') {
        soundEngine.playDash();
      } else {
        soundEngine.playSlash();
      }
    }

    // Attack particles
    const px = this.facing === 'right' ? this.x + this.width + 10 : this.x - 10;
    for (let i = 0; i < 8; i++) {
      this.particles.push(new Particle(
        px,
        this.y + Math.random() * this.height,
        (this.facing === 'right' ? 1 : -1) * (Math.random() * 5 + 2),
        (Math.random() - 0.5) * 3,
        this.allyColor,
        Math.random() * 4 + 2,
        14
      ));
    }
  }

  takeDamage(amount) {
    this.hp -= amount * 0.4;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }

  draw(ctx, cameraX) {
    if (this.isDead) return;

    this.particles.forEach(p => p.draw(ctx, cameraX));

    const sx = this.x - cameraX;
    const sy = this.y;
    const w = this.width;
    const h = this.height;
    const right = this.facing === 'right';
    const time = Date.now();
    const t = this.type;

    // Draw ranged projectiles (Maya)
    this.projectiles.forEach(p => {
      if (!p.active) return;
      ctx.save();
      ctx.fillStyle = '#f472b6';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#f472b6';
      ctx.beginPath();
      ctx.arc(p.x - cameraX, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();

    // Color lookup
    const colors = {
      leo:   { body: '#1e40af', limb: '#1e3a8a', accent: '#fbbf24', belt: '#92400e', glow: '#fbbf24', cape: 'rgba(59,130,246,0.5)', hpBar: '#3b82f6' },
      silas: { body: '#065f46', limb: '#064e3b', accent: '#10b981', belt: '#374151', glow: '#10b981', cape: 'rgba(16,185,129,0.4)', hpBar: '#10b981' },
      maya:  { body: '#831843', limb: '#6b1a3a', accent: '#f472b6', belt: '#9f1239', glow: '#f472b6', cape: 'rgba(244,114,182,0.4)', hpBar: '#f472b6' },
      kael:  { body: '#450a0a', limb: '#3b0808', accent: '#ef4444', belt: '#4a4a4a', glow: '#ef4444', cape: 'rgba(239,68,68,0.35)', hpBar: '#ef4444' }
    };
    const c = colors[t] || colors.leo;

    ctx.shadowBlur = 14;
    ctx.shadowColor = c.glow;

    // --- CAPE ---
    const capeDir = right ? -1 : 1;
    const capeWave = Math.sin(time / 160) * 3;
    const capeX = right ? sx - 3 : sx + w + 3;
    ctx.fillStyle = c.cape;
    ctx.beginPath();
    ctx.moveTo(capeX, sy + 14);
    ctx.quadraticCurveTo(capeX + capeDir * (12 + capeWave), sy + h * 0.5, capeX + capeDir * (7 + capeWave * 0.5), sy + h - 6);
    ctx.lineTo(capeX, sy + h - 16);
    ctx.closePath();
    ctx.fill();

    // --- LEGS ---
    const legSwing = Math.abs(this.vx) > 1 ? Math.sin(time / 85) * 5 : 0;
    const legY = sy + h - 22;

    ctx.fillStyle = c.limb;
    ctx.save();
    ctx.translate(sx + 10, legY);
    ctx.rotate(legSwing * Math.PI / 180);
    ctx.fillRect(-3, 0, 7, 22);
    ctx.fillStyle = c.belt;
    ctx.fillRect(-4, 18, 9, 4);
    ctx.restore();

    ctx.fillStyle = c.limb;
    ctx.save();
    ctx.translate(sx + w - 10, legY);
    ctx.rotate(-legSwing * Math.PI / 180);
    ctx.fillRect(-3, 0, 7, 22);
    ctx.fillStyle = c.belt;
    ctx.fillRect(-4, 18, 9, 4);
    ctx.restore();

    // --- TORSO ---
    const torsoY = sy + 16;
    const torsoH = h - 38;
    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.roundRect(sx + 6, torsoY, w - 12, torsoH, [4, 4, 2, 2]);
    ctx.fill();

    // Armor stripe
    ctx.fillStyle = c.accent;
    if (t === 'maya') {
      // Maya: X-pattern on armor
      ctx.fillRect(sx + w / 2 - 1, torsoY + 3, 2, torsoH - 6);
      ctx.fillRect(sx + 10, torsoY + torsoH / 2 - 1, w - 20, 2);
    } else if (t === 'kael') {
      // Kael: diagonal slash marks
      ctx.lineWidth = 2;
      ctx.strokeStyle = c.accent;
      ctx.beginPath();
      ctx.moveTo(sx + 10, torsoY + 4);
      ctx.lineTo(sx + w - 10, torsoY + torsoH - 4);
      ctx.moveTo(sx + w - 10, torsoY + 4);
      ctx.lineTo(sx + 10, torsoY + torsoH - 4);
      ctx.stroke();
    } else {
      ctx.fillRect(sx + w / 2 - 2, torsoY + 3, 4, torsoH - 6);
    }

    // Belt
    ctx.fillStyle = c.belt;
    ctx.fillRect(sx + 6, torsoY + torsoH - 5, w - 12, 4);

    // --- ARMS ---
    const armY = torsoY + 3;
    const attackSwing = this.isAttacking ? Math.sin(this.attackFrame / 12 * Math.PI) * 35 : 0;

    ctx.fillStyle = c.limb;
    const backX = right ? sx + 2 : sx + w - 8;
    ctx.fillRect(backX, armY, 6, 18);

    ctx.fillStyle = c.limb;
    const frontX = right ? sx + w - 8 : sx + 2;
    ctx.save();
    ctx.translate(frontX + 3, armY);
    ctx.rotate((right ? -1 : 1) * attackSwing * Math.PI / 180);
    ctx.fillRect(-3, 0, 6, 18);
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.arc(0, 18, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- HEAD ---
    const headR = 10;
    const headCX = sx + w / 2;
    const headCY = sy + 12;

    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
    ctx.fill();

    // Per-character hair/headgear
    if (t === 'leo') {
      // Leo: short gold swept hair
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(headCX + (right ? 2 : -2), headCY - 6, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (t === 'silas') {
      // Silas: dark hood
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.arc(headCX, headCY - 2, headR + 3, -Math.PI, 0);
      ctx.lineTo(headCX + headR + 3, headCY + 2);
      ctx.lineTo(headCX - headR - 3, headCY + 2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(headCX - 6, headCY - 8);
      ctx.lineTo(headCX, headCY - 18);
      ctx.lineTo(headCX + 6, headCY - 8);
      ctx.closePath();
      ctx.fill();
    } else if (t === 'maya') {
      // Maya: tied-back hair with band
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.ellipse(headCX, headCY - 5, 9, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Hair band
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(headCX, headCY - 2, headR + 1, -Math.PI * 0.8, -Math.PI * 0.2);
      ctx.stroke();
      // Ponytail
      const ptDir = right ? -1 : 1;
      const ptWave = Math.sin(time / 200) * 3;
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(headCX + ptDir * 6, headCY - 4);
      ctx.quadraticCurveTo(headCX + ptDir * (18 + ptWave), headCY, headCX + ptDir * (14 + ptWave), headCY + 12);
      ctx.lineTo(headCX + ptDir * 8, headCY + 2);
      ctx.closePath();
      ctx.fill();
    } else if (t === 'kael') {
      // Kael: rugged short hair + scar
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.ellipse(headCX, headCY - 5, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Scar across face
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(headCX - 5, headCY - 4);
      ctx.lineTo(headCX + 5, headCY + 4);
      ctx.stroke();
    }

    // Eyes
    ctx.fillStyle = c.glow;
    ctx.shadowBlur = 6;
    ctx.shadowColor = c.glow;
    const eyeX = right ? headCX + 2 : headCX - 7;
    ctx.fillRect(eyeX, headCY - 1, 2, 3);
    ctx.fillRect(eyeX + 3, headCY - 1, 2, 3);
    ctx.shadowBlur = 0;

    // --- WEAPON (when attacking) ---
    if (this.isAttacking && this.attackBox) {
      ctx.save();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = t === 'kael' ? 2 : 3;
      ctx.shadowBlur = 12;
      ctx.shadowColor = c.accent;

      const wStartX = right ? sx + w : sx;
      const wEndX = right ? sx + w + 40 : sx - 40;
      const wY = sy + 26;
      const swing = Math.sin(this.attackFrame / 12 * Math.PI) * 20;

      if (t === 'leo') {
        // Broad sword
        ctx.beginPath();
        ctx.moveTo(wStartX, wY);
        ctx.lineTo(wEndX, wY - swing);
        ctx.stroke();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(wEndX, wY - swing, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (t === 'silas') {
        // Dual daggers
        ctx.beginPath();
        ctx.moveTo(wStartX, wY - 4);
        ctx.lineTo(wEndX * 0.7 + wStartX * 0.3, wY - swing - 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(wStartX, wY + 6);
        ctx.lineTo(wEndX * 0.7 + wStartX * 0.3, wY - swing + 8);
        ctx.stroke();
      } else if (t === 'kael') {
        // Twin blades X-slash
        ctx.beginPath();
        ctx.moveTo(wStartX, wY - 8);
        ctx.lineTo(wEndX * 0.8 + wStartX * 0.2, wY + swing);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(wStartX, wY + 8);
        ctx.lineTo(wEndX * 0.8 + wStartX * 0.2, wY - swing);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Maya: show staff orb always (ranged)
    if (t === 'maya') {
      ctx.save();
      const staffX = right ? sx + w + 4 : sx - 4;
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(staffX, sy + 12);
      ctx.lineTo(staffX, sy + h - 8);
      ctx.stroke();
      // Orb
      ctx.fillStyle = '#fbbf24';
      ctx.shadowBlur = 10 + Math.sin(time / 200) * 4;
      ctx.shadowColor = '#f472b6';
      ctx.beginPath();
      ctx.arc(staffX, sy + 10, 4 + Math.sin(time / 300) * 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // --- NAME TAG ---
    ctx.fillStyle = c.accent;
    ctx.font = 'bold 8px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(this.allyName, sx + w / 2, sy - 16);

    // --- HP BAR ---
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(sx, sy - 10, w, 4);
    ctx.fillStyle = c.hpBar;
    ctx.fillRect(sx, sy - 10, w * (this.hp / this.maxHp), 4);

    ctx.restore();
  }
}
