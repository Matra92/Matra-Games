(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreElem = document.getElementById('score');

  // Ajusta el tamaño del canvas para que sea un cuadrado y se adapte a la pantalla
  function resize() {
    const size = Math.min(window.innerWidth, 600);
    canvas.width = size;
    canvas.height = size;
  }
  window.addEventListener('resize', resize);
  resize();

  // Carga de imágenes de caras (cambia estas rutas si añades más caras)
  const imageFiles = ['images/head1.png', 'images/head2.png'];
  const images = [];
  let loadedCount = 0;
  let started = false;

  function maybeStart() {
    // Inicia el juego cuando al menos una imagen se haya cargado
    if (!started && loadedCount > 0) {
      started = true;
      requestAnimationFrame(loop);
    }
  }

  imageFiles.forEach((src, idx) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      loadedCount++;
      maybeStart();
    };
    img.onerror = () => {
      console.warn('No se pudo cargar la imagen:', src);
      maybeStart();
    };
    images[idx] = img;
  });

  // Constantes de física
  const gravity = 0.35;
  const spawnInterval = 1200;
  // Probabilidad de que aparezca una bomba en lugar de una fruta
  const bombProbability = 0.2;
  let lastSpawn = 0;

  // Estados del juego
  let fruits = [];
  let halves = [];
  let score = 0;

  function spawnFruit() {
    // Con cierta probabilidad se genera una bomba en lugar de una fruta
    if (Math.random() < bombProbability) {
      const size = 60 + Math.random() * 20;
      const x = canvas.width * (0.1 + Math.random() * 0.8);
      const y = canvas.height + size;
      const vx = (Math.random() - 0.5) * 2;
      const vy = -(14 + Math.random() * 6); // saltan alto
      fruits.push({ isBomb: true, x, y, vx, vy, size });
    } else {
      const available = images.filter(img => img.complete && img.width > 0);
      if (available.length === 0) return;
      const img = available[Math.floor(Math.random() * available.length)];
      const size = 80 + Math.random() * 40;
      const x = canvas.width * (0.1 + Math.random() * 0.8);
      const y = canvas.height + size;
      const vx = (Math.random() - 0.5) * 2;
      const vy = -(14 + Math.random() * 6); // mayor altura inicial
      fruits.push({ img, x, y, vx, vy, size, isBomb: false });
    }
  }

  function loop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (timestamp - lastSpawn > spawnInterval) {
      spawnFruit();
      lastSpawn = timestamp;
    }

    // Actualiza las frutas
    fruits.forEach(fruit => {
      fruit.x += fruit.vx;
      fruit.y += fruit.vy;
      fruit.vy += gravity;
    });
    fruits = fruits.filter(fruit => fruit.y - fruit.size < canvas.height);

    // Actualiza las mitades
    halves.forEach(h => {
      h.x += h.vx;
      h.y += h.vy;
      h.vy += gravity;
      h.rotation += h.rotSpeed;
    });
    halves = halves.filter(h => h.y - h.size < canvas.height);

    // Dibuja frutas completas o bombas
    fruits.forEach(fruit => {
      if (fruit.isBomb) {
        // Dibujar bomba como un círculo negro con borde rojo
        ctx.beginPath();
        ctx.fillStyle = '#444';
        ctx.strokeStyle = '#a00';
        ctx.lineWidth = 2;
        ctx.arc(fruit.x, fruit.y, fruit.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.drawImage(fruit.img, fruit.x - fruit.size / 2, fruit.y - fruit.size / 2, fruit.size, fruit.size);
      }
    });

    // Dibuja mitades
    halves.forEach(h => {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rotation);
      ctx.drawImage(h.img, -h.size / 2, -h.size / 2, h.size, h.size);
      ctx.restore();
    });

    requestAnimationFrame(loop);
  }

  // Detección de colisión entre la línea de corte y la fruta (círculo)
  function lineIntersectsCircle(p1, p2, fruit) {
    const cx = fruit.x;
    const cy = fruit.y;
    const r = fruit.size / 2;
    const x1 = p1.x;
    const y1 = p1.y;
    const x2 = p2.x;
    const y2 = p2.y;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSquared = dx * dx + dy * dy;
    if (lenSquared === 0) return false;
    const t = ((cx - x1) * dx + (cy - y1) * dy) / lenSquared;
    const clampT = Math.max(0, Math.min(1, t));
    const ex = x1 + clampT * dx;
    const ey = y1 + clampT * dy;
    const dist = Math.hypot(ex - cx, ey - cy);
    return dist <= r + 5;
  }

  function sliceFruit(fruit, p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const horizontal = Math.abs(dx) > Math.abs(dy);

    // Primera mitad
    const canvas1 = document.createElement('canvas');
    canvas1.width = fruit.size;
    canvas1.height = fruit.size;
    const ctx1 = canvas1.getContext('2d');
    ctx1.save();
    ctx1.beginPath();
    if (horizontal) {
      ctx1.rect(0, 0, fruit.size, fruit.size / 2);
    } else {
      ctx1.rect(0, 0, fruit.size / 2, fruit.size);
    }
    ctx1.clip();
    ctx1.drawImage(fruit.img, 0, 0, fruit.size, fruit.size);
    ctx1.restore();

    // Segunda mitad
    const canvas2 = document.createElement('canvas');
    canvas2.width = fruit.size;
    canvas2.height = fruit.size;
    const ctx2 = canvas2.getContext('2d');
    ctx2.save();
    ctx2.beginPath();
    if (horizontal) {
      ctx2.rect(0, fruit.size / 2, fruit.size, fruit.size / 2);
    } else {
      ctx2.rect(fruit.size / 2, 0, fruit.size / 2, fruit.size);
    }
    ctx2.clip();
    ctx2.drawImage(fruit.img, 0, 0, fruit.size, fruit.size);
    ctx2.restore();

    // Calcula la normal a la línea de corte para la velocidad inicial de las mitades
    let nx = dy;
    let ny = -dx;
    const length = Math.hypot(nx, ny) || 1;
    nx /= length;
    ny /= length;
    const speed = 5;

    halves.push({
      img: canvas1,
      x: fruit.x,
      y: fruit.y,
      vx: fruit.vx + nx * speed,
      vy: fruit.vy + ny * speed,
      size: fruit.size,
      rotation: 0,
      rotSpeed: 0.2
    });
    halves.push({
      img: canvas2,
      x: fruit.x,
      y: fruit.y,
      vx: fruit.vx - nx * speed,
      vy: fruit.vy - ny * speed,
      size: fruit.size,
      rotation: 0,
      rotSpeed: -0.2
    });
  }

  // Control de puntero
  let pointerDown = false;
  let lastPointer = null;

  canvas.addEventListener('pointerdown', e => {
    pointerDown = true;
    lastPointer = { x: e.offsetX, y: e.offsetY };
  });

  canvas.addEventListener('pointermove', e => {
    if (!pointerDown || !lastPointer) return;
    const p = { x: e.offsetX, y: e.offsetY };

    // Chequea colisiones con frutas
    fruits.slice().forEach(fruit => {
      if (lineIntersectsCircle(lastPointer, p, fruit)) {
        const index = fruits.indexOf(fruit);
        if (fruit.isBomb) {
          // Si cortas una bomba pierdes 2 puntos y se elimina de la pantalla
          if (index >= 0) fruits.splice(index, 1);
          score = Math.max(0, score - 2);
          scoreElem.textContent = `Puntaje: ${score}`;
        } else {
          sliceFruit(fruit, lastPointer, p);
          if (index >= 0) fruits.splice(index, 1);
          score++;
          scoreElem.textContent = `Puntaje: ${score}`;
        }
      }
    });

    lastPointer = p;
  });

  canvas.addEventListener('pointerup', () => {
    pointerDown = false;
    lastPointer = null;
  });
})();
