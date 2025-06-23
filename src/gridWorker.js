import { randInMap } from "./emojiMap.js";
import Grid from "./grid.js";

self.onmessage = function (e) {
  const { length } = e.data;

  let matches = [];
  let tempGrid;
  let attempts = 0;
  const maxAttempts = 100000;

  do {
    tempGrid = new Grid(length, length, randInMap);
    matches = tempGrid.findMatches();
    attempts++;
  } while (matches.length > 0 && attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    console.warn("Could not generate grid without matches, using best attempt");
  }

  self.postMessage({ gridData: tempGrid.grid });
};
