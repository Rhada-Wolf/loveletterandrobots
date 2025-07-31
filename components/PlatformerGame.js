import React, { useRef, useEffect, useState, useCallback } from 'react';
import styles from '../styles/platformer.module.css';

const GRAVITY = 0.5;
const JUMP_STRENGTH = 10;
const MOVE_SPEED = 5;

const PlatformerGame = () => {
  const gameAreaRef = useRef(null);
  const playerRef = useRef(null);
  const [playerState, setPlayerState] = useState({
    x: 50,
    y: 0,
    velocityY: 0,
    isJumping: false,
    isGrounded: false,
    direction: 'right', // 'left' or 'right'
    animationFrame: 0,
  });

  const platforms = [
    { x: 0, y: 550, width: 800, height: 50 }, // Ground
    { x: 150, y: 400, width: 200, height: 20 },
    { x: 400, y: 300, width: 150, height: 20 },
  ];

  const updateGame = useCallback(() => {
    setPlayerState(prev => {
      let newY = prev.y + prev.velocityY;
      let newVelocityY = prev.velocityY + GRAVITY;
      let newIsGrounded = false;

      // Collision detection with platforms
      platforms.forEach(platform => {
        if (
          prev.x < platform.x + platform.width &&
          prev.x + 50 > platform.x && // Player width
          newY + 50 > platform.y && // Player height
          newY < platform.y + platform.height
        ) {
          // If falling and hit top of platform
          if (prev.velocityY > 0 && prev.y + 50 <= platform.y) {
            newY = platform.y - 50; // Snap to top of platform
            newVelocityY = 0;
            newIsGrounded = true;
            prev.isJumping = false; // Reset jumping state
          }
        }
      });

      // Keep player within game area bounds (bottom)
      if (newY + 50 > 600) { // Game area height is 600
        newY = 550; // Snap to ground
        newVelocityY = 0;
        newIsGrounded = true;
        prev.isJumping = false;
      }

      return {
        ...prev,
        y: newY,
        velocityY: newVelocityY,
        isGrounded: newIsGrounded,
      };
    });
  }, [platforms]);

  const handleKeyDown = useCallback((e) => {
    setPlayerState(prev => {
      let newX = prev.x;
      let newVelocityY = prev.velocityY;
      let newIsJumping = prev.isJumping;
      let newDirection = prev.direction;
      let newAnimationFrame = prev.animationFrame;

      switch (e.key) {
        case 'ArrowLeft':
          newX = Math.max(0, prev.x - MOVE_SPEED);
          newDirection = 'left';
          newAnimationFrame = (prev.animationFrame + 1) % 4; // Assuming 4 frames for running
          break;
        case 'ArrowRight':
          newX = Math.min(750, prev.x + MOVE_SPEED); // Game area width - player width
          newDirection = 'right';
          newAnimationFrame = (prev.animationFrame + 1) % 4; // Assuming 4 frames for running
          break;
        case 'ArrowUp':
          if (prev.isGrounded && !prev.isJumping) {
            newVelocityY = -JUMP_STRENGTH;
            newIsJumping = true;
            newAnimationFrame = 0; // Reset animation frame on jump
          }
          break;
        default:
          newAnimationFrame = 0; // Idle frame
          break;
      }
      return { ...prev, x: newX, velocityY: newVelocityY, isJumping: newIsJumping, direction: newDirection, animationFrame: newAnimationFrame };
    });
  }, []);

  useEffect(() => {
    const gameLoop = setInterval(updateGame, 1000 / 60); // 60 FPS
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(gameLoop);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [updateGame, handleKeyDown]);

  return (
    <div ref={gameAreaRef} className={styles.gameArea}>
      <div
        ref={playerRef}
        className={`${styles.player} ${styles[playerState.direction]}`}
        style={{
          transform: `translate(${playerState.x}px, ${playerState.y}px)`,
          backgroundPosition: `-${playerState.animationFrame * 50}px 0`, // Assuming 50px wide frames
        }}
      ></div>
      {platforms.map((platform, index) => (
        <div
          key={index}
          className={styles.platform}
          style={{
            left: platform.x,
            top: platform.y,
            width: platform.width,
            height: platform.height,
          }}
        ></div>
      ))}
    </div>
  );
};

export default PlatformerGame;