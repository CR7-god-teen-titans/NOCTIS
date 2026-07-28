/* ==========================================================================
   NOCTIS - TRAP SYSTEM
   Types: spikes, fire, saw_blade, poison_gas
   ========================================================================== */

class Trap {
  constructor(x, y, type = 'spikes', groundY) {
    this.x = x;
    this.type = type;
    this.groundY = groundY;

    // Per-type config
    const configs = {
      spikes: {
        width: 60, height: 20,
        damage: 12, cooldown: 40,
        color: '#9ca3af', glowColor: '#ef4444',
        yOffset: 0 // sits on ground
      },
      fire: {
        width: 50, height: 45,
        damage: 8, cooldown: 25,
        color: '#f97316', glowColor: '#fbbf24',
        yOffset: 0
      },
      saw_blade: {
        width: 40, height: 40,
        damage: 18, cooldown: 50,
        color: '#94a3b8', glowColor: '#e2e8f0',
        yOffset: -20 // floats slightly
      },
      poison_gas: {
        width: 70, height: 60,
        damage: 5, cooldown: 15,
        color: '#4ade80', glowColor: '#22c55e',
        yOffset: -30
      }
    };

    const cfg = configs[type] || configs.spikes;
    this.width = cfg.width;
    this.height = cfg.height;
    this.damage = cfg.damage;
    this.hitCooldown = cfg.cooldown;
    this.color = cfg.color;
    this.glowColor = cfg.glowColor;
    this.y = (groundY || y) - cfg.height + cfg.yOffset;

    this.timer = 0; // internal animation timer
    this.hitTimer = 0; // cooldown between hits
    this.active = true; // some traps cycle on/off

    // Spikes retract/extend cycle
    this.extended = true;
    this.cycleTimer = 0;

    // Saw blade rotation
    this.rotation = 0;

    // Particles
    this.particles = [];
  }

  update() {
    this.timer++;
    if (this.hitTimer > 0) this.hitTimer--;

    // Per-type behavior
    if (this.type === 'spikes') {
      this.cycleTimer++;
      if (this.cycleTimer > 90) {
        this.extended = !this.extended;
        this.cycleTimer = 0;
      }
      this.active = this.extended;
    } else if (this.type === 'fire') {
      // Fire flickers - always active but intensity varies
      this.active = true;
    } else if (this.type === 'saw_blade') {
      this.rotation += 0.15;
      this.active = true;
    } else if (this.type === 'poison_gas') {
      this.active = true;
    }

    // Update particles
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => p.life > 0);

