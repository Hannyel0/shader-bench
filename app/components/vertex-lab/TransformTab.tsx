"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
    <div className="p-3 space-y-4">
      {/* Position */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-white">Position</Label>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 hover:bg-zinc-700"
            onClick={() => resetTransform("position")}
          >
            <RotateCcw className="w-3 h-3 text-zinc-400" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["X", "Y", "Z"].map((axis, index) => (
            <div key={axis} className="space-y-1">
              <Label className="text-[10px] text-zinc-500">{axis}</Label>
              <Input
                type="number"
                step="0.1"
                value={transform.position[index].toFixed(2)}
                onChange={(e) =>
                  handleVectorChange("position", index, e.target.value)
                }
                className="h-7 text-xs bg-zinc-800/50 border-zinc-700 text-white focus-visible:ring-[#FF5C3D]/50"
              />
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Rotation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-white">Rotation</Label>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 hover:bg-zinc-700"
            onClick={() => resetTransform("rotation")}
          >
            <RotateCcw className="w-3 h-3 text-zinc-400" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["X", "Y", "Z"].map((axis, index) => (
            <div key={axis} className="space-y-1">
              <Label className="text-[10px] text-zinc-500">{axis} (°)</Label>
              <Input
                type="number"
                step="1"
                value={(transform.rotation[index] * (180 / Math.PI)).toFixed(1)}
                onChange={(e) =>
                  handleVectorChange(
                    "rotation",
                    index,
                    (parseFloat(e.target.value) * (Math.PI / 180)).toString()
                  )
                }
                className="h-7 text-xs bg-zinc-800/50 border-zinc-700 text-white focus-visible:ring-[#FF5C3D]/50"
              />
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Scale */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-white">Scale</Label>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 hover:bg-zinc-700"
            onClick={() => resetTransform("scale")}
          >
            <RotateCcw className="w-3 h-3 text-zinc-400" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["X", "Y", "Z"].map((axis, index) => (
            <div key={axis} className="space-y-1">
              <Label className="text-[10px] text-zinc-500">{axis}</Label>
              <Input
                type="number"
                step="0.1"
                value={transform.scale[index].toFixed(2)}
                onChange={(e) => handleVectorChange("scale", index, e.target.value)}
                className="h-7 text-xs bg-zinc-800/50 border-zinc-700 text-white focus-visible:ring-[#FF5C3D]/50"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
