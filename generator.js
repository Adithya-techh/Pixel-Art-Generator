/**
 * Procedural Pixel & Voxel Art Generator Core (Serverless / Standalone compatible)
 * Includes PRNG, Voxel Grid data structure, Palettes, and specialized 3D archetypes:
 * - Starfighter / Spaceship
 * - Alien Creature / Invader
 * - Cyber Mecha / Robot
 * - Fantasy Weapon / Relic
 * - Floating Sky Island / Diorama
 * - Ancient Chest / Artifact
 */

(function (root) {
  // --- 32-bit Seeded PRNG (Mulberry32) ---
  class SeededRandom {
    constructor(seed = 1337) {
      this.setSeed(seed);
    }

    setSeed(seed) {
      if (typeof seed === 'string') {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
          hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
        }
        this.seed = hash >>> 0;
      } else {
        this.seed = (seed >>> 0) || 1;
      }
    }

    next() {
      let t = (this.seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    range(min, max) {
      return min + this.next() * (max - min);
    }

    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    }

    bool(chance = 0.5) {
      return this.next() < chance;
    }

    pick(array) {
      if (!array || array.length === 0) return null;
      return array[this.int(0, array.length - 1)];
    }

    noise3D(x, y, z) {
      const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + this.seed * 0.001);
      return (s * 43758.5453) % 1;
    }
  }

  // --- Curated Color Palettes ---
  const PALETTES = {
    pico8: {
      id: 'pico8',
      name: 'PICO-8 Classic',
      description: 'Iconic 16-color fantasy console palette',
      primary: ['#ab5236', '#7e2553', '#008751', '#29adff', '#83769c', '#ff77a8'],
      secondary: ['#ffccaa', '#ffa300', '#ffec27', '#00e436'],
      detail: ['#1d2b53', '#5f574f', '#c2c3c7', '#fff1e8'],
      glow: ['#ff004d', '#29adff', '#ffec27', '#00e436'],
      dark: '#000000',
      swatches: ['#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#29adff', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#fff1e8']
    },
    cyberpunk: {
      id: 'cyberpunk',
      name: 'Cyberpunk Neon',
      description: 'High-voltage synthwave, magenta & electric cyan',
      primary: ['#0f051d', '#200b3b', '#3b1464', '#591a82', '#ff007f'],
      secondary: ['#00f0ff', '#7000ff', '#ff0055', '#ffe600'],
      detail: ['#141923', '#2a354b', '#485d7b', '#7c96b7'],
      glow: ['#00f0ff', '#ff007f', '#ffe600', '#39ff14'],
      dark: '#05020a',
      swatches: ['#0f051d', '#3b1464', '#7000ff', '#ff007f', '#ff0055', '#00f0ff', '#ffe600', '#39ff14']
    },
    gameboy: {
      id: 'gameboy',
      name: 'Game Boy (DMG-01)',
      description: 'Nostalgic 4-shade greenish phosphor LCD',
      primary: ['#306230', '#0f380f', '#8bac0f'],
      secondary: ['#8bac0f', '#9bbc0f'],
      detail: ['#0f380f', '#306230'],
      glow: ['#9bbc0f', '#e0f8cf'],
      dark: '#082008',
      swatches: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
    },
    db32: {
      id: 'db32',
      name: 'DawnBringer 32',
      description: 'Legendary rich fantasy game dev palette',
      primary: ['#346524', '#6daa2c', '#4e4a4e', '#854c30', '#d27d2c', '#597dce'],
      secondary: ['#dad45e', '#b62558', '#422c54', '#75a743'],
      detail: ['#222034', '#524b24', '#66696b', '#99e550', '#8f974a'],
      glow: ['#fbf236', '#69c1f0', '#b62558', '#99e550'],
      dark: '#14121e',
      swatches: ['#222034', '#422c54', '#854c30', '#346524', '#d27d2c', '#597dce', '#6daa2c', '#dad45e', '#fbf236']
    },
    magma: {
      id: 'magma',
      name: 'Magma Forge',
      description: 'Volcanic obsidian, blazing embers & molten core',
      primary: ['#1c1917', '#292524', '#44403c', '#78350f', '#9a3412'],
      secondary: ['#c2410c', '#ea580c', '#f97316', '#fb923c'],
      detail: ['#12100e', '#292524', '#57534e', '#a8a29e'],
      glow: ['#fbbf24', '#fef08a', '#ff4500', '#f59e0b'],
      dark: '#0c0a09',
      swatches: ['#1c1917', '#44403c', '#78350f', '#c2410c', '#ea580c', '#f97316', '#fbbf24', '#fef08a']
    },
    biolum: {
      id: 'biolum',
      name: 'Abyssal Bioluminescence',
      description: 'Deep midnight oceanic teal with glowing seafoam',
      primary: ['#021b29', '#063852', '#0d5c75', '#1687a7', '#276678'],
      secondary: ['#00e8c6', '#38ef7d', '#11998e', '#6ee7b7'],
      detail: ['#010d14', '#042331', '#144552', '#438a9e'],
      glow: ['#00f5d4', '#70e000', '#a7ffeb', '#38ef7d'],
      dark: '#01080d',
      swatches: ['#021b29', '#063852', '#144552', '#1687a7', '#11998e', '#00e8c6', '#00f5d4', '#a7ffeb']
    },
    vaporwave: {
      id: 'vaporwave',
      name: 'Vaporwave Sunset',
      description: 'Pastel purple, cotton-candy pink and mint teal',
      primary: ['#2e1065', '#581c87', '#7e22ce', '#a21caf', '#c026d3'],
      secondary: ['#f472b6', '#fb7185', '#2dd4bf', '#38bdf8'],
      detail: ['#1e1b4b', '#312e81', '#4338ca', '#818cf8'],
      glow: ['#f43f5e', '#ec4899', '#06b6d4', '#e879f9'],
      dark: '#130924',
      swatches: ['#2e1065', '#7e22ce', '#c026d3', '#f472b6', '#fb7185', '#38bdf8', '#2dd4bf', '#e879f9']
    },
    solar: {
      id: 'solar',
      name: 'Imperial Solar & Gold',
      description: 'Ivory ceramic plating, polished gold & royal lapis',
      primary: ['#e2e8f0', '#f8fafc', '#cbd5e1', '#94a3b8'],
      secondary: ['#b45309', '#d97706', '#f59e0b', '#fbbf24'],
      detail: ['#1e293b', '#334155', '#475569', '#64748b'],
      glow: ['#38bdf8', '#0284c7', '#67e8f9', '#fef08a'],
      dark: '#0f172a',
      swatches: ['#0f172a', '#334155', '#94a3b8', '#e2e8f0', '#f8fafc', '#d97706', '#fbbf24', '#38bdf8']
    }
  };

  // --- Voxel Data Structure ---
  class VoxelGrid {
    constructor(sizeX, sizeY, sizeZ) {
      this.sizeX = sizeX;
      this.sizeY = sizeY;
      this.sizeZ = sizeZ;
      this.voxels = new Map();
    }

    _key(x, y, z) {
      return `${x},${y},${z}`;
    }

    set(x, y, z, voxelData) {
      if (x < 0 || x >= this.sizeX || y < 0 || y >= this.sizeY || z < 0 || z >= this.sizeZ) {
        return false;
      }
      this.voxels.set(this._key(x, y, z), {
        x, y, z,
        color: voxelData.color || '#ffffff',
        type: voxelData.type || 'body',
        isGlow: !!voxelData.isGlow,
        glowColor: voxelData.glowColor || voxelData.color || '#00f0ff'
      });
      return true;
    }

    get(x, y, z) {
      return this.voxels.get(this._key(x, y, z)) || null;
    }

    has(x, y, z) {
      return this.voxels.has(this._key(x, y, z));
    }

    remove(x, y, z) {
      return this.voxels.delete(this._key(x, y, z));
    }

    clear() {
      this.voxels.clear();
    }

    count() {
      return this.voxels.size;
    }

    getAll() {
      return Array.from(this.voxels.values());
    }

    getBounds() {
      if (this.voxels.size === 0) {
        return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0, count: 0 };
      }
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;

      for (const v of this.voxels.values()) {
        if (v.x < minX) minX = v.x;
        if (v.x > maxX) maxX = v.x;
        if (v.y < minY) minY = v.y;
        if (v.y > maxY) maxY = v.y;
        if (v.z < minZ) minZ = v.z;
        if (v.z > maxZ) maxZ = v.z;
      }

      return { minX, maxX, minY, maxY, minZ, maxZ, count: this.voxels.size };
    }
  }

  // --- Procedural Generation Logic for Archetypes ---
  class VoxelGenerator {
    constructor(options = {}) {
      this.seed = options.seed || Math.floor(Math.random() * 1000000);
      this.rng = new SeededRandom(this.seed);
      this.palette = PALETTES[options.palette || 'cyberpunk'] || PALETTES.cyberpunk;
      this.resolution = options.resolution || 16;
    }

    setPalette(paletteKey) {
      this.palette = PALETTES[paletteKey] || PALETTES.cyberpunk;
    }

    setSeed(seed) {
      this.seed = seed;
      this.rng.setSeed(seed);
    }

    generate(archetype = 'spaceship', options = {}) {
      const res = options.resolution || this.resolution;
      this.resolution = res;
      this.rng.setSeed(this.seed);

      let grid;
      switch (archetype) {
        case 'spaceship':
          grid = this._generateSpaceship(res);
          break;
        case 'creature':
          grid = this._generateCreature(res);
          break;
        case 'mecha':
          grid = this._generateMecha(res);
          break;
        case 'weapon':
          grid = this._generateWeapon(res);
          break;
        case 'diorama':
          grid = this._generateDiorama(res);
          break;
        case 'relic':
          grid = this._generateRelic(res);
          break;
        default:
          grid = this._generateSpaceship(res);
      }

      return {
        grid,
        seed: this.seed,
        archetype,
        palette: this.palette,
        bounds: grid.getBounds()
      };
    }

    _setSymmetricX(grid, x, y, z, voxelData, centerX, symmetry = 'bilateral') {
      grid.set(x, y, z, voxelData);
      const mirrorX = Math.round(centerX * 2) - x;
      if (mirrorX !== x) {
        grid.set(mirrorX, y, z, voxelData);
      }

      if (symmetry === 'quad') {
        const centerZ = grid.sizeZ / 2;
        const mirrorZ = Math.round(centerZ * 2) - z;
        grid.set(x, y, mirrorZ, voxelData);
        if (mirrorX !== x) {
          grid.set(mirrorX, y, mirrorZ, voxelData);
        }
      }
    }

    // --- 1. SPACESHIP GENERATOR ---
    _generateSpaceship(res) {
      const sizeX = res;
      const sizeY = Math.max(8, Math.round(res * 0.65));
      const sizeZ = Math.round(res * 1.3);
      const grid = new VoxelGrid(sizeX, sizeY, sizeZ);

      const centerX = Math.floor(sizeX / 2);
      const centerY = Math.floor(sizeY / 2);

      const primaryColor = this.rng.pick(this.palette.primary);
      const secondaryColor = this.rng.pick(this.palette.secondary);
      const detailColor = this.rng.pick(this.palette.detail);
      const glowColor = this.rng.pick(this.palette.glow);

      const wingStyle = this.rng.pick(['swept', 'delta', 'forward', 'ring', 'heavy']);
      const cockpitPos = Math.floor(sizeZ * 0.4);
      const wingSpan = Math.floor(sizeX * 0.45);

      for (let z = 2; z < sizeZ - 2; z++) {
        const zNorm = z / sizeZ;
        let width = 1;
        let height = 1;

        if (zNorm < 0.3) {
          width = Math.max(1, Math.round(zNorm * 5));
          height = Math.max(1, Math.round(zNorm * 4));
        } else if (zNorm < 0.75) {
          width = Math.round(2 + Math.sin((zNorm - 0.3) * Math.PI) * 2.5);
          height = Math.round(1.5 + Math.sin((zNorm - 0.3) * Math.PI) * 1.8);
        } else {
          width = Math.round(2 + (zNorm - 0.75) * 4);
          height = Math.round(2 + (zNorm - 0.75) * 2);
        }

        for (let dx = 0; dx <= width; dx++) {
          for (let dy = -height; dy <= height; dy++) {
            if (dx === width && Math.abs(dy) === height && this.rng.bool(0.4)) continue;

            let vColor = primaryColor;
            let vType = 'body';

            if (z >= cockpitPos - 2 && z <= cockpitPos + 2 && dy > 0 && dx <= 1) {
              vColor = glowColor;
              vType = 'glow';
            } else if (Math.abs(dy) === height || dx === width) {
              if (this.rng.bool(0.3)) vColor = secondaryColor;
            }

            this._setSymmetricX(grid, centerX + dx, centerY + dy, z, {
              color: vColor,
              type: vType,
              isGlow: vType === 'glow',
              glowColor
            }, centerX);
          }
        }
      }

      // Wings
      const wingZStart = Math.floor(sizeZ * 0.35);
      const wingZEnd = sizeZ - 3;
      const wingY = centerY;

      for (let z = wingZStart; z < wingZEnd; z++) {
        const prog = (z - wingZStart) / (wingZEnd - wingZStart);
        let spanAtZ = 0;

        if (wingStyle === 'swept') {
          spanAtZ = Math.round(prog * wingSpan);
        } else if (wingStyle === 'delta') {
          spanAtZ = Math.round((1 - Math.abs(prog - 0.5) * 1.5) * wingSpan);
        } else if (wingStyle === 'forward') {
          spanAtZ = Math.round((1 - prog) * wingSpan);
        } else {
          spanAtZ = Math.round(Math.sin(prog * Math.PI) * wingSpan);
        }

        for (let dx = 2; dx <= spanAtZ; dx++) {
          const thickness = dx > spanAtZ - 2 ? 0 : (this.rng.bool(0.3) ? 1 : 0);
          for (let dy = -thickness; dy <= thickness; dy++) {
            let wColor = secondaryColor;
            let isGlow = false;

            if (dx === spanAtZ && z > wingZEnd - 4) {
              wColor = glowColor;
              isGlow = true;
            } else if (dx % 2 === 0) {
              wColor = primaryColor;
            }

            this._setSymmetricX(grid, centerX + dx, wingY + dy, z, {
              color: wColor,
              type: isGlow ? 'glow' : 'accent',
              isGlow,
              glowColor
            }, centerX);
          }
        }
      }

      // Engines
      const engineZ = sizeZ - 2;
      const engineOffsets = [1, Math.min(3, Math.floor(wingSpan * 0.4))];

      for (const offset of engineOffsets) {
        if (centerX + offset >= sizeX) continue;
        for (let ex = -1; ex <= 1; ex++) {
          for (let ey = -1; ey <= 1; ey++) {
            this._setSymmetricX(grid, centerX + offset + ex, centerY + ey, engineZ - 1, {
              color: detailColor,
              type: 'detail'
            }, centerX);
          }
        }

        this._setSymmetricX(grid, centerX + offset, centerY, engineZ, {
          color: glowColor,
          type: 'glow',
          isGlow: true,
          glowColor
        }, centerX);

        const flameLength = this.rng.int(1, 3);
        for (let f = 1; f <= flameLength; f++) {
          if (engineZ + f < sizeZ) {
            this._setSymmetricX(grid, centerX + offset, centerY, engineZ + f, {
              color: glowColor,
              type: 'glow',
              isGlow: true,
              glowColor
            }, centerX);
          }
        }
      }

      return grid;
    }

    // --- 2. ALIEN CREATURE GENERATOR ---
    _generateCreature(res) {
      const sizeX = res;
      const sizeY = Math.round(res * 1.1);
      const sizeZ = Math.round(res * 0.8);
      const grid = new VoxelGrid(sizeX, sizeY, sizeZ);

      const centerX = Math.floor(sizeX / 2);
      const centerY = Math.floor(sizeY / 2);
      const centerZ = Math.floor(sizeZ / 2);

      const primaryColor = this.rng.pick(this.palette.primary);
      const secondaryColor = this.rng.pick(this.palette.secondary);
      const detailColor = this.rng.pick(this.palette.detail);
      const glowColor = this.rng.pick(this.palette.glow);

      const eyeCount = this.rng.pick([1, 2, 4]);
      const hasHorns = this.rng.bool(0.7);
      const hasTentacles = this.rng.bool(0.75);

      const radiusX = Math.floor(sizeX * 0.32);
      const radiusY = Math.floor(sizeY * 0.35);
      const radiusZ = Math.floor(sizeZ * 0.35);

      for (let dx = 0; dx <= radiusX; dx++) {
        for (let dy = -radiusY; dy <= radiusY; dy++) {
          for (let dz = -radiusZ; dz <= radiusZ; dz++) {
            const normDist = (dx * dx) / (radiusX * radiusX) +
                             (dy * dy) / (radiusY * radiusY) +
                             (dz * dz) / (radiusZ * radiusZ);

            if (normDist <= 1.0) {
              const isBorder = normDist > 0.8;
              const col = isBorder ? (this.rng.bool(0.4) ? secondaryColor : primaryColor) : primaryColor;

              this._setSymmetricX(grid, centerX + dx, centerY + dy, centerZ + dz, {
                color: col,
                type: 'body'
              }, centerX);
            }
          }
        }
      }

      // Eyes
      const frontZ = centerZ - Math.floor(radiusZ * 0.85);
      const eyeY = centerY + Math.floor(radiusY * 0.2);

      if (eyeCount === 1) {
        for (let ex = -1; ex <= 1; ex++) {
          for (let ey = -1; ey <= 1; ey++) {
            grid.set(centerX + ex, eyeY + ey, frontZ - 1, {
              color: glowColor,
              type: 'glow',
              isGlow: true,
              glowColor
            });
          }
        }
      } else {
        const eyeSpacing = Math.max(1, Math.floor(radiusX * 0.45));
        this._setSymmetricX(grid, centerX + eyeSpacing, eyeY, frontZ - 1, {
          color: glowColor,
          type: 'glow',
          isGlow: true,
          glowColor
        }, centerX);

        if (eyeCount === 4) {
          this._setSymmetricX(grid, centerX + eyeSpacing + 1, eyeY - 2, frontZ, {
            color: glowColor,
            type: 'glow',
            isGlow: true,
            glowColor
          }, centerX);
        }
      }

      // Horns
      if (hasHorns) {
        const hornBaseX = Math.floor(radiusX * 0.6);
        const hornBaseY = centerY + radiusY;
        const hornHeight = this.rng.int(3, Math.floor(sizeY * 0.28));

        for (let h = 0; h < hornHeight; h++) {
          const curX = hornBaseX + Math.round(h * 0.5);
          const curY = hornBaseY + h;
          const curZ = centerZ + Math.round(Math.sin(h * 0.5) * 1.5);

          this._setSymmetricX(grid, centerX + curX, curY, curZ, {
            color: secondaryColor,
            type: 'accent'
          }, centerX);

          if (h === hornHeight - 1 && this.rng.bool(0.6)) {
            this._setSymmetricX(grid, centerX + curX, curY + 1, curZ, {
              color: glowColor,
              type: 'glow',
              isGlow: true,
              glowColor
            }, centerX);
          }
        }
      }

      // Tentacles
      if (hasTentacles) {
        const tentacleRoots = [Math.floor(radiusX * 0.25), Math.floor(radiusX * 0.75)];
        for (const rootX of tentacleRoots) {
          let curX = rootX;
          let curY = centerY - radiusY;
          let curZ = centerZ;
          const len = this.rng.int(4, Math.floor(sizeY * 0.35));

          for (let l = 0; l < len; l++) {
            curY -= 1;
            curX += this.rng.int(-1, 1);
            curZ += this.rng.int(-1, 1);

            this._setSymmetricX(grid, centerX + curX, curY, curZ, {
              color: l % 2 === 0 ? detailColor : primaryColor,
              type: 'accent'
            }, centerX);
          }
        }
      }

      return grid;
    }

    // --- 3. MECHA GENERATOR ---
    _generateMecha(res) {
      const sizeX = res;
      const sizeY = Math.round(res * 1.25);
      const sizeZ = Math.round(res * 0.9);
      const grid = new VoxelGrid(sizeX, sizeY, sizeZ);

      const centerX = Math.floor(sizeX / 2);
      const baseGroundY = 1;
      const centerZ = Math.floor(sizeZ / 2);

      const primaryColor = this.rng.pick(this.palette.primary);
      const secondaryColor = this.rng.pick(this.palette.secondary);
      const detailColor = this.rng.pick(this.palette.detail);
      const glowColor = this.rng.pick(this.palette.glow);

      const legHeight = Math.floor(sizeY * 0.35);
      const torsoHeight = Math.floor(sizeY * 0.3);
      const headHeight = Math.floor(sizeY * 0.2);

      // Legs
      const hipSpacing = Math.max(2, Math.floor(sizeX * 0.22));
      for (let y = baseGroundY; y <= baseGroundY + legHeight; y++) {
        const isFoot = y <= baseGroundY + 1;
        const legWidth = isFoot ? 2 : 1;

        for (let lx = -legWidth; lx <= legWidth; lx++) {
          for (let lz = -1; lz <= (isFoot ? 2 : 1); lz++) {
            this._setSymmetricX(grid, centerX + hipSpacing + lx, y, centerZ + lz, {
              color: isFoot ? detailColor : primaryColor,
              type: isFoot ? 'detail' : 'body'
            }, centerX);
          }
        }
      }

      // Pelvis
      const pelvisY = baseGroundY + legHeight;
      for (let x = 0; x <= hipSpacing + 1; x++) {
        for (let z = -1; z <= 1; z++) {
          this._setSymmetricX(grid, centerX + x, pelvisY, centerZ + z, {
            color: detailColor,
            type: 'detail'
          }, centerX);
        }
      }

      // Torso
      const torsoStartY = pelvisY + 1;
      const torsoWidth = Math.floor(sizeX * 0.28);
      for (let y = torsoStartY; y < torsoStartY + torsoHeight; y++) {
        const tNorm = (y - torsoStartY) / torsoHeight;
        const w = Math.round(torsoWidth * (0.8 + tNorm * 0.4));

        for (let dx = 0; dx <= w; dx++) {
          for (let dz = -2; dz <= 2; dz++) {
            let col = primaryColor;
            let isGlow = false;

            if (tNorm > 0.4 && tNorm < 0.7 && dz === -2 && dx <= 1) {
              col = glowColor;
              isGlow = true;
            } else if (dx === w) {
              col = secondaryColor;
            }

            this._setSymmetricX(grid, centerX + dx, y, centerZ + dz, {
              color: col,
              type: isGlow ? 'glow' : 'body',
              isGlow,
              glowColor
            }, centerX);
          }
        }
      }

      // Shoulders & Arms
      const shoulderY = torsoStartY + torsoHeight - 2;
      const shoulderX = torsoWidth + 2;

      for (let sx = -1; sx <= 2; sx++) {
        for (let sy = 0; sy <= 2; sy++) {
          for (let sz = -2; sz <= 2; sz++) {
            this._setSymmetricX(grid, centerX + shoulderX + sx, shoulderY + sy, centerZ + sz, {
              color: secondaryColor,
              type: 'accent'
            }, centerX);
          }
        }
      }

      const armLen = Math.floor(torsoHeight * 0.9);
      for (let ay = 1; ay <= armLen; ay++) {
        const y = shoulderY - ay;
        this._setSymmetricX(grid, centerX + shoulderX, y, centerZ, {
          color: detailColor,
          type: 'detail'
        }, centerX);

        if (ay === armLen) {
          this._setSymmetricX(grid, centerX + shoulderX, y, centerZ - 2, {
            color: glowColor,
            type: 'glow',
            isGlow: true,
            glowColor
          }, centerX);
        }
      }

      // Head
      const headStartY = torsoStartY + torsoHeight;
      const headSize = Math.max(2, Math.floor(headHeight * 0.7));

      for (let dx = 0; dx <= headSize; dx++) {
        for (let dy = 0; dy <= headSize; dy++) {
          for (let dz = -headSize; dz <= headSize; dz++) {
            let col = primaryColor;
            let isGlow = false;

            if (dz === -headSize && dy === Math.floor(headSize * 0.5)) {
              col = glowColor;
              isGlow = true;
            }

            this._setSymmetricX(grid, centerX + dx, headStartY + dy, centerZ + dz, {
              color: col,
              type: isGlow ? 'glow' : 'body',
              isGlow,
              glowColor
            }, centerX);
          }
        }
      }

      this._setSymmetricX(grid, centerX + headSize, headStartY + headSize + 1, centerZ, {
        color: glowColor,
        type: 'glow',
        isGlow: true,
        glowColor
      }, centerX);

      return grid;
    }

    // --- 4. WEAPON GENERATOR ---
    _generateWeapon(res) {
      const sizeX = res;
      const sizeY = Math.round(res * 1.4);
      const sizeZ = Math.max(6, Math.round(res * 0.45));
      const grid = new VoxelGrid(sizeX, sizeY, sizeZ);

      const centerX = Math.floor(sizeX / 2);
      const centerZ = Math.floor(sizeZ / 2);

      const weaponType = this.rng.pick(['sword', 'axe', 'staff']);
      const primaryColor = this.rng.pick(this.palette.primary);
      const secondaryColor = this.rng.pick(this.palette.secondary);
      const detailColor = this.rng.pick(this.palette.detail);
      const glowColor = this.rng.pick(this.palette.glow);

      if (weaponType === 'sword') {
        for (let y = 1; y <= 3; y++) {
          for (let dx = 0; dx <= 1; dx++) {
            this._setSymmetricX(grid, centerX + dx, y, centerZ, {
              color: secondaryColor,
              type: 'accent'
            }, centerX);
          }
        }

        const gripHeight = Math.floor(sizeY * 0.2);
        for (let y = 4; y <= 4 + gripHeight; y++) {
          grid.set(centerX, y, centerZ, { color: detailColor, type: 'detail' });
        }

        const guardY = 5 + gripHeight;
        const guardWidth = Math.floor(sizeX * 0.38);
        for (let dx = 0; dx <= guardWidth; dx++) {
          const curY = guardY + (dx > guardWidth - 2 ? 1 : 0);
          this._setSymmetricX(grid, centerX + dx, curY, centerZ, {
            color: secondaryColor,
            type: 'accent'
          }, centerX);
        }

        grid.set(centerX, guardY, centerZ - 1, {
          color: glowColor,
          type: 'glow',
          isGlow: true,
          glowColor
        });

        const bladeStart = guardY + 1;
        const bladeEnd = sizeY - 2;
        const bladeHalfWidth = Math.max(1, Math.floor(sizeX * 0.15));

        for (let y = bladeStart; y <= bladeEnd; y++) {
          const prog = (y - bladeStart) / (bladeEnd - bladeStart);
          const curW = prog > 0.85 ? Math.max(0, Math.round(bladeHalfWidth * (1 - prog) * 5)) : bladeHalfWidth;

          for (let dx = 0; dx <= curW; dx++) {
            let col = primaryColor;
            let isGlow = false;

            if (dx === 0 && prog < 0.7 && y % 2 === 0) {
              col = glowColor;
              isGlow = true;
            } else if (dx === curW) {
              col = secondaryColor;
            }

            this._setSymmetricX(grid, centerX + dx, y, centerZ, {
              color: col,
              type: isGlow ? 'glow' : 'body',
              isGlow,
              glowColor
            }, centerX);
          }
        }
      } else if (weaponType === 'axe') {
        const shaftTop = Math.floor(sizeY * 0.85);
        for (let y = 2; y <= shaftTop; y++) {
          grid.set(centerX, y, centerZ, { color: detailColor, type: 'detail' });
        }

        const axeCenterY = Math.floor(sizeY * 0.65);
        const bladeSpan = Math.floor(sizeX * 0.42);
        const bladeHeight = Math.floor(sizeY * 0.25);

        for (let dy = -bladeHeight; dy <= bladeHeight; dy++) {
          const normY = dy / bladeHeight;
          const widthAtY = Math.round(Math.cos(normY * Math.PI * 0.5) * bladeSpan);

          for (let dx = 1; dx <= widthAtY; dx++) {
            const isEdge = dx >= widthAtY - 1;
            this._setSymmetricX(grid, centerX + dx, axeCenterY + dy, centerZ, {
              color: isEdge ? secondaryColor : primaryColor,
              type: isEdge ? 'accent' : 'body'
            }, centerX);
          }
        }

        for (let y = shaftTop + 1; y < sizeY - 1; y++) {
          grid.set(centerX, y, centerZ, { color: secondaryColor, type: 'accent' });
        }
        grid.set(centerX, axeCenterY, centerZ - 1, {
          color: glowColor,
          type: 'glow',
          isGlow: true,
          glowColor
        });
      } else {
        const staffTop = Math.floor(sizeY * 0.7);
        for (let y = 1; y <= staffTop; y++) {
          grid.set(centerX, y, centerZ, { color: detailColor, type: 'detail' });
          if (y % 4 === 0) {
            this._setSymmetricX(grid, centerX + 1, y, centerZ, {
              color: secondaryColor,
              type: 'accent'
            }, centerX);
          }
        }

        for (let p = 0; p < 5; p++) {
          this._setSymmetricX(grid, centerX + 2, staffTop + p, centerZ, {
            color: secondaryColor,
            type: 'accent'
          }, centerX);
        }

        const crystalCenterY = staffTop + 3;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) <= 2) {
                grid.set(centerX + dx, crystalCenterY + dy, centerZ + dz, {
                  color: glowColor,
                  type: 'glow',
                  isGlow: true,
                  glowColor
                });
              }
            }
          }
        }
      }

      return grid;
    }

    // --- 5. DIORAMA GENERATOR ---
    _generateDiorama(res) {
      const sizeX = res;
      const sizeY = Math.round(res * 0.85);
      const sizeZ = res;
      const grid = new VoxelGrid(sizeX, sizeY, sizeZ);

      const centerX = Math.floor(sizeX / 2);
      const centerZ = Math.floor(sizeZ / 2);
      const surfaceY = Math.floor(sizeY * 0.55);

      const primaryColor = this.rng.pick(this.palette.primary);
      const secondaryColor = this.rng.pick(this.palette.secondary);
      const detailColor = this.rng.pick(this.palette.detail);
      const glowColor = this.rng.pick(this.palette.glow);

      const islandRadius = Math.floor(res * 0.4);

      for (let x = 0; x < sizeX; x++) {
        for (let z = 0; z < sizeZ; z++) {
          const dx = x - centerX;
          const dz = z - centerZ;
          const distFromCenter = Math.sqrt(dx * dx + dz * dz);

          if (distFromCenter <= islandRadius) {
            const depthRatio = 1 - (distFromCenter / islandRadius);
            const maxDepth = Math.round(depthRatio * (surfaceY - 2));

            for (let y = surfaceY - maxDepth; y <= surfaceY; y++) {
              let col = primaryColor;
              let type = 'body';

              if (y === surfaceY) {
                col = secondaryColor;
                type = 'accent';
              } else if (y >= surfaceY - 2) {
                col = detailColor;
                type = 'detail';
              }

              grid.set(x, y, z, { color: col, type });
            }
          }
        }
      }

      // Miniature Castle Tower
      const towerRadius = Math.max(1, Math.floor(islandRadius * 0.35));
      const towerHeight = Math.floor(sizeY * 0.35);

      for (let tx = -towerRadius; tx <= towerRadius; tx++) {
        for (let tz = -towerRadius; tz <= towerRadius; tz++) {
          for (let ty = 1; ty <= towerHeight; ty++) {
            const y = surfaceY + ty;
            const isEdge = Math.abs(tx) === towerRadius || Math.abs(tz) === towerRadius;
            const isBattlements = ty === towerHeight && (tx + tz) % 2 === 0;

            if (isEdge && (ty < towerHeight || isBattlements)) {
              grid.set(centerX + tx, y, centerZ + tz, {
                color: primaryColor,
                type: 'body'
              });
            }
          }
        }
      }

      grid.set(centerX, surfaceY + towerHeight + 1, centerZ, {
        color: glowColor,
        type: 'glow',
        isGlow: true,
        glowColor
      });

      // Pine Tree
      const treeX = centerX + Math.floor(islandRadius * 0.55);
      const treeZ = centerZ - Math.floor(islandRadius * 0.4);
      if (grid.has(treeX, surfaceY, treeZ)) {
        grid.set(treeX, surfaceY + 1, treeZ, { color: detailColor, type: 'detail' });
        grid.set(treeX, surfaceY + 2, treeZ, { color: detailColor, type: 'detail' });

        for (let fx = -1; fx <= 1; fx++) {
          for (let fz = -1; fz <= 1; fz++) {
            grid.set(treeX + fx, surfaceY + 3, treeZ + fz, { color: secondaryColor, type: 'accent' });
          }
        }
        grid.set(treeX, surfaceY + 4, treeZ, { color: secondaryColor, type: 'accent' });
      }

      // Floating Cloud
      const cloudY = sizeY - 2;
      const cloudX = centerX - Math.floor(islandRadius * 0.6);
      const cloudZ = centerZ + Math.floor(islandRadius * 0.5);
      for (let cx = -1; cx <= 2; cx++) {
        for (let cz = -1; cz <= 1; cz++) {
          grid.set(cloudX + cx, cloudY, cloudZ + cz, {
            color: '#ffffff',
            type: 'glow',
            isGlow: true,
            glowColor: '#e0f2fe'
          });
        }
      }

      return grid;
    }

    // --- 6. ANCIENT CHEST GENERATOR ---
    _generateRelic(res) {
      const sizeX = Math.round(res * 0.9);
      const sizeY = Math.round(res * 0.85);
      const sizeZ = Math.round(res * 0.8);
      const grid = new VoxelGrid(sizeX, sizeY, sizeZ);

      const centerX = Math.floor(sizeX / 2);
      const centerY = Math.floor(sizeY / 2);
      const centerZ = Math.floor(sizeZ / 2);

      const primaryColor = this.rng.pick(this.palette.primary);
      const secondaryColor = this.rng.pick(this.palette.secondary);
      const glowColor = this.rng.pick(this.palette.glow);

      const halfW = Math.floor(sizeX * 0.38);
      const halfH = Math.floor(sizeY * 0.32);
      const halfD = Math.floor(sizeZ * 0.35);

      for (let dx = -halfW; dx <= halfW; dx++) {
        for (let dy = -halfH; dy <= halfH; dy++) {
          for (let dz = -halfD; dz <= halfD; dz++) {
            const isOuterX = Math.abs(dx) === halfW;
            const isOuterY = Math.abs(dy) === halfH;
            const isOuterZ = Math.abs(dz) === halfD;

            const edges = (isOuterX ? 1 : 0) + (isOuterY ? 1 : 0) + (isOuterZ ? 1 : 0);

            if (edges >= 2) {
              grid.set(centerX + dx, centerY + dy, centerZ + dz, {
                color: secondaryColor,
                type: 'accent'
              });
            } else if (edges === 1) {
              grid.set(centerX + dx, centerY + dy, centerZ + dz, {
                color: primaryColor,
                type: 'body'
              });
            }
          }
        }
      }

      const lockZ = centerZ - halfD - 1;
      grid.set(centerX, centerY, lockZ, {
        color: glowColor,
        type: 'glow',
        isGlow: true,
        glowColor
      });
      grid.set(centerX, centerY + 1, lockZ, {
        color: secondaryColor,
        type: 'accent'
      });

      return grid;
    }
  }

  // Export to global scope
  root.SeededRandom = SeededRandom;
  root.PALETTES = PALETTES;
  root.VoxelGrid = VoxelGrid;
  root.VoxelGenerator = VoxelGenerator;

})(typeof window !== 'undefined' ? window : globalThis);
