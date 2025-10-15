(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreElem = document.getElementById('score');
  const gameOverElem = document.getElementById('gameOver');
  const finalScoreElem = document.getElementById('finalScore');
  const restartBtn = document.getElementById('restartBtn');

  let width, height;

  function resize() {
    // Ancho máximo 600px para que se vea bien en móviles y desktops
    width = Math.min(window.innerWidth - 40, 600);
    height = 200;
    canvas.width = width;
    canvas.height = height;
  }
  window.addEventListener('resize', resize);
  resize();

  // Jugador (Matebu)
  const player = {
    x: 50,
    y: 0, // se establece en resetGame
    w: 30,
    h: 40,
    vy: 0,
    jumping: false,
    ducking: false
  };

  const gravity = 0.6;
  const jumpStrength = 12;

  let obstacles = [];
  let coins = [];
  let score = 0;
  let gameOver = false;
  let lastObstacleTime = 0;
  let lastCoinTime = 0;
  const obstacleInterval = 1500;
  const coinInterval = 2000;

  function resetGame() {
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
    scoreElem.textContent = 'Monedas: 0';
    gameOverElem.style.display = 'none';
  }

  function spawnObstacle() {
    const h = 20 + Math.random() * 30;
    const w = 20 + Math.random() * 10;
    obstacles.push({ x: width + 20, y: height - h, w: w, h: h });
  }

  function spawnCoin() {
    const size = 20;
    const yPos = height - 60 - Math.random() * 80;
    coins.push({ x: width + 20, y: yPos, r: size / 2 });
  }

  function update() {
    // Movimiento del jugador
    if (player.jumping) {
      player.vy += gravity;
      player.y += player.vy;
      if (player.y >= height - player.h) {
        player.y = height - player.h;
        player.jumping = false;
        player.vy = 0;
      }
    }
    // Ajusta la altura cuando se agacha
    if (player.ducking && !player.jumping) {
      player.h = 25;
    } else {
      player.h = 40;
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
      if (coins[i].x + coins[i].r * 2 < 0) {
        coins.splice(i, 1);
      }
    }

    // Colisiones con obstáculos
    obstacles.forEach((obs) => {
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
      const cx = coin.x + coin.r;
      const cy = coin.y + coin.r;
      // Chequeo simple: si el centro del círculo está dentro del rectángulo del jugador
      if (
        cx > player.x &&
        cx < player.x + player.w &&
        cy > player.y &&
        cy < player.y + player.h
      ) {
        coins.splice(idx, 1);
        score++;
        scoreElem.textContent = 'Monedas: ' + score;
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

    // Dibujar jugador
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // Dibujar obstáculos
    ctx.fillStyle = '#e74c3c';
    obstacles.forEach((obs) => {
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    });

    // Dibujar monedas
    ctx.fillStyle = '#f1c40f';
    coins.forEach((coin) => {
      ctx.beginPath();
      ctx.arc(coin.x + coin.r, coin.y + coin.r, coin.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function loop() {
    if (gameOver) {
      // Mostrar pantalla de Game Over
      gameOverElem.style.display = 'block';
      finalScoreElem.textContent = 'Has recolectado ' + score + ' monedas.';
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Control de teclado para saltar y agacharse
  document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    if ((e.code === 'Space' || e.code === 'ArrowUp') && !player.jumping && !player.ducking) {
      player.jumping = true;
      player.vy = -jumpStrength;
    }
    if (e.code === 'ArrowDown' && !player.jumping) {
      player.ducking = true;
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown') {
      player.ducking = false;
    }
  });

  // Reiniciar juego
  restartBtn.addEventListener('click', () => {
    resetGame();
    requestAnimationFrame(loop);
  });

  // Iniciar el juego por primera vez
  resetGame();
  requestAnimationFrame(loop);
})();
