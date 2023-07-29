
document.getElementById('new-game').addEventListener('click', () => {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('container').style.display = 'none';
  document.getElementById('gameCanvas').style.display = 'block';

  class Player {
    constructor(size, inventory, terrain, enemies) {
      this.x = 10010;
      this.y = 10010;
      this.size = size;
      this.direction = 'down';
      this.harvestCooldown = false;
      this.setupControls();
      this.inventory = inventory;
      this.terrain = terrain;
      this.enemies = enemies;
      this.alive = true;
    }
    canHarvest() {
      return !this.harvestCooldown;
    }
    setHarvestCooldown() {
      this.harvestCooldown = true;
      setTimeout(() => {
        this.harvestCooldown = false;
      }, 1000);
    }
    isNearResource(terrain) {
      const {
        tileX,
        tileY
      } = terrain.screenToTileCoordinates(this.x, this.y);
      const resource = terrain.getResourceType(tileX, tileY);
      return resource !== null;
    }
    setupControls() {
      this.keys = {};
      window.addEventListener('keydown', e => {
        this.keys[e.key] = true;

        if ('1234567'.includes(e.key)) {
          const type = this.getTypeFromKey(e.key);

          if (type && this.inventory.resources[type] > 0) {
            const {
              tileX,
              tileY
            } = this.terrain.screenToTileCoordinates(this.x, this.y);
            const placedItemType = this.terrain.getPlacedItem(tileX, tileY);

            if (!placedItemType) {
              this.terrain.addPlacedItem(type, tileX, tileY);
              this.inventory.resources[type]--;
            }
          }
        }
      });
      window.addEventListener('keyup', e => {
        this.keys[e.key] = false;
      });
    }
    getTypeFromKey(key) {
      const types = ['sand', 'wood', 'stone', 'silver', 'gold', 'iron', 'diamond', 'berries'];
      const type = types[parseInt(key) - 1];

      if (type && this.inventory.resources[type] > 0) {
        const {
          tileX,
          tileY
        } = this.terrain.screenToTileCoordinates(this.x, this.y);
        let newTileX = tileX;
        let newTileY = tileY;

        switch (this.direction) {
          case 'up':
            newTileY -= 1;
            break;

          case 'down':
            newTileY += 1;
            break;

          case 'left':
            newTileX -= 1;
            break;

          case 'right':
            newTileX += 1;
            break;
        }

        const terrainType = this.terrain.getTerrainType(newTileX, newTileY);
        const placedItemType = this.terrain.getPlacedItem(newTileX, newTileY);

        if (terrainType && !placedItemType) {
          this.terrain.addPlacedItem(type, newTileX, newTileY);
          this.inventory.resources[type]--;
        }
      }
    }
    update(terrain) {
      const tileSize = 20;
      const moveInterval = 300;

      if (!this.lastMoveTime) {
        this.lastMoveTime = 0;
      }


      if (Date.now() - this.lastMoveTime >= moveInterval) {
        if (this.keys['ArrowUp'] && this.getTerrainType(0, -tileSize, terrain)) {
          this.y -= tileSize;
          this.keys['ArrowUp'] = false;
          this.lastMoveTime = Date.now();
        }

        if (this.keys['ArrowDown'] && this.getTerrainType(0, tileSize, terrain)) {
          this.y += tileSize;
          this.keys['ArrowDown'] = false;
          this.lastMoveTime = Date.now();
        }

        if (this.keys['ArrowLeft'] && this.getTerrainType(-tileSize, 0, terrain)) {
          this.x -= tileSize;
          this.keys['ArrowLeft'] = false;
          this.lastMoveTime = Date.now();
        }

        if (this.keys['ArrowRight'] && this.getTerrainType(tileSize, 0, terrain)) {
          this.x += tileSize;
          this.keys['ArrowRight'] = false;
          this.lastMoveTime = Date.now();
        }
      }
    }
    getTerrainType(dx, dy, terrain) {
      const newX = this.x + dx;
      const newY = this.y + dy;
      const {
        tileX,
        tileY
      } = terrain.screenToTileCoordinates(newX, newY);
      const terrainType = terrain.getTerrainType(tileX, tileY + 1);
      const placedItemType = terrain.getPlacedItem(tileX, tileY + 1);

      if (placedItemType || terrainType == 'water') {
        return false;
      }

      return terrainType;
    }
    draw(ctx) {
      ctx.fillStyle = 'red';
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }

  }

  class Inventory {
    constructor() {
      this.resources = {
        sand: 10,
        wood: 2,
        stone: 10,
        silver: 1,
        gold: 0,
        iron: 2,
        diamond: 0,
        berries: 5
      };
    }

    addResource(type, x, y) {
      this.resources[type]++;
      let canvasText = new CanvasText('gameCanvas');
      canvasText.setTextStyle('20px Arial');
      playerState = `+1 ${type}`;
      setTimeout(() => {
        playerState = 'Player';
      }, 1000);
    }

    drawInventory(canvas) {
      const canvasText = new CanvasText('gameCanvas');
      canvasText.setTextStyle('20px Arial');
      const margin = 20;
      let y = margin;

      for (const type in this.resources) {
        const text = `${type}: ${this.resources[type]}`;
        const textWidth = canvasText.ctx.measureText(text).width;
        canvasText.drawText(text, canvas.width - textWidth - margin, y);
        y += 20;
      }
    }

  }

  class Camera {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }

    follow(target) {
      const followSpeed = 0.1;
      this.x += (target.x - this.width / 2 - this.x) * followSpeed;
      this.y += (target.y - this.height / 2 - this.y) * followSpeed;
    }

    applyTransform(ctx) {
      ctx.translate(-this.x, -this.y);
    }

  }

  class Golem {
    constructor(type, x, y, terrain, inventory) {
      this.maxIterations = 2020;
      this.type = type;
      this.x = x;
      this.y = y;
      this.size = 20;
      this.spawnX = x;
      this.spawnY = y;
      this.terrain = terrain;
      this.returnToSpawn = false;
      this.moved = 0;
      this.path = [];
      this.inventory = inventory;
      this.targetReached = false;

      switch (type) {
        case 'iron':
          this.hp = 100;
          this.damage = 10;
          this.speed = 1600;
          this.color = '#CBCDCD';
          break;

        case 'gold':
          this.hp = 150;
          this.damage = 15;
          this.speed = 1400;
          this.color = '#ffd700';
          break;

        case 'diamond':
          this.hp = 200;
          this.damage = 20;
          this.speed = 1000;
          this.color = '#b9f2ff';
          break;
      }
    }

    isInRange(enemy) {
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= 20 * 20;
    }

    takeDamage(damage) {
      this.hp -= damage;
    }

    findPath(start, goal, terrain) {
      const openSet = [start];
      const cameFrom = new Map();
      const gScore = new Map();
      const fScore = new Map();
      let iterations = 0;
      gScore.set(start, 0);
      fScore.set(start, this.heuristicCostEstimate(start, goal));

      while (openSet.length > 0) {
        iterations++;
        const current = openSet.reduce((a, b) => fScore.get(a) < fScore.get(b) ? a : b);

        if (this.areEqual(current, goal)) {
          return this.reconstructPath(cameFrom, current);
        }

        if (iterations >= this.maxIterations) {
          this.hp = 0;
          return []; // no path found
        }

        openSet.splice(openSet.indexOf(current), 1);
        this.getNeighbors(current, terrain).forEach(neighbor => {
          const tentativeGScore = gScore.get(current) + this.distanceBetween(current, neighbor);

          if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
            cameFrom.set(neighbor, current);
            gScore.set(neighbor, tentativeGScore);
            fScore.set(neighbor, gScore.get(neighbor) + this.heuristicCostEstimate(neighbor, goal));

            if (!openSet.some(node => this.areEqual(node, neighbor))) {
              openSet.push(neighbor);
            }
          }
        });
      }

      return [];
    }

    heuristicCostEstimate(a, b) {
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    distanceBetween(a, b) {
      return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    areEqual(a, b) {
      return a.x === b.x && a.y === b.y;
    }

    getNeighbors(node, terrain) {
      const neighbors = [];
      const directions = [{
        x: -1,
        y: 0
      }, {
        x: 1,
        y: 0
      }, {
        x: 0,
        y: -1
      }, {
        x: 0,
        y: 1
      }];
      directions.forEach(dir => {
        const newX = node.x + dir.x * 20;
        const newY = node.y + dir.y * 20;
        const terrainType = this.getTerrainType(newX, newY, terrain);

        if (terrainType !== false) {
          neighbors.push({
            x: newX,
            y: newY
          });
        }
      });
      return neighbors;
    }

    reconstructPath(cameFrom, current) {
      const totalPath = [current];

      while (cameFrom.has(current)) {
        current = cameFrom.get(current);
        totalPath.unshift(current);
      }

      return totalPath;
    }

    move() {
      const currentTime = Date.now();

      if (currentTime - this.lastMoved < this.speed) {
        return;
      }

      this.lastMoved = currentTime;

      if (this.path.length === 0 || this.targetReached) {
        let validTarget = false;
        let targetX, targetY;

        while (!validTarget) {
          targetX = this.spawnX + (Math.floor(Math.random() * 101) - 50) * 20;
          targetY = this.spawnY + (Math.floor(Math.random() * 101) - 50) * 20;
          const distFromSpawn = Math.sqrt((targetX - this.spawnX) ** 2 + (targetY - this.spawnY) ** 2);

          if (this.getTerrainType(targetX, targetY, this.terrain) !== false && distFromSpawn <= 50 * 20) {
            validTarget = true;
          }
        }

        const start = {
          x: this.x,
          y: this.y
        };
        const goal = {
          x: targetX,
          y: targetY
        };
        this.path = this.findPath(start, goal, this.terrain);
        this.targetReached = false;
      }

      const nextNode = this.path.shift();

      if (nextNode) {
        this.x = nextNode.x;
        this.y = nextNode.y;

        if (this.path.length > 0 && this.areEqual(nextNode, this.path[this.path.length - 1])) {
          this.targetReached = true;
        }
      }

      this.moved++;

      if (this.moved > 50) {
        this.returnToSpawn = true;
      }

      if (this.returnToSpawn) {
        if (this.path.length === 0) {
          const start = {
            x: this.x,
            y: this.y
          };
          const goal = {
            x: this.spawnX,
            y: this.spawnY
          };
          this.path = this.findPath(start, goal, this.terrain);
        }

        const nextNode = this.path.shift();

        if (nextNode) {
          this.x = nextNode.x;
          this.y = nextNode.y;
        }

        if (this.x == this.spawnX && this.y == this.spawnY) {
          this.returnToSpawn = false;

          if (this.inventory.resources['silver'] > 0) {
            switch (this.type) {
              case 'iron':
                this.hp = 100;
                break;

              case 'gold':
                this.hp = 150;
                break;

              case 'diamond':
                this.hp = 200;
                break;
            }

            this.inventory.resources['silver']--;
          } else this.hp = 0;

          this.moved = 0;
        }
      }
    }

    getTerrainType(newX, newY, terrain) {
      const {
        tileX,
        tileY
      } = terrain.screenToTileCoordinates(newX, newY);
      const terrainType = terrain.getTerrainType(tileX, tileY + 1);
      const placedItemType = terrain.getPlacedItem(tileX, tileY + 1);

      if (placedItemType || terrainType == 'water') {
        return false;
      }

      return terrainType;
    }

    draw(ctx) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }

  }
  //For pathfinding I used an A* algorithm. The documentation I used:
  //https://en.wikipedia.org/wiki/A*_search_algorithm#:~:text=A*%20is%20an%20informed%20search,shortest%20time%2C%20etc.).
  //https://www.geeksforgeeks.org/a-search-algorithm/
  //https://www.redblobgames.com/pathfinding/a-star/introduction.html
  //https://qiao.github.io/PathFinding.js/visual/


  class Enemy {
    constructor(player, terrain, golems) {
      this.pathfindingCooldown = 1000; // 1 second cooldown

      this.lastPathfindingTime = Date.now();
      this.size = 20;
      this.color = 'blue';
      this.hp = 100;
      this.spawnDistance = 1000; // Spawn distance from the player

      this.speed = 300;
      this.player = player;
      this.terrain = terrain;
      this.golems = golems;
      this.lastPlayerX = this.player.x;
      this.lastPlayerY = this.player.y;
      this.path = [];
      this.damage = 10;
      this.maxIterations = 2020; // Maximum iterations for pathfinding

      this.spawn();
    }

    isInRange(golem) {
      const dx = golem.x - this.x;
      const dy = golem.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= 10 * 10;
    }

    takeDamage(damage) {
      this.hp -= damage;
    }

    getRandomColor() {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      const hexColor = "#" + r.toString(16) + g.toString(16) + b.toString(16);
      return hexColor;
    }

    getTerrainType(newX, newY, terrain) {
      const {
        tileX,
        tileY
      } = terrain.screenToTileCoordinates(newX, newY);
      const terrainType = terrain.getTerrainType(tileX, tileY + 1);
      const placedItemType = terrain.getPlacedItem(tileX, tileY + 1);

      if (placedItemType || terrainType == 'water') {
        return false;
      }

      return terrainType;
    }

    findPath(start, goal, terrain, maxSearchDistance = 4000) {
      const openSet = [start];
      const cameFrom = new Map();
      const gScore = new Map();
      const fScore = new Map();
      let iterations = 0;
      gScore.set(start, 0);
      fScore.set(start, this.heuristicCostEstimate(start, goal));

      while (openSet.length > 0) {
        iterations++;

        if (iterations >= this.maxIterations) {
          return [];
        }

        const current = openSet.reduce((a, b) => fScore.get(a) < fScore.get(b) ? a : b);

        if (this.heuristicCostEstimate(current, goal) > maxSearchDistance) {
          return [];
        }

        if (this.areEqual(current, goal)) {
          return this.reconstructPath(cameFrom, current);
        }

        openSet.splice(openSet.indexOf(current), 1);
        this.getNeighbors(current, terrain).forEach(neighbor => {
          const tentativeGScore = gScore.get(current) + this.distanceBetween(current, neighbor);

          if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
            cameFrom.set(neighbor, current);
            gScore.set(neighbor, tentativeGScore);
            fScore.set(neighbor, gScore.get(neighbor) + this.heuristicCostEstimate(neighbor, goal));

            if (!openSet.some(node => this.areEqual(node, neighbor))) {
              openSet.push(neighbor);
            }
          }
        });
      }

      return [];
    }

    computeGoalBounds(terrain, goal) {
      const bounds = new Map();
      const queue = [goal];
      const visited = new Set();

      while (queue.length > 0) {
        const current = queue.shift();
        const key = `${current.x},${current.y}`;

        if (!visited.has(key)) {
          visited.add(key);
          const neighbors = this.getNeighbors(current, terrain);
          neighbors.forEach(neighbor => {
            if (!visited.has(`${neighbor.x},${neighbor.y}`)) {
              queue.push(neighbor);
            }
          });
          const bound = {
            minX: Math.min(current.x, goal.x),
            maxX: Math.max(current.x, goal.x),
            minY: Math.min(current.y, goal.y),
            maxY: Math.max(current.y, goal.y)
          };
          bounds.set(key, bound);
        }
      }

      return bounds;
    }

    isInGoalBounds(goalBounds, node) {
      const key = `${node.x},${node.y}`;
      const bound = goalBounds.get(key);

      if (!bound) {
        return false;
      }

      return node.x >= bound.minX && node.x <= bound.maxX && node.y >= bound.minY && node.y <= bound.maxY;
    }

    heuristicCostEstimate(a, b) {
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    distanceBetween(a, b) {
      return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    areEqual(a, b) {
      return a.x === b.x && a.y === b.y;
    }

    getNeighbors(node, terrain) {
      const neighbors = [];
      const directions = [{
        x: -1,
        y: 0
      }, {
        x: 1,
        y: 0
      }, {
        x: 0,
        y: -1
      }, {
        x: 0,
        y: 1
      }];
      directions.forEach(dir => {
        const newX = node.x + dir.x * 20;
        const newY = node.y + dir.y * 20;
        const terrainType = this.getTerrainType(newX, newY, terrain);

        if (terrainType !== false) {
          neighbors.push({
            x: newX,
            y: newY
          });
        }
      });
      return neighbors;
    }

    reconstructPath(cameFrom, current) {
      const totalPath = [current];

      while (cameFrom.has(current)) {
        current = cameFrom.get(current);
        totalPath.unshift(current);
      }

      return totalPath;
    }

    spawn() {
      const angle = Math.random() * Math.PI * 5;
      const distanceX = Math.cos(angle) * this.spawnDistance;
      const distanceY = Math.sin(angle) * this.spawnDistance;
      this.x = Math.ceil((this.player.x + distanceX) / 20) * 20 + 10;
      this.y = Math.ceil((this.player.x + distanceY) / 20) * 20 + 10;
      const {
        tileX,
        tileY
      } = this.terrain.screenToTileCoordinates(this.x, this.y);
      const terrainType = this.terrain.getTerrainType(tileX, tileY);

      if (terrainType === 'water') {
        this.spawn();
      }
    }

    update() {
      const currentTime = Date.now();
      const nearbyGolem = this.getNearbyGolem();
      const goal = nearbyGolem ? {
        x: nearbyGolem.x,
        y: nearbyGolem.y
      } : {
        x: this.player.x,
        y: this.player.y
      };

      if (!this.lastUpdateTime || currentTime - this.lastUpdateTime >= this.speed) {
        if (currentTime - this.lastPathfindingTime >= this.pathfindingCooldown && (this.path.length === 0 || this.targetPositionChanged(goal))) {
          const start = {
            x: this.x,
            y: this.y
          };
          this.path = this.findPath(start, goal, this.terrain);
          this.updateLastTargetPosition(goal);
          this.lastPathfindingTime = currentTime;
        }

        const nextNode = this.path.shift();

        if (nextNode) {
          this.x = nextNode.x;
          this.y = nextNode.y;
        }

        if (this.checkCollisionWithPlayer()) {
          this.player.alive = false;
        }

        if (nearbyGolem && this.checkCollisionWithGolem(nearbyGolem)) {
          this.hp -= nearbyGolem.damage;
          nearbyGolem.hp -= this.damage;
        }

        this.lastUpdateTime = currentTime;
      }
    }

    getNearbyGolem() {
      let closestGolem;
      let minDistance = Infinity;

      for (const golem of this.golems) {
        if (golem.isInRange(this)) {
          const dx = this.x - golem.x;
          const dy = this.y - golem.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < minDistance) {
            closestGolem = golem;
            minDistance = distance;
          }
        }
      }

      return closestGolem;
    }

    targetPositionChanged(goal) {
      return this.lastTargetX !== goal.x || this.lastTargetY !== goal.y;
    }

    playerPositionChanged() {
      return this.lastPlayerX !== this.player.x || this.lastPlayerY !== this.player.y;
    }

    updateLastTargetPosition(goal) {
      this.lastTargetX = goal.x;
      this.lastTargetY = goal.y;
    }

    checkCollisionWithGolem(golem) {
      const dx = golem.x - this.x;
      const dy = golem.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.size) {
        return true;
      }

      return false;
    }

    draw(ctx) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }

    checkCollisionWithPlayer() {
      const dx = this.player.x - this.x;
      const dy = this.player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.size) {
        return true;
      }

      return false;
    }

  }

  class CanvasText {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
    }

    setTextStyle(font = '16px Arial', color = 'rgba(0, 0, 0, 1)') {
      this.ctx.font = font;
      this.ctx.fillStyle = color;
    }

    drawText(text, x, y) {
      this.ctx.fillText(text, x, y);
    }

  }

  class Game {
    constructor(canvasId) {
      this.inventory = new Inventory();
      this.golems = [];
      this.enemies = [];
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.terrain = new Terrain();
      this.player = new Player(20, this.inventory, this.terrain, this.enemies);
      this.camera = new Camera(0, 0, this.canvas.width, this.canvas.height);
      this.player.setupControls();
      this.setupControls();
      this.coordinatesElement = document.getElementById('coordinates');
      this.ammountOfEnemies = 2;
      this.hungerTimer = 0;
      this.enemySpawnTimer = 0;
      this.labelTimer = 0;
    }

    setupControls() {
      window.addEventListener('keydown', e => {
        if ('zxc'.includes(e.key)) {
          // const golemType = this.getGolemTypeFromKey(e.key);
          // if (golemType && this.inventory.resources[golemType] > 0) {
          if (e.key == 'z' && this.inventory.resources['iron'] > 0) {
            this.golems.push(new Golem('iron', this.player.x, this.player.y, this.terrain, this.inventory));
            this.inventory.resources['iron']--;
          } else if (e.key == 'x' && this.inventory.resources['gold'] > 0) {
            this.golems.push(new Golem('gold', this.player.x, this.player.y, this.terrain, this.inventory));
            this.inventory.resources['gold']--;
          } else if (e.key == 'c' && this.inventory.resources['diamond'] > 0) {
            this.golems.push(new Golem('diamond', this.player.x, this.player.y, this.terrain, this.inventory));
            this.inventory.resources['diamond']--;
          }
        }

        if (e.key === 'r') {
          const {
            tileX,
            tileY
          } = this.terrain.screenToTileCoordinates(this.player.x, this.player.y);
          this.terrain.removePlacedItem(tileX, tileY);
        }

        if (e.key == 'l') {
          this.inventory.resources = {
            sand: Infinity,
            wood: Infinity,
            stone: Infinity,
            silver: Infinity,
            gold: Infinity,
            iron: Infinity,
            diamond: Infinity,
            berries: Infinity
          };
        }

        if ((e.key === 'e' || e.key === 'E') && this.player.canHarvest()) {
          const {
            tileX,
            tileY
          } = this.terrain.screenToTileCoordinates(this.player.x, this.player.y);
          const resource = this.terrain.getResourceType(tileX, tileY);

          if (this.player.isNearResource(this.terrain)) {
            this.player.setHarvestCooldown();

            playerState = 'Harvesting...';
            setTimeout(() => {
              this.inventory.addResource(resource.type, this.player.x, this.player.y);

            }, resource.harvestTime * 1000);
          }

        }
      });
    }

    loop(now) {
      if (this.player.alive == false) {
        document.getElementById('main-menu').style.display = 'flex';
        document.getElementById('container').style.display = 'block';
        document.getElementById('gameCanvas').style.display = 'none';
        return;
      }

      if (this.inventory.resources['berries'] <= -1) {
        this.player.alive = false;
      }

      if (now - this.hungerTimer >= 60000 && this.inventory.resources['berries'] > 0) {

        this.inventory.resources['berries']--;
        this.hungerTimer = now;
      }


      this.player.update(this.terrain);
      this.camera.follow(this.player); //const { x, y } = this.player;
      //this.coordinatesElement.textContent = `X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}`;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.save();
      this.camera.applyTransform(this.ctx); // Draw terrain and player

      this.terrain.draw(this.ctx, this.camera);
      this.golems.forEach(golem => {
        if (golem.hp <= 0) this.golems.splice(this.golems.indexOf(golem), 1);
        let canvasText = new CanvasText('gameCanvas');
        canvasText.setTextStyle('20px Arial', golem.color);
        let text = 'Golem';
        let textWidth = canvasText.ctx.measureText(text).width;
        canvasText.drawText(text, golem.x - textWidth / 2, golem.y - 40);
        canvasText = new CanvasText('gameCanvas');
        canvasText.setTextStyle('20px Arial');
        text = golem.hp;
        textWidth = canvasText.ctx.measureText(text).width;
        canvasText.drawText(text, golem.x - textWidth / 2 - 2, golem.y - 20);
        golem.move();
        golem.draw(this.ctx);
      });
      if (now - this.enemySpawnTimer >= 120000 && this.enemies.length == 0) {
        
        for (let i = 0; i < this.ammountOfEnemies; i++) {

          this.enemies.push(new Enemy(this.player, this.terrain, this.golems));
          console.log(this.enemies);
        }

        this.enemySpawnTimer = now;
      }

      this.enemies.forEach(enemy => {
        if (enemy.hp <= 0) {
          this.enemies.splice(this.enemies.indexOf(enemy), 1);
        }

        if (this.enemies.length == 0 && this.ammountOfEnemies < 15)
          this.ammountOfEnemies++;
        enemy.update();
        let canvasText = new CanvasText('gameCanvas');
        canvasText.setTextStyle('20px Arial');
        let text = 'Enemy';
        let textWidth = canvasText.ctx.measureText(text).width;
        canvasText.drawText(text, enemy.x - textWidth / 2, enemy.y - 40);
        canvasText = new CanvasText('gameCanvas');
        canvasText.setTextStyle('20px Arial');
        text = enemy.hp;
        textWidth = canvasText.ctx.measureText(text).width;
        canvasText.drawText(text, enemy.x - textWidth / 2 - 2, enemy.y - 20);
        enemy.draw(this.ctx);
      });
      let canvasText = new CanvasText('gameCanvas');
      canvasText.setTextStyle('20px Arial', this.player.color);
      this.player.draw(this.ctx);
      let text = playerState;
      let textWidth = canvasText.ctx.measureText(text).width;
      canvasText.drawText(text, this.player.x - textWidth / 2, this.player.y - 20);
      this.ctx.restore();
      this.inventory.drawInventory(this.canvas);
      requestAnimationFrame(now => this.loop(now));
    }

    start() {
      const now = performance.now();
      this.loop(now);


    }

  }
  // I used perlin noise in order to generate smooth infinite terrain with biomes. 
  // Documentation and infromation I used:
  // https://rtouti.github.io/graphics/perlin-noise-algorithm#:~:text=Perlin%20noise%20is%20a%20popular,number%20of%20inputs%20it%20gets.
  // https://en.wikipedia.org/wiki/Perlin_noise
  // https://medium.com/@yvanscher/playing-with-perlin-noise-generating-realistic-archipelagos-b59f004d8401


  class PerlinNoise {
    constructor(seed) {
      this.permutation = [];
      this.seed = seed || Math.random() * 1000;

      for (let i = 0; i < 256; i++) {
        this.permutation[i] = i;
      }

      for (let i = 0; i < 256; i++) {
        const j = (this.seed ^ i + this.permutation[i]) % 256;
        [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
      }
    }

    fade(t) {
      return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(a, b, t) {
      return a + t * (b - a);
    }

    grad(hash, x, y, z) {
      const h = hash & 15;
      const u = h < 8 ? x : y;
      const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y, z) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const Z = Math.floor(z) & 255;
      x -= Math.floor(x);
      y -= Math.floor(y);
      z -= Math.floor(z);
      const u = this.fade(x);
      const v = this.fade(y);
      const w = this.fade(z);
      const A = this.permutation[X] + Y;
      const AA = this.permutation[A] + Z;
      const AB = this.permutation[A + 1] + Z;
      const B = this.permutation[X + 1] + Y;
      const BA = this.permutation[B] + Z;
      const BB = this.permutation[B + 1] + Z;
      return this.lerp(this.lerp(this.lerp(this.grad(this.permutation[AA], x, y, z), this.grad(this.permutation[BA], x - 1, y, z), u), this.lerp(this.grad(this.permutation[AB], x, y - 1, z), this.grad(this.permutation[BB], x - 1, y - 1, z), u), v), this.lerp(this.lerp(this.grad(this.permutation[AA + 1], x, y, z - 1), this.grad(this.permutation[BA + 1], x - 1, y, z - 1), u), this.lerp(this.grad(this.permutation[AB + 1], x, y - 1, z - 1), this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1), u), v), w);
    }

  }

  class Terrain {
    constructor(seed) {
      this.noise = new PerlinNoise(seed);
      this.scale = 0.01;
      this.placedItems = {};
    }

    addPlacedItem(type, x, y) {
      const key = `${x},${y}`;
      this.placedItems[key] = type;
    }

    getPlacedItem(x, y) {
      const key = `${x},${y}`;
      return this.placedItems[key] || null;
    }

    getResourceType(x, y) {
      const terrainType = this.getTerrainType(x, y);
      const resources = {
        sand: {
          type: 'sand',
          harvestTime: 1
        },
        wood: {
          type: 'wood',
          harvestTime: 2
        },
        stone: {
          type: 'stone',
          harvestTime: 3
        },
        ores: [{
          type: 'silver',
          harvestTime: 4
        }, {
          type: 'gold',
          harvestTime: 5
        }, {
          type: 'iron',
          harvestTime: 6
        }, {
          type: 'diamond',
          harvestTime: 7
        }],
        berries: {
          type: 'berries',
          harvestTime: 1
        }
      };

      switch (terrainType) {
        case 'beach':
          return resources.sand;

        case 'grassland':
          return resources.berries;

        case 'forest':
          return resources.wood;

        case 'mountain':
          const oreIndex = Math.floor(Math.random() * resources.ores.length);
          return resources.ores[oreIndex];

        default:
          return null;
      }
    }

    removePlacedItem(x, y) {
      const key = `${x},${y}`;

      if (key in this.placedItems) {
        delete this.placedItems[key];
      }
    }

    screenToTileCoordinates(x, y) {
      const tileSize = 20;
      return {
        tileX: Math.floor(x / tileSize),
        tileY: Math.floor(y / tileSize)
      };
    }

    getTerrainType(x, y) {
      const elevation = (this.noise.noise(x * this.scale, y * this.scale, 0) + 1) / 2;

      if (elevation < 0.4) {
        return 'water';
      } else if (elevation < 0.45) {
        return 'beach';
      } else if (elevation < 0.6) {
        return 'grassland';
      } else if (elevation < 0.7) {
        return 'forest';
      } else if (elevation < 0.85) {
        return 'mountain';
      } else {
        return 'snow';
      }
    }

    drawTile(ctx, type, x, y, tileSize, isPlaced = false) {
      let color;

      switch (type) {
        case 'sand':
          color = 'sandybrown';
          break;

        case 'wood':
          color = 'brown';
          break;

        case 'water':
          color = 'blue';
          break;

        case 'beach':
          color = 'yellow';
          break;

        case 'grassland':
          color = 'green';
          break;

        case 'forest':
          color = 'darkgreen';
          break;

        case 'mountain':
          color = 'gray';
          break;

        case 'snow':
          color = 'white';
          break;

        case 'stone':
          color = 'dimgray';
          break;

        case 'silver':
          color = 'silver';
          break;

        case 'gold':
          color = 'gold';
          break;

        case 'iron':
          color = 'darkgray';
          break;

        case 'diamond':
          color = 'deepskyblue';
          break;

        default:
          color = 'black';
          break;
      }

      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      ctx.fillStyle = color;
    }

    draw(ctx, camera) {
      const tileSize = 20;
      const startX = Math.floor(camera.x / tileSize) - 1;
      const startY = Math.floor(camera.y / tileSize) - 1;
      const endX = Math.ceil((camera.x + camera.width) / tileSize) + 1;
      const endY = Math.ceil((camera.y + camera.height) / tileSize) + 1;

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const type = this.getTerrainType(x, y);
          this.drawTile(ctx, type, x - 1, y - 1, tileSize);
          const placedItemType = this.getPlacedItem(x, y);

          if (placedItemType) {
            this.drawTile(ctx, placedItemType, x, y, tileSize, true);
          }
        }
      }
    }

  }

  let playerState = 'Player';
  const game = new Game('gameCanvas');
  game.start();
});
document.getElementById('instructions').addEventListener('click', () => {
  document.getElementById('instructions-window').style.display = 'block';
});
document.getElementById('close-instructions').addEventListener('click', () => {
  document.getElementById('instructions-window').style.display = 'none';
});

window.onclick = event => {
  if (event.target == document.getElementById('instructions-window')) {
    document.getElementById('instructions-window').style.display = 'none';
  }
};