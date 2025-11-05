"use client";

import React from "react";
import { PerformanceMetrics } from "./ShaderCanvas";

interface PerformanceOverlayProps {
  metrics: PerformanceMetrics | null;
  isFullscreen: boolean;
}

export const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({
  metrics,
  isFullscreen,
}) => {
  if (!metrics || !isFullscreen) return null;

  const getPerformanceColor = (fps: number) => {
    if (fps >= 55) return "#00ff00";
    if (fps >= 30) return "#ffaa00";
    return "#ff0000";
  };

  const pixelsPerFrame = (metrics.pixelCount / 1_000_000).toFixed(2);
  const pixelThroughput = ((metrics.pixelCount * metrics.fps) / 1_000_000).toFixed(0);

  return (
    <div className="performance-overlay">
      <div className="overlay-header">
        <div className="resolution-badge">
          {metrics.resolution.width}×{metrics.resolution.height}
        </div>
        <div className="pixel-count">{pixelsPerFrame}M px/frame</div>
      </div>

      <div className="metrics-compact">
        <div className="metric-row primary">
          <span className="label">FPS</span>
          <span
            className="value"
            style={{ color: getPerformanceColor(metrics.fps) }}
          >
            {metrics.fps.toFixed(1)}
          </span>
        </div>

        <div className="metric-row">
          <span className="label">Frame Time</span>
          <span className="value">{metrics.avgFrameTime.toFixed(1)}ms</span>
        </div>

        <div className="metric-row">
          <span className="label">Throughput</span>
          <span className="value">{pixelThroughput}M px/s</span>
        </div>

        <div className="metric-row">
          <span className="label">Dropped</span>
          <span className="value">{metrics.droppedFrames}</span>
        </div>
      </div>

      <style jsx>{`
        .performance-overlay {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 255, 0, 0.3);
          border-radius: 12px;
          padding: 16px;
          color: #fff;
          font-family: "Consolas", "Monaco", monospace;
          z-index: 10000;
          min-width: 240px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }

        .overlay-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .resolution-badge {
          background: rgba(0, 255, 0, 0.2);
          color: #00ff00;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: bold;
          border: 1px solid rgba(0, 255, 0, 0.4);
        }

        .pixel-count {
          font-size: 11px;
          color: #888;
        }

        .metrics-compact {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
        }

        .metric-row.primary {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 10px;
        }

        .metric-row.primary .value {
          font-size: 32px;
          font-weight: bold;
        }

        .label {
          font-size: 11px;
          text-transform: uppercase;
          color: #888;
          letter-spacing: 0.5px;
        }

        .value {
          font-size: 16px;
          font-weight: 600;
          color: #00ff00;
        }

        @media (max-width: 768px) {
          .performance-overlay {
            top: 10px;
            right: 10px;
            padding: 12px;
            min-width: 200px;
          }
        }
      `}</style>
    </div>
  );
};
