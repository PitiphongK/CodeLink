import React from "react";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { UploadCloud, Download, Link2, Play } from "lucide-react";

interface Props {
  onImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport?: () => void;
  onInvite?: () => void;
  onRun?: () => void;
  running?: boolean;
}

export default function Toolbar({ onRun, running, onInvite, onImport, onExport }: Props) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onImport) {
      onImport(e);
    }
  };

  return (
    <div className="flex flex-row items-center justify-between px-4 py-2 h-[48px] bg-gray-950 border-b border-gray-800">
      <input
        id="toolbar-file-importer"
        type="file"
        onChange={handleFileSelect}
        style={{ display: "none" }}
        accept=".js,.ts,.tsx,.jsx,.html,.css,.json,.md,.txt,.py"
      />

      <div className="flex items-center gap-2">
        <Dropdown>
          <DropdownTrigger>
            <Button className="bg-gray-800 hover:bg-gray-700" size="sm" >
              <span className="text-sm">File</span>
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Import or Export"
            selectionMode="single"
            onSelectionChange={(key) => {
              const k = key.currentKey?.toString();
              if (k === "import") {
                document.getElementById("toolbar-file-importer")?.click();
              } else if (k === "export" && onExport) {
                onExport();
              }
            }}
          >
            <DropdownItem key="import">Import</DropdownItem>
            <DropdownItem key="export">Export</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      <div className="flex items-center gap-2">
        <Button color="success" size="sm" onPress={onRun} disabled={running}>
          <Play size={14} />
          <span className="text-sm">{running ? 'Running...' : 'Run'}</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button color="default" size="sm" onPress={onInvite}>
          <Link2 size={16} />
          <span className="hidden sm:inline text-sm">Invite</span>
        </Button>
      </div>
    </div>
  );
}