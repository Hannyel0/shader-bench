"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { ShaderCanvas, PerformanceMetrics } from "./ShaderCanvas";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { PerformanceOverlay } from "./PerformanceOverlay";
import { ResolutionBenchmark } from "./ResolutionBenchmark";

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
    <div className="shader-viewer">
      <div className="shader-header">
        <div className="shader-info">
          <h2>{shader.name}</h2>
          {shader.author && <p className="author">by {shader.author}</p>}
          {shader.description && (
            <p className="description">{shader.description}</p>
          )}
          {shader.tags && (
            <div className="tags">
              {shader.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="controls">
          <button onClick={() => setIsCodeVisible(!isCodeVisible)}>
            {isCodeVisible ? "👁️ Hide" : "👁️ Show"} Code
          </button>
          <button onClick={toggleFullscreen}>
            {isFullscreen ? "⛶ Exit" : "⛶ Fullscreen"}
          </button>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={isRecording ? "recording" : ""}
          >
            {isRecording ? "⏹️ Stop" : "⏺️ Record"} Metrics
          </button>
          <button onClick={exportMetrics} disabled={!metrics}>
            💾 Export Data
          </button>
        </div>
      </div>

      <div className="shader-content">
        <div className="canvas-container" ref={containerRef}>
          <ShaderCanvas
            fragmentShader={shader.fragmentShader}
            width={isFullscreen ? fullscreenDimensions.width : width}
            height={isFullscreen ? fullscreenDimensions.height : height}
            onPerformanceUpdate={handlePerformanceUpdate}
            onResize={handleResize}
          />
          {isRecording && (
            <div className="recording-indicator">● RECORDING</div>
          )}
          <PerformanceOverlay metrics={metrics} isFullscreen={isFullscreen} />
        </div>

        {showPerformance && !isFullscreen && (
          <>
            <PerformanceMonitor metrics={metrics} showGraph={true} />
            <ResolutionBenchmark currentMetrics={metrics} />
          </>
        )}

        {isCodeVisible && (
          <div className="code-viewer">
            <div className="code-header">
              <span>Fragment Shader Code</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shader.fragmentShader);
                }}
              >
                📋 Copy
              </button>
            </div>
            <pre>
              <code>{shader.fragmentShader}</code>
            </pre>
          </div>
        )}
      </div>

      <style>{`
        .shader-viewer {
          background: #1a1a1a;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #333;
        }

        .shader-header {
          background: #2a2a2a;
          padding: 20px;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .shader-info h2 {
          margin: 0 0 8px 0;
          color: #fff;
          font-size: 24px;
          font-weight: 600;
        }

        .shader-info .author {
          margin: 0 0 8px 0;
          color: #888;
          font-size: 14px;
        }

        .shader-info .description {
          margin: 0 0 12px 0;
          color: #aaa;
          font-size: 14px;
          line-height: 1.5;
        }

        .tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tag {
          background: #333;
          color: #00ff00;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
        }

        .controls {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
        }

        .controls button {
          background: #333;
          color: #fff;
          border: 1px solid #555;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-family: monospace;
          transition: all 0.2s;
        }

        .controls button:hover:not(:disabled) {
          background: #444;
          border-color: #00ff00;
        }

        .controls button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .controls button.recording {
          background: #ff0000;
          border-color: #ff0000;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .shader-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .canvas-container {
          position: relative;
          display: inline-block;
          border: 2px solid #333;
          border-radius: 8px;
          overflow: hidden;
        }

        .recording-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255, 0, 0, 0.9);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          font-family: monospace;
          animation: pulse 1s infinite;
        }

        .code-viewer {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          overflow: hidden;
        }

        .code-header {
          background: #2a2a2a;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #333;
        }

        .code-header span {
          color: #fff;
          font-family: monospace;
          font-size: 14px;
        }

        .code-header button {
          background: #333;
          color: #fff;
          border: 1px solid #555;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-family: monospace;
        }

        .code-header button:hover {
          background: #444;
        }

        .code-viewer pre {
          margin: 0;
          padding: 20px;
          overflow-x: auto;
        }

        .code-viewer code {
          color: #00ff00;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
          line-height: 1.6;
        }

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
    </div>
  );
};
