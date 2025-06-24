import { randInMap, createStageBasedRandInMap } from "./emojiMap.js";
import Grid from "./grid.js";

self.onmessage = function (e) {
  const { length, stage = 1 } = e.data;

  const stageBasedRandInMap = createStageBasedRandInMap(stage);

  let matches = [];
  let tempGrid;
  let attempts = 0;
  const maxAttempts = 100000;

  do {
    tempGrid = new Grid(length, length, stageBasedRandInMap);
    matches = tempGrid.findMatches();
    attempts++;
  } while (matches.length > 0 && attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    console.warn("Could not generate grid without matches, using best attempt");
  }

  self.postMessage({ gridData: tempGrid.grid });
};
