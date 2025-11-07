"use client";

import React, { useRef, useEffect } from "react";
import { TransformControls as DreiTransformControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { SceneObject } from "./SceneManager";

interface ObjectTransformControlsProps {
  object: SceneObject | null;
  mode: "translate" | "rotate" | "scale";
  onTransformChange: (
    id: string,
    transform: Partial<SceneObject["transform"]>
  ) => void;
}

export const ObjectTransformControls: React.FC<ObjectTransformControlsProps> = ({ object, mode, onTransformChange }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const { gl } = useThree();

  // Track if currently dragging to debounce updates
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!controlsRef.current || !object) return;

    const controls = controlsRef.current;

    // Handle drag start
    const onDragStart = () => {
      isDraggingRef.current = true;
      gl.domElement.style.cursor = "grabbing";
    };

    // Handle drag end - emit final transform
    const onDragEnd = () => {
      isDraggingRef.current = false;
      gl.domElement.style.cursor = "default";

      if (controls.object) {
        const updates: Partial<SceneObject["transform"]> = {};

        if (mode === "translate") {
          const pos = controls.object.position;
          updates.position = [pos.x, pos.y, pos.z];
        } else if (mode === "rotate") {
          const rot = controls.object.rotation;
          updates.rotation = [rot.x, rot.y, rot.z];
        } else if (mode === "scale") {
          const scale = controls.object.scale;
          updates.scale = [scale.x, scale.y, scale.z];
        }

        onTransformChange(object.id, updates);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controls.addEventListener("dragging-changed", (event: any) => {
      if (event.value) {
        onDragStart();
      } else {
        onDragEnd();
      }
    });

    return () => {
      controls.removeEventListener("dragging-changed", onDragStart);
    };
  }, [object, mode, onTransformChange, gl]);

  if (!object) return null;

  return (
    <DreiTransformControls
      ref={controlsRef}
      mode={mode}
      position={object.transform.position}
      rotation={object.transform.rotation}
      scale={object.transform.scale}
      size={0.8}
      showX={true}
      showY={true}
      showZ={true}
    />
  );
};