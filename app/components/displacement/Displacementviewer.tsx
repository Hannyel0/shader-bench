"use client";

import React, { useState, useReducer, useCallback, useEffect } from "react";
import { MultiObjectCanvas } from "./Multiobjectcanvas";
import { HierarchyPanel } from "./HirearchyPanel";
import { ObjectPropertiesPanel } from "./ObjectPropertiesPanel";
import { TransformToolbar } from "./TransformToolbar";
import {
  sceneReducer,
  getSelectedObject,
  SceneObject,
  GeometryType,
  createSceneObject,
  DisplacementParams,
  PerformanceMetrics,
} from "./SceneManager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Home,
  Waves,
  Info,
  ChevronLeft,
  ChevronRight,
  Move,
  RotateCw,
  Maximize2,
} from "lucide-react";
import Link from "next/link";

export const DisplacementViewer: React.FC = () => {
  const [sceneState, dispatch] = useReducer(sceneReducer, {
    objects: [],
    selectedId: null,
  });

  const [transformMode, setTransformMode] = useState<
    "translate" | "rotate" | "scale"
  >("translate");
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(
    null
  );
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize scene with a sphere on client side only
  useEffect(() => {
    if (!isInitialized && sceneState.objects.length === 0) {
      dispatch({
        type: "ADD_OBJECT",
        object: createSceneObject("sphere", [0, 0, 0]),
      });
      setIsInitialized(true);
    }
  }, [isInitialized, sceneState.objects.length]);

  const selectedObject = getSelectedObject(sceneState);

  // Keyboard shortcuts for transform modes
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only activate if an object is selected and not typing in an input
      if (!selectedObject || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "g":
          setTransformMode("translate");
          break;
        case "r":
          setTransformMode("rotate");
          break;
        case "s":
          setTransformMode("scale");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedObject]);

  // Scene management handlers
  const handleAddObject = useCallback((object: SceneObject) => {
    dispatch({ type: "ADD_OBJECT", object });
  }, []);

  const handleRemoveObject = useCallback((id: string) => {
    dispatch({ type: "REMOVE_OBJECT", id });
  }, []);

  const handleSelectObject = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_OBJECT", id });
  }, []);

  const handleDuplicateObject = useCallback((id: string) => {
    dispatch({ type: "DUPLICATE_OBJECT", id });
  }, []);

  const handleToggleVisibility = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_VISIBILITY", id });
  }, []);

  const handleToggleExpanded = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_EXPANDED", id });
  }, []);

  const handleReparent = useCallback(
    (childId: string, newParentId: string | null) => {
      dispatch({ type: "REPARENT_OBJECT", childId, newParentId });
    },
    []
  );

  const handleTransformChange = useCallback(
    (id: string, transform: Partial<SceneObject["transform"]>) => {
      dispatch({ type: "UPDATE_TRANSFORM", id, transform });
    },
    []
  );

  const handleDisplacementChange = useCallback(
    (updates: Partial<DisplacementParams>) => {
      if (selectedObject?.displacement) {
        dispatch({
          type: "UPDATE_DISPLACEMENT",
          id: selectedObject.id,
          displacement: updates,
        });
      }
    },
    [selectedObject]
  );

  const handleAddDisplacement = useCallback((id: string) => {
    dispatch({ type: "ADD_DISPLACEMENT", id });
  }, []);

  const handleRemoveDisplacement = useCallback((id: string) => {
    dispatch({ type: "REMOVE_DISPLACEMENT", id });
  }, []);

  const handleMaterialChange = useCallback(
    (updates: Partial<SceneObject["material"]>) => {
      if (selectedObject) {
        dispatch({
          type: "UPDATE_MATERIAL",
          id: selectedObject.id,
          material: updates,
        });
      }
    },
    [selectedObject]
  );

  return (
    <div className="relative w-full h-full">
      {/* Full-Screen 3D Canvas */}
      <div className="absolute inset-0 w-full h-full">
        <MultiObjectCanvas
          objects={sceneState.objects}
          selectedId={sceneState.selectedId}
          transformMode={transformMode}
          onSelect={handleSelectObject}
          onTransformChange={handleTransformChange}
          onPerformanceUpdate={setPerformance}
        />
      </div>

      {/* Top Toolbar Overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
        {/* Left: Branding */}
        <div className="absolute left-2 top-2 pointer-events-auto">
          <Card className="inline-flex items-center gap-2 px-2 py-1.5 bg-black/60 backdrop-blur-md border-white/10">
            <div className="p-1 rounded bg-blue-500/20">
              <Waves className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white">Displacement Lab</h1>
              <p className="text-[9px] text-gray-400">Procedural Testing</p>
            </div>
          </Card>
        </div>

        {/* Center: Navigation & Performance */}
        <div className="absolute left-1/2 -translate-x-1/2 top-2 pointer-events-auto">
          <TooltipProvider>
            <Card className="inline-flex flex-row items-center gap-2 px-2 py-1.5 bg-black/60 backdrop-blur-md border-white/10">
              {performance && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={performance.fps >= 55 ? "default" : "destructive"}
                    className="h-5 text-[10px] font-mono"
                  >
                    {performance.fps} FPS
                  </Badge>
                  <span className="text-[10px] text-gray-400">
                    {performance.triangleCount.toLocaleString()} tris
                  </span>
                </div>
              )}

              {performance && <Separator orientation="vertical" className="h-4 bg-white/20" />}

              {selectedObject && (
                <>
                  <div className="inline-flex items-center gap-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant={transformMode === "translate" ? "default" : "ghost"}
                          onClick={() => setTransformMode("translate")}
                          className={`h-6 w-6 ${
                            transformMode === "translate"
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "hover:bg-white/10 text-gray-300"
                          }`}
                        >
                          <Move className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Transform (G)</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant={transformMode === "rotate" ? "default" : "ghost"}
                          onClick={() => setTransformMode("rotate")}
                          className={`h-6 w-6 ${
                            transformMode === "rotate"
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "hover:bg-white/10 text-gray-300"
                          }`}
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Rotate (R)</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant={transformMode === "scale" ? "default" : "ghost"}
                          onClick={() => setTransformMode("scale")}
                          className={`h-6 w-6 ${
                            transformMode === "scale"
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "hover:bg-white/10 text-gray-300"
                          }`}
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Scale (S)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <Separator orientation="vertical" className="h-4 bg-white/20" />
                </>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 hover:bg-white/10 text-white"
                    >
                      <Home className="w-3 h-3" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Home</p>
                </TooltipContent>
              </Tooltip>
            </Card>
          </TooltipProvider>
        </div>
      </div>

      {/* Left Panel: Hierarchy */}
      <div className="absolute left-0 top-0 bottom-0 z-40 pointer-events-none">
        <div className="flex h-full items-center">
          {/* Toggle Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="pointer-events-auto ml-1 h-7 w-7 bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/10"
          >
            {leftPanelOpen ? (
              <ChevronLeft className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>

          {/* Panel */}
          <div
            className={`
              h-[calc(100vh-4rem)] mt-14 ml-1 pointer-events-auto
              transition-all duration-300 ease-in-out
              ${
                leftPanelOpen
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-full"
              }
            `}
            style={{ width: leftPanelOpen ? "280px" : "0px" }}
          >
            {leftPanelOpen && (
              <div className="h-full bg-black/60 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
                <HierarchyPanel
                  objects={sceneState.objects}
                  selectedId={sceneState.selectedId}
                  onSelect={handleSelectObject}
                  onAdd={handleAddObject}
                  onRemove={handleRemoveObject}
                  onDuplicate={handleDuplicateObject}
                  onToggleVisibility={handleToggleVisibility}
                  onToggleExpanded={handleToggleExpanded}
                  onReparent={handleReparent}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Property Controls */}
      <div className="absolute right-0 top-0 bottom-0 z-40 pointer-events-none">
        <div className="flex h-full items-center">
          {/* Panel */}
          <div
            className={`
              h-[calc(100vh-4rem)] mt-14 mr-1 pointer-events-auto
              transition-all duration-300 ease-in-out
              ${
                rightPanelOpen
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-full"
              }
            `}
            style={{ width: rightPanelOpen ? "300px" : "0px" }}
          >
            {rightPanelOpen && selectedObject && (
              <ObjectPropertiesPanel
                object={selectedObject}
                onDisplacementChange={handleDisplacementChange}
                onTransformChange={(transform) =>
                  handleTransformChange(selectedObject.id, transform)
                }
                onMaterialChange={handleMaterialChange}
                onAddDisplacement={handleAddDisplacement}
                onRemoveDisplacement={handleRemoveDisplacement}
              />
            )}
          </div>

          {/* Toggle Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="pointer-events-auto mr-1 h-7 w-7 bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/10"
            disabled={!selectedObject}
          >
            {rightPanelOpen ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronLeft className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="flex items-center justify-between p-2 pointer-events-auto">
          <Card className="inline-flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md border-white/10">
            <Info className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-400">
              {selectedObject
                ? `Selected: ${selectedObject.name}`
                : "Click object to select • Drag to orbit • Scroll to zoom • Drag objects to reparent"}
            </span>
          </Card>
        </div>
      </div>
    </div>
  );
};
