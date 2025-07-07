export const emojiMap = [
  "❤️",
  "👾",
  "😎",
  "🍆",
  "💩",
  "👽",
  "🌟",
  "🚀",
  "🚀",
  "🚀",
  "🚀",
  "🚀",
  "🚀",
  "🚀",
  "🚀",
  "🪨", // Rock emoji
];
const WILDCARD_CHANCE = 0.1;
export const WILDCARD_INDEX = 6;
const ROCKET_CHANCE = 0.01;
const ROCK_CHANCE = 0.05;
export const ROCK_INDEX = 15;
export const ROCKET_INDICES = {
  UP: 7,
  DOWN: 8,
  LEFT: 9,
  RIGHT: 10,
  UP_LEFT: 11,
  UP_RIGHT: 12,
  DOWN_LEFT: 13,
  DOWN_RIGHT: 14,
};

// Rocket directions (0-7 corresponding to 8 directions)
const ROCKET_DIRECTIONS = [
  { dx: 0, dy: -1, name: "up" },
  { dx: 0, dy: 1, name: "down" },
  { dx: -1, dy: 0, name: "left" },
  { dx: 1, dy: 0, name: "right" },
  { dx: -1, dy: -1, name: "up-left" },
  { dx: 1, dy: -1, name: "up-right" },
  { dx: -1, dy: 1, name: "down-left" },
  { dx: 1, dy: 1, name: "down-right" },
];

const getRandomRocket = () => {
  const directions = Object.values(ROCKET_INDICES);
  return directions[Math.floor(Math.random() * directions.length)];
};

export const isRocket = (val) => {
  return Object.values(ROCKET_INDICES).includes(val);
};

export const isRock = (val) => {
  return val === ROCK_INDEX;
};

export const getRocketDirection = (rocketVal) => {
  return ROCKET_DIRECTIONS[rocketVal - WILDCARD_INDEX - 1];
};

export const randInMap = () => {
  let rand = Math.random();
  if (rand < ROCKET_CHANCE) return getRandomRocket();
  rand = Math.random();
  if (rand < WILDCARD_CHANCE) return WILDCARD_INDEX;
  return Math.floor(
    Math.random() * (emojiMap.length - Object.keys(ROCKET_INDICES).length - 1),
  ); // Regular emojis
};

export const createStageBasedRandInMap = (stage) => {
  return () => {
    let rand = Math.random();

    // Only include rocks from stage 9 onwards
    if (stage >= 9 && rand < ROCK_CHANCE) {
      return ROCK_INDEX;
    }

    // Only include rockets from stage 6 onwards
    if (stage >= 6 && rand < ROCKET_CHANCE) {
      return getRandomRocket();
    }

    rand = Math.random();
    // Only include wildcards from stage 3 onwards
    if (stage >= 3 && rand < WILDCARD_CHANCE) {
      return WILDCARD_INDEX;
    }

    return Math.floor(
      Math.random() *
        (emojiMap.length - Object.keys(ROCKET_INDICES).length - 2), // -2 for wildcard and rock
    ); // Regular emojis
  };
};
