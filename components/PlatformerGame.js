import React, { useRef, useEffect, useState, useCallback } from 'react';
import styles from '../styles/platformer.module.css';
import DebugPanel from './DebugPanel';

const TILE_SIZE = 32; // Must match the LevelEditor's TILE_SIZE

const PlatformerGame = () => {
  const [gravity, setGravity] = useState(0.5);
  const [jumpStrength, setJumpStrength] = useState(13);
  const [moveSpeed, setMoveSpeed] = useState(5);
  const [playerWidth, setPlayerWidth] = useState(50);
  const [playerHeight, setPlayerHeight] = useState(50);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [levelData, setLevelData] = useState([]);
  const [platforms, setPlatforms] = useState([]);

  const gameAreaRef = useRef(null);
  const playerRef = useRef(null);
  const keysPressed = useRef({}); // To track currently pressed keys

  const [playerState, setPlayerState] = useState({
    x: 0, // Will be set dynamically
    y: 0, // Will be set dynamically
    velocityY: 0,
    isJumping: false,
    isGrounded: false,
    jumps: 0, // Track number of jumps
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

  const parseLevelData = useCallback((data) => {
    const lines = data.split('\n').filter(line => line.trim() !== '');
    const newPlatforms = [];
    let playerStartX = 0;
    let playerStartY = 0;
    let solidTiles = [];

    const targetRows = 20;
    const targetCols = 30;

    // Create a padded grid
    const paddedGrid = Array(targetRows).fill(null).map(() => Array(targetCols).fill(' '));

    const startRow = Math.floor((targetRows - lines.length) / 2);
    const startCol = Math.floor((targetCols - (lines[0] ? lines[0].length : 0)) / 2);

    lines.forEach((row, rowIndex) => {
      row.split('').forEach((cell, colIndex) => {
        const gridRow = startRow + rowIndex;
        const gridCol = startCol + colIndex;
        if (gridRow >= 0 && gridRow < targetRows && gridCol >= 0 && gridCol < targetCols) {
          if (cell === 'S' && lines[rowIndex][colIndex + 1] === 't') { // Check for 'St'
            paddedGrid[gridRow][gridCol] = 'St';
          } else if (cell !== 't' || (colIndex > 0 && lines[rowIndex][colIndex - 1] !== 'S')) { // Avoid processing 't' from 'St'
            paddedGrid[gridRow][gridCol] = cell;
          }
        }
      });
    });

    paddedGrid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell === 'G' || cell === 'R' || cell === 'W' || cell === 'O' || cell === 'L') {
          const tileProperties = {
            x: colIndex * TILE_SIZE,
            y: rowIndex * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            type: cell,
            isSolid: ['G', 'R', 'W'].includes(cell),
            isOneWay: cell === 'O',
            isDamaging: cell === 'L',
            friction: 1, // Default friction
            restitution: 0, // Default restitution (bounciness)
          };
          newPlatforms.push(tileProperties);
          if (tileProperties.isSolid || tileProperties.isOneWay) { // Consider one-way platforms as solid for initial player placement
            solidTiles.push({ x: colIndex, y: rowIndex });
          }
        } else if (cell === 'St') {
          playerStartX = colIndex * TILE_SIZE + (TILE_SIZE / 2) - (playerWidth / 2);
          playerStartY = rowIndex * TILE_SIZE - playerHeight;
        }
      });
    });

    setPlatforms(newPlatforms);
    setLevelData(paddedGrid.map(row => row.join(''))); // Store the padded grid

    // Find a suitable starting position for the player
    // If no 'St' tile is found, default to a safe spot
    if (playerStartX === 0 && playerStartY === 0) {
      if (solidTiles.length > 0) {
        const lowestSolidTile = solidTiles.reduce((prev, current) => (prev.y > current.y ? prev : current));
        playerStartX = lowestSolidTile.x * TILE_SIZE + (TILE_SIZE / 2) - (playerWidth / 2);
        playerStartY = lowestSolidTile.y * TILE_SIZE - playerHeight;
      } else {
        playerStartX = (targetCols * TILE_SIZE / 2) - (playerWidth / 2);
        playerStartY = (targetRows * TILE_SIZE) - playerHeight - TILE_SIZE;
      }
    }

    setPlayerState(prev => ({
      ...prev,
      x: playerStartX,
      y: playerStartY,
      velocityY: 0,
      isJumping: false,
      isGrounded: false,
    }));
  }, [playerWidth, playerHeight]);

  useEffect(() => {
    const loadBaseLevel = async () => {
      try {
        const response = await fetch('/levels/level_base.txt');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const levelText = await response.text();
        parseLevelData(levelText);
      } catch (error) {
        console.error("Failed to load base level:", error);
        // Fallback to an empty grid if loading fails
        parseLevelData(Array(20).fill(' '.repeat(30)).join('\n'));
      }
    };

    if (levelData.length === 0) {
      loadBaseLevel();
    }
  }, [levelData, parseLevelData]);

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
        const gameAreaWidth = levelData[0] ? levelData[0].length * TILE_SIZE : 800;
        newPlayerX = Math.min(gameAreaWidth - prevPlayer.width, prevPlayer.x + moveSpeed);
        newDirection = 'right';
      }

      // Player collision detection with platforms
      platforms.forEach(platform => {
        // Check for collision with the top of the platform (solid or one-way)
        if ((platform.isSolid || (platform.isOneWay && prevPlayer.velocityY >= 0)) &&
          newPlayerX < platform.x + platform.width &&
          newPlayerX + prevPlayer.width > platform.x &&
          prevPlayer.y + prevPlayer.height <= platform.y && // Player was above platform
          newPlayerY + prevPlayer.height >= platform.y // Player is now at or below platform top
        ) {
          newPlayerY = platform.y - prevPlayer.height;
          newPlayerVelocityY = 0;
          newPlayerIsGrounded = true;
          setPlayerState(p => ({ ...p, isJumping: false, jumps: 0 })); // Reset jumps on landing
        }
        // Check for collision with the bottom of a solid platform (hitting head)
        else if (platform.isSolid &&
          newPlayerX < platform.x + platform.width &&
          newPlayerX + prevPlayer.width > platform.x &&
          prevPlayer.y >= platform.y + platform.height && // Player was below platform
          newPlayerY <= platform.y + platform.height // Player is now at or above platform bottom
        ) {
          newPlayerY = platform.y + platform.height;
          newPlayerVelocityY = 0; // Stop upward movement
        }
        // Check for horizontal collision with a solid platform
        else if (platform.isSolid &&
          newPlayerY < platform.y + platform.height &&
          newPlayerY + prevPlayer.height > platform.y
        ) {
          // Colliding from left
          if (prevPlayer.x + prevPlayer.width <= platform.x && newPlayerX + prevPlayer.width > platform.x) {
            newPlayerX = platform.x - prevPlayer.width;
          }
          // Colliding from right
          else if (prevPlayer.x >= platform.x + platform.width && newPlayerX < platform.x + platform.width) {
            newPlayerX = platform.x + platform.width;
          }
        }

        // Check for damaging tiles
        if (platform.isDamaging &&
          newPlayerX < platform.x + platform.width &&
          newPlayerX + prevPlayer.width > platform.x &&
          newPlayerY < platform.y + platform.height &&
          newPlayerY + prevPlayer.height > platform.y
        ) {
          console.log('Player hit a damaging tile!');
          // Implement damage logic here, e.g., reset player position or reduce health
          // For now, let's just reset to the initial position (or a safe spot)
          // This would require knowing the initial spawn point or a safe fallback.
          // For demonstration, let's just prevent further movement into the damaging tile
          // and potentially reset velocity.
          newPlayerX = prevPlayer.x;
          newPlayerY = prevPlayer.y;
          newPlayerVelocityY = 0;
        }
      });

      // Keep player within game area bounds (bottom and top)
      const gameAreaHeight = levelData.length * TILE_SIZE;
      if (newPlayerY + prevPlayer.height > gameAreaHeight) {
        newPlayerY = gameAreaHeight - prevPlayer.height;
        newPlayerVelocityY = 0;
        newPlayerIsGrounded = true;
        setPlayerState(p => ({ ...p, isJumping: false, jumps: 0 })); // Reset jumps on hitting bottom
      }
      if (newPlayerY < 0) {
        newPlayerY = 0;
        newPlayerVelocityY = 0;
      }

      // Handle jump
      if (keysPressed.current['Space']) {
        if (newPlayerIsGrounded || prevPlayer.jumps < 2) { // Allow double jump
          if (newPlayerIsGrounded) {
            newPlayerVelocityY = -jumpStrength;
            setPlayerState(p => ({ ...p, isJumping: true, jumps: 1 }));
          } else if (prevPlayer.jumps === 1) {
            newPlayerVelocityY = -jumpStrength;
            setPlayerState(p => ({ ...p, isJumping: true, jumps: 2 }));
          }
        }
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
  }, [platforms, gravity, moveSpeed, jumpStrength, playerWidth, playerHeight]); // Added playerWidth, playerHeight to dependencies

  useEffect(() => {
    let animationFrameId;

    const handleKeyDown = (e) => {
      if (e.key === ' ') { // Check for spacebar
        e.preventDefault(); // Prevent default spacebar behavior (e.g., scrolling)
      }
      keysPressed.current[e.key] = true;
      // Consume the 'Space' key press immediately for jumping
      if (e.key === ' ') { // Check for spacebar
        setPlayerState(prevPlayer => {
          if (prevPlayer.isGrounded || prevPlayer.jumps < 2) {
            if (prevPlayer.isGrounded) {
              return { ...prevPlayer, velocityY: -jumpStrength, isJumping: true, jumps: 1 };
            } else if (prevPlayer.jumps === 1) {
              return { ...prevPlayer, velocityY: -jumpStrength, isJumping: true, jumps: 2 };
            }
          }
          return prevPlayer;
        });
      }
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
    <div
      ref={gameAreaRef}
      className={styles.gameArea}
      style={{
        width: 30 * TILE_SIZE, // Fixed width
        height: 20 * TILE_SIZE, // Fixed height
      }}
    >
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
          className={`${styles.platform} ${styles[`tile${platform.type}`]}`}
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
          onImportLevel={parseLevelData}
        />
      )}
    </div>
  );
};

export default PlatformerGame;