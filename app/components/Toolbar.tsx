import React from 'react'

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react'
import {
  Eraser,
  Github,
  Link2,
  Navigation,
  Pen,
  PenOff,
  PieChart,
  Play,
  Settings,
} from 'lucide-react'

import type { AwarenessState } from '@/app/interfaces/awareness'

interface Props {
  onImport?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onExport?: () => void
  onInvite?: () => void
  onRun?: () => void
  running?: boolean
  users: Array<[number, AwarenessState]>
  onFollow: (clientId: string | null) => void
  following: string | null
  followingName?: string | null
  onManageRoles?: () => void
  onOpenSettings?: () => void
  onOpenAnalytics?: () => void
  onEndSession?: () => void
  onLeaveSession?: () => void
  isOwner?: boolean
  drawingTool?: 'pen' | 'eraser'
  onChangeDrawingTool?: (tool: 'pen' | 'eraser') => void
  overlayActive?: boolean
  onToggleOverlay?: () => void
  onGitHubImport?: () => void
}

export default function Toolbar({
  onRun,
  running,
  onInvite,
  onImport,
  onExport,
  onManageRoles,
  onOpenSettings,
  onOpenAnalytics,
  onEndSession,
  onLeaveSession,
  isOwner,
  drawingTool,
  onChangeDrawingTool,
  overlayActive,
  onToggleOverlay,
  onGitHubImport,
}: Props) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onImport) {
      onImport(e)
    }
  }

  return (
    <div className="bg-[#1b1b1b] border-b border-zinc-700">
      {/* Top row: file/help, run (centered), invite/roles/settings */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-2 h-[48px]">
        <div className="flex items-center gap-2 justify-self-start">
          <input
            id="toolbar-file-importer"
            type="file"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept=".js,.ts,.tsx,.jsx,.html,.css,.json,.md,.txt,.py"
          />
          <Dropdown>
            <DropdownTrigger>
              <Button className="bg-[#2c2c2c] hover:bg-[#4f4f4f]" size="sm">
                <span className="text-sm">File</span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Import or Export"
              selectionMode="single"
              onSelectionChange={(key) => {
                const k = key.currentKey?.toString()
                if (k === 'import') {
                  document.getElementById('toolbar-file-importer')?.click()
                } else if (k === 'export' && onExport) {
                  onExport()
                } else if (k === 'github-import' && onGitHubImport) {
                  onGitHubImport()
                }
              }}
            >
              <DropdownItem key="import">Import File</DropdownItem>
              <DropdownItem
                key="github-import"
                endContent={<Github size={16} />}
              >
                Import from GitHub
              </DropdownItem>
              <DropdownItem key="export">Export</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Button className="bg-[#2c2c2c] hover:bg-[#4f4f4f]" size="sm">
            <span className="text-sm">Help</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 justify-self-center">
          <Button color="success" size="sm" onPress={onRun} disabled={running}>
            <Play fill="black" size={14} />
            <span className="text-sm">{running ? 'Running...' : 'Run'}</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <Button
            className="bg-[#2c2c2c] hover:bg-[#4f4f4f]"
            size="sm"
            onPress={onManageRoles}
          >
            <Link2 size={16} />
            <span className="hidden sm:inline text-sm">Invite</span>
          </Button>
          <Button
            isIconOnly
            className={`bg-[#2c2c2c] hover:bg-[#4f4f4f] ${overlayActive ? 'bg-blue-600' : ''}`}
            size="sm"
            onPress={onToggleOverlay}
            aria-label="Toggle overlay drawing"
          >
            {overlayActive ? <Pen size={16} /> : <PenOff size={16} />}
          </Button>
          <Button
            isIconOnly
            className="bg-[#2c2c2c] hover:bg-[#4f4f4f]"
            size="sm"
            onPress={onOpenAnalytics}
            aria-label="Open analytics"
          >
            <PieChart size={16} />
          </Button>
          <Button
            isIconOnly
            className="bg-[#2c2c2c] hover:bg-[#4f4f4f]"
            size="sm"
            onPress={onOpenSettings}
          >
            <Settings fill="black" size={18} />
          </Button>
          {isOwner ? (
            <Button color="danger" size="sm" onPress={onEndSession}>
              <span className="text-sm">End session</span>
            </Button>
          ) : (
            <Button
              className="bg-[#2c2c2c] hover:bg-[#4f4f4f]"
              size="sm"
              onPress={onLeaveSession}
            >
              <span className="text-sm">Leave</span>
            </Button>
          )}
        </div>
      </div>

      {/* Second row: dedicated drawing toolbar */}
      <div className="flex justify-center items-center gap-2 px-4 py-2 ">
        <div className="flex items-center gap-1">
          <Button
            isIconOnly
            className={`bg-[#2c2c2c] hover:bg-[#4f4f4f] ${drawingTool === 'pen' ? 'bg-blue-600' : ''}`}
            size="sm"
            onPress={() => onChangeDrawingTool?.('pen')}
            aria-label="Pen"
          >
            <Pen size={16} />
          </Button>
          <Button
            isIconOnly
            className={`bg-[#2c2c2c] hover:bg-[#4f4f4f] ${drawingTool === 'eraser' ? 'bg-blue-600' : ''}`}
            size="sm"
            onPress={() => onChangeDrawingTool?.('eraser')}
            aria-label="Eraser"
          >
            <Eraser size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
