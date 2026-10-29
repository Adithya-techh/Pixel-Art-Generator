/**
 * Built-in Sample Image Presets
 * Generates crisp pixel art samples as data URLs on-the-fly without network requests.
 */

(function (root) {
  function createSampleDataUrl(width, height, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, width, height);
    return canvas.toDataURL('image/png');
  }

  const SAMPLES = {
    cat: {
      name: '🐱 Retro Pixel Cat',
      getDataUrl: () => createSampleDataUrl(64, 64, (ctx) => {
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, 64);
        grad.addColorStop(0, '#f43f5e');
        grad.addColorStop(1, '#fbbf24');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);

        // Cat Silhouette
        ctx.fillStyle = '#1e1b4b';
        // Ears
        ctx.beginPath();
        ctx.moveTo(18, 16); ctx.lineTo(26, 30); ctx.lineTo(14, 30); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(46, 16); ctx.lineTo(50, 30); ctx.lineTo(38, 30); ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(32, 34, 16, 0, Math.PI * 2);
        ctx.fill();
        // Body
        ctx.beginPath();
        ctx.ellipse(32, 54, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        // Glowing Eyes
        ctx.fillStyle = '#34d399';
        ctx.beginPath(); ctx.arc(26, 32, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(38, 32, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.fillRect(25, 30, 2, 4);
        ctx.fillRect(37, 30, 2, 4);
      })
    },
    mushroom: {
      name: '🍄 8-Bit Mushroom',
      getDataUrl: () => createSampleDataUrl(64, 64, (ctx) => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 64, 64);

        // Cap
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(32, 32, 22, Math.PI, 0, false);
        ctx.fill();
        ctx.fillRect(10, 32, 44, 8);

        // White spots
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(32, 22, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(18, 28, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(46, 28, 4, 0, Math.PI * 2); ctx.fill();

        // Stem
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(22, 38, 20, 18);
        ctx.fillStyle = '#000000';
        ctx.fillRect(26, 42, 3, 6);
        ctx.fillRect(35, 42, 3, 6);
      })
    },
    sword: {
      name: '⚔️ Fantasy Relic Sword',
      getDataUrl: () => createSampleDataUrl(64, 64, (ctx) => {
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, 64, 64);

        // Blade glowing line
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(14, 50);
        ctx.lineTo(50, 14);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(14, 50);
        ctx.lineTo(50, 14);
        ctx.stroke();

        // Crossguard
        ctx.fillStyle = '#fbbf24';
        ctx.save();
        ctx.translate(22, 42);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-12, -3, 24, 6);
        ctx.restore();

        // Pommel
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(14, 50, 4, 0, Math.PI * 2);
        ctx.fill();
      })
    },
    sunset: {
      name: '🌅 Synthwave Sunset',
      getDataUrl: () => createSampleDataUrl(80, 80, (ctx) => {
        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, 50);
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(0.5, '#701a75');
        grad.addColorStop(1, '#f43f5e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 80, 50);

        // Sun
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(40, 38, 18, 0, Math.PI * 2);
        ctx.fill();

        // Sun stripes
        ctx.fillStyle = '#701a75';
        for (let y = 30; y < 50; y += 4) {
          ctx.fillRect(20, y, 40, 2);
        }

        // Ocean floor
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 50, 80, 30);

        // Perspective grid lines
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        for (let x = -20; x <= 100; x += 15) {
          ctx.beginPath();
          ctx.moveTo(40, 50);
          ctx.lineTo(x, 80);
          ctx.stroke();
        }
        for (let y = 52; y <= 80; y += (y - 48)) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(80, y);
          ctx.stroke();
        }
      })
    }
  };

  root.SamplePresets = SAMPLES;
})(typeof window !== 'undefined' ? window : globalThis);
