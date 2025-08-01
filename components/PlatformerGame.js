import React, { useRef, useEffect, useState, useCallback } from 'react';
import styles from '../styles/platformer.module.css';
import DebugPanel from './DebugPanel';

const PlatformerGame = () => {
  const [gravity, setGravity] = useState(0.5);
  const [jumpStrength, setJumpStrength] = useState(10);
  const [moveSpeed, setMoveSpeed] = useState(5);
  const [playerWidth, setPlayerWidth] = useState(50);
  const [playerHeight, setPlayerHeight] = useState(50);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const gameAreaRef = useRef(null);
  const playerRef = useRef(null);
  const keysPressed = useRef({}); // To track currently pressed keys

  const [playerState, setPlayerState] = useState({
    x: 50,
    y: 500, // Start player on the ground
    velocityY: 0,
    isJumping: false,
    isGrounded: false,
    direction: 'right', // 'left' or 'right'
    width: 50, // Initial player width
    height: 50, // Initial player height
  });

  // Update player dimensions when playerWidth or playerHeight change from debug panel
  useEffect(() => {
    setPlayerState(prev => ({
      ...prev,
      width: playerWidth,
      height: playerHeight,
    }));
  }, [playerWidth, playerHeight]);

  const platforms = [
    { x: 0, y: 550, width: 800, height: 50 }, // Ground
    { x: 150, y: 400, width: 200, height: 20 },
    { x: 400, y: 300, width: 150, height: 20 },
  ];

  const updateGame = useCallback(() => {
    setPlayerState(prevPlayer => {
      let newPlayerX = prevPlayer.x;
      let newPlayerY = prevPlayer.y + prevPlayer.velocityY;
      let newPlayerVelocityY = prevPlayer.velocityY + gravity;
      let newPlayerIsGrounded = false;
      let newDirection = prevPlayer.direction;

      // Handle horizontal movement based on keysPressed
      if (keysPressed.current['ArrowLeft']) {
        newPlayerX = Math.max(0, prevPlayer.x - moveSpeed);
        newDirection = 'left';
      }
      if (keysPressed.current['ArrowRight']) {
        newPlayerX = Math.min(800 - prevPlayer.width, prevPlayer.x + moveSpeed);
        newDirection = 'right';
      }

      // Player collision detection with platforms
      platforms.forEach(platform => {
        if (
          newPlayerX < platform.x + platform.width &&
          newPlayerX + prevPlayer.width > platform.x &&
          newPlayerY + prevPlayer.height > platform.y &&
          newPlayerY < platform.y + platform.height
        ) {
          if (prevPlayer.velocityY > 0 && prevPlayer.y + prevPlayer.height <= platform.y) {
            newPlayerY = platform.y - prevPlayer.height;
            newPlayerVelocityY = 0;
            newPlayerIsGrounded = true;
            // Only set isJumping to false if landing on a platform
            if (prevPlayer.isJumping) {
              setPlayerState(p => ({ ...p, isJumping: false }));
            }
          }
        }
      });

      // Keep player within game area bounds (bottom)
      if (newPlayerY + prevPlayer.height > 600) {
        newPlayerY = 600 - prevPlayer.height;
        newPlayerVelocityY = 0;
        newPlayerIsGrounded = true;
        // Only set isJumping to false if landing on the ground
        if (prevPlayer.isJumping) {
          setPlayerState(p => ({ ...p, isJumping: false }));
        }
      }

      // Handle jump
      if (keysPressed.current['ArrowUp'] && newPlayerIsGrounded && !prevPlayer.isJumping) {
        newPlayerVelocityY = -jumpStrength;
        setPlayerState(p => ({ ...p, isJumping: true }));
      }

      return {
        ...prevPlayer,
        x: newPlayerX,
        y: newPlayerY,
        velocityY: newPlayerVelocityY,
        isGrounded: newPlayerIsGrounded,
        direction: newDirection,
      };
    });
  }, [platforms, gravity, moveSpeed, jumpStrength]); // Added moveSpeed and jumpStrength to dependencies

  useEffect(() => {
    let animationFrameId;

    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };

    const loop = () => {
      updateGame();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [updateGame]); // Only updateGame is needed here, as other dependencies are in updateGame itself


  return (
    <div ref={gameAreaRef} className={styles.gameArea}>
      <div
        ref={playerRef}
        className={`${styles.player} ${styles[playerState.direction]}`}
        style={{
          transform: `translate(${playerState.x}px, ${playerState.y}px)`,
          width: playerState.width,
          height: playerState.height,
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

      <button className={styles.debugButton} onClick={() => setShowDebugPanel(!showDebugPanel)}>
        Debug
      </button>

      {showDebugPanel && (
        <DebugPanel
          gravity={gravity}
          setGravity={setGravity}
          jumpStrength={jumpStrength}
          setJumpStrength={setJumpStrength}
          moveSpeed={moveSpeed}
          setMoveSpeed={setMoveSpeed}
          playerWidth={playerWidth}
          setPlayerWidth={setPlayerWidth}
          playerHeight={playerHeight}
          setPlayerHeight={setPlayerHeight}
          onClose={() => setShowDebugPanel(false)}
        />
      )}
    </div>
  );
};

export default PlatformerGame;