"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { ShaderCanvas, PerformanceMetrics } from "./ShaderCanvas";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { PerformanceOverlay } from "./PerformanceOverlay";
import { ResolutionBenchmark } from "./ResolutionBenchmark";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  Circle,
  Square,
  Download,
  Copy,
  Code,
} from "lucide-react";

interface ShaderViewerProps {
  shader: ShaderDefinition;
  width?: number;
  height?: number;
  showPerformance?: boolean;
  showCode?: boolean;
  onMetricsCapture?: (shader: string, metrics: PerformanceMetrics) => void;
}

export interface ShaderDefinition {
  name: string;
  author?: string;
  description?: string;
  fragmentShader: string;
  tags?: string[];
  thumbnailUrl?: string;
}

export const ShaderViewer: React.FC<ShaderViewerProps> = ({
  shader,
  width = 800,
  height = 600,
  showPerformance = true,
  showCode = false,
  onMetricsCapture,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isCodeVisible, setIsCodeVisible] = useState(showCode);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedMetrics, setRecordedMetrics] = useState<PerformanceMetrics[]>(
    []
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenDimensions, setFullscreenDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeShaderRef = useRef<((w: number, h: number) => void) | null>(null);

  const handlePerformanceUpdate = useCallback(
    (newMetrics: PerformanceMetrics) => {
      setMetrics(newMetrics);

      if (isRecording) {
        setRecordedMetrics((prev) => [...prev, newMetrics]);
      }

      if (onMetricsCapture) {
        onMetricsCapture(shader.name, newMetrics);
      }
    },
    [shader.name, onMetricsCapture, isRecording]
  );

  const startRecording = () => {
    setRecordedMetrics([]);
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordedMetrics.length > 0) {
      const avgMetrics = calculateAverageMetrics(recordedMetrics);
      console.log("Recording complete:", avgMetrics);
      return avgMetrics;
    }
  };

  const calculateAverageMetrics = (
    metricsArray: PerformanceMetrics[]
  ): PerformanceMetrics => {
    const sum = metricsArray.reduce(
      (acc, m) => ({
        fps: acc.fps + m.fps,
        frameTime: acc.frameTime + m.frameTime,
        avgFrameTime: acc.avgFrameTime + m.avgFrameTime,
        minFrameTime: Math.min(acc.minFrameTime, m.minFrameTime),
        maxFrameTime: Math.max(acc.maxFrameTime, m.maxFrameTime),
        droppedFrames: acc.droppedFrames + m.droppedFrames,
        totalFrames: m.totalFrames,
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
        resolution: { width: 0, height: 0 },
        pixelCount: 0,
      }
    );

    const count = metricsArray.length;
    return {
      fps: sum.fps / count,
      frameTime: sum.frameTime / count,
      avgFrameTime: sum.avgFrameTime / count,
      minFrameTime: sum.minFrameTime,
      maxFrameTime: sum.maxFrameTime,
      droppedFrames: sum.droppedFrames,
      totalFrames: sum.totalFrames,
      resolution: sum.resolution,
      pixelCount: sum.pixelCount,
    };
  };

  const exportMetrics = () => {
    if (!metrics) return;

    const data = {
      shader: shader.name,
      timestamp: new Date().toISOString(),
      metrics,
      recordedSamples: recordedMetrics.length,
      averageRecordedMetrics:
        recordedMetrics.length > 0
          ? calculateAverageMetrics(recordedMetrics)
          : null,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${shader.name.replace(
      /\s+/g,
      "_"
    )}_metrics_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResize = useCallback((resizeFn: (w: number, h: number) => void) => {
    resizeShaderRef.current = resizeFn;
  }, []);

  const enterFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      await container.requestFullscreen();
      
      // Get actual screen dimensions
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      
      setFullscreenDimensions({ width: screenWidth, height: screenHeight });
      setIsFullscreen(true);
      
      // Resize canvas to fullscreen dimensions
      if (resizeShaderRef.current) {
        resizeShaderRef.current(screenWidth, screenHeight);
      }
    } catch (err) {
      console.error("Fullscreen request failed:", err);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
    
    // Restore original dimensions
    if (resizeShaderRef.current) {
      resizeShaderRef.current(width, height);
    }
  }, [width, height]);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen, exitFullscreen]);

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 p-6 border-b">
        <div className="flex justify-between items-start gap-6 flex-wrap">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{shader.name}</h2>
              {shader.tags && shader.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {shader.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {shader.author && (
              <p className="text-sm text-muted-foreground">by {shader.author}</p>
            )}
            {shader.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {shader.description}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCodeVisible(!isCodeVisible)}
            >
              {isCodeVisible ? (
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
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <>
                  <Minimize className="w-4 h-4 mr-2" />
                  Exit
                </>
              ) : (
                <>
                  <Maximize className="w-4 h-4 mr-2" />
                  Fullscreen
                </>
              )}
            </Button>
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              className={isRecording ? "animate-pulse" : ""}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 mr-2 fill-current" />
                  Stop
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 mr-2" />
                  Record
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportMetrics}
              disabled={!metrics}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Canvas Container */}
        <div className="relative inline-block" ref={containerRef}>
          <div className="border-2 rounded-lg overflow-hidden bg-black">
            <ShaderCanvas
              fragmentShader={shader.fragmentShader}
              width={isFullscreen ? fullscreenDimensions.width : width}
              height={isFullscreen ? fullscreenDimensions.height : height}
              onPerformanceUpdate={handlePerformanceUpdate}
              onResize={handleResize}
            />
          </div>
          {isRecording && (
            <Badge
              variant="destructive"
              className="absolute top-3 right-3 animate-pulse font-mono"
            >
              <Circle className="w-2 h-2 mr-2 fill-current" />
              RECORDING
            </Badge>
          )}
          <PerformanceOverlay metrics={metrics} isFullscreen={isFullscreen} />
        </div>

        {/* Performance Metrics */}
        {showPerformance && !isFullscreen && (
          <>
            <PerformanceMonitor metrics={metrics} showGraph={true} />
            <ResolutionBenchmark currentMetrics={metrics} />
          </>
        )}

        {/* Code Viewer */}
        {isCodeVisible && (
          <Card className="overflow-hidden">
            <div className="bg-muted/50 p-4 flex justify-between items-center border-b">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="text-sm font-semibold">Fragment Shader Code</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(shader.fragmentShader);
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
            <pre className="p-6 overflow-x-auto bg-muted/20 text-sm">
              <code className="font-mono text-emerald-500">
                {shader.fragmentShader}
              </code>
            </pre>
          </Card>
        )}
      </div>

      <style jsx>{`
        .canvas-container:fullscreen {
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .canvas-container:fullscreen canvas {
          border: none;
          border-radius: 0;
        }
      `}</style>
    </Card>
  );
};
