/*
 * Lógica del juego tipo Wordle
 * Para modificar la base de datos de palabras, edita la variable wordList.
 */

(() => {
  // Lista de palabras disponibles. Puedes añadir o quitar palabras según tus
  // preferencias. No es necesario que todas tengan la misma longitud; el
  // tablero se ajustará automáticamente a la longitud de la palabra
  // seleccionada. Procura incluir sólo palabras en mayúsculas o
  // utiliza el método .toUpperCase() al final como aquí.
  const wordList = [
    // Lista de palabras personalizada. Cada entrada puede incluir espacios.
    // El tablero se adapta automáticamente al número de caracteres (espacios incluidos)
    // pero los espacios no generan casillas, sólo huecos. Se sugiere escribir
    // todas las palabras en mayúsculas para facilitar la comparación.
    "AUDI",          // 4 letras
    "MATI WOLF",          // 4 letras
    "MATEBU",        // 6 letras
    "CHOCLO",        // 6 letras     // 8 caracteres (incluye espacio)
    "HELLO GOODBYE", // 14 caracteres (incluye espacio)
    "ILAN",          // 4 letras
    "SHALOM",        // 6 letras
    "EMPANADA",      // 8 letras
    "TATIANA",       // 7 letras
    "PRIMITIVAS",       // 7 letras
    "CLASH ROYALE",  // 12 caracteres (incluye espacio)
    "ALMIBU",        // 6 letras
    "SARITA SAROTA", // 13 caracteres (incluye espacio)
    "MATE DISCRETA", // 13 caracteres (incluye espacio)
    "KODAK",         // 5 letras
    "SENAL",         // 5 letras (sin tilde)
    "BAUTI INFIEL",  // 12 caracteres (incluye espacio)
    "ANTICHAD",      // 8 letras    // 10 letras
    "LUCIANO",       // 7 letras
    "PHINEAS Y FERNAN", // 18 caracteres (incluye espacios)
    "BROWNIE PLANET",// 13 caracteres (incluye espacio)
    "COMPACTO",      // 8 letras
    "BOOM CHAKALAKA",// 14 caracteres (incluye espacio)
    "CHI",           // 3 letras
    "MTURRIN",       // 7 letras
    "MADELINE CLINE",// 15 caracteres (incluye espacio)
    "MATATE Y GRABALO",// 17 caracteres (incluye espacio)
    "JEANS ROTOS",   // 11 caracteres (incluye espacio)
    "SARA VOMIT",    // 10 caracteres (incluye espacio)
    "PREMIOS PRECOZ",// 14 caracteres (incluye espacio)
    "GIRA GIRA TU CALZON",
    "CLOCK IT",
    "CHAD",
    "ELISEO"
]
  // Parámetros del juego
  const maxGuesses = 6;

  // Obtener la palabra del día en función de la fecha actual y la lista de palabras.
  function getWordOfTheDay() {
    // Fecha base (13 de octubre de 2025). Se utiliza como referencia para el índice 0.
    const startDate = new Date('2025-10-13T00:00:00');
    const today = new Date();
    // Calcular la diferencia en días entre hoy y la fecha base
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    // Índice ciclando la longitud de la lista
    const index = ((diffDays % wordList.length) + wordList.length) % wordList.length;
    return wordList[index];
  }

  // Seleccionar la palabra objetivo según el día
  const target = getWordOfTheDay();
  // Analizar la palabra objetivo en busca de espacios para soportar frases con espacios.
  const targetChars = Array.from(target);
  const letterPositions = [];
  for (let i = 0; i < targetChars.length; i++) {
    if (targetChars[i] !== ' ') {
      letterPositions.push(i);
    }
  }
  const numLetters = letterPositions.length;
  const numCols = targetChars.length;
  let currentRow = 0;
  // Índice de la letra que se está escribiendo (ignora espacios)
  let currentLetterIndex = 0;
  let gameOver = false;

  // Estado de las letras del teclado para colorear según su mejor estado
  const keyboardState = {};

  // Configuración de temas (claro/oscuro) y botón de alternancia
  const themeToggleBtn = document.getElementById('theme-toggle');
  function applyTheme(theme) {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(`${theme}-mode`);
    localStorage.setItem('theme', theme);
    // Actualizar icono: en tema oscuro mostrar sol para volver a claro, en tema claro mostrar luna
    themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  (function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);
  })();
  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    applyTheme(isDark ? 'light' : 'dark');
  });

  // Crear el tablero dinámicamente. Se respetan los espacios en la palabra objetivo:
  // se genera una columna por cada carácter, pero los espacios se representan como huecos.
  const boardElem = document.getElementById("board");
  boardElem.style.gridTemplateColumns = `repeat(${numCols}, var(--cell-size))`;
  boardElem.style.gridTemplateRows = `repeat(${maxGuesses}, var(--cell-size))`;
  const cells = [];
  for (let r = 0; r < maxGuesses; r++) {
    cells[r] = [];
    for (let c = 0; c < numCols; c++) {
      const cell = document.createElement("div");
      if (targetChars[c] === ' ') {
        // Espacio: hueco sin borde ni fondo
        cell.classList.add('space');
      } else {
        cell.classList.add('cell');
      }
      boardElem.appendChild(cell);
      cells[r][c] = cell;
    }
  }

  /**
   * Ajusta dinámicamente el tamaño de las celdas (variable CSS --cell-size) para que el tablero
   * nunca se desborde del ancho disponible. Calcula el tamaño de cada casilla en función
   * del número de columnas y del ancho del contenedor. Limita el tamaño máximo a 4rem
   * (aproximadamente 64 px) para conservar proporciones en pantallas grandes.
   */
  function setResponsiveCellSize() {
    // Elemento contenedor del tablero (padre de boardElem)
    const container = boardElem.parentElement || document.body;
    // Ancho disponible: el contenedor completo o 100% del viewport, limitado a 600 px
    const availableWidth = Math.min(container.clientWidth || window.innerWidth, 600);
    // Obtener valores de gap y font size para convertir rem a px
    const rootStyles = getComputedStyle(document.documentElement);
    const fontSize = parseFloat(rootStyles.fontSize); // px por 1rem
    const gapRem = parseFloat(rootStyles.getPropertyValue('--cell-gap')) || 0.3; // fallback al valor por defecto
    const gapPx = gapRem * fontSize;
    // Calcular el tamaño máximo de celda a partir de la variable CSS --cell-size
    // Si se especifica en rem, conviértelo a px usando fontSize. Si ya es px, úsalo tal cual.
    let maxCellSize;
    const cellSizeVar = rootStyles.getPropertyValue('--cell-size').trim();
    if (cellSizeVar.endsWith('rem')) {
      maxCellSize = parseFloat(cellSizeVar) * fontSize;
    } else if (cellSizeVar.endsWith('px')) {
      maxCellSize = parseFloat(cellSizeVar);
    } else {
      // Valor por defecto: 4rem
      maxCellSize = 4 * fontSize;
    }
    // Calcular tamaño de celda en base al ancho disponible y al número de columnas
    const sizePx = (availableWidth - gapPx * (numCols - 1)) / numCols;
    const finalSize = Math.min(maxCellSize, sizePx);
    // Aplicar nuevo valor a la variable CSS
    document.documentElement.style.setProperty('--cell-size', `${finalSize}px`);
  }
  // Llamar al inicializar
  setResponsiveCellSize();
  // Actualizar al redimensionar la ventana
  window.addEventListener('resize', setResponsiveCellSize);

  // Crear el teclado en pantalla
  const keyboardElem = document.getElementById("keyboard");
  const keyLayout = [
    "QWERTYUIOP".split(""),
    "ASDFGHJKL".split(""),
    ["Enter", "Z", "X", "C", "V", "B", "N", "M", "⌫"]
  ];

  keyLayout.forEach((row) => {
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("keyboard-row");
    row.forEach((key) => {
      const keyBtn = document.createElement("div");
      keyBtn.classList.add("key");
      // Hacer las teclas de Enter y Borrar más anchas
      if (key.length > 1 || key === "⌫") {
        keyBtn.classList.add("wide");
      }
      keyBtn.textContent = key;
      keyBtn.dataset.key = key;
      keyBtn.addEventListener("click", () => handleKey(key));
      rowDiv.appendChild(keyBtn);
    });
    keyboardElem.appendChild(rowDiv);
  });

  // Mostrar mensajes al usuario
  const messageElem = document.getElementById("message");
  function showMessage(msg) {
    messageElem.textContent = msg;
    // Borrar mensaje después de cierto tiempo
    if (msg) {
      setTimeout(() => {
        if (messageElem.textContent === msg) messageElem.textContent = "";
      }, 2000);
    }
  }

  // Procesar teclas presionadas (físico o virtual)
  function handleKey(key) {
    if (gameOver) return;
    key = key.toUpperCase();
    if (key === "⌫" || key === "BACKSPACE") {
      // Borrar letra: retroceder al último carácter no-espacio
      if (currentLetterIndex > 0) {
        currentLetterIndex--;
        const col = letterPositions[currentLetterIndex];
        cells[currentRow][col].textContent = "";
      }
      return;
    }
    if (key === "ENTER") {
      submitGuess();
      return;
    }
    if (/^[A-ZÑÁÉÍÓÚÜ]$/.test(key)) {
      if (currentLetterIndex < numLetters) {
        const col = letterPositions[currentLetterIndex];
        cells[currentRow][col].textContent = key;
        currentLetterIndex++;
      }
    }
  }

  // Verificar la conjetura actual y aplicar colores
  function submitGuess() {
    if (currentLetterIndex < numLetters) {
      showMessage("Palabra incompleta");
      return;
    }
    // Construir la palabra introducida ignorando espacios
    const guessArr = [];
    for (let i = 0; i < numLetters; i++) {
      const col = letterPositions[i];
      guessArr.push(cells[currentRow][col].textContent);
    }
    const guess = guessArr.join("");
    // Obtener solución sin espacios
    const solutionStr = target.replace(/\s/g, "");
    const solutionArr = solutionStr.split("");
    const tempGuessArr = guess.split("");
    const result = Array(numLetters).fill("absent");
    // Primer pase: encontrar aciertos exactos
    for (let i = 0; i < numLetters; i++) {
      if (tempGuessArr[i] === solutionArr[i]) {
        result[i] = "correct";
        solutionArr[i] = null;
        tempGuessArr[i] = null;
      }
    }
    // Segundo pase: encontrar letras presentes en otra posición
    for (let i = 0; i < numLetters; i++) {
      if (tempGuessArr[i] != null) {
        const index = solutionArr.indexOf(tempGuessArr[i]);
        if (index !== -1) {
          result[i] = "present";
          solutionArr[index] = null;
        }
      }
    }
    // Aplicar clases a cada celda y actualizar estado del teclado
    for (let i = 0; i < numLetters; i++) {
      const col = letterPositions[i];
      const cell = cells[currentRow][col];
      const status = result[i];
      cell.classList.add(status);
      updateKeyboardKey(cell.textContent, status);
    }
    // Comprobar si ganó
    if (guess === solutionStr) {
      showMessage(`¡Correcto! La palabra era ${target}.`);
      // Lanzar confeti para celebrar el acierto
      if (typeof launchConfetti === 'function') {
        launchConfetti();
      }
      gameOver = true;
      return;
    }
    // Si se acabaron los intentos
    if (currentRow === maxGuesses - 1) {
      showMessage(`¡Fin! La palabra era ${target}.`);
      gameOver = true;
      return;
    }
    // Pasar a la siguiente fila
    currentRow++;
    currentLetterIndex = 0;
  }

  // Actualizar el color del teclado virtual
  function updateKeyboardKey(letter, status) {
    const key = letter.toUpperCase();
    const priority = { correct: 2, present: 1, absent: 0 };
    // Solo actualizar si el nuevo estado tiene mayor prioridad
    if (keyboardState[key] != null && priority[status] <= priority[keyboardState[key]]) {
      return;
    }
    keyboardState[key] = status;
    const keyButtons = keyboardElem.querySelectorAll(".key");
    keyButtons.forEach((btn) => {
      if (btn.textContent.toUpperCase() === key) {
        btn.classList.remove("correct", "present", "absent");
        btn.classList.add(status);
      }
    });
  }

  // Capturar eventos de teclado físico
  window.addEventListener("keydown", (e) => {
    // Sólo interceptar si el foco está en el cuerpo del documento (no en la barra de direcciones u otros controles)
    if (e.target !== document.body) return;
    let key = e.key;
    // Traducir algunas teclas al formato usado
    if (key === "Backspace") key = "⌫";
    if (key.length === 1) key = key.toUpperCase();
    if (["Enter", "⌫"].includes(key) || /^[A-ZÑÁÉÍÓÚÜ]$/.test(key)) {
      e.preventDefault();
      handleKey(key);
    }
  });
})();