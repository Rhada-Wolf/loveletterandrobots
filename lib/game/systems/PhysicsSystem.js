// lib/game/systems/PhysicsSystem.js
import { PositionComponent, VelocityComponent, PhysicsComponent, PlayerComponent } from '../components';

export const PhysicsSystem = (entities, gravity) => {
  entities.forEach(entity => {
    if (entity.PositionComponent && entity.VelocityComponent && entity.PhysicsComponent) {
      // Apply gravity to entities affected by it
      if (entity.PhysicsComponent.isAffectedByGravity) {
        entity.VelocityComponent.y += gravity;
      }

      // PhysicsSystem only applies gravity to vertical velocity.
      // Position updates will be handled by CollisionSystem.
    }
  });
};