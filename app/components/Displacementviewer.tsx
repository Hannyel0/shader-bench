"use client";

import React, { useState, useCallback } from "react";
import { DisplacementCanvas, DisplacementParams } from "./Displacementcanvas";
import { NoiseType, PRESETS } from "../utils/Noiselibrary";
import { NoiseControls } from "./Noisecontrols";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Copy,
  CheckCircle,
  Activity,
  Code,
  Eye,
  EyeOff,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export const DisplacementViewer: React.FC = () => {
  const [params, setParams] = useState<DisplacementParams>(PRESETS.default);
  const [fps, setFps] = useState<number>(60);
  const [showCode, setShowCode] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedShader, setCopiedShader] = useState(false);

  const handleParamsChange = useCallback(
    (newParams: Partial<DisplacementParams>) => {
      setParams((prev) => ({ ...prev, ...newParams }));
    },
    []
  );

  const handlePresetLoad = useCallback((preset: DisplacementParams) => {
    setParams(preset);
  }, []);

  const handlePerformanceUpdate = useCallback((currentFps: number) => {
    setFps(currentFps);
  }, []);

  const exportConfig = () => {
    const config = JSON.stringify(params, null, 2);
    const blob = new Blob([config], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `displacement-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyConfigToClipboard = async () => {
    const config = JSON.stringify(params, null, 2);
    await navigator.clipboard.writeText(config);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const copyShaderCode = async () => {
    const shaderCode = generateShaderCode();
    await navigator.clipboard.writeText(shaderCode);
    setCopiedShader(true);
    setTimeout(() => setCopiedShader(false), 2000);
  };

  const generateShaderCode = (): string => {
    return `// Generated Displacement Shader Configuration
// Noise Type: ${params.noiseType}

// Vertex Shader Parameters
uniform float uAmplitude: ${params.amplitude};
uniform float uFrequency: ${params.frequency};
uniform int uOctaves: ${params.octaves};
uniform float uLacunarity: ${params.lacunarity};
uniform float uGain: ${params.gain};
uniform float uRidgeOffset: ${params.ridgeOffset};
uniform float uWarpStrength: ${params.warpStrength};
uniform float uUVScale: ${params.uvScale};
uniform float uAnimationSpeed: ${params.animationSpeed};

// Geometry
Subdivisions: ${params.subdivisions}x${params.subdivisions}

// Visualization
Mode: ${params.visualizationMode}
Wireframe: ${params.wireframe}

// Usage:
// Apply these parameters to your custom displacement shader
// for identical results in your Three.js/Unity/Unreal Engine project.
`;
  };

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6">
      {/* Main Canvas Area */}
      <div className="space-y-4">
        {/* Performance Header */}
        <Card className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Performance</span>
              </div>
              <Badge
                variant={
                  fps >= 55
                    ? "default"
                    : fps >= 30
                    ? "secondary"
                    : "destructive"
                }
                className="font-mono"
              >
                {fps} FPS
              </Badge>
              <Separator orientation="vertical" className="h-6" />
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">
                  {params.subdivisions}×{params.subdivisions}
                </span>{" "}
                vertices (
                {(params.subdivisions * params.subdivisions).toLocaleString()}{" "}
                total)
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCode(!showCode)}
              >
                {showCode ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide Code
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Show Code
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={exportConfig}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyConfigToClipboard}
              >
                {copiedConfig ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Config
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* 3D Canvas */}
        <Card className="overflow-hidden">
          <div
            className="bg-black border-2 border-border/50"
            style={{ aspectRatio: "16/10" }}
          >
            <DisplacementCanvas
              params={params}
              onPerformanceUpdate={handlePerformanceUpdate}
            />
          </div>
          <div className="p-4 bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {params.noiseType}
              </Badge>
              <span>•</span>
              <span>Drag to rotate • Scroll to zoom • Right-click to pan</span>
            </div>
          </div>
        </Card>

        {/* Shader Code Export */}
        {showCode && (
          <Card className="overflow-hidden">
            <div className="bg-muted/50 p-4 flex justify-between items-center border-b">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  Shader Configuration Export
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={copyShaderCode}>
                {copiedShader ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="p-4">
              <Textarea
                value={generateShaderCode()}
                readOnly
                className="font-mono text-sm h-64 resize-none"
              />
            </div>
          </Card>
        )}

        {/* Info Card */}
        <Card className="p-6 bg-muted/30">
          <h3 className="text-lg font-semibold mb-3">About Displacement Lab</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Real-time procedural displacement testing environment for
              evaluating noise functions on 3D geometry. All displacement
              calculations occur in vertex shaders with proper normal
              recalculation for accurate lighting.
            </p>
            <div className="pt-2">
              <p className="font-semibold text-foreground mb-2">
                Supported Noise Types:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>• Perlin Noise</div>
                <div>• Simplex Noise</div>
                <div>• Voronoi/Worley (F1, F2)</div>
                <div>• FBM (Perlin & Simplex)</div>
                <div>• Turbulence</div>
                <div>• Ridge Noise</div>
                <div>• Domain Warping</div>
                <div>• Cellular/Tiles</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls Sidebar */}
      <div className="space-y-4">
        <NoiseControls
          params={params}
          onParamsChange={handleParamsChange}
          onPresetLoad={handlePresetLoad}
        />
      </div>
    </div>
  );
};
