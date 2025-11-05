"use client";

import React, { useState, useCallback } from "react";
import { ShaderViewer, ShaderDefinition } from "./ShaderViewer";
import { ShaderCanvas, PerformanceMetrics } from "./ShaderCanvas";

interface ShaderGalleryProps {
  shaders: ShaderDefinition[];
  defaultView?: "grid" | "list" | "compare";
  width?: number;
  height?: number;
}

interface ShaderBenchmark {
  shader: string;
  metrics: PerformanceMetrics;
  timestamp: number;
}

export const ShaderGallery: React.FC<ShaderGalleryProps> = ({
  shaders,
  defaultView = "grid",
  width = 600,
  height = 400,
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "compare">(
    defaultView
  );
  const [selectedShader, setSelectedShader] = useState<ShaderDefinition | null>(
    null
  );
  const [compareShaders, setCompareShaders] = useState<ShaderDefinition[]>([]);
  const [benchmarks, setBenchmarks] = useState<Map<string, ShaderBenchmark>>(
    new Map()
  );
  const [sortBy, setSortBy] = useState<"name" | "fps" | "frameTime">("name");
  const [filterTag, setFilterTag] = useState<string>("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleMetricsCapture = useCallback(
    (shaderName: string, metrics: PerformanceMetrics) => {
      setBenchmarks((prev) => {
        const newMap = new Map(prev);
        newMap.set(shaderName, {
          shader: shaderName,
          metrics,
          timestamp: Date.now(),
        });
        return newMap;
      });
    },
    []
  );

  const toggleCompare = (shader: ShaderDefinition) => {
    setCompareShaders((prev) => {
      const exists = prev.find((s) => s.name === shader.name);
      if (exists) {
        return prev.filter((s) => s.name !== shader.name);
      } else if (prev.length < 4) {
        return [...prev, shader];
      }
      return prev;
    });
  };

  const getFilteredAndSortedShaders = () => {
    let filtered = shaders;

    if (filterTag) {
      filtered = shaders.filter((s) => s.tags?.includes(filterTag));
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "fps": {
          const aMetrics = benchmarks.get(a.name)?.metrics.fps || 0;
          const bMetrics = benchmarks.get(b.name)?.metrics.fps || 0;
          return bMetrics - aMetrics;
        }
        case "frameTime": {
          const aMetrics =
            benchmarks.get(a.name)?.metrics.avgFrameTime || Infinity;
          const bMetrics =
            benchmarks.get(b.name)?.metrics.avgFrameTime || Infinity;
          return aMetrics - bMetrics;
        }
        default:
          return a.name.localeCompare(b.name);
      }
    });
  };

  const allTags = Array.from(
    new Set(shaders.flatMap((s) => s.tags || []))
  ).sort();

  const exportBenchmarks = () => {
    const data = Array.from(benchmarks.values());
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shader_benchmarks_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runBenchmarkSuite = async () => {
    console.log("Starting benchmark suite...");
    // This would need more sophisticated implementation with controlled timing
    alert(
      "Benchmark suite would run each shader for 10 seconds and collect metrics"
    );
  };

  const filteredShaders = getFilteredAndSortedShaders();

  return (
    <div className="shader-gallery">
      <div className="gallery-header">
        <h1>Shader Performance Testing Suite</h1>
        <div className="gallery-stats">
          <span>{shaders.length} shaders loaded</span>
          <span>{benchmarks.size} benchmarked</span>
        </div>
      </div>

      <div className="gallery-controls">
        <div className="control-group">
          <label>View Mode:</label>
          <div className="button-group">
            <button
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
            >
              Grid
            </button>
            <button
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
            >
              List
            </button>
            <button
              className={viewMode === "compare" ? "active" : ""}
              onClick={() => setViewMode("compare")}
            >
              Compare ({compareShaders.length})
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Sort By:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="name">Name</option>
            <option value="fps">FPS (High to Low)</option>
            <option value="frameTime">Frame Time (Low to High)</option>
          </select>
        </div>

        <div className="control-group">
          <label>Filter Tag:</label>
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="">All</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group actions">
          <button onClick={runBenchmarkSuite}>🏃 Run Benchmark Suite</button>
          <button onClick={exportBenchmarks} disabled={benchmarks.size === 0}>
            💾 Export Results
          </button>
        </div>
      </div>

      {viewMode === "grid" && (
        <div className="shader-grid">
          {filteredShaders.map((shader) => {
            const benchmark = benchmarks.get(shader.name);
            const isComparing = compareShaders.find(
              (s) => s.name === shader.name
            );

            return (
              <div
                key={shader.name}
                className={`shader-card ${isComparing ? "comparing" : ""}`}
                onClick={() => setSelectedShader(shader)}
                onMouseEnter={() => setHoveredCard(shader.name)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{ cursor: 'pointer' }}
              >
                <div className="shader-thumbnail">
                  {hoveredCard === shader.name ? (
                    <div style={{ width: '100%', height: '100%' }}>
                      <ShaderCanvas
                        fragmentShader={shader.fragmentShader}
                        width={300}
                        height={200}
                        className="shader-preview-canvas"
                      />
                    </div>
                  ) : (
                    <div className="shader-preview-placeholder">
                      <div className="shader-preview-text">
                        {shader.name.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  )}
                  {benchmark && (
                    <div className="quick-stats">
                      <span className="fps">
                        {benchmark.metrics.fps.toFixed(1)} FPS
                      </span>
                      <span className="frame-time">
                        {benchmark.metrics.avgFrameTime.toFixed(1)}ms
                      </span>
                    </div>
                  )}
                </div>

                <div className="shader-card-info">
                  <h3>{shader.name}</h3>
                  {shader.author && <p className="author">{shader.author}</p>}
                  {shader.tags && (
                    <div className="tags">
                      {shader.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shader-card-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompare(shader);
                    }}
                    className={isComparing ? "active" : ""}
                    disabled={!isComparing && compareShaders.length >= 4}
                  >
                    {isComparing ? "✓" : "+"} Compare
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "list" && (
        <div className="shader-list">
          <table>
            <thead>
              <tr>
                <th>Shader</th>
                <th>Author</th>
                <th>Tags</th>
                <th>FPS</th>
                <th>Avg Frame Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShaders.map((shader) => {
                const benchmark = benchmarks.get(shader.name);
                const isComparing = compareShaders.find(
                  (s) => s.name === shader.name
                );

                return (
                  <tr
                    key={shader.name}
                    className={isComparing ? "comparing" : ""}
                  >
                    <td className="name">{shader.name}</td>
                    <td className="author">{shader.author || "—"}</td>
                    <td className="tags">
                      {shader.tags?.slice(0, 2).join(", ") || "—"}
                    </td>
                    <td className="metric">
                      {benchmark ? `${benchmark.metrics.fps.toFixed(1)}` : "—"}
                    </td>
                    <td className="metric">
                      {benchmark
                        ? `${benchmark.metrics.avgFrameTime.toFixed(1)}ms`
                        : "—"}
                    </td>
                    <td className="actions">
                      <button onClick={() => setSelectedShader(shader)}>
                        View
                      </button>
                      <button
                        onClick={() => toggleCompare(shader)}
                        className={isComparing ? "active" : ""}
                      >
                        {isComparing ? "✓" : "+"} Compare
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === "compare" && (
        <div className="shader-compare">
          {compareShaders.length === 0 ? (
            <div className="empty-state">
              <p>Select up to 4 shaders to compare their performance</p>
              <button onClick={() => setViewMode("grid")}>
                Go to Grid View
              </button>
            </div>
          ) : (
            <div className="compare-grid">
              {compareShaders.map((shader) => (
                <div key={shader.name} className="compare-item">
                  <button
                    className="remove-btn"
                    onClick={() => toggleCompare(shader)}
                  >
                    ✕
                  </button>
                  <ShaderViewer
                    shader={shader}
                    width={Math.floor(width / 2)}
                    height={Math.floor(height / 2)}
                    showPerformance={true}
                    showCode={false}
                    onMetricsCapture={handleMetricsCapture}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedShader && (
        <div className="modal-overlay" onClick={() => setSelectedShader(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedShader(null)}
            >
              ✕
            </button>
            <ShaderViewer
              shader={selectedShader}
              width={width}
              height={height}
              showPerformance={true}
              showCode={true}
              onMetricsCapture={handleMetricsCapture}
            />
          </div>
        </div>
      )}

      <style>{`
        .shader-gallery {
          background: #0a0a0a;
          min-height: 100vh;
          padding: 20px;
          color: #fff;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px;
          background: #1a1a1a;
          border-radius: 12px;
          border: 1px solid #333;
        }

        .gallery-header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 600;
          background: linear-gradient(135deg, #00ff00 0%, #00aa00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .gallery-stats {
          display: flex;
          gap: 20px;
          font-family: monospace;
          color: #888;
        }

        .gallery-stats span {
          background: #2a2a2a;
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid #444;
        }

        .gallery-controls {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          padding: 20px;
          background: #1a1a1a;
          border-radius: 12px;
          border: 1px solid #333;
          flex-wrap: wrap;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .control-group.actions {
          margin-left: auto;
        }

        .control-group label {
          color: #888;
          font-size: 14px;
          font-weight: 500;
        }

        .button-group {
          display: flex;
          gap: 0;
          border: 1px solid #555;
          border-radius: 6px;
          overflow: hidden;
        }

        .button-group button {
          background: #2a2a2a;
          color: #fff;
          border: none;
          border-right: 1px solid #555;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
        }

        .button-group button:last-child {
          border-right: none;
        }

        .button-group button.active {
          background: #00ff00;
          color: #000;
        }

        .button-group button:hover:not(.active) {
          background: #333;
        }

        select {
          background: #2a2a2a;
          color: #fff;
          border: 1px solid #555;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }

        .control-group.actions button {
          background: #2a2a2a;
          color: #fff;
          border: 1px solid #555;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .control-group.actions button:hover:not(:disabled) {
          background: #333;
          border-color: #00ff00;
        }

        .control-group.actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .shader-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .shader-card {
          background: #1a1a1a;
          border: 2px solid #333;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .shader-card:hover {
          border-color: #00ff00;
          transform: translateY(-4px);
        }

        .shader-card.comparing {
          border-color: #ffaa00;
        }

        .shader-thumbnail {
          position: relative;
          width: 100%;
          height: 200px;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .shader-preview-canvas {
          display: block;
          width: 100%;
          height: 100%;
          image-rendering: auto;
        }

        .shader-preview-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
        }

        .shader-preview-text {
          font-size: 64px;
          font-weight: bold;
          color: #333;
        }

        .quick-stats {
          position: absolute;
          bottom: 10px;
          right: 10px;
          display: flex;
          gap: 8px;
        }

        .quick-stats span {
          background: rgba(0, 0, 0, 0.8);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
        }

        .quick-stats .fps {
          color: #00ff00;
        }

        .quick-stats .frame-time {
          color: #00aaff;
        }

        .shader-card-info {
          padding: 16px;
        }

        .shader-card-info h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .shader-card-info .author {
          margin: 0 0 12px 0;
          color: #888;
          font-size: 13px;
        }

        .shader-card-info .tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .shader-card-info .tag {
          background: #2a2a2a;
          color: #00ff00;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-family: monospace;
        }

        .shader-card-actions {
          padding: 12px 16px;
          border-top: 1px solid #333;
          display: flex;
          gap: 8px;
        }

        .shader-card-actions button {
          flex: 1;
          background: #2a2a2a;
          color: #fff;
          border: 1px solid #555;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }

        .shader-card-actions button:hover:not(:disabled) {
          background: #333;
        }

        .shader-card-actions button.active {
          background: #ffaa00;
          border-color: #ffaa00;
          color: #000;
        }

        .shader-card-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .shader-list {
          background: #1a1a1a;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #333;
        }

        .shader-list table {
          width: 100%;
          border-collapse: collapse;
        }

        .shader-list th {
          background: #2a2a2a;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #00ff00;
          border-bottom: 2px solid #444;
        }

        .shader-list td {
          padding: 16px;
          border-bottom: 1px solid #333;
        }

        .shader-list tr:hover {
          background: #2a2a2a;
        }

        .shader-list tr.comparing {
          background: rgba(255, 170, 0, 0.1);
        }

        .shader-list .name {
          font-weight: 600;
        }

        .shader-list .author {
          color: #888;
        }

        .shader-list .tags {
          color: #00ff00;
          font-family: monospace;
          font-size: 12px;
        }

        .shader-list .metric {
          font-family: monospace;
          color: #00aaff;
        }

        .shader-list .actions {
          display: flex;
          gap: 8px;
        }

        .shader-list .actions button {
          background: #2a2a2a;
          color: #fff;
          border: 1px solid #555;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .shader-list .actions button:hover {
          background: #333;
        }

        .shader-list .actions button.active {
          background: #ffaa00;
          border-color: #ffaa00;
          color: #000;
        }

        .shader-compare {
          min-height: 400px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          background: #1a1a1a;
          border-radius: 12px;
          border: 2px dashed #333;
        }

        .empty-state p {
          color: #888;
          margin-bottom: 20px;
        }

        .empty-state button {
          background: #2a2a2a;
          color: #fff;
          border: 1px solid #555;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
        }

        .compare-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
        }

        .compare-item {
          position: relative;
        }

        .remove-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
          background: rgba(255, 0, 0, 0.9);
          color: white;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-btn:hover {
          background: red;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          position: relative;
          max-width: 90%;
          max-height: 90%;
          overflow: auto;
        }

        .modal-close {
          position: absolute;
          top: -40px;
          right: 0;
          background: #ff0000;
          color: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 24px;
          z-index: 1001;
        }

        .modal-close:hover {
          background: #cc0000;
        }
      `}</style>
    </div>
  );
};
