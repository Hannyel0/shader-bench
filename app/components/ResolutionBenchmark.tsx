"use client";

import React, { useState, useEffect } from "react";
import { PerformanceMetrics } from "./ShaderCanvas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

    // Round to avoid floating point issues
    const width = Math.round(currentMetrics.resolution.width);
    const height = Math.round(currentMetrics.resolution.height);
    const key = `${width}x${height}`;

    setBenchmarks((prev) => {
      const existingIndex = prev.findIndex((b) => b.resolution === key);

      const newEntry: BenchmarkEntry = {
        resolution: key,
        width,
        height,
        pixelCount: width * height,
        fps: currentMetrics.fps,
        avgFrameTime: currentMetrics.avgFrameTime,
        timestamp: Date.now(),
      };

      if (existingIndex >= 0) {
        // Update existing entry
        return prev.map((b, i) => (i === existingIndex ? newEntry : b));
      } else {
        // Add new entry
        return [...prev, newEntry];
      }
    });
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
    frameTime: Number(entry.avgFrameTime.toFixed(1)),
  }));

  return (
    <div className="space-y-4">
      {/* Performance Chart */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">FPS by Resolution</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="resolution"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              label={{ value: 'FPS', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Bar dataKey="FPS" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
