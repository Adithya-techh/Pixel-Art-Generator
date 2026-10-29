/**
 * PixelCraft — Main Application Coordinator
 * Powers both the Image to Pixel Art Converter and the 3D Voxel Generator
 */

(function () {
  // Ensure DOM is ready
  function initApp() {
    const engine = new window.PixelEngine();
    let currentScale = 8;
    let showGrid = true;
    let currentTool = 'pencil'; // 'pencil', 'eraser', 'picker', 'bucket'
    let isDrawing = false;
    let isOriginalMode = false;

    // Elements
    const canvas = document.getElementById('pixel-display-canvas');
    const emptyState = document.getElementById('empty-state');
    const fileInput = document.getElementById('image-file-input');
    const dropZone = document.getElementById('drop-zone');

    const sliderBlockSize = document.getElementById('slider-block-size');
    const labelBlockSize = document.getElementById('label-block-size');
    const selectPalette = document.getElementById('select-palette');
    const selectDither = document.getElementById('select-dither');

    const sliderBrightness = document.getElementById('slider-brightness');
    const sliderContrast = document.getElementById('slider-contrast');
    const sliderSaturation = document.getElementById('slider-saturation');
    const valBrightness = document.getElementById('val-brightness');
    const valContrast = document.getElementById('val-contrast');
    const valSaturation = document.getElementById('val-saturation');

    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const zoomLabel = document.getElementById('zoom-label');
    const btnToggleGrid = document.getElementById('btn-toggle-grid');
    const btnViewOriginal = document.getElementById('btn-view-original');

    const colorPicker = document.getElementById('draw-color-picker');
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');

    const statGridSize = document.getElementById('stat-grid-size');
    const statTotalPixels = document.getElementById('stat-total-pixels');
    const toast = document.getElementById('toast');

    // --- Helper: Show Toast Notification ---
    function showToast(message) {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 2800);
    }

    // --- Helper: Refresh Pixel Output ---
    function updatePixelArt() {
      if (!engine.sourceImage) return;

      const blockSize = parseInt(sliderBlockSize.value, 10);
      const paletteId = selectPalette.value;
      const dither = selectDither.value;
      const brightness = parseInt(sliderBrightness.value, 10);
      const contrast = parseInt(sliderContrast.value, 10);
      const saturation = parseInt(sliderSaturation.value, 10);

      engine.process({
        blockSize,
        paletteId,
        dither,
        brightness,
        contrast,
        saturation
      });

      renderDisplay();
    }

    function renderDisplay() {
      if (!engine.pixelData) return;

      if (isOriginalMode && engine.sourceImage) {
        // Draw original image
        canvas.width = engine.sourceImage.naturalWidth || engine.sourceImage.width;
        canvas.height = engine.sourceImage.naturalHeight || engine.sourceImage.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(engine.sourceImage, 0, 0);
        return;
      }

      engine.renderToCanvas(canvas, {
        scale: currentScale,
        showGrid: showGrid
      });

      // Update HUD Stats
      if (statGridSize) {
        statGridSize.textContent = `${engine.gridWidth} × ${engine.gridHeight} px`;
      }
      if (statTotalPixels) {
        statTotalPixels.textContent = (engine.gridWidth * engine.gridHeight).toLocaleString();
      }
    }

    // --- Load Image File or URL ---
    function loadImageSource(src) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        engine.loadImage(img);
        emptyState.classList.add('hidden');
        canvas.classList.remove('hidden');

        // Choose smart default scale based on image size
        const maxDim = Math.max(img.width, img.height);
        if (maxDim > 800) currentScale = 4;
        else if (maxDim > 400) currentScale = 6;
        else currentScale = 8;
        updateZoomLabel();

        updatePixelArt();
        showToast('Image converted to pixel art!');
      };
      img.src = src;
    }

    function handleFile(file) {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => loadImageSource(e.target.result);
      reader.readAsDataURL(file);
    }

    // --- Event Listeners: File Upload & Drag/Drop ---
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-active');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-active');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-active');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    // Paste image from clipboard (Ctrl+V)
    window.addEventListener('paste', (e) => {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          handleFile(file);
          break;
        }
      }
    });

    // Quick Sample Buttons
    document.querySelectorAll('.sample-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.sample;
        if (window.SamplePresets && window.SamplePresets[type]) {
          const dataUrl = window.SamplePresets[type].getDataUrl();
          loadImageSource(dataUrl);
        }
      });
    });

    document.getElementById('btn-quick-sample').addEventListener('click', () => {
      if (window.SamplePresets && window.SamplePresets.cat) {
        loadImageSource(window.SamplePresets.cat.getDataUrl());
      }
    });

    // Quick Micro-Tool Cards (Preset switchers)
    document.querySelectorAll('.quick-tool-card').forEach(card => {
      card.addEventListener('click', () => {
        const preset = card.dataset.preset;
        if (preset === 'gameboy') {
          selectPalette.value = 'gameboy';
          selectDither.value = 'bayer-4x4';
        } else if (preset === 'minecraft') {
          selectPalette.value = 'minecraft';
          selectDither.value = 'floyd-steinberg';
        } else if (preset === 'perler') {
          selectPalette.value = 'perler';
          selectDither.value = 'none';
        } else {
          selectPalette.value = 'db16';
          selectDither.value = 'floyd-steinberg';
        }
        if (!engine.sourceImage && window.SamplePresets) {
          loadImageSource(window.SamplePresets.cat.getDataUrl());
        } else {
          updatePixelArt();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // --- Control Sliders & Dropdowns ---
    sliderBlockSize.addEventListener('input', (e) => {
      labelBlockSize.textContent = `${e.target.value}px`;
      updatePixelArt();
    });

    selectPalette.addEventListener('change', updatePixelArt);
    selectDither.addEventListener('change', updatePixelArt);

    sliderBrightness.addEventListener('input', (e) => {
      valBrightness.textContent = `${e.target.value}%`;
      updatePixelArt();
    });

    sliderContrast.addEventListener('input', (e) => {
      valContrast.textContent = `${e.target.value}%`;
      updatePixelArt();
    });

    sliderSaturation.addEventListener('input', (e) => {
      valSaturation.textContent = `${e.target.value}%`;
      updatePixelArt();
    });

    // Toggle Image Adjustments Accordion
    const toggleAdjust = document.getElementById('toggle-adjustments');
    const adjustPanel = document.getElementById('adjustments-panel');
    const adjustIcon = document.getElementById('adjust-icon');
    toggleAdjust.addEventListener('click', () => {
      adjustPanel.classList.toggle('hidden');
      adjustIcon.textContent = adjustPanel.classList.contains('hidden') ? '▸' : '▾';
    });

    // --- Zoom Controls ---
    function updateZoomLabel() {
      zoomLabel.textContent = `${Math.round((currentScale / 8) * 100)}%`;
    }

    btnZoomIn.addEventListener('click', () => {
      currentScale = Math.min(24, currentScale + 2);
      updateZoomLabel();
      renderDisplay();
    });

    btnZoomOut.addEventListener('click', () => {
      currentScale = Math.max(2, currentScale - 2);
      updateZoomLabel();
      renderDisplay();
    });

    btnToggleGrid.addEventListener('click', () => {
      showGrid = !showGrid;
      btnToggleGrid.classList.toggle('bg-accentMint/20', showGrid);
      btnToggleGrid.classList.toggle('border-accentMint', showGrid);
      btnToggleGrid.classList.toggle('text-accentMint', showGrid);
      renderDisplay();
    });

    // View Original Hold/Toggle
    const startViewOrig = () => { isOriginalMode = true; renderDisplay(); };
    const endViewOrig = () => { isOriginalMode = false; renderDisplay(); };
    btnViewOriginal.addEventListener('mousedown', startViewOrig);
    btnViewOriginal.addEventListener('mouseup', endViewOrig);
    btnViewOriginal.addEventListener('mouseleave', endViewOrig);
    btnViewOriginal.addEventListener('touchstart', (e) => { e.preventDefault(); startViewOrig(); });
    btnViewOriginal.addEventListener('touchend', endViewOrig);

    // --- Interactive Drawing Tools on Canvas ---
    const toolBtns = {
      pencil: document.getElementById('tool-pencil'),
      eraser: document.getElementById('tool-eraser'),
      picker: document.getElementById('tool-picker'),
      bucket: document.getElementById('tool-bucket')
    };

    function setTool(toolName) {
      currentTool = toolName;
      Object.keys(toolBtns).forEach(k => toolBtns[k].classList.remove('active', 'text-accentMint', 'bg-accentMint/20'));
      toolBtns[toolName].classList.add('active', 'text-accentMint', 'bg-accentMint/20');
    }

    toolBtns.pencil.addEventListener('click', () => setTool('pencil'));
    toolBtns.eraser.addEventListener('click', () => setTool('eraser'));
    toolBtns.picker.addEventListener('click', () => setTool('picker'));
    toolBtns.bucket.addEventListener('click', () => setTool('bucket'));

    function getGridCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);

      const canvasX = (clientX - rect.left) * scaleX;
      const canvasY = (clientY - rect.top) * scaleY;

      return {
        x: Math.floor(canvasX / currentScale),
        y: Math.floor(canvasY / currentScale)
      };
    }

    function applyDrawingTool(e) {
      if (!engine.pixelData) return;
      const { x, y } = getGridCoords(e);
      const activeColor = colorPicker.value;

      if (currentTool === 'pencil') {
        engine.setPixel(x, y, activeColor);
        renderDisplay();
      } else if (currentTool === 'eraser') {
        engine.setPixel(x, y, null);
        renderDisplay();
      } else if (currentTool === 'picker') {
        const hex = engine.getPixel(x, y);
        if (hex) colorPicker.value = hex;
        setTool('pencil');
      } else if (currentTool === 'bucket') {
        engine.floodFill(x, y, activeColor);
        renderDisplay();
      }
    }

    canvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      applyDrawingTool(e);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (isDrawing && (currentTool === 'pencil' || currentTool === 'eraser')) {
        applyDrawingTool(e);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDrawing) {
        isDrawing = false;
        engine._saveHistory();
      }
    });

    btnUndo.addEventListener('click', () => {
      if (engine.undo()) {
        renderDisplay();
        showToast('Undo');
      }
    });

    btnRedo.addEventListener('click', () => {
      if (engine.redo()) {
        renderDisplay();
        showToast('Redo');
      }
    });

    // --- Export Actions ---
    function triggerDownload(content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    document.getElementById('btn-export-png').addEventListener('click', () => {
      const dataUrl = engine.exportPNG(4);
      if (!dataUrl) return;
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'pixelcraft_art_4x.png';
      a.click();
      showToast('Downloaded 4x Crisp PNG!');
    });

    document.getElementById('btn-export-svg').addEventListener('click', () => {
      const svg = engine.exportSVG();
      if (!svg) return;
      triggerDownload(svg, 'pixelcraft_vector.svg', 'image/svg+xml');
      showToast('Downloaded SVG Vector!');
    });

    document.getElementById('btn-export-mc').addEventListener('click', () => {
      const mc = engine.exportMinecraftBlueprint();
      if (!mc) return;
      triggerDownload(mc, 'minecraft_pixelart_blueprint.txt', 'text/plain');
      showToast('Downloaded Minecraft Blueprint!');
    });

    document.getElementById('btn-export-craft').addEventListener('click', () => {
      const chart = engine.exportCraftChart();
      if (!chart) return;
      triggerDownload(chart, 'pixelcraft_bead_thread_chart.txt', 'text/plain');
      showToast('Downloaded Craft Pattern Chart!');
    });

    document.getElementById('btn-copy-clipboard').addEventListener('click', async () => {
      const dataUrl = engine.exportPNG(2);
      if (!dataUrl) return;
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('Copied pixel art to clipboard!');
      } catch (err) {
        showToast('Clipboard copy not supported by browser.');
      }
    });

    // --- Mode Switcher (Converter vs 3D Voxel Generator) ---
    const tabConverter = document.getElementById('tab-converter');
    const tabGenerator = document.getElementById('tab-generator');
    const viewConverter = document.getElementById('view-converter');
    const viewGenerator = document.getElementById('view-generator');
    let voxelApp3D = null;

    tabConverter.addEventListener('click', () => {
      tabConverter.classList.add('active');
      tabConverter.classList.remove('text-gray-400');
      tabGenerator.classList.remove('active');
      tabGenerator.classList.add('text-gray-400');
      viewConverter.classList.remove('hidden');
      viewGenerator.classList.add('hidden');
    });

    tabGenerator.addEventListener('click', () => {
      tabGenerator.classList.add('active');
      tabGenerator.classList.remove('text-gray-400');
      tabConverter.classList.remove('active');
      tabConverter.classList.add('text-gray-400');
      viewGenerator.classList.remove('hidden');
      viewConverter.classList.add('hidden');

      // Initialize 3D engine if not already running
      if (!voxelApp3D && window.THREE && window.VoxelGenerator) {
        init3DGenerator();
      }
    });

    // 3D Voxel Generator Logic
    function init3DGenerator() {
      const container3D = document.getElementById('canvas-container');
      const vGenerator = new window.VoxelGenerator({ seed: 1337, palette: 'cyberpunk', resolution: 16 });
      let current3DArchetype = 'spaceship';
      let explodeFactor = 0;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#0b0f19');
      const camera = new THREE.PerspectiveCamera(45, container3D.clientWidth / container3D.clientHeight, 0.1, 1000);
      camera.position.set(22, 16, 26);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setSize(container3D.clientWidth, container3D.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      container3D.appendChild(renderer.domElement);

      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.target.set(0, 4, 0);

      const ambient = new THREE.AmbientLight('#ffffff', 0.85);
      scene.add(ambient);
      const sun = new THREE.DirectionalLight('#ffffff', 1.8);
      sun.position.set(18, 30, 22);
      sun.castShadow = true;
      scene.add(sun);

      const gridHelper = new THREE.GridHelper(40, 40, '#10b981', '#1f2937');
      scene.add(gridHelper);

      const modelGroup = new THREE.Group();
      scene.add(modelGroup);

      function rebuild3D() {
        while (modelGroup.children.length > 0) {
          const obj = modelGroup.children[0];
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
          modelGroup.remove(obj);
        }

        const data = vGenerator.generate(current3DArchetype);
        const voxels = data.grid.getAll();
        const bounds = data.bounds;
        const cx = (bounds.minX + bounds.maxX) / 2;
        const cy = (bounds.minY + bounds.maxY) / 2;
        const cz = (bounds.minZ + bounds.maxZ) / 2;

        const geo = new THREE.BoxGeometry(0.95, 0.95, 0.95);
        const mat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.15 });
        const mesh = new THREE.InstancedMesh(geo, mat, voxels.length);
        mesh.castShadow = true;

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();

        for (let i = 0; i < voxels.length; i++) {
          const v = voxels[i];
          let vx = v.x - cx;
          let vy = v.y - bounds.minY + 0.5;
          let vz = v.z - cz;

          if (explodeFactor > 0) {
            const dir = new THREE.Vector3(vx, vy, vz).normalize();
            vx += dir.x * explodeFactor * 8;
            vy += dir.y * explodeFactor * 8;
            vz += dir.z * explodeFactor * 8;
          }

          dummy.position.set(vx, vy, vz);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          color.set(v.color);
          mesh.setColorAt(i, color);
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        modelGroup.add(mesh);
      }

      function spinRandom() {
        vGenerator.setSeed(Math.floor(Math.random() * 900000) + 100000);
        rebuild3D();
      }

      document.getElementById('btn-3d-randomize').addEventListener('click', spinRandom);
      document.querySelectorAll('.v-archetype-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.v-archetype-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          current3DArchetype = btn.dataset.type;
          rebuild3D();
        });
      });

      document.getElementById('v-slider-explode').addEventListener('input', (e) => {
        explodeFactor = parseFloat(e.target.value);
        rebuild3D();
      });

      // Send 3D snapshot to 2D Converter
      document.getElementById('btn-send-to-converter').addEventListener('click', () => {
        renderer.render(scene, camera);
        const snapshotUrl = renderer.domElement.toDataURL('image/png');
        tabConverter.click();
        loadImageSource(snapshotUrl);
        showToast('3D Model sent to 2D Pixel Converter!');
      });

      function animate3D() {
        requestAnimationFrame(animate3D);
        modelGroup.rotation.y += 0.005;
        controls.update();
        renderer.render(scene, camera);
      }
      rebuild3D();
      animate3D();
      voxelApp3D = true;
    }

    // Auto-load sample cat on initial open so page is vibrant immediately
    if (window.SamplePresets && window.SamplePresets.cat) {
      loadImageSource(window.SamplePresets.cat.getDataUrl());
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
