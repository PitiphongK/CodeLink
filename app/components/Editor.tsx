'use client';
import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { Languages, languageOptions } from '@/app/interfaces/languages';
import EditorOverlayDrawing from "@/app/components/EditorOverlayDrawing";

type Props = {
  roomId: string;
  ydoc: Y.Doc | null;
  provider: WebsocketProvider | null;
  editorRef: React.MutableRefObject<import('monaco-editor').editor.IStandaloneCodeEditor | null>;
  language: Languages;
  setLanguage: (language: Languages) => void;
};

export default function EditorComponent({ roomId, ydoc, provider, editorRef, language, setLanguage }: Props) {

  const handleMount = (editor: import('monaco-editor').editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (editorRef.current && ydoc && provider) {
      const ytext = ydoc.getText('monaco');

      // Dynamically import y-monaco and create the binding
      import('y-monaco').then(({ MonacoBinding }) => {
        const model = editorRef.current?.getModel();
        if (model) {
          new MonacoBinding(
            ytext,
            model,
            new Set([editorRef.current!]),
            provider.awareness
          );
        }
      });

      // Set initial value if the document is empty
      if (ytext.length === 0) {
        ytext.insert(0, `// Room: ${roomId}\nfunction add(a, b) { return a + b }\n`);
      }
    }
  }, [editorRef, ydoc, provider, roomId]);

  return (
    <div className="flex-1 relative h-full">
      <Editor
        height="100%"
        language={language}
        theme="vs-dark"
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          fontSize: 14,
        }}
        onMount={handleMount}
      />
      {/* overlay drawing component sits on top of the editor area */}
      {/* <EditorOverlayDrawing ydoc={ydoc} /> */}
      <div className='absolute bottom-4 right-4 z-10'>
        <Dropdown>
          <DropdownTrigger>
            <Button className="capitalize" variant="bordered">
              {language}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            disallowEmptySelection
            aria-label="Language selection"
            selectedKeys={language}
            selectionMode="single"
            variant="flat"
            onSelectionChange={(key) => {
              const selected = key.currentKey?.toString() as Languages;
              setLanguage(selected);
            }}
          >
            {(languageOptions.map((option) => (
              <DropdownItem key={option.value}>{option.label}</DropdownItem>
            )) as unknown as any)}
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
}
