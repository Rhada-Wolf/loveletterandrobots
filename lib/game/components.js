// lib/game/components.js

export const PositionComponent = (x = 0, y = 0) => ({ x, y });
export const VelocityComponent = (x = 0, y = 0) => ({ x, y });
export const PhysicsComponent = (isAffectedByGravity = true) => ({ isAffectedByGravity });
export const RenderComponent = (sprite = '', frame = 0, animationState = 'idle', width = 32, height = 32, direction = 'right') => ({ sprite, frame, animationState, width, height, direction });
export const PlayerComponent = (jumpStrength = 10, moveSpeed = 5, isGrounded = false, isJumping = false, jumps = 0, isAttacking = false, isClimbing = false, isPushing = false, isThrowing = false, isHurt = false) => ({ jumpStrength, moveSpeed, isGrounded, isJumping, jumps, isAttacking, isClimbing, isPushing, isThrowing, isHurt });
export const InputComponent = (keysPressed = {}) => ({ keysPressed });
export const CollisionComponent = (isCollidable = true, width = 32, height = 32, type = 'solid') => ({ isCollidable, width, height, type });
export const LevelComponent = (data = [], tileSize = 32) => ({ data, tileSize });