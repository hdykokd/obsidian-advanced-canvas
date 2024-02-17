import { BBox, Position } from "src/@types/Canvas"
import * as BBoxHelper from "src/utils/bbox-helper"

const DIRECTIONS = [
  { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
  { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: -1 },
] as const
const DIAGONAL_COST = Math.sqrt(2)

class Node {
  x: number
  y: number
  gCost: number
  hCost: number
  fCost: number
  parent: Node|null

  constructor(x: number, y: number) {
    this.x = x
    this.y = y

    this.gCost = 0
    this.hCost = 0
    this.fCost = 0
    this.parent = null
  }

  // Only check for x and y, not gCost, hCost, fCost, or parent
  inList(nodes: Node[]): boolean {
    return nodes.some(n => n.x === this.x && n.y === this.y)
  }
}

// Manhattan distance
function heuristic(node: Node, end: Node): number {
  return Math.abs(node.x - end.x) + Math.abs(node.y - end.y)
}

// Define a function to check if a position isn't inside any obstacle
function isValidPosition(node: Position, obstacles: BBox[]): boolean {
  return !obstacles.some(obstacle => BBoxHelper.intersectsBBox(node, obstacle))
}

// Define a function to calculate movement cost based on direction
function getMovementCost(direction: { dx: number; dy: number }): number {
  return direction.dx !== 0 && direction.dy !== 0 ? DIAGONAL_COST : 1
}

function getValidNeighbors(node: Node, obstacles: BBox[], gridResolution: number): Node[] {
  const neighbors: Node[] = []
  
  for (const direction of DIRECTIONS) {
    const neighbor = new Node(
      node.x + direction.dx * gridResolution, 
      node.y + direction.dy * gridResolution
    )
    neighbor.gCost = node.gCost + getMovementCost(direction)

    if (!isValidPosition(neighbor, obstacles)) continue

    neighbors.push(neighbor)
  }

  return neighbors
}

function reconstructPath(node: Node): Node[] {
  const path: Node[] = []
  while (node) {
    path.push(node)
    node = node.parent!
  }
  return path.reverse()
}

export function aStar(startPos: Position, endPos: Position, obstacles: BBox[], gridResolution: number): Position[] | null {
  // Round start and end positions to the nearest grid cell
  const start: Node = new Node(
    Math.round(startPos.x / gridResolution) * gridResolution,
    Math.round(startPos.y / gridResolution) * gridResolution
  )
  const end: Node = new Node(
    Math.round(endPos.x / gridResolution) * gridResolution,
    Math.round(endPos.y / gridResolution) * gridResolution
  )

  const openSet: Node[] = [start]
  const closedSet: Node[] = []

  while (openSet.length > 0) {
    // Find the node with the lowest fCost in the open set
    let current: Node|null = null
    let lowestFCost = Infinity

    for (const node of openSet) {
      if (node.fCost < lowestFCost) {
        current = node
        lowestFCost = node.fCost
      }
    }

    // No path found
    if (!current) return null

    // Remove the current node from the open set and add it to the closed set
    openSet.splice(openSet.indexOf(current), 1)
    closedSet.push(current)

    // Check if we have reached the end
    if (current.x === end.x && current.y === end.y) {
      return [startPos, ...reconstructPath(current), endPos]
    }

    // Expand neighbors
    for (const neighbor of getValidNeighbors(current, obstacles, gridResolution)) {
      if (neighbor.inList(closedSet)) continue

      // Calculate tentative gCost
      const tentativeGCost = current.gCost + getMovementCost({
        dx: neighbor.x - current.x,
        dy: neighbor.y - current.y,
      })

      // Check if neighbor is not already in the open set or if the new gCost is lower
      if (!neighbor.inList(openSet) || tentativeGCost < neighbor.gCost) {
        neighbor.parent = current
        neighbor.gCost = tentativeGCost
        neighbor.hCost = heuristic(neighbor, end)
        neighbor.fCost = neighbor.gCost + neighbor.hCost

        // Add neighbor to the open set
        openSet.push(neighbor)
      }
    }
  }

  // No path found
  return null
}