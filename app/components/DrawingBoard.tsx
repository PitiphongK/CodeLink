
'use client'
import React, { memo, useCallback, useRef, useState } from 'react'

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Slider,
  Tooltip,
} from '@heroui/react'
import { Minus, Palette, Pencil, Plus } from 'lucide-react'

import { nanoid } from 'nanoid'
import { getStroke } from 'perfect-freehand'
import * as Y from 'yjs'

import { Stroke } from '@/app/interfaces/drawing'
import { useStroke } from '../hooks/useStroke'
import { useStrokes } from '../hooks/useStrokes'
import { getSvgPathFromStroke } from '../utils/drawing'

interface DrawingBoardProps {
  ydoc: Y.Doc | null
  tool: 'pen' | 'eraser'
  onToolChange?: (tool: 'pen' | 'eraser') => void
}

type ColorType = '#000000' | '#ef4444' | '#22c55e' | '#3b82f6'

const COLORS: { value: ColorType; label: string; tailwind: string }[] = [
  { value: '#000000', label: 'Black', tailwind: 'bg-black' },
  { value: '#ef4444', label: 'Red', tailwind: 'bg-red-500' },
  { value: '#22c55e', label: 'Green', tailwind: 'bg-green-500' },
  { value: '#3b82f6', label: 'Blue', tailwind: 'bg-blue-500' },
]

type DrawingToolbarProps = {
  selectedTool: 'pen'
  onToolChange: (tool: 'pen') => void
  selectedColor: ColorType
  onColorChange: (color: ColorType) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
}

const ToolbarControls = ({
  selectedTool,
  onToolChange,
  selectedColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
}: DrawingToolbarProps) => {
  return (
    <div
      className="flex flex-col gap-3 p-4"
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="flex gap-4 justify-center">
        {COLORS.map((color) => (
          <Tooltip key={color.value} content={color.label}>
            <button
              type="button"
              draggable={false}
              onClick={() => onColorChange(color.value)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${color.tailwind} ${
                selectedColor === color.value
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-transparent hover:scale-110'
              }`}
              aria-label={`Select ${color.label}`}
            />
          </Tooltip>
        ))}
      </div>

      <div className="px-1">
        <Slider
          size="sm"
          step={1}
          maxValue={50}
          minValue={1}
          aria-label="Brush Size"
          value={brushSize}
          onChange={(val) => onBrushSizeChange(val as number)}
          startContent={<Minus size={10} className="text-default-900" />}
          endContent={<Plus size={10} className="text-default-900" />}
          className="max-w-40"
        />
      </div>

      <div className="flex gap-2 justify-center">
        <Tooltip content="Pen">
          <Button
            isIconOnly
            size="sm"
            variant={selectedTool === 'pen' ? 'solid' : 'light'}
            color={selectedTool === 'pen' ? 'primary' : 'default'}
            onPress={() => onToolChange('pen')}
          >
            <Pencil size={16} />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}

export const DrawingToolbar = (props: DrawingToolbarProps) => {
  return (
    <>
      <div className="hidden md:flex absolute top-4 right-4 z-50 bg-surface-primary/80 backdrop-blur-md shadow-lg border border-border-subtle rounded-xl">
        <ToolbarControls {...props} />
      </div>

      <div className="md:hidden absolute top-4 right-4 z-50">
        <Popover placement="left-start" offset={10} showArrow>
          <PopoverTrigger>
            <Button
              isIconOnly
              color="primary"
              variant="shadow"
              size="lg"
              className="rounded-full"
              aria-label="Open Drawing Tools"
            >
              <Palette size={24} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <ToolbarControls {...props} />
          </PopoverContent>
        </Popover>
      </div>
    </>
  )
}

function DrawingBoard({ ydoc, tool, onToolChange }: DrawingBoardProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const isDrawingRef = useRef(false)
  const { points, startStroke, updateStroke, finishStroke } = useStroke()
  const { strokes, addStroke } = useStrokes(ydoc)
  const [selectedColor, setSelectedColor] = useState<ColorType>('#000000')
  const [brushSize, setBrushSize] = useState(12)

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
  
  // useCallback prevents unnecessary re-creating new handler functions so the memoize component dont get rerendered
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (tool !== 'pen') return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      isDrawingRef.current = true
      const point = mapScreenToSvgCoordinate(e.clientX, e.clientY)
      startStroke(point.x, point.y, e.pressure)
    },
    [startStroke, tool]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDrawingRef.current) return
      const point = mapScreenToSvgCoordinate(e.clientX, e.clientY)
      updateStroke(point.x, point.y, e.pressure)
    },
    [updateStroke]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDrawingRef.current) return
      isDrawingRef.current = false
      e.currentTarget.releasePointerCapture(e.pointerId)
      const stroke: Stroke = {
        id: nanoid(),
        points: points,
        user: 'placeholder',
        color: selectedColor,
        thickness: brushSize,
      }
      addStroke(stroke)
      finishStroke()
    },
    [points, addStroke, finishStroke, selectedColor, brushSize]
  )

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDrawingRef.current) return
      isDrawingRef.current = false
      e.currentTarget.releasePointerCapture(e.pointerId)
      finishStroke()
    },
    [finishStroke]
  )

  const STROKE_OPTIONS = {
    size: brushSize,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  }

  const stroke = getStroke(points, STROKE_OPTIONS)
  const pathData = getSvgPathFromStroke(stroke)
  return (
    <div className="relative w-full h-full">
      <DrawingToolbar
        selectedTool="pen"
        onToolChange={() => onToolChange?.('pen')}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
      />
      <svg
        ref={svgRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        onLostPointerCapture={handlePointerCancel}
        onDragStart={(e) => e.preventDefault()}
        style={{
          touchAction: 'none',
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          cursor: 'crosshair',
        }}
      >
        {points && (
          <path d={pathData} fill={selectedColor} stroke="none" />
        )}
        {strokes.map((stroke) => {
          const strokeSize = stroke.thickness ?? 16
          const strokeColor = stroke.color ?? '#000000'
          const strokePath = getSvgPathFromStroke(
            getStroke(stroke.points, {
              ...STROKE_OPTIONS,
              size: strokeSize,
            })
          )
          return (
            <path key={stroke.id} d={strokePath} fill={strokeColor} stroke="none" />
          )
        })}
      </svg>
    </div>
  )
}

// Only re-render when dependency is updated.
// Prevents re-render when parent states change
export default memo(DrawingBoard)
