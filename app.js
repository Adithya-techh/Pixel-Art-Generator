/**
 * Main Application for Procedural 3D Pixel Art Generator
 * Resilient Serverless / GitHub Pages / Offline Edition
 */

(function () {
  function showError(msg) {
    const overlay = document.getElementById('loading-overlay');
    const status = document.getElementById('loading-status');
    if (overlay && status) {
      overlay.style.display = 'flex';
      status.innerHTML = `<span style="color:#ff0055; font-weight:bold;">⚠️ Error:</span> ${msg}<br><br><span style="color:#00f0ff;">Tip:</span> If you uploaded to GitHub, make sure the <code>lib/</code> folder or CDN links are accessible.`;
    }
    console.error('[VOXEL•PIXEL Error]', msg);
  }

  function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  class VoxelApp {
    constructor() {
      const THREE = window.THREE;
      if (!THREE) {
        showError('Three.js is not loaded.');
        return;
      }
      if (!THREE.OrbitControls) {
        showError('THREE.OrbitControls is not loaded.');
        return;
      }
      if (!window.VoxelGenerator) {
        showError('generator.js is not loaded.');
        return;
      }

      this.THREE = THREE;
      this.OrbitControls = THREE.OrbitControls;
      this.VoxelGenerator = window.VoxelGenerator;
      this.PALETTES = window.PALETTES;
      this.VoxelExporter = window.VoxelExporter;

      this.container = document.getElementById('canvas-container');
      this.generator = new this.VoxelGenerator({
        seed: Math.floor(Math.random() * 900000) + 100000,
        palette: 'cyberpunk',
        resolution: 16
      });

      this.currentArchetype = 'spaceship';
      this.currentData = null;
      this.voxelStyle = 'cube';
      this.explodeFactor = 0;
      this.sliceZFactor = 1.0;
      this.autoRotate = true;
      this.hoverBobbing = true;
      this.clock = new this.THREE.Clock();

      this.spawnProgress = 1.0;
      this.isSpawning = false;

      this.initThree();
      this.setupLighting();
      this.setupGround();
      this.setupUI();
      this.setupKeyboard();

      this.generate();
      this.animate();

      hideLoading();

      window.addEventListener('resize', () => this.onResize());
    }

    initThree() {
      const THREE = this.THREE;
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color('#0a0d14');
      this.scene.fog = new THREE.FogExp2('#0a0d14', 0.02);

      const aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
      this.camera.position.set(22, 16, 26);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;
      this.container.appendChild(this.renderer.domElement);

      this.controls = new this.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
      this.controls.minDistance = 6;
      this.controls.maxDistance = 80;
      this.controls.target.set(0, 4, 0);

      this.modelGroup = new THREE.Group();
      this.scene.add(this.modelGroup);
    }

    setupLighting() {
      const THREE = this.THREE;
      const ambient = new THREE.AmbientLight('#ffffff', 0.85);
      this.scene.add(ambient);

      this.dirLight = new THREE.DirectionalLight('#ffffff', 1.8);
      this.dirLight.position.set(18, 30, 22);
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 2048;
      this.dirLight.shadow.mapSize.height = 2048;
      this.dirLight.shadow.camera.near = 0.5;
      this.dirLight.shadow.camera.far = 70;
      const d = 20;
      this.dirLight.shadow.camera.left = -d;
      this.dirLight.shadow.camera.right = d;
      this.dirLight.shadow.camera.top = d;
      this.dirLight.shadow.camera.bottom = -d;
      this.dirLight.shadow.bias = -0.0005;
      this.scene.add(this.dirLight);

      this.rimLight1 = new THREE.PointLight('#00f0ff', 1.5, 50);
      this.rimLight1.position.set(-18, 12, -18);
      this.scene.add(this.rimLight1);

      this.rimLight2 = new THREE.PointLight('#ff007f', 1.2, 50);
      this.rimLight2.position.set(18, 10, -18);
      this.scene.add(this.rimLight2);
    }

    setupGround() {
      const THREE = this.THREE;
      const gridHelper = new THREE.GridHelper(40, 40, '#22d3ee', '#1e293b');
      gridHelper.position.y = -0.01;
      this.scene.add(gridHelper);

      const planeGeo = new THREE.PlaneGeometry(80, 80);
      const planeMat = new THREE.ShadowMaterial({ opacity: 0.35 });
      const shadowPlane = new THREE.Mesh(planeGeo, planeMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.receiveShadow = true;
      this.scene.add(shadowPlane);
    }

    rebuildMeshes() {
      const THREE = this.THREE;
      while (this.modelGroup.children.length > 0) {
        const obj = this.modelGroup.children[0];
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
        this.modelGroup.remove(obj);
      }

      if (!this.currentData || !this.currentData.grid) return;

      const grid = this.currentData.grid;
      const allVoxels = grid.getAll();
      if (allVoxels.length === 0) return;

      const bounds = grid.getBounds();
      this.centerX = (bounds.minX + bounds.maxX) / 2;
      this.centerY = (bounds.minY + bounds.maxY) / 2;
      this.centerZ = (bounds.minZ + bounds.maxZ) / 2;

      const maxZAllowed = bounds.minZ + (bounds.maxZ - bounds.minZ) * this.sliceZFactor;
      const filteredVoxels = allVoxels.filter(v => v.z <= maxZAllowed);

      const solidList = [];
      const glowList = [];

      for (const v of filteredVoxels) {
        if (v.isGlow) glowList.push(v);
        else solidList.push(v);
      }

      let geo;
      const s = this.voxelStyle === 'spaced' ? 0.82 : (this.voxelStyle === 'bevel' ? 0.94 : 0.98);

      if (this.voxelStyle === 'sphere') {
        geo = new THREE.SphereGeometry(s * 0.5, 10, 10);
      } else {
        geo = new THREE.BoxGeometry(s, s, s);
      }

      // Solid Voxels
      if (solidList.length > 0) {
        const solidMat = new THREE.MeshStandardMaterial({
          roughness: 0.35,
          metalness: 0.15,
          vertexColors: false
        });

        this.solidMesh = new THREE.InstancedMesh(geo, solidMat, solidList.length);
        this.solidMesh.castShadow = true;
        this.solidMesh.receiveShadow = true;

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();

        for (let i = 0; i < solidList.length; i++) {
          const v = solidList[i];
          let vx = v.x - this.centerX;
          let vy = v.y - bounds.minY + 0.5;
          let vz = v.z - this.centerZ;

          if (this.explodeFactor > 0) {
            const dir = new THREE.Vector3(vx, vy - (bounds.maxY - bounds.minY) * 0.5, vz).normalize();
            vx += dir.x * this.explodeFactor * 8;
            vy += dir.y * this.explodeFactor * 8;
            vz += dir.z * this.explodeFactor * 8;
          }

          dummy.position.set(vx, vy, vz);
          dummy.scale.set(this.spawnProgress, this.spawnProgress, this.spawnProgress);
          dummy.updateMatrix();

          this.solidMesh.setMatrixAt(i, dummy.matrix);
          color.set(v.color);
          this.solidMesh.setColorAt(i, color);
        }

        this.solidMesh.instanceMatrix.needsUpdate = true;
        if (this.solidMesh.instanceColor) this.solidMesh.instanceColor.needsUpdate = true;
        this.modelGroup.add(this.solidMesh);
      }

      // Glow Voxels
      if (glowList.length > 0) {
        this.glowMat = new THREE.MeshStandardMaterial({
          roughness: 0.2,
          metalness: 0.1,
          emissive: new THREE.Color(this.generator.palette.glow[0]),
          emissiveIntensity: 2.2
        });

        this.glowMesh = new THREE.InstancedMesh(geo, this.glowMat, glowList.length);
        this.glowMesh.castShadow = true;

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();

        for (let i = 0; i < glowList.length; i++) {
          const v = glowList[i];
          let vx = v.x - this.centerX;
          let vy = v.y - bounds.minY + 0.5;
          let vz = v.z - this.centerZ;

          if (this.explodeFactor > 0) {
            const dir = new THREE.Vector3(vx, vy - (bounds.maxY - bounds.minY) * 0.5, vz).normalize();
            vx += dir.x * this.explodeFactor * 8;
            vy += dir.y * this.explodeFactor * 8;
            vz += dir.z * this.explodeFactor * 8;
          }

          dummy.position.set(vx, vy, vz);
          dummy.scale.set(this.spawnProgress, this.spawnProgress, this.spawnProgress);
          dummy.updateMatrix();

          this.glowMesh.setMatrixAt(i, dummy.matrix);
          color.set(v.glowColor || v.color);
          this.glowMesh.setColorAt(i, color);
        }

        this.glowMesh.instanceMatrix.needsUpdate = true;
        if (this.glowMesh.instanceColor) this.glowMesh.instanceColor.needsUpdate = true;
        this.modelGroup.add(this.glowMesh);
      }

      const height = bounds.maxY - bounds.minY;
      this.controls.target.set(0, height * 0.45, 0);

      this.update2DMiniMap();
      this.updateHUDStats();
    }

    update2DMiniMap() {
      const canvas = document.getElementById('mini-canvas');
      if (!canvas || !this.currentData) return;

      const grid = this.currentData.grid;
      const bounds = grid.getBounds();
      const w = bounds.maxX - bounds.minX + 3;
      const h = bounds.maxY - bounds.minY + 3;

      canvas.width = 120;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scale = Math.floor(Math.min(canvas.width / w, canvas.height / h));
      const offsetX = Math.floor((canvas.width - w * scale) / 2);
      const offsetY = Math.floor((canvas.height - h * scale) / 2);

      const voxels = grid.getAll().sort((a, b) => b.z - a.z);
      for (const v of voxels) {
        const px = offsetX + (v.x - bounds.minX + 1) * scale;
        const py = offsetY + (bounds.maxY - v.y + 1) * scale;
        ctx.fillStyle = v.color;
        ctx.fillRect(px, py, scale, scale);
      }
    }

    updateHUDStats() {
      const bounds = this.currentData.bounds;
      const voxelCount = this.currentData.grid.count();
      const w = (bounds.maxX - bounds.minX + 1);
      const h = (bounds.maxY - bounds.minY + 1);
      const d = (bounds.maxZ - bounds.minZ + 1);

      document.getElementById('stat-count').textContent = voxelCount.toLocaleString();
      document.getElementById('stat-dim').textContent = `${w} × ${h} × ${d}`;
      document.getElementById('stat-seed').textContent = this.generator.seed;
      document.getElementById('seed-input').value = this.generator.seed;
    }

    generate(seed = null) {
      if (seed !== null) {
        this.generator.setSeed(seed);
      }
      this.currentData = this.generator.generate(this.currentArchetype);

      this.spawnProgress = 0.05;
      this.isSpawning = true;

      this.rebuildMeshes();
    }

    setArchetype(archetype) {
      this.currentArchetype = archetype;
      this.generate();
    }

    setPalette(paletteId) {
      this.generator.setPalette(paletteId);
      this.generate(this.generator.seed);
    }

    setVoxelStyle(style) {
      this.voxelStyle = style;
      this.rebuildMeshes();
    }

    setExplode(val) {
      this.explodeFactor = parseFloat(val);
      this.rebuildMeshes();
    }

    setSlice(val) {
      this.sliceZFactor = parseFloat(val);
      this.rebuildMeshes();
    }

    setCameraView(view) {
      const dist = 32;
      const targetY = this.controls.target.y;

      if (view === 'iso') {
        this.camera.position.set(dist * 0.7, dist * 0.6, dist * 0.7);
      } else if (view === 'front') {
        this.camera.position.set(0, targetY, dist);
      } else if (view === 'top') {
        this.camera.position.set(0, dist * 1.2, 0.01);
      } else if (view === 'side') {
        this.camera.position.set(dist, targetY, 0);
      }

      this.camera.lookAt(0, targetY, 0);
      this.controls.update();
    }

    setupUI() {
      const tabs = document.querySelectorAll('.archetype-btn');
      tabs.forEach(btn => {
        btn.addEventListener('click', () => {
          tabs.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.setArchetype(btn.dataset.type);
        });
      });

      document.getElementById('btn-randomize').addEventListener('click', () => {
        const nextSeed = Math.floor(Math.random() * 900000) + 100000;
        this.generate(nextSeed);
      });

      document.getElementById('btn-prev-seed').addEventListener('click', () => {
        this.generate(this.generator.seed - 1);
      });
      document.getElementById('btn-next-seed').addEventListener('click', () => {
        this.generate(this.generator.seed + 1);
      });
      document.getElementById('seed-input').addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) this.generate(val);
        else this.generate(e.target.value);
      });
      document.getElementById('btn-copy-seed').addEventListener('click', () => {
        navigator.clipboard.writeText(this.generator.seed.toString()).then(() => {
          this.showToast('Seed copied to clipboard!');
        });
      });

      const paletteGrid = document.getElementById('palette-container');
      for (const [key, p] of Object.entries(this.PALETTES)) {
        const card = document.createElement('div');
        card.className = `palette-card ${key === this.generator.palette.id ? 'active' : ''}`;
        card.dataset.palette = key;

        const swatchRow = document.createElement('div');
        swatchRow.className = 'swatch-row';
        p.swatches.slice(0, 6).forEach(c => {
          const sw = document.createElement('span');
          sw.style.backgroundColor = c;
          swatchRow.appendChild(sw);
        });

        card.innerHTML = `<div class="palette-title">${p.name}</div>`;
        card.appendChild(swatchRow);

        card.addEventListener('click', () => {
          document.querySelectorAll('.palette-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          this.setPalette(key);
        });

        paletteGrid.appendChild(card);
      }

      const resBtns = document.querySelectorAll('.res-btn');
      resBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          resBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.generator.resolution = parseInt(btn.dataset.res, 10);
          this.generate(this.generator.seed);
        });
      });

      document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.setVoxelStyle(btn.dataset.style);
        });
      });

      const explodeSlider = document.getElementById('slider-explode');
      explodeSlider.addEventListener('input', (e) => this.setExplode(e.target.value));

      const sliceSlider = document.getElementById('slider-slice');
      sliceSlider.addEventListener('input', (e) => this.setSlice(e.target.value));

      const rotCheck = document.getElementById('toggle-rotate');
      rotCheck.addEventListener('change', (e) => this.autoRotate = e.target.checked);

      const crtCheck = document.getElementById('toggle-crt');
      crtCheck.addEventListener('change', (e) => {
        document.body.classList.toggle('crt-active', e.target.checked);
      });

      document.querySelectorAll('.cam-btn').forEach(btn => {
        btn.addEventListener('click', () => this.setCameraView(btn.dataset.view));
      });

      document.getElementById('btn-export-png').addEventListener('click', () => {
        const dataUrl = this.VoxelExporter.export2DPNG(this.currentData.grid, 24, null);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${this.currentArchetype}_${this.generator.seed}_2d.png`;
        a.click();
        this.showToast('2D Pixel PNG downloaded!');
      });

      document.getElementById('btn-export-obj').addEventListener('click', () => {
        const objData = this.VoxelExporter.exportOBJ(this.currentData.grid, `${this.currentArchetype}_${this.generator.seed}`);
        if (objData) {
          this.VoxelExporter.downloadFile(objData, `${this.currentArchetype}_${this.generator.seed}.obj`, 'model/obj');
          this.showToast('3D Wavefront .OBJ file downloaded!');
        }
      });

      document.getElementById('btn-export-json').addEventListener('click', () => {
        const jsonStr = JSON.stringify({
          archetype: this.currentArchetype,
          seed: this.generator.seed,
          palette: this.generator.palette.id,
          voxels: this.currentData.grid.getAll()
        }, null, 2);
        this.VoxelExporter.downloadFile(jsonStr, `${this.currentArchetype}_${this.generator.seed}.json`, 'application/json');
        this.showToast('Voxel JSON Matrix downloaded!');
      });
    }

    setupKeyboard() {
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;

        if (e.code === 'Space') {
          e.preventDefault();
          const nextSeed = Math.floor(Math.random() * 900000) + 100000;
          this.generate(nextSeed);
        } else if (e.key === 'r' || e.key === 'R') {
          this.setCameraView('iso');
        } else if (e.key === 't' || e.key === 'T') {
          this.autoRotate = !this.autoRotate;
          document.getElementById('toggle-rotate').checked = this.autoRotate;
        }
      });
    }

    showToast(message) {
      const toast = document.getElementById('toast');
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('visible');
      setTimeout(() => {
        toast.classList.remove('visible');
      }, 2800);
    }

    onResize() {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      const delta = this.clock.getDelta();
      const elapsedTime = this.clock.getElapsedTime();

      if (this.isSpawning) {
        this.spawnProgress += delta * 3.5;
        if (this.spawnProgress >= 1.0) {
          this.spawnProgress = 1.0;
          this.isSpawning = false;
        }
        this.rebuildMeshes();
      }

      if (this.autoRotate) {
        this.modelGroup.rotation.y += delta * 0.45;
      }

      if (this.hoverBobbing && !this.isSpawning && this.currentArchetype !== 'diorama') {
        this.modelGroup.position.y = Math.sin(elapsedTime * 2.2) * 0.4;
      } else {
        this.modelGroup.position.y = 0;
      }

      if (this.glowMat) {
        this.glowMat.emissiveIntensity = 2.0 + Math.sin(elapsedTime * 4.5) * 0.8;
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }

  function start() {
    try {
      window.voxelApp = new VoxelApp();
    } catch (err) {
      showError(err.message || String(err));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
