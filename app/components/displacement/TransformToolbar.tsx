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
    <div className="inline-flex items-center gap-1 p-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg">
      <Button
        size="sm"
        variant={mode === "translate" ? "default" : "ghost"}
        onClick={() => onModeChange("translate")}
        disabled={disabled}
        className={`h-8 px-3 ${
          mode === "translate"
            ? "bg-blue-600 hover:bg-blue-700"
            : "hover:bg-white/10"
        }`}
      >
        <Move className="w-4 h-4 mr-1.5" />
        Move
      </Button>
      <Button
        size="sm"
        variant={mode === "rotate" ? "default" : "ghost"}
        onClick={() => onModeChange("rotate")}
        disabled={disabled}
        className={`h-8 px-3 ${
          mode === "rotate"
            ? "bg-blue-600 hover:bg-blue-700"
            : "hover:bg-white/10"
        }`}
      >
        <RotateCw className="w-4 h-4 mr-1.5" />
        Rotate
      </Button>
      <Button
        size="sm"
        variant={mode === "scale" ? "default" : "ghost"}
        onClick={() => onModeChange("scale")}
        disabled={disabled}
        className={`h-8 px-3 ${
          mode === "scale"
            ? "bg-blue-600 hover:bg-blue-700"
            : "hover:bg-white/10"
        }`}
      >
        <Maximize2 className="w-4 h-4 mr-1.5" />
        Scale
      </Button>
    </div>
  );
};
