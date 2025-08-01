import React, { useState, useEffect } from 'react';
import styles from '../styles/LevelEditor.module.css';

const TILE_SIZE = 32; // Size of each tile in pixels

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
        const lines = content.split('\n');
        const importedGrid = [];
        let maxCols = 0;

        lines.forEach(line => {
          const row = [];
          for (let i = 0; i < line.length; i++) {
            if (line[i] === 'S' && i + 1 < line.length && line[i+1] === 't') {
              row.push('St');
              i++;
            } else {
              row.push(line[i]);
            }
          }
          importedGrid.push(row);
          if (row.length > maxCols) {
            maxCols = row.length;
          }
        });

        const normalizedGrid = importedGrid.map(row => {
          const newRow = [...row];
          while (newRow.length < maxCols) {
            newRow.push(' ');
          }
          return newRow;
        });

        if (normalizedGrid.length > 0) {
          setRows(normalizedGrid.length);
          setCols(maxCols);
          setGrid(normalizedGrid);
          setTempRows(normalizedGrid.length);
          setTempCols(maxCols);
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
    setRows(tempRows);
    setCols(tempCols);
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
        const lines = content.split('\n'); // Do not trim lines here, empty lines might be part of the level structure
        const importedGrid = [];
        let maxCols = 0;

        lines.forEach(line => {
          const row = [];
          for (let i = 0; i < line.length; i++) {
            if (line[i] === 'S' && i + 1 < line.length && line[i+1] === 't') { // Check for 'St' and bounds
              row.push('St');
              i++; // Skip 't'
            } else {
              row.push(line[i]);
            }
          }
          importedGrid.push(row);
          if (row.length > maxCols) {
            maxCols = row.length;
          }
        });

        // Ensure all rows have the same number of columns and handle empty lines
        const normalizedGrid = importedGrid.map(row => {
          const newRow = [...row];
          while (newRow.length < maxCols) {
            newRow.push(' '); // Pad with empty space
          }
          return newRow;
        });

        if (normalizedGrid.length > 0) {
          setRows(normalizedGrid.length);
          setCols(maxCols);
          setGrid(normalizedGrid);
        } else {
          // If the file is empty, initialize an empty grid
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
        <input type="file" accept=".txt,.xml" onChange={importLevel} />
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