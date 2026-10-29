/**
 * PixelCraft Engine - Image to Pixel Art Converter Core
 * 100% Client-Side In-Browser HTML5 Canvas Processing
 * Features:
 * - Pixel Block Downscaling & Nearest-Neighbor Upscaling
 * - Color Quantization & Color Palette Mapping
 * - Dithering: Floyd-Steinberg, Bayer 4x4, Bayer 8x8
 * - Pre-filters: Brightness, Contrast, Saturation
 * - Drawing / Touch-up tools: Pencil, Eraser, Eyedropper, Bucket Fill, Undo/Redo
 * - Exporters: Crisp PNG (1x to 8x), SVG Vector, Minecraft .txt Blueprint, DMC/Perler Craft Chart
 */

(function (root) {
  // --- Retro & Craft Color Palettes ---
  const PALETTES = {
    db16: {
      id: 'db16',
      name: 'DawnBringer 16 (DB16)',
      colors: [
        '#140c1c', '#442434', '#30346d', '#4e4a4e', '#854c30', '#346524',
        '#d04648', '#757161', '#597dce', '#d27d2c', '#8595a1', '#6daa2c',
        '#d2a474', '#4992db', '#dad45e', '#deeed6'
      ]
    },
    db32: {
      id: 'db32',
      name: 'DawnBringer 32 (DB32)',
      colors: [
        '#000000', '#222034', '#45283c', '#663931', '#8f563b', '#df7126',
        '#d9a066', '#eec39a', '#fbf236', '#99e550', '#6abe30', '#37946e',
        '#4b692f', '#524b24', '#323c39', '#3f3f74', '#306082', '#5b6ee1',
        '#639bff', '#5fcde4', '#cbdbfc', '#ffffff', '#9badb7', '#847e87',
        '#696a6a', '#595652', '#76428a', '#ac3232', '#d95763', '#d77643',
        '#8a6f30', '#a8b5b2'
      ]
    },
    gameboy: {
      id: 'gameboy',
      name: 'Game Boy Classic (4 Colors)',
      colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
    },
    pico8: {
      id: 'pico8',
      name: 'PICO-8 (16 Colors)',
      colors: [
        '#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f',
        '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436',
        '#29adff', '#83769c', '#ff77a8', '#ffccaa'
      ]
    },
    nes: {
      id: 'nes',
      name: 'Nintendo NES (54 Colors)',
      colors: [
        '#7C7C7C', '#0000FC', '#0000BC', '#4428BC', '#940084', '#A80020',
        '#A81000', '#881400', '#503000', '#007800', '#006800', '#005800',
        '#004058', '#000000', '#BCBCBC', '#0078F8', '#0058F8', '#6844FC',
        '#D800CC', '#E40058', '#F83800', '#E45C10', '#AC7C00', '#00B800',
        '#00A800', '#00A844', '#008888', '#F8F8F8', '#3CBCFC', '#6888FC',
        '#9878F8', '#F878F8', '#F85898', '#F87858', '#FCA044', '#F8B800',
        '#B8F818', '#58D854', '#58F898', '#00E8D8', '#787878', '#FCFCFC',
        '#A4E4FC', '#B8B8F8', '#D8B8F8', '#F8B8F8', '#F8A4C0', '#F0D0B0',
        '#FCE0A8', '#F8D878', '#D8F878', '#B8F8B8', '#B8F8D8', '#00FCFC'
      ]
    },
    cyberpunk: {
      id: 'cyberpunk',
      name: 'Cyberpunk Neon (16 Colors)',
      colors: [
        '#05020a', '#14052b', '#2d0c59', '#59168b', '#9d174d', '#e11d48',
        '#fb7185', '#00f0ff', '#0284c7', '#042f2e', '#10b981', '#34d399',
        '#f59e0b', '#fbbf24', '#fef08a', '#ffffff'
      ]
    },
    perler: {
      id: 'perler',
      name: 'Perler Bead Midi Palette',
      colors: [
        '#000000', '#FFFFFF', '#6C7074', '#A5A9AC', '#1C2E4A', '#245388',
        '#3B82C4', '#7FB8DF', '#114D3C', '#28795A', '#4EB27F', '#8DE2A8',
        '#8D1C24', '#C92A38', '#E65D6A', '#F79B9B', '#48205C', '#7B3598',
        '#AF64C8', '#D9A7E8', '#854A23', '#BC6C30', '#DF9B53', '#F5CD8E',
        '#C98818', '#EAB723', '#F9E547', '#FEF58A'
      ]
    },
    minecraft: {
      id: 'minecraft',
      name: 'Minecraft Building Blocks',
      colors: [
        '#141519', '#3A3F44', '#797F82', '#D8DCDD', '#E2D6C5', '#976D4D',
        '#573B25', '#331F14', '#5C752F', '#3B5919', '#2E4314', '#3A2E1E',
        '#8F2625', '#B53932', '#CF6B58', '#E1A27A', '#BA6526', '#E2862B',
        '#D6A835', '#E5C94B', '#5A758D', '#2B4B74', '#1E2C4F', '#49306B',
        '#713E8D', '#2B6A68', '#42938E', '#6EBAB1', '#A3D2C8'
      ]
    },
    dmc: {
      id: 'dmc',
      name: 'DMC Thread Floss (Cross Stitch)',
      colors: [
        '#000000', '#ffffff', '#747474', '#c0c0c0', '#2b3749', '#3f5678',
        '#5e7ea8', '#99b6d8', '#1c3e35', '#2c5e51', '#478f7d', '#7dc4b3',
        '#681b22', '#992d37', '#cb4a56', '#f28e97', '#4b244a', '#753b73',
        '#aa5ca7', '#d99ad7', '#573319', '#824f2b', '#b57444', '#e2a979',
        '#a17616', '#cf9b24', '#f1c34a', '#fbe28c'
      ]
    },
    original: {
      id: 'original',
      name: 'Original Colors (No Palette Lock)',
      colors: null
    }
  };

  // Pre-parse hex colors to RGB for fast distance calculations
  const parsedPaletteCache = new Map();
  function getParsedPalette(paletteId) {
    if (parsedPaletteCache.has(paletteId)) {
      return parsedPaletteCache.get(paletteId);
    }
    const pal = PALETTES[paletteId];
    if (!pal || !pal.colors) {
      parsedPaletteCache.set(paletteId, null);
      return null;
    }
    const parsed = pal.colors.map(hex => {
      const clean = hex.replace('#', '');
      return {
        hex,
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16)
      };
    });
    parsedPaletteCache.set(paletteId, parsed);
    return parsed;
  }

  // Bayer Dithering Matrices
  const BAYER_4X4 = [
    [ 0,  8,  2, 10],
    [12,  4, 14,  6],
    [ 3, 11,  1,  9],
    [15,  7, 13,  5]
  ];

  const BAYER_8X8 = [
    [ 0, 32,  8, 40,  2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44,  4, 36, 14, 46,  6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [ 3, 35, 11, 43,  1, 33,  9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47,  7, 39, 13, 45,  5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21]
  ];

  // Weighted color distance (human eye perception: Red 30%, Green 59%, Blue 11%)
  function findClosestColor(r, g, b, paletteColors) {
    if (!paletteColors || paletteColors.length === 0) {
      return { r, g, b, hex: `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}` };
    }

    let minDistance = Infinity;
    let closest = paletteColors[0];

    for (let i = 0; i < paletteColors.length; i++) {
      const p = paletteColors[i];
      const dr = r - p.r;
      const dg = g - p.g;
      const db = b - p.b;

      // Perceptual distance formula
      const dist = dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114;
      if (dist < minDistance) {
        minDistance = dist;
        closest = p;
        if (dist === 0) break;
      }
    }

    return closest;
  }

  // --- Main PixelCraft Image Processing Engine ---
  class PixelEngine {
    constructor() {
      this.sourceImage = null;
      this.gridWidth = 0;
      this.gridHeight = 0;
      this.pixelData = null; // Uint8ClampedArray of processed low-res pixels [R, G, B, A, ...]
      this.history = [];
      this.historyIndex = -1;
      this.maxHistory = 20;
    }

    loadImage(imageElement) {
      this.sourceImage = imageElement;
      this.history = [];
      this.historyIndex = -1;
    }

    process(options = {}) {
      if (!this.sourceImage) return null;

      const blockSize = Math.max(2, options.blockSize || 12);
      const paletteId = options.paletteId || 'db16';
      const dither = options.dither || 'floyd-steinberg';
      const brightness = (options.brightness || 0) * 2.55;  // -50 to 50 -> -127 to 127
      const contrastVal = (options.contrast || 0);          // -50 to 50
      const saturation = (options.saturation || 0) * 0.02;  // -50 to 50 -> -1.0 to 1.0

      // Calculate low-resolution grid dimensions
      const origW = this.sourceImage.naturalWidth || this.sourceImage.width;
      const origH = this.sourceImage.naturalHeight || this.sourceImage.height;

      const gridW = Math.max(4, Math.floor(origW / blockSize));
      const gridH = Math.max(4, Math.floor(origH / blockSize));
      this.gridWidth = gridW;
      this.gridHeight = gridH;

      // 1. Draw source image downscaled on small offscreen canvas
      const downCanvas = document.createElement('canvas');
      downCanvas.width = gridW;
      downCanvas.height = gridH;
      const downCtx = downCanvas.getContext('2d', { willReadFrequently: true });
      downCtx.imageSmoothingEnabled = true;
      downCtx.drawImage(this.sourceImage, 0, 0, gridW, gridH);

      const imgData = downCtx.getImageData(0, 0, gridW, gridH);
      const data = imgData.data;

      // 2. Correct Contrast formula: when contrastVal = 0, contrastFactor = 1.0
      const contrastFactor = contrastVal === 0 ? 1 : (259 * (contrastVal * 2.55 + 255)) / (255 * (259 - contrastVal * 2.55));

      if (brightness !== 0 || contrastVal !== 0 || saturation !== 0) {
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] === 0) continue;

          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          // Brightness
          if (brightness !== 0) {
            r += brightness;
            g += brightness;
            b += brightness;
          }

          // Contrast
          if (contrastVal !== 0) {
            r = contrastFactor * (r - 128) + 128;
            g = contrastFactor * (g - 128) + 128;
            b = contrastFactor * (b - 128) + 128;
          }

          // Saturation
          if (saturation !== 0) {
            const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
            r = gray + (r - gray) * (1 + saturation);
            g = gray + (g - gray) * (1 + saturation);
            b = gray + (b - gray) * (1 + saturation);
          }

          data[i] = Math.min(255, Math.max(0, r));
          data[i + 1] = Math.min(255, Math.max(0, g));
          data[i + 2] = Math.min(255, Math.max(0, b));
        }
      }

      // 3. Palette Reduction & Dithering
      const paletteColors = getParsedPalette(paletteId);

      if (paletteColors) {
        if (dither === 'floyd-steinberg') {
          this._applyFloydSteinberg(data, gridW, gridH, paletteColors);
        } else if (dither === 'bayer-4x4') {
          this._applyBayerDither(data, gridW, gridH, paletteColors, BAYER_4X4, 4, 16);
        } else if (dither === 'bayer-8x8') {
          this._applyBayerDither(data, gridW, gridH, paletteColors, BAYER_8X8, 8, 64);
        } else {
          // No dithering: simple closest color quantization
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 32) {
              data[i + 3] = 0;
              continue;
            }
            const match = findClosestColor(data[i], data[i + 1], data[i + 2], paletteColors);
            data[i] = match.r;
            data[i + 1] = match.g;
            data[i + 2] = match.b;
            data[i + 3] = 255;
          }
        }
      }

      this.pixelData = new Uint8ClampedArray(data);
      this._saveHistory();

      return {
        gridWidth: gridW,
        gridHeight: gridH,
        pixelData: this.pixelData,
        paletteId
      };
    }

    _applyFloydSteinberg(data, width, height, paletteColors) {
      const buffer = new Float32Array(width * height * 3);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const bIdx = (y * width + x) * 3;
          buffer[bIdx] = data[idx];
          buffer[bIdx + 1] = data[idx + 1];
          buffer[bIdx + 2] = data[idx + 2];
        }
      }

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const bIdx = (y * width + x) * 3;

          if (data[idx + 3] < 32) {
            data[idx + 3] = 0;
            continue;
          }

          const oldR = Math.min(255, Math.max(0, buffer[bIdx]));
          const oldG = Math.min(255, Math.max(0, buffer[bIdx + 1]));
          const oldB = Math.min(255, Math.max(0, buffer[bIdx + 2]));

          const match = findClosestColor(oldR, oldG, oldB, paletteColors);

          data[idx] = match.r;
          data[idx + 1] = match.g;
          data[idx + 2] = match.b;
          data[idx + 3] = 255;

          const errR = oldR - match.r;
          const errG = oldG - match.g;
          const errB = oldB - match.b;

          this._diffuseError(buffer, width, height, x + 1, y, errR, errG, errB, 7 / 16);
          this._diffuseError(buffer, width, height, x - 1, y + 1, errR, errG, errB, 3 / 16);
          this._diffuseError(buffer, width, height, x, y + 1, errR, errG, errB, 5 / 16);
          this._diffuseError(buffer, width, height, x + 1, y + 1, errR, errG, errB, 1 / 16);
        }
      }
    }

    _diffuseError(buffer, width, height, x, y, errR, errG, errB, factor) {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      const idx = (y * width + x) * 3;
      buffer[idx] += errR * factor;
      buffer[idx + 1] += errG * factor;
      buffer[idx + 2] += errB * factor;
    }

    _applyBayerDither(data, width, height, paletteColors, matrix, matrixSize, matrixDiv) {
      const spread = 40;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          if (data[idx + 3] < 32) {
            data[idx + 3] = 0;
            continue;
          }

          const threshold = (matrix[y % matrixSize][x % matrixSize] / matrixDiv - 0.5) * spread;

          const r = Math.min(255, Math.max(0, data[idx] + threshold));
          const g = Math.min(255, Math.max(0, data[idx + 1] + threshold));
          const b = Math.min(255, Math.max(0, data[idx + 2] + threshold));

          const match = findClosestColor(r, g, b, paletteColors);

          data[idx] = match.r;
          data[idx + 1] = match.g;
          data[idx + 2] = match.b;
          data[idx + 3] = 255;
        }
      }
    }

    setPixel(x, y, colorHex) {
      if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight || !this.pixelData) return;
      const idx = (y * this.gridWidth + x) * 4;

      if (colorHex === null) {
        this.pixelData[idx + 3] = 0;
      } else {
        const clean = colorHex.replace('#', '');
        this.pixelData[idx] = parseInt(clean.substring(0, 2), 16);
        this.pixelData[idx + 1] = parseInt(clean.substring(2, 4), 16);
        this.pixelData[idx + 2] = parseInt(clean.substring(4, 6), 16);
        this.pixelData[idx + 3] = 255;
      }
    }

    getPixel(x, y) {
      if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight || !this.pixelData) return null;
      const idx = (y * this.gridWidth + x) * 4;
      if (this.pixelData[idx + 3] === 0) return null;
      const r = this.pixelData[idx].toString(16).padStart(2, '0');
      const g = this.pixelData[idx + 1].toString(16).padStart(2, '0');
      const b = this.pixelData[idx + 2].toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }

    floodFill(startX, startY, fillHex) {
      if (!this.pixelData) return;
      const targetColor = this.getPixel(startX, startY);
      if (targetColor === fillHex) return;

      const clean = fillHex.replace('#', '');
      const fr = parseInt(clean.substring(0, 2), 16);
      const fg = parseInt(clean.substring(2, 4), 16);
      const fb = parseInt(clean.substring(4, 6), 16);

      const queue = [[startX, startY]];
      const visited = new Uint8Array(this.gridWidth * this.gridHeight);

      while (queue.length > 0) {
        const [x, y] = queue.pop();
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) continue;
        const vIdx = y * this.gridWidth + x;
        if (visited[vIdx]) continue;
        visited[vIdx] = 1;

        const curColor = this.getPixel(x, y);
        if (curColor === targetColor) {
          const idx = vIdx * 4;
          this.pixelData[idx] = fr;
          this.pixelData[idx + 1] = fg;
          this.pixelData[idx + 2] = fb;
          this.pixelData[idx + 3] = 255;

          queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
      }

      this._saveHistory();
    }

    _saveHistory() {
      if (!this.pixelData) return;
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(new Uint8ClampedArray(this.pixelData));
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
      this.historyIndex = this.history.length - 1;
    }

    undo() {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.pixelData = new Uint8ClampedArray(this.history[this.historyIndex]);
        return true;
      }
      return false;
    }

    redo() {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.pixelData = new Uint8ClampedArray(this.history[this.historyIndex]);
        return true;
      }
      return false;
    }

    renderToCanvas(displayCanvas, options = {}) {
      if (!this.pixelData || !displayCanvas) return;

      const scale = options.scale || 1;
      const showGrid = options.showGrid || false;

      displayCanvas.width = this.gridWidth * scale;
      displayCanvas.height = this.gridHeight * scale;

      const ctx = displayCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

      const offCanvas = document.createElement('canvas');
      offCanvas.width = this.gridWidth;
      offCanvas.height = this.gridHeight;
      const offCtx = offCanvas.getContext('2d');
      const imgData = offCtx.createImageData(this.gridWidth, this.gridHeight);
      imgData.data.set(this.pixelData);
      offCtx.putImageData(imgData, 0, 0);

      ctx.drawImage(offCanvas, 0, 0, displayCanvas.width, displayCanvas.height);

      if (showGrid && scale >= 6) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = 0; x <= this.gridWidth; x++) {
          const px = Math.floor(x * scale) + 0.5;
          ctx.moveTo(px, 0);
          ctx.lineTo(px, displayCanvas.height);
        }

        for (let y = 0; y <= this.gridHeight; y++) {
          const py = Math.floor(y * scale) + 0.5;
          ctx.moveTo(0, py);
          ctx.lineTo(displayCanvas.width, py);
        }

        ctx.stroke();
      }
    }

    exportPNG(upscale = 4) {
      if (!this.pixelData) return null;
      const canvas = document.createElement('canvas');
      canvas.width = this.gridWidth * upscale;
      canvas.height = this.gridHeight * upscale;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const offCanvas = document.createElement('canvas');
      offCanvas.width = this.gridWidth;
      offCanvas.height = this.gridHeight;
      const offCtx = offCanvas.getContext('2d');
      const imgData = offCtx.createImageData(this.gridWidth, this.gridHeight);
      imgData.data.set(this.pixelData);
      offCtx.putImageData(imgData, 0, 0);

      ctx.drawImage(offCanvas, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    }

    exportSVG() {
      if (!this.pixelData) return null;
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.gridWidth} ${this.gridHeight}" width="${this.gridWidth * 16}" height="${this.gridHeight * 16}" shape-rendering="crispEdges">\n`;

      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridWidth; x++) {
          const idx = (y * this.gridWidth + x) * 4;
          if (this.pixelData[idx + 3] === 0) continue;
          const hex = `#${this.pixelData[idx].toString(16).padStart(2, '0')}${this.pixelData[idx + 1].toString(16).padStart(2, '0')}${this.pixelData[idx + 2].toString(16).padStart(2, '0')}`;
          svg += `  <rect x="${x}" y="${y}" width="1" height="1" fill="${hex}" />\n`;
        }
      }

      svg += `</svg>`;
      return svg;
    }

    exportMinecraftBlueprint() {
      if (!this.pixelData) return null;
      const colorCounts = new Map();

      for (let i = 0; i < this.pixelData.length; i += 4) {
        if (this.pixelData[i + 3] === 0) continue;
        const hex = `#${this.pixelData[i].toString(16).padStart(2, '0')}${this.pixelData[i + 1].toString(16).padStart(2, '0')}${this.pixelData[i + 2].toString(16).padStart(2, '0')}`;
        colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
      }

      let txt = `========================================================\n`;
      txt += `MINECRAFT PIXEL ART BLUEPRINT & BLOCK CHECKLIST\n`;
      txt += `Dimensions: ${this.gridWidth} Blocks Wide × ${this.gridHeight} Blocks High\n`;
      txt += `Total Blocks: ${Array.from(colorCounts.values()).reduce((a, b) => a + b, 0)}\n`;
      txt += `========================================================\n\n`;
      txt += `BLOCK MATERIAL INVENTORY:\n`;

      for (const [hex, count] of colorCounts.entries()) {
        const stacks = Math.floor(count / 64);
        const rem = count % 64;
        const stackStr = stacks > 0 ? `(${stacks} stacks + ${rem})` : `(${rem} blocks)`;
        txt += `• Color ${hex.toUpperCase()} : ${count} blocks ${stackStr}\n`;
      }

      txt += `\nGenerated with PixelCraft Engine (100% In-Browser)\n`;
      return txt;
    }

    exportCraftChart() {
      if (!this.pixelData) return null;
      const counts = new Map();

      for (let i = 0; i < this.pixelData.length; i += 4) {
        if (this.pixelData[i + 3] === 0) continue;
        const hex = `#${this.pixelData[i].toString(16).padStart(2, '0')}${this.pixelData[i + 1].toString(16).padStart(2, '0')}${this.pixelData[i + 2].toString(16).padStart(2, '0')}`.toUpperCase();
        counts.set(hex, (counts.get(hex) || 0) + 1);
      }

      let txt = `========================================================\n`;
      txt += `PIXELCRAFT CRAFT PATTERN & BEAD / THREAD COLOR CHART\n`;
      txt += `Grid Dimensions: ${this.gridWidth} × ${this.gridHeight} Stitches / Beads\n`;
      txt += `Total Beads/Stitches: ${Array.from(counts.values()).reduce((a, b) => a + b, 0)}\n`;
      txt += `========================================================\n\n`;
      txt += `COLOR CODE CHECKLIST:\n`;

      let symIdx = 1;
      for (const [hex, count] of counts.entries()) {
        txt += `[Symbol #${symIdx}] Color: ${hex} | Quantity Required: ${count}\n`;
        symIdx++;
      }

      txt += `\nGenerated with PixelCraft Engine\n`;
      return txt;
    }
  }

  root.PixelEngine = PixelEngine;
  root.PALETTES = PALETTES;

})(typeof window !== 'undefined' ? window : globalThis);
