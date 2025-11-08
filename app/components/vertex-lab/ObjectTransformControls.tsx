"use client";

import React, { useRef, useEffect } from "react";
import { TransformControls as DreiTransformControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SceneObject } from "./SceneManager";

interface ObjectTransformControlsProps {
  targetMesh: THREE.Group | null;
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

  // Track if we're actively dragging
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!controlsRef.current || !object || !targetMesh) return;

    const controls = controlsRef.current;

    // Attach controls to the GROUP (not mesh) - this is where state-driven transforms are applied
    controls.attach(targetMesh);

    // Allow clicks to pass through to mesh when controls are active
    if (controls.object) {
      controls.getRaycaster = () => null; // Disable controls raycasting for selection
    }

    // Handle drag start and end via dragging-changed event
    const onDraggingChanged = (event: any) => {
      if (event.value) {
        // Dragging STARTED
        isDraggingRef.current = true;
        gl.domElement.style.cursor = "grabbing";
      } else {
        // Dragging ENDED - Capture final transform and update state
        isDraggingRef.current = false;
        gl.domElement.style.cursor = "default";

        // Read final transform from the GROUP after drag completes
        if (targetMesh && object) {
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

          // Single state update on drag completion (avoids fighting with TransformControls)
          onTransformChange(object.id, updates);
        }
      }
    };

    // During drag: Let TransformControls work imperatively without state updates
    const onObjectChange = () => {
      // Do NOT update state during drag - this would cause React to fight TransformControls
      // State will only be updated when drag ends (in onDraggingChanged)
    };

    // Subscribe to events
    controls.addEventListener("dragging-changed", onDraggingChanged);
    controls.addEventListener("objectChange", onObjectChange);

    return () => {
      controls.removeEventListener("dragging-changed", onDraggingChanged);
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