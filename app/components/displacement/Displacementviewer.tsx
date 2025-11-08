"use client";

import React, { useState, useReducer, useCallback, useEffect } from "react";
import { MultiObjectCanvas } from "./Multiobjectcanvas";
import { ObjectListPanel } from "./ObjectListPanel";
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
import {
  Zap,
  Home,
  Waves,
  Info,
  ChevronLeft,
  ChevronRight,
  Move,
  Palette,
  Settings2,
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

  // Initialize scene with a sphere on client side only to avoid hydration mismatch
  useEffect(() => {
    if (!isInitialized && sceneState.objects.length === 0) {
      dispatch({ type: "ADD_OBJECT", object: createSceneObject("sphere", [0, 0, 0]) });
      setIsInitialized(true);
    }
  }, [isInitialized, sceneState.objects.length]);

  const selectedObject = getSelectedObject(sceneState);

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

  const handleTransformChange = useCallback(
    (id: string, transform: Partial<SceneObject["transform"]>) => {
      dispatch({ type: "UPDATE_TRANSFORM", id, transform });
    },
    []
  );

  const handleDisplacementChange = useCallback(
    (updates: Partial<DisplacementParams>) => {
      if (selectedObject?.displacement) {  // Add null check for displacement
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
        <div className="flex items-center justify-between p-2 pointer-events-auto">
          {/* Left: Branding */}
          <Card className="inline-flex items-center gap-2 px-2 py-1.5 bg-black/60 backdrop-blur-md border-white/10">
            <div className="p-1 rounded bg-blue-500/20">
              <Waves className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white">Displacement Lab</h1>
              <p className="text-[9px] text-gray-400">Procedural Testing</p>
            </div>
          </Card>

          {/* Center: Transform Tools */}
          {selectedObject && (
            <TransformToolbar
              mode={transformMode}
              onModeChange={setTransformMode}
              disabled={!selectedObject}
            />
          )}

          {/* Right: Navigation & Info */}
          <div className="flex items-center gap-1.5">
            {performance && (
              <Card className="inline-flex items-center gap-2 px-2 py-1.5 bg-black/60 backdrop-blur-md border-white/10">
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
              </Card>
            )}

            <Link href="/shaders">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[10px] bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white"
              >
                <Zap className="w-3 h-3 mr-1" />
                Gallery
              </Button>
            </Link>

            <Link href="/">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[10px] bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white"
              >
                <Home className="w-3 h-3 mr-1" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Left Panel: Object List */}
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
              ${leftPanelOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full"}
            `}
            style={{ width: leftPanelOpen ? "240px" : "0px" }}
          >
            {leftPanelOpen && (
              <div className="h-full bg-black/60 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
                <ObjectListPanel
                  objects={sceneState.objects}
                  selectedId={sceneState.selectedId}
                  onSelect={handleSelectObject}
                  onAdd={handleAddObject}
                  onRemove={handleRemoveObject}
                  onDuplicate={handleDuplicateObject}
                  onToggleVisibility={handleToggleVisibility}
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
              ${rightPanelOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}
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
                : "Click object to select • Drag to orbit • Scroll to zoom"}
            </span>
          </Card>

          {performance && (
            <Card className="inline-flex items-center gap-2 px-2 py-1 bg-black/60 backdrop-blur-md border-white/10">
              <span className="text-[10px] text-gray-400 font-mono">
                {performance.resolution.width}×{performance.resolution.height}
              </span>
              <span className="text-[10px] text-gray-400">•</span>
              <span className="text-[10px] text-gray-400">
                {performance.drawCalls} calls
              </span>
              <span className="text-[10px] text-gray-400">•</span>
              <span className="text-[10px] text-gray-400">
                {(performance.geometryMemory / 1024 / 1024).toFixed(1)}MB
              </span>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
