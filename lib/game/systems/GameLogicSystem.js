// lib/game/systems/GameLogicSystem.js
import { PlayerComponent, RenderComponent } from '../components';

export const GameLogicSystem = (entities, deltaTime) => {
  entities.forEach(entity => {
    if (entity.PlayerComponent && entity.RenderComponent && entity.VelocityComponent) {
      const player = entity.PlayerComponent;
      const velocity = entity.VelocityComponent;
      const render = entity.RenderComponent;

      // --- Jump Logic ---
      if (player.wantsToJump && (player.isGrounded || player.jumps < 2)) {
        velocity.y = -player.jumpStrength;
        player.isJumping = true;
        player.isGrounded = false; // Player is no longer grounded when jumping
        player.jumps++;
        player.wantsToJump = false; // Consume the jump intent
      }

      // Reset jumps when grounded
      if (player.isGrounded && player.jumps > 0) {
        player.jumps = 0;
        player.isJumping = false;
      }

      // --- Horizontal Movement Animation ---
      if (velocity.x < 0) {
        render.direction = 'left';
        render.animationState = 'run';
      } else if (velocity.x > 0) {
        render.direction = 'right';
        render.animationState = 'run';
      } else {
        render.animationState = 'idle';
      }

      // Override animation for jumping/falling
      if (!player.isGrounded && velocity.y !== 0) {
        render.animationState = 'jump'; // Or 'fall' if velocity.y > 0
      }

      // --- Action Logic (Attack, Climb, Push, Throw, Hurt) ---
      // This section needs more robust state management for actions,
      // potentially using a timer or state machine for each action.
      // For now, just setting flags based on intent.

      // Attack Logic
      if (player.wantsToAttack && player.attackTimer <= 0) {
        player.isAttacking = true;
        player.attackTimer = player.attackDuration;
        render.animationState = 'attack1';
        player.wantsToAttack = false; // Consume the intent
      }

      if (player.isAttacking) {
        player.attackTimer -= deltaTime;
        if (player.attackTimer <= 0) {
          player.isAttacking = false;
        }
      }

      // Climb Logic
      if (player.wantsToClimb && player.climbTimer <= 0) {
        player.isClimbing = true;
        player.climbTimer = player.climbDuration;
        render.animationState = 'climb';
        player.wantsToClimb = false; // Consume the intent
      }

      if (player.isClimbing) {
        player.climbTimer -= deltaTime;
        if (player.climbTimer <= 0) {
          player.isClimbing = false;
        }
      }

      // Push Logic
      if (player.wantsToPush && player.pushTimer <= 0) {
        player.isPushing = true;
        player.pushTimer = player.pushDuration;
        render.animationState = 'push';
        player.wantsToPush = false; // Consume the intent
      }

      if (player.isPushing) {
        player.pushTimer -= deltaTime;
        if (player.pushTimer <= 0) {
          player.isPushing = false;
        }
      }

      // Throw Logic
      if (player.wantsToThrow && player.throwTimer <= 0) {
        player.isThrowing = true;
        player.throwTimer = player.throwDuration;
        render.animationState = 'throw';
        player.wantsToThrow = false; // Consume the intent
      }

      if (player.isThrowing) {
        player.throwTimer -= deltaTime;
        if (player.throwTimer <= 0) {
          player.isThrowing = false;
        }
      }

      // Hurt State (from CollisionSystem)
      if (player.isHurt && player.hurtTimer <= 0) { // Only trigger hurt animation if not already in hurt state
        player.hurtTimer = player.hurtDuration;
        render.animationState = 'hurt';
      }

      if (player.hurtTimer > 0) {
        player.hurtTimer -= deltaTime;
        if (player.hurtTimer <= 0) {
          player.isHurt = false; // Reset hurt state after animation
        }
      }

      // Final animation state determination (priority based)
      // Final animation state determination (priority based)
      if (player.hurtTimer > 0) {
        render.animationState = 'hurt';
      } else if (player.isJumping || (!player.isGrounded && velocity.y !== 0)) {
        render.animationState = 'jump';
      } else if (player.attackTimer > 0) {
        render.animationState = 'attack1';
      } else if (player.climbTimer > 0) {
        render.animationState = 'climb';
      } else if (player.pushTimer > 0) {
        render.animationState = 'push';
      } else if (player.throwTimer > 0) {
        render.animationState = 'throw';
      } else if (velocity.x !== 0) {
        render.animationState = 'run';
      } else {
        render.animationState = 'idle';
      }
    }
  });
};