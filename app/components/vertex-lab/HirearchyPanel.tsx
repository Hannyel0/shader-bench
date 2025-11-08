"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Box,
  Circle,
  Square,
  Cylinder as CylinderIcon,
  ChevronRight,
  Search,
  X,
  Folder,
  FolderOpen,
  Lock,
  Unlock,
  Edit2,
} from "lucide-react";
import {
  SceneObject,
  GeometryType,
  createSceneObject,
  getRootObjects,
  getChildren,
  canReparent,
} from "./SceneManager";

interface HierarchyPanelProps {
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (object: SceneObject) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleExpanded?: (id: string) => void;
  onToggleLocked?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onReparent?: (childId: string, newParentId: string | null) => void;
}

interface TreeNodeProps {
  object: SceneObject;
  allObjects: SceneObject[];
  selectedId: string | null;
  depth: number;
  isLastChild: boolean;
  parentIsLastChild: boolean[];
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleExpanded: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: (targetId: string) => void;
  draggedId: string | null;
  dropTargetId: string | null;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  object,
  allObjects,
  selectedId,
  depth,
  isLastChild,
  parentIsLastChild,
  onSelect,
  onRemove,
  onDuplicate,
  onToggleVisibility,
  onToggleExpanded,
  onToggleLocked,
  onRename,
  onDragStart,
  onDragOver,
  onDrop,
  draggedId,
  dropTargetId,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamingValue, setRenamingValue] = useState(object.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const children = getChildren(allObjects, object.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedId === object.id;
  const isDragging = draggedId === object.id;
  const isDropTarget = dropTargetId === object.id;

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameStart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRenamingValue(object.name);
    setIsRenaming(true);
  };

  const handleRenameComplete = () => {
    if (renamingValue.trim() && renamingValue !== object.name) {
      onRename(object.id, renamingValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameComplete();
    } else if (e.key === "Escape") {
      setRenamingValue(object.name);
      setIsRenaming(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!object.locked) {
      handleRenameStart();
    }
  };

  const getGeometryIcon = (type: GeometryType) => {
    const iconProps = { className: "w-3.5 h-3.5 flex-shrink-0" };
    switch (type) {
      case "sphere":
        return (
          <Circle
            {...iconProps}
            className="w-3.5 h-3.5 text-blue-400 flex-shrink-0"
          />
        );
      case "box":
        return (
          <Box
            {...iconProps}
            className="w-3.5 h-3.5 text-green-400 flex-shrink-0"
          />
        );
      case "plane":
        return (
          <Square
            {...iconProps}
            className="w-3.5 h-3.5 text-purple-400 flex-shrink-0"
          />
        );
      case "cylinder":
        return (
          <CylinderIcon
            {...iconProps}
            className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0"
          />
        );
      case "torus":
        return (
          <Circle
            {...iconProps}
            className="w-3.5 h-3.5 text-pink-400 flex-shrink-0"
          />
        );
      default:
        return (
          <Circle
            {...iconProps}
            className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
          />
        );
    }
  };

  const renderConnectionLines = () => {
    if (depth === 0) return null;

    return (
      <div
        className="absolute left-0 top-0 h-full flex"
        style={{ width: `${depth * 16}px` }}
      >
        {parentIsLastChild.map((isLast, index) => (
          <div
            key={index}
            className="relative"
            style={{ width: "16px", height: "100%" }}
          >
            {!isLast && (
              <div
                className="absolute left-[7px] top-0 bottom-0 w-px bg-zinc-700/50"
                style={{ height: "100%" }}
              />
            )}
          </div>
        ))}
        <div className="relative" style={{ width: "16px" }}>
          {/* Vertical line */}
          {!isLastChild && (
            <div className="absolute left-[7px] top-0 bottom-0 w-px bg-zinc-700/50" />
          )}
          {/* Horizontal line */}
          <div className="absolute left-[7px] top-[12px] w-[9px] h-px bg-zinc-700/50" />
        </div>
      </div>
    );
  };

  const nodeContent = (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          draggable={!object.locked}
          onDragStart={(e) => {
            if (!object.locked) {
              e.dataTransfer.effectAllowed = "move";
              onDragStart(object.id);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggedId && draggedId !== object.id) {
              onDragOver(object.id);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDrop(object.id);
          }}
          className={`
            group relative flex items-center h-7 px-2 rounded transition-all cursor-pointer select-none
            ${
              isSelected
                ? "bg-[#FF5C3D]/20 text-white"
                : "hover:bg-zinc-800/50 text-zinc-300"
            }
            ${isDragging ? "opacity-50" : ""}
            ${isDropTarget ? "ring-1 ring-[#FF5C3D]" : ""}
            ${object.locked ? "opacity-60" : ""}
          `}
          style={{
            marginLeft: `${depth * 16}px`,
            paddingLeft: depth > 0 ? "4px" : "8px",
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!object.locked) {
              onSelect(object.id);
            }
          }}
          onDoubleClick={handleDoubleClick}
        >
          {renderConnectionLines()}

          {/* Selection Indicator */}
          {isSelected && (
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#FF5C3D] rounded-l" />
          )}

          {/* Expand/Collapse Arrow */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 mr-1 hover:bg-zinc-700/50 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpanded(object.id);
              }}
            >
              <ChevronRight
                className={`h-3 w-3 text-zinc-400 transition-transform ${
                  object.expanded ? "rotate-90" : ""
                }`}
              />
            </Button>
          ) : (
            <div className="w-4 flex-shrink-0" />
          )}

          {/* Object Icon */}
          <div className="mr-2 flex-shrink-0">
            {hasChildren ? (
              object.expanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-400" />
              )
            ) : (
              getGeometryIcon(object.type)
            )}
          </div>

          {/* Object Name */}
          <div className="flex-1 min-w-0 mr-2">
            {isRenaming ? (
              <Input
                ref={inputRef}
                value={renamingValue}
                onChange={(e) => setRenamingValue(e.target.value)}
                onBlur={handleRenameComplete}
                onKeyDown={handleRenameKeyDown}
                className="h-5 px-1 py-0 text-xs bg-zinc-800 border-zinc-600 text-white"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-xs font-medium truncate block">
                {object.name}
              </span>
            )}
          </div>

          {/* Control Icons - Always Visible */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {/* Children Count Badge */}
            {hasChildren && (
              <Badge
                variant="outline"
                className="h-4 px-1 text-[9px] bg-zinc-800/80 text-zinc-400 border-zinc-700"
              >
                {children.length}
              </Badge>
            )}

            {/* Visibility Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-zinc-700"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(object.id);
              }}
            >
              {object.visible ? (
                <Eye className="w-3 h-3 text-zinc-400" />
              ) : (
                <EyeOff className="w-3 h-3 text-zinc-600" />
              )}
            </Button>

            {/* Lock Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-zinc-700"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLocked(object.id);
              }}
            >
              {object.locked ? (
                <Lock className="w-3 h-3 text-red-400" />
              ) : (
                <Unlock className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Button>
          </div>
        </div>
      </ContextMenuTrigger>

      {/* Context Menu */}
      <ContextMenuContent className="w-48 bg-zinc-900 border-zinc-800">
        <ContextMenuItem
          onClick={() => handleRenameStart()}
          disabled={object.locked}
          className="text-zinc-300 hover:bg-zinc-800 text-xs"
        >
          <Edit2 className="w-3.5 h-3.5 mr-2" />
          Rename (F2)
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onDuplicate(object.id)}
          className="text-zinc-300 hover:bg-zinc-800 text-xs"
        >
          <Copy className="w-3.5 h-3.5 mr-2" />
          Duplicate (Ctrl+D)
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-zinc-800" />
        <ContextMenuItem
          onClick={() => onToggleVisibility(object.id)}
          className="text-zinc-300 hover:bg-zinc-800 text-xs"
        >
          {object.visible ? (
            <>
              <EyeOff className="w-3.5 h-3.5 mr-2" />
              Hide
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 mr-2" />
              Show
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onToggleLocked(object.id)}
          className="text-zinc-300 hover:bg-zinc-800 text-xs"
        >
          {object.locked ? (
            <>
              <Unlock className="w-3.5 h-3.5 mr-2" />
              Unlock
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 mr-2" />
              Lock
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-zinc-800" />
        <ContextMenuItem
          onClick={() => onRemove(object.id)}
          className="text-red-400 hover:bg-red-500/10 text-xs"
        >
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Delete (Del)
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );

  return (
    <>
      {nodeContent}
      {hasChildren && object.expanded && (
        <div className="space-y-0.5">
          {children.map((child, index) => (
            <TreeNode
              key={child.id}
              object={child}
              allObjects={allObjects}
              selectedId={selectedId}
              depth={depth + 1}
              isLastChild={index === children.length - 1}
              parentIsLastChild={[...parentIsLastChild, isLastChild]}
              onSelect={onSelect}
              onRemove={onRemove}
              onDuplicate={onDuplicate}
              onToggleVisibility={onToggleVisibility}
              onToggleExpanded={onToggleExpanded}
              onToggleLocked={onToggleLocked}
              onRename={onRename}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              draggedId={draggedId}
              dropTargetId={dropTargetId}
            />
          ))}
        </div>
      )}
    </>
  );
};

export const HierarchyPanel: React.FC<HierarchyPanelProps> = ({
  objects,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  onDuplicate,
  onToggleVisibility,
  onToggleExpanded = () => {},
  onToggleLocked = () => {},
  onRename = () => {},
  onReparent = () => {},
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const handleAddObject = useCallback(
    (type: GeometryType, parentId: string | null = null) => {
      const offset = objects.length * 0.3;
      const position: [number, number, number] = parentId
        ? [0, 0, 0]
        : [offset, 0, 0];
      const newObject = createSceneObject(type, position, parentId);
      onAdd(newObject);
    },
    [objects.length, onAdd]
  );

  const handleDragStart = useCallback((id: string) => {
    setDraggedId(id);
  }, []);

  const handleDragOver = useCallback((id: string) => {
    setDropTargetId(id);
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => {
      if (draggedId && draggedId !== targetId) {
        if (canReparent(objects, draggedId, targetId)) {
          onReparent(draggedId, targetId);
        }
      }
      setDraggedId(null);
      setDropTargetId(null);
    },
    [draggedId, objects, onReparent]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;

      // Ignore if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const selectedObject = objects.find((obj) => obj.id === selectedId);
      if (!selectedObject) return;

      switch (e.key) {
        case "Delete":
          e.preventDefault();
          onRemove(selectedId);
          break;
        case "F2":
          e.preventDefault();
          if (!selectedObject.locked) {
            // Trigger rename - would need to implement this through a ref or state
            console.log("Rename triggered via F2");
          }
          break;
        case "d":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onDuplicate(selectedId);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, objects, onRemove, onDuplicate]);

  const filteredObjects = useMemo(() => {
    if (!searchQuery.trim()) return objects;
    const query = searchQuery.toLowerCase();
    return objects.filter(
      (obj) =>
        obj.name.toLowerCase().includes(query) ||
        obj.type.toLowerCase().includes(query)
    );
  }, [objects, searchQuery]);

  const rootObjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return getRootObjects(filteredObjects);
    }
    return filteredObjects;
  }, [filteredObjects, searchQuery]);

  const stats = useMemo(() => {
    const visibleCount = objects.filter((obj) => obj.visible).length;
    const hiddenCount = objects.length - visibleCount;
    const lockedCount = objects.filter((obj) => obj.locked).length;
    return { visibleCount, hiddenCount, lockedCount };
  }, [objects]);

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900/50 rounded-lg border border-zinc-800 shadow-xl">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#FF5C3D]/10 border border-[#FF5C3D]/20">
              <Folder className="h-3.5 w-3.5 text-[#FF5C3D]" />
            </div>
            <h3 className="font-semibold text-xs text-white">Hierarchy</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="h-5 text-[9px] bg-zinc-800/50 text-zinc-400 border-zinc-700"
            >
              {objects.length}
            </Badge>
            {stats.hiddenCount > 0 && (
              <Badge
                variant="outline"
                className="h-5 text-[9px] bg-zinc-800/50 text-zinc-500 border-zinc-700"
              >
                <EyeOff className="w-2.5 h-2.5 mr-0.5" />
                {stats.hiddenCount}
              </Badge>
            )}
            {stats.lockedCount > 0 && (
              <Badge
                variant="outline"
                className="h-5 text-[9px] bg-zinc-800/50 text-red-400 border-zinc-700"
              >
                <Lock className="w-2.5 h-2.5 mr-0.5" />
                {stats.lockedCount}
              </Badge>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search objects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-8 pr-8 text-xs bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-[#FF5C3D]/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-zinc-700 rounded p-0.5"
            >
              <X className="w-3 h-3 text-zinc-500" />
            </button>
          )}
        </div>

        {/* Add Object Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="w-full h-7 text-xs bg-[#FF5C3D] hover:bg-[#FF5C3D]/90 text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Object
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-48 bg-zinc-900 border-zinc-800"
          >
            <DropdownMenuItem
              onClick={() => handleAddObject("sphere")}
              className="text-zinc-300 hover:bg-zinc-800 text-xs"
            >
              <Circle className="w-3.5 h-3.5 mr-2 text-blue-400" />
              Sphere
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAddObject("box")}
              className="text-zinc-300 hover:bg-zinc-800 text-xs"
            >
              <Box className="w-3.5 h-3.5 mr-2 text-green-400" />
              Box
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAddObject("plane")}
              className="text-zinc-300 hover:bg-zinc-800 text-xs"
            >
              <Square className="w-3.5 h-3.5 mr-2 text-purple-400" />
              Plane
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAddObject("cylinder")}
              className="text-zinc-300 hover:bg-zinc-800 text-xs"
            >
              <CylinderIcon className="w-3.5 h-3.5 mr-2 text-yellow-400" />
              Cylinder
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAddObject("torus")}
              className="text-zinc-300 hover:bg-zinc-800 text-xs"
            >
              <Circle className="w-3.5 h-3.5 mr-2 text-pink-400" />
              Torus
            </DropdownMenuItem>
            {selectedId && (
              <>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  onClick={() => handleAddObject("sphere", selectedId)}
                  className="text-zinc-300 hover:bg-zinc-800 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-2" />
                  Add as Child
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tree View */}
      <ScrollArea className="flex-1">
        <div
          className="p-2 space-y-0.5"
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedId) {
              // Drop on root level
              if (canReparent(objects, draggedId, null)) {
                onReparent(draggedId, null);
              }
              setDraggedId(null);
              setDropTargetId(null);
            }
          }}
        >
          {objects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-zinc-500 text-xs">
              <Box className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <span>No objects in scene</span>
              <span className="text-[10px] mt-1 text-zinc-600">
                Click &quot;Add Object&quot; to start
              </span>
            </div>
          ) : rootObjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-zinc-500 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <span>No matches found</span>
            </div>
          ) : (
            rootObjects.map((obj, index) => (
              <TreeNode
                key={obj.id}
                object={obj}
                allObjects={objects}
                selectedId={selectedId}
                depth={0}
                isLastChild={index === rootObjects.length - 1}
                parentIsLastChild={[]}
                onSelect={onSelect}
                onRemove={onRemove}
                onDuplicate={onDuplicate}
                onToggleVisibility={onToggleVisibility}
                onToggleExpanded={onToggleExpanded}
                onToggleLocked={onToggleLocked}
                onRename={onRename}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                draggedId={draggedId}
                dropTargetId={dropTargetId}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer with keyboard shortcuts hint */}
      <div className="flex-shrink-0 p-2 border-t border-zinc-800 bg-zinc-900/30">
        <div className="text-[9px] text-zinc-600 text-center">
          F2: Rename • Del: Delete • Ctrl+D: Duplicate • Drag to reparent
        </div>
      </div>
    </div>
  );
};
