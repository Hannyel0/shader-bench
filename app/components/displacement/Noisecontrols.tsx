"use client";

import React from "react";
import { DisplacementParams } from "./Displacementcanvas";
import { NoiseType, NoiseConfigs } from "../../utils/Noiselibrary";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
            <Label className="text-xs text-gray-300">Noise Function</Label>
            <Select
              value={params.noiseType}
              onValueChange={(value: NoiseType) =>
                onParamsChange({ noiseType: value })
              }
            >
              <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/95 backdrop-blur-md border-white/20">
                {Object.values(NoiseConfigs).map((config) => (
                  <SelectItem
                    key={config.type}
                    value={config.type}
                    className="text-white hover:bg-white/10 text-xs"
                  >
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-gray-400">{currentNoiseConfig.description}</p>
          </div>

          {/* Core Parameters */}
          <div className="pt-2 space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Core Parameters</p>

            {/* Amplitude */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-gray-300">Amplitude</Label>
                <Badge variant="outline" className="h-5 text-[10px] font-mono bg-white/5 text-white border-white/10">
                  {params.amplitude.toFixed(2)}
                </Badge>
              </div>
              <Slider
                value={[params.amplitude]}
                onValueChange={(v) => handleSliderChange("amplitude", v)}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>

            {/* Frequency */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-gray-300">Frequency</Label>
                <Badge variant="outline" className="h-5 text-[10px] font-mono bg-white/5 text-white border-white/10">
                  {params.frequency.toFixed(2)}
                </Badge>
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
                <Label className="text-xs text-gray-300">UV Scale</Label>
                <Badge variant="outline" className="h-5 text-[10px] font-mono bg-white/5 text-white border-white/10">
                  {params.uvScale.toFixed(2)}
                </Badge>
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
            <div className="pt-2 space-y-3 border-t border-white/10">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Fractal</p>

              {/* Octaves */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-gray-300">Octaves</Label>
                  <Badge variant="outline" className="h-5 text-[10px] font-mono bg-white/5 text-white border-white/10">
                    {params.octaves}
                  </Badge>
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
                  <Label className="text-xs text-gray-300">Lacunarity</Label>
                  <Badge variant="outline" className="h-5 text-[10px] font-mono bg-white/5 text-white border-white/10">
                    {params.lacunarity.toFixed(2)}
                  </Badge>
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
                  <Label className="text-xs text-gray-300">Gain</Label>
                  <Badge variant="outline" className="h-5 text-[10px] font-mono bg-white/5 text-white border-white/10">
                    {params.gain.toFixed(2)}
                  </Badge>
                </div>
                <Slider
                  value={[params.gain]}
                  onValueChange={(v) => handleSliderChange("gain", v)}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>
            </div>
          )}

          {/* Ridge Offset (conditional) */}
          {currentNoiseConfig.requiresRidgeOffset && (
            <div className="pt-2 space-y-3 border-t border-white/10">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Ridge</p>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-gray-300">Offset</Label>
                  <Badge variant="outline" className="h-5 text-[10px] font-mono bg-white/5 text-white border-white/10">
                    {params.ridgeOffset.toFixed(2)}
                  </Badge>
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
          )}

          {/* Warp Strength (conditional) */}
          {currentNoiseConfig.requiresWarpStrength && (
            <div className="pt-2 space-y-3 border-t border-white/10">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Domain Warp</p>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-gray-300">Strength</Label>
                  <Badge variant="outline" className="h-5 text-[10px] font-mono bg-white/5 text-white border-white/10">
                    {params.warpStrength.toFixed(2)}
                  </Badge>
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
          )}

          {/* Animation */}
          <div className="pt-2 space-y-3 border-t border-white/10">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Animation</p>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-gray-300">Speed</Label>
                <Badge variant="outline" className="h-5 text-[10px] font-mono bg-white/5 text-white border-white/10">
                  {params.animationSpeed.toFixed(2)}
                </Badge>
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
          <div className="pt-2 space-y-3 border-t border-white/10">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Visualization</p>

            {/* Visualization Mode */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-300">Coloring Mode</Label>
              <Select
                value={params.visualizationMode}
                onValueChange={(
                  value: "solid" | "height" | "normal" | "wireframe"
                ) => onParamsChange({ visualizationMode: value })}
              >
                <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/95 backdrop-blur-md border-white/20">
                  <SelectItem value="solid" className="text-white hover:bg-white/10 text-xs">
                    Solid Color (Lit)
                  </SelectItem>
                  <SelectItem value="height" className="text-white hover:bg-white/10 text-xs">
                    Height-based Gradient
                  </SelectItem>
                  <SelectItem value="normal" className="text-white hover:bg-white/10 text-xs">
                    Normal Map
                  </SelectItem>
                  <SelectItem value="wireframe" className="text-white hover:bg-white/10 text-xs">
                    Wireframe
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Roughness Slider (visible only in solid mode) */}
            {params.visualizationMode === "solid" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-gray-300">Roughness</Label>
                  <Badge variant="outline" className="h-5 text-[10px] font-mono bg-white/5 text-white border-white/10">
                    {params.roughness.toFixed(2)}
                  </Badge>
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
              <Label className="text-xs text-gray-300">Wireframe Overlay</Label>
              <Button
                variant={params.wireframe ? "default" : "outline"}
                size="sm"
                onClick={() => onParamsChange({ wireframe: !params.wireframe })}
                className={`h-6 px-2 text-[10px] ${
                  params.wireframe
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                }`}
              >
                {params.wireframe ? "ON" : "OFF"}
              </Button>
            </div>

            {/* Subdivisions */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-gray-300">Subdivisions</Label>
                <Badge variant="outline" className="h-5 text-[10px] font-mono bg-white/5 text-white border-white/10">
                  {params.subdivisions}
                </Badge>
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
          <div className="pt-2 space-y-2 border-t border-white/10 pb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Presets</p>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPresetLoad(PRESETS.mountains)}
                className="h-7 justify-start text-[10px] bg-white/5 hover:bg-white/10 text-white border-white/10"
              >
                <Mountain className="w-3 h-3 mr-1.5" />
                Mountains
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPresetLoad(PRESETS.ocean)}
                className="h-7 justify-start text-[10px] bg-white/5 hover:bg-white/10 text-white border-white/10"
              >
                <Waves className="w-3 h-3 mr-1.5" />
                Ocean
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPresetLoad(PRESETS.organic)}
                className="h-7 justify-start text-[10px] bg-white/5 hover:bg-white/10 text-white border-white/10"
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                Organic
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPresetLoad(PRESETS.cellular)}
                className="h-7 justify-start text-[10px] bg-white/5 hover:bg-white/10 text-white border-white/10"
              >
                <Grid3x3 className="w-3 h-3 mr-1.5" />
                Cellular
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPresetLoad(PRESETS.turbulent)}
                className="h-7 justify-start text-[10px] bg-white/5 hover:bg-white/10 text-white border-white/10"
              >
                <Zap className="w-3 h-3 mr-1.5" />
                Turbulent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPresetLoad(PRESETS.default)}
                className="h-7 justify-start text-[10px] bg-white/5 hover:bg-white/10 text-white border-white/10"
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
