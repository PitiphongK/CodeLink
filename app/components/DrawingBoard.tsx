'use client'
import React, { memo, useCallback, useRef, useState } from 'react'

import { nanoid } from 'nanoid'
import { getStroke } from 'perfect-freehand'
import * as Y from 'yjs'

import { Stroke } from '@/app/interfaces/drawing'
import { useStroke } from '../hooks/useStroke'
import { getSvgPathFromStroke } from '../utils/drawing'
import { useStrokes } from '../hooks/useStrokes'

interface DrawingBoardProps {
  ydoc: Y.Doc | null
  tool: 'pen' | 'eraser'
}

function DrawingBoard({ ydoc, tool }: DrawingBoardProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { points, startStroke, updateStroke, finishStroke } = useStroke()
  const { strokes, addStroke} = useStrokes(ydoc)

  /*
  Must convert cursor absolute coordinate to a shared svg coordinate before broadcast
  other clients need to transform svg coor to their own cursor coor.
  */
  const mapScreenToSvgCoordinate = (x: number, y: number) => {
    const svg = svgRef.current
    if (!svg) return { x, y }

    const point = svg.createSVGPoint()
    point.x = x
    point.y = y
    const ctm = svg.getScreenCTM()
    if (ctm) {
      return (
        point.matrixTransform(ctm.inverse())
      )
    }
    return {x, y}
  }
  
  const mapSvgCoordinateToScreen = (x: number, y: number) => {
    const svg = svgRef.current
    if (!svg) return { x, y }

    const point = svg.createSVGPoint()
    point.x = x
    point.y = y
    const ctm = svg.getScreenCTM()
    if (ctm) {
      return point.matrixTransform(ctm) // Note: NOT ctm.inverse()
    }
    return { x, y }
  }

  // useCallback prevents unnecessary re-creating new handler functions so the memoize component dont get rerendered
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      const rect = e.currentTarget.getBoundingClientRect()
      const point = mapScreenToSvgCoordinate(e.clientX, e.clientY)
      startStroke(point.x , point.y, e.pressure)
    },
    [startStroke] // includes any component scope props, states, variables, *function (in this case) used inside this function
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.buttons !== 1) return // Skip if not using left mouse
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const point = mapScreenToSvgCoordinate(e.clientX, e.clientY)
      updateStroke(point.x, point.y, e.pressure)
    },
    [updateStroke]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId)
      const stroke: Stroke = {
        id: nanoid(),
        points: points,
        user: "placeholder",
        color: "placeholder",
      }
      addStroke(stroke)
      finishStroke()
    },
    [points, addStroke, finishStroke]
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
      ref={svgRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        touchAction: 'none',
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
      }}
    >
      {points && <path d={pathData} />}
      {strokes.map((stroke) => {
        const pathData = getSvgPathFromStroke(getStroke(stroke.points, STROKE_OPTIONS))
        return (
          <path key={stroke.id} d={pathData} />
        )
      })}
    </svg>
  )
}

// Only re-render when dependency is updated.
// Prevents re-render when parent states change
export default memo(DrawingBoard)
