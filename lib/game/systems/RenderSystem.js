// lib/game/systems/RenderSystem.js
import { PositionComponent, RenderComponent } from '../components';

export const RenderSystem = (entities, playerPosition, levelWidth, levelHeight, viewportWidth, viewportHeight) => {
  const CAMERA_DEAD_ZONE_X = viewportWidth / 4; // Example: 1/4 of the screen width
  const CAMERA_DEAD_ZONE_Y = viewportHeight / 4; // Example: 1/4 of the screen height

  let cameraX = playerPosition.x - viewportWidth / 2;
  let cameraY = playerPosition.y - viewportHeight / 2;

  // Apply dead zone
  if (playerPosition.x < cameraX + CAMERA_DEAD_ZONE_X) {
    cameraX = playerPosition.x - CAMERA_DEAD_ZONE_X;
  } else if (playerPosition.x > cameraX + viewportWidth - CAMERA_DEAD_ZONE_X) {
    cameraX = playerPosition.x - (viewportWidth - CAMERA_DEAD_ZONE_X);
  }

  if (playerPosition.y < cameraY + CAMERA_DEAD_ZONE_Y) {
    cameraY = playerPosition.y - CAMERA_DEAD_ZONE_Y;
  } else if (playerPosition.y > cameraY + viewportHeight - CAMERA_DEAD_ZONE_Y) {
    cameraY = playerPosition.y - (viewportHeight - CAMERA_DEAD_ZONE_Y);
  }

  // Clamp camera to level boundaries
  cameraX = Math.max(0, Math.min(cameraX, levelWidth - viewportWidth));
  cameraY = Math.max(0, Math.min(cameraY, levelHeight - viewportHeight));

  return entities.filter(entity => entity.PositionComponent && entity.RenderComponent).map(entity => {
    const { x, y } = entity.PositionComponent;
    const { width, height, direction, animationState } = entity.RenderComponent;

    return {
      id: entity.id,
      x: x - cameraX, // Adjust x by camera offset
      y: y - cameraY, // Adjust y by camera offset
      width,
      height,
      direction,
      animationState,
    };
  });
};