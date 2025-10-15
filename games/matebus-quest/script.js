(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreElem = document.getElementById('score');
  const gameOverElem = document.getElementById('gameOver');
  const finalScoreElem = document.getElementById('finalScore');
  const restartBtn = document.getElementById('restartBtn');

  let width, height;

  function resize() {
    // Limitar el ancho para que quepa bien en móviles y escritorio
    width = Math.min(window.innerWidth - 40, 600);
    height = 200;
    canvas.width = width;
    canvas.height = height;
  }
  window.addEventListener('resize', resize);
  resize();

  // Cargar imágenes del personaje y la moneda
  const playerImg = new Image();
  playerImg.src = 'images/matebu.png';
  const coinImg = new Image();
  coinImg.src = 'images/coin.png';
  let assetsLoaded = 0;
  const onAssetLoad = () => {
    assetsLoaded++;
    if (assetsLoaded >= 2) {
      // Cuando ambas imágenes estén listas, inicializar el juego
      resetGame();
      requestAnimationFrame(loop);
    }
  };
  playerImg.onload = onAssetLoad;
  coinImg.onload = onAssetLoad;

  // Jugador (Matebu)
  const player = {
    x: 50,
    y: 0, // se establece en resetGame
    w: 40,
    h: 40,
    vy: 0,
    jumping: false,
    ducking: false
  };

  const gravity = 0.6;
  const jumpStrength = 12;
  // Configuraciones para el agachado: altura normal y altura agachado
  const normalHeight = 40;
  const crouchHeight = 30;

  let obstacles = [];
  let coins = [];
  let score = 0;
  let gameOver = false;
  let lastObstacleTime = 0;
  let lastCoinTime = 0;
  const obstacleInterval = 1500;
  const coinInterval = 2000;

  function resetGame() {
    player.h = normalHeight;
    player.y = height - player.h;
    player.vy = 0;
    player.jumping = false;
    player.ducking = false;
    obstacles = [];
    coins = [];
    score = 0;
    gameOver = false;
    lastObstacleTime = Date.now();
    lastCoinTime = Date.now();
    scoreElem.textContent = 'Penes: 0';
    gameOverElem.style.display = 'none';
  }

  function spawnObstacle() {
    // Decide si el obstáculo requiere agacharse (overhead) o saltar
    const overheadChance = 0.3;
    if (Math.random() < overheadChance) {
      // Obstáculo que cuelga y obliga a agacharse
      const h = 20 + Math.random() * 30; // altura del obstáculo
      const w = 20 + Math.random() * 20;
      // La parte inferior de este obstáculo estará justo por encima de la altura que deja espacio al agacharse
      const margin = 10;
      const bottomY = height - (normalHeight - crouchHeight) - margin;
      obstacles.push({ x: width + 20, y: bottomY - h, w: w, h: h, overhead: true });
    } else {
      // Obstáculo en el suelo para saltar
      const h = 20 + Math.random() * 30;
      const w = 20 + Math.random() * 10;
      obstacles.push({ x: width + 20, y: height - h, w: w, h: h, overhead: false });
    }
  }

  function spawnCoin() {
    const size = 24;
    // Generar moneda en un rango vertical evitando el suelo
    const yMin = height - size - 120;
    const yMax = height - size - 40;
    const yPos = yMin + Math.random() * Math.max(0, yMax - yMin);
    coins.push({ x: width + 20, y: yPos, size: size });
  }

  function update() {
    // Movimiento del jugador al saltar
    if (player.jumping) {
      player.vy += gravity;
      player.y += player.vy;
      if (player.y >= height - player.h) {
        player.y = height - player.h;
        player.jumping = false;
        player.vy = 0;
      }
    }
    // Comportamiento al agacharse (solo si no está saltando)
    if (!player.jumping) {
      if (player.ducking) {
        // Aplastar al jugador y mantenerlo en el suelo
        player.h = crouchHeight;
        player.y = height - player.h;
      } else {
        // Restaurar altura gradualmente si estaba agachado
        if (player.h < normalHeight) {
          player.h += 1;
        }
        // Asegurar que el jugador permanezca apoyado en el suelo
        player.y = height - player.h;
      }
    }

    // Generar obstáculos y monedas
    const now = Date.now();
    if (now - lastObstacleTime > obstacleInterval + Math.random() * 500) {
      spawnObstacle();
      lastObstacleTime = now;
    }
    if (now - lastCoinTime > coinInterval + Math.random() * 500) {
      spawnCoin();
      lastCoinTime = now;
    }

    // Actualizar posiciones de obstáculos y monedas
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= 4;
      if (obstacles[i].x + obstacles[i].w < 0) {
        obstacles.splice(i, 1);
      }
    }
    for (let i = coins.length - 1; i >= 0; i--) {
      coins[i].x -= 4;
      if (coins[i].x + coins[i].size < 0) {
        coins.splice(i, 1);
      }
    }

    // Colisiones con obstáculos
    obstacles.forEach((obs) => {
      // Si el obstáculo cuelga y el jugador está agachado, ignorar la colisión
      if (obs.overhead && player.ducking) return;
      if (
        player.x < obs.x + obs.w &&
        player.x + player.w > obs.x &&
        player.y < obs.y + obs.h &&
        player.y + player.h > obs.y
      ) {
        gameOver = true;
      }
    });

    // Colisiones con monedas
    coins.forEach((coin, idx) => {
      const cx1 = coin.x;
      const cy1 = coin.y;
      const cx2 = coin.x + coin.size;
      const cy2 = coin.y + coin.size;
      // Comprobar si cualquiera de los bordes de la moneda está dentro del rectángulo del jugador
      if (
        cx2 > player.x &&
        cx1 < player.x + player.w &&
        cy2 > player.y &&
        cy1 < player.y + player.h
      ) {
        coins.splice(idx, 1);
        score++;
        scoreElem.textContent = 'Penes: ' + score;
      }
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Dibujar línea del suelo
    ctx.strokeStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(0, height - 1);
    ctx.lineTo(width, height - 1);
    ctx.stroke();

    // Dibujar jugador (escalado para ajuste de altura)
    ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

    // Dibujar obstáculos
    obstacles.forEach((obs) => {
      ctx.fillStyle = obs.overhead ? '#e67e22' : '#e74c3c';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    });

    // Dibujar monedas
    coins.forEach((coin) => {
      ctx.drawImage(coinImg, coin.x, coin.y, coin.size, coin.size);
    });
  }

  function loop() {
    if (gameOver) {
      // Mostrar pantalla de Game Over
      gameOverElem.style.display = 'block';
      finalScoreElem.textContent = 'Has recolectado ' + score + ' penes.';
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Control de teclado para saltar y agacharse
  document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    if (
      (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') &&
      !player.jumping &&
      !player.ducking
    ) {
      player.jumping = true;
      player.vy = -jumpStrength;
    }
    if ((e.code === 'ArrowDown' || e.code === 'KeyS') && !player.jumping) {
      player.ducking = true;
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      player.ducking = false;
    }
  });

  // Reiniciar juego
  restartBtn.addEventListener('click', () => {
    resetGame();
    requestAnimationFrame(loop);
  });
})();