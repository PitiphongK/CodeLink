import React from "react";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Link2, Play, Navigation, Settings } from "lucide-react";

interface Props {
  onImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport?: () => void;
  onInvite?: () => void;
  onRun?: () => void;
  running?: boolean;
  users: any[];
  onFollow: (clientId: string | null) => void;
  following: string | null;
  followingName?: string | null;
  onManageRoles?: () => void;
  isOwner?: boolean;
}

export default function Toolbar({ onRun, running, onInvite, onImport, onExport, users, onFollow, following, followingName, onManageRoles, isOwner }: Props) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onImport) {
      onImport(e);
    }
  };

  const handleFollow = (key: any) => {
    const selectedClientId = key.currentKey?.toString();
    if (selectedClientId) {
      if (selectedClientId === "__stop__") return; // handled by onPress
      if (following === selectedClientId) {
        onFollow(null); // Unfollow if already following
      } else {
        onFollow(selectedClientId);
      }
    }
  };

  return (
    <div className="flex flex-row items-center justify-between px-4 py-2 h-[48px] bg-[#1b1b1b] border-b border-gray-800">
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
            <Button className="bg-[#2c2c2c] hover:bg-[#4f4f4f]" size="sm" >
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
        <Button className="bg-[#2c2c2c] hover:bg-[#4f4f4f]" size="sm">
          <span className="text-sm">Help</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button color="success" size="sm" onPress={onRun} disabled={running}>
          <Play fill="black" size={14} />
          <span className="text-sm">{running ? 'Running...' : 'Run'}</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button className="bg-[#2c2c2c] hover:bg-[#4f4f4f]" size="sm" onPress={onInvite}>
          <Link2 size={16} />
          <span className="hidden sm:inline text-sm">Invite</span>
        </Button>
        <Button isIconOnly className="bg-[#2c2c2c] hover:bg-[#4f4f4f]" size="sm" onPress={onManageRoles}>
          <Navigation size={16} />
        </Button>
        <Button isIconOnly className="bg-[#2c2c2c] hover:bg-[#4f4f4f]" size="sm">
          <Settings fill="black" size={18} />
        </Button>
      </div>
    </div>
  );
}