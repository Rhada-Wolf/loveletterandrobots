// lib/game/systems/PhysicsSystem.js
import { PositionComponent, VelocityComponent, PhysicsComponent } from '../components';

export const PhysicsSystem = (entities, gravity) => {
  entities.forEach(entity => {
    if (entity.PositionComponent && entity.VelocityComponent && entity.PhysicsComponent) {
      // Apply gravity
      entity.VelocityComponent.y += gravity;

      // PhysicsSystem only applies gravity to vertical velocity.
      // Position updates will be handled by CollisionSystem.
    }
  });
};