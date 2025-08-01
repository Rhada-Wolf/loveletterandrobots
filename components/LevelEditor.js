import React, { useState, useEffect } from 'react';
import styles from '../styles/LevelEditor.module.css';
import { TILE_SIZE } from '../lib/game/constants';
import { parseLevelData } from '../lib/game/utils';

const LevelEditor = () => {
  const [grid, setGrid] = useState([]);
  const [rows, setRows] = useState(20);
  const [cols, setCols] = useState(30);
  const [tempRows, setTempRows] = useState(20);
  const [tempCols, setTempCols] = useState(30);
  const [selectedTile, setSelectedTile] = useState('G'); // G for Ground, W for Water, R for Grass, St for Start
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const loadBaseLevel = async () => {
      try {
        const response = await fetch('/levels/level_base.txt');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();
        const { grid: normalizedGrid, rows: parsedRows, cols: parsedCols } = parseLevelData(content);

        if (normalizedGrid.length > 0) {
          setRows(parsedRows);
          setCols(parsedCols);
          setGrid(normalizedGrid);
          setTempRows(parsedRows);
          setTempCols(parsedCols);
        } else {
          initializeGrid(rows, cols);
        }
      } catch (error) {
        console.error("Failed to load base level for editor:", error);
        initializeGrid(rows, cols); // Fallback to empty grid
      }
    };

    loadBaseLevel();
  }, []); // Empty dependency array to run only once on mount

  const initializeGrid = (r, c) => {
    const initialGrid = Array(r).fill(null).map(() => Array(c).fill(' '));
    setGrid(initialGrid);
  };

  const applyTile = (rowIndex, colIndex) => {
    setGrid(prevGrid => {
      const newGrid = prevGrid.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (rIdx === rowIndex && cIdx === colIndex) {
            return selectedTile;
          }
          return cell;
        })
      );
      return newGrid;
    });
  };

  const handleMouseDown = (rowIndex, colIndex) => {
    setIsDrawing(true);
    applyTile(rowIndex, colIndex);
  };

  const handleMouseEnter = (rowIndex, colIndex) => {
    if (isDrawing) {
      applyTile(rowIndex, colIndex);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const updateGridSize = () => {
    const newRows = tempRows;
    const newCols = tempCols;

    setGrid(prevGrid => {
      const newGrid = Array(newRows).fill(null).map((_, rowIndex) =>
        Array(newCols).fill(null).map((_, colIndex) => {
          if (prevGrid[rowIndex] && prevGrid[rowIndex][colIndex] !== undefined) {
            return prevGrid[rowIndex][colIndex];
          }
          return ' '; // Fill new cells with empty space
        })
      );
      return newGrid;
    });
    setRows(newRows);
    setCols(newCols);
  };

  const exportLevel = () => {
    const levelData = grid.map(row => row.join('')).join('\n');
    const filename = `level_${new Date().getTime()}.txt`;
    const blob = new Blob([levelData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importLevel = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const { grid: normalizedGrid, rows: parsedRows, cols: parsedCols } = parseLevelData(content);

        if (normalizedGrid.length > 0) {
          setRows(parsedRows);
          setCols(parsedCols);
          setGrid(normalizedGrid);
        } else {
          initializeGrid(rows, cols);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={styles.editorContainer}>
      <h1>Level Editor, arrr!</h1>
      <div className={styles.controls}>
        <label>
          Rows:
          <input type="number" value={tempRows} onChange={(e) => setTempRows(parseInt(e.target.value))} />
        </label>
        <label>
          Cols:
          <input type="number" value={tempCols} onChange={(e) => setTempCols(parseInt(e.target.value))} />
        </label>
        <button onClick={updateGridSize}>Update Size</button>
        <label>
          Select Tile:
          <select value={selectedTile} onChange={(e) => setSelectedTile(e.target.value)}>
            <option value="G">Ground</option>
            <option value="W">Water</option>
            <option value="R">Grass</option>
            <option value="O">One-Way Platform</option>
            <option value="L">Lava</option>
            <option value="St">Start Position</option>
            <option value=" ">Erase</option>
          </select>
        </label>
        <button onClick={exportLevel}>Export Level</button>
        <input type="file" accept=".txt" onChange={importLevel} />
      </div>
      <div
        className={styles.gridContainer}
        style={{ gridTemplateColumns: `repeat(${cols}, ${TILE_SIZE}px)` }}
        onMouseLeave={handleMouseUp} // Stop drawing if mouse leaves the grid
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`${styles.gridCell} ${styles[`tile${cell.trim() === '' ? 'Empty' : cell}`]}`}
              onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
              onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
              onMouseUp={handleMouseUp}
              style={{ width: TILE_SIZE, height: TILE_SIZE }}
            >
              {cell}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LevelEditor;