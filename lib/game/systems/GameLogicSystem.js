// lib/game/systems/GameLogicSystem.js
import { PlayerComponent, RenderComponent } from '../components';

export const GameLogicSystem = (entities) => {
  entities.forEach(entity => {
    if (entity.PlayerComponent && entity.RenderComponent) {
      // Example: If player is hurt, ensure hurt animation plays and then reverts
      if (entity.PlayerComponent.isHurt && entity.RenderComponent.animationState !== 'hurt') {
        entity.RenderComponent.animationState = 'hurt';
        setTimeout(() => {
          entity.PlayerComponent.isHurt = false;
          entity.RenderComponent.animationState = 'idle';
        }, 400); // Match hurtAnimation duration
      }

      // Ensure animation state is consistent with player actions
      if (!entity.PlayerComponent.isJumping && !entity.PlayerComponent.isAttacking && !entity.PlayerComponent.isClimbing && !entity.PlayerComponent.isPushing && !entity.PlayerComponent.isThrowing && !entity.PlayerComponent.isHurt) {
        if (entity.VelocityComponent.x === 0 && entity.RenderComponent.animationState !== 'idle') {
          entity.RenderComponent.animationState = 'idle';
        } else if (entity.VelocityComponent.x !== 0 && entity.RenderComponent.animationState !== 'run') {
          entity.RenderComponent.animationState = 'run';
        }
      }
    }
  });
};