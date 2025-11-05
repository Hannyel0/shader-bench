"use client";

import React from "react";
import { PerformanceMetrics } from "./ShaderCanvas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PerformanceOverlayProps {
  metrics: PerformanceMetrics | null;
  isFullscreen: boolean;
}

export const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({
  metrics,
  isFullscreen,
}) => {
  if (!metrics || !isFullscreen) return null;

  const getPerformanceBadgeVariant = (
    fps: number
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (fps >= 58) return "default";
    if (fps >= 45) return "secondary";
    if (fps >= 30) return "outline";
    return "destructive";
  };

  const pixelsPerFrame = (metrics.pixelCount / 1_000_000).toFixed(2);
  const pixelThroughput = (
    (metrics.pixelCount * metrics.fps) /
    1_000_000
  ).toFixed(0);

  return (
    <Card className="fixed top-5 right-5 z-[10000] min-w-[280px] bg-card/95 backdrop-blur-md border-border/50 shadow-2xl">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="font-mono text-xs">
            {metrics.resolution.width}×{metrics.resolution.height}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {pixelsPerFrame}M px/frame
          </span>
        </div>

        <Separator />

        {/* Main FPS Display */}
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            FPS
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums">
              {metrics.fps.toFixed(1)}
            </span>
            <Badge
              variant={getPerformanceBadgeVariant(metrics.fps)}
              className="text-xs"
            >
              {metrics.fps >= 58
                ? "Excellent"
                : metrics.fps >= 45
                  ? "Good"
                  : metrics.fps >= 30
                    ? "Fair"
                    : "Poor"}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Compact Metrics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Frame Time
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {metrics.avgFrameTime.toFixed(1)}ms
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Throughput
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {pixelThroughput}M px/s
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Dropped
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {metrics.droppedFrames}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Frames
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {metrics.totalFrames.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
