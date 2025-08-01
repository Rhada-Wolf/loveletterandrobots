import React from 'react';
import styles from '../styles/platformer.module.css';

const DebugPanel = ({
  gravity,
  jumpStrength,
  moveSpeed,
  playerWidth,
  playerHeight,
  setGravity,
  setJumpStrength,
  setMoveSpeed,
  setPlayerWidth,
  setPlayerHeight,
  onClose,
  onImportLevel // Add onImportLevel to props
}) => {
  const handleImportLevel = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        if (onImportLevel) { // Check if onImportLevel is provided
          onImportLevel(content);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={styles.debugPanel}>
      <h3>Debug Settings</h3>
      <div>
        <label>Gravity: </label>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={gravity}
          onChange={(e) => setGravity(parseFloat(e.target.value))}
        />
        <span>{gravity.toFixed(2)}</span>
      </div>
      <div>
        <label>Jump Strength: </label>
        <input
          type="range"
          min="5"
          max="20"
          step="1"
          value={jumpStrength}
          onChange={(e) => setJumpStrength(parseFloat(e.target.value))}
        />
        <span>{jumpStrength.toFixed(0)}</span>
      </div>
      <div>
        <label>Move Speed: </label>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={moveSpeed}
          onChange={(e) => setMoveSpeed(parseFloat(e.target.value))}
        />
        <span>{moveSpeed.toFixed(0)}</span>
      </div>
      <div>
        <label>Player Width: </label>
        <input
          type="range"
          min="20"
          max="100"
          step="5"
          value={playerWidth}
          onChange={(e) => setPlayerWidth(parseFloat(e.target.value))}
        />
        <span>{playerWidth.toFixed(0)}</span>
      </div>
      <div>
        <label>Player Height: </label>
        <input
          type="range"
          min="20"
          max="100"
          step="5"
          value={playerHeight}
          onChange={(e) => setPlayerHeight(parseFloat(e.target.value))}
        />
        <span>{playerHeight.toFixed(0)}</span>
      </div>
      <div>
        <label>Import Level: </label>
        <input type="file" accept=".txt" onChange={handleImportLevel} />
      </div>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default DebugPanel;