"use client";

import React, { useRef, useEffect } from "react";
import { TransformControls as DreiTransformControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SceneObject } from "./SceneManager";

interface ObjectTransformControlsProps {
  targetMesh: THREE.Mesh | null;
  object: SceneObject | null;
  mode: "translate" | "rotate" | "scale";
  onTransformChange: (
    id: string,
    transform: Partial<SceneObject["transform"]>
  ) => void;
}

export const ObjectTransformControls: React.FC<ObjectTransformControlsProps> = ({
  targetMesh,
  object,
  mode,
  onTransformChange,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const { gl } = useThree();
  
  // Track if we're actively dragging to prevent state thrashing
  const isDraggingRef = useRef(false);
  const lastUpdateTimeRef = useRef(0);

  useEffect(() => {
    if (!controlsRef.current || !object || !targetMesh) return;

    const controls = controlsRef.current;
    
    // Attach controls to the actual mesh
    controls.attach(targetMesh);

    // Allow clicks to pass through to mesh when controls are active
    if (controls.object) {
      controls.getRaycaster = () => null; // Disable controls raycasting for selection
    }

    // Handle drag start
    const onDragStart = () => {
      isDraggingRef.current = true;
      gl.domElement.style.cursor = "grabbing";
    };

    // Handle continuous transform changes during drag
    const onObjectChange = () => {
      if (!isDraggingRef.current || !targetMesh) return;

      // Throttle updates to avoid state thrashing (update every 16ms = ~60fps)
      const now = performance.now();
      if (now - lastUpdateTimeRef.current < 16) return;
      lastUpdateTimeRef.current = now;

      // Read current transform from the mesh (which TransformControls is manipulating)
      const updates: Partial<SceneObject["transform"]> = {};

      if (mode === "translate") {
        const pos = targetMesh.position;
        updates.position = [pos.x, pos.y, pos.z];
      } else if (mode === "rotate") {
        const rot = targetMesh.rotation;
        updates.rotation = [rot.x, rot.y, rot.z];
      } else if (mode === "scale") {
        const scale = targetMesh.scale;
        updates.scale = [scale.x, scale.y, scale.z];
      }

      // Update state in real-time
      onTransformChange(object.id, updates);
    };

    // Handle drag end
    const onDragEnd = (event: any) => {
      if (!event.value) {
        isDraggingRef.current = false;
        gl.domElement.style.cursor = "default";
        
        // Final update on drag end
        onObjectChange();
      }
    };

    // Subscribe to events
    controls.addEventListener("dragging-changed", onDragEnd);
    controls.addEventListener("objectChange", onObjectChange);

    return () => {
      controls.removeEventListener("dragging-changed", onDragEnd);
      controls.removeEventListener("objectChange", onObjectChange);
      controls.detach();
    };
  }, [targetMesh, object, mode, onTransformChange, gl]);

  if (!object || !targetMesh) return null;

  return (
    <DreiTransformControls
      ref={controlsRef}
      mode={mode}
      size={0.8}
      showX={true}
      showY={true}
      showZ={true}
    />
  );
};