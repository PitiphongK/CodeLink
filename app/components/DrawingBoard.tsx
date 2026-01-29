'use client'
import React, { memo, useCallback, useState } from 'react'

import { nanoid } from 'nanoid'
import { getStroke } from 'perfect-freehand'
import * as Y from 'yjs'

import { Stroke } from '@/app/interfaces/drawing'

import { useStroke } from '../hooks/useStroke'
import { getSvgPathFromStroke } from '../utils/drawing'

interface DrawingBoardProps {
  ydoc: Y.Doc | null
  tool: 'pen' | 'eraser'
}

function DrawingBoard({ ydoc, tool }: DrawingBoardProps) {
  const { addPoint, updatePoints, finishStroke } = useStroke()

  const [strokes, setStrokes] = useState<Stroke[]>([])
  // const trackStroke = useRef<>

  // useCallback prevents unnecessary re-creating new handler functions so the memoize component dont get rerendered
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      // calculates relative coordinate
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      addPoint(x, y, e.pressure)
    },
    [] // includes any component scope props, states, variables used inside this function
  ) 

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.buttons !== 1) return // Skip if not using left mouse
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      updatePoints(x, y, e.pressure)
    },
    []
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId)
      finishStroke()
    },
    []
  )

  const STROKE_OPTIONS = {
    size: 16,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  }

  const stroke = getStroke(points, STROKE_OPTIONS)
  const pathData = getSvgPathFromStroke(stroke)
  return (
    <svg
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      style={{
        touchAction: 'none',
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
      }}
    >
      {points && <path d={pathData} />}
    </svg>
  )
}

// Only re-render when dependency is updated.
// Prevents re-render when parent states change
export default memo(DrawingBoard)
