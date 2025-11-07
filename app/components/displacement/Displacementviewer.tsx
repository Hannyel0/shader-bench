"use client";

import React, { useState, useCallback } from "react";
import {
  DisplacementCanvas,
  DisplacementParams,
  PerformanceMetrics,
} from "./Displacementcanvas";
import { NoiseType, PRESETS, NoiseLibrary } from "../../utils/Noiselibrary";
import { NoiseControls } from "./Noisecontrols";
import { DisplacementConfigManager } from "./DisplacementConfigManager";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  Eye,
  EyeOff,
  TrendingUp,
  Cpu,
  MemoryStick,
  Triangle,
  Zap,
  Code,
  Copy,
} from "lucide-react";

export const DisplacementViewer: React.FC = () => {
  const [params, setParams] = useState<DisplacementParams>(PRESETS.default);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>(
    []
  );
  const [showCode, setShowCode] = useState(false);

  const handleParamsChange = useCallback(
    (newParams: Partial<DisplacementParams>) => {
      setParams((prev) => ({ ...prev, ...newParams }));
    },
    []
  );

  const handlePresetLoad = useCallback((preset: DisplacementParams) => {
    setParams(preset);
    // Reset metrics when changing presets
    setMetricsHistory([]);
  }, []);

  const handlePerformanceUpdate = useCallback(
    (newMetrics: PerformanceMetrics) => {
      setMetrics(newMetrics);

      // Store metrics history for analysis (keep last 60 samples)
      setMetricsHistory((prev) => {
        const updated = [...prev, newMetrics];
        return updated.slice(-60);
      });
    },
    []
  );

  const handleImport = useCallback((importedParams: DisplacementParams) => {
    setParams(importedParams);
    setMetricsHistory([]);
  }, []);

  const calculateAverageMetrics = (
    history: PerformanceMetrics[]
  ): PerformanceMetrics => {
    const sum = history.reduce(
      (acc, m) => ({
        fps: acc.fps + m.fps,
        frameTime: acc.frameTime + m.frameTime,
        avgFrameTime: acc.avgFrameTime + m.avgFrameTime,
        minFrameTime: Math.min(acc.minFrameTime, m.minFrameTime),
        maxFrameTime: Math.max(acc.maxFrameTime, m.maxFrameTime),
        droppedFrames: acc.droppedFrames + m.droppedFrames,
        totalFrames: m.totalFrames,
        triangleCount: m.triangleCount,
        drawCalls: m.drawCalls,
        geometryMemory: m.geometryMemory,
        resolution: m.resolution,
        pixelCount: m.pixelCount,
      }),
      {
        fps: 0,
        frameTime: 0,
        avgFrameTime: 0,
        minFrameTime: Infinity,
        maxFrameTime: 0,
        droppedFrames: 0,
        totalFrames: 0,
        triangleCount: 0,
        drawCalls: 0,
        geometryMemory: 0,
        resolution: { width: 0, height: 0 },
        pixelCount: 0,
      }
    );

    const count = history.length;
    return {
      fps: sum.fps / count,
      frameTime: sum.frameTime / count,
      avgFrameTime: sum.avgFrameTime / count,
      minFrameTime: sum.minFrameTime,
      maxFrameTime: sum.maxFrameTime,
      droppedFrames: sum.droppedFrames,
      totalFrames: sum.totalFrames,
      triangleCount: sum.triangleCount,
      drawCalls: sum.drawCalls,
      geometryMemory: sum.geometryMemory,
      resolution: sum.resolution,
      pixelCount: sum.pixelCount,
    };
  };

  const getPerformanceBadgeVariant = (
    fps: number
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (fps >= 58) return "default";
    if (fps >= 45) return "secondary";
    if (fps >= 30) return "outline";
    return "destructive";
  };

  const performanceGrade = (fps: number) => {
    if (fps >= 58) return "Excellent";
    if (fps >= 45) return "Good";
    if (fps >= 30) return "Fair";
    return "Poor";
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
                <Activity className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">
                  Real-Time Performance
                </span>
              </div>
              {metrics && (
                <>
                  <Separator orientation="vertical" className="h-6" />
                  <Badge
                    variant={getPerformanceBadgeVariant(metrics.fps)}
                    className="px-3 py-1"
                  >
                    {metrics.fps.toFixed(1)} FPS
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 font-mono">
                    {metrics.avgFrameTime.toFixed(2)}ms
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1">
                    {performanceGrade(metrics.fps)}
                  </Badge>
                </>
              )}
            </div>
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
          </div>
        </Card>

        {/* Canvas */}
        <Card className="overflow-hidden aspect-video bg-gradient-to-br from-muted/30 to-muted/10">
          <DisplacementCanvas
            params={params}
            onPerformanceUpdate={handlePerformanceUpdate}
          />
        </Card>

        {/* Shader Code Viewer */}
        {showCode && (
          <Card className="overflow-hidden">
            <div className="bg-muted/50 p-4 flex justify-between items-center border-b">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  Vertex Shader - Displacement Code
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Map noise types to library keys
                  const noiseLibraryKey = params.noiseType.replace(/F[12]$/, '').replace(/([A-Z])/g, (match) => match.toLowerCase());
                  const baseNoiseType = params.noiseType.includes('voronoi') ? 'voronoi' :
                                       params.noiseType.includes('cellular') ? 'cellular' :
                                       noiseLibraryKey as keyof typeof NoiseLibrary;

                  const shaderCode = `// Displacement Parameters
// Noise Type: ${params.noiseType}
// UV Scale: ${params.uvScale.toFixed(2)}
// Amplitude: ${params.amplitude.toFixed(2)}
// Frequency: ${params.frequency.toFixed(2)}
// Octaves: ${params.octaves}
// Gain: ${params.gain.toFixed(2)}
// Lacunarity: ${params.lacunarity.toFixed(2)}
// Ridge Offset: ${params.ridgeOffset.toFixed(2)}
// Warp Strength: ${params.warpStrength.toFixed(2)}

${NoiseLibrary.common}

${NoiseLibrary[baseNoiseType] || '// Noise function implementation'}

// Vertex Shader Implementation
// Apply this displacement in your vertex shader:
vec3 displacedPosition = position;
float displacement = ${params.noiseType}Noise(position * ${params.frequency.toFixed(2)});
displacement *= ${params.amplitude.toFixed(2)};
displacedPosition += normal * displacement;

gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);`;
                  navigator.clipboard.writeText(shaderCode);
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
            <pre className="p-6 overflow-x-auto bg-muted/20 text-sm max-h-96">
              <code className="font-mono text-emerald-500">
                {(() => {
                  // Map noise types to library keys
                  const noiseLibraryKey = params.noiseType.replace(/F[12]$/, '').replace(/([A-Z])/g, (match) => match.toLowerCase());
                  const baseNoiseType = params.noiseType.includes('voronoi') ? 'voronoi' :
                                       params.noiseType.includes('cellular') ? 'cellular' :
                                       noiseLibraryKey as keyof typeof NoiseLibrary;

                  return `// Displacement Parameters
// Noise Type: ${params.noiseType}
// UV Scale: ${params.uvScale.toFixed(2)}
// Amplitude: ${params.amplitude.toFixed(2)}
// Frequency: ${params.frequency.toFixed(2)}
// Octaves: ${params.octaves}
// Gain: ${params.gain.toFixed(2)}
// Lacunarity: ${params.lacunarity.toFixed(2)}
// Ridge Offset: ${params.ridgeOffset.toFixed(2)}
// Warp Strength: ${params.warpStrength.toFixed(2)}

${NoiseLibrary.common}

${NoiseLibrary[baseNoiseType] || '// Noise function implementation'}

// Vertex Shader Implementation
// Apply this displacement in your vertex shader:
vec3 displacedPosition = position;
float displacement = ${params.noiseType}Noise(position * ${params.frequency.toFixed(2)});
displacement *= ${params.amplitude.toFixed(2)};
displacedPosition += normal * displacement;

gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);`;
                })()}
              </code>
            </pre>
          </Card>
        )}

        {/* Detailed Metrics */}
        {metrics && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Performance Metrics</h3>
            </div>

            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* FPS */}
              <Card className="p-4 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Current FPS
                </p>
                <p className="text-3xl font-bold tabular-nums">
                  {metrics.fps.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {performanceGrade(metrics.fps)}
                </p>
              </Card>

              {/* Frame Time */}
              <Card className="p-4 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Frame Time
                </p>
                <p className="text-3xl font-bold tabular-nums">
                  {metrics.avgFrameTime.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">ms average</p>
              </Card>

              {/* Triangle Count */}
              <Card className="p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Triangle className="w-3 h-3 text-primary" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Triangles
                  </p>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {(metrics.triangleCount / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.triangleCount.toLocaleString()} tris
                </p>
              </Card>

              {/* Draw Calls */}
              <Card className="p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-3 h-3 text-primary" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Draw Calls
                  </p>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {metrics.drawCalls}
                </p>
                <p className="text-xs text-muted-foreground mt-1">per frame</p>
              </Card>
            </div>

            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Resolution */}
              <Card className="p-4 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Resolution
                </p>
                <p className="text-lg font-bold">
                  {metrics.resolution.width}×{metrics.resolution.height}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(metrics.pixelCount / 1_000_000).toFixed(2)}M pixels
                </p>
              </Card>

              {/* Memory */}
              <Card className="p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <MemoryStick className="w-3 h-3 text-primary" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Geometry
                  </p>
                </div>
                <p className="text-lg font-bold">
                  {(metrics.geometryMemory / 1024).toFixed(1)}KB
                </p>
                <p className="text-xs text-muted-foreground mt-1">VRAM usage</p>
              </Card>

              {/* Dropped Frames */}
              <Card className="p-4 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Dropped
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {metrics.droppedFrames}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  last 120 frames
                </p>
              </Card>

              {/* Frame Time Range */}
              <Card className="p-4 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Min / Max
                </p>
                <p className="text-lg font-bold">
                  {metrics.minFrameTime.toFixed(1)} /{" "}
                  {metrics.maxFrameTime.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">ms (range)</p>
              </Card>
            </div>

            {/* FPS History Graph */}
            {metricsHistory.length > 10 && (
              <div className="mt-6 space-y-2">
                <h4 className="text-sm font-semibold">
                  FPS Trend (Last 60 Samples)
                </h4>
                <div className="h-24 bg-muted/20 rounded-lg p-3 overflow-hidden">
                  <div className="flex items-end justify-between h-full gap-1">
                    {metricsHistory.slice(-60).map((m, i) => {
                      const height = Math.min((m.fps / 60) * 100, 100);
                      const color =
                        m.fps >= 58
                          ? "bg-emerald-500"
                          : m.fps >= 45
                          ? "bg-yellow-500"
                          : m.fps >= 30
                          ? "bg-orange-500"
                          : "bg-red-500";
                      return (
                        <div
                          key={i}
                          className={`flex-1 ${color} rounded-sm transition-all`}
                          style={{ height: `${height}%` }}
                          title={`${m.fps.toFixed(1)} FPS`}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 FPS</span>
                  <span>30 FPS</span>
                  <span>60 FPS</span>
                </div>
              </div>
            )}

            {/* Performance Analysis */}
            {metricsHistory.length > 30 && (
              <div className="mt-4 p-4 bg-muted/20 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">
                  Performance Analysis
                </h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Average FPS:</span>{" "}
                    <span className="font-mono font-semibold">
                      {calculateAverageMetrics(metricsHistory).fps.toFixed(1)}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Frame Stability:
                    </span>{" "}
                    <span className="font-mono font-semibold">
                      {metrics.droppedFrames < 5
                        ? "Stable"
                        : metrics.droppedFrames < 15
                        ? "Moderate"
                        : "Unstable"}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Pixel Fill Rate:
                    </span>{" "}
                    <span className="font-mono font-semibold">
                      {((metrics.pixelCount * metrics.fps) / 1_000_000).toFixed(
                        0
                      )}
                      M/s
                    </span>
                  </p>
                </div>
              </div>
            )}
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
                Performance Tracking:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>• Real-time FPS monitoring</div>
                <div>• Frame time analysis</div>
                <div>• Triangle count tracking</div>
                <div>• Draw call measurement</div>
                <div>• Geometry memory usage</div>
                <div>• Drop frame detection</div>
              </div>
            </div>
            <div className="pt-2">
              <p className="font-semibold text-foreground mb-2">
                Export Features:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>• Complete shader code</div>
                <div>• Noise function source</div>
                <div>• Implementation guide</div>
                <div>• Performance metrics</div>
                <div>• Code snippets</div>
                <div>• JSON configuration</div>
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

        {/* Config Export/Import Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Configuration Management</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Export complete displacement configuration with shader code,
            implementation guide, and performance metrics. Import configurations
            to quickly restore settings.
          </p>
          <DisplacementConfigManager
            currentParams={params}
            performanceMetrics={metrics || undefined}
            onImport={handleImport}
          />
        </Card>
      </div>
    </div>
  );
};