    // Emit ambient particles
    if (this.active && this.timer % 8 === 0) {
      if (this.type === 'fire') {
        this.particles.push(new Particle(
          this.x + Math.random() * this.width,
          this.y + this.height * 0.3,
          (Math.random() - 0.5) * 2,
          -(Math.random() * 3 + 1),
          Math.random() > 0.5 ? '#f97316' : '#fbbf24',
          Math.random() * 4 + 2, 18
        ));
      } else if (this.type === 'poison_gas') {
        this.particles.push(new Particle(
          this.x + Math.random() * this.width,
          this.y + Math.random() * this.height,
          (Math.random() - 0.5) * 1.5,
          -(Math.random() * 1.5 + 0.5),
          Math.random() > 0.5 ? '#4ade80' : '#22c55e',
          Math.random() * 5 + 3, 25
        ));
      }
    }
  }

  checkCollision(entity) {
    if (!this.active || this.hitTimer > 0) return false;
    if (entity.isDead || (entity.invulnerableTimer && entity.invulnerableTimer > 0)) return false;

    const ex = entity.x;
    const ey = entity.y;
    const ew = entity.width;
    const eh = entity.height;

    const hitX = ex < this.x + this.width && ex + ew > this.x;
    const hitY = ey < this.y + this.height && ey + eh > this.y;

    if (hitX && hitY) {
      this.hitTimer = this.hitCooldown;
      return true;
    }
    return false;
  }

  draw(ctx, cameraX) {
    const sx = this.x - cameraX;
    const sy = this.y;
    const time = Date.now();

    // Draw particles first (behind trap)
    this.particles.forEach(p => p.draw(ctx, cameraX));

    ctx.save();

    if (this.type === 'spikes') {
      this.drawSpikes(ctx, sx, sy, time);
    } else if (this.type === 'fire') {
      this.drawFire(ctx, sx, sy, time);
    } else if (this.type === 'saw_blade') {
      this.drawSawBlade(ctx, sx, sy, time);
    } else if (this.type === 'poison_gas') {
      this.drawPoisonGas(ctx, sx, sy, time);
    }

    // Warning indicator
    if (this.active) {
      ctx.fillStyle = this.glowColor;
      ctx.globalAlpha = 0.3 + Math.sin(time / 200) * 0.2;
      ctx.font = 'bold 10px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText('⚠', sx + this.width / 2, sy - 8);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  drawSpikes(ctx, sx, sy, time) {
    const spikeH = this.extended ? this.height : 4;
    const transitionH = this.height * (this.extended ?
      Math.min(1, this.cycleTimer / 10) :
      Math.max(0.2, 1 - this.cycleTimer / 10));

    ctx.shadowBlur = this.extended ? 8 : 0;
    ctx.shadowColor = '#ef4444';

    // Base plate
    ctx.fillStyle = '#374151';
    ctx.fillRect(sx, sy + this.height - 4, this.width, 4);

    // Spikes
    const spikeCount = 5;
    const spikeW = this.width / spikeCount;
    ctx.fillStyle = '#9ca3af';

    for (let i = 0; i < spikeCount; i++) {
      const spX = sx + i * spikeW;
      const h = transitionH * (0.8 + Math.sin(i + time / 300) * 0.2);
      ctx.beginPath();
      ctx.moveTo(spX + 2, sy + this.height - 4);
      ctx.lineTo(spX + spikeW / 2, sy + this.height - 4 - h);
      ctx.lineTo(spX + spikeW - 2, sy + this.height - 4);
      ctx.closePath();
      ctx.fill();
    }

    // Blood/danger accent on tips
    if (this.extended) {
      ctx.fillStyle = '#ef4444';
      for (let i = 0; i < spikeCount; i++) {
        const spX = sx + i * spikeW + spikeW / 2;
        ctx.beginPath();
        ctx.arc(spX, sy + this.height - 4 - transitionH * 0.9, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawFire(ctx, sx, sy, time) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f97316';

    // Fire base (embers)
    ctx.fillStyle = '#92400e';
    ctx.fillRect(sx + 5, sy + this.height - 8, this.width - 10, 8);

    // Fire flames (multiple layered)
    for (let layer = 0; layer < 3; layer++) {
      const flicker = Math.sin(time / (80 + layer * 30) + layer * 2) * 5;
      const layerH = this.height * (1 - layer * 0.25);
      const layerW = this.width * (0.8 - layer * 0.15);
      const offsetX = sx + (this.width - layerW) / 2 + flicker;

      const colors = ['#ef4444', '#f97316', '#fbbf24'];
      ctx.fillStyle = colors[layer];
      ctx.globalAlpha = 0.7 - layer * 0.15;

      ctx.beginPath();
      ctx.moveTo(offsetX, sy + this.height - 8);
      ctx.quadraticCurveTo(
        offsetX + layerW * 0.25, sy + this.height - layerH + flicker * 2,
        offsetX + layerW * 0.5, sy + this.height - layerH - 5 + Math.sin(time / 100) * 8
      );
      ctx.quadraticCurveTo(
        offsetX + layerW * 0.75, sy + this.height - layerH + flicker,
        offsetX + layerW, sy + this.height - 8
      );
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawSawBlade(ctx, sx, sy, time) {
    const cx = sx + this.width / 2;
    const cy = sy + this.height / 2;
    const r = this.width / 2 - 2;

    ctx.shadowBlur = 10;
    ctx.shadowColor = '#e2e8f0';

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);

    // Outer blade disc
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Teeth
    ctx.fillStyle = '#cbd5e1';
    const teeth = 8;
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r - 4), Math.sin(a) * (r - 4));
      ctx.lineTo(Math.cos(a - 0.15) * (r + 6), Math.sin(a - 0.15) * (r + 6));
      ctx.lineTo(Math.cos(a + 0.15) * (r + 6), Math.sin(a + 0.15) * (r + 6));
      ctx.closePath();
      ctx.fill();
    }

    // Center hole
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Center bolt
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Support arm
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - 3, cy + r, 6, this.groundY - (cy + r));
  }

  drawPoisonGas(ctx, sx, sy, time) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#22c55e';

    // Ground vent
    ctx.fillStyle = '#374151';
    ctx.fillRect(sx + 15, this.groundY - 6, this.width - 30, 6);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(sx + 20, this.groundY - 4, 8, 2);
    ctx.fillRect(sx + this.width - 28, this.groundY - 4, 8, 2);

    // Gas cloud (multiple blobs)
    const blobs = [
      { ox: 0.2, oy: 0.5, r: 14 },
      { ox: 0.5, oy: 0.3, r: 18 },
      { ox: 0.8, oy: 0.5, r: 14 },
      { ox: 0.5, oy: 0.7, r: 12 },
      { ox: 0.35, oy: 0.2, r: 10 },
      { ox: 0.65, oy: 0.2, r: 10 }
    ];

    blobs.forEach((b, i) => {
      const bx = sx + this.width * b.ox + Math.sin(time / (300 + i * 50)) * 5;
      const by = sy + this.height * b.oy + Math.cos(time / (250 + i * 40)) * 3;
      const br = b.r + Math.sin(time / (200 + i * 30)) * 3;

      ctx.globalAlpha = 0.25 + Math.sin(time / (400 + i * 60)) * 0.1;
      ctx.fillStyle = i % 2 === 0 ? '#4ade80' : '#22c55e';
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }
}
