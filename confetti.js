// Confetti generator
// Define a function `launchConfetti` on the global scope. When called, it
// creates colorful pieces that fall down the screen. It injects required
// styles if they haven't been added yet.
(function() {
  function insertStyles() {
    if (document.getElementById('confetti-style')) return;
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = `
      .confetti-piece {
        position: fixed;
        top: -10px;
        width: 10px;
        height: 16px;
        opacity: 0.9;
        animation-name: confetti-fall;
        animation-timing-function: linear;
        animation-fill-mode: forwards;
        pointer-events: none;
        z-index: 9999;
      }
      @keyframes confetti-fall {
        to {
          transform: translateY(100vh) rotate(360deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  window.launchConfetti = function() {
    insertStyles();
    const colors = [
      '#F94144', '#F3722C', '#F8961E', '#F9844A', '#F9C74F',
      '#90BE6D', '#43AA8B', '#4D908E', '#577590', '#277DA1'
    ];
    const numberOfPieces = 120;
    for (let i = 0; i < numberOfPieces; i++) {
      const piece = document.createElement('div');
      piece.classList.add('confetti-piece');
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.left = Math.random() * 100 + '%';
      piece.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
      const duration = 2 + Math.random() * 2;
      const delay = Math.random() * 0.5;
      piece.style.animationDuration = duration + 's';
      piece.style.animationDelay = delay + 's';
      document.body.appendChild(piece);
      // Remove piece after animation ends
      setTimeout(() => piece.remove(), (duration + delay) * 1000);
    }
  };
})();