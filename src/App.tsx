import {Suspense, useEffect, useState} from 'react'
import './App.css'
import {clsx} from "clsx";
import Grid from './grid.js';

const emojiMap = [
    '❤️', '🌳', '😎', '🍆', '🐇'
];

const randInMap = () => {
    return Math.floor(Math.random() * emojiMap.length);
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
  const [isLoading, setIsLoading] = useState(true);
  const [grid, setGrid] = useState(
      new Grid(length, length, randInMap)
  );
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState('');
  const [isGridBlocked, setIsGridBlocked] = useState(true);
  const [toDelete, setToDelete] = useState([]);
  const [swappingCells, setSwappingCells] = useState([null, null]); // For animation tracking

  const findMatches = (matchGrid) => {
      const matches = [];

      // Helper to check a line (row, column, or diagonal) for matches
      const checkLine = (cells) => {
          let last = null;
          let count = 0;
          const lineMatches = [];
          cells.forEach(({val, x, y}, index) => {
              if (val === last) {
                  count++;
              } else {
                  if (count >= 3) {
                      // Add the matched positions (last 'count' items)
                      lineMatches.push(...cells.slice(index-count, index).map(c => `${c.x},${c.y}`));
                  }
                  last = val;
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
      for (let x = 0; x < length; x++) {
          const row = matchGrid.getRow(x);
          matches.push(...checkLine(row));
      }

      // Vertical (columns)
      for (let y = 0; y < length; y++) {
          const col = matchGrid.getCol(y);
          matches.push(...checkLine(col));
      }

      // Diagonals (top-left to bottom-right)
      for (let startY = 0; startY < length; startY++) {
          for (let startX = 0; startX < length; startX++) {
              const diagonal = [];
              for (let i = 0; startY + i < length && startX + i < length; i++) {
                  const y = startY + i;
                  const x = startX + i;
                  diagonal.push({val: matchGrid.get(x, y), x, y});
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
                  diagonal.push({val: matchGrid.get(x, y), x, y});
              }
              if (diagonal.length >= 3) {
                  matches.push(...checkLine(diagonal));
              }
          }
      }

      // Remove duplicates (in case of overlapping matches)
      return [...new Set(matches)];
  };

  useEffect(() => {
      let matches = [];
      let tempGrid = grid.clone();
      matches = findMatches(tempGrid);
      while(matches.length){
        tempGrid = new Grid(length, length, randInMap);
        matches = findMatches(tempGrid);
      }
      setGrid(tempGrid);
      setIsLoading(false);
      setIsGridBlocked(false);
  }, []);

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  const startSwitch = async (x1, y1, x2, y2) => {
      // Perform the swap on a new grid
      setIsGridBlocked(true);
      setSwappingCells([
          {[`${x1},${y1}`]: getSwapDirection(x1, y1, x2, y2)},
          {[`${x2},${y2}`]: getSwapDirection(x2, y2, x1, y1)},
      ])
      const newGrid = grid.clone();
      newGrid.swap(x1, y1, x2, y2);

      // Check for matches after swap
      const matches = findMatches(newGrid);
      await sleep(500);
      setSwappingCells([null, null]);
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
      if(isGridBlocked) return;
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
          {isLoading ? <div className='loader'/> :
              <div className='grid' style={{grid: `repeat(${length}, 1fr) / repeat(${length}, 1fr)`}}>
                  {grid.map((x, y, val) => {
                      const pos = `${x},${y}`;
                      const swapDir = swappingCells.find(el => el?.[pos])?.dir ?? '';
                      return (
                          <span
                              key={pos}
                              className={clsx(
                                  'card',
                                  swapDir,
                                  {
                                      'selected': selected === pos,
                                      'delete': toDelete.includes(pos),
                                      'swapping': swappingCells.includes(el => el?.[pos])
                                  }
                              )}
                              onClick={clickCell}
                              data-x={x}
                              data-y={y}
                          >
                              {emojiMap[val]}
                          </span>
                      );
                  })}
              </div>
          }
      </div>
  );
}

export default App