// Juego "¿Dónde está Juan?": selecciona de forma determinística qué cabeza y fondo
// mostrar cada día y coloca la imagen de Juan en una posición y tamaño aleatorios
// pero reproducibles. El jugador debe hacer clic en la cara para ganar.

(() => {
  // Configuración: lista de rutas de imágenes de cabezas y fondos
  const headImages = [
    'head1.png',
    'head2.png',
  ];
  const backgrounds = [
    // Fondos proporcionados por el usuario para ocultar a Juan
    'backgrounds/juan_bg1.webp',
    'backgrounds/juan_bg2.jpg',
    'backgrounds/juan_bg3.jpg',
    'backgrounds/juan_bg4.jfif'
  ];

  // Fecha base para calcular el día actual (13 de octubre de 2025)
  const baseDate = new Date(2025, 9, 13); // meses 0‑indexados: 9 = octubre
  const today = new Date();
  // Calcular diferencia en días ignorando la hora local
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor((today.setHours(0,0,0,0) - baseDate.setHours(0,0,0,0)) / msPerDay);

  // Determinar índices de cabeza y fondo basados en diffDays
  const headIndex = ((diffDays % headImages.length) + headImages.length) % headImages.length;
  const bgIndex = ((diffDays % backgrounds.length) + backgrounds.length) % backgrounds.length;

  // Generador de números pseudoaleatorios determinístico basado en diffDays
  let seed = diffDays;
  function rng() {
    // LCG parameters
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  // Obtener elementos del DOM
  const bgEl = document.getElementById('background');
  const juanEl = document.getElementById('juan');
  const msgEl = document.getElementById('message');
  const containerEl = document.getElementById('game-container');

  // Cargar imágenes
  bgEl.src = backgrounds[bgIndex];
  juanEl.src = headImages[headIndex];

  // Ocultar mensaje inicialmente
  msgEl.hidden = true;

  // Cuando ambas imágenes se hayan cargado, posicionar la cabeza
  let backgroundLoaded = false;
  let headLoaded = false;
  bgEl.onload = () => {
    backgroundLoaded = true;
    if (headLoaded) {
      placeHead();
    }
  };
  juanEl.onload = () => {
    headLoaded = true;
    if (backgroundLoaded) {
      placeHead();
    }
  };

  // Función para colocar la cabeza de Juan en una posición y tamaño aleatorios
  function placeHead() {
    // Obtener dimensiones de contenedor y cabeza natural
    const containerWidth = containerEl.clientWidth;
    const containerHeight = containerEl.clientHeight;
    const naturalWidth = juanEl.naturalWidth;
    const naturalHeight = juanEl.naturalHeight;
    const aspectRatio = naturalHeight / naturalWidth;

    // Calcular factor de tamaño (entre 0.12 y 0.25 del ancho del contenedor)
    const minFactor = 0.12;
    const maxFactor = 0.25;
    const sizeFactor = minFactor + rng() * (maxFactor - minFactor);
    const headWidth = containerWidth * sizeFactor;
    const headHeight = headWidth * aspectRatio;

    // Asegurar que la cabeza quepa completamente
    const maxX = Math.max(containerWidth - headWidth, 0);
    const maxY = Math.max(containerHeight - headHeight, 0);
    const posX = rng() * maxX;
    const posY = rng() * maxY;

    // Aplicar estilos
    juanEl.style.width = `${headWidth}px`;
    juanEl.style.height = `${headHeight}px`;
    juanEl.style.left = `${posX}px`;
    juanEl.style.top = `${posY}px`;
  }

  // Manejar clic sobre la cara de Juan
  juanEl.addEventListener('click', () => {
    // Mostrar mensaje de éxito
    msgEl.hidden = false;
    // Lanzar confeti para celebrar que lo encontraste
    if (typeof launchConfetti === 'function') {
      launchConfetti();
    }
  });
})();