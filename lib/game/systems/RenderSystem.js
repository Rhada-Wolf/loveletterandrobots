// lib/game/systems/RenderSystem.js
import { PositionComponent, RenderComponent } from '../components';

export const RenderSystem = (entities, styles) => {
  return entities.filter(entity => entity.PositionComponent && entity.RenderComponent).map(entity => {
    const { x, y } = entity.PositionComponent;
    const { width, height, direction, animationState } = entity.RenderComponent;

    return {
      id: entity.id,
      x,
      y,
      width,
      height,
      direction,
      animationState,
    };
  });
};