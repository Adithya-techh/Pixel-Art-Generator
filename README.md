# VOXEL•PIXEL // 3D Procedural Pixel Art Generator (Serverless)

A 100% **serverless, offline-ready Procedural 3D Pixel & Voxel Art Generator** powered by Three.js and WebGL.

---

## ⚡ Zero Server Setup (Serverless)

This application requires **no server, no node, no npm, and no command line**.

To use it:
1. Open the folder: `C:\Develop\Pixel_Art_Generator`
2. **Double-click `index.html`** in Windows Explorer.
3. It will open instantly in your default web browser (Chrome, Edge, Firefox, Brave, etc.)!

It can also be deployed to any static hosting service (GitHub Pages, Netlify, Vercel, itch.io) by simply uploading this folder.

---

## ✨ Features

- **6 Distinct Procedural Archetypes**:
  - 🚀 **Starships**: Fuselage tapering, swept/delta wings, laser cannons, glowing plasma thrusters with exhaust plumes.
  - 👾 **Alien Invaders**: Cellular organic silhouettes, multi-tier glowing eyes, mandibles, horns, and tentacles.
  - 🤖 **Cyber Mechas**: Armored chassis, reactor chest cores, shoulder pauldrons, arm blasters, and visors.
  - ⚔️ **Fantasy Weapons**: Broadswords with glowing magic runes, battleaxes, and sorcerer staves with floating crystals.
  - 🏰 **Floating Sky Dioramas**: Procedural floating rock cones, grass surfaces, miniature watchtowers, pine trees, and voxel clouds.
  - 📦 **Ancient Relics & Chests**: Iron-banded treasure chests with glowing magic locks and trims.

- **8 Curated Color Palettes**:
  - `Cyberpunk Neon`: High-voltage magenta, electric cyan, and laser violet.
  - `PICO-8 Classic`: The iconic 16 retro console colors.
  - `Game Boy (DMG-01)`: 4-shade greenish phosphor LCD nostalgia.
  - `DawnBringer 32 (DB32)`: Legendary fantasy pixel art palette.
  - `Magma Forge`: Volcanic obsidian, fiery embers, and molten gold.
  - `Bioluminescence`: Deep midnight navy with electric seafoam accents.
  - `Vaporwave Sunset`: Pastel mauve, bubblegum pink, and tropical mint.
  - `Imperial Solar`: Polished ivory armor, rich gold trims, and cobalt blue glow.

- **3D Real-Time Visuals**:
  - **High Performance**: Built with `THREE.InstancedMesh` for 60 FPS rendering in single draw calls.
  - **Dynamic Shading & Shadows**: Real-time directional sun casting soft shadows, ambient bounce lighting, and colorful rim lights.
  - **Emissive Core Lighting**: Pulsing glowing voxels for eyes, engine exhausts, and magic runes.
  - **Voxel Shape Customization**: Classic Solid Cubes, Beveled/Chamfered Voxels, Spaced Voxels, or Floating Orbs.
  - **Deconstruct / Explode Mode**: Smoothly disperses voxels outward from the center.
  - **Z-Depth Layer Slicer**: Slice through layers to inspect internal cross-sections.
  - **Retro CRT Scanline Filter**: Optional arcade scanline overlay.

- **Export Suite**:
  - 📸 **2D Pixel PNG**: Crisp pixel-art projection rendered to an offscreen canvas at high resolution with nearest-neighbor scaling.
  - 🧊 **3D Wavefront .OBJ**: Export 3D models with vertex colors and automatic internal face culling, ready to drag-and-drop into **Blender**, **Unity**, **Godot**, or **Unreal Engine**.
  - 💾 **JSON Matrix**: Raw coordinate and hex color matrix for custom games.

---

## 🎮 Controls & Shortcuts

| Action | Control / Shortcut |
| :--- | :--- |
| **Generate New Art** | `Spacebar` or Click **GENERATE** |
| **Orbit / Rotate** | Click + Drag Left Mouse |
| **Pan Camera** | Right Click + Drag |
| **Zoom** | Mouse Wheel Scroll |
| **Reset Camera** | `R` Key |
| **Toggle Auto-Spin** | `T` Key |
| **Seed Navigation** | Click `◀`, `▶`, or enter seed number directly |
| **Camera Presets** | Click `45° ISO`, `FRONT 2D`, `SIDE`, or `TOP` |

---

## 📂 Folder Contents

```
C:\Develop\Pixel_Art_Generator\
├── index.html           # Main application (double-click to open!)
├── style.css            # Retro-cyberpunk styling and CRT scanlines
├── app.js               # Standalone Three.js scene, camera, lights, InstancedMesh & loop
├── generator.js         # Mulberry32 PRNG, VoxelGrid, & procedural generation archetypes
├── exporter.js          # OBJ 3D model generator & crisp 2D PNG renderer
├── README.md            # Documentation
└── lib/
    ├── three.min.js     # Standalone Three.js library (UMD)
    └── OrbitControls.js # 3D orbital controls (UMD)
```
