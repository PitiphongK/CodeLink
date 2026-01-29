/*
Manage current stroke state
*/

import { useCallback, useState } from 'react'

export function useStroke() {
  const [points, setPoints] = useState<number[][]>([])

  const startStroke = useCallback(
    (x: number, y: number, pressure: number) => {
      setPoints([[x, y, pressure]])
    },
    []
  )

  const updateStroke = useCallback(
    (x: number, y: number, pressure: number) => {
      setPoints((points) => [...points, [x, y, pressure]])
    },
    [] // does not require dependency 'points' because setPoints takes current state of points
  )

  const finishStroke = useCallback(
    () => {
      setPoints([])
    },
    []
  )

  return {
    points,
    startStroke,
    updateStroke,
    finishStroke,
  }
}
