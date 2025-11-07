"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { SceneObject } from "./SceneManager";

interface TransformTabProps {
  transform: SceneObject["transform"];
  onChange: (transform: Partial<SceneObject["transform"]>) => void;
}

export const TransformTab: React.FC<TransformTabProps> = ({
  transform,
  onChange,
}) => {
  const handleVectorChange = (
    key: "position" | "rotation" | "scale",
    index: number,
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const newVector = [...transform[key]] as [number, number, number];
    newVector[index] = numValue;
    onChange({ [key]: newVector });
  };

  const resetTransform = (key: "position" | "rotation" | "scale") => {
    const defaultValues: Record<string, [number, number, number]> = {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    };
    onChange({ [key]: defaultValues[key] });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Position */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-white">Position</Label>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 hover:bg-white/10"
            onClick={() => resetTransform("position")}
          >
            <RotateCcw className="w-3 h-3 text-gray-400" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">X</Label>
            <Input
              type="number"
              step="0.1"
              value={transform.position[0].toFixed(2)}
              onChange={(e) =>
                handleVectorChange("position", 0, e.target.value)
              }
              className="h-7 text-xs bg-black/40 border-white/20 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">Y</Label>
            <Input
              type="number"
              step="0.1"
              value={transform.position[1].toFixed(2)}
              onChange={(e) =>
                handleVectorChange("position", 1, e.target.value)
              }
              className="h-7 text-xs bg-black/40 border-white/20 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">Z</Label>
            <Input
              type="number"
              step="0.1"
              value={transform.position[2].toFixed(2)}
              onChange={(e) =>
                handleVectorChange("position", 2, e.target.value)
              }
              className="h-7 text-xs bg-black/40 border-white/20 text-white"
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-white">Rotation</Label>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 hover:bg-white/10"
            onClick={() => resetTransform("rotation")}
          >
            <RotateCcw className="w-3 h-3 text-gray-400" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">X (°)</Label>
            <Input
              type="number"
              step="1"
              value={(transform.rotation[0] * (180 / Math.PI)).toFixed(1)}
              onChange={(e) =>
                handleVectorChange(
                  "rotation",
                  0,
                  (parseFloat(e.target.value) * (Math.PI / 180)).toString()
                )
              }
              className="h-7 text-xs bg-black/40 border-white/20 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">Y (°)</Label>
            <Input
              type="number"
              step="1"
              value={(transform.rotation[1] * (180 / Math.PI)).toFixed(1)}
              onChange={(e) =>
                handleVectorChange(
                  "rotation",
                  1,
                  (parseFloat(e.target.value) * (Math.PI / 180)).toString()
                )
              }
              className="h-7 text-xs bg-black/40 border-white/20 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">Z (°)</Label>
            <Input
              type="number"
              step="1"
              value={(transform.rotation[2] * (180 / Math.PI)).toFixed(1)}
              onChange={(e) =>
                handleVectorChange(
                  "rotation",
                  2,
                  (parseFloat(e.target.value) * (Math.PI / 180)).toString()
                )
              }
              className="h-7 text-xs bg-black/40 border-white/20 text-white"
            />
          </div>
        </div>
      </div>

      {/* Scale */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-white">Scale</Label>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 hover:bg-white/10"
            onClick={() => resetTransform("scale")}
          >
            <RotateCcw className="w-3 h-3 text-gray-400" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">X</Label>
            <Input
              type="number"
              step="0.1"
              value={transform.scale[0].toFixed(2)}
              onChange={(e) => handleVectorChange("scale", 0, e.target.value)}
              className="h-7 text-xs bg-black/40 border-white/20 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">Y</Label>
            <Input
              type="number"
              step="0.1"
              value={transform.scale[1].toFixed(2)}
              onChange={(e) => handleVectorChange("scale", 1, e.target.value)}
              className="h-7 text-xs bg-black/40 border-white/20 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-gray-400">Z</Label>
            <Input
              type="number"
              step="0.1"
              value={transform.scale[2].toFixed(2)}
              onChange={(e) => handleVectorChange("scale", 2, e.target.value)}
              className="h-7 text-xs bg-black/40 border-white/20 text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
