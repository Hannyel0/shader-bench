"use client";

import React, { useState, useReducer, useCallback, useEffect } from "react";
import { MultiObjectCanvas } from "./Multiobjectcanvas";
import { HierarchyPanel } from "./HirearchyPanel";
import { ObjectPropertiesPanel } from "./ObjectPropertiesPanel";
import { AssetsPanel } from "./AssetsPanel";
import {
  sceneReducer,
  getSelectedObject,
  SceneObject,
  createSceneObject,
  VertexParams,
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
  Move,
  RotateCw,
  Maximize2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

export const VertexLabViewer: React.FC = () => {
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
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);
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
      if (
        !selectedObject ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
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
    (updates: Partial<VertexParams>) => {
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
    <div className="relative w-full h-screen bg-zinc-950 overflow-hidden">
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

      {/* Top Navbar */}
      <div className="absolute top-0 left-0 right-0 z-50 p-3 pointer-events-none select-none">
        <div className="flex items-center justify-between gap-4 pointer-events-auto">
          {/* Left: Branding - Compact */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#FF5C3D]/10 border border-[#FF5C3D]/20">
              <Waves className="h-4 w-4 text-[#FF5C3D]" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white">Vertex Lab</h1>
              <p className="text-[9px] text-zinc-500">Procedural Testing</p>
            </div>

            {/* Performance Metrics */}
            {performance && (
              <div className="flex items-center gap-2 ml-2">
                <Badge
                  variant={performance.fps >= 55 ? "default" : "destructive"}
                  className={
                    performance.fps >= 55
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono h-5 text-[10px]"
                      : "font-mono h-5 text-[10px]"
                  }
                >
                  {performance.fps}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-zinc-800/50 text-zinc-400 border-zinc-700 font-mono h-5 text-[9px]"
                >
                  {performance.triangleCount.toLocaleString()}
                </Badge>
              </div>
            )}
          </div>

          {/* Center: Transform Tools + Home - Compact */}
          <div className="absolute left-1/2 -translate-x-1/2">
            {selectedObject && (
              <TooltipProvider>
                <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800 shadow-2xl p-1">
                  <div className="flex items-center gap-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={
                            transformMode === "translate" ? "default" : "ghost"
                          }
                          onClick={() => setTransformMode("translate")}
                          className={
                            transformMode === "translate"
                              ? "bg-[#FF5C3D] hover:bg-[#FF5C3D]/90 text-white h-7 w-7 p-0"
                              : "hover:bg-zinc-700 text-zinc-400 h-7 w-7 p-0"
                          }
                        >
                          <Move className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-zinc-900 border-zinc-800"
                      >
                        <p className="text-xs">Move (G)</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={
                            transformMode === "rotate" ? "default" : "ghost"
                          }
                          onClick={() => setTransformMode("rotate")}
                          className={
                            transformMode === "rotate"
                              ? "bg-[#FF5C3D] hover:bg-[#FF5C3D]/90 text-white h-7 w-7 p-0"
                              : "hover:bg-zinc-700 text-zinc-400 h-7 w-7 p-0"
                          }
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-zinc-900 border-zinc-800"
                      >
                        <p className="text-xs">Rotate (R)</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={
                            transformMode === "scale" ? "default" : "ghost"
                          }
                          onClick={() => setTransformMode("scale")}
                          className={
                            transformMode === "scale"
                              ? "bg-[#FF5C3D] hover:bg-[#FF5C3D]/90 text-white h-7 w-7 p-0"
                              : "hover:bg-zinc-700 text-zinc-400 h-7 w-7 p-0"
                          }
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-zinc-900 border-zinc-800"
                      >
                        <p className="text-xs">Scale (S)</p>
                      </TooltipContent>
                    </Tooltip>

                    <div className="w-px h-5 bg-zinc-700 mx-0.5" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href="/">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-zinc-700 text-zinc-400"
                          >
                            <Home className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-zinc-900 border-zinc-800"
                      >
                        <p className="text-xs">Home</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </Card>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>

      {/* Left Panel: Hierarchy */}
      <div
        className="absolute left-0 z-40 transition-all duration-300 ease-in-out"
        style={{
          width: "280px",
          top: "50px",
          bottom: bottomPanelOpen ? "280px" : "0px",
        }}
      >
        <div className="h-full p-4">
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
      </div>

      {/* Right Panel: Properties */}
      <div
        className="absolute right-0 top-0 z-40 transition-all duration-300 ease-in-out"
        style={{
          width: "360px",
          bottom: bottomPanelOpen ? "280px" : "0px",
        }}
      >
        <div className="h-full p-4">
          {selectedObject && (
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
      </div>

      {/* Bottom Panel: Assets */}
      <div className="absolute bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out">
        <div className="flex flex-col items-center">
          {/* Toggle Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setBottomPanelOpen(!bottomPanelOpen)}
            className="mb-1 h-6 px-4 rounded-t-lg rounded-b-none bg-zinc-900/80 backdrop-blur-xl border border-b-0 border-zinc-800 hover:bg-zinc-800 text-zinc-400 transition-all duration-200"
          >
            {bottomPanelOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </Button>

          {/* Panel Container */}
          <div
            className="w-full transition-all duration-300 ease-in-out"
            style={{
              height: bottomPanelOpen ? "280px" : "0px",
              opacity: bottomPanelOpen ? 1 : 0,
              transform: bottomPanelOpen ? "translateY(0)" : "translateY(20px)",
            }}
          >
            <div className="h-full px-4 pb-4">
              <Card className="h-full bg-zinc-900/80 backdrop-blur-xl border-zinc-800 shadow-2xl overflow-hidden">
                <div className="h-full p-3">
                  {/* Assets Panel */}
                  <AssetsPanel />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
