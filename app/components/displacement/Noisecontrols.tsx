"use client";

import React from "react";
import { DisplacementParams } from "./SceneManager";
import { NoiseType, NoiseConfigs } from "../../utils/Noiselibrary";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RotateCcw,
  Sparkles,
  Mountain,
  Waves,
  Grid3x3,
  Zap,
} from "lucide-react";

interface NoiseControlsProps {
  params: DisplacementParams;
  onParamsChange: (params: Partial<DisplacementParams>) => void;
  onPresetLoad: (preset: DisplacementParams) => void;
}

export const NoiseControls: React.FC<NoiseControlsProps> = ({
  params,
  onParamsChange,
  onPresetLoad,
}) => {
  const currentNoiseConfig = NoiseConfigs[params.noiseType];

  const handleSliderChange = (
    key: keyof DisplacementParams,
    value: number[]
  ) => {
    onParamsChange({ [key]: value[0] });
  };

  return (
    <div className="w-full space-y-3">
          {/* Noise Type Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-white">Noise Function</Label>
            <Select
              value={params.noiseType}
              onValueChange={(value: NoiseType) =>
                onParamsChange({ noiseType: value })
              }
            >
              <SelectTrigger className="h-7 text-xs bg-zinc-800/50 border-zinc-700 text-white focus:ring-[#FF5C3D]/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 backdrop-blur-md border-zinc-800">
                {Object.values(NoiseConfigs).map((config) => (
                  <SelectItem
                    key={config.type}
                    value={config.type}
                    className="text-white hover:bg-zinc-800 text-xs"
                  >
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-zinc-500">{currentNoiseConfig.description}</p>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Core Parameters */}
          <div className="space-y-2">
            <Label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Core</Label>

            {/* Amplitude */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-white">Amplitude</Label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {params.amplitude.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[params.amplitude]}
                onValueChange={(v) => handleSliderChange("amplitude", v)}
                min={0}
                max={1}
                step={0.01}
              />
            </div>

            {/* Frequency */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-white">Frequency</Label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {params.frequency.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[params.frequency]}
                onValueChange={(v) => handleSliderChange("frequency", v)}
                min={0.1}
                max={10}
                step={0.1}
              />
            </div>

            {/* UV Scale */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-white">UV Scale</Label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {params.uvScale.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[params.uvScale]}
                onValueChange={(v) => handleSliderChange("uvScale", v)}
                min={0.1}
                max={5}
                step={0.1}
              />
            </div>
          </div>

          {/* Fractal Parameters (conditional) */}
          {currentNoiseConfig.requiresOctaves && (
            <>
              <Separator className="bg-zinc-800" />
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Fractal</Label>

                {/* Octaves */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-white">Octaves</Label>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {params.octaves}
                    </span>
                  </div>
                  <Slider
                    value={[params.octaves]}
                    onValueChange={(v) => handleSliderChange("octaves", v)}
                    min={1}
                    max={8}
                    step={1}
                  />
                </div>

                {/* Lacunarity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-white">Lacunarity</Label>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {params.lacunarity.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[params.lacunarity]}
                    onValueChange={(v) => handleSliderChange("lacunarity", v)}
                    min={1}
                    max={4}
                    step={0.1}
                  />
                </div>

                {/* Gain */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-white">Gain</Label>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {params.gain.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[params.gain]}
                    onValueChange={(v) => handleSliderChange("lacunarity", v)}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
              </div>
            </>
          )}

          {/* Ridge Offset (conditional) */}
          {currentNoiseConfig.requiresRidgeOffset && (
            <>
              <Separator className="bg-zinc-800" />
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Ridge</Label>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-white">Offset</Label>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {params.ridgeOffset.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[params.ridgeOffset]}
                    onValueChange={(v) => handleSliderChange("ridgeOffset", v)}
                    min={0}
                    max={2}
                    step={0.01}
                  />
                </div>
              </div>
            </>
          )}

          {/* Warp Strength (conditional) */}
          {currentNoiseConfig.requiresWarpStrength && (
            <>
              <Separator className="bg-zinc-800" />
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Domain Warp</Label>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-white">Strength</Label>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {params.warpStrength.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[params.warpStrength]}
                    onValueChange={(v) => handleSliderChange("warpStrength", v)}
                    min={0}
                    max={5}
                    step={0.1}
                  />
                </div>
              </div>
            </>
          )}

          {/* Animation */}
          <Separator className="bg-zinc-800" />
          <div className="space-y-2">
            <Label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Animation</Label>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-white">Speed</Label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {params.animationSpeed.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[params.animationSpeed]}
                onValueChange={(v) => handleSliderChange("animationSpeed", v)}
                min={0}
                max={2}
                step={0.01}
              />
            </div>
          </div>

          {/* Visualization */}
          <Separator className="bg-zinc-800" />
          <div className="space-y-2">
            <Label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Visualization</Label>

            {/* Visualization Mode */}
            <div className="space-y-2">
              <Label className="text-xs text-white">Coloring Mode</Label>
              <Select
                value={params.visualizationMode}
                onValueChange={(
                  value: "solid" | "height" | "normal" | "wireframe"
                ) => onParamsChange({ visualizationMode: value })}
              >
                <SelectTrigger className="h-7 text-xs bg-zinc-800/50 border-zinc-700 text-white focus:ring-[#FF5C3D]/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 backdrop-blur-md border-zinc-800">
                  <SelectItem value="solid" className="text-white hover:bg-zinc-800 text-xs">
                    Solid Color (Lit)
                  </SelectItem>
                  <SelectItem value="height" className="text-white hover:bg-zinc-800 text-xs">
                    Height-based Gradient
                  </SelectItem>
                  <SelectItem value="normal" className="text-white hover:bg-zinc-800 text-xs">
                    Normal Map
                  </SelectItem>
                  <SelectItem value="wireframe" className="text-white hover:bg-zinc-800 text-xs">
                    Wireframe
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Roughness Slider (visible only in solid mode) */}
            {params.visualizationMode === "solid" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-white">Roughness</Label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {params.roughness.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[params.roughness]}
                  onValueChange={(v) => handleSliderChange("roughness", v)}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>
            )}

            {/* Wireframe Toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-white">Wireframe Overlay</Label>
              <Button
                variant={params.wireframe ? "default" : "outline"}
                size="sm"
                onClick={() => onParamsChange({ wireframe: !params.wireframe })}
                className={`h-6 px-2 text-[10px] ${
                  params.wireframe
                    ? "bg-[#FF5C3D] hover:bg-[#FF5C3D]/90 text-white"
                    : "bg-zinc-800/50 hover:bg-zinc-700 text-white border-zinc-700"
                }`}
              >
                {params.wireframe ? "ON" : "OFF"}
              </Button>
            </div>

            {/* Subdivisions */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-white">Subdivisions</Label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {params.subdivisions}
                </span>
              </div>
              <Slider
                value={[params.subdivisions]}
                onValueChange={(v) => handleSliderChange("subdivisions", v)}
                min={16}
                max={256}
                step={16}
              />
            </div>
          </div>

          {/* Presets */}
          <Separator className="bg-zinc-800" />
          <div className="space-y-2 pb-3">
            <Label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Presets</Label>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPresetLoad(PRESETS.mountains)}
                className="h-7 justify-start text-[10px] bg-zinc-800/50 hover:bg-zinc-700 text-white border-zinc-700"
              >
                <Mountain className="w-3 h-3 mr-1.5" />
                Mountains
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPresetLoad(PRESETS.ocean)}
                className="h-7 justify-start text-[10px] bg-zinc-800/50 hover:bg-zinc-700 text-white border-zinc-700"
              >
                <Waves className="w-3 h-3 mr-1.5" />
                Ocean
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPresetLoad(PRESETS.organic)}
                className="h-7 justify-start text-[10px] bg-zinc-800/50 hover:bg-zinc-700 text-white border-zinc-700"
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                Organic
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPresetLoad(PRESETS.cellular)}
                className="h-7 justify-start text-[10px] bg-zinc-800/50 hover:bg-zinc-700 text-white border-zinc-700"
              >
                <Grid3x3 className="w-3 h-3 mr-1.5" />
                Cellular
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPresetLoad(PRESETS.turbulent)}
                className="h-7 justify-start text-[10px] bg-zinc-800/50 hover:bg-zinc-700 text-white border-zinc-700"
              >
                <Zap className="w-3 h-3 mr-1.5" />
                Turbulent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPresetLoad(PRESETS.default)}
                className="h-7 justify-start text-[10px] bg-zinc-800/50 hover:bg-zinc-700 text-white border-zinc-700"
              >
                <RotateCcw className="w-3 h-3 mr-1.5" />
                Reset
              </Button>
            </div>
          </div>
    </div>
  );
};

