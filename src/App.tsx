import {useEffect, useState} from 'react'
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

  // findMatches has been moved to Grid class

  useEffect(() => {
      let matches = [];
      let tempGrid = grid.clone();
      matches = tempGrid.findMatches();
      while(matches.length){
        tempGrid = new Grid(length, length, randInMap);
        matches = tempGrid.findMatches();
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
      const matches = newGrid.findMatches();
      await sleep(500);
      setSwappingCells([null, null]);
      if (matches.length > 0) {
          setGrid(newGrid);
          setToDelete(matches);

          // Process matches and apply gravity
          await processMatches(newGrid, matches);
      } else {
          // Swap back if no matches
          newGrid.swap(x1, y1, x2, y2);
          setGrid(newGrid);
      }
  };

  const processMatches = async (currentGrid, matches) => {
      if (matches.length === 0) {
          setIsGridBlocked(false);
          return;
      }

      clearSelection();

      // Null out matched cells
      await sleep(500);
      currentGrid.nullOutMatches(matches);
      setGrid(currentGrid.clone());
      setToDelete([]);

      // Apply gravity step by step
      let stillMoving = true;
      while (stillMoving) {
          await sleep(200);
          stillMoving = currentGrid.applyGravity(randInMap);
          setGrid(currentGrid.clone());
      }

      // Check for new matches after gravity
      const newMatches = currentGrid.findMatches();
      if (newMatches.length > 0) {
          setToDelete(newMatches);
          await processMatches(currentGrid, newMatches);
      } else {
          setIsGridBlocked(false);
      }
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