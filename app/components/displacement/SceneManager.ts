/**
 * Scene Object Management with Hierarchical Support
 * Implements parent-child relationships, local/world transforms, and tree operations
 */

import * as THREE from "three";

export type GeometryType = "sphere" | "plane" | "box" | "torus" | "cylinder";

export interface DisplacementParams {
  noiseType:
    | "perlin"
    | "simplex"
    | "voronoi"
    | "voronoiF2"
    | "voronoiF2MinusF1"
    | "fbmPerlin"
    | "fbmSimplex"
    | "turbulence"
    | "ridge"
    | "domainWarp"
    | "cellular";
  amplitude: number;
  frequency: number;
  octaves: number;
  lacunarity: number;
  gain: number;
  ridgeOffset: number;
  warpStrength: number;
  uvScale: number;
  animationSpeed: number;
  wireframe: boolean;
  subdivisions: number;
  visualizationMode: "solid" | "height" | "normal" | "wireframe";
  roughness: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  droppedFrames: number;
  totalFrames: number;
  resolution: { width: number; height: number };
  pixelCount: number;
  triangleCount: number;
  drawCalls: number;
  geometryMemory: number;
}

export interface MaterialProperties {
  color: string;
  roughness: number;
  metalness: number;
  opacity: number;
  emissiveIntensity: number;
}

export interface SceneObject {
  id: string;
  name: string;
  type: GeometryType;
  displacement?: DisplacementParams;
  material: MaterialProperties;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  visible: boolean;
  // Hierarchical properties
  parentId: string | null;
  childIds: string[];
  expanded: boolean; // For UI tree view
}

export interface SceneState {
  objects: SceneObject[];
  selectedId: string | null;
}

// Geometry cache for performance
class GeometryCache {
  private cache = new Map<string, THREE.BufferGeometry>();

  getCacheKey(type: GeometryType, subdivisions: number): string {
    return `${type}-${subdivisions}`;
  }

  get(type: GeometryType, subdivisions: number): THREE.BufferGeometry | null {
    const key = this.getCacheKey(type, subdivisions);
    return this.cache.get(key) || null;
  }

  set(
    type: GeometryType,
    subdivisions: number,
    geometry: THREE.BufferGeometry
  ): void {
    const key = this.getCacheKey(type, subdivisions);
    this.cache.set(key, geometry);
  }

  clear(): void {
    this.cache.forEach((geo) => geo.dispose());
    this.cache.clear();
  }
}

export const geometryCache = new GeometryCache();

// Hierarchical utility functions
export function getObjectById(
  objects: SceneObject[],
  id: string
): SceneObject | null {
  return objects.find((obj) => obj.id === id) || null;
}

export function getChildren(
  objects: SceneObject[],
  parentId: string
): SceneObject[] {
  return objects.filter((obj) => obj.parentId === parentId);
}

export function getRootObjects(objects: SceneObject[]): SceneObject[] {
  return objects.filter((obj) => obj.parentId === null);
}

export function getAllDescendants(
  objects: SceneObject[],
  parentId: string
): SceneObject[] {
  const descendants: SceneObject[] = [];
  const children = getChildren(objects, parentId);

  for (const child of children) {
    descendants.push(child);
    descendants.push(...getAllDescendants(objects, child.id));
  }

  return descendants;
}

export function getAncestors(
  objects: SceneObject[],
  objectId: string
): SceneObject[] {
  const ancestors: SceneObject[] = [];
  let current = getObjectById(objects, objectId);

  while (current && current.parentId) {
    const parent = getObjectById(objects, current.parentId);
    if (parent) {
      ancestors.push(parent);
      current = parent;
    } else {
      break;
    }
  }

  return ancestors;
}

export function canReparent(
  objects: SceneObject[],
  childId: string,
  newParentId: string | null
): boolean {
  if (childId === newParentId) return false;
  if (!newParentId) return true;

  // Prevent circular dependencies - check if newParent is a descendant of child
  const descendants = getAllDescendants(objects, childId);
  return !descendants.some((desc) => desc.id === newParentId);
}

export function getDepth(objects: SceneObject[], objectId: string): number {
  const ancestors = getAncestors(objects, objectId);
  return ancestors.length;
}

