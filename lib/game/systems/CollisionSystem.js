// lib/game/systems/CollisionSystem.js
import { PositionComponent, VelocityComponent, CollisionComponent, PlayerComponent, RenderComponent } from '../components';
import { TILE_SIZE } from '../constants'; // Ensure TILE_SIZE is imported

export const CollisionSystem = (entities, levelGrid, gameAreaWidth, gameAreaHeight, TILE_SIZE) => {
  entities.forEach(entity => {
    if (entity.PositionComponent && entity.VelocityComponent && entity.CollisionComponent) {
      let newPlayerX = entity.PositionComponent.x;
      let newPlayerY = entity.PositionComponent.y;
      let newPlayerVelocityX = entity.VelocityComponent.x;
      let newPlayerVelocityY = entity.VelocityComponent.y;
      let newPlayerIsGrounded = false;

      const playerWidth = entity.RenderComponent ? entity.RenderComponent.width : 0;
      const playerHeight = entity.RenderComponent ? entity.RenderComponent.height : 0;
      const oldIsGrounded = entity.PlayerComponent ? entity.PlayerComponent.isGrounded : false;

      // Helper to get tile properties from grid
      const getTileProperties = (x, y) => {
        const col = Math.floor(x / TILE_SIZE);
        const row = Math.floor(y / TILE_SIZE);

        if (row >= 0 && row < levelGrid.length && col >= 0 && col < levelGrid[0].length) {
          const cell = levelGrid[row][col];
          return {
            x: col * TILE_SIZE,
            y: row * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            isSolid: ['G', 'R', 'W'].includes(cell),
            isOneWay: cell === 'O',
            isDamaging: cell === 'L',
            type: cell,
          };
        }
        return null;
      };

      // --- Horizontal Movement and Collision ---
      newPlayerX += newPlayerVelocityX;

      // Check for horizontal collisions with tiles
      const playerLeft = newPlayerX;
      const playerRight = newPlayerX + playerWidth;
      const playerTop = newPlayerY;
      const playerBottom = newPlayerY + playerHeight;

      // Determine affected tiles horizontally
      const startCol = Math.floor(playerLeft / TILE_SIZE);
      const endCol = Math.floor(playerRight / TILE_SIZE);
      const startRow = Math.floor(playerTop / TILE_SIZE);
      const endRow = Math.floor(playerBottom / TILE_SIZE);

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const tile = getTileProperties(col * TILE_SIZE, row * TILE_SIZE);
          if (tile && tile.isSolid) {
            // Check for horizontal overlap
            if (playerTop < tile.y + tile.height && playerBottom > tile.y) {
              // Colliding from left
              if (entity.PositionComponent.x + playerWidth <= tile.x && newPlayerX + playerWidth > tile.x) {
                newPlayerX = tile.x - playerWidth;
                newPlayerVelocityX = 0;
              }
              // Colliding from right
              else if (entity.PositionComponent.x >= tile.x + tile.width && newPlayerX < tile.x + tile.width) {
                newPlayerX = tile.x + tile.width;
                newPlayerVelocityX = 0;
              }
            }
          }
        }
      }

      // --- Vertical Movement and Collision ---
      newPlayerY += newPlayerVelocityY;

      // Re-calculate player bounds after horizontal adjustments
      const adjustedPlayerLeft = newPlayerX;
      const adjustedPlayerRight = newPlayerX + playerWidth;
      const adjustedPlayerTop = newPlayerY;
      const adjustedPlayerBottom = newPlayerY + playerHeight;

      // Determine affected tiles vertically
      const vStartCol = Math.floor(adjustedPlayerLeft / TILE_SIZE);
      const vEndCol = Math.floor(adjustedPlayerRight / TILE_SIZE);
      const vStartRow = Math.floor(adjustedPlayerTop / TILE_SIZE);
      const vEndRow = Math.floor(adjustedPlayerBottom / TILE_SIZE);

      for (let row = vStartRow; row <= vEndRow; row++) {
        for (let col = vStartCol; col <= vEndCol; col++) {
          const tile = getTileProperties(col * TILE_SIZE, row * TILE_SIZE);
          if (tile && (tile.isSolid || (tile.isOneWay && newPlayerVelocityY > 0))) { // Only consider one-way if moving down
            // Check for vertical overlap
            if (adjustedPlayerLeft < tile.x + tile.width && adjustedPlayerRight > tile.x) {
              // Colliding from top (landing on platform)
              if (entity.PositionComponent.y + playerHeight <= tile.y && adjustedPlayerBottom >= tile.y) {
                newPlayerY = tile.y - playerHeight; // Snap precisely to top, remove epsilon
                newPlayerVelocityY = 0;
                newPlayerIsGrounded = true;
                // GameLogicSystem now handles resetting jumps and isJumping
              }
              // Colliding from bottom (hitting head)
              else if (entity.PositionComponent.y >= tile.y + tile.height && adjustedPlayerTop < tile.y + tile.height) {
                newPlayerY = tile.y + tile.height;
                newPlayerVelocityY = 0;
                // GameLogicSystem now handles resetting isJumping
              }
            }
          }
        }
      }

      // --- Damaging Tiles Check (after all position adjustments) ---
      // Re-calculate player bounds after all adjustments
      const finalPlayerLeft = newPlayerX;
      const finalPlayerRight = newPlayerX + playerWidth;
      const finalPlayerTop = newPlayerY;
      const finalPlayerBottom = newPlayerY + playerHeight;

      const dStartCol = Math.floor(finalPlayerLeft / TILE_SIZE);
      const dEndCol = Math.floor(finalPlayerRight / TILE_SIZE);
      const dStartRow = Math.floor(finalPlayerTop / TILE_SIZE);
      const dEndRow = Math.floor(finalPlayerBottom / TILE_SIZE);

      for (let row = dStartRow; row <= dEndRow; row++) {
        for (let col = dStartCol; col <= dEndCol; col++) {
          const tile = getTileProperties(col * TILE_SIZE, row * TILE_SIZE);
          if (tile && tile.isDamaging) {
            // console.log('Player hit a damaging tile!'); // Removed to prevent log flooding
            // Implement damage logic here, e.g., reset player position or reduce health
            newPlayerX = entity.PositionComponent.x; // Revert position
            newPlayerY = entity.PositionComponent.y; // Revert position
            newPlayerVelocityY = 0;
            if (entity.PlayerComponent) {
              entity.PlayerComponent.isHurt = true; // Set isHurt flag
              entity.RenderComponent.animationState = 'hurt'; // Set hurt animation
              // Reset hurt state after animation duration (handled by GameLogicSystem)
            }
          }
        }
      }

      // Keep player within game area bounds (all four sides)
      if (newPlayerX < 0) {
        newPlayerX = 0;
        newPlayerVelocityX = 0;
      }
      if (newPlayerX + playerWidth > gameAreaWidth) {
        newPlayerX = gameAreaWidth - playerWidth;
        newPlayerVelocityX = 0;
      }
      if (newPlayerY < 0) {
        newPlayerY = 0;
        newPlayerVelocityY = 0;
      }
      if (newPlayerY + playerHeight > gameAreaHeight) {
        newPlayerY = gameAreaHeight - playerHeight;
        newPlayerVelocityY = 0;
        newPlayerIsGrounded = true;
        // GameLogicSystem now handles resetting jumps and isJumping
      }

      entity.PositionComponent.x = newPlayerX;
      entity.PositionComponent.y = newPlayerY;
      entity.VelocityComponent.x = newPlayerVelocityX;
      entity.VelocityComponent.y = newPlayerVelocityY;

      // Re-evaluate isGrounded after all position updates
      newPlayerIsGrounded = false; // Reset for re-evaluation
      // Check tiles below the player for grounding
      const groundCheckY = newPlayerY + playerHeight;
      const groundCheckRow = Math.floor(groundCheckY / TILE_SIZE);
      const groundCheckStartCol = Math.floor(newPlayerX / TILE_SIZE);
      const groundCheckEndCol = Math.floor((newPlayerX + playerWidth - 1) / TILE_SIZE); // Revert to original logic

      for (let col = groundCheckStartCol; col <= groundCheckEndCol; col++) {
        const tile = getTileProperties(col * TILE_SIZE, groundCheckRow * TILE_SIZE);
        if (tile && tile.isSolid &&
            groundCheckY >= tile.y &&
            groundCheckY <= tile.y + 10 // Increased tolerance for "on ground"
        ) {
          newPlayerIsGrounded = true;
          break; // Found a solid tile below, no need to check further
        }
      }

      if (entity.PlayerComponent) {
        entity.PlayerComponent.isGrounded = newPlayerIsGrounded;
        // GameLogicSystem now handles resetting jumps based on isGrounded
      }
    }
  });
};