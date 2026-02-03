/**
 * Hook for file import/export operations
 */

import { useCallback } from 'react'
import { addToast } from '@heroui/toast'

import { languageExtensions, type Languages } from '@/app/interfaces/languages'

interface UseFileOperationsOptions {
  /** Reference to the Monaco editor instance */
  editorRef: React.RefObject<import('monaco-editor').editor.IStandaloneCodeEditor | null>
  /** Current language for file extension */
  language: Languages
  /** Room ID for file naming */
  roomId: string
}

interface UseFileOperationsReturn {
  /** Export editor content to a file */
  handleExport: () => void
  /** Import content from a local file */
  handleFileImport: (event: React.ChangeEvent<HTMLInputElement>) => void
  /** Import content from a GitHub repository */
  handleGitHubImport: (repoUrl: string, filePath?: string) => Promise<void>
}

/**
 * Manages file import and export operations for the editor
 */
export function useFileOperations({
  editorRef,
  language,
  roomId,
}: UseFileOperationsOptions): UseFileOperationsReturn {
  // Export editor content to file
  const handleExport = useCallback(() => {
    if (!editorRef.current) return

    const fileExtension = languageExtensions[language] || '.txt'
    const content = editorRef.current.getValue()
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `codelink-room-${roomId}${fileExtension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [editorRef, language, roomId])

  // Import content from local file
  const handleFileImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file && editorRef.current) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          editorRef.current?.setValue(content)
        }
        reader.readAsText(file)
      }
    },
    [editorRef]
  )

  // Import content from GitHub
  const handleGitHubImport = useCallback(
    async (repoUrl: string, filePath?: string) => {
      try {
        const response = await fetch('/api/github/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl, filePath }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to import from GitHub')
        }

        const data = await response.json()

        if (data.type === 'file' && editorRef.current) {
          editorRef.current.setValue(data.content)

          addToast({
            title: 'Import successful',
            description: `Imported ${data.filename} from GitHub`,
            color: 'success',
            variant: 'solid',
            timeout: 3000,
          })
        } else if (data.type === 'list') {
          addToast({
            title: 'Choose a file',
            description: 'Please specify a file path in the repository',
            color: 'warning',
            variant: 'solid',
            timeout: 4000,
          })
        }
      } catch (error) {
        console.error('GitHub import error:', error)
        throw error
      }
    },
    [editorRef]
  )

  return {
    handleExport,
    handleFileImport,
    handleGitHubImport,
  }
}
