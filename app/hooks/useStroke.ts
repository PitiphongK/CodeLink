import { useCallback, useState } from 'react'

export function useStroke() {
  const [points, setPoints] = useState<number[][]>([])

  const addPoint = useCallback(
    (x: number, y: number, pressure: number) => {
      setPoints([[x, y, pressure]])
    },
    [points]
  )

  const updatePoints = useCallback(
    (x: number, y: number, pressure: number) => {
      setPoints([...points, [x, y, pressure]])
    },
    [points]
  )

  const finishStroke = useCallback(
    () => {
      setPoints([])
    },
    [points]
  )

  return {
    addPoint,
    updatePoints,
    finishStroke,
  }
}
