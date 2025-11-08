"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RotateCcw } from "lucide-react";
import { SceneObject } from "./SceneManager";
import { NumberInput } from "@/components/ui/number-input";

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
            className="h-3.5 w-3.5 hover:bg-zinc-700 p-0"
            onClick={() => resetTransform("position")}
          >
            <RotateCcw className="w-1.5 h-1.5 text-zinc-400" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["X", "Y", "Z"].map((axis, index) => (
            <NumberInput
              key={axis}
              label={axis}
              value={transform.position[index]}
              onChange={(value) =>
                handleVectorChange("position", index, value.toString())
              }
              step={0.1}
              precision={2}
            />
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
            className="h-3.5 w-3.5 hover:bg-zinc-700 p-0"
            onClick={() => resetTransform("rotation")}
          >
            <RotateCcw className="w-1.5 h-1.5 text-zinc-400" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["X", "Y", "Z"].map((axis, index) => (
            <NumberInput
              key={axis}
              label={`${axis}°`}
              value={transform.rotation[index] * (180 / Math.PI)}
              onChange={(value) =>
                handleVectorChange(
                  "rotation",
                  index,
                  (value * (Math.PI / 180)).toString()
                )
              }
              step={1}
              precision={1}
            />
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
            className="h-3.5 w-3.5 hover:bg-zinc-700 p-0"
            onClick={() => resetTransform("scale")}
          >
            <RotateCcw className="w-1.5 h-1.5 text-zinc-400" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["X", "Y", "Z"].map((axis, index) => (
            <NumberInput
              key={axis}
              label={axis}
              value={transform.scale[index]}
              onChange={(value) =>
                handleVectorChange("scale", index, value.toString())
              }
              step={0.1}
              precision={2}
              min={0.01}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
