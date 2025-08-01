// lib/game/GameEngine.js
import { createEntity, addComponent, hasComponent } from './entities';
import { PositionComponent, VelocityComponent, PhysicsComponent, RenderComponent, PlayerComponent, InputComponent, CollisionComponent, LevelComponent } from './components';
import { TILE_SIZE } from './constants';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { CollisionSystem } from './systems/CollisionSystem';
import { InputSystem } from './systems/InputSystem';
import { RenderSystem } from './systems/RenderSystem';
import { GameLogicSystem } from './systems/GameLogicSystem';
import { EventBus } from './EventBus';
import { parseLevelData } from './utils';

export class GameEngine {
  constructor(initialState = {}) {
    this.entities = new Map();
    this.eventBus = new EventBus();
    this.gravity = initialState.gravity || 0.5;
    this.tileSize = initialState.tileSize || TILE_SIZE;
    this.gameAreaWidth = initialState.gameAreaWidth || 960; // Default, will be updated by level data
    this.gameAreaHeight = initialState.gameAreaHeight || 640; // Default, will be updated by level data
    this.levelWidth = 0; // Actual level width
    this.levelHeight = 0; // Actual level height
    this.viewportWidth = initialState.viewportWidth || 960; // Default viewport width
    this.viewportHeight = initialState.viewportHeight || 640; // Default viewport height
    this.keysPressed = {};

    // Initialize player entity
    const player = createEntity();
    addComponent(player, 'PositionComponent', PositionComponent(initialState.playerX || 0, initialState.playerY || 0));
    addComponent(player, 'VelocityComponent', VelocityComponent(0, 0));
    addComponent(player, 'PhysicsComponent', PhysicsComponent(true));
    addComponent(player, 'RenderComponent', RenderComponent(initialState.playerSprite || '/player_sprite.png', 0, 'idle', initialState.playerWidth || TILE_SIZE, initialState.playerHeight || TILE_SIZE));
    addComponent(player, 'PlayerComponent', PlayerComponent(initialState.jumpStrength || 10, initialState.moveSpeed || 5));
    addComponent(player, 'InputComponent', InputComponent(this.keysPressed));
    addComponent(player, 'CollisionComponent', CollisionComponent(true, initialState.playerWidth || TILE_SIZE, initialState.playerHeight || TILE_SIZE));
    this.addEntity(player);

    // Initialize level entity
    const level = createEntity();
    addComponent(level, 'LevelComponent', LevelComponent(initialState.levelData || [], this.tileSize));
    this.addEntity(level);

    this.platforms = []; // This will be populated from level data
    this.levelGrid = []; // Initialize level grid
  }

  addEntity(entity) {
    this.entities.set(entity.id, entity);
  }

  removeEntity(id) {
    this.entities.delete(id);
  }

  getEntity(id) {
    return this.entities.get(id);
  }

  getEntitiesByComponent(componentName) {
    const entitiesWithComponent = [];
    for (const entity of this.entities.values()) {
      if (hasComponent(entity, componentName)) {
        entitiesWithComponent.push(entity);
      }
    }
    return entitiesWithComponent;
  }

  update(deltaTime) {
    // Update input state
    const playerEntities = this.getEntitiesByComponent('PlayerComponent');
    playerEntities.forEach(player => {
      if (player.InputComponent) {
        player.InputComponent.keysPressed = this.keysPressed;
      }
    });

    // Run systems
    InputSystem(playerEntities, this.keysPressed);
    PhysicsSystem(this.getEntitiesByComponent('PhysicsComponent'), this.gravity);
    CollisionSystem(this.getEntitiesByComponent('CollisionComponent'), this.levelGrid, this.gameAreaWidth, this.gameAreaHeight, this.tileSize);
    GameLogicSystem(this.getEntitiesByComponent('PlayerComponent'), deltaTime); // Pass relevant entities and deltaTime

    // Emit events (e.g., collision events from CollisionSystem)
    // This part would be more complex with a full event bus, but for now, direct calls are fine.
  }

  render() {
    // RenderSystem returns data for React to render
    const player = this.getEntitiesByComponent('PlayerComponent')[0];
    const playerPosition = player ? player.PositionComponent : { x: 0, y: 0 };
    return RenderSystem(this.getEntitiesByComponent('RenderComponent'), playerPosition, this.levelWidth, this.levelHeight, this.viewportWidth, this.viewportHeight);
  }

  setKeysPressed(keys) {
    this.keysPressed = keys;
  }

  loadLevel(levelData) {
    const levelEntity = this.getEntitiesByComponent('LevelComponent')[0];
    if (levelEntity) {
      levelEntity.LevelComponent.data = levelData;
      // Clear existing platforms before loading new ones
      this.entities.forEach((entity, id) => {
        if (hasComponent(entity, 'CollisionComponent') && !hasComponent(entity, 'PlayerComponent')) {
          this.removeEntity(id);
        }
      });
      this.parseLevelDataToPlatforms(levelData); // This now adds entities directly
      // this.platforms = this.getEntitiesByComponent('CollisionComponent').filter(e => !hasComponent(e, 'PlayerComponent')); // No longer needed
    }
  }

  parseLevelDataToPlatforms(data) {
    const { grid: levelGrid, rows: levelRows, cols: levelCols } = parseLevelData(data);
    this.levelGrid = levelGrid; // Store the parsed level grid
    this.levelWidth = levelCols * this.tileSize;
    this.levelHeight = levelRows * this.tileSize;
    this.gameAreaWidth = this.levelWidth; // Update game area to level dimensions
    this.gameAreaHeight = this.levelHeight; // Update game area to level dimensions

    levelGrid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (['G', 'R', 'W', 'O', 'L'].includes(cell)) {
          const tileProperties = {
            x: colIndex * this.tileSize,
            y: rowIndex * this.tileSize,
            width: this.tileSize,
            height: this.tileSize,
            type: cell,
            isSolid: ['G', 'R', 'W'].includes(cell),
            isOneWay: cell === 'O',
            isDamaging: cell === 'L',
            friction: 1,
            restitution: 0,
          };
          // Create an entity for the platform and add components
          const platformEntity = createEntity();
          addComponent(platformEntity, 'PositionComponent', PositionComponent(tileProperties.x, tileProperties.y));
          addComponent(platformEntity, 'CollisionComponent', CollisionComponent(tileProperties.isSolid, tileProperties.width, tileProperties.height, tileProperties.type));
          // Add a RenderComponent for platforms to be rendered
          addComponent(platformEntity, 'RenderComponent', RenderComponent('', 0, '', tileProperties.width, tileProperties.height));
          this.addEntity(platformEntity);
        } else if (cell === 'St') {
          // Update player start position if 'St' tile is found
          const playerEntity = this.getEntitiesByComponent('PlayerComponent')[0];
          if (playerEntity) {
            playerEntity.PositionComponent.x = colIndex * this.tileSize + (this.tileSize / 2) - (playerEntity.RenderComponent.width / 2);
            playerEntity.PositionComponent.y = rowIndex * this.tileSize - playerEntity.RenderComponent.height;
            playerEntity.VelocityComponent.y = 0;
            playerEntity.PlayerComponent.isJumping = false;
            playerEntity.PlayerComponent.isGrounded = false;
          }
        }
      });
    });
  }
}