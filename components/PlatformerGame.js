import React, { useRef, useEffect, useState, useCallback } from 'react';
import styles from '../styles/platformer.module.css';
import DebugPanel from './DebugPanel';
import { GameEngine } from '../lib/game/GameEngine';
import { PositionComponent, RenderComponent, PlayerComponent, CollisionComponent } from '../lib/game/components';
import { TILE_SIZE } from '../lib/game/constants'; // Import TILE_SIZE

const PlatformerGame = () => {
  const gameEngineRef = useRef(null);
  const gameAreaRef = useRef(null);
  const playerRef = useRef(null);
  const [keysPressed, setKeysPressed] = useState({});

  const [playerRenderData, setPlayerRenderData] = useState(null);
  const [platformsRenderData, setPlatformsRenderData] = useState([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Initialize GameEngine
  useEffect(() => {
    gameEngineRef.current = new GameEngine({
      gravity: 0.25,
      jumpStrength: 8,
      moveSpeed: 3,
      playerWidth: 32,
      playerHeight: 32,
      tileSize: TILE_SIZE,
      gameAreaWidth: 30 * TILE_SIZE, // Initial default, will be updated by level
      gameAreaHeight: 20 * TILE_SIZE, // Initial default, will be updated by level
      viewportWidth: gameAreaRef.current ? gameAreaRef.current.offsetWidth : 960, // Default or actual
      viewportHeight: gameAreaRef.current ? gameAreaRef.current.offsetHeight : 640, // Default or actual
    });

    // Load initial level
    const loadInitialLevel = async () => {
      try {
        const response = await fetch('/levels/level_base.txt');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const levelText = await response.text();
        gameEngineRef.current.loadLevel(levelText);
      } catch (error) {
        console.error("Failed to load base level:", error);
        // Fallback to an empty grid if loading fails
        gameEngineRef.current.loadLevel(Array(20).fill(' '.repeat(30)).join('\n'));
      }
    };
    loadInitialLevel();

    // Setup game loop
    let animationFrameId;
    let lastTime = 0; // Initialize lastTime outside the loop

    const gameLoop = (currentTime) => {
      if (!lastTime) lastTime = currentTime; // Initialize on first frame
      const deltaTime = currentTime - lastTime; // Calculate deltaTime in milliseconds
      lastTime = currentTime; // Update lastTime for the next frame

      gameEngineRef.current.setKeysPressed(keysPressed); // Use state directly
      gameEngineRef.current.update(deltaTime); // Pass deltaTime
      const renderedEntities = gameEngineRef.current.render(); // RenderSystem now handles camera offset

      const playerEntity = gameEngineRef.current.getEntitiesByComponent('PlayerComponent')[0];
      if (playerEntity) {
        // RenderSystem already returns camera-adjusted positions
        setPlayerRenderData({
          x: playerEntity.PositionComponent.x,
          y: playerEntity.PositionComponent.y,
          width: playerEntity.RenderComponent.width,
          height: playerEntity.RenderComponent.height,
          direction: playerEntity.RenderComponent.direction,
          animationState: playerEntity.RenderComponent.animationState,
        });
      }

      setPlatformsRenderData(gameEngineRef.current.getEntitiesByComponent('CollisionComponent').filter(e => !e.PlayerComponent).map(platform => ({
        // RenderSystem already returns camera-adjusted positions for platforms too
        x: platform.PositionComponent.x,
        y: platform.PositionComponent.y,
        width: platform.CollisionComponent.width,
        height: platform.CollisionComponent.height,
        type: platform.CollisionComponent.type,
      })));

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e) => {
      setKeysPressed(prev => ({ ...prev, [e.key]: true }));
    };

    const handleKeyUp = (e) => {
      setKeysPressed(prev => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Debug panel handlers
  const handleDebugPanelChange = useCallback((param, value) => {
    if (!gameEngineRef.current) return;
    switch (param) {
      case 'gravity':
        gameEngineRef.current.gravity = value;
        break;
      case 'jumpStrength':
        const player = gameEngineRef.current.getEntitiesByComponent('PlayerComponent')[0];
        if (player && player.PlayerComponent) player.PlayerComponent.jumpStrength = value;
        break;
      case 'moveSpeed':
        const playerMove = gameEngineRef.current.getEntitiesByComponent('PlayerComponent')[0];
        if (playerMove && playerMove.PlayerComponent) playerMove.PlayerComponent.moveSpeed = value;
        break;
      case 'playerWidth':
        const playerWidthEntity = gameEngineRef.current.getEntitiesByComponent('RenderComponent')[0];
        if (playerWidthEntity && playerWidthEntity.RenderComponent) playerWidthEntity.RenderComponent.width = value;
        break;
      case 'playerHeight':
        const playerHeightEntity = gameEngineRef.current.getEntitiesByComponent('RenderComponent')[0];
        if (playerHeightEntity && playerHeightEntity.RenderComponent) playerHeightEntity.RenderComponent.height = value;
        break;
      default:
        break;
    }
  }, []);

  const handleImportLevel = useCallback((levelText) => {
    if (gameEngineRef.current) {
      gameEngineRef.current.loadLevel(levelText);
    }
  }, []);

  if (!playerRenderData) {
    return <div>Loading game...</div>;
  }

  return (
    <div
      ref={gameAreaRef}
      className={styles.gameArea}
      style={{
        width: gameEngineRef.current.gameAreaWidth,
        height: gameEngineRef.current.gameAreaHeight,
      }}
    >
      <div
        ref={playerRef}
        className={`${styles.player} ${styles[playerRenderData.direction]} ${styles[playerRenderData.animationState]}`}
        style={{
          transform: `translate(${playerRenderData.x}px, ${playerRenderData.y}px)`, // Positions are already camera-adjusted
          width: playerRenderData.width,
          height: playerRenderData.height,
        }}
      ></div>

      {platformsRenderData.map((platform, index) => (
        <div
          key={index}
          className={`${styles.platform} ${styles[`tile${platform.type}`]}`}
          style={{
            left: platform.x, // Positions are already camera-adjusted
            top: platform.y, // Positions are already camera-adjusted
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
          gravity={gameEngineRef.current.gravity}
          setGravity={(value) => handleDebugPanelChange('gravity', value)}
          jumpStrength={gameEngineRef.current.getEntitiesByComponent('PlayerComponent')[0]?.PlayerComponent.jumpStrength || 0}
          setJumpStrength={(value) => handleDebugPanelChange('jumpStrength', value)}
          moveSpeed={gameEngineRef.current.getEntitiesByComponent('PlayerComponent')[0]?.PlayerComponent.moveSpeed || 0}
          setMoveSpeed={(value) => handleDebugPanelChange('moveSpeed', value)}
          playerWidth={gameEngineRef.current.getEntitiesByComponent('RenderComponent')[0]?.RenderComponent.width || 0}
          setPlayerWidth={(value) => handleDebugPanelChange('playerWidth', value)}
          playerHeight={gameEngineRef.current.getEntitiesByComponent('RenderComponent')[0]?.RenderComponent.height || 0}
          setPlayerHeight={(value) => handleDebugPanelChange('playerHeight', value)}
          onClose={() => setShowDebugPanel(false)}
          onImportLevel={handleImportLevel}
          keysPressed={keysPressed} // Pass keysPressed state
        />
      )}
    </div>
  );
};

export default PlatformerGame;