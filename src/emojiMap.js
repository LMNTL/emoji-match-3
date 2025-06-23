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
];
const WILDCARD_CHANCE = 0.1;
export const WILDCARD_INDEX = 6;
const ROCKET_CHANCE = 0.03;
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
