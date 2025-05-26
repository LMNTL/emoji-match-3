import { useState } from 'react'
import './App.css'
import {clsx} from "clsx";

const emojiMap = [
    '❤️', '🌳', '😎', '🍆'
];

const randInRange = (max) => {
    return Math.floor(Math.random() * max);
}

function App({length}) {
  const [grid, setGrid] = useState(
      Array.from({ length },
() => Array.from({length},
    () => randInRange(emojiMap.length)
        )
  ));
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState('');
  const [toDelete, setToDelete] = useState([]);

  const findMatches = () => {
      let last = null;
      let count = 0;
      let matches = [];
      // raster up->down
      for(let i = 0; i < length; i++){
          for(let j = 0; j < length; j++ ) {
              if(grid[i][j] === last) {
                  count++;
              } else {
                  if(count >= 3){
                      const match = [];
                      for(count; count > 0; count--){
                          match.push(`${i},${j - count}`);
                      }
                      matches.push(match)
                  }
                  last = grid[i][j];
                  count = 1;
              }
          }
          count = 0;
          last = null;
      }
      // raster left->right
      for(let j = 0; j < length; j++){
          for(let i = 0; i < length; i++ ) {
              if(grid[i][j] === last) {
                  count++;
              }
              else{
                  if(count >= 3){
                      console.log(i, j)
                      const match = [];
                      for(count; count > 0; count--){
                          match.push(`${i - count},${j}`);
                      }
                      matches.push(match)
                  }
                  last = grid[i][j];
                  count = 1;
              }
          }
          count = 0;
          last = null;
      }
      return matches;
  }

  const clickCell = (event) => {
    event.stopPropagation();
    if(selected){
        const [x1, y1] = selected.split(',');
        const [x2, y2] = [event.target.dataset.x, event.target.dataset.y];
        if(x1 === x2 && y1 === y2){
            clearSelection();
        }
        else if(Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1
        ) {
            startSwitch(x1, x2, y1, y2);
        } else {
            console.log('can\'t switch')
        }
    } else {
        setSelected(`${event.target.dataset.x},${event.target.dataset.y}`)
    }
  }

  const startSwitch = (x1, x2, y1, y2) => {
    setToDelete(findMatches());
  }

  const clearSelection = () => {
      setSelected('');
  }

  return (
    <div className='page' onClick={clearSelection}>
        <div className='score'>{score}</div>
        <div className='grid'>
    {grid.map((row, y) => row.map((cell, x) =>
        <>
            <span
                className={clsx(
                    'card',
                    {
                        'selected': selected === `${x},${y}`,
                        'delete': toDelete.some(match => match.some(el => el === `${x},${y}`))
                    }
                )}
                onClick={clickCell}
                data-x={x} data-y={y}
            >
                {emojiMap[cell]}
            </span>
        </>
    ))}
            </div>
  </div>);
}

export default App
