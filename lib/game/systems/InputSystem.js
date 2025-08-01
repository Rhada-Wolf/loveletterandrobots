// lib/game/systems/InputSystem.js
import { InputComponent, PlayerComponent, VelocityComponent, RenderComponent } from '../components';

export const InputSystem = (entities, keysPressed) => {
  entities.forEach(entity => {
    if (entity.InputComponent && entity.PlayerComponent && entity.VelocityComponent && entity.RenderComponent) {
      const player = entity.PlayerComponent;
      const velocity = entity.VelocityComponent;
      const render = entity.RenderComponent;

      // Horizontal movement
      if (keysPressed['ArrowLeft']) {
        velocity.x = -player.moveSpeed;
        render.direction = 'left';
        render.animationState = 'run';
      } else if (keysPressed['ArrowRight']) {
        velocity.x = player.moveSpeed;
        render.direction = 'right';
        render.animationState = 'run';
      } else {
        velocity.x = 0;
        render.animationState = 'idle';
      }

      // Jump
      if (keysPressed['Space'] && (player.isGrounded || player.jumps < 2)) {
        velocity.y = -player.jumpStrength;
        player.isJumping = true;
        player.jumps++;
        render.animationState = 'jump';
      }

      // Attack (e.g., 'z' key)
      if (keysPressed['z'] && !player.isAttacking) {
        player.isAttacking = true;
        render.animationState = 'attack1';
        setTimeout(() => {
          player.isAttacking = false;
          render.animationState = 'idle';
        }, 400); // Match attack1Animation duration
      }

      // Climb (e.g., 'c' key)
      if (keysPressed['c']) {
        player.isClimbing = true;
        render.animationState = 'climb';
      } else if (player.isClimbing) {
        player.isClimbing = false;
        render.animationState = 'idle';
      }

      // Push (e.g., 'x' key)
      if (keysPressed['x']) {
        player.isPushing = true;
        render.animationState = 'push';
      } else if (player.isPushing) {
        player.isPushing = false;
        render.animationState = 'idle';
      }

      // Throw (e.g., 'v' key)
      if (keysPressed['v'] && !player.isThrowing) {
        player.isThrowing = true;
        render.animationState = 'throw';
        setTimeout(() => {
          player.isThrowing = false;
          render.animationState = 'idle';
        }, 400); // Match throwAnimation duration
      }
    }
  });
};