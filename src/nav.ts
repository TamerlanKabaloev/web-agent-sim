// import PF from 'pathfinding'

// @ts-ignore
export const GRID_SIZE = 0.5 
export const MAP_WIDTH = 40 
export const MAP_HEIGHT = 40 

export const toGrid = (val: number) => Math.floor((val + MAP_WIDTH / 2) / GRID_SIZE)
export const toWorld = (val: number) => (val * GRID_SIZE) - (MAP_WIDTH / 2) + (GRID_SIZE / 2)

export class NavigationGrid {
  constructor() {
    console.log("NavGrid initialized (Dummy Mode)")
  }

  updateObstacles(_walls: { x: number, z: number, width: number, length: number }[]) {
    // No-op
  }

  findPath(start: [number, number, number], end: [number, number, number]): [number, number][] {
    // Return direct line path for now to debug
    return [[start[0], start[2]], [end[0], end[2]]]
  }
}

export const navSystem = new NavigationGrid()
