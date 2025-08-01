// lib/game/systems/InputSystem.js
import { InputComponent, PlayerComponent, VelocityComponent, RenderComponent } from '../components';

export const InputSystem = (entities, keysPressed) => {
  entities.forEach(entity => {
    if (entity.InputComponent && entity.PlayerComponent && entity.VelocityComponent && entity.RenderComponent) {
      const player = entity.PlayerComponent;
      const velocity = entity.VelocityComponent;
      const render = entity.RenderComponent;

      // Horizontal movement intent
      if (keysPressed['ArrowLeft']) {
        velocity.x = -player.moveSpeed;
      } else if (keysPressed['ArrowRight']) {
        velocity.x = player.moveSpeed;
      } else {
        velocity.x = 0;
      }

      // Jump intent
      if (keysPressed['Space']) {
        player.wantsToJump = true;
      } else {
        player.wantsToJump = false;
      }

      // Attack intent (e.g., 'z' key)
      if (keysPressed['z']) {
        player.wantsToAttack = true;
      } else {
        player.wantsToAttack = false;
      }

      // Climb intent (e.g., 'c' key)
      if (keysPressed['c']) {
        player.wantsToClimb = true;
      } else {
        player.wantsToClimb = false;
      }

      // Push intent (e.g., 'x' key)
      if (keysPressed['x']) {
        player.wantsToPush = true;
      } else {
        player.wantsToPush = false;
      }

      // Throw intent (e.g., 'v' key)
      if (keysPressed['v']) {
        player.wantsToThrow = true;
      } else {
        player.wantsToThrow = false;
      }
    }
  });
};