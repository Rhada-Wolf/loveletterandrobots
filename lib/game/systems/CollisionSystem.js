// lib/game/systems/CollisionSystem.js
import { PositionComponent, VelocityComponent, CollisionComponent, PlayerComponent, RenderComponent } from '../components';

export const CollisionSystem = (entities, platforms, gameAreaWidth, gameAreaHeight, TILE_SIZE) => {
  entities.forEach(entity => {
    if (entity.PositionComponent && entity.VelocityComponent && entity.CollisionComponent) {
      let newPlayerX = entity.PositionComponent.x;
      let newPlayerY = entity.PositionComponent.y;
      let newPlayerVelocityX = entity.VelocityComponent.x;
      let newPlayerVelocityY = entity.VelocityComponent.y;
      let newPlayerIsGrounded = false;

      const playerWidth = entity.RenderComponent ? entity.RenderComponent.width : 0;
      const playerHeight = entity.RenderComponent ? entity.RenderComponent.height : 0;

      // --- Horizontal Movement and Collision ---
      newPlayerX += newPlayerVelocityX; // Apply horizontal velocity

      platforms.forEach(platform => {
        if (platform.isSolid &&
            // Check for vertical overlap
            entity.PositionComponent.y < platform.y + platform.height &&
            entity.PositionComponent.y + playerHeight > platform.y) {
          // Colliding from left
          if (entity.PositionComponent.x + playerWidth <= platform.x && newPlayerX + playerWidth > platform.x) {
            newPlayerX = platform.x - playerWidth;
            newPlayerVelocityX = 0;
          }
          // Colliding from right
          else if (entity.PositionComponent.x >= platform.x + platform.width && newPlayerX < platform.x + platform.width) {
            newPlayerX = platform.x + platform.width;
            newPlayerVelocityX = 0;
          }
        }
      });

      // --- Vertical Movement and Collision ---
      newPlayerY += newPlayerVelocityY; // Apply vertical velocity

      platforms.forEach(platform => {
        // Check for collision with the top of the platform (solid or one-way)
        // This logic attempts to prevent tunneling by checking if the player crossed the platform's top boundary
        if ((platform.isSolid || (platform.isOneWay && newPlayerVelocityY >= 0)) &&
          newPlayerX < platform.x + platform.width &&
          newPlayerX + playerWidth > platform.x &&
          // Player's bottom was above platform's top in the previous step AND Player's bottom is now overlapping or below platform top
          (entity.PositionComponent.y - newPlayerVelocityY + playerHeight <= platform.y) &&
          (newPlayerY + playerHeight >= platform.y)
        ) {
          newPlayerY = platform.y - playerHeight;
          newPlayerVelocityY = 0;
          newPlayerIsGrounded = true;
          if (entity.PlayerComponent) {
            entity.PlayerComponent.isJumping = false;
            entity.PlayerComponent.jumps = 0;
            entity.RenderComponent.animationState = 'idle';
          }
        }
        // Check for collision with the bottom of a solid platform (hitting head)
        else if (platform.isSolid &&
          newPlayerX < platform.x + platform.width &&
          newPlayerX + playerWidth > platform.x &&
          entity.PositionComponent.y >= platform.y + platform.height && // Player was below platform
          newPlayerY <= platform.y + platform.height // Player is now at or above platform bottom
        ) {
          newPlayerY = platform.y + platform.height;
          newPlayerVelocityY = 0; // Stop upward movement
          if (entity.PlayerComponent) {
            entity.PlayerComponent.isJumping = false;
            entity.RenderComponent.animationState = 'idle';
          }
        }
      });

      // --- Damaging Tiles Check (after all position adjustments) ---
      platforms.forEach(platform => {
        if (platform.isDamaging &&
          newPlayerX < platform.x + platform.width &&
          newPlayerX + playerWidth > platform.x &&
          newPlayerY < platform.y + platform.height &&
          newPlayerY + playerHeight > platform.y
        ) {
          console.log('Player hit a damaging tile!');
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
      });

      // Keep player within game area bounds (bottom and top)
      if (newPlayerY + playerHeight > gameAreaHeight) {
        newPlayerY = gameAreaHeight - playerHeight;
        newPlayerVelocityY = 0;
        newPlayerIsGrounded = true;
        if (entity.PlayerComponent) {
          entity.PlayerComponent.isJumping = false;
          entity.PlayerComponent.jumps = 0;
          entity.RenderComponent.animationState = 'idle';
        }
      }
      if (newPlayerY < 0) {
        newPlayerY = 0;
        newPlayerVelocityY = 0;
      }

      entity.PositionComponent.x = newPlayerX;
      entity.PositionComponent.y = newPlayerY;
      entity.VelocityComponent.x = newPlayerVelocityX;
      entity.VelocityComponent.y = newPlayerVelocityY;

      // Re-evaluate isGrounded after all position updates
      newPlayerIsGrounded = false; // Reset for re-evaluation
      platforms.forEach(platform => {
        if (platform.isSolid &&
            newPlayerX < platform.x + platform.width &&
            newPlayerX + playerWidth > platform.x &&
            newPlayerY + playerHeight >= platform.y &&
            newPlayerY + playerHeight <= platform.y + 5 // A small tolerance for "on ground"
        ) {
          newPlayerIsGrounded = true;
        }
      });

      if (entity.PlayerComponent) {
        entity.PlayerComponent.isGrounded = newPlayerIsGrounded;
        // Reset jumps only if newly grounded
        if (newPlayerIsGrounded && !entity.PlayerComponent.isGrounded) {
          entity.PlayerComponent.jumps = 0;
        }
      }
    }
  });
};