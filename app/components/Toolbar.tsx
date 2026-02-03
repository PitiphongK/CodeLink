import React, { useState } from 'react'

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
  Menu,
  Navigation,
  Pen,
  PenOff,
  PieChart,
  Play,
  Settings,
  X,
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
  myRole?: 'driver' | 'navigator' | 'none'
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
  myRole,
  drawingTool,
  onChangeDrawingTool,
  overlayActive,
  onToggleOverlay,
  onGitHubImport,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onImport) {
      onImport(e)
    }
  }

  return (
    <>
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-surface-primary border-r border-border-strong z-50 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-strong">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button
              isIconOnly
              size="sm"
              className="bg-transparent hover:bg-surface-elevated"
              onPress={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </Button>
          </div>

          {/* Sidebar Content */}
          <div className="flex flex-col p-2 gap-1">
            <input
              id="sidebar-file-importer"
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept=".js,.ts,.tsx,.jsx,.html,.css,.json,.md,.txt,.py"
            />

            {/* File Section - Mobile only */}
            <div className="py-2 md:hidden">
              <p className="text-xs text-gray-500 px-3 mb-2">FILE</p>
              <Button
                className="w-full justify-start bg-transparent hover:bg-surface-elevated text-text-primary"
                size="sm"
                onPress={() => {
                  if (myRole !== 'navigator') {
                    document.getElementById('sidebar-file-importer')?.click()
                  }
                }}
                isDisabled={myRole === 'navigator'}
              >
                <span className="text-sm">Import File</span>
              </Button>
              <Button
                className="w-full justify-start bg-transparent hover:bg-surface-elevated text-text-primary"
                size="sm"
                onPress={() => {
                  if (myRole !== 'navigator' && onGitHubImport) {
                    onGitHubImport()
                    setSidebarOpen(false)
                  }
                }}
                isDisabled={myRole === 'navigator'}
              >
                <Github size={16} />
                <span className="text-sm">Import from GitHub</span>
              </Button>
              <Button
                className="w-full justify-start bg-transparent hover:bg-surface-elevated text-text-primary"
                size="sm"
                onPress={() => {
                  if (onExport) {
                    onExport()
                    setSidebarOpen(false)
                  }
                }}
              >
                <span className="text-sm">Export</span>
              </Button>
            </div>

            {/* Tools Section */}
            <div className="py-2">
              <p className="text-xs text-gray-500 px-3 mb-2">TOOLS</p>
              {/* Invite - Mobile only */}
              <Button
                className="w-full justify-start bg-transparent hover:bg-surface-elevated text-text-primary md:hidden"
                size="sm"
                onPress={() => {
                  if (onManageRoles) {
                    onManageRoles()
                    setSidebarOpen(false)
                  }
                }}
              >
                <Link2 size={16} />
                <span className="text-sm">Invite</span>
              </Button>
              <Button
                className="w-full justify-start bg-transparent hover:bg-surface-elevated text-text-primary"
                size="sm"
                onPress={() => {
                  if (onToggleOverlay) {
                    onToggleOverlay()
                  }
                }}
              >
                {overlayActive ? <Pen size={16} /> : <PenOff size={16} />}
                <span className="text-sm">Drawing Overlay</span>
              </Button>
              <Button
                className={`w-full justify-start bg-transparent hover:bg-surface-elevated text-text-primary ${drawingTool === 'pen' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                size="sm"
                onPress={() => onChangeDrawingTool?.('pen')}
              >
                <Pen size={16} />
                <span className="text-sm">Pen</span>
              </Button>
              <Button
                className={`w-full justify-start bg-transparent hover:bg-surface-elevated text-text-primary ${drawingTool === 'eraser' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                size="sm"
                onPress={() => onChangeDrawingTool?.('eraser')}
              >
                <Eraser size={16} />
                <span className="text-sm">Eraser</span>
              </Button>
              {/* Analytics - Mobile only */}
              <Button
                className="w-full justify-start bg-transparent hover:bg-surface-elevated text-text-primary md:hidden"
                size="sm"
                onPress={() => {
                  if (onOpenAnalytics) {
                    onOpenAnalytics()
                    setSidebarOpen(false)
                  }
                }}
              >
                <PieChart size={16} />
                <span className="text-sm">Analytics</span>
              </Button>
              <Button
                className="w-full justify-start bg-transparent hover:bg-surface-elevated text-text-primary"
                size="sm"
                onPress={() => {
                  if (onOpenSettings) {
                    onOpenSettings()
                    setSidebarOpen(false)
                  }
                }}
              >
                <Settings size={18} />
                <span className="text-sm">Settings</span>
              </Button>
            </div>

            {/* Help Section */}
            <div className="py-2">
              <p className="text-xs text-gray-500 px-3 mb-2">HELP</p>
              <Button
                className="w-full justify-start bg-transparent hover:bg-surface-elevated text-text-primary"
                size="sm"
              >
                <span className="text-sm">(To be implemented)</span>
              </Button>
            </div>

            {/* Session Actions */}
            <div className="py-2 mt-auto">
              <p className="text-xs text-gray-500 px-3 mb-2">SESSION</p>
              {isOwner ? (
                <Button
                  className="w-full justify-start bg-transparent hover:bg-red-20 dark:hover:bg-red-500"
                  size="sm"
                  onPress={() => {
                    if (onEndSession) {
                      onEndSession()
                      setSidebarOpen(false)
                    }
                  }}
                >
                  <span className="text-sm">End Session</span>
                </Button>
              ) : (
                <Button
                  className="w-full justify-start bg-transparent hover:bg-surface-elevated text-text-primary"
                  size="sm"
                  onPress={() => {
                    if (onLeaveSession) {
                      onLeaveSession()
                      setSidebarOpen(false)
                    }
                  }}
                >
                  <span className="text-sm">Leave</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-primary border-b border-border-strong">
        {/* Top row: hamburger menu, desktop menus, run button centered, desktop right items */}
        <div className="flex items-center justify-between px-4 py-2 h-12">
          {/* Left: Hamburger Menu + Desktop File/Help */}
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              className="bg-transparent hover:bg-surface-elevated text-text-primary"
              size="sm"
              onPress={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </Button>

            {/* Desktop only: File dropdown */}
            <div className="hidden md:flex items-center gap-2">
              <input
                id="toolbar-file-importer"
                type="file"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept=".js,.ts,.tsx,.jsx,.html,.css,.json,.md,.txt,.py"
              />
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    className="bg-surface-secondary hover:bg-surface-elevated text-text-primary border border-btn-border"
                    size="sm"
                  >
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
                  <DropdownItem key="import" isDisabled={myRole === 'navigator'}>
                    Import File
                  </DropdownItem>
                  <DropdownItem
                    key="github-import"
                    endContent={<Github size={16} />}
                    isDisabled={myRole === 'navigator'}
                  >
                    Import from GitHub
                  </DropdownItem>
                  <DropdownItem key="export">Export</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>

          {/* Center: Run Button */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Button
              className="bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-300 border border-btn-border"
              size="sm"
              onPress={onRun}
              disabled={running}
            >
              <Play fill="currentColor" size={14} />
              <span className="text-sm">{running ? 'Running...' : 'Run'}</span>
            </Button>
          </div>

          {/* Right: Desktop Invite, Analytics */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              className="bg-surface-secondary hover:bg-surface-elevated text-text-primary border border-btn-border"
              size="sm"
              onPress={onManageRoles}
            >
              <Link2 size={16} />
              <span className="text-sm">Invite</span>
            </Button>
            <Button
              isIconOnly
              className="bg-surface-secondary hover:bg-surface-elevated text-text-primary border border-btn-border"
              size="sm"
              onPress={onOpenAnalytics}
              aria-label="Open analytics"
            >
              <PieChart size={16} />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
