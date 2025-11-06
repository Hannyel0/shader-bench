"use client";

import React, { useState, useEffect } from "react";
import { PerformanceMetrics } from "./ShaderCanvas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, TrendingUp } from "lucide-react";
import { BarChart } from "@tremor/react";

interface ResolutionBenchmarkProps {
  currentMetrics: PerformanceMetrics | null;
}

interface BenchmarkEntry {
  resolution: string;
  width: number;
  height: number;
  pixelCount: number;
  fps: number;
  avgFrameTime: number;
  timestamp: number;
}

export const ResolutionBenchmark: React.FC<ResolutionBenchmarkProps> = ({
  currentMetrics,
}) => {
  const [benchmarks, setBenchmarks] = useState<BenchmarkEntry[]>([]);

  useEffect(() => {
    if (!currentMetrics) return;

    const key = `${currentMetrics.resolution.width}x${currentMetrics.resolution.height}`;
    const existingIndex = benchmarks.findIndex(
      (b) => b.resolution === key
    );

    const newEntry: BenchmarkEntry = {
      resolution: key,
      width: currentMetrics.resolution.width,
      height: currentMetrics.resolution.height,
      pixelCount: currentMetrics.pixelCount,
      fps: currentMetrics.fps,
      avgFrameTime: currentMetrics.avgFrameTime,
      timestamp: Date.now(),
    };

    if (existingIndex >= 0) {
      // Update existing entry
      setBenchmarks((prev) =>
        prev.map((b, i) => (i === existingIndex ? newEntry : b))
      );
    } else {
      // Add new entry
      setBenchmarks((prev) => [...prev, newEntry]);
    }
  }, [currentMetrics?.resolution.width, currentMetrics?.resolution.height]);

  const calculateEfficiency = (entry: BenchmarkEntry) => {
    // Megapixels per second per FPS (normalization metric)
    return ((entry.pixelCount / 1_000_000) / entry.avgFrameTime * 1000).toFixed(2);
  };

  const sortedBenchmarks = [...benchmarks].sort((a, b) => a.pixelCount - b.pixelCount);

  if (benchmarks.length === 0) return null;

  // Prepare chart data
  const chartData = sortedBenchmarks.map((entry) => ({
    resolution: entry.resolution,
    FPS: Number(entry.fps.toFixed(1)),
    "Frame Time": Number(entry.avgFrameTime.toFixed(1)),
  }));

  return (
    <div className="space-y-4">
      {/* Performance Chart */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">FPS by Resolution</h3>
        </div>
        <BarChart
          className="h-48"
          data={chartData}
          index="resolution"
          categories={["FPS"]}
          colors={["emerald"]}
          showLegend={false}
          showGridLines={true}
          yAxisWidth={48}
        />
      </Card>

      {/* Detailed Table */}
      <Card className="overflow-hidden">
        <div className="bg-muted/50 p-4 border-b">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Resolution Performance Analysis</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Resolution
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pixels
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  FPS
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Frame Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Efficiency
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedBenchmarks.map((entry) => {
                const isActive = currentMetrics?.resolution.width === entry.width;
                return (
                  <tr
                    key={entry.resolution}
                    className={`border-b hover:bg-muted/50 transition-colors ${
                      isActive ? "bg-primary/10 border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-primary">
                          {entry.resolution}
                        </span>
                        {isActive && (
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                      {(entry.pixelCount / 1_000_000).toFixed(2)}M
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="default" className="font-mono">
                        {entry.fps.toFixed(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {entry.avgFrameTime.toFixed(1)}ms
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="font-mono">
                        {calculateEfficiency(entry)}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
