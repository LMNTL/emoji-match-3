import React, { useMemo, useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import type Grid from "./grid.ts";
import "./GameGrid.css";
import {
  createStageBasedRandInMap,
  emojiMap,
  getRocketDirection,
  isRocket,
  isRock,
  WILDCARD_INDEX,
} from "./emojiMap.js";
import { SoundEvent, SoundType } from "./components/SoundSystem.tsx";

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
  const [comboMultiplier, setComboMultiplier] = useState(1.0);
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [invalidSwap, setInvalidSwap] = useState([null, null]);
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms / animationSpeed));
  }

  const randInMap = useMemo(
    () => createStageBasedRandInMap(currentStage),
    [currentStage],
  );

  const startSwitch = async (x1, y1, x2, y2) => {
    // Check if either cell contains a rock - rocks can't be swapped
    if (isRock(grid.get(x1, y1)) || isRock(grid.get(x2, y2))) {
      return; // Do nothing if trying to swap with a rock
    }

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
      await processMatches(newGrid, matches, 1); // Start with comboLevel 1
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

  const processMatches = async (currentGrid, matches, comboLevel = 1) => {
    if (matches.length === 0) {
      setIsGridBlocked(false);
      return;
    }

    setSelected("");

    // Increment match sequence count and play match sound
    const matchEvent = new SoundEvent(SoundType.MATCH, comboLevel);
    window.dispatchEvent(matchEvent);

    // Calculate score with rocket bonus and combo multiplier
    const wildcardCount = matches.filter((pos) => {
      const [x, y] = pos.split(",").map(Number);
      return currentGrid.get(x, y) === WILDCARD_INDEX;
    }).length;

    const baseScore = matches.length * 10;
    const wildcardBonus = wildcardCount * 20;
    const multiplier = 1 + 0.1 * (comboLevel - 1);
    const speed = Math.min((multiplier - 1.0) * 2.0 + 1.0, 2.5);
    setComboMultiplier(multiplier);
    setAnimationSpeed(speed);
    addScore((baseScore + wildcardBonus) * multiplier);

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
    addScore(rocketBonus * multiplier);

    if (rocketCount > 0) {
      const matchEvent = new SoundEvent(SoundType.ROCKET);
      window.dispatchEvent(matchEvent);
    }

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
      if (stillMoving) {
        const newFallingCells = new Set();
        fallingCells.forEach((cellPos) => {
          if (currentGrid.isCellMoving(cellPos)) {
            newFallingCells.add(cellPos);
          }
        });
        setFallingCells(newFallingCells);
      }
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
      await sleep(200);
      await processMatches(currentGrid, newMatches, comboLevel + 1);
    } else {
      setComboMultiplier(1.0);
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

    // Don't allow selecting rocks
    if (isRock(grid.get(x, y))) {
      return;
    }

    if (selected) {
      const [selX, selY] = selected.split(",").map(Number);
      if (x === selX && y === selY) {
        setSelected("");
        setFocusedCell(pos);
      } else if (Math.abs(selX - x) <= 1 && Math.abs(selY - y) <= 1) {
        startSwitch(selX, selY, x, y);
      } else {
        setSelected("");
        setFocusedCell(pos);
      }
    } else {
      setSelected(pos);
      setFocusedCell(pos);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isGridBlocked) return;

    const currentPos = focusedCell || selected || "0,0";
    const [currentX, currentY] = currentPos.split(",").map(Number);
    let newX = currentX;
    let newY = currentY;

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        newY = Math.max(0, currentY - 1);
        break;
      case "ArrowDown":
        event.preventDefault();
        newY = Math.min(grid.getLength() - 1, currentY + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        newX = Math.max(0, currentX - 1);
        break;
      case "ArrowRight":
        event.preventDefault();
        newX = Math.min(grid.getWidth() - 1, currentX + 1);
        break;
      case "Tab":
        if (!focusedCell) {
          [newX, newY] = [0, 0];
        } else {
          if (event.shiftKey) {
            if (currentX === 0) {
              newX = grid.getWidth();
              newY = currentY - 1;
              if (newY < 0) {
                return;
              }
            } else {
              newX -= 1;
            }
          } else if (currentX + 1 >= grid.getWidth()) {
            newX = 0;
            newY = currentY + 1 >= grid.getLength() ? 0 : currentY + 1;
            if (newY === 0) {
              return;
            }
          } else {
            newX = currentX + 1;
          }
        }
        event.preventDefault();
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        const pos = `${currentX},${currentY}`;

        // Don't allow selecting rocks
        if (isRock(grid.get(currentX, currentY))) {
          return;
        }

        if (selected) {
          const [selX, selY] = selected.split(",").map(Number);
          if (currentX === selX && currentY === selY) {
            setSelected("");
          } else if (
            Math.abs(selX - currentX) <= 1 &&
            Math.abs(selY - currentY) <= 1
          ) {
            startSwitch(selX, selY, currentX, currentY);
          } else {
            setSelected("");
          }
        } else {
          setSelected(pos);
        }
        break;
      case "Escape":
        event.preventDefault();
        setSelected("");
        break;
      default:
        return;
    }

    if (event.key.startsWith("Arrow") || event.key === "Tab") {
      const newPos = `${newX},${newY}`;
      setFocusedCell(newPos);

      // Focus the grid container to ensure it receives keyboard events
      if (gridRef.current) {
        gridRef.current.focus();
      }
    }
  };

  // Set initial focus when grid becomes interactive
  useEffect(() => {
    if (!isGridBlocked && !focusedCell && gridRef.current) {
      setFocusedCell("0,0");
      gridRef.current.focus();
    }
  }, [isGridBlocked, focusedCell]);

  const getEmojiDescription = (val: number | null): string => {
    if (val === null) return "empty";
    if (val === WILDCARD_INDEX) return "wildcard star";
    if (isRocket(val)) {
      const direction = getRocketDirection(val);
      return `rocket pointing ${direction?.name || "unknown direction"}`;
    }
    if (isRock(val)) return "rock";

    const emojiDescriptions = [
      "red heart",
      "alien monster",
      "cool face",
      "eggplant",
      "pile of poo",
      "alien",
      "star",
      "rocket",
    ];
    return emojiDescriptions[val] || `emoji ${val}`;
  };

  return (
    <div
      ref={gridRef}
      className="grid"
      style={
        {
          gridTemplate: `repeat(${grid.getWidth()}, 1fr) / repeat(${grid.getLength()}, 1fr)`,
          "--animation-speed": animationSpeed,
        } as React.CSSProperties
      }
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="grid"
      aria-label={`Game grid ${grid.getWidth()} by ${grid.getLength()}`}
      aria-describedby="grid-instructions"
    >
      <div id="grid-instructions" className="sr-only">
        Use arrow keys to navigate, Enter or Space to select and swap adjacent
        pieces, Escape to deselect.
        {currentStage >= 3 && " Stars are wildcards that match any piece."}
        {currentStage >= 6 && " Rockets clear entire lines when activated."}
        {currentStage >= 9 && " Rocks cannot be moved or matched."}
      </div>

      {comboMultiplier > 1.0 && (
        <div className="combo-indicator" aria-live="polite">
          {comboMultiplier.toFixed(1)}x COMBO!
        </div>
      )}

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

        const isSelected = selected === pos;
        const isFocused = focusedCell === pos;
        const isRockCell = isRock(val);

        return (
          <span
            key={pos}
            className={clsx("card", {
              selected: isSelected,
              focused: isFocused,
              delete: toDelete.includes(pos),
              swapping: swapDir,
              "invalid-swap": invalidDir,
              animated: swapDir || invalidDir,
              falling: fallingCells.has(pos),
              wildcard: val === WILDCARD_INDEX,
              rocket: isRocket(val),
              rock: isRockCell,
              disabled: isRockCell,
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
            role="gridcell"
            aria-label={`${getEmojiDescription(val)} at position ${x + 1}, ${y + 1}${isSelected ? ", selected" : ""}${isFocused ? ", focused" : ""}`}
            aria-selected={isSelected}
            aria-disabled={isRockCell}
            tabIndex={-1}
          >
            <span
              className={clsx("card-inner", {
                [getRocketDirection(val)?.name]: isRocket(val),
              })}
              aria-hidden="true"
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
