"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ShaderViewer, ShaderDefinition } from "./ShaderViewer";
import { ShaderCanvas, PerformanceMetrics } from "./ShaderCanvas";
import { AddShaderModal } from "./AddShadermodal";
import { ShaderManager, StoredShader } from "../utils/ShaderManager";
import { exampleShaders } from "../lib/ShaderLibrary";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Grid3x3,
  List,
  GitCompare,
  Download,
  Upload,
  Trash2,
  Play,
  Sparkles,
  Package,
  Edit,
  Copy,
  X,
  Loader2,
} from "lucide-react";

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
      <Card className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-lg font-semibold">Loading ShaderManager...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex justify-between items-start gap-6 flex-wrap">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">Shader Performance Testing Suite</h1>
            <div className="flex gap-4 flex-wrap text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{allShaders.length}</Badge>
                <span className="text-muted-foreground">total shaders</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  <Package className="w-3 h-3 mr-1" />
                  {exampleShaders.length}
                </Badge>
                <span className="text-muted-foreground">built-in</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {userShaders.length}
                </Badge>
                <span className="text-muted-foreground">custom</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{benchmarks.size}</Badge>
                <span className="text-muted-foreground">benchmarked</span>
              </div>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => {
              setEditingShader(undefined);
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Shader
          </Button>
        </div>
      </Card>

      {/* Controls */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* View Mode Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <TabsList>
                <TabsTrigger value="grid">
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="w-4 h-4 mr-2" />
                  List
                </TabsTrigger>
                <TabsTrigger value="compare">
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare ({compareShaders.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={runBenchmarkSuite}>
                <Play className="w-4 h-4 mr-2" />
                Benchmark
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportBenchmarks}
                disabled={benchmarks.size === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportShaders}>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportShaders}
                disabled={userShaders.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              {userShaders.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearUserShaders}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Custom
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Source:</label>
              <Select
                value={filterSource}
                onValueChange={(v) => setFilterSource(v as any)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shaders</SelectItem>
                  <SelectItem value="builtin">Built-in Only</SelectItem>
                  <SelectItem value="user">Custom Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort By:</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="fps">FPS (High to Low)</SelectItem>
                  <SelectItem value="frameTime">Frame Time (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Filter Tag:</label>
              <Select value={filterTag || "__all__"} onValueChange={(v) => setFilterTag(v === "__all__" ? "" : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Tags</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShaders.map((shader) => {
            const benchmark = benchmarks.get(shader.name);
            const isComparing = compareShaders.find(
              (s) => s.name === shader.name
            );

            return (
              <Card
                key={`${shader.source}-${shader.id || shader.name}`}
                className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
                  isComparing ? "ring-2 ring-primary" : ""
                }`}
                onMouseEnter={() => setHoveredCard(shader.name)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Thumbnail */}
                <div
                  className="relative aspect-video bg-black"
                  onClick={() => setSelectedShader(shader)}
                >
                  <ShaderCanvas
                    fragmentShader={shader.fragmentShader}
                    width={400}
                    height={225}
                    className="w-full h-full"
                    paused={hoveredCard !== shader.name}
                    pausedTime={0}
                    onPerformanceUpdate={undefined}
                  />

                  {/* Quick Stats Overlay */}
                  {benchmark && (
                    <div className="absolute top-2 left-2 flex gap-2">
                      <Badge variant="default" className="font-mono text-xs">
                        {benchmark.metrics.fps.toFixed(1)} FPS
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {benchmark.metrics.avgFrameTime.toFixed(1)}ms
                      </Badge>
                    </div>
                  )}

                  {/* Source Badge */}
                  <Badge
                    variant={shader.source === "user" ? "default" : "secondary"}
                    className="absolute top-2 right-2 text-xs"
                  >
                    {shader.source === "user" ? (
                      <>
                        <Sparkles className="w-3 h-3 mr-1" />
                        Custom
                      </>
                    ) : (
                      <>
                        <Package className="w-3 h-3 mr-1" />
                        Built-in
                      </>
                    )}
                  </Badge>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {shader.name}
                    </h3>
                    {shader.author && (
                      <p className="text-sm text-muted-foreground">
                        by {shader.author}
                      </p>
                    )}
                  </div>

                  {shader.tags && shader.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {shader.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant={isComparing ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompare(shader);
                      }}
                      disabled={!isComparing && compareShaders.length >= 4}
                      className="flex-1"
                    >
                      <GitCompare className="w-4 h-4 mr-2" />
                      {isComparing ? "✓" : "Compare"}
                    </Button>

                    {shader.source === "user" ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditShader(shader);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteShader(shader);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateShader(shader);
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Source</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Shader</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Author</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Tags</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">FPS</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Avg Frame Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
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
                      className={`border-b hover:bg-muted/50 cursor-pointer ${
                        isComparing ? "bg-primary/5" : ""
                      }`}
                      onClick={() => setSelectedShader(shader)}
                    >
                      <td className="px-4 py-3">
                        {shader.source === "user" ? (
                          <Badge variant="default" className="text-xs">
                            <Sparkles className="w-3 h-3" />
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Package className="w-3 h-3" />
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold">{shader.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {shader.author || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {shader.tags?.join(", ") || "-"}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">
                        {benchmark
                          ? `${benchmark.metrics.fps.toFixed(1)} FPS`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">
                        {benchmark
                          ? `${benchmark.metrics.avgFrameTime.toFixed(1)}ms`
                          : "-"}
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex gap-2">
                          <Button
                            variant={isComparing ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleCompare(shader)}
                            disabled={!isComparing && compareShaders.length >= 4}
                          >
                            {isComparing ? "✓" : "+"} Compare
                          </Button>
                          {shader.source === "user" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditShader(shader)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteShader(shader)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicateShader(shader)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Compare View */}
      {viewMode === "compare" && (
        <div>
          {compareShaders.length === 0 ? (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <div className="text-5xl text-muted-foreground">
                  <GitCompare className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-lg text-muted-foreground">
                  No shaders selected for comparison
                </p>
                <Button onClick={() => setViewMode("grid")}>
                  Browse Shaders
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {compareShaders.map((shader) => (
                <div key={shader.name} className="relative">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-3 -right-3 z-10 rounded-full"
                    onClick={() => toggleCompare(shader)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
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

      {/* Shader Detail Modal */}
      {selectedShader && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedShader(null)}
        >
          <div
            className="relative max-w-[95%] max-h-[95%] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-12 right-0 rounded-full w-11 h-11"
              onClick={() => setSelectedShader(null)}
            >
              <X className="h-5 w-5" />
            </Button>
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

      {/* Add/Edit Shader Modal */}
      <AddShaderModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingShader(undefined);
        }}
        onSave={editingShader ? handleUpdateShader : handleAddShader}
        editShader={editingShader}
      />
    </div>
  );
};
