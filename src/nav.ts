import PF from 'pathfinding'

// Map dimensions (in simulation units)
export const GRID_SIZE = 0.5 // Size of one grid cell in meters
export const MAP_WIDTH = 40 // total width covered by grid
export const MAP_HEIGHT = 40 // total height (depth) covered by grid

// Convert world coordinate to grid coordinate
export const toGrid = (val: number) => Math.floor((val + MAP_WIDTH / 2) / GRID_SIZE)

// Convert grid coordinate to world coordinate (center of cell)
export const toWorld = (val: number) => (val * GRID_SIZE) - (MAP_WIDTH / 2) + (GRID_SIZE / 2)

export class NavigationGrid {
  private grid: PF.Grid
  private finder: PF.AStarFinder

  constructor() {
    const width = Math.ceil(MAP_WIDTH / GRID_SIZE)
    const height = Math.ceil(MAP_HEIGHT / GRID_SIZE)
    this.grid = new PF.Grid(width, height)
    
    // Allow diagonal movement
    this.finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    })
  }

  updateObstacles(walls: { x: number, z: number, width: number, length: number }[]) {
    // Reset grid
    const width = Math.ceil(MAP_WIDTH / GRID_SIZE)
    const height = Math.ceil(MAP_HEIGHT / GRID_SIZE)
    this.grid = new PF.Grid(width, height)

    // Mark walls as unwalkable
    walls.forEach(wall => {
      // Convert wall center and size to grid range
      const startX = toGrid(wall.x - wall.width / 2)
      const endX = toGrid(wall.x + wall.width / 2)
      const startZ = toGrid(wall.z - wall.length / 2)
      const endZ = toGrid(wall.z + wall.length / 2)

      for (let x = startX; x <= endX; x++) {
        for (let z = startZ; z <= endZ; z++) {
          if (this.grid.isInside(x, z)) {
            this.grid.setWalkableAt(x, z, false)
          }
        }
      }
    })
  }

  findPath(start: [number, number, number], end: [number, number, number]): [number, number][] {
    const startX = toGrid(start[0])
    const startZ = toGrid(start[2])
    const endX = toGrid(end[0])
    const endZ = toGrid(end[2])

    if (!this.grid.isInside(startX, startZ) || !this.grid.isInside(endX, endZ)) {
      return []
    }

    // Clone grid because finder modifies it
    const gridBackup = this.grid.clone()
    const path = this.finder.findPath(startX, startZ, endX, endZ, gridBackup)
    
    // Convert back to world coordinates and smooth slightly
    return PF.Util.compressPath(path).map(([x, z]) => [toWorld(x), toWorld(z)])
  }
}

export const navSystem = new NavigationGrid()





