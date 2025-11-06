"use client";

import React from "react";
import { DisplacementParams } from "./Displacementcanvas";
import { NoiseType, NoiseConfigs } from "../utils/Noiselibrary";
import { Card } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
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
    <div className="space-y-6">
      {/* Noise Type Selection */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Noise Function</h3>
              <p className="text-sm text-muted-foreground">
                {currentNoiseConfig.description}
              </p>
            </div>
          </div>

          <Select
            value={params.noiseType}
            onValueChange={(value: NoiseType) =>
              onParamsChange({ noiseType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(NoiseConfigs).map((config) => (
                <SelectItem key={config.type} value={config.type}>
                  <div className="flex flex-col">
                    <span className="font-medium">{config.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {config.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Core Parameters */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Core Parameters</h3>
        <div className="space-y-6">
          {/* Amplitude */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Displacement Amplitude</Label>
              <Badge variant="outline" className="font-mono">
                {params.amplitude.toFixed(2)}
              </Badge>
            </div>
            <Slider
              value={[params.amplitude]}
              onValueChange={(v) => handleSliderChange("amplitude", v)}
              min={0}
              max={1}
              step={0.01}
            />
            <p className="text-xs text-muted-foreground">
              Strength of the displacement effect
            </p>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Frequency</Label>
              <Badge variant="outline" className="font-mono">
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
            <p className="text-xs text-muted-foreground">
              Detail level - higher creates smaller features
            </p>
          </div>

          {/* UV Scale */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>UV Scale</Label>
              <Badge variant="outline" className="font-mono">
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
            <p className="text-xs text-muted-foreground">
              Global texture coordinate scaling
            </p>
          </div>
        </div>
      </Card>

      {/* Fractal Parameters (conditional) */}
      {currentNoiseConfig.requiresOctaves && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Fractal Parameters</h3>
          <div className="space-y-6">
            {/* Octaves */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Octaves</Label>
                <Badge variant="outline" className="font-mono">
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
              <p className="text-xs text-muted-foreground">
                Number of noise layers to combine
              </p>
            </div>

            {/* Lacunarity */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Lacunarity</Label>
                <Badge variant="outline" className="font-mono">
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
              <p className="text-xs text-muted-foreground">
                Frequency multiplier between octaves
              </p>
            </div>

            {/* Gain/Persistence */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Gain (Persistence)</Label>
                <Badge variant="outline" className="font-mono">
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
              <p className="text-xs text-muted-foreground">
                Amplitude multiplier between octaves
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Ridge Offset (conditional) */}
      {currentNoiseConfig.requiresRidgeOffset && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Ridge Parameters</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Ridge Offset</Label>
              <Badge variant="outline" className="font-mono">
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
            <p className="text-xs text-muted-foreground">
              Controls ridge sharpness and inversion
            </p>
          </div>
        </Card>
      )}

      {/* Warp Strength (conditional) */}
      {currentNoiseConfig.requiresWarpStrength && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Domain Warp</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Warp Strength</Label>
              <Badge variant="outline" className="font-mono">
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
            <p className="text-xs text-muted-foreground">
              Strength of domain distortion
            </p>
          </div>
        </Card>
      )}

      {/* Animation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Animation</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Animation Speed</Label>
            <Badge variant="outline" className="font-mono">
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
          <p className="text-xs text-muted-foreground">
            Speed of noise evolution (0 = frozen)
          </p>
        </div>
      </Card>

      {/* Visualization */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Visualization</h3>
        <div className="space-y-4">
          {/* Visualization Mode */}
          <div className="space-y-2">
            <Label>Coloring Mode</Label>
            <Select
              value={params.visualizationMode}
              onValueChange={(
                value: "solid" | "height" | "normal" | "wireframe"
              ) => onParamsChange({ visualizationMode: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">
                  <span>Solid Color (Lit)</span>
                </SelectItem>
                <SelectItem value="height">
                  <span>Height-based Gradient</span>
                </SelectItem>
                <SelectItem value="normal">
                  <span>Normal Map</span>
                </SelectItem>
                <SelectItem value="wireframe">
                  <span>Wireframe</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Wireframe Toggle */}
          <div className="flex items-center justify-between">
            <Label>Wireframe Overlay</Label>
            <Button
              variant={params.wireframe ? "default" : "outline"}
              size="sm"
              onClick={() => onParamsChange({ wireframe: !params.wireframe })}
            >
              {params.wireframe ? "ON" : "OFF"}
            </Button>
          </div>

          {/* Subdivisions */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Mesh Subdivisions</Label>
              <Badge variant="outline" className="font-mono">
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
            <p className="text-xs text-muted-foreground">
              Geometry density (higher = smoother but slower)
            </p>
          </div>
        </div>
      </Card>

      {/* Presets */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Presets</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => onPresetLoad(PRESETS.mountains)}
            className="justify-start"
          >
            <Mountain className="w-4 h-4 mr-2" />
            Mountains
          </Button>
          <Button
            variant="outline"
            onClick={() => onPresetLoad(PRESETS.ocean)}
            className="justify-start"
          >
            <Waves className="w-4 h-4 mr-2" />
            Ocean
          </Button>
          <Button
            variant="outline"
            onClick={() => onPresetLoad(PRESETS.organic)}
            className="justify-start"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Organic
          </Button>
          <Button
            variant="outline"
            onClick={() => onPresetLoad(PRESETS.cellular)}
            className="justify-start"
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            Cellular
          </Button>
          <Button
            variant="outline"
            onClick={() => onPresetLoad(PRESETS.turbulent)}
            className="justify-start"
          >
            <Zap className="w-4 h-4 mr-2" />
            Turbulent
          </Button>
          <Button
            variant="outline"
            onClick={() => onPresetLoad(PRESETS.default)}
            className="justify-start"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </Card>
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
  },
};
