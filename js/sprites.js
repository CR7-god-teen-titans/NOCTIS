/* ==========================================================================
   NOCTIS - SPRITE LOADER
   Pre-loads all character sprites for enemies and player
   ========================================================================== */

const SpriteManager = {
  sprites: {},
  loaded: false,
  totalToLoad: 0,
  totalLoaded: 0,

  init() {
    const spriteList = {
      // Player
      noctis: 'assets/sprites/noctis.png',
      // Minions
      walker: 'assets/sprites/walker.png',
      caster: 'assets/sprites/caster.png',
      phantom: 'assets/sprites/phantom.png',
      brute: 'assets/sprites/brute.png',
      crawler: 'assets/sprites/crawler.png',
      bomber: 'assets/sprites/bomber.png',
      sentinel: 'assets/sprites/sentinel.png',
      wraith: 'assets/sprites/wraith.png'
    };

    this.totalToLoad = Object.keys(spriteList).length;

    for (const [name, src] of Object.entries(spriteList)) {
      const img = new Image();
      img.onload = () => {
        this.totalLoaded++;
        if (this.totalLoaded >= this.totalToLoad) {
          this.loaded = true;
        }
      };
      img.onerror = () => {
        console.warn(`Failed to load sprite: ${src}`);
        this.totalLoaded++;
        if (this.totalLoaded >= this.totalToLoad) {
          this.loaded = true;
        }
      };
      img.src = src;
      this.sprites[name] = img;
    }
  },

  get(name) {
    return this.sprites[name] || null;
  },

  isReady() {
    return this.loaded;
  },

  // Draw sprite with flip support and optional effects
  drawSprite(ctx, name, x, y, w, h, flipH = false, opts = {}) {
    const img = this.get(name);
    if (!img || !img.complete || img.naturalWidth === 0) return false;

    ctx.save();

    // Apply optional alpha
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;

    // Apply optional glow
    if (opts.glow) {
      ctx.shadowBlur = opts.glowSize || 10;
      ctx.shadowColor = opts.glow;
    }

    if (flipH) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w, h);
    } else {
      ctx.drawImage(img, x, y, w, h);
    }

    ctx.restore();
    return true;
  }
};

// Init on load
SpriteManager.init();
