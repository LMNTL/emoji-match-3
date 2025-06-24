import React, { useMemo, useState } from "react";
import { clsx } from "clsx";
import type Grid from "./grid.ts";
import "./GameGrid.css";
import {
  createStageBasedRandInMap,
  emojiMap,
  getRocketDirection,
  isRocket,
  WILDCARD_INDEX,
} from "./emojiMap.js";

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
  currentStage: number;
}

const GameGrid: React.FC<GameGridProps> = ({
  grid,
  setGrid,
  isGridBlocked,
  setIsGridBlocked,
  addScore,
  selected,
  setSelected,
  currentStage,
}) => {
  const [toDelete, setToDelete] = useState([]);
  const [swappingCells, setSwappingCells] = useState([null, null]);
  const [fallingCells, setFallingCells] = useState(new Set());
  const [invalidSwap, setInvalidSwap] = useState([null, null]); // New state for invalid swaps

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const randInMap = useMemo(
    () => createStageBasedRandInMap(currentStage),
    [currentStage],
  );

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

    // Calculate score with rocket bonus
    const wildcardCount = matches.filter((pos) => {
      const [x, y] = pos.split(",").map(Number);
      return currentGrid.get(x, y) === WILDCARD_INDEX;
    }).length;

    const baseScore = matches.length * 10;
    const wildcardBonus = wildcardCount * 20;

    addScore(baseScore + wildcardBonus);

    await removeMatches(matches, currentGrid);

    // Check for rockets adjacent to matches and activate them
    const rocketActivations: Set<String> = new Set();
    matches.forEach((pos) => {
      const [x, y] = pos.split(",").map(Number);

      // Check all 8 adjacent positions for rockets
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;

          const rocketX = x + dx;
          const rocketY = y + dy;

          if (
            rocketX >= 0 &&
            rocketX < currentGrid.getWidth() &&
            rocketY >= 0 &&
            rocketY < currentGrid.getLength()
          ) {
            const rocketVal = currentGrid.get(rocketX, rocketY);
            if (isRocket(rocketVal)) {
              rocketActivations.add(`${rocketX},${rocketY}`);
            }
          }
        }
      }
    });

    // Process rocket activations
    const rocketMatches = new Set(matches);
    rocketActivations.forEach((rocketPos) => {
      const [rocketX, rocketY] = rocketPos.split(",").map(Number);
      const rocketVal = currentGrid.get(rocketX, rocketY);
      const direction = getRocketDirection(rocketVal);

      // Clear all cells in that direction
      let currentX = rocketX + direction.dx;
      let currentY = rocketY + direction.dy;

      while (
        currentX >= 0 &&
        currentX < currentGrid.getWidth() &&
        currentY >= 0 &&
        currentY < currentGrid.getLength()
      ) {
        rocketMatches.add(`${currentX},${currentY}`);
        currentX += direction.dx;
        currentY += direction.dy;
      }

      // Also remove the rocket itself
      rocketMatches.add(rocketPos);
    });

    const rocketCount = rocketActivations.size;
    const rocketBonus = rocketCount * 50; // Big bonus for rocket activations
    addScore(rocketBonus);

    await removeMatches(rocketMatches, currentGrid);

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

  const removeMatches = async (matches, currentGrid) => {
    // Show bubble pop animation
    setToDelete(Array.from(matches));
    await sleep(500);

    // Null out matched cells
    currentGrid.nullOutMatches(matches);
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
              rocket: isRocket(val),
              [swapDir]: swapDir,
            })}
            onClick={clickCell}
            data-x={x}
            data-y={y}
            data-val={val}
            style={{
              gridColumn: x + 1,
              gridRow: y + 1,
            }}
          >
            <span
              className={clsx("card-inner", {
                [getRocketDirection(val)?.name]: isRocket(val),
              })}
            >
              {val !== null ? emojiMap[val] : ""}
            </span>
          </span>
        );
      })}
    </div>
  );
};

export default GameGrid;
