document.addEventListener("DOMContentLoaded", () => {
    // Elementos de tela já existentes
    const loginScreen = document.getElementById("login-screen");
    const gameContainer = document.getElementById("game-container");
    const usernameInput = document.getElementById("username");
    const enterBtn = document.getElementById("enter-btn");
    const rankingList = document.getElementById("ranking-list");
    const restartBtn = document.getElementById("restart-btn");
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    
    // Elementos do sistema de crédito
    const creditAmountElem = document.getElementById("credit-amount");
    const creditInput = document.getElementById("credit-input");
    const addCreditBtn = document.getElementById("add-credit-btn");
    
    // Variável para armazenar os créditos do usuário
    let userCredit = 0;
    
    // Função para atualizar a exibição dos créditos
    function updateCreditDisplay() {
      creditAmountElem.textContent = userCredit;
    }
    
    // Simulação de processamento de pagamento (em um cenário real, aqui você integraria com um backend)
    function processPayment(amount) {
      return new Promise((resolve, reject) => {
        // Simula um tempo de processamento de 2 segundos
        setTimeout(() => {
          // Para fins de demonstração, sempre aprovamos o pagamento
          resolve(true);
        }, 2000);
      });
    }
    
    // Evento para adicionar crédito
    addCreditBtn.addEventListener("click", async () => {
      const amount = parseFloat(creditInput.value);
      if (isNaN(amount) || amount <= 0) {
        alert("Por favor, insira um valor válido.");
        return;
      }
      // Desabilita o botão durante o processamento
      addCreditBtn.disabled = true;
      addCreditBtn.textContent = "Processando...";
      
      try {
        const result = await processPayment(amount);
        if (result) {
          userCredit += amount;
          updateCreditDisplay();
          alert(`Pagamento aprovado! Você recebeu ${amount} créditos.`);
        } else {
          alert("Pagamento recusado. Tente novamente.");
        }
      } catch (error) {
        console.error(error);
        alert("Erro no processamento do pagamento.");
      } finally {
        addCreditBtn.disabled = false;
        addCreditBtn.textContent = "Adicionar Crédito";
        creditInput.value = "";
      }
    });
    
    // ============================================================
    // A partir daqui segue o código do jogo (labirinto, movimento, etc.)
    // ============================================================
    
    const cols = 20;
    const rows = 20;
    const tileSize = 20;
    canvas.width = cols * tileSize;
    canvas.height = rows * tileSize;
    
    const maze = [
      "11111111111111111111",
      "10000000001100000001",
      "10111111001101111101",
      "10100001000001000101",
      "10101111111011010101",
      "10101000001001010101",
      "10101011101001010101",
      "10101010101001010101",
      "10101010101001010101",
      "10101010101001010101",
      "10101010101001010101",
      "10101010101001010101",
      "10101010101001010101",
      "10101010101001010101",
      "10100000000000000101",
      "10111111111111111101",
      "10000000000000000001",
      "10111111111111111101",
      "10000000000000000001",
      "11111111111111111111"
    ];
    
    let wallCells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (maze[r][c] === "1") {
          wallCells.push({ x: c * tileSize, y: r * tileSize, width: tileSize, height: tileSize });
        }
      }
    }
    
    let pellets = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (maze[r][c] === "0") {
          pellets.push({
            x: c * tileSize + tileSize / 2,
            y: r * tileSize + tileSize / 2,
            eaten: false
          });
        }
      }
    }
    
    // Power-ups reposicionados em células abertas (exemplo: células (1,1) e (18,16))
    let powerUps = [
      { x: (1 + 0.5) * tileSize, y: (1 + 0.5) * tileSize, eaten: false },
      { x: (18 + 0.5) * tileSize, y: (16 + 0.5) * tileSize, eaten: false }
    ];
    
    let gameLoopId;
    let gameOver = false;
    let username = "";
    let score = 0;
    let isPoweredUp = false;
    let powerUpTimer = 0;
    
    let pacman = {
      x: (11 + 0.5) * tileSize,
      y: (10 + 0.5) * tileSize,
      radius: tileSize / 2 - 2,
      speed: 2,
      direction: "right",
      get dirAngle() {
        switch (this.direction) {
          case "right": return 0;
          case "down": return Math.PI / 2;
          case "left": return Math.PI;
          case "up": return 3 * Math.PI / 2;
          default: return 0;
        }
      }
    };
    
    let ghosts = [
      { x: (1 + 0.5) * tileSize, y: (1 + 0.5) * tileSize, speed: 2, direction: "right", color: "red",    initX: (1 + 0.5) * tileSize, initY: (1 + 0.5) * tileSize },
      { x: (cols - 2 + 0.5) * tileSize, y: (1 + 0.5) * tileSize, speed: 2, direction: "left", color: "pink",   initX: (cols - 2 + 0.5) * tileSize, initY: (1 + 0.5) * tileSize },
      { x: (1 + 0.5) * tileSize, y: (rows - 2 + 0.5) * tileSize, speed: 2, direction: "right", color: "cyan",   initX: (1 + 0.5) * tileSize, initY: (rows - 2 + 0.5) * tileSize },
      { x: (cols - 2 + 0.5) * tileSize, y: (rows - 2 + 0.5) * tileSize, speed: 2, direction: "left", color: "orange", initX: (cols - 2 + 0.5) * tileSize, initY: (rows - 2 + 0.5) * tileSize }
    ];
    
    function checkWallCollision(x, y, radius) {
      for (let wall of wallCells) {
        if (
          x + radius > wall.x &&
          x - radius < wall.x + wall.width &&
          y + radius > wall.y &&
          y - radius < wall.y + wall.height
        ) {
          return true;
        }
      }
      return false;
    }
    
    function drawWalls() {
      ctx.fillStyle = "blue";
      wallCells.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
      });
    }
    
    function drawPellets() {
      ctx.fillStyle = "white";
      pellets.forEach(pellet => {
        if (!pellet.eaten) {
          ctx.beginPath();
          ctx.arc(pellet.x, pellet.y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    }
    
    function drawPowerUps() {
      ctx.fillStyle = "orange";
      powerUps.forEach(powerUp => {
        if (!powerUp.eaten) {
          ctx.beginPath();
          ctx.arc(powerUp.x, powerUp.y, 6, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    }
    
    function drawPacman() {
      const mouthAngle = 0.2 + 0.15 * Math.abs(Math.sin(Date.now() / 150));
      const startAngle = pacman.dirAngle + mouthAngle;
      const endAngle = pacman.dirAngle + 2 * Math.PI - mouthAngle;
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.moveTo(pacman.x, pacman.y);
      ctx.arc(pacman.x, pacman.y, pacman.radius, startAngle, endAngle, false);
      ctx.closePath();
      ctx.fill();
    }
    
    function drawGhosts() {
      ghosts.forEach(ghost => {
        ctx.fillStyle = isPoweredUp ? "blue" : ghost.color;
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y, pacman.radius, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
    
    function checkPelletCollision() {
      pellets.forEach(pellet => {
        if (!pellet.eaten && Math.hypot(pacman.x - pellet.x, pacman.y - pellet.y) < pacman.radius + 3) {
          pellet.eaten = true;
          score += 10;
        }
      });
    }
    
    function checkPowerUpCollision() {
      powerUps.forEach(powerUp => {
        if (!powerUp.eaten && Math.hypot(pacman.x - powerUp.x, pacman.y - powerUp.y) < pacman.radius + 6) {
          powerUp.eaten = true;
          score += 50;
          isPoweredUp = true;
          powerUpTimer = Date.now() + 10000;
        }
      });
    }
    
    function updatePacmanPosition() {
      let newX = pacman.x;
      let newY = pacman.y;
      if (pacman.direction === "right") newX += pacman.speed;
      else if (pacman.direction === "left") newX -= pacman.speed;
      else if (pacman.direction === "up") newY -= pacman.speed;
      else if (pacman.direction === "down") newY += pacman.speed;
    
      if (!checkWallCollision(newX, newY, pacman.radius)) {
        pacman.x = newX;
        pacman.y = newY;
      }
      checkPelletCollision();
      checkPowerUpCollision();
    }
    
    function isCellOpen(col, row) {
      if (row < 0 || row >= rows || col < 0 || col >= cols) return false;
      return maze[row][col] === "0";
    }
    
    // Lógica de movimentação dos fantasmas com perseguição aprimorada:
    function updateGhosts() {
      ghosts.forEach(ghost => {
        const cellCol = Math.floor(ghost.x / tileSize);
        const cellRow = Math.floor(ghost.y / tileSize);
        const cellCenterX = cellCol * tileSize + tileSize / 2;
        const cellCenterY = cellRow * tileSize + tileSize / 2;
        const deltaX = ghost.x - cellCenterX;
        const deltaY = ghost.y - cellCenterY;
    
        if (Math.abs(deltaX) < 2 && Math.abs(deltaY) < 2) {
          const possibleDirections = [];
          const opposites = { "right": "left", "left": "right", "up": "down", "down": "up" };
    
          function testDirection(dir, dc, dr) {
            if (dir === opposites[ghost.direction]) return;
            const newCol = cellCol + dc;
            const newRow = cellRow + dr;
            if (isCellOpen(newCol, newRow)) {
              possibleDirections.push({ dir, newCol, newRow });
            }
          }
          testDirection("up", 0, -1);
          testDirection("down", 0, 1);
          testDirection("left", -1, 0);
          testDirection("right", 1, 0);
    
          if (possibleDirections.length > 0) {
            let best = possibleDirections[0];
            let bestDist = Infinity;
            possibleDirections.forEach(option => {
              const targetX = option.newCol * tileSize + tileSize / 2;
              const targetY = option.newRow * tileSize + tileSize / 2;
              const d = Math.hypot(pacman.x - targetX, pacman.y - targetY);
              if (d < bestDist) {
                bestDist = d;
                best = option;
              }
            });
            ghost.direction = best.dir;
          }
        }
    
        let newX = ghost.x;
        let newY = ghost.y;
        if (ghost.direction === "right") newX += ghost.speed;
        else if (ghost.direction === "left") newX -= ghost.speed;
        else if (ghost.direction === "up") newY -= ghost.speed;
        else if (ghost.direction === "down") newY += ghost.speed;
    
        if (!checkWallCollision(newX, newY, pacman.radius)) {
          ghost.x = newX;
          ghost.y = newY;
        } else {
          if (ghost.direction === "right") ghost.direction = "left";
          else if (ghost.direction === "left") ghost.direction = "right";
          else if (ghost.direction === "up") ghost.direction = "down";
          else if (ghost.direction === "down") ghost.direction = "up";
        }
    
        if (Math.hypot(pacman.x - ghost.x, pacman.y - ghost.y) < pacman.radius + 2) {
          if (isPoweredUp) {
            score += 200;
            ghost.x = ghost.initX;
            ghost.y = ghost.initY;
          } else {
            endGame();
          }
        }
      });
    }
    
    function endGame() {
      cancelAnimationFrame(gameLoopId);
      gameOver = true;
      setTimeout(() => {
        alert("Você perdeu!");
        const rankingItem = document.createElement("li");
        rankingItem.textContent = `${username}: ${score} pontos`;
        rankingList.appendChild(rankingItem);
        restartBtn.style.display = "block";
      }, 100);
    }
    
    function gameLoop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawWalls();
      drawPellets();
      drawPowerUps();
      updatePacmanPosition();
      updateGhosts();
      drawPacman();
      drawGhosts();
    
      if (isPoweredUp && Date.now() > powerUpTimer) {
        isPoweredUp = false;
      }
    
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.fillText("Pontuação: " + score, 10, 18);
    
      if (!gameOver) {
        gameLoopId = requestAnimationFrame(gameLoop);
      }
    }
    
    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") pacman.direction = "right";
      if (event.key === "ArrowLeft") pacman.direction = "left";
      if (event.key === "ArrowUp") pacman.direction = "up";
      if (event.key === "ArrowDown") pacman.direction = "down";
    });
    
    enterBtn.addEventListener("click", () => {
      username = usernameInput.value.trim();
      if (username === "") {
        alert("Por favor, insira um nome de usuário.");
        return;
      }
      loginScreen.style.display = "none";
      gameContainer.style.display = "flex";
      resetGame();
      gameLoop();
    });
    
    restartBtn.addEventListener("click", () => {
      resetGame();
      gameOver = false;
      gameLoop();
    });
    
    function resetGame() {
      pacman.x = (11 + 0.5) * tileSize;
      pacman.y = (10 + 0.5) * tileSize;
      pacman.direction = "right";
    
      ghosts = [
        { x: (1 + 0.5) * tileSize, y: (1 + 0.5) * tileSize, speed: 2, direction: "right", color: "red",    initX: (1 + 0.5) * tileSize, initY: (1 + 0.5) * tileSize },
        { x: (cols - 2 + 0.5) * tileSize, y: (1 + 0.5) * tileSize, speed: 2, direction: "left", color: "pink",   initX: (cols - 2 + 0.5) * tileSize, initY: (1 + 0.5) * tileSize },
        { x: (1 + 0.5) * tileSize, y: (rows - 2 + 0.5) * tileSize, speed: 2, direction: "right", color: "cyan",   initX: (1 + 0.5) * tileSize, initY: (rows - 2 + 0.5) * tileSize },
        { x: (cols - 2 + 0.5) * tileSize, y: (rows - 2 + 0.5) * tileSize, speed: 2, direction: "left", color: "orange", initX: (cols - 2 + 0.5) * tileSize, initY: (rows - 2 + 0.5) * tileSize }
      ];
    
      pellets.forEach(p => p.eaten = false);
      powerUps.forEach(p => p.eaten = false);
      score = 0;
      isPoweredUp = false;
      powerUpTimer = 0;
      restartBtn.style.display = "none";
    }
  });
  