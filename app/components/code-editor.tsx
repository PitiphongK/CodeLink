'use client';

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'
import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';
import { useEffect } from 'react';

// Yjs document holds the shared data
const ydoc = new Y.Doc()
// Connect to a public demo websocket server
const provider = new WebsocketProvider('wss://demos.yjs.dev/ws', 'monaco-room-demo', ydoc)
// Define a text type on the Yjs document
// A shared data structure for representing text for syncing with Monaco Editor
const ytext = ydoc.getText('monaco')

const awareness = provider.awareness
awareness.setLocalStateField('user', {
  name: 'User ' + Math.floor(Math.random() * 100),
  color: '#' + Math.floor(Math.random()*16777215).toString(16),
})

export default function CodeEditor() {
  
  useEffect(() => {
    console.log('Awareness states:', awareness.getStates().values())
  }, [awareness])
  // Create a new binding for Yjs and Monaco Editor
  const handleEditorDidMount = (editor: any) => {
    new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );
  };

  return (
    <div className="h-[70vh]">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        defaultValue={`// Hello CodeLink 👋
function add(a, b) { return a + b }`}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
}
