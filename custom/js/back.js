(() => {
  const CDN_SRC = 'https://cdn.cnortles.top/npm/simplex-noise@2.4.0/simplex-noise.min.js';
  function ensureCanvas() {
    let el = document.getElementById('background-canvas');
    if (!el) {
      el = document.createElement('canvas');
      el.id = 'background-canvas';
      el.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
      document.body.prepend(el);
    }
    return el;
  }

  function init() {
    const canvas = ensureCanvas();
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
  let simplex = null;
  let rafId = null;

  const config = {
    gridSize: 8,
    contourLevels: 12,
    noiseScale: 3
  };

  function isDarkMode() {
    const root = document.documentElement;
    return root.id === 'ZYDark' || root.getAttribute('data-theme') === 'dark';
  }

  function getStrokeStyle() {
    return isDarkMode() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function generateHeightMap(cols, rows) {
    const map = new Array(rows + 1);
    for (let y = 0; y <= rows; y++) {
      map[y] = new Array(cols + 1);
      for (let x = 0; x <= cols; x++) {
        const nx = x / cols;
        const ny = y / rows;
        map[y][x] = simplex.noise2D(nx * config.noiseScale, ny * config.noiseScale);
      }
    }
    return map;
  }

  function drawSmoothLine(points) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i][0] + points[i + 1][0]) / 2;
      const yc = (points[i][1] + points[i + 1][1]) / 2;
      ctx.quadraticCurveTo(points[i][0], points[i][1], xc, yc);
    }
    const n = points.length;
    ctx.quadraticCurveTo(points[n - 2][0], points[n - 2][1], points[n - 1][0], points[n - 1][1]);
    ctx.stroke();
  }

  function drawContour(level, heightMap, cols, rows, cellSize) {
    ctx.strokeStyle = getStrokeStyle();
    ctx.lineWidth = 1;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tl = heightMap[y][x];
        const tr = heightMap[y][x + 1];
        const br = heightMap[y + 1][x + 1];
        const bl = heightMap[y + 1][x];

        const sx = x * cellSize;
        const sy = y * cellSize;

        const interpolate = (v1, v2, p1, p2) => {
          const t = (level - v1) / (v2 - v1);
          return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
        };

        const points = [];

        if ((tl - level) * (tr - level) < 0) {
          points.push(interpolate(tl, tr, [sx, sy], [sx + cellSize, sy]));
        }
        if ((tr - level) * (br - level) < 0) {
          points.push(interpolate(tr, br, [sx + cellSize, sy], [sx + cellSize, sy + cellSize]));
        }
        if ((br - level) * (bl - level) < 0) {
          points.push(interpolate(br, bl, [sx + cellSize, sy + cellSize], [sx, sy + cellSize]));
        }
        if ((bl - level) * (tl - level) < 0) {
          points.push(interpolate(bl, tl, [sx, sy + cellSize], [sx, sy]));
        }

        if (points.length >= 2) {
          drawSmoothLine(points);
        }
      }
    }
  }

  function render() {
    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cols = Math.ceil(canvas.width / config.gridSize);
    const rows = Math.ceil(canvas.height / config.gridSize);
    const cellSize = config.gridSize;

    const heightMap = generateHeightMap(cols, rows);

    for (let i = 0; i < config.contourLevels; i++) {
      const level = -1 + (2 * i) / config.contourLevels;
      drawContour(level, heightMap, cols, rows, cellSize);
    }
  }

  function scheduleRender() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(render);
  }

  function loadSimplex() {
    return new Promise((resolve, reject) => {
      if (window.SimplexNoise) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = CDN_SRC;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

    loadSimplex()
      .then(() => {
        simplex = new window.SimplexNoise();
        scheduleRender();
        window.addEventListener('resize', scheduleRender, { passive: true });
      })
      .catch(() => {
        console.warn('[back.js] failed to load simplex-noise');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();