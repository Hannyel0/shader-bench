"use client";

import React, { useEffect, useRef, useState } from "react";
import { PerformanceMetrics } from "./ShaderCanvas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart } from "@tremor/react";

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics | null;
  showGraph?: boolean;
  className?: string;
}

interface ChartDataPoint {
  time: string;
  FPS: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  metrics,
  showGraph = true,
  className = "",
}) => {
  const historyRef = useRef<number[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    if (!metrics || !showGraph) return;

    // Add current FPS to history
    historyRef.current.push(metrics.fps);
    if (historyRef.current.length > 60) {
      historyRef.current.shift();
    }

    // Convert to chart data format
    const newChartData = historyRef.current.map((fps, index) => ({
      time: `${index}`,
      FPS: Number(fps.toFixed(1)),
    }));

    setChartData(newChartData);
  }, [metrics, showGraph]);

  if (!metrics) {
    return (
      <Card className={`p-6 ${className}`}>
        <p className="text-muted-foreground">Waiting for metrics...</p>
      </Card>
    );
  }

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
    <div className={`space-y-4 ${className}`}>
      {/* Main FPS Card */}
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Current FPS
            </p>
            <div className="flex items-baseline gap-3">
              <p className="text-5xl font-bold tracking-tight">
                {metrics.fps.toFixed(1)}
              </p>
              <Badge variant={getPerformanceBadgeVariant(metrics.fps)}>
                {performanceGrade(metrics.fps)}
              </Badge>
            </div>
          </div>
          <div className="text-right space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Resolution</p>
              <p className="text-sm font-semibold">
                {metrics.resolution.width} × {metrics.resolution.height}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pixels</p>
              <p className="text-sm font-semibold">
                {metrics.pixelCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Frame Time
          </p>
          <p className="text-2xl font-bold">{metrics.frameTime.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">ms (current)</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Avg Frame Time
          </p>
          <p className="text-2xl font-bold">
            {metrics.avgFrameTime.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">ms (average)</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Min / Max
          </p>
          <p className="text-lg font-bold">
            {metrics.minFrameTime.toFixed(1)} / {metrics.maxFrameTime.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">ms (range)</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Dropped Frames
          </p>
          <p className="text-2xl font-bold">{metrics.droppedFrames}</p>
          <p className="text-xs text-muted-foreground mt-1">last 120 frames</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Total Frames
          </p>
          <p className="text-2xl font-bold">
            {metrics.totalFrames.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">since start</p>
        </Card>

        {metrics.gpuTime !== undefined && (
          <Card className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              GPU Time
            </p>
            <p className="text-2xl font-bold">{metrics.gpuTime.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">ms (GPU)</p>
          </Card>
        )}
      </div>

      {/* FPS Chart */}
      {showGraph && chartData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">FPS History</h3>
          <AreaChart
            className="h-32"
            data={chartData}
            index="time"
            categories={["FPS"]}
            colors={["emerald"]}
            showXAxis={false}
            showLegend={false}
            showGridLines={false}
            curveType="monotone"
            minValue={0}
            maxValue={60}
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>60 frames ago</span>
            <span>Current</span>
          </div>
        </Card>
      )}
    </div>
  );
};
