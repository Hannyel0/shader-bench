"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { SceneObject } from "./SceneManager";

interface MaterialTabProps {
  material: SceneObject["material"];
  onChange: (material: Partial<SceneObject["material"]>) => void;
}

export const MaterialTab: React.FC<MaterialTabProps> = ({
  material,
  onChange,
}) => {
  return (
    <div className="p-4 space-y-4">
      {/* Base Color */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-white">Base Color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={material.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-8 w-16 rounded border border-white/20 bg-transparent cursor-pointer"
          />
          <Input
            type="text"
            value={material.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-7 flex-1 text-xs bg-black/40 border-white/20 text-white font-mono"
            placeholder="#4a9eff"
          />
        </div>
      </div>

      {/* Roughness */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-white">Roughness</Label>
          <span className="text-[10px] text-gray-400 font-mono">
            {material.roughness.toFixed(2)}
          </span>
        </div>
        <Slider
          value={[material.roughness]}
          onValueChange={([value]) => onChange({ roughness: value })}
          min={0}
          max={1}
          step={0.01}
          className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-blue-500"
        />
      </div>

      {/* Metalness */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-white">Metalness</Label>
          <span className="text-[10px] text-gray-400 font-mono">
            {material.metalness.toFixed(2)}
          </span>
        </div>
        <Slider
          value={[material.metalness]}
          onValueChange={([value]) => onChange({ metalness: value })}
          min={0}
          max={1}
          step={0.01}
          className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-blue-500"
        />
      </div>

      {/* Opacity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-white">Opacity</Label>
          <span className="text-[10px] text-gray-400 font-mono">
            {material.opacity.toFixed(2)}
          </span>
        </div>
        <Slider
          value={[material.opacity]}
          onValueChange={([value]) => onChange({ opacity: value })}
          min={0}
          max={1}
          step={0.01}
          className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-blue-500"
        />
      </div>

      {/* Emissive Intensity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-white">
            Emissive Intensity
          </Label>
          <span className="text-[10px] text-gray-400 font-mono">
            {material.emissiveIntensity.toFixed(2)}
          </span>
        </div>
        <Slider
          value={[material.emissiveIntensity]}
          onValueChange={([value]) => onChange({ emissiveIntensity: value })}
          min={0}
          max={2}
          step={0.01}
          className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-blue-500"
        />
      </div>
    </div>
  );
};
