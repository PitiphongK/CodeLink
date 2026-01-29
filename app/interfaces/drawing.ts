export interface Stroke {
  id: string
  points: (number[] | { x: number; y: number; pressure?: number | undefined; })[]
  user: string
  color: string
  thickness?: number
  timestamp?: number
}
