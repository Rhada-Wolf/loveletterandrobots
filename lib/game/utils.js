// lib/game/utils.js

export const parseLevelData = (content) => {
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

  return { grid: normalizedGrid, rows: normalizedGrid.length, cols: maxCols };
};