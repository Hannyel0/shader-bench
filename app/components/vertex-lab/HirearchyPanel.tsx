"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  MoreHorizontal,
} from "lucide-react";
import {
  SceneObject,
  GeometryType,
  createSceneObject,
  getRootObjects,
  getChildren,
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
}) => {
  const children = getChildren(allObjects, object.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedId === object.id;

  const getGeometryIcon = (type: GeometryType) => {
    const iconProps = { className: "w-3.5 h-3.5" };
    switch (type) {
      case "sphere":
        return <Circle {...iconProps} className="w-3.5 h-3.5 text-blue-400" />;
      case "box":
        return <Box {...iconProps} className="w-3.5 h-3.5 text-green-400" />;
      case "plane":
        return <Square {...iconProps} className="w-3.5 h-3.5 text-purple-400" />;
      case "cylinder":
        return <CylinderIcon {...iconProps} className="w-3.5 h-3.5 text-yellow-400" />;
      case "torus":
        return <Circle {...iconProps} className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <Circle {...iconProps} className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  if (hasChildren) {
    return (
      <Collapsible open={object.expanded} onOpenChange={() => onToggleExpanded(object.id)}>
        <div
          className={`
            group relative rounded-md border transition-all
            ${
              isSelected
                ? "bg-[#FF5C3D]/10 border-[#FF5C3D]/30 shadow-sm"
                : "bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50 hover:border-zinc-600"
            }
          `}
          style={{ marginLeft: `${depth * 12}px` }}
        >
          <div className="flex items-center gap-1.5 px-2 py-1.5">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-zinc-700"
              >
                <ChevronRight
                  className={`h-3 w-3 text-zinc-400 transition-transform ${
                    object.expanded ? "rotate-90" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>

            <div
              className="flex-1 flex items-center gap-2 cursor-pointer"
              onClick={() => onSelect(object.id)}
            >
              {object.expanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-400" />
              )}

              <span className="text-xs font-medium text-zinc-200 truncate">
                {object.name}
              </span>

              <Badge
                variant="outline"
                className="h-4 px-1 text-[9px] bg-zinc-800/50 text-zinc-400 border-zinc-700"
              >
                {children.length}
              </Badge>
            </div>

            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-zinc-700"
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-zinc-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-40 bg-zinc-900 border-zinc-800"
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(object.id);
                    }}
                    className="text-zinc-300 hover:bg-zinc-800 text-xs"
                  >
                    <Copy className="w-3.5 h-3.5 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(object.id);
                    }}
                    className="text-red-400 hover:bg-red-500/10 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isSelected && (
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#FF5C3D] rounded-l" />
          )}
        </div>

        <CollapsibleContent className="mt-1 space-y-1">
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
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div
      className={`
        group relative rounded-md border transition-all cursor-pointer
        ${
          isSelected
            ? "bg-[#FF5C3D]/10 border-[#FF5C3D]/30 shadow-sm"
            : "bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50 hover:border-zinc-600"
        }
      `}
      style={{ marginLeft: `${depth * 12}px` }}
      onClick={() => onSelect(object.id)}
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div className="w-5" />

        {getGeometryIcon(object.type)}

        <span className="flex-1 text-xs font-medium text-zinc-200 truncate">
          {object.name}
        </span>

        <div className="flex items-center gap-1">
          {object.displacement && (
            <Badge
              variant="outline"
              className="h-4 px-1 text-[8px] bg-blue-500/10 text-blue-400 border-blue-500/30"
            >
              Disp
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-zinc-700"
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-zinc-700"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 bg-zinc-900 border-zinc-800"
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(object.id);
                }}
                className="text-zinc-300 hover:bg-zinc-800 text-xs"
              >
                <Copy className="w-3.5 h-3.5 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(object.id);
                }}
                className="text-red-400 hover:bg-red-500/10 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#FF5C3D] rounded-l" />
      )}
    </div>
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

  const handleAddObject = (type: GeometryType, parentId: string | null = null) => {
    const offset = objects.length * 0.3;
    const position: [number, number, number] = parentId ? [0, 0, 0] : [offset, 0, 0];
    const newObject = createSceneObject(type, position, parentId);
    onAdd(newObject);
  };

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
    return { visibleCount, hiddenCount };
  }, [objects]);

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900/50 rounded-lg border border-zinc-800">
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
          <DropdownMenuContent align="start" className="w-48 bg-zinc-900 border-zinc-800">
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
        <div className="p-2 space-y-1">
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
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
