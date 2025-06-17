import { useEffect, useState } from "react";
import "./App.css";
import Grid from "./grid.js";
import GameGrid from "./GameGrid";

export const emojiMap = ["❤️", "👾", "😎", "🍆", "💩", "👽"];

export const randInMap = () => {
  return Math.floor(Math.random() * emojiMap.length);
};

function App({ length }) {
  const [isLoading, setIsLoading] = useState(true);
  const [grid, setGrid] = useState(new Grid(length, length, randInMap));
  const [score, setScore] = useState(0);
  const [isGridBlocked, setIsGridBlocked] = useState(true);
  const [selected, setSelected] = useState("");

  useEffect(() => {
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
  }, []);

  const addScore = (addedScore) => {
    setScore((prevScore) => prevScore + addedScore);
  };

  const clearSelection = () => {
    setSelected("");
  };

  return (
    <div className="page" onClick={clearSelection}>
      <div className="score">Score: {score}</div>
      {isLoading ? (
        <div className="loader" />
      ) : (
        <GameGrid
          grid={grid}
          setGrid={setGrid}
          isGridBlocked={isGridBlocked}
          setIsGridBlocked={setIsGridBlocked}
          addScore={addScore}
          selected={selected}
          setSelected={setSelected}
        />
      )}
    </div>
  );
}

export default App;
