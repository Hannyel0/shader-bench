"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ShaderViewer, ShaderDefinition } from "./ShaderViewer";
import { ShaderCanvas, PerformanceMetrics } from "./ShaderCanvas";
import { AddShaderModal } from "./AddShadermodal";
import { ShaderManager, StoredShader } from "../utils/ShaderManager";
import { exampleShaders } from "../lib/ShaderLibrary";

interface ShaderGalleryProps {
  defaultView?: "grid" | "list" | "compare";
  width?: number;
  height?: number;
}

interface ShaderBenchmark {
  shader: string;
  metrics: PerformanceMetrics;
  timestamp: number;
}

interface ExtendedShaderDefinition extends ShaderDefinition {
  id?: string;
  source: "builtin" | "user";
}

export const ShaderGallery: React.FC<ShaderGalleryProps> = ({
  defaultView = "grid",
  width = 600,
  height = 400,
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "compare">(
    defaultView
  );
  const [selectedShader, setSelectedShader] =
    useState<ExtendedShaderDefinition | null>(null);
  const [compareShaders, setCompareShaders] = useState<
    ExtendedShaderDefinition[]
  >([]);
  const [benchmarks, setBenchmarks] = useState<Map<string, ShaderBenchmark>>(
    new Map()
  );
  const [sortBy, setSortBy] = useState<"name" | "fps" | "frameTime">("name");
  const [filterTag, setFilterTag] = useState<string>("");
  const [filterSource, setFilterSource] = useState<"all" | "builtin" | "user">(
    "all"
  );
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingShader, setEditingShader] = useState<
    ExtendedShaderDefinition | undefined
  >();
  const [userShaders, setUserShaders] = useState<StoredShader[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Combined shaders list
  const allShaders: ExtendedShaderDefinition[] = [
    ...exampleShaders.map((s) => ({ ...s, source: "builtin" as const })),
    ...userShaders.map((s) => ({ ...s, source: "user" as const })),
  ];

  // Initialize ShaderManager and load user shaders
  useEffect(() => {
    const initManager = async () => {
      try {
        await ShaderManager.init();
        await loadUserShaders();
      } catch (error) {
        console.error("Failed to initialize ShaderManager:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initManager();
  }, []);

  const loadUserShaders = async () => {
    try {
      const shaders = await ShaderManager.getAllShaders();
      setUserShaders(shaders);
    } catch (error) {
      console.error("Failed to load user shaders:", error);
    }
  };

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

  const toggleCompare = (shader: ExtendedShaderDefinition) => {
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

  const handleAddShader = async (shader: ShaderDefinition) => {
    try {
      await ShaderManager.addShader(shader);
      await loadUserShaders();
      setIsAddModalOpen(false);
    } catch (error) {
      alert(
        `Failed to add shader: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleEditShader = (shader: ExtendedShaderDefinition) => {
    if (shader.source === "builtin") {
      alert(
        "Built-in shaders cannot be edited. You can duplicate them as custom shaders instead."
      );
      return;
    }
    setEditingShader(shader);
    setIsAddModalOpen(true);
  };

  const handleUpdateShader = async (updatedShader: ShaderDefinition) => {
    if (!editingShader?.id) return;

    try {
      await ShaderManager.updateShader(editingShader.id, updatedShader);
      await loadUserShaders();
      setIsAddModalOpen(false);
      setEditingShader(undefined);
    } catch (error) {
      alert(
        `Failed to update shader: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteShader = async (shader: ExtendedShaderDefinition) => {
    if (shader.source === "builtin") {
      alert("Built-in shaders cannot be deleted.");
      return;
    }

    if (!shader.id) return;

    if (!confirm(`Are you sure you want to delete "${shader.name}"?`)) {
      return;
    }

    try {
      await ShaderManager.deleteShader(shader.id);
      await loadUserShaders();

      // Clear if this shader was selected
      if (selectedShader?.name === shader.name) {
        setSelectedShader(null);
      }
    } catch (error) {
      alert(
        `Failed to delete shader: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleDuplicateShader = async (shader: ExtendedShaderDefinition) => {
    const newShader: ShaderDefinition = {
      name: `${shader.name} (Copy)`,
      author: shader.author,
      description: shader.description,
      fragmentShader: shader.fragmentShader,
      tags: shader.tags,
    };

    try {
      await ShaderManager.addShader(newShader);
      await loadUserShaders();
    } catch (error) {
      alert(
        `Failed to duplicate shader: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleExportShaders = async () => {
    try {
      const jsonData = await ShaderManager.exportShaders();
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my_shaders_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(
        `Failed to export shaders: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleImportShaders = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const result = await ShaderManager.importShaders(text);

        await loadUserShaders();

        let message = `Successfully imported ${result.imported} shader(s).`;
        if (result.errors.length > 0) {
          message += `\n\nErrors:\n${result.errors.join("\n")}`;
        }
        alert(message);
      } catch (error) {
        alert(
          `Failed to import shaders: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    };

    input.click();
  };

  const handleClearUserShaders = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL custom shaders? This cannot be undone!"
      )
    ) {
      return;
    }

    if (
      !confirm("Really delete all custom shaders? This is your last chance!")
    ) {
      return;
    }

    try {
      await ShaderManager.clearAll();
      await loadUserShaders();
    } catch (error) {
      alert(
        `Failed to clear shaders: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const getFilteredAndSortedShaders = () => {
    let filtered = allShaders;

    // Filter by source
    if (filterSource !== "all") {
      filtered = filtered.filter((s) => s.source === filterSource);
    }

    // Filter by tag
    if (filterTag) {
      filtered = filtered.filter((s) => s.tags?.includes(filterTag));
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
    new Set(allShaders.flatMap((s) => s.tags || []))
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
    alert(
      "Benchmark suite would run each shader for 10 seconds and collect metrics"
    );
  };

  const filteredShaders = getFilteredAndSortedShaders();

  if (isLoading) {
    return (
      <div className="shader-gallery loading">
        <div className="loading-spinner">⏳ Loading ShaderManager...</div>
        <style jsx>{`
          .shader-gallery.loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            background: #0a0a0a;
            border-radius: 12px;
          }
          .loading-spinner {
            color: #00ff00;
            font-size: 24px;
            font-family: monospace;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="shader-gallery">
      <div className="gallery-header">
        <div>
          <h1>Shader Performance Testing Suite</h1>
          <div className="gallery-stats">
            <span className="stat-item">
              <strong>{allShaders.length}</strong> total shaders
            </span>
            <span className="stat-separator">•</span>
            <span className="stat-item">
              <strong>{exampleShaders.length}</strong> built-in
            </span>
            <span className="stat-separator">•</span>
            <span className="stat-item custom">
              <strong>{userShaders.length}</strong> custom
            </span>
            <span className="stat-separator">•</span>
            <span className="stat-item">
              <strong>{benchmarks.size}</strong> benchmarked
            </span>
          </div>
        </div>
        <button
          className="add-shader-btn"
          onClick={() => {
            setEditingShader(undefined);
            setIsAddModalOpen(true);
          }}
        >
          ✨ Add Custom Shader
        </button>
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
          <label>Source:</label>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value as any)}
          >
            <option value="all">All Shaders</option>
            <option value="builtin">Built-in Only</option>
            <option value="user">Custom Only</option>
          </select>
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
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group actions">
          <button
            onClick={runBenchmarkSuite}
            title="Run automated benchmark suite"
          >
            🏃 Benchmark
          </button>
          <button
            onClick={exportBenchmarks}
            disabled={benchmarks.size === 0}
            title="Export performance data"
          >
            💾 Export Data
          </button>
          <button onClick={handleImportShaders} title="Import custom shaders">
            📥 Import
          </button>
          <button
            onClick={handleExportShaders}
            disabled={userShaders.length === 0}
            title="Export custom shaders"
          >
            📤 Export
          </button>
          {userShaders.length > 0 && (
            <button
              onClick={handleClearUserShaders}
              className="danger"
              title="Delete all custom shaders"
            >
              🗑️ Clear Custom
            </button>
          )}
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
                key={`${shader.source}-${shader.id || shader.name}`}
                className={`shader-card ${isComparing ? "comparing" : ""} ${
                  shader.source
                }`}
                onMouseEnter={() => setHoveredCard(shader.name)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className="shader-thumbnail"
                  onClick={() => setSelectedShader(shader)}
                >
                  {hoveredCard === shader.name ? (
                    <div style={{ width: "100%", height: "100%" }}>
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
                  <div className="source-badge">
                    {shader.source === "user" ? "✨ Custom" : "📦 Built-in"}
                  </div>
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
                    title="Add to comparison"
                  >
                    {isComparing ? "✓" : "+"} Compare
                  </button>
                  {shader.source === "user" ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditShader(shader);
                        }}
                        title="Edit shader"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteShader(shader);
                        }}
                        className="danger-btn"
                        title="Delete shader"
                      >
                        🗑️
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateShader(shader);
                      }}
                      title="Duplicate as custom shader"
                    >
                      📋 Duplicate
                    </button>
                  )}
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
                <th>Source</th>
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
                    key={`${shader.source}-${shader.id || shader.name}`}
                    className={isComparing ? "comparing" : ""}
                    onClick={() => setSelectedShader(shader)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="source">
                      <span className={`source-badge ${shader.source}`}>
                        {shader.source === "user" ? "✨" : "📦"}
                      </span>
                    </td>
                    <td className="name">{shader.name}</td>
                    <td className="author">{shader.author || "-"}</td>
                    <td className="tags">{shader.tags?.join(", ") || "-"}</td>
                    <td className="metric">
                      {benchmark
                        ? `${benchmark.metrics.fps.toFixed(1)} FPS`
                        : "-"}
                    </td>
                    <td className="metric">
                      {benchmark
                        ? `${benchmark.metrics.avgFrameTime.toFixed(1)}ms`
                        : "-"}
                    </td>
                    <td
                      className="actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => toggleCompare(shader)}
                        className={isComparing ? "active" : ""}
                        disabled={!isComparing && compareShaders.length >= 4}
                      >
                        {isComparing ? "✓" : "+"} Compare
                      </button>
                      {shader.source === "user" ? (
                        <>
                          <button onClick={() => handleEditShader(shader)}>
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteShader(shader)}
                            className="danger"
                          >
                            🗑️ Delete
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleDuplicateShader(shader)}>
                          📋 Duplicate
                        </button>
                      )}
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
              <p>No shaders selected for comparison</p>
              <button onClick={() => setViewMode("grid")}>
                Browse Shaders
              </button>
            </div>
          ) : (
            <div className="compare-grid">
              {compareShaders.map((shader) => (
                <div key={shader.name} className="compare-item">
                  <button
                    className="remove-btn"
                    onClick={() => toggleCompare(shader)}
                    title="Remove from comparison"
                  >
                    ✕
                  </button>
                  <ShaderViewer
                    shader={shader}
                    width={width}
                    height={height}
                    showPerformance={true}
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
              width={Math.min(window.innerWidth - 100, 1200)}
              height={Math.min(window.innerHeight - 200, 800)}
              showPerformance={true}
              showCode={true}
              onMetricsCapture={handleMetricsCapture}
            />
          </div>
        </div>
      )}

      <AddShaderModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingShader(undefined);
        }}
        onSave={editingShader ? handleUpdateShader : handleAddShader}
        editShader={editingShader}
      />

      <style jsx>{`
        .shader-gallery {
          padding: 32px;
          background: #0a0a0a;
          min-height: 100vh;
          color: #fff;
        }

        .gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          gap: 20px;
        }

        .gallery-header h1 {
          margin: 0 0 12px 0;
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #00ff00 0%, #00aaff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .gallery-stats {
          display: flex;
          gap: 8px;
          font-family: monospace;
          font-size: 14px;
          color: #888;
          align-items: center;
        }

        .stat-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .stat-item strong {
          color: #00ff00;
        }

        .stat-item.custom strong {
          color: #00aaff;
        }

        .stat-separator {
          color: #444;
        }

        .add-shader-btn {
          background: linear-gradient(135deg, #00ff00 0%, #00aaff 100%);
          color: #000;
          border: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(0, 255, 0, 0.3);
          font-family: monospace;
        }

        .add-shader-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(0, 255, 0, 0.5);
        }

        .gallery-controls {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          background: #1a1a1a;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 32px;
          border: 1px solid #333;
          align-items: center;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .control-group label {
          font-family: monospace;
          font-size: 13px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .control-group.actions {
          margin-left: auto;
          gap: 8px;
        }

        .button-group {
          display: flex;
          gap: 4px;
          background: #0a0a0a;
          padding: 4px;
          border-radius: 6px;
        }

        .button-group button,
        .control-group.actions button {
          background: transparent;
          color: #888;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-family: monospace;
          transition: all 0.2s;
        }

        .button-group button:hover,
        .control-group.actions button:hover:not(:disabled) {
          background: #2a2a2a;
          color: #fff;
        }

        .button-group button.active {
          background: #00ff00;
          color: #000;
          font-weight: bold;
        }

        .control-group.actions button {
          background: #2a2a2a;
          color: #fff;
          border: 1px solid #444;
        }

        .control-group.actions button:hover:not(:disabled) {
          border-color: #00ff00;
        }

        .control-group.actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .control-group.actions button.danger {
          border-color: #ff4444;
          color: #ff8888;
        }

        .control-group.actions button.danger:hover {
          background: #ff4444;
          color: #fff;
          border-color: #ff4444;
        }

        select {
          background: #0a0a0a;
          color: #fff;
          border: 1px solid #333;
          padding: 8px 16px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        select:hover,
        select:focus {
          outline: none;
          border-color: #00ff00;
        }

        .shader-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .shader-card {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s;
          position: relative;
        }

        .shader-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
          border-color: #555;
        }

        .shader-card.user {
          border-color: #00aaff;
        }

        .shader-card.comparing {
          border-color: #ffaa00;
          box-shadow: 0 0 20px rgba(255, 170, 0, 0.3);
        }

        .shader-thumbnail {
          position: relative;
          width: 100%;
          height: 200px;
          background: #0a0a0a;
          overflow: hidden;
          cursor: pointer;
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
          z-index: 1;
        }

        .quick-stats span {
          background: rgba(0, 0, 0, 0.8);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
          backdrop-filter: blur(4px);
        }

        .quick-stats .fps {
          color: #00ff00;
        }

        .quick-stats .frame-time {
          color: #00aaff;
        }

        .source-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.8);
          color: #fff;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-family: monospace;
          backdrop-filter: blur(4px);
          z-index: 1;
        }

        .shader-card.user .source-badge {
          background: rgba(0, 170, 255, 0.9);
          color: #000;
          font-weight: bold;
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
          transition: all 0.2s;
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

        .shader-card-actions button.danger-btn {
          background: transparent;
          border-color: #ff4444;
          color: #ff8888;
          flex: 0;
          padding: 8px 12px;
        }

        .shader-card-actions button.danger-btn:hover {
          background: #ff4444;
          color: #fff;
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
          font-family: monospace;
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

        .shader-list .source span {
          font-size: 20px;
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

        .shader-list .actions button.danger {
          border-color: #ff4444;
          color: #ff8888;
        }

        .shader-list .actions button.danger:hover {
          background: #ff4444;
          color: #fff;
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
          font-size: 18px;
        }

        .empty-state button {
          background: #2a2a2a;
          color: #fff;
          border: 1px solid #555;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .empty-state button:hover {
          background: #333;
        }

        .compare-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
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
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
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
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          position: relative;
          max-width: 95%;
          max-height: 95%;
          overflow: auto;
        }

        .modal-close {
          position: absolute;
          top: -50px;
          right: 0;
          background: #ff0000;
          color: white;
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 24px;
          z-index: 1001;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #cc0000;
          transform: scale(1.1);
        }

        @media (max-width: 768px) {
          .gallery-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .gallery-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .control-group.actions {
            margin-left: 0;
          }

          .compare-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
