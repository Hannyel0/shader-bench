"use client";

import React, { useEffect, useRef } from "react";
import { PerformanceMetrics } from "./ShaderCanvas";

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics | null;
  showGraph?: boolean;
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  metrics,
  showGraph = true,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[]>([]);

  useEffect(() => {
    if (!metrics || !showGraph || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Add current FPS to history
    historyRef.current.push(metrics.fps);
    if (historyRef.current.length > 120) {
      historyRef.current.shift();
    }

    // Clear canvas
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 60; i += 15) {
      const y = canvas.height - (i / 60) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();

      ctx.fillStyle = "#666";
      ctx.font = "10px monospace";
      ctx.fillText(`${i}`, 5, y - 2);
    }

    // Draw FPS line
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;
    ctx.beginPath();

    historyRef.current.forEach((fps, index) => {
      const x = (index / 120) * canvas.width;
      const y = canvas.height - Math.min(fps / 60, 1) * canvas.height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw 60 FPS target line
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw current FPS text
    ctx.fillStyle = "#00ff00";
    ctx.font = "bold 14px monospace";
    ctx.fillText(`${metrics.fps.toFixed(1)} FPS`, canvas.width - 80, 20);
  }, [metrics, showGraph]);

  if (!metrics) {
    return (
      <div className={`performance-monitor ${className}`}>
        <p>Waiting for metrics...</p>
      </div>
    );
  }

  const getPerformanceColor = (fps: number) => {
    if (fps >= 55) return "#00ff00";
    if (fps >= 30) return "#ffaa00";
    return "#ff0000";
  };

  const performanceGrade = (fps: number) => {
    if (fps >= 58) return "Excellent";
    if (fps >= 45) return "Good";
    if (fps >= 30) return "Fair";
    return "Poor";
  };

  return (
    <div className={`performance-monitor ${className}`}>
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-label">FPS</div>
          <div
            className="metric-value"
            style={{ color: getPerformanceColor(metrics.fps) }}
          >
            {metrics.fps.toFixed(1)}
          </div>
          <div className="metric-sub">{performanceGrade(metrics.fps)}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Frame Time</div>
          <div className="metric-value">{metrics.frameTime.toFixed(2)}ms</div>
          <div className="metric-sub">Current</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Avg Frame Time</div>
          <div className="metric-value">
            {metrics.avgFrameTime.toFixed(2)}ms
          </div>
          <div className="metric-sub">Rolling average</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Min / Max</div>
          <div className="metric-value small">
            {metrics.minFrameTime.toFixed(1)} /{" "}
            {metrics.maxFrameTime.toFixed(1)}ms
          </div>
          <div className="metric-sub">Frame time range</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Dropped Frames</div>
          <div className="metric-value">{metrics.droppedFrames}</div>
          <div className="metric-sub">Last 120 frames</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total Frames</div>
          <div className="metric-value">
            {metrics.totalFrames.toLocaleString()}
          </div>
          <div className="metric-sub">Since start</div>
        </div>
      </div>

      {showGraph && (
        <div className="graph-container">
          <canvas
            ref={canvasRef}
            width={600}
            height={150}
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      )}

      <style>{`
        .performance-monitor {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 20px;
          color: #fff;
          font-family: 'Consolas', 'Monaco', monospace;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .metric-card {
          background: #1a1a1a;
          border-radius: 6px;
          padding: 15px;
          border: 1px solid #444;
        }

        .metric-card.primary {
          grid-column: span 2;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 2px solid #00ff00;
        }

        .metric-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        .metric-value {
          font-size: 28px;
          font-weight: bold;
          color: #00ff00;
          line-height: 1;
          margin-bottom: 5px;
        }

        .metric-value.small {
          font-size: 20px;
        }

        .metric-card.primary .metric-value {
          font-size: 48px;
        }

        .metric-sub {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
        }

        .graph-container {
          background: #1a1a1a;
          border-radius: 6px;
          padding: 10px;
          border: 1px solid #444;
        }

        .graph-container canvas {
          display: block;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};
