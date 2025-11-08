"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { SceneObject, GeometryType, createSceneObject } from "./SceneManager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ObjectListPanelProps {
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (object: SceneObject) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export const ObjectListPanel: React.FC<ObjectListPanelProps> = ({
  objects,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  onDuplicate,
  onToggleVisibility,
}) => {
  const handleAddObject = (type: GeometryType) => {
    // Offset new objects slightly to avoid overlap
    const offset = objects.length * 0.3;
    const newObject = createSceneObject(type, [offset, 0, 0]);
    onAdd(newObject);
  };

  const getGeometryIcon = (type: GeometryType) => {
    switch (type) {
      case "sphere":
        return <Circle className="w-4 h-4" />;
      case "box":
        return <Box className="w-4 h-4" />;
      case "plane":
        return <Square className="w-4 h-4" />;
      case "cylinder":
        return <CylinderIcon className="w-4 h-4" />;
      case "torus":
        return <Circle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-white">Objects</h3>
          <Badge variant="secondary" className="h-5 text-[10px] bg-white/10 text-white border-0">
            {objects.length}
          </Badge>
        </div>

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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Object List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {objects.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs">
              No objects in scene
              <br />
              <span className="text-[10px]">Click &quot;Add Object&quot; to start</span>
            </div>
          ) : (
            objects.map((obj) => (
              <div
                key={obj.id}
                className={`
                  group relative rounded border transition-all cursor-pointer
                  ${
                    selectedId === obj.id
                      ? "bg-blue-500/20 border-blue-500/40"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  }
                `}
                onClick={() => onSelect(obj.id)}
              >
                <div className="flex items-center gap-1.5 p-1.5">
                  <div
                    className={`
                    p-1 rounded
                    ${selectedId === obj.id ? "bg-blue-500/30" : "bg-white/10"}
                  `}
                  >
                    {getGeometryIcon(obj.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium truncate text-white">
                      {obj.name}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge className="h-3 px-1 text-[8px] bg-green-500/20 text-green-300 border-0">
                        Transform
                      </Badge>
                      <Badge className="h-3 px-1 text-[8px] bg-purple-500/20 text-purple-300 border-0">
                        Material
                      </Badge>
                      {obj.displacement && (
                        <Badge className="h-3 px-1 text-[8px] bg-blue-500/20 text-blue-300 border-0">
                          Displacement
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(obj.id);
                      }}
                    >
                      {obj.visible ? (
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
                        onDuplicate(obj.id);
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
                        onRemove(obj.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </Button>
                  </div>
                </div>

                {selectedId === obj.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-l" />
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
