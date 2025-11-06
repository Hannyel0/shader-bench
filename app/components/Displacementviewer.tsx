"use client";

import React, { useState, useCallback } from "react";
import {
  DisplacementCanvas,
  DisplacementParams,
  PerformanceMetrics,
} from "./Displacementcanvas";
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
  TrendingUp,
  Cpu,
  MemoryStick,
  Triangle,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export const DisplacementViewer: React.FC = () => {
  const [params, setParams] = useState<DisplacementParams>(PRESETS.default);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>(
    []
  );
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

  const exportMetrics = () => {
    if (!metrics) return;

    const avgMetrics =
      metricsHistory.length > 0
        ? calculateAverageMetrics(metricsHistory)
        : metrics;

    const data = {
      shader: "Displacement Sphere",
      noiseType: params.noiseType,
      subdivisions: params.subdivisions,
      timestamp: new Date().toISOString(),
      currentMetrics: metrics,
      averageMetrics: avgMetrics,
      samples: metricsHistory.length,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `displacement-metrics-${Date.now()}.json`;
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
Subdivisions: ${params.subdivisions}×${params.subdivisions}
Triangle Count: ${params.subdivisions * params.subdivisions * 2}

// Visualization
Mode: ${params.visualizationMode}
Wireframe: ${params.wireframe}

// Usage:
// Apply these parameters to your custom displacement shader
// for identical results in your Three.js/Unity/Unreal Engine project.
`;
  };

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
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Performance</span>
              </div>
              {metrics && (
                <>
                  <Badge
                    variant={getPerformanceBadgeVariant(metrics.fps)}
                    className="font-mono"
                  >
                    {metrics.fps.toFixed(1)} FPS
                  </Badge>
                  <Badge variant="outline" className="font-mono">
                    {metrics.avgFrameTime.toFixed(1)}ms
                  </Badge>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">
                      {params.subdivisions}×{params.subdivisions}
                    </span>{" "}
                    vertices (
                    {(
                      params.subdivisions * params.subdivisions
                    ).toLocaleString()}{" "}
                    total)
                  </div>
                </>
              )}
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
                Config
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportMetrics}
                disabled={!metrics}
              >
                <Download className="w-4 h-4 mr-2" />
                Metrics
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
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Advanced Performance Metrics */}
        {metrics && (
          <Card className="p-6 bg-gradient-to-br from-card to-card/50">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">
                Real-Time Performance Analysis
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Main FPS Card */}
              <Card className="p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    FPS
                  </p>
                  <Badge
                    variant={getPerformanceBadgeVariant(metrics.fps)}
                    className="text-xs"
                  >
                    {performanceGrade(metrics.fps)}
                  </Badge>
                </div>
                <p className="text-3xl font-bold tabular-nums">
                  {metrics.fps.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: 60 FPS
                </p>
              </Card>

              {/* Frame Time */}
              <Card className="p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-3 h-3 text-primary" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Frame Time
                  </p>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {metrics.avgFrameTime.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">ms (avg)</p>
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

            {/* FPS History Graph (Simple Text-Based) */}
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
