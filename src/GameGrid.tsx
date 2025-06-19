import React, { useState } from "react";
import { clsx } from "clsx";
import type Grid from "./grid.ts";
import { emojiMap, randInMap, WILDCARD_INDEX } from "./App.tsx";
import "./GameGrid.css";

const DIRECTIONS = {
  UP: "up",
  DOWN: "down",
  LEFT: "left",
  RIGHT: "right",
  UP_LEFT: "up-left",
  UP_RIGHT: "up-right",
  DOWN_LEFT: "down-left",
  DOWN_RIGHT: "down-right",
};

interface GameGridProps {
  grid: Grid;
  setGrid: (grid: Grid) => void;
  isGridBlocked: boolean;
  setIsGridBlocked: (isGridBlocked: boolean) => void;
  addScore: (addedScore: number) => void;
  selected: string;
  setSelected: (selected: string) => void;
}

const GameGrid: React.FC<GameGridProps> = ({
  grid,
  setGrid,
  isGridBlocked,
  setIsGridBlocked,
  addScore,
  selected,
  setSelected,
}) => {
  const [toDelete, setToDelete] = useState([]);
  const [swappingCells, setSwappingCells] = useState([null, null]);
  const [fallingCells, setFallingCells] = useState(new Set());
  const [invalidSwap, setInvalidSwap] = useState([null, null]); // New state for invalid swaps

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const startSwitch = async (x1, y1, x2, y2) => {
    setIsGridBlocked(true);

    // First animation: swap
    setSwappingCells([
      { [`${x1},${y1}`]: getSwapDirection(x1, y1, x2, y2) },
      { [`${x2},${y2}`]: getSwapDirection(x2, y2, x1, y1) },
    ]);

    const newGrid = grid.clone();
    newGrid.swap(x1, y1, x2, y2);
    const matches = newGrid.findMatches();

    if (matches.length > 0) {
      await sleep(500);
      setSwappingCells([null, null]);
      setGrid(newGrid);
      setToDelete(matches);
      await processMatches(newGrid, matches);
    } else {
      // Invalid swap - show reverse animation
      setInvalidSwap([
        { [`${x1},${y1}`]: getSwapDirection(x2, y2, x1, y1) },
        { [`${x2},${y2}`]: getSwapDirection(x1, y1, x2, y2) },
      ]);

      await sleep(1000);
      setSwappingCells([null, null]);
      setInvalidSwap([null, null]);
      setIsGridBlocked(false);
    }
  };

  const processMatches = async (currentGrid, matches) => {
    if (matches.length === 0) {
      setIsGridBlocked(false);
      return;
    }

    setSelected("");
    // Wildcard bonus: if matches include wildcards, give bonus points
    const wildcardCount = matches.filter((pos) => {
      const [x, y] = pos.split(",").map(Number);
      return currentGrid.get(x, y) === WILDCARD_INDEX;
    }).length;
    const baseScore = matches.length * 10;
    const bonusScore = wildcardCount * 20; // Extra points for wildcards
    addScore(baseScore + bonusScore);

    // Show bubble pop animation
    setToDelete(matches);
    await sleep(800); // Longer delay for bubble animation

    // Null out matched cells
    currentGrid.nullOutMatches(matches);

    // Track which cells will be falling
    const newFallingCells = new Set();
    currentGrid.map((x, y, val) => {
      if (val === null) {
        // Mark cells above as falling
        for (let aboveY = y - 1; aboveY >= 0; aboveY--) {
          if (currentGrid.get(x, aboveY) !== null) {
            newFallingCells.add(`${x},${aboveY}`);
          }
        }
      }
    });

    setGrid(currentGrid.clone());
    setToDelete([]);
    setFallingCells(newFallingCells);

    // Apply gravity step by step
    let stillMoving = true;
    while (stillMoving) {
      await sleep(200);
      stillMoving = currentGrid.applyGravity(randInMap);
      setGrid(currentGrid.clone());
    }

    // Fill empty cells without creating matches - these should fall from above
    const emptyPositions = [];
    currentGrid.map((x, y, val) => {
      if (val === null) {
        emptyPositions.push(`${x},${y}`);
      }
    });

    if (emptyPositions.length > 0) {
      setFallingCells(new Set(emptyPositions));
      await sleep(200); // Show falling animation
    }

    currentGrid.applyFullGravity(randInMap);
    setGrid(currentGrid.clone());
    setFallingCells(new Set());

    // Check for new matches after gravity
    const newMatches = currentGrid.findMatches();
    if (newMatches.length > 0) {
      await sleep(300);
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

  const clickCell = async (event) => {
    event.stopPropagation();
    if (isGridBlocked) return;
    const x = parseInt(event.target.dataset.x);
    const y = parseInt(event.target.dataset.y);
    const pos = `${x},${y}`;

    if (selected) {
      const [selX, selY] = selected.split(",").map(Number);
      if (x === selX && y === selY) {
        setSelected("");
      } else if (Math.abs(selX - x) <= 1 && Math.abs(selY - y) <= 1) {
        startSwitch(selX, selY, x, y);
      } else {
        console.log("Cannot switch - cells are not adjacent");
        setSelected("");
      }
    } else {
      setSelected(pos);
    }
  };

  return (
    <div
      className="grid"
      style={{
        gridTemplate: `repeat(${grid.getWidth()}, 1fr) / repeat(${grid.getLength()}, 1fr)`,
      }}
    >
      {grid.map((x, y, val) => {
        const pos = `${x},${y}`;
        let swapDir = "";
        let invalidDir = "";

        // Find swap direction for this cell
        swappingCells.forEach((cellObj) => {
          if (cellObj && cellObj[pos]) {
            swapDir = cellObj[pos];
          }
        });

        // Find invalid swap direction
        invalidSwap.forEach((cellObj) => {
          if (cellObj && cellObj[pos]) {
            invalidDir = cellObj[pos];
          }
        });

        return (
          <span
            key={pos}
            className={clsx("card", {
              selected: selected === pos,
              delete: toDelete.includes(pos),
              swapping: swapDir,
              "invalid-swap": invalidDir,
              animated: swapDir || invalidDir,
              falling: fallingCells.has(pos),
              wildcard: val === WILDCARD_INDEX,
              [swapDir]: swapDir,
              //[invalidDir]: invalidDir,
            })}
            onClick={clickCell}
            data-x={x}
            data-y={y}
            style={{
              gridColumn: x + 1,
              gridRow: y + 1,
            }}
          >
            {val !== null ? emojiMap[val] : ""}
          </span>
        );
      })}
    </div>
  );
};

export default GameGrid;
