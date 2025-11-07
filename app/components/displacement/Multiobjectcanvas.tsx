"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid } from "@react-three/drei";
import * as THREE from "three";
import { TransformableObject } from "./TransformableObject";
import { ObjectTransformControls } from "./ObjectTransformControls";
import { SceneObject, PerformanceMetrics } from "./SceneManager";

interface MultiObjectCanvasProps {
  objects: SceneObject[];
  selectedId: string | null;
  transformMode: "translate" | "rotate" | "scale";
  onSelect: (id: string | null) => void;
  onTransformChange: (
    id: string,
    transform: Partial<SceneObject["transform"]>
  ) => void;
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
}

const PerformanceMonitor: React.FC<{
  objects: SceneObject[];
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
}> = ({ objects, onPerformanceUpdate }) => {
  const { gl, size } = useThree();
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const frameTimesRef = useRef<number[]>([]);

  // Initialize performance tracking on mount
  useEffect(() => {
    lastTimeRef.current = performance.now();
  }, []);

  useFrame(() => {
    if (!onPerformanceUpdate) return;

    const currentTime = performance.now();
    frameCountRef.current++;
    const frameTime = currentTime - lastTimeRef.current;
    frameTimesRef.current.push(frameTime);

    if (frameTimesRef.current.length > 120) {
      frameTimesRef.current.shift();
    }

    lastTimeRef.current = currentTime;

    // Update metrics every 10 frames
    if (frameCountRef.current % 10 === 0) {
      const avgFrameTime =
        frameTimesRef.current.reduce((sum, t) => sum + t, 0) /
        frameTimesRef.current.length;

      const fps = 1000 / avgFrameTime;
      const minFrameTime = Math.min(...frameTimesRef.current);
      const maxFrameTime = Math.max(...frameTimesRef.current);
      const droppedFrames = frameTimesRef.current.filter((t) => t > 20).length;

      // Aggregate triangle count across all visible objects
      const triangleCount = objects
        .filter((obj) => obj.visible)
        .reduce((sum, obj) => {
          const subdivisions = obj.displacement.subdivisions;
          return sum + subdivisions * subdivisions * 2;
        }, 0);

      const info = gl.info;
      const drawCalls = info.render.calls;

      // Estimate total geometry memory
      const geometryMemory = objects
        .filter((obj) => obj.visible)
        .reduce((sum, obj) => {
          const subdivisions = obj.displacement.subdivisions;
          const vertexCount = (subdivisions + 1) * (subdivisions + 1);
          return (
            sum +
            vertexCount * 3 * 4 * 3 +
            subdivisions * subdivisions * 2 * 3 * 2
          );
        }, 0);

      const metrics: PerformanceMetrics = {
        fps: Math.round(fps * 10) / 10,
        frameTime: Math.round(frameTime * 100) / 100,
        avgFrameTime: Math.round(avgFrameTime * 100) / 100,
        minFrameTime: Math.round(minFrameTime * 100) / 100,
        maxFrameTime: Math.round(maxFrameTime * 100) / 100,
        droppedFrames,
        totalFrames: frameCountRef.current,
        resolution: { width: size.width, height: size.height },
        pixelCount: size.width * size.height,
        triangleCount,
        drawCalls,
        geometryMemory,
      };

      onPerformanceUpdate(metrics);
    }
  });

  return null;
};

export const MultiObjectCanvas: React.FC<MultiObjectCanvasProps> = ({
  objects,
  selectedId,
  transformMode,
  onSelect,
  onTransformChange,
  onPerformanceUpdate,
}) => {
  const selectedObject = objects.find((obj) => obj.id === selectedId) || null;

  // Track mesh references for each object
  const meshRefsMap = useRef<Map<string, THREE.Mesh>>(new Map());

  const setMeshRef = useCallback((id: string, mesh: THREE.Mesh | null) => {
    if (mesh) {
      meshRefsMap.current.set(id, mesh);
    } else {
      meshRefsMap.current.delete(id);
    }
  }, []);

  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.setClearColor(0x0a0a0a, 1);
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={50} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        enablePan={true}
        minDistance={1.5}
        maxDistance={20}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      <directionalLight position={[0, 5, -5]} intensity={0.3} />

      {/* Grid */}
      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#444444"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#666666"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
        position={[0, -1.5, 0]}
      />

      {/* Background plane for "empty space" click detection */}
      <mesh
        position={[0, 0, -10]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(null);
        }}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Render all scene objects with ref tracking */}
      {objects.map((obj) => (
        <TransformableObject
          key={obj.id}
          ref={(mesh) => setMeshRef(obj.id, mesh)}
          object={obj}
          isSelected={selectedId === obj.id}
          onSelect={onSelect}
          onTransformChange={onTransformChange}
        />
      ))}

      {/* Transform controls with direct mesh reference */}
      {selectedObject && (
        <ObjectTransformControls
          targetMesh={meshRefsMap.current.get(selectedObject.id) || null}
          object={selectedObject}
          mode={transformMode}
          onTransformChange={onTransformChange}
        />
      )}

      {/* Performance monitoring */}
      <PerformanceMonitor
        objects={objects}
        onPerformanceUpdate={onPerformanceUpdate}
      />
    </Canvas>
  );
};
