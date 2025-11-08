"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Move, RotateCw, Maximize2 } from "lucide-react";

type TransformMode = "translate" | "rotate" | "scale";

interface TransformToolbarProps {
  mode: TransformMode;
  onModeChange: (mode: TransformMode) => void;
  disabled?: boolean;
}

export const TransformToolbar: React.FC<TransformToolbarProps> = ({
  mode,
  onModeChange,
  disabled = false,
}) => {
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg">
      <Button
        size="sm"
        variant={mode === "translate" ? "default" : "ghost"}
        onClick={() => onModeChange("translate")}
        disabled={disabled}
        className={`h-7 px-2.5 text-[11px] ${
          mode === "translate"
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "hover:bg-white/10 text-gray-300"
        }`}
      >
        <Move className="w-3.5 h-3.5 mr-1" />
        Move
      </Button>
      <Button
        size="sm"
        variant={mode === "rotate" ? "default" : "ghost"}
        onClick={() => onModeChange("rotate")}
        disabled={disabled}
        className={`h-7 px-2.5 text-[11px] ${
          mode === "rotate"
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "hover:bg-white/10 text-gray-300"
        }`}
      >
        <RotateCw className="w-3.5 h-3.5 mr-1" />
        Rotate
      </Button>
      <Button
        size="sm"
        variant={mode === "scale" ? "default" : "ghost"}
        onClick={() => onModeChange("scale")}
        disabled={disabled}
        className={`h-7 px-2.5 text-[11px] ${
          mode === "scale"
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "hover:bg-white/10 text-gray-300"
        }`}
      >
        <Maximize2 className="w-3.5 h-3.5 mr-1" />
        Scale
      </Button>
    </div>
  );
};
