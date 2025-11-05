"use client";

import React, { useState, useEffect } from "react";
import { PerformanceMetrics } from "./ShaderCanvas";

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

  return (
    <div className="resolution-benchmark">
      <h3>Resolution Performance Analysis</h3>
      <div className="benchmark-table">
        <table>
          <thead>
            <tr>
              <th>Resolution</th>
              <th>Pixels</th>
              <th>FPS</th>
              <th>Frame Time</th>
              <th>Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {sortedBenchmarks.map((entry) => (
              <tr
                key={entry.resolution}
                className={
                  currentMetrics?.resolution.width === entry.width
                    ? "active"
                    : ""
                }
              >
                <td className="resolution">{entry.resolution}</td>
                <td>{(entry.pixelCount / 1_000_000).toFixed(2)}M</td>
                <td className="fps">{entry.fps.toFixed(1)}</td>
                <td>{entry.avgFrameTime.toFixed(1)}ms</td>
                <td className="efficiency">{calculateEfficiency(entry)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .resolution-benchmark {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
        }

        h3 {
          color: #00ff00;
          font-size: 18px;
          margin: 0 0 16px 0;
          font-family: monospace;
        }

        .benchmark-table {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-family: monospace;
        }

        th {
          text-align: left;
          padding: 10px;
          background: #2a2a2a;
          color: #888;
          font-size: 12px;
          text-transform: uppercase;
          border-bottom: 2px solid #444;
        }

        td {
          padding: 10px;
          border-bottom: 1px solid #333;
          color: #aaa;
        }

        tr.active {
          background: rgba(0, 255, 0, 0.1);
          border-left: 3px solid #00ff00;
        }

        .resolution {
          color: #00aaff;
          font-weight: bold;
        }

        .fps {
          color: #00ff00;
          font-weight: bold;
        }

        .efficiency {
          color: #ffaa00;
        }

        tr:hover {
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
};
