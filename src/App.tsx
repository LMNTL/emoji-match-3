import { useEffect, useState } from "react";
import "./App.css";
import Grid from "./grid.js";
import GameGrid from "./GameGrid";
import ScoreDisplay from "./ScoreDisplay";

export const emojiMap = ["❤️", "👾", "😎", "🍆", "💩", "👽", "🌟"]; // Added wildcard star

export const WILDCARD_INDEX = 6; // Index of the wildcard emoji

export const randInMap = () => {
  // Reduce wildcard probability to make it special (10% chance)
  return Math.random() < 0.1
    ? WILDCARD_INDEX
    : Math.floor(Math.random() * (emojiMap.length - 1));
};

function App({ length }) {
  const [isLoading, setIsLoading] = useState(true);
  const [grid, setGrid] = useState(new Grid(length, length, randInMap));
  const [score, setScore] = useState(0);
  const [isGridBlocked, setIsGridBlocked] = useState(true);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    const setUpGrid = async () => {
      let matches = [];
      let tempGrid = grid.clone();
      matches = tempGrid.findMatches();
      while (matches.length) {
        tempGrid = new Grid(length, length, randInMap);
        matches = tempGrid.findMatches();
      }
      setGrid(tempGrid);
      setIsLoading(false);
      setIsGridBlocked(false);
    };
    setUpGrid();
  }, []);

  const addScore = (addedScore) => {
    setScore((prevScore) => prevScore + addedScore);
  };

  const clearSelection = () => {
    setSelected("");
  };

  return (
    <div className="page" onClick={clearSelection}>
      {isLoading ? (
        <div className="loader" />
      ) : (
        <>
          <ScoreDisplay score={score} />
          <GameGrid
            grid={grid}
            setGrid={setGrid}
            isGridBlocked={isGridBlocked}
            setIsGridBlocked={setIsGridBlocked}
            addScore={addScore}
            selected={selected}
            setSelected={setSelected}
          />
        </>
      )}
    </div>
  );
}

export default App;