// Preset configurations
export const PRESETS: Record<string, DisplacementParams> = {
  default: {
    noiseType: "perlin",
    amplitude: 0.3,
    frequency: 2.0,
    octaves: 4,
    lacunarity: 2.0,
    gain: 0.5,
    ridgeOffset: 1.0,
    warpStrength: 1.0,
    uvScale: 1.0,
    animationSpeed: 0.1,
    wireframe: false,
    subdivisions: 128,
    visualizationMode: "solid",
    roughness: 0.5,
  },
  mountains: {
    noiseType: "ridge",
    amplitude: 0.5,
    frequency: 1.5,
    octaves: 6,
    lacunarity: 2.2,
    gain: 0.5,
    ridgeOffset: 1.0,
    warpStrength: 1.0,
    uvScale: 1.2,
    animationSpeed: 0.02,
    wireframe: false,
    subdivisions: 128,
    visualizationMode: "height",
    roughness: 0.7,
  },
  ocean: {
    noiseType: "fbmSimplex",
    amplitude: 0.15,
    frequency: 3.0,
    octaves: 5,
    lacunarity: 2.0,
    gain: 0.6,
    ridgeOffset: 1.0,
    warpStrength: 1.0,
    uvScale: 1.5,
    animationSpeed: 0.3,
    wireframe: false,
    subdivisions: 128,
    visualizationMode: "height",
    roughness: 0.2,
  },
  organic: {
    noiseType: "domainWarp",
    amplitude: 0.4,
    frequency: 2.0,
    octaves: 4,
    lacunarity: 2.0,
    gain: 0.5,
    ridgeOffset: 1.0,
    warpStrength: 2.5,
    uvScale: 1.0,
    animationSpeed: 0.15,
    wireframe: false,
    subdivisions: 128,
    visualizationMode: "normal",
    roughness: 0.6,
  },
  cellular: {
    noiseType: "voronoiF2MinusF1",
    amplitude: 0.35,
    frequency: 4.0,
    octaves: 3,
    lacunarity: 2.0,
    gain: 0.5,
    ridgeOffset: 1.0,
    warpStrength: 1.0,
    uvScale: 1.0,
    animationSpeed: 0.05,
    wireframe: false,
    subdivisions: 128,
    visualizationMode: "solid",
    roughness: 0.4,
  },
  turbulent: {
    noiseType: "turbulence",
    amplitude: 0.45,
    frequency: 2.5,
    octaves: 6,
    lacunarity: 2.3,
    gain: 0.55,
    ridgeOffset: 1.0,
    warpStrength: 1.0,
    uvScale: 1.0,
    animationSpeed: 0.2,
    wireframe: false,
    subdivisions: 128,
    visualizationMode: "height",
    roughness: 0.8,
  },
};
