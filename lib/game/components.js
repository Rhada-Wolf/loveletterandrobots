// lib/game/components.js

export const PositionComponent = (x = 0, y = 0) => ({ x, y });
export const VelocityComponent = (x = 0, y = 0) => ({ x, y });
export const PhysicsComponent = (isAffectedByGravity = true) => ({ isAffectedByGravity });
export const RenderComponent = (sprite = '', frame = 0, animationState = 'idle', width = 32, height = 32, direction = 'right') => ({ sprite, frame, animationState, width, height, direction });
export const PlayerComponent = (jumpStrength = 10, moveSpeed = 5, isGrounded = false, isJumping = false, jumps = 0, isAttacking = false, isClimbing = false, isPushing = false, isThrowing = false, isHurt = false, wantsToJump = false, wantsToAttack = false, wantsToClimb = false, wantsToPush = false, wantsToThrow = false, attackTimer = 0, hurtTimer = 0, climbTimer = 0, pushTimer = 0, throwTimer = 0, attackDuration = 500, hurtDuration = 700, climbDuration = 500, pushDuration = 500, throwDuration = 500) => ({ jumpStrength, moveSpeed, isGrounded, isJumping, jumps, isAttacking, isClimbing, isPushing, isThrowing, isHurt, wantsToJump, wantsToAttack, wantsToClimb, wantsToPush, wantsToThrow, attackTimer, hurtTimer, climbTimer, pushTimer, throwTimer, attackDuration, hurtDuration, climbDuration, pushDuration, throwDuration });
export const InputComponent = (keysPressed = {}) => ({ keysPressed });
export const CollisionComponent = (isCollidable = true, width = 32, height = 32, type = 'solid') => ({ isCollidable, width, height, type });
export const LevelComponent = (data = [], tileSize = 32) => ({ data, tileSize });