"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
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
  ChevronDown,
  Search,
  X,
  Folder,
  FolderOpen,
} from "lucide-react";
import {
  SceneObject,
  GeometryType,
  createSceneObject,
  getRootObjects,
  getChildren,
  getDepth,
  getAllDescendants,
} from "./SceneManager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HierarchyPanelProps {
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (object: SceneObject) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleExpanded?: (id: string) => void;
  onReparent?: (childId: string, newParentId: string | null) => void;
}

interface TreeNodeProps {
  object: SceneObject;
  allObjects: SceneObject[];
  selectedId: string | null;
  depth: number;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleExpanded: (id: string) => void;
  onReparent: (childId: string, newParentId: string | null) => void;
  onContextMenu: (object: SceneObject, event: React.MouseEvent) => void;
  draggedId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (id: string | null, event: React.DragEvent) => void;
  onDrop: (targetId: string | null) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  object,
  allObjects,
  selectedId,
  depth,
  onSelect,
  onRemove,
  onDuplicate,
  onToggleVisibility,
  onToggleExpanded,
  onReparent,
  onContextMenu,
  draggedId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) => {
  const children = getChildren(allObjects, object.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedId === object.id;
  const isDragging = draggedId === object.id;
  const [isOver, setIsOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("objectId", object.id);
    onDragStart(object.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
    onDragOver(object.id, e);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    onDrop(object.id);
  };

  const getGeometryIcon = (type: GeometryType) => {
    const iconProps = { className: "w-3.5 h-3.5" };
    switch (type) {
      case "sphere":
        return <Circle {...iconProps} />;
      case "box":
        return <Box {...iconProps} />;
      case "plane":
        return <Square {...iconProps} />;
      case "cylinder":
        return <CylinderIcon {...iconProps} />;
      case "torus":
        return <Circle {...iconProps} />;
      default:
        return <Circle {...iconProps} />;
    }
  };

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(object, e);
        }}
        className={`
          group relative rounded border transition-all cursor-pointer select-none
          ${isDragging ? "opacity-50" : "opacity-100"}
          ${isOver ? "border-blue-400 bg-blue-500/20" : ""}
          ${
            isSelected
              ? "bg-blue-500/20 border-blue-500/40"
              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
          }
        `}
        style={{ marginLeft: `${depth * 16}px` }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(object.id);
        }}
      >
        <div className="flex items-center gap-1 p-1.5">
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpanded(object.id);
              }}
              className="p-0.5 hover:bg-white/10 rounded transition-colors"
            >
              {object.expanded ? (
                <ChevronDown className="w-3 h-3 text-gray-300" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-300" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Icon */}
          <div
            className={`
            p-1 rounded flex items-center justify-center
            ${isSelected ? "bg-blue-500/30" : "bg-white/10"}
          `}
          >
            {hasChildren ? (
              object.expanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-yellow-400" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-yellow-400" />
              )
            ) : (
              getGeometryIcon(object.type)
            )}
          </div>

          {/* Name and Badges */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium truncate text-white">
              {object.name}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge className="h-3 px-1 text-[8px] bg-green-500/20 text-green-300 border-0">
                Transform
              </Badge>
              {object.displacement && (
                <Badge className="h-3 px-1 text-[8px] bg-blue-500/20 text-blue-300 border-0">
                  Displacement
                </Badge>
              )}
              {hasChildren && (
                <Badge className="h-3 px-1 text-[8px] bg-purple-500/20 text-purple-300 border-0">
                  {children.length}
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(object.id);
              }}
            >
              {object.visible ? (
                <Eye className="w-3 h-3 text-gray-300" />
              ) : (
                <EyeOff className="w-3 h-3 text-gray-500" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(object.id);
              }}
            >
              <Copy className="w-3 h-3 text-gray-300" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-red-500/20"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(object.id);
              }}
            >
              <Trash2 className="w-3 h-3 text-red-400" />
            </Button>
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-l" />
        )}
      </div>

      {/* Render Children Recursively */}
      {hasChildren && object.expanded && (
        <div className="mt-0.5 space-y-0.5">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              object={child}
              allObjects={allObjects}
              selectedId={selectedId}
              depth={depth + 1}
              onSelect={onSelect}
              onRemove={onRemove}
              onDuplicate={onDuplicate}
              onToggleVisibility={onToggleVisibility}
              onToggleExpanded={onToggleExpanded}
              onReparent={onReparent}
              onContextMenu={onContextMenu}
              draggedId={draggedId}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
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
  onReparent = () => {},
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    object: SceneObject;
    x: number;
    y: number;
  } | null>(null);

  const handleAddObject = (
    type: GeometryType,
    parentId: string | null = null
  ) => {
    const offset = objects.length * 0.3;
    const position: [number, number, number] = parentId
      ? [0, 0, 0]
      : [offset, 0, 0];
    const newObject = createSceneObject(type, position, parentId);
    onAdd(newObject);
  };

  const handleContextMenu = useCallback(
    (object: SceneObject, event: React.MouseEvent) => {
      setContextMenu({
        object,
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  const handleDrop = useCallback(
    (targetId: string | null) => {
      if (draggedId && draggedId !== targetId) {
        onReparent(draggedId, targetId);
      }
      setDraggedId(null);
    },
    [draggedId, onReparent]
  );

  // Filter objects based on search
  const filteredObjects = useMemo(() => {
    if (!searchQuery.trim()) return objects;

    const query = searchQuery.toLowerCase();
    return objects.filter(
      (obj) =>
        obj.name.toLowerCase().includes(query) ||
        obj.type.toLowerCase().includes(query)
    );
  }, [objects, searchQuery]);

  // Get root objects for tree rendering
  const rootObjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return getRootObjects(filteredObjects);
    }
    // When searching, show all matching objects as roots
    return filteredObjects;
  }, [filteredObjects, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const visibleCount = objects.filter((obj) => obj.visible).length;
    const hiddenCount = objects.length - visibleCount;
    const withDisplacement = objects.filter((obj) => obj.displacement).length;

    return { visibleCount, hiddenCount, withDisplacement };
  }, [objects]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-white">Hierarchy</h3>
          <div className="flex items-center gap-1">
            <Badge
              variant="secondary"
              className="h-5 text-[10px] bg-white/10 text-white border-0"
            >
              {objects.length}
            </Badge>
            {stats.hiddenCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 text-[10px] bg-gray-500/20 text-gray-300 border-0"
              >
                <EyeOff className="w-2.5 h-2.5 mr-0.5" />
                {stats.hiddenCount}
              </Badge>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <Input
            type="text"
            placeholder="Search hierarchy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 pr-7 text-xs bg-black/40 border-white/20 text-white placeholder:text-gray-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-white/10 rounded p-0.5"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>

        {/* Add Object Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="w-full h-7 text-[10px] bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-3 h-3 mr-1.5" />
              Add Object
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-44 bg-black/95 backdrop-blur-md border-white/20"
          >
            <DropdownMenuItem
              onClick={() => handleAddObject("sphere")}
              className="text-white hover:bg-white/10 text-xs"
            >
              <Circle className="w-3 h-3 mr-2" />
              Sphere
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAddObject("box")}
              className="text-white hover:bg-white/10 text-xs"
            >
              <Box className="w-3 h-3 mr-2" />
              Box
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAddObject("plane")}
              className="text-white hover:bg-white/10 text-xs"
            >
              <Square className="w-3 h-3 mr-2" />
              Plane
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAddObject("cylinder")}
              className="text-white hover:bg-white/10 text-xs"
            >
              <CylinderIcon className="w-3 h-3 mr-2" />
              Cylinder
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAddObject("torus")}
              className="text-white hover:bg-white/10 text-xs"
            >
              <Circle className="w-3 h-3 mr-2" />
              Torus
            </DropdownMenuItem>
            {selectedId && (
              <>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={() => handleAddObject("sphere", selectedId)}
                  className="text-white hover:bg-white/10 text-xs"
                >
                  <Plus className="w-3 h-3 mr-2" />
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
            handleDrop(null); // Drop to root
          }}
        >
          {objects.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No objects in scene
              <br />
              <span className="text-[10px]">
                Click &quot;Add Object&quot; to start
              </span>
            </div>
          ) : rootObjects.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No objects match &quot;{searchQuery}&quot;
            </div>
          ) : (
            rootObjects.map((obj) => (
              <TreeNode
                key={obj.id}
                object={obj}
                allObjects={objects}
                selectedId={selectedId}
                depth={0}
                onSelect={onSelect}
                onRemove={onRemove}
                onDuplicate={onDuplicate}
                onToggleVisibility={onToggleVisibility}
                onToggleExpanded={onToggleExpanded}
                onReparent={onReparent}
                onContextMenu={handleContextMenu}
                draggedId={draggedId}
                onDragStart={setDraggedId}
                onDragEnd={() => setDraggedId(null)}
                onDragOver={() => {}}
                onDrop={handleDrop}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Context Menu (can be enhanced with shadcn ContextMenu component) */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-black/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl p-1"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-white hover:bg-white/10 rounded"
            onClick={() => {
              onDuplicate(contextMenu.object.id);
              setContextMenu(null);
            }}
          >
            <Copy className="w-3 h-3 inline mr-2" />
            Duplicate
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-white hover:bg-white/10 rounded"
            onClick={() => {
              handleAddObject("sphere", contextMenu.object.id);
              setContextMenu(null);
            }}
          >
            <Plus className="w-3 h-3 inline mr-2" />
            Add Child
          </button>
          <div className="h-px bg-white/10 my-1" />
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 rounded"
            onClick={() => {
              onRemove(contextMenu.object.id);
              setContextMenu(null);
            }}
          >
            <Trash2 className="w-3 h-3 inline mr-2" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
