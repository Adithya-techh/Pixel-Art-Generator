/**
 * Export Utilities (Serverless / Standalone compatible):
 * 1. 3D Wavefront .OBJ Exporter with vertex colors / materials
 * 2. 2D Pixel Art Canvas Rendering & Crisp PNG Download
 * 3. JSON Voxel Matrix Export
 */

(function (root) {
  class VoxelExporter {
    static exportOBJ(voxelGrid, modelName = 'procedural_pixel_art') {
      const voxels = voxelGrid.getAll();
      if (voxels.length === 0) return null;

      let objContent = `# Procedural Pixel & Voxel Art Generator\n`;
      objContent += `# Voxel Count: ${voxels.length}\n`;
      objContent += `o ${modelName}\n\n`;

      const bounds = voxelGrid.getBounds();
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      const centerZ = (bounds.minZ + bounds.maxZ) / 2;

      let vertexOffset = 1;
      let vertices = [];
      let faces = [];

      const directions = [
        { dx: 0, dy: 0, dz: 1, quad: [ [0,0,1], [1,0,1], [1,1,1], [0,1,1] ] },
        { dx: 0, dy: 0, dz: -1, quad: [ [1,0,0], [0,0,0], [0,1,0], [1,1,0] ] },
        { dx: 1, dy: 0, dz: 0, quad: [ [1,0,1], [1,0,0], [1,1,0], [1,1,1] ] },
        { dx: -1, dy: 0, dz: 0, quad: [ [0,0,0], [0,0,1], [0,1,1], [0,1,0] ] },
        { dx: 0, dy: 1, dz: 0, quad: [ [0,1,1], [1,1,1], [1,1,0], [0,1,0] ] },
        { dx: 0, dy: -1, dz: 0, quad: [ [0,0,0], [1,0,0], [1,0,1], [0,0,1] ] },
      ];

      for (const v of voxels) {
        const vx = v.x - centerX;
        const vy = v.y - centerY;
        const vz = v.z - centerZ;

        const hex = v.color.replace('#', '');
        const r = (parseInt(hex.substring(0, 2), 16) / 255).toFixed(3);
        const g = (parseInt(hex.substring(2, 4), 16) / 255).toFixed(3);
        const b = (parseInt(hex.substring(4, 6), 16) / 255).toFixed(3);

        for (const dir of directions) {
          if (voxelGrid.has(v.x + dir.dx, v.y + dir.dy, v.z + dir.dz)) {
            continue;
          }

          const quadIndices = [];
          for (const pt of dir.quad) {
            const x = (vx + pt[0] - 0.5).toFixed(3);
            const y = (vy + pt[1] - 0.5).toFixed(3);
            const z = (vz + pt[2] - 0.5).toFixed(3);
            vertices.push(`v ${x} ${y} ${z} ${r} ${g} ${b}`);
            quadIndices.push(vertexOffset++);
          }

          faces.push(`f ${quadIndices[0]} ${quadIndices[1]} ${quadIndices[2]} ${quadIndices[3]}`);
        }
      }

      objContent += vertices.join('\n') + '\n\n';
      objContent += faces.join('\n') + '\n';

      return objContent;
    }

    static export2DPNG(voxelGrid, scale = 16, backgroundColor = null) {
      const bounds = voxelGrid.getBounds();
      const width = (bounds.maxX - bounds.minX + 3);
      const height = (bounds.maxY - bounds.minY + 3);

      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      const voxels = voxelGrid.getAll().sort((a, b) => b.z - a.z);

      for (const v of voxels) {
        const px = (v.x - bounds.minX + 1) * scale;
        const py = (bounds.maxY - v.y + 1) * scale;

        ctx.fillStyle = v.color;
        ctx.fillRect(px, py, scale, scale);

        if (scale >= 8) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.fillRect(px, py, scale, 1);
          ctx.fillRect(px, py, 1, scale);

          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.fillRect(px, py + scale - 1, scale, 1);
          ctx.fillRect(px + scale - 1, py, 1, scale);
        }
      }

      return canvas.toDataURL('image/png');
    }

    static downloadFile(content, fileName, mimeType = 'text/plain') {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  root.VoxelExporter = VoxelExporter;
})(typeof window !== 'undefined' ? window : globalThis);
