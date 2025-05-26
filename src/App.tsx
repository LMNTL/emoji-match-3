import { useState } from 'react'
import './App.css'
import {clsx} from "clsx";

const emojiMap = [
    '❤️', '🌳', '😎', '🍆'
];

const randInRange = (max) => {
    return Math.floor(Math.random() * max);
}

const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  UP_LEFT: 'up-left',
  UP_RIGHT: 'up-right',
  DOWN_LEFT: 'down-left',
  DOWN_RIGHT: 'down-right'
};

function App({length}) {
  const [grid, setGrid] = useState(
      Array.from({ length }, () => Array.from({ length }, () => randInRange(emojiMap.length)))
  );
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState('');
  const [toDelete, setToDelete] = useState([]);
  const [swappingCells, setSwappingCells] = useState([]); // For animation tracking

  const findMatches = (matchGrid) => {
      const matches = [];

      // Helper to check a line (row, column, or diagonal) for matches
      const checkLine = (cells) => {
          let last = null;
          let count = 0;
          const lineMatches = [];
          cells.forEach(({value, pos}, index) => {
              if (value === last) {
                  count++;
              } else {
                  if (count >= 3) {
                      // Add the matched positions (last 'count' items)
                      lineMatches.push(...cells.slice(index-count, index).map(c => c.pos));
                  }
                  last = value;
                  count = 1;
              }
          });
          // Check for matches at the end of the line
          if (count >= 3) {
              lineMatches.push(...cells.slice(-count).map(c => c.pos));
          }
          return lineMatches;
      };

      // Horizontal (rows)
      for (let y = 0; y < length; y++) {
          const row = matchGrid[y].map((value, x) => ({value, pos: `${x},${y}`}));
          matches.push(...checkLine(row));
      }

      // Vertical (columns)
      for (let x = 0; x < length; x++) {
          const col = matchGrid.map((row, y) => ({value: row[x], pos: `${x},${y}`}));
          matches.push(...checkLine(col));
      }

      // Diagonals (top-left to bottom-right)
      for (let startY = 0; startY < length; startY++) {
          for (let startX = 0; startX < length; startX++) {
              const diagonal = [];
              for (let i = 0; startY + i < length && startX + i < length; i++) {
                  const y = startY + i;
                  const x = startX + i;
                  diagonal.push({value: matchGrid[y][x], pos: `${x},${y}`});
              }
              if (diagonal.length >= 3) {
                  matches.push(...checkLine(diagonal));
              }
          }
      }

      // Diagonals (top-right to bottom-left)
      for (let startY = 0; startY < length; startY++) {
          for (let startX = length - 1; startX >= 0; startX--) {
              const diagonal = [];
              for (let i = 0; startY + i < length && startX - i >= 0; i++) {
                  const y = startY + i;
                  const x = startX - i;
                  diagonal.push({value: matchGrid[y][x], pos: `${x},${y}`});
              }
              if (diagonal.length >= 3) {
                  matches.push(...checkLine(diagonal));
              }
          }
      }

      // Remove duplicates (in case of overlapping matches)
      return [...new Set(matches)];
  };


  const startSwitch = async (x1, y1, x2, y2) => {
      // Perform the swap on a new grid
      const newGrid = grid.map(row => [...row]);
      const temp = newGrid[y1][x1];
      newGrid[y1][x1] = newGrid[y2][x2];
      newGrid[y2][x2] = temp;

      // Check for matches after swap
      const matches = findMatches(newGrid);
      if (matches.length > 0) {
          setGrid(newGrid);
          setToDelete(matches);
      }

      clearSelection();
  };

  const getSwapDirection = (x1: number, y1: number, x2: number, y2: number) => {
    if (x1 === x2) {
      return y1 > y2 ? DIRECTIONS.UP : DIRECTIONS.DOWN;
    } else if (y1 === y2) {
      return x1 > x2 ? DIRECTIONS.LEFT : DIRECTIONS.RIGHT;
    } else if (x1 > x2) {
        if (y1 > y2) {
            return DIRECTIONS.UP_LEFT;
        } else {
            return DIRECTIONS.DOWN_LEFT;
        }
    } else {
        if (y1 > y2) {
            return DIRECTIONS.UP_RIGHT;
        } else {
            return DIRECTIONS.DOWN_RIGHT;
        }
    }
  };

  const clickCell = (event) => {
      event.stopPropagation();
      const x = parseInt(event.target.dataset.x);
      const y = parseInt(event.target.dataset.y);
      const pos = `${x},${y}`;

      if (selected) {
          const [selX, selY] = selected.split(',').map(Number);
          if (x === selX && y === selY) {
              clearSelection();
          } else if (Math.abs(selX - x) <= 1 && Math.abs(selY - y) <= 1) {
              startSwitch(selX, selY, x, y);
          } else {
              console.log('Cannot switch - cells are not adjacent');
              clearSelection();
          }
      } else {
          setSelected(pos);
      }
  };

  const clearSelection = () => {
      setSelected('');
  };

  return (
      <div className='page' onClick={clearSelection}>
          <div className='score'>Score: {score}</div>
          <div className='grid' style={{grid: `repeat(${length}, 1fr) / repeat(${length}, 1fr)`}}>
              {grid.map((row, y) => row.map((cell, x) => {
                  const pos = `${x},${y}`;
                  return (
                      <span
                          key={pos}
                          className={clsx(
                              'card',
                              {
                                  'selected': selected === pos,
                                  'delete': toDelete.includes(pos),
                                  'swapping': swappingCells.includes(pos)
                              }
                          )}
                          onClick={clickCell}
                          data-x={x}
                          data-y={y}
                      >
                          {emojiMap[cell]}
                      </span>
                  );
              }))}
          </div>
      </div>
  );
}

export default App