// Transform calculation utilities
export function getWorldTransform(
  objects: SceneObject[],
  objectId: string
): {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
} {
  const obj = getObjectById(objects, objectId);
  if (!obj) {
    return { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
  }

  if (!obj.parentId) {
    return { ...obj.transform };
  }

  const parentWorld = getWorldTransform(objects, obj.parentId);

  // Calculate world position (simplified - real implementation would use matrices)
  const worldPosition: [number, number, number] = [
    parentWorld.position[0] + obj.transform.position[0],
    parentWorld.position[1] + obj.transform.position[1],
    parentWorld.position[2] + obj.transform.position[2],
  ];

  // Calculate world rotation
  const worldRotation: [number, number, number] = [
    parentWorld.rotation[0] + obj.transform.rotation[0],
    parentWorld.rotation[1] + obj.transform.rotation[1],
    parentWorld.rotation[2] + obj.transform.rotation[2],
  ];

  // Calculate world scale
  const worldScale: [number, number, number] = [
    parentWorld.scale[0] * obj.transform.scale[0],
    parentWorld.scale[1] * obj.transform.scale[1],
    parentWorld.scale[2] * obj.transform.scale[2],
  ];

  return {
    position: worldPosition,
    rotation: worldRotation,
    scale: worldScale,
  };
}

// Generate unique IDs
export function generateObjectId(): string {
  return `object-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create default material properties
export function createDefaultMaterial(): MaterialProperties {
  return {
    color: "#4a9eff",
    roughness: 0.5,
    metalness: 0.0,
    opacity: 1.0,
    emissiveIntensity: 0.0,
  };
}

// Create default displacement params
export function createDefaultDisplacementParams(): DisplacementParams {
  return {
    noiseType: "perlin",
    amplitude: 0.5,
    frequency: 1.0,
    octaves: 4,
    lacunarity: 2.0,
    gain: 0.5,
    ridgeOffset: 1.0,
    warpStrength: 0.5,
    uvScale: 1.0,
    animationSpeed: 0.5,
    wireframe: false,
    subdivisions: 128,
    visualizationMode: "solid",
    roughness: 0.5,
  };
}

// Factory function for creating new scene objects
export function createSceneObject(
  type: GeometryType,
  position: [number, number, number] = [0, 0, 0],
  parentId: string | null = null
): SceneObject {
  return {
    id: generateObjectId(),
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${
      Date.now() % 1000
    }`,
    type,
    material: createDefaultMaterial(),
    transform: {
      position,
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    visible: true,
    parentId,
    childIds: [],
    expanded: true,
  };
}

// Scene reducer actions
export type SceneAction =
  | { type: "ADD_OBJECT"; object: SceneObject }
  | { type: "REMOVE_OBJECT"; id: string }
  | { type: "SELECT_OBJECT"; id: string | null }
  | { type: "UPDATE_OBJECT"; id: string; updates: Partial<SceneObject> }
  | { type: "ADD_DISPLACEMENT"; id: string }
  | { type: "REMOVE_DISPLACEMENT"; id: string }
  | {
      type: "UPDATE_DISPLACEMENT";
      id: string;
      displacement: Partial<DisplacementParams>;
    }
  | {
      type: "UPDATE_TRANSFORM";
      id: string;
      transform: Partial<SceneObject["transform"]>;
    }
  | {
      type: "UPDATE_MATERIAL";
      id: string;
      material: Partial<MaterialProperties>;
    }
  | { type: "DUPLICATE_OBJECT"; id: string }
  | { type: "TOGGLE_VISIBILITY"; id: string }
  | { type: "TOGGLE_EXPANDED"; id: string }
  | { type: "REPARENT_OBJECT"; childId: string; newParentId: string | null }
  | { type: "CLEAR_SCENE" };

// Scene state reducer
export function sceneReducer(
  state: SceneState,
  action: SceneAction
): SceneState {
  switch (action.type) {
    case "ADD_OBJECT": {
      const newObjects = [...state.objects, action.object];

      // Update parent's childIds if object has a parent
      if (action.object.parentId) {
        const parentIndex = newObjects.findIndex(
          (obj) => obj.id === action.object.parentId
        );
        if (parentIndex !== -1) {
          newObjects[parentIndex] = {
            ...newObjects[parentIndex],
            childIds: [...newObjects[parentIndex].childIds, action.object.id],
          };
        }
      }

      return {
        ...state,
        objects: newObjects,
        selectedId: state.selectedId,
      };
    }

    case "REMOVE_OBJECT": {
      const objectToRemove = getObjectById(state.objects, action.id);
      if (!objectToRemove) return state;

      // Get all descendants that need to be removed
      const descendants = getAllDescendants(state.objects, action.id);
      const idsToRemove = new Set([action.id, ...descendants.map((d) => d.id)]);

      // Remove object and descendants
      let newObjects = state.objects.filter((obj) => !idsToRemove.has(obj.id));

      // Update parent's childIds
      if (objectToRemove.parentId) {
        const parentIndex = newObjects.findIndex(
          (obj) => obj.id === objectToRemove.parentId
        );
        if (parentIndex !== -1) {
          newObjects[parentIndex] = {
            ...newObjects[parentIndex],
            childIds: newObjects[parentIndex].childIds.filter(
              (id) => id !== action.id
            ),
          };
        }
      }

      return {
        ...state,
        objects: newObjects,
        selectedId: idsToRemove.has(state.selectedId!)
          ? null
          : state.selectedId,
      };
    }

    case "SELECT_OBJECT":
      return {
        ...state,
        selectedId: action.id,
      };

    case "UPDATE_OBJECT":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.id === action.id ? { ...obj, ...action.updates } : obj
        ),
      };

    case "ADD_DISPLACEMENT":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.id === action.id
            ? { ...obj, displacement: createDefaultDisplacementParams() }
            : obj
        ),
      };

    case "REMOVE_DISPLACEMENT":
      return {
        ...state,
        objects: state.objects.map((obj) => {
          if (obj.id === action.id) {
            const { displacement, ...rest } = obj;
            return rest as SceneObject;
          }
          return obj;
        }),
      };

    case "UPDATE_DISPLACEMENT":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.id === action.id && obj.displacement
            ? {
                ...obj,
                displacement: { ...obj.displacement, ...action.displacement },
              }
            : obj
        ),
      };

    case "UPDATE_TRANSFORM":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.id === action.id
            ? {
                ...obj,
                transform: { ...obj.transform, ...action.transform },
              }
            : obj
        ),
      };

    case "UPDATE_MATERIAL":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.id === action.id
            ? {
                ...obj,
                material: { ...obj.material, ...action.material },
              }
            : obj
        ),
      };

    case "DUPLICATE_OBJECT": {
      const objToDuplicate = state.objects.find((obj) => obj.id === action.id);
      if (!objToDuplicate) return state;

      const duplicated: SceneObject = {
        ...objToDuplicate,
        id: generateObjectId(),
        name: `${objToDuplicate.name} Copy`,
        childIds: [], // Don't duplicate children (can be enhanced later)
        transform: {
          ...objToDuplicate.transform,
          position: [
            objToDuplicate.transform.position[0] + 0.5,
            objToDuplicate.transform.position[1],
            objToDuplicate.transform.position[2],
          ],
        },
      };

      let newObjects = [...state.objects, duplicated];

      // Update parent's childIds if duplicated object has a parent
      if (duplicated.parentId) {
        const parentIndex = newObjects.findIndex(
          (obj) => obj.id === duplicated.parentId
        );
        if (parentIndex !== -1) {
          newObjects[parentIndex] = {
            ...newObjects[parentIndex],
            childIds: [...newObjects[parentIndex].childIds, duplicated.id],
          };
        }
      }

      return {
        ...state,
        objects: newObjects,
        selectedId: state.selectedId,
      };
    }

    case "TOGGLE_VISIBILITY":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.id === action.id ? { ...obj, visible: !obj.visible } : obj
        ),
      };

    case "TOGGLE_EXPANDED":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.id === action.id ? { ...obj, expanded: !obj.expanded } : obj
        ),
      };

    case "REPARENT_OBJECT": {
      if (!canReparent(state.objects, action.childId, action.newParentId)) {
        return state;
      }

      const childObj = getObjectById(state.objects, action.childId);
      if (!childObj) return state;

      let newObjects = [...state.objects];

      // Remove from old parent's childIds
      if (childObj.parentId) {
        const oldParentIndex = newObjects.findIndex(
          (obj) => obj.id === childObj.parentId
        );
        if (oldParentIndex !== -1) {
          newObjects[oldParentIndex] = {
            ...newObjects[oldParentIndex],
            childIds: newObjects[oldParentIndex].childIds.filter(
              (id) => id !== action.childId
            ),
          };
        }
      }

      // Add to new parent's childIds
      if (action.newParentId) {
        const newParentIndex = newObjects.findIndex(
          (obj) => obj.id === action.newParentId
        );
        if (newParentIndex !== -1) {
          newObjects[newParentIndex] = {
            ...newObjects[newParentIndex],
            childIds: [...newObjects[newParentIndex].childIds, action.childId],
            expanded: true, // Auto-expand parent to show new child
          };
        }
      }

      // Update child's parentId
      const childIndex = newObjects.findIndex(
        (obj) => obj.id === action.childId
      );
      if (childIndex !== -1) {
        newObjects[childIndex] = {
          ...newObjects[childIndex],
          parentId: action.newParentId,
        };
      }

      return {
        ...state,
        objects: newObjects,
      };
    }

    case "CLEAR_SCENE":
      return {
        objects: [],
        selectedId: null,
      };

    default:
      return state;
  }
}

// Get selected object from state
export function getSelectedObject(state: SceneState): SceneObject | null {
  if (!state.selectedId) return null;
  return state.objects.find((obj) => obj.id === state.selectedId) || null;
}
