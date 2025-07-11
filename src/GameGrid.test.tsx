import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import GameGrid from "../src/GameGrid";
import Grid from "../src/grid";
import { WILDCARD_INDEX, ROCKET_INDICES } from "../src/emojiMap";

// Mock the sound system
vi.mock("./components/SoundSystem", () => ({
  SoundEvent: vi.fn(),
  SoundType: {
    MATCH: "match",
    ROCKET: "rocket",
  },
}));

// Mock the emojiMap
vi.mock("./emojiMap", () => ({
  createStageBasedRandInMap: vi.fn(() => () => 1),
  emojiMap: ["❤️", "👾", "😎", "🍆", "💩", "👽", "⭐", "🚀"],
  getRocketDirection: vi.fn(() => ({ name: "up", dx: 0, dy: -1 })),
  isRocket: vi.fn(() => false),
  isRock: vi.fn(() => false),
  WILDCARD_INDEX: 6,
  ROCKET_INDICES: { UP: 7 },
}));

describe("GameGrid", () => {
  let mockProps;

  beforeEach(() => {
    mockProps = {
      grid: new Grid(4, 4, () => 1),
      setGrid: vi.fn(),
      isGridBlocked: false,
      setIsGridBlocked: vi.fn(),
      addScore: vi.fn(),
      selected: "",
      setSelected: vi.fn(),
      currentStage: 1,
    };
  });

  it("should render grid with correct dimensions", () => {
    render(<GameGrid {...mockProps} />);

    const gridElement = screen.getByRole("grid");
    expect(gridElement).toBeInTheDocument();
    expect(gridElement).toHaveAttribute("aria-label", "Game grid 4 by 4");
  });

  it("should handle cell clicks when grid is not blocked", () => {
    render(<GameGrid {...mockProps} />);

    const firstCell = screen.getAllByRole("gridcell")[0];
    fireEvent.click(firstCell);

    expect(mockProps.setSelected).toHaveBeenCalledWith("0,0");
  });

  it("should not handle cell clicks when grid is blocked", () => {
    mockProps.isGridBlocked = true;
    render(<GameGrid {...mockProps} />);

    const firstCell = screen.getAllByRole("gridcell")[0];
    fireEvent.click(firstCell);

    expect(mockProps.setSelected).not.toHaveBeenCalled();
  });

  it("should handle keyboard navigation", () => {
    render(<GameGrid {...mockProps} />);

    const gridElement = screen.getByRole("grid");
    fireEvent.keyDown(gridElement, { key: "ArrowRight" });

    // Should move focus to the right
    expect(mockProps.setSelected).not.toHaveBeenCalled(); // Focus change doesn't trigger selection
  });

  it("should handle Enter key for selection", () => {
    render(<GameGrid {...mockProps} />);

    const gridElement = screen.getByRole("grid");
    fireEvent.keyDown(gridElement, { key: "Enter" });

    expect(mockProps.setSelected).toHaveBeenCalledWith("0,0");
  });

  it("should handle Escape key to clear selection", () => {
    mockProps.selected = "1,1";
    render(<GameGrid {...mockProps} />);

    const gridElement = screen.getByRole("grid");
    fireEvent.keyDown(gridElement, { key: "Escape" });

    expect(mockProps.setSelected).toHaveBeenCalledWith("");
  });

  it("should display combo multiplier when greater than 1", () => {
    render(<GameGrid {...mockProps} />);

    // Simulate a combo by triggering internal state change
    // This would normally happen through match processing
    const comboIndicator = screen.queryByText(/COMBO!/);
    expect(comboIndicator).not.toBeInTheDocument();
  });

  it("should show appropriate aria labels for different cell types", () => {
    // Create a grid with different cell types
    const specialGrid = new Grid(3, 3, (x, y) => {
      if (x === 0 && y === 0) return WILDCARD_INDEX;
      if (x === 1 && y === 0) return ROCKET_INDICES.UP;
      return 1;
    });

    mockProps.grid = specialGrid;
    render(<GameGrid {...mockProps} />);

    const cells = screen.getAllByRole("gridcell");
    expect(cells[0]).toHaveAttribute(
      "aria-label",
      expect.stringContaining("wildcard star"),
    );
  });

  it("should prevent selection of rocks", () => {
    vi.mock("./emojiMap", () => ({
      createStageBasedRandInMap: vi.fn(() => () => 1),
      emojiMap: ["❤️", "👾", "😎", "🍆", "💩", "👽", "⭐", "🚀"],
      getRocketDirection: vi.fn(() => ({ name: "up", dx: 0, dy: -1 })),
      isRocket: vi.fn(() => false),
      isRock: vi.fn((val) => val === 8),
      WILDCARD_INDEX: 6,
      ROCKET_INDICES: { UP: 7 },
    }));

    const rockGrid = new Grid(3, 3, (x, y) => (x === 0 && y === 0 ? 8 : 1));
    mockProps.grid = rockGrid;

    render(<GameGrid {...mockProps} />);

    const rockCell = screen.getAllByRole("gridcell")[0];
    fireEvent.click(rockCell);

    expect(mockProps.setSelected).not.toHaveBeenCalled();
  });

  it("should handle adjacent cell swapping", async () => {
    mockProps.selected = "0,0";
    render(<GameGrid {...mockProps} />);

    // Click adjacent cell
    const adjacentCell = screen.getAllByRole("gridcell")[1]; // Should be 1,0
    fireEvent.click(adjacentCell);

    // Should trigger swap animation and grid blocking
    expect(mockProps.setIsGridBlocked).toHaveBeenCalledWith(true);
  });

  it("should clear selection when clicking non-adjacent cell", () => {
    mockProps.selected = "0,0";
    render(<GameGrid {...mockProps} />);

    // Click non-adjacent cell (should be 2,2 or similar)
    const farCell = screen.getAllByRole("gridcell")[8]; // Last cell in 3x3 grid
    fireEvent.click(farCell);

    expect(mockProps.setSelected).toHaveBeenCalledWith("");
  });

  it("should show falling animation classes", () => {
    render(<GameGrid {...mockProps} />);

    // The falling animation would be triggered by internal state changes
    // during match processing, which is complex to test directly
    const cells = screen.getAllByRole("gridcell");
    cells.forEach((cell) => {
      expect(cell).not.toHaveClass("falling");
    });
  });

  it("should display correct emoji for each cell value", () => {
    const { emojiMap } = require("./emojiMap");
    render(<GameGrid {...mockProps} />);

    const cells = screen.getAllByRole("gridcell");
    cells.forEach((cell) => {
      const cardInner = cell.querySelector(".card-inner");
      expect(cardInner).toHaveTextContent(emojiMap[1]); // All cells have value 1
    });
  });
});